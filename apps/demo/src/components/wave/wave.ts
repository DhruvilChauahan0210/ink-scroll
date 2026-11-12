/**
 * The wave maths for /svg-wave-generator. Pure and deterministic: the same
 * settings and seed always give the same path, on the server and in any
 * browser.
 *
 * 1. Points first. A crest, then a trough, every half wavelength, on a
 *    baseline, `A` above and below it. Variation moves each point sideways
 *    and lowers it, from a seeded generator (mulberry32), one per layer, and
 *    each layer is shifted along by its own phase. The points carry on past
 *    both edges of the box.
 * 2. Then a curve through them: Catmull-Rom, written as cubic Béziers
 *    (`catmullRom`), or straight lines (peaks), or a staircase sampled from
 *    the curve (steps).
 * 3. Cut at exactly x = 0 and x = width (`clip`, de Casteljau), so a closed
 *    shape spans the box edge to edge at any phase, then scaled toward its
 *    baseline if the curve would leave the box.
 *
 * Then the code: every listing the visitor copies or downloads starts with the
 * source line (`listing`), and `htmlPage` / `reactProject` put the wave in a
 * page of its own for the Run it row.
 */

import { cdnModule, htmlFile, withSource, type CodeLang, type ReactProject } from '@/lib/tool-export';

/** This tool's page, for the source line on everything it writes. */
export const SLUG = 'svg-wave-generator';

export const WIDTH = 1440;
export const MAX_LAYERS = 4;

export type Smooth = 'curved' | 'peaks' | 'steps';
export const SMOOTHS: readonly Smooth[] = ['curved', 'peaks', 'steps'];
export type Mode = 'fill' | 'line';
export type Plays = 'scroll' | 'seen';
export type Finish = 'leave' | 'middle';

export type WaveSettings = {
  mode: Mode;
  layers: number;
  /** 0–1: how much of its room a layer's wave uses. */
  amplitude: number;
  /** Waves across the width, in halves: 0.5, 1, 1.5 … */
  waves: number;
  smooth: Smooth;
  /** 0–1, curved only: 0 is Catmull-Rom, 1 straight lines. */
  tension: number;
  /** Steps per wave, steps only. */
  steps: number;
  /** 0–1: how far the seed moves the points. */
  variation: number;
  seed: number;
  flipX: boolean;
  flipY: boolean;
  /** The viewBox height; the width is always WIDTH. */
  height: number;
  /** Line mode: the stroke, in viewBox units. */
  strokeWidth: number;
  /** Line mode: scrollDraw's stagger between lines. */
  stagger: number;
  /** Line mode: with the scroll, or once on its own clock when seen (autoplay). */
  plays: Plays;
  /** Line mode, with the scroll: done as it leaves the window (the default trigger), or by mid-screen. */
  finish: Finish;
};

/** Ranges the controls use, so the page quotes the same numbers. */
export const RANGE = {
  layers: [1, MAX_LAYERS],
  waves: [0.5, 12],
  steps: [2, 16],
  height: [40, 400],
  strokeWidth: [1, 16],
  stagger: [0, 0.4],
  seed: [1, 99999],
} as const;

/** Variation's two moves at full strength (variation 1). */
export const JITTER_X = 0.15;
export const JITTER_H = 0.75;

export type Pt = { x: number; y: number };
/** A straight piece [p0, p1] or a cubic [p0, c1, c2, p3]. */
type Piece = Pt[];

// ── The seeded generator ─────────────────────────────────────────────────────

/** mulberry32: a 32-bit state, a uniform number in [0, 1) per call. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each layer its own stream: a layer's numbers do not depend on how many layers there are. */
const layerRandom = (seed: number, i: number) => mulberry32(Math.imul(seed | 0, 4) + i + 1);

// ── 1. The points ────────────────────────────────────────────────────────────

/** Where a layer sits: its baseline, its amplitude, and the band it must stay in. */
export function layerFrame(s: WaveSettings, i: number): { b: number; A: number; lo: number; hi: number } {
  const n = s.layers;
  const m = s.mode === 'line' ? s.strokeWidth / 2 + 1 : 0;
  const lo = m;
  const hi = s.height - m;
  const band = hi - lo;
  return { b: lo + (band * (i + 1)) / (n + 1), A: s.amplitude * (band / (n + 1)), lo, hi };
}

