import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Bumped from 30s/8s after a real run against the live public demo site
  // showed borderline navigation timing (registration/login redirects) —
  // see ai-prompts/automation-and-debugging.md, Entry 7. This is a shared,
  // rate-limited demo backend, not a dedicated test environment.
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: 'https://practicesoftwaretesting.com',
    // Toolshop uses data-test (not the Playwright default data-testid) — verified
    // live via DOM inspection of the register/login/checkout pages.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://api.practicesoftwaretesting.com',
      },
    },
  ],
});
