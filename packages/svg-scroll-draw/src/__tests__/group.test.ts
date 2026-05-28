import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollDrawGroup, scrollDrawSequence } from '../group/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePath(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.appendChild(makePath());
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

// ── Setup ─────────────────────────────────────────────────────────────────────

let raf: RafQueue;

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
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
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

// ── SSR guard — noop methods ──────────────────────────────────────────────────

describe('scrollDrawGroup — SSR guard', () => {
  it('all noop methods are safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const instance = scrollDrawGroup([makeContainer()]);
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });
});

describe('scrollDrawSequence — SSR guard', () => {
  it('all noop methods are safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const instance = scrollDrawSequence([makeContainer()]);
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });
});

// ── scrollDrawGroup ───────────────────────────────────────────────────────────

describe('scrollDrawGroup — initialisation', () => {
  it('returns a noop instance when targets array is empty', () => {
    const instance = scrollDrawGroup([]);
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
  });

  it('ignores targets that do not exist in the DOM', () => {
    const instance = scrollDrawGroup(['#nonexistent-a', '#nonexistent-b']);
    expect(() => instance.destroy()).not.toThrow();
  });

  it('creates one IntersectionObserver per matched container', () => {
    const a = makeContainer();
    const b = makeContainer();
    scrollDrawGroup([a, b]);
    expect(FakeIO.instances).toHaveLength(2);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(a);
    expect(FakeIO.instances[1].observe).toHaveBeenCalledWith(b);
  });

  it('passes options to every engine', () => {
    const a = makeContainer();
    const b = makeContainer();
    scrollDrawGroup([a, b], { fade: true });
    const pathA = a.querySelector('path') as SVGPathElement;
    const pathB = b.querySelector('path') as SVGPathElement;
    // fade:true → opacity initialised to '0'
    expect(pathA.style.opacity).toBe('0');
    expect(pathB.style.opacity).toBe('0');
  });
});

describe('scrollDrawGroup — instance methods', () => {
  it('destroy() disconnects all observers', () => {
    const instance = scrollDrawGroup([makeContainer(), makeContainer()]);
    instance.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
    expect(FakeIO.instances[1].disconnect).toHaveBeenCalled();
  });

  it('replay() resets all containers', () => {
    const a = makeContainer();
    const b = makeContainer();
    const instance = scrollDrawGroup([a, b]);

    // Advance both to near-complete
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    FakeIO.instances[1].trigger(true);
    raf.tick();
    raf.tick();

    instance.replay();

    const pathA = a.querySelector('path') as SVGPathElement;
    const pathB = b.querySelector('path') as SVGPathElement;
    // After replay dashoffset resets to full length
    expect(parseFloat(pathA.style.strokeDashoffset)).toBeCloseTo(100, 0);
    expect(parseFloat(pathB.style.strokeDashoffset)).toBeCloseTo(100, 0);
  });

  it('pause() cancels the rAF for all engines', () => {
    const instance = scrollDrawGroup([makeContainer(), makeContainer()]);
    FakeIO.instances[0].trigger(true);
    FakeIO.instances[1].trigger(true);
    instance.pause();
    // cancel should have been called at least once per engine
    expect(raf.cancel).toHaveBeenCalled();
  });

  it('each container animates independently based on scroll', () => {
    const a = makeContainer();
    const b = makeContainer();
    scrollDrawGroup([a, b]);

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    const pathA = a.querySelector('path') as SVGPathElement;
    expect(parseFloat(pathA.style.strokeDashoffset)).toBeLessThan(100);
  });
});

// ── scrollDrawSequence ────────────────────────────────────────────────────────

describe('scrollDrawSequence — initialisation', () => {
  it('returns a noop instance when no containers match', () => {
    const instance = scrollDrawSequence(['#nope-1', '#nope-2']);
    expect(() => instance.destroy()).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });

  it('creates all engines upfront (one observer per container)', () => {
    const a = makeContainer();
    const b = makeContainer();
    const c = makeContainer();
    scrollDrawSequence([a, b, c]);
    // All three engines are created immediately — not lazily
    expect(FakeIO.instances).toHaveLength(3);
  });

  it('observes every container from the start', () => {
    const a = makeContainer();
    const b = makeContainer();
    scrollDrawSequence([a, b]);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(a);
    expect(FakeIO.instances[1].observe).toHaveBeenCalledWith(b);
  });

  it('getProgress() returns 0 initially', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);
    expect(instance.getProgress()).toBe(0);
  });
});

