/**
 * The CSS scroll-driven animation generator (/css-scroll-driven-animation-generator):
 * its presets, the four named ranges, and the facts that tie them to
 * svg-scroll-draw. Every library figure here is read from the library source,
 * cited beside it; the page and the generator both import from this file.
 */

export type PresetKey = 'fade-up' | 'scale-in' | 'slide-in' | 'rotate-in' | 'blur-in' | 'clip-reveal' | 'progress-bar';
export type RangeName = 'entry' | 'exit' | 'cover' | 'contain';
export type EasingKey = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type ClipFrom = 'left' | 'right' | 'top' | 'bottom' | 'center';
/** What drives the preset: an element's own view() timeline, a clip-path, or the page's scroll(). */
export type PresetKind = 'view' | 'clip' | 'scroll';

/** One animated property: its CSS name and its value at the start and the end. */
export type Prop = { prop: string; from: string | number; to: string | number };

export type Preset = {
  key: PresetKey;
  label: string;
  kind: PresetKind;
  /** The one number the preset takes, if any. */
  amount: { label: string; min: number; max: number; step: number; def: number; unit: string } | null;
  props: (amount: number, clip: ClipFrom) => Prop[];
};

/**
 * scrollDraw's clip-path at progress 0 and 1, per direction — computeClipPath()
 * in packages/svg-scroll-draw/src/core/engine.ts, so the CSS reveal and the
 * library's are the same shape.
 */
export const CLIP_PATHS: Record<ClipFrom, [string, string]> = {
  left: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
  right: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
  top: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
  bottom: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'],
  center: ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'],
};
export const CLIP_FROMS = Object.keys(CLIP_PATHS) as ClipFrom[];

// Transforms are written with the same function at both ends (translateY(40px)
// → translateY(0px), never → none): scrollAnimate interpolates a transform
// function by function, and a mismatched pair would jump instead of moving.
export const PRESETS: Preset[] = [
  {
    key: 'fade-up',
    label: 'Fade up',
    kind: 'view',
    amount: { label: 'y', min: 0, max: 120, step: 4, def: 40, unit: 'px' },
    props: (n) => [
      { prop: 'opacity', from: 0, to: 1 },
      { prop: 'transform', from: `translateY(${n}px)`, to: 'translateY(0px)' },
    ],
  },
  {
    key: 'scale-in',
    label: 'Scale in',
    kind: 'view',
    amount: { label: 'scale', min: 0.5, max: 0.95, step: 0.05, def: 0.8, unit: '' },
    props: (n) => [
      { prop: 'opacity', from: 0, to: 1 },
      { prop: 'transform', from: `scale(${n})`, to: 'scale(1)' },
    ],
  },
  {
    key: 'slide-in',
    label: 'Slide in',
    kind: 'view',
    amount: { label: 'x', min: -160, max: 160, step: 8, def: -80, unit: 'px' },
    props: (n) => [
      { prop: 'opacity', from: 0, to: 1 },
      { prop: 'transform', from: `translateX(${n}px)`, to: 'translateX(0px)' },
    ],
  },
  {
    key: 'rotate-in',
    label: 'Rotate in',
    kind: 'view',
    amount: { label: 'rotate', min: -45, max: 45, step: 1, def: -8, unit: 'deg' },
    props: (n) => [
      { prop: 'opacity', from: 0, to: 1 },
      { prop: 'transform', from: `rotate(${n}deg)`, to: 'rotate(0deg)' },
    ],
  },
  {
    key: 'blur-in',
    label: 'Blur in',
    kind: 'view',
    amount: { label: 'blur', min: 0, max: 20, step: 1, def: 8, unit: 'px' },
    props: (n) => [
      { prop: 'opacity', from: 0, to: 1 },
      { prop: 'filter', from: `blur(${n}px)`, to: 'blur(0px)' },
    ],
  },
  {
    key: 'clip-reveal',
    label: 'Clip-path reveal',
    kind: 'clip',
    amount: null,
    props: (_n, clip) => [{ prop: 'clip-path', from: CLIP_PATHS[clip][0], to: CLIP_PATHS[clip][1] }],
  },
  {
    key: 'progress-bar',
    label: 'Progress bar · scroll()',
    kind: 'scroll',
    amount: null,
    props: () => [{ prop: 'transform', from: 'scaleX(0)', to: 'scaleX(1)' }],
  },
];

export const presetOf = (key: PresetKey): Preset => PRESETS.find((p) => p.key === key) ?? PRESETS[0];

/**
 * The four named ranges of a view() timeline, for an element shorter than its
 * scroller (h ≤ H). `trigger` is the svg-scroll-draw trigger edge that marks the
 * same moment: element edge first, viewport edge second
 * (packages/svg-scroll-draw/src/core/trigger.ts, computeTriggers).
 */
