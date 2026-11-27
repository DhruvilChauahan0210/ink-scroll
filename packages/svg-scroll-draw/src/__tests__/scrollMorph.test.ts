/**
 * `svg-scroll-draw/morph`: the path parser, ring pairing and alignment and
 * interpolatePaths (pure), shapeToPath (attributes only), and scrollMorph
 * (the element, the frames, reduced motion, destroy).
 *
 * jsdom has no layout, so the scroll window comes from a stubbed rect. The
 * shapes a real browser paints at 0, 0.5 and 1, a jump and destroy() are in
 * e2e/scroll-morph.spec.ts; no DOM at all in ssr.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollMorph, interpolatePaths, shapeToPath } from '../morph';
import { parsePath, type Ring } from '../morph/geometry';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Where every cubic ends, ring by ring: the points the morph moves along straight lines. */
const ends = (d: string): number[][][] =>
  parsePath(d).map((r) => [[r.segs[0][0], r.segs[0][1]], ...r.segs.map((c) => [c[6], c[7]])]);

/** A point on a cubic, for checking curves rather than only their ends. */
const on = (c: number[], u: number) => {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [0, 1].map((k) => w[0] * c[k] + w[1] * c[2 + k] + w[2] * c[4 + k] + w[3] * c[6 + k]);
};

/** Every point the path passes through: each cubic's ends and quarters. */
const trace = (d: string) => parsePath(d).flatMap((r: Ring) => r.segs.flatMap((c) => [0, 0.25, 0.5, 0.75, 1].map((u) => on(c, u))));

/** Distance from (x, y) to the edge of the square [0, 100]². */
const offSquare = ([x, y]: number[]) =>
  x >= 0 && x <= 100 && y >= 0 && y <= 100
    ? Math.min(x, 100 - x, y, 100 - y)
    : Math.hypot(Math.max(0, -x, x - 100), Math.max(0, -y, y - 100));

const offCircle = ([x, y]: number[], cx = 50, cy = 50, r = 50) => Math.abs(Math.hypot(x - cx, y - cy) - r);

const SQUARE = 'M0 0H100V100H0Z';
/** r 50 at (50, 50), from its right-hand point clockwise, as a browser draws a <circle>. */
const CIRCLE = 'M100 50A50 50 0 0 1 0 50A50 50 0 0 1 100 50Z';
const STAR = 'M50 0L61 35L98 35L68 57L79 91L50 70L21 91L32 57L2 35L39 35Z';

// ── parsePath ─────────────────────────────────────────────────────────────────

