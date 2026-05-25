'use client';

import { useState } from 'react';
import { ScrollDraw } from './ScrollDraw';

export function OnCompleteDemo() {
  const [drawn, setDrawn] = useState(false);

  return (
    <section className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-16 px-6 md:px-20 py-32">
      <div className="flex-1 max-w-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-mono mb-3">05 / callback</p>
        <h2 className="text-4xl font-bold mb-4">onComplete callback</h2>
        <p className="text-zinc-400 leading-relaxed mb-6">
          The{' '}
          <code className="text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">onComplete</code>{' '}
          prop fires when the path reaches 100% — useful for chaining animations, revealing UI,
          or triggering analytics events.
        </p>
        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm font-mono text-amber-300 overflow-x-auto">
{`<ScrollDraw
  onComplete={() => {
    console.log('drawn!');
  }}
>
  <svg>...</svg>
</ScrollDraw>`}
        </pre>

        <div
          className={`mt-6 flex items-center gap-2 text-sm font-mono transition-all duration-500 ${
            drawn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300">onComplete fired ✓</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <ScrollDraw easing="ease-in-out" onComplete={() => setDrawn(true)}>
          <svg width="320" height="280" viewBox="0 0 320 280" fill="none">
            <circle cx="160" cy="140" r="110" stroke="#f59e0b" strokeWidth="2" />
            <polyline
              points="90,140 140,195 230,90"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </ScrollDraw>
      </div>
    </section>
  );
}
