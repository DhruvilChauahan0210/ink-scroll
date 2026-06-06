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
});

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
});