/** Half waves across the width: the gaps between points. */
export const halves = (waves: number) => Math.max(1, Math.round(waves * 2));
/** One wavelength, crest to crest, in viewBox units. */
export const wavelength = (waves: number, width = WIDTH) => (2 * width) / halves(waves);

/**
 * A layer's points, past both edges: crests at even k, troughs at odd k,
 * x = (k − phase) × spacing, moved by the seed when variation is above 0.
 * Two spare points each side give the end tangents and cover any phase.
 */
export function wavePoints(s: WaveSettings, i: number, width = WIDTH): Pt[] {
  const n = halves(s.waves);
  const gap = width / n;
  const { b, A } = layerFrame(s, i);
  const v = s.variation;
  const rnd = layerRandom(s.seed, i);
  // Layers spread evenly across one wavelength (2 gaps), then nudged by the seed.
  const phase = ((2 * i) / s.layers + v * 2 * rnd()) % 2;
  const pts: Pt[] = [];
  for (let k = -3; k <= n + 4; k++) {
    const jx = rnd();
    const jh = rnd();
    const crest = ((k % 2) + 2) % 2 === 0;
    const x = (k - phase) * gap + v * JITTER_X * gap * (2 * jx - 1);
    const h = 1 - v * JITTER_H * jh;
    pts.push({ x, y: b + (crest ? -1 : 1) * A * h });
  }
  return s.flipX ? pts.map((p) => ({ x: width - p.x, y: p.y })).reverse() : pts;
}

// ── 2. The curve ─────────────────────────────────────────────────────────────

/**
 * Catmull-Rom through the points, as cubic Béziers: the piece from P1 to P2
 * has its handles at P1 + (1 − τ)(P2 − P0) / 6 and P2 − (1 − τ)(P3 − P1) / 6,
 * so each point's two handles lie along the line between its neighbours.
 * τ (tension) 0 is the classic curve; 1 shrinks the handles to nothing and
 * leaves straight lines through the same points. The first and last points
 * only steer, so the curve runs from the second point to the one before last.
 */
export function catmullRom(pts: Pt[], tension = 0): Piece[] {
  const f = (1 - tension) / 6;
  const out: Piece[] = [];
  for (let j = 1; j < pts.length - 2; j++) {
    const [p0, p1, p2, p3] = [pts[j - 1], pts[j], pts[j + 1], pts[j + 2]];
    out.push([
      p1,
      { x: p1.x + (p2.x - p0.x) * f, y: p1.y + (p2.y - p0.y) * f },
      { x: p2.x - (p3.x - p1.x) * f, y: p2.y - (p3.y - p1.y) * f },
      p2,
    ]);
  }
  return out;
}

