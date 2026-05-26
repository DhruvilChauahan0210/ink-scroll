import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

export type { ScrollDrawOptions };

function resolveTargets(targets: Array<string | Element>): Element[] {
  return targets
    .map((t) => (typeof t === 'string' ? document.querySelector(t) : t))
    .filter((el): el is Element => el !== null);
}

/**
 * Animate multiple SVG containers simultaneously with the same options.
 * Each container tracks its own scroll position independently.
 *
 * @example
 * import { scrollDrawGroup } from 'svg-scroll-draw/group';
 *
 * const group = scrollDrawGroup(['#hero-svg', '#logo', '#diagram'], {
 *   easing: 'ease-out',
 *   stagger: 0.1,
 * });
 *
 * group.replay(); // replays all at once
 * group.destroy();
 */
export function scrollDrawGroup(
  targets: Array<string | Element>,
  options: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };

  const instances = resolveTargets(targets).map((el) => createEngine(el, options));

  return {
    destroy()            { instances.forEach((i) => i.destroy()); },
    replay()             { instances.forEach((i) => i.replay()); },
    pause()              { instances.forEach((i) => i.pause()); },
    resume()             { instances.forEach((i) => i.resume()); },
    seek(p: number)      { instances.forEach((i) => i.seek(p)); },
    getProgress()        { return instances[0]?.getProgress() ?? 0; },
  };
}

/**
 * Animate multiple SVG containers in sequence — each one starts only after
 * the previous has reached 100% draw progress.
 *
 * @example
 * import { scrollDrawSequence } from 'svg-scroll-draw/group';
 *
 * const seq = scrollDrawSequence(['#step-1', '#step-2', '#step-3'], {
 *   easing: 'spring',
 * });
 */
export function scrollDrawSequence(
  targets: Array<string | Element>,
  options: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };

  const containers = resolveTargets(targets);
  const instances: (ScrollDrawInstance | null)[] = new Array(containers.length).fill(null);
  let activeIdx = 0;

  function start(idx: number) {
    if (idx >= containers.length) return;
    instances[idx] = createEngine(containers[idx], {
      ...options,
      onComplete: () => {
        options.onComplete?.();
        start(idx + 1);
      },
    });
  }

  start(0);

  return {
    destroy() {
      instances.forEach((i) => i?.destroy());
      instances.fill(null);
    },
    replay() {
      instances.forEach((i) => i?.destroy());
      instances.fill(null);
      activeIdx = 0;
      start(0);
    },
    pause()         { instances[activeIdx]?.pause(); },
    resume()        { instances[activeIdx]?.resume(); },
    seek(p: number) { instances[activeIdx]?.seek(p); },
    getProgress()   { return instances[activeIdx]?.getProgress() ?? 0; },
  };
}
