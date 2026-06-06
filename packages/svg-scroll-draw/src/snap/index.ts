import type { EasingName } from '../core/types';
import { EASINGS, clamp } from '../core/utils';

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
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[svg-scroll-draw] scrollSnap: no sections found');
    }
    return NOOP;
  }

  const {
    direction  = 'vertical',
    duration   = 600,
    easing     = 'ease-in-out',
    threshold  = 0.3,
    scrollContainer,
    onSnap,
  } = options;

  const easeFn = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS['ease-in-out']);
  const isHorizontal = direction === 'horizontal';

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  let currentIndex = 0;
  let isAnimating  = false;
  let animRafId    = 0;

  function getScroll(): number {
    if (scrollEl) return isHorizontal ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return isHorizontal ? window.scrollX : window.scrollY;
  }

  function setScroll(val: number): void {
    if (scrollEl) {
      if (isHorizontal) scrollEl.scrollLeft = val;
      else scrollEl.scrollTop = val;
    } else {
      window.scrollTo(isHorizontal ? { left: val } : { top: val });
    }
  }

  function getSectionOffsets(): number[] {
    return els.map((el) => {
      const rect = el.getBoundingClientRect();
      if (scrollEl) {
        const cr = scrollEl.getBoundingClientRect();
        return isHorizontal
          ? rect.left - cr.left + scrollEl.scrollLeft
          : rect.top  - cr.top  + scrollEl.scrollTop;
      }
      return isHorizontal
        ? rect.left + window.scrollX
        : rect.top  + window.scrollY;
    });
  }

  function snapTo(index: number): void {
    const targetIndex = clamp(index, 0, els.length - 1);
    if (isAnimating) {
      cancelAnimationFrame(animRafId);
      isAnimating = false;
    }
    isAnimating = true;

    const offsets    = getSectionOffsets();
    const startScroll = getScroll();
    const endScroll   = offsets[targetIndex];

    if (Math.abs(startScroll - endScroll) < 1) {
      isAnimating  = false;
      currentIndex = targetIndex;
      onSnap?.(targetIndex);
      return;
    }

    const startTime = performance.now();

    function animate(now: number): void {
      const progress = clamp((now - startTime) / duration, 0, 1);
      setScroll(startScroll + (endScroll - startScroll) * easeFn(progress));

      if (progress < 1) {
        animRafId = requestAnimationFrame(animate);
      } else {
        isAnimating  = false;
        currentIndex = targetIndex;
        onSnap?.(targetIndex);
      }
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

      let bestIndex = currentIndex;
      let bestDist  = Infinity;

      offsets.forEach((offset, i) => {
        const dist = Math.abs(currentScroll - offset);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
      });

      // Threshold check: snap forward only if user passed threshold% of the section
      const sectionSize = isHorizontal
        ? els[currentIndex].offsetWidth
        : els[currentIndex].offsetHeight;
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

  return {
    destroy() {
      cancelAnimationFrame(animRafId);
      clearTimeout(debounceTimer);
      scrollTarget.removeEventListener('scroll', onScroll);
    },
    snapTo,
    getCurrentIndex() { return currentIndex; },
  };
}
