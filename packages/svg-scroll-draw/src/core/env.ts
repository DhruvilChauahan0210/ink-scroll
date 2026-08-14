/**
 * True when running a development build.
 *
 * Every dev warning in this library used to be guarded by a bare
 * `process.env.NODE_ENV !== 'production'`. `process` does not exist in a browser
 * without a bundler, so any code path that reached one of those guards threw
 * `ReferenceError: process is not defined` instead of logging a warning.
 *
 * That broke the CDN / `<script type="module">` usage the README advertises.
 * Concrete repro: give a path its stroke via CSS rather than a `stroke`
 * attribute — a completely normal thing to do — and `checkElement()` tries to
 * warn about the missing attribute, touches `process`, and takes down the call.
 *
 * The `typeof` guard makes this safe in every environment. `process.env.NODE_ENV`
 * is still written as a literal member expression so bundlers can substitute it
 * and fold this constant away, keeping the warnings out of production bundles.
 */
declare const __SVG_SCROLL_DRAW_DEV__: boolean;

export const IS_DEV: boolean =
  /*
   * Build-time override, substituted as a literal by the two CDN builds.
   *
   * The `process` test below is unanswerable without a bundler — `process` does
   * not exist in a browser — so `IS_DEV` was false for every CDN user, the people
   * least likely to have any other diagnostics available. Every warning this
   * library has was invisible to exactly them, including the zero-length trigger
   * window that would have caught the `scrollHorizontal` defect.
   *
   * `svg-scroll-draw.dev.global.js` defines this to `true`; the production CDN
   * build defines it to `false`, which also lets the minifier drop the warning
   * bodies outright. Left undefined for the npm builds, where the `process` test
   * is the right one and bundlers fold it away.
   */
  typeof __SVG_SCROLL_DRAW_DEV__ !== 'undefined'
    ? __SVG_SCROLL_DRAW_DEV__
    : typeof process !== 'undefined' &&
      typeof process.env !== 'undefined' &&
      process.env.NODE_ENV !== 'production';

/** Dev-only console warning. No-ops entirely in production builds. */
export function warn(msg: string, ...rest: unknown[]): void {
  if (IS_DEV) console.warn(`[svg-scroll-draw] ${msg}`, ...rest);
}
