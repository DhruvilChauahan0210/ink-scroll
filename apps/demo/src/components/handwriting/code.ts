import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { fmt, round, serialize, type Tree } from '@/components/linedraw/generate';
import { cdnModule, htmlFile, withSource } from '@/lib/tool-export';
import { layout, type FontKey, type Laid } from './layout';

/**
 * The handwriting animation generator's output, written from data.
 *
 * The text is laid out in a Hershey single-stroke font (layout.ts), so every
 * path is the pen's centre line, drawn once. An outline font's letters are
 * filled shapes: a line-drawing animation traces their edges, both sides of
 * every stroke, and the word comes out as a double line.
 *
 * The CSS is the line drawing generator's technique (components/linedraw/
 * generate.ts, checked in Chromium, Firefox and WebKit): pathLength="1" on
 * every stroke, stroke-dasharray: 1 2, the offset from 1 to 0. Here each
 * stroke also gets its own start and duration, --at and --for, from the pen's
 * timeline:
 *
 * - The pen moves at one speed, so a stroke takes time in proportion to its
 *   length, and all the ink takes `duration` seconds.
 * - Between one letter and the next it lifts for `stagger` seconds, and at a
 *   space for `wordPause` instead.
 *
 * So the strokes draw one after another in writing order, never two at once.
 *
 * A loop gives every stroke its own keyframes over the whole cycle instead
 * (with one shared rule each stroke would restart on its own schedule), and
 * fades the whole line out before it writes again.
 */

export const SLUG = 'handwriting-animation-generator';
/** The root class and keyframe prefix of the code you copy. */
export const OUT_NAME = 'handwriting';
/** The scroll version's container id. */
export const SCROLL_ID = 'signature';

export const COLOURS = [
  ['current', 'currentColor'],
  ['custom', 'colour'],
] as const;
export type ColourMode = (typeof COLOURS)[number][0];

export const OUTPUTS = [
  ['file', 'SVG file · CSS only', 'handwriting.svg'],
  ['scroll', 'On scroll · scrollDraw', 'main.js'],
  ['react', 'React', 'Signature.jsx'],
] as const;
export type OutputKey = (typeof OUTPUTS)[number][0];

export type Settings = {
  text: string;
  font: FontKey;
  /** px to the em (32 font units). */
  size: number;
  /** Stroke width in px. */
  width: number;
  colour: ColourMode;
  /** The ink colour when colour is 'custom'. */
  ink: string;
  /** Seconds of ink: all the strokes, without the pauses. */
  duration: number;
  /** Seconds the pen lifts between letters. */
  stagger: number;
  /** Seconds the pen lifts at a space, instead of the stagger. */
  wordPause: number;
  loop: boolean;
};

export const DEFAULTS: Settings = {
  text: 'Ada Lovelace',
  font: 'script',
  size: 72,
  width: 2.5,
  colour: 'current',
  ink: '#2747c4',
  duration: 3,
  stagger: 0.05,
  wordPause: 0.35,
  loop: false,
};

export const LIMITS = {
  size: [32, 160, 4],
  width: [0.5, 8, 0.25],
  duration: [0.5, 10, 0.1],
  stagger: [0, 0.5, 0.01],
  wordPause: [0, 1.5, 0.05],
} as const;

/** A loop holds the finished line this long, then fades it out over FADE. */
export const HOLD = 1.5;
export const FADE = 0.5;

/** Where the scroll version starts: the line's top 85% down the window. */
export const SCROLL_START = 85;
/** Where its last stroke lands: the top 35% down. */
export const SCROLL_END = 35;

// ── The pen's timeline ──────────────────────────────────────────────────────

export type Timing = { at: number; dur: number };

export type Plan = {
  laid: Laid;
  /** Per stroke, in writing order. */
  timings: Timing[];
  /** Seconds until the last stroke is drawn. */
  run: number;
  /** Seconds of one loop: run, hold, fade. Equal to run without a loop. */
  cycle: number;
  /** The SVG's size and the offset that puts the ink inside it, padded for the stroke. */
  frame: { w: number; h: number; dx: number; dy: number };
};

