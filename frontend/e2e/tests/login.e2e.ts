import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Login with valid credentials', async ({ page }) => {
    await page.click('text=Accedi');
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });

    await expect(page.locator('text=Benvenuto')).toBeVisible();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.click('text=Accedi');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await page.waitForSelector('.toast, .error-message, [role="alert"]');
    await expect(page.locator('text=/password/i, text=/credential/i, text=/error/i')).toBeVisible();
  });

  test('Register new user', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="nome"]', 'Test');
    await page.fill('input[name="cognome"]', 'User');
    await page.fill('input[name="email"]', `newuser${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});