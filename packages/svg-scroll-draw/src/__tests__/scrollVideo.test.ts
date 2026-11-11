import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollVideo } from '../video';

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
  private queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
  cancel = vi.fn();
  tick() { const cb = this.queue.shift(); cb?.(performance.now()); }
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

  it('observes the video element', () => {
    const video = makeVideo();
    scrollVideo(video);
    expect(FakeIO.instances[0].observe).toHaveBeenCalledWith(video);
  });

  it('sets currentTime on scroll frame', () => {
    const video = makeVideo();
    vi.stubGlobal('scrollY', 100);
    scrollVideo(video, { from: 0, to: 5 });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    expect(video.currentTime).toBeGreaterThanOrEqual(0);
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
    vi.stubGlobal('scrollY', 100);
    scrollVideo(video, { from: 0, to: 5, onProgress });
    FakeIO.instances[0].trigger(true);
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
    vi.stubGlobal('scrollY', 100);
    const onProgress = vi.fn();
    scrollVideo(video, { from: 0, to: 5, onProgress });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    raf.tick();
    raf.tick();
    raf.tick();
    expect(writes).toBe(1);
    // Progress still reports every frame — only the seek is skipped.
    expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(4);

    vi.stubGlobal('scrollY', 400);
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
    FakeIO.instances[0].trigger(true);
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

    vi.stubGlobal('scrollY', 400);
    FakeIO.instances[0].trigger(true);
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
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const before = raf.schedule.mock.calls.length;
    inst.pause();
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(before);
  });

  it('destroy disconnects observer', () => {
    const video = makeVideo();
    const inst = scrollVideo(video);
    inst.destroy();
    expect(FakeIO.instances[0].disconnect).toHaveBeenCalled();
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
    vi.stubGlobal('scrollY', 300);
    const inst = scrollVideo(video, { from: 0, to: 5, once: true });
    FakeIO.instances[0].trigger(true);
    raf.tick();
    const peak = inst.getProgress();
    vi.stubGlobal('scrollY', 0);
    raf.tick();
    expect(inst.getProgress()).toBeGreaterThanOrEqual(peak);
  });

  // once held the eased value, so an elastic scrub stayed on its 1.25 peak:
  // with `to` short of the end, the film froze past `to` (6.25s of a 0 → 5 run).
  // Window [0, 600]; elastic peaks a fifth in, at y = 120.
  it('once with an overshooting easing ends exactly on `to`', () => {
    const video = makeVideo();
    const inst = scrollVideo(video, { from: 0, to: 5, once: true, easing: 'elastic' });
    FakeIO.instances[0].trigger(true);
    vi.stubGlobal('scrollY', 120);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(1.25, 6);
    vi.stubGlobal('scrollY', 700);
    raf.tick();
    expect(inst.getProgress()).toBe(1);
    expect(video.currentTime).toBeCloseTo(5, 6);
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
