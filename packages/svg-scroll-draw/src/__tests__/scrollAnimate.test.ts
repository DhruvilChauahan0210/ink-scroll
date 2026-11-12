import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollAnimate, scrollParallax, interpolateValue } from '../animate';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeDiv(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

class RafQueue {
  private queue: FrameRequestCallback[] = [];
  private id = 0;

  schedule = vi.fn((cb: FrameRequestCallback): number => {
    this.queue.push(cb);
    return ++this.id;
  });

  cancel = vi.fn((id: number) => {
    this.queue = this.queue.filter(() => true); // just drain on cancel
    void id;
  });

  /**
   * One frame: every callback queued before it, as a browser runs them. Engines
   * left by earlier tests still listen for scroll on the window, so their frames
   * share the queue.
   */
  tick() {
    const frame = this.queue;
    this.queue = [];
    for (const cb of frame) cb(performance.now());
  }
}

class FakeIO {
  private cb: IntersectionObserverCallback;
  static instances: FakeIO[] = [];

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }

  observe  = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting: boolean) {
    this.cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/**
 * Scroll the page: the engine's frame loop wakes on scroll events, as in a
 * browser, so moving `scrollY` alone is not a scroll.
 */
function scroll(y?: number): void {
  if (y !== undefined) vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
}

// ── setup / teardown ──────────────────────────────────────────────────────────

let raf: RafQueue;

beforeEach(() => {
  FakeIO.instances = [];
  raf = new RafQueue();
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', (_q: string) => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 200, height: 400, left: 0, width: 300, right: 300, bottom: 600, x: 0, y: 0,
    toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('innerWidth', 1200);
  // Disable native CSS path in tests (no CSS.supports)
  vi.stubGlobal('CSS', undefined);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── interpolateValue ──────────────────────────────────────────────────────────

describe('interpolateValue', () => {
  it('lerps two numbers', () => {
    expect(interpolateValue(0, 100, 0.5)).toBe('50');
  });

  it('lerps CSS values with units', () => {
    expect(interpolateValue('0px', '100px', 0.5)).toBe('50px');
  });

  it('lerps hex colors', () => {
    const result = interpolateValue('#000000', '#ffffff', 0.5);
    expect(result).toMatch(/^rgb\(128,128,128\)$/);
  });

  it('lerps transform functions', () => {
    const result = interpolateValue('translateY(40px)', 'translateY(0px)', 0.5);
    expect(result).toContain('translateY(20px)');
  });

  it('lerps multiple transform functions', () => {
    const result = interpolateValue('translateY(40px) scale(0.9)', 'translateY(0px) scale(1)', 0.5);
    expect(result).toContain('translateY(20px)');
    expect(result).toContain('scale(0.95)');
  });

  it('jumps at t=1 for unparseable values', () => {
    expect(interpolateValue('auto', 'none', 0)).toBe('auto');
    expect(interpolateValue('auto', 'none', 1)).toBe('none');
  });
});

// ── scrollAnimate core ────────────────────────────────────────────────────────

describe('scrollAnimate', () => {
  it('returns noop when element not found', () => {
    const inst = scrollAnimate('#nonexistent', { props: { opacity: [0, 1] } });
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
  });

  it('listens for scroll on the window, and keeps no IntersectionObserver', () => {
    const el = makeDiv();
    const listen = vi.spyOn(window, 'addEventListener');
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    expect(listen).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(FakeIO.instances).toHaveLength(0);
  });

  it('applies opacity on scroll frame', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 200); // at trigger start
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    scroll();
    raf.tick();
    expect(el.style.getPropertyValue('opacity')).not.toBe('');
  });

  it('applies transform interpolation', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 400); // mid-scroll
    scrollAnimate(el, {
      props: { transform: ['translateY(40px)', 'translateY(0px)'] },
      native: false,
    });
    scroll();
    raf.tick();
    const transform = el.style.getPropertyValue('transform');
    expect(transform).toContain('translateY(');
  });

  it('sets --scroll-draw-progress CSS variable', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 400);
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    scroll();
    raf.tick();
    const progress = el.style.getPropertyValue('--scroll-draw-progress');
    expect(parseFloat(progress)).toBeGreaterThanOrEqual(0);
  });

  it('seeks to a specific progress', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    inst.seek(0.75);
    expect(el.style.getPropertyValue('opacity')).toBe('0.75');
    expect(inst.getProgress()).toBe(0.75);
  });

  it('clamps seek values to [0, 1]', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    inst.seek(2);
    expect(inst.getProgress()).toBe(1);
    inst.seek(-1);
    expect(inst.getProgress()).toBe(0);
  });

  it('freezes progress with once: true', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 600); // near end
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, once: true, native: false });
    scroll();
    raf.tick();
    const progressAtEnd = inst.getProgress();
    scroll(0); // scroll back
    raf.tick();
    expect(inst.getProgress()).toBeGreaterThanOrEqual(progressAtEnd);
  });

  // Up to 2.23.2 once held the eased value, so elastic stayed on its 1.25
  // peak: '--x' from 0 to 100 ended on 125. The raw progress is held now and
  // eased after. Here the element starts below the fold (rect top 1000, height
  // 400): the window is [200, 1400], and a fifth of it, elastic's peak, is y = 440.
  describe('once with an easing that overshoots or dips', () => {
    function belowTheFold(): HTMLDivElement {
      const el = makeDiv();
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 1000, height: 400, left: 0, width: 300, right: 300, bottom: 1400, x: 0, y: 0,
        toJSON: () => ({}),
      });
      return el;
    }

    it('elastic overshoots mid-scroll and ends exactly on "to"', () => {
      const el = belowTheFold();
      const inst = scrollAnimate(el, { props: { '--x': [0, 100] }, easing: 'elastic', once: true, native: false });
      expect(el.style.getPropertyValue('--x')).toBe('0');
      scroll(440);
      raf.tick();
      expect(parseFloat(el.style.getPropertyValue('--x'))).toBeCloseTo(125, 6);
      scroll(1500);
      raf.tick();
      expect(el.style.getPropertyValue('--x')).toBe('100');
      expect(inst.getProgress()).toBe(1);
      scroll(440); // back: held at the end
      raf.tick();
      expect(el.style.getPropertyValue('--x')).toBe('100');
    });

    it('bounce keeps its dips while scrolling forward', () => {
      const seen: number[] = [];
      const el = belowTheFold();
      scrollAnimate(el, { props: { opacity: [0, 1] }, easing: 'bounce', once: true, native: false, onProgress: (p) => seen.push(p) });
      for (let y = 200; y <= 1400; y += 24) {
        scroll(y);
        raf.tick();
      }
      expect(seen.some((p, i) => i > 0 && p < seen[i - 1] - 1e-9)).toBe(true);
      expect(seen[seen.length - 1]).toBe(1);
    });

    it('after seek(), once still holds the sought value as its floor', () => {
      const el = makeDiv();
      const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, easing: 'ease-in', once: true, native: false });
      raf.tick();
      inst.seek(0.5);
      inst.resume();
      scroll(-240); // raw 0.3, eased 0.09: under the floor
      raf.tick();
      expect(inst.getProgress()).toBe(0.5);
      scroll(360); // raw 0.8, eased 0.64
      raf.tick();
      expect(inst.getProgress()).toBeCloseTo(0.64, 6);
    });
  });

  // `end: ''` was read as 'top bottom', a window with no length.
  it('a blank trigger is the default one', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, easing: 'linear', native: false, trigger: { start: '', end: '' } });
    scroll();
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.5, 6); // y 0 in [−600, 600]
  });

  it('calls onProgress callback', () => {
    const el = makeDiv();
    const onProgress = vi.fn();
    vi.stubGlobal('scrollY', 400);
    scrollAnimate(el, { props: { opacity: [0, 1] }, onProgress, native: false });
    scroll();
    raf.tick();
    expect(onProgress).toHaveBeenCalled();
  });

  it('calls onComplete callback', () => {
    const el = makeDiv();
    const onComplete = vi.fn();
    // element top = -500 → alpha = (800 - (-500)) / (400 + 800) = 1300/1200 > 1 → clamped to 1
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: -500, height: 400, left: 0, width: 300, right: 300, bottom: -100, x: 0, y: 0,
      toJSON: () => ({}),
    });
    scrollAnimate(el, { props: { opacity: [0, 1] }, onComplete, native: false });
    scroll();
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  it('pause stops rAF scheduling', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    scroll();
    raf.tick(); // starts
    const countBefore = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(countBefore);
  });

  it('resume restarts rAF after pause', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    scroll();
    raf.tick();
    inst.pause();
    const countBefore = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('destroy stops listening for scroll', () => {
    const el = makeDiv();
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    inst.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('replay resets progress to 0', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    inst.seek(1);
    inst.replay();
    expect(inst.getProgress()).toBe(0);
  });

  it('handles camelCase prop names', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { backgroundColor: ['#000', '#fff'] }, native: false });
    inst.seek(0.5);
    const bgColor = el.style.getPropertyValue('background-color');
    expect(bgColor).toBeTruthy();
  });

  it('handles backgroundColor color interpolation at seek(0)', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { backgroundColor: ['#000000', '#ffffff'] }, native: false });
    inst.seek(0);
    // JSDOM normalises rgb(0,0,0) → rgb(0, 0, 0); use toMatch for spacing tolerance
    expect(el.style.getPropertyValue('background-color')).toMatch(/rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/);
    inst.seek(1);
    expect(el.style.getPropertyValue('background-color')).toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/);
  });

  it('accepts element selector string', () => {
    const el = makeDiv();
    el.id = 'test-animate';
    expect(() =>
      scrollAnimate('#test-animate', { props: { opacity: [0, 1] }, native: false })
    ).not.toThrow();
  });

  it('handles prefers-reduced-motion by jumping to final state', () => {
    vi.stubGlobal('matchMedia', (_q: string) => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const el = makeDiv();
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    expect(el.style.getPropertyValue('opacity')).toBe('1');
  });
});

