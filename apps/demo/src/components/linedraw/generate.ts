import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { cdnModule, htmlFile, withSource } from '@/lib/tool-export';

/**
 * The SVG line drawing generator's output, written from data.
 *
 * The pasted SVG reaches this file only as a Tree read off sanitizeSvg's
 * rebuilt element (lib/svg-sanitize.ts), so every tag and attribute in the
 * output is one the sanitiser allows, plus the few written here: pathLength,
 * a class on the root, one custom property per shape, the <style> and the
 * source-line comment above everything you copy.
 *
 * The technique, checked in Chromium, Firefox and WebKit:
 *
 * - pathLength="1" on every shape makes it 1 long in dash units, whatever its
 *   real length, so one rule draws them all and nothing is measured.
 * - stroke-dasharray: 1 2 is one dash of 1 and a gap of 2. With a gap of 1
 *   (the usual "1"), the next dash began right at the end of the line, and
 *   WebKit showed it as a dot on a round-capped triangle at offset 1.
 * - stroke-dashoffset 1 hides the line, 0 shows it whole.
 * - At 99.9% the dash is dropped (stroke-dasharray: none, a discrete step at
 *   the very end), so a closed shape gets back the join at its first corner,
 *   which a dash never has.
 * - vector-effect="non-scaling-stroke" is removed: with it the dashes are
 *   measured on screen, not along the path, and offset 1 left a dash showing.
 *
 * No DOM here except toTree() and toDom(), which the tool calls in the browser.
 */

/** The shapes that draw: every one the sanitiser keeps. */
export const DRAWABLE = ['path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse'] as const;
export const DRAWABLE_SELECTOR = DRAWABLE.join(', ');
/** scrollDraw's default `selector` (packages/svg-scroll-draw/src/core/engine.ts), which has no ellipse. */
export const SCROLL_SELECTOR = 'path, polyline, line, polygon, rect, circle';

/** CSS's own timing keywords. */
export const EASINGS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'] as const;
export type Easing = (typeof EASINGS)[number];
export const ORDERS = [
  ['document', 'document'],
  ['longest', 'longest first'],
  ['shortest', 'shortest first'],
] as const;
export type Order = (typeof ORDERS)[number][0];
export const LOOPS = ['none', 'repeat', 'alternate'] as const;
export type Loop = (typeof LOOPS)[number];
/** Fill fade lengths in seconds; 0 is off. */
export const FILL_FADES = [0, 0.3, 0.6, 1.2] as const;
export const STROKES = [
  ['keep', 'keep'],
  ['current', 'currentColor'],
  ['custom', 'colour'],
] as const;
export type StrokeMode = (typeof STROKES)[number][0];
export const OUTPUTS = [
  ['file', 'SVG file', 'line-drawing.svg'],
  ['page', 'CSS + markup', 'drawing.css'],
  ['scroll', 'Scroll version', 'main.js'],
] as const;
export type OutputKey = (typeof OUTPUTS)[number][0];

export type Settings = {
  /** Seconds each line takes to draw. */
  duration: number;
  /** Seconds between one line starting and the next. */
  stagger: number;
  easing: Easing;
  order: Order;
  loop: Loop;
  /** Seconds the finished drawing holds before a loop goes on. */
  hold: number;
  /** Seconds a fill takes to fade in once its line is drawn; 0 is off. */
  fill: number;
  stroke: StrokeMode;
  color: string;
  /** A stroke width for every shape, in the SVG's own units, or null to keep its own. */
  width: number | null;
  /** How far each line's duration may stray, either way: 0.2 is ±20%. */
  hand: number;
  seed: number;
};

export const DEFAULTS: Settings = {
  duration: 1.6,
  stagger: 0.12,
  easing: 'ease-in-out',
  order: 'document',
  loop: 'none',
  hold: 1,
  fill: 0.6,
  stroke: 'keep',
  color: '#e0533d',
  width: null,
  hand: 0,
  seed: 7,
};

