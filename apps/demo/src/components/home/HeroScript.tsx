'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

const noopSubscribe = () => () => {};
const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(REDUCED).matches;

type Props = {
  d: string;
  viewBox: string;
  strokeWidth: number;
  /** ms before the pen touches the page. */
  delay?: number;
  duration?: number;
  className?: string;
  /** Write on load (hero) or scrub with scroll (sign-off). */
  mode?: 'autoplay' | 'scroll';
};

/**
 * A single-stroke word written by the library, with a glowing nib riding the
 * end of the stroke. The nib lives in a sibling SVG with the same viewBox so
 * the engine never tries to draw it; its position comes from the engine's own
 * onProgress, mapped onto the path with getPointAtLength.
 */
export function HeroScript({ d, viewBox, strokeWidth, delay = 450, duration = 2800, className, mode = 'autoplay' }: Props) {
  const nib = useRef<SVGGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [written, setWritten] = useState(false);
  // The server renders the word fully inked; the engine hides it on mount. Keep
  // it invisible until the client has taken over — otherwise it flashes,
  // vanishes and redraws. False on the server and during hydration.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const done = written || reduced;

  const follow = (p: number) => {
    const g = nib.current;
    const path = wrap.current?.querySelector<SVGPathElement>('.hs-ink');
    if (!g || !path) return;
    const len = path.getTotalLength();
    const pt = path.getPointAtLength(Math.max(0, Math.min(1, p)) * len);
    g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    g.style.opacity = p > 0.001 && p < 0.999 ? '1' : '0';
    if (p >= 0.999 && !written) setWritten(true);
  };

  const drawProps = mode === 'autoplay'
    ? { autoplay: true, duration, delay, easing: 'ease-in-out' as const, once: true }
    : { trigger: { start: 'top 85%', end: 'top 35%' }, easing: 'ease-out' as const };

  return (
    <div ref={wrap} className={`hs ${ready ? 'is-ready' : ''} ${done ? 'is-done' : ''} ${className ?? ''}`}>
      <ScrollDraw className="hs-draw" {...drawProps} onProgress={follow}>
        <svg viewBox={viewBox} aria-hidden="true">
          <path className="hs-ink" d={d} style={{ strokeWidth: String(strokeWidth) }} />
        </svg>
      </ScrollDraw>
      <svg className="hs-nib-layer" viewBox={viewBox} aria-hidden="true">
        <defs>
          <radialGradient id="hs-glow">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="35%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={nib} className="hs-nib" style={{ opacity: '0' }}>
          <circle r={String(strokeWidth * 5)} fill="url(#hs-glow)" />
          <circle r={String(strokeWidth * 0.62)} className="hs-nib-core" />
        </g>
      </svg>
    </div>
  );
}
