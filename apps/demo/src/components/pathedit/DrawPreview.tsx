'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { measureLength } from './measure';

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;

const PLAY_MS = 1600;

/**
 * The path drawn by scrollDraw itself, moved with seek() instead of the page's
 * scroll: seek(p) pauses the instance and draws p of the line (0–1, clamped).
 * The instance is rebuilt when an option changes and re-measured with
 * refresh() when the path does, and destroyed on unmount.
 *
 * Under reduced motion scrollDraw draws the path whole and seek() does
 * nothing (engine.ts, the prefersReduced branch), so the preview sets the
 * dash itself, the same numbers seek() would set.
 */
export const DrawPreview = memo(function DrawPreview({
  d, viewBox, strokeWidth, round, fade, once, reduced,
}: {
  d: string;
  viewBox: string;
  strokeWidth: number;
  round: boolean;
  fade: boolean;
  once: boolean;
  reduced: boolean;
}) {
  const [p, setP] = useState(0.62);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const inst = useRef<Instance | null>(null);
  const progress = useRef(p);
  const raf = useRef(0);

  // The instance: rebuilt when an option changes.
  useEffect(() => {
    const box = boxRef.current;
    const path = pathRef.current;
    if (!box || !path || reduced) return;
    let live = true;
    let made: Instance | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      made = scrollDraw(box, { ...(fade ? { fade: true } : {}), ...(once ? { once: true } : {}) });
      made.seek(progress.current);
      inst.current = made;
    });
    return () => {
      live = false;
      made?.destroy();
      if (inst.current === made) inst.current = null;
      // destroy() leaves the last frame's dash on the path; the next instance starts clean.
      path.removeAttribute('style');
    };
  }, [fade, once, reduced]);

  // A new path: measure it again and keep the frame.
  useEffect(() => {
    const i = inst.current;
    if (!i) return;
    i.refresh?.();
    i.seek(progress.current);
  }, [d]);

  useEffect(() => {
    progress.current = p;
    inst.current?.seek(p);
  }, [p]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function play() {
    cancelAnimationFrame(raf.current);
    if (reduced) {
      setP(1);
      return;
    }
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / PLAY_MS);
      setP(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  // Reduced motion: the dash seek(p) would set, written here.
  const len = reduced ? measureLength(d) ?? 0 : 0;
  const manual = reduced
    ? { strokeDasharray: `${len}`, strokeDashoffset: `${len * (1 - p)}`, ...(fade ? { opacity: p } : {}) }
    : undefined;

  return (
    <div className="ped-preview">
      <p className="ped-k">Preview · scrollDraw · seek({p.toFixed(2)})</p>
      <div ref={boxRef} className="ped-pbox">
        <svg viewBox={viewBox} aria-hidden="true">
          <path
            key={reduced ? 'still' : 'live'}
            ref={pathRef}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap={round ? 'round' : undefined}
            strokeLinejoin={round ? 'round' : undefined}
            style={manual}
          />
        </svg>
      </div>
      <div className="ped-transport">
        <button type="button" className="ped-btn" onClick={play}>▶ Play</button>
        <label className="ped-scrub">
          <span>Drawn · {Math.round(p * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(p * 1000)}
            aria-valuetext={`${Math.round(p * 100)}% drawn`}
            onChange={(e) => {
              cancelAnimationFrame(raf.current);
              setP(Number(e.target.value) / 1000);
            }}
          />
        </label>
      </div>
    </div>
  );
});
