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

  observe  = vi.fn();
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

  it('observes the element', () => {
    const el = makeDiv();
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(el);
  });

  it('applies opacity on scroll frame', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 200); // at trigger start
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    FakeIO.instances[0].trigger(true);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const transform = el.style.getPropertyValue('transform');
    expect(transform).toContain('translateY(');
  });

  it('sets --scroll-draw-progress CSS variable', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 400);
    scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    FakeIO.instances[0].trigger(true);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const progressAtEnd = inst.getProgress();
    vi.stubGlobal('scrollY', 0); // scroll back
    raf.tick();
    expect(inst.getProgress()).toBeGreaterThanOrEqual(progressAtEnd);
  });

  it('calls onProgress callback', () => {
    const el = makeDiv();
    const onProgress = vi.fn();
    vi.stubGlobal('scrollY', 400);
    scrollAnimate(el, { props: { opacity: [0, 1] }, onProgress, native: false });
    FakeIO.instances[0].trigger(true);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  it('pause stops rAF scheduling', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    FakeIO.instances[0].trigger(true);
    raf.tick(); // starts
    const countBefore = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(countBefore);
  });

  it('resume restarts rAF after pause', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    inst.pause();
    const countBefore = raf.schedule.mock.calls.length;
    inst.resume();
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(countBefore);
  });

  it('destroy disconnects observer', () => {
    const el = makeDiv();
    const inst = scrollAnimate(el, { props: { opacity: [0, 1] }, native: false });
    inst.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
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

// ── scrollParallax ────────────────────────────────────────────────────────────

describe('scrollParallax', () => {
  it('returns noop when element not found', () => {
    const inst = scrollParallax('#missing');
    expect(inst.getProgress()).toBe(0);
  });

  it('observes the element', () => {
    const el = makeDiv();
    scrollParallax(el, { speed: 0.3 });
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(el);
  });

  it('applies transform on scroll', () => {
    const el = makeDiv();
    vi.stubGlobal('scrollY', 100);
    scrollParallax(el, { speed: 0.5 });
    FakeIO.instances[0].trigger(true);
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

  it('destroy cleans up observer', () => {
    const el = makeDiv();
    const inst = scrollParallax(el);
    inst.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });
});
