/**
 * svg-scroll-draw/scrollreveal/react — the ScrollReveal drop-in for React.
 *
 * The usual ScrollReveal setup is one global `ScrollReveal().reveal('.card')` at
 * start-up, which misses every component that mounts later (a route change, a
 * list that loads) and never cleans up. This hook reveals the element its ref is
 * on — or, with `selector`, that element's matching children, which is how an
 * `interval` sequence is written — and cleans it on unmount.
 *
 * Options are read once, on mount. Defaults set with `ScrollReveal({ ... })`
 * elsewhere still apply, as they would in ScrollReveal.
 */
import { useEffect, useRef, type RefObject } from 'react';
import ScrollReveal, { type ScrollRevealOptions } from './index';

export interface UseScrollRevealOptions extends ScrollRevealOptions {
  /** Reveal the element's descendants matching this selector instead of the element itself. */
  selector?: string;
}

export function useScrollReveal<T extends Element = HTMLDivElement>(
  options: UseScrollRevealOptions = {},
): RefObject<T> {
  const ref = useRef<T>(null);
  const opts = useRef(options);
  opts.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { selector, ...reveal } = opts.current;
    const targets: Element | Element[] = selector ? Array.from(el.querySelectorAll(selector)) : el;
    const sr = ScrollReveal();
    sr.reveal(targets, reveal);
    return () => sr.clean(targets);
  }, []);

  return ref;
}
