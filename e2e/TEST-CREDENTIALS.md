# PETclub Test Logins

Fixed-OTP test logins work on a **local backend only**. Production and any other
Cloud Run service refuse them in code (`petclub-backend/services/testIdentities.js`),
because this repo is public and a fixed code here would be a public login.

Do not commit OTP values, real phone numbers or account lists to this repo.

## Using them locally

In `petclub-backend/.env`:

```
ALLOW_DEV_TOOLS=true
E2E_FIXED_OTP=<any 6 digits you choose>
E2E_TEST_PHONES=<;-separated E.164 numbers, optional>
E2E_TEST_EMAIL_DOMAIN=mailinator.com   # optional, used by e2e/*.spec.js
```

Any `<name>@e2e.mypetclub.app` address then signs in with that OTP. Accounts with
`role = 'admin'` are always refused.

Point local development at a separate Supabase project, not the production one.

## Testing in production

Sign in with a real email address you control, using normal Email OTP.
