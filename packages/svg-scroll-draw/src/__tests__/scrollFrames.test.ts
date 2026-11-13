import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollFrames, type ScrollFramesOptions } from '../frames';
import { _getRegistry } from '../core/registry';
import type { ScrollDrawInstance } from '../core/types';

/*
 * jsdom has no image decoder and no 2D canvas, so both are faked here: an
 * Image whose load the test settles by hand, and a context that records what
 * it was asked to draw. What the browser paints is e2e/frames.spec.ts's job.
 *
 * Geometry: every rect is top 0, height 600 in an 800px viewport, so the
 * default window (`top top` → `bottom top`) is scroll 0 → 600.
 */

// ── fakes ─────────────────────────────────────────────────────────────────────

class FakeImage {
  static all: FakeImage[] = [];
  src = '';
  decoding = '';
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private ok!: () => void;
  private bad!: (e: Error) => void;
  private decoded = new Promise<void>((res, rej) => { this.ok = res; this.bad = rej; });
  constructor() { FakeImage.all.push(this); }
  decode(): Promise<void> { return this.decoded; }
  /** The image loads and decodes, `w`×`h`. */
  load(w = 100, h = 100): void {
    this.complete = true;
    this.naturalWidth = w;
    this.naturalHeight = h;
    this.onload?.();
    this.ok();
  }
  /** The image fails: a 404, a corrupt file. */
  fail(): void {
    this.complete = true;
    this.onerror?.();
    this.bad(new Error('EncodingError'));
  }
}

/** The images requested, by the URL each was given. */
const requested = (): string[] => FakeImage.all.map((i) => i.src);
const img = (url: string): FakeImage => FakeImage.all.find((i) => i.src === url)!;

class FakeRO {
  static all: FakeRO[] = [];
  targets: Element[] = [];
  constructor(public cb: ResizeObserverCallback) { FakeRO.all.push(this); }
  observe = vi.fn((t: Element) => { this.targets.push(t); });
  unobserve = vi.fn();
  disconnect = vi.fn();
  fire() { this.cb([], this as unknown as ResizeObserver); }
}

class RafQueue {
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel   = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
}

interface Ctx { clearRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> }

let raf: RafQueue;
let ctx: Ctx;
let motionHandlers: ((e: { matches: boolean }) => void)[];
const made: ScrollDrawInstance[] = [];

function reduced(on: boolean): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: on,
    addEventListener: (_: string, h: (e: { matches: boolean }) => void) => motionHandlers.push(h),
    removeEventListener: vi.fn(),
  }));
}

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  document.body.appendChild(c);
  return c;
}

const url = (i: number) => `/f/${i}.png`;

function frames(n: number, extra: Partial<ScrollFramesOptions> = {}, canvas = makeCanvas()) {
  const inst = scrollFrames(canvas, { frames: url, count: n, ...extra });
  made.push(inst);
  return { canvas, inst };
}

/** Let the decode() promises settle. */
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

/** Load these frames, in this order. */
async function loadAll(...ids: number[]): Promise<void> {
  for (const i of ids) img(url(i)).load();
  await flush();
}

/** The frame index the last draw showed, read back from its image. */
function lastDrawn(): number {
  const call = ctx.drawImage.mock.calls.at(-1);
  if (!call) return -1;
  return Number(/\/f\/(\d+)\.png/.exec((call[0] as FakeImage).src)![1]);
}

function scroll(y?: number): void {
  if (y !== undefined) vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
}

beforeEach(() => {
  FakeImage.all = [];
  FakeRO.all = [];
  motionHandlers = [];
  raf = new RafQueue();
  ctx = { clearRect: vi.fn(), drawImage: vi.fn() };
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('ResizeObserver', FakeRO);
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  reduced(false);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 600, left: 0, width: 800, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('devicePixelRatio', 1);
});

