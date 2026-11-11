import {
  DEFAULT_PRESET, LIMITS, presetOf,
  type Direction, type Fill, type Frame, type FrameProps, type Iterations, type Jump, type Preset, type TimingKind,
} from '@/data/keyframes';

/**
 * Everything the CSS keyframes animation generator writes, from one settings
 * object: the @keyframes and the class, the shorthand, the scroll-driven CSS,
 * the svg-scroll-draw version, the preview's own scoped copies, and the
 * timeline the transport and the header figure draw. Pure functions, so the
 * preview, the code and the drawing cannot disagree.
 */

export type Settings = {
  preset: string;
  /** Milliseconds. */
  duration: number;
  /** Milliseconds. */
  delay: number;
  iterations: Iterations;
  direction: Direction;
  fill: Fill;
  /** A CSS easing function the browser has accepted (CSS.supports) before it got here. */
  timing: string;
  /** The class the CSS defines; a valid CSS identifier. */
  cls: string;
};

export function settingsFor(key: string, cls = key): Settings {
  const p = presetOf(key);
  return { preset: p.key, ...p.suggest, delay: 0, cls };
}
export const INITIAL: Settings = settingsFor(DEFAULT_PRESET);

/** The four code outputs, in tab order. */
export const OUTPUTS = [
  { key: 'css', label: 'CSS' },
  { key: 'shorthand', label: 'Shorthand' },
  { key: 'scroll-css', label: 'On scroll · CSS' },
  { key: 'scroll-js', label: 'On scroll · JS' },
] as const;
export type OutputKey = (typeof OUTPUTS)[number]['key'];

// ── Class names ──────────────────────────────────────────────────────────────

/** A class the generator can write without escaping: a letter or _ first, then letters, digits, - and _. */
export const CLASS_RE = /^[A-Za-z_][\w-]*$/;
export const MAX_CLASS = 40;

// ── Timing functions ─────────────────────────────────────────────────────────

export type ParsedTiming =
  | { kind: 'keyword'; name: string }
  | { kind: 'bezier'; p: [number, number, number, number] }
  | { kind: 'steps'; n: number; pos: Jump };

/** The cubic-béziers the CSS easing keywords stand for (CSS Easing Functions, level 1). */
export const KEYWORD_BEZIER: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

export function parseTiming(css: string): ParsedTiming {
  const t = css.trim();
  const bez = /^cubic-bezier\(([^)]*)\)$/.exec(t);
  if (bez) {
    const n = bez[1].split(',').map((v) => Number(v.trim()));
    return { kind: 'bezier', p: [n[0], n[1], n[2], n[3]] };
  }
  const st = /^steps\(\s*(\d+)\s*(?:,\s*([a-z-]+)\s*)?\)$/.exec(t);
  if (st) {
    const raw = st[2] ?? 'jump-end';
    const pos = (raw === 'start' ? 'jump-start' : raw === 'end' ? 'jump-end' : raw) as Jump;
    return { kind: 'steps', n: Number(st[1]), pos };
  }
  if (t === 'step-start') return { kind: 'steps', n: 1, pos: 'jump-start' };
  if (t === 'step-end') return { kind: 'steps', n: 1, pos: 'jump-end' };
  return { kind: 'keyword', name: t };
}

/** What the timing controls hold while the visitor edits them. */
export type TimingDraft = { kind: TimingKind; bezier: string; steps: number; jump: Jump };

export const DRAFT_DEFAULTS = { bezier: '0.34, 1.56, 0.64, 1', steps: 5, jump: 'jump-end' as Jump };

export function draftOf(css: string): TimingDraft {
  const p = parseTiming(css);
  if (p.kind === 'bezier') return { kind: 'cubic-bezier', bezier: p.p.join(', '), steps: DRAFT_DEFAULTS.steps, jump: DRAFT_DEFAULTS.jump };
  if (p.kind === 'steps' && /^steps/.test(css)) return { kind: 'steps', bezier: DRAFT_DEFAULTS.bezier, steps: p.n, jump: p.pos };
  return { kind: css as TimingKind, ...DRAFT_DEFAULTS };
}

const num = (n: number) => String(Math.round(n * 1e4) / 1e4);

/**
 * The CSS easing function the draft describes, or why there is none. The
 * generator also asks the browser (CSS.supports) before it uses the result.
 */
