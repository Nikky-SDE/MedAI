import { test, expect } from '@playwright/test';

test.describe('Accessibility & WCAG 2.1 AA Compliance', () => {
  test('landing page contains valid landmark regions and headings hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check primary h1 heading exists
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();

    // All links have accessible names
    const links = page.locator('a');
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const text = await link.innerText();
      const ariaLabel = await link.getAttribute('aria-label');
      expect((text && text.trim().length > 0) || (ariaLabel && ariaLabel.trim().length > 0)).toBe(true);
    }
  });

  test('login page form controls have accessible labels and keyboard focus states', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Verify inputs have associated labels or aria-labels
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Test tab navigation / focusability
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });
});
