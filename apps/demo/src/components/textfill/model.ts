import { TEXT_DEFAULTS, maxStagger } from '@/data/text-effects';
import { defaultsOf, readTrigger, type Edge } from '@/data/trigger';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * Everything the text fill on scroll generator writes, from one settings
 * object: the CSS, the markup, the JavaScript, the React component, the
 * preview's own copy of the CSS, and the runnable HTML file. Pure functions, so
 * the preview, the code tabs and the download cannot disagree.
 *
 * Three engines draw the same idea:
 *
 * - css: a gradient clipped to the text (background-clip: text) whose
 *   background-size runs 0% → 100% on a view timeline (animation-timeline).
 * - progress: the same gradient, sized by --scroll-progress, which
 *   scrollProgress (svg-scroll-draw/progress, progress/index.ts) writes on the
 *   element. Works wherever the script runs.
 * - text: scrollText (svg-scroll-draw/text, text/index.ts) splits the text and
 *   takes each piece from `from.opacity` to 1 in turn. It animates opacity and
 *   transform only, so here the dim state is an opacity, not a colour.
 *
 * The scroll range is one trigger, start and end, in the library's own words
 * (an element edge and a viewport line); rangeEdge() writes the same moment as
 * a CSS animation-range, which the browser agrees with to the pixel.
 */

export const SLUG = 'text-fill-scroll-generator';
export const TITLE = 'Text fill on scroll';

export type Engine = 'css' | 'progress' | 'text';
export type Direction = 'reading' | 'across' | 'down';
export type Split = 'words' | 'chars' | 'lines';
export type Tag = 'p' | 'h2';
export type CodeTab = 'css' | 'html' | 'js' | 'react';
/** A trigger pair: an edge of the text block, and a line `at` percent down the viewport. */
export type Point = { edge: Edge; at: number };

export type Settings = {
  text: string;
  tag: Tag;
  engine: Engine;
  /** css and progress: which way the fill front runs. */
  direction: Direction;
  /** text: what scrollText splits the text into. */
  split: Split;
  /** text: scrollText's stagger. */
  stagger: number;
  /** The filled text colour (for text, the text colour). */
  full: string;
  /** css and progress: the unfilled text colour. */
  dim: string;
  /** text: the opacity a piece starts at (scrollText's from.opacity). */
  dimOpacity: number;
  /** The page background behind the text: for contrast, and for the selection colours. */
  bg: string;
  start: Point;
  end: Point;
  /** progress and text: keep the furthest point reached instead of following the scroll back. */
  once: boolean;
};

export const ENGINES: { key: Engine; label: string; what: string }[] = [
  {
    key: 'css',
    label: 'CSS only',
    what: 'A colour gradient clipped to the text, sized by a CSS scroll timeline (animation-timeline: view()). No JavaScript; browsers without scroll timelines show the text filled.',
  },
  {
    key: 'progress',
    label: 'scrollProgress',
    what: 'The same gradient, sized by --scroll-progress, which scrollProgress writes on the text as it scrolls. Runs in every browser the script runs in, and can stay filled once read.',
  },
  {
    key: 'text',
    label: 'scrollText',
    what: 'scrollText splits the text into words, letters or lines and takes each one from dim to full opacity in turn, a little after the one before.',
  },
];

export const DIRECTIONS: { key: Direction; label: string; what: string }[] = [
  { key: 'reading', label: 'reading order', what: 'Line by line: one strip runs through the text in reading order, so the next line starts where the last one ended.' },
  { key: 'across', label: 'left to right', what: 'Every line at once, behind one upright front that crosses the block.' },
  { key: 'down', label: 'top to bottom', what: 'Down the block behind one level front, a line at a time.' },
];

export const SPLITS: { key: Split; what: string }[] = [
  { key: 'words', what: 'Each word lights up on its own: the classic word-by-word highlight.' },
  { key: 'chars', what: 'Each letter on its own. Keep the stagger small: with n letters it has to stay under 1 ÷ (n − 1).' },
  { key: 'lines', what: 'Each line as the layout wraps it, measured again when the window is resized.' },
];

