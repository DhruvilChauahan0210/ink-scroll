import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../core/engine';
import { scrollDraw } from '../index';
import { SNAPPY, snappy } from './bezierReference';
import type { Easing } from '../core/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSvgPath(attrs: Record<string, string> = {}): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  Object.entries({ stroke: 'black', ...attrs }).forEach(([k, v]) => el.setAttribute(k, v));
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(paths: SVGPathElement[] = []): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  paths.forEach((p) => svg.appendChild(p));
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}

// Queue-based rAF: stores callbacks without calling them, letting tests drain
// exactly one frame at a time — avoids the update→rAF→update infinite loop.
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

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }

  observe = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting: boolean) {
    this.cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

// ── setup / teardown ─────────────────────────────────────────────────────────

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
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0,
    toJSON: () => {},
  } as DOMRect);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('createEngine — SSR guard', () => {
  it('all noop methods are safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const instance = createEngine(document.createElement('div'));
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });
});

describe('createEngine — initialization', () => {
  it('sets strokeDasharray and strokeDashoffset to path length', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container);
    expect(path.style.strokeDasharray).toBe('100 200');
    expect(path.style.strokeDashoffset).toBe('100');
  });

  // 2.26.0: the dash was `len len`. At offset len the next dash then starts
  // exactly on the path's end, and WebKit paints that zero-length dash, so a
  // round cap showed as a dot at the end of every undrawn path.
  it('leaves a gap at least twice the line, so every offset from 0 to len ends inside it', () => {
    const path = makeSvgPath();
    const instance = createEngine(makeContainer([path]));
    const check = () => {
      const [dash, gap] = path.style.strokeDasharray.split(' ').map(Number);
      expect(dash).toBe(100);
      expect(gap).toBeGreaterThanOrEqual(2 * dash);
    };
    check();
    instance.seek(0.5);
    check();
    instance.refresh!();
    check();
  });

  it('sets opacity to 0 when fade=true', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container, { fade: true });
    expect(path.style.opacity).toBe('0');
  });

  it('leaves opacity untouched when fade=false', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container, { fade: false });
    expect(path.style.opacity).toBe('');
  });

  it('listens for scroll on the window, and keeps no IntersectionObserver', () => {
    const container = makeContainer([makeSvgPath()]);
    const listen = vi.spyOn(window, 'addEventListener');
    createEngine(container);
    expect(listen).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(FakeIO.instances).toHaveLength(0);
  });
});

describe('createEngine — warnings', () => {
  it('warns when element has no stroke attribute', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath();
    path.removeAttribute('stroke');
    const container = makeContainer([path]);
    createEngine(container);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('no stroke');
  });

  it('does not warn when the stroke comes from a CSS class', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const style = document.createElement('style');
    style.textContent = '.ssd-css-stroke { stroke: currentColor; }';
    document.head.appendChild(style);
    const path = makeSvgPath();
    path.removeAttribute('stroke');
    path.setAttribute('class', 'ssd-css-stroke');
    const container = makeContainer([path]);
    document.body.appendChild(container);
    createEngine(container);
    expect(spy.mock.calls.filter((c) => String(c[0]).includes('no stroke'))).toHaveLength(0);
    container.remove();
    style.remove();
  });

  it('warns when CSS sets stroke: none over a stroke attribute', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath({ stroke: 'black' });
    path.style.stroke = 'none';
    const container = makeContainer([path]);
    document.body.appendChild(container);
    createEngine(container);
    expect(spy.mock.calls.some((c) => String(c[0]).includes('no stroke'))).toBe(true);
    container.remove();
  });

  it('does not warn about a fill attribute that CSS turns off', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath({ stroke: 'black', fill: 'red' });
    path.style.fill = 'none';
    const container = makeContainer([path]);
    document.body.appendChild(container);
    createEngine(container);
    expect(spy.mock.calls.filter((c) => String(c[0]).includes('fill'))).toHaveLength(0);
    container.remove();
  });

  it('warns when element has a non-none fill', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath({ stroke: 'black', fill: 'red' });
    const container = makeContainer([path]);
    createEngine(container);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('fill');
  });

  it('does not warn for fill="none"', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath({ stroke: 'black', fill: 'none' });
    const container = makeContainer([path]);
    createEngine(container);
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not warn for fill="transparent"', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const path = makeSvgPath({ stroke: 'black', fill: 'transparent' });
    const container = makeContainer([path]);
    createEngine(container);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('createEngine — scroll update', () => {
  it('reduces strokeDashoffset toward 0 as scroll increases', () => {
    // Engine init at scrollY=0; set scrollY=300 (midway through tStart=-800→tEnd=500)
    // so progress > 0 and dashoffset < initial length of 100.
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container);

    scroll(300);
    raf.tick();

    const offset = parseFloat(path.style.strokeDashoffset);
    expect(offset).toBeLessThan(100);
  });

  it('fires onComplete exactly once when fully drawn', () => {
    // Engine caches triggers at scrollY=0: tStart=-800, tEnd=500 (rect top=0, h=500, vp=800).
    // Set scrollY=500 before triggering so progress = (500-(-800))/(500-(-800)) = 1.
    const onComplete = vi.fn();
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container, { onComplete });

    scroll(500);
    raf.tick();

    expect(onComplete).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('does not fire onComplete when not fully drawn', () => {
    // scrollY=0 → progress ≈ 0.615 (before tEnd), no completion.
    const onComplete = vi.fn();
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container, { onComplete });

    scroll();
    raf.tick();

    expect(onComplete).not.toHaveBeenCalled();
    instance.destroy();
  });
});