afterEach(() => {
  made.splice(0).forEach((i) => i.destroy());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('scrollFrames: what it refuses', () => {
  it('returns a no-op, with a warning, for a missing or non-canvas target', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const missing = scrollFrames('#missing', { frames: ['a.png'] });
    expect(missing.getProgress()).toBe(0);
    expect(() => { missing.seek(0.5); missing.destroy(); }).not.toThrow();

    const div = document.createElement('div');
    document.body.appendChild(div);
    scrollFrames(div as unknown as HTMLCanvasElement, { frames: ['a.png'] });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toContain('<canvas>');
    expect(FakeImage.all).toHaveLength(0);
  });

  it('returns a no-op when there are no frames to show', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const c = makeCanvas();
    for (const opts of [
      { frames: url },               // a function and no count
      { frames: url, count: 0 },
      { frames: url, count: -3 },
      { frames: [] as string[] },
      {} as ScrollFramesOptions,
    ]) {
      const inst = scrollFrames(c, opts as ScrollFramesOptions);
      expect(() => inst.destroy()).not.toThrow();
    }
    expect(warn).toHaveBeenCalledTimes(5);
    expect(FakeImage.all).toHaveLength(0);
    expect(_getRegistry().has(c)).toBe(false);
  });

  it('takes the count from the array, and never past its end', () => {
    const c = makeCanvas();
    made.push(scrollFrames(c, { frames: ['a.png', 'b.png', 'c.png'], count: 10, concurrency: 10 }));
    expect(requested()).toEqual(['a.png', 'c.png', 'b.png']);
  });
});