export const EDGES: Edge[] = ['top', 'center', 'bottom'];

/** scrollProgress's and scrollText's own defaults, so the code leaves them out. */
const PROGRESS_DEFAULT = defaultsOf('scrollProgress');
const TEXT_DEFAULT = { start: TEXT_DEFAULTS.start, end: TEXT_DEFAULTS.end };

export const DARK = { bg: '#0b0b0c', full: '#f2f0eb', dim: '#64625d' };
export const LIGHT = { bg: '#ffffff', full: '#121110', dim: '#949089' };

export const INITIAL: Settings = {
  text: 'Words light up one after another as you read them, until the whole sentence is lit.',
  tag: 'p',
  engine: 'css',
  direction: 'reading',
  split: 'words',
  stagger: 0.05,
  ...DARK,
  dimOpacity: 0.4,
  start: { edge: 'top', at: 80 },
  end: { edge: 'bottom', at: 50 },
  once: false,
};

export const RANGE_PRESETS: { label: string; start: Point; end: Point }[] = [
  { label: 'Follow the reader', start: { edge: 'top', at: 80 }, end: { edge: 'bottom', at: 50 } },
  { label: 'Through the middle', start: { edge: 'top', at: 50 }, end: { edge: 'bottom', at: 50 } },
  { label: 'scrollText default', start: point(TEXT_DEFAULT.start), end: point(TEXT_DEFAULT.end) },
  { label: 'Whole screen', start: point(PROGRESS_DEFAULT.start), end: point(PROGRESS_DEFAULT.end) },
];

export const MAX_TEXT = 280;

// ── Text ─────────────────────────────────────────────────────────────────────

/** The text as one line, the way the code writes it: runs of whitespace become one space. */
export const clean = (t: string) => t.replace(/\s+/g, ' ').trim() || 'Your text';
/** For JSX children: braces and angle brackets would be read as code. */
const jsxText = (t: string) => clean(t).replace(/[<>{}]/g, '');

/** How many pieces scrollText will make, where the text alone says (lines need the layout). */
export function countPieces(text: string, split: Split): number | null {
  const t = clean(text);
  if (split === 'words') return t.split(/\s+/).filter(Boolean).length;
  // text/index.ts splitIntoChars: every character but a space is a piece.
  if (split === 'chars') return t.split('').filter((c) => c !== ' ').length;
  return null;
}

/** A stagger that runs the pieces one after another: each starts as the last one finishes. */
export function sequentialStagger(n: number): number {
  return n <= 1 ? 0 : Math.floor((1 / n) * 1000) / 1000;
}

/**
 * How many pieces are part way at any moment: each piece takes 1 − (n − 1) ×
 * stagger of the scroll (unitAlpha in text/index.ts) and the next starts
 * `stagger` later.
 */
export function overlap(n: number, stagger: number): number {
  if (n <= 1) return 1;
  if (stagger <= 0) return n;
  if (stagger >= maxStagger(n)) return 0;
  return (1 - (n - 1) * stagger) / stagger;
}

// ── The trigger, in the library's words and in CSS ───────────────────────────

const EDGE_PCT: Record<Edge, number> = { top: 0, center: 50, bottom: 100 };

/** The viewport word: a keyword where one means the same, a percentage otherwise. */
export const lineWord = (at: number) => (at === 0 ? 'top' : at === 50 ? 'center' : at === 100 ? 'bottom' : `${at}%`);
export const triggerText = (p: Point) => `${p.edge} ${lineWord(p.at)}`;

function point(trigger: string): Point {
  const r = readTrigger(trigger);
  return { edge: r.edge, at: Math.round(r.at * 100) };
}

const samePoint = (a: Point, b: Point) => a.edge === b.edge && a.at === b.at;
export const samePair = (s: Pick<Settings, 'start' | 'end'>, start: Point, end: Point) =>
  samePoint(s.start, start) && samePoint(s.end, end);

