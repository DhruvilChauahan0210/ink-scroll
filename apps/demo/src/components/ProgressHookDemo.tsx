'use client';

import { useRef } from 'react';
import { useScrollDrawProgress } from 'svg-scroll-draw/react';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(from: [number, number, number], to: [number, number, number], t: number) {
  return `rgb(${Math.round(lerp(from[0], to[0], t))},${Math.round(lerp(from[1], to[1], t))},${Math.round(lerp(from[2], to[2], t))})`;
}

// Circular SVG progress ring
function Ring({ progress, size = 120, stroke = 8 }: { progress: number; size?: number; stroke?: number }) {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const color  = lerpColor([209, 213, 220], [255, 144, 232], progress); // subtle-ash → creator-pink

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.04s linear, stroke 0.04s linear' }}
      />
    </svg>
  );
}

export function ProgressHookDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // The hook — same trigger/speed/easing API as ScrollDraw
  const progress = useScrollDrawProgress(sectionRef, {
    trigger: { start: 'top 80%', end: 'bottom 20%' },
    easing: 'ease-out',
    speed: 1,
  });

  const pct        = Math.round(progress * 100);
  const bgColor    = lerpColor([244, 244, 240], [255, 144, 232], progress * 0.15);
  const accentColor = lerpColor([209, 213, 220], [255, 144, 232], progress);

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-pitch-black overflow-hidden"
      style={{ background: bgColor, transition: 'background 0.1s linear' }}
    >
      <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">
        12
      </span>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-center">

        {/* Left: explanation */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">
            useScrollDrawProgress
          </p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Progress as a<br />React value.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            <code className="font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">useScrollDrawProgress</code>{' '}
            exposes scroll progress (0–1) as a plain React number —
            no SVG required. Drive any animation: colors, counters, layouts,
            spring physics, or canvas. Same trigger/speed/easing API as{' '}
            <code className="font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">ScrollDraw</code>.
          </p>
          <div className="rounded-xl overflow-hidden border border-pitch-black">
            <div className="bg-[#111] flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#666] font-mono">Hero.tsx</span>
              <span className="w-10" />
            </div>
            <pre className="bg-[#242423] text-[#e8e8e3] px-5 py-4 text-[12px] font-mono leading-[1.75] overflow-x-auto">{`import { useScrollDrawProgress }
  from 'svg-scroll-draw/react';

const ref = useRef(null);
const progress = useScrollDrawProgress(ref, {
  trigger: { start: 'top 80%',
             end:   'bottom 20%' },
  easing: 'ease-out',
});

// progress is 0 → 1 as you scroll
// drive anything with it ↓
const opacity = progress;
const scale   = 0.8 + progress * 0.2;
const color   = lerp('#ccc', '#ff90e8', progress);`}</pre>
          </div>
        </div>

        {/* Right: live demo */}
        <div className="flex flex-col items-center gap-8">

          {/* Circular ring + counter */}
          <div className="relative flex items-center justify-center">
            <Ring progress={progress} size={160} stroke={10} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display font-extrabold text-4xl leading-none tabular-nums"
                style={{ color: accentColor, transition: 'color 0.04s linear' }}
              >
                {pct}
              </span>
              <span className="text-[11px] font-mono text-graphite-border mt-1">%</span>
            </div>
          </div>

          {/* Horizontal bar */}
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-graphite-border mb-2">
              <span>scroll progress</span>
              <span>{progress.toFixed(3)}</span>
            </div>
            <div className="h-2 bg-marketplace-gray rounded-full overflow-hidden border border-subtle-ash">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: accentColor,
                  transition: 'width 0.04s linear, background 0.04s linear',
                }}
              />
            </div>
          </div>

          {/* Three live values */}
          <div className="w-full max-w-xs grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            {[
              { label: 'opacity',   value: progress.toFixed(2) },
              { label: 'scale',     value: (0.8 + progress * 0.2).toFixed(2) },
              { label: 'blur (px)', value: ((1 - progress) * 8).toFixed(1) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-subtle-ash bg-light-linen p-2 sm:p-3"
              >
                <div className="font-display font-bold text-base sm:text-lg tabular-nums">{value}</div>
                <div className="text-[8px] sm:text-[9px] font-mono text-graphite-border mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