describe('createEngine — destroy', () => {
  it('stops listening for scroll', () => {
    const container = makeContainer([makeSvgPath()]);
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const instance = createEngine(container);
    instance.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('removes resize and orientationchange listeners', () => {
    const container = makeContainer([makeSvgPath()]);
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const instance = createEngine(container);
    instance.destroy();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('cancels the pending animation frame', () => {
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container);
    scroll(); // schedules a frame
    instance.destroy();
    expect(raf.cancel).toHaveBeenCalled();
  });
});

describe('createEngine — direction reverse', () => {
  it('initialises strokeDashoffset to 0 (fully drawn) when direction=reverse', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container, { direction: 'reverse' });
    expect(path.style.strokeDashoffset).toBe('0');
  });

  it('increases strokeDashoffset as scroll increases when direction=reverse', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);
    createEngine(container, { direction: 'reverse' });

    scroll(300);
    raf.tick();

    const offset = parseFloat(path.style.strokeDashoffset);
    expect(offset).toBeGreaterThan(0);
  });
});

describe('createEngine — onProgress', () => {
  it('calls onProgress with current alpha on each frame', () => {
    const onProgress = vi.fn();
    const container = makeContainer([makeSvgPath()]);
    createEngine(container, { onProgress });

    scroll(300);
    raf.tick();

    expect(onProgress).toHaveBeenCalledOnce();
    const [alpha] = onProgress.mock.calls[0];
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThanOrEqual(1);
  });
});

describe('createEngine — stagger', () => {
  it('applies different dashoffsets to each path when stagger > 0', () => {
    const path1 = makeSvgPath();
    const path2 = makeSvgPath();
    const container = makeContainer([path1, path2]);
    createEngine(container, { stagger: 0.3 });

    // At scrollY=0 with stagger, path1 starts earlier than path2
    scroll(0);
    raf.tick();

    const offset1 = parseFloat(path1.style.strokeDashoffset);
    const offset2 = parseFloat(path2.style.strokeDashoffset);
    // path2 should be less drawn (higher dashoffset) than path1
    expect(offset2).toBeGreaterThanOrEqual(offset1);
  });
});

describe('createEngine — --scroll-draw-progress CSS custom property', () => {
  it('sets --scroll-draw-progress on the container element each frame', () => {
    const path = makeSvgPath();
    const container = makeContainer([path]);

    createEngine(container);
    scroll(300);
    raf.tick();

    const val = container.style.getPropertyValue('--scroll-draw-progress');
    expect(val).not.toBe('');
    const num = parseFloat(val);
    expect(num).toBeGreaterThan(0);
    expect(num).toBeLessThanOrEqual(1);
  });

  it('resets --scroll-draw-progress to 0 on replay()', () => {
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container);

    scroll(500);
    raf.tick();

    instance.replay();
    expect(container.style.getPropertyValue('--scroll-draw-progress')).toBe('0');
  });

  it('sets --scroll-draw-progress to seeked value on seek()', () => {
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container);

    instance.seek(0.75);
    const val = parseFloat(container.style.getPropertyValue('--scroll-draw-progress'));
    expect(val).toBeCloseTo(0.75, 2);
  });
});

