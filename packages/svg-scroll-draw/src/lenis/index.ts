/**
 * Lenis smooth-scroll adapter for svg-scroll-draw.
 *
 * Lenis v2+ patches `window.scrollY` natively — no adapter needed.
 * This adapter targets Lenis v1, which uses a virtual scroll value
 * and does NOT update `window.scrollY`. It patches `window.scrollY` /
 * `window.pageYOffset` so all svg-scroll-draw engines read the correct value.
 *
 * Usage:
 *   import Lenis from '@studio-freight/lenis'
 *   import { createLenisAdapter } from 'svg-scroll-draw/lenis'
 *
 *   const lenis = new Lenis()
 *   const adapter = createLenisAdapter(lenis)
 *
 *   // RAF loop — let Lenis drive the tick
 *   function raf(time: number) {
 *     lenis.raf(time)
 *     requestAnimationFrame(raf)
 *   }
 *   requestAnimationFrame(raf)
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
  /** Restore native `window.scrollY` and remove the Lenis listener. */
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
 * Only needed for Lenis v1. Lenis v2+ patches scrollY itself.
 */
export function createLenisAdapter(lenis: LenisLike): LenisAdapterInstance {
  if (typeof window === 'undefined') return NOOP;

  let virtualScrollY = window.scrollY;

  const handler = (e: LenisScrollEvent): void => {
    virtualScrollY = e.scroll;
    try {
      Object.defineProperty(window, 'scrollY', {
        get: () => virtualScrollY,
        configurable: true,
      });
      Object.defineProperty(window, 'pageYOffset', {
        get: () => virtualScrollY,
        configurable: true,
      });
    } catch {
      // Some browsers don't allow redefining scrollY — fall back silently.
    }
  };

  lenis.on('scroll', handler);

  return {
    destroy() {
      lenis.off('scroll', handler);
      // Restore native descriptors
      try {
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (window as unknown as Record<string, unknown>).pageYOffset;
      } catch {
        // Ignore if not deletable
      }
    },
    getScrollY() {
      return virtualScrollY;
    },
  };
}
