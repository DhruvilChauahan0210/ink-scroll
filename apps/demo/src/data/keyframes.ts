/**
 * The CSS keyframes animation generator (/css-keyframes-animation-generator):
 * its effects, written for this site, and the CSS values the controls offer.
 * The page, the generator and the header figure all read from this file, so a
 * count on the page is always the length of a list here.
 *
 * Every effect is a small keyframes object: each frame names the offsets it
 * sits at and the properties it sets there. Transforms are written with the
 * same functions in the same order at every frame (translateY(32px) →
 * translateY(0px), never → none): CSS interpolates either way, but
 * svg-scroll-draw's scrollAnimate interpolates a transform function by
 * function (interpolateTransform in packages/svg-scroll-draw/src/animate/engine.ts),
 * and the generator maps an effect to it only when that holds.
 */

export type Group = 'entrance' | 'attention' | 'exit';
export type Direction = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
export type Fill = 'none' | 'forwards' | 'backwards' | 'both';
export type Iterations = number | 'infinite';

/** The properties an effect animates. Values are CSS, exactly as written into the @keyframes. */
export type FrameProps = Partial<Record<'opacity' | 'transform' | 'filter', string>>;
/** One keyframe: the offsets (0–100) it sits at, and what it sets there. */
export type Frame = { at: number[]; props: FrameProps };

export type Preset = {
  /** The @keyframes name, and the class name until the visitor changes it. */
  key: string;
  label: string;
  group: Group;
  /** What it does, in one line. */
  d: string;
  frames: Frame[];
  /** transform-origin for the element, when the effect pivots somewhere other than its centre. */
  origin?: string;
  /** The timing it is meant to run with. Picking the effect sets these; the visitor can change all of them. */
  suggest: { duration: number; timing: string; iterations: Iterations; direction: Direction; fill: Fill };
};

