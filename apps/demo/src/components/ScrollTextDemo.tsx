'use client';

import { useRef, useEffect } from 'react';
import { scrollText } from 'svg-scroll-draw/text';
import { ScrollAnimate } from 'svg-scroll-draw/react';

function TextRevealBlock({
  text,
  split,
  stagger,
  from,
  label,
  color,
}: {
  text: string;
  split: 'words' | 'chars' | 'lines';
  stagger: number;
  from: { opacity?: number; y?: number; rotate?: number; scale?: number };
  label: string;
  color: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = scrollText(ref.current, {
      split,
      stagger,
      from,
      easing: 'ease-out',
      once: true,
      trigger: { start: 'top 88%', end: 'top 45%' },
    });
    return () => inst.destroy();
  }, []);

  return (
    <ScrollAnimate
      props={{ opacity: [0, 1] }}
      trigger={{ start: 'top 92%', end: 'top 70%' }}
      easing="ease-out"
      once
    >
      <div className="rounded-2xl border border-pitch-black p-6 sm:p-8 bg-white shadow-[3px_3px_0px_#000] overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
            style={{ background: color + '20', color: color, borderColor: color + '60' }}
          >
            split=&quot;{split}&quot;
          </span>
          <span className="text-[11px] font-mono text-graphite-border">{label}</span>
        </div>
        <p
          ref={ref}
          className="font-display font-extrabold leading-[1.1] tracking-[-0.03em] text-pitch-black"
          style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}
        >
          {text}
        </p>
      </div>
    </ScrollAnimate>
  );
}

export function ScrollTextDemo() {
  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">

        {/* Left — explanation + code */}
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-creator-pink" />
            v2.1.0 · scrollText
          </div>
          <h2 className="font-display font-extrabold text-[clamp(26px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-4">
            Free GSAP<br />SplitText.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-2 text-[15px]">
            Split any text into <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">chars</code>,{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">words</code>, or{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">lines</code> and animate each unit on scroll with stagger.
          </p>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            GSAP SplitText does the same job and is free to use — it adds ~18 KB. This entry point is 2.5 KB, MIT-licensed.
          </p>

          <div className="rounded-xl overflow-hidden border border-pitch-black mb-4">
            <div className="bg-[#111] flex items-center px-4 py-2 justify-between">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#888] font-mono">headline.js</span>
              <span className="w-10" />
            </div>
            <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">{`import { scrollText } from 'svg-scroll-draw/text';

// Words fade up one by one
scrollText('#headline', {
  split:   'words',
  stagger: 0.05,
  from:    { opacity: 0, y: 24 },
  once:    true,
});

// Characters with rotation
scrollText('#tagline', {
  split:   'chars',
  stagger: 0.03,
  from:    { opacity: 0, y: 32, rotate: 8 },
});

// React
import { ScrollText } from 'svg-scroll-draw/react';
<ScrollText split="words" stagger={0.05}
  from={{ opacity: 0, y: 24 }} once>
  Animate this headline.
</ScrollText>`}</pre>
          </div>

          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray p-4 text-[13px] text-graphite-border">
            <span className="font-semibold text-pitch-black">Accessibility:</span>{' '}
            original text preserved in <code className="font-mono text-[0.88em]">aria-label</code> on the container.
            All split spans get <code className="font-mono text-[0.88em]">aria-hidden=&quot;true&quot;</code>.{' '}
            <code className="font-mono text-[0.88em]">destroy()</code> restores original HTML.
          </div>
        </div>

        {/* Right — 3 live text reveal demos */}
        <div className="flex flex-col gap-4">
          <TextRevealBlock
            text="Words fade up one after another."
            split="words"
            stagger={0.06}
            from={{ opacity: 0, y: 24 }}
            label="stagger 0.06 · y: 24"
            color="#4ade80"
          />
          <TextRevealBlock
            text="Characters with a spin."
            split="chars"
            stagger={0.04}
            from={{ opacity: 0, y: 20, rotate: 12 }}
            label="stagger 0.04 · rotate: 12"
            color="#f472b6"
          />
          <TextRevealBlock
            text="Scale and fade reveal."
            split="words"
            stagger={0.07}
            from={{ opacity: 0, scale: 0.7 }}
            label="stagger 0.07 · scale: 0.7"
            color="#fb923c"
          />
        </div>

      </div>
    </section>
  );
}
