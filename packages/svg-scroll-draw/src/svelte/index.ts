import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions };

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
  let instance: ScrollDrawInstance = createEngine(node, options);

  return {
    update(newOptions: ScrollDrawOptions) {
      instance.destroy();
      instance = createEngine(node, newOptions);
    },
    destroy() {
      instance.destroy();
    },
  };
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
  let instance: ScrollDrawInstance = createAnimateEngine(node, options);

  return {
    update(newOptions: ScrollAnimateOptions) {
      instance.destroy();
      instance = createAnimateEngine(node, newOptions);
    },
    destroy() {
      instance.destroy();
    },
  };
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
  let instance: ScrollDrawInstance = scrollCounter(node, options);

  return {
    update(newOptions: ScrollCounterOptions) {
      instance.destroy();
      instance = scrollCounter(node, newOptions);
    },
    destroy() {
      instance.destroy();
    },
  };
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
  let instance: ScrollDrawInstance = scrollVideo(node, options);

  return {
    update(newOptions: ScrollVideoOptions) {
      instance.destroy();
      instance = scrollVideo(node, newOptions);
    },
    destroy() {
      instance.destroy();
    },
  };
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
  let instance: ScrollDrawInstance = scrollText(node, options);

  return {
    update(newOptions: ScrollTextOptions) {
      instance.destroy();
      instance = scrollText(node, newOptions);
    },
    destroy() {
      instance.destroy();
    },
  };
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
