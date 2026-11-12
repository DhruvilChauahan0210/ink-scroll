import { cdnModule, escapeHtml, htmlFile, withSource, type CodeLang } from '@/lib/tool-export';
import { SOLVER_JS, bezierRange, cssOf, fmt, isLinear, sameBezier, type Bezier } from './bezier';
import { LIB_PRESETS, PRESETS, type Preset } from './presets';

/**
 * The code the cubic-bezier generator writes. Pure, so the node tests run it:
 *
 * - css: the cubic-bezier() as a custom property, with a transition and a
 *   keyframe animation that use it.
 * - draw: scrollDraw with the curve as its `easing` function.
 * - animate: scrollAnimate the same way.
 * - bezierHtml: a complete page for Run it (download, StackBlitz): the CSS
 *   tab's card and badge, then the curve, and the one it is compared with, on
 *   a scrollDraw line and a scrollAnimate dot over real page scroll, the
 *   library loaded from jsDelivr.
 *
 * Every tab starts with the source line (codeFor). Only options that differ
 * from the library's defaults are written: scrollDraw eases 'linear' unless
 * told otherwise (core/engine.ts:186), scrollAnimate 'ease-out'
 * (animate/engine.ts:190). A curve that is one of the library's own
 * quadratics is written as its name, which keeps the native fast path open
 * (cssTimingFor, core/css-easing.ts); any function easing runs on the
 * JavaScript engine (nativeEligible() in core/engine.ts and
 * animate/engine.ts returns false without a cssTiming).
 */

export const SLUG = 'cubic-bezier-generator';
/** The Run it project's title. */
export const TITLE = 'Cubic-bezier easing';
export const FILENAME = 'cubic-bezier.html';

export const TABS = [
  { k: 'css', label: 'CSS', file: 'easing.css' },
  { k: 'draw', label: 'scrollDraw', file: 'main.js' },
  { k: 'animate', label: 'scrollAnimate', file: 'motion.js' },
] as const;
export type Tab = (typeof TABS)[number]['k'];
const TAB_LANG: Record<Tab, CodeLang> = { css: 'css', draw: 'js', animate: 'js' };

/** The line the preview draws, and the page Run it writes, in a 320 × 60 box. */
export const WAVE = 'M14 46 C 44 46, 52 12, 86 12 S 128 46, 160 46 S 202 12, 236 12 S 278 46, 306 46';

/** The preset these numbers are, if any: CSS keywords first, then the library's, then the named curves. */
export function matchPreset(v: Bezier): Preset | undefined {
  return PRESETS.find((p) => sameBezier(p.v, v));
}

/** The library's own named easing these numbers are, if they are one. */
const libName = (v: Bezier) => LIB_PRESETS.find((p) => sameBezier(p.v, v))?.name;

/** Words as a comment, wrapped to `width` columns. */
function comment(text: string, open: string, mid: string, close: string, width = 76): string {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width - open.length) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  lines.push(line);
  return `${open}${lines.join(`\n${mid}`)}${close}`;
}
const cssComment = (text: string) => comment(text, '/* ', '   ', ' */');
const jsComment = (text: string) => comment(text, '// ', '// ', '');

/** What the curve does past 0 and 1, in a sentence, or ''. */
function overshootWords(v: Bezier): string {
  const r = bezierRange(v);
  const parts: string[] = [];
  if (r.min < -0.0005) parts.push(`pulls back to ${fmt(Math.round(r.min * 1000) / 1000)} first`);
  if (r.max > 1.0005) parts.push(`runs past the end to ${fmt(Math.round(r.max * 1000) / 1000)} and comes back`);
  return parts.length ? `It ${parts.join(' and ')}.` : '';
}

/** A name for the curve in the comment line: the preset it is, or its numbers. */
function titleOf(v: Bezier): string {
  const p = matchPreset(v);
  if (!p) return cssOf(v);
  if (p.group === 'css') return `${cssOf(v)}, the CSS keyword ${p.name}`;
  if (p.group === 'lib') return `${cssOf(v)}, svg-scroll-draw's '${p.name}' (${p.formula})`;
  return `${p.name}, ${cssOf(v)}`;
}

