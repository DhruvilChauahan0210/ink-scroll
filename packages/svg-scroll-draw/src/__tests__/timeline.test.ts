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
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; FakeIO.instances.push(this); }
  observe    = vi.fn();
  disconnect = vi.fn();
  trigger(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

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

describe('scrollDrawTimeline — SSR guard', () => {
  it('all noop methods are safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const instance = scrollDrawTimeline('#any', { tracks: [] });
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
  });
});

describe('scrollDrawTimeline — initialisation', () => {
  it('returns a noop when container not found', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = scrollDrawTimeline('#nonexistent', { tracks: [] });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Container not found'), '#nonexistent');
    // Exercise all noop methods from the "not found" return
    expect(() => instance.destroy()).not.toThrow();
    expect(() => instance.replay()).not.toThrow();
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.seek(0.5)).not.toThrow();
    expect(instance.getProgress()).toBe(0);
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

  it('listens for scroll on the window, and keeps no IntersectionObserver', () => {
    const container = makeContainer([{ cls: 'a' }]);
    const listen = vi.spyOn(window, 'addEventListener');
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.a', from: 0, to: 1 }],
    });
    expect(listen).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(FakeIO.instances).toHaveLength(0);
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

    scroll(300);
    raf.tick();

    const val = container.style.getPropertyValue('--scroll-draw-progress');
    expect(val).not.toBe('');
    expect(parseFloat(val)).toBeGreaterThan(0);
  });
});

describe('scrollDrawTimeline — instance methods', () => {
  it('destroy stops listening for scroll', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    instance.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
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

    scroll(10000);
    raf.tick();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('pause() cancels the rAF', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    scroll();
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

    scroll(300);
    raf.tick();

    const path = container.querySelector('.p') as SVGPathElement;
    expect(parseFloat(path.style.opacity)).toBeGreaterThan(0);
  });
});

describe('scrollDrawTimeline — completed flag reset (once:false)', () => {
  it('resets completed so onComplete fires again after scrolling back and forward', () => {
    const onComplete = vi.fn();
    const container  = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
      onComplete,
    });

    // Complete it
    scroll(10000);
    raf.tick();
    expect(onComplete).toHaveBeenCalledOnce();

    // Scroll back to before the trigger zone (scrollY < tStart = -800)
    // so alpha=0 < 1 → completed flag resets
    scroll(-1000);
    raf.tick();

    // Complete again — onComplete fires a second time
    scroll(10000);
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe('scrollDrawTimeline — the scroll leaves the window', () => {
  it('paints the frame that leaves it, then requests no more', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const path = container.querySelector<SVGPathElement>('.p')!;
    scrollDrawTimeline(container, { tracks: [{ selector: '.p', from: 0, to: 1 }] });

    raf.tick();
    scroll(5000); // past the end
    raf.tick();
    expect(path.style.strokeDashoffset).toBe('0');
    const frames = raf.schedule.mock.calls.length;
    raf.tick();
    scroll(6000);
    expect(raf.schedule.mock.calls.length).toBe(frames);
  });
});

describe('scrollDrawTimeline — resume when not paused', () => {
  it('resume() is a no-op and does not schedule a rAF when not paused', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });

    const callsBefore = raf.schedule.mock.calls.length;
    instance.resume(); // not paused — should be a no-op
    expect(raf.schedule.mock.calls.length).toBe(callsBefore);
  });
});

