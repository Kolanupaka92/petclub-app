# PETclub App (Frontend)

> React 19 · Vite · Tailwind CSS · Firebase · Deployed on Vercel
> Lives at: **https://app.mypetclub.app**

---

## What This Is

Single-page PWA for the PETclub platform. Serves three distinct user types from one codebase:
- **Customers** (pet owners) — book grooming/training/vet services, manage pets, track live location
- **Professionals** (groomers, trainers, vets, walkers) — receive bookings, accept/reject, stream GPS
- **Admins** — verify professionals, manage users, view revenue reports

The app detects the user's role from their JWT on login and renders the appropriate UI.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- The backend running locally at `http://localhost:5000` — see [`petclub-backend/README.md`](../petclub-backend/README.md)

```bash
cd petclub-app
npm install

# Create .env.local with local API URL:
echo 'VITE_API_URL=http://localhost:5000/api' >> .env.local

npm run dev     # starts at http://localhost:5173
```

The app will **hard-fail on startup if `VITE_API_URL` is not set** (intentional — prevents accidentally hitting production from local).

---

## Environment Variables

All must be prefixed with `VITE_` to be accessible in the browser bundle.

### Required

| Variable | What it is |
|----------|-----------|
| `VITE_API_URL` | Backend API URL. Local: `http://localhost:5000/api`, Prod: `https://api.mypetclub.app/api` |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | FCM web push VAPID key |

### Optional

| Variable | Default | What it is |
|----------|---------|-----------|
| `VITE_MAPBOX_TOKEN` | — | Mapbox GL token for live tracking map (USA users) |
| `VITE_MAPPLS_KEY` | — | MapmyIndia token for tracking map (India +91 users) |
| `VITE_WHATSAPP_NUMBER` | `16097215754` | WhatsApp support number |
| `VITE_PARTNER_CONTACT_EMAIL` | `partners@mypetclub.app` | Email shown in partner agreement panel |

> For local dev, ask the lead for a `.env.local` file. Do **not** commit `.env.local` — it is gitignored.
> For production, all vars are set in the Vercel project dashboard → Settings → Environment Variables.

---

## NPM Scripts

```bash
npm run dev      # Vite dev server with HMR at localhost:5173
npm run build    # Production build (output: dist/)
npm run preview  # Preview the production build locally
npm run lint     # ESLint check
```

---

## Deploy

Deployment is **automatic on push to `main`** via Vercel:

```bash
git push origin main
# → Vercel CI builds and deploys in ~2 minutes
```

Manual deploy (emergency):
```bash
npx vercel --prod --yes
```

---

## Project Structure

```
petclub-app/
├── src/
│   ├── PetclubApp.jsx      # Customer app — home, bookings, pets, profile
│   ├── Login.jsx            # Auth UI — phone OTP, email OTP, role selection
│   ├── LandingPage.jsx      # Marketing landing page (mypetclub.app)
│   ├── Admin.jsx            # Admin dashboard — users, verifications, revenue
│   ├── ProApp.jsx           # Professional app — incoming bookings, GPS streaming
│   ├── api.js               # All fetch calls to the backend API
│   ├── firebase.js          # Firebase Phone Auth setup + reCAPTCHA helpers
│   └── components/
│       ├── TrackingMapMapbox.jsx   # Live GPS tracking (Mapbox — USA users)
│       ├── TrackingMapMappls.jsx   # Live GPS tracking (Mappls — India users)
│       ├── AddressPicker.jsx       # Address search + GPS picker
│       └── ...
├── public/
│   ├── terms.html           # Terms of Service (including loyalty TOS — Section 5)
│   └── privacy.html         # Privacy Policy
├── e2e/                     # Playwright end-to-end tests
│   ├── helpers.js           # Shared login helpers (phone OTP + email OTP via Mailinator)
│   └── *.spec.js            # Test suites by feature area
├── docs/
│   └── ARCHITECTURE.md      # Frontend component map and auth flow
├── playwright.config.js     # E2E test configuration
└── vite.config.js           # Vite build config
```

---

## Key Architecture Decisions

### Role-Based Rendering (not routing)
The app uses a `role` check on login to render the correct top-level component:

| Role | Component | URL |
|------|-----------|-----|
| `customer` | `PetclubApp.jsx` | `app.mypetclub.app` |
| `professional` | `ProApp.jsx` | `app.mypetclub.app` |
| `admin` | `Admin.jsx` | `app.mypetclub.app` |
| New user / no role | `Login.jsx` (role selection step) | `app.mypetclub.app/?signin=1` |

### Internal Navigation (no React Router)
Each top-level component uses a `view` state string for internal navigation (e.g. `home`, `bookings`, `petDetail`). This is intentional for this stage — avoids React Router complexity. Discuss before refactoring.

### API Layer
All backend calls go through `src/api.js`. The JWT (`petclub_token`) is stored in `localStorage`. A 401 response fires a `petclub:unauthorized` CustomEvent → auto-logout.

> ⚠️ **Known security debt**: JWT should be in an `httpOnly` cookie to prevent XSS theft. Deferred until after Razorpay integration.

### Maps — Dual Provider
Country code from phone number determines which map SDK to load:
- `+91` (India) → `TrackingMapMappls` (Mappls / MapmyIndia)
- `+1` (USA) → `TrackingMapMapbox` (Mapbox GL)

### Firebase Phone Auth
Firebase Phone Auth requires a reCAPTCHA widget. It's invisible and auto-passes in headless Chrome. If "Send OTP" is stuck at "Initializing…", the Firebase SDK hasn't loaded — usually a network or CORS issue in local dev.

---

## Running E2E Tests

```bash
# Fast — skip Firebase-dependent tests (always green)
PETCLUB_SKIP_AUTH_SETUP=1 npx playwright test

# Full suite against local stack
PETCLUB_BASE_URL=http://localhost:5173 npx playwright test

# Security tests only
npx playwright test e2e/07-security.spec.js

# Auth UI tests only
npx playwright test e2e/02-auth.spec.js --reporter=list
```

See `e2e/helpers.js` for how login helpers work and how Mailinator OTP reading is implemented.

### Firebase Test Phone Numbers
Two numbers are configured in Firebase Console → Auth → Phone → Test numbers:
- `+91 9999900001` → OTP: `123456` (customer flow)
- `+91 9999900002` → OTP: `123456` (professional flow)

These consume Firebase's SMS quota (~300 free real SMS/month). Prefer email OTP tests (via Mailinator) to save quota — no rate limits, no Firebase dependency.
