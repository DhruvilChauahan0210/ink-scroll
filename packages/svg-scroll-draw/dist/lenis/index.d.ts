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
interface LenisScrollEvent {
    scroll: number;
    velocity: number;
    direction: number;
    progress: number;
}
interface LenisLike {
    on(event: 'scroll', callback: (e: LenisScrollEvent) => void): void;
    off(event: 'scroll', callback: (e: LenisScrollEvent) => void): void;
}
interface LenisAdapterInstance {
    /** Restore native `window.scrollY` and remove the Lenis listener. */
    destroy: () => void;
    /** Returns the current virtual scroll Y value Lenis last reported. */
    getScrollY: () => number;
}
/**
 * Patches `window.scrollY` and `window.pageYOffset` to return Lenis's
 * virtual scroll position so all svg-scroll-draw engines stay in sync
 * with smooth scroll.
 *
 * Only needed for Lenis v1. Lenis v2+ patches scrollY itself.
 */
declare function createLenisAdapter(lenis: LenisLike): LenisAdapterInstance;

export { type LenisAdapterInstance, type LenisLike, type LenisScrollEvent, createLenisAdapter };