export function plan(s: Settings): Plan {
  const laid = layout(s.text, s.font, s.size);
  const ink = laid.strokes.reduce((a, x) => a + x.len, 0) || 1;
  const timings: Timing[] = [];
  let t = 0;
  laid.strokes.forEach((x, k) => {
    const prev = laid.strokes[k - 1];
    if (prev && x.word !== prev.word) t += s.wordPause;
    else if (prev && x.letter !== prev.letter) t += s.stagger;
    const dur = (x.len / ink) * s.duration;
    timings.push({ at: round(t), dur: Math.max(0.001, round(dur)) });
    t += dur;
  });
  const run = round(t);
  const pad = s.width / 2 + 2;
  const frame = {
    w: Math.ceil(laid.box.w + pad * 2),
    h: Math.ceil(laid.box.h + pad * 2),
    dx: pad - laid.box.x,
    dy: pad - laid.box.y,
  };
  return { laid, timings, run, cycle: s.loop ? round(run + HOLD + FADE) : run, frame };
}

/** Above this turn at a point (in degrees) the corner is kept; below it, the pen goes round it. */
const CORNER = 70;

/**
 * One stroke as path data, in the SVG's own px. Hershey's points are a few
 * units apart, so a curve drawn point to point shows its facets at a large
 * size. Where the pen turns gently the path goes round the point instead, on a
 * quadratic from the middle of one segment to the middle of the next, which
 * keeps the line through the same points' neighbourhood with no kink; a sharp
 * turn (a cusp, the top of an A) stays a corner.
 */
