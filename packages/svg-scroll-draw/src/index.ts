import { createEngine } from './core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from './core/types';

export function scrollDraw(
  target: string | Element,
  options?: ScrollDrawOptions
): ScrollDrawInstance {
  if (typeof window === 'undefined') return { destroy: () => {} };

  const container =
    typeof target === 'string'
      ? document.querySelector(target)
      : target;

  if (!container) {
    console.warn('[svg-scroll-draw] Container not found:', target);
    return { destroy: () => {} };
  }

  return createEngine(container, options);
}

export type { ScrollDrawOptions, ScrollDrawInstance };
