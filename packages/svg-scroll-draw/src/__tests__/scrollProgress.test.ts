import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollProgress } from '../progress';
import { SNAPPY, snappy } from './bezierReference';
import type { Easing } from '../core/types';

function makeEl(top = 0): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top, height: 200, left: 0, width: 400 }),
    configurable: true,
  });
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
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; FakeIO.instances.push(this); }
  observe = vi.fn();
  disconnect = vi.fn();
  trigger(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

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
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('innerWidth', 1200);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('scrollProgress', () => {
  it('sets --scroll-progress CSS variable on element', () => {
    const el   = makeEl();
    const inst = scrollProgress(el);
    expect(el.style.getPropertyValue('--scroll-progress')).not.toBe('');
    inst.destroy();
  });

  it('sets --scroll-progress-eased CSS variable by default', () => {
    const el   = makeEl();
    const inst = scrollProgress(el);
    expect(el.style.getPropertyValue('--scroll-progress-eased')).not.toBe('');
    inst.destroy();
  });

  it('respects custom variable name', () => {
    const el   = makeEl();
    const inst = scrollProgress(el, { variable: '--my-progress' });
    expect(el.style.getPropertyValue('--my-progress')).not.toBe('');
    inst.destroy();
  });

  it('skips eased variable when easedVariable is null', () => {
    const el   = makeEl();
    const inst = scrollProgress(el, { easedVariable: null });
    scroll();
    raf.tick();
    expect(el.style.getPropertyValue('--scroll-progress-eased')).toBe('');
    inst.destroy();
  });

  it('calls onProgress callback with raw and eased values', () => {
    const onProgress = vi.fn();
    const el   = makeEl();
    const inst = scrollProgress(el, { onProgress });
    scroll();
    raf.tick();
    expect(onProgress).toHaveBeenCalled();
    const [raw, eased] = onProgress.mock.calls[0];
    expect(typeof raw).toBe('number');
    expect(typeof eased).toBe('number');
    inst.destroy();
  });

  it('removes CSS variables on destroy', () => {
    const el   = makeEl();
    const inst = scrollProgress(el);
    inst.destroy();
    expect(el.style.getPropertyValue('--scroll-progress')).toBe('');
    expect(el.style.getPropertyValue('--scroll-progress-eased')).toBe('');
  });

  it('seek sets progress and pauses', () => {
    const el   = makeEl();
    const inst = scrollProgress(el);
    inst.seek(0.5);
    const val = parseFloat(el.style.getPropertyValue('--scroll-progress'));
    expect(val).toBeCloseTo(0.5, 2);
    inst.destroy();
  });

  it('returns NOOP for missing element', () => {
    const inst = scrollProgress('#no-exist');
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
  });

  it('returns NOOP in SSR', () => {
    const orig = global.window;
    // @ts-expect-error intentional
    delete global.window;
    expect(() => scrollProgress('#el')).not.toThrow();
    global.window = orig;
  });
});

// ── 2.26.0: a CSS cubic-bezier() string is the curve it names ────────────────
// Every engine read a string as EASINGS[easing] ?? its default, so this ran as
// the default without a word. Same scroll position, three runs: the string,
// an independent solver of the same curve (bezierReference), and linear.

describe('scrollProgress — easing as a CSS string', () => {
  function eased(easing: Easing): number {
    let last = NaN;
    scrollProgress(makeEl(300), { easing, onProgress: (_raw, e) => { last = e; } });
    scroll();
    raf.tick();
    return last;
  }

  it('eases with the cubic-bezier() it names, not linear', () => {
    const css = eased(SNAPPY);
    expect(css).toBeGreaterThan(0.05);
    expect(css).toBeLessThan(0.99);
    expect(css).toBeCloseTo(eased(snappy), 6);
    expect(Math.abs(css - eased('linear'))).toBeGreaterThan(0.05);
  });
});