describe('scrollDrawTimeline — repeat option', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  // The window runs -800 → 0. speed 2 draws it whole halfway, so a scroll of
  // -200 rests inside the window, drawn whole: where a repeat restarts.
  it('resets paths after completion when repeat:1 and once:true, inside the window', () => {
    const onComplete = vi.fn();
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks:      [{ selector: '.p', from: 0, to: 1 }],
      once:        true,
      speed:       2,
      repeat:      1,
      repeatDelay: 100,
      onComplete,
    });

    scroll(-200);
    raf.tick();
    const path = container.querySelector('.p') as SVGPathElement;
    expect(parseFloat(path.style.strokeDashoffset)).toBeCloseTo(0, 0);

    // The restart lets `once` go: back near the start, the draw follows.
    vi.advanceTimersByTime(150);
    scroll(-700);
    raf.tick();
    expect(parseFloat(path.style.strokeDashoffset)).toBeGreaterThan(50);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires onComplete on each repeat cycle', () => {
    const onComplete = vi.fn();
    const container  = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks:      [{ selector: '.p', from: 0, to: 1 }],
      once:        true,
      speed:       2,
      repeat:      2,
      repeatDelay: 0,
      onComplete,
    });

    // First completion
    scroll(-200);
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(1);

    // After reset, scroll is still drawn whole → completes again, twice
    for (let i = 0; i < 5; i++) { vi.advanceTimersByTime(0); raf.tick(); }
    expect(onComplete).toHaveBeenCalledTimes(3);
  });

  /**
   * 2.23.5's frame gate made the repeat timer repaint wherever the scroll was:
   * past the window that is drawn whole at once, completes, and starts the
   * next timer — 60 frames and 60 onComplete calls a second, forever.
   */
  for (const repeatDelay of [0, 500]) {
    it(`once + repeat: 'infinite', repeatDelay ${repeatDelay}: past the window, one onComplete and no frames`, () => {
      const onComplete = vi.fn();
      const container  = makeContainer([{ cls: 'p' }]);
      scrollDrawTimeline(container, {
        tracks: [{ selector: '.p', from: 0, to: 1 }],
        once: true, repeat: 'infinite', repeatDelay, onComplete,
      });
      raf.tick();
      scroll(10000);
      raf.tick();
      expect(onComplete).toHaveBeenCalledTimes(1);
      const frames = raf.schedule.mock.calls.length;
      for (let i = 0; i < 60; i++) { vi.advanceTimersByTime(17); raf.tick(); }
      expect(onComplete, 'a repeat restarted past the window').toHaveBeenCalledTimes(1);
      expect(raf.schedule.mock.calls.length - frames, 'frames ran at rest past the window').toBe(0);
      const path = container.querySelector('.p') as SVGPathElement;
      expect(parseFloat(path.style.strokeDashoffset)).toBeCloseTo(0, 5);

      // Back inside the window the waiting repeat restarts: `once` lets go.
      scroll(-700);
      raf.tick();
      expect(parseFloat(path.style.strokeDashoffset)).toBeGreaterThan(50);
    });
  }

  it('does not reset when repeat is not set', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
      once:   true,
    });

    scroll(10000);
    raf.tick();

    const path = container.querySelector('.p') as SVGPathElement;
    vi.advanceTimersByTime(500);
    // No repeat set — offset stays at 0 (fully drawn)
    expect(parseFloat(path.style.strokeDashoffset)).toBeCloseTo(0, 0);
  });

  it('destroy() cancels a pending repeat timer', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks:      [{ selector: '.p', from: 0, to: 1 }],
      once:        true,
      repeat:      1,
      repeatDelay: 500,
    });

    scroll(10000);
    raf.tick();

    const path = container.querySelector('.p') as SVGPathElement;
    expect(path.getAttribute('style'), 'nothing was written, so nothing proves anything').not.toBe(
      '',
    );

    // Destroy before the timer fires
    instance.destroy();
    vi.advanceTimersByTime(600);

    /*
     * destroy() restores the inline styles it wrote, so "the offset did not
     * change" is no longer the signal — an empty style attribute is. A repeat
     * timer that survived teardown would run doReset(), which writes
     * strokeDasharray and strokeDashoffset straight back onto the path.
     */
    expect(
      path.getAttribute('style') ?? '',
      'a repeat timer fired after destroy() and rewrote the path',
    ).toBe('');
  });

  it('replay() resets the repeat counter', () => {
    const onComplete = vi.fn();
    const container  = makeContainer([{ cls: 'p' }]);
    const instance   = scrollDrawTimeline(container, {
      tracks:      [{ selector: '.p', from: 0, to: 1 }],
      once:        true,
      speed:       2,
      repeat:      1,
      repeatDelay: 0,
      onComplete,
    });

    // Complete once (uses up the 1 repeat), inside the window at speed 2
    scroll(-200);
    raf.tick();
    vi.advanceTimersByTime(0);
    raf.tick(); // second completion uses up the repeat slot

    // Manually replay — repeat counter should be restored
    instance.replay();
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(3); // original + repeat + after replay
  });
});