describe('parsePath', () => {
  it('reads relative commands, H and V, implicit repeats and closes rings', () => {
    const [r] = parsePath('m10 10 h20 v20 l-20 0 z');
    expect(r.closed).toBe(true);
    expect(ends('m10 10 h20 v20 l-20 0 z')[0]).toEqual([[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]);
    // Pairs after a moveto are lines; Z adds the closing line only when it is needed.
    expect(ends('M0 0 10 0 10 10Z')[0]).toEqual([[0, 0], [10, 0], [10, 10], [0, 0]]);
    expect(parsePath('M0 0 10 0 0 0Z')[0].segs).toHaveLength(2);
  });

  it('turns quadratics, S and T into cubics through the same curve', () => {
    const [q] = parsePath('M0 0Q50 100 100 0T200 0').map((r) => r.segs);
    // A quadratic's middle is a quarter of the way to its control point, and
    // T mirrors the last control point: (150, -100).
    expect(on(q[0], 0.5)).toEqual([50, 50]);
    expect(on(q[1], 0.5)).toEqual([150, -50]);
    const [s] = parsePath('M0 0C0 50 50 50 50 0S100 -50 100 0').map((r) => r.segs);
    expect(s[1].slice(2, 4)).toEqual([50, -50]);
  });

  it('turns arcs into cubics within a hair of the circle, flags run together too', () => {
    const pts = trace(CIRCLE);
    expect(Math.max(...pts.map((p) => offCircle(p)))).toBeLessThan(0.02);
    // `a50 50 0 01 …`: large-arc 0 and sweep 1 written without a separator.
    expect(trace('M100 50a50 50 0 01-100 0a50 50 0 01 100 0z').map((p) => offCircle(p)).every((e) => e < 0.02)).toBe(true);
  });

  it('stops at the first error, as a browser does, and drops subpaths that draw nothing', () => {
    expect(ends('M0 0L10 0L10 x10')[0]).toEqual([[0, 0], [10, 0]]);
    expect(parsePath('M5 5 M0 0L10 0')).toHaveLength(1);
    expect(parsePath('')).toEqual([]);
    expect(parsePath('L10 10')).toEqual([]);
  });
});

// ── interpolatePaths ──────────────────────────────────────────────────────────

describe('interpolatePaths', () => {
  it('returns the two strings exactly at 0 and 1', () => {
    const at = interpolatePaths(CIRCLE, STAR);
    expect(at(0)).toBe(CIRCLE);
    expect(at(1)).toBe(STAR);
  });

  it('just inside 0 and 1 it is the outline itself: every point on it, every corner kept', () => {
    const at = interpolatePaths(SQUARE, CIRCLE);
    const start = trace(at(1e-9));
    expect(Math.max(...start.map(offSquare))).toBeLessThan(0.01);
    for (const corner of [[0, 0], [100, 0], [100, 100], [0, 100]])
      expect(start.some(([x, y]) => Math.hypot(x - corner[0], y - corner[1]) < 0.01), String(corner)).toBe(true);
    const end = trace(at(1 - 1e-9));
    expect(Math.max(...end.map((p) => offCircle(p)))).toBeLessThan(0.03);
  });

  it('cuts both outlines at the same fractions of their length: corners of each plus `points` evenly', () => {
    // A square to a square twice the size: no corner of one is new to the
    // other, so the cuts are 8 evenly spaced ones, and the corners among them.
    const at = interpolatePaths(SQUARE, 'M0 0H200V200H0Z', { points: 8 });
    const [ring] = ends(at(1e-9));
    expect(ring).toHaveLength(9);
    const steps = ring.slice(1).map((p, k) => Math.hypot(p[0] - ring[k][0], p[1] - ring[k][1]));
    steps.forEach((s) => expect(s).toBeCloseTo(50, 4));
    // With no even cuts, the cuts are the corners of both: the square's four
    // and the triangle's three, wherever its start has turned to.
    const triangle = [[0, 0], [100, 0], [50, 87]];
    const tri = interpolatePaths(SQUARE, 'M0 0L100 0L50 87Z', { points: 0 });
    const [first] = ends(tri(1e-9));
    const [last] = ends(tri(1 - 1e-9));
    expect(first.length).toBeLessThanOrEqual(1 + 7);
    expect(last).toHaveLength(first.length);
    for (const [x, y] of [[0, 0], [100, 0], [100, 100], [0, 100]])
      expect(first.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.01), `square ${x},${y}`).toBe(true);
    for (const [x, y] of triangle)
      expect(last.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.01), `triangle ${x},${y}`).toBe(true);
  });

  it('starts the second outline where the first starts: a circle drawn from another point does not move', () => {
    // The same circle, started a quarter turn on, at the bottom.
    const fromBottom = 'M50 100A50 50 0 0 1 0 50A50 50 0 0 1 50 0A50 50 0 0 1 100 50A50 50 0 0 1 50 100Z';
    const mid = trace(interpolatePaths(CIRCLE, fromBottom)(0.5));
    expect(Math.max(...mid.map((p) => offCircle(p)))).toBeLessThan(0.05);
  });

  it('runs the second outline backwards when the windings differ', () => {
    const anticlockwise = 'M100 50A50 50 0 0 0 0 50A50 50 0 0 0 100 50Z';
    const mid = trace(interpolatePaths(CIRCLE, anticlockwise)(0.5));
    // Point for point without the reversal, the circle would fold to its diameter.
    expect(Math.max(...mid.map((p) => offCircle(p)))).toBeLessThan(0.05);
  });

  it('an open path pairs end to end the shorter way round', () => {
    const mid = ends(interpolatePaths('M0 0L100 0', 'M100 50L0 50')(0.5))[0];
    // Each end travels straight down; crossed over, they would meet in the middle.
    expect(mid[0]).toEqual([0, 25]);
    expect(mid.at(-1)).toEqual([100, 25]);
  });

  it('pairs subpaths by place and size, not by the order they are written in', () => {
    const small = 'M0 0H10V10H0Z';
    const big = 'M100 0H200V100H100Z';
    const mid = interpolatePaths(small + big, big + small)(0.5);
    // Nothing moves: each ring stays where it is.
    const rings = ends(mid);
    expect(rings).toHaveLength(2);
    const box = (r: number[][]) => [Math.min(...r.map((p) => p[0])), Math.max(...r.map((p) => p[0]))];
    expect(box(rings[0])).toEqual([0, 10]);
    expect(box(rings[1])).toEqual([100, 200]);
  });

  it('a subpath with no partner grows from a point at its own middle', () => {
    const withHole = 'M0 0H100V100H0ZM30 30V70H70V30Z';
    const at = interpolatePaths(SQUARE, withHole, { points: 4 });
    const rings = ends(at(0.5));
    expect(rings).toHaveLength(2);
    const hole = rings[1];
    // Halfway: half its size, about its own centre (50, 50).
    const xs = hole.map((p) => p[0]);
    expect(Math.min(...xs)).toBeCloseTo(40, 6);
    expect(Math.max(...xs)).toBeCloseTo(60, 6);
    // Shrinking it back is the same, the other way.
    expect(ends(interpolatePaths(withHole, SQUARE, { points: 4 })(0.5))).toHaveLength(2);
    // From nothing at all, every ring grows from its middle.
    expect(ends(interpolatePaths('', SQUARE)(0.5))[0].every(([x, y]) => x >= 25 && x <= 75 && y >= 25 && y <= 75)).toBe(true);
  });

  it('an open line with no partner joins the nearest line instead, so a stroke leaves no dot behind', () => {
    const menu = 'M20 30H80M20 50H80M20 70H80';
    const close = 'M25 25L75 75M75 25L25 75';
    const lengths = (d: string) => ends(d).map((r) => Math.hypot(r[0][0] - r.at(-1)![0], r[0][1] - r.at(-1)![1]));
    // Just short of the end, three lines, every one still a line: the third lies on an arm of the X.
    const near = lengths(interpolatePaths(menu, close)(1 - 1e-6));
    expect(near).toHaveLength(3);
    near.forEach((l) => expect(l).toBeCloseTo(Math.hypot(50, 50), 3));
    // And the other way, a line splits off.
    expect(lengths(interpolatePaths(close, menu)(1e-6)).every((l) => l > 70)).toBe(true);
  });

  it('a list is a sequence: an equal share each, landing on every shape exactly', () => {
    const at = interpolatePaths(SQUARE, [CIRCLE, STAR]);
    expect(at(0)).toBe(SQUARE);
    expect(at(0.5)).toBe(CIRCLE);
    expect(at(1)).toBe(STAR);
    expect(at(0.25)).toBe(interpolatePaths(SQUARE, CIRCLE)(0.5));
    expect(at(0.75)).toBe(interpolatePaths(CIRCLE, STAR)(0.5));
    expect(interpolatePaths(SQUARE, [])(0.5)).toBe(SQUARE);
  });

  it('writes cubics, closed only when both ends are, at `precision` decimals', () => {
    const d = interpolatePaths(CIRCLE, STAR, { precision: 0 })(0.37);
    expect(d).toMatch(/^M-?\d+ -?\d+C(-?\d+ ?)+Z$/);
    expect(interpolatePaths(CIRCLE, STAR, { precision: 3 })(0.37)).toMatch(/\.\d{3}\b/);
    expect(interpolatePaths('M0 0L100 0', CIRCLE)(0.5)).not.toContain('Z');
  });
});