export function timingFromDraft(d: TimingDraft): { css: string } | { error: string } {
  if (d.kind === 'cubic-bezier') {
    const parts = d.bezier.split(/[\s,]+/).filter(Boolean);
    const n = parts.map(Number);
    if (parts.length !== 4 || n.some((v) => !Number.isFinite(v))) return { error: 'cubic-bezier() takes four numbers: x1, y1, x2, y2.' };
    if (n[0] < 0 || n[0] > 1 || n[2] < 0 || n[2] > 1) return { error: 'x1 and x2 are times, so they have to be between 0 and 1. y1 and y2 can be anything.' };
    return { css: `cubic-bezier(${n.map(num).join(', ')})` };
  }
  if (d.kind === 'steps') {
    if (!Number.isInteger(d.steps) || d.steps < 1 || d.steps > LIMITS.maxSteps) return { error: `steps() takes a whole number of steps, 1 to ${LIMITS.maxSteps} here.` };
    if (d.jump === 'jump-none' && d.steps < 2) return { error: 'jump-none needs at least 2 steps: it holds both the start and the end.' };
    return { css: d.jump === 'jump-end' ? `steps(${d.steps})` : `steps(${d.steps}, ${d.jump})` };
  }
  return { css: d.kind };
}

/** Does this cubic-bézier go past its end, or below its start, on the way? */
export function overshoots(css: string): boolean {
  const p = parseTiming(css);
  return p.kind === 'bezier' && (p.p[1] < 0 || p.p[1] > 1 || p.p[3] < 0 || p.p[3] > 1);
}

// The two helpers the JavaScript output carries when the easing is not one of
// the library's names. The TypeScript below is the same arithmetic, and the
// preview and the drawings use it.

export const BEZIER_HELPER = `// CSS cubic-bezier(x1, y1, x2, y2) as a function of t, for the easing option.
function cubicBezier(x1, y1, x2, y2) {
  const at = (a, b, u) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 40; i++) {
      u = (lo + hi) / 2;
      if (at(x1, x2, u) < t) lo = u; else hi = u;
    }
    return at(y1, y2, u);
  };
}`;

export const STEPS_HELPER = `// CSS steps(n, position) as a function of t, for the easing option.
function steps(n, position = 'jump-end') {
  const jumps = position === 'jump-none' ? n - 1 : position === 'jump-both' ? n + 1 : n;
  const lift = position === 'jump-start' || position === 'jump-both' ? 1 : 0;
  return (t) => Math.min(Math.max(Math.floor(t * n) + lift, 0), jumps) / jumps;
}`;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const at = (a: number, b: number, u: number) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let u = t;
    for (let i = 0; i < 40; i++) {
      u = (lo + hi) / 2;
      if (at(x1, x2, u) < t) lo = u;
      else hi = u;
    }
    return at(y1, y2, u);
  };
}

export function stepsFn(n: number, position: Jump = 'jump-end'): (t: number) => number {
  const jumps = position === 'jump-none' ? n - 1 : position === 'jump-both' ? n + 1 : n;
  const lift = position === 'jump-start' || position === 'jump-both' ? 1 : 0;
  return (t) => Math.min(Math.max(Math.floor(t * n) + lift, 0), jumps) / jumps;
}

/** The CSS easing as a function of t, 0 → 1: what the browser does with it, for the drawings. */
export function easingFn(css: string): (t: number) => number {
  const p = parseTiming(css);
  if (p.kind === 'bezier') return cubicBezier(...p.p);
  if (p.kind === 'steps') return stepsFn(p.n, p.pos);
  if (p.name === 'linear') return (t) => t;
  const k = KEYWORD_BEZIER[p.name];
  return k ? cubicBezier(...k) : (t) => t;
}

// ── @keyframes and the class ─────────────────────────────────────────────────

export const isTwoFrame = (p: Preset) =>
  p.frames.length === 2 && p.frames[0].at.join() === '0' && p.frames[1].at.join() === '100';

/** How many distinct offsets the effect has: 2 for from → to, more for the ones that move in between. */
export const offsetCount = (p: Preset) => new Set(p.frames.flatMap((f) => f.at)).size;

function frameSelector(f: Frame, two: boolean): string {
  if (two) return f.at[0] === 0 ? 'from' : 'to';
  return f.at.map((a) => `${a}%`).join(', ');
}

export function keyframesCss(p: Preset, name: string, pad = ''): string {
  const two = isTwoFrame(p);
  const out = [`${pad}@keyframes ${name} {`];
  for (const f of p.frames) {
    out.push(`${pad}  ${frameSelector(f, two)} {`);
    for (const [k, v] of Object.entries(f.props)) out.push(`${pad}    ${k}: ${v};`);
    out.push(`${pad}  }`);
  }
  out.push(`${pad}}`);
  return out.join('\n');
}