describe('scrollDraw', () => {
  it('all noop methods are safe when selector finds nothing', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = scrollDraw('#does-not-exist');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Container not found'),
      '#does-not-exist'
    );
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });

  it('accepts a DOM Element directly and returns a valid instance', () => {
    const container = makeContainer([makeSvgPath()]);
    const instance = scrollDraw(container);
    expect(instance).toHaveProperty('destroy');
    expect(() => instance.destroy()).not.toThrow();
  });

  // ── Layout invalidation ─────────────────────────────────────────────────────
  // Trigger points were cached at init and only recomputed on a window resize.
  // But an element's document position moves for reasons that are not a window
  // resize — lazy images above it, fonts swapping, hydration, an accordion
  // opening — and the stale cache left the whole draw at a constant offset for
  // the rest of the page's life. Measured at 0.0201 of the draw on the demo's own
  // /verify page, against a native CSS path that stayed correct.

  describe('layout invalidation', () => {
    it('observes the document element and the container for layout changes', () => {
      const observed: Element[] = [];
      class FakeRO {
        static instances: FakeRO[] = [];
        constructor(public cb: () => void) { FakeRO.instances.push(this); }
        observe = vi.fn((el: Element) => { observed.push(el); });
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
      vi.stubGlobal('ResizeObserver', FakeRO);

      const container = makeContainer([makeSvgPath()]);
      const instance = createEngine(container);

      expect(FakeRO.instances.length).toBe(1);
      expect(observed).toContain(document.documentElement);
      expect(observed).toContain(container);
      // The observer is shared across the page; leave none behind for the next test.
      instance.destroy();
    });

    it('stops observing on destroy, and lets the shared observer go when nothing is left', () => {
      const disconnect = vi.fn();
      const unobserved: Element[] = [];
      class FakeRO {
        constructor(public cb: () => void) {}
        observe = vi.fn();
        unobserve = vi.fn((el: Element) => { unobserved.push(el); });
        disconnect = disconnect;
      }
      vi.stubGlobal('ResizeObserver', FakeRO);

      // The survivor is created first, so the destroyed engine's container is
      // not above it (boxes above an element are watched on its behalf).
      const second = makeContainer([makeSvgPath()]);
      const first = makeContainer([makeSvgPath()]);
      const b = createEngine(second);
      const a = createEngine(first);
      a.destroy();
      expect(unobserved).toContain(first);
      expect(unobserved).not.toContain(document.documentElement); // b still needs the page
      expect(disconnect).not.toHaveBeenCalled();
      b.destroy();
      expect(disconnect).toHaveBeenCalled();
    });

    it('works when ResizeObserver is unavailable', () => {
      vi.stubGlobal('ResizeObserver', undefined);
      const container = makeContainer([makeSvgPath()]);
      expect(() => createEngine(container).destroy()).not.toThrow();
    });
  });
});

// ── 2.26.0: a CSS cubic-bezier() string is the curve it names ────────────────
// Every engine read a string as EASINGS[easing] ?? its default, so this ran as
// the default without a word. Same scroll position, three runs: the string,
// an independent solver of the same curve (bezierReference), and linear.

describe('scrollDraw — easing as a CSS string', () => {
  function drawn(easing: Easing): number {
    const path = makeSvgPath();
    scrollDraw(makeContainer([path]), { easing, native: false });
    scroll();
    raf.tick();
    return 1 - parseFloat(path.style.strokeDashoffset) / 100;
  }

  it('draws the cubic-bezier() it names, not linear', () => {
    const css = drawn(SNAPPY);
    expect(css).toBeCloseTo(drawn(snappy), 6);
    expect(Math.abs(css - drawn('linear'))).toBeGreaterThan(0.05);
  });
});
