import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, useRef, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createEngine } from '../core/engine';
import { scrollCounter } from '../counter';
import { scrollText } from '../text';
import { scrollVideo } from '../video';
import { scrollProgress } from '../progress';
import { scrollDrawTimeline } from '../timeline';
import { useScrollDrawProgress } from '../react/useScrollDrawProgress';
import { Cinematic, type CinematicInstance } from '../cinematic';
import type { ScrollDrawInstance } from '../core/types';

/*
 * What runs each engine's frames. Up to 2.23.4 every engine but scrollAnimate
 * ran its frame loop only while an IntersectionObserver saw the element, so a
 * jump across the whole trigger window (the End key, an anchor link, the scroll
 * a reload restores) never had the element on screen: it painted nothing, kept
 * its first frame and never fired onComplete. 2.23.4 moved scrollAnimate to the
 * trigger window (core/frame-gate); 2.23.5 moves the rest.
 *
 * The observer here never reports the element, as in a browser during such a
 * jump. Every element sits below the fold: rect top 1000, height 400, viewport
 * 800, so `top bottom` → `bottom top` is [200, 1400].
 */

class RafQueue {
  queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
  cancel = vi.fn();
  /** One frame: every callback queued before it, as a browser runs them. */
  tick() {
    const frame = this.queue;
    this.queue = [];
    act(() => { for (const cb of frame) cb(performance.now()); });
  }
}

class SilentIO {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

let raf: RafQueue;
let rects: ReturnType<typeof vi.spyOn>;
let root: Root | null = null;
/** Every instance a test made: destroyed after it, so no listener outlives its test. */
const made: ScrollDrawInstance[] = [];

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  raf = new RafQueue();
  vi.stubGlobal('IntersectionObserver', SilentIO);
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  rects = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    // Document position minus the scroll, as a browser reports it.
    const top = 1000 - window.scrollY;
    return { top, height: 400, left: 0, width: 300, right: 300, bottom: top + 400, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  made.splice(0).forEach((i) => i.destroy());
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Scroll the page: a scroll event, as a browser fires one. */
function scroll(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
}

function svgWith(n: number): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (let i = 0; i < n; i++) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('stroke', 'black');
    p.setAttribute('class', 'a');
    (p as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
    svg.appendChild(p);
  }
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}

const paths = (el: Element) => Array.from(el.querySelectorAll<SVGPathElement>('path'));

function video(): HTMLVideoElement {
  const v = document.createElement('video');
  Object.defineProperty(v, 'readyState', { value: 1, writable: true });
  Object.defineProperty(v, 'duration', { value: 5, writable: true });
  v.pause = vi.fn();
  document.body.appendChild(v);
  return v;
}

function text(): HTMLParagraphElement {
  const p = document.createElement('p');
  p.textContent = 'one two three';
  document.body.appendChild(p);
  return p;
}

interface Case {
  name: string;
  /** Build the instance, below the fold, with `done` as its onComplete if it has one. */
  make: (done: () => void) => { inst?: ScrollDrawInstance; final: () => unknown; start: () => unknown };
  /** The value `final` reads once the window is behind the scroll. */
  want: unknown;
  /** Whether it has an onComplete. */
  completes: boolean;
}

let hookSeen: number[] = [];
function mountHook(): void {
  hookSeen = [];
  function Probe() {
    const ref = useRef<HTMLDivElement>(null);
    hookSeen.push(useScrollDrawProgress(ref));
    return createElement('div', { ref });
  }
  const host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Probe)));
}