const ms = (n: number) => `${n}ms`;

/** The animation shorthand's value, with every part at its initial value left out but the duration. */
export function shorthandValue(s: Settings, name: string): string {
  const parts = [name, ms(s.duration)];
  if (s.timing !== 'ease') parts.push(s.timing);
  if (s.delay !== 0) parts.push(ms(s.delay));
  if (s.iterations !== 1) parts.push(String(s.iterations));
  if (s.direction !== 'normal') parts.push(s.direction);
  if (s.fill !== 'none') parts.push(s.fill);
  return parts.join(' ');
}

/** The reduced-motion rule: the same animation as one instant frame. */
function reducedRule(s: Settings, sel: string): string[] {
  const body = ['    animation-duration: 0.01ms;'];
  if (s.delay !== 0) body.push('    animation-delay: 0s;');
  if (s.iterations === 'infinite') body.push('    animation-iteration-count: 1;');
  return [
    '/* Asked for less motion: the same animation as one instant frame, so the',
    `   element ends where it would have and animationend still fires.${s.iterations === 'infinite' ? '\n   The loop runs once.' : ''} */`,
    '@media (prefers-reduced-motion: reduce) {',
    `  ${sel} {`,
    ...body,
    '  }',
    '}',
  ];
}

/** The reduced-motion rule on its own, for the page to quote. */
export const reducedCss = (s: Settings) => reducedRule(s, `.${s.cls}`).join('\n');

export function cssCode(s: Settings): string {
  const p = presetOf(s.preset);
  const sel = `.${s.cls}`;
  return [
    `/* ${p.label}. ${p.d}`,
    `   Markup: <div class="${s.cls}">…</div> */`,
    keyframesCss(p, p.key),
    '',
    `${sel} {`,
    `  animation: ${shorthandValue(s, p.key)};`,
    ...(p.origin ? [`  transform-origin: ${p.origin};`] : []),
    '}',
    '',
    ...reducedRule(s, sel),
  ].join('\n');
}

export function shorthandCode(s: Settings): string {
  const p = presetOf(s.preset);
  const sel = `.${s.cls}`;
  const longs: [string, string, boolean][] = [
    ['animation-name', p.key, false],
    ['animation-duration', ms(s.duration), false],
    ['animation-timing-function', s.timing, s.timing === 'ease'],
    ['animation-delay', s.delay ? ms(s.delay) : '0s', s.delay === 0],
    ['animation-iteration-count', String(s.iterations), s.iterations === 1],
    ['animation-direction', s.direction, s.direction === 'normal'],
    ['animation-fill-mode', s.fill, s.fill === 'none'],
    ['animation-play-state', 'running', true],
  ];
  const width = Math.max(...longs.map(([k, v]) => k.length + v.length + 3));
  return [
    '/* One declaration: name, duration, easing, delay, count, direction, fill.',
    '   The first time is the duration, the second the delay. */',
    `${sel} {`,
    `  animation: ${shorthandValue(s, p.key)};`,
    '}',
    '',
    '/* The same, one property at a time. The ones marked default can go. */',
    `${sel} {`,
    ...longs.map(([k, v, def]) => {
      const decl = `${k}: ${v};`;
      return def ? `  ${decl.padEnd(width)} /* default */` : `  ${decl}`;
    }),
    '}',
  ].join('\n');
}

// ── Run it when it scrolls into view: CSS ────────────────────────────────────

/** The view() range each group plays over. Exits play as the element leaves at the top. */
export const SCROLL_RANGE = { in: 'entry 0% cover 30%', out: 'exit 0% exit 100%' };
export const rangeOf = (p: Preset) => (p.group === 'exit' ? SCROLL_RANGE.out : SCROLL_RANGE.in);

/** With one cycle, alternate runs forwards and alternate-reverse backwards. */
const scrollDirection = (d: Direction) => (d === 'reverse' || d === 'alternate-reverse' ? 'reverse' : null);

function scrollRule(s: Settings, sel: string, name: string, pad: string): string[] {
  const p = presetOf(s.preset);
  const dir = scrollDirection(s.direction);
  return [
    `${pad}${sel} {`,
    `${pad}  animation-name: ${name};`,
    `${pad}  animation-duration: auto;`,
    ...(s.timing !== 'ease' ? [`${pad}  animation-timing-function: ${s.timing};`] : []),
    ...(dir ? [`${pad}  animation-direction: ${dir};`] : []),
    `${pad}  animation-fill-mode: both;`,
    `${pad}  animation-timeline: view();`,
    `${pad}  animation-range: ${rangeOf(p)};`,
    ...(p.origin ? [`${pad}  transform-origin: ${p.origin};`] : []),
    `${pad}}`,
  ];
}