/** The root class and keyframe prefix of the code you copy. */
export const OUT_NAME = 'line-drawing';
/** This tool's page, for the source line on every listing it writes. */
export const SLUG = 'svg-line-drawing-generator';

/** What the tool measured of one shape in the browser. */
export type Measured = {
  /** getTotalLength(), in the SVG's own units: used for the order only. */
  length: number;
  stroked: boolean;
  filled: boolean;
  /** The computed fill-opacity, for a loop's fill to fade back to. */
  fillOpacity: number;
  nonScaling: boolean;
  /** Pieces in a path's data: one per M. */
  pieces: number;
};

/**
 * Measure a sanitised drawing, which must be in the document (getTotalLength,
 * getBBox and getComputedStyle need it laid out): each shape's length and look,
 * a viewBox when it has none, and the stroke width a bare path is given.
 */
export function measure(svg: SVGSVGElement, bare: boolean): { shapes: Measured[]; viewBox: string | null; bare: string | null; size: number } {
  if (bare) {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
  }
  const els = Array.from(svg.querySelectorAll<SVGGeometryElement>(DRAWABLE_SELECTOR));
  const shapes: Measured[] = els.map((el) => {
    const cs = getComputedStyle(el);
    let length = 0;
    try { length = el.getTotalLength(); } catch { length = 0; }
    return {
      length,
      stroked: cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 && cs.strokeOpacity !== '0',
      // A <line> computes a fill (black, by default) but has no inside to paint.
      filled: el.localName !== 'line' && cs.fill !== 'none' && cs.fillOpacity !== '0',
      fillOpacity: parseFloat(cs.fillOpacity) || 1,
      nonScaling: (el.getAttribute('vector-effect') ?? '').includes('non-scaling-stroke'),
      pieces: el.localName === 'path' ? ((el.getAttribute('d') ?? '').match(/[Mm]/g) ?? []).length : 1,
    };
  });
  let viewBox: string | null = null;
  let size = 0;
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const [, , w, h] = vb.split(/[\s,]+/).map(Number);
    size = Math.max(w || 0, h || 0);
  } else {
    try {
      const b = svg.getBBox();
      const pad = Math.max(b.width, b.height) * 0.06 + 2;
      viewBox = [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map((n) => fmt(n, 2)).join(' ');
      size = Math.max(b.width, b.height) + pad * 2;
    } catch { /* nothing drawable */ }
  }
  return { shapes, viewBox, size, bare: bare ? fmt(Math.max(size, 1) / 120, 2) : null };
}

export type Tree = { tag: string; attrs: [string, string][]; children: Tree[]; text?: string };

export const round = (n: number, places = 3) => {
  const k = 10 ** places;
  const r = Math.round(n * k) / k;
  return Object.is(r, -0) ? 0 : r;
};
export const fmt = (n: number, places = 3) => String(round(n, places));

/** A small seeded random number generator, so the same seed gives the same drawing. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── When each line draws ─────────────────────────────────────────────────────

export type Timing = { rank: number; delay: number; dur: number; factor: number };

/**
 * Each shape's place in the order, its delay (rank × stagger) and its
 * duration. The hand-drawn factors are drawn in document order from the seed,
 * so changing the order keeps every line's own speed.
 */
export function plan(lengths: readonly number[], s: Settings): Timing[] {
  const order = lengths.map((_, i) => i);
  if (s.order === 'longest') order.sort((a, b) => lengths[b] - lengths[a] || a - b);
  if (s.order === 'shortest') order.sort((a, b) => lengths[a] - lengths[b] || a - b);
  const rank: number[] = [];
  order.forEach((i, r) => { rank[i] = r; });
  const rng = mulberry32(s.seed);
  return lengths.map((_, i) => {
    const u = rng();
    const factor = s.hand > 0 ? round(1 + s.hand * (2 * u - 1), 2) : 1;
    return { rank: rank[i], delay: round(rank[i] * s.stagger), dur: round(s.duration * factor), factor };
  });
}

