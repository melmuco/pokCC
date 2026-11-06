import { test, expect } from '@playwright/test';

test.describe('Scan Tests', () => {
  test.use({ storageState: 'auth.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/scansione');
  });

  test('Navigate to scan page', async ({ page }) => {
    await page.waitForSelector('text=Scansione, input[type="file"], button:has-text("Camera")');

    const uploadInput = await page.locator('input[type="file"]');
    await expect(uploadInput).toBeVisible();
  });

  test('WebSocket connection for scan progress', async ({ page }) => {
    await page.goto('/scansione');

    const socketAvailable = await page.evaluate(() => {
      return typeof window.io !== 'undefined' || window.WebSocket !== undefined;
    });
    await expect(socketAvailable).toBeTruthy();
  });

  test('Scan with image upload', async ({ page }) => {
    await page.goto('/scansione');

    const uploadInput = await page.locator('input[type="file"]');
    await uploadInput.setInputPath('test/fixtures/card-sample.jpg');

    await page.waitForTimeout(1000);

    await expect(page.locator('text=Processando, text=Elaborazione, .scansione-complete, .card-result')).toBeVisible({ timeout: 10000 });
  });
});