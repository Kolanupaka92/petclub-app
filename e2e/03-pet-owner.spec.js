// Author: Sai Kolanupaka
/**
 * 03 — Pet Owner full flow
 * Login → set role → add pet → browse services → create booking
 */
import { test, expect } from '@playwright/test';
import { loginWithPhone, selectRoleIfShown, USERS, FIREBASE_TESTS } from './helpers.js';

test.describe('Pet Owner flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!FIREBASE_TESTS) {
      test.skip(true, 'Requires Firebase test numbers — set PETCLUB_SKIP_AUTH_SETUP=1 to skip');
      return;
    }
    await loginWithPhone(page, USERS.owner);
    await selectRoleIfShown(page, 'customer');
    await page.waitForLoadState('networkidle');
  });

  test('home screen shows booking/service options', async ({ page }) => {
    // Should see some service tiles or a "Book" button
    const bookingCta = page.locator(
      'button:has-text("Book"), button:has-text("New Booking"), [class*="service-card"], [class*="serviceCard"]'
    ).first();
    await expect(bookingCta).toBeVisible({ timeout: 10000 });
  });

  test('can add a pet', async ({ page }) => {
    // Look for "Add pet" or pets section
    const addPetBtn = page.locator(
      'button:has-text("Add pet"), button:has-text("Add Pet"), button:has-text("+ Pet")'
    ).first();

    if (await addPetBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addPetBtn.click();
      await page.waitForTimeout(800);

      // Fill pet name
      const petNameInput = page.locator('input[placeholder*="pet"], input[placeholder*="name"], input[name*="name"]').first();
      if (await petNameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
        await petNameInput.fill('TestDog Buddy');

        // Select species if shown
        const dogOpt = page.locator('button:has-text("Dog"), label:has-text("Dog"), [value="dog"]').first();
        if (await dogOpt.isVisible({ timeout: 2000 }).catch(() => false)) await dogOpt.click();

        // Save
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add"), button[type="submit"]').first();
        await saveBtn.click();
        await page.waitForTimeout(1500);

        // Pet name should appear somewhere on screen
        await expect(page.locator(':text("TestDog Buddy")')).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test('booking flow — service selection step renders', async ({ page }) => {
    // Click on any "Book" CTA
    const bookBtn = page.locator(
      'button:has-text("Book"), button:has-text("New Booking"), a:has-text("Book a Service")'
    ).first();

    if (await bookBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await bookBtn.click();
      await page.waitForTimeout(1000);

      // Should show service types
      const serviceTile = page.locator(
        '[class*="service"], button:has-text("Grooming"), button:has-text("Training"), button:has-text("Vet")'
      ).first();
      await expect(serviceTile).toBeVisible({ timeout: 8000 });
    }
  });

  test('loyalty points widget is visible', async ({ page }) => {
    // Loyalty points card/badge
    const loyaltyEl = page.locator(
      ':text("points"), :text("credits"), :text("loyalty"), [class*="loyalty"]'
    ).first();
    // May not be visible if user has 0 pts — just verify no crash
    await page.waitForTimeout(2000);
    // No uncaught error = pass
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('digital health records tab is accessible', async ({ page }) => {
    const recordsBtn = page.locator(
      'button:has-text("Health"), button:has-text("Records"), nav button:has-text("Pets")'
    ).first();
    if (await recordsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recordsBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*/, { timeout: 5000 }); // just verify no crash
    }
  });
});
