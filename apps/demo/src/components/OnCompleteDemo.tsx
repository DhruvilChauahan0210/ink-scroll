'use client';

import { useState, useCallback } from 'react';
import { InteractiveScrollDemo } from './InteractiveScrollDemo';

export function OnCompleteDemo() {
  const [drawn, setDrawn] = useState(false);

  const handleComplete = useCallback(() => setDrawn(true), []);
  const handleReplay   = useCallback(() => setDrawn(false), []);

  return (
    <section data-mascot="cheer" className="relative border-b border-pitch-black overflow-hidden">
      <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[220px] leading-none text-pitch-black opacity-[0.04]">05</span>
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid md:grid-cols-2 gap-16 items-start">

        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Callback</p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Know when<br />it&apos;s done.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            The{' '}
            <code className="inline-block bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-pitch-black align-middle">onComplete</code>{' '}
            callback fires the moment the path reaches 100%.
            Use it to chain animations, reveal UI, or fire analytics.
            Hit Replay below to see it fire again.
          </p>

          <div className="rounded-2xl overflow-hidden border border-pitch-black mb-6">
            <div className="bg-[#111] dark:bg-[#1a1a1a] flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#666] font-mono tracking-wide">index.tsx</span>
              <span className="w-16" />
            </div>
            <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-5 py-4 text-[13px] font-mono leading-[1.75] overflow-x-auto">
{`<ScrollDraw
  onComplete={() => {
    console.log('drawn!');
  }}
>
  <svg>...</svg>
</ScrollDraw>`}
            </pre>
          </div>

          {/* Live badge */}
          <div
            className={`inline-flex items-center gap-2.5 border border-pitch-black rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-500 ${
              drawn
                ? 'opacity-100 translate-y-0 bg-creator-pink shadow-[2px_2px_0px_#000]'
                : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-pitch-black" />
            onComplete fired ✓
          </div>
        </div>

        {/* Interactive demo — onComplete resets the badge on each replay */}
        <InteractiveScrollDemo
          defaultEasing="ease-in-out"
          defaultSpeed={1}
          svgBg="gray"
          onComplete={handleComplete}
          onReplay={handleReplay}
        >
          <svg width="260" height="240" viewBox="0 0 260 240" fill="none">
            <circle cx="130" cy="120" r="96" stroke="#000000" strokeWidth="2.5" />
            <polyline
              points="68,120 114,170 192,74"
              stroke="#ff90e8"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </InteractiveScrollDemo>

      </div>
    </section>
  );
}
