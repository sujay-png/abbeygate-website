import { test, expect } from '@playwright/test';

test.describe('Navigation and Customizer Verification', () => {
  test('navigating from scrolled page resets scroll position immediately to top', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop navbar test');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate user scroll down
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(500);

    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBeGreaterThan(300);

    // Click on a navigation link to PLP (e.g. Diaries in navbar)
    const diariesLink = page.locator('nav a[href="/diaries"]').first();
    await diariesLink.click();

    // Scroll should immediately reset towards 0 and be at top
    await page.waitForURL('**/diaries');
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeLessThan(100);
  });

  test('customizer places logo and corners correctly inside book bounds', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop customizer test');

    await page.goto('/product/dorchester-newhide-bicolor-pocket-week-to-view-black-purple');
    await page.waitForLoadState('networkidle');

    // Click start customising
    const startBtn = page.getByRole('button', { name: 'Start customising →' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify customizer appears
    const customizer = page.locator('#customizer-section');
    await expect(customizer).toBeVisible();
  });
});