export type Timeline = {
  /** Seconds until the last line (and its fill) is done. */
  run: number;
  /** Seconds of one whole loop: run for none, run + hold for repeat, there and back for alternate. */
  cycle: number;
  /** The animation-duration a loop is written with: the cycle, or half of it for alternate. */
  period: number;
  /** The fill fade used, 0 when off or when nothing has a fill. */
  fade: number;
};

export function timeline(t: readonly Timing[], m: readonly Measured[], s: Settings): Timeline {
  const fade = s.fill > 0 && m.some((x) => x.filled) ? s.fill : 0;
  let run = 0;
  t.forEach((x, i) => { run = Math.max(run, x.delay + x.dur + (fade && m[i].filled ? fade : 0)); });
  run = round(run);
  if (s.loop === 'repeat') {
    const cycle = round(run + s.hold);
    return { run, cycle, period: cycle, fade };
  }
  if (s.loop === 'alternate') {
    const period = round(run + s.hold / 2);
    return { run, cycle: round(period * 2), period, fade };
  }
  return { run, cycle: run, period: run, fade };
}

// ── The CSS ─────────────────────────────────────────────────────────────────

const sel = (root: string) => `.${root} :is(${DRAWABLE_SELECTOR})`;
const sec = (n: number) => `${fmt(n)}s`;
const pct = (n: number) => `${fmt(n, 2)}%`;

/** Per shape: its place (--i) and speed (--d) in a single run; its keyframes (--n) in a loop. */
export function shapeStyle(t: Timing, k: number, s: Settings, key: string): string | null {
  if (s.loop !== 'none') return `--n:${key}-${k + 1}`;
  const parts: string[] = [];
  if (s.stagger > 0 && t.rank > 0) parts.push(`--i:${t.rank}`);
  if (t.factor !== 1) parts.push(`--d:${t.factor}`);
  return parts.length ? parts.join(';') : null;
}

export function writeCss(t: readonly Timing[], m: readonly Measured[], s: Settings, tl: Timeline, root: string, key: string): string {
  const head = [
    '/* Every shape has pathLength="1", so it is 1 long in dash units:',
    '   a dash of 1 and a gap of 2, pushed back by 1, hide it; 0 draws it. */',
  ];
  const reduced = [
    '/* Less motion asked for: the finished drawing, at once. */',
    '@media (prefers-reduced-motion: reduce) {',
    `  ${sel(root)} {`,
    '    animation: none;',
    '    stroke-dasharray: none;',
    '  }',
    '}',
  ];
  return (s.loop === 'none' ? once(t, s, tl, root, key, head) : looped(t, m, s, tl, root, key, head))
    .concat('', reduced)
    .join('\n');
}

function once(t: readonly Timing[], s: Settings, tl: Timeline, root: string, key: string, head: string[]): string[] {
  const D = sec(s.duration);
  const stagger = s.stagger > 0 && t.some((x) => x.rank > 0);
  const varied = t.some((x) => x.factor !== 1);
  const dur = varied ? `calc(var(--d, 1) * ${D})` : D;
  const delay = stagger ? `calc(var(--i, 0) * ${sec(s.stagger)})` : '';
  const rule = [`${sel(root)} {`, '  stroke-dasharray: 1 2;'];
  if (tl.fade) {
    const F = sec(tl.fade);
    rule.push(`  animation: ${key}-draw ${D} ${s.easing} both, ${key}-fill ${F} ${s.easing} both;`);
    if (varied) rule.push(`  animation-duration: ${dur}, ${F};`);
    // The fill starts as its own line finishes.
    const after = stagger && varied ? `calc(var(--i, 0) * ${sec(s.stagger)} + var(--d, 1) * ${D})`
      : stagger ? `calc(var(--i, 0) * ${sec(s.stagger)} + ${D})`
        : varied ? `calc(var(--d, 1) * ${D})` : D;
    rule.push(`  animation-delay: ${delay || '0s'}, ${after};`);
  } else {
    rule.push(`  animation: ${key}-draw ${D} ${s.easing} both;`);
    if (varied) rule.push(`  animation-duration: ${dur};`);
    if (delay) rule.push(`  animation-delay: ${delay};`);
  }
  rule.push('}');
  const out = [...head, ...rule, '',
    `@keyframes ${key}-draw {`,
    '  from { stroke-dashoffset: 1; }',
    '  99.9% { stroke-dasharray: 1 2; }',
    '  to { stroke-dashoffset: 0; stroke-dasharray: none; }',
    '}'];
  if (tl.fade) out.push('', `@keyframes ${key}-fill {`, '  from { fill-opacity: 0; }', '}');
  return out;
}