/** Straight lines between the points, the spare end points left out. */
function polyline(pts: Pt[]): Piece[] {
  const out: Piece[] = [];
  for (let j = 1; j < pts.length - 2; j++) out.push([pts[j], pts[j + 1]]);
  return out;
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function pointAt(p: Piece, t: number): Pt {
  if (p.length === 2) return lerp(p[0], p[1], t);
  const u = 1 - t;
  const [a, b, c, d] = p;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

/** Split a piece at t (de Casteljau for a cubic): the part before and the part after. */
function split(p: Piece, t: number): [Piece, Piece] {
  if (p.length === 2) {
    const m = lerp(p[0], p[1], t);
    return [[p[0], m], [m, p[1]]];
  }
  const [a, b, c, d] = p;
  const ab = lerp(a, b, t);
  const bc = lerp(b, c, t);
  const cd = lerp(c, d, t);
  const abc = lerp(ab, bc, t);
  const bcd = lerp(bc, cd, t);
  const m = lerp(abc, bcd, t);
  return [[a, ab, abc, m], [m, bcd, cd, d]];
}

/**
 * The t where the piece reaches x = X. A piece's x only ever grows: its
 * handles sit in order left to right whenever the gaps either side of it add
 * up to no more than 4 times its own (g0 + g2 ≤ 4 × g1), and JITTER_X keeps
 * every gap within 0.7 to 1.3 of the even spacing (2.6 ≤ 2.8). So halving the
 * interval finds it.
 */
function tAtX(p: Piece, X: number): number {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (pointAt(p, mid).x < X) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Keep the curve between x0 and x1 exactly: cut the pieces that cross either edge. */
export function clip(pieces: Piece[], x0: number, x1: number): Piece[] {
  const out: Piece[] = [];
  for (const piece of pieces) {
    const xa = piece[0].x;
    const xb = piece[piece.length - 1].x;
    if (xb <= x0 || xa >= x1) continue;
    let p = piece;
    if (xa < x0) p = split(p, tAtX(p, x0))[1];
    if (xb > x1) p = split(p, tAtX(p, x1))[0];
    out.push(p.slice());
  }
  if (out.length) {
    const first = out[0];
    const last = out[out.length - 1];
    first[0] = { x: x0, y: first[0].y };
    last[last.length - 1] = { x: x1, y: last[last.length - 1].y };
  }
  return out;
}

/** The lowest and highest y a piece reaches: its ends, and a cubic's turning points. */
function yRange(p: Piece): [number, number] {
  const ys = [p[0].y, p[p.length - 1].y];
  if (p.length === 4) {
    const [y0, y1, y2, y3] = p.map((q) => q.y);
    const a = y3 - 3 * y2 + 3 * y1 - y0;
    const b = 2 * (y2 - 2 * y1 + y0);
    const c = y1 - y0;
    const roots: number[] = [];
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) > 1e-12) roots.push(-c / b);
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const r = Math.sqrt(disc);
        roots.push((-b + r) / (2 * a), (-b - r) / (2 * a));
      }
    }
    for (const t of roots) if (t > 0 && t < 1) ys.push(pointAt(p, t).y);
  }
  return [Math.min(...ys), Math.max(...ys)];
}

/** Scale the curve toward its baseline, only as much as keeps it inside [lo, hi]. */
function fit(pieces: Piece[], b: number, lo: number, hi: number): Piece[] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of pieces) {
    const [a, z] = yRange(p);
    min = Math.min(min, a);
    max = Math.max(max, z);
  }
  let f = 1;
  if (min < lo && b - min > 0) f = Math.min(f, (b - lo) / (b - min));
  if (max > hi && max - b > 0) f = Math.min(f, (hi - b) / (max - b));
  if (f >= 1) return pieces;
  return pieces.map((p) => p.map((q) => ({ x: q.x, y: b + (q.y - b) * f })));
}

/** The curve's y at x, for the staircase. */
function yAt(pieces: Piece[], x: number): number {
  const p = pieces.find((q) => q[q.length - 1].x >= x) ?? pieces[pieces.length - 1];
  return pointAt(p, tAtX(p, x)).y;
}

/** A staircase: `cells` flat steps across the width, each at the curve's height in its middle. */
function staircase(curve: Piece[], cells: number, width: number): Piece[] {
  const out: Piece[] = [];
  let prev: Pt | null = null;
  for (let j = 0; j < cells; j++) {
    const xa = (j * width) / cells;
    const xb = ((j + 1) * width) / cells;
    const y = yAt(curve, (xa + xb) / 2);
    const a: Pt = { x: xa, y };
    if (prev && prev.y !== y) out.push([prev, a]);
    const b2: Pt = { x: xb, y };
    out.push([a, b2]);
    prev = b2;
  }
  return out;
}

// ── 3. One layer's edge ─────────────────────────────────────────────────────

