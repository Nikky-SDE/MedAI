import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Guarding', () => {
  test('login page renders with email, password fields and disclaimer', async ({ page }) => {
    await page.goto('/login');

    // Branding and header
    await expect(page.getByText('MedAI').first()).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();

    // Form inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Required medical disclaimer presence
    await expect(page.getByText(/not a substitute for certified medical care/i)).toBeVisible();
  });

  test('unauthenticated users are redirected from protected /dashboard route to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated users are redirected from protected /profile route to /login', async ({ page }) => {
    await page.goto('/profile');
    // Expect redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