export function scrollCssCode(s: Settings): string {
  const p = presetOf(s.preset);
  const exit = p.group === 'exit';
  return [
    `/* ${p.label}, run by the scroll instead of the clock.`,
    `   Markup: <div class="${s.cls}">…</div> */`,
    keyframesCss(p, p.key),
    '',
    exit
      ? '/* As it scrolls out: from when its top reaches the top of the window to when\n   its bottom does.'
      : '/* As it scrolls in: from when its top enters at the bottom of the window to\n   30% of the way across it.',
    '   The scroll sets the pace, so there is no duration, delay or repeat count:',
    '   it plays once across that range, forwards and back as you scroll.',
    '   Only where the browser has scroll timelines, and only for readers who have',
    '   not asked for less motion; everywhere else the element is simply shown. */',
    '@supports (animation-timeline: view()) {',
    '  @media (prefers-reduced-motion: no-preference) {',
    ...scrollRule(s, `.${s.cls}`, p.key, '    '),
    '  }',
    '}',
  ].join('\n');
}

// ── Run it when it scrolls into view: svg-scroll-draw ────────────────────────

type RevealKey = 'opacity' | 'x' | 'y' | 'scale' | 'rotate' | 'rotateX' | 'rotateY';
type RevealFrom = Partial<Record<RevealKey, number>>;

/** scrollReveal's presets (REVEAL_PRESETS in packages/svg-scroll-draw/src/reveal/index.ts), its default first. */
export const REVEAL_PRESETS: Record<string, RevealFrom> = {
  fadeUp: { opacity: 0, y: 32 },
  fadeDown: { opacity: 0, y: -32 },
  fadeLeft: { opacity: 0, x: 32 },
  fadeRight: { opacity: 0, x: -32 },
  scale: { opacity: 0, scale: 0.88 },
  flip: { opacity: 0, rotateX: 20 },
  flipX: { opacity: 0, rotateY: 20 },
};
/** scrollReveal's defaults (reveal/index.ts, the destructuring in scrollReveal and its start/end). */
export const REVEAL_DEFAULTS = { preset: 'fadeUp', easing: 'ease-out', once: true, start: 'top 88%', end: 'top 53%' };
/** The exit window: animation-range exit 0% → exit 100% as trigger edges (element edge, viewport edge). */
export const EXIT_TRIGGER = { start: 'top top', end: 'bottom top' };

/** Where each from key lands at the end of a reveal: opacity 1, no move, scale 1, no turn. */
const NEUTRAL: Record<RevealKey, number> = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0 };
/** The transform functions scrollReveal writes, in the order it writes them (fromToProps). */
const REVEAL_FNS: [fn: string, key: RevealKey, unit: string][] = [
  ['translateX', 'x', 'px'], ['translateY', 'y', 'px'], ['scale', 'scale', ''],
  ['rotate', 'rotate', 'deg'], ['rotateX', 'rotateX', 'deg'], ['rotateY', 'rotateY', 'deg'],
];

type Fn = { fn: string; args: string[] };
function parseFns(v: string): Fn[] | null {
  const re = /([A-Za-z0-9]+)\(([^)]*)\)/g;
  const out: Fn[] = [];
  let rest = v;
  let m: RegExpExecArray | null;
  while ((m = re.exec(v)) !== null) {
    out.push({ fn: m[1], args: m[2].split(/[\s,]+/).filter(Boolean) });
    rest = rest.replace(m[0], '');
  }
  return rest.trim() === '' ? out : null;
}

