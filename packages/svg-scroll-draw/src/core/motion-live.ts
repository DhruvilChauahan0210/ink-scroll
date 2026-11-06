import { watchReducedMotion } from './motion-watch';

/**
 * Builds an instance, and builds it again under reduced motion the first time
 * the reader turns reduced motion on while it is live: the old instance is
 * destroyed, which puts its element back as it found it, and the new one takes
 * the branch it would have taken had the page loaded under reduced motion —
 * every element in its final state, at once. The object returned stays the
 * same throughout, so a framework wrapper holding it, or a page that took
 * `replay` off it, keeps calling the live instance.
 *
 * If the instance it replaces had already reached the end, `onComplete` has
 * fired, so the rebuild runs without it.
 *
 * One way only. Turning reduced motion off again leaves everything finished, and
 * motion returns on the next load: going back would hide content the reader has
 * already seen, and the rebuilt instance would have lost any pause() or seek()
 * the page applied to the old one.
 *
 * A file of its own: snap and the timeline watch the preference but never
 * rebuild, and the chunked build shares code a whole file at a time.
 */
export function finishWhenReduced<
  O extends { onComplete?: unknown },
  T extends { destroy: () => void; getProgress?: () => number },
>(options: O, build: (options: O, reduced: boolean) => T): T {
  // Read inline, as the engines did, rather than through ./motion: the main
  // entry would load one more file for a line. Every caller has checked for a
  // window already.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return build(options, true);
  let inst = build(options, false);
  const unwatch = watchReducedMotion((reduced) => {
    if (!reduced) return;
    unwatch();
    const finished = (inst.getProgress?.() ?? 0) >= 1;
    inst.destroy();
    inst = build(finished ? { ...options, onComplete: undefined } : options, true);
  });
  const live = {} as Record<string, unknown>;
  for (const key of Object.keys(inst)) {
    live[key] = (...args: unknown[]) =>
      (inst as unknown as Record<string, ((...a: unknown[]) => unknown) | undefined>)[key]?.(...args);
  }
  live.destroy = () => {
    unwatch();
    inst.destroy();
  };
  return live as T;
}
