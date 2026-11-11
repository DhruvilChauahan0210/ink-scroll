/**
 * What the text animation generator (/text-animation-generator) offers, all of
 * it scrollText's own options (packages/svg-scroll-draw/src/text/index.ts):
 * the `from` states are plain values of its `from` option, the easings are the
 * keys of EASINGS in core/easing.ts, and TEXT_DEFAULTS are buildText's
 * defaults, used to leave unchanged options out of the generated code.
 */

export type TextFrom = { opacity?: number; y?: number; x?: number; rotate?: number; scale?: number };

export const TEXT_EFFECTS: { key: string; label: string; from: TextFrom }[] = [
  { key: 'fade-up', label: 'Fade up', from: { opacity: 0, y: 24 } },
  { key: 'fade', label: 'Fade', from: { opacity: 0 } },
  { key: 'drop', label: 'Drop in', from: { opacity: 0, y: -32 } },
  { key: 'slide', label: 'Slide in', from: { opacity: 0, x: -24 } },
  { key: 'grow', label: 'Grow', from: { opacity: 0, scale: 0.5 } },
  { key: 'tilt', label: 'Tilt up', from: { opacity: 0, y: 20, rotate: -12 } },
  { key: 'rise', label: 'Rise far', from: { opacity: 0, y: 64 } },
];

export const TEXT_SPLITS = ['words', 'chars', 'lines'] as const;
export type TextSplit = (typeof TEXT_SPLITS)[number];

export const TEXT_EASINGS = ['ease-out', 'ease-in-out', 'ease-in', 'linear', 'spring', 'bounce', 'elastic'] as const;

export const TEXT_DEFAULTS = {
  split: 'words' as TextSplit,
  stagger: 0.04,
  easing: 'ease-out',
  from: { opacity: 0, y: 24 } as TextFrom,
  once: true,
  start: 'top 85%',
  end: 'top 40%',
};

/**
 * With n pieces each starting `stagger` after the one before, the last one
 * starts at (n - 1) × stagger of the way through. At 1 or more it has no time
 * left: every piece snaps on instead of animating (unitAlpha in text/index.ts).
 */
export function maxStagger(pieces: number): number {
  return pieces <= 1 ? 1 : 1 / (pieces - 1);
}
