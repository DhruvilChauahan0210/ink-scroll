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
  /** One frame: every callback queued before it, as a browser runs them. */
  tick()   { const frame = this.queue; this.queue = []; for (const cb of frame) cb(performance.now()); }
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

/** Scroll the page: the engines' frame loops wake on scroll events, as in a browser. */
function scroll(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
}

let raf: RafQueue;
/** How many animate engines were built: each listens for scroll on the window once. */
let built: () => number;

beforeEach(() => {
  const listen = vi.spyOn(window, 'addEventListener');
  built = () => listen.mock.calls.filter(([type]) => type === 'scroll').length;
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollReveal', () => {
  it('returns NOOP for empty selector', () => {
    const inst = scrollReveal('#nothing-here');
    expect(() => inst.destroy()).not.toThrow();
  });

  it('creates one engine per element', () => {
    const els  = [makeEl(), makeEl(), makeEl()];
    const inst = scrollReveal(els);
    expect(built()).toBe(3);
    inst.destroy();
  });

  it('accepts a CSS selector string', () => {
    makeEl().className = 'rev-item';
    makeEl().className = 'rev-item';
    const inst = scrollReveal('.rev-item');
    expect(built()).toBe(2);
    inst.destroy();
  });

  it('accepts a NodeList', () => {
    makeEl().className = 'nl';
    makeEl().className = 'nl';
    const nl   = document.querySelectorAll('.nl');
    const inst = scrollReveal(nl);
    expect(built()).toBe(2);
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

    // First frame: seeds prevRaw (scrollY=0, element at top:1200 → raw < 0)
    raf.tick();
    expect(onEnter).not.toHaveBeenCalled(); // first tick just seeds prevRaw

    // Push scroll past the trigger start so raw > 0 → onEnter fires
    scroll(600);
    raf.tick();
    expect(onEnter).toHaveBeenCalledTimes(1);

    // Further frames of the other elements should NOT re-fire onEnter (they have no onEnter attached)
    scroll(700);
    raf.tick();
    raf.tick();
    expect(onEnter).toHaveBeenCalledTimes(1);

    inst.destroy();
  });

  it('stagger creates one engine per element', () => {
    const els  = Array.from({ length: 5 }, () => makeEl());
    const inst = scrollReveal(els, { stagger: 0.1 });
    expect(built()).toBe(5);
    inst.destroy();
  });

  it('once: true keeps final state after element enters', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { once: true });

    // Scroll element into view
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 200, height: 100, left: 0, width: 200 }),
      configurable: true,
    });
    scroll(600);
    raf.tick();

    const opacityAfter = parseFloat(el.style.opacity || '0');
    expect(opacityAfter).toBeGreaterThan(0);
    inst.destroy();
  });

  // scrollReveal is scrollAnimate with once: true. Up to 2.23.2 that held the
  // eased value, so an elastic fadeUp stayed 8px above its place (32 → 0 at
  // 1.25 is −8) for good. Window [496, 776]; elastic peaks a fifth in, at 552.
  it('an elastic reveal overshoots on the way, and ends in its place', () => {
    const el   = makeEl();
    const inst = scrollReveal([el], { easing: 'elastic' });
    scroll(552);
    raf.tick();
    expect(el.style.transform).toContain('translateY(-8px)');
    scroll(900);
    raf.tick();
    expect(el.style.transform).toContain('translateY(0px)');
    expect(el.style.opacity).toBe('1');
    inst.destroy();
  });
});
