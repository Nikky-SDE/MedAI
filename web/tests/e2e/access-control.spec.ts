import { test, expect } from '@playwright/test';

test.describe('Medical Privacy & Access Control (RLS Boundary)', () => {
  test('unauthenticated visitor cannot access a non-existent or private report', async ({ page }) => {
    // Attempting to access arbitrary UUID
    const testReportId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/report/${testReportId}`);

    // Unauthenticated user attempting to access private or missing report receives Report Not Found safeguard
    await expect(page.getByRole('heading', { name: /Report Not Found/i })).toBeVisible();
    await expect(page.getByText(/couldn't locate the requested health report/i)).toBeVisible();

    // Clicking Return to Dashboard redirects unauthenticated user to /login
    await page.getByRole('link', { name: /Return to Dashboard/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('reports cannot be tampered with via URL manipulation', async ({ page }) => {
    // Malformed report id
    await page.goto('/report/malformed-id-injection');
    await expect(page.getByRole('heading', { name: /Report Not Found/i })).toBeVisible();
  });
});