/** The scrollReveal `from` that is this effect, or why there is none. */
function revealFrom(p: Preset): { from: RevealFrom } | { why: string } {
  const [a, b] = p.frames.map((f) => f.props);
  if (a.filter || b.filter) return { why: 'scrollReveal’s from has no filter' };
  const from: RevealFrom = {};
  if (a.opacity !== undefined) {
    if (b.opacity !== '1') return { why: 'it does not end at opacity 1' };
    from.opacity = Number(a.opacity);
  }
  if (a.transform) {
    const fa = parseFns(a.transform);
    const fb = b.transform ? parseFns(b.transform) : null;
    if (!fa || !fb || fa.length !== fb.length) return { why: 'its transform does not map onto scrollReveal’s from' };
    let at = 0;
    for (let i = 0; i < fa.length; i++) {
      const j = REVEAL_FNS.findIndex(([fn]) => fn === fa[i].fn);
      if (j < at || j === -1) return { why: `scrollReveal’s from has no ${fa[i].fn}()` };
      at = j + 1;
      const [, key, unit] = REVEAL_FNS[j];
      const parse = (arg: string) => (arg.endsWith(unit) && /^-?[\d.]+$/.test(arg.slice(0, arg.length - unit.length)) ? Number(arg.slice(0, arg.length - unit.length)) : NaN);
      const va = fa[i].args.length === 1 ? parse(fa[i].args[0]) : NaN;
      const vb = fb[i].fn === fa[i].fn && fb[i].args.length === 1 ? parse(fb[i].args[0]) : NaN;
      if (!Number.isFinite(va)) return { why: unit === 'px' ? 'scrollReveal moves in px, not percentages' : 'its transform does not map onto scrollReveal’s from' };
      if (vb !== NEUTRAL[key]) return { why: 'it does not end where the element is' };
      from[key] = va;
    }
  }
  return { from };
}

export type LibMap =
  | { kind: 'reveal'; preset: string; from: RevealFrom; cancels: RevealKey[] }
  | { kind: 'animate'; props: [prop: string, from: string | number, to: string | number][]; why: string }
  | { kind: 'none'; why: string };

/**
 * Which svg-scroll-draw call plays this effect on scroll: scrollReveal when
 * its from can say it, scrollAnimate when it is one from → to it can
 * interpolate, and none when it has frames in between, which both of them
 * have nowhere to put.
 */
export function libMapOf(p: Preset): LibMap {
  if (!isTwoFrame(p)) {
    return {
      kind: 'none',
      why: `${p.label} has ${offsetCount(p)} keyframes. scrollAnimate and scrollReveal move each value between two ends, a from and a to, so the frames in between have nowhere to go.`,
    };
  }
  const [a, b] = p.frames.map((f) => f.props);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])] as (keyof FrameProps)[];
  const props: [string, string | number, string | number][] = [];
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (va === undefined || vb === undefined) return { kind: 'none', why: `${k} is set at one end only.` };
    if (k === 'opacity') { props.push([k, Number(va), Number(vb)]); continue; }
    const fa = parseFns(va);
    const fb = parseFns(vb);
    // scrollAnimate interpolates function by function, and jumps when the lists differ.
    if (!fa || !fb || fa.map((f) => f.fn).join() !== fb.map((f) => f.fn).join()) {
      return { kind: 'none', why: `its ${k} changes functions between the two ends, which scrollAnimate would jump instead of moving.` };
    }
    props.push([k, va, vb]);
  }
  if (p.group === 'entrance') {
    const r = revealFrom(p);
    if ('from' in r) return { kind: 'reveal', ...chooseReveal(r.from) };
    return { kind: 'animate', props, why: r.why };
  }
  return { kind: 'animate', props, why: '' };
}

/**
 * scrollReveal merges `from` over its preset ({ ...preset, ...from }), so a
 * key the preset has and this effect does not must be set back to where it
 * ends (y: 0 under the default fadeUp). The cheapest preset wins: fewest keys
 * to write, the default when it ties, then the one with least to cancel.
 */
function chooseReveal(mine: RevealFrom): { preset: string; from: RevealFrom; cancels: RevealKey[] } {
  let best: { preset: string; from: RevealFrom; cancels: RevealKey[]; cost: number } | null = null;
  for (const [name, base] of Object.entries(REVEAL_PRESETS)) {
    const from: RevealFrom = {};
    const cancels: RevealKey[] = [];
    for (const k of Object.keys(mine) as RevealKey[]) if (base[k] !== mine[k]) from[k] = mine[k];
    for (const k of Object.keys(base) as RevealKey[]) {
      if (!(k in mine)) { from[k] = NEUTRAL[k]; cancels.push(k); }
    }
    const cost = Object.keys(from).length + (name === REVEAL_DEFAULTS.preset ? 0 : 1);
    if (!best || cost < best.cost || (cost === best.cost && cancels.length < best.cancels.length)) best = { preset: name, from, cancels, cost };
  }
  const { preset, from, cancels } = best!;
  return { preset, from, cancels };
}

/**
 * The props scrollReveal hands scrollAnimate for a merged from state: the same
 * arithmetic as fromToProps in packages/svg-scroll-draw/src/reveal/index.ts,
 * so the box in the generator runs exactly what scrollReveal would.
 */
