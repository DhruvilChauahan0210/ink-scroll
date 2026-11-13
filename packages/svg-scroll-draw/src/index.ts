import type { ScrollDrawOptions, ScrollDrawInstance } from './core/types';

export { scrollDraw } from './core/scroll-draw';
export type { ScrollDrawOptions, ScrollDrawInstance };
export type { PresetName, Easing, CssEasing } from './core/types';
export { PRESETS } from './core/presets';
export { createSpring, createBounce, createElastic } from './core/easing';

// ── v2 APIs ───────────────────────────────────────────────────────────────────
export { scrollAnimate, scrollParallax } from './animate';
export type { ScrollAnimateOptions, ScrollParallaxOptions } from './animate';
export { scrollCounter } from './counter';
export type { ScrollCounterOptions } from './counter';

// Cinematic — the Studio bridge. Reads a story.json and runs the scroll show.
export { Cinematic } from './cinematic';
export type {
  CinematicOptions,
  CinematicInstance,
} from './cinematic';
export type {
  Story,
  StoryScene,
  StoryAnimation,
  DrawAnimation,
  FadeAnimation,
  StoryEasing,
} from './cinematic/story';