const IN = { duration: 600, timing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' } as const;
const OUT = { duration: 500, timing: 'ease-in', iterations: 1, direction: 'normal', fill: 'both' } as const;
const two = (from: FrameProps, to: FrameProps): Frame[] => [{ at: [0], props: from }, { at: [100], props: to }];

export const PRESETS: Preset[] = [
  // ── Entrances: from somewhere else to where the element is ───────────────
  {
    key: 'fade-in', label: 'Fade in', group: 'entrance', d: 'Opacity from 0 to 1, nothing moves.',
    frames: two({ opacity: '0' }, { opacity: '1' }),
    suggest: { ...IN, duration: 500 },
  },
  {
    key: 'fade-up', label: 'Fade up', group: 'entrance', d: 'Fades in while rising 32px into place.',
    frames: two({ opacity: '0', transform: 'translateY(32px)' }, { opacity: '1', transform: 'translateY(0px)' }),
    suggest: IN,
  },
  {
    key: 'fade-down', label: 'Fade down', group: 'entrance', d: 'Fades in while dropping 32px into place.',
    frames: two({ opacity: '0', transform: 'translateY(-32px)' }, { opacity: '1', transform: 'translateY(0px)' }),
    suggest: IN,
  },
  {
    key: 'fade-left', label: 'Fade left', group: 'entrance', d: 'Fades in while moving 32px to the left, into place.',
    frames: two({ opacity: '0', transform: 'translateX(32px)' }, { opacity: '1', transform: 'translateX(0px)' }),
    suggest: IN,
  },
  {
    key: 'fade-right', label: 'Fade right', group: 'entrance', d: 'Fades in while moving 32px to the right, into place.',
    frames: two({ opacity: '0', transform: 'translateX(-32px)' }, { opacity: '1', transform: 'translateX(0px)' }),
    suggest: IN,
  },
  {
    key: 'zoom-in', label: 'Zoom in', group: 'entrance', d: 'Grows from 60% of its size as it fades in.',
    frames: two({ opacity: '0', transform: 'scale(0.6)' }, { opacity: '1', transform: 'scale(1)' }),
    suggest: { ...IN, duration: 500 },
  },
  {
    key: 'flip-in-x', label: 'Flip in X', group: 'entrance', d: 'Turns down into place about its horizontal axis, in perspective.',
    frames: two(
      { opacity: '0', transform: 'perspective(600px) rotateX(-90deg)' },
      { opacity: '1', transform: 'perspective(600px) rotateX(0deg)' },
    ),
    suggest: { ...IN, duration: 700 },
  },
  {
    key: 'flip-in-y', label: 'Flip in Y', group: 'entrance', d: 'Turns into place about its vertical axis, in perspective.',
    frames: two(
      { opacity: '0', transform: 'perspective(600px) rotateY(90deg)' },
      { opacity: '1', transform: 'perspective(600px) rotateY(0deg)' },
    ),
    suggest: { ...IN, duration: 700 },
  },
  {
    key: 'slide-in', label: 'Slide in', group: 'entrance', d: 'Slides in from the left by its own width, fully opaque.',
    frames: two({ transform: 'translateX(-100%)' }, { transform: 'translateX(0%)' }),
    suggest: { ...IN, duration: 500 },
  },
  {
    key: 'blur-in', label: 'Blur in', group: 'entrance', d: 'Comes into focus from a 12px blur as it fades in.',
    frames: two({ opacity: '0', filter: 'blur(12px)' }, { opacity: '1', filter: 'blur(0px)' }),
    suggest: { ...IN, duration: 700 },
  },
  {
    key: 'rotate-in', label: 'Rotate in', group: 'entrance', d: 'Turns 45° and grows from 80% as it fades in.',
    frames: two(
      { opacity: '0', transform: 'scale(0.8) rotate(-45deg)' },
      { opacity: '1', transform: 'scale(1) rotate(0deg)' },
    ),
    suggest: IN,
  },
  {
    key: 'bounce-in', label: 'Bounce in', group: 'entrance', d: 'Pops up past full size, settles back, then lands.',
    frames: [
      { at: [0], props: { opacity: '0', transform: 'scale(0.3)' } },
      { at: [50], props: { opacity: '1', transform: 'scale(1.08)' } },
      { at: [72], props: { transform: 'scale(0.96)' } },
      { at: [88], props: { transform: 'scale(1.02)' } },
      { at: [100], props: { opacity: '1', transform: 'scale(1)' } },
    ],
    suggest: { ...IN, duration: 800 },
  },
  {
    key: 'drop-in', label: 'Drop in', group: 'entrance', d: 'Falls from 64px above, overshoots a little, and settles.',
    frames: [
      { at: [0], props: { opacity: '0', transform: 'translateY(-64px)' } },
      { at: [55], props: { opacity: '1', transform: 'translateY(6px)' } },
      { at: [78], props: { transform: 'translateY(-3px)' } },
      { at: [100], props: { opacity: '1', transform: 'translateY(0px)' } },
    ],
    suggest: { ...IN, duration: 700 },
  },

  // ── Attention: starts and ends where it is, moves in between ─────────────
  {
    key: 'pulse', label: 'Pulse', group: 'attention', d: 'Swells to 106% and back, on a loop.',
    frames: [
      { at: [0, 100], props: { transform: 'scale(1)' } },
      { at: [50], props: { transform: 'scale(1.06)' } },
    ],
    suggest: { duration: 1200, timing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'none' },
  },
  {
    key: 'shake', label: 'Shake', group: 'attention', d: 'Side to side, each swing smaller than the last.',
    frames: [
      { at: [0, 100], props: { transform: 'translateX(0px)' } },
      { at: [12], props: { transform: 'translateX(-10px)' } },
      { at: [26], props: { transform: 'translateX(9px)' } },
      { at: [40], props: { transform: 'translateX(-7px)' } },
      { at: [54], props: { transform: 'translateX(5px)' } },
      { at: [68], props: { transform: 'translateX(-3px)' } },
      { at: [82], props: { transform: 'translateX(1px)' } },
    ],
    suggest: { duration: 700, timing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'none' },
  },
  {
    key: 'wobble', label: 'Wobble', group: 'attention', d: 'Sways and tilts side to side, dying away.',
    frames: [
      { at: [0, 100], props: { transform: 'translateX(0%) rotate(0deg)' } },
      { at: [15], props: { transform: 'translateX(-14%) rotate(-4deg)' } },
      { at: [32], props: { transform: 'translateX(10%) rotate(3deg)' } },
      { at: [48], props: { transform: 'translateX(-6%) rotate(-2deg)' } },
      { at: [64], props: { transform: 'translateX(3%) rotate(1deg)' } },
      { at: [80], props: { transform: 'translateX(-1%) rotate(-0.5deg)' } },
    ],
    suggest: { duration: 900, timing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'none' },
  },
  {
    key: 'heartbeat', label: 'Heartbeat', group: 'attention', d: 'Two quick beats, then a rest, on a loop.',
    frames: [
      { at: [0, 24, 56, 100], props: { transform: 'scale(1)' } },
      { at: [12], props: { transform: 'scale(1.12)' } },
      { at: [36], props: { transform: 'scale(1.1)' } },
    ],
    suggest: { duration: 1400, timing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'none' },
  },
  {
    key: 'jello', label: 'Jello', group: 'attention', d: 'Skews one way and the other, settling like a jelly.',
    frames: [
      { at: [0, 15, 100], props: { transform: 'skewX(0deg) skewY(0deg)' } },
      { at: [30], props: { transform: 'skewX(-9deg) skewY(-9deg)' } },
      { at: [45], props: { transform: 'skewX(5deg) skewY(5deg)' } },
      { at: [60], props: { transform: 'skewX(-2.5deg) skewY(-2.5deg)' } },
      { at: [75], props: { transform: 'skewX(1.2deg) skewY(1.2deg)' } },
      { at: [88], props: { transform: 'skewX(-0.5deg) skewY(-0.5deg)' } },
    ],
    suggest: { duration: 1000, timing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'none' },
  },
  {
    key: 'swing', label: 'Swing', group: 'attention', d: 'Hangs from its top edge and swings to rest.',
    origin: 'top center',
    frames: [
      { at: [0, 100], props: { transform: 'rotate(0deg)' } },
      { at: [20], props: { transform: 'rotate(14deg)' } },
      { at: [40], props: { transform: 'rotate(-9deg)' } },
      { at: [60], props: { transform: 'rotate(5deg)' } },
      { at: [80], props: { transform: 'rotate(-2deg)' } },
    ],
    suggest: { duration: 1000, timing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'none' },
  },
  {
    key: 'float', label: 'Float', group: 'attention', d: 'Drifts 10px up and back down, slowly, on a loop.',
    frames: [
      { at: [0, 100], props: { transform: 'translateY(0px)' } },
      { at: [50], props: { transform: 'translateY(-10px)' } },
    ],
    suggest: { duration: 3000, timing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'none' },
  },

  // ── Exits: from where the element is to gone ─────────────────────────────
  {
    key: 'fade-out', label: 'Fade out', group: 'exit', d: 'Opacity from 1 to 0, nothing moves.',
    frames: two({ opacity: '1' }, { opacity: '0' }),
    suggest: OUT,
  },
  {
    key: 'fade-out-up', label: 'Fade out up', group: 'exit', d: 'Fades out while rising 32px.',
    frames: two({ opacity: '1', transform: 'translateY(0px)' }, { opacity: '0', transform: 'translateY(-32px)' }),
    suggest: OUT,
  },
  {
    key: 'fade-out-down', label: 'Fade out down', group: 'exit', d: 'Fades out while dropping 32px.',
    frames: two({ opacity: '1', transform: 'translateY(0px)' }, { opacity: '0', transform: 'translateY(32px)' }),
    suggest: OUT,
  },
  {
    key: 'zoom-out', label: 'Zoom out', group: 'exit', d: 'Shrinks to 60% of its size as it fades out.',
    frames: two({ opacity: '1', transform: 'scale(1)' }, { opacity: '0', transform: 'scale(0.6)' }),
    suggest: OUT,
  },
  {
    key: 'flip-out-x', label: 'Flip out X', group: 'exit', d: 'Turns away about its horizontal axis, in perspective.',
    frames: two(
      { opacity: '1', transform: 'perspective(600px) rotateX(0deg)' },
      { opacity: '0', transform: 'perspective(600px) rotateX(90deg)' },
    ),
    suggest: { ...OUT, duration: 600 },
  },
  {
    key: 'slide-out', label: 'Slide out', group: 'exit', d: 'Slides out to the right by its own width, fully opaque.',
    frames: two({ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }),
    suggest: OUT,
  },
  {
    key: 'blur-out', label: 'Blur out', group: 'exit', d: 'Goes out of focus to a 12px blur as it fades out.',
    frames: two({ opacity: '1', filter: 'blur(0px)' }, { opacity: '0', filter: 'blur(12px)' }),
    suggest: { ...OUT, duration: 600 },
  },
];

export const GROUPS: { key: Group; label: string; d: string }[] = [
  { key: 'entrance', label: 'Entrances', d: 'From somewhere else to where the element is.' },
  { key: 'attention', label: 'Attention', d: 'Start and end where the element is; usually repeated.' },
  { key: 'exit', label: 'Exits', d: 'From where the element is to gone.' },
];

export const presetOf = (key: string): Preset => PRESETS.find((p) => p.key === key) ?? PRESETS[1];
export const presetsIn = (g: Group) => PRESETS.filter((p) => p.group === g);

/** The CSS easing keywords, then the two functions the generator builds from numbers. */
export const TIMING_KEYWORDS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'] as const;
export const TIMING_FUNCTIONS = ['cubic-bezier', 'steps'] as const;
export type TimingKind = (typeof TIMING_KEYWORDS)[number] | (typeof TIMING_FUNCTIONS)[number];
export const TIMING_KINDS: TimingKind[] = [...TIMING_KEYWORDS, ...TIMING_FUNCTIONS];

/** The positions steps() takes, the default first. */
export const JUMPS = ['jump-end', 'jump-start', 'jump-none', 'jump-both'] as const;
export type Jump = (typeof JUMPS)[number];

export const DIRECTIONS: Direction[] = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
export const FILLS: Fill[] = ['none', 'forwards', 'backwards', 'both'];

/**
 * Every animation longhand with its initial value (CSS Animations), and what
 * it does. The shorthand tab writes the same list.
 */
export const LONGHANDS: { prop: string; initial: string; d: string }[] = [
  { prop: 'animation-name', initial: 'none', d: 'Which @keyframes to run. Nothing runs without it.' },
  { prop: 'animation-duration', initial: '0s', d: 'How long one cycle takes. The default is zero (newer specs spell it auto, which is zero for an animation that runs on time), so a shorthand without a time does nothing you can see.' },
  { prop: 'animation-timing-function', initial: 'ease', d: 'The easing, applied to each stretch between two keyframes, not once across the whole cycle.' },
  { prop: 'animation-delay', initial: '0s', d: 'How long to wait before the first cycle. A negative delay starts part of the way through.' },
  { prop: 'animation-iteration-count', initial: '1', d: 'How many cycles: a number, fractions included, or infinite.' },
  { prop: 'animation-direction', initial: 'normal', d: 'Which way each cycle runs: normal, reverse, or alternate and alternate-reverse, which turn round every cycle.' },
  { prop: 'animation-fill-mode', initial: 'none', d: 'Whether the keyframes apply outside the cycles: backwards during the delay, forwards after the end, both for both.' },
  { prop: 'animation-play-state', initial: 'running', d: 'paused holds the animation where it is; running carries on from there.' },
];

/** The site's default for the generator: the first effect people reach for. */
export const DEFAULT_PRESET = 'fade-up';

/**
 * The generator's limits. Durations in milliseconds; the select offers whole
 * counts up to MAX_COUNT, and infinite.
 */
export const LIMITS = {
  duration: { min: 50, max: 5000, step: 50 },
  delay: { min: 0, max: 3000, step: 50 },
  maxCount: 10,
  maxSteps: 30,
};
