import { createEngine } from './core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from './core/types';

export function scrollDraw(
  target: string | Element,
  options?: ScrollDrawOptions
): ScrollDrawInstance {
  const noop: ScrollDrawInstance = { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };
  if (typeof window === 'undefined') return noop;

  const container =
    typeof target === 'string'
      ? document.querySelector(target)
      : target;

  if (!container) {
    console.warn('[svg-scroll-draw] Container not found:', target);
    return noop;
  }

  return createEngine(container, options);
}

export type { ScrollDrawOptions, ScrollDrawInstance };
export { createSpring, createBounce, createElastic } from './core/utils';

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
