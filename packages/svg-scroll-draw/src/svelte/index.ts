import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

export type { ScrollDrawOptions };

/**
 * Svelte action — apply to any container element wrapping an SVG.
 *
 * @example
 * <script>
 *   import { scrollDraw } from 'svg-scroll-draw/svelte';
 * </script>
 *
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
 * Composable helper — returns an action and the live instance so you can
 * call `instance.replay()` from your Svelte component logic.
 *
 * @example
 * <script>
 *   import { createScrollDraw } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollDraw({ easing: 'spring' });
 * </script>
 *
 * <div use:action>
 *   <svg>...</svg>
 * </div>
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
