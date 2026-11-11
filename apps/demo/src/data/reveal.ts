import { REVEAL_PRESETS } from './facts';

/**
 * What the scroll reveal generator (/scroll-reveal-generator) offers, all of it
 * scrollReveal's own options (packages/svg-scroll-draw/src/reveal/index.ts).
 *
 * - The preset names come from facts.ts, which check:claims holds to the
 *   library's REVEAL_PRESETS table; REVEAL_FROM below is keyed by them, so a
 *   preset added or renamed there fails the typecheck here.
 * - REVEAL_FROM is that table's values, and REVEAL_DEFAULTS the defaults
 *   scrollReveal destructures (preset, stagger, easing, once) and the trigger
 *   window it falls back to ('top 88%' → 'top 53%'). The generator leaves
 *   every option at one of these values out of the code it writes.
 * - The functions at the bottom are scrollReveal's own maths, line for line,
 *   for the parts of the page that need it without a window to scroll: the
 *   preview box and the table of staggered windows.
 */

export type RevealPreset = (typeof REVEAL_PRESETS)[number];
export type RevealFrom = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
};

export { REVEAL_PRESETS };

/** Each preset's start state (REVEAL_PRESETS in reveal/index.ts). */
export const REVEAL_FROM: Record<RevealPreset, RevealFrom> = {
  fadeUp: { opacity: 0, y: 32 },
  fadeDown: { opacity: 0, y: -32 },
  fadeLeft: { opacity: 0, x: 32 },
  fadeRight: { opacity: 0, x: -32 },
  scale: { opacity: 0, scale: 0.88 },
  flip: { opacity: 0, rotateX: 20 },
  flipX: { opacity: 0, rotateY: 20 },
};

/** The keys of EASINGS in core/easing.ts, scrollReveal's `easing` names. */
export const REVEAL_EASINGS = ['ease-out', 'ease-in-out', 'ease-in', 'linear', 'spring', 'bounce', 'elastic'] as const;
export type RevealEasing = (typeof REVEAL_EASINGS)[number];

/** scrollReveal's defaults. start and end are the viewport line, as % of the window, with the element's top. */
export const REVEAL_DEFAULTS = {
  preset: 'fadeUp' as RevealPreset,
  stagger: 0.15,
  easing: 'ease-out' as RevealEasing,
  once: true,
  start: 88,
  end: 53,
};

export const trig = (pct: number) => `top ${pct}%`;

/**
 * The one number each preset moves, so the generator can offer it as a single
 * control: its key in `from`, which way it points, and a range to pick from.
 */
export const PRESET_AMOUNT: Record<
  RevealPreset,
  { key: keyof RevealFrom; label: string; unit: string; sign: 1 | -1; min: number; max: number; step: number }
> = {
  fadeUp: { key: 'y', label: 'Distance', unit: 'px', sign: 1, min: 0, max: 120, step: 4 },
  fadeDown: { key: 'y', label: 'Distance', unit: 'px', sign: -1, min: 0, max: 120, step: 4 },
  fadeLeft: { key: 'x', label: 'Distance', unit: 'px', sign: 1, min: 0, max: 120, step: 4 },
  fadeRight: { key: 'x', label: 'Distance', unit: 'px', sign: -1, min: 0, max: 120, step: 4 },
  scale: { key: 'scale', label: 'Start scale', unit: '', sign: 1, min: 0.5, max: 1, step: 0.02 },
  flip: { key: 'rotateX', label: 'Angle', unit: '°', sign: 1, min: 0, max: 90, step: 5 },
  flipX: { key: 'rotateY', label: 'Angle', unit: '°', sign: 1, min: 0, max: 90, step: 5 },
};

/** The preset's own value for its amount, as a positive number. */
export function presetAmount(p: RevealPreset): number {
  const a = PRESET_AMOUNT[p];
  return Math.abs(REVEAL_FROM[p][a.key] ?? 0);
}

/** The preset's start state written out, e.g. "opacity 0 · y 32px". */
export function describeFrom(f: RevealFrom): string {
  const unit: Record<string, string> = { x: 'px', y: 'px', rotate: '°', rotateX: '°', rotateY: '°' };
  return Object.entries(f).map(([k, v]) => `${k} ${v}${unit[k] ?? ''}`).join(' · ');
}

// ── scrollReveal's maths (reveal/index.ts) ───────────────────────────────────

/** fromToProps: the start state as the props the animate engine tweens to their natural values. */
export function fromToProps(from: RevealFrom): Record<string, [string | number, string | number]> {
  const result: Record<string, [string | number, string | number]> = {};
  if (from.opacity !== undefined) result.opacity = [from.opacity, 1];
  const f: string[] = [];
  const t: string[] = [];
  if (from.x !== undefined) { f.push(`translateX(${from.x}px)`); t.push('translateX(0px)'); }
  if (from.y !== undefined) { f.push(`translateY(${from.y}px)`); t.push('translateY(0px)'); }
  if (from.scale !== undefined) { f.push(`scale(${from.scale})`); t.push('scale(1)'); }
  if (from.rotate !== undefined) { f.push(`rotate(${from.rotate}deg)`); t.push('rotate(0deg)'); }
  if (from.rotateX !== undefined) { f.push(`rotateX(${from.rotateX}deg)`); t.push('rotateX(0deg)'); }
  if (from.rotateY !== undefined) { f.push(`rotateY(${from.rotateY}deg)`); t.push('rotateY(0deg)'); }
  if (f.length > 0) result.transform = [f.join(' '), t.join(' ')];
  return result;
}

/** shift: a 'top N%' line moved up the window by `by` percent, so it fires later; never above 0. */
export const shiftPct = (pct: number, by: number) => +Math.max(0, pct - by).toFixed(3);

/**
 * rowIndices: each element's place in its row. Elements whose tops line up
 * count 0, 1, 2… in DOM order; one further down starts a new row at 0.
 */
export function rowIndices(els: Element[]): number[] {
  let top = NaN;
  let height = 0;
  let n = 0;
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    if (!(Math.abs(r.top - top) <= Math.max(8, Math.min(r.height, height || r.height) / 2))) {
      top = r.top;
      height = r.height;
      n = 0;
    } else n++;
    return n;
  });
}

/**
 * The window each element in a row gets: `stagger` of the window later per
 * place in the row, never more than one whole window late.
 */
export function rowWindows(start: number, end: number, stagger: number, perRow: number): { start: number; end: number }[] {
  const span = Math.abs(start - end);
  const step = Math.min(Math.max(stagger, 0), 1) * span;
  return Array.from({ length: perRow }, (_, i) => {
    const by = Math.min(i * step, span);
    return by > 0 ? { start: shiftPct(start, by), end: shiftPct(end, by) } : { start, end };
  });
}

/** The ease-out curve, EASINGS['ease-out'] in core/easing.ts, for the figure. */
export const easeOut = (t: number) => t * (2 - t);
