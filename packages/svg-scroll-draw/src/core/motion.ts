/**
 * Reduced-motion helpers.
 *
 * The engines each called `window.matchMedia('(prefers-reduced-motion: reduce)')`
 * inline, which had two problems:
 *
 *  1. Some modules never checked at all. `scrollSnap` was the serious one — it
 *     animates `window.scrollTo` over a duration, so it hijacked the user's
 *     scroll with an easing curve regardless of their stated preference.
 *  2. The preference was read once at construction with no listener, so toggling
 *     the OS setting did nothing until a reload.
 *
 * The listener lives in ./motion-watch, not here: the drop-ins read the
 * preference but never subscribe, and the chunked ESM build shares code a whole
 * file at a time, so in one file they would carry the listener too.
 */

/** Whether the user has asked for reduced motion right now. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
