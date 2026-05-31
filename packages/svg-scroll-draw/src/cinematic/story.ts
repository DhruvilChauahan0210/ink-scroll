/*
  The Cinematic Story Protocol (v1).

  The shape produced by Cinematic Studio (the visual editor) and consumed by
  `new Cinematic({ wrapper }).loadStory(story)`. Keep in lockstep with the
  editor's exporter — every field here must be honored at runtime.
*/

export type StoryEasing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce'
  | 'elastic';

/** A traced path that strokes itself on across a scroll range. */
export interface DrawAnimation {
  type: 'draw';
  /** DOM id the runtime binds to (with leading '#'), e.g. "#path-3". */
  target: string;
  /** SVG path data, in canvas coordinates. */
  d: string;
  /** Pre-measured total path length (px). */
  length: number;
  /** Scroll progress where the draw begins, e.g. "20%". */
  start: string;
  /** Scroll progress where the draw completes, e.g. "50%". */
  end: string;
  stroke: string;
  strokeWidth: number;
  easing: StoryEasing;
}

/** Any layer fading opacity across a scroll range. */
export interface FadeAnimation {
  type: 'fade';
  target: string;
  start: string;
  end: string;
  from: number;
  to: number;
}

export type StoryAnimation = DrawAnimation | FadeAnimation;

export interface StoryScene {
  id: string;
  /** Optional background layer (a product photo) as a data URL or remote URL. */
  background?: string;
  animations: StoryAnimation[];
}

export interface Story {
  version: 1;
  /** Total scroll height of the experience, e.g. "400vh". */
  totalHeight: string;
  /** The authoring viewBox the coordinates are expressed in. */
  canvas: { width: number; height: number };
  scenes: StoryScene[];
}
