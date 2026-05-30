'use client';

import { useState, useCallback } from 'react';
import { InteractiveScrollDemo } from './InteractiveScrollDemo';

const STOPS = [
  { threshold: 0.25, label: '25%', color: 'bg-creator-pink' },
  { threshold: 0.5,  label: '50%', color: 'bg-sunshine-yellow' },
  { threshold: 0.75, label: '75%', color: 'bg-lime-glow' },
  { threshold: 1,    label: '100%', color: 'bg-pitch-black text-light-linen' },
];

export function WaypointsDemo() {
  const [reached, setReached] = useState<Set<number>>(new Set());

  const handleReplay = useCallback(() => setReached(new Set()), []);

  const waypoints = STOPS.map(({ threshold }) => ({
    threshold,
    fn: () => setReached((prev) => new Set([...prev, threshold])),
  }));

  return (
    <section data-mascot="celebrate" className="relative border-b border-pitch-black overflow-hidden">
      <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">09</span>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">

        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Waypoints</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Fire callbacks<br />mid-draw.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">waypoints</code>{' '}
            lets you fire callbacks at any progress threshold — reveal UI at 50%, trigger
            confetti at 100%, or sync multiple animations precisely. They reset on{' '}
            <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">replay()</code>.
          </p>

          {/* Live waypoint indicators */}
          <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
            {STOPS.map(({ threshold, label, color }) => (
              <div key={threshold}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-pitch-black font-mono text-[11px] sm:text-[13px] font-bold transition-all duration-300 ${
                  reached.has(threshold)
                    ? `${color} shadow-[2px_2px_0px_#000] scale-105`
                    : 'bg-light-linen text-graphite-border opacity-40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${reached.has(threshold) ? 'bg-current' : 'bg-subtle-ash'}`} />
                {label}
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden border border-pitch-black">
            <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#888] font-mono">index.tsx</span>
              <span className="w-16" />
            </div>
            <pre className="bg-[#242423] text-[#e8e8e3] px-5 py-4 text-[13px] font-mono leading-[1.75] overflow-x-auto">
{`<ScrollDraw
  waypoints={{
    0.25: () => revealLabel(),
    0.5:  () => animateChart(),
    0.75: () => showCTA(),
    1:    () => fireConfetti(),
  }}
>
  <svg>...</svg>
</ScrollDraw>`}
            </pre>
          </div>
        </div>

        <InteractiveScrollDemo
          defaultEasing="ease-out"
          defaultSpeed={0.8}
          svgBg="white"
          waypoints={waypoints}
          onReplay={handleReplay}
        >
          <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
            {/* Journey path */}
            <path
              d="M 30 230 C 30 180 80 160 130 160 C 180 160 200 120 200 80 C 200 50 220 30 230 30"
              stroke="#000" strokeWidth="2.5" strokeLinecap="round"
            />
            {/* Waypoint dots */}
            {[
              { cx: 76,  cy: 164, color: '#ff6b9d',  label: '25%', active: reached.has(0.25) },
              { cx: 160, cy: 128, color: '#ffc900',  label: '50%', active: reached.has(0.5) },
              { cx: 204, cy: 68,  color: '#a8e063',  label: '75%', active: reached.has(0.75) },
              { cx: 230, cy: 30,  color: '#111',     label: '100%', active: reached.has(1) },
            ].map(({ cx, cy, color, label, active }) => (
              <g key={label}>
                <circle cx={cx} cy={cy} r={active ? 10 : 7}
                  fill={active ? color : 'white'}
                  stroke={color} strokeWidth="2.5"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text x={cx + 14} y={cy + 4}
                  fontSize="10" fontFamily="monospace"
                  fill={active ? '#111' : '#aaa'}
                  style={{ transition: 'fill 0.3s ease' }}
                >{label}</text>
              </g>
            ))}
            {/* Start dot */}
            <circle cx="30" cy="230" r="6" fill="#ddd" stroke="#999" strokeWidth="2" />
          </svg>
        </InteractiveScrollDemo>

      </div>
    </section>
  );
}
