import type { EasingName } from '../core/types';
import { EASINGS } from '../core/easing';
import { clamp } from '../core/math';
import { warn } from '../core/env';
import { prefersReducedMotion } from '../core/motion';
import { watchReducedMotion } from '../core/motion-watch';
import { _register, _unregister } from '../core/registry';

export interface ScrollSnapOptions {
  /** Scroll axis. Default: 'vertical'. */
  direction?: 'vertical' | 'horizontal';
  /** Snap animation duration in ms. Default: 600. */
  duration?: number;
  /** Easing for the snap scroll animation. Default: 'ease-in-out'. */
  easing?: EasingName | ((t: number) => number);
  /**
   * Fraction of a section's size the user must scroll past before it snaps
   * forward instead of snapping back. Range 0–1. Default: 0.3.
   */
  threshold?: number;
  /** Custom scroll container. Default: window. */
  scrollContainer?: string | Element;
  /** Fires after each snap with the target section index. */
  onSnap?: (index: number) => void;
  /**
   * Honour `prefers-reduced-motion: reduce` by jumping straight to the target
   * section instead of animating the scroll. Default: `true`.
   *
   * Snapping still happens — only the animated scroll is dropped. Set to `false`
   * only if you have a specific reason to override the user's stated preference.
   */
  respectReducedMotion?: boolean;
}

export interface ScrollSnapInstance {
  /** Remove snap behaviour and all listeners. */
  destroy: () => void;
  /** Programmatically snap to a section by zero-based index. */
  snapTo: (index: number) => void;
  /** Returns the index of the currently snapped section. */
  getCurrentIndex: () => number;
}

const NOOP: ScrollSnapInstance = {
  destroy: () => {},
  snapTo: () => {},
  getCurrentIndex: () => 0,
};

function resolveElements(input: string | NodeList | Element[]): HTMLElement[] {
  if (typeof input === 'string') {
    return Array.from(document.querySelectorAll<HTMLElement>(input));
  }
  if (input instanceof NodeList) {
    return Array.from(input) as HTMLElement[];
  }
  return input as HTMLElement[];
}

