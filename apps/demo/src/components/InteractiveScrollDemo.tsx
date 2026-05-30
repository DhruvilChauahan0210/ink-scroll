'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Types ───────────────────────────────────────────────── */
type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

const EASING_FNS: Record<EasingName, (t: number) => number> = {
  linear:        (t) => t,
  'ease-in':     (t) => t * t,
  'ease-out':    (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring:        (t) => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
};

const BASE_DURATION = 1600;

/* ── Color helpers ───────────────────────────────────────── */
function parseRgb(c: string): [number, number, number] | null {
  const s = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(c);
  if (s) return [parseInt(s[1]+s[1],16), parseInt(s[2]+s[2],16), parseInt(s[3]+s[3],16)];
  const f = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
  if (f) return [parseInt(f[1],16), parseInt(f[2],16), parseInt(f[3],16)];
  return null;
}
function lerpColor(a: string, b: string, t: number): string {
  const ca = parseRgb(a), cb = parseRgb(b);
  if (!ca || !cb) return a;
  return `rgb(${Math.round(ca[0]+(cb[0]-ca[0])*t)},${Math.round(ca[1]+(cb[1]-ca[1])*t)},${Math.round(ca[2]+(cb[2]-ca[2])*t)})`;
}

/* ── Standalone animator ─────────────────────────────────── */
function runAnimation(
  container: HTMLElement,
  easingFn: (t: number) => number,
  speed: number,
  fade: boolean,
  extra: {
    colorFrom?: string; colorTo?: string;
    widthFrom?: number; widthTo?: number;
    waypoints?: Array<{ threshold: number; fn: () => void }>;
  } = {},
  onDone?: () => void
): () => void {
  const paths = Array.from(
    container.querySelectorAll<SVGGeometryElement>('path, polyline, line, polygon, circle, rect')
  );
  if (!paths.length) { onDone?.(); return () => {}; }

  const lengths = paths.map((p) => {
    if (p.tagName === 'circle') {
      const r = parseFloat(p.getAttribute('r') ?? '0');
      return 2 * Math.PI * r;
    }
    if (p.tagName === 'rect') {
      const w = parseFloat(p.getAttribute('width') ?? '0');
      const h = parseFloat(p.getAttribute('height') ?? '0');
      return 2 * (w + h);
    }
    return (p as SVGGeometryElement).getTotalLength?.() ?? 0;
  });

  const triggered = new Set<number>();

  paths.forEach((p, i) => {
    p.style.strokeDasharray  = `${lengths[i]}`;
    p.style.strokeDashoffset = `${lengths[i]}`;
    if (fade) p.style.opacity = '0';
    if (extra.colorFrom) p.style.stroke = extra.colorFrom;
    if (extra.widthFrom !== undefined) p.style.strokeWidth = `${extra.widthFrom}`;
  });

  const duration = BASE_DURATION / Math.max(speed, 0.1);
  const start    = performance.now();
  let   rafId    = 0;

  function frame(now: number) {
    const raw   = Math.min((now - start) / duration, 1);
    const alpha = easingFn(raw);

    paths.forEach((p, i) => {
      p.style.strokeDashoffset = `${lengths[i] * (1 - alpha)}`;
      if (fade) p.style.opacity = `${alpha}`;
      if (extra.colorFrom && extra.colorTo) p.style.stroke = lerpColor(extra.colorFrom, extra.colorTo, alpha);
      if (extra.widthFrom !== undefined && extra.widthTo !== undefined)
        p.style.strokeWidth = `${extra.widthFrom + (extra.widthTo - extra.widthFrom) * alpha}`;
    });

    extra.waypoints?.forEach(({ threshold, fn }) => {
      if (alpha >= threshold && !triggered.has(threshold)) {
        triggered.add(threshold);
        fn();
      }
    });

    if (raw < 1) rafId = requestAnimationFrame(frame);
    else onDone?.();
  }

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

/* ── Controls panel ──────────────────────────────────────── */
function Controls({
  easing, speed, playing,
  onEasingChange, onSpeedChange, onSpeedCommit, onReplay,
}: {
  easing: EasingName; speed: number; playing: boolean;
  onEasingChange: (e: EasingName) => void;
  onSpeedChange:  (s: number) => void;
  onSpeedCommit:  () => void;
  onReplay:       () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-pitch-black bg-light-linen p-4 sm:p-5 shadow-[2px_2px_0px_#000]">
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">Easing</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EASING_FNS) as EasingName[]).map((e) => (
            <button key={e} onClick={() => onEasingChange(e)}
              className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all ${
                easing === e
                  ? 'bg-pitch-black text-light-linen border-pitch-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                  : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
              }`}
            >{e}</button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-graphite-border mb-2.5">
          Speed — <span className="font-bold font-mono text-pitch-black">{speed.toFixed(1)}×</span>
        </p>
        <input type="range" min="0.3" max="3" step="0.1" value={speed}
          aria-label="Animation speed"
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          onPointerUp={onSpeedCommit} onKeyUp={onSpeedCommit}
        />
        <div className="flex justify-between text-[10px] text-graphite-border mt-1.5">
          <span>0.3× slow</span><span>3× fast</span>
        </div>
      </div>
      <button onClick={onReplay} disabled={playing}
        className={`text-[12px] font-bold px-5 py-2 rounded-full border-2 border-pitch-black transition-all ${
          playing
            ? 'bg-subtle-ash text-graphite-border cursor-not-allowed opacity-60'
            : 'bg-creator-pink text-pitch-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:scale-95'
        }`}
      >{playing ? 'Playing…' : '↺  Replay'}</button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
interface Props {
  children:       React.ReactNode;
  defaultEasing?: EasingName;
  defaultSpeed?:  number;
  fade?:          boolean;
  className?:     string;
  svgBg?:         'gray' | 'white';
  colorFrom?:     string;
  colorTo?:       string;
  widthFrom?:     number;
  widthTo?:       number;
  waypoints?:     Array<{ threshold: number; fn: () => void }>;
  onComplete?:    () => void;
  onReplay?:      () => void;
}

export function InteractiveScrollDemo({
  children,
  defaultEasing = 'linear',
  defaultSpeed  = 1,
  fade          = false,
  className     = '',
  svgBg         = 'gray',
  colorFrom, colorTo, widthFrom, widthTo, waypoints,
  onComplete, onReplay,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef    = useRef<() => void>(() => {});
  const hasPlayed    = useRef(false);

  const [easing,  setEasing]  = useState<EasingName>(defaultEasing);
  const [speed,   setSpeed]   = useState(defaultSpeed);
  const [playing, setPlaying] = useState(false);

  const play = useCallback((e: EasingName, s: number) => {
    if (!containerRef.current) return;
    cancelRef.current();
    setPlaying(true);
    cancelRef.current = runAnimation(
      containerRef.current, EASING_FNS[e], s, fade,
      { colorFrom, colorTo, widthFrom, widthTo, waypoints },
      () => { setPlaying(false); onComplete?.(); }
    );
  }, [fade, colorFrom, colorTo, widthFrom, widthTo, waypoints, onComplete]);

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

  useEffect(() => () => cancelRef.current(), []);

  const handleEasingChange = (e: EasingName) => { setEasing(e); play(e, speed); };
  const handleSpeedCommit  = ()              => { onReplay?.(); play(easing, speed); };
  const handleReplay       = ()              => { onReplay?.(); play(easing, speed); };

  const bgClass = svgBg === 'white'
    ? 'bg-[#ffffff] border-pitch-black'
    : 'bg-[#f4f4f0] border-pitch-black';

  return (
    <div className={className}>
      <div ref={containerRef}
        className={`flex items-center justify-center rounded-2xl border p-4 sm:p-8 shadow-[4px_4px_0px_#000] ${bgClass} overflow-hidden`}
      >{children}</div>
      <Controls
        easing={easing} speed={speed} playing={playing}
        onEasingChange={handleEasingChange}
        onSpeedChange={(s) => setSpeed(s)}
        onSpeedCommit={handleSpeedCommit}
        onReplay={handleReplay}
      />
    </div>
  );
}