/** The trigger option, with only the parts that differ from the function's own default. */
function triggerLiteral(s: Settings, fn: 'scrollProgress' | 'scrollText'): string | null {
  const d = fn === 'scrollText' ? TEXT_DEFAULT : PROGRESS_DEFAULT;
  const parts: string[] = [];
  if (!samePoint(s.start, point(d.start))) parts.push(`start: '${triggerText(s.start)}'`);
  if (!samePoint(s.end, point(d.end))) parts.push(`end: '${triggerText(s.end)}'`);
  return parts.length ? `{ ${parts.join(', ')} }` : null;
}

export const vhLength = (q: number) => `${q}vh`;
const px = (n: number) => `${Math.round(n * 100) / 100}px`;
/** The same lengths in a box `height` px tall, for the preview: there, the box is the viewport. */
export const boxLength = (height: number) => (q: number) => px((q / 100) * height);

/**
 * The CSS timeline position of a trigger pair. On a view timeline,
 * entry-crossing 0% is the block's top on the viewport's bottom and 100% its
 * bottom there, whatever its height; from there the scroll still to go before
 * the edge reaches a line `at`% down is (100 − at)% of the viewport's height.
 * So 'center 85%' is entry-crossing calc(50% + 15vh).
 */
export function rangeEdge(p: Point, len: (q: number) => string = vhLength): string {
  const f = EDGE_PCT[p.edge];
  const q = 100 - p.at;
  if (f === 0 && q === 0) return 'cover 0%';
  if (f === 100 && q === 100) return 'cover 100%';
  if (q === 0) return `entry-crossing ${f}%`;
  if (f === 0) return `entry-crossing ${len(q)}`;
  return `entry-crossing calc(${f}% + ${len(q)})`;
}

/** Whether the range is the timeline's whole length, the default animation-range. */
const wholeRange = (s: Settings) => samePoint(s.start, { edge: 'top', at: 100 }) && samePoint(s.end, { edge: 'bottom', at: 0 });

export const rangeText = (s: Settings, len: (q: number) => string = vhLength) =>
  `${rangeEdge(s.start, len)} ${rangeEdge(s.end, len)}`;

/** The scroll position of a pair, for a block `top` px down the content and `height` tall, in a viewport `vp` tall. */
export function scrollAt(p: Point, top: number, height: number, vp: number): number {
  return top + (EDGE_PCT[p.edge] / 100) * height - (p.at / 100) * vp;
}

// ── Colour ───────────────────────────────────────────────────────────────────

