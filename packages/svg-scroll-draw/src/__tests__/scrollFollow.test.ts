/**
 * `svg-scroll-draw/follow`: scrollFollow's arithmetic (the point, the tangent,
 * the anchor, the drawn stretch), its window, its instance and destroy().
 *
 * jsdom has no geometry, so the path is stubbed: an L, 100 user units right
 * from (0, 0) and 100 down, 200 long, shown at twice its size with its origin
 * at (10, 20) on screen. Real layout, a real viewBox and real scrolling are in
 * e2e/follow.spec.ts; no DOM at all in ssr.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollFollow } from '../follow';

class RafQueue {
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
}

function scroll(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
  raf.tick();
}

let raf: RafQueue;
let reduce = false;

const rect = (left: number, top: number, width: number, height: number) => ({
  left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}),
});
/**
 * The <svg> is 400 tall at 1000, so its window (top at the middle of the 800
 * viewport, to its bottom there) runs from scroll 600 to 1000. The plane's box
 * is 20 × 10 at (50, 60); the path's origin at (10, 20). All three on the
 * page, so all three move up the screen as it scrolls.
 */
const RECTS: Record<string, ReturnType<typeof rect>> = {
  map: rect(0, 1000, 400, 400),
  plane: rect(50, 60, 20, 10),
};
const CTM = { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 };

beforeEach(() => {
  reduce = false;
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', () => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    // Client coordinates: the page scrolls under them.
    const r = RECTS[this.id] ?? rect(0, 0, 0, 0);
    return rect(r.left, r.top - window.scrollY, r.width, r.height);
  });
  const proto = SVGElement.prototype as unknown as Record<string, unknown>;
  proto.getTotalLength = () => 200;
  proto.getPointAtLength = (l: number) => (l <= 100 ? { x: l, y: 0 } : { x: 100, y: l - 100 });
  proto.getScreenCTM = () => ({ ...CTM, f: CTM.f - window.scrollY });
  proto.getBBox = () => ({ x: -5, y: -5, width: 10, height: 10 });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
  document.body.innerHTML = `
    <svg id="map" viewBox="0 0 200 200">
      <path id="route" d="M0 0H100V100" />
      <circle id="dot" r="5" />
    </svg>
    <div id="plane"></div>`;
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const route = () => document.querySelector('#route') as SVGPathElement;
/** Scroll that puts the window `p` of the way through. */
const yAt = (p: number) => 600 + 400 * p;

describe('scrollFollow — an HTML element over the <svg>', () => {
  it('puts its centre on the path, in px from its own box', () => {
    scrollFollow('#plane', '#route');
    // The start (0, 0) is at (10, 20) on screen: (-40, -40) from the box's top left.
    expect($('#plane').style.transform).toBe('translate(-40px,-40px) rotate(0deg) translate(-10px,-5px)');
    expect($('#plane').style.transformOrigin).toMatch(/^0(px)? 0(px)?$/);
    scroll(yAt(0.25));
    // 50 along: (50, 0), (110, 20) on screen.
    expect($('#plane').style.transform).toBe('translate(60px,-40px) rotate(0deg) translate(-10px,-5px)');
    scroll(yAt(1));
    expect($('#plane').style.transform).toBe('translate(160px,160px) rotate(0deg) translate(-10px,-5px)');
  });

  it('anchor picks the point of its box that sits on the path', () => {
    scrollFollow('#plane', '#route', { anchor: [0, 1] });
    expect($('#plane').style.transform).toBe('translate(-40px,-40px) rotate(0deg) translate(0px,-10px)');
  });

  it('rotate turns it to the tangent, and angle adds to it', () => {
    const a = scrollFollow('#plane', '#route', { rotate: true });
    scroll(yAt(0.25));
    expect($('#plane').style.transform).toContain('rotate(0deg)');
    scroll(yAt(0.75));
    // On the leg going down.
    expect($('#plane').style.transform).toContain('rotate(90deg)');
    a.destroy();
    scrollFollow('#plane', '#route', { rotate: true, angle: 90 });
    expect($('#plane').style.transform).toContain('rotate(180deg)');
  });

  it('angle without rotate is a fixed turn', () => {
    scrollFollow('#plane', '#route', { angle: 45 });
    scroll(yAt(0.75));
    expect($('#plane').style.transform).toContain('rotate(45deg)');
  });

  it('start and end take part of the path, backwards when end < start, through the easing', () => {
    const a = scrollFollow('#plane', '#route', { start: 0.5, end: 0 });
    scroll(yAt(0.5));
    // 0.25 of 200: (50, 0).
    expect($('#plane').style.transform).toMatch(/^translate\(60px,-40px\)/);
    a.destroy();
    scrollFollow('#plane', '#route', { easing: (t) => t * t });
    // 0.25 of the way: (50, 0) again.
    expect($('#plane').style.transform).toMatch(/^translate\(60px,-40px\)/);
  });

  it('writes --scroll-draw-progress and calls onProgress with the window progress', () => {
    const onProgress = vi.fn();
    scrollFollow('#plane', '#route', { onProgress, easing: 'ease-in' });
    scroll(yAt(0.4));
    expect($('#plane').style.getPropertyValue('--scroll-draw-progress')).toBe('0.4');
    expect(onProgress).toHaveBeenLastCalledWith(0.4);
  });

  it('progressVar: false leaves the custom property alone', () => {
    scrollFollow('#plane', '#route', { progressVar: false });
    scroll(yAt(0.4));
    expect($('#plane').style.getPropertyValue('--scroll-draw-progress')).toBe('');
  });
});

