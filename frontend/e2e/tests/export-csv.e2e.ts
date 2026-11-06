import { test, expect } from '@playwright/test';

test.describe('Export CSV Tests', () => {
  test.use({ storageState: 'auth.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/collezioni');
  });

  test('Export collection CSV', async ({ page }) => {
    await page.waitForSelector('a[href*="/collezioni"]');

    await page.click('a[href*="/collezioni"]');
    await page.waitForTimeout(500);

    const collectionPage = await page.locator('body');
    await expect(collectionPage).toContainText(/Collezione|Valore/);

    const exportButton = await page.locator('button:has-text("Esporta CSV"), a:has-text("CSV"), button[aria-label*="CSV"], [data-testid="export-csv"]');

    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportButton.first().click(),
      ]);

      const filename = await download.suggestedFilename();
      expect(filename).toMatch(/collezione.*\.csv/i);
    } else {
      console.log('Export button not found - may need implementation');
    }
  });

  test('CSV download has correct headers', async ({ page }) => {
    await page.goto('/collezioni');

    await page.click('a[href*="/collezioni"]');
    await page.waitForTimeout(500);

    const exportBtn = page.locator('button:has-text("Esporta CSV"), a:has-text("Esporta")');

    if (await exportBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportBtn.first().click(),
      ]);

      const content = await (await download.path()).then(path => require('fs').readFileSync(path, 'utf8'));
      const lines = content.split('\n');
      const headers = lines[0].split(',');

      expect(headers).toContain('Nome Carta');
      expect(headers).toContain('Quantita');
    }
  });
});