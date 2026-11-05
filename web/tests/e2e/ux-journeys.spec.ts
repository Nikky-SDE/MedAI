import { test, expect } from '@playwright/test';

test.describe('UX Journeys, Responsive Viewports & Edge Cases', () => {
  test('mobile viewport (375x667) renders landing page without horizontal scroll overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that document scrollWidth is within clientWidth
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // Call to action button is visible and tap-target sized
    const cta = page.getByRole('link', { name: /Start Free Assessment/i });
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });

  test('mobile viewport (375x667) renders login page and handles tab switching cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Verify no horizontal overflow on mobile login
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // Verify tabs
    const signInTab = page.getByRole('tab', { name: /Sign In/i });
    const signUpTab = page.getByRole('tab', { name: /Create Account/i });
    await expect(signInTab).toBeVisible();
    await expect(signUpTab).toBeVisible();

    // Default state: sign in form active
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    // Switch to create account
    await signUpTab.click();
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    await expect(page.locator('input#fullName')).toBeVisible();

    // Switch back to sign in
    await signInTab.click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  });

  test('login form enforces required field validation on empty submit', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input#email_login');
    const passwordInput = page.locator('input#password_login');
    const submitBtn = page.getByRole('button', { name: /^Sign In$/i });

    // Inputs have required attribute
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');

    // Submitting empty form does not navigate away
    await submitBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('clinics API returns 400 Bad Request when coordinates are invalid or missing', async ({ request }) => {
    // Missing lat/lon
    const resNoParams = await request.get('/api/clinics');
    expect(resNoParams.status()).toBe(400);
    const bodyNoParams = await resNoParams.json();
    expect(bodyNoParams.error).toBeDefined();

    // Invalid coordinates out of range
    const resInvalid = await request.get('/api/clinics?lat=999&lon=999');
    expect(resInvalid.status()).toBe(400);
  });

  test('triage API enforces authentication guard when called anonymously', async ({ request }) => {
    const res = await request.post('/api/triage', {
      data: { message: 'I have a mild headache' },
    });
    // Unauthenticated direct API call returns 401 Unauthorized
    expect(res.status()).toBe(401);
  });
});
