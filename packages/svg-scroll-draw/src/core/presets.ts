import type { ScrollDrawOptions } from './types';

export type PresetName = 'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring';

/**
 * Named option bags for common scroll-draw patterns.
 * User options always override preset values.
 *
 * @example
 * scrollDraw('#logo', { preset: 'reveal' });
 * scrollDraw('#logo', { preset: 'sketch', easing: 'ease-out' }); // easing overrides preset
 */
export const PRESETS: Record<PresetName, Partial<Omit<ScrollDrawOptions, 'preset'>>> = {
  /**
   * Pencil-drawing feel — paths trace in one by one with a slight stagger.
   * Great for diagrams, illustrations, and handwriting effects.
   */
  sketch: {
    easing:  'ease-in',
    stagger: 0.1,
    speed:   0.9,
    fade:    false,
  },

  /**
   * Clean viewport reveal — fades and draws in once as the element enters view.
   * Best for logos, hero graphics, and section illustrations.
   */
  reveal: {
    easing: 'ease-out',
    fade:   true,
    speed:  1.2,
    once:   true,
  },

  /**
   * Fast mechanical draw — paths appear quickly left-to-right, one after another.
   * Great for code, timelines, and data-driven infographics.
   */
  typewriter: {
    easing:  'linear',
    stagger: 0.05,
    speed:   1.5,
  },

  /**
   * Slow dramatic entrance — long ease-in-out with a gentle fade.
   * Suits hero sections, landing pages, and storytelling layouts.
   */
  cinematic: {
    easing: 'ease-in-out',
    fade:   true,
    speed:  0.75,
  },

  /**
   * Bouncy physics feel — spring easing gives a natural overshoot-and-settle.
   * Pairs well with icons and small decorative SVGs.
   */
  spring: {
    easing: 'spring',
    speed:  1.1,
  },
};
