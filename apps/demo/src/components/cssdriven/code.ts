import {
  CSS_TIMING, LIB, presetOf,
  type ClipFrom, type EasingKey, type PresetKey, type Prop, type RangeEdge,
} from '@/data/cssdriven';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * Everything the CSS scroll-driven animation generator writes, from one
 * settings object: the CSS, its preview copy, the svg-scroll-draw equivalent
 * (JavaScript and React), whether the library would compile that equivalent
 * to the very same CSS, and the files that run it outside the site. Pure
 * functions, so the preview, the code and the verdict cannot disagree.
 *
 * - cssCode, fallbackCode, jsCode, reactCode: the code tabs, each with the
 *   source line.
 * - runnable: for the tab on show, a complete page (the CSS tab's CSS, with
 *   fallback.js when it is on; or the JavaScript tab's call, the library from
 *   jsDelivr) and, for the JavaScript and React tabs, the component as a
 *   React project.
 */

export const SLUG = 'css-scroll-driven-animation-generator';

/**
 * Where a listing is going. On the site its imports name the package and its
 * comments the tabs beside it; in a downloaded page the imports come from
 * jsDelivr, and in the StackBlitz project from npm, with comments that make
 * sense without the site.
 */
type Where = { from: (entry: string) => string; css: string };
const npm = (entry: string) => (entry ? `svg-scroll-draw/${entry}` : 'svg-scroll-draw');
const SITE: Where = { from: npm, css: 'the CSS tab' };
const PROJECT: Where = { from: npm, css: 'the generator’s CSS' };
const cdn = (version: string): Where => ({ from: (entry) => cdnModule(version, entry), css: 'the generator’s CSS' });

export type Settings = {
  preset: PresetKey;
  amount: number;
  clip: ClipFrom;
  easing: EasingKey;
  start: RangeEdge;
  end: RangeEdge;
  dir: 'in' | 'out';
  fallback: 'none' | 'library';
};

// ── What the settings mean ───────────────────────────────────────────────────

export const kindOf = (s: Settings) => presetOf(s.preset).kind;
/** A progress bar is linear: it should say exactly how far down the page you are. */
export const easingOf = (s: Settings): EasingKey => (kindOf(s) === 'scroll' ? 'linear' : s.easing);

/** The animated properties, start and end swapped when it plays out. */
export function propsOf(s: Settings): Prop[] {
  const preset = presetOf(s.preset);
  const props = preset.props(preset.amount ? s.amount : 0, s.clip);
  return s.dir === 'out' && preset.kind !== 'scroll' ? props.map((p) => ({ prop: p.prop, from: p.to, to: p.from })) : props;
}

const keyframesName = (s: Settings) => `${s.preset}${s.dir === 'out' && kindOf(s) !== 'scroll' ? '-reverse' : ''}`;
const selectorOf = (s: Settings) => (kindOf(s) === 'scroll' ? '.progress' : '.reveal');
export const rangeText = (s: Settings) => `${s.start.name} ${s.start.pct}% ${s.end.name} ${s.end.pct}%`;
const isDefaultRange = (s: Settings) =>
  s.start.name === 'cover' && s.start.pct === 0 && s.end.name === 'cover' && s.end.pct === 100;

// ── Range → scroll position ──────────────────────────────────────────────────

/**
 * Where a range edge falls on its scroller's scroll, for an element whose top
 * is `t` into the scroll content, `h` tall, in a scroller `H` tall: the
 * definitions of the CSS Scroll-driven Animations spec, contain's flip for a
 * taller element included. The preview's track draws these; checked against
 * the browser's own view-timeline progress in Chromium, Firefox and WebKit,
 * to the pixel, for elements shorter and taller than the scroller.
 */
export function rangeScroll(edge: RangeEdge, t: number, h: number, H: number): number {
  const p = edge.pct / 100;
  const cover0 = t - H;
  const cover1 = t + h;
  const contain0 = h <= H ? t + h - H : t;
  const contain1 = h <= H ? t : t + h - H;
  switch (edge.name) {
    case 'cover': return cover0 + p * (cover1 - cover0);
    case 'contain': return contain0 + p * (contain1 - contain0);
    case 'entry': return cover0 + p * (contain0 - cover0);
    case 'exit': return contain1 + p * (cover1 - contain1);
  }
}

