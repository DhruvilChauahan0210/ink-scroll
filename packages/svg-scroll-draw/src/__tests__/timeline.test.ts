import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollDrawTimeline } from '../timeline/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePath(cls: string): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  el.classList.add(cls);
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(pathSpecs: { cls: string }[]): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pathSpecs.forEach(({ cls }) => svg.appendChild(makePath(cls)));
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
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('innerWidth', 1200);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('scrollDrawTimeline — initialisation', () => {
  it('returns a noop when container not found', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = scrollDrawTimeline('#nonexistent', { tracks: [] });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Container not found'), '#nonexistent');
    expect(() => instance.destroy()).not.toThrow();
    spy.mockRestore();
  });

  it('accepts an Element directly', () => {
    const container = makeContainer([{ cls: 'a' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.a', from: 0, to: 1 }],
    });
    expect(() => instance.destroy()).not.toThrow();
  });

  it('initialises strokeDasharray on matched paths', () => {
    const container = makeContainer([{ cls: 'line' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.line', from: 0, to: 1 }],
    });
    const path = container.querySelector('.line') as SVGPathElement;
    expect(path.style.strokeDasharray).toBe('100');
  });

  it('initialises strokeDashoffset to full length (hidden)', () => {
    const container = makeContainer([{ cls: 'line' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.line', from: 0, to: 1 }],
    });
    const path = container.querySelector('.line') as SVGPathElement;
    expect(path.style.strokeDashoffset).toBe('100');
  });

  it('observes the container via IntersectionObserver', () => {
    const container = makeContainer([{ cls: 'a' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.a', from: 0, to: 1 }],
    });
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(container);
  });
});

describe('scrollDrawTimeline — independent track windows', () => {
  it('does not draw track 2 paths when global progress is below track 2 from', () => {
    const container = makeContainer([{ cls: 'track1' }, { cls: 'track2' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [
        { selector: '.track1', from: 0,   to: 0.5 },
        { selector: '.track2', from: 0.6, to: 1.0 },
      ],
    });

    // Seek to 30% — inside track1 window, before track2 starts at 60%
    instance.seek(0.3);

    const t2 = container.querySelector('.track2') as SVGPathElement;
    // track2 local progress = (0.3 - 0.6) / 0.4 → clamped to 0 → offset = 100
    expect(parseFloat(t2.style.strokeDashoffset)).toBeCloseTo(100, 0);
  });

  it('draws track 1 paths before track 2 paths at 30% global progress', () => {
    const container = makeContainer([{ cls: 'early' }, { cls: 'late' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [
        { selector: '.early', from: 0,   to: 0.5 },
        { selector: '.late',  from: 0.5, to: 1.0 },
      ],
    });

    // At 30%: early local=(0.3/0.5)=0.6, late local=(0.3-0.5)/0.5 → clamped 0
    instance.seek(0.3);

    const early = container.querySelector('.early') as SVGPathElement;
    const late  = container.querySelector('.late')  as SVGPathElement;
    const earlyOffset = parseFloat(early.style.strokeDashoffset);
    const lateOffset  = parseFloat(late.style.strokeDashoffset);

    // early track more drawn (lower offset) than late track
    expect(earlyOffset).toBeLessThan(lateOffset);
  });
});

describe('scrollDrawTimeline — CSS custom property', () => {
  it('sets --scroll-draw-progress on the container', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    const val = container.style.getPropertyValue('--scroll-draw-progress');
    expect(val).not.toBe('');
    expect(parseFloat(val)).toBeGreaterThan(0);
  });
});

describe('scrollDrawTimeline — instance methods', () => {
  it('destroy disconnects the IntersectionObserver', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    instance.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
  });

  it('seek() moves to specified progress and pauses', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });

    instance.seek(0.5);
    expect(instance.getProgress()).toBeCloseTo(0.5, 2);

    const path = container.querySelector('.p') as SVGPathElement;
    const offset = parseFloat(path.style.strokeDashoffset);
    // at 50% global progress, track (from=0, to=1) local alpha=0.5, offset=50
    expect(offset).toBeCloseTo(50, 0);
  });

  it('replay() resets dashoffset to full length', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });

    instance.seek(0.8);
    instance.replay();

    const path = container.querySelector('.p') as SVGPathElement;
    expect(parseFloat(path.style.strokeDashoffset)).toBe(100);
  });

  it('getProgress() returns 0 initially', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    expect(instance.getProgress()).toBe(0);
  });

  it('fires onComplete when global progress reaches 1', () => {
    const onComplete = vi.fn();
    const container  = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks:     [{ selector: '.p', from: 0, to: 1 }],
      onComplete,
    });

    vi.stubGlobal('scrollY', 10000);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('pause() cancels the rAF', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    FakeIO.instances[0].trigger(true);
    instance.pause();
    expect(raf.cancel).toHaveBeenCalled();
  });
});

describe('scrollDrawTimeline — fade option', () => {
  it('sets opacity to 0 initially when fade=true', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1, fade: true }],
    });
    const path = container.querySelector('.p') as SVGPathElement;
    expect(path.style.opacity).toBe('0');
  });

  it('increases opacity as the track draws', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1, fade: true }],
    });

    vi.stubGlobal('scrollY', 300);
    FakeIO.instances[0].trigger(true);
    raf.tick();

    const path = container.querySelector('.p') as SVGPathElement;
    expect(parseFloat(path.style.opacity)).toBeGreaterThan(0);
  });
});
