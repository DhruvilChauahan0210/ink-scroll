'use client';

import { ScrollAnimate } from 'svg-scroll-draw/react';

const CARDS = [
  {
    title: 'Fade + Slide',
    desc: 'Opacity 0→1, translateY 40px→0. The classic fade-in-up.',
    color: '#ffeaa7',
    delay: '0ms',
  },
  {
    title: 'Color Shift',
    desc: 'Background fades from white to brand color as you scroll.',
    color: '#fd79a8',
    delay: '80ms',
  },
  {
    title: 'Scale In',
    desc: 'Scale 0.85→1 + opacity, for a pop-in entrance.',
    color: '#74b9ff',
    delay: '160ms',
  },
];

export function ScrollAnimateDemo() {
  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-center">

        {/* Left — explanation + code */}
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-graphite-border border border-subtle-ash rounded-full px-3 py-1.5 font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-glow" />
            v2.0.0 · scrollAnimate
          </div>
          <h2 className="font-display font-extrabold text-[clamp(26px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-4">
            Any CSS property.<br />Any element.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-4 text-[15px]">
            Animate <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">opacity</code>,{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">transform</code>,{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">color</code>,{' '}
            <code className="font-mono text-[0.88em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">background-color</code> — or
            any CSS property — on any HTML element. Direct replacement for <code className="font-mono text-[0.88em]">gsap.to + ScrollTrigger</code>.
          </p>

          <div className="rounded-xl overflow-hidden border border-pitch-black mb-4">
            <div className="bg-[#111] flex items-center px-4 py-2 justify-between">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#888] font-mono">Hero.tsx</span>
              <span className="w-10" />
            </div>
            <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 py-4 text-[11px] sm:text-[12px] font-mono leading-[1.8] overflow-x-auto">{`import { ScrollAnimate } from 'svg-scroll-draw/react';

<ScrollAnimate
  props={{
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0)'],
  }}
  easing="ease-out"
  once
>
  <div className="card">Any content</div>
</ScrollAnimate>

// Or vanilla JS
import { scrollAnimate } from 'svg-scroll-draw';
scrollAnimate('#hero-text', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
  easing: 'ease-out', once: true,
});`}</pre>
          </div>

          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray p-4 text-[13px] text-graphite-border">
            <span className="font-semibold text-pitch-black">Native CSS fast path:</span>{' '}
            when animating <code className="font-mono text-[0.88em]">opacity</code> or <code className="font-mono text-[0.88em]">transform</code> with a named easing and default trigger,
            svg-scroll-draw injects <code className="font-mono text-[0.88em]">animation-timeline: view()</code> — zero per-frame JavaScript.
          </div>
        </div>

        {/* Right — live demos */}
        <div className="flex flex-col gap-4">
          {CARDS.map((card, i) => (
            <ScrollAnimate
              key={card.title}
              props={{
                opacity:   [0, 1],
                transform: ['translateY(36px)', 'translateY(0px)'],
              }}
              trigger={{ start: 'top 90%', end: 'top 55%' }}
              easing="ease-out"
              once
            >
              <div
                className="rounded-2xl border border-pitch-black p-5 shadow-[3px_3px_0px_#000]"
                style={{ background: card.color }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-pitch-black/50 mb-1 font-mono">
                  Example {i + 1}
                </p>
                <p className="font-display font-extrabold text-xl tracking-[-0.02em] text-pitch-black mb-1">
                  {card.title}
                </p>
                <p className="text-[13px] text-pitch-black/70 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </ScrollAnimate>
          ))}

          {/* Color transition demo */}
          <ScrollAnimate
            props={{
              backgroundColor: ['#ffffff', '#0d0d0d'],
              color:           ['#111111', '#f5f5f5'],
            }}
            trigger={{ start: 'top 85%', end: 'top 30%' }}
          >
            <div className="rounded-2xl border border-pitch-black p-5 shadow-[3px_3px_0px_#000]">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold opacity-50 mb-1 font-mono">
                Color Transition
              </p>
              <p className="font-display font-extrabold text-xl tracking-[-0.02em] mb-1">
                background + color
              </p>
              <p className="text-[13px] opacity-70 leading-relaxed">
                Background and text color animate together as you scroll.
              </p>
            </div>
          </ScrollAnimate>
        </div>

      </div>
    </section>
  );
}