/**
 * A loop: one keyframes block per shape over the whole cycle, so every line
 * waits its turn inside the cycle and they all start again together. (With a
 * shared block and animation-delay, each line would restart on its own
 * schedule and the drawing would never clear at once.) alternate plays the
 * same block back, so the last line undraws first.
 */
function looped(t: readonly Timing[], m: readonly Measured[], s: Settings, tl: Timeline, root: string, key: string, head: string[]): string[] {
  const out = [...head,
    `${sel(root)} {`,
    '  stroke-dasharray: 1 2;',
    `  animation: var(--n) ${sec(tl.period)} ${s.easing} infinite${s.loop === 'alternate' ? ' alternate' : ''};`,
    '}'];
  const P = tl.period;
  t.forEach((x, k) => {
    const a = (x.delay / P) * 100;
    const b = round((x.delay + x.dur) / P * 100, 2);
    const flip = round(b + 0.01, 2);
    const block = [`@keyframes ${key}-${k + 1} {`];
    block.push(`  ${a > 0 ? `0%, ${pct(a)}` : '0%'} { stroke-dashoffset: 1; }`);
    if (flip < 100) {
      block.push(`  ${pct(b)} { stroke-dashoffset: 0; stroke-dasharray: 1 2; }`);
      block.push(`  ${pct(flip)}, 100% { stroke-dashoffset: 0; stroke-dasharray: none; }`);
    } else {
      block.push(`  ${pct(b)}, 100% { stroke-dashoffset: 0; }`);
    }
    if (tl.fade && m[k].filled) {
      const f = Math.min(100, ((x.delay + x.dur + tl.fade) / P) * 100);
      block.push(`  0%, ${pct(b)} { fill-opacity: 0; }`);
      block.push(`  ${f >= 100 ? '100%' : `${pct(f)}, 100%`} { fill-opacity: ${fmt(m[k].fillOpacity)}; }`);
    }
    block.push('}');
    out.push('', ...block);
  });
  return out;
}

// ── The markup ──────────────────────────────────────────────────────────────

