'use client';

import { useRef, useEffect } from 'react';
import { scrollParallax } from 'svg-scroll-draw';

function ParallaxCard({
  speed,
  label,
  sublabel,
  bg,
  text,
}: {
  speed: number;
  label: string;
  sublabel: string;
  bg: string;
  text: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = scrollParallax(ref.current, { speed });
    return () => inst.destroy();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-pitch-black p-5 will-change-transform"
      style={{ background: bg }}
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-pitch-black/50 mb-1">
        speed={speed}
      </p>
      <p className="font-display font-extrabold text-xl tracking-[-0.02em] text-pitch-black mb-1">
        {label}
      </p>
      <p className="text-[13px] text-pitch-black/70 leading-relaxed">{sublabel}</p>
    </div>
  );
}

export function ScrollParallaxDemo() {
  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-center">

        {/* Left — explanation + code */}
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-glow" />
            v2.0.0 · scrollParallax
          </div>
          <h2 className="font-display font-extrabold text-[clamp(26px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-4">
            Parallax.<br />One line.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            Move any element at a different rate than scroll.{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">speed</code> is a
            multiplier relative to element height — <code className="font-mono text-[0.88em]">0.5</code> = half speed,{' '}
            <code className="font-mono text-[0.88em]">-0.3</code> = opposite direction.
          </p>

          <div className="rounded-xl overflow-hidden border border-pitch-black mb-4">
            <div className="bg-[#111] flex items-center px-4 py-2 justify-between">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#888] font-mono">parallax.js</span>
              <span className="w-10" />
            </div>
            <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">{`import { scrollParallax } from 'svg-scroll-draw';

// Hero background — 40% scroll rate
scrollParallax('#hero-bg', { speed: 0.4 });

// Floating badge — moves opposite direction
scrollParallax('#badge', { speed: -0.3 });

// Fast — nearly same speed as scroll
scrollParallax('#fast-el', { speed: 0.9 });

// Horizontal scroll container
scrollParallax('#side-card', { speed: 0.4, axis: 'x' });`}</pre>
          </div>

          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray p-4 text-[13px] text-graphite-border">
            <span className="font-semibold text-pitch-black">Under the hood:</span>{' '}
            <code className="font-mono text-[0.88em]">scrollParallax</code> is a thin wrapper over{' '}
            <code className="font-mono text-[0.88em]">scrollAnimate</code>, converting speed + element size into
            a <code className="font-mono text-[0.88em]">translateY</code> from/to range.
          </div>
        </div>

        {/* Right — 3 live parallax demos at different speeds */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] font-mono text-graphite-border uppercase tracking-[0.15em] -mb-2">
            Scroll to see the difference in speed
          </p>
          <ParallaxCard
            speed={0.5}
            label="speed: 0.5"
            sublabel="Moves at half scroll speed. Classic background parallax."
            bg="#ffeaa7"
            text=""
          />
          <ParallaxCard
            speed={0.2}
            label="speed: 0.2"
            sublabel="Very slow — subtle depth effect. Good for background images."
            bg="#74b9ff"
            text=""
          />
          <ParallaxCard
            speed={-0.3}
            label="speed: -0.3"
            sublabel="Moves opposite to scroll direction — floating badge or sticker effect."
            bg="#a29bfe"
            text=""
          />
        </div>

      </div>
    </section>
  );
}
