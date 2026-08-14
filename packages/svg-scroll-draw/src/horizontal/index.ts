import type { EasingName, TriggerConfig, ScrollDrawInstance } from '../core/types';
import { createAnimateEngine } from '../animate';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrollHorizontalOptions {
  /**
   * Total horizontal travel distance in pixels.
   *
   * Default: `track.scrollWidth` minus the width it is seen through — the
   * viewport, or the `scrollContainer`'s client width when one is given.
   */
  distance?: number;
  /**
   * Trigger window for the scroll → horizontal mapping.
   * Default: `{ start: 'top top', end: 'bottom bottom' }` — full container height.
   */
  trigger?: TriggerConfig;
  /** Easing for the horizontal movement. Default: `'linear'` (scrub feel). */
  easing?: EasingName | ((t: number) => number);
  /** Custom scroll container. Default: window. */
  scrollContainer?: string | Element;
  /**
   * Element whose height defines the scroll window for the scrub.
   *
   * Default: the container of the track's nearest `position: sticky` ancestor —
   * the `.outer` element in the CSS setup below, which is where the scroll room
   * actually lives. Falls back to the track itself when there is no sticky
   * ancestor.
   *
   * Why this is not the track: a sticky stage pins the track at exactly one
   * viewport tall, so measuring `top top` → `bottom bottom` against it gives
   * tStart === tEnd — a zero-length window, and a track that never moves.
   */
  triggerElement?: string | Element;
  /**
   * Honour `prefers-reduced-motion: reduce` by holding the track at its final
   * position instead of scrubbing. Default: **`false`** — unlike every other
   * API here, which defaults to `true`.
   *
   * The reasoning: this transform is scroll-linked scrubbing, not autonomous
   * motion. It advances only as the user scrolls, 1:1 with their input, so it is
   * direct manipulation rather than something that plays at them. And the
   * alternative is worse than the motion — the panels are only reachable *via*
   * the transform, inside a sticky `overflow: hidden` container, so applying a
   * final state (or none at all) silently hides all of the content except one
   * panel from exactly the users who asked for less motion.
   *
   * Set to `true` if your layout has an accessible non-transform fallback and you
   * would rather drop the movement.
   */
  respectReducedMotion?: boolean;
  onProgress?: (progress: number) => void;
}

export interface ScrollHorizontalInstance extends ScrollDrawInstance {
  /** Recalculate travel distance after layout change. */
  refresh: () => void;
}

const NOOP: ScrollHorizontalInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0, refresh: () => {},
};

/**
 * Drive horizontal movement (translateX) from vertical scroll.
 *
 * The Apple / Stripe "scroll to reveal horizontal sections" pattern.
 * You handle the sticky + overflow CSS; `scrollHorizontal` drives the translateX.
 *
 * Minimal CSS setup:
 *   .outer  { height: 400vh; }
 *   .sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
 *   .track  { display: flex; width: max-content; }
 *
 * @example
 * scrollHorizontal('.track', {
 *   distance: 3 * window.innerWidth,
 *   trigger:  { start: 'top top', end: 'bottom bottom' },
 *   easing:   'linear',
 * });
 */
export function scrollHorizontal(
  track: string | Element,
  options: ScrollHorizontalOptions = {},
): ScrollHorizontalInstance {
  if (typeof window === 'undefined') return NOOP;

  const el = typeof track === 'string' ? document.querySelector(track) : track;
  if (!el) {
    warn('scrollHorizontal: track element not found:', track);
    return NOOP;
  }

  const htmlEl = el as HTMLElement;
  const {
    easing          = 'linear',
    trigger         = { start: 'top top', end: 'bottom bottom' },
    scrollContainer,
    respectReducedMotion = false,
    onProgress,
  } = options;

  /**
   * The width the track is seen through.
   *
   * With a custom `scrollContainer` that is the container's own client width, not
   * the window's. Measuring against `window.innerWidth` regardless made the
   * default `distance` wrong by the difference for every nested-container caller:
   * on a container narrower than the window it overshoots, dragging the last panel
   * past the left edge and leaving empty space where content should be, and on a
   * wider one it stops short. Callers had to pass `distance` by hand, which is not
   * what the option's documented default says.
   */
  function viewportWidth(): number {
    const scrollEl =
      typeof scrollContainer === 'string'
        ? document.querySelector(scrollContainer)
        : (scrollContainer ?? null);
    return scrollEl ? scrollEl.clientWidth : window.innerWidth;
  }

  function resolveDistance(): number {
    return options.distance ?? (htmlEl.scrollWidth - viewportWidth());
  }

  /**
   * The element that supplies the scroll length.
   *
   * The track cannot: its sticky parent pins it at one viewport tall, so the
   * default `top top` → `bottom bottom` window collapses to zero length against
   * it and the scrub never advances. The scroll room belongs to the container of
   * the sticky stage — `.outer` in the documented setup — so that is what the
   * trigger is measured from.
   */
  function resolveTriggerElement(): Element {
    if (options.triggerElement !== undefined) {
      const explicit =
        typeof options.triggerElement === 'string'
          ? document.querySelector(options.triggerElement)
          : options.triggerElement;
      if (explicit) return explicit;
      warn('scrollHorizontal: triggerElement not found:', options.triggerElement);
    }

    for (let node = htmlEl.parentElement; node; node = node.parentElement) {
      if (window.getComputedStyle(node).position === 'sticky') {
        return node.parentElement ?? node;
      }
    }

    // No sticky stage — the caller is driving their own layout, so measure the
    // track itself, as this API always has.
    return htmlEl;
  }

  let distance = resolveDistance();
  let triggerEl = resolveTriggerElement();
  let inner = createAnimateEngine(htmlEl, buildOptions(distance, triggerEl));

  function buildOptions(dist: number, triggerFrom: Element) {
    return {
      props: { transform: [`translateX(0px)`, `translateX(${-dist}px)`] } as Record<string, [string, string]>,
      trigger,
      easing,
      native: false,
      respectReducedMotion,
      ...(triggerFrom !== htmlEl && { triggerElement: triggerFrom }),
      ...(scrollContainer !== undefined && { scrollContainer }),
      ...(onProgress      !== undefined && { onProgress }),
    };
  }

  return {
    destroy()  { inner.destroy(); },
    replay()   { inner.replay(); },
    pause()    { inner.pause(); },
    resume()   { inner.resume(); },
    seek(p)    { inner.seek(p); },
    getProgress() { return inner.getProgress(); },
    refresh() {
      inner.destroy();
      distance  = resolveDistance();
      triggerEl = resolveTriggerElement();
      inner     = createAnimateEngine(htmlEl, buildOptions(distance, triggerEl));
    },
  };
}
