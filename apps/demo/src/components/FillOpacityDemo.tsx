'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export function FillOpacityDemo() {
  return (
    <section className="relative border-b border-pitch-black bg-marketplace-gray overflow-hidden">
      <span className="pointer-events-none select-none absolute -left-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">
        13
      </span>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">

        {/* Right: live demo */}
        <div className="order-2 md:order-1 flex items-center justify-center rounded-2xl border border-pitch-black bg-[#ffffff] p-10 shadow-[4px_4px_0px_#000] min-h-[320px]">
          <ScrollDraw
            easing="ease-in-out"
            speed={0.9}
            fillOpacity={[0, 1]}
            strokeColor={['#d1d5dc', '#ff90e8']}
            once
          >
            <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
              {/* Heart shape — outline draws + fill floods in together */}
              <path
                d="M 140 230
                   C 80 190 20 155 20 100
                   C 20 65 48 42 80 42
                   C 105 42 125 56 140 75
                   C 155 56 175 42 200 42
                   C 232 42 260 65 260 100
                   C 260 155 200 190 140 230 Z"
                fill="#ff90e8"
                stroke="#ff90e8"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Inner highlight */}
              <path
                d="M 140 200
                   C 100 175 55 148 55 108
                   C 55 88 68 75 85 75
                   C 107 75 122 90 140 108
                   C 158 90 173 75 195 75
                   C 212 75 225 88 225 108
                   C 225 148 180 175 140 200 Z"
                fill="#ffffff"
                fillOpacity="0.25"
                stroke="none"
              />
            </svg>
          </ScrollDraw>
        </div>

        {/* Left: explanation + code */}
        <div className="order-1 md:order-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">
            Fill Opacity
          </p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Outline draws.<br />Fill floods in.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            Pass <code className="font-mono text-pitch-black text-[0.9em] bg-light-linen border border-subtle-ash px-1.5 py-0.5 rounded-md">fillOpacity={`{[0, 1]}`}</code> and the element's fill
            animates from fully transparent to fully opaque in sync with the stroke draw.
            A single number sets a static override. No React state, no{' '}
            <code className="font-mono text-pitch-black text-[0.9em] bg-light-linen border border-subtle-ash px-1.5 py-0.5 rounded-md">onComplete</code> hack needed.
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
            <pre className="bg-[#242423] text-[#e8e8e3] px-5 py-4 text-[12px] font-mono leading-[1.75] overflow-x-auto">{`<ScrollDraw
  easing="ease-in-out"
  speed={0.9}
  fillOpacity={[0, 1]}
  strokeColor={['#d1d5dc', '#ff90e8']}
  once
>
  <svg>
    {/* fill is set on the element — */}
    {/* fillOpacity animates 0 → 1   */}
    <path fill="#ff90e8" stroke="#ff90e8" d="…" />
  </svg>
</ScrollDraw>`}</pre>
          </div>

          {/* API note */}
          <div className="mt-4 rounded-xl border border-subtle-ash bg-light-linen p-4 text-[13px] text-graphite-border">
            <span className="font-mono font-semibold text-pitch-black">fillOpacity</span>
            {' '}accepts the same shapes as{' '}
            <span className="font-mono text-pitch-black">strokeWidth</span>:
            a <span className="font-mono">number</span> for a static override,
            or a <span className="font-mono">[from, to]</span> tuple to interpolate.
          </div>
        </div>

      </div>
    </section>
  );
}