describe('scrollFollow — an SVG element in the same <svg>', () => {
  it('moves it through the transform attribute, in its parent user units', () => {
    scrollFollow('#dot', '#route');
    scroll(yAt(0.25));
    // The parent and the path share a CTM: user units straight through; the box's centre is (0, 0).
    expect($('#dot').getAttribute('transform')).toBe('translate(50 0) rotate(0) translate(0 0)');
    expect($('#dot').style.transform).toBe('');
  });

  it('maps through a parent with another CTM', () => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    $('#map').appendChild(g).appendChild($('#dot'));
    // The group is scaled down by 2 from the <svg>: half the path's screen scale.
    (g as unknown as { getScreenCTM: () => unknown }).getScreenCTM = () => ({ a: 4, b: 0, c: 0, d: 4, e: 10, f: 20 });
    scrollFollow('#dot', '#route');
    scroll(yAt(0.25));
    expect($('#dot').getAttribute('transform')).toBe('translate(25 0) rotate(0) translate(0 0)');
  });
});

describe('scrollFollow — draw', () => {
  it('draws the path from the start up to the element, core/dash style', () => {
    scrollFollow('#plane', '#route', { draw: true });
    // Nothing drawn: the whole dash before the path's start.
    expect(route().style.strokeDasharray).toBe('200 400');
    expect(route().style.strokeDashoffset).toBe('200');
    scroll(yAt(0.25));
    expect(route().style.strokeDasharray).toBe('50 400');
    expect(route().style.strokeDashoffset).toBe('0');
  });

  it('with a start, only the stretch it has travelled', () => {
    scrollFollow('#plane', '#route', { draw: true, start: 0.5, end: 1 });
    scroll(yAt(0.5));
    // From 100 to 150.
    expect(route().style.strokeDasharray).toBe('50 400');
    expect(route().style.strokeDashoffset).toBe('-100');
  });

  it('in pathLength units when the path declares one', () => {
    route().setAttribute('pathLength', '1');
    scrollFollow('#plane', '#route', { draw: true });
    scroll(yAt(0.25));
    expect(route().style.strokeDasharray).toBe('0.25 2');
  });
});