/** A custom property name: the preset's, in kebab case, or --ease-custom. */
function varName(v: Bezier): string {
  const p = matchPreset(v);
  if (!p) return '--ease-custom';
  if (p.group === 'css') return `--${p.name}`;
  if (p.group === 'lib') return `--${p.name}-quad`;
  return `--${p.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** Seconds for CSS, "0.6s" from 600. */
const seconds = (ms: number) => `${fmt(ms / 1000)}s`;

export function cssCode(v: Bezier, ms: number): string {
  const p = matchPreset(v);
  // A CSS keyword is written as itself: shorter, and the same curve.
  const value = p?.group === 'css' ? p.name : cssOf(v);
  const name = varName(v);
  const head = cssComment(`${titleOf(v)}. ${overshootWords(v) || (isLinear(v) ? 'A straight line: the same speed all the way.' : 'It stays between its start and its end.')}`);
  const clampNote = bezierRange(v).max > 1.0005 || bezierRange(v).min < -0.0005
    ? `\n\n${cssComment('Outside 0 to 1 a transform keeps going, while opacity and colours stop at their limits.')}`
    : '';
  return `${head}
:root {
  ${name}: ${value};
}

/* A transition: add .is-moved and the card moves along the curve. */
.card {
  transition: transform ${seconds(ms)} var(${name});
}
.card.is-moved {
  transform: translateX(240px);
}

/* A keyframe animation: the badge rises into place as the page loads. */
.badge {
  animation: rise ${seconds(ms)} var(${name}) both;
}
@keyframes rise {
  from { transform: translateY(24px); }
}${clampNote}`;
}

type Easing = { decl: string; value: string | null; note: string };

/** How the curve is written for an API whose default easing is `def`. */
function easingFor(v: Bezier, def: 'linear' | 'ease-out', api: string): Easing {
  const named = isLinear(v) ? 'linear' : libName(v);
  if (named === def) {
    return { decl: '', value: null, note: jsComment(`${titleOf(v)}: the same curve as '${def}', ${api}'s default easing, so there is nothing to set.`) + '\n' };
  }
  if (named) {
    return {
      decl: '',
      value: `'${named}'`,
      note: jsComment(`${titleOf(v)}: pass the name. A named easing can run on the browser's own scroll timeline; a function always runs on the JavaScript engine.`) + '\n',
    };
  }
  const p = matchPreset(v);
  const cssSame = p?.group === 'css' && (p.name === 'ease-in' || p.name === 'ease-out')
    ? ` Not svg-scroll-draw's '${p.name}', which is ${p.name === 'ease-in' ? 't²' : 't(2 − t)'}.`
    : '';
  const ease = p?.group === 'named' ? p.name : 'ease';
  return {
    decl: `${SOLVER_JS}\n\n${jsComment(`${titleOf(v)}.${cssSame} ${overshootWords(v)}`.trim())}\nconst ${ease} = cubicBezier(${v.map(fmt).join(', ')});\n\n`,
    value: ease,
    note: '',
  };
}

export function drawCode(v: Bezier): string {
  const e = easingFor(v, 'linear', 'scrollDraw');
  const call = e.value ? `scrollDraw('#drawing', { easing: ${e.value} });` : `scrollDraw('#drawing');`;
  return `// <div id="drawing"><svg viewBox="…"><path d="…" /></svg></div>

import { scrollDraw } from 'svg-scroll-draw';

${e.decl}${e.note}${call}`;
}

export function animateCode(v: Bezier): string {
  const e = easingFor(v, 'ease-out', 'scrollAnimate');
  return `// <div id="card">…</div>

import { scrollAnimate } from 'svg-scroll-draw';

${e.decl}${e.note ? `${e.note}\n` : ''}// Moves #card 240px to the right as it scrolls through the window.
scrollAnimate('#card', {
  props: { transform: ['translateX(0px)', 'translateX(240px)'] },${e.value ? `\n  easing: ${e.value},` : ''}
});`;
}

/** One code tab, with the source line on top. */
export function codeFor(tab: Tab, v: Bezier, ms: number): string {
  const code = tab === 'css' ? cssCode(v, ms) : tab === 'draw' ? drawCode(v) : animateCode(v);
  return withSource(code, SLUG, TAB_LANG[tab]);
}

// ── Run it: the page ────────────────────────────────────────────────────────

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/** A curve as svg-scroll-draw's `easing`: the library's name for it when it has one, else cubicBezier(…). */
function spell(v: Bezier): { value: string; fn: boolean } {
  const named = isLinear(v) ? 'linear' : libName(v);
  return named ? { value: `'${named}'`, fn: false } : { value: `cubicBezier(${v.map(fmt).join(', ')})`, fn: true };
}

/** A short name for the curve: the named curve's, or its numbers. */
function shortName(v: Bezier): string {
  const p = matchPreset(v);
  return p?.group === 'named' ? p.name : cssOf(v);
}

export type HtmlInput = {
  /** The curve. */
  v: Bezier;
  /** The curve it is compared with, or null. */
  cmp: Bezier | null;
  /** The duration, for the CSS tab's transition and keyframes. */
  ms: number;
  /** svg-scroll-draw's version, for the jsDelivr URL. */
  version: string;
};

