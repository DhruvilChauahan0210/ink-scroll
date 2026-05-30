/**
 * Tests for the native CSS scroll-driven fast path
 * (`animation-timeline: view()`).
 *
 * jsdom reports no support for `animation-timeline: view()`, so we stub
 * `CSS.supports` to exercise both the native path and the automatic fallback
 * to the JS engine.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../core/engine';
import type { ScrollDrawOptions } from '../core/types';

function makePath(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  el.setAttribute('d', 'M10 20 L30 40');
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}

function makeContainer(paths: SVGPathElement[] = [makePath()]): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  paths.forEach((p) => svg.appendChild(p));
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}

class FakeIO {
  static instances: FakeIO[] = [];
  constructor(public cb: IntersectionObserverCallback) { FakeIO.instances.push(this); }
  observe    = vi.fn();
  disconnect = vi.fn();
}

/** A `<style>` injected by the native path. */
function nativeStyle(): HTMLStyleElement | null {
  return document.head.querySelector('style[data-svg-scroll-draw]');
}

/** The generated class a native path receives, if any. */
function nativeClass(el: Element): string | undefined {
  return Array.from(el.classList).find((c) => /^svg-scroll-draw-\d+$/.test(c));
}

function setSupport(supported: boolean): void {
  vi.stubGlobal('CSS', { supports: vi.fn(() => supported) });
}

beforeEach(() => {
  FakeIO.instances = [];
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0,
    toJSON: () => {},
  } as DOMRect);
  setSupport(true);
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-svg-scroll-draw]').forEach((s) => s.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('native fast path — activation', () => {
  it('uses native CSS for the simple default config', () => {
    const path = makePath();
    const container = makeContainer([path]);
    createEngine(container);

    expect(nativeStyle()).not.toBeNull();
    expect(nativeClass(path)).toBeTruthy();
    expect(path.style.getPropertyValue('--ssd-len')).toBe('100');
    expect(path.style.strokeDasharray).toBe('100');
    // No IntersectionObserver / rAF loop is set up on the native path.
    expect(FakeIO.instances.length).toBe(0);
  });

  it('injects a forward keyframe (dashoffset var → 0)', () => {
    createEngine(makeContainer());
    const css = nativeStyle()!.textContent ?? '';
    expect(css).toContain('@keyframes');
    expect(css).toContain('stroke-dashoffset:var(--ssd-len)'); // from
    expect(css).toContain('stroke-dashoffset:0');               // to
    expect(css).toContain('animation-timeline:view()');
    expect(css).toContain('animation-range:cover 0% cover 100%');
  });

  it('reverse direction flips the keyframe offsets', () => {
    createEngine(makeContainer(), { direction: 'reverse' });
    const css = nativeStyle()!.textContent ?? '';
    // from 0 → to var(--ssd-len)
    expect(css).toMatch(/from\{stroke-dashoffset:0/);
    expect(css).toMatch(/to\{stroke-dashoffset:var\(--ssd-len\)/);
  });

  it('fade adds opacity to the keyframes', () => {
    createEngine(makeContainer(), { fade: true });
    const css = nativeStyle()!.textContent ?? '';
    expect(css).toContain('opacity:0');
    expect(css).toContain('opacity:1');
  });

  it('maps named easings to a CSS timing-function', () => {
    createEngine(makeContainer(), { easing: 'ease-in-out' });
    expect(nativeStyle()!.textContent).toContain('animation-timing-function:ease-in-out');
  });
});

describe('native fast path — fallback to JS engine', () => {
  const ineligible: Array<[string, ScrollDrawOptions]> = [
    ['native: false',        { native: false }],
    ['once',                 { once: true }],
    ['stagger',              { stagger: 0.2 }],
    ['custom easing fn',     { easing: (t) => t }],
    ['spring easing',        { easing: 'spring' }],
    ['onComplete callback',  { onComplete: () => {} }],
    ['onProgress callback',  { onProgress: () => {} }],
    ['custom trigger',       { trigger: { start: 'top center' } }],
    ['speed !== 1',          { speed: 1.5 }],
    ['autoReverse',          { autoReverse: true }],
    ['velocityScale',        { velocityScale: true }],
    ['morphTo',              { morphTo: 'M0 0 L1 1' }],
    ['waypoints',            { waypoints: { 0.5: () => {} } }],
    ['repeat',               { repeat: 2 }],
    ['strokeColor',          { strokeColor: '#f00' }],
    ['axis x',               { axis: 'x' }],
  ];

  it.each(ineligible)('falls back to JS for %s', (_label, opts) => {
    const path = makePath();
    createEngine(makeContainer([path]), opts);
    expect(nativeStyle()).toBeNull();
    expect(nativeClass(path)).toBeUndefined();
    // JS engine sets up an IntersectionObserver.
    expect(FakeIO.instances.length).toBe(1);
  });

  it('falls back when the browser lacks animation-timeline support', () => {
    setSupport(false);
    const path = makePath();
    createEngine(makeContainer([path]));
    expect(nativeStyle()).toBeNull();
    expect(FakeIO.instances.length).toBe(1);
  });
});

describe('native fast path — instance API', () => {
  it('getProgress reports live scroll progress', () => {
    const instance = createEngine(makeContainer());
    // rect top=0,h=500, scrollY=0, vp=800 → (0-(-800))/(500-(-800)) = 0.615
    expect(instance.getProgress()).toBeCloseTo(0.615, 2);
  });

  it('pause / resume toggle animation-play-state', () => {
    const path = makePath();
    const instance = createEngine(makeContainer([path]));
    instance.pause();
    expect(path.style.animationPlayState).toBe('paused');
    instance.resume();
    expect(path.style.animationPlayState).toBe('running');
  });

  it('seek leaves the timeline and pins the frame', () => {
    const path = makePath();
    const instance = createEngine(makeContainer([path]));
    instance.seek(0.25);
    // forward: dashoffset = len * (1 - p) = 100 * 0.75
    expect(path.style.strokeDashoffset).toBe('75');
    expect(nativeClass(path)).toBeUndefined(); // detached from the timeline class
    expect(instance.getProgress()).toBe(0.25);
  });

  it('replay re-attaches the timeline class after a seek', () => {
    const path = makePath();
    const instance = createEngine(makeContainer([path]));
    instance.seek(0.5);
    expect(nativeClass(path)).toBeUndefined();
    instance.replay();
    expect(nativeClass(path)).toBeTruthy();
    expect(instance.getProgress()).toBeCloseTo(0.615, 2);
  });

  it('destroy removes the style element and the class', () => {
    const path = makePath();
    const instance = createEngine(makeContainer([path]));
    expect(nativeStyle()).not.toBeNull();
    instance.destroy();
    expect(nativeStyle()).toBeNull();
    expect(nativeClass(path)).toBeUndefined();
  });
});
