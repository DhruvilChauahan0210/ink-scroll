/**
 * What the parallax scrolling generator (/parallax-scrolling-generator)
 * offers. Everything here is scrollParallax's own behaviour
 * (packages/svg-scroll-draw/src/animate/index.ts):
 *
 * - PARALLAX_DEFAULTS are its defaults (`speed = 0.3, axis = 'y', easing =
 *   'linear'`, and the trigger `{ start: 'top bottom', end: 'bottom top' }`),
 *   used to leave unchanged options out of the generated code.
 * - The layer moves from translate(0%) to translate(−speed × 100%) of its own
 *   size as its trigger window is scrolled through, so `travel` and `rate`
 *   below are the same arithmetic, in pixels.
 */

export type ParallaxAxis = 'y' | 'x';
export type LayerKey = 'sky' | 'mountains' | 'hills' | 'ground';
export type LayerSetting = { speed: number; axis: ParallaxAxis };
export type LayerSettings = Record<LayerKey, LayerSetting>;

export const PARALLAX_DEFAULTS = {
  speed: 0.3,
  axis: 'y' as ParallaxAxis,
  easing: 'linear',
  start: 'top bottom',
  end: 'bottom top',
};

/** Back to front, the order they are stacked in. */
export const PARALLAX_LAYERS: { key: LayerKey; label: string; note: string }[] = [
  { key: 'sky', label: 'Sky', note: 'sun, clouds, birds' },
  { key: 'mountains', label: 'Mountains', note: 'the far ridge' },
  { key: 'hills', label: 'Hills', note: 'trees on the near ridge' },
  { key: 'ground', label: 'Ground', note: 'grass and a fence' },
];

/**
 * ±1, not further. Past 1 a layer travels more than its own size, so the
 * scene's `overflow: hidden` clips its whole box away before its window ends.
 * Measured in 2.23.2: the engine's IntersectionObserver watches that
 * transformed, clipped box, so the layer stops following the scroll there;
 * once its box has left the scene it never comes back into view, and the
 * layer stays where it stopped, even after scrolling back (seen at −1.05 with
 * 40px scroll steps, and at 1.5 with larger jumps, in Chromium, Firefox and
 * WebKit). At ±1 and below the box always overlaps the scene, so it recovers.
 */
export const SPEED_MIN = -1;
export const SPEED_MAX = 1;
export const SPEED_STEP = 0.05;

const y = (speed: number): LayerSetting => ({ speed, axis: 'y' });

export const PARALLAX_PRESETS: { key: string; label: string; note: string; layers: LayerSettings }[] = [
  {
    key: 'depth',
    label: 'Depth',
    note: 'Far layers lag behind the page, the ground runs a little ahead of it.',
    layers: { sky: y(-0.4), mountains: y(-0.25), hills: y(-0.1), ground: y(0.1) },
  },
  {
    key: 'subtle',
    label: 'Subtle',
    note: 'Small differences, the ground fixed to the page: depth you feel more than see.',
    layers: { sky: y(-0.2), mountains: y(-0.1), hills: y(-0.05), ground: y(0) },
  },
  {
    key: 'dramatic',
    label: 'Dramatic',
    note: 'Large differences: the sun sets behind the hills as you scroll.',
    layers: { sky: y(-0.8), mountains: y(-0.5), hills: y(-0.2), ground: y(0.2) },
  },
  {
    key: 'drift',
    label: 'Drift',
    note: 'The sky moves sideways (axis x) while the ridges keep their depth.',
    layers: { sky: { speed: 0.35, axis: 'x' }, mountains: y(-0.25), hills: y(-0.1), ground: y(0.1) },
  },
  {
    key: 'flat',
    label: 'Flat',
    note: 'Every layer at speed 0: the scene moves with the page, no parallax.',
    layers: { sky: y(0), mountains: y(0), hills: y(0), ground: y(0) },
  },
];

/**
 * How far a layer travels over its whole trigger window, in px: speed × its
 * own height (axis y) or width (axis x). Positive is up (or left).
 */
export function travelPx(speed: number, size: number): number {
  return speed * size;
}

/**
 * How fast an axis-y layer moves on screen, as a multiple of the scroll. The
 * default window runs from the layer's top at the window's bottom to its bottom
 * at the window's top, `window + layer` px of scroll, over which the layer moves
 * a further `speed × layer` px: 1 + speed × layer ÷ (window + layer).
 */
export function screenRate(speed: number, layer: number, windowPx: number): number {
  return windowPx + layer <= 0 ? 1 : 1 + (speed * layer) / (windowPx + layer);
}
