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
 */

/** Whether the user has asked for reduced motion right now. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribes to changes in the reduced-motion preference. Returns an unsubscribe
 * function. No-ops safely when matchMedia is unavailable (SSR, old jsdom).
 *
 * Falls back to the deprecated addListener/removeListener pair for Safari < 14,
 * which is inside the library's stated support range.
 */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent | MediaQueryList) => cb(!!e.matches);

  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }

  // Safari < 14
  const legacy = mq as MediaQueryList & {
    addListener?: (cb: (e: MediaQueryList) => void) => void;
    removeListener?: (cb: (e: MediaQueryList) => void) => void;
  };
  legacy.addListener?.(handler as (e: MediaQueryList) => void);
  return () => legacy.removeListener?.(handler as (e: MediaQueryList) => void);
}
