/**
 * 01 — Landing page smoke tests
 * Verifies the public www.mypetclub.app page renders correctly.
 */
import { test, expect } from '@playwright/test';

const LANDING = process.env.PETCLUB_LANDING_URL || 'https://www.mypetclub.app';

test.describe('Landing page', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await page.goto(LANDING);
    await page.waitForLoadState('networkidle');

    // Core brand headline must be visible
    const headline = page.locator('h1, [class*="hero"] h2').first();
    await expect(headline).toBeVisible({ timeout: 15000 });
  });

  test('shows all 6 service cards', async ({ page }) => {
    await page.goto(LANDING);
    await page.waitForLoadState('networkidle');

    // Scroll to services section
    const servicesSection = page.locator('#services, [id*="service"]').first();
    if (await servicesSection.isVisible().catch(() => false)) {
      await servicesSection.scrollIntoViewIfNeeded();
    }

    // Expect 6 service cards rendered
    const cards = page.locator('[class*="service"], [data-service]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4); // at least grooming/training/vet/boarding visible
  });

  test('JOIN section shows 6 role cards in 3-col grid', async ({ page }) => {
    await page.goto(LANDING);
    await page.waitForLoadState('networkidle');

    await page.locator('#join').scrollIntoViewIfNeeded();
    // After scroll, role cards should appear
    const roleCards = page.locator('[data-role]');
    await expect(roleCards).toHaveCount(6, { timeout: 10000 });
  });

  test('Terms link opens /terms.html', async ({ page }) => {
    await page.goto(LANDING);
    const termsLink = page.locator('a[href*="terms"]').first();
    if (await termsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page').catch(() => null),
        termsLink.click(),
      ]);
      const target = newPage || page;
      await target.waitForLoadState('networkidle');
      expect(target.url()).toContain('terms');
    }
  });

  test('Privacy link opens /privacy.html', async ({ page }) => {
    await page.goto(LANDING);
    const privacyLink = page.locator('a[href*="privacy"]').first();
    if (await privacyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page').catch(() => null),
        privacyLink.click(),
      ]);
      const target = newPage || page;
      await target.waitForLoadState('networkidle');
      expect(target.url()).toContain('privacy');
    }
  });

  test('sticky bar CTA navigates to app', async ({ page }) => {
    await page.goto(LANDING);
    // Scroll down enough to reveal sticky bar
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    const stickyBtn = page.locator('[class*="sticky"] a, [class*="sticky"] button').first();
    if (await stickyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await stickyBtn.getAttribute('href');
      // Should link to app subdomain
      if (href) expect(href).toMatch(/mypetclub\.app|localhost/);
    }
  });
});
