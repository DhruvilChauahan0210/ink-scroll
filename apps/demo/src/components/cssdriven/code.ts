import {
  CSS_TIMING, LIB, presetOf,
  type ClipFrom, type EasingKey, type PresetKey, type Prop, type RangeEdge,
} from '@/data/cssdriven';

/**
 * Everything the CSS scroll-driven animation generator writes, from one
 * settings object: the CSS, its preview copy, the svg-scroll-draw equivalent
 * (JavaScript and React), and whether the library would compile that
 * equivalent to the very same CSS. Pure functions, so the preview, the code
 * and the verdict cannot disagree.
 */

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

export function cssCode(s: Settings): string {
  const preset = presetOf(s.preset);
  const name = keyframesName(s);
  const kf = keyframes(name, propsOf(s));
  const lib = s.fallback === 'library';
  if (preset.kind === 'scroll') {
    return [
      '/* A reading-progress bar. Markup: <div class="progress"></div> */',
      '.progress {',
      '  position: fixed;',
      '  inset: 0 0 auto;',
      '  z-index: 10;',
      '  height: 4px;',
      '  background: currentColor;',
      '  transform-origin: 0 50%;',
      `  /* Hidden until something drives it: the animation below${lib ? ', or fallback.js' : ''}. */`,
      '  transform: scaleX(var(--scroll-progress, 0));',
      '}',
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

function notesOf(s: Settings, pad: string): string[] {
  const t = triggerOf(s);
  const out = t.notes.map((n) => `${pad}// ${n}`);
  if (t.tallCaveat) out.push(`${pad}// These edges match animation-range for an element shorter than the viewport.`);
  // Under reduced motion scrollAnimate applies the "to" values at once; the CSS
  // is simply off. For a fade that plays out, those differ.
  if (kindOf(s) === 'view' && s.dir === 'out') {
    out.push(`${pad}// Under reduced motion scrollAnimate sets the end values at once, so this`);
    out.push(`${pad}// element stays hidden; the CSS tab leaves it as written.`);
  }
  return out;
}

function verdictLines(s: Settings): string[] {
  const v = nativeVerdict(s);
  const kind = kindOf(s);
  if (v.native) {
    return [
      '// The default window and an easing CSS can express: where the browser supports',
      '// animation-timeline: view(), scrollAnimate writes the same keyframes and range as',
      '// the CSS tab itself, and runs its JS engine everywhere else.',
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

function importLine(s: Settings): string {
  const kind = kindOf(s);
  if (kind === 'scroll') return "import { scrollProgress } from 'svg-scroll-draw/progress';";
  return `import { ${kind === 'clip' ? 'scrollDraw' : 'scrollAnimate'} } from 'svg-scroll-draw';`;
}

export function jsCode(s: Settings): string {
  if (kindOf(s) === 'scroll') {
    return [
      '// <div class="progress"></div>, styled by the first rule in the CSS tab.',
      importLine(s),
      '',
      '// Writes the page’s scroll progress, 0 to 1, to --scroll-progress on <html>',
      '// on every frame, in every browser; the bar reads it.',
      ...callLines(s, '', ''),
    ].join('\n');
  }
  return [
    '// <div class="reveal">…</div>, as many as you like. No CSS needed.',
    importLine(s),
    '',
    ...verdictLines(s),
    ...notesOf(s, ''),
    "document.querySelectorAll('.reveal').forEach((el) => {",
    ...callLines(s, 'el', '  '),
    '});',
  ].join('\n');
}

/** fallback.js: the library only where the CSS cannot run. */
export function fallbackCode(s: Settings): string {
  const scroll = kindOf(s) === 'scroll';
  const test = scroll ? 'scroll()' : 'view()';
  const body = scroll
    ? callLines(s, '', '  ')
    : ["  document.querySelectorAll('.reveal').forEach((el) => {", ...callLines(s, 'el', '    '), '  });'];
  return [
    importLine(s),
    '',
    '// Only where CSS has no scroll timelines: the same animation on',
    `// svg-scroll-draw’s JS engine, ${scroll ? 'over the same stretch of scroll' : stretchOf(s)}.`,
    ...notesOf(s, ''),
    `if (!CSS.supports('animation-timeline: ${test}')) {`,
    ...body,
    '}',
  ].join('\n');
}

export function reactCode(s: Settings): string {
  const kind = kindOf(s);
  if (kind === 'scroll') {
    return [
      "'use client';",
      '',
      "import { useEffect } from 'react';",
      importLine(s),
      '',
      '// Style .progress with the first rule in the CSS tab.',
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
    "import type { ReactNode } from 'react';",
    `import { ${tag} } from 'svg-scroll-draw/react';`,
    '',
    ...verdictLines(s),
    ...notesOf(s, ''),
    'export function Reveal({ children }: { children: ReactNode }) {',
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
