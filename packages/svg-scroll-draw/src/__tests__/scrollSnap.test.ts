import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollSnap } from '../snap';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSections(count: number): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => {
    const el = document.createElement('div');
    el.style.height = '800px';
    document.body.appendChild(el);
    const offset = i * 800;
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({
        top:    offset - window.scrollY,
        bottom: offset + 800 - window.scrollY,
        left: 0, right: 1200, width: 1200, height: 800,
      }),
      configurable: true,
    });
    Object.defineProperty(el, 'offsetHeight', { get: () => 800, configurable: true });
    Object.defineProperty(el, 'offsetWidth',  { get: () => 1200, configurable: true });
    return el;
  });
}

let rafCallbacks: FrameRequestCallback[] = [];

beforeEach(() => {
  rafCallbacks = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('innerWidth', 1200);
  vi.stubGlobal('scrollTo', vi.fn((opts: ScrollToOptions) => {
    if (opts.top !== undefined) vi.stubGlobal('scrollY', opts.top);
  }));
  setReducedMotion(false);
});

/**
 * jsdom does not implement matchMedia, so stub it. `listeners` is exposed so a
 * test can flip the preference at runtime and assert the change is picked up.
 */
let motionListeners: Array<(e: { matches: boolean }) => void> = [];
function setReducedMotion(matches: boolean) {
  motionListeners = [];
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => { motionListeners.push(cb); },
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      motionListeners = motionListeners.filter((l) => l !== cb);
    },
  })));
}
function emitReducedMotion(matches: boolean) {
  motionListeners.forEach((cb) => cb({ matches }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function flush(times = 1) {
  for (let i = 0; i < times; i++) {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach((cb) => cb(performance.now() + i * 16));
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollSnap', () => {
  it('returns NOOP for empty section list', () => {
    const instance = scrollSnap([]);
    expect(instance.getCurrentIndex()).toBe(0);
    expect(() => instance.destroy()).not.toThrow();
  });

  it('snapTo scrolls to the target section offset', () => {
    const sections = makeSections(3);
    const onSnap   = vi.fn();
    const instance = scrollSnap(sections, { duration: 16, onSnap });

    instance.snapTo(1);
    // Complete animation in one frame (duration=16ms so progress reaches 1 quickly)
    flush(60);

    expect(onSnap).toHaveBeenCalledWith(1);
    expect(instance.getCurrentIndex()).toBe(1);
    instance.destroy();
  });

  it('getCurrentIndex returns 0 initially', () => {
    const sections = makeSections(3);
    const instance = scrollSnap(sections);
    expect(instance.getCurrentIndex()).toBe(0);
    instance.destroy();
  });

  it('snapTo clamps to valid range', () => {
    const sections = makeSections(3);
    const onSnap   = vi.fn();
    const instance = scrollSnap(sections, { duration: 16, onSnap });

    instance.snapTo(99);
    flush(60);

    // Should snap to last index (2)
    expect(onSnap).toHaveBeenCalledWith(2);
    instance.destroy();
  });

  it('snapTo does nothing when already at exact target offset', () => {
    const sections = makeSections(3);
    const onSnap   = vi.fn();
    const instance = scrollSnap(sections, { onSnap });

    // Already at index 0, offset 0 — delta < 1px
    instance.snapTo(0);

    expect(onSnap).toHaveBeenCalledWith(0);
    instance.destroy();
  });

  it('destroy removes scroll listener without throwing', () => {
    const sections = makeSections(2);
    const instance = scrollSnap(sections);
    expect(() => {
      window.dispatchEvent(new Event('scroll'));
      instance.destroy();
    }).not.toThrow();
  });

  it('does not snap during active animation', () => {
    const sections = makeSections(3);
    const onSnap   = vi.fn();
    const instance = scrollSnap(sections, { duration: 600, onSnap });

    instance.snapTo(1); // start animation
    instance.snapTo(2); // should be ignored mid-animation

    flush(5); // partial animation

    // Only one snapTo is running
    expect(onSnap).not.toHaveBeenCalled(); // still animating
    instance.destroy();
  });

  // ── prefers-reduced-motion ──────────────────────────────────────────────────
  // scrollSnap animates window.scrollTo over a duration, which is precisely the
  // motion this media query exists to suppress. It previously ignored it.

  describe('prefers-reduced-motion', () => {
    it('jumps straight to the section instead of animating the scroll', () => {
      setReducedMotion(true);
      const onSnap = vi.fn();
      const instance = scrollSnap(makeSections(3), { onSnap });

      instance.snapTo(2);

      // Landed immediately, with no rAF animation scheduled.
      expect(window.scrollY).toBe(1600);
      expect(instance.getCurrentIndex()).toBe(2);
      expect(onSnap).toHaveBeenCalledWith(2);
      expect(rafCallbacks).toHaveLength(0);

      instance.destroy();
    });

    it('still animates when the user has no preference', () => {
      setReducedMotion(false);
      const instance = scrollSnap(makeSections(3), { duration: 400 });

      instance.snapTo(2);

      // An animation frame was scheduled rather than jumping.
      expect(rafCallbacks.length).toBeGreaterThan(0);
      expect(instance.getCurrentIndex()).toBe(0);

      instance.destroy();
    });

    it('respectReducedMotion: false overrides the preference', () => {
      setReducedMotion(true);
      const instance = scrollSnap(makeSections(3), {
        duration: 400,
        respectReducedMotion: false,
      });

      instance.snapTo(2);

      expect(rafCallbacks.length).toBeGreaterThan(0);
      instance.destroy();
    });

    it('picks up a preference change without needing a reload', () => {
      setReducedMotion(false);
      const instance = scrollSnap(makeSections(3), { duration: 400 });

      // User turns reduced motion on while the page is open.
      emitReducedMotion(true);
      instance.snapTo(2);

      expect(window.scrollY).toBe(1600);
      expect(rafCallbacks).toHaveLength(0);

      instance.destroy();
    });

    it('removes its media-query listener on destroy', () => {
      setReducedMotion(false);
      const instance = scrollSnap(makeSections(3));
      expect(motionListeners.length).toBe(1);

      instance.destroy();
      expect(motionListeners.length).toBe(0);
    });
  });
});

/*
 * The scroll handler itself, and the custom-container branch.
 *
 * Both were uncovered: the browser suite drives real gestures, and every unit
 * test here called `snapTo()` directly, so the debounced `onScroll` — which is
 * what decides *whether* to snap and in which direction — was never entered.
 */
describe('scrollSnap — reacting to a user scroll', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /**
   * Run the queued animation frames to completion.
   *
   * The snap itself is a rAF animation over `duration`, and `onSnap` only fires
   * on its last frame — so a test that only advances timers sees nothing at all.
   * A timestamp well past the duration finishes it in one frame.
   */
  function flushAnimation(): void {
    let guard = 0;
    while (rafCallbacks.length && guard++ < 50) {
      rafCallbacks.shift()!(performance.now() + 10_000);
    }
  }

  /** Move the page and fire the event the engine listens for. */
  function userScrollTo(y: number): void {
    vi.stubGlobal('scrollY', y);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(150); // past the 100ms debounce
    flushAnimation();
  }

  it('snaps forward once the user is past the threshold', () => {
    const sections = makeSections(3);
    const snapped: number[] = [];
    scrollSnap(sections, { threshold: 0.3, onSnap: (i) => snapped.push(i) });

    // 40% into the first section — past a 30% threshold.
    userScrollTo(320);
    expect(snapped, 'no snap happened').toContain(1);
  });

  it('stays put when the user has not passed the threshold', () => {
    const sections = makeSections(3);
    const snapped: number[] = [];
    scrollSnap(sections, { threshold: 0.5, onSnap: (i) => snapped.push(i) });

    userScrollTo(100); // 12.5% in, threshold is 50%
    expect(snapped.filter((i) => i !== 0), 'snapped to another section too early').toEqual([]);
  });

  it('snaps backward when the user scrolls up past the threshold', () => {
    const sections = makeSections(3);
    const snapped: number[] = [];
    const instance = scrollSnap(sections, { threshold: 0.3, onSnap: (i) => snapped.push(i) });

    instance.snapTo(2);
    flushAnimation();
    snapped.length = 0;

    userScrollTo(1600 - 320); // 40% back up out of section 2
    expect(snapped, 'never snapped back').toContain(1);
  });

  it('ignores a scroll that is already parked on the current section', () => {
    const sections = makeSections(3);
    const snapped: number[] = [];
    scrollSnap(sections, { onSnap: (i) => snapped.push(i) });

    // The event our own snap produces: the position already matches the section.
    userScrollTo(0);
    expect(snapped, 'onSnap fired for a scroll that changed nothing').toEqual([]);
  });

  it('measures sections against a custom scroll container', () => {
    const scroller = document.createElement('div');
    scroller.id = 'scroller';
    document.body.appendChild(scroller);
    Object.defineProperty(scroller, 'getBoundingClientRect', {
      value: () => ({ top: 0, bottom: 600, left: 0, right: 800, width: 800, height: 600 }),
      configurable: true,
    });
    Object.defineProperty(scroller, 'clientHeight', { get: () => 600, configurable: true });

    // Sections positioned inside the container's scroll space, not the page's:
    // their client rects move with the container's own scrollTop.
    const sections = [0, 1, 2].map((i) => {
      const el = document.createElement('div');
      scroller.appendChild(el);
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({
          top: i * 600 - scroller.scrollTop,
          bottom: (i + 1) * 600 - scroller.scrollTop,
          left: 0, right: 800, width: 800, height: 600,
        }),
        configurable: true,
      });
      Object.defineProperty(el, 'offsetHeight', { get: () => 600, configurable: true });
      Object.defineProperty(el, 'offsetWidth', { get: () => 800, configurable: true });
      return el;
    });

    const snapped: number[] = [];
    scrollSnap(sections, {
      scrollContainer: '#scroller',
      threshold: 0.3,
      onSnap: (i) => snapped.push(i),
    });

    // 42% into the first section, and the listener is on the container.
    scroller.scrollTop = 250;
    scroller.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(150);
    flushAnimation();

    expect(snapped, 'the container scroll was never handled').toContain(1);
    // Landed by writing the container's scrollTop, not the window's.
    expect(scroller.scrollTop, 'the container was not scrolled to the section').toBe(600);
  });
});