export function revealProps(preset: string, from: RevealFrom): Record<string, [string | number, string | number]> {
  const m: RevealFrom = { ...REVEAL_PRESETS[preset], ...from };
  const out: Record<string, [string | number, string | number]> = {};
  if (m.opacity !== undefined) out.opacity = [m.opacity, 1];
  const f: string[] = [];
  const t: string[] = [];
  if (m.x !== undefined) { f.push(`translateX(${m.x}px)`); t.push('translateX(0px)'); }
  if (m.y !== undefined) { f.push(`translateY(${m.y}px)`); t.push('translateY(0px)'); }
  if (m.scale !== undefined) { f.push(`scale(${m.scale})`); t.push('scale(1)'); }
  if (m.rotate !== undefined) { f.push(`rotate(${m.rotate}deg)`); t.push('rotate(0deg)'); }
  if (m.rotateX !== undefined) { f.push(`rotateX(${m.rotateX}deg)`); t.push('rotateX(0deg)'); }
  if (m.rotateY !== undefined) { f.push(`rotateY(${m.rotateY}deg)`); t.push('rotateY(0deg)'); }
  if (f.length) out.transform = [f.join(' '), t.join(' ')];
  return out;
}

/** The library easing for a CSS one: a name, or a helper call; null when it is the default. */
export function libEasing(css: string): { code: string | null; fn: (t: number) => number; helper: 'bezier' | 'steps' | null; quadratic: boolean } {
  const p = parseTiming(css);
  if (p.kind === 'keyword') {
    if (p.name === 'ease') return { code: `cubicBezier(${KEYWORD_BEZIER.ease.join(', ')})`, fn: cubicBezier(...KEYWORD_BEZIER.ease), helper: 'bezier', quadratic: false };
    const named: Record<string, (t: number) => number> = {
      // The library's own (packages/svg-scroll-draw/src/core/easing.ts, EASINGS).
      linear: (t) => t,
      'ease-in': (t) => t * t,
      'ease-out': (t) => t * (2 - t),
      'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    };
    return {
      code: p.name === REVEAL_DEFAULTS.easing ? null : `'${p.name}'`,
      fn: named[p.name] ?? named['ease-out'],
      helper: null,
      quadratic: p.name !== 'linear',
    };
  }
  if (p.kind === 'bezier') return { code: `cubicBezier(${p.p.map(num).join(', ')})`, fn: cubicBezier(...p.p), helper: 'bezier', quadratic: false };
  return { code: p.pos === 'jump-end' ? `steps(${p.n})` : `steps(${p.n}, '${p.pos}')`, fn: stepsFn(p.n, p.pos), helper: 'steps', quadratic: false };
}

const lit = (o: RevealFrom) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
const q = (v: string | number) => (typeof v === 'number' ? String(v) : `'${v}'`);
const camel = (prop: string) => prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** The svg-scroll-draw code, or null with the reason when no call can play this effect. */
export function jsCode(s: Settings): { code: string | null; why: string } {
  const p = presetOf(s.preset);
  const map = libMapOf(p);
  if (map.kind === 'none') return { code: null, why: map.why };
  const ease = libEasing(s.timing);
  const head = [`// <div class="${s.cls}">…</div>`];
  const helper = ease.helper === 'bezier' ? ['', BEZIER_HELPER] : ease.helper === 'steps' ? ['', STEPS_HELPER] : [];
  const notes: string[] = [];
  if (ease.quadratic) {
    const name = ease.code ? s.timing : `default, ${s.timing},`;
    notes.push(`// The library’s ${name} is a quadratic curve: close to CSS’s ${s.timing}, not identical.`);
  }
  const pace = '// The scroll sets the pace: duration, delay and repeats belong to the CSS version.';

  if (map.kind === 'reveal') {
    const opts: string[] = [];
    if (map.preset !== REVEAL_DEFAULTS.preset) opts.push(`preset: '${map.preset}'`);
    if (Object.keys(map.from).length) opts.push(`from: ${lit(map.from)}`);
    if (ease.code) opts.push(`easing: ${ease.code}`);
    const base = REVEAL_PRESETS[map.preset];
    if (map.cancels.length) {
      notes.push(`// ${map.cancels.map((k) => `${k}: ${NEUTRAL[k]}`).join(', ')} cancels the ${map.cancels.map((k) => `${k}: ${base[k]}`).join(', ')} of the ${map.preset} preset it starts from.`);
    }
    if (overshoots(s.timing)) notes.push(...onceNote);
    const call = opts.length
      ? [`scrollReveal('.${s.cls}', {`, ...opts.map((o) => `  ${o},`), '});']
      : [`scrollReveal('.${s.cls}');`];
    return {
      code: [
        ...head,
        "import { scrollReveal } from 'svg-scroll-draw/reveal';",
        ...helper,
        '',
        '// Plays as it scrolls into view, from when its top passes 88% of the window',
        '// to 53%, and stays once it has played (once is on by default).',
        pace,
        ...notes,
        ...call,
      ].join('\n'),
      why: '',
    };
  }

  const exit = p.group === 'exit';
  const props = map.props.map(([k, a, b]) => `${camel(k)}: [${q(a)}, ${q(b)}]`);
  const opts: string[] = [];
  const trig = exit ? EXIT_TRIGGER : { start: REVEAL_DEFAULTS.start, end: REVEAL_DEFAULTS.end };
  opts.push(`trigger: { start: '${trig.start}', end: '${trig.end}' }`);
  // scrollAnimate's default easing is ease-out too, so libEasing's null holds for it.
  if (ease.code) opts.push(`easing: ${ease.code}`);
  if (!exit) opts.push('once: true');
  if (!exit && overshoots(s.timing)) notes.push(...onceNote);
  const body = [
    `document.querySelectorAll('.${s.cls}').forEach((el) => {`,
    '  scrollAnimate(el, {',
    '    props: {',
    ...props.map((e) => `      ${e},`),
    '    },',
    ...opts.map((o) => `    ${o},`),
    '  });',
    '});',
  ];
  const why = map.why ? [`// ${map.why}: this uses scrollAnimate, which takes the CSS values themselves.`] : [];
  return {
    code: [
      ...head,
      "import { scrollAnimate } from 'svg-scroll-draw';",
      ...helper,
      '',
      ...(exit
        ? [
          '// Plays as it scrolls out at the top: from when its top reaches the top of',
          '// the window to when its bottom does (animation-range: exit in CSS).',
          pace,
          ...notes,
          '// Under reduced motion scrollAnimate shows the end state at once, which for an',
          '// exit is hidden: it is left off there, so the element stays readable.',
          "if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {",
          ...body.map((l) => `  ${l}`),
          '}',
        ]
        : [
          '// Plays as it scrolls into view: the same window as scrollReveal, from when its',
          '// top passes 88% of the window to 53%, and once: true keeps it there.',
          ...why,
          pace,
          ...notes,
          '// scrollAnimate takes one element, so call it for each.',
          ...body,
        ]),
    ].join('\n'),
    why: '',
  };
}

const onceNote = [
  '// This curve goes past 1. With once on, svg-scroll-draw 2.23.2 and earlier keep',
  '// the highest eased value reached, so it would stop on that peak; 2.23.3 keeps',
  '// the furthest scroll progress and eases it after, so it settles at the end.',
];

// ── The preview's own CSS ────────────────────────────────────────────────────

/**
 * The time-based preview: the same keyframes and animation as the CSS tab,
 * renamed and scoped to one preview so nothing else on the page can match it.
 * The site's reduced-motion rule (app/globals.css) cuts every animation to
 * 0.01ms with !important; there the preview is held paused instead and
 * keeps its real duration and count, so the time slider can step through it.
 */
export function previewCss(s: Settings, scope: string, name: string): string {
  const p = presetOf(s.preset);
  return [
    keyframesCss(p, name),
    `.${scope} .kfg-card.is-run {`,
    `  animation: ${shorthandValue(s, name)};`,
    `  animation-duration: ${ms(s.duration)} !important;`,
    `  animation-iteration-count: ${s.iterations} !important;`,
    ...(p.origin ? [`  transform-origin: ${p.origin};`] : []),
    '}',
  ].join('\n');
}

/** The scroll box's CSS card: the On scroll · CSS tab, scoped. */
export function scrollPreviewCss(s: Settings, scope: string, name: string): string {
  const p = presetOf(s.preset);
  return [
    keyframesCss(p, name),
    '@supports (animation-timeline: view()) {',
    '  @media (prefers-reduced-motion: no-preference) {',
    ...scrollRule(s, `.${scope} .kfg-scard.is-css`, name, '    '),
    '  }',
    '}',
  ].join('\n');
}

/** The options the scroll box's library card runs: what the JS tab writes, plus the box. */
export function libPreviewOptions(preset: string, timing: string): {
  props: Record<string, [string | number, string | number]>;
  trigger: { start: string; end: string };
  easing: (t: number) => number;
  once: boolean;
} | null {
  const p = presetOf(preset);
  const map = libMapOf(p);
  if (map.kind === 'none') return null;
  const easing = libEasing(timing).fn;
  if (map.kind === 'reveal') {
    return { props: revealProps(map.preset, map.from), trigger: { start: REVEAL_DEFAULTS.start, end: REVEAL_DEFAULTS.end }, easing, once: true };
  }
  const props = Object.fromEntries(map.props.map(([k, a, b]) => [camel(k), [a, b] as [string | number, string | number]]));
  const exit = p.group === 'exit';
  return { props, trigger: exit ? EXIT_TRIGGER : { start: REVEAL_DEFAULTS.start, end: REVEAL_DEFAULTS.end }, easing, once: !exit };
}

// ── The timeline: delay, cycles, fill ────────────────────────────────────────

/** How many cycles the timeline draws for an infinite animation. */
export const INFINITE_SHOWN = 3;

export type Span = { delay: number; duration: number; count: number; infinite: boolean; active: number; after: number; total: number };

/** The stretch of time the transport and the timeline cover: the delay, the cycles, a little after. */
export function spanOf(s: Pick<Settings, 'delay' | 'duration' | 'iterations'>): Span {
  const infinite = s.iterations === 'infinite';
  const count = infinite ? INFINITE_SHOWN : (s.iterations as number);
  const active = s.duration * count;
  const after = infinite ? 0 : Math.max(100, Math.round(Math.max(0.25 * s.duration, 0.15 * (s.delay + active)) / 50) * 50);
  return { delay: s.delay, duration: s.duration, count, infinite, active, after, total: s.delay + active + after };
}

/** Does cycle i (from 0) run from 100% back to 0%? */
export function reversedAt(i: number, dir: Direction): boolean {
  if (dir === 'reverse') return true;
  if (dir === 'alternate') return i % 2 === 1;
  if (dir === 'alternate-reverse') return i % 2 === 0;
  return false;
}

/** The keyframe offset fill-mode backwards holds during the delay: the first cycle's start. */
export const firstFrame = (dir: Direction) => (reversedAt(0, dir) ? 100 : 0);
/** The offset fill-mode forwards holds after the end: the last cycle's end. */
export const lastFrame = (count: number, dir: Direction) => (reversedAt(count - 1, dir) ? 0 : 100);

export const fillsBefore = (f: Fill) => f === 'backwards' || f === 'both';
export const fillsAfter = (f: Fill) => f === 'forwards' || f === 'both';

export type TimeSettings = Pick<Settings, 'delay' | 'duration' | 'iterations' | 'direction' | 'fill'>;

/** Where an animation is at time t, in words, for the transport's readout. */
export function phaseText(s: TimeSettings, t: number): string {
  const sp = spanOf(s);
  const at = `${Math.round(t)} ms`;
  if (t < sp.delay) {
    return `${at} · delay · ${fillsBefore(s.fill) ? `holds the ${firstFrame(s.direction)}% frame (fill ${s.fill})` : `its own style, no keyframes yet (fill ${s.fill})`}`;
  }
  const local = t - sp.delay;
  if (sp.infinite || local < sp.active) {
    const i = Math.floor(local / sp.duration);
    const back = reversedAt(i, s.direction);
    return `${at} · cycle ${i + 1}${sp.infinite ? '' : ` of ${sp.count}`} · ${back ? '100% → 0%' : '0% → 100%'}`;
  }
  return `${at} · ended · ${fillsAfter(s.fill) ? `holds the ${lastFrame(sp.count, s.direction)}% frame (fill ${s.fill})` : `back to its own style (fill ${s.fill})`}`;
}

/** A ramp for one cycle: points (x, y) in 0–1, y the keyframe offset reached, drawn with the easing. */
export function cyclePoints(fn: (t: number) => number, reversed: boolean, n = 48): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const y = fn(x);
    out.push([x, reversed ? 1 - y : y]);
  }
  return out;
}

/** The same as an SVG path in a w × h box (y up), with room for overshoot set by lo/hi. */
export function cyclePath(points: [number, number][], x0: number, w: number, y0: number, h: number, lo = 0, hi = 1): string {
  return points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${(x0 + x * w).toFixed(2)} ${(y0 + (1 - (y - lo) / (hi - lo)) * h).toFixed(2)}`)
    .join(' ');
}
