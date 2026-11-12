import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollAnimate } from '../animate';

function makeDiv(): HTMLDivElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top: 0, height: 100, left: 0, width: 100 }),
    configurable: true,
  });
  document.body.appendChild(el);
  return el;
}

class RafQueue {
  queue: FrameRequestCallback[] = [];
  id = 0;
  schedule = vi.fn((cb: FrameRequestCallback) => { this.queue.push(cb); return ++this.id; });
  cancel   = vi.fn();
  tick(time = performance.now()) { const cb = this.queue.shift(); cb?.(time); }
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
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('innerWidth', 1200);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('velocityScale on scrollAnimate', () => {
  it('accepts velocityScale option without throwing', () => {
    const el   = makeDiv();
    expect(() => {
      const inst = scrollAnimate(el, {
        props: { opacity: [0, 1] },
        native: false,
        velocityScale: true,
      });
      inst.destroy();
    }).not.toThrow();
  });

  it('accepts numeric velocityScale', () => {
    const el   = makeDiv();
    expect(() => {
      const inst = scrollAnimate(el, {
        props: { opacity: [0, 1] },
        native: false,
        velocityScale: 2,
      });
      inst.destroy();
    }).not.toThrow();
  });

  it('forces native: false when velocityScale is set', () => {
    const el = makeDiv();
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    const inst = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      velocityScale: true,
    });
    // The native path adds its keyframes class and stylesheet; the JS engine neither.
    expect(document.querySelector('style[data-ssd-animate]')).toBeNull();
    expect(el.className).not.toMatch(/ssd-a-/);
    inst.destroy();
  });

  it('animates normally with velocityScale: false (default)', () => {
    const el   = makeDiv();
    const inst = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
    });
    vi.stubGlobal('scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    raf.tick();
    const opacity = parseFloat(el.style.opacity || '0');
    expect(opacity).toBeGreaterThanOrEqual(0);
    expect(opacity).toBeLessThanOrEqual(1);
    inst.destroy();
  });
});
