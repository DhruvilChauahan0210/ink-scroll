import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollReveal } from '../reveal';

// ── helpers ───────────────────────────────────────────────────────────────────

// Place element below the viewport so initAlpha = 0 (hasn't entered yet)
function makeEl(tag = 'div', top = 1200): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top, height: 100, left: 0, width: 200, bottom: top + 100, right: 200 }),
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
  observe    = vi.fn();
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

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollReveal', () => {
  it('returns NOOP for empty selector', () => {
    const inst = scrollReveal('#nothing-here');
    expect(() => inst.destroy()).not.toThrow();
  });

  it('creates one IntersectionObserver per element', () => {
    const els  = [makeEl(), makeEl(), makeEl()];
    const inst = scrollReveal(els);
    expect(FakeIO.instances.length).toBe(3);
    inst.destroy();
  });

  it('accepts a CSS selector string', () => {
    makeEl().className = 'rev-item';
    makeEl().className = 'rev-item';
    const inst = scrollReveal('.rev-item');
    expect(FakeIO.instances.length).toBe(2);
    inst.destroy();
  });

  it('accepts a NodeList', () => {
    makeEl().className = 'nl';
    makeEl().className = 'nl';
    const nl   = document.querySelectorAll('.nl');
    const inst = scrollReveal(nl);
    expect(FakeIO.instances.length).toBe(2);
    inst.destroy();
  });

  it('applies opacity:0 initial state for fadeUp preset (element below viewport)', () => {
    const el   = makeEl(); // top:1200 → below viewport → initAlpha = 0
    const inst = scrollReveal([el]);
    expect(el.style.opacity).toBe('0');
    inst.destroy();
  });

  it('applies translateY(32px) initial state for fadeUp preset', () => {
    const el   = makeEl();
    const inst = scrollReveal([el]);
    expect(el.style.transform).toContain('translateY(32px)');
    inst.destroy();
  });

  it('applies correct transform for fadeLeft preset', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { preset: 'fadeLeft' });
    expect(el.style.transform).toContain('translateX(32px)');
    inst.destroy();
  });

  it('applies correct transform for scale preset', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { preset: 'scale' });
    expect(el.style.transform).toContain('scale(0.88)');
    inst.destroy();
  });

  it('custom from overrides preset', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { from: { opacity: 0, y: 60 } });
    expect(el.style.transform).toContain('translateY(60px)');
    inst.destroy();
  });

  it('custom from merges with preset (preset base + from override)', () => {
    const el   = makeEl();
    // fadeUp base: y:32, opacity:0. Override y to 80.
    const inst = scrollReveal([el], { preset: 'fadeUp', from: { y: 80 } });
    expect(el.style.transform).toContain('translateY(80px)');
    inst.destroy();
  });

  it('destroy disconnects all observers', () => {
    const els  = [makeEl(), makeEl()];
    const inst = scrollReveal(els);
    inst.destroy();
    FakeIO.instances.forEach(io => expect(io.disconnect).toHaveBeenCalled());
  });

  it('does not throw in SSR (no window)', () => {
    const orig = global.window;
    // @ts-expect-error intentional
    delete global.window;
    expect(() => scrollReveal('.card')).not.toThrow();
    global.window = orig;
  });

  it('fires onEnter only for first element when scroll crosses into zone', () => {
    const onEnter = vi.fn();
    const els     = [makeEl(), makeEl(), makeEl()];
    const inst    = scrollReveal(els, { onEnter });

    // First tick: make element visible and seed prevRaw (scrollY=0, element at top:1200 → raw < 0)
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(onEnter).not.toHaveBeenCalled(); // first tick just seeds prevRaw

    // Push scroll past the trigger start so raw > 0 → onEnter fires
    vi.stubGlobal('scrollY', 600);
    raf.tick();
    expect(onEnter).toHaveBeenCalledTimes(1);

    // Triggering other IOs should NOT re-fire onEnter (they have no onEnter attached)
    FakeIO.instances[1].trigger(true);
    raf.tick();
    FakeIO.instances[2].trigger(true);
    raf.tick();
    expect(onEnter).toHaveBeenCalledTimes(1);

    inst.destroy();
  });

  it('stagger creates one engine per element', () => {
    const els  = Array.from({ length: 5 }, () => makeEl());
    const inst = scrollReveal(els, { stagger: 0.1 });
    expect(FakeIO.instances.length).toBe(5);
    inst.destroy();
  });

  it('once: true keeps final state after element enters', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { once: true });

    FakeIO.instances[0].trigger(true);
    // Scroll element into view
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 200, height: 100, left: 0, width: 200 }),
      configurable: true,
    });
    vi.stubGlobal('scrollY', 600);
    raf.tick();

    const opacityAfter = parseFloat(el.style.opacity || '0');
    expect(opacityAfter).toBeGreaterThan(0);
    inst.destroy();
  });
});
