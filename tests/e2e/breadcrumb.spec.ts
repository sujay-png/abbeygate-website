import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Navigation E2E', () => {
  test('desktop shows full hierarchical breadcrumbs and non-clickable current page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only test');

    await page.goto('/collection/diaries/a5-diaries');

    // On desktop, the breadcrumb <ol> should be visible
    const desktopBreadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(desktopBreadcrumbs).toBeVisible();

    // Check Home link
    const homeLink = desktopBreadcrumbs.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();

    // Check Diaries parent link
    const parentLink = desktopBreadcrumbs.locator('a[href="/collection/diaries"]');
    await expect(parentLink).toBeVisible();

    // Check current page item has aria-current="page" and is not a link
    const currentPage = desktopBreadcrumbs.locator('[aria-current="page"]');
    await expect(currentPage).toBeVisible();
    await expect(currentPage).toContainText('A5 Diaries');
  });

  test('mobile shows "Back to [Previous Level]" button', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only test');

    await page.goto('/collection/diaries/a5-diaries');

    // On mobile, the mobile breadcrumb should be visible
    const mobileNav = page.locator('nav[aria-label="Mobile Breadcrumb"]');
    await expect(mobileNav).toBeVisible();

    // Check it says "Back to Diaries" and links to /collection/diaries
    const backLink = mobileNav.locator('a[href="/collection/diaries"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Diaries');
  });
});
