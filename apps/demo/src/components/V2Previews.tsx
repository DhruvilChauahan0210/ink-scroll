'use client';

import { useRef, useEffect } from 'react';
import { scrollAnimate, scrollCounter, scrollParallax } from 'svg-scroll-draw';
import { ScrollAnimate } from 'svg-scroll-draw/react';
import { scrollText } from 'svg-scroll-draw/text';

// ── scrollAnimate preview ─────────────────────────────────────────────────────

export function ScrollAnimatePreview() {
  const ITEMS = [
    { label: 'opacity + transform', bg: '#ffeaa7' },
    { label: 'background-color',    bg: '#74b9ff' },
    { label: 'color + scale',       bg: '#a29bfe' },
  ];

  return (
    <div className="flex flex-col gap-3 w-full p-4">
      {ITEMS.map(({ label, bg }, i) => (
        <ScrollAnimate
          key={label}
          props={{
            opacity:   [0, 1],
            transform: ['translateY(28px)', 'translateY(0px)'],
          }}
          trigger={{ start: `top ${92 - i * 4}%`, end: `top ${58 - i * 4}%` }}
          easing="ease-out"
          once
        >
          <div
            className="rounded-xl border border-pitch-black px-4 py-3 shadow-[2px_2px_0px_#000]"
            style={{ background: bg }}
          >
            <code className="text-[11px] font-mono font-semibold text-pitch-black/70">{label}</code>
            <p className="text-[13px] font-medium text-pitch-black mt-0.5">Scroll to reveal ↑</p>
          </div>
        </ScrollAnimate>
      ))}

      {/* Color transition card */}
      <ScrollAnimate
        props={{
          backgroundColor: ['#f5f5f5', '#0d0d0d'],
          color:           ['#111', '#f5f5f5'],
        }}
        trigger={{ start: 'top 80%', end: 'top 35%' }}
      >
        <div className="rounded-xl border border-pitch-black px-4 py-3 shadow-[2px_2px_0px_#000]">
          <code className="text-[11px] font-mono font-semibold opacity-50">backgroundColor + color</code>
          <p className="text-[13px] font-medium mt-0.5">Live color shift as you scroll</p>
        </div>
      </ScrollAnimate>
    </div>
  );
}

// ── scrollCounter preview ─────────────────────────────────────────────────────

type StatDef = { to: number; label: string; fmt: (n: number) => string };

function CounterCard({ stat }: { stat: StatDef }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const inst = scrollCounter(ref.current, {
      to: stat.to, format: stat.fmt, easing: 'ease-out', once: true,
      trigger: { start: 'top 88%', end: 'top 45%' },
    });
    return () => inst.destroy();
  }, []);

  return (
    <ScrollAnimate
      props={{ opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] }}
      trigger={{ start: 'top 92%', end: 'top 60%' }}
      easing="ease-out"
      once
    >
      <div className="rounded-xl border border-pitch-black p-4 bg-white shadow-[2px_2px_0px_#000] text-center">
        <span ref={ref} className="font-display font-extrabold text-[28px] leading-none tracking-[-0.04em] text-pitch-black block">
          {stat.fmt(0)}
        </span>
        <span className="text-[10px] font-mono text-graphite-border uppercase tracking-[0.12em] mt-1 block">
          {stat.label}
        </span>
      </div>
    </ScrollAnimate>
  );
}

const COUNTER_STATS: StatDef[] = [
  { to: 50000, label: 'users',      fmt: (n) => Math.round(n).toLocaleString() + '+' },
  { to: 9,     label: 'KB gzipped', fmt: (n) => '~' + Math.round(n) },
  { to: 423,   label: 'tests',       fmt: (n) => Math.round(n).toString() },
  { to: 0,     label: 'zero deps',  fmt: (n) => Math.round(n).toString() },
];

export function ScrollCounterPreview() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full p-4">
      {COUNTER_STATS.map((stat) => (
        <CounterCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

// ── scrollText preview ────────────────────────────────────────────────────────

export function ScrollTextPreview() {
  const wordRef  = useRef<HTMLParagraphElement>(null);
  const charRef  = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const instances = [
      wordRef.current && scrollText(wordRef.current, {
        split: 'words', stagger: 0.06,
        from: { opacity: 0, y: 20 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 88%', end: 'top 50%' },
      }),
      charRef.current && scrollText(charRef.current, {
        split: 'chars', stagger: 0.04,
        from: { opacity: 0, y: 16, rotate: 10 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 82%', end: 'top 45%' },
      }),
    ].filter(Boolean);
    return () => instances.forEach(i => i && i.destroy());
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full p-6">
      <div className="rounded-xl border border-pitch-black p-5 bg-white shadow-[2px_2px_0px_#000]">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-graphite-border mb-2">
          split=&quot;words&quot; · stagger 0.06
        </p>
        <p
          ref={wordRef}
          className="font-display font-extrabold text-[22px] leading-[1.15] tracking-[-0.02em] text-pitch-black"
        >
          Scroll to reveal each word.
        </p>
      </div>

      <div className="rounded-xl border border-pitch-black p-5 bg-[#ffeaa7] shadow-[2px_2px_0px_#000]">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-pitch-black/50 mb-2">
          split=&quot;chars&quot; · rotate 10°
        </p>
        <p
          ref={charRef}
          className="font-display font-extrabold text-[22px] leading-[1.15] tracking-[-0.02em] text-pitch-black"
        >
          Character by character.
        </p>
      </div>
    </div>
  );
}

// ── scrollParallax preview ────────────────────────────────────────────────────

export function ScrollParallaxPreview() {
  const fast   = useRef<HTMLDivElement>(null);
  const slow   = useRef<HTMLDivElement>(null);
  const reverse = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instances = [
      fast.current   && scrollParallax(fast.current,    { speed: 0.6 }),
      slow.current   && scrollParallax(slow.current,    { speed: 0.15 }),
      reverse.current && scrollParallax(reverse.current, { speed: -0.3 }),
    ].filter(Boolean);
    return () => instances.forEach(i => i && i.destroy());
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full p-4 overflow-hidden">
      <p className="text-[10px] font-mono text-graphite-border uppercase tracking-[0.14em] mb-1">
        Scroll to see depth
      </p>
      <div ref={fast} className="rounded-xl border border-pitch-black px-4 py-3 bg-[#ffeaa7] shadow-[2px_2px_0px_#000] will-change-transform">
        <code className="text-[11px] font-mono font-bold">speed: 0.6</code>
        <p className="text-[12px] text-pitch-black/70 mt-0.5">Fast — moves more than scroll</p>
      </div>
      <div ref={slow} className="rounded-xl border border-pitch-black px-4 py-3 bg-[#74b9ff] shadow-[2px_2px_0px_#000] will-change-transform">
        <code className="text-[11px] font-mono font-bold">speed: 0.15</code>
        <p className="text-[12px] text-pitch-black/70 mt-0.5">Slow — subtle depth effect</p>
      </div>
      <div ref={reverse} className="rounded-xl border border-pitch-black px-4 py-3 bg-[#a29bfe] shadow-[2px_2px_0px_#000] will-change-transform">
        <code className="text-[11px] font-mono font-bold">speed: -0.3</code>
        <p className="text-[12px] text-pitch-black/70 mt-0.5">Negative — opposite direction</p>
      </div>
    </div>
  );
}
