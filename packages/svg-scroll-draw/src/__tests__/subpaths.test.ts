/**
 * `svg-scroll-draw/subpaths`: splitSubpaths and joinSubpaths, and scrollDraw
 * drawing the pieces as ordinary paths.
 *
 * jsdom has no geometry: a path's length here is the sum of its `H` runs
 * (`lengthOf`), which is all these drawings use, and the end point a relative
 * `m` starts from is stubbed. Real geometry, real dashes and the frameworks
 * are in e2e/subpaths.spec.ts; no DOM at all in ssr.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { splitSubpaths, joinSubpaths } from '../subpaths';
import { createEngine } from '../core/engine';

/** The sum of the `H`/`h` runs from each subpath's start: these drawings' length. */
function lengthOf(d: string): number {
  let len = 0;
  let x = 0;
  for (const [, c, n] of d.matchAll(/([MHh])\s*(-?[\d.]+)/g)) {
    if (c === 'M') x = +n;
    else {
      const to = c === 'H' ? +n : x + +n;
      len += Math.abs(to - x);
      x = to;
    }
  }
  return len;
}

const THREE = 'M0 0 H360 M0 10 H180 M0 20 H80';

function makeSvg(...ds: string[]): SVGSVGElement {
  const div = document.createElement('div');
  div.innerHTML =
    `<svg>${ds.map((d, i) => `<path id="p${i}" class="line" stroke="red" transform="translate(1 2)" pathLength="1" d="${d}"/>`).join('')}</svg>`;
  document.body.appendChild(div);
  return div.firstElementChild as SVGSVGElement;
}

const ds = (root: Element) => Array.from(root.querySelectorAll('path')).map((p) => p.getAttribute('d'));

beforeEach(() => {
  document.body.innerHTML = '';
  const proto = SVGElement.prototype as unknown as {
    getTotalLength: () => number;
    getPointAtLength: () => { x: number; y: number };
  };
  proto.getTotalLength = function (this: SVGElement) {
    return lengthOf(this.getAttribute('d') ?? '');
  };
  proto.getPointAtLength = () => ({ x: 7, y: 9 });
});

describe('splitSubpaths', () => {
  it('cuts a path before every moveto: the path keeps the first, copies after it hold the rest', () => {
    const svg = makeSvg(THREE);
    const orig = svg.querySelector('path')!;
    expect(splitSubpaths(svg)).toBe(svg);
    const paths = Array.from(svg.querySelectorAll('path'));
    expect(ds(svg)).toEqual(['M0 0 H360 ', 'M0 10 H180 ', 'M0 20 H80']);
    expect(paths[0]).toBe(orig); // a framework still finds its node
    expect(orig.id).toBe('p0');
    expect(orig.hasAttribute('data-scroll-draw-split')).toBe(true);
    expect(orig.hasAttribute('pathLength')).toBe(false); // each piece in its own units
    for (const p of paths.slice(1)) {
      expect(p.hasAttribute('id')).toBe(false);
      expect(p.hasAttribute('pathLength')).toBe(false);
      expect(p.hasAttribute('data-scroll-draw-split')).toBe(false);
      expect(p.hasAttribute('data-scroll-draw-piece')).toBe(true);
      expect(p.getAttribute('class')).toBe('line');
      expect(p.getAttribute('stroke')).toBe('red');
      expect(p.getAttribute('transform')).toBe('translate(1 2)');
    }
  });

  it('takes a selector (every element it names), an element, a list, or the path itself, and returns it', () => {
    const a = makeSvg(THREE);
    const b = makeSvg(THREE);
    a.classList.add('x');
    b.classList.add('x');
    expect(splitSubpaths('.x')).toBe('.x');
    expect(ds(a)).toHaveLength(3);
    expect(ds(b)).toHaveLength(3);

    const c = makeSvg(THREE);
    const d = makeSvg(THREE);
    const list = [c, d];
    expect(splitSubpaths(list)).toBe(list);
    expect(ds(c)).toHaveLength(3);
    expect(ds(d)).toHaveLength(3);

    const e = makeSvg(THREE);
    const path = e.querySelector('path')!;
    expect(splitSubpaths(path)).toBe(path);
    expect(ds(e)).toHaveLength(3);
    expect(splitSubpaths(null)).toBe(null);
    expect(splitSubpaths('#nothing')).toBe('#nothing');
  });

  it('leaves a path with one subpath alone, and a split path is not split again', () => {
    const svg = makeSvg('M0 0 H100', THREE);
    const before = svg.innerHTML.slice(0, svg.innerHTML.indexOf('<path', 1));
    splitSubpaths(svg);
    splitSubpaths(svg);
    expect(svg.querySelector('path')!.outerHTML).toBe(before);
    expect(ds(svg)).toEqual(['M0 0 H100', 'M0 0 H360 ', 'M0 10 H180 ', 'M0 20 H80']);
  });

  it('a piece that starts with a relative m starts from where the piece before it ends', () => {
    // The stub says (7, 9); the browser's own answer is in e2e/subpaths.spec.ts.
    const svg = makeSvg('M0 0 H360 z m5 5 H100 M3 3 H50 m1 1 2 2 h1');
    splitSubpaths(svg);
    // (7, 9) plus the offset; a moveto's extra pairs are lines, still relative.
    expect(ds(svg)).toEqual(['M0 0 H360 z ', 'M12 14H100 ', 'M3 3 H50 ', 'M8 10l2 2h1']);
  });

  it('a moveto that draws nothing stays with what follows it', () => {
    const svg = makeSvg('M0 0 M5 5 h10 m1 1 l2 2', 'M0 0 h5 M3 3', 'm10 10 20 0 m0 10 5 5');
    splitSubpaths(svg);
    expect(ds(svg)).toEqual(['M0 0 M5 5 h10 ', 'M8 10l2 2', 'M0 0 h5 M3 3', 'm10 10 20 0 ', 'M7 19l5 5']);
  });
});

