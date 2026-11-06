import { test, expect } from '@playwright/test';

test.describe('Add Card to Collection Tests', () => {
  test.use({ storageState: 'auth.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/collezioni');
  });

  test('View collection details', async ({ page }) => {
    await page.click('a[href="/collezioni"]');
    await page.waitForSelector('text=Collezioni, text=Le Mie Collezioni');

    const collectionLinks = await page.locator('a[href*="/collezioni/"]');
    await expect(collectionLinks.first()).toBeVisible();
  });

  test('Click export CSV button', async ({ page }) => {
    await page.goto('/collezioni');

    const exportButtons = await page.locator('button:has-text("Esporta CSV"), a:has-text("Esporta")');
    if (await exportButtons.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButtons.first().click(),
      ]);

      const filename = await download.suggestedFilename();
      expect(filename).toMatch(/\.csv$/);
    }
  });

  test('View collection with cards', async ({ page }) => {
    await page.goto('/collezioni');

    await page.click('a:has(not([href="/collezioni/nuova"]))');

    await page.waitForSelector('text=Valore totale, text=€');
    await expect(page.locator('text=Carte nella collezione')).toBeVisible();
  });
});