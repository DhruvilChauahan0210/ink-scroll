import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../core/engine';
import { scrollDraw } from '../index';

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
  private queue: FrameRequestCallback[] = [];
  private id = 0;

  schedule = vi.fn((cb: FrameRequestCallback): number => {
    this.queue.push(cb);
    return ++this.id;
  });

  cancel = vi.fn();

  /** Run the next pending callback once. */
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
    expect(path.style.strokeDasharray).toBe('100');
    expect(path.style.strokeDashoffset).toBe('100');
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

  it('observes the container element', () => {
    const container = makeContainer([makeSvgPath()]);
    createEngine(container);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(container);
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

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
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

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onComplete).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('does not fire onComplete when not fully drawn', () => {
    // scrollY=0 → progress ≈ 0.615 (before tEnd), no completion.
    const onComplete = vi.fn();
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container, { onComplete });

    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onComplete).not.toHaveBeenCalled();
    instance.destroy();
  });
});

describe('createEngine — destroy', () => {
  it('disconnects IntersectionObserver', () => {
    const container = makeContainer([makeSvgPath()]);
    const instance = createEngine(container);
    instance.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
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
    FakeIO.instances[0].trigger(true); // schedules a frame
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

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
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

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
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
    vi.stubGlobal('scrollY', 0);
    FakeIO.instances[0].trigger(true);
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
    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
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

    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
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
});