// ── shapeToPath ───────────────────────────────────────────────────────────────

describe('shapeToPath', () => {
  const svg = (markup: string) => {
    const host = document.createElement('div');
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
    return host.firstElementChild!.firstElementChild!;
  };

  it('draws every basic shape from where the browser starts it', () => {
    expect(shapeToPath(svg('<rect x="1" y="2" width="10" height="20"/>'))).toBe('M1 2H11V22H1Z');
    expect(ends(shapeToPath(svg('<rect width="100" height="50" rx="10"/>')))[0][0]).toEqual([10, 0]);
    expect(trace(shapeToPath(svg('<circle cx="50" cy="50" r="50"/>'))).every((p) => offCircle(p) < 0.02)).toBe(true);
    expect(shapeToPath(svg('<ellipse cx="5" cy="5" rx="4" ry="2"/>'))).toMatch(/^M9 5A4 2/);
    expect(shapeToPath(svg('<line x1="0" y1="1" x2="2" y2="3"/>'))).toBe('M0 1L2 3');
    expect(shapeToPath(svg('<polyline points="0,0 10,0 10,10"/>'))).toBe('M0 0L10 0L10 10');
    expect(shapeToPath(svg('<polygon points="0 0 10 0 10 10"/>'))).toBe('M0 0L10 0L10 10Z');
    expect(shapeToPath(svg('<path d="M1 1L2 2"/>'))).toBe('M1 1L2 2');
  });

  it('a rounded rect copies one radius to the other when only one is given, then cuts each to half its side', () => {
    // SVG 2: rx auto is ry, 30; then ry is cut to half the height, 20, and rx stays 30.
    const pts = trace(shapeToPath(svg('<rect width="100" height="40" ry="30"/>')));
    const offEllipse = ([x, y]: number[]) => Math.abs(Math.hypot((x - 30) / 30, (y - 20) / 20) - 1);
    const corner = pts.filter(([x]) => x <= 30);
    expect(corner.length).toBeGreaterThan(4);
    expect(Math.max(...corner.map(offEllipse))).toBeLessThan(0.001);
  });

  it('nothing for a shape of no size; a group gives every shape inside it', () => {
    expect(shapeToPath(svg('<circle r="0"/>'))).toBe('');
    expect(shapeToPath(svg('<rect width="0" height="5"/>'))).toBe('');
    expect(shapeToPath(svg('<g><rect width="1" height="1"/><line x2="5"/></g>'))).toBe('M0 0H1V1H0ZM0 0L5 0');
  });
});

