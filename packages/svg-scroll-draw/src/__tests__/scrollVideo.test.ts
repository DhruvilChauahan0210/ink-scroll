import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollVideo } from '../video';
import { SNAPPY, snappy } from './bezierReference';
import type { Easing } from '../core/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeVideo(): HTMLVideoElement {
  const el = document.createElement('video') as HTMLVideoElement;
  // Simulate metadata loaded
  Object.defineProperty(el, 'readyState', { value: 1, writable: true });
  Object.defineProperty(el, 'duration', { value: 5, writable: true });
  el.pause = vi.fn();
  document.body.appendChild(el);
  return el;
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
  observe = vi.fn();
  disconnect = vi.fn();
  trigger(v: boolean) {
    this.cb([{ isIntersecting: v } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

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
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 600, left: 0, width: 800, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollVideo', () => {
  it('returns noop when element not found', () => {
    const inst = scrollVideo('#missing');
    expect(inst.getProgress()).toBe(0);
    expect(() => inst.destroy()).not.toThrow();
  });

  it('returns noop for non-video element', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const inst = scrollVideo(div as unknown as HTMLVideoElement);
    expect(inst.getProgress()).toBe(0);
  });

  it('pauses the video on init', () => {
    const video = makeVideo();
    scrollVideo(video);
    expect(video.pause).toHaveBeenCalled();
  });

  it('listens for scroll on the window, and keeps no IntersectionObserver', () => {
    const video = makeVideo();
    const listen = vi.spyOn(window, 'addEventListener');
    scrollVideo(video);
    expect(listen).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(FakeIO.instances).toHaveLength(0);
  });

  it('sets currentTime on scroll frame', () => {
    const video = makeVideo();
    scroll(100);
    scrollVideo(video, { from: 0, to: 5 });
    scroll();
    raf.tick();
    expect(video.currentTime).toBeGreaterThanOrEqual(0);
  });

  /*
   * An easing that overshoots (spring, elastic, a cubic-bezier with y past 0
   * or 1) carried the time out of [from, to]: footage the page cut out showed
   * at both ends. The time is clamped; the progress keeps the overshoot.
   */
  it.each([
    ['past the end',   1.3, 3],
    ['before the start', -0.5, 1],
  ])('an easing that overshoots %s keeps the time inside [from, to]', (_, value, time) => {
    const video = makeVideo();
    const onProgress = vi.fn();
    scrollVideo(video, { from: 1, to: 3, easing: () => value, onProgress, once: false });
    scroll(100);
    raf.tick();
    expect(video.currentTime).toBe(time);
    expect(onProgress).toHaveBeenLastCalledWith(value);
  });

  it('seek sets currentTime proportionally', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 4 });
    inst.seek(0.5);
    expect(video.currentTime).toBeCloseTo(2, 1);
    expect(inst.getProgress()).toBe(0.5);
  });

  it('seek(1) goes to `to` value', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 3 });
    inst.seek(1);
    expect(video.currentTime).toBeCloseTo(3, 1);
  });

  it('seek(0) goes to `from` value', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 1, to: 5 });
    inst.seek(0);
    expect(video.currentTime).toBeCloseTo(1, 1);
  });

  it('calls onProgress callback', () => {
    const video = makeVideo();
    const onProgress = vi.fn();
    scroll(100);
    scrollVideo(video, { from: 0, to: 5, onProgress });
    scroll();
    raf.tick();
    expect(onProgress).toHaveBeenCalled();
  });

  it('does not re-seek on frames where the scroll position has not moved', () => {
    // Every currentTime write starts a seek, even to the same value. Writing it on
    // every frame kept Firefox's decoder seeking on a page at rest.
    const video = makeVideo();
    let t = 0;
    let writes = 0;
    Object.defineProperty(video, 'currentTime', {
      get: () => t,
      set: (v: number) => { t = v; writes++; },
      configurable: true,
    });
    const onProgress = vi.fn();
    scrollVideo(video, { from: 0, to: 5, onProgress });
    scroll(100); // in the window [0, 600]: a frame every frame
    raf.tick();
    raf.tick();
    raf.tick();
    raf.tick();
    expect(writes).toBe(1);
    // Progress still reports every frame — only the seek is skipped.
    expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(4);

    scroll(400);
    raf.tick();
    expect(writes).toBe(2);
  });

  it('replay() and seek() always write currentTime, even to the current value', () => {
    const video = makeVideo();
    let writes = 0;
    let t = 0;
    Object.defineProperty(video, 'currentTime', {
      get: () => t,
      set: (v: number) => { t = v; writes++; },
      configurable: true,
    });
    const inst = scrollVideo(video, { from: 0, to: 5 });
    inst.seek(0.5);
    inst.seek(0.5);
    expect(writes).toBe(2);
    inst.replay();
    inst.replay();
    expect(writes).toBe(4);
  });

  it('calls onReady when metadata loads', () => {
    const onReady = vi.fn();
    const video = makeVideo();
    scrollVideo(video, { onReady });
    expect(onReady).toHaveBeenCalled();
  });

  it('calls onComplete at alpha=1', () => {
    const video = makeVideo();
    const onComplete = vi.fn();
    // top=-800, height=600 → tEnd = -200, scrollY=0 → progress = 800/600 > 1 → clamped 1
    vi.spyOn(video, 'getBoundingClientRect').mockReturnValue({
      top: -800, height: 600, left: 0, width: 800, right: 800, bottom: -200, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollVideo(video, { from: 0, to: 5, onComplete });
    scroll();
    raf.tick();
    expect(onComplete).toHaveBeenCalled();
  });

  // A video in a sticky stage: its own box is one screen and moves with the
  // scroll, so the window has to come from the track around it.
  it('measures the window from triggerElement, not the video', () => {
    const video = makeVideo();
    const track = document.createElement('div');
    document.body.appendChild(track);
    // The track: top 0, 2400 tall. `top top` → `bottom bottom` = 0 → 1600.
    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      top: 0, height: 2400, left: 0, width: 800, right: 800, bottom: 2400, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollVideo(video, { to: 4, triggerElement: track, trigger: { start: 'top top', end: 'bottom bottom' } });

    scroll(400);
    raf.tick();
    // 400 of 1600 → a quarter of the film. Measured from the 600px video, the
    // same scroll would be past the end of its window.
    expect(video.currentTime).toBeCloseTo(1, 5);
  });

  it('warns when the window has no length, naming triggerElement', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const video = makeVideo();
    // One viewport tall, measured `top top` → `bottom bottom`: start and end coincide.
    vi.spyOn(video, 'getBoundingClientRect').mockReturnValue({
      top: 0, height: 800, left: 0, width: 800, right: 800, bottom: 800, x: 0, y: 0, toJSON: () => ({}),
    });
    scrollVideo(video, { trigger: { start: 'top top', end: 'bottom bottom' } });
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('triggerElement'))).toBe(true);
  });

  it('pause stops rAF', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 5 });
    scroll();
    raf.tick();
    const before = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(before);
  });

  it('destroy stops listening for scroll', () => {
    const video = makeVideo();
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const inst = scrollVideo(video);
    inst.destroy();
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('replay resets progress', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 5 });
    inst.seek(1);
    inst.replay();
    expect(inst.getProgress()).toBe(0);
  });

  it('freezes with once: true', () => {
    const video = makeVideo();
    scroll(300);
    const inst = scrollVideo(video, { from: 0, to: 5, once: true });
    scroll();
    raf.tick();
    const peak = inst.getProgress();
    scroll(0);
    raf.tick();
    expect(inst.getProgress()).toBeGreaterThanOrEqual(peak);
  });

  // once held the eased value, so an elastic scrub stayed on its 1.25 peak:
  // with `to` short of the end, the film froze past `to` (6.25s of a 0 → 5 run).
  // Window [0, 600]; elastic peaks a fifth in, at y = 120.
  it('once with an overshooting easing ends exactly on `to`', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 5, once: true, easing: 'elastic' });
    scroll();
    scroll(120);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(1.25, 6);
    scroll(700);
    raf.tick();
    expect(inst.getProgress()).toBe(1);
    expect(video.currentTime).toBeCloseTo(5, 6);
  });

  // seek() before the metadata loaded set the progress and nothing else:
  // applyAlpha() waits for the metadata, and the metadata handler did not look
  // back. Measured in Chromium: getProgress() 0.5, currentTime 0.
  it('a seek() before the metadata loads is written when it arrives', () => {
    const video = makeVideo();
    (video as unknown as { readyState: number }).readyState = 0;
    (video as unknown as { duration: number }).duration = NaN;
    const inst = scrollVideo(video);
    inst.seek(0.5);
    expect(video.currentTime).toBe(0);

    (video as unknown as { readyState: number }).readyState = 1;
    (video as unknown as { duration: number }).duration = 4;
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(inst.getProgress()).toBe(0.5);
    expect(video.currentTime).toBeCloseTo(2, 6);
    expect(video.style.getPropertyValue('--scroll-draw-progress')).toBe('0.5');
  });

  // replay() set `paused` to false and requested no frame, so after pause() or
  // seek() the film stopped following the scroll. Window [0, 600].
  describe('replay() restarts the frame loop', () => {
    for (const stop of ['pause', 'seek'] as const) {
      it(`after ${stop}()`, () => {
        const video = makeVideo();
        const inst = scrollVideo(video, { from: 0, to: 5 });
        scroll();
        raf.tick();
        if (stop === 'pause') inst.pause(); else inst.seek(0.2);
        raf.tick(); // a frame the stop could not cancel in this fake sees `paused` and stops
        inst.replay();
        scroll(300);
        raf.tick();
        expect(inst.getProgress()).toBeCloseTo(0.5, 6);
        expect(video.currentTime).toBeCloseTo(2.5, 6);
      });
    }
  });

  it('sets preload if not present', () => {
    const video = makeVideo();
    video.removeAttribute('preload');
    scrollVideo(video);
    expect(video.preload).toBe('auto');
  });

  it('handles prefers-reduced-motion by seeking to end', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const video = makeVideo();
    scrollVideo(video, { from: 0, to: 5 });
    expect(video.currentTime).toBeCloseTo(5, 1);
  });
});

// ── 2.26.0: a CSS cubic-bezier() string is the curve it names ────────────────
// Every engine read a string as EASINGS[easing] ?? its default, so this ran as
// the default without a word. Same scroll position, three runs: the string,
// an independent solver of the same curve (bezierReference), and linear.

describe('scrollVideo — easing as a CSS string', () => {
  function alpha(easing: Easing): number {
    vi.stubGlobal('scrollY', 0);
    const inst = scrollVideo(makeVideo(), { easing });
    scroll();
    scroll(200);
    raf.tick();
    return inst.getProgress();
  }

  it('scrubs along the cubic-bezier() it names, not linear', () => {
    const css = alpha(SNAPPY);
    expect(css).toBeGreaterThan(0.05);
    expect(css).toBeLessThan(0.99);
    expect(css).toBeCloseTo(alpha(snappy), 6);
    expect(Math.abs(css - alpha('linear'))).toBeGreaterThan(0.05);
  });
});
