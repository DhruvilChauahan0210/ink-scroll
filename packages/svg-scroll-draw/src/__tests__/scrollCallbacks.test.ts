import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollAnimate } from '../animate';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeDiv(): HTMLDivElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top: 0, height: 100, left: 0, width: 100 }),
  });
  document.body.appendChild(el);
  return el;
}

class RafQueue {
  private queue: FrameRequestCallback[] = [];
  private id = 0;

  schedule = vi.fn((cb: FrameRequestCallback): number => {
    this.queue.push(cb);
    return ++this.id;
  });

  cancel = vi.fn();

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

  observe    = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting: boolean) {
    this.cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

// ── setup / teardown ──────────────────────────────────────────────────────────

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

describe('scroll callbacks — scrollAnimate', () => {
  it('fires onEnter when scrollY enters trigger zone', () => {
    const el       = makeDiv();
    const onEnter  = vi.fn();
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
      onEnter,
    });

    FakeIO.instances[0].trigger(true);

    // scrollY = 0: rawProgress = (0 - tStart) / (tEnd - tStart)
    // With default trigger top-bottom / bottom-top on el at top:0 h:100 vp:800
    // tStart = (0+0) - 800 = -800, tEnd = (0+100) - 0 = 100
    // initial raw = (0 - (-800)) / (100 - (-800)) = 800/900 ≈ 0.888 — inside zone
    // First frame seeds prevRaw, no callbacks yet
    raf.tick();

    // Simulate entering from before (scrollY negative enough to be before zone)
    vi.stubGlobal('scrollY', -900); // raw = (-900 - (-800)) / 900 = -100/900 < 0 → before zone
    raf.tick(); // update prevRaw to < 0

    vi.stubGlobal('scrollY', -799); // raw > 0 → crossing into zone
    raf.tick();

    expect(onEnter).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('fires onLeave when scrollY exits trigger zone at end', () => {
    const el      = makeDiv();
    const onLeave = vi.fn();
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
      onLeave,
    });

    FakeIO.instances[0].trigger(true);
    raf.tick(); // seed prevRaw

    // Put prevRaw inside zone (< 1)
    vi.stubGlobal('scrollY', 50);
    raf.tick();

    // Now cross the end
    vi.stubGlobal('scrollY', 200); // raw >= 1
    raf.tick();

    expect(onLeave).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('fires onEnterBack when scrollY re-enters zone from end', () => {
    const el         = makeDiv();
    const onEnterBack = vi.fn();
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
      onEnterBack,
    });

    FakeIO.instances[0].trigger(true);
    raf.tick(); // seed

    // Push into "after zone" (raw >= 1)
    vi.stubGlobal('scrollY', 200);
    raf.tick();

    // Scroll back inside zone
    vi.stubGlobal('scrollY', 50);
    raf.tick();

    expect(onEnterBack).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('fires onLeaveBack when scrollY exits zone at start', () => {
    const el          = makeDiv();
    const onLeaveBack = vi.fn();
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
      onLeaveBack,
    });

    FakeIO.instances[0].trigger(true);
    raf.tick(); // seed

    // Put prevRaw inside zone (> 0)
    vi.stubGlobal('scrollY', 50);
    raf.tick();

    // Cross back before zone start
    vi.stubGlobal('scrollY', -900);
    raf.tick();

    expect(onLeaveBack).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('does not fire duplicate onEnter on successive frames inside zone', () => {
    const el      = makeDiv();
    const onEnter = vi.fn();
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      native: false,
      onEnter,
    });

    FakeIO.instances[0].trigger(true);
    raf.tick(); // seed

    vi.stubGlobal('scrollY', -900);
    raf.tick(); // before zone

    vi.stubGlobal('scrollY', -799);
    raf.tick(); // enter → onEnter fires

    vi.stubGlobal('scrollY', -500);
    raf.tick(); // still inside → no second onEnter
    raf.tick();

    expect(onEnter).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it('forces native: false when any scroll callback is provided', () => {
    // If native were used, no IntersectionObserver would be created
    const el      = makeDiv();
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
    const instance = scrollAnimate(el, {
      props: { opacity: [0, 1] },
      onEnter: vi.fn(),
    });
    // native path does not create an IO — if IO exists, JS engine was used
    expect(FakeIO.instances.length).toBeGreaterThan(0);
    instance.destroy();
  });
});
