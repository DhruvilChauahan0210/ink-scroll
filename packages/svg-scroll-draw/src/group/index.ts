import { createEngine } from '../core/engine';
import { createAnimateEngine, scrollParallax } from '../animate';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions, ScrollParallaxOptions } from '../animate';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollParallaxOptions };

function resolveTargets(targets: Array<string | Element>): Element[] {
  return targets
    .map((t) => (typeof t === 'string' ? document.querySelector(t) : t))
    .filter((el): el is Element => el !== null);
}

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

// ── scrollDrawGroup ───────────────────────────────────────────────────────────

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
  if (typeof window === 'undefined') return NOOP;

  const instances = resolveTargets(targets).map((el) => createEngine(el, options));

  return {
    destroy()            { instances.forEach((i) => i.destroy()); },
    replay()             { instances.forEach((i) => i.replay()); },
    pause()              { instances.forEach((i) => i.pause()); },
    resume()             { instances.forEach((i) => i.resume()); },
    seek(p: number)      { instances.forEach((i) => i.seek(p)); },
    getProgress()        { return instances[0]?.getProgress() ?? 0; },
    refresh()            { instances.forEach((i) => i.refresh?.()); },
  };
}

// ── scrollDrawSequence ────────────────────────────────────────────────────────

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
  if (typeof window === 'undefined') return NOOP;

  const containers = resolveTargets(targets);
  if (containers.length === 0) return NOOP;

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
        // Clamped, because the cursor is what every instance method addresses.
        // Letting the final step push it past the end left `getProgress()`
        // returning 0 the instant the sequence finished — reporting "nothing has
        // happened" at the one moment everything has — and made pause(), resume()
        // and seek() silent no-ops for the rest of the page's life.
        activeIdx = Math.min(idx + 1, containers.length - 1);
        if (activeIdx > idx) instances[activeIdx]?.resume();
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
    // Every step, not just the active one: a step further down the chain has
    // already measured its own trigger window and would otherwise keep a stale
    // one until it happens to be resized.
    refresh()       { instances.forEach((i) => i.refresh?.()); },
  };
}

// ── scrollAnimateGroup ────────────────────────────────────────────────────────

/**
 * Animate multiple HTML/SVG elements simultaneously with scrollAnimate options.
 * Each element tracks its own scroll position independently. Perfect for
 * staggered card reveals, feature grids, or any multi-element entrance.
 *
 * @example
 * import { scrollAnimateGroup } from 'svg-scroll-draw/group';
 *
 * const group = scrollAnimateGroup(
 *   [card1El, card2El, card3El],
 *   {
 *     props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
 *     easing: 'ease-out',
 *     once: true,
 *   }
 * );
 *
 * group.replay();
 * group.destroy();
 */
export function scrollAnimateGroup(
  targets: Array<string | Element>,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const instances = resolveTargets(targets).map((el) => createAnimateEngine(el, options));

  return {
    destroy()            { instances.forEach((i) => i.destroy()); },
    replay()             { instances.forEach((i) => i.replay()); },
    pause()              { instances.forEach((i) => i.pause()); },
    resume()             { instances.forEach((i) => i.resume()); },
    seek(p: number)      { instances.forEach((i) => i.seek(p)); },
    getProgress()        { return instances[0]?.getProgress() ?? 0; },
    refresh()            { instances.forEach((i) => i.refresh?.()); },
  };
}

// ── scrollAnimateSequence ─────────────────────────────────────────────────────

/**
 * Fan-out scrollAnimate in sequence — each element starts animating only after
 * the previous one has reached 100%. Useful for step-by-step reveals.
 *
 * @example
 * import { scrollAnimateSequence } from 'svg-scroll-draw/group';
 *
 * scrollAnimateSequence(
 *   [step1El, step2El, step3El],
 *   {
 *     props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
 *     easing: 'ease-out',
 *   }
 * );
 */
export function scrollAnimateSequence(
  targets: Array<string | Element>,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const containers = resolveTargets(targets);
  if (containers.length === 0) return NOOP;

  let activeIdx = 0;
  const instances: ScrollDrawInstance[] = [];

  function makeEngine(idx: number): ScrollDrawInstance {
    return createAnimateEngine(containers[idx] as HTMLElement, {
      ...options,
      once: true,
      onComplete() {
        options.onComplete?.();
        // Clamped for the same reason as scrollDrawSequence above: the cursor is
        // what getProgress(), pause(), resume() and seek() all address, so it
        // must not walk off the end when the last step finishes.
        activeIdx = Math.min(idx + 1, containers.length - 1);
        if (activeIdx > idx) instances[activeIdx]?.resume();
      },
    });
  }

  function init(): void {
    containers.forEach((_, idx) => { instances[idx] = makeEngine(idx); });
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
    // Every step, not just the active one: a step further down the chain has
    // already measured its own trigger window and would otherwise keep a stale
    // one until it happens to be resized.
    refresh()       { instances.forEach((i) => i.refresh?.()); },
  };
}

// ── scrollParallaxGroup ───────────────────────────────────────────────────────

/**
 * Apply a parallax effect to multiple elements simultaneously.
 * Each element moves at `speed × elementHeight` pixels independently.
 *
 * @example
 * import { scrollParallaxGroup } from 'svg-scroll-draw/group';
 *
 * // Three background layers at the same speed
 * scrollParallaxGroup(['#layer-far', '#layer-mid', '#layer-near'], { speed: 0.4 });
 *
 * // Opposite direction (floats upward as you scroll down)
 * scrollParallaxGroup(['#badge', '#tag'], { speed: -0.2 });
 */
export function scrollParallaxGroup(
  targets: Array<string | Element>,
  options: ScrollParallaxOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const instances = resolveTargets(targets).map((el) => scrollParallax(el, options));

  return {
    destroy()            { instances.forEach((i) => i.destroy()); },
    replay()             { instances.forEach((i) => i.replay()); },
    pause()              { instances.forEach((i) => i.pause()); },
    resume()             { instances.forEach((i) => i.resume()); },
    seek(p: number)      { instances.forEach((i) => i.seek(p)); },
    getProgress()        { return instances[0]?.getProgress() ?? 0; },
    refresh()            { instances.forEach((i) => i.refresh?.()); },
  };
}
