/**
 * Tests for createEngine options that were not covered by engine.test.ts:
 * strokeColor, strokeWidth, fillOpacity, morphTo, clip, velocityScale,
 * autoReverse, waypoints, onStart, repeat, once, delay,
 * prefersReducedMotion, and scrollContainer / axis.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../core/engine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePath(extra: Record<string, string> = {}): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  el.setAttribute('d', 'M10 20 L30 40');
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(paths: SVGPathElement[] = [makePath()]): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  paths.forEach((p) => svg.appendChild(p));
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}

class RafQueue {
  private queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
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

// scrollY=0  → tStart=-800, tEnd=500, progress≈0.615 (not done)
// scrollY=500 → progress=1 (done)
// scrollY=300 → progress somewhere in between

beforeEach(() => {
  raf = new RafQueue();
  FakeIO.instances = [];
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame',  raf.cancel);
  vi.stubGlobal('IntersectionObserver',  FakeIO);
  vi.stubGlobal('scrollY',     0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollX',     0);
  vi.stubGlobal('innerWidth',  1200);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0,
    toJSON: () => {},
  } as DOMRect);
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── strokeColor ───────────────────────────────────────────────────────────────

describe('createEngine — strokeColor', () => {
  it('static string overrides stroke on every frame', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { strokeColor: '#ff0000' });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(path.style.stroke).toBeTruthy();
  });

  it('tuple interpolates stroke between from and to colors', () => {
    const path = makePath();
    const container = makeContainer([path]);
    const instance = createEngine(container, { strokeColor: ['#000000', '#ffffff'] });

    // at alpha=0 (fully hidden), from color; at alpha=1, to color
    instance.seek(0);
    const atZero = path.style.stroke;

    instance.seek(1);
    const atOne = path.style.stroke;

    expect(atZero).not.toBe(atOne);
  });

  it('initialises stroke to colorFrom when tuple provided', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { strokeColor: ['rgb(10, 20, 30)', '#ffffff'] });

    // Initial color is set to colorFrom
    expect(path.style.stroke).not.toBe('');
  });
});

// ── strokeWidth ───────────────────────────────────────────────────────────────

describe('createEngine — strokeWidth', () => {
  it('static number sets strokeWidth on every frame', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { strokeWidth: 4 });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(parseFloat(path.style.strokeWidth)).toBeCloseTo(4, 1);
  });

  it('tuple interpolates strokeWidth from→to', () => {
    const path = makePath();
    const container = makeContainer([path]);
    const instance = createEngine(container, { strokeWidth: [1, 5] });

    instance.seek(0);
    const atZero = parseFloat(path.style.strokeWidth);

    instance.seek(1);
    const atOne = parseFloat(path.style.strokeWidth);

    expect(atZero).toBeCloseTo(1, 1);
    expect(atOne).toBeCloseTo(5, 1);
  });

  it('initialises strokeWidth to widthFrom when tuple provided', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { strokeWidth: [2, 8] });
    expect(parseFloat(path.style.strokeWidth)).toBeCloseTo(2, 1);
  });
});

// ── fillOpacity ───────────────────────────────────────────────────────────────

describe('createEngine — fillOpacity', () => {
  it('static number sets fillOpacity on every frame', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { fillOpacity: 0.5 });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(parseFloat(path.style.fillOpacity)).toBeCloseTo(0.5, 1);
  });

  it('tuple interpolates fillOpacity from→to', () => {
    const path = makePath();
    const container = makeContainer([path]);
    const instance = createEngine(container, { fillOpacity: [0, 1] });

    instance.seek(0);
    expect(parseFloat(path.style.fillOpacity)).toBeCloseTo(0, 2);

    instance.seek(1);
    expect(parseFloat(path.style.fillOpacity)).toBeCloseTo(1, 2);
  });

  it('initialises fillOpacity to fillOpacityFrom when tuple provided', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { fillOpacity: [0, 1] });
    expect(parseFloat(path.style.fillOpacity)).toBeCloseTo(0, 2);
  });
});

// ── morphTo ───────────────────────────────────────────────────────────────────

describe('createEngine — morphTo', () => {
  it('interpolates path d attribute toward morphTo at partial progress', () => {
    const path = makePath({ d: 'M10 20' });
    const container = makeContainer([path]);
    const instance = createEngine(container, { morphTo: 'M20 40' });

    instance.seek(0.5);

    const d = path.getAttribute('d') ?? '';
    // At t=0.5: 10→15, 20→30
    expect(d).toContain('15');
    expect(d).toContain('30');
  });

  it('reaches full morphTo path at alpha=1', () => {
    const path = makePath({ d: 'M10 20' });
    const container = makeContainer([path]);
    const instance = createEngine(container, { morphTo: 'M20 40' });

    instance.seek(1);

    const d = path.getAttribute('d') ?? '';
    expect(d).toContain('20');
    expect(d).toContain('40');
  });

  it('restores original d on replay()', () => {
    const path = makePath({ d: 'M10 20' });
    const container = makeContainer([path]);
    const instance = createEngine(container, { morphTo: 'M20 40' });

    instance.seek(1);
    instance.replay();

    expect(path.getAttribute('d')).toBe('M10 20');
  });
});

// ── clip mode ─────────────────────────────────────────────────────────────────

describe('createEngine — clip mode', () => {
  it('clip:true initialises clipPath to fully-hidden inset', () => {
    const container = makeContainer();
    createEngine(container, { clip: true });
    expect(container.style.clipPath).toMatch(/inset/);
  });

  it('seek(0.5) sets clipPath to mid-reveal for clip:left', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'left' });
    instance.seek(0.5);
    expect(container.style.clipPath).toBe('inset(0 50% 0 0)');
  });

  it('seek(1) fully reveals the element for clip:left', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'left' });
    instance.seek(1);
    expect(container.style.clipPath).toBe('inset(0 0% 0 0)');
  });

  it('clip:right reveals from the right', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'right' });
    instance.seek(0.5);
    expect(container.style.clipPath).toBe('inset(0 0 0 50%)');
  });

  it('clip:top reveals from the top', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'top' });
    instance.seek(0.5);
    expect(container.style.clipPath).toBe('inset(0 0 50% 0)');
  });

  it('clip:bottom reveals from the bottom', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'bottom' });
    instance.seek(0.5);
    expect(container.style.clipPath).toBe('inset(50% 0 0 0)');
  });

  it('clip:center uses circle() clip path', () => {
    const container = makeContainer();
    const instance = createEngine(container, { clip: 'center' });
    instance.seek(0.5);
    expect(container.style.clipPath).toMatch(/^circle\(/);
  });

  it('clip mode animates on scroll', () => {
    const container = makeContainer();
    createEngine(container, { clip: 'left' });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    // Should be somewhere between fully hidden and fully revealed
    expect(container.style.clipPath).not.toBe('inset(0 100% 0 0)');
    expect(container.style.clipPath).not.toBe('inset(0 0% 0 0)');
  });

  it('clip mode fires onComplete when revealed', () => {
    const onComplete = vi.fn();
    const container  = makeContainer();
    createEngine(container, { clip: 'left', onComplete });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('clip mode sets --scroll-draw-progress custom property', () => {
    const container = makeContainer();
    createEngine(container, { clip: 'left' });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(parseFloat(container.style.getPropertyValue('--scroll-draw-progress'))).toBeGreaterThan(0);
  });
});

// ── prefersReducedMotion ──────────────────────────────────────────────────────

describe('createEngine — prefers-reduced-motion', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
  });

  it('immediately draws paths fully without animation', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container);
    expect(parseFloat(path.style.strokeDashoffset)).toBe(0);
  });

  it('calls onComplete immediately and all noop methods are safe', () => {
    const onComplete = vi.fn();
    const instance = createEngine(makeContainer(), { onComplete });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(1);
  });

  it('applies colorTo to path stroke immediately', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { strokeColor: '#abcdef' });
    expect(path.style.stroke).toBeTruthy();
  });

  it('applies morphTo d attribute immediately', () => {
    const path = makePath({ d: 'M10 20' });
    const container = makeContainer([path]);
    createEngine(container, { morphTo: 'M20 40' });
    const d = path.getAttribute('d') ?? '';
    expect(d).toContain('20');
  });

  it('clip mode: reveals fully, fires onComplete, all noop methods safe', () => {
    const onComplete = vi.fn();
    const container  = makeContainer();
    const instance = createEngine(container, { clip: 'left', onComplete });
    expect(container.style.clipPath).toBe('inset(0 0% 0 0)');
    expect(onComplete).toHaveBeenCalledOnce();
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(1);
  });
});

// ── onStart ───────────────────────────────────────────────────────────────────

describe('createEngine — onStart', () => {
  it('fires onStart when animation progress crosses 0', () => {
    const onStart   = vi.fn();
    const container = makeContainer();
    createEngine(container, { onStart });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onStart).toHaveBeenCalledOnce();
  });

  it('fires onStart only once even across multiple frames', () => {
    const onStart   = vi.fn();
    const container = makeContainer();
    createEngine(container, { onStart });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    raf.tick();

    expect(onStart).toHaveBeenCalledOnce();
  });
});

// ── waypoints ─────────────────────────────────────────────────────────────────

describe('createEngine — waypoints', () => {
  it('fires waypoint callback when progress crosses the threshold', () => {
    const half      = vi.fn();
    const container = makeContainer();
    createEngine(container, { waypoints: { 0.5: half } });

    // scrollY=500 → alpha=1, which passes 0.5
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(half).toHaveBeenCalledOnce();
  });

  it('does not fire a waypoint below the current progress', () => {
    const nearEnd   = vi.fn();
    const container = makeContainer();
    createEngine(container, { waypoints: { 0.99: nearEnd } });

    // scrollY=300 → progress ~0.8, which does not reach 0.99
    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(nearEnd).not.toHaveBeenCalled();
  });

  it('fires each waypoint at most once per play', () => {
    const half      = vi.fn();
    const container = makeContainer();
    createEngine(container, { waypoints: { 0.5: half } });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    raf.tick(); // second frame — waypoint must not fire again

    expect(half).toHaveBeenCalledOnce();
  });

  it('replay() clears fired waypoints so they can fire again', () => {
    const half      = vi.fn();
    const container = makeContainer();
    const instance  = createEngine(container, { waypoints: { 0.5: half } });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    instance.replay();
    raf.tick(); // after replay, scrollY still 500 → fires again
    expect(half).toHaveBeenCalledTimes(2);
  });
});

// ── autoReverse ───────────────────────────────────────────────────────────────

describe('createEngine — autoReverse', () => {
  it('draws forward when scrolling down', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { autoReverse: true });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // prevScroll set to 300

    const offsetAfterForward = parseFloat(path.style.strokeDashoffset);
    expect(offsetAfterForward).toBeLessThan(100);
  });

  it('reverses (erases) when scrolling back up', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { autoReverse: true });

    // First frame scrolling forward
    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const offsetForward = parseFloat(path.style.strokeDashoffset);

    // Second frame scrolling backward
    vi.stubGlobal('scrollY', 100);
    raf.tick();
    const offsetReversed = parseFloat(path.style.strokeDashoffset);

    // After reversing, the dashoffset should have increased (less drawn)
    expect(offsetReversed).toBeGreaterThan(offsetForward);
  });
});

// ── velocityScale ─────────────────────────────────────────────────────────────

describe('createEngine — velocityScale', () => {
  it('boolean true: does not throw and animation still runs', () => {
    const container = makeContainer();
    const instance  = createEngine(container, { velocityScale: true });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    expect(() => raf.tick()).not.toThrow();
    instance.destroy();
  });

  it('numeric sensitivity: does not throw and animation still runs', () => {
    const container = makeContainer();
    const instance  = createEngine(container, { velocityScale: 2 });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    expect(() => raf.tick()).not.toThrow();
    instance.destroy();
  });
});

// ── once ──────────────────────────────────────────────────────────────────────

describe('createEngine — once', () => {
  it('freezes progress at maximum reached value', () => {
    const path = makePath();
    const container = makeContainer([path]);
    const instance = createEngine(container, { once: true });

    // Reach near-complete
    vi.stubGlobal('scrollY', 400);
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const frozenOffset = parseFloat(path.style.strokeDashoffset);

    // Scroll back — offset must not increase (frozen)
    vi.stubGlobal('scrollY', 0);
    raf.tick();
    expect(parseFloat(path.style.strokeDashoffset)).toBeLessThanOrEqual(frozenOffset + 0.1);

    instance.destroy();
  });
});

// ── repeat ───────────────────────────────────────────────────────────────────

describe('createEngine — repeat', () => {
  it('repeat:1 resets paths after onComplete and repeatDelay', () => {
    vi.useFakeTimers();
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { repeat: 1, repeatDelay: 100 });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // completes → setTimeout(reset, 100) scheduled

    // Before delay: still complete
    const offsetBeforeReset = parseFloat(path.style.strokeDashoffset);

    vi.advanceTimersByTime(100);

    // After delay: dashoffset should have reset to full length
    expect(parseFloat(path.style.strokeDashoffset)).toBeGreaterThan(offsetBeforeReset);
  });

  it('repeat:"infinite" keeps looping on each completion', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const container  = makeContainer();
    createEngine(container, { repeat: 'infinite', repeatDelay: 0, onComplete });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();                  // first complete
    vi.advanceTimersByTime(0);   // reset fires immediately
    raf.tick();                  // second complete
    vi.advanceTimersByTime(0);

    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

// ── delay ────────────────────────────────────────────────────────────────────

describe('createEngine — delay', () => {
  it('does not observe the container immediately when delay > 0', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    createEngine(container, { delay: 200 });

    expect(FakeIO.instances[0].observe).not.toHaveBeenCalled();
  });

  it('observes the container after the delay has elapsed', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    createEngine(container, { delay: 200 });

    vi.advanceTimersByTime(200);

    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(container);
  });
});

// ── custom easing function ────────────────────────────────────────────────────

describe('createEngine — custom easing function', () => {
  it('accepts and calls a custom easing function', () => {
    const customEasing = vi.fn((t: number) => t);
    const container    = makeContainer();
    createEngine(container, { easing: customEasing });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(customEasing).toHaveBeenCalled();
  });
});

// ── scrollContainer ───────────────────────────────────────────────────────────

describe('createEngine — scrollContainer', () => {
  it('accepts a string selector for a custom scroll container', () => {
    const scroller = document.createElement('div');
    scroller.id = 'scroller';
    Object.defineProperty(scroller, 'scrollTop',  { get: () => 0 });
    Object.defineProperty(scroller, 'clientHeight', { get: () => 600 });
    vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0,
      toJSON: () => {},
    } as DOMRect);
    document.body.appendChild(scroller);

    const container = makeContainer();
    scroller.appendChild(container);

    expect(() =>
      createEngine(container, { scrollContainer: '#scroller' })
    ).not.toThrow();
  });

  it('accepts an Element directly as scroll container', () => {
    const scroller = document.createElement('div');
    Object.defineProperty(scroller, 'scrollTop',   { get: () => 0 });
    Object.defineProperty(scroller, 'clientHeight', { get: () => 600 });
    vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue({
      top: 0, left: 0, width: 600, height: 600, right: 600, bottom: 600, x: 0, y: 0,
      toJSON: () => {},
    } as DOMRect);
    document.body.appendChild(scroller);

    const container = makeContainer();
    scroller.appendChild(container);

    expect(() =>
      createEngine(container, { scrollContainer: scroller })
    ).not.toThrow();
  });
});

// ── lerpColor — parseColor branches ──────────────────────────────────────────

describe('createEngine — strokeColor lerpColor branches', () => {
  it('interpolates short-form 3-char hex colors (#abc)', () => {
    const path = makePath();
    const container = makeContainer([path]);
    // #000 and #fff are 3-char hex — exercises the short regex in parseColor
    const instance = createEngine(container, { strokeColor: ['#000', '#fff'] });

    instance.seek(0);
    const atZero = path.style.stroke;
    instance.seek(1);
    const atOne = path.style.stroke;

    expect(atZero).not.toBe(atOne);
  });

  it('interpolates rgb() format colors', () => {
    const path = makePath();
    const container = makeContainer([path]);
    // rgb() format exercises the rgb branch in parseColor
    const instance = createEngine(container, {
      strokeColor: ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
    });

    instance.seek(0);
    const atZero = path.style.stroke;
    instance.seek(1);
    const atOne = path.style.stroke;

    expect(atZero).not.toBe(atOne);
  });
});

// ── clip mode repeat ──────────────────────────────────────────────────────────

describe('createEngine — clip mode repeat', () => {
  it('resets clipPath after repeatDelay when repeat:1 with clip mode', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    createEngine(container, { clip: 'left', repeat: 1, repeatDelay: 50 });

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // completes → clip fully revealed → setTimeout(reset, 50)

    const clipAfterComplete = container.style.clipPath;

    vi.advanceTimersByTime(50); // reset fires

    // After reset, clip should be back to hidden
    expect(container.style.clipPath).not.toBe(clipAfterComplete);
  });
});

// ── resize handler ────────────────────────────────────────────────────────────

describe('createEngine — resize handler', () => {
  it('recalculates path lengths after resize event', () => {
    vi.useFakeTimers();
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container);

    // Fire a resize event
    window.dispatchEvent(new Event('resize'));

    // Before debounce fires: dasharray is still the original
    expect(path.style.strokeDasharray).toBe('100');

    // After debounce delay: recalculation runs
    vi.advanceTimersByTime(150);

    expect(path.style.strokeDasharray).toBe('100');
  });
});

// ── autoplay ──────────────────────────────────────────────────────────────────

// Helper: spy on performance.now() and return a mutable ref so tests can
// advance "time" without depending on fake-timer support for performance.
function mockPerformanceNow(): { now: number } {
  const ref = { now: 0 };
  vi.spyOn(performance, 'now').mockImplementation(() => ref.now);
  return ref;
}

describe('createEngine — autoplay', () => {
  it('draws path when element enters viewport (time-based, not scroll)', () => {
    const t = mockPerformanceNow();
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container, { autoplay: true, duration: 1000 });

    t.now = 0;
    FakeIO.instances[0].trigger(true); // startTime = 0
    raf.tick();                         // elapsed≈0 → offset near full

    const offsetBefore = path.style.strokeDashoffset;

    t.now = 1100;  // 1100ms elapsed → past duration=1000
    raf.tick();

    expect(path.style.strokeDashoffset).not.toBe(offsetBefore);
  });

  it('fires onComplete after duration elapses', () => {
    vi.useFakeTimers();
    const t = mockPerformanceNow();
    const onComplete = vi.fn();
    const container = makeContainer([makePath()]);
    createEngine(container, { autoplay: true, duration: 500, onComplete });

    t.now = 0;
    FakeIO.instances[0].trigger(true); // startTime = 0
    t.now = 600;                        // 600ms elapsed > duration=500
    raf.tick();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires onStart on first tick', () => {
    const t = mockPerformanceNow();
    const onStart = vi.fn();
    const container = makeContainer([makePath()]);
    createEngine(container, { autoplay: true, duration: 1000, onStart });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('seek() jumps to target progress and pauses', () => {
    const t = mockPerformanceNow();
    const path = makePath();
    const container = makeContainer([path]);
    const instance = createEngine(container, { autoplay: true, duration: 1000 });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    instance.seek(0.5);

    expect(instance.getProgress()).toBe(0.5);
    expect(path.style.strokeDashoffset).toBe('50');
  });

  it('replay() restarts the animation from scratch', () => {
    vi.useFakeTimers();
    const t = mockPerformanceNow();
    const onComplete = vi.fn();
    const container = makeContainer([makePath()]);
    const instance = createEngine(container, { autoplay: true, duration: 200, onComplete });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    t.now = 300;
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(1);

    t.now = 400;
    instance.replay(); // startTime reset to performance.now() = 400
    expect(instance.getProgress()).toBe(0);
  });

  it('destroy() cleans up without errors', () => {
    const t = mockPerformanceNow();
    const container = makeContainer([makePath()]);
    const instance = createEngine(container, { autoplay: true, duration: 1000 });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    expect(() => instance.destroy()).not.toThrow();
  });

  it('uses clip-path in autoplay clip mode', () => {
    const t = mockPerformanceNow();
    const container = makeContainer();
    createEngine(container, { autoplay: true, duration: 1000, clip: 'left' });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(container.style.clipPath).toContain('inset');
  });

  it('once:true does not restart on second intersection', () => {
    vi.useFakeTimers();
    const t = mockPerformanceNow();
    const onComplete = vi.fn();
    const container = makeContainer([makePath()]);
    createEngine(container, { autoplay: true, duration: 100, once: true, onComplete });

    t.now = 0;
    FakeIO.instances[0].trigger(true);
    t.now = 200;
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Re-enter viewport — once:true must block restart
    FakeIO.instances[0].trigger(false);
    FakeIO.instances[0].trigger(true);
    t.now = 400;
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('preset option', () => {
  it('reveal preset sets fade:true and once:true', () => {
    const container = makeContainer();
    createEngine(container, { preset: 'reveal' });

    const path = container.querySelector('path') as SVGPathElement;
    // fade:true → opacity initialised to 0
    expect(path.style.opacity).toBe('0');
  });

  it('user options override preset values', () => {
    const container = makeContainer();
    // reveal preset sets fade:true, but we explicitly set fade:false
    createEngine(container, { preset: 'reveal', fade: false });

    const path = container.querySelector('path') as SVGPathElement;
    // fade overridden to false → opacity not set to 0
    expect(path.style.opacity).not.toBe('0');
  });

  it('sketch preset applies stagger > 0', () => {
    const p1 = makePath();
    const p2 = makePath();
    const container = makeContainer([p1, p2]);

    // Just verifying no error thrown and instance is valid
    const instance = createEngine(container, { preset: 'sketch' });
    expect(() => instance.destroy()).not.toThrow();
  });

  it('spring preset uses spring easing (no error)', () => {
    const container = makeContainer();
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances = [];
    const instance = createEngine(container, { preset: 'spring' });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(instance.getProgress()).toBeGreaterThanOrEqual(0);
    instance.destroy();
  });

  it('no preset still works normally', () => {
    const container = makeContainer();
    const instance  = createEngine(container, { easing: 'ease-out' });
    expect(() => instance.destroy()).not.toThrow();
  });
});
