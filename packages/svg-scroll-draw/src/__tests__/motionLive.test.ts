import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, useRef, act } from 'react';
import { createRoot } from 'react-dom/client';
import { finishWhenReduced } from '../core/motion-live';
import { scrollDraw } from '../index';
import { scrollAnimate } from '../animate';
import { scrollReveal } from '../reveal';
import { scrollText } from '../text';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { Cinematic } from '../cinematic';
import type { Story } from '../cinematic/story';
import { useScrollDrawProgress } from '../react/useScrollDrawProgress';

/*
 * Reduced motion turned on while the page is open. Every engine used to read
 * the preference once, at start-up, so a reader who turned it on mid-visit kept
 * the motion until a reload; only scrollSnap and the timeline's loop followed
 * it. Now each one finishes at once, as a page loaded under reduced motion
 * would show it, and stays finished if the setting is turned off again.
 */

// ── fakes ────────────────────────────────────────────────────────────────────

/** The preference, and everything listening to it, as the browser holds them. */
let reduced = false;
let listeners: Array<(e: { matches: boolean }) => void> = [];

function setReducedMotion(on: boolean): void {
  reduced = on;
  [...listeners].forEach((cb) => cb({ matches: on }));
}

class FakeIO {
  static instances: FakeIO[] = [];
  cb: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  reduced = false;
  listeners = [];
  FakeIO.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') && reduced,
    media: query,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => { listeners.push(cb); },
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners = listeners.filter((l) => l !== cb);
    },
  }));
  // Every element sits below the fold: nothing has started.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 900, height: 200, left: 0, width: 300, right: 300, bottom: 1100, x: 0, y: 900, toJSON: () => ({}),
  } as DOMRect);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fakeInstance(progress = 0) {
  return {
    destroy: vi.fn(),
    replay: vi.fn(),
    seek: vi.fn(),
    getProgress: vi.fn(() => progress),
  };
}

// ── the shared helper ────────────────────────────────────────────────────────

