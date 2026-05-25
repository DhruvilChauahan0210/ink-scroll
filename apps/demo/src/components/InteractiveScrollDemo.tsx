'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Types ───────────────────────────────────────────────── */
type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

const EASING_FNS: Record<EasingName, (t: number) => number> = {
  linear:        (t) => t,
  'ease-in':     (t) => t * t,
  'ease-out':    (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

const BASE_DURATION = 1600; // ms at speed=1

/* ── Standalone animator (no scroll dependency) ─────────── */
function runAnimation(
  container: HTMLElement,
  easingFn: (t: number) => number,
  speed: number,
  fade: boolean,
  onDone?: () => void
): () => void {
  const paths = Array.from(
    container.querySelectorAll<SVGGeometryElement>('path, polyline, line, polygon')
  );
  if (!paths.length) { onDone?.(); return () => {}; }

  const lengths = paths.map((p) => p.getTotalLength());

  // Reset to invisible
  paths.forEach((p, i) => {
    p.style.strokeDasharray  = `${lengths[i]}`;
    p.style.strokeDashoffset = `${lengths[i]}`;
    if (fade) p.style.opacity = '0';
  });

  const duration = BASE_DURATION / Math.max(speed, 0.1);
  const start    = performance.now();
  let   rafId    = 0;

  function frame(now: number) {
    const t     = Math.min((now - start) / duration, 1);
    const alpha = easingFn(t);

    paths.forEach((p, i) => {
      p.style.strokeDashoffset = `${lengths[i] * (1 - alpha)}`;
      if (fade) p.style.opacity = `${alpha}`;
    });

    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      onDone?.();
    }
  }

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

/* ── Controls panel ──────────────────────────────────────── */
function Controls({
  easing, speed, playing,
  onEasingChange, onSpeedChange, onSpeedCommit, onReplay,
}: {
  easing: EasingName;
  speed: number;
  playing: boolean;
  onEasingChange: (e: EasingName) => void;
  onSpeedChange:  (s: number) => void;
  onSpeedCommit:  () => void;
  onReplay:       () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-pitch-black bg-light-linen p-5 shadow-[2px_2px_0px_#000]">

      {/* Easing toggles */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">
          Easing
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EASING_FNS) as EasingName[]).map((e) => (
            <button
              key={e}
              onClick={() => onEasingChange(e)}
              className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all ${
                easing === e
                  ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                  : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Speed slider */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">
          Speed —{' '}
          <span className="font-bold font-mono text-pitch-black">{speed.toFixed(1)}×</span>
        </p>
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          onPointerUp={onSpeedCommit}
          onKeyUp={onSpeedCommit}
        />
        <div className="flex justify-between text-[10px] text-graphite-border mt-1.5">
          <span>0.3× slow</span>
          <span>3× fast</span>
        </div>
      </div>

      {/* Replay button */}
      <button
        onClick={onReplay}
        disabled={playing}
        className={`text-[12px] font-bold px-5 py-2 rounded-full border-2 border-pitch-black transition-all ${
          playing
            ? 'bg-subtle-ash text-graphite-border cursor-not-allowed opacity-60'
            : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:scale-95'
        }`}
      >
        {playing ? 'Playing…' : '↺  Replay'}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
interface Props {
  children:       React.ReactNode;   // raw <svg> element — no ScrollDraw wrapper needed
  defaultEasing?: EasingName;
  defaultSpeed?:  number;
  fade?:          boolean;
  className?:     string;            // outer wrapper class (for grid ordering etc.)
  svgBg?:        'gray' | 'white';  // background of the SVG card
  onComplete?:    () => void;        // fires when animation finishes (mirrors ScrollDraw API)
  onReplay?:      () => void;        // fires when replay is triggered (useful for resetting external state)
}

export function InteractiveScrollDemo({
  children,
  defaultEasing = 'linear',
  defaultSpeed  = 1,
  fade          = false,
  className     = '',
  svgBg         = 'gray',
  onComplete,
  onReplay,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef    = useRef<() => void>(() => {});
  const hasPlayed    = useRef(false);

  const [easing,  setEasing]  = useState<EasingName>(defaultEasing);
  const [speed,   setSpeed]   = useState(defaultSpeed);
  const [playing, setPlaying] = useState(false);

  const play = useCallback((e: EasingName, s: number) => {
    if (!containerRef.current) return;
    cancelRef.current();            // cancel any in-progress animation
    setPlaying(true);
    cancelRef.current = runAnimation(
      containerRef.current,
      EASING_FNS[e],
      s,
      fade,
      () => { setPlaying(false); onComplete?.(); }
    );
  }, [fade, onComplete]);

  // Auto-play on first scroll into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          play(defaultEasing, defaultSpeed);
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play, defaultEasing, defaultSpeed]);

  // Cleanup on unmount
  useEffect(() => () => cancelRef.current(), []);

  const handleEasingChange = (e: EasingName) => { setEasing(e); play(e, speed); };
  const handleSpeedChange  = (s: number)     => setSpeed(s);
  const handleSpeedCommit  = ()              => { onReplay?.(); play(easing, speed); };
  const handleReplay       = ()              => { onReplay?.(); play(easing, speed); };

  const bgClass = svgBg === 'white'
    ? 'bg-light-linen border-pitch-black'
    : 'bg-marketplace-gray border-pitch-black';

  return (
    <div className={className}>
      {/* SVG card */}
      <div
        ref={containerRef}
        className={`flex items-center justify-center rounded-2xl border p-12 shadow-[4px_4px_0px_#000] ${bgClass}`}
      >
        {children}
      </div>

      {/* Controls */}
      <Controls
        easing={easing}
        speed={speed}
        playing={playing}
        onEasingChange={handleEasingChange}
        onSpeedChange={handleSpeedChange}
        onSpeedCommit={handleSpeedCommit}
        onReplay={handleReplay}
      />
    </div>
  );
}