export function scrollSnap(
  sections: string | NodeList | Element[],
  options: ScrollSnapOptions = {},
): ScrollSnapInstance {
  if (typeof window === 'undefined') return NOOP;

  const els = resolveElements(sections);
  if (!els.length) {
    warn('scrollSnap: no sections found');
    return NOOP;
  }

  const {
    direction  = 'vertical',
    duration   = 600,
    easing     = 'ease-in-out',
    threshold  = 0.3,
    scrollContainer,
    onSnap,
    respectReducedMotion = true,
  } = options;

  // Animating window.scrollTo over a duration is exactly the kind of motion
  // `prefers-reduced-motion` is about, and this module previously ignored it
  // entirely. Tracked live so toggling the OS setting takes effect without a
  // reload.
  let reduceMotion = respectReducedMotion && prefersReducedMotion();
  const unwatchMotion = respectReducedMotion
    ? watchReducedMotion((reduced) => { reduceMotion = reduced; })
    : () => {};

  const easeFn = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS['ease-in-out']);
  const isHorizontal = direction === 'horizontal';
  const dim  = isHorizontal ? 'Width' : 'Height';
  const side = isHorizontal ? 'left' : 'top';

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  let isAnimating  = false;
  let animRafId    = 0;

  function getScroll(): number {
    if (scrollEl) return isHorizontal ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return isHorizontal ? window.scrollX : window.scrollY;
  }

  /**
   * Each frame of the glide is written with `behavior: 'instant'`: a plain
   * write follows CSS `scroll-behavior: smooth`, which turned every frame into
   * a smooth scroll of its own, each one cancelling the last. A browser too old
   * to know 'instant' throws on it, and has no smooth scrolling to override.
   */
  function setScroll(val: number): void {
    const target = scrollEl ?? window;
    const to: ScrollToOptions = isHorizontal ? { left: val } : { top: val };
    try {
      target.scrollTo({ ...to, behavior: 'instant' });
    } catch {
      target.scrollTo(to);
    }
  }

  /**
   * Where each section starts, in the scroll range: from inside a container's
   * border (it measured from the border box, so a 4px border landed every snap
   * 4px past its section), and no further than the scroll can go. Sections near
   * the end of a page that ends sooner start past the last scroll position; a
   * snap to one never arrived, and the next scroll event sent it back.
   */
  function getSectionOffsets(): number[] {
    // The page's scroller is body in quirks mode, where the root's
    // clientHeight is the whole page: every snap went to 0 on a page without
    // a doctype.
    const box    = scrollEl ?? document.scrollingElement ?? document.documentElement;
    const max    = box[`scroll${dim}` as const] - box[`client${dim}` as const];
    // Where the scrollport starts on screen: inside a container's border, or
    // the top of the viewport.
    const origin = scrollEl
      ? scrollEl.getBoundingClientRect()[side] + scrollEl[isHorizontal ? 'clientLeft' : 'clientTop']
      : 0;
    const scroll = getScroll();
    return els.map((el) => clamp(el.getBoundingClientRect()[side] - origin + scroll, 0, max));
  }

  /**
   * The section the scroll is nearest to. currentIndex started at 0 whatever
   * the scroll position: created at section 4, a nudge snapped to section 1.
   */
  function nearest(): number {
    const scroll  = getScroll();
    const offsets = getSectionOffsets();
    return offsets.reduce((best, at, i) => (Math.abs(at - scroll) < Math.abs(offsets[best] - scroll) ? i : best), 0);
  }

  let currentIndex = nearest();

  /** The snap is over, on section `i`. */
  function land(i: number): void {
    isAnimating  = false;
    currentIndex = i;
    onSnap?.(i);
  }

  function snapTo(index: number): void {
    const targetIndex = clamp(index, 0, els.length - 1);
    // A snap still running is replaced.
    cancelAnimationFrame(animRafId);
    isAnimating = true;

    const offsets    = getSectionOffsets();
    const startScroll = getScroll();
    const endScroll   = offsets[targetIndex];

    if (Math.abs(startScroll - endScroll) < 1) return land(targetIndex);

    // Reduced motion: land on the section immediately, no animated scroll.
    if (reduceMotion) {
      setScroll(endScroll);
      return land(targetIndex);
    }

    const startTime = performance.now();

    function animate(now: number): void {
      const progress = clamp((now - startTime) / duration, 0, 1);
      setScroll(startScroll + (endScroll - startScroll) * easeFn(progress));
      if (progress < 1) animRafId = requestAnimationFrame(animate);
      else land(targetIndex);
    }

    animRafId = requestAnimationFrame(animate);
  }

  // After the user stops scrolling, snap to the nearest section
  let debounceTimer: ReturnType<typeof setTimeout>;

  function onScroll(): void {
    if (isAnimating) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentScroll = getScroll();
      const offsets = getSectionOffsets();

      // Already parked exactly on the current section: there is nothing to snap.
      //
      // Without this, the scroll event generated by our OWN snap is treated as a
      // fresh user gesture, and the resulting snapTo(currentIndex) takes the
      // "already there" early return — which fires onSnap a second time for a
      // single snap. It showed up as a guaranteed double-fire under reduced
      // motion (one instant jump = one unmistakable scroll event) and as an
      // easing-dependent intermittent one otherwise, since a snap whose final
      // frame lands on a position it had effectively already reached emits no
      // trailing event at all. Public callbacks that fire once or twice depending
      // on the easing curve are worse than either.
      if (Math.abs(currentScroll - offsets[currentIndex]) < 1) return;

      // Threshold check: snap forward only if user passed threshold% of the section
      const sectionSize = els[currentIndex][`offset${dim}` as const];
      const delta = currentScroll - offsets[currentIndex];

      if (delta > sectionSize * threshold && currentIndex < els.length - 1) {
        snapTo(currentIndex + 1);
      } else if (delta < -(sectionSize * threshold) && currentIndex > 0) {
        snapTo(currentIndex - 1);
      } else {
        snapTo(currentIndex);
      }
    }, 100);
  }

  const scrollTarget = scrollEl ?? window;
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });

  // Keyed on the first section; progress is which section is current, and the
  // trigger window spans the first section's offset to the last one's.
  _register(els[0], {
    type: 'snap',
    getProgress: () => currentIndex / (els.length - 1 || 1),
    getTrigger: () => {
      const offsets = getSectionOffsets();
      return { tStart: offsets[0], tEnd: offsets[offsets.length - 1] };
    },
  });

  return {
    destroy() {
      cancelAnimationFrame(animRafId);
      clearTimeout(debounceTimer);
      scrollTarget.removeEventListener('scroll', onScroll);
      unwatchMotion();
      _unregister(els[0]);
    },
    snapTo,
    getCurrentIndex() { return currentIndex; },
  };
}
