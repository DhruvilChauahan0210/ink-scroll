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
 * **Note:** each step is internally forced to `once: true` regardless of the
 * option you pass. This prevents a completed step from being reset when the
 * user scrolls back, which would break the chain. If you need every step to
 * be reversible, use `scrollDrawGroup` with `autoReverse` instead.
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
  const noop: ScrollDrawInstance = { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };
  if (typeof window === 'undefined') return noop;

  const containers = resolveTargets(targets);
  if (containers.length === 0) return noop;

  let activeIdx = 0;
  const instances: ScrollDrawInstance[] = [];

  function makeEngine(idx: number): ScrollDrawInstance {
    return createEngine(containers[idx], {
      ...options,
      // Each step must lock once complete — scrolling back must not un-complete
      // a step and re-trigger the chain.
      once: true,
      onComplete() {
        options.onComplete?.();
        activeIdx = idx + 1;
        instances[activeIdx]?.resume();
      },
    });
  }

  function init(): void {
    containers.forEach((_, idx) => { instances[idx] = makeEngine(idx); });
    // All engines start paused except the first; resume() is called when the
    // preceding engine fires onComplete.
    for (let i = 1; i < instances.length; i++) instances[i].pause();
  }

  init();

  return {
    destroy() {
      instances.forEach((i) => i.destroy());
      instances.length = 0;
    },
    replay() {
      instances.forEach((i) => i.destroy());
      instances.length = 0;
      activeIdx = 0;
      init();
    },
    pause()         { instances[activeIdx]?.pause(); },
    resume()        { instances[activeIdx]?.resume(); },
    seek(p: number) { instances[activeIdx]?.seek(p); },
    getProgress()   { return instances[activeIdx]?.getProgress() ?? 0; },
  };
}