export const RANGES: { name: RangeName; at0: string; at100: string; length: string; trigger: [string, string]; d: string }[] = [
  {
    name: 'cover',
    at0: 'its top meets the bottom of the scroller',
    at100: 'its bottom meets the top',
    length: 'H + h',
    trigger: ['top bottom', 'bottom top'],
    d: 'The whole crossing, from the first pixel in to the last pixel out. A view() timeline with no range runs over cover.',
  },
  {
    name: 'entry',
    at0: 'its top meets the bottom',
    at100: 'its bottom meets the bottom: fully in',
    length: 'h',
    trigger: ['top bottom', 'bottom bottom'],
    d: 'While it comes in. The usual range for a reveal.',
  },
  {
    name: 'contain',
    at0: 'its bottom meets the bottom: fully in',
    at100: 'its top meets the top: about to leave',
    length: 'H − h',
    trigger: ['bottom bottom', 'top top'],
    d: 'While all of it is in view. For an element taller than the scroller it flips: while it covers the whole view.',
  },
  {
    name: 'exit',
    at0: 'its top meets the top',
    at100: 'its bottom meets the top: gone',
    length: 'h',
    trigger: ['top top', 'bottom top'],
    d: 'While it goes out. Pair it with a reversed animation to fade things away.',
  },
];
export const RANGE_NAMES = RANGES.map((r) => r.name);
/**
 * The other two named ranges CSS defines. They differ from entry and exit only
 * for an element taller than its scroller, so the generator leaves them out;
 * the page names them. All six parse in Chromium, Firefox and WebKit.
 */
export const CROSSING_RANGES = ['entry-crossing', 'exit-crossing'];

export type RangeEdge = { name: RangeName; pct: number };
export type RangePick = { label: string; start: RangeEdge; end: RangeEdge; dir: 'in' | 'out' };

export const RANGE_PICKS: RangePick[] = [
  { label: 'Until centred', start: { name: 'entry', pct: 0 }, end: { name: 'cover', pct: 50 }, dir: 'in' },
  { label: 'While entering', start: { name: 'entry', pct: 0 }, end: { name: 'entry', pct: 100 }, dir: 'in' },
  { label: 'Whole crossing', start: { name: 'cover', pct: 0 }, end: { name: 'cover', pct: 100 }, dir: 'in' },
  { label: 'While leaving', start: { name: 'exit', pct: 0 }, end: { name: 'exit', pct: 100 }, dir: 'out' },
];

/**
 * The easings svg-scroll-draw's native path can write as CSS, and exactly what
 * it writes (packages/svg-scroll-draw/src/core/css-easing.ts): its ease-in and
 * ease-out are the quadratics t² and t(2 − t) (core/easing.ts, EASINGS), which
 * CSS's keywords of the same name are not, so they are written as the
 * cubic-béziers that reproduce them; ease-in-out has no single curve and is
 * written as linear() through 33 stops.
 */
export const EASING_KEYS: EasingKey[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];
export const EASE_FN: Record<EasingKey, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};
const LINEAR_STOPS = 33;
export function linearStops(fn: (t: number) => number): string[] {
  return Array.from({ length: LINEAR_STOPS }, (_, i) => String(Math.round(fn(i / (LINEAR_STOPS - 1)) * 1e5) / 1e5));
}
export const CSS_TIMING: Record<EasingKey, string> = {
  linear: 'linear',
  'ease-in': 'cubic-bezier(0.333333, 0, 0.666667, 0.333333)',
  'ease-out': 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)',
  'ease-in-out': `linear(${linearStops(EASE_FN['ease-in-out']).join(', ')})`,
};

/** The library's defaults the generated code leaves out when they match. */
export const LIB = {
  /** scrollAnimate's easing (animate/engine.ts: easing = 'ease-out'). */
  animateEasing: 'ease-out' as EasingKey,
  /** scrollDraw's easing (core/engine.ts: easing = 'linear'). */
  drawEasing: 'linear' as EasingKey,
  /** Both engines' trigger (trigger.start ?? 'top bottom', trigger.end ?? 'bottom top'). */
  start: 'top bottom',
  end: 'bottom top',
  /** What scrollAnimate's native path may animate (animate/engine.ts, NATIVE_SAFE_PROPS). */
  nativeProps: ['opacity', 'transform', 'background-color', 'color', 'filter', 'scale', 'translate', 'rotate'],
};

/**
 * Where animation-timeline: view() works without a flag. The versions are the
 * ones the rest of the site quotes (README.md, the browser support table, and
 * /blog/native-css-svg-scroll-animations); the page also tests the reader's
 * own browser live rather than trusting this table.
 */
export const BROWSER_SUPPORT: { browser: string; since: string; note: string }[] = [
  { browser: 'Chrome, Edge', since: '115', note: 'Since July 2023: view(), scroll(), animation-range and named timelines. Opera, built on the same Chromium, has them too.' },
  { browser: 'Safari (macOS, iOS)', since: '26', note: 'Shipped with Safari 26. Earlier Safari has none of it.' },
  { browser: 'Firefox', since: '159', note: 'On by default since October 2026. Before that it sat behind a preference, off for most readers.' },
];
