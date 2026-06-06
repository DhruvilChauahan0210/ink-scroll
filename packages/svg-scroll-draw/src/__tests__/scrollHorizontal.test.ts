import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollHorizontal } from '../horizontal';

function makeTrack(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  Object.defineProperty(el, 'scrollWidth', { get: () => 3600, configurable: true });
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top: 0, height: 800, left: 0, width: 1200 }),
    configurable: true,
  });
  return el;
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

beforeEach(() => {
  FakeIO.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { cb(performance.now()); return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
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

describe('scrollHorizontal', () => {
  it('creates an IntersectionObserver for the track element', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    expect(FakeIO.instances.length).toBeGreaterThan(0);
    inst.destroy();
  });

  it('accepts explicit distance option', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    // Should not throw and should create an engine
    expect(FakeIO.instances.length).toBeGreaterThan(0);
    inst.destroy();
  });

  it('applies negative translateX on seek(1)', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    inst.seek(1);
    expect(el.style.transform).toContain('translateX(-2400px)');
    inst.destroy();
  });

  it('seek(0) applies translateX(0px)', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    inst.seek(0);
    expect(el.style.transform).toContain('translateX(0px)');
    inst.destroy();
  });

  it('returns NOOP for missing element', () => {
    const inst = scrollHorizontal('#no-exist');
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
    expect(() => inst.refresh()).not.toThrow();
  });

  it('refresh does not throw', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    expect(() => inst.refresh()).not.toThrow();
    inst.destroy();
  });

  it('pause and resume do not throw', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    expect(() => { inst.pause(); inst.resume(); }).not.toThrow();
    inst.destroy();
  });
});
