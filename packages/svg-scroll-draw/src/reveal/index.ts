import type { EasingName, TriggerConfig } from '../core/types';
import { createAnimateEngine } from '../animate';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrollRevealFrom {
  /** Start opacity (0–1). Animates to 1. */
  opacity?: number;
  /** Start translateX in px. Animates to 0. */
  x?: number;
  /** Start translateY in px. Animates to 0. */
  y?: number;
  /** Start scale. Animates to 1. */
  scale?: number;
  /** Start rotate in degrees. Animates to 0. */
  rotate?: number;
  /** Start rotateX in degrees. Animates to 0. */
  rotateX?: number;
  /** Start rotateY in degrees. Animates to 0. */
  rotateY?: number;
}

export type ScrollRevealPreset =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'scale'
  | 'flip'
  | 'flipX';

export interface ScrollRevealOptions {
  /**
   * Named preset for the reveal animation. Default: `'fadeUp'`.
   * Custom `from` overrides the preset when both are provided.
   *
   * Presets:
   * - `fadeUp`    — opacity 0→1, y +32→0 (default)
   * - `fadeDown`  — opacity 0→1, y -32→0
   * - `fadeLeft`  — opacity 0→1, x +32→0
   * - `fadeRight` — opacity 0→1, x -32→0
   * - `scale`     — opacity 0→1, scale 0.88→1
   * - `flip`      — opacity 0→1, rotateX 20→0
   * - `flipX`     — opacity 0→1, rotateY 20→0
   */
  preset?: ScrollRevealPreset;
  /** Custom start state. Keys: opacity, x, y, scale, rotate, rotateX, rotateY. */
  from?: ScrollRevealFrom;
  /**
   * Delay between each element's animation start (seconds).
   * Elements are staggered by offsetting their trigger window.
   * Default: 0.08.
   */
  stagger?: number;
  /** Animation easing. Default: `'ease-out'`. */
  easing?: EasingName | ((t: number) => number);
  /** Freeze at max progress — don't reverse on scroll back. Default: true. */
  once?: boolean;
  /** Override the default trigger window. */
  trigger?: TriggerConfig;
  /** Fires when the first element enters the trigger zone. */
  onEnter?: () => void;
  /** Fires when the last element leaves the trigger zone. */
  onLeave?: () => void;
}

export interface ScrollRevealInstance {
  /** Remove all animations and restore original styles. */
  destroy: () => void;
}

// ── Preset definitions ────────────────────────────────────────────────────────

const REVEAL_PRESETS: Record<ScrollRevealPreset, ScrollRevealFrom> = {
  fadeUp:    { opacity: 0, y: 32 },
  fadeDown:  { opacity: 0, y: -32 },
  fadeLeft:  { opacity: 0, x: 32 },
  fadeRight: { opacity: 0, x: -32 },
  scale:     { opacity: 0, scale: 0.88 },
  flip:      { opacity: 0, rotateX: 20 },
  flipX:     { opacity: 0, rotateY: 20 },
};

// ── from → scrollAnimate props ────────────────────────────────────────────────

function fromToProps(
  from: ScrollRevealFrom,
): Record<string, [string | number, string | number]> {
  const result: Record<string, [string | number, string | number]> = {};

  if (from.opacity !== undefined) {
    result.opacity = [from.opacity, 1];
  }

  const fromParts: string[] = [];
  const toParts:   string[] = [];

  if (from.x       !== undefined) { fromParts.push(`translateX(${from.x}px)`);        toParts.push('translateX(0px)'); }
  if (from.y       !== undefined) { fromParts.push(`translateY(${from.y}px)`);        toParts.push('translateY(0px)'); }
  if (from.scale   !== undefined) { fromParts.push(`scale(${from.scale})`);            toParts.push('scale(1)'); }
  if (from.rotate  !== undefined) { fromParts.push(`rotate(${from.rotate}deg)`);       toParts.push('rotate(0deg)'); }
  if (from.rotateX !== undefined) { fromParts.push(`rotateX(${from.rotateX}deg)`);    toParts.push('rotateX(0deg)'); }
  if (from.rotateY !== undefined) { fromParts.push(`rotateY(${from.rotateY}deg)`);    toParts.push('rotateY(0deg)'); }

  if (fromParts.length > 0) {
    result.transform = [fromParts.join(' '), toParts.join(' ')];
  }

  return result;
}

// ── Element resolver ──────────────────────────────────────────────────────────

function resolveElements(input: string | NodeList | Element[]): Element[] {
  if (typeof input === 'string') return Array.from(document.querySelectorAll(input));
  if (input instanceof NodeList) return Array.from(input) as Element[];
  return input;
}

// ── Public API ────────────────────────────────────────────────────────────────

const NOOP: ScrollRevealInstance = { destroy: () => {} };

/**
 * Reveal elements as they scroll into view.
 *
 * The zero-config replacement for AOS, ScrollReveal.js, and GSAP + ScrollTrigger
 * for the most common scroll animation use case — in one function call.
 *
 * @example
 * // Fade up (default)
 * scrollReveal('.card');
 *
 * // Custom from state
 * scrollReveal('.feature', { from: { opacity: 0, y: 40, scale: 0.95 } });
 *
 * // Named preset with stagger
 * scrollReveal('.item', { preset: 'fadeLeft', stagger: 0.1 });
 */
export function scrollReveal(
  target: string | NodeList | Element[],
  options: ScrollRevealOptions = {},
): ScrollRevealInstance {
  if (typeof window === 'undefined') return NOOP;

  const els = resolveElements(target);
  if (!els.length) {
    warn('scrollReveal: no elements found:', target);
    return NOOP;
  }

  const {
    preset  = 'fadeUp',
    from,
    stagger = 0.08,
    easing  = 'ease-out',
    once    = true,
    trigger,
    onEnter,
    onLeave,
  } = options;

  const fromState = { ...REVEAL_PRESETS[preset], ...from };
  const props     = fromToProps(fromState);

  // Stagger: offset each element's trigger start slightly later in the viewport.
  // This creates a cascade effect for lists and grids — element 0 starts at
  // "top 88%", element 1 at "top 84%", etc. (up to a 40% max offset so
  // late-page elements still animate).
  const staggerStep = Math.min(stagger * 4, 4); // viewport-% per element, capped at 4%

  const instances = els.map((el, i) => {
    const startPct = Math.max(50, 88 - i * staggerStep);
    const endPct   = Math.max(20, startPct - 35);

    return createAnimateEngine(el, {
      props,
      easing,
      once,
      native: false,
      trigger: trigger ?? {
        start: `top ${startPct}%`,
        end:   `top ${endPct}%`,
      },
      onEnter:  i === 0             ? onEnter  : undefined,
      onLeave:  i === els.length - 1 ? onLeave  : undefined,
    });
  });

  return {
    destroy() {
      instances.forEach(inst => inst.destroy());
    },
  };
}