export function toTree(el: Element): Tree {
  return {
    tag: el.localName,
    attrs: Array.from(el.attributes, (a) => [a.name, a.value] as [string, string]),
    children: Array.from(el.children, toTree),
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Build a Tree as SVG elements, for the previews. Only ever given the output of buildOutput(). */
export function toDom(tree: Tree): SVGElement {
  const el = document.createElementNS(SVG_NS, tree.tag);
  for (const [n, v] of tree.attrs) if (n !== 'xmlns') el.setAttribute(n, v);
  if (tree.text !== undefined) el.textContent = tree.text;
  for (const c of tree.children) el.appendChild(toDom(c));
  return el;
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Indented markup, one element per line. */
export function serialize(node: Tree, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = node.attrs.map(([n, v]) => ` ${n}="${esc(v)}"`).join('');
  if (node.text !== undefined) {
    const body = node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').split('\n').map((l) => (l ? `${pad}  ${l}` : '')).join('\n');
    return `${pad}<${node.tag}${attrs}>\n${body}\n${pad}</${node.tag}>`;
  }
  if (!node.children.length) return `${pad}<${node.tag}${attrs}/>`;
  return `${pad}<${node.tag}${attrs}>\n${node.children.map((c) => serialize(c, depth + 1)).join('\n')}\n${pad}</${node.tag}>`;
}

function setAttr(attrs: [string, string][], name: string, value: string) {
  const i = attrs.findIndex(([n]) => n === name);
  if (i >= 0) attrs[i] = [name, value];
  else attrs.push([name, value]);
}

type Mode = 'file' | 'page' | 'scroll' | 'preview' | 'preview-scroll';

/** The drawing as one output needs it. */
function shape(src: Tree, mode: Mode, ctx: Ctx): Tree {
  let k = 0;
  const animated = mode === 'file' || mode === 'page' || mode === 'preview';
  const walk = (node: Tree, isRoot: boolean): Tree => {
    let attrs = node.attrs.slice();
    if (isRoot) {
      if (ctx.viewBox && !attrs.some(([n]) => n === 'viewBox')) attrs.unshift(['viewBox', ctx.viewBox]);
      if (ctx.bare) {
        setAttr(attrs, 'fill', 'none');
        setAttr(attrs, 'stroke', 'currentColor');
        setAttr(attrs, 'stroke-width', ctx.bare);
      }
      if (mode === 'file') attrs.unshift(['xmlns', SVG_NS]);
      if (mode === 'file' || mode === 'page') attrs.push(['class', OUT_NAME]);
      if (mode === 'preview') attrs.push(['class', `${ctx.previewName} ldg-svg`]);
      if (mode === 'preview-scroll') attrs.push(['class', 'ldg-svg']);
    } else if ((DRAWABLE as readonly string[]).includes(node.tag)) {
      const i = k++;
      attrs = attrs.filter(([n]) => n !== 'vector-effect');
      if (ctx.stroke) setAttr(attrs, 'stroke', ctx.stroke);
      if (ctx.width) setAttr(attrs, 'stroke-width', ctx.width);
      if (animated) {
        attrs.push(['pathLength', '1']);
        const st = shapeStyle(ctx.timings[i], i, ctx.s, mode === 'preview' ? ctx.previewName : OUT_NAME);
        if (st) attrs.push(['style', st]);
      }
    }
    const children = node.children.map((c) => walk(c, false));
    if (isRoot && (mode === 'file' || mode === 'preview')) {
      children.unshift({ tag: 'style', attrs: [], children: [], text: mode === 'file' ? ctx.css : ctx.previewCss });
    }
    return { tag: node.tag, attrs, children };
  };
  return walk(src, true);
}

type Ctx = {
  s: Settings;
  timings: Timing[];
  viewBox: string | null;
  /** A bare path's stroke width, or null. */
  bare: string | null;
  stroke: string | null;
  width: string | null;
  css: string;
  previewCss: string;
  previewName: string;
};

export type Output = {
  /** The complete animated SVG. */
  file: string;
  /** For a page: the stylesheet and the inline SVG. */
  css: string;
  markup: string;
  /** The SVG for scrollDraw: no pathLength, no animation. */
  scrollMarkup: string;
  scroll: ScrollPlan;
  /** css, markup and scrollMarkup without the source line, for htmlPage() (htmlFile writes its own). */
  raw: { css: string; markup: string; scrollMarkup: string };
  /** The file again, with the preview's own class and keyframe names (inline CSS applies to the whole page). */
  preview: Tree;
  previewScroll: Tree;
  timeline: Timeline;
  timings: Timing[];
  count: number;
};

const HEX = /^#[0-9a-f]{6}$/i;

export function buildOutput(
  src: Tree,
  m: readonly Measured[],
  s: Settings,
  opts: { viewBox: string | null; bare: string | null; previewName: string },
): Output {
  const timings = plan(m.map((x) => x.length), s);
  const tl = timeline(timings, m, s);
  const stroke = s.stroke === 'current' ? 'currentColor' : s.stroke === 'custom' && HEX.test(s.color) ? s.color.toLowerCase() : null;
  const ctx: Ctx = {
    s,
    timings,
    viewBox: opts.viewBox,
    bare: opts.bare,
    stroke,
    width: s.width === null ? null : fmt(s.width),
    css: writeCss(timings, m, s, tl, OUT_NAME, OUT_NAME),
    previewCss: writeCss(timings, m, s, tl, opts.previewName, opts.previewName),
    previewName: opts.previewName,
  };
  const hasEllipse = hasTag(src, 'ellipse');
  const fills = tl.fade > 0 ? m.filter((x) => x.filled).map((x) => x.fillOpacity) : [];
  const raw = { css: ctx.css, markup: serialize(shape(src, 'page', ctx)), scrollMarkup: serialize(shape(src, 'scroll', ctx)) };
  return {
    file: withSource(serialize(shape(src, 'file', ctx)), SLUG, 'svg'),
    css: withSource(raw.css, SLUG, 'css'),
    markup: withSource(raw.markup, SLUG, 'html'),
    scrollMarkup: withSource(raw.scrollMarkup, SLUG, 'html'),
    scroll: scrollPlan(m.length, hasEllipse, fills, s),
    raw,
    preview: shape(src, 'preview', ctx),
    previewScroll: shape(src, 'preview-scroll', ctx),
    timeline: tl,
    timings,
    count: m.length,
  };
}

const hasTag = (t: Tree, tag: string): boolean => t.tag === tag || t.children.some((c) => hasTag(c, tag));

// ── The scroll version ──────────────────────────────────────────────────────

/** Where the scroll version starts: the drawing's top 85% down the window. */
export const SCROLL_START = 85;
/** Where its last line lands: the drawing's top 35% down. */
export const SCROLL_END = 35;
/** The library's named easing for each CSS keyword (its ease-in and ease-out are quadratics). */
const LIB_EASING: Record<Easing, ScrollDrawOptions['easing'] | null> = {
  linear: null,
  ease: 'ease-out',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
};

export type ScrollPlan = {
  /** main.js, source line and all. */
  code: string;
  options: ScrollDrawOptions;
  /** The comments and the scrollDraw call, without the import, for htmlPage(). */
  call: string[];
};

/**
 * The same drawing on scroll. scrollDraw gives every line the whole trigger
 * window and starts each `stagger` of it after the one before, so the run is
 * window × (1 + (n − 1) × stagger). Stagger is the timed version's
 * stagger ÷ duration, so the lines overlap the same way, and the window is
 * cut to fit: the last line lands when the drawing's top is 35% down,
 * however many lines there are.
 *
 * `fills` is the fill-opacity of each filled shape, when the fill fade is on.
 * fillOpacity sets one value on every shape, so it is used only when they all
 * share it: otherwise a light fill (fill-opacity 0.18) would end up solid.
 */
export function scrollPlan(n: number, ellipse: boolean, fills: readonly number[], s: Settings): ScrollPlan {
  const options: ScrollDrawOptions = {};
  const lines: string[] = [];
  if (ellipse) {
    options.selector = DRAWABLE_SELECTOR;
    lines.push(`  selector: '${DRAWABLE_SELECTOR}', // the default has no ellipse`);
  }
  const easing = LIB_EASING[s.easing];
  if (easing) {
    options.easing = easing;
    lines.push(`  easing: '${easing}',${s.easing === 'ease' ? " // CSS ease has no twin here: ease-out is the nearest" : ''}`);
  }
  let stagger = 0;
  if (n > 1 && s.stagger > 0) {
    stagger = round(Math.min(s.stagger / s.duration, 49 / (n - 1)));
    if (stagger > 0) {
      options.stagger = stagger;
      lines.push(`  stagger: ${stagger},`);
    }
  }
  const end = fmt(SCROLL_START - (SCROLL_START - SCROLL_END) / (1 + (n - 1) * stagger), 1);
  options.trigger = { start: `top ${SCROLL_START}%`, end: `top ${end}%` };
  lines.push(`  trigger: { start: 'top ${SCROLL_START}%', end: 'top ${end}%' },`);
  const opacities = [...new Set(fills.map((f) => round(f)))];
  if (opacities.length === 1) {
    options.fillOpacity = [0, opacities[0]];
    lines.push(`  fillOpacity: [0, ${opacities[0]}], // fills fade in as each line draws`);
  }
  const lost = [
    s.order !== 'document' ? `the ${s.order === 'longest' ? 'longest' : 'shortest'}-first order (it draws in document order)` : '',
    s.hand > 0 ? 'the hand-drawn timing' : '',
    s.loop !== 'none' ? 'the loop' : '',
  ].filter(Boolean);
  const call = [
    `// Draws as the page scrolls: it starts when the drawing's top is ${SCROLL_START}% down`,
    `// the window and the last line lands at ${SCROLL_END}%. Scrolling back undraws it.`,
    ...(lost.length ? [`// Not carried over: ${lost.join(', ')}.`] : []),
    ...(opacities.length > 1
      ? ['// The fills are left as they are: fillOpacity sets one opacity on every shape,', `// and these fills have ${opacities.length} (${opacities.join(', ')}).`]
      : []),
    `scrollDraw('#drawing', {`,
    ...lines,
    '});',
  ];
  const code = [
    '// <div id="drawing"> + the markup below + </div>',
    '',
    "import { scrollDraw } from 'svg-scroll-draw';",
    '',
    ...call,
  ].join('\n');
  return { code: withSource(code, SLUG, 'js'), options, call };
}

// ── The page: both versions, run outside this site ──────────────────────────

const indent = (text: string, n: number) => text.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/** The page around the drawing; the generated CSS follows it. */
const PAGE_CSS = `:root { color-scheme: light dark; }
body { margin: 0; font: 16px/1.6 system-ui, sans-serif; }
h1 { margin: 0; font-size: 1.5rem; }
p { margin: 0; }
svg { display: block; width: min(100%, 560px); height: auto; max-height: 60vh; margin: 0 auto; }
button { padding: 8px 16px; font: inherit; cursor: pointer; }
.stage { display: grid; place-items: center; align-content: center; gap: 20px; min-height: 100vh; padding: 32px 16px; box-sizing: border-box; text-align: center; }
.hint { padding: 30vh 16px; text-align: center; opacity: 0.7; }
.end { padding-bottom: 70vh; }
#drawing { padding: 0 16px; }
@media (prefers-reduced-motion: reduce) {
  #replay { display: none; }
}`;

/**
 * A complete page for the current settings: the CSS drawing as the page loads
 * (the CSS + markup output, which is what the preview plays), then the scroll
 * version further down, drawn by scrollDraw from jsDelivr, with room to
 * scroll it through.
 */
export function htmlPage(out: Output, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'SVG line drawing',
    css: `${PAGE_CSS}\n\n${out.raw.css}`,
    body: [
      '<header class="stage">',
      '  <h1>SVG line drawing</h1>',
      '  <p>Drawn with CSS as the page loads, no JavaScript. Scroll down for the scroll version.</p>',
      indent(out.raw.markup, 2),
      '  <button type="button" id="replay">Replay</button>',
      '</header>',
      '<p class="hint">On scroll: scrollDraw draws the same drawing as it rises.</p>',
      '<div id="drawing">',
      indent(out.raw.scrollMarkup, 2),
      '</div>',
      '<p class="hint end">Scroll back up and it undraws.</p>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      '// Replay starts the CSS drawing again.',
      "document.getElementById('replay').addEventListener('click', () => {",
      "  for (const a of document.querySelector('.line-drawing').getAnimations({ subtree: true })) {",
      '    a.currentTime = 0;',
      '    a.play();',
      '  }',
      '});',
      '',
      ...out.scroll.call,
    ].join('\n'),
  });
}
