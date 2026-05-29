# PETclub Frontend — Architecture

> React 19 · Vite · Tailwind CSS · Firebase SDK · Supabase (via backend)

---

## Component Map

```
src/
│
├── App entry (main.jsx)
│   └── Reads JWT from localStorage → renders one of:
│
├── Login.jsx                 ← Everyone starts here
│   ├── step: "start"         → Sign In button + role cards (sign-up)
│   ├── step: "phone"         → Phone number input + SMS/Email OTP toggle
│   └── step: "otp"           → 6-box OTP entry + Verify button
│
├── PetclubApp.jsx            ← role: customer
│   ├── view: "home"          → Stats row, service grid, recent bookings, pet carousel
│   ├── view: "bookings"      → Booking list (All/Active/Completed tabs), track live, rate
│   ├── view: "pets"          → Pet list with search
│   ├── view: "profile"       → User profile, loyalty dashboard, referral code
│   └── view: "petDetail"     → Health passport, records by type (grooming/training/food/vet)
│       └── Modals: addPet, editPet, addRecord, editProfile, bookService, reminders
│
├── ProApp.jsx                ← role: professional
│   ├── Incoming bookings     → Offered jobs with accept/reject + countdown timer
│   ├── Active booking        → GPS streaming, on-my-way button
│   ├── Earnings              → Payout summary
│   └── Profile               → Availability toggle, profile edit
│
├── Admin.jsx                 ← role: admin
│   ├── Overview              → KPI cards (users, bookings, revenue)
│   ├── Verify tab            → Pending professional applications
│   ├── Users tab             → Search, suspend, delete users
│   ├── Bookings tab          → All bookings with filters
│   ├── Reports tab           → Revenue report by professional
│   ├── Loyalty tab           → Award points, partner report
│   └── DB Health tab         → Audit + cleanup tools
│
└── components/
    ├── TrackingMapMapbox.jsx  ← Live GPS map (Mapbox — USA +1 users)
    ├── TrackingMapMappls.jsx  ← Live GPS map (Mappls — India +91 users)
    └── AddressPicker.jsx      ← Address search with GPS fallback
```

---

## Authentication Flow

```
User visits app.mypetclub.app
        │
        ▼
Check localStorage for 'petclub_token'
        │
   ┌────┴────┐
   │         │
 Found    Not found
   │         │
   ▼         ▼
Decode JWT  → Login.jsx
Check role
   │
   ├── customer    → PetclubApp.jsx
   ├── professional → ProApp.jsx
   ├── admin       → Admin.jsx
   └── pending_role → Login.jsx (role selection)
```

### Phone OTP Flow (primary)
```
Login.jsx (step: phone)
  │  User enters phone number
  ▼
api.sendPhoneOTP(phone)           → POST /auth/send-phone-otp
  │  Firebase sends SMS (India)
  │  Twilio sends SMS (USA)
  ▼
Login.jsx (step: otp)
  │  User fills 6-box OTP
  │  handleBox() auto-verifies at digit 6
  ▼
api.verifyPhoneOTP(phone, otp)    → POST /auth/verify-phone-otp
  │  Returns { token, user, isNew }
  ▼
saveToken(token)                  → localStorage.setItem('petclub_token', token)
  │
  └── isNew → role selection step
  └── returning user → load role-based component
```

### Email OTP Flow (alternative)
```
Login.jsx: user clicks "📧 Email OTP" toggle
  │
  ▼
api.sendEmailOTP(email)           → POST /auth/send-email-otp
  │  Backend sends email via Zoho SMTP
  ▼
Login.jsx (step: otp) — same 6-box UI
  ▼
api.verifyEmailOTP(email, otp)    → POST /auth/verify-email-otp
  │  Returns { token, user, isNew }
  ▼
saveToken(token) → ...same as phone flow
```

---

## Booking Flow (Customer Side)

