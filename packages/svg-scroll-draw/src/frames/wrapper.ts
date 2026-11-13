// What the React and Vue <ScrollFrames> share, beside the engine itself.
import { optionsKey } from '../core/reactive';
import { warn } from '../core/env';
import type { ScrollFramesOptions } from './index';

/** The most URLs a key reads from a `frames` function (a sequence is rarely past a few hundred). */
const KEY_FRAMES = 10000;

/**
 * The options' fingerprint (core/reactive), with a `frames` function counted
 * by the URLs it gives rather than as "a function". Every other wrapper option
 * that is a function is a callback, read live; this one is the film itself. As
 * "a function" a new URL pattern with the same count kept the old film, and by
 * identity an inline `frames={(i) => …}` rebuilt it, and reloaded every image,
 * on every render.
 */
export function framesKey(options: ScrollFramesOptions): string {
  const { frames, count } = options;
  if (typeof frames !== 'function') return optionsKey(options);
  const n = Number.isFinite(count) ? Math.min(Math.max(Math.floor(count!), 0), KEY_FRAMES) : 0;
  let urls: unknown[];
  try {
    urls = Array.from({ length: n }, (_, i) => frames(i));
  } catch {
    urls = ['throws']; // the engine skips the frames it cannot name, and warns
  }
  return optionsKey({ ...options, frames: urls });
}

/**
 * The component renders role="img", which needs a name. Nothing to say when it
 * has one, or when the page marked the canvas as decoration.
 */
export function checkLabel(canvas: Element | null): void {
  if (!canvas || canvas.getAttribute('aria-hidden') === 'true') return;
  const role = canvas.getAttribute('role');
  if (role === 'presentation' || role === 'none') return;
  if (canvas.getAttribute('aria-label') || canvas.getAttribute('aria-labelledby')) return;
  warn('<ScrollFrames>: the canvas has no aria-label. Say what the frames show, or set aria-hidden="true" if they are decoration.', canvas);
}