describe('finishWhenReduced', () => {
  it('builds once, reduced, when the page loads under reduced motion, and does not listen', () => {
    reduced = true;
    const build = vi.fn(() => fakeInstance());
    finishWhenReduced({}, build);
    expect(build).toHaveBeenCalledOnce();
    expect(build).toHaveBeenCalledWith({}, true);
    expect(listeners).toHaveLength(0);
  });

  it('rebuilds reduced when the reader turns it on, behind the same object', () => {
    const first = fakeInstance();
    const second = fakeInstance(1);
    const build = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const inst = finishWhenReduced({}, build);
    // A page that took a method off the instance keeps reaching the live one.
    const { seek } = inst;
    expect(build).toHaveBeenLastCalledWith({}, false);
    expect(listeners).toHaveLength(1);

    setReducedMotion(true);

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(build).toHaveBeenCalledTimes(2);
    expect(build).toHaveBeenLastCalledWith({}, true);
    expect(inst.getProgress()).toBe(1);
    seek(0.5);
    expect(second.seek).toHaveBeenCalledWith(0.5);
    expect(first.seek).not.toHaveBeenCalled();
    expect(listeners, 'still listening after the rebuild').toHaveLength(0);
  });

  it('keeps onComplete for an instance that had not finished, and drops it for one that had', () => {
    const onComplete = vi.fn();

    const unfinished = vi.fn().mockReturnValueOnce(fakeInstance(0.4)).mockReturnValueOnce(fakeInstance(1));
    finishWhenReduced({ onComplete }, unfinished);
    setReducedMotion(true);
    expect(unfinished).toHaveBeenLastCalledWith({ onComplete }, true);

    setReducedMotion(false);
    const finished = vi.fn().mockReturnValueOnce(fakeInstance(1)).mockReturnValueOnce(fakeInstance(1));
    finishWhenReduced({ onComplete }, finished);
    setReducedMotion(true);
    expect(finished).toHaveBeenLastCalledWith({ onComplete: undefined }, true);
  });

  it('stays finished when reduced motion is turned off again', () => {
    const build = vi.fn().mockReturnValueOnce(fakeInstance()).mockReturnValueOnce(fakeInstance(1));
    finishWhenReduced({}, build);
    setReducedMotion(true);
    setReducedMotion(false);
    setReducedMotion(true);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it('stops listening on destroy, before and after a rebuild', () => {
    const first = fakeInstance();
    const build = vi.fn().mockReturnValueOnce(first);
    finishWhenReduced({}, build).destroy();
    expect(first.destroy).toHaveBeenCalledOnce();
    expect(listeners).toHaveLength(0);
    setReducedMotion(true);
    expect(build).toHaveBeenCalledOnce();

    setReducedMotion(false);
    const a = fakeInstance();
    const b = fakeInstance(1);
    const inst = finishWhenReduced({}, vi.fn().mockReturnValueOnce(a).mockReturnValueOnce(b));
    setReducedMotion(true);
    inst.destroy();
    expect(b.destroy).toHaveBeenCalledOnce();
    expect(a.destroy).toHaveBeenCalledOnce();
  });
});

// ── the engines ──────────────────────────────────────────────────────────────

function drawing(): { svg: SVGSVGElement; path: SVGPathElement } {
  document.body.innerHTML = '<svg viewBox="0 0 100 100"><path d="M0 0 L100 0" stroke="#000"/></svg>';
  const svg = document.querySelector('svg')!;
  const path = svg.querySelector('path')!;
  (path as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return { svg, path };
}

describe('the engines, when reduced motion is turned on mid-visit', () => {
  it('scrollDraw draws every path and fires onComplete once', () => {
    const { svg, path } = drawing();
    const onComplete = vi.fn();
    const inst = scrollDraw(svg, { native: false, onComplete });
    expect(path.style.strokeDashoffset).toBe('100');

    setReducedMotion(true);

    expect(path.style.strokeDashoffset).toBe('0');
    expect(inst.getProgress()).toBe(1);
    expect(onComplete).toHaveBeenCalledOnce();
    // Nothing moves it back: the reduced instance ignores replay and seek.
    inst.replay();
    inst.seek(0);
    expect(path.style.strokeDashoffset).toBe('0');
    inst.destroy();
  });

  it('scrollDraw does not fire onComplete again for a drawing already at its end', () => {
    const { svg } = drawing();
    const onComplete = vi.fn();
    const inst = scrollDraw(svg, { native: false, onComplete });
    inst.seek(1);
    const before = onComplete.mock.calls.length;
    setReducedMotion(true);
    expect(onComplete).toHaveBeenCalledTimes(before);
    inst.destroy();
  });

  it('scrollReveal shows every element', () => {
    document.body.innerHTML = '<div class="card">a</div><div class="card">b</div>';
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.card'));
    const inst = scrollReveal('.card');
    expect(cards.map((c) => c.style.opacity)).toEqual(['0', '0']);

    setReducedMotion(true);

    expect(cards.map((c) => c.style.opacity)).toEqual(['1', '1']);
    inst.destroy();
    expect(listeners).toHaveLength(0);
  });

  it('scrollAnimate with respectReducedMotion: false does not listen at all', () => {
    document.body.innerHTML = '<div id="a"></div>';
    scrollAnimate('#a', { props: { opacity: [0, 1] }, native: false, respectReducedMotion: false });
    expect(listeners).toHaveLength(0);
  });

  it('scrollText shows the final text, with one copy for screen readers', () => {
    const TEXT = 'Ship real browser tests';
    document.body.innerHTML = `<p id="t">${TEXT}</p>`;
    const p = document.getElementById('t')!;
    const onComplete = vi.fn();
    const inst = scrollText(p, { onComplete });
    // The words; the spaces between them are pieces too, but never animated.
    const pieces = () => Array.from(p.querySelectorAll<HTMLElement>('span[aria-hidden="true"]')).filter((s) => s.textContent!.trim());
    expect(pieces().every((s) => s.style.opacity === '0')).toBe(true);

    setReducedMotion(true);

    expect(pieces().length).toBeGreaterThan(0);
    expect(pieces().every((s) => s.style.opacity === '1')).toBe(true);
    const copies = Array.from(p.querySelectorAll('span')).filter((s) => s.textContent === TEXT);
    expect(copies).toHaveLength(1);
    expect(onComplete).toHaveBeenCalledOnce();
    inst.destroy();
    expect(p.innerHTML).toBe(TEXT);
  });

  it('scrollCounter writes the final number', () => {
    document.body.innerHTML = '<span id="n">0</span>';
    const el = document.getElementById('n')!;
    const onComplete = vi.fn();
    const inst = scrollCounter(el, { from: 0, to: 120, onComplete });
    expect(el.textContent).toBe('0');

    setReducedMotion(true);

    expect(el.textContent).toBe('120');
    expect(inst.getProgress()).toBe(1);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('scrollVideo stops on the end frame', () => {
    document.body.innerHTML = '<video></video>';
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'readyState', { value: 1 });
    Object.defineProperty(video, 'duration', { value: 5 });
    Object.defineProperty(video, 'currentTime', { value: 0, writable: true });
    vi.spyOn(video, 'pause').mockImplementation(() => {});
    const inst = scrollVideo(video);
    window.dispatchEvent(new Event('scroll'));

    setReducedMotion(true);

    expect(video.currentTime).toBe(5);
    expect(listeners).toHaveLength(0);
    inst.destroy();
  });

  it('Cinematic shows its finished frame and stops scrubbing', () => {
    const story: Story = {
      version: 1,
      totalHeight: '400vh',
      canvas: { width: 1200, height: 800 },
      scenes: [{
        id: 's',
        background: 'data:image/png;base64,AAAA',
        animations: [
          { type: 'fade', target: '#cinematic-photo', start: '45%', end: '70%', from: 0, to: 1 },
          { type: 'draw', target: '#a', d: 'M0 0 L100 0', length: 100, start: '10%', end: '40%', stroke: '#fff', strokeWidth: 3, easing: 'linear' },
        ],
      }],
    };
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    Object.defineProperty(mount, 'offsetHeight', { value: 1768 });
    vi.spyOn(mount, 'getBoundingClientRect').mockReturnValue({ top: 0, height: 768 } as DOMRect);
    const remove = vi.spyOn(window, 'removeEventListener');
    const inst = new Cinematic({ wrapper: mount }).loadStory(story);
    expect(inst.getProgress()).toBeCloseTo(0, 5);

    setReducedMotion(true);

    expect(inst.getProgress()).toBe(1);
    expect(Number((mount.querySelector('#a') as SVGPathElement).style.strokeDashoffset)).toBeCloseTo(0, 5);
    expect(Number((mount.querySelector('#cinematic-photo') as HTMLElement).style.opacity)).toBeCloseTo(1, 5);
    // Its frames stop: the scroll listener goes (core/frame-gate, since 2.23.7).
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(mount.querySelectorAll('svg')).toHaveLength(1);
    inst.destroy();
  });

  it('useScrollDrawProgress reports 1', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const seen: number[] = [];
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      seen.push(useScrollDrawProgress(ref));
      return createElement('div', { ref });
    }
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(Probe)));
    expect(seen.at(-1)).toBe(0);

    act(() => setReducedMotion(true));

    expect(seen.at(-1)).toBe(1);
    expect(listeners).toHaveLength(0);
    act(() => root.unmount());
  });
});
