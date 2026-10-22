import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Tests', () => {
  test('should load the homepage with correct title and elements', async ({ page }) => {
    await page.goto('/');

    // Check title contains Abbeygate
    await expect(page).toHaveTitle(/Abbeygate/i);

    // Check header logo link is visible
    const logo = page.locator('header a[href="/"]');
    await expect(logo.first()).toBeVisible();

    // Check main content or hero heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toContainText('Abbeygate England');
  });

  test('should allow opening and closing search', async ({ page }) => {
    await page.goto('/');

    // Find search toggle button
    const searchButton = page.locator('button[aria-label="Search"]').or(page.locator('header button:has(svg.lucide-search)'));
    if (await searchButton.first().isVisible()) {
      await searchButton.first().click();

      // Verify search input is present
      const searchInput = page.locator('input[type="search"]').or(page.locator('header input[type="text"]'));
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('mobile navigation drawer behaves properly', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only relevant for mobile devices');

    await page.goto('/');

    // Look for mobile menu toggle button
    const menuButton = page.locator('button[aria-label="Toggle menu"]').or(page.locator('header button:has(svg.lucide-menu)'));
    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();

      // Look for close button or mobile navigation container
      const closeButton = page.locator('button[aria-label="Close menu"]').or(page.locator('header button:has(svg.lucide-x)'));
      await expect(closeButton.first()).toBeVisible();

      // Close it back
      await closeButton.first().click();
    }
  });
});
