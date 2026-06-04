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
