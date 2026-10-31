/**
 * svg-scroll-draw/vivus/react — the vivus drop-in for React.
 *
 * `new Vivus()` needs the mounted <svg>, and the instance needs destroying when
 * the component goes, which vivus users wire up by hand in every component. This
 * hook does both and hands the instance back for `play()`, `reset()` and the
 * rest. StrictMode's double mount is safe: the first instance is destroyed
 * before the second is made.
 *
 * Options and the callback are read once, on mount.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import Vivus, { type VivusOptions, type VivusCallback } from './index';

export function useVivus<T extends Element = SVGSVGElement>(
  options: VivusOptions = {},
  callback?: VivusCallback,
): [RefObject<T>, Vivus | null] {
  const ref = useRef<T>(null);
  const [instance, setInstance] = useState<Vivus | null>(null);
  const opts = useRef(options);
  const cb = useRef(callback);
  opts.current = options;
  cb.current = callback;

  useEffect(() => {
    if (!ref.current) return;
    const vivus = new Vivus(ref.current, opts.current, (v) => cb.current?.(v));
    setInstance(vivus);
    return () => {
      vivus.destroy();
      setInstance(null);
    };
  }, []);

  return [ref, instance];
}