// ── Range → svg-scroll-draw trigger ──────────────────────────────────────────

const ELEMENT = ['top', 'center', 'bottom'];
const VIEWPORT = ['top', 'center', 'bottom'];

/**
 * The trigger edge marking the same moment as a range edge. The library's
 * trigger names an element edge (top, center, bottom) and a viewport edge
 * (core/trigger.ts), so 0%, 50% and 100% of each range map exactly; any other
 * percentage takes the nearest of those. For an element shorter than the
 * viewport (contain flips for a taller one):
 *   cover p   → element p,     viewport 1 − p
 *   entry p   → element p,     viewport bottom
 *   exit p    → element p,     viewport top
 *   contain p → element 1 − p, viewport 1 − p
 */
export function triggerEdge(edge: RangeEdge): { value: string; exact: boolean; nearest: number } {
  const nearest = Math.round(edge.pct / 50) * 50;
  const i = nearest / 50; // 0, 1, 2
  let el = i;
  let vp = 2;
  if (edge.name === 'cover') vp = 2 - i;
  else if (edge.name === 'exit') vp = 0;
  else if (edge.name === 'contain') { el = 2 - i; vp = 2 - i; }
  return { value: `${ELEMENT[el]} ${VIEWPORT[vp]}`, exact: nearest === edge.pct, nearest };
}

/** The trigger to write (defaults left out), and a note for every edge that is not exact. */
export function triggerOf(s: Settings): { start?: string; end?: string; notes: string[]; tallCaveat: boolean } {
  if (kindOf(s) === 'scroll') return { start: 'top top', end: 'bottom bottom', notes: [], tallCaveat: false };
  const a = triggerEdge(s.start);
  const b = triggerEdge(s.end);
  const notes: string[] = [];
  for (const [edge, t] of [[s.start, a], [s.end, b]] as const) {
    if (!t.exact) notes.push(`${edge.name} ${edge.pct}% has no exact trigger edge; '${t.value}' is ${edge.name} ${t.nearest}%.`);
  }
  // Only cover, entry 0% and exit 100% are the same for an element of any height.
  const free = (e: RangeEdge) => e.name === 'cover' || (e.name === 'entry' && e.pct === 0) || (e.name === 'exit' && e.pct === 100);
  return {
    start: a.value === LIB.start ? undefined : a.value,
    end: b.value === LIB.end ? undefined : b.value,
    notes,
    tallCaveat: !free(s.start) || !free(s.end),
  };
}

/**
 * Would svg-scroll-draw run this on its native CSS path? Mirrors the checks
 * that decide it: nativeEligible() in animate/engine.ts for scrollAnimate,
 * clip mode in core/engine.ts for scrollDraw, and scrollProgress, which has
 * no native path at all.
 */
export function nativeVerdict(s: Settings): { native: boolean; why: string } {
  const kind = kindOf(s);
  if (kind === 'scroll') {
    return { native: false, why: 'scrollProgress has no CSS path: it writes --scroll-progress on every frame, in every browser.' };
  }
  if (kind === 'clip') {
    return { native: false, why: 'scrollDraw’s clip reveal always runs on its JS engine: clip mode has no CSS path.' };
  }
  if (!isDefaultRange(s)) {
    return {
      native: false,
      why: `Only the default window, cover 0% to cover 100% (trigger 'top bottom' to 'bottom top'), compiles to CSS. ${rangeText(s)} runs on scrollAnimate’s JS engine in every browser, ${stretchOf(s)}.`,
    };
  }
  return {
    native: true,
    why: 'Default window, an easing CSS can express, and properties CSS can animate: in a browser that supports animation-timeline: view(), scrollAnimate writes this same @keyframes and animation-range itself, and runs its JS engine everywhere else.',
  };
}

