/**
 * PETclub E2E shared helpers
 *
 * Login flow:
 *   1. Navigate to /?signin=1  (skips LandingPage, shows Login component)
 *   2. Login renders "start" step — click "Sign In" button
 *   3. "phone" step appears — enter phone number
 *   4. Click "Send OTP" — Firebase sends OTP (test numbers: fixed 123456)
 *   5. OTP input appears — fill 123456
 *   6. Verify button — app navigates to home / role selection
 *
 * Firebase test phone numbers (only 2 needed — Firebase allows max 10 slots total):
 *   +91 9999900001 → fixed OTP 123456  (pet owner / customer flow)
 *   +91 9999900002 → fixed OTP 123456  (groomer — covers all SP RBAC checks)
 *
 * NOTE: Firebase Phone Auth requires a reCAPTCHA widget even for test numbers.
 * The invisible reCAPTCHA should pass automatically in headless Chrome.
 * If tests timeout on "Send OTP", set E2E_HEADED=1 to debug visually.
 * Rate limit: ~4 OTP/min per number — wait 60s between runs.
 */

const API_BASE    = process.env.PETCLUB_API_URL   || 'https://api.mypetclub.app/api';
const ADMIN_TOKEN = process.env.PETCLUB_ADMIN_TOKEN || '';

/**
 * True when Firebase test phone numbers are expected to work.
 * Set PETCLUB_SKIP_AUTH_SETUP=1 to skip all OTP-dependent tests.
 * Only 2 Firebase slots needed:
 *   +91 9999900001 → 123456  (owner)
 *   +91 9999900002 → 123456  (groomer / all SPs)
 */
export const FIREBASE_TESTS = process.env.PETCLUB_SKIP_AUTH_SETUP !== '1';

/** Firebase test phone numbers always get OTP 123456 */
export const TEST_OTP = '123456';

/**
 * Only 2 Firebase test slots are used.
 * trainer & vet reuse the groomer number — same SP RBAC rules apply to all service providers.
 */
export const USERS = {
  owner:   { phone: '9999900001', cc: '91', otp: TEST_OTP, name: 'E2E Owner',   email: 'e2e.owner@mypetclub.test' },
  groomer: { phone: '9999900002', cc: '91', otp: TEST_OTP, name: 'E2E Groomer', email: 'e2e.groomer@mypetclub.test' },
  trainer: { phone: '9999900002', cc: '91', otp: TEST_OTP, name: 'E2E Trainer', email: 'e2e.trainer@mypetclub.test' },
  vet:     { phone: '9999900002', cc: '91', otp: TEST_OTP, name: 'E2E Vet',     email: 'e2e.vet@mypetclub.test' },
};

/**
 * Fetch OTP via admin API (for non-test-phone numbers).
 * Falls back to TEST_OTP for Firebase test numbers.
 */
export async function fetchOTP(phone, cc = '91') {
  if (!ADMIN_TOKEN) return TEST_OTP;
  try {
    const res = await fetch(
      `${API_BASE}/admin/otp?phone=${encodeURIComponent(phone)}&cc=${cc}`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    if (!res.ok) return TEST_OTP;
    const data = await res.json();
    return data.otp || TEST_OTP;
  } catch {
    return TEST_OTP;
  }
}

/**
 * Navigate to the login page (skips LandingPage).
 */
export async function gotoLogin(page) {
  const base = process.env.PETCLUB_BASE_URL || 'https://app.mypetclub.app';
  await page.goto(`${base}/?signin=1`);
  await page.waitForLoadState('networkidle');
}

/**
 * Complete the full phone OTP login flow.
 * Steps: start → phone → otp → (profile or home)
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ phone: string, cc: string, otp: string }} user
 */
export async function loginWithPhone(page, user) {
  await gotoLogin(page);

  // ── Step: "start" — click "Sign In" ──────────────────────────────────────
  // Login component renders with step="start", showing two options:
  // a "Sign In" button and a list of role cards for sign-up.
  const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Sign in")').first();
  await signInBtn.waitFor({ state: 'visible', timeout: 15000 });
  await signInBtn.click();

  // ── Step: "phone" — fill phone number ───────────────────────────────────
  // The phone input is type="tel" inputMode="numeric"
  const phoneInput = page.locator('input[type="tel"]').first();
  await phoneInput.waitFor({ state: 'visible', timeout: 10000 });
  await phoneInput.fill(user.phone);

  // ── Click "Send OTP" ─────────────────────────────────────────────────────
  // Button text is dynamic: "Sending…" while loading, else "Send OTP" or "Continue"
  const sendBtn = page.locator('button:has-text("Send OTP"), button:has-text("Continue"), button:has-text("Get OTP")').first();
  await sendBtn.click();

  // ── Step: "otp" — fill OTP ───────────────────────────────────────────────
  // OTP is rendered as 6 individual single-char boxes (maxLength=1 each).
  // NOTE: clipboard paste via JS ClipboardEvent is "non-trusted" — browsers
  // return empty clipboardData, so React's onPaste handler gets nothing.
  // Strategy: fill each box individually via Playwright's fill(), which fires
  // native input events that React's onChange handler picks up.
  // The component auto-verifies when all 6 digits are entered (no Verify click needed).
  const firstOtpBox = page.locator('input[maxlength="1"][inputmode="numeric"]').first();
  await firstOtpBox.waitFor({ state: 'visible', timeout: 20000 });

  const otp = await fetchOTP(user.phone, user.cc);

  // Fill each digit box — React's handleBox auto-advances focus and auto-submits at digit 6
  const boxes = page.locator('input[maxlength="1"][inputmode="numeric"]');
  for (let i = 0; i < otp.length; i++) {
    await boxes.nth(i).fill(otp[i]);
  }

  // Allow auto-verify to fire and navigation to complete
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/**
 * Select role on the profile/role-selection step if shown.
 */
export async function selectRoleIfShown(page, role = 'customer') {
  const roleBtn = page.locator(
    `button[data-role="${role}"], button:has-text("Pet Owner"), label:has-text("${role}")`
  ).first();
  if (await roleBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await roleBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Wait for the app to show toast text matching the given string.
 */
export async function waitForToast(page, text, timeout = 8000) {
  await page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    text,
    { timeout }
  );
}
