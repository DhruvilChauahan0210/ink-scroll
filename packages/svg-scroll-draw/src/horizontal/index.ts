import type { Easing, TriggerConfig, ScrollDrawInstance } from '../core/types';
import { createAnimateEngine } from '../animate/engine';
import { warn } from '../core/env';
import { watchLayout } from '../core/layout-watch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrollHorizontalOptions {
  /**
   * Total horizontal travel distance in pixels.
   *
   * Default: `track.scrollWidth` minus the width it is seen through — the
   * content box of the sticky stage around the track; without one, the
   * `scrollContainer`'s client width, or the viewport's with any scrollbar left
   * out. Re-measured whenever the layout changes, so leave it out unless you
   * want a fixed number: a number you pass is used as given.
   */
  distance?: number;
  /**
   * Trigger window for the scroll → horizontal mapping.
   * Default: `{ start: 'top top', end: 'bottom bottom' }` — full container height.
   */
  trigger?: TriggerConfig;
  /** Easing for the horizontal movement. Default: `'linear'` (scrub feel). */
  easing?: Easing;
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
   * position instead of scrubbing, also when the reader turns it on while the
   * page is open. Default: **`false`** — unlike every other
   * API here, which defaults to `true`.
   *
   * The reasoning: this transform is scroll-linked scrubbing, not autonomous
   * motion. It advances only as the user scrolls, 1:1 with their input, so it is
   * direct manipulation rather than something that plays at them. And the
   * alternative is worse than the motion — the panels are only reachable *via*
   * the transform, inside a sticky `overflow: clip` stage, so applying a
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
  /**
   * Re-measure now. The strip already re-measures 150 ms after the window, the
   * page, the track or its runway changes size; call this when something else
   * moved it.
   */
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
 *   .sticky { position: sticky; top: 0; height: 100vh; overflow: clip; }
 *   .track  { display: flex; width: max-content; }
 *
 * `overflow: clip`, not `hidden`: a hidden stage is still a scroll container,
 * so Tab to a panel off to the side scrolls the stage itself and leaves the
 * strip shifted against the page. Keyboard users then need the page scrolled
 * to the focused panel; the horizontal-scroll generator writes that handler.
 *
 * @example
 * // Measures its own travel (the track's width less the stage's) and follows
 * // the layout: pass `distance` only for a fixed number of pixels.
 * scrollHorizontal('.track');
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

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  /** The track's nearest `position: sticky` ancestor: the stage it is seen through. */
  function stickyStage(): HTMLElement | null {
    for (let node = htmlEl.parentElement; node; node = node.parentElement) {
      if (window.getComputedStyle(node).position === 'sticky') return node;
    }
    return null;
  }

  /**
   * The width the track is seen through.
   *
   * The sticky stage's content box, when there is one. Measuring the window
   * instead was only right for a stage exactly as wide as the window: a stage in
   * a 1000px page container on a 1440px window never showed the last 440px of
   * the last panel, and the same went for any custom `scrollContainer` narrower
   * or wider than the window — every such caller had to pass `distance` by hand.
   *
   * Without a stage, the scroll container's client width, or the viewport's.
   * That is `documentElement.clientWidth`, not `window.innerWidth`, which counts
   * a classic scrollbar: on Windows, and on macOS set to always show them, the
   * strip stopped with the last 15px of its last panel under the scrollbar.
   */
  function viewportWidth(): number {
    const stage = stickyStage();
    if (stage) {
      const cs = window.getComputedStyle(stage);
      return stage.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    }
    if (scrollEl) return scrollEl.clientWidth;
    return document.documentElement.clientWidth || window.innerWidth;
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

    const stage = stickyStage();
    if (stage) return stage.parentElement ?? stage;

    // No sticky stage — the caller is driving their own layout, so measure the
    // track itself, as this API always has.
    return htmlEl;
  }

  let distance  = resolveDistance();
  let triggerEl = resolveTriggerElement();
  let inner     = createAnimateEngine(htmlEl, buildOptions(distance, triggerEl));
  let layout    = layoutKey();
  /** Progress set by `seek()` or held by `pause()`, carried across a rebuild. */
  let held: number | null = null;

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

  /** What the scrub was built from: the travel, and where the runway sits and how tall it is. */
  function layoutKey(): string {
    const r = triggerEl.getBoundingClientRect();
    const top = scrollEl
      ? r.top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop
      : r.top + window.scrollY;
    return `${resolveDistance()} ${Math.round(top)} ${Math.round(r.height)}`;
  }

  function rebuild(): void {
    inner.destroy();
    const next = resolveTriggerElement();
    const moved = next !== triggerEl;
    distance  = resolveDistance();
    triggerEl = next;
    inner     = createAnimateEngine(htmlEl, buildOptions(distance, triggerEl));
    layout    = layoutKey();
    if (held !== null) inner.seek(held);
    if (moved) watch();
  }

  /*
   * Follow the layout. Everything above was measured once, and the page keeps
   * changing after that: a window resized or a phone turned left the strip
   * 1200px short of its last panel, or 1200px past it over empty stage; an
   * image loading inside a panel widened the track and hid 559px of the last
   * one; and a hero image loading above moved the runway 480px down, so the
   * strip was a fifth of the way along before the stage had even pinned. No
   * window resize event fires for either of the last two.
   *
   * So the window, the page, the track and the runway are all watched, and the
   * scrub is rebuilt — debounced, and only when the travel or the runway really
   * moved. Only `transform` is written here, which no ResizeObserver sees, so
   * the rebuild cannot feed itself.
   */
  let timer: ReturnType<typeof setTimeout> | undefined;
  function relayout(): void {
    if (resolveTriggerElement() !== triggerEl || layoutKey() !== layout) rebuild();
  }
  function onLayout(): void {
    clearTimeout(timer);
    timer = setTimeout(relayout, 150);
  }
  window.addEventListener('resize', onLayout);
  window.addEventListener('orientationchange', onLayout);

  let unwatch = () => {};
  function watch(): void {
    unwatch();
    unwatch = watchLayout([htmlEl, triggerEl], onLayout);
  }
  watch();

  return {
    destroy() {
      clearTimeout(timer);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('orientationchange', onLayout);
      unwatch();
      inner.destroy();
    },
    replay()   { held = null; inner.replay(); },
    pause()    { inner.pause(); held = inner.getProgress(); },
    resume()   { held = null; inner.resume(); },
    seek(p)    { inner.seek(p); held = inner.getProgress(); },
    getProgress() { return inner.getProgress(); },
    refresh()  { rebuild(); },
  };
}
