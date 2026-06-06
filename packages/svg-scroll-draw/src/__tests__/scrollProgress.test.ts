import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollProgress } from '../progress';

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
  queue: FrameRequestCallback[] = [];
  id = 0;
  schedule = vi.fn((cb: FrameRequestCallback) => { this.queue.push(cb); return ++this.id; });
  cancel   = vi.fn();
  tick()   { const cb = this.queue.shift(); cb?.(performance.now()); }
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(el.style.getPropertyValue('--scroll-progress-eased')).toBe('');
    inst.destroy();
  });

  it('calls onProgress callback with raw and eased values', () => {
    const onProgress = vi.fn();
    const el   = makeEl();
    const inst = scrollProgress(el, { onProgress });
    FakeIO.instances[0].trigger(true);
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
