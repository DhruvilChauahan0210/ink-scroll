'use client';

import { useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

const EASINGS = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce', 'elastic'] as const;
type EasingName = typeof EASINGS[number];

export function AutoplayDemo() {
  const [duration, setDuration]   = useState(1200);
  const [easing, setEasing]       = useState<EasingName>('ease-out');
  const [stagger, setStagger]     = useState(0.12);
  const [replayKey, setReplayKey] = useState(0);

  function replay() { setReplayKey((k) => k + 1); }

  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">
        15
      </span>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">

        {/* Left — explanation + code */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Autoplay</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Draw on enter.<br />No scroll needed.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-3 text-[15px]">
            Set{' '}
            <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">autoplay</code>{' '}
            to run the animation over{' '}
            <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">duration</code>{' '}
            milliseconds the moment the element enters the viewport — perfect for hero
            sections, loaders, and page transitions where scroll position is irrelevant.
          </p>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            Every option works as normal:{' '}
            <code className="font-mono text-[0.85em]">easing</code>,{' '}
            <code className="font-mono text-[0.85em]">stagger</code>,{' '}
            <code className="font-mono text-[0.85em]">fade</code>,{' '}
            <code className="font-mono text-[0.85em]">clip</code>,{' '}
            <code className="font-mono text-[0.85em]">morphTo</code>,{' '}
            callbacks, repeat. Use{' '}
            <code className="font-mono text-[0.85em]">once</code> to play only
            the first time the element enters view.
          </p>

          <div className="rounded-2xl overflow-hidden border border-pitch-black mb-6">
            <div className="bg-[#111] dark:bg-[#1a1a1a] flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#888] font-mono tracking-wide">Hero.tsx</span>
              <span className="w-16" />
            </div>
            <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-5 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{`// Draws on viewport enter — no scroll required
<ScrollDraw
  autoplay
  duration={1200}
  easing="ease-out"
  stagger={0.12}
  once
>
  <svg>...</svg>
</ScrollDraw>

// Vanilla JS
scrollDraw('#logo', {
  autoplay: true,
  duration: 1200,
  easing: 'spring',
});`}</pre>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label htmlFor="autoplay-duration" className="text-[12px] font-mono text-graphite-border w-16 shrink-0">duration</label>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  id="autoplay-duration"
                  type="range"
                  min={300}
                  max={3000}
                  step={100}
                  value={duration}
                  onChange={(e) => { setDuration(Number(e.target.value)); replay(); }}
                  className="flex-1 accent-pitch-black"
                />
                <span className="text-[12px] font-mono text-pitch-black w-16 text-right">{duration}ms</span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-[12px] font-mono text-graphite-border w-16 shrink-0">easing</label>
              <div className="flex flex-wrap gap-1.5">
                {EASINGS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { setEasing(e); replay(); }}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                      easing === e
                        ? 'bg-pitch-black text-light-linen border-pitch-black'
                        : 'bg-transparent text-graphite-border border-subtle-ash hover:border-pitch-black hover:text-pitch-black'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label htmlFor="autoplay-stagger" className="text-[12px] font-mono text-graphite-border w-16 shrink-0">stagger</label>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  id="autoplay-stagger"
                  type="range"
                  min={0}
                  max={0.4}
                  step={0.02}
                  value={stagger}
                  onChange={(e) => { setStagger(Number(e.target.value)); replay(); }}
                  className="flex-1 accent-pitch-black"
                />
                <span className="text-[12px] font-mono text-pitch-black w-16 text-right">{stagger.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={replay}
              className="mt-2 inline-flex items-center gap-2 text-[12px] font-mono font-semibold border border-pitch-black rounded-full px-4 py-2 hover:bg-pitch-black hover:text-light-linen transition-colors"
            >
              ↺ Replay
            </button>
          </div>
        </div>

        {/* Right — live SVG demo */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-sm rounded-2xl border border-pitch-black bg-marketplace-gray p-6 shadow-[4px_4px_0px_#000] flex items-center justify-center min-h-[220px]">
            <ScrollDraw
              key={replayKey}
              autoplay
              duration={duration}
              easing={easing}
              stagger={stagger}
              once={false}
            >
              <svg width="240" height="190" viewBox="0 0 240 190" fill="none" aria-hidden="true">
                {/* card outline */}
                <rect x="12" y="12" width="216" height="166" rx="12" stroke="#111" strokeWidth="2.5" />
                {/* avatar circle */}
                <circle cx="48" cy="66" r="24" stroke="#111" strokeWidth="2.5" />
                {/* title bar */}
                <line x1="86" y1="53" x2="210" y2="53" stroke="#ff90e8" strokeWidth="4" strokeLinecap="round" />
                {/* subtitle bar */}
                <line x1="86" y1="74" x2="178" y2="74" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                {/* divider */}
                <line x1="12" y1="106" x2="228" y2="106" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
                {/* content lines */}
                <line x1="28" y1="128" x2="212" y2="128" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                <line x1="28" y1="148" x2="186" y2="148" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                <line x1="28" y1="166" x2="148" y2="166" stroke="#111" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </ScrollDraw>
          </div>

          <p className="text-[12px] font-mono text-graphite-border text-center">
            Scroll away and back — it replays on re-entry.{' '}
            <br className="hidden sm:block" />
            Set <code className="text-pitch-black">once</code> to play only once.
          </p>
        </div>

      </div>
    </section>
  );
}
