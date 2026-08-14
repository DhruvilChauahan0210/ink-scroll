/**
 * The shared harness for the framework-wrapper fixtures.
 *
 * Every wrapper — React, Vue, Solid, Svelte, Angular, Astro, Nuxt, the web
 * component — is a thin adapter over the same engines, so they are all held to
 * the same contract and tested by the same spec:
 *
 *   1. mounting starts a live engine (the drawing and the fade track scroll)
 *   2. unmounting stops it: no element, no observers, no frame loop
 *   3. mounting again works, because a route change is not a page load
 *   4. the wrapper says whether changing an option re-initialises the engine,
 *      and that claim is checked rather than assumed
 *
 * Each fixture supplies only how to mount and unmount in its own framework, plus
 * that one claim. Everything measured lives here so the numbers mean the same
 * thing across all eight.
 *
 * The mounted markup has to be:
 *   `.fw-draw` — 300px tall, containing an <svg><path>
 *   `.fw-anim` — 200px tall, animated from opacity 0 to 1
 * positioned by the fixture's own CSS, so the trigger arithmetic in the spec is
 * identical for every framework.
 */
import { drawnFraction, opacityOf, docTop, installLeakCounters, publish } from './_probe.mjs';

export const DRAW_SVG = '<svg viewBox="0 0 200 100" preserveAspectRatio="none">' +
  '<path d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50" fill="none" stroke="#000" stroke-width="3"></path>' +
  '</svg>';

/** Options every fixture passes, so the engines are configured identically. */
export const DRAW_OPTIONS = { easing: 'linear', native: false };
export const ANIM_OPTIONS = {
  props: { opacity: [0, 1] },
  easing: 'linear',
  native: false,
};

/**
 * @param {object} api
 * @param {() => void} api.mount        Render the components into #root.
 * @param {() => void} api.unmount      Tear them down the way the framework does.
 * @param {(speed: number) => void} [api.setSpeed]
 *        Change the draw's `speed` option through the framework's own prop /
 *        parameter path. Omit when the wrapper has no way to express it.
 * @param {boolean} api.reactiveOptions
 *        Whether `setSpeed` is expected to reach the running engine. Only the
 *        Svelte actions re-create on an option change; the component and hook
 *        wrappers read their options once, on mount. Stated here so the spec can
 *        check the claim instead of encoding one framework's behaviour.
 */
export function setupFramework(api) {
  // Before the first mount, or a leaked loop from the first render is invisible.
  const counters = installLeakCounters();

  api.mount();

  const drawEl = () => document.querySelector('.fw-draw');
  const drawPath = () => document.querySelector('.fw-draw path');
  const animEl = () => document.querySelector('.fw-anim');

  publish({
    read: () => {
      const path = drawPath();
      const anim = animEl();
      return {
        scrollY: window.scrollY,
        mounted: !!path && (api.hasAnim === false || !!anim),
        drawn: path ? drawnFraction(path) : null,
        opacity: anim ? opacityOf(anim) : null,
        liveObservers: counters.liveObservers(),
      };
    },

    geometry: () => ({
      viewportHeight: window.innerHeight,
      drawTop: drawEl() ? docTop(drawEl()) : null,
      drawHeight: drawEl()?.offsetHeight ?? null,
      animTop: animEl() ? docTop(animEl()) : null,
      animHeight: animEl()?.offsetHeight ?? null,
      pathLength: drawPath()?.getTotalLength() ?? null,
    }),

    contract: () => ({
      reactiveOptions: !!api.reactiveOptions && !!api.setSpeed,
      // The web component is the one wrapper with no scrollAnimate equivalent:
      // the package ships a single custom element.
      hasAnim: api.hasAnim !== false,
    }),

    mount: () => api.mount(),
    unmount: () => api.unmount(),
    setSpeed: (v) => api.setSpeed?.(v),

    /** Frames of animation work over `n` frames — 0 once everything is torn down. */
    ticksOver: (n) => counters.ticksOver(n),
  });
}
