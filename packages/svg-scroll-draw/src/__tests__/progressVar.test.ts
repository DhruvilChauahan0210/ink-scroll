import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate/engine';
import { scrollReveal } from '../reveal';

/**
 * progressVar (2.29.0). --scroll-draw-progress inherits, so every write
 * recalculates the style of everything inside the element: a 60-card
 * scrollReveal spent 43 of its 66 ms main-thread time on it in Chromium at 4×
 * CPU, and 9 of 31 without it. Every engine takes `progressVar`; only
 * scrollReveal turns it off by default.
 */

const VAR = '--scroll-draw-progress';
let frames: FrameRequestCallback[] = [];
const tick = () => { const f = frames; frames = []; f.forEach((cb) => cb(performance.now())); };

function path(): SVGPathElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  el.setAttribute('stroke', 'black');
  (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  return el;
}
function drawing(): HTMLDivElement {
  const div = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.appendChild(path());
  div.appendChild(svg);
  document.body.appendChild(div);
  return div;
}
function card(): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'card';
  document.body.appendChild(div);
  return div;
}
/** Scroll into the middle of every window the stubs below make. */
function scrollMid(): void {
  vi.stubGlobal('scrollY', 250);
  window.dispatchEvent(new Event('scroll'));
  tick();
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('innerHeight', 500);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {},
  } as DOMRect);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('progressVar', () => {
  it('scrollDraw writes the variable by default and not with progressVar: false', () => {
    const on = drawing();
    const off = drawing();
    createEngine(on, { native: false });
    createEngine(off, { native: false, progressVar: false });
    scrollMid();
    expect(on.style.getPropertyValue(VAR)).not.toBe('');
    expect(off.style.getPropertyValue(VAR)).toBe('');
  });

  it('scrollAnimate writes it by default and not with progressVar: false', () => {
    const on = card();
    const off = card();
    createAnimateEngine(on, { props: { opacity: [0, 1] }, native: false });
    createAnimateEngine(off, { props: { opacity: [0, 1] }, native: false, progressVar: false });
    scrollMid();
    expect(on.style.getPropertyValue(VAR)).not.toBe('');
    expect(off.style.getPropertyValue(VAR)).toBe('');
    // the animation itself still runs
    expect(off.style.opacity).not.toBe('');
  });

  it('scrollReveal leaves it off by default, and writes it with progressVar: true', () => {
    const quiet = card();
    quiet.id = 'quiet';
    const loud = card();
    loud.id = 'loud';
    scrollReveal('#quiet');
    scrollReveal('#loud', { progressVar: true });
    scrollMid();
    expect(quiet.style.getPropertyValue(VAR)).toBe('');
    expect(quiet.style.opacity).not.toBe('');
    expect(loud.style.getPropertyValue(VAR)).not.toBe('');
  });
});
