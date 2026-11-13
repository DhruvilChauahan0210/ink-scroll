import { watchLayout } from './layout-watch';

/**
 * What runs a scroll-linked engine's frames, and what keeps its trigger window
 * current. Every engine but pin and snap is built on it.
 *
 * The engines used to run their frame loop while an IntersectionObserver saw
 * the element. A jump across the whole window (the End key, an anchor link,
 * the scroll a reload restores) never has the element on screen, so the
 * observer never fired: the element kept its first frame and onComplete never
 * came. scrollAnimate moved to the window in 2.23.4, the other engines in
 * 2.23.5, and Cinematic, whose observer watched its sticky stage, in 2.23.7.
 *
 * `at()` is where the scroll is through the window, clamped to [0, 1], from
 * the cached window and the scroll offset only: no layout is read. Every
 * scroll calls wake(), which requests one frame when `at()` is not the value
 * the frame on screen was painted at. The loop runs while it is inside (0, 1)
 * and stops on the frame that leaves, so outside the window a scroll costs a
 * comparison: no frame, no layout read.
 *
 * `measure()` re-reads the window. It runs 150ms after a window resize or a
 * layout change (core/layout-watch reports `watched` and the page moving), or
 * at once on remeasure(), and a frame follows if the scroll is now elsewhere
 * in it. Engines measure once and keep the window: measuring on every scroll
 * forces layout.
 */
export interface FrameGate {
  /**
   * Stop (true) or start (false) the frames: pause, seek, resume, replay.
   * Either way the next frame repaints, even at an unchanged scroll.
   */
  hold(on: boolean): void;
  /** Re-measure now, and drop a pending debounced one. */
  remeasure(): void;
  /** Stop for good: no frames, no listeners. */
  off(): void;
}

export function frameGate(
  scroller: Element | Window,
  watched: Element[],
  at: () => number,
  frame: () => void,
  measure: () => void,
): FrameGate {
  /** The pending frame: falsy for none, so one loop at a time. */
  let raf: number | undefined;
  /** `at()` for the frame on screen: NaN for none. */
  let painted = NaN;
  let held: boolean | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = (): void => {
    raf = 0;
    frame();
    // Unless the frame paused, sought, replayed or destroyed it (that call
    // decided), the next frame comes while the scroll is inside the window.
    if (!held && !raf && (painted = at()) > 0 && painted < 1) raf = requestAnimationFrame(tick);
  };
  const wake = (): void => {
    if (!raf && !held && at() !== painted) raf = requestAnimationFrame(tick);
  };
  const hold = (on: boolean): void => {
    held = on;
    cancelAnimationFrame(raf!);
    raf = painted = NaN;
    wake();
  };
  const remeasure = (): void => {
    clearTimeout(timer);
    measure();
    wake();
  };
  const later = (): void => {
    clearTimeout(timer);
    timer = setTimeout(remeasure, 150);
  };
  const unwatch = watchLayout(watched, later);
  const listen = (method: 'addEventListener' | 'removeEventListener'): void => {
    scroller[method]('scroll', wake, { passive: true });
    window[method]('resize', later);
    window[method]('orientationchange', later);
  };
  listen('addEventListener');
  // The first frame: what the scroll calls for, wherever it is.
  wake();

  return {
    hold,
    remeasure,
    off() {
      hold(true);
      listen('removeEventListener');
      unwatch();
      clearTimeout(timer);
    },
  };
}