// Up to 2.23.3 an IntersectionObserver on the element ran the frame loop. Its
// box includes the element's own transform and is cut by overflow-hidden
// parents, so the loop stopped whenever the animation carried the element out
// of view. The trigger window decides now, checked on every scroll. The
// browser cases are in e2e/animate-gate.spec.ts.
describe('scrollAnimate frames follow the trigger window', () => {
  const linear = { props: { opacity: [0, 1] as [number, number] }, easing: 'linear' as const, native: false };
  const belowTheFold = (el: HTMLElement) =>
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 1000, height: 400, left: 0, width: 300, right: 300, bottom: 1400, x: 0, y: 0,
      toJSON: () => ({}),
    }); // window [200, 1400]

  it('keeps following the scroll when an observer would report the element out of view', () => {
    const el = makeDiv(); // window [−600, 600]
    const inst = scrollAnimate(el, linear);
    FakeIO.instances.forEach((io) => io.trigger(true));
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.5, 6);
    // What a parallax layer's own travel did: it left its clip.
    FakeIO.instances.forEach((io) => io.trigger(false));
    scroll(300);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 6);
  });

  it('a jump across the whole window paints the last frame and completes', () => {
    const el = makeDiv();
    belowTheFold(el);
    const onComplete = vi.fn();
    const inst = scrollAnimate(el, { ...linear, onComplete });
    raf.tick();
    scroll(2000); // never on screen in between
    raf.tick();
    expect(inst.getProgress()).toBe(1);
    expect(el.style.getPropertyValue('opacity')).toBe('1');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('runs no frames outside its window, and wakes on the scroll that enters it', () => {
    const el = makeDiv();
    belowTheFold(el);
    const onProgress = vi.fn(); // called once a frame
    scrollAnimate(el, { ...linear, onProgress });
    raf.tick(); // the first frame, before the window: nothing after it
    const frames = onProgress.mock.calls.length;
    scroll(100);
    raf.tick();
    raf.tick();
    expect(onProgress.mock.calls.length, 'a scroll before the window ran a frame').toBe(frames);
    scroll(500);
    raf.tick();
    expect(onProgress).toHaveBeenLastCalledWith(0.25);
  });

  it('a speed under 1 keeps running past the window end until its progress is 1', () => {
    const el = makeDiv();
    belowTheFold(el);
    const inst = scrollAnimate(el, { ...linear, speed: 0.5 });
    raf.tick();
    scroll(1400); // the window's end: half way at half speed
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.5, 6);
    scroll(2000);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 6);
  });
});

