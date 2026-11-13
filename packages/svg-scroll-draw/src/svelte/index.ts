import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { framesKey, checkLabel, type FramesInput } from '../frames/wrapper';
import { startFrames } from '../frames/start';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollFramesOptions } from '../frames';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollFramesOptions, ScrollTextOptions };

// ── The engine behind each action ────────────────────────────────────────────

/**
 * Svelte calls `update()` whenever the parameter object is a new one — with an
 * inline `use:scrollDraw={{ … }}` that is every time anything in the expression
 * changes. The engine is rebuilt only when an option really changed, and
 * callbacks are read live (`liveFns`), so a new arrow alone never rebuilds.
 * `keyOf` is that fingerprint: scrollFrames passes its own, which reads a
 * `frames` function by the URLs it gives.
 */
function action<E extends Element, O extends object>(
  node: E,
  options: O,
  create: (el: E, options: O, raw: O) => ScrollDrawInstance,
  keyOf: (options: O) => string = optionsKey,
) {
  let latest = options;
  let key = keyOf(options);
  let instance = create(node, liveFns(options, () => latest), options);
  return {
    update(next: O) {
      latest = next;
      const nextKey = keyOf(next);
      if (nextKey === key) return;
      key = nextKey;
      instance.destroy();
      instance = create(node, liveFns(next, () => latest), next);
    },
    destroy() {
      instance.destroy();
    },
  };
}

// ── scrollDraw ────────────────────────────────────────────────────────────────

/**
 * Svelte action — apply to any container element wrapping an SVG.
 *
 * @example
 * <div use:scrollDraw={{ easing: 'ease-out', speed: 1.2, fade: true }}>
 *   <svg>...</svg>
 * </div>
 */
export function scrollDraw(node: HTMLElement, options: ScrollDrawOptions = {}) {
  return action(node, options, createEngine);
}

/**
 * Returns an action and a getter for the live instance.
 *
 * @example
 * <script>
 *   import { createScrollDraw } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollDraw({ easing: 'spring' });
 * </script>
 * <div use:action><svg>...</svg></div>
 * <button on:click={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollDraw(options: ScrollDrawOptions = {}) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLElement) {
    instance = createEngine(node, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}

// ── scrollAnimate ─────────────────────────────────────────────────────────────

/**
 * Svelte action — animate any CSS property on any element driven by scroll.
 *
 * @example
 * <div use:scrollAnimate={{ props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] }, easing: 'ease-out', once: true }}>
 *   ...
 * </div>
 */
export function scrollAnimate(node: HTMLElement, options: ScrollAnimateOptions) {
  return action(node, options, createAnimateEngine);
}

/**
 * Returns an action and a getter for the live instance.
 *
 * @example
 * <script>
 *   import { createScrollAnimate } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollAnimate({
 *     props: { opacity: [0, 1] }, easing: 'ease-out', once: true,
 *   });
 * </script>
 * <div use:action>...</div>
 * <button on:click={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollAnimate(options: ScrollAnimateOptions) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLElement) {
    instance = createAnimateEngine(node, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}

// ── scrollCounter ─────────────────────────────────────────────────────────────

/**
 * Svelte action — animate a number from `from` to `to` as the element scrolls in.
 *
 * @example
 * <span use:scrollCounterAction={{ to: 1250000, format: n => '$' + Math.round(n).toLocaleString(), once: true }} />
 */
export function scrollCounterAction(node: HTMLElement, options: ScrollCounterOptions) {
  return action(node, options, scrollCounter);
}

/**
 * Returns an action and a getter for the live counter instance.
 *
 * @example
 * <script>
 *   import { createScrollCounter } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollCounter({ to: 1000, once: true });
 * </script>
 * <span use:action />
 */
export function createScrollCounter(options: ScrollCounterOptions) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLElement) {
    instance = scrollCounter(node, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}

// ── scrollVideoAction ─────────────────────────────────────────────────────────

/**
 * Svelte action — tie a <video> element's currentTime to scroll.
 *
 * @example
 * <video use:scrollVideoAction={{ trigger: { start: 'top top', end: 'bottom top' } }}
 *   src="/hero.mp4" muted playsinline preload="auto" />
 */
export function scrollVideoAction(node: HTMLVideoElement, options: ScrollVideoOptions = {}) {
  return action(node, options, scrollVideo);
}

/**
 * Returns an action and a getter for the live video instance.
 *
 * @example
 * <script>
 *   import { createScrollVideo } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollVideo({ once: false });
 * </script>
 * <video use:action src="/hero.mp4" muted playsinline preload="auto" />
 */
export function createScrollVideo(options: ScrollVideoOptions = {}) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLVideoElement) {
    instance = scrollVideo(node, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}

// ── scrollFramesAction ────────────────────────────────────────────────────────

/**
 * Svelte action — scrub an image sequence on a <canvas> with the scroll
 * (scrollFrames). The canvas is yours, so give it role="img" and an
 * aria-label saying what the frames show; in development the action warns
 * when it has no name (unless it is aria-hidden="true" or role="presentation").
 *
 * An inline parameter is fine: `update()` starts a new film only when the URLs
 * (a `frames` function is read by the URLs it gives for `count`) or another
 * option changed, and callbacks are read live. `triggerElement` takes an
 * element or a selector, found when the film starts.
 *
 * @example
 * <section id="track" style="height: 400vh">
 *   <div style="position: sticky; top: 0; height: 100vh">
 *     <canvas role="img" aria-label="The headphones turning"
 *       use:scrollFramesAction={{ frames: (i) => `/film/${i + 1}.jpg`, count: 120,
 *         triggerElement: '#track', trigger: { start: 'top top', end: 'bottom bottom' } }} />
 *   </div>
 * </section>
 */
export function scrollFramesAction(node: HTMLCanvasElement, options: FramesInput) {
  checkLabel(node, 'scrollFramesAction');
  return action(node, options, startFrames, framesKey);
}

/**
 * Returns an action and a getter for the live film instance. Its options are
 * read once, like the other create* helpers.
 *
 * @example
 * <script>
 *   import { createScrollFrames } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollFrames({ frames: urls });
 * </script>
 * <canvas use:action role="img" aria-label="The headphones turning" />
 */
export function createScrollFrames(options: FramesInput) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLCanvasElement) {
    checkLabel(node, 'createScrollFrames');
    instance = startFrames(node, options, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}

// ── scrollTextAction ──────────────────────────────────────────────────────────

/**
 * Svelte action — split text and stagger-animate each piece on scroll.
 *
 * @example
 * <h2 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>
 *   Animate on scroll.
 * </h2>
 */
export function scrollTextAction(node: HTMLElement, options: ScrollTextOptions = {}) {
  return action(node, options, scrollText);
}

/**
 * Returns an action and a getter for the live text instance.
 *
 * @example
 * <script>
 *   import { createScrollText } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollText({ split: 'chars', stagger: 0.03 });
 * </script>
 * <p use:action>Hello world.</p>
 */
export function createScrollText(options: ScrollTextOptions = {}) {
  let instance: ScrollDrawInstance | null = null;

  function action(node: HTMLElement) {
    instance = scrollText(node, options);
    return {
      destroy() { instance?.destroy(); instance = null; },
    };
  }

  return {
    action,
    getInstance: () => instance,
  };
}
