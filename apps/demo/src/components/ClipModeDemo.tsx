'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

const DIRECTIONS = ['left', 'right', 'top', 'bottom', 'center'] as const;
type Dir = typeof DIRECTIONS[number];

const DIR_LABELS: Record<Dir, string> = {
  left:   '← left',
  right:  'right →',
  top:    '↑ top',
  bottom: '↓ bottom',
  center: '◎ center',
};

const DIR_DESC: Record<Dir, string> = {
  left:   'Wipes in from left to right',
  right:  'Wipes in from right to left',
  top:    'Drops in from top to bottom',
  bottom: 'Rises in from bottom to top',
  center: 'Radial reveal from center',
};

function PreviewCard({ dir, color }: { dir: Dir; color: string }) {
  return (
    <ScrollDraw clip={dir} easing="ease-out" speed={1} once>
      <div style={{
        background: color,
        borderRadius: '12px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '100px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {DIR_LABELS[dir]}
        </span>
        <span style={{ fontWeight: 800, fontSize: '15px', color: '#111', lineHeight: 1.2 }}>
          {DIR_DESC[dir]}
        </span>
      </div>
    </ScrollDraw>
  );
}

const COLORS = ['#ffeaa7', '#fd79a8', '#74b9ff', '#55efc4', '#a29bfe'];

export function ClipModeDemo() {
  return (
    <section className="relative border-b border-pitch-black overflow-hidden">
      <span className="pointer-events-none select-none absolute -right-6 top-1/2 -translate-y-1/2 font-display font-extrabold text-[120px] md:text-[220px] leading-none text-pitch-black opacity-[0.04]">
        14
      </span>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">

        {/* Left: explanation + code */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">
            Clip Mode
          </p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] leading-[1] tracking-[-0.03em] mb-5">
            Reveal anything.<br />Not just SVGs.
          </h2>
          <p className="text-graphite-border leading-relaxed mb-3 text-[15px]">
            Set <code className="font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">clip</code> to
            skip stroke-dashoffset entirely and use CSS{' '}
            <code className="font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">clip-path</code> instead.
            Works on images, cards, text blocks, gradients — any HTML or SVG content.
          </p>
          <p className="text-graphite-border leading-relaxed mb-6 text-[15px]">
            Five directions: <code className="font-mono text-[0.9em]">left</code>,{' '}
            <code className="font-mono text-[0.9em]">right</code>,{' '}
            <code className="font-mono text-[0.9em]">top</code>,{' '}
            <code className="font-mono text-[0.9em]">bottom</code>,{' '}
            <code className="font-mono text-[0.9em]">center</code>.
            All existing options — <code className="font-mono text-[0.9em]">easing</code>,{' '}
            <code className="font-mono text-[0.9em]">speed</code>,{' '}
            <code className="font-mono text-[0.9em]">trigger</code>,{' '}
            <code className="font-mono text-[0.9em]">once</code> — work as normal.
          </p>

          <div className="rounded-xl overflow-hidden border border-pitch-black mb-6">
            <div className="bg-[#111] flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="w-2 h-2 rounded-full bg-[#444]" />
              </div>
              <span className="text-[11px] text-[#666] font-mono">Hero.tsx</span>
              <span className="w-10" />
            </div>
            <pre className="bg-[#242423] text-[#e8e8e3] px-5 py-4 text-[12px] font-mono leading-[1.75] overflow-x-auto">{`// Reveal any content — not just SVG paths
<ScrollDraw clip="left" easing="ease-out" once>
  <img src="/hero.png" />
</ScrollDraw>

<ScrollDraw clip="center" easing="spring" speed={1.2}>
  <div className="card">
    <h2>Radial reveal</h2>
    <p>Works on any HTML content.</p>
  </div>
</ScrollDraw>

// true defaults to 'left'
<ScrollDraw clip easing="ease-in-out">
  <YourComponent />
</ScrollDraw>`}</pre>
          </div>

          {/* Comparison note */}
          <div className="rounded-xl border border-subtle-ash bg-marketplace-gray p-4 text-[13px] text-graphite-border">
            <span className="font-semibold text-pitch-black">vs stroke-dashoffset:</span>{' '}
            dashoffset traces the path shape — perfect for drawing lines.
            Clip reveals a rectangular or circular window — perfect for images,
            cards, and content blocks.
          </div>
        </div>

        {/* Right: 5 live direction demos */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {DIRECTIONS.map((dir, i) => (
            <div
              key={dir}
              className={dir === 'center' ? 'col-span-2' : ''}
            >
              <PreviewCard dir={dir} color={COLORS[i]} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
