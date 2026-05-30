/**
 * PETclub E2E shared helpers
 *
 * Two login strategies:
 *
 * A) Phone OTP via Firebase (loginWithPhone)
 *    - Uses Firebase test numbers with fixed OTP 123456
 *    - Subject to Firebase rate limits (~2 OTP/min per number)
 *    - Only 2 slots: +91 9999900001 (owner) · +91 9999900002 (groomer)
 *
 * B) Email OTP via Mailinator (loginWithEmail) ← preferred for tests
 *    - Backend sends real email to @mailinator.com public inbox
 *    - NO Firebase / SMS involved → no rate limits
 *    - OTP fetched from Mailinator public web UI by a second Playwright page
 *    - Use EMAIL_USERS map for test identities
 *
 * Firebase test numbers (fallback / UI-only tests):
 *   +91 9999900001 → fixed OTP 123456  (owner)
 *   +91 9999900002 → fixed OTP 123456  (groomer)
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
 * Mailinator test identities for email OTP login.
 * These are PUBLIC inboxes — anyone can read them on mailinator.com.
 * OTPs expire in ~10 min so there's no practical security concern.
 * No Firebase / SMS / rate-limit issues with this approach.
 */
/**
 * Unique run ID — appended to every Mailinator inbox name so each test run
 * gets fresh addresses that have never had an OTP sent to them.
 * This sidesteps the backend's per-email OTP resend cooldown completely.
 * Generated once at module-load time, stable for the entire run.
 */
const RUN_ID = Date.now().toString(36); // e.g. "lp5qz8a"

export const EMAIL_USERS = {
  owner:   { email: `petclub-e2e-owner-${RUN_ID}@mailinator.com`,    name: 'E2E Owner' },
  groomer: { email: `petclub-e2e-groomer-${RUN_ID}@mailinator.com`,  name: 'E2E Groomer' },
  // Separate slots for data-isolation test (uses same run's ID — different from above)
  owner2:   { email: `petclub-e2e-owner2-${RUN_ID}@mailinator.com`,  name: 'E2E Owner 2' },
  groomer2: { email: `petclub-e2e-groomer2-${RUN_ID}@mailinator.com`,name: 'E2E Groomer 2' },
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

/**
 * Fetch the 6-digit OTP from a Mailinator public inbox.
 *
 * Key observations from debugging:
 * - PETclub puts the OTP in the email SUBJECT: "🔑 Your PETclub Verification Code: 123456"
 * - No need to open the email or read an iframe — OTP is visible in the inbox row
 * - Email delivery to Mailinator typically takes 60–120s (not instant)
 *
 * Strategy: poll the inbox every 5s until the OTP row appears (up to 90s).
 *
 * @param {import('@playwright/test').Page} page - Current login page (for browser context)
 * @param {string} inbox - Inbox name without domain, e.g. "petclub-e2e-owner"
 * @param {number} timeoutMs - Max wait time (default 90s)
 * @returns {Promise<string|null>} 6-digit OTP, or null if not found in time
 */
export async function fetchMailinatorOTP(page, inbox, timeoutMs = 90000) {
  const mailinatorPage = await page.context().newPage();
  const deadline = Date.now() + timeoutMs;

  try {
    while (Date.now() < deadline) {
      await mailinatorPage.goto(
        `https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`,
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      );
      // Give Angular a moment to render the inbox rows
      await mailinatorPage.waitForTimeout(1500);

      // Each email row has class="ng-scope" (AngularJS repeater).
      // The OTP is in the subject column — no need to open the email.
      const emailRow = mailinatorPage.locator('tr.ng-scope').first();
      if (await emailRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        const rowText = await emailRow.textContent().catch(() => '');
        const match = rowText.match(/\b(\d{6})\b/);
        if (match) return match[1];
      }

      // Not arrived yet — wait before retrying
      await mailinatorPage.waitForTimeout(5000);
    }
  } finally {
    await mailinatorPage.close().catch(() => {});
  }

  return null;
}

/**
 * Complete the full Email OTP login flow using a Mailinator test address.
 * Unlike loginWithPhone(), this uses the backend email OTP route — NO Firebase,
 * NO SMS, NO rate limits.
 *
 * Steps: start → click "Sign In" → switch to "Email OTP" → fill address
 *        → Send OTP → fetch code from Mailinator → fill boxes → auto-verify
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ email: string }} emailUser - Use EMAIL_USERS.owner / EMAIL_USERS.groomer
 */
export async function loginWithEmail(page, emailUser) {
  await gotoLogin(page);

  // ── "start" step — click "Sign In" ────────────────────────────────────────
  const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Sign in")').first();
  await signInBtn.waitFor({ state: 'visible', timeout: 15000 });
  await signInBtn.click();

  // ── Switch to Email OTP ────────────────────────────────────────────────────
  const emailToggle = page.locator('button:has-text("Email OTP")').first();
  await emailToggle.waitFor({ state: 'visible', timeout: 10000 });
  await emailToggle.click();

  // ── Fill email address ─────────────────────────────────────────────────────
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(emailUser.email);

  // ── Click "Send OTP" (with one automatic retry on IP rate-limit) ────────────
  // The backend enforces an IP-based OTP rate limit (~1 per 60s per IP).
  // When hit, the form shows an error and no OTP boxes appear. We wait 75s
  // and retry once rather than failing the test immediately — this handles
  // consecutive test runs without requiring manual cooldown between them.
  const sendBtn = page.locator('button:has-text("Send OTP"), button:has-text("Continue")').first();
  await sendBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sendBtn.click();

  const firstOtpBox = page.locator('input[maxlength="1"][inputmode="numeric"]').first();
  let otpBoxVisible = await firstOtpBox
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);

  if (!otpBoxVisible) {
    const errText = await page.locator('[class*="red"], [class*="error"], .text-red-500').first()
      .textContent({ timeout: 2000 }).catch(() => '');
    if (errText.includes('Too many OTP') || errText.includes('wait')) {
      // IP rate-limited — wait 75s for the window to reset, then retry once
      console.log(`[loginWithEmail] Rate limited — waiting 75s before retry…`);
      await page.waitForTimeout(75000);
      const retryBtn = page.locator('button:has-text("Send OTP"), button:has-text("Continue")').first();
      if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) await retryBtn.click();
      otpBoxVisible = await firstOtpBox
        .waitFor({ state: 'visible', timeout: 20000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!otpBoxVisible) {
      const finalErr = await page.locator('[class*="red"], [class*="error"], .text-red-500').first()
        .textContent({ timeout: 2000 }).catch(() => 'OTP boxes did not appear');
      throw new Error(`loginWithEmail: OTP step not reached — ${finalErr}`);
    }
  }

  // ── Fetch OTP from Mailinator ─────────────────────────────────────────────
  const inbox = emailUser.email.split('@')[0]; // e.g. "petclub-e2e-owner-abc123"
  const otp = await fetchMailinatorOTP(page, inbox);
  if (!otp) throw new Error(`Mailinator: no OTP found in inbox "${inbox}" within 90s`);

  // ── Fill digits — React auto-verifies when all 6 are entered ─────────────
  const boxes = page.locator('input[maxlength="1"][inputmode="numeric"]');
  for (let i = 0; i < otp.length; i++) {
    await boxes.nth(i).fill(otp[i]);
  }

  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}
