import { test, expect } from '@playwright/test';

test.describe('Clinical Triage & Red-Flag UI Flow', () => {
  test('landing page renders truthful capabilities and start triage CTA', async ({ page }) => {
    await page.goto('/');

    // Verify truthful header (no 94.8% accuracy or 12,000 patient fabrications)
    await expect(page.locator('h1')).toContainText(/Your Health Intelligence, Understood/i);
    await expect(page.getByText('12,000+')).toHaveCount(0);
    await expect(page.getByText('94.8%')).toHaveCount(0);

    // Call to action button leads to login
    const startBtn = page.getByRole('link', { name: /Start Free Assessment/i });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveAttribute('href', '/login');
  });

  test('login page displays clinical intelligence overview and emergency disclaimer', async ({ page }) => {
    await page.goto('/login');

    // Confirm that clinical overview features and emergency/privacy safeguards are displayed
    const emergencyInfo = page.getByText(/Instant access to nearby emergency care/i);
    await expect(emergencyInfo).toBeVisible();

    const disclaimer = page.getByText(/not a substitute for certified medical care/i);
    await expect(disclaimer).toBeVisible();
  });
});
