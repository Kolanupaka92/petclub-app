# PETclub Test Credentials

Default test identities for manual QA and E2E testing. These work **in production**
(app.mypetclub.app) — no real email or SMS is ever sent for them.

## Fixed OTP for every test identity: `123456`

## Default accounts (one per role)

| Role                   | Email (Email OTP tab)          | Phone (Phone SMS tab) | OTP      |
|------------------------|--------------------------------|-----------------------|----------|
| Customer / Pet Owner   | `customer@e2e.mypetclub.app`   | `+1 999 555 0101`     | `123456` |
| Groomer                | `groomer@e2e.mypetclub.app`    | `+1 999 555 0102`     | `123456` |
| Trainer                | `trainer@e2e.mypetclub.app`    | `+1 999 555 0103`     | `123456` |
| Vet                    | `vet@e2e.mypetclub.app`        | `+1 999 555 0104`     | `123456` |
| Walker                 | `walker@e2e.mypetclub.app`     | `+1 999 555 0105`     | `123456` |
| Boarding               | `boarding@e2e.mypetclub.app`   | `+1 999 555 0106`     | `123456` |
| **Admin**              | *(deliberately none — see below)* | —                  | —        |

Notes:
- The customer account has one pet seeded (`E2E Buddy`, Labrador).
- All professional accounts are **approved** but start **Offline** — toggle
  "Online — Accepting Bookings" in the pro dashboard before testing dispatch,
  and toggle it back Off when done so real customer bookings never route to them.
- **Email OTP tab is the most reliable path** (backend-only, no Firebase involved).
  Phone numbers work via the backend/Twilio fallback path; Firebase will error
  first on these fake numbers (999 is an invalid area code), then the app falls
  back automatically — expect a couple of extra seconds.

## "Any random identity" testing

Any address ending in **`@e2e.mypetclub.app`** works with OTP `123456` — e.g.
`whatever-you-like@e2e.mypetclub.app` creates a brand-new customer signup flow.
Use this to test onboarding repeatedly without inbox access. (The subdomain has
no mailbox and is owned by PETclub, so these addresses can never receive real mail.)

Arbitrary *phone* numbers are intentionally **not** bypassed in production — only
the exact whitelisted `+1999…` numbers above (real numbers must receive real SMS).

## Why there is no admin test login

The fixed OTP is publicly visible in this repo. An admin account guarded by it
would hand full admin access to anyone who reads this file. The backend
explicitly refuses the fixed OTP for any account with `role = 'admin'` — log in
to admin with your real email via normal Email OTP.

## How it works / how to turn it off

- Backend: `send-email-otp` and `send-phone-otp` in `petclub-backend/server.js`
  short-circuit for these identities when `E2E_FIXED_OTP` is set (Cloud Run env
  var, wired in `cloudbuild.yaml`). Test identities also skip the OTP rate limiter.
- **Kill switch:** remove `E2E_FIXED_OTP` from `cloudbuild.yaml`'s
  `--update-env-vars` (or `gcloud run services update petclub-backend
  --region us-west1 --remove-env-vars E2E_FIXED_OTP`) and every test login stops
  working at once. Do this before public launch.

## CI / Playwright suite (unchanged)

- `e2e/*.spec.js` use Mailinator inboxes via `E2E_TEST_EMAIL_DOMAIN`
  (non-production only) and the two Firebase console test numbers
  (`+91 9999900001/2`, OTP `123456`).
- `GET /api/admin/otp` (dev-only) returns the **hashed** OTP since hashing was
  introduced — it cannot be used to read a live code. `helpers.js#fetchOTP`
  falls back to the fixed OTP, so tests are unaffected.
