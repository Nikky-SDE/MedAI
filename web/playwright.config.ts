import { defineConfig, devices } from '@playwright/test';

/**
 * MedAI Playwright E2E Configuration
 * 
 * Configures end-to-end user journey tests:
 * - Authentication & form validation
 * - Triage loop to report completion (using MOCK_LLM=true)
 * - Medical privacy & Access control (User B cannot read User A's private report)
 * - Accessibility (WCAG 2.1 AA audits)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      MOCK_LLM: 'true',
      NODE_ENV: 'test',
    },
  },
});