const CASES: Case[] = [
  {
    name: 'scrollDraw',
    make: (done) => {
      const c = svgWith(1);
      const inst = createEngine(c, { onComplete: done, native: false });
      return { inst, final: () => paths(c)[0].style.strokeDashoffset, start: () => paths(c)[0].style.strokeDashoffset };
    },
    want: '0',
    completes: true,
  },
  {
    name: 'scrollDraw with stagger',
    make: (done) => {
      const c = svgWith(3);
      const inst = createEngine(c, { onComplete: done, native: false, stagger: 0.3 });
      return { inst, final: () => paths(c).map((p) => p.style.strokeDashoffset).join(), start: () => paths(c)[2].style.strokeDashoffset };
    },
    want: '0,0,0',
    completes: true,
  },
  {
    name: 'scrollDraw clip mode',
    make: (done) => {
      const c = svgWith(0);
      const inst = createEngine(c, { onComplete: done, native: false, clip: true });
      return { inst, final: () => c.style.clipPath, start: () => c.style.clipPath };
    },
    want: 'inset(0 0% 0 0)',
    completes: true,
  },
  {
    name: 'scrollCounter',
    make: (done) => {
      const el = document.createElement('span');
      document.body.appendChild(el);
      const inst = scrollCounter(el, { to: 100, onComplete: done });
      return { inst, final: () => el.textContent, start: () => el.textContent };
    },
    want: '100',
    completes: true,
  },
  {
    name: 'scrollText',
    make: (done) => {
      const el = text();
      const inst = scrollText(el, { onComplete: done, split: 'words' });
      const units = () => Array.from(el.querySelectorAll<HTMLElement>('span')).filter((s) => s.style.opacity !== '');
      return { inst, final: () => units().map((s) => s.style.opacity).join(), start: () => units()[0].style.opacity };
    },
    want: '1,1,1',
    completes: true,
  },
  {
    name: 'scrollVideo',
    make: (done) => {
      const v = video();
      const inst = scrollVideo(v, { onComplete: done, trigger: { start: 'top bottom', end: 'bottom top' } });
      return { inst, final: () => v.currentTime, start: () => v.currentTime };
    },
    want: 5,
    completes: true,
  },
  {
    name: 'scrollProgress',
    make: () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const inst = scrollProgress(el);
      return { inst, final: () => el.style.getPropertyValue('--scroll-progress'), start: () => el.style.getPropertyValue('--scroll-progress') };
    },
    want: '1',
    completes: false,
  },
  {
    name: 'scrollDrawTimeline',
    make: (done) => {
      const c = svgWith(1);
      const inst = scrollDrawTimeline(c, { tracks: [{ selector: '.a', from: 0, to: 1 }], onComplete: done });
      return { inst, final: () => paths(c)[0].style.strokeDashoffset, start: () => paths(c)[0].style.strokeDashoffset };
    },
    want: '0',
    completes: true,
  },
  {
    name: 'useScrollDrawProgress',
    make: () => {
      mountHook();
      return { final: () => hookSeen.at(-1), start: () => hookSeen.at(-1) };
    },
    want: 1,
    completes: false,
  },
];

describe.each(CASES)('$name frames follow the trigger window', ({ make, want, completes }) => {
  it('a jump across the whole window paints the last frame and completes', () => {
    const done = vi.fn();
    const { inst, final } = make(done);
    if (inst) made.push(inst);
    raf.tick();
    scroll(3000); // never on screen in between
    raf.tick();
    raf.tick();
    expect(final()).toEqual(want);
    if (inst) expect(inst.getProgress()).toBe(1);
    if (completes) expect(done).toHaveBeenCalledTimes(1);
  });

  it('runs no frames and reads no layout while the scroll stays outside its window', () => {
    const { inst, start } = make(() => {});
    if (inst) made.push(inst);
    raf.tick();
    raf.tick();
    const before = start();
    const frames = raf.schedule.mock.calls.length;
    const reads = rects.mock.calls.length;
    for (const y of [20, 80, 150, 60, 0]) scroll(y); // the window starts at 200
    expect(raf.schedule.mock.calls.length - frames).toBe(0);
    expect(rects.mock.calls.length - reads).toBe(0);
    expect(start()).toEqual(before);
    // The scroll that enters it wakes the frames.
    scroll(800);
    expect(raf.schedule.mock.calls.length - frames).toBe(1);
  });

  it('loaded already past its window, it paints the last frame', () => {
    vi.stubGlobal('scrollY', 3000); // a restored scroll, or an anchor
    const done = vi.fn();
    const { inst, final } = make(done);
    if (inst) made.push(inst);
    raf.tick();
    raf.tick();
    expect(final()).toEqual(want);
    if (completes) expect(done).toHaveBeenCalledTimes(1);
  });
});

/*
 * Cinematic ran its frames while an IntersectionObserver saw its sticky stage,
 * the last engine to, until 2.23.7: a jump past the mount never had the stage
 * on screen, so the story kept its first frame. And each of those frames read
 * the mount's rect and height: layout, every frame.
 *
 * The mount here is 1200 tall from 1000 in a viewport of 800, so the story
 * scrubs from 1000 (its top at the viewport's top) to 1400 (its bottom at the
 * viewport's bottom). One path, 100 long, drawn over the whole of it.
 */