/** Whether the library's trigger can name this range exactly, in words. */
function stretchOf(s: Settings): string {
  return triggerOf(s).notes.length ? 'over the nearest stretch its trigger edges can name' : 'over the same stretch of scroll';
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const decl = (p: Prop, side: 'from' | 'to') => `${p.prop}: ${p[side]};`;

function keyframes(name: string, props: Prop[]): string {
  return [
    `@keyframes ${name} {`,
    `  from { ${props.map((p) => decl(p, 'from')).join(' ')} }`,
    `  to   { ${props.map((p) => decl(p, 'to')).join(' ')} }`,
    '}',
  ].join('\n');
}

const EASE_NOTE: Record<EasingKey, string> = {
  linear: '',
  'ease-in': ' /* ease-in: t² */',
  'ease-out': ' /* ease-out: t(2 − t) */',
  'ease-in-out': ' /* ease-in-out, piecewise t² */',
};

function timingLines(easing: EasingKey, pad: string): string[] {
  if (easing !== 'ease-in-out') return [`${pad}animation-timing-function: ${CSS_TIMING[easing]};${EASE_NOTE[easing]}`];
  const stops = CSS_TIMING[easing].slice('linear('.length, -1).split(', ');
  const rows: string[] = [];
  for (let i = 0; i < stops.length; i += 8) rows.push(`${pad}  ${stops.slice(i, i + 8).join(', ')}${i + 8 < stops.length ? ',' : ''}`);
  return [`${pad}animation-timing-function: linear(${EASE_NOTE[easing]}`, ...rows, `${pad});`];
}

/** The animation declarations, in the order svg-scroll-draw's native path writes them. */
function animationRule(s: Settings, selector: string, name: string, scroller: 'root' | 'nearest', pad: string): string {
  const scroll = kindOf(s) === 'scroll';
  return [
    `${pad}${selector} {`,
    `${pad}  animation-name: ${name};`,
    `${pad}  animation-duration: auto;`,
    ...timingLines(easingOf(s), `${pad}  `),
    `${pad}  animation-fill-mode: both;`,
    scroll ? `${pad}  animation-timeline: scroll(${scroller});` : `${pad}  animation-timeline: view();`,
    ...(scroll ? [] : [`${pad}  animation-range: ${rangeText(s)};`]),
    `${pad}}`,
  ].join('\n');
}

const indent = (text: string, pad: string) => text.split('\n').map((l) => pad + l).join('\n');

/**
 * The CSS the preview runs: the same keyframes and rule as the code, scoped to
 * one preview, with the bar reading its own box (scroll(nearest)) instead of
 * the page.
 */
export function previewCss(s: Settings, scope: string, name: string): string {
  const scroll = kindOf(s) === 'scroll';
  const sel = `${scope} ${scroll ? '.cssd-bar' : '.cssd-subj'}`;
  const rule = animationRule(s, sel, name, 'nearest', '');
  const gated = scroll
    ? `@supports (animation-timeline: scroll()) {\n${indent(rule, '  ')}\n}`
    : `@supports (animation-timeline: view()) {\n  @media (prefers-reduced-motion: no-preference) {\n${indent(rule, '    ')}\n  }\n}`;
  return `${keyframes(name, propsOf(s))}\n${gated}`;
}

/** The bar's own rule, for the CSS tab and for the pages that run scrollProgress. */
function barRule(hidden: string): string[] {
  return [
    '/* A reading-progress bar. Markup: <div class="progress"></div> */',
    '.progress {',
    '  position: fixed;',
    '  inset: 0 0 auto;',
    '  z-index: 10;',
    '  height: 4px;',
    '  background: currentColor;',
    '  transform-origin: 0 50%;',
    `  /* ${hidden} */`,
    '  transform: scaleX(var(--scroll-progress, 0));',
    '}',
  ];
}

/** The CSS tab. */
export function cssCode(s: Settings): string {
  return withSource(cssBody(s), SLUG, 'css');
}

function cssBody(s: Settings): string {
  const preset = presetOf(s.preset);
  const name = keyframesName(s);
  const kf = keyframes(name, propsOf(s));
  const lib = s.fallback === 'library';
  if (preset.kind === 'scroll') {
    return [
      ...barRule(`Hidden until something drives it: the animation below${lib ? ', or fallback.js' : ''}.`),
      '',
      kf,
      '',
      '/* scroll(root) is the page’s own scroll, from the top to the bottom. */',
      '@supports (animation-timeline: scroll()) {',
      animationRule(s, '.progress', name, 'root', '  '),
      '}',
    ].join('\n');
  }
  return [
    `/* ${preset.label}${s.dir === 'out' ? ', reversed' : ''}, tied to the scroll. Markup: <div class="reveal">…</div> */`,
    kf,
    '',
    '/* Only where the browser has scroll timelines, and only for readers who have',
    `   not asked for less motion; everywhere else the element is simply shown.${lib ? '\n   A browser without scroll timelines runs fallback.js instead.' : ''} */`,
    '@supports (animation-timeline: view()) {',
    '  @media (prefers-reduced-motion: no-preference) {',
    animationRule(s, selectorOf(s), name, 'root', '    '),
    '  }',
    '}',
  ].join('\n');
}

// ── svg-scroll-draw: the options, then the code ──────────────────────────────

const q = (v: string | number) => (typeof v === 'number' ? String(v) : `'${v}'`);
const camel = (prop: string) => prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** The options the library call takes, defaults left out, as [key, code] pairs. */
function optionLines(s: Settings): [string, string][] {
  const kind = kindOf(s);
  const t = triggerOf(s);
  const trig = [t.start && `start: '${t.start}'`, t.end && `end: '${t.end}'`].filter(Boolean).join(', ');
  const lines: [string, string][] = [];
  if (kind === 'clip') lines.push(['clip', `'${s.clip}'`]);
  if (trig) lines.push(['trigger', `{ ${trig} }`]);
  if (kind === 'clip' && s.dir === 'out') lines.push(['direction', `'reverse'`]);
  if (kind !== 'scroll') {
    const def = kind === 'clip' ? LIB.drawEasing : LIB.animateEasing;
    if (s.easing !== def) lines.push(['easing', `'${s.easing}'`]);
  }
  return lines;
}

function propsEntries(s: Settings): string[] {
  return propsOf(s).map((p) => `${camel(p.prop)}: [${q(p.from)}, ${q(p.to)}]`);
}

function notesOf(s: Settings, pad: string, w: Where): string[] {
  const t = triggerOf(s);
  const out = t.notes.map((n) => `${pad}// ${n}`);
  if (t.tallCaveat) out.push(`${pad}// These edges match animation-range for an element shorter than the viewport.`);
  // Under reduced motion scrollAnimate applies the "to" values at once; the CSS
  // is simply off. For a fade that plays out, those differ.
  if (kindOf(s) === 'view' && s.dir === 'out') {
    out.push(`${pad}// Under reduced motion scrollAnimate sets the end values at once, so this`);
    out.push(`${pad}// element stays hidden; ${w.css} leaves it as written.`);
  }
  return out;
}

function verdictLines(s: Settings, w: Where): string[] {
  const v = nativeVerdict(s);
  const kind = kindOf(s);
  if (v.native) {
    return [
      '// The default window and an easing CSS can express: where the browser supports',
      '// animation-timeline: view(), scrollAnimate writes the same keyframes and range as',
      `// ${w.css} itself, and runs its JS engine everywhere else.`,
    ];
  }
  if (kind === 'clip') return ['// scrollDraw’s clip reveal runs on its JS engine in every browser.'];
  if (kind === 'scroll') return ['// scrollProgress runs on JS in every browser, writing --scroll-progress each frame.'];
  return [
    '// Not the default window (cover 0% → cover 100%), so this runs on scrollAnimate’s',
    `// JS engine in every browser, ${stretchOf(s)}.`,
  ];
}

/** The call for one element, as lines indented by `pad`. */
function callLines(s: Settings, el: string, pad: string): string[] {
  const kind = kindOf(s);
  const opts = optionLines(s);
  if (kind === 'scroll') {
    return [
      `${pad}scrollProgress(document.documentElement, {`,
      ...opts.map(([k, v]) => `${pad}  ${k}: ${v},`),
      `${pad}});`,
    ];
  }
  if (kind === 'clip') {
    return [`${pad}scrollDraw(${el}, {`, ...opts.map(([k, v]) => `${pad}  ${k}: ${v},`), `${pad}});`];
  }
  return [
    `${pad}scrollAnimate(${el}, {`,
    `${pad}  props: {`,
    ...propsEntries(s).map((e) => `${pad}    ${e},`),
    `${pad}  },`,
    ...opts.map(([k, v]) => `${pad}  ${k}: ${v},`),
    `${pad}});`,
  ];
}

/** The library's entry the code imports from: '' is the main one. */
const entryOf = (s: Settings) => (kindOf(s) === 'scroll' ? 'progress' : '');

function importLine(s: Settings, w: Where): string {
  const kind = kindOf(s);
  const api = kind === 'scroll' ? 'scrollProgress' : kind === 'clip' ? 'scrollDraw' : 'scrollAnimate';
  return `import { ${api} } from '${w.from(entryOf(s))}';`;
}

/** The import, the comments and the calls: the JavaScript tab under its markup line, and the page's script. */
function jsBody(s: Settings, w: Where): string {
  if (kindOf(s) === 'scroll') {
    return [
      importLine(s, w),
      '',
      '// Writes the page’s scroll progress, 0 to 1, to --scroll-progress on <html>',
      '// on every frame, in every browser; the bar reads it.',
      ...callLines(s, '', ''),
    ].join('\n');
  }
  return [
    importLine(s, w),
    '',
    ...verdictLines(s, w),
    ...notesOf(s, '', w),
    "document.querySelectorAll('.reveal').forEach((el) => {",
    ...callLines(s, 'el', '  '),
    '});',
  ].join('\n');
}

/** The JavaScript tab. */
export function jsCode(s: Settings): string {
  const markup = kindOf(s) === 'scroll'
    ? '// <div class="progress"></div>, styled by the first rule in the CSS tab.'
    : '// <div class="reveal">…</div>, as many as you like. No CSS needed.';
  return withSource(`${markup}\n${jsBody(s, SITE)}`, SLUG, 'js');
}

/** fallback.js: the library only where the CSS cannot run. */
function fallbackBody(s: Settings, w: Where): string {
  const scroll = kindOf(s) === 'scroll';
  const test = scroll ? 'scroll()' : 'view()';
  const body = scroll
    ? callLines(s, '', '  ')
    : ["  document.querySelectorAll('.reveal').forEach((el) => {", ...callLines(s, 'el', '    '), '  });'];
  return [
    importLine(s, w),
    '',
    '// Only where CSS has no scroll timelines: the same animation on',
    `// svg-scroll-draw’s JS engine, ${scroll ? 'over the same stretch of scroll' : stretchOf(s)}.`,
    ...notesOf(s, '', w),
    `if (!CSS.supports('animation-timeline: ${test}')) {`,
    ...body,
    '}',
  ].join('\n');
}

/** The CSS tab's fallback.js. */
export function fallbackCode(s: Settings): string {
  return withSource(fallbackBody(s, SITE), SLUG, 'js');
}

/** The component: TypeScript for the React tab, plain JSX for the StackBlitz project. */
function reactComponent(s: Settings, ts: boolean, w: Where): string {
  const kind = kindOf(s);
  if (kind === 'scroll') {
    return [
      ...(ts ? ["'use client';", ''] : []),
      "import { useEffect } from 'react';",
      importLine(s, w),
      '',
      ts ? '// Style .progress with the first rule in the CSS tab.' : '// .progress is styled in styles.css.',
      'export function ReadingProgress() {',
      '  useEffect(() => {',
      ...callLines(s, '', '    ').map((l, i) => (i === 0 ? l.replace('scrollProgress(', 'const progress = scrollProgress(') : l)),
      '    return () => progress.destroy();',
      '  }, []);',
      '  return <div className="progress" />;',
      '}',
    ].join('\n');
  }
  const tag = kind === 'clip' ? 'ScrollDraw' : 'ScrollAnimate';
  const attrs = optionLines(s).map(([k, v]) => (v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`));
  const props = propsEntries(s);
  const propsAttr = kind === 'clip'
    ? []
    : props.join(', ').length <= 60
      ? [`props={{ ${props.join(', ')} }}`]
      : ['props={{', ...props.map((p) => `  ${p},`), '}}'];
  return [
    ...(ts ? ["import type { ReactNode } from 'react';"] : []),
    `import { ${tag} } from '${w.from('react')}';`,
    '',
    ...verdictLines(s, w),
    ...notesOf(s, '', w),
    `export function Reveal(${ts ? '{ children }: { children: ReactNode }' : '{ children }'}) {`,
    '  return (',
    `    <${tag}`,
    ...[...propsAttr, ...attrs].map((a) => `      ${a}`),
    '    >',
    '      {children}',
    `    </${tag}>`,
    '  );',
    '}',
  ].join('\n');
}

/** The React tab. */
export function reactCode(s: Settings): string {
  return withSource(reactComponent(s, true, SITE), SLUG, 'tsx');
}

// ── Runnable files ───────────────────────────────────────────────────────────

/** Cards on the page and in the App, each shorter than a phone's screen. */
const PAGE_CARDS = 6;
/** Paragraphs of the article the progress bar measures. */
const PARAGRAPHS = 18;
const PARAGRAPH = 'The bar along the top of the window is this page’s scroll position: empty at the top, full at the bottom. Scroll back up and it empties again.';

/**
 * The page around the effect: a screen of room above the cards, so each one
 * starts below the fold, and a screen below, so the last can leave at the top.
 * The cards' row spans the window and clips sideways at its edges, so a card
 * sliding in from the right never widens the page (overflow: clip, unlike
 * hidden, is not a scroll container, so view() still follows the page).
 */
const PAGE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
.spacer {
  display: grid;
  place-content: center;
  gap: 8px;
  min-height: 100vh;
  margin: 0;
  padding: 24px;
  color: #6b6b70;
  text-align: center;
}
.spacer p { margin: 0; }
.cards {
  display: grid;
  gap: 48px;
  padding: 0 max(16px, calc(50% - 264px));
  overflow-x: clip;
}
.card {
  min-height: 180px;
  padding: 24px;
  background: #16161a;
  color: #f4f4f1;
  font-weight: 600;
}`;

const ARTICLE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 18px/1.6 Georgia, 'Times New Roman', serif;
  color: #16161a;
  background: #f4f4f1;
}
.article {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 16px 50vh;
}
.article p { margin: 0 0 1.4em; }`;

/** A line for readers whose browser or settings leave the CSS off, shown only to them. */
const NOTE_CSS = `.note { display: none; max-width: 36em; font-size: 14px; color: #8a3b12; }`;

function pageCss(s: Settings): string {
  return kindOf(s) === 'scroll' ? ARTICLE_CSS : PAGE_CSS;
}

function cardsBody(notes: string[]): string {
  const cards = Array.from({ length: PAGE_CARDS }, (_, i) => `  <div class="card reveal">Card ${i + 1}</div>`);
  return [
    '<div class="spacer">',
    '  <p>Scroll down</p>',
    ...notes.map((n) => `  ${n}`),
    '</div>',
    '',
    '<main class="cards">',
    ...cards,
    '</main>',
    '',
    '<div class="spacer"><p>The end of the page</p></div>',
  ].join('\n');
}

function articleBody(notes: string[]): string {
  const paras = Array.from({ length: PARAGRAPHS }, (_, i) => `  <p>${i + 1}. ${escapeHtml(PARAGRAPH)}</p>`);
  return [
    '<div class="progress"></div>',
    '',
    '<article class="article">',
    '  <h1>Reading progress</h1>',
    ...notes.map((n) => `  ${n}`),
    ...paras,
    '</article>',
  ].join('\n');
}

/**
 * The CSS tab as a page: its stylesheet, with fallback.js inline when the
 * fallback is on. Readers for whom the CSS is off are told so on the page,
 * so a still card does not look like a broken file.
 */
function cssPage(s: Settings, title: string, version: string): string {
  const scroll = kindOf(s) === 'scroll';
  const lib = s.fallback === 'library';
  const test = scroll ? 'scroll()' : 'view()';
  const unsupported = `<p class="note no-timeline">This browser has no CSS scroll timelines, so ${
    lib ? 'the script at the end of the page runs the same animation on svg-scroll-draw.'
      : scroll ? 'the CSS is skipped and the bar stays empty.' : 'the CSS is skipped and the cards show as written.'
  }</p>`;
  // The bar is not gated on reduced motion: it only moves as the reader scrolls.
  const reduced = '<p class="note reduced">Your system asks for reduced motion, so the CSS is off and the cards show as written.</p>';
  const notes = scroll ? [unsupported] : [unsupported, reduced];
  const noteCss = [
    NOTE_CSS,
    `@supports not (animation-timeline: ${test}) {\n  .no-timeline { display: block; }\n}`,
    ...(scroll ? [] : [`@supports (animation-timeline: ${test}) {\n  @media (prefers-reduced-motion: reduce) {\n    .reduced { display: block; }\n  }\n}`]),
  ].join('\n');
  return htmlFile({
    slug: SLUG,
    title,
    css: `${pageCss(s)}\n${noteCss}\n\n${cssBody(s)}`,
    body: scroll ? articleBody(notes) : cardsBody(notes),
    script: lib ? fallbackBody(s, cdn(version)) : undefined,
  });
}

/** The JavaScript tab as a page: its call, the library from jsDelivr, in every browser. */
function jsPage(s: Settings, title: string, version: string): string {
  const scroll = kindOf(s) === 'scroll';
  return htmlFile({
    slug: SLUG,
    title,
    css: scroll ? `${pageCss(s)}\n\n${barRule('Hidden until scrollProgress drives it.').join('\n')}` : pageCss(s),
    body: scroll ? articleBody([]) : cardsBody([]),
    script: jsBody(s, cdn(version)),
  });
}

/** The React tab as a Vite project: the component in plain JSX, and a page to scroll it in. */
function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const scroll = kindOf(s) === 'scroll';
  const app = scroll
    ? `${reactComponent(s, false, PROJECT)}

const PARAGRAPHS = Array.from({ length: ${PARAGRAPHS} }, (_, i) => i + 1);

export default function App() {
  return (
    <>
      <ReadingProgress />
      <article className="article">
        <h1>Reading progress</h1>
        {PARAGRAPHS.map((n) => (
          <p key={n}>{n}. ${PARAGRAPH}</p>
        ))}
      </article>
    </>
  );
}
`
    : `${reactComponent(s, false, PROJECT)}

const CARDS = Array.from({ length: ${PAGE_CARDS} }, (_, i) => i + 1);

export default function App() {
  return (
    <>
      <div className="spacer"><p>Scroll down</p></div>
      <main className="cards">
        {CARDS.map((n) => (
          <Reveal key={n}>
            <div className="card">Card {n}</div>
          </Reveal>
        ))}
      </main>
      <div className="spacer"><p>The end of the page</p></div>
    </>
  );
}
`;
  const css = scroll ? `${pageCss(s)}\n\n${barRule('Hidden until scrollProgress drives it.').join('\n')}\n` : `${pageCss(s)}\n`;
  return { slug: SLUG, app, css, version };
}

/**
 * What the export row under the code runs, for the tab on show: the CSS tab
 * gives a page of CSS (and fallback.js when it is on); the JavaScript and React
 * tabs a page running the library, and the React component as a project.
 */
export function runnable(s: Settings, tab: 'css' | 'js' | 'react', version: string): {
  title: string;
  filename: string;
  html: string;
  react?: Omit<ReactProject, 'title'>;
} {
  // "Progress bar · scroll()" names the timeline for the preset menu; a title needs only the effect.
  const label = presetOf(s.preset).label.split(' · ')[0];
  if (tab === 'css') {
    const title = `${label}: CSS scroll-driven animation`;
    return { title, filename: `${s.preset}-css.html`, html: cssPage(s, title, version) };
  }
  const title = `${label}: svg-scroll-draw`;
  return { title, filename: `${s.preset}-svg-scroll-draw.html`, html: jsPage(s, title, version), react: reactProject(s, version) };
}

// ── The preview's library call ───────────────────────────────────────────────

/** The same options as the code, as values, for the preview to run. */
export function libOptions(s: Settings): {
  props: Record<string, [string | number, string | number]>;
  trigger: { start?: string; end?: string };
  easing: EasingKey;
  clip: ClipFrom;
  direction: 'forward' | 'reverse';
} {
  const t = triggerOf(s);
  const trigger: { start?: string; end?: string } = {};
  if (t.start) trigger.start = t.start;
  if (t.end) trigger.end = t.end;
  return {
    props: Object.fromEntries(propsOf(s).map((p) => [camel(p.prop), [p.from, p.to]])),
    trigger,
    easing: easingOf(s),
    clip: s.clip,
    direction: s.dir === 'out' ? 'reverse' : 'forward',
  };
}