```
PetclubApp.jsx (view: home)
  │  User taps service card (Grooming, Training, etc.)
  ▼
Modal: bookService (step 1: service selection)
  │  Catalog loaded from GET /api/services/catalog
  ▼
bookService (step 2: package + pet + date + time slot + address)
  ▼
bookService (step 3: confirm + clickwrap terms acceptance)
  │
  ▼
api.createBooking(bookingData)    → POST /api/bookings
  │  Backend: dispatch algorithm fires
  │  Pro receives: email + FCM push + WhatsApp notification
  ▼
Booking created with status: "searching"
  │
  │  App polls every 5s while status is searching/offered
  ▼
Status updates: searching → offered → confirmed → on_the_way → completed
  │
  └── completed → "Rate this session" button appears
                  api.rateBooking() → POST /api/bookings/:id/rate
                  → +50 loyalty points awarded
```

---

## Real-Time Tracking

```
Customer: booking status = "on_the_way"
  │
  ▼
TrackingMap component renders (Mappls for +91, Mapbox for +1)
  │
  ├── Polls GET /api/bookings/:id/tracking every 5s
  │   Returns: { lat, lng, status, distance_km, eta_minutes }
  │
  └── Shows:
      ├── Pro's current position (animated pulsing dot)
      ├── Customer's home pin (🏠)
      ├── Route line between them
      ├── Distance chip (haversine calculation)
      └── ETA pill (from Mapbox/Mappls directions API)
```

---

## State Management

No Redux or Zustand. State is managed with React `useState` at the component level:

| State | Where | What |
|-------|-------|------|
| `view` | PetclubApp, ProApp, Admin | Current screen |
| `user` | PetclubApp | Logged-in user profile |
| `bookings` | PetclubApp | List of customer bookings |
| `pets` | PetclubApp | List of pets |
| `catalog` | PetclubApp | Live service pricing |
| `loyalty` | PetclubApp | Points balance + history |

---

## API Layer (`src/api.js`)

All backend calls go through a single `req()` helper:
- Automatically attaches `Authorization: Bearer <token>` header
- On 401 → fires `petclub:unauthorized` CustomEvent → app auto-logs out
- On 405 → unregisters stale service workers and retries once
- Base URL from `import.meta.env.VITE_API_URL` (hard-fails in dev if unset)

---

## Firebase (`src/firebase.js`)

Handles Firebase Phone Auth:
- `initPhoneAuth()` — creates invisible reCAPTCHA verifier
- `sendPhoneOtp(e164)` — calls `signInWithPhoneNumber()`
- `verifyPhoneOtp(otp)` — calls `confirmationResult.confirm(otp)` → gets Firebase ID token
- `clearPhoneAuth()` — destroys reCAPTCHA DOM element (replaces it entirely — wiping innerHTML does NOT clear Google's internal registry)

Firebase ID token is then sent to `POST /api/auth/firebase-verify` which issues a PETclub JWT.

---

## Currency / Region Handling

The app infers region from phone number prefix:
- Phone starts with `+91` → India → `₹` symbol, Mappls maps, INR pricing
- Phone starts with `+1` → USA → `$` symbol, Mapbox maps, USD pricing

This is frontend-only cosmetic logic. Actual pricing is stored in the DB in INR/USD separately.

---

## Security Notes

1. **No `dangerouslySetInnerHTML`** — All user-supplied data is rendered via React (escaped by default) or `textContent` in DOM API code.
2. **Map markers use DOM API** — `TrackingMapMapbox.jsx` and `TrackingMapMappls.jsx` use `createElement` + `textContent`, never `innerHTML` with variable data.
3. **JWT in localStorage** — Known debt. Must move to `httpOnly` cookie post-Razorpay to prevent XSS theft. See `petclub-backend/docs/DEVELOPER.md` for full context.
4. **No secrets in source** — All Firebase keys are public-safe (they're scoped by Firebase Security Rules). Mapbox token is public-safe (domain-restricted in Mapbox console). The Razorpay key in the frontend is the public key only (starts `rzp_`).