// replay() set `paused` to false and requested no frame, so after pause() or
// seek() the loop stayed stopped, and resume() then returned early.
describe('scrollAnimate replay() restarts the frame loop', () => {
  const linear = { props: { opacity: [0, 1] as [number, number] }, easing: 'linear' as const, native: false };

  it('after pause()', () => {
    const el = makeDiv(); // window [−600, 600]
    const inst = scrollAnimate(el, linear);
    FakeIO.instances.forEach((io) => io.trigger(true));
    raf.tick();
    inst.pause();
    raf.tick(); // a frame pause() could not cancel in this fake sees `paused` and stops
    inst.replay();
    expect(inst.getProgress()).toBe(0);
    scroll(300);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 6);
  });

  it('after seek()', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, linear);
    FakeIO.instances.forEach((io) => io.trigger(true));
    raf.tick();
    inst.seek(0.3);
    raf.tick();
    inst.replay();
    scroll(300);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 6);
  });
});

// ── scrollParallax ────────────────────────────────────────────────────────────

describe('scrollAnimate refresh()', () => {
  const rect = (top: number) => ({
    top, height: 400, left: 0, width: 300, right: 300, bottom: top + 400, x: 0, y: top,
    toJSON: () => ({}),
  });
  const linear = { easing: 'linear' as const, trigger: { start: 'top bottom', end: 'top top' }, native: false };

  it('re-measures the trigger window — what group refresh() relies on', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 200);
    const inst = scrollAnimate(el, { ...linear, props: { opacity: [0, 1] } });
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 5); // doc top 400, scrollY 200: 600 of 800

    // Content arrived above it: the element is now 600px below where it was measured.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(600));
    inst.refresh!();
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.25, 5); // doc top 800, scrollY 200
    inst.destroy();
  });

  it('ignores a move under a pixel, so an element animating its own size cannot loop', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 200);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(600));
    const inst = scrollAnimate(el, { ...linear, props: { opacity: [0, 1] } });
    raf.tick();
    const before = inst.getProgress();

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(600.4));
    inst.refresh!();
    raf.tick();
    expect(inst.getProgress()).toBe(before);
    inst.destroy();
  });
});

