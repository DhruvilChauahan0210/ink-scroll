import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollHorizontal } from '../horizontal';

let trackWidth = 3600;

function makeTrack(parent: HTMLElement = document.body): HTMLElement {
  const el = document.createElement('div');
  parent.appendChild(el);
  Object.defineProperty(el, 'scrollWidth', { get: () => trackWidth, configurable: true });
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

/**
 * How many animate engines the track has had: each listens for scroll on the
 * window once, and a rebuild makes a new one.
 */
let built: () => number;

beforeEach(() => {
  const listen = vi.spyOn(window, 'addEventListener');
  built = () => listen.mock.calls.filter(([type]) => type === 'scroll').length;
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
  trackWidth = 3600;
  delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
});

/** A sticky stage `width` wide with `pad` px of horizontal padding, inside a runway. */
function makeStage(width: number, pad = 0): HTMLElement {
  const outer = document.createElement('div');
  const stage = document.createElement('div');
  stage.style.position = 'sticky';
  stage.style.paddingLeft = `${pad}px`;
  stage.style.paddingRight = `${pad}px`;
  Object.defineProperty(stage, 'clientWidth', { get: () => width, configurable: true });
  outer.appendChild(stage);
  document.body.appendChild(outer);
  return stage;
}

/** Records what is observed, and lets a test report a size change. */
class FakeRO {
  static instances: FakeRO[] = [];
  targets: Element[] = [];
  constructor(private cb: ResizeObserverCallback) { FakeRO.instances.push(this); }
  observe = (t: Element) => { this.targets.push(t); };
  unobserve = (t: Element) => { this.targets = this.targets.filter((x) => x !== t); };
  disconnect = () => { this.targets = []; };
  /** Report `t` resized. A real observer reports each target once on observe, which is skipped. */
  fire(t: Element) { this.cb([{ target: t } as ResizeObserverEntry], this as unknown as ResizeObserver); }
}

describe('scrollHorizontal', () => {
  it('drives the track with an animate engine', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    expect(built()).toBe(1);
    inst.destroy();
  });

  it('accepts explicit distance option', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    // Should not throw and should create an engine
    expect(built()).toBe(1);
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
  it('measures the default travel against the sticky stage, padding left out', () => {
    // A 1000px stage in a wider window: the window's width would stop short.
    const el   = makeTrack(makeStage(1000, 20));
    const inst = scrollHorizontal(el);
    inst.seek(1);
    expect(el.style.transform).toContain('translateX(-2640px)'); // 3600 - (1000 - 40)
    inst.destroy();
  });

  it('without a stage, leaves a classic scrollbar out of the viewport width', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 1185, configurable: true });
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    inst.seek(1);
    expect(el.style.transform).toContain('translateX(-2415px)'); // innerWidth 1200 counts the bar
    inst.destroy();
  });

  it('re-measures the default travel after a resize, keeping a held position', () => {
    vi.useFakeTimers();
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    inst.seek(1);
    expect(el.style.transform).toContain('translateX(-2400px)');

    trackWidth = 4800;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(150);
    expect(el.style.transform).toContain('translateX(-3600px)');
    expect(inst.getProgress()).toBe(1);
    inst.destroy();
  });

  it('keeps a distance you pass, and does not rebuild when nothing moved', () => {
    vi.useFakeTimers();
    const el   = makeTrack();
    const inst = scrollHorizontal(el, { distance: 2400 });
    const engines = built();

    trackWidth = 4800;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(150);
    expect(built(), 'rebuilt with nothing to change').toBe(engines);
    inst.seek(1);
    expect(el.style.transform).toContain('translateX(-2400px)');
    inst.destroy();
  });

  it('watches the page, the track and the runway, and re-measures when one resizes', () => {
    vi.useFakeTimers();
    FakeRO.instances = [];
    vi.stubGlobal('ResizeObserver', FakeRO);
    const stage = makeStage(1200);
    const el    = makeTrack(stage);
    const inst  = scrollHorizontal(el);
    const ro    = FakeRO.instances[0];
    expect(ro.targets).toEqual(expect.arrayContaining([document.body, document.documentElement, el, stage.parentElement]));

    inst.seek(1);
    ro.fire(el); // the report every target gets when it is first observed
    trackWidth = 6000; // an image inside a panel loaded
    ro.fire(el);
    vi.advanceTimersByTime(150);
    expect(el.style.transform).toContain('translateX(-4800px)');
    inst.destroy();
  });

  it('refresh() carries a paused position across the rebuild', () => {
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    inst.seek(0.5);
    inst.refresh();
    expect(inst.getProgress()).toBe(0.5);
    expect(el.style.transform).toContain('translateX(-1200px)');
    inst.destroy();
  });

  it('destroy() stops following the layout', () => {
    vi.useFakeTimers();
    const el   = makeTrack();
    const inst = scrollHorizontal(el);
    inst.destroy();
    const engines = built();

    trackWidth = 4800;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(150);
    expect(built()).toBe(engines);
    expect(el.style.transform).toBe('');
  });
});
