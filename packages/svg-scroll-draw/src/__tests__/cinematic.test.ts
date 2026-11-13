import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cinematic } from '../cinematic';
import type { Story } from '../cinematic/story';
import { SNAPPY, snappy } from './bezierReference';
import type { StoryEasing } from '../cinematic/story';

// ── fakes ──────────────────────────────────────────────────────────────────────

class FakeIO {
  static instances: FakeIO[] = [];
  cb: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

/** A Studio-shaped story: a photo that fades in plus two traced draw paths. */
function makeStory(): Story {
  return {
    version: 1,
    totalHeight: '400vh',
    canvas: { width: 1200, height: 800 },
    scenes: [
      {
        id: 'scene-1',
        background: 'data:image/png;base64,AAAA',
        animations: [
          { type: 'fade', target: '#cinematic-photo', start: '45%', end: '70%', from: 0, to: 1 },
          { type: 'draw', target: '#path-a', d: 'M0 0 L100 0', length: 100, start: '10%', end: '40%', stroke: '#fff', strokeWidth: 3, easing: 'linear' },
          { type: 'draw', target: '#path-b', d: 'M0 0 L50 0', length: 50, start: '60%', end: '90%', stroke: '#0ff', strokeWidth: 2, easing: 'linear' },
        ],
      },
    ],
  };
}

/** Make the mount report a given scroll progress for computeProgress(). */
function stubScroll(mount: HTMLElement, top: number) {
  Object.defineProperty(mount, 'offsetHeight', { value: 1768, configurable: true });
  vi.spyOn(mount, 'getBoundingClientRect').mockReturnValue({
    top, height: 768, left: 0, width: 1000, right: 1000, bottom: top + 768, x: 0, y: top, toJSON: () => {},
  } as DOMRect);
}

let reduced = false;

beforeEach(() => {
  FakeIO.instances = [];
  reduced = false;
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe('Cinematic', () => {
  it('warns and no-ops when the wrapper is missing', () => {
    const inst = new Cinematic({ wrapper: '#nope' }).loadStory(makeStory());
    expect(inst.getProgress()).toBe(0);
  });

  it('builds the sticky stage, photo, and traced paths from the story', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);

    new Cinematic({ wrapper: mount }).loadStory(makeStory());

    expect(mount.style.height).toBe('400vh');
    const stage = mount.querySelector('[data-cinematic-stage]') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.style.position).toBe('sticky');

    const photo = stage.querySelector('#cinematic-photo') as HTMLImageElement;
    expect(photo).toBeTruthy();
    expect(photo.tagName).toBe('IMG');

    const svg = stage.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 1200 800');
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(svg.querySelector('#path-a')).toBeTruthy();
    expect(svg.querySelector('#path-b')).toBeTruthy();

    // dasharray initialised to the measured length (undrawn until scrolled)
    const a = svg.querySelector('#path-a') as SVGPathElement;
    expect(a.style.strokeDasharray).toBe('100 200');
  });

  it('scrubs draw + fade to the right frame at 50% scroll', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    // top = -500, scrollable = 1768 - 768 = 1000  →  progress = 0.5
    stubScroll(mount, -500);

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBeCloseTo(0.5, 5);

    const a = mount.querySelector('#path-a') as SVGPathElement; // 10%→40%: done at 0.5
    const b = mount.querySelector('#path-b') as SVGPathElement; // 60%→90%: not started at 0.5
    const photo = mount.querySelector('#cinematic-photo') as HTMLElement; // 45%→70%

    expect(Number(a.style.strokeDashoffset)).toBeCloseTo(0, 5); // fully drawn
    expect(Number(b.style.strokeDashoffset)).toBeCloseTo(50, 5); // undrawn (length 50)
    // photo: local = (0.5-0.45)/0.25 = 0.2, ease-in-out → 0.08
    expect(Number(photo.style.opacity)).toBeGreaterThan(0);
    expect(Number(photo.style.opacity)).toBeLessThan(0.2);
  });

  it('jumps to the finished frame under reduced motion (no rAF)', () => {
    reduced = true;
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBe(1);

    const a = mount.querySelector('#path-a') as SVGPathElement;
    const photo = mount.querySelector('#cinematic-photo') as HTMLElement;
    expect(Number(a.style.strokeDashoffset)).toBeCloseTo(0, 5); // fully drawn
    expect(Number(photo.style.opacity)).toBeCloseTo(1, 5); // fully visible
    // reduced-motion path never schedules a frame
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('watches no stage: the scroll window runs the frames, and destroy() stops them', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, 0);
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    // Up to 2.23.6 an IntersectionObserver on the stage ran them: a jump past
    // the mount never saw it, and the story kept its first frame.
    expect(FakeIO.instances).toHaveLength(0);
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    inst.destroy();
    const scroll = add.mock.calls.find(([type]) => type === 'scroll')![1];
    expect(remove).toHaveBeenCalledWith('scroll', scroll, { passive: true });
    for (const type of ['resize', 'orientationchange']) {
      const fn = add.mock.calls.find(([t]) => t === type)![1];
      expect(remove).toHaveBeenCalledWith(type, fn);
    }
  });