describe('scrollFrames: loading', () => {
  it('loads the first frame, the last, then midpoints coarse to fine', () => {
    frames(9, { concurrency: 100 });
    expect(requested()).toEqual([0, 8, 4, 2, 6, 1, 3, 5, 7].map(url));
  });

  it('keeps at most `concurrency` images in flight', async () => {
    frames(17, { concurrency: 3 });
    expect(requested()).toEqual([0, 16, 8].map(url));
    await loadAll(16);
    expect(requested()).toEqual([0, 16, 8, 4].map(url));
    await loadAll(0, 8);
    expect(requested()).toEqual([0, 16, 8, 4, 12, 2].map(url));
  });

  it('starts six at a time by default', () => {
    frames(30);
    expect(FakeImage.all).toHaveLength(6);
  });

  it('decodes off the main thread, and falls back to onload when decode() is missing', async () => {
    const onReady = vi.fn();
    const proto = FakeImage.prototype as unknown as { decode?: unknown };
    const decode = proto.decode;
    delete proto.decode;
    try {
      frames(2, { onReady });
      FakeImage.all[0].load();
      expect(onReady).toHaveBeenCalledTimes(1);
      expect(lastDrawn()).toBe(0);
    } finally {
      proto.decode = decode;
    }
  });

  it('a decode() that rejects for an image that did load still shows it', async () => {
    frames(2);
    const first = FakeImage.all[0];
    first.complete = true;
    first.naturalWidth = 50;
    first.naturalHeight = 50;
    (first as unknown as { bad: (e: Error) => void }).bad(new Error('EncodingError'));
    await flush();
    expect(lastDrawn()).toBe(0);
  });

  it('fires onLoad once, when every frame has loaded or failed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onLoad = vi.fn();
    frames(3, { onLoad });
    await loadAll(0, 2);
    expect(onLoad).not.toHaveBeenCalled();
    img(url(1)).fail();
    await flush();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('scrollFrames: drawing', () => {
  it('draws frame 0 once it arrives, and fires onReady then', async () => {
    const onReady = vi.fn();
    frames(9, { onReady });
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
    await loadAll(0);
    expect(lastDrawn()).toBe(0);
    expect(onReady).toHaveBeenCalledTimes(1);
    await loadAll(8, 4);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('shows frame round(alpha × (count − 1))', async () => {
    const onProgress = vi.fn();
    frames(9, { onProgress, concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    for (const [y, want] of [[0, 0], [75, 1], [110, 1], [113, 2], [300, 4], [599, 8], [600, 8]]) {
      scroll(y);
      raf.tick();
      expect(lastDrawn(), `at y=${y}`).toBe(want);
      expect(onProgress).toHaveBeenLastCalledWith(y / 600, want);
    }
  });

  it('draws the nearest loaded frame until the wanted one arrives', async () => {
    frames(9, { concurrency: 9 });
    await loadAll(0, 8);
    scroll(225); // frame 3
    raf.tick();
    expect(lastDrawn(), '0 is 3 away, 8 is 5').toBe(0);
    await loadAll(4);
    expect(lastDrawn(), 'a closer frame arrived: redrawn without a scroll').toBe(4);
    await loadAll(6);
    expect(lastDrawn(), 'a frame further away changes nothing').toBe(4);
    await loadAll(3);
    expect(lastDrawn()).toBe(3);
  });

  it('draws only when the frame to show changes, not every frame at rest', async () => {
    frames(9, { concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    scroll(300);
    raf.tick();
    const draws = ctx.drawImage.mock.calls.length;
    for (let i = 0; i < 5; i++) raf.tick();
    scroll(310); // still frame 4
    raf.tick();
    raf.tick();
    expect(ctx.drawImage.mock.calls.length).toBe(draws);
    scroll(400); // frame 5
    raf.tick();
    expect(ctx.drawImage.mock.calls.length).toBe(draws + 1);
  });

  it('skips a frame that failed, with one warning naming it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    frames(9, { concurrency: 9 });
    await loadAll(0, 8, 4, 2, 6, 1, 5, 7);
    img(url(3)).fail();
    await flush();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toContain(url(3));
    scroll(225); // frame 3
    raf.tick();
    expect(lastDrawn()).toBe(2);
  });

  it('cover fills the box and crops; contain fits inside it; both centred', async () => {
    // The canvas keeps its own 300×150 where nothing lays it out (jsdom).
    frames(1);
    img(url(0)).load(100, 100);
    await flush();
    expect(ctx.drawImage.mock.calls.at(-1)!.slice(1)).toEqual([0, -75, 300, 300]);

    frames(1, { fit: 'contain' });
    FakeImage.all.at(-1)!.load(100, 100);
    await flush();
    expect(ctx.drawImage.mock.calls.at(-1)!.slice(1)).toEqual([75, 0, 150, 150]);
    expect(ctx.clearRect).toHaveBeenLastCalledWith(0, 0, 300, 150);
  });

  it('sizes the backing store to the CSS box × devicePixelRatio, capped at 2', () => {
    vi.stubGlobal('devicePixelRatio', 1.5);
    const c = makeCanvas();
    Object.defineProperty(c, 'clientWidth', { value: 320, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 180, configurable: true });
    frames(1, {}, c);
    expect([c.width, c.height]).toEqual([480, 270]);

    vi.stubGlobal('devicePixelRatio', 3);
    const d = makeCanvas();
    Object.defineProperty(d, 'clientWidth', { value: 320, configurable: true });
    Object.defineProperty(d, 'clientHeight', { value: 180, configurable: true });
    frames(1, {}, d);
    expect([d.width, d.height]).toEqual([640, 360]);
  });

  it('a resize of the box resizes the backing store and redraws; an unchanged one does not', async () => {
    const c = makeCanvas();
    let w = 200;
    Object.defineProperty(c, 'clientWidth', { get: () => w, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 100, configurable: true });
    frames(1, {}, c);
    await loadAll(0);
    const ro = FakeRO.all.find((r) => r.targets.length === 1 && r.targets[0] === c)!;
    expect(ro, 'no ResizeObserver on the canvas').toBeTruthy();
    const draws = ctx.drawImage.mock.calls.length;

    ro.fire(); // the first report, same size
    expect(ctx.drawImage.mock.calls.length).toBe(draws);

    w = 400;
    ro.fire();
    expect(c.width).toBe(400);
    expect(ctx.drawImage.mock.calls.length).toBe(draws + 1);
  });

  it('writes --scroll-draw-progress', async () => {
    const { canvas } = frames(3);
    scroll(150);
    raf.tick();
    expect(canvas.style.getPropertyValue('--scroll-draw-progress')).toBe('0.25');
  });
});

describe('scrollFrames: the scroll', () => {
  it('a jump past the whole window paints the last frame and completes', async () => {
    const onComplete = vi.fn();
    const { inst } = frames(9, { onComplete, concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    scroll(5000);
    raf.tick();
    expect(lastDrawn()).toBe(8);
    expect(inst.getProgress()).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('measures the window from triggerElement', async () => {
    const track = document.createElement('div');
    document.body.appendChild(track);
    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      top: 0, height: 2400, left: 0, width: 800, right: 800, bottom: 2400, x: 0, y: 0, toJSON: () => ({}),
    });
    const { inst } = frames(9, { triggerElement: track, trigger: { start: 'top top', end: 'bottom bottom' } });
    scroll(400); // 400 of 1600
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.25, 6);
  });

  it('seek() shows the frame and stops following the scroll', async () => {
    const { inst } = frames(9, { concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    inst.seek(0.5);
    expect(lastDrawn()).toBe(4);
    expect(inst.getProgress()).toBe(0.5);
    scroll(600);
    raf.tick();
    expect(lastDrawn()).toBe(4);
  });

  it('a seek() before any frame loaded is drawn when one does', async () => {
    const { inst } = frames(9, { concurrency: 9 });
    inst.seek(1);
    await loadAll(0);
    expect(lastDrawn()).toBe(0);
    await loadAll(8);
    expect(lastDrawn()).toBe(8);
  });

  it('pause() stops the frames and resume() restarts them', async () => {
    const { inst } = frames(9, { concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    scroll(150);
    raf.tick();
    inst.pause();
    raf.tick();
    const before = raf.schedule.mock.calls.length;
    scroll(450);
    raf.tick();
    expect(raf.schedule.mock.calls.length).toBe(before);
    expect(lastDrawn()).toBe(2);
    inst.resume();
    raf.tick();
    expect(lastDrawn()).toBe(6);
  });

  for (const stop of ['pause', 'seek'] as const) {
    it(`replay() goes back to frame 0 and follows the scroll again, after ${stop}()`, async () => {
      const { inst } = frames(9, { concurrency: 9 });
      await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
      scroll(150);
      raf.tick();
      if (stop === 'pause') inst.pause(); else inst.seek(0.9);
      inst.replay();
      expect(inst.getProgress()).toBe(0);
      raf.tick();
      scroll(300);
      raf.tick();
      expect(inst.getProgress()).toBeCloseTo(0.5, 6);
      expect(lastDrawn()).toBe(4);
    });
  }

  it('once holds the furthest frame on the way back', async () => {
    const { inst } = frames(9, { once: true, concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    scroll(450);
    raf.tick();
    scroll(75);
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.75, 6);
    expect(lastDrawn()).toBe(6);
  });

  it('an overshooting easing never asks for a frame past either end', async () => {
    const onProgress = vi.fn();
    frames(9, { easing: 'elastic', onProgress, concurrency: 9 });
    await loadAll(0, 1, 2, 3, 4, 5, 6, 7, 8);
    scroll(120); // elastic peaks here, at 1.25
    raf.tick();
    expect(onProgress.mock.calls.at(-1)![0]).toBeGreaterThan(1);
    expect(onProgress.mock.calls.at(-1)![1]).toBe(8);
    expect(lastDrawn()).toBe(8);
  });

  it('registers as a frames instance for devtools, and destroy() unregisters it', () => {
    const { canvas, inst } = frames(3);
    expect(_getRegistry().get(canvas)?.type).toBe('frames');
    inst.destroy();
    expect(_getRegistry().has(canvas)).toBe(false);
  });
});

describe('scrollFrames: reduced motion', () => {
  it('at load: loads and draws the last frame, nothing else', async () => {
    reduced(true);
    const onReady = vi.fn();
    const onLoad = vi.fn();
    const { inst } = frames(30, { onReady, onLoad });
    expect(requested()).toEqual([url(29)]);
    await loadAll(29);
    expect(lastDrawn()).toBe(29);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(inst.getProgress()).toBe(1);

    const draws = ctx.drawImage.mock.calls.length;
    const scheduled = raf.schedule.mock.calls.length;
    for (const y of [0, 300, 600]) { scroll(y); raf.tick(); }
    expect(raf.schedule.mock.calls.length).toBe(scheduled);
    expect(ctx.drawImage.mock.calls.length).toBe(draws);
    expect(requested()).toEqual([url(29)]);
  });

  it('turned on mid-visit: stops the scrub on the last frame and loads nothing more', async () => {
    const onLoad = vi.fn();
    frames(30, { concurrency: 2, onLoad });
    await loadAll(0);           // 0 drawn; 29 in flight, 14 next
    expect(requested()).toEqual([0, 29, 14].map(url));
    scroll(150);
    raf.tick();
    expect(motionHandlers).toHaveLength(1);
    motionHandlers[0]({ matches: true });
    expect(lastDrawn(), 'the nearest loaded until the last arrives').toBe(0);
    await loadAll(14);
    expect(lastDrawn()).toBe(14);
    await loadAll(29);
    expect(lastDrawn()).toBe(29);
    expect(requested(), 'nothing new requested after the switch').toEqual([0, 29, 14].map(url));
    expect(onLoad).toHaveBeenCalledTimes(1);

    const draws = ctx.drawImage.mock.calls.length;
    scroll(0);
    raf.tick();
    expect(ctx.drawImage.mock.calls.length).toBe(draws);
  });

  it('turned on mid-visit before the last frame was asked for: asks for it', async () => {
    frames(30, { concurrency: 1 });
    expect(requested()).toEqual([url(0)]);
    motionHandlers[0]({ matches: true });
    await loadAll(0);
    expect(requested()).toEqual([url(0), url(29)]);
    await loadAll(29);
    expect(lastDrawn()).toBe(29);
  });
});

describe('scrollFrames: destroy()', () => {
  it('mid-load: stops the pending images and ignores what settles later', async () => {
    const onReady = vi.fn();
    const onLoad = vi.fn();
    const unlisten = vi.spyOn(window, 'removeEventListener');
    const { canvas, inst } = frames(9, { onReady, onLoad, concurrency: 3 });
    const pending = [...FakeImage.all];
    inst.destroy();
    expect(pending.every((i) => i.src === '')).toBe(true);
    expect(unlisten).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
    const ro = FakeRO.all.find((r) => r.targets.length === 1 && r.targets[0] === canvas)!;
    expect(ro.disconnect).toHaveBeenCalled();

    expect(() => pending.forEach((i) => i.load())).not.toThrow();
    await flush();
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
    expect(onLoad).not.toHaveBeenCalled();
    expect(FakeImage.all).toHaveLength(3);
    expect(() => inst.destroy()).not.toThrow();
  });
});

// ── Defects an independent review found, each pinned ──────────────────────────

describe('scrollFrames: a canvas sized by its own attributes', () => {
  /*
   * A canvas with no CSS size takes its box from its width/height attributes.
   * jsdom lays nothing out, so the box is modelled: the attributes in CSS px,
   * unless an inline width/height says otherwise. Writing the backing store
   * at a ratio of 2 doubled the box, the observer saw a resize, and it grew
   * every frame without end (33554432px in Chromium).
   */
  it('an unstyled canvas at 2x does not grow: its box is held where it was', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const c = makeCanvas();
    Object.defineProperty(c, 'clientWidth', { get: () => (c.style.width ? parseFloat(c.style.width) : c.width), configurable: true });
    Object.defineProperty(c, 'clientHeight', { get: () => (c.style.height ? parseFloat(c.style.height) : c.height), configurable: true });
    frames(1, {}, c);
    const ro = FakeRO.all.find((r) => r.targets.length === 1 && r.targets[0] === c)!;
    for (let k = 0; k < 20; k++) ro.fire();
    expect([c.width, c.height]).toEqual([600, 300]);
    expect([c.style.width, c.style.height]).toEqual(['300px', '150px']);
  });

  /*
   * width: 100% and an auto height take the height from the attributes'
   * ratio. Each write rounded it a pixel taller: a creep of a pixel a frame.
   */
  it('a width: 100% canvas with an auto height does not creep', () => {
    const c = makeCanvas();
    c.width = 100;
    c.height = 300;
    const cssW = 333.3;
    Object.defineProperty(c, 'clientWidth', { get: () => Math.round(cssW), configurable: true });
    Object.defineProperty(c, 'clientHeight', {
      get: () => {
        const ar = c.style.aspectRatio;
        if (ar) { const [a, b] = ar.split('/').map(Number); return Math.round((cssW * b) / a); }
        return Math.round((cssW * c.height) / c.width);
      },
      configurable: true,
    });
    frames(1, {}, c);
    const ro = FakeRO.all.find((r) => r.targets.length === 1 && r.targets[0] === c)!;
    const first = [c.width, c.height];
    for (let k = 0; k < 20; k++) ro.fire();
    expect([c.width, c.height]).toEqual(first);
    expect(c.style.width, 'the CSS width is left to the page').toBe('');
    expect(c.style.aspectRatio).not.toBe('');
  });

  it('a canvas sized by CSS gets no inline size', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const c = makeCanvas();
    Object.defineProperty(c, 'clientWidth', { value: 320, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 180, configurable: true });
    frames(1, {}, c);
    expect([c.width, c.height]).toEqual([640, 360]);
    expect([c.style.width, c.style.height, c.style.aspectRatio]).toEqual(['', '', '']);
  });
});

describe('scrollFrames: methods after destroy()', () => {
  it('resume() after pause() and destroy() does not restart the frames', () => {
    const onProgress = vi.fn();
    const { inst } = frames(5, { onProgress });
    scroll(300);
    raf.tick();
    inst.pause();
    inst.destroy();
    onProgress.mockClear();
    inst.resume();
    scroll(300);
    for (let k = 0; k < 10; k++) raf.tick();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('replay(), seek() and pause() after destroy() do nothing', async () => {
    const onProgress = vi.fn();
    const { canvas, inst } = frames(3, { onProgress, concurrency: 3 });
    await loadAll(0, 1, 2);
    inst.destroy();
    onProgress.mockClear();
    const draws = ctx.drawImage.mock.calls.length;
    const scheduled = raf.schedule.mock.calls.length;
    inst.replay();
    inst.seek(1);
    inst.pause();
    scroll(300);
    for (let k = 0; k < 5; k++) raf.tick();
    expect(onProgress).not.toHaveBeenCalled();
    expect(ctx.drawImage.mock.calls.length).toBe(draws);
    expect(raf.schedule.mock.calls.length).toBe(scheduled);
    expect(_getRegistry().has(canvas)).toBe(false);
  });
});

describe('scrollFrames: a callback that throws', () => {
  let reported: unknown[];
  beforeEach(() => {
    reported = [];
    vi.stubGlobal('reportError', (e: unknown) => reported.push(e));
  });

  it('a throwing onReady does not stall the loader; the error is reported', async () => {
    const onLoad = vi.fn();
    const boom = new Error('user bug');
    frames(5, { concurrency: 1, onLoad, onReady: () => { throw boom; } });
    expect(requested()).toEqual([url(0)]);
    await loadAll(0);
    expect(lastDrawn()).toBe(0);
    expect(reported).toEqual([boom]);
    for (const i of [4, 2, 1, 3]) await loadAll(i);
    expect(requested()).toHaveLength(5);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('a throwing onLoad under reduced motion still leaves the last frame on the canvas', async () => {
    reduced(true);
    frames(5, { onLoad: () => { throw new Error('user bug'); } });
    await loadAll(4);
    expect(lastDrawn()).toBe(4);
    expect(reported).toHaveLength(1);
  });

  it('a throwing onProgress still draws, and onComplete still comes', async () => {
    const onComplete = vi.fn();
    frames(3, { concurrency: 3, onComplete, onProgress: () => { throw new Error('user bug'); } });
    await loadAll(0, 1, 2);
    scroll(5000);
    raf.tick();
    expect(lastDrawn()).toBe(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(reported.length).toBeGreaterThan(0);
  });
});

describe('scrollFrames: a frames function that throws', () => {
  it('throwing for every index: an instance, no leak, one warning, onLoad', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const add = vi.spyOn(window, 'addEventListener');
    const rem = vi.spyOn(window, 'removeEventListener');
    const onLoad = vi.fn();
    let inst!: ScrollDrawInstance;
    expect(() => {
      inst = scrollFrames(makeCanvas(), { frames: () => { throw new Error('x'); }, count: 3, onLoad });
    }).not.toThrow();
    expect(FakeImage.all).toHaveLength(0);
    await flush();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    inst.destroy();
    const net = (spy: typeof add) => spy.mock.calls.filter((c) => c[0] === 'scroll').length;
    expect(net(add) - net(rem)).toBe(0);
  });

  it('throwing for one index: that frame is skipped for its neighbour, and onLoad still fires', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onLoad = vi.fn();
    const c = makeCanvas();
    made.push(scrollFrames(c, {
      frames: (i) => { if (i === 2) throw new Error('no frame 2'); return url(i); },
      count: 5,
      concurrency: 5,
      onLoad,
    }));
    await loadAll(0, 4, 1, 3);
    expect(onLoad).toHaveBeenCalledTimes(1);
    scroll(300); // frame 2
    raf.tick();
    expect(lastDrawn()).toBe(1);
  });

  it('an array entry that is not a URL is skipped the same way', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onLoad = vi.fn();
    made.push(scrollFrames(makeCanvas(), { frames: [url(0), undefined as unknown as string, url(2)], onLoad }));
    expect(requested()).toEqual([url(0), url(2)]);
    await loadAll(0, 2);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});

describe('scrollFrames: odd inputs', () => {
  it('a count that is not finite is refused, not thrown', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const count of [Infinity, NaN, -Infinity, 0.5]) {
      expect(() => scrollFrames(makeCanvas(), { frames: url, count }).destroy()).not.toThrow();
    }
    expect(warn).toHaveBeenCalledTimes(4);
    expect(FakeImage.all).toHaveLength(0);
  });

  it('a concurrency that is not a finite number of 1 or more falls back to 6, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const concurrency of [0, NaN, Infinity, -2, 0.5]) {
      FakeImage.all = [];
      frames(20, { concurrency });
      expect(FakeImage.all, `concurrency ${concurrency}`).toHaveLength(6);
    }
    expect(warn).toHaveBeenCalledTimes(5);
    FakeImage.all = [];
    frames(20, { concurrency: 2.7 });
    expect(FakeImage.all).toHaveLength(2);
  });

  it('an easing that returns NaN reads as the start, so a frame is drawn', async () => {
    const onProgress = vi.fn();
    frames(3, { easing: () => NaN, onProgress, concurrency: 3 });
    await loadAll(1, 2);
    scroll(300);
    raf.tick();
    expect(onProgress).toHaveBeenLastCalledWith(0, 0);
    expect(lastDrawn(), 'nothing loaded at 0: its nearest').toBe(1);
  });

  it('the zero-length-window warning waits for a box, and comes once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const zero = () => warn.mock.calls.filter((c) => String(c[0]).includes('zero-length')).length;
    const c = makeCanvas();
    const box = { h: 0 };
    vi.spyOn(c, 'getBoundingClientRect').mockImplementation(() => ({
      top: 0, height: box.h, left: 0, width: box.h ? 800 : 0, right: 800, bottom: box.h, x: 0, y: 0, toJSON: () => ({}),
    }));
    const remeasure = () => new Promise<void>((r) => { window.dispatchEvent(new Event('resize')); setTimeout(r, 200); });
    frames(3, { trigger: { start: 'top top', end: 'bottom bottom' } }, c);
    await remeasure();
    expect(zero(), 'display: none, no box yet').toBe(0);
    box.h = 800; // one viewport tall, `top top` → `bottom bottom`: no length
    await remeasure();
    await remeasure();
    expect(zero()).toBe(1);
  });
});