/** The top edge of layer i (0 is the back), from x = 0 to x = width, in viewBox units. */
export function layerEdge(s: WaveSettings, i: number, width = WIDTH): Piece[] {
  const pts = wavePoints(s, i, width);
  const { b, lo, hi } = layerFrame(s, i);
  let edge: Piece[];
  if (s.smooth === 'peaks') edge = fit(clip(polyline(pts), 0, width), b, lo, hi);
  else if (s.smooth === 'steps') {
    const curve = fit(clip(catmullRom(pts, 0), 0, width), b, lo, hi);
    edge = staircase(curve, Math.max(1, Math.round(s.waves * s.steps)), width);
  } else edge = fit(clip(catmullRom(pts, s.tension), 0, width), b, lo, hi);
  return s.flipY ? edge.map((p) => p.map((q) => ({ x: q.x, y: s.height - q.y }))) : edge;
}

// ── Writing it out ──────────────────────────────────────────────────────────

/** One decimal: a tenth of a viewBox unit is far below a pixel at any width here. */
export function num(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
}

/** Path data for an edge, compact: commas, no spaces, H and V where a line is flat or upright. */
export function edgeD(edge: Piece[]): string {
  if (!edge.length) return '';
  const start = edge[0][0];
  let d = `M${num(start.x)},${num(start.y)}`;
  let cx = num(start.x);
  let cy = num(start.y);
  for (const p of edge) {
    const end = p[p.length - 1];
    const ex = num(end.x);
    const ey = num(end.y);
    if (p.length === 4) d += `C${num(p[1].x)},${num(p[1].y)},${num(p[2].x)},${num(p[2].y)},${ex},${ey}`;
    else if (ey === cy && ex !== cx) d += `H${ex}`;
    else if (ex === cx && ey !== cy) d += `V${ey}`;
    else if (ex !== cx || ey !== cy) d += `L${ex},${ey}`;
    cx = ex;
    cy = ey;
  }
  return d;
}

export type Layer = { line: string; fill: string };

/**
 * Every layer, back first: `line` is the edge on its own (an open path), and
 * `fill` the closed shape, the edge and then down the right side, back along
 * the flat side and closed (or up, flipped).
 */
export function buildWave(s: WaveSettings, width = WIDTH): Layer[] {
  const out: Layer[] = [];
  for (let i = 0; i < s.layers; i++) {
    const line = edgeD(layerEdge(s, i, width));
    out.push({ line, fill: `${line}V${s.flipY ? 0 : num(s.height)}H0Z` });
  }
  return out;
}

// ── Colours ─────────────────────────────────────────────────────────────────

/** The site's neutral colour tokens, offered as swatches; their values come from the page's CSS. */
export const TOKENS = ['fg', 'fg-2', 'fg-3', 'line-2', 'line', 'panel', 'bg'] as const;
export type Token = (typeof TOKENS)[number];

/**
 * A colour typed in: any CSS colour the browser accepts, as long as it says
 * the colour itself. var(), env(), attr(), currentColor and the CSS-wide
 * keywords pass CSS.supports('color', …) but mean nothing inside a CSS
 * background image, and only these characters can make a colour, so nothing
 * else typed ever reaches the SVG.
 */
