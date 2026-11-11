import { SOLVER_JS, bezierRange, cssOf, fmt, isLinear, sameBezier, type Bezier } from './bezier';
import { LIB_PRESETS, PRESETS, type Preset } from './presets';

/**
 * The code the cubic-bezier generator writes. Pure, so the node tests run it:
 *
 * - css: the cubic-bezier() as a custom property, with a transition and a
 *   keyframe animation that use it.
 * - draw: scrollDraw with the curve as its `easing` function.
 * - animate: scrollAnimate the same way.
 *
 * Only options that differ from the library's defaults are written: scrollDraw
 * eases 'linear' unless told otherwise (core/engine.ts:186), scrollAnimate
 * 'ease-out' (animate/engine.ts:190). A curve that is one of the library's own
 * quadratics is written as its name, which keeps the native fast path open
 * (cssTimingFor, core/css-easing.ts:84); any function easing runs on the
 * JavaScript engine (core/engine.ts:510, :521).
 */

export const TABS = [
  { k: 'css', label: 'CSS', file: 'easing.css' },
  { k: 'draw', label: 'scrollDraw', file: 'main.js' },
  { k: 'animate', label: 'scrollAnimate', file: 'motion.js' },
] as const;
export type Tab = (typeof TABS)[number]['k'];

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

export function codeFor(tab: Tab, v: Bezier, ms: number): string {
  if (tab === 'css') return cssCode(v, ms);
  if (tab === 'draw') return drawCode(v);
  return animateCode(v);
}