const rgbOf = (hex: string): [number, number, number] => {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000';
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** WCAG 2 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `fg` at `opacity` over `bg`, as the browser composites it (in sRGB). */
export const over = (fg: string, bg: string, opacity: number) => {
  const f = rgbOf(fg);
  const b = rgbOf(bg);
  return toHex(f.map((v, i) => v * opacity + b[i] * (1 - opacity)));
};

/** The colour unfilled text shows: the dim colour, or for scrollText the text at its starting opacity. */
export const unfilledColour = (s: Settings) => (s.engine === 'text' ? over(s.full, s.bg, s.dimOpacity) : s.dim);

// ── CSS ──────────────────────────────────────────────────────────────────────

/** What carries the gradient: an inline span in reading order (its lines are one strip), else the block. */
const paintOf = (s: Settings) => (s.direction === 'reading' ? '.text-fill > span' : '.text-fill');
/** The fill variable the CSS reads: scrollProgress's own, or the one onProgress keeps for once. */
export const fillVar = (s: Settings) => (s.once ? '--text-fill' : '--scroll-progress');
const sizeOf = (d: Direction, v: string) => (d === 'down' ? `100% ${v}` : `${v} 100%`);

function paintLines(s: Settings, size: string, pad: string): string[] {
  return [
    `${pad}color: transparent;`,
    `${pad}background: linear-gradient(${s.full}, ${s.full}) 0 0 / ${size} no-repeat ${s.dim};`,
    `${pad}-webkit-background-clip: text;`,
    `${pad}background-clip: text;`,
  ];
}

function selectionRule(s: Settings, sel: string, pad: string): string[] {
  return [
    `${pad}/* Selected text stays readable: the background’s colour on the fill colour. */`,
    `${pad}${sel}::selection {`,
    `${pad}  color: ${s.bg};`,
    `${pad}  background: ${s.full};`,
    `${pad}}`,
  ];
}

type CssOpts = { scope?: string; len?: (q: number) => string; name?: string; timeline?: string };

/** The CSS-only fill. `scope`, `len` and the names let the preview run the same rules inside its own box. */
function cssOnly(s: Settings, { scope = '', len = vhLength, name = 'text-fill', timeline = '--text-fill' }: CssOpts): string {
  const block = `${scope}.text-fill`;
  const paint = scope + paintOf(s);
  const reading = s.direction === 'reading';
  const range = wholeRange(s) ? [] : [`    animation-range: ${rangeText(s, len)};`];
  return [
    `${block} {`,
    `  color: ${s.full};`,
    '}',
    '',
    '/* With scroll timelines it fills as it scrolls; without, it stays as above. */',
    '@supports (animation-timeline: view()) {',
    ...(reading ? [`  ${block} {`, `    view-timeline-name: ${timeline};`, '  }'] : []),
    `  ${paint} {`,
    ...paintLines(s, sizeOf(s.direction, '0%'), '    '),
    `    animation-name: ${name};`,
    '    animation-duration: auto;',
    '    animation-timing-function: linear;',
    '    animation-fill-mode: both;',
    // A span's own box is its lines; the block's timeline measures the block.
    `    animation-timeline: ${reading ? timeline : 'view()'};`,
    ...range,
    '  }',
    ...selectionRule(s, paint, '  '),
    '}',
    '',
    `@keyframes ${name} {`,
    '  to { background-size: 100% 100%; }',
    '}',
  ].join('\n');
}

function cssProgress(s: Settings, scope = ''): string {
  const paint = scope + paintOf(s);
  const v = fillVar(s);
  const who = s.once ? 'the onProgress callback in main.js' : 'scrollProgress (main.js)';
  return [
    `/* ${v} runs 0 to 1 on .text-fill, written by ${who}. */`,
    `${paint} {`,
    ...paintLines(s, sizeOf(s.direction, `calc(var(${v}, 0) * 100%)`), '  '),
    '}',
    ...selectionRule(s, paint, ''),
  ].join('\n');
}

function cssText(s: Settings, scope = ''): string {
  return [
    `/* scrollText sets each ${pieceWord(s.split)}’s opacity, from ${s.dimOpacity} up to 1, as it scrolls. */`,
    `${scope}.text-fill {`,
    `  color: ${s.full};`,
    '}',
  ].join('\n');
}

const pieceWord = (split: Split) => (split === 'chars' ? 'letter' : split === 'lines' ? 'line' : 'word');

/** The CSS for the visitor's page. */
export function fillCss(s: Settings): string {
  if (s.engine === 'css') return cssOnly(s, {});
  if (s.engine === 'progress') return cssProgress(s);
  return cssText(s);
}

/** The same rules for the preview: scoped to it, with the viewport lengths in px of its box. */
export function previewCss(s: Settings, scope: string, boxHeight: number): string {
  if (s.engine === 'css') {
    return cssOnly(s, { scope: `${scope} `, len: boxLength(boxHeight), name: 'tfl-fill', timeline: '--tfl-fill' });
  }
  if (s.engine === 'progress') return cssProgress(s, `${scope} `);
  return cssText(s, `${scope} `);
}

// ── Markup ───────────────────────────────────────────────────────────────────

/** One line, with no space around the text: scrollText would keep it as a piece of its own. */
export function markup(s: Settings): string {
  const t = escapeHtml(clean(s.text));
  const inner = s.engine !== 'text' && s.direction === 'reading' ? `<span>${t}</span>` : t;
  return `<${s.tag} class="text-fill">${inner}</${s.tag}>`;
}

// ── JavaScript ───────────────────────────────────────────────────────────────

function textOptions(s: Settings): string[] {
  const out: string[] = [];
  if (s.split !== TEXT_DEFAULTS.split) out.push(`split: '${s.split}'`);
  if (s.stagger !== TEXT_DEFAULTS.stagger) out.push(`stagger: ${s.stagger}`);
  // Always written: the default from is { opacity: 0, y: 24 }, a fade-up, and
  // a from without y leaves the pieces where they are.
  out.push(`from: { opacity: ${s.dimOpacity} }`);
  const trig = triggerLiteral(s, 'scrollText');
  if (trig) out.push(`trigger: ${trig}`);
  if (s.once !== TEXT_DEFAULTS.once) out.push(`once: ${s.once}`);
  return out;
}

const call = (fn: string, target: string, lines: string[], pad: string) =>
  lines.length ? `${fn}(${target}, {\n${lines.map((l) => `${pad}  ${l},`).join('\n')}\n${pad}});` : `${fn}(${target});`;

/** The loop that runs on every .text-fill on the page, without its import. */
function jsBody(s: Settings): string {
  if (s.engine === 'text') {
    return [
      'for (const el of document.querySelectorAll(\'.text-fill\')) {',
      `  ${call('scrollText', 'el', textOptions(s), '  ')}`,
      '}',
    ].join('\n');
  }
  const trig = triggerLiteral(s, 'scrollProgress');
  if (!s.once) {
    return [
      '// Writes --scroll-progress, 0 to 1, on each .text-fill as it scrolls by.',
      'for (const el of document.querySelectorAll(\'.text-fill\')) {',
      `  ${call('scrollProgress', 'el', trig ? [`trigger: ${trig}`] : [], '  ')}`,
      '}',
    ].join('\n');
  }
  return [
    '// once: --text-fill keeps the furthest point reached, so scrolling back leaves it filled.',
    'for (const el of document.querySelectorAll(\'.text-fill\')) {',
    '  let furthest = 0;',
    '  scrollProgress(el, {',
    ...(trig ? [`    trigger: ${trig},`] : []),
    '    onProgress: (raw) => {',
    '      furthest = Math.max(furthest, raw);',
    '      el.style.setProperty(\'--text-fill\', String(furthest));',
    '    },',
    '  });',
    '}',
  ].join('\n');
}

const apiOf = (s: Settings) =>
  s.engine === 'text' ? { fn: 'scrollText', entry: 'text' } : { fn: 'scrollProgress', entry: 'progress' };

export function jsCode(s: Settings): string {
  const { fn, entry } = apiOf(s);
  return `import { ${fn} } from 'svg-scroll-draw/${entry}';\n\n${jsBody(s)}`;
}

// ── React ────────────────────────────────────────────────────────────────────

/** TextFill.jsx. `cssImport` off for the StackBlitz project, whose main.jsx imports styles.css. */
export function reactComponent(s: Settings, cssImport = true): string {
  const css = cssImport ? ["import './text-fill.css';"] : [];
  const usage = `// <TextFill>${jsxText(s.text)}</TextFill>`;
  const T = s.tag;

  if (s.engine === 'css') {
    const inner = s.direction === 'reading' ? '<span>{children}</span>' : '{children}';
    return [
      ...css,
      ...(css.length ? [''] : []),
      '// No JavaScript: the CSS fills it on a scroll timeline.',
      usage,
      'export function TextFill({ children }) {',
      `  return <${T} className="text-fill">${inner}</${T}>;`,
      '}',
    ].join('\n');
  }

  if (s.engine === 'text') {
    const props = [
      ...(T !== 'p' ? [`as="${T}"`] : []),
      'className="text-fill"',
      ...textOptions(s).map((o) => {
        const [k, ...rest] = o.split(': ');
        const v = rest.join(': ');
        return v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`;
      }),
    ];
    return [
      "import { ScrollText } from 'svg-scroll-draw/react';",
      ...css,
      '',
      usage,
      'export function TextFill({ children }) {',
      '  return (',
      '    <ScrollText',
      ...props.map((p) => `      ${p}`),
      '    >',
      '      {children}',
      '    </ScrollText>',
      '  );',
      '}',
    ].join('\n');
  }

  const trig = triggerLiteral(s, 'scrollProgress');
  const options = s.once
    ? [
        '    let furthest = 0;',
        '    const fill = scrollProgress(el, {',
        ...(trig ? [`      trigger: ${trig},`] : []),
        '      onProgress: (raw) => {',
        '        furthest = Math.max(furthest, raw);',
        "        el.style.setProperty('--text-fill', String(furthest));",
        '      },',
        '    });',
      ]
    : trig
      ? ['    const fill = scrollProgress(el, {', `      trigger: ${trig},`, '    });']
      : ['    const fill = scrollProgress(el);'];
  const inner = s.direction === 'reading' ? '<span>{children}</span>' : '{children}';
  return [
    "'use client';",
    '',
    "import { useEffect, useRef } from 'react';",
    "import { scrollProgress } from 'svg-scroll-draw/progress';",
    ...css,
    '',
    usage,
    'export function TextFill({ children }) {',
    '  const ref = useRef(null);',
    '  useEffect(() => {',
    '    const el = ref.current;',
    ...options,
    '    return () => fill.destroy();',
    '  }, []);',
    `  return <${T} ref={ref} className="text-fill">${inner}</${T}>;`,
    '}',
  ].join('\n');
}

// ── Code tabs ────────────────────────────────────────────────────────────────

export function tabsOf(engine: Engine): CodeTab[] {
  return engine === 'css' ? ['css', 'html', 'react'] : ['css', 'html', 'js', 'react'];
}

export const TAB_LABEL: Record<CodeTab, string> = { css: 'CSS', html: 'HTML', js: 'JavaScript', react: 'React' };
export const FILE_OF: Record<CodeTab, string> = {
  css: 'text-fill.css', html: 'index.html', js: 'main.js', react: 'TextFill.jsx',
};

/** One tab's listing, with the source line on top. */
export function codeFor(s: Settings, tab: CodeTab): string {
  if (tab === 'css') return withSource(fillCss(s), SLUG, 'css');
  if (tab === 'html') return withSource(markup(s), SLUG, 'html');
  if (tab === 'js') return withSource(jsCode(s), SLUG, 'js');
  return withSource(reactComponent(s), SLUG, 'jsx');
}

// ── Runnable files ───────────────────────────────────────────────────────────

/** A page to run it on: a screen of room above and below, so the text scrolls through. */
function pageCss(s: Settings): string {
  const type = s.tag === 'h2'
    ? '  font-size: clamp(2rem, 6vw, 3.25rem);\n  font-weight: 600;\n  line-height: 1.1;'
    : '  font-size: clamp(1.5rem, 4vw, 2.25rem);\n  line-height: 1.35;';
  return [
    `body {\n  margin: 0;\n  background: ${s.bg};\n  color: ${s.full};\n  font-family: system-ui, sans-serif;\n}`,
    'main {\n  max-width: 42rem;\n  margin: 0 auto;\n  padding: 0 1.5rem;\n}',
    '.hint, .after {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n  margin: 0;\n  font-size: 0.875rem;\n  opacity: 0.6;\n}',
    `.text-fill {\n  margin: 0;\n${type}\n}`,
  ].join('\n\n');
}

export function runnableHtml(s: Settings, version: string): string {
  const { fn, entry } = apiOf(s);
  return htmlFile({
    slug: SLUG,
    title: TITLE,
    css: `${pageCss(s)}\n\n${fillCss(s)}`,
    body: ['<main>', '  <p class="hint">Scroll down ↓</p>', `  ${markup(s)}`, '  <p class="after">The end.</p>', '</main>'].join('\n'),
    script: s.engine === 'css' ? undefined : `import { ${fn} } from '${cdnModule(version, entry)}';\n\n${jsBody(s)}`,
  });
}

export function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const app = [
    reactComponent(s, false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <p className="hint">Scroll down ↓</p>',
    `      <TextFill>${jsxText(s.text)}</TextFill>`,
    '      <p className="after">The end.</p>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
  return { slug: SLUG, app, css: `${pageCss(s)}\n\n${fillCss(s)}\n`, version };
}
