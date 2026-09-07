import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    actionTimeout: 15000,
    navigationTimeout: 20000,
    baseURL: 'http://localhost:5174',
    trace: 'off',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Hong_Kong',
    ...devices['Desktop Chrome'],
    channel: 'chrome',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host localhost',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: 'browser', testIgnore: '**/*live.spec.ts' },
    {
      name: 'live',
      testMatch: '**/*live.spec.ts',
      use: { screenshot: 'off', video: 'off', trace: 'off' },
    },
  ],
});
