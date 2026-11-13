// How the Vue, Svelte, Solid and Angular scrollFrames wrappers start a film.
// Its own file, apart from ./wrapper, so the React entry (which reads a ref
// instead of a selector) does not carry it.
import { warn } from '../core/env';
import { scrollFrames } from './index';
import type { FramesInput } from './wrapper';

/**
 * scrollFrames as a wrapper starts it: `live` is the options with their
 * callbacks read live (core/reactive liveFns), `raw` the options as they were
 * passed. `triggerElement` is read now, when the film starts: a selector finds
 * the track then, after the page has rendered it, where a template ref can
 * still be empty on the first render. `frames` goes in as it was (`raw`), not
 * read live: the key already starts a new film when the URLs change, and a
 * live `frames` that turned into a list of the same URLs would be called as a
 * function and throw. Without a document (a server render) the selector is
 * left alone, and scrollFrames returns its inert instance.
 */
export function startFrames(el: HTMLCanvasElement, { triggerElement: t, ...o }: FramesInput, raw: FramesInput) {
  let track = t;
  if (typeof t === 'string' && typeof document !== 'undefined') {
    track = document.querySelector(t);
    if (!track) warn(`scrollFrames: triggerElement "${t}" matches nothing; measuring the canvas.`);
  }
  return scrollFrames(el, { ...o, frames: raw.frames, triggerElement: (track as Element | null) ?? undefined });
}
