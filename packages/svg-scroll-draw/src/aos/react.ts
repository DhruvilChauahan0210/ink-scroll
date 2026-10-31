/**
 * svg-scroll-draw/aos/react — the AOS drop-in for React and Next.js.
 *
 * With AOS itself, React apps call `AOS.init()` in an effect and hope: there is
 * no `destroy()`, so StrictMode's mount → unmount → mount and client-side route
 * changes leave it half-initialised. The drop-in has `destroy()`, so this hook
 * owns the whole lifecycle. New `[data-aos]` elements a route change renders are
 * picked up by the drop-in's own MutationObserver; `refreshKey` re-measures
 * positions when something else moves the layout (pass the pathname, or data
 * that loaded).
 *
 * The built file starts with "use client", so `<AOSInit />` can go straight into
 * a Next.js App Router layout.
 */
import { useEffect, useRef } from 'react';
import AOS, { type AOSOptions } from './index';

/** Start AOS for the page, and stop it on unmount. Options are read once, on mount. */
export function useAOS(options: AOSOptions = {}, refreshKey?: unknown): void {
  const opts = useRef(options);
  opts.current = options;

  useEffect(() => {
    AOS.init(opts.current);
    return () => AOS.destroy();
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    AOS.refreshHard();
  }, [refreshKey]);
}

export type AOSInitProps = AOSOptions & {
  /** Re-measure trigger positions whenever this changes (e.g. the pathname). */
  refreshKey?: unknown;
};

/** `useAOS` as a component, for a layout that cannot call hooks itself. Renders nothing. */
export function AOSInit({ refreshKey, ...options }: AOSInitProps): null {
  useAOS(options, refreshKey);
  return null;
}
