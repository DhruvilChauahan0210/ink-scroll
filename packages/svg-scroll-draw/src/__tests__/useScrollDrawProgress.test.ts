import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, useRef, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useScrollDrawProgress, type UseScrollDrawProgressOptions } from '../react/useScrollDrawProgress';

/*
 * useScrollDrawProgress with `once`. It held the eased value with Math.max, as
 * the engines did up to 2.23.2, so an easing that overshoots stayed on its
 * peak: the hook returned 1.25 for good under 'elastic'. It holds the raw
 * progress now and eases that.
 *
 * The element sits below the fold (rect top 1000, height 200, viewport 800),
 * so the default window, top bottom → bottom top, is [200, 1200], and a fifth
 * of it, elastic's peak, is y = 400.
 */

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
  tick() { const frame = this.queue; this.queue = []; act(() => { for (const f of frame) f.cb(performance.now()); }); }
}

class FakeIO {
  static instances: FakeIO[] = [];
  constructor(private cb: IntersectionObserverCallback) { FakeIO.instances.push(this); }
  observe    = vi.fn();
  disconnect = vi.fn();
  trigger(isIntersecting: boolean) {
    act(() => this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver));
  }
}

/**
 * Scroll the page: set the offset and fire a scroll event, as a browser does.
 * The frames follow the trigger window and wake on scroll (core/frame-gate),
 * so moving `scrollY` alone is not a scroll.
 */
function scroll(y?: number): void {
  if (y !== undefined) vi.stubGlobal('scrollY', y);
  act(() => { window.dispatchEvent(new Event('scroll')); });
}

let raf: RafQueue;
let root: Root | null = null;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  FakeIO.instances = [];
  raf = new RafQueue();
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 1000, height: 200, left: 0, width: 300, right: 300, bottom: 1200, x: 0, y: 1000, toJSON: () => ({}),
  } as DOMRect);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Mount a component using the hook; returns every value it rendered. */
function mount(options: UseScrollDrawProgressOptions): number[] {
  const seen: number[] = [];
  function Probe() {
    const ref = useRef<HTMLDivElement>(null);
    seen.push(useScrollDrawProgress(ref, options));
    return createElement('div', { ref });
  }
  const host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Probe)));
  scroll();
  return seen;
}

function scrollTo(y: number): void {
  scroll(y);
  raf.tick();
}

describe('useScrollDrawProgress — once', () => {
  it('elastic overshoots on the way and ends exactly on 1', () => {
    const seen = mount({ once: true, easing: 'elastic' });
    scrollTo(400);
    expect(seen.at(-1)).toBeCloseTo(1.25, 6);
    scrollTo(1300);
    expect(seen.at(-1)).toBe(1);
    scrollTo(0); // back: held
    expect(seen.at(-1)).toBe(1);
  });

  it('bounce keeps its dips while scrolling forward', () => {
    const seen = mount({ once: true, easing: 'bounce' });
    const frames: number[] = [];
    for (let y = 200; y <= 1200; y += 20) {
      scrollTo(y);
      frames.push(seen.at(-1)!);
    }
    expect(frames.some((p, i) => i > 0 && p < frames[i - 1] - 1e-9)).toBe(true);
    expect(frames.at(-1)).toBe(1);
  });

  it('linear holds the furthest point, as before', () => {
    const seen = mount({ once: true });
    scrollTo(800);
    expect(seen.at(-1)).toBeCloseTo(0.6, 6);
    scrollTo(300);
    expect(seen.at(-1)).toBeCloseTo(0.6, 6);
  });
});

/*
 * With a scrollContainer the hook added the element's viewport top to the
 * container's scrollTop, leaving out where the container itself sits. Measured
 * in Chromium: a panel 400px down the page read 0, 0, 0.192, 0.442, 0.692 where
 * scrollProgress read 0, 0.25, 0.5, 0.75, 1. It measures as the engines do now
 * (core/trigger-frame), and follows the layout as they do (core/layout-watch).
 *
 * The container is 400px tall, 400px down the page; the panel, 200px tall, is
 * 600px into its content. Window: [600 − 400, 600 + 200] = [200, 800].
 */
describe('useScrollDrawProgress — scrollContainer', () => {
  let scrollTop = 0;
  let panelAt = 600;
  let box: HTMLDivElement;

  function container(border = 0): HTMLDivElement {
    box = document.createElement('div');
    document.body.appendChild(box);
    Object.defineProperty(box, 'scrollTop', { get: () => scrollTop, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(box, 'clientTop', { value: border, configurable: true });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const top = this === box ? 400 : 400 + border + panelAt - scrollTop;
      // The page grows with what arrives above the panel.
      const height = this === box ? 400 + 2 * border : this === document.body ? 1000 + panelAt : 200;
      return { top, height, left: 0, width: 300, right: 300, bottom: top + height, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
    });
    return box;
  }

  function scrollBox(y: number): void {
    scrollTop = y;
    act(() => { box.dispatchEvent(new Event('scroll')); });
    raf.tick();
  }

  beforeEach(() => { scrollTop = 0; panelAt = 600; });

  it('reads the same progress as the engines, from 0 to 1', () => {
    const seen = mount({ scrollContainer: container() });
    const read: number[] = [];
    for (const y of [200, 350, 500, 650, 800]) {
      scrollBox(y);
      read.push(seen.at(-1)!);
    }
    read.forEach((p, i) => expect(p, `at ${[200, 350, 500, 650, 800][i]}: ${read.join(', ')}`).toBeCloseTo(i / 4, 6));
  });

  it('measures from inside the container’s border', () => {
    const seen = mount({ scrollContainer: container(20) });
    scrollBox(500);
    expect(seen.at(-1)).toBeCloseTo(0.5, 6);
  });

  it('follows a layout change that is not a window resize', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const observed: Array<() => void> = [];
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: ResizeObserverCallback) {
        observed.push(() => cb([{ target: document.body } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    try {
      const seen = mount({ scrollContainer: container() });
      panelAt = 800; // content arrived above the panel: window [400, 1000]
      observed.forEach((fire) => fire());
      vi.advanceTimersByTime(150);
      scrollBox(700);
      expect(seen.at(-1)).toBeCloseTo(0.5, 6);
    } finally {
      vi.useRealTimers();
    }
  });
});
