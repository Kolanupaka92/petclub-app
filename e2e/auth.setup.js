/**
 * auth.setup.js — Run ONCE before all tests.
 * Logs in with each test user, saves the auth state (localStorage token)
 * to disk so subsequent tests can reuse it without triggering OTP.
 *
 * Usage: playwright.config.js projects reference this as a dependency.
 */
import { test as setup, expect } from '@playwright/test';
import { gotoLogin, USERS } from './helpers.js';
import path from 'path';

const OTP_BOX = 'input[maxlength="1"][inputmode="numeric"]';

/** Perform one fresh OTP login and save localStorage state. */
async function loginAndSave(page, user, stateFile) {
  await gotoLogin(page);

  // Start step — click Sign In
  await page.locator('button:has-text("Sign In"), button:has-text("Sign in")').first().click();

  // Phone step — fill number, wait for button to be ready, send OTP
  const phoneInput = page.locator('input[type="tel"]').first();
  await phoneInput.waitFor({ state: 'visible', timeout: 15000 });
  await phoneInput.fill(user.phone);

  // Wait until Firebase reCAPTCHA is ready (button shows "Send OTP →" not "Initializing…")
  const sendBtn = page.locator('button:has-text("Send OTP")');
  await sendBtn.waitFor({ state: 'visible', timeout: 30000 }); // allow up to 30s for Firebase init
  await sendBtn.click();

  // OTP step — wait for the 6-box grid then paste
  const firstBox = page.locator(OTP_BOX).first();
  await firstBox.waitFor({ state: 'visible', timeout: 25000 });
  await firstBox.click();

  // Paste OTP via clipboard event (the container div has onPaste handler)
  await page.evaluate((code) => {
    const dt = new DataTransfer();
    dt.setData('text', code);
    const el = document.querySelector('input[maxlength="1"][inputmode="numeric"]');
    if (el) el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, user.otp);

  await page.waitForTimeout(800);

  // Click Verify
  await page.locator('button:has-text("Verify"), button:has-text("Continue →")').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Verify we're no longer on OTP step
  const stillOnOtp = await page.locator(OTP_BOX).first().isVisible({ timeout: 2000 }).catch(() => false);
  if (stillOnOtp) throw new Error(`OTP verification failed for ${user.phone}`);

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: stateFile });
  console.log(`✅ Auth state saved → ${stateFile}`);
}

// Only run setup if test phone numbers are expected to work
// Skip if PETCLUB_SKIP_AUTH_SETUP=1 to allow running without Firebase test numbers

setup('save owner auth state', async ({ page }) => {
  if (process.env.PETCLUB_SKIP_AUTH_SETUP === '1') {
    console.log('⏭ Skipping auth setup (PETCLUB_SKIP_AUTH_SETUP=1)');
    return;
  }
  await loginAndSave(page, USERS.owner, '.auth/owner.json');
});

setup('save groomer auth state', async ({ page }) => {
  if (process.env.PETCLUB_SKIP_AUTH_SETUP === '1') return;
  // Add a delay to avoid Firebase rate-limiting consecutive test numbers
  await page.waitForTimeout(3000);
  await loginAndSave(page, USERS.groomer, '.auth/groomer.json');
});
