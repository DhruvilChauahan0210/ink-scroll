import { defineConfig, devices } from '@playwright/test';

/**
 * Real-browser tests for svg-scroll-draw.
 *
 * These exist because the 461 unit tests all run in jsdom with getTotalLength()
 * stubbed to a constant, IntersectionObserver faked, and getBoundingClientRect()
 * returning zeros. They verify the engine's arithmetic against its own
 * assumptions — they cannot verify that the library works in a browser, and in
 * particular they cannot verify the library's headline claim: that the native
 * CSS `animation-timeline: view()` fast path reproduces the JS engine exactly.
 *
 * WebKit is the important one. Safari has no scroll-driven animation support, so
 * it always takes the JS path — meaning the JS engine is what a large share of
 * real users actually run.
 */
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // A fixed viewport keeps the scroll maths in the fixtures deterministic.
    viewport: { width: 900, height: 800 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    // Relative to this config's directory.
    command: 'node serve.mjs',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