describe('joinSubpaths', () => {
  it('puts every split path back exactly, the drawing’s inline styles included', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    const svg = makeSvg(THREE, 'M0 0 H50');
    const orig = svg.querySelector('path')!;
    orig.setAttribute('style', 'color: red');
    const attrs = (el: Element) => Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value]));
    const before = attrs(orig);
    const draw = createEngine(splitSubpaths(svg.parentElement!), { native: false, stagger: 1 });
    expect(orig.style.strokeDasharray).not.toBe('');
    draw.destroy();
    expect(joinSubpaths(svg)).toBe(svg);
    expect(attrs(orig)).toEqual(before);
    expect(svg.querySelectorAll('path')).toHaveLength(2);
    expect(svg.querySelector('[data-scroll-draw-piece]')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('splits again after a join', () => {
    const svg = makeSvg(THREE);
    joinSubpaths(splitSubpaths(svg));
    splitSubpaths(svg);
    expect(ds(svg)).toEqual(['M0 0 H360 ', 'M0 10 H180 ', 'M0 20 H80']);
  });
});

describe('scrollDraw draws the pieces as ordinary paths', () => {
  let frames: FrameRequestCallback[] = [];
  const tick = () => { const f = frames; frames = []; f.forEach((cb) => cb(0)); };
  const scroll = (y: number) => { vi.stubGlobal('scrollY', y); window.dispatchEvent(new Event('scroll')); tick(); };
  const drawn = (root: Element) => Array.from(root.querySelectorAll<SVGPathElement>('path'))
    .map((p) => +(1 - parseFloat(p.style.strokeDashoffset) / lengthOf(p.getAttribute('d')!)).toFixed(4));

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('scrollY', 0);
    vi.stubGlobal('innerHeight', 800);
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    // tStart = -800, tEnd = 500.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 0, height: 500, left: 0, width: 500, right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {},
    } as DOMRect);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('with a stagger, in document order, exactly as three separate paths', () => {
    const a = makeSvg(THREE).parentElement!;
    const b = makeSvg('M0 0 H360', 'M0 10 H180', 'M0 20 H80').parentElement!;
    b.querySelectorAll('path').forEach((p) => p.removeAttribute('pathLength'));
    createEngine(splitSubpaths(a), { native: false, stagger: 1 });
    createEngine(b, { native: false, stagger: 1 });
    for (const y of [-800, -500, 0, 700, 1500, 2600]) {
      scroll(y);
      expect(drawn(a)).toEqual(drawn(b));
    }
    scroll(700); // 1500 / 1300 through: the first done, the second part drawn, the third not started
    const [x, y, z] = drawn(a);
    expect(x).toBe(1);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(1);
    expect(z).toBe(0);
  });
});