describe('scrollParallax', () => {
  it('returns noop when element not found', () => {
    const inst = scrollParallax('#missing');
    expect(inst.getProgress()).toBe(0);
  });

  it('keeps no IntersectionObserver: its own travel can carry it out of view', () => {
    const el = makeDiv();
    scrollParallax(el, { speed: 0.3 });
    expect(FakeIO.instances).toHaveLength(0);
  });

  it('applies transform on scroll', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 100);
    scrollParallax(el, { speed: 0.5 });
    scroll();
    raf.tick();
    const transform = el.style.getPropertyValue('transform');
    expect(transform).toContain('translateY(');
  });

  it('horizontal parallax uses translateX', () => {
    const el = makeDiv();
    const inst = scrollParallax(el, { speed: 0.3, axis: 'x' });
    inst.seek(0.5);
    const transform = el.style.getPropertyValue('transform');
    expect(transform).toContain('translateX(');
  });

  it('negative speed moves in opposite direction', () => {
    const el = makeDiv();
    const inst = scrollParallax(el, { speed: -0.5 });
    inst.seek(1);
    const transform = el.style.getPropertyValue('transform');
    // With negative speed, travel is positive, so final value > 0
    expect(transform).toContain('translateY(');
  });

  it('destroy stops listening for scroll', () => {
    const el = makeDiv();
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const inst = scrollParallax(el);
    inst.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });
});
