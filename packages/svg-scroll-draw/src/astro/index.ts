import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

export { scrollDraw } from '../index';
export type { ScrollDrawOptions, ScrollDrawInstance };

/**
 * Auto-initialises all elements with a [data-scroll-draw] attribute on the page.
 * Options are read from the data-scroll-draw-options JSON attribute.
 *
 * @example
 * // In your Astro component:
 * <div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","fade":true}'>
 *   <svg>...</svg>
 * </div>
 *
 * <script>
 *   import { initScrollDraw } from 'svg-scroll-draw/astro';
 *   initScrollDraw();
 * </script>
 */
export function initScrollDraw(root: Element | Document = document): ScrollDrawInstance[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-draw]')).map((el) => {
    let opts: ScrollDrawOptions = {};
    try {
      const raw = el.dataset.scrollDrawOptions ?? el.dataset.scrollDrawoptions ?? '';
      if (raw) opts = JSON.parse(raw);
    } catch { /* ignore invalid JSON */ }
    return createEngine(el, opts);
  });
}