export function isColour(v: string, supports: (value: string) => boolean): boolean {
  const t = v.trim();
  if (!t || t.length > 64) return false;
  if (!/^[#a-zA-Z0-9\s().,%/+-]+$/.test(t)) return false;
  if (/\b(var|env|attr)\s*\(|currentcolor|^(inherit|initial|unset|revert|revert-layer)$/i.test(t)) return false;
  return supports(t);
}

// ── The code ────────────────────────────────────────────────────────────────

export type Tab = 'svg' | 'react' | 'css' | 'js';
/** What each mode copies: [key, tab label, file name]. */
export const FILL_TABS: readonly [Tab, string, string][] = [
  ['svg', 'SVG', 'wave.svg'],
  ['react', 'React', 'WaveDivider.tsx'],
  ['css', 'CSS background', 'wave.css'],
];
export const LINE_TABS: readonly [Tab, string, string][] = [
  ['svg', 'SVG', 'wave-line.svg'],
  ['js', 'scrollDraw', 'main.js'],
  ['react', 'React', 'WaveLine.tsx'],
];

const attrs = (pairs: [string, string][]) => pairs.map(([k, v]) => ` ${k}="${v}"`).join('');

/** The SVG file. Fill: stretched to any width at a fixed height. Line: scales evenly. */
export function svgFile(s: WaveSettings, layers: Layer[], colours: string[]): string {
  const vb = `0 0 ${WIDTH} ${num(s.height)}`;
  if (s.mode === 'fill') {
    const root = attrs([
      ['xmlns', 'http://www.w3.org/2000/svg'], ['viewBox', vb], ['preserveAspectRatio', 'none'],
      ['width', '100%'], ['height', num(s.height)], ['aria-hidden', 'true'], ['style', 'display:block'],
    ]);
    return `<svg${root}>\n${layers.map((l, i) => `  <path fill="${colours[i]}" d="${l.fill}"/>`).join('\n')}\n</svg>\n`;
  }
  const root = attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'], ['viewBox', vb], ['width', '100%'], ['fill', 'none'],
    ['stroke-width', num(s.strokeWidth)], ['aria-hidden', 'true'], ['style', 'display:block'],
  ]);
  return `<svg${root}>\n${layers.map((l, i) => `  <path stroke="${colours[i]}" d="${l.line}"/>`).join('\n')}\n</svg>\n`;
}

/** The fill as a React component: TypeScript, or plain JSX for App.jsx (`ts` false). */
export function reactFill(s: WaveSettings, layers: Layer[], colours: string[], ts = true): string {
  return `export function WaveDivider({ className }${ts ? ': { className?: string }' : ''}) {
  return (
    <svg
      className={className}
      viewBox="0 0 ${WIDTH} ${num(s.height)}"
      preserveAspectRatio="none"
      width="100%"
      height="${num(s.height)}"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
${layers.map((l, i) => `      <path fill="${colours[i]}" d="${l.fill}" />`).join('\n')}
    </svg>
  );
}`;
}

/**
 * An SVG as a CSS url(): double quotes swapped for single ones, then
 * percent-encoded. # would start a URL fragment and cut the image off there,
 * % would start an escape, < > and spaces are not allowed in a URL. Only the
 * characters that are safe in a data URL inside url("…") are left as they are.
 */
export function svgDataUri(svg: string): string {
  const flat = svg.replace(/"/g, "'").replace(/>\s+</g, '><').trim();
  const body = encodeURIComponent(flat).replace(/%(3D|3A|2F|2C)/g, (m) => decodeURIComponent(m));
  return `data:image/svg+xml,${body}`;
}

/** The fill as a CSS background: the same SVG, without its size, as a data URI. */
export function cssBackground(s: WaveSettings, layers: Layer[], colours: string[]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${num(s.height)}" preserveAspectRatio="none">`
    + layers.map((l, i) => `<path fill="${colours[i]}" d="${l.fill}"/>`).join('')
    + '</svg>';
  const side = s.flipY ? 'top' : 'bottom';
  return `/* A ${num(s.height)}px band, its flat side at the ${side}: the next section
   starts right ${s.flipY ? 'above' : 'below'} it, in the ${s.layers > 1 ? 'front layer’s' : 'wave’s'} colour. */
.wave-divider {
  height: ${num(s.height)}px;
  background-image: url("${svgDataUri(svg)}");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}`;
}

/** The scrollDraw options that differ from its defaults, as `key: value` code. */
export function drawOptions(s: WaveSettings): string[] {
  const out: string[] = [];
  if (s.plays === 'seen') out.push('autoplay: true', 'once: true');
  else if (s.finish === 'middle') out.push("trigger: { end: 'center center' }");
  if (s.layers > 1 && s.stagger > 0) out.push(`stagger: ${Math.round(s.stagger * 100) / 100}`);
  return out;
}

/** What the line does, in one sentence: the comment over the call, and the run-it page's intro. */
function drawWhat(s: WaveSettings): string {
  return s.plays === 'seen'
    ? `Draws once, ${s.layers > 1 && s.stagger > 0 ? 'each line over a second, one after another,' : 'over a second,'} when the wave first comes on screen.`
    : s.finish === 'middle'
      ? 'Draws as the wave scrolls up the window, done when it reaches the middle.'
      : 'Draws as the wave scrolls through the window, done as it leaves the top.';
}

/** The comment and the scrollDraw call, without the import. */
function drawCall(s: WaveSettings): string[] {
  const o = drawOptions(s);
  return [`// ${drawWhat(s)}`, o.length ? `scrollDraw('#wave', { ${o.join(', ')} });` : `scrollDraw('#wave');`];
}

/** The line drawn by scrollDraw: one call. */
export function jsLine(s: WaveSettings): string {
  return [
    '// <div id="wave"> + the SVG + </div>',
    '',
    "import { scrollDraw } from 'svg-scroll-draw';",
    '',
    ...drawCall(s),
  ].join('\n');
}

/** The line as a React component, inside <ScrollDraw>. */
export function reactLine(s: WaveSettings, layers: Layer[], colours: string[]): string {
  const props = drawOptions(s).map((o) => {
    const [k, ...rest] = o.split(': ');
    const v = rest.join(': ');
    return v === 'true' ? ` ${k}` : ` ${k}={${v}}`;
  }).join('');
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

export function WaveLine() {
  return (
    <ScrollDraw${props}>
      <svg
        viewBox="0 0 ${WIDTH} ${num(s.height)}"
        width="100%"
        fill="none"
        strokeWidth={${num(s.strokeWidth)}}
        aria-hidden="true"
        style={{ display: 'block' }}
      >
${layers.map((l, i) => `        <path stroke="${colours[i]}" d="${l.line}" />`).join('\n')}
      </svg>
    </ScrollDraw>
  );
}`;
}

// ── What leaves the page ────────────────────────────────────────────────────

const LANG: Record<Tab, CodeLang> = { svg: 'svg', react: 'tsx', css: 'css', js: 'js' };

/** One tab's code as it is shown, copied and downloaded: the source line, then the code. */
export function listing(tab: Tab, s: WaveSettings, layers: Layer[], colours: string[]): string {
  const code = tab === 'svg'
    ? svgFile(s, layers, colours)
    : tab === 'css'
      ? cssBackground(s, layers, colours)
      : tab === 'js'
        ? jsLine(s)
        : s.mode === 'fill' ? reactFill(s, layers, colours) : reactLine(s, layers, colours);
  return withSource(code, SLUG, LANG[tab]);
}

/** The Run it row's title and file name, per mode. */
export const RUN: Record<Mode, { title: string; filename: string }> = {
  fill: { title: 'SVG wave divider', filename: 'wave-divider.html' },
  line: { title: 'SVG wave drawn on scroll', filename: 'wave-line.html' },
};

/**
 * The page around the wave in the files that run it: the preview's background
 * (the panel) and text colour, as values in the theme on screen, so the
 * translucent back layers look as they do in the preview.
 */
export type PageColours = { bg: string; fg: string };

const indent = (text: string, n: number) => text.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

const frontName = (s: WaveSettings) => (s.layers > 1 ? 'front layer’s' : 'wave’s');

function fillIntro(s: WaveSettings): string {
  return s.flipY
    ? `The wave is the bottom edge of the section above it, in that section’s colour. It stretches to any width at a fixed height: resize the window.`
    : `The wave is the top edge of the section under it, in that section’s colour. It stretches to any width at a fixed height: resize the window.`;
}

function fillCss(page: PageColours, front: string): string {
  return `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; background: ${page.bg}; color: ${page.fg}; }
h1 { margin: 0 0 8px; font-size: 1.5rem; }
p { margin: 0; }
.intro { max-width: 40rem; padding: 64px 24px 24px; }
.plain { padding: 64px 24px 32px; }
.gap { height: 40px; }
/* The section the wave belongs to, in its colour. */
.band { min-height: 50vh; padding: 32px 24px; background: ${front}; }
.tag { display: inline-block; padding: 6px 12px; background: ${page.bg}; color: ${page.fg}; font-size: 14px; }`;
}

const LINE_CSS = (page: PageColours) => `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; background: ${page.bg}; color: ${page.fg}; }
h1 { margin: 0 0 8px; font-size: 1.5rem; }
p { margin: 0; }
/* Room to scroll the wave in from below the window and out past the top. */
.intro, .outro { display: grid; place-content: center; min-height: 110vh; padding: 0 24px; text-align: center; }
.outro { min-height: 120vh; }
#wave { padding: 0 16px; }`;

const lineOutro = (s: WaveSettings) =>
  s.plays === 'seen' ? 'It drew once and stays drawn: reload to see it again.' : 'Scroll back up and it undraws.';

/**
 * A complete page for the current settings, loading the library (line mode
 * only) from jsDelivr. Fill: the wave between two sections as an inline SVG,
 * then again as the CSS background. Line: the wave between two screens of
 * room, drawn by the generated call.
 */
export function htmlPage(s: WaveSettings, layers: Layer[], colours: string[], page: PageColours, version: string): string {
  const svg = svgFile(s, layers, colours).trimEnd();
  if (s.mode === 'fill') {
    const front = colours[colours.length - 1];
    const band = (what: string) =>
      `<section class="band"><p class="tag">${what}: the section ${s.flipY ? 'above' : 'below'}, in the ${frontName(s)} colour</p></section>`;
    const around = (wave: string, what: string) => (s.flipY
      ? [band(what), wave, '<div class="gap"></div>']
      : ['<div class="gap"></div>', wave, band(what)]);
    return htmlFile({
      slug: SLUG,
      title: RUN.fill.title,
      css: `${fillCss(page, front)}\n\n${cssBackground(s, layers, colours)}`,
      body: [
        '<header class="intro">',
        `  <h1>${RUN.fill.title}</h1>`,
        `  <p>${fillIntro(s)}</p>`,
        '</header>',
        ...around(svg, 'Inline SVG'),
        '<p class="plain">The same wave as a CSS background, the .wave-divider rule:</p>',
        ...around('<div class="wave-divider"></div>', 'CSS background'),
      ].join('\n'),
    });
  }
  return htmlFile({
    slug: SLUG,
    title: RUN.line.title,
    css: LINE_CSS(page),
    body: [
      '<header class="intro">',
      `  <h1>${RUN.line.title}</h1>`,
      `  <p>${drawWhat(s)} Scroll down.</p>`,
      '</header>',
      '<div id="wave">',
      indent(svg, 2),
      '</div>',
      '<footer class="outro">',
      `  <p>${lineOutro(s)}</p>`,
      '</footer>',
    ].join('\n'),
    script: [`import { scrollDraw } from '${cdnModule(version)}';`, '', ...drawCall(s)].join('\n'),
  });
}

/** The same page as a Vite + React project: the generated component in an App. */
export function reactProject(
  s: WaveSettings, layers: Layer[], colours: string[], page: PageColours, version: string,
): Omit<ReactProject, 'title'> {
  if (s.mode === 'fill') {
    const band = `      <section className="band"><p className="tag">WaveDivider: the section ${s.flipY ? 'above' : 'below'}, in the ${frontName(s)} colour</p></section>`;
    const around = s.flipY
      ? [band, '      <WaveDivider />', '      <div className="gap" />']
      : ['      <div className="gap" />', '      <WaveDivider />', band];
    const app = [
      reactFill(s, layers, colours, false).replace(/^export /, ''),
      '',
      'export default function App() {',
      '  return (',
      '    <main>',
      '      <header className="intro">',
      `        <h1>${RUN.fill.title}</h1>`,
      `        <p>${fillIntro(s)}</p>`,
      '      </header>',
      ...around,
      '    </main>',
      '  );',
      '}',
    ].join('\n');
    return { slug: SLUG, app, css: withSource(fillCss(page, colours[colours.length - 1]), SLUG, 'css'), version };
  }
  const app = [
    reactLine(s, layers, colours).replace('export function WaveLine', 'function WaveLine'),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    `        <h1>${RUN.line.title}</h1>`,
    `        <p>${drawWhat(s)} Scroll down.</p>`,
    '      </header>',
    '      <div id="wave">',
    '        <WaveLine />',
    '      </div>',
    '      <footer className="outro">',
    `        <p>${lineOutro(s)}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(LINE_CSS(page), SLUG, 'css'), version };
}