describe('scrollDrawSequence — pausing of later engines', () => {
  it('engine[1] does NOT schedule a rAF when its observer fires before engine[0] completes', () => {
    scrollDrawSequence([makeContainer(), makeContainer()]);

    const callsBefore = raf.schedule.mock.calls.length;
    // Trigger engine[1]'s observer — it is paused, so no rAF should be scheduled
    FakeIO.instances[1].trigger(true);
    const callsAfter = raf.schedule.mock.calls.length;

    expect(callsAfter).toBe(callsBefore);
  });

  it('engine[0] animates immediately when visible', () => {
    scrollDrawSequence([makeContainer(), makeContainer()]);

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(raf.schedule).toHaveBeenCalled();
  });

  it('engine[1] paths remain at full dashoffset (hidden) while engine[0] is not done', () => {
    const a = makeContainer();
    const b = makeContainer();
    scrollDrawSequence([a, b]);

    // Make engine[1] "visible" — it should stay paused and not draw
    FakeIO.instances[1].trigger(true);

    const pathB = b.querySelector('path') as SVGPathElement;
    expect(parseFloat(pathB.style.strokeDashoffset)).toBe(100);
  });
});

describe('scrollDrawSequence — chain behaviour', () => {
  it('engine[1] resumes after engine[0] completes', () => {
    scrollDrawSequence([makeContainer(), makeContainer()]);

    // Make engine[1] visible first so resume() can schedule a rAF
    FakeIO.instances[1].trigger(true);

    const callsBefore = raf.schedule.mock.calls.length;

    // Complete engine[0]: scrollY=500 → alpha=1 → onComplete fires
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    // resume() on engine[1] should have scheduled a new rAF
    expect(raf.schedule.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('engine[2] only starts after engine[1] completes (three-step chain)', () => {
    scrollDrawSequence([makeContainer(), makeContainer(), makeContainer()]);

    // Make engines[1] and [2] visible (both paused)
    FakeIO.instances[1].trigger(true);
    FakeIO.instances[2].trigger(true);

    const callsAfterInit = raf.schedule.mock.calls.length;

    // Complete engine[0] → engine[1] resumes
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    const callsAfterStep0 = raf.schedule.mock.calls.length;
    expect(callsAfterStep0).toBeGreaterThan(callsAfterInit); // engine[1] scheduled

    // Complete engine[1]: tick until its onComplete fires
    raf.tick(); // engine[1] update → alpha=1 → onComplete → engine[2].resume()

    const callsAfterStep1 = raf.schedule.mock.calls.length;
    expect(callsAfterStep1).toBeGreaterThan(callsAfterStep0); // engine[2] scheduled
  });

  it('onComplete callback fires once when each step completes', () => {
    const onComplete = vi.fn();
    scrollDrawSequence([makeContainer(), makeContainer()], { onComplete });

    FakeIO.instances[1].trigger(true);
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // engine[0] completes → onComplete called once

    expect(onComplete).toHaveBeenCalledTimes(1);

    raf.tick(); // engine[1] update → also completes → onComplete called again
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe('scrollDrawSequence — activeIdx tracking', () => {
  it('getProgress() reflects engine[1] after engine[0] completes', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);

    FakeIO.instances[1].trigger(true);
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // engine[0] completes → activeIdx becomes 1

    // seek() always targets instances[activeIdx]; if activeIdx is now 1 this
    // sets engine[1]'s progress and getProgress() returns that value.
    instance.seek(0.6);
    expect(instance.getProgress()).toBeCloseTo(0.6, 2);
  });

  it('seek() targets the currently active engine', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);

    // Before chain fires, active engine is [0]
    instance.seek(0.5);
    expect(instance.getProgress()).toBeCloseTo(0.5, 2);
  });

  it('pause() and resume() target the currently active engine', () => {
    scrollDrawSequence([makeContainer(), makeContainer()]);

    // Engine[0] is active; make it visible and pause the sequence
    FakeIO.instances[0].trigger(true);
    const cancelsBefore = raf.cancel.mock.calls.length;

    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);
    FakeIO.instances[2].trigger(true); // engine for new sequence
    instance.pause();

    expect(raf.cancel.mock.calls.length).toBeGreaterThan(cancelsBefore);
  });
});

describe('scrollDrawSequence — destroy', () => {
  it('disconnects all observers', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer(), makeContainer()]);
    instance.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
    expect(FakeIO.instances[1].disconnect).toHaveBeenCalled();
    expect(FakeIO.instances[2].disconnect).toHaveBeenCalled();
  });

  it('does not throw when called twice', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);
    instance.destroy();
    expect(() => instance.destroy()).not.toThrow();
  });
});

describe('scrollDrawSequence — replay', () => {
  it('replay() resets activeIdx so getProgress() returns engine[0] progress again', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);

    // Advance through the chain
    FakeIO.instances[1].trigger(true);
    vi.stubGlobal('scrollY', 500);
    FakeIO.instances[0].trigger(true);
    raf.tick(); // engine[0] completes

    // After replay, activeIdx should be 0 again
    instance.replay();
    instance.seek(0.3);
    expect(instance.getProgress()).toBeCloseTo(0.3, 2);
  });

  it('replay() re-pauses all engines except the first', () => {
    const instance = scrollDrawSequence([makeContainer(), makeContainer()]);

    instance.replay();

    const callsBefore = raf.schedule.mock.calls.length;
    // engine[1] observer fires — should still be paused after replay
    FakeIO.instances[1].trigger(true);
    expect(raf.schedule.mock.calls.length).toBe(callsBefore);
  });
});
