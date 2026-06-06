'use client';

import { useRef, useEffect } from 'react';
import { scrollCounter } from 'svg-scroll-draw';
import { ScrollAnimate } from 'svg-scroll-draw/react';

const STATS = [
  { id: 'stat-users',     from: 0,   to: 50000,  label: 'developers',    format: (n: number) => Math.round(n).toLocaleString() + '+' },
  { id: 'stat-size',      from: 40,  to: 9,      label: 'KB gzipped',    format: (n: number) => '~' + Math.round(n) },
  { id: 'stat-tests',     from: 0,   to: 423,    label: 'tests passing', format: (n: number) => Math.round(n).toString() },
  { id: 'stat-deps',      from: 10,  to: 0,      label: 'dependencies',  format: (n: number) => Math.round(n).toString() },
];

function StatCard({ stat }: { stat: typeof STATS[0] }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = scrollCounter(ref.current, {
      from:     stat.from,
      to:       stat.to,
      format:   stat.format,
      easing:   'ease-out',
      once:     true,
      trigger:  { start: 'top 85%', end: 'top 40%' },
    });
    return () => inst.destroy();
  }, []);

  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }}
      trigger={{ start: 'top 90%', end: 'top 55%' }}
      easing="ease-out"
      once
    >
      <div className="rounded-2xl border border-pitch-black p-6 bg-white shadow-[3px_3px_0px_#000] text-center">
        <span
          ref={ref}
          className="font-display font-extrabold text-[clamp(36px,5vw,56px)] leading-none tracking-[-0.04em] text-pitch-black block mb-1"
        >
          {stat.format(stat.from)}
        </span>
        <span className="text-[12px] font-mono text-graphite-border uppercase tracking-[0.15em]">
          {stat.label}
        </span>
      </div>
    </ScrollAnimate>
  );
}

export function ScrollCounterDemo() {
  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24">

        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start mb-12">
          {/* Left — explanation */}
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-sunshine-yellow" />
              v2.0.0 · scrollCounter
            </div>
            <h2 className="font-display font-extrabold text-[clamp(26px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-4">
              Stats sections.<br />One call.
            </h2>
            <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
              Animate any number from a start value to an end value as it scrolls into view.
              Custom <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">format</code> function,{' '}
              <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">decimals</code>,
              and all standard easing options.
            </p>

            <div className="rounded-xl overflow-hidden border border-pitch-black">
              <div className="bg-[#111] flex items-center px-4 py-2 justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                  <span className="w-2 h-2 rounded-full bg-[#444]" />
                </div>
                <span className="text-[11px] text-[#888] font-mono">stats.js</span>
                <span className="w-10" />
              </div>
              <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">{`import { scrollCounter } from 'svg-scroll-draw';

// Count up to 50,000
scrollCounter('#users', { to: 50_000, once: true });

// Formatted currency
scrollCounter('#revenue', {
  to:     1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  easing: 'ease-out',
  once:   true,
});

// Percentage with decimal
scrollCounter('#rate', {
  from:     0,
  to:       94.7,
  decimals: 1,
  format:   n => n.toFixed(1) + '%',
});

// React
import { ScrollCounter } from 'svg-scroll-draw/react';
<ScrollCounter to={50000} format={n => n.toLocaleString()} once />`}</pre>
            </div>
          </div>

          {/* Right — explanation of the "from 40 to 9" trick */}
          <div className="flex flex-col gap-4 justify-center">
            <div className="rounded-2xl border border-pitch-black p-6 bg-sunshine-yellow/20">
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-graphite-border mb-2">Counts down too</p>
              <p className="text-[15px] text-graphite-border leading-relaxed">
                Set <code className="font-mono text-[0.88em]">from</code> higher than <code className="font-mono text-[0.88em]">to</code> to count down.
                The "40 KB → 9 KB" stat card above uses <code className="font-mono text-[0.88em]">from: 40, to: 9</code>.
              </p>
            </div>
            <div className="rounded-2xl border border-pitch-black p-6 bg-marketplace-gray">
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-graphite-border mb-2">Combines with scrollAnimate</p>
              <p className="text-[15px] text-graphite-border leading-relaxed">
                The cards below combine <code className="font-mono text-[0.88em]">scrollCounter</code> (the number) with{' '}
                <code className="font-mono text-[0.88em]">ScrollAnimate</code> (the card fade-in) for a complete entrance effect.
              </p>
            </div>
          </div>
        </div>

        {/* Live stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

      </div>
    </section>
  );
}
