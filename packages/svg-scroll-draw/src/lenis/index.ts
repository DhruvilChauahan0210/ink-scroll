/**
 * Lenis smooth-scroll adapter for svg-scroll-draw.
 *
 * Lenis itself does not need it. Every Lenis release so far (the 1.x line;
 * 2.0 exists only as development prereleases) moves the real scroll position
 * on every frame: its `setScroll()` calls `wrapper.scrollTo({ behavior:
 * 'instant' })`, so `window.scrollY` already follows the smooth scroll and
 * every svg-scroll-draw engine reads it with no adapter.
 *
 * The adapter is for a setup that keeps a virtual scroll value and does NOT
 * move the page: any object with Lenis's `on('scroll')` / `off('scroll')`
 * shape. It patches `window.scrollY` / `window.pageYOffset` to that value, and
 * `destroy()` puts the browser's own properties back.
 *
 * Usage:
 *   import { createLenisAdapter } from 'svg-scroll-draw/lenis'
 *
 *   // `scroller` emits 'scroll' with { scroll, velocity, direction, progress }
 *   const adapter = createLenisAdapter(scroller)
 *
 *   // On cleanup:
 *   adapter.destroy()
 */

export interface LenisScrollEvent {
  scroll: number;
  velocity: number;
  direction: number;
  progress: number;
}

export interface LenisLike {
  on(event: 'scroll', callback: (e: LenisScrollEvent) => void): void;
  off(event: 'scroll', callback: (e: LenisScrollEvent) => void): void;
}

export interface LenisAdapterInstance {
  /** Restore the browser's own `window.scrollY` / `pageYOffset` and remove the listener. */
  destroy: () => void;
  /** Returns the current virtual scroll Y value Lenis last reported. */
  getScrollY: () => number;
}

const NOOP: LenisAdapterInstance = { destroy: () => {}, getScrollY: () => 0 };

/**
 * Patches `window.scrollY` and `window.pageYOffset` to return Lenis's
 * virtual scroll position so all svg-scroll-draw engines stay in sync
 * with smooth scroll.
 *
 * Not needed for Lenis 1.x, which scrolls the page itself; only for a
 * scroller that reports a virtual position without moving the page.
 */
export function createLenisAdapter(lenis: LenisLike): LenisAdapterInstance {
  if (typeof window === 'undefined') return NOOP;

  let virtualScrollY = window.scrollY;

  // `scrollY` and `pageYOffset` are the browser's own accessors, defined on the
  // window object itself (Window is a [Global] interface). Deleting our
  // override would delete the browser's property with it and leave
  // `window.scrollY` undefined for the rest of the page, so destroy() puts back
  // exactly what was there before the first override.
  const KEYS = ['scrollY', 'pageYOffset'] as const;
  const original = KEYS.map((key) => Object.getOwnPropertyDescriptor(window, key));
  let patched = false;

  const handler = (e: LenisScrollEvent): void => {
    virtualScrollY = e.scroll;
    try {
      for (const key of KEYS) {
        Object.defineProperty(window, key, {
          get: () => virtualScrollY,
          configurable: true,
        });
      }
      patched = true;
    } catch {
      // Some browsers don't allow redefining scrollY — fall back silently.
    }
  };

  lenis.on('scroll', handler);

  return {
    destroy() {
      lenis.off('scroll', handler);
      if (!patched) return;
      patched = false;
      KEYS.forEach((key, i) => {
        try {
          const desc = original[i];
          if (desc) Object.defineProperty(window, key, desc);
          else delete (window as unknown as Record<string, unknown>)[key];
        } catch {
          // Ignore if not restorable
        }
      });
    },
    getScrollY() {
      return virtualScrollY;
    },
  };
}