describe('scrollFollow — the window and the instance', () => {
  it('a jump past the window lands at the end and fires onComplete once; again after scrolling back', () => {
    const onComplete = vi.fn();
    scrollFollow('#plane', '#route', { onComplete });
    scroll(5000);
    scroll(5100);
    expect($('#plane').style.transform).toMatch(/^translate\(160px,160px\)/);
    expect(onComplete).toHaveBeenCalledTimes(1);
    scroll(0);
    scroll(5000);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('once holds the furthest point', () => {
    const f = scrollFollow('#plane', '#route', { once: true });
    scroll(yAt(0.5));
    scroll(0);
    expect(f.getProgress()).toBe(0.5);
  });

  it('a trigger option moves the window', () => {
    const f = scrollFollow('#plane', '#route', { trigger: { start: 'top bottom', end: 'bottom top' } });
    // 200 → 1400.
    scroll(800);
    expect(f.getProgress()).toBe(0.5);
  });

  it('pause, seek, resume, replay', () => {
    const f = scrollFollow('#plane', '#route');
    f.seek(0.25);
    expect(f.getProgress()).toBe(0.25);
    expect($('#plane').style.transform).toMatch(/^translate\(60px,-40px\)/);
    scroll(yAt(0.9));
    expect(f.getProgress()).toBe(0.25);
    f.resume();
    raf.tick();
    expect(f.getProgress()).toBeCloseTo(0.9);
    f.pause();
    scroll(yAt(0.1));
    expect(f.getProgress()).toBeCloseTo(0.9);
    f.replay();
    raf.tick();
    expect(f.getProgress()).toBeCloseTo(0.1);
  });

  it('refresh re-measures: the element follows its box', () => {
    const f = scrollFollow('#plane', '#route');
    RECTS.plane = rect(60, 60, 20, 10);
    f.refresh();
    expect($('#plane').style.transform).toMatch(/^translate\(-50px,-40px\)/);
    RECTS.plane = rect(50, 60, 20, 10);
  });

  it('destroy() puts back the inline style, the transform attribute and the path', () => {
    $('#plane').style.cssText = 'color: red; transform: scale(2)';
    route().style.strokeDasharray = '4 2';
    $('#dot').setAttribute('transform', 'translate(1 2)');
    const a = scrollFollow('#plane', '#route', { draw: true });
    const b = scrollFollow('#dot', '#route');
    scroll(yAt(0.5));
    a.destroy();
    b.destroy();
    expect($('#plane').style.transform).toBe('scale(2)');
    expect($('#plane').style.color).toBe('red');
    expect($('#plane').style.transformOrigin).toBe('');
    expect($('#plane').style.getPropertyValue('--scroll-draw-progress')).toBe('');
    expect(route().style.strokeDasharray).toBe('4 2');
    expect(route().style.strokeDashoffset).toBe('');
    expect($('#dot').getAttribute('transform')).toBe('translate(1 2)');
    // And the frames stop.
    const before = $('#plane').style.transform;
    scroll(yAt(0.9));
    expect($('#plane').style.transform).toBe(before);
  });

  it('destroy() leaves no style attribute where there was none', () => {
    scrollFollow('#plane', '#route').destroy();
    scrollFollow('#dot', '#route').destroy();
    expect($('#plane').hasAttribute('style')).toBe(false);
    expect($('#dot').hasAttribute('style')).toBe(false);
    expect($('#dot').hasAttribute('transform')).toBe(false);
  });
});

describe('scrollFollow — reduced motion and missing elements', () => {
  it('under reduced motion it is at the end at once, drawn, and stays there', () => {
    reduce = true;
    const onComplete = vi.fn();
    const f = scrollFollow('#plane', '#route', { draw: true, onComplete });
    expect($('#plane').style.transform).toMatch(/^translate\(160px,160px\)/);
    expect(route().style.strokeDasharray).toBe('200 400');
    expect(route().style.strokeDashoffset).toBe('0');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(f.getProgress()).toBe(1);
    f.seek(0);
    scroll(0);
    expect(f.getProgress()).toBe(1);
    f.destroy();
    expect($('#plane').hasAttribute('style')).toBe(false);
  });

  it('a missing element or path warns and gives an inert instance', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = scrollFollow('#nope', '#route');
    expect(f.getProgress()).toBe(0);
    expect(scrollFollow('#plane', '#nope').getProgress()).toBe(0);
    expect(warn).toHaveBeenCalledTimes(2);
    expect($('#plane').hasAttribute('style')).toBe(false);
  });
});