// ── scrollMorph ───────────────────────────────────────────────────────────────

class RafQueue {
  private queue: { id: number; cb: FrameRequestCallback }[] = [];
  private id = 0;
  schedule = vi.fn((cb: FrameRequestCallback): number => { this.queue.push({ id: ++this.id, cb }); return this.id; });
  cancel = vi.fn((id: number) => { this.queue = this.queue.filter((f) => f.id !== id); });
  tick() { const frame = this.queue; this.queue = []; for (const f of frame) f.cb(performance.now()); }
}

let raf: RafQueue;
let reduce = false;

function scroll(y: number): void {
  vi.stubGlobal('scrollY', y);
  window.dispatchEvent(new Event('scroll'));
  raf.tick();
}

/**
 * The <svg>'s top is at 1000 and it is 60 tall: the window runs from scroll
 * 320 (its top 85% down the 800px viewport) to 630 (its centre at the centre).
 */
const yAt = (p: number) => 320 + p * 310;

function page(markup = `<path id="shape" d="${SQUARE}" style="color: red"/>`): SVGSVGElement {
  document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${markup}</svg>
    <svg><defs><path id="circle" d="${CIRCLE}"/><polygon id="tri" points="0,0 100,0 50,87"/></defs></svg>`;
  return document.querySelector('svg')!;
}

const dOf = (sel = '#shape') => document.querySelector(sel)!.getAttribute('d');

beforeEach(() => {
  reduce = false;
  raf = new RafQueue();
  vi.stubGlobal('requestAnimationFrame', raf.schedule);
  vi.stubGlobal('cancelAnimationFrame', raf.cancel);
  vi.stubGlobal('matchMedia', () => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 1000, height: 60, left: 0, width: 200, right: 200, bottom: 1060, x: 0, y: 1000, toJSON: () => ({}),
  });
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('scrollMorph', () => {
  it('morphs as the page scrolls: the first shape before the window, the last after it', () => {
    page();
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const inst = scrollMorph('#shape', { to: '#circle', onProgress, onComplete });
    raf.tick();
    expect(dOf()).toBe(SQUARE);
    expect(inst.getProgress()).toBe(0);
    scroll(yAt(0.5));
    expect(dOf()).toBe(interpolatePaths(SQUARE, CIRCLE)(0.5));
    expect(inst.getProgress()).toBeCloseTo(0.5, 6);
    expect(onProgress).toHaveBeenLastCalledWith(inst.getProgress());
    expect((document.querySelector('#shape') as SVGElement).style.getPropertyValue('--scroll-draw-progress')).toBe(String(inst.getProgress()));
    scroll(yAt(1.5));
    expect(dOf()).toBe(CIRCLE);
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Back: it morphs back, and onComplete may fire again.
    scroll(0);
    expect(dOf()).toBe(SQUARE);
    scroll(yAt(2));
    expect(onComplete).toHaveBeenCalledTimes(2);
    inst.destroy();
  });

  it('takes path data, a selector, an element or a list of them, through each in turn', () => {
    page();
    const tri = document.querySelector('#tri')!;
    const inst = scrollMorph('#shape', { to: [CIRCLE, tri, '#circle'] });
    const at = interpolatePaths(SQUARE, [CIRCLE, shapeToPath(tri), CIRCLE]);
    for (const p of [0.2, 1 / 3, 0.5, 2 / 3, 0.9]) {
      scroll(yAt(p));
      expect(dOf()).toBe(at(inst.getProgress()));
    }
    inst.destroy();
  });

  it('eases each step of a sequence', () => {
    page();
    const inst = scrollMorph('#shape', { to: [CIRCLE, STAR], easing: 'ease-in' });
    scroll(yAt(0.25));
    // Halfway through the first step, eased: a quarter of the way.
    expect(dOf()).toBe(interpolatePaths(SQUARE, CIRCLE)(0.25));
    inst.destroy();
  });

  it('with once it stays morphed when the page scrolls back', () => {
    page();
    const inst = scrollMorph('#shape', { to: CIRCLE, once: true });
    scroll(yAt(0.6));
    scroll(0);
    expect(inst.getProgress()).toBeCloseTo(0.6, 6);
    scroll(yAt(1.2));
    scroll(0);
    expect(dOf()).toBe(CIRCLE);
    inst.destroy();
  });

  it('pause, seek, resume and replay', () => {
    page();
    const inst = scrollMorph('#shape', { to: CIRCLE });
    inst.seek(0.5);
    expect(dOf()).toBe(interpolatePaths(SQUARE, CIRCLE)(0.5));
    scroll(yAt(0.9));
    expect(inst.getProgress()).toBe(0.5);
    inst.resume();
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.9, 6);
    inst.pause();
    scroll(yAt(0.1));
    expect(inst.getProgress()).toBeCloseTo(0.9, 6);
    inst.replay();
    raf.tick();
    expect(inst.getProgress()).toBeCloseTo(0.1, 6);
    inst.destroy();
  });

  it('destroy() puts d and style back exactly, or takes d away again if there was none', () => {
    page();
    const shape = document.querySelector('#shape')!;
    const before = shape.outerHTML;
    const inst = scrollMorph(shape, { to: CIRCLE });
    scroll(yAt(0.5));
    inst.destroy();
    expect(shape.outerHTML).toBe(before);
    scroll(yAt(0.7));
    expect(shape.outerHTML).toBe(before);

    // The stubbed box does not move with the scroll: start the next one at the top.
    vi.stubGlobal('scrollY', 0);
    page('<path id="shape"/>');
    const empty = scrollMorph('#shape', { to: CIRCLE, progressVar: false });
    scroll(yAt(0.5));
    expect(dOf()).toMatch(/^M/);
    empty.destroy();
    expect(document.querySelector('#shape')!.outerHTML).toBe('<path id="shape"></path>');
  });

  it('a basic shape is swapped for a <path> with its attributes while it runs, and back on destroy()', () => {
    const svg = page('<circle id="shape" class="dot" cx="50" cy="50" r="50" fill="red"/>');
    const circle = svg.querySelector('#shape')!;
    const inst = scrollMorph(circle, { to: STAR });
    const path = svg.querySelector('#shape')!;
    expect(path.localName).toBe('path');
    expect(path.getAttribute('class')).toBe('dot');
    expect(path.getAttribute('fill')).toBe('red');
    expect(path.hasAttribute('r')).toBe(false);
    scroll(yAt(1));
    expect(path.getAttribute('d')).toBe(STAR);
    inst.destroy();
    expect(svg.querySelector('#shape')).toBe(circle);
    expect(circle.hasAttribute('d')).toBe(false);
  });

  it('under reduced motion it shows the last shape at once', () => {
    reduce = true;
    page();
    const onComplete = vi.fn();
    const inst = scrollMorph('#shape', { to: [CIRCLE, STAR], onComplete });
    expect(dOf()).toBe(STAR);
    expect(inst.getProgress()).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    inst.destroy();
    expect(dOf()).toBe(SQUARE);
  });

  it('warns and does nothing without an element, a shape, or anything to morph to', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    page('<g id="group"/><path id="shape" d="M0 0L1 1"/>');
    for (const inst of [
      scrollMorph('#missing', { to: CIRCLE }),
      scrollMorph('#group', { to: CIRCLE }),
      scrollMorph('#shape', { to: '#nowhere' }),
      scrollMorph('#shape', { to: [] }),
    ]) {
      expect(inst.getProgress()).toBe(0);
      expect(() => inst.destroy()).not.toThrow();
    }
    expect(dOf()).toBe('M0 0L1 1');
    expect(warnSpy).toHaveBeenCalledTimes(5);
  });
});
