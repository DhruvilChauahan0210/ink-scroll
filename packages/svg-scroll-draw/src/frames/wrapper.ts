// What every framework's scrollFrames wrapper shares, beside the engine itself:
// the React and Vue <ScrollFrames>, Vue's useScrollFrames, the Svelte action,
// the Solid primitives and the Angular ref class. startFrames, which all but
// React use, is in ./start: entries load whole chunks, so a function here that
// React never calls would still count against its size.
import { optionsKey } from '../core/reactive';
import { warn } from '../core/env';
import type { ScrollFramesOptions } from './index';

/** The options as scrollFrames takes them, but `triggerElement` may be a selector. */
export type FramesInput = Omit<ScrollFramesOptions, 'triggerElement'> & { triggerElement?: Element | string | null };

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
export function framesKey(options: FramesInput): string {
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
 * The film is a picture, and needs a name: role="img" (which the components
 * render, and a page writes on its own canvas) with an aria-label. Nothing to
 * say when it has one, or when the page marked the canvas as decoration.
 * `who` names the API in the warning.
 */
export function checkLabel(canvas: Element | null, who = '<ScrollFrames>'): void {
  if (!canvas || canvas.getAttribute('aria-hidden') === 'true') return;
  const role = canvas.getAttribute('role');
  if (role === 'presentation' || role === 'none') return;
  if (canvas.getAttribute('aria-label') || canvas.getAttribute('aria-labelledby')) return;
  warn(`${who}: the canvas has no aria-label. Say what the frames show, or set aria-hidden="true" if they are decoration.`, canvas);
}
