import { onMount, onCleanup } from 'solid-js';
import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

export type { ScrollDrawOptions };

/**
 * SolidJS hook — returns a ref setter to attach to any container element.
 *
 * @example
 * import { useScrollDraw } from 'svg-scroll-draw/solid';
 *
 * function Hero() {
 *   const ref = useScrollDraw({ easing: 'spring', fade: true });
 *   return <div ref={ref}><svg>...</svg></div>;
 * }
 */
export function useScrollDraw(options: ScrollDrawOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLElement) => { el = node; };
}

/**
 * Returns both the ref setter and a getter for the live instance,
 * so you can call instance.replay() from component logic.
 *
 * @example
 * const { ref, getInstance } = createScrollDraw({ easing: 'ease-out' });
 * <div ref={ref}><svg>...</svg></div>
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollDraw(options: ScrollDrawOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLElement) => { el = node; },
    getInstance: () => instance,
  };
}