describe('scrollDrawTimeline — loop option', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  it('switches to time-driven loop after scroll completion when loop:true', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks:       [{ selector: '.p', from: 0, to: 1 }],
      loop:         true,
      loopDuration: 1000,
      repeatDelay:  0,
    });

    // Complete the scroll-driven phase
    scroll(10000);
    raf.tick();

    // Advance past repeatDelay — loop should start
    vi.advanceTimersByTime(50);

    const path = container.querySelector('.p') as SVGPathElement;
    // paths should have been reset (dashoffset back to 100)
    expect(parseFloat(path.style.strokeDashoffset)).toBe(100);
  });

  it('fires onComplete on each loop iteration', () => {
    const onComplete = vi.fn();
    const container  = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks:       [{ selector: '.p', from: 0, to: 1 }],
      loop:         2,
      loopDuration: 500,
      repeatDelay:  0,
      onComplete,
    });

    // First completion (scroll-driven)
    scroll(10000);
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(1);

    // After reset, tick through loop iteration 1
    vi.advanceTimersByTime(0); // trigger setTimeout(0)
    // Simulate time advancing past loopDuration
    vi.stubGlobal('performance', { now: () => Date.now() + 600 });
    raf.tick();
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('loop:false does not trigger time-driven looping', () => {
    const container = makeContainer([{ cls: 'p' }]);
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
      loop:   false,
    });

    scroll(10000);
    raf.tick();

    const path = container.querySelector('.p') as SVGPathElement;
    const offsetAfterComplete = parseFloat(path.style.strokeDashoffset);

    vi.advanceTimersByTime(2000);
    // No loop — offset unchanged
    expect(parseFloat(path.style.strokeDashoffset)).toBe(offsetAfterComplete);
  });

  it('replay() resets loopsLeft counter', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks:       [{ selector: '.p', from: 0, to: 1 }],
      loop:         1,
      loopDuration: 500,
      repeatDelay:  0,
    });

    // Complete scroll-driven phase (uses the 1 loop slot)
    scroll(10000);
    raf.tick();
    vi.advanceTimersByTime(0);

    // replay() should restore loopsLeft
    instance.replay();
    expect(instance.getProgress()).toBe(0);
  });

  it('destroy() cancels a pending loop timer', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const instance  = scrollDrawTimeline(container, {
      tracks:       [{ selector: '.p', from: 0, to: 1 }],
      loop:         true,
      loopDuration: 1000,
      repeatDelay:  500,
    });

    scroll(10000);
    raf.tick();

    instance.destroy();
    const path   = container.querySelector('.p') as SVGPathElement;
    const before = parseFloat(path.style.strokeDashoffset);

    vi.advanceTimersByTime(600);
    // Loop timer was cancelled — no reset
    expect(parseFloat(path.style.strokeDashoffset)).toBe(before);
  });
});

describe('scrollDrawTimeline — debug overlay', () => {
  it('injects a debug overlay into document.body when debug:true', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const countBefore = document.body.children.length;
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
      debug:  true,
    });
    expect(document.body.children.length).toBe(countBefore + 1);
  });

  it('removes the debug overlay on destroy()', () => {
    const container = makeContainer([{ cls: 'p' }]);
    const countBefore = document.body.children.length;
    const instance = scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
      debug:  true,
    });
    expect(document.body.children.length).toBe(countBefore + 1);
    instance.destroy();
    expect(document.body.children.length).toBe(countBefore);
  });

  it('does not inject any overlay when debug is false (default)', () => {
    const container   = makeContainer([{ cls: 'p' }]);
    const countBefore = document.body.children.length;
    scrollDrawTimeline(container, {
      tracks: [{ selector: '.p', from: 0, to: 1 }],
    });
    // Only the container itself was appended in makeContainer — no extra overlay
    expect(document.body.children.length).toBe(countBefore);
  });
});
