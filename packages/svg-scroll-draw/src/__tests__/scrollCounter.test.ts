import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollCounter } from '../counter';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSpan(): HTMLSpanElement {
  const el = document.createElement('span');
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

  cancel = vi.fn();

  tick() {
    const cb = this.queue.shift();
    cb?.(performance.now());
  }
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
    vi.stubGlobal('scrollY', 400); // within trigger range
    scrollCounter(el, { to: 1000 });
    FakeIO.instances[0].trigger(true);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  it('freeze at max with once: true', () => {
    const el = makeSpan();
    vi.stubGlobal('scrollY', 500);
    const inst = scrollCounter(el, { to: 100, once: true });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const progressAtPeak = inst.getProgress();
    vi.stubGlobal('scrollY', 0);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const countBefore = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(countBefore);
  });

  it('resume restarts after pause', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    inst.pause();
    const countBefore = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('destroy disconnects observer', () => {
    const el = makeSpan();
    const inst = scrollCounter(el, { to: 100 });
    inst.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
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
});
