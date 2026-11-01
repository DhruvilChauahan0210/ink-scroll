import { createEngine } from './engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from './types';
import { warn } from './env';

/*
 * Its own file rather than the body of src/index.ts, so `svg-scroll-draw/astro`
 * can re-export it without importing the main entry — and with it, in the
 * chunked ESM build, every module the main entry pulls in (Cinematic among them).
 */
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
    warn('Container not found:', target);
    return noop;
  }

  return createEngine(container, options);
}