/**
 * The page Run it downloads or opens in StackBlitz, for the generator's
 * current settings: the CSS tab as written, on a card and a badge, then three
 * screens of scroll with a pinned stage, where each curve draws a scrollDraw
 * line and moves a scrollAnimate dot along a ruler from the lowest to the
 * highest progress the curves reach, as the race does in the preview.
 */
export function bezierHtml({ v, cmp, ms, version }: HtmlInput): string {
  const a = spell(v);
  const b = cmp ? spell(cmp) : null;
  const ra = bezierRange(v);
  const rb = cmp ? bezierRange(cmp) : null;
  const lo = Math.min(0, ra.min, rb?.min ?? 0);
  const hi = Math.max(1, ra.max, rb?.max ?? 1);
  const pct = (n: number) => `${fmt(Math.round(n * 1e5) / 1e3)}%`;
  const labelA = titleOf(v);
  const labelB = cmp ? titleOf(cmp) : null;
  const words = overshootWords(v) || (isLinear(v) ? 'A straight line: the same speed all the way.' : 'It stays between its start and its end.');
  const row = (key: 'a' | 'b', label: string) => [
    `<div class="row row-${key}">`,
    `  <p class="row-h"><span>${key.toUpperCase()} · ${escapeHtml(label)}</span><output id="out-${key}"></output></p>`,
    '  <svg viewBox="0 0 320 60" aria-hidden="true">',
    `    <path class="pencil" d="${WAVE}" />`,
    `    <path class="ink ink-${key}" d="${WAVE}" />`,
    '  </svg>',
    `  <div class="ruler"><div class="unit"><span class="dot dot-${key}" id="dot-${key}"></span></div></div>`,
    '</div>',
  ];

  const css = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
.intro, .end {
  display: grid;
  align-content: center;
  gap: 16px;
  min-height: 90vh;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;
}
.intro h1 { margin: 0; font: 600 clamp(18px, 4.6vw, 28px)/1.3 ${MONO}; overflow-wrap: anywhere; }
.intro p, .end p { margin: 0; color: #55555c; }
.kicker { font: 500 12px/1.4 ${MONO}; }
code { font: 500 0.92em ${MONO}; color: #16161a; overflow-wrap: anywhere; }

/* The CSS tab's .card and .badge. Their motion is the CSS at the end of this
   block, as the CSS tab writes it. */
.demo { display: grid; gap: 14px; padding: 16px; border: 1px solid #c9c9c2; }
/* The card moves 240px; a curve past 1 carries it further, cut off here
   rather than widening the page. */
.lane { overflow: hidden; padding: 2px 0; }
.card { width: 48px; height: 48px; background: #16161a; }
.badge { display: inline-block; justify-self: start; padding: 4px 10px; border: 1px solid #16161a; font: 500 12px/1.4 ${MONO}; }
button {
  justify-self: start;
  padding: 9px 16px;
  border: 1px solid #16161a;
  background: transparent;
  font: 500 13px/1 ${MONO};
  color: inherit;
  cursor: pointer;
}

/* Three screens of scroll, and a stage that stays on screen while they pass. */
.run { height: 300vh; }
.stage {
  position: sticky;
  top: 0;
  display: grid;
  align-content: center;
  gap: 24px;
  height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
.read, .row-h { display: flex; justify-content: space-between; gap: 12px; margin: 0; font: 500 13px/1.4 ${MONO}; }
.row-h span { min-width: 0; overflow-wrap: anywhere; }
output { font-variant-numeric: tabular-nums; }
.row { display: grid; gap: 6px; }
.row svg { display: block; width: 100%; height: auto; overflow: visible; }
.pencil { fill: none; stroke: #c9c9c2; stroke-width: 1; stroke-dasharray: 3 4; }
.ink { fill: none; stroke: #16161a; stroke-width: 3; }
.ink-b { stroke: #77777d; }
/* The ruler runs from ${fmt(Math.round(lo * 1000) / 1000)} to ${fmt(Math.round(hi * 1000) / 1000)}; .unit spans 0 to 1 on it. */
.ruler { position: relative; height: 18px; margin: 0 6px 18px; border-bottom: 1px solid #c9c9c2; }
.unit {
  position: absolute;
  top: 0;
  bottom: -1px;
  left: ${pct(-lo / (hi - lo))};
  width: ${pct(1 / (hi - lo))};
  border-left: 1px solid #77777d;
  border-right: 1px solid #77777d;
}
.unit::before, .unit::after { position: absolute; top: 100%; transform: translateX(-50%); font: 12px/1.5 ${MONO}; color: #55555c; }
.unit::before { content: '0'; left: 0; }
.unit::after { content: '1'; left: 100%; }
.dot {
  position: absolute;
  top: 3px;
  left: 0;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background: #16161a;
}
.dot-b { background: #f4f4f1; border: 2px solid #77777d; }
.key, .rm { margin: 0; font-size: 14px; color: #55555c; }
.rm { display: none; }
@media (prefers-reduced-motion: reduce) { .rm { display: block; } }

${cssCode(v, ms)}`;

  const body = [
    '<header class="intro">',
    `  <p class="kicker">svg-scroll-draw ${escapeHtml(version)} · cubic-bezier</p>`,
    `  <h1>${escapeHtml(labelA)}</h1>`,
    `  <p>${escapeHtml(words)}</p>`,
    '  <div class="demo">',
    `    <p>In CSS: the card has a ${fmt(ms / 1000)}s transition on <code>var(${varName(v)})</code> and the badge a keyframe animation on it, as the CSS tab writes them. Play moves the card and runs the badge again.</p>`,
    '    <div class="lane"><div class="card"></div></div>',
    '    <span class="badge">badge</span>',
    '    <button type="button" id="play">Play</button>',
    '  </div>',
    `  <p>Then scroll down. The next section is three screens tall and its stage stays put, so scrolling through it runs progress from 0 to 1. ${labelB ? 'Each line is' : 'The line is'} drawn by scrollDraw and ${labelB ? 'each dot' : 'the dot'} moved by scrollAnimate, with the curve named above it as the easing.</p>`,
    '</header>',
    '',
    '<section id="run" class="run">',
    '  <div class="stage">',
    '    <p class="read"><span>progress in</span><output id="in">0.000</output></p>',
    ...row('a', labelA).map((l) => `    ${l}`),
    ...(labelB ? row('b', labelB).map((l) => `    ${l}`) : []),
    '    <p class="key">Beside each name is the eased progress, and the dot shows it on a ruler marked 0 and 1. The library does not clamp it: past 1 the dot runs beyond the 1 mark and the start of the line clears for a moment, and below 0 a piece of the line’s far end shows before it begins.</p>',
    '    <p class="rm">Your system asks for reduced motion, so svg-scroll-draw shows every line and dot finished.</p>',
    '  </div>',
    '</section>',
    '',
    '<footer class="end">',
    '  <p>The end of the run. Scroll back up and it plays backwards.</p>',
    '</footer>',
  ].join('\n');

  const decl = [
    `${jsComment(`A: ${labelA}.${a.fn ? '' : ' Passed by name.'}`)}\nconst easingA = ${a.value};`,
    ...(b && labelB ? [`${jsComment(`B: ${labelB}.${b.fn ? '' : ' Passed by name.'}`)}\nconst easingB = ${b.value};`] : []),
  ].join('\n');

  const script = `import { scrollDraw, scrollAnimate } from '${cdnModule(version)}';

${a.fn || b?.fn ? `${SOLVER_JS}\n\n` : ''}${decl}

// The CSS tab's card and badge: Play moves the card, or back, and runs the
// badge's keyframes again.
const card = document.querySelector('.card');
const badge = document.querySelector('.badge');
const play = document.querySelector('#play');
play.addEventListener('click', () => {
  play.textContent = card.classList.toggle('is-moved') ? 'Back' : 'Play';
  badge.style.animation = 'none';
  void badge.offsetWidth;
  badge.style.animation = '';
});

// #run's whole scroll is progress 0 to 1: from its top at the top of the
// window to its bottom at the bottom, while its stage stays pinned.
const run = document.querySelector('#run');
const trigger = { start: 'top top', end: 'bottom bottom' };

/** Row \`key\`: its line drawn by scrollDraw, its dot moved by scrollAnimate. */
function show(key, easing) {
  const out = document.querySelector(\`#out-\${key}\`);
  scrollDraw(run, {
    easing,
    trigger,
    selector: \`.ink-\${key}\`,
    // The eased progress, past 0 and 1 too.
    onProgress: (p) => { out.textContent = p.toFixed(3); },
  });
  // left 0% is 0 on the row's ruler and 100% is 1.
  scrollAnimate(\`#dot-\${key}\`, {
    props: { left: ['0%', '100%'] },
    easing,
    trigger,
    triggerElement: run,
  });
}

show('a', easingA);${labelB ? `\nshow('b', easingB);` : ''}

// Progress in, for the readout: how far the scroll is through #run.
const input = document.querySelector('#in');
function readIn() {
  const box = run.getBoundingClientRect();
  input.textContent = Math.min(1, Math.max(0, -box.top / (box.height - innerHeight))).toFixed(3);
}
addEventListener('scroll', readIn, { passive: true });
readIn();`;

  return htmlFile({ slug: SLUG, title: `${shortName(v)} · ${TITLE}`, css, body, script });
}
