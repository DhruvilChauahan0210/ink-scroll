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
  private queue: FrameRequestCallback[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push(cb); return ++this.id; });
  cancel   = vi.fn();
  tick()   { const cb = this.queue.shift(); act(() => cb?.(performance.now())); }
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
  FakeIO.instances[0].trigger(true);
  return seen;
}

function scrollTo(y: number): void {
  vi.stubGlobal('scrollY', y);
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