describe('Cinematic frames follow its window', () => {
  const cines: CinematicInstance[] = [];
  afterEach(() => { cines.splice(0).forEach((c) => c.destroy()); });

  function cinematic(height = 1200) {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    Object.defineProperty(mount, 'offsetHeight', { value: height, configurable: true });
    const inst = new Cinematic({ wrapper: mount }).loadStory({
      version: 1,
      totalHeight: height + 'px',
      canvas: { width: 100, height: 100 },
      scenes: [{ id: 's', animations: [{
        type: 'draw', target: '#cine', d: 'M0 0 L100 0', length: 100,
        start: '0%', end: '100%', stroke: '#000', strokeWidth: 1, easing: 'linear',
      }] }],
    });
    cines.push(inst);
    const path = mount.querySelector<SVGPathElement>('#cine')!;
    return { mount, inst, offset: () => path.style.strokeDashoffset };
  }

  it('a jump past the whole story paints its last frame', () => {
    const { inst, offset } = cinematic();
    raf.tick();
    expect(offset()).toBe('100');
    scroll(3000); // the stage never on screen in between
    raf.tick();
    raf.tick();
    expect(offset()).toBe('0');
    expect(inst.getProgress()).toBe(1);
    // And back before it: the first frame.
    scroll(0);
    raf.tick();
    expect(offset()).toBe('100');
    expect(inst.getProgress()).toBe(0);
  });

  it('runs no frames and reads no layout while the scroll stays outside its window', () => {
    const { offset } = cinematic();
    raf.tick();
    raf.tick();
    const frames = raf.schedule.mock.calls.length;
    const reads = rects.mock.calls.length;
    for (const y of [20, 400, 900, 60, 0]) scroll(y); // the window starts at 1000
    expect(raf.schedule.mock.calls.length - frames).toBe(0);
    expect(rects.mock.calls.length - reads).toBe(0);
    expect(offset()).toBe('100');
    // The scroll that enters it wakes the frames.
    scroll(1100);
    expect(raf.schedule.mock.calls.length - frames).toBe(1);
  });

  it('inside its window a frame reads no layout: the window is measured once', () => {
    const { inst, offset } = cinematic();
    raf.tick();
    const reads = rects.mock.calls.length;
    for (const y of [1100, 1200, 1300]) {
      scroll(y);
      raf.tick();
      expect(inst.getProgress()).toBeCloseTo((y - 1000) / 400, 9);
    }
    expect(offset()).toBe('25');
    expect(rects.mock.calls.length - reads).toBe(0);
    // Resting inside it: one frame more finds nothing moved and stops.
    raf.tick();
    raf.tick();
    expect(raf.queue.length).toBe(1); // the loop runs while inside, as every engine's does
  });

  it('loaded already past its story, it paints the last frame', () => {
    vi.stubGlobal('scrollY', 3000);
    const { inst, offset } = cinematic();
    raf.tick();
    expect(offset()).toBe('0');
    expect(inst.getProgress()).toBe(1);
  });

  it('a story with no scroll room is done once its top passes the viewport top', () => {
    const { inst, offset } = cinematic(400);
    raf.tick();
    expect(inst.getProgress()).toBe(0);
    scroll(999);
    raf.tick();
    expect(offset()).toBe('100');
    scroll(1000);
    raf.tick();
    expect(offset()).toBe('0');
    expect(inst.getProgress()).toBe(1);
  });

  it('re-measures its window after a resize, not on a scroll', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const { mount, inst } = cinematic();
      raf.tick();
      // Content above it grew by 200: the story now scrubs 1200 to 1600.
      rects.mockImplementation(function (this: Element) {
        const top = 1200 - window.scrollY;
        return { top, height: 400, left: 0, width: 300, right: 300, bottom: top + 400, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
      });
      void mount;
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(150);
      scroll(1300);
      raf.tick();
      expect(inst.getProgress()).toBeCloseTo(0.25, 9);
    } finally {
      vi.useRealTimers();
    }
  });

  it('destroy() stops the frames and the listeners', () => {
    const { inst, offset } = cinematic();
    raf.tick();
    inst.destroy();
    const frames = raf.schedule.mock.calls.length;
    scroll(1200);
    raf.tick();
    expect(raf.schedule.mock.calls.length - frames).toBe(0);
    expect(offset()).toBe('100');
  });
});
