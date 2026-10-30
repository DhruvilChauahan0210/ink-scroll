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

/** Every fixture's scroll arithmetic is written against this exact size. */
const VIEWPORT = { width: 900, height: 800 };

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  // Bundles the React / Vue / Solid / Nuxt fixture entries. See global-setup.ts
  // for why it is not part of the webServer command.
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },

  /**
   * A fixed viewport keeps the scroll maths in the fixtures deterministic, and it
   * has to be re-applied *after* each device spread: project-level `use` wins over
   * top-level `use`, and every device preset carries its own viewport. Setting it
   * only at the top level silently left Chromium and Firefox at 1280x720 and
   * WebKit at 1280x700 — so the same fixture offset meant a different position in
   * WebKit than in the other two, and any fixture doing arithmetic from the
   * viewport height would be subtly wrong in exactly one browser.
   */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: VIEWPORT } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: VIEWPORT } },
    /*
     * Firefox 159 turned scroll-driven animations on by default (27 Oct 2026), but
     * the newest Playwright still bundles Firefox 157/158, where the same Gecko
     * implementation sits behind a pref. This project flips that pref and runs the
     * native-path specs, so "the fast path matches the JS engine in Firefox" is
     * measured here rather than taken from release notes. Drop the pref (and fold
     * these specs back into `firefox`) once Playwright ships Firefox 159+.
     */
    {
      name: 'firefox-native',
      testMatch: ['**/parity.spec.ts', '**/animate-parity.spec.ts'],
      use: {
        ...devices['Desktop Firefox'],
        viewport: VIEWPORT,
        launchOptions: {
          firefoxUserPrefs: { 'layout.css.scroll-driven-animations.enabled': true },
        },
      },
    },
  ],

  webServer: {
    // Relative to this config's directory.
    command: 'node serve.mjs',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
