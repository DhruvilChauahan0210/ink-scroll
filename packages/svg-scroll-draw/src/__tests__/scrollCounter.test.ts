import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollCounter } from '../counter';
import { SNAPPY, snappy } from './bezierReference';
import type { Easing } from '../core/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSpan(): HTMLSpanElement {
  const el = document.createElement('span');
  document.body.appendChild(el);
  return el;
}

class RafQueue {
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel   = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  /**
   * One frame: every callback queued before it, as a browser runs them. The
   * engines' frames follow the trigger window and wake on scroll events, so an
   * engine an earlier test left can share the queue.
   */
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
}

class FakeIO {
  private cb: IntersectionObserverCallback;
  static instances: FakeIO[] = [];

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }

  observe    = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting: boolean) {
    this.cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

// ── setup / teardown ──────────────────────────────────────────────────────────

/**
 * Scroll the page: set the offset and fire a scroll event, as a browser does.
 * The frames follow the trigger window and wake on scroll (core/frame-gate),
 * so moving `scrollY` alone is not a scroll.
 */
function scroll(y?: number): void {
  if (y !== undefined) vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
}

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
    top: 300, height: 100, left: 0, width: 200, right: 200, bottom: 400, x: 0, y: 0,
    toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollCounter', () => {
  it('returns noop when element not found', () => {
    const inst = scrollCounter('#nonexistent', { to: 100 });
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
  });

  it('initialises to from value when element is below trigger zone', () => {
    const el = makeSpan();
    // top=900 puts element below viewport (height=800), so initAlpha=0 → shows from value
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 900, height: 100, left: 0, width: 200, right: 200, bottom: 1000, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollCounter(el, { from: 0, to: 1000 });
    expect(el.textContent).toBe('0');
  });

  it('defaults from to 0 when element is below trigger zone', () => {
    const el = makeSpan();
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 900, height: 100, left: 0, width: 200, right: 200, bottom: 1000, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollCounter(el, { to: 500 });
    expect(el.textContent).toBe('0');
  });

  it('updates textContent on scroll frame', () => {
    const el = makeSpan();
    scroll(400); // within trigger range
    scrollCounter(el, { to: 1000 });
    scroll();
    raf.tick();
    const val = parseInt(el.textContent ?? '0');
    expect(val).toBeGreaterThan(0);
  });

  it('seek sets value to correct number', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 1000 });
    inst.seek(0.5);
    expect(el.textContent).toBe('500');
  });

  it('seek(1) shows final value', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 1000 });
    inst.seek(1);
    expect(el.textContent).toBe('1000');
  });

  it('seek(0) shows from value', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { from: 100, to: 500 });
    inst.seek(0);
    expect(el.textContent).toBe('100');
  });

  it('respects decimals option', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100, decimals: 2 });
    inst.seek(0.5);
    expect(el.textContent).toBe('50.00');
  });

  it('uses custom format function', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, {
      to: 1000,
      format: (n) => `$${Math.round(n).toLocaleString()}`,
    });
    inst.seek(1);
    expect(el.textContent).toMatch(/^\$1,?000$/);
  });

  it('calls onComplete when reaching 100%', () => {
    const el = makeSpan();
    const onComplete = vi.fn();
    // element top = -200 → alpha = (800 - (-200)) / (100 + 800) = 1000/900 > 1 → clamped to 1
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: -200, height: 100, left: 0, width: 200, right: 200, bottom: -100, x: 0, y: 0,
      toJSON: () => ({}),
    });
    scrollCounter(el, { to: 500, onComplete });
    scroll();
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  it('freeze at max with once: true', () => {
    const el = makeSpan();
    scroll(500);
    const inst = scrollCounter(el, { to: 100, once: true });
    scroll();
    raf.tick();
    const progressAtPeak = inst.getProgress();
    scroll(0);
    raf.tick();
    expect(inst.getProgress()).toBeGreaterThanOrEqual(progressAtPeak);
  });

  it('getProgress returns a value in [0,1] at start', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    expect(inst.getProgress()).toBeGreaterThanOrEqual(0);
    expect(inst.getProgress()).toBeLessThanOrEqual(1);
  });

  it('replay resets to from value', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { from: 10, to: 100 });
    inst.seek(1);
    inst.replay();
    expect(inst.getProgress()).toBe(0);
    expect(el.textContent).toBe('10');
  });

  it('pause stops rAF scheduling', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    scroll();
    raf.tick();
    const countBefore = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(countBefore);
  });

  it('resume restarts after pause', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    scroll();
    raf.tick();
    inst.pause();
    const countBefore = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('destroy stops listening for scroll', () => {
    const el = makeSpan();
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const inst = scrollCounter(el, { to: 100 });
    inst.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('sets --scroll-draw-progress CSS variable', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    inst.seek(0.4);
    expect(el.style.getPropertyValue('--scroll-draw-progress')).toBe('0.4');
  });

  it('handles prefers-reduced-motion by showing final value', () => {
    vi.stubGlobal('matchMedia', (_q: string) => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const el = makeSpan();
    scrollCounter(el, { to: 999 });
    expect(el.textContent).toBe('999');
  });

  it('accepts selector string', () => {
    const el = makeSpan();
    el.id = 'counter-test';
    expect(() => scrollCounter('#counter-test', { to: 50 })).not.toThrow();
  });

  it('clamps seek values', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    inst.seek(5);
    expect(inst.getProgress()).toBe(1);
    inst.seek(-1);
    expect(inst.getProgress()).toBe(0);
  });

  // Up to 2.23.2 once held the eased value: an elastic count from 0 to 1000
  // passed 1250 a fifth of the way in and stayed there. The element starts
  // below the fold here: rect top 1000, so the default window, top 80% → top
  // 20%, is [360, 840], and a fifth of it is y = 456.
  describe('once with an easing that overshoots or dips', () => {
    function belowTheFold(): HTMLSpanElement {
      const el = makeSpan();
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 1000, height: 100, left: 0, width: 200, right: 200, bottom: 1100, x: 0, y: 0,
        toJSON: () => ({}),
      });
      return el;
    }

    it('elastic passes the target on the way and ends exactly on it', () => {
      const el = belowTheFold();
      const inst = scrollCounter(el, { to: 1000, easing: 'elastic' });
      expect(el.textContent).toBe('0');
      scroll();
      scroll(456);
      raf.tick();
      expect(el.textContent).toBe('1250');
      scroll(900);
      raf.tick();
      expect(el.textContent).toBe('1000');
      expect(inst.getProgress()).toBe(1);
      scroll(0); // back: held
      raf.tick();
      expect(el.textContent).toBe('1000');
    });

    it('bounce keeps its dips while scrolling forward', () => {
      const el = belowTheFold();
      scrollCounter(el, { to: 1000, easing: 'bounce' });
      scroll();
      const seen: number[] = [];
      for (let y = 360; y <= 840; y += 8) {
        scroll(y);
        raf.tick();
        seen.push(Number(el.textContent));
      }
      expect(seen.some((n, i) => i > 0 && n < seen[i - 1])).toBe(true);
      expect(seen[seen.length - 1]).toBe(1000);
    });

    it('after seek(), once still holds the sought value as its floor', () => {
      const el = belowTheFold();
      const inst = scrollCounter(el, { to: 1000, easing: 'ease-in' });
      scroll();
      inst.seek(0.5);
      expect(el.textContent).toBe('500');
      inst.resume();
      scroll(504); // raw 0.3, eased 0.09: under the floor
      raf.tick();
      expect(el.textContent).toBe('500');
      scroll(744); // raw 0.8, eased 0.64
      raf.tick();
      expect(el.textContent).toBe('640');
    });
  });

  // `end: ''` was read as 'top bottom'. Blank is the default now: top 20%.
  // replay() set `paused` to false and requested no frame, so after pause() or
  // seek() the count stayed stopped, and resume() then returned early.
  // Window [−340, 140]; y 20 is three quarters in.
  describe('replay() restarts the frame loop', () => {
    it('after pause()', () => {
      const el = makeSpan();
      const inst = scrollCounter(el, { to: 100, easing: 'linear', once: false });
      scroll();
      raf.tick();
      inst.pause();
      raf.tick(); // a frame pause() could not cancel in this fake sees `paused` and stops
      inst.replay();
      expect(el.textContent).toBe('0');
      scroll(20);
      raf.tick();
      expect(inst.getProgress()).toBeCloseTo(0.75, 6);
      expect(el.textContent).toBe('75');
    });

    it('after seek()', () => {
      const el = makeSpan();
      const inst = scrollCounter(el, { to: 100, easing: 'linear' });
      scroll();
      raf.tick();
      inst.seek(0.3);
      raf.tick();
      inst.replay();
      scroll(20);
      raf.tick();
      expect(el.textContent).toBe('75');
    });

    it('does not start a second loop when it was running', () => {
      const el = makeSpan();
      const inst = scrollCounter(el, { to: 100 });
      scroll();
      inst.replay();
      // One loop: each frame requests the next, once.
      const frames = raf.schedule.mock.calls.length;
      raf.tick();
      expect(raf.schedule.mock.calls.length - frames).toBe(1);
    });
  });

  // destroy() left --scroll-draw-progress behind, where every other engine puts
  // the element back as it found it (core/motion-live).
  it('destroy() takes --scroll-draw-progress off the element', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    expect(el.style.getPropertyValue('--scroll-draw-progress')).not.toBe('');
    inst.destroy();
    expect(el.style.getPropertyValue('--scroll-draw-progress')).toBe('');
  });

  it('destroy() puts back a --scroll-draw-progress the page had set', () => {
    const el = makeSpan();
    el.style.setProperty('--scroll-draw-progress', '0.5');
    const inst = scrollCounter(el, { to: 100 });
    inst.seek(1);
    inst.destroy();
    expect(el.style.getPropertyValue('--scroll-draw-progress')).toBe('0.5');
  });

  it('a blank trigger is the default one', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100, easing: 'linear', once: false, trigger: { start: '', end: '' } });
    scroll();
    raf.tick();
    // rect top 300 at y 0: [300 − 640, 300 − 160] = [−340, 140], so 340 / 480 in.
    expect(inst.getProgress()).toBeCloseTo(340 / 480, 6);
  });
});

// ── 2.26.0: a CSS cubic-bezier() string is the curve it names ────────────────
// Every engine read a string as EASINGS[easing] ?? its default, so this ran as
// the default without a word. Same scroll position, three runs: the string,
// an independent solver of the same curve (bezierReference), and linear.

describe('scrollCounter — easing as a CSS string', () => {
  function alpha(easing: Easing): number {
    const inst = scrollCounter(makeSpan(), { to: 1000, easing, once: false });
    scroll();
    raf.tick();
    return inst.getProgress();
  }

  it('counts along the cubic-bezier() it names, not its ease-out default', () => {
    const css = alpha(SNAPPY);
    expect(css).toBeGreaterThan(0.05);
    expect(css).toBeLessThan(0.999);
    expect(css).toBeCloseTo(alpha(snappy), 6);
    expect(Math.abs(css - alpha('ease-out'))).toBeGreaterThan(0.02);
  });
});