  it('reduced motion turned on mid-story: the finished frame, and the frames stop', () => {
    let change: ((e: { matches: boolean }) => void) | undefined;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false, media: query,
      addEventListener: (_: string, fn: typeof change) => { change = fn; },
      removeEventListener: vi.fn(),
    }));
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, -100);
    const remove = vi.spyOn(window, 'removeEventListener');

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBeCloseTo(0.1, 5);
    change!({ matches: true });

    expect(inst.getProgress()).toBe(1);
    const a = mount.querySelector('#path-a') as SVGPathElement;
    const photo = mount.querySelector('#cinematic-photo') as HTMLElement;
    expect(Number(a.style.strokeDashoffset)).toBeCloseTo(0, 5);
    expect(Number(photo.style.opacity)).toBeCloseTo(1, 5);
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    inst.destroy(); // twice over is safe
  });

  // ── a scroller other than the window ──────────────────────────────────────────
  // Up to 2.23.6 progress came from the mount's live rect, so it followed any
  // scroller. On the frame gate the window was the scroller, and a story in a
  // scrolling div, or on a page whose body scrolls, stayed on its first frame.

  /** Make `el` a scroll container 500px tall over 3000px of content, scrolled to `top`. */
  function scrollable(el: HTMLElement, rectTop: number, scrollTop: number) {
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(el, 'scrollTop', { value: scrollTop, writable: true, configurable: true });
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: rectTop } as DOMRect);
  }

  /** Run the frame the last scroll asked for. */
  function runFrame() {
    const raf = requestAnimationFrame as unknown as ReturnType<typeof vi.fn>;
    const tick = raf.mock.calls.at(-1)![0] as FrameRequestCallback;
    raf.mockClear();
    tick(0);
  }

  it('scrubs with the scrolling div it sits in, measured from its scrollport', () => {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    const mount = document.createElement('div');
    box.appendChild(mount);
    document.body.appendChild(box);
    // The box is 50px down the viewport, scrolled 600px; the mount is 100px into
    // its content, so its rect top is 50 + 100 - 600 = -450. Window: [100, 100 + 1768 - 500].
    scrollable(box, 50, 600);
    Object.defineProperty(mount, 'offsetHeight', { value: 1768, configurable: true });
    vi.spyOn(mount, 'getBoundingClientRect').mockReturnValue({ top: -450 } as DOMRect);
    const boxAdd = vi.spyOn(box, 'addEventListener');
    const winAdd = vi.spyOn(window, 'addEventListener');

    const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
    expect(inst.getProgress()).toBeCloseTo(500 / 1268, 5);
    expect(boxAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(winAdd.mock.calls.some(([t]) => t === 'scroll')).toBe(false);

    // Scroll the box to the end of the window: the frame follows, from scrollTop.
    box.scrollTop = 100 + 1268;
    box.dispatchEvent(new Event('scroll'));
    runFrame();
    expect(inst.getProgress()).toBe(1);
    expect(Number((mount.querySelector('#path-b') as SVGPathElement).style.strokeDashoffset)).toBeCloseTo(0, 5);
    inst.destroy();
  });

  it('scrubs with the body when the body is the scroller (html overflow hidden)', () => {
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'auto';
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    scrollable(document.body, 0, 300);
    Object.defineProperty(mount, 'offsetHeight', { value: 1768, configurable: true });
    // 100px into the body's content, scrolled 300: rect top -200. Window: [100, 1368].
    vi.spyOn(mount, 'getBoundingClientRect').mockReturnValue({ top: -200 } as DOMRect);
    try {
      const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
      expect(inst.getProgress()).toBeCloseTo(200 / 1268, 5);
      inst.destroy();
    } finally {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
      for (const k of ['scrollHeight', 'clientHeight', 'scrollTop']) delete (document.body as unknown as Record<string, unknown>)[k];
    }
  });

  it('keeps the window when the body\'s overflow is the viewport\'s (html overflow visible)', () => {
    // body { overflow: auto } with html left visible propagates to the viewport:
    // the window scrolls, and body.scrollTop stays 0.
    document.body.style.overflowY = 'auto';
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    scrollable(document.body, 0, 0);
    stubScroll(mount, -500);
    const winAdd = vi.spyOn(window, 'addEventListener');
    try {
      const inst = new Cinematic({ wrapper: mount }).loadStory(makeStory());
      expect(inst.getProgress()).toBeCloseTo(0.5, 5);
      expect(winAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      inst.destroy();
    } finally {
      document.body.style.overflowY = '';
      for (const k of ['scrollHeight', 'clientHeight', 'scrollTop']) delete (document.body as unknown as Record<string, unknown>)[k];
    }
  });
});

// ── 2.26.0: a CSS cubic-bezier() string is the curve it names ────────────────
// Every engine read a string as EASINGS[easing] ?? its default, so this ran as
// the default without a word. Same scroll position, three runs: the string,
// an independent solver of the same curve (bezierReference), and linear.

describe('Cinematic — easing as a CSS string', () => {
  function drawn(easing: StoryEasing): number {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    stubScroll(mount, -500); // progress 0.5
    const story = makeStory();
    story.scenes[0].animations = [
      { type: 'draw', target: '#path-a', d: 'M0 0 L100 0', length: 100, start: '0%', end: '100%', stroke: '#fff', strokeWidth: 3, easing },
    ];
    new Cinematic({ wrapper: mount }).loadStory(story);
    return 1 - Number((mount.querySelector('#path-a') as SVGPathElement).style.strokeDashoffset) / 100;
  }

  it('draws a story path along the cubic-bezier() it names, not linear', () => {
    const css = drawn(SNAPPY);
    expect(css).toBeCloseTo(snappy(0.5), 6);
    expect(Math.abs(css - drawn('linear'))).toBeGreaterThan(0.05);
  });
});
