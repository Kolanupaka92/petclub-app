// @ts-check
// Author: Sai Kolanupaka
import { defineConfig, devices } from '@playwright/test';

/**
 * PETclub E2E Test Configuration
 *
 * Test tiers:
 *   npm run test:e2e              — All tests (needs Firebase test numbers + PETCLUB_ADMIN_TOKEN)
 *   npm run test:e2e:security     — No-auth security checks (always green)
 *   npm run test:e2e:landing      — Landing page smoke tests (always green)
 *   npm run test:e2e:auth         — Auth UI tests (no OTP needed for UI group)
 *   PETCLUB_SKIP_AUTH_SETUP=1 npm run test:e2e — Skip auth setup (run UI-only tests)
 *
 * Firebase test numbers (configure in Firebase Console > Auth > Phone > Test numbers):
 *   +91 9999900001 → OTP 123456
 *   +91 9999900002 → OTP 123456
 *   +91 9999900003 → OTP 123456
 *   +91 9999900004 → OTP 123456
 *
 * Rate limit: Firebase throttles test numbers to ~4 OTP/min per number.
 * Wait 60s between test runs if hitting rate limits.
 *
 * Env vars:
 *   PETCLUB_BASE_URL         — App URL (default: https://app.mypetclub.app)
 *   PETCLUB_LANDING_URL      — Landing URL (default: https://www.mypetclub.app)
 *   PETCLUB_API_URL          — API URL (default: https://api.mypetclub.app/api)
 *   PETCLUB_ADMIN_TOKEN      — Admin JWT (required for admin dashboard tests)
 *   PETCLUB_SKIP_AUTH_SETUP  — "1" = skip OTP setup, run only no-auth tests
 *   E2E_HEADED               — "1" = headed mode for debugging
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // serial — shared DB, avoid Firebase rate limits

  use: {
    baseURL: process.env.PETCLUB_BASE_URL || 'https://app.mypetclub.app',
    headless: process.env.E2E_HEADED !== '1',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },

  projects: [
    // ── Desktop: all tests ───────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/auth.setup.js'],
    },

    // ── Mobile: landing page smoke tests only ────────────────────────────────
    // Security policy is backend-enforced and identical across devices.
    // Running auth-dependent security tests on mobile would double OTP consumption
    // without adding coverage value. No-secrets checks are already covered by chromium.
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: ['**/01-landing.spec.js'],
    },
  ],

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
});
