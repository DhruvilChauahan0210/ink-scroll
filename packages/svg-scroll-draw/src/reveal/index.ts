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
   * How far behind its neighbour each element in the same row starts, as a
   * fraction of the reveal window (0–1). At `0.15` each card begins 15% of the
   * way into the previous card's reveal; `0` reveals a row all at once.
   *
   * Rows are read from the layout: elements whose tops line up (a grid row, a
   * line of badges) cascade one after another, and each new row starts its own
   * count — its place further down the page already staggers it. A row's last
   * element never starts more than one full window after its first. The offset
   * applies on top of a custom `trigger` as well. Default: 0.15.
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

// ── Stagger ───────────────────────────────────────────────────────────────────

/** A trigger split into [element anchor, viewport anchor as % of the viewport]. */
function anchors(trigger: string): [string, number] {
  const p = trigger.trim().split(/\s+/);
  const [el, vp] = p.length > 1 ? p : /%$/.test(p[0]) ? ['top', p[0]] : [p[0], 'bottom'];
  return [el, /%$/.test(vp) ? parseFloat(vp) : vp === 'top' ? 0 : vp === 'center' ? 50 : 100];
}

/** The same trigger with its viewport line moved up by `by` percent, so it fires later. */
function shift(trigger: string, by: number): string {
  const [el, vp] = anchors(trigger);
  return `${el} ${+Math.max(0, vp - by).toFixed(3)}%`;
}

/**
 * Each element's place within its row: elements whose tops line up count 0, 1, 2…
 * in DOM order, and one further down starts a new row at 0. Counting per row is
 * what keeps a long list from being pushed ever further down the viewport, which
 * a plain DOM index did.
 */
function rowIndices(els: Element[]): number[] {
  let top = NaN, height = 0, n = 0;
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    if (!(Math.abs(r.top - top) <= Math.max(8, Math.min(r.height, height || r.height) / 2))) {
      top = r.top; height = r.height; n = 0;
    } else n++;
    return n;
  });
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
    stagger = 0.15,
    easing  = 'ease-out',
    once    = true,
    trigger,
    onEnter,
    onLeave,
  } = options;

  const fromState = { ...REVEAL_PRESETS[preset], ...from };
  const props     = fromToProps(fromState);

  // Stagger shifts each element's window later by a fraction of the window
  // itself, counted within its row and capped at one window. It used to be a
  // flat step of `stagger × 4`% of the viewport per DOM index (0.32% at the
  // default — no visible cascade), and a custom trigger dropped it entirely.
  const start  = trigger?.start ?? 'top 88%';
  const end    = trigger?.end ?? 'top 53%';
  const span   = Math.abs(anchors(start)[1] - anchors(end)[1]);
  const step   = Math.min(Math.max(stagger, 0), 1) * span;
  const index  = step > 0 ? rowIndices(els) : els.map(() => 0);

  const instances = els.map((el, i) => {
    const by = Math.min(index[i] * step, span);

    return createAnimateEngine(el, {
      props,
      easing,
      once,
      native: false,
      trigger: by > 0
        ? { start: shift(start, by), end: shift(end, by) }
        : { start, end },
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