export function strokeD(pts: readonly (readonly [number, number])[], dx: number, dy: number): string {
  const xy = (x: number, y: number) => `${fmt(x + dx, 2)} ${fmt(y + dy, 2)}`;
  const at = (i: number) => xy(pts[i][0], pts[i][1]);
  const mid = (i: number) => xy((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  if (pts.length === 1) return `M${at(0)}L${at(0)}`;
  const gentle = (i: number) => {
    const ax = pts[i][0] - pts[i - 1][0];
    const ay = pts[i][1] - pts[i - 1][1];
    const bx = pts[i + 1][0] - pts[i][0];
    const by = pts[i + 1][1] - pts[i][1];
    const n = Math.hypot(ax, ay) * Math.hypot(bx, by);
    return n > 0 && (ax * bx + ay * by) / n > Math.cos((CORNER * Math.PI) / 180);
  };
  let d = `M${at(0)}`;
  let onMid = false;
  for (let i = 1; i < pts.length - 1; i++) {
    if (gentle(i)) {
      if (!onMid) d += `L${mid(i - 1)}`;
      d += `Q${at(i)} ${mid(i)}`;
      onMid = true;
    } else {
      d += `L${at(i)}`;
      onMid = false;
    }
  }
  return `${d}L${at(pts.length - 1)}`;
}

// ── The CSS ─────────────────────────────────────────────────────────────────

const sec = (n: number) => `${fmt(n)}s`;
const pct = (n: number) => `${fmt(n, 2)}%`;

/** Per stroke: when it starts and how long it takes; its keyframes in a loop. */
function strokeStyle(t: Timing, k: number, s: Settings, key: string): string {
  return s.loop ? `--n:${key}-${k + 1}` : `--at:${sec(t.at)};--for:${sec(t.dur)}`;
}

export function writeCss(p: Plan, s: Settings, root: string, key: string): string {
  const reduced = [
    '/* Less motion asked for: the finished line, at once. */',
    '@media (prefers-reduced-motion: reduce) {',
    ...(s.loop ? [`  .${root} { animation: none; }`] : []),
    `  .${root} path {`,
    '    animation: none;',
    '    stroke-dasharray: none;',
    '  }',
    '}',
  ];
  const head = [
    '/* Every stroke has pathLength="1", so it is 1 long in dash units:',
    '   a dash of 1 and a gap of 2, pushed back by 1, hide it; 0 draws it. */',
  ];
  if (!s.loop) {
    return [
      ...head,
      '/* --at is when the pen reaches the stroke, --for how long it takes. */',
      `.${root} path {`,
      '  stroke-dasharray: 1 2;',
      `  animation: ${key}-draw linear both;`,
      '  animation-duration: var(--for);',
      '  animation-delay: var(--at);',
      '}',
      '',
      `@keyframes ${key}-draw {`,
      '  from { stroke-dashoffset: 1; }',
      '  to { stroke-dashoffset: 0; }',
      '}',
      '',
      ...reduced,
    ].join('\n');
  }
  const C = p.cycle;
  const out = [
    ...head,
    `/* One ${sec(C)} cycle: write, hold ${sec(HOLD)}, fade out over ${sec(FADE)}, again.`,
    '   Each stroke has its own keyframes, named in --n, so all start again together. */',
    `.${root} {`,
    `  animation: ${key}-fade ${sec(C)} linear infinite;`,
    '}',
    `.${root} path {`,
    '  stroke-dasharray: 1 2;',
    `  animation: var(--n) ${sec(C)} linear infinite;`,
    '}',
    '',
    `@keyframes ${key}-fade {`,
    `  0%, ${pct(((p.run + HOLD) / C) * 100)} { opacity: 1; }`,
    '  100% { opacity: 0; }',
    '}',
  ];
  p.timings.forEach((t, k) => {
    const a = round((t.at / C) * 100, 2);
    const b = Math.max(round(((t.at + t.dur) / C) * 100, 2), round(a + 0.01, 2));
    out.push(`@keyframes ${key}-${k + 1} { ${a > 0 ? `0%, ${pct(a)}` : '0%'} { stroke-dashoffset: 1; } ${pct(b)}, 100% { stroke-dashoffset: 0; } }`);
  });
  return [...out, '', ...reduced].join('\n');
}

// ── The markup ──────────────────────────────────────────────────────────────

const HEX = /^#[0-9a-f]{6}$/i;
export const inkOf = (s: Settings) => (s.colour === 'custom' && HEX.test(s.ink) ? s.ink.toLowerCase() : 'currentColor');

type Mode = 'file' | 'preview' | 'scroll' | 'preview-scroll';

/** The SVG as one output needs it: animated (pathLength, timings, <style>) or bare for scrollDraw. */
export function svgTree(p: Plan, s: Settings, mode: Mode, opts: { css?: string; name?: string } = {}): Tree {
  const animated = mode === 'file' || mode === 'preview';
  const attrs: [string, string][] = [];
  if (mode === 'file') attrs.push(['xmlns', 'http://www.w3.org/2000/svg']);
  attrs.push(
    ['viewBox', `0 0 ${p.frame.w} ${p.frame.h}`],
    ['width', String(p.frame.w)],
    ['height', String(p.frame.h)],
    ['fill', 'none'],
    ['stroke', inkOf(s)],
    ['stroke-width', fmt(s.width)],
    // scrollDraw's dash is the stroke's length with a gap as long, so the next
    // dash starts exactly where the stroke ends, and WebKit paints that empty
    // dash's round cap: a dot at the end of every stroke not yet written
    // (measured, 2.25.0). A butt cap on an empty dash paints nothing. The CSS
    // version has a gap twice the stroke and keeps its round caps.
    ['stroke-linecap', animated ? 'round' : 'butt'],
    ['stroke-linejoin', 'round'],
  );
  if (mode === 'file') attrs.push(['class', OUT_NAME]);
  if (mode === 'preview') attrs.push(['class', `${opts.name} hwg-svg`]);
  if (mode === 'preview-scroll') attrs.push(['class', 'hwg-svg']);
  attrs.push(['role', 'img'], ['aria-label', p.laid.text.trim() || 'Handwriting']);
  const children: Tree[] = p.laid.strokes.map((x, k) => {
    const a: [string, string][] = [];
    if (animated) a.push(['pathLength', '1'], ['style', strokeStyle(p.timings[k], k, s, mode === 'preview' ? opts.name! : OUT_NAME)]);
    a.push(['d', strokeD(x.pts, p.frame.dx, p.frame.dy)]);
    return { tag: 'path', attrs: a, children: [] };
  });
  if (animated) children.unshift({ tag: 'style', attrs: [], children: [], text: opts.css ?? '' });
  return { tag: 'svg', attrs, children };
}

// ── The scroll version ──────────────────────────────────────────────────────

export type ScrollPlan = {
  options: ScrollDrawOptions;
  /** The comments and the call, without the import. */
  call: string[];
  /** main.js with its source line. */
  code: string;
};

/**
 * scrollDraw with stagger: 1 starts each stroke as the one before it ends, so
 * they draw one at a time in document order, which is writing order. Each
 * stroke gets the whole trigger window, so the run is n windows; the window is
 * cut so the last stroke lands when the line's top is SCROLL_END% down.
 */
export function scrollPlan(n: number): ScrollPlan {
  const end = fmt(SCROLL_START - (SCROLL_START - SCROLL_END) / Math.max(1, n), 2);
  const trigger = { start: `top ${SCROLL_START}%`, end: `top ${end}%` };
  const options: ScrollDrawOptions = { stagger: 1, trigger };
  const call = [
    `// Writes as the page scrolls: stagger: 1 starts each of the ${n} strokes as`,
    '// the one before it ends, in writing order. It starts when the line\'s top is',
    `// ${SCROLL_START}% down the window and the last stroke lands at ${SCROLL_END}%. Scrolling back unwrites it.`,
    `scrollDraw('#${SCROLL_ID}', {`,
    '  stagger: 1,',
    `  trigger: { start: '${trigger.start}', end: '${trigger.end}' },`,
    '});',
  ];
  const code = [`// <div id="${SCROLL_ID}"> + the SVG below + </div>`, '', "import { scrollDraw } from 'svg-scroll-draw';", '', ...call].join('\n');
  return { options, call, code: withSource(code, SLUG, 'js') };
}

// ── React ───────────────────────────────────────────────────────────────────

const JSX_NAMES: Record<string, string> = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

function jsxSvg(p: Plan, s: Settings, depth: number): string {
  const pad = '  '.repeat(depth);
  const attrs = svgTree(p, s, 'scroll').attrs
    .map(([n, v]) => {
      const name = JSX_NAMES[n] ?? n;
      return /^-?\d+(\.\d+)?$/.test(v) && name !== 'aria-label' ? `${name}={${v}}` : `${name}="${v.replace(/"/g, '&quot;')}"`;
    });
  const paths = p.laid.strokes.map((x) => `${pad}  <path d="${strokeD(x.pts, p.frame.dx, p.frame.dy)}" />`);
  return [`${pad}<svg`, ...attrs.map((a) => `${pad}  ${a}`), `${pad}>`, ...paths, `${pad}</svg>`].join('\n');
}

function reactComponent(p: Plan, s: Settings, sp: ScrollPlan, client: boolean): string {
  const t = sp.options.trigger!;
  return `${client ? "'use client';\n\n" : ''}import { ScrollDraw } from 'svg-scroll-draw/react';

// Writes as the page scrolls: stagger={1} starts each stroke as the one
// before it ends, in writing order. Scrolling back unwrites it.
export default function Signature() {
  return (
    <ScrollDraw stagger={1} trigger={{ start: '${t.start}', end: '${t.end}' }}>
${jsxSvg(p, s, 3)}
    </ScrollDraw>
  );
}
`;
}

export const reactCode = (p: Plan, s: Settings, sp: ScrollPlan) => withSource(reactComponent(p, s, sp, true), SLUG, 'jsx');

/** The React project for StackBlitz: the component, with room to scroll it through. */
export function reactApp(p: Plan, s: Settings, sp: ScrollPlan): { app: string; css: string } {
  const component = reactComponent(p, s, sp, false).replace('export default function Signature', 'function Signature');
  return {
    app: `${component}
export default function App() {
  return (
    <main>
      <p className="hint">Scroll down: the line writes itself as it rises.</p>
      <Signature />
      <p className="hint end">Scroll back up and it unwrites.</p>
    </main>
  );
}
`,
    css: `:root { color-scheme: light dark; }
body { margin: 0; font: 16px/1.6 system-ui, sans-serif; }
main { display: grid; justify-items: center; padding: 0 16px; }
svg { display: block; max-width: 100%; height: auto; }
.hint { padding: 40vh 0; opacity: 0.7; }
.end { padding-bottom: 70vh; }
`,
  };
}

// ── Everything one set of settings writes ───────────────────────────────────

export type Output = {
  plan: Plan;
  css: string;
  /** The animated SVG file, with its source line. */
  file: string;
  /** The bare SVG for scrollDraw, with its source line, and without. */
  scrollMarkup: string;
  rawScrollMarkup: string;
  scroll: ScrollPlan;
  react: string;
  preview: Tree;
  previewScroll: Tree;
};

export function buildOutput(s: Settings, previewName = 'hwg-pv'): Output {
  const p = plan(s);
  const css = writeCss(p, s, OUT_NAME, OUT_NAME);
  const scroll = scrollPlan(p.laid.strokes.length);
  const rawScrollMarkup = serialize(svgTree(p, s, 'scroll'));
  return {
    plan: p,
    css,
    file: withSource(serialize(svgTree(p, s, 'file', { css })), SLUG, 'svg'),
    scrollMarkup: withSource(rawScrollMarkup, SLUG, 'html'),
    rawScrollMarkup,
    scroll,
    react: reactCode(p, s, scroll),
    preview: svgTree(p, s, 'preview', { css: writeCss(p, s, previewName, previewName), name: previewName }),
    previewScroll: svgTree(p, s, 'preview-scroll'),
  };
}

// ── The page: both versions, run outside this site ──────────────────────────

const indent = (text: string, n: number) => text.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

const PAGE_CSS = `:root { color-scheme: light dark; }
body { margin: 0; font: 16px/1.6 system-ui, sans-serif; }
h1 { margin: 0; font-size: 1.5rem; }
p { margin: 0; }
svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
button { padding: 8px 16px; font: inherit; cursor: pointer; }
.stage { display: grid; place-items: center; align-content: center; gap: 20px; min-height: 100vh; padding: 32px 16px; box-sizing: border-box; text-align: center; }
.hint { padding: 30vh 16px; text-align: center; opacity: 0.7; }
.end { padding-bottom: 70vh; }
#${SCROLL_ID} { padding: 0 16px; }
@media (prefers-reduced-motion: reduce) {
  #replay { display: none; }
}`;

/**
 * A complete page: the CSS-only file inline at the top, writing as the page
 * loads, then the scroll version further down, drawn by scrollDraw from
 * jsDelivr, with room to scroll it through.
 */
export function htmlPage(out: Output, version: string): string {
  const file = out.file.replace(/^<!--[^\n]*-->\n/, '').replace(' xmlns="http://www.w3.org/2000/svg"', '');
  return htmlFile({
    slug: SLUG,
    title: 'Handwriting animation',
    css: PAGE_CSS,
    body: [
      '<header class="stage">',
      '  <h1>Handwriting animation</h1>',
      '  <p>Written with CSS as the page loads, no JavaScript. Scroll down for the scroll version.</p>',
      indent(file, 2),
      '  <button type="button" id="replay">Replay</button>',
      '</header>',
      '<p class="hint">On scroll: scrollDraw writes the same line as it rises.</p>',
      `<div id="${SCROLL_ID}">`,
      indent(out.rawScrollMarkup, 2),
      '</div>',
      '<p class="hint end">Scroll back up and it unwrites.</p>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      '// Replay starts the CSS version again.',
      "document.getElementById('replay').addEventListener('click', () => {",
      `  for (const a of document.querySelector('.${OUT_NAME}').getAnimations({ subtree: true })) {`,
      '    a.currentTime = 0;',
      '    a.play();',
      '  }',
      '});',
      '',
      ...out.scroll.call,
    ].join('\n'),
  });
}
