'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The scroll-pin post's opening drawing: the real layout scrollPin produces.
 * Above, the viewport mid-pin — the product image held `top` px below the
 * viewport edge while the feature copy scrolls past it. Below, the scroll axis:
 * the pin zone is `pinDistance` long, the four callbacks fire at its two ends,
 * and onProgress runs 0 → 1 between them. The marker ties the two together.
 */
export function PinFigure() {
  return (
    <ScrollDraw className="pf" selector=".pf-ink" autoplay duration={900} delay={300} stagger={0.08} easing="ease-out" once>
      <svg viewBox="0 0 440 318" role="img" aria-labelledby="pf-t">
        <title id="pf-t">A viewport with a pinned image held 80 pixels below the top while copy scrolls past, above a scroll axis marking the pin zone and where each callback fires.</title>
        <defs>
          <clipPath id="pf-clip"><rect x="110" y="24" width="220" height="172" rx="7" /></clipPath>
          <marker id="pf-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8" className="pf-head" />
          </marker>
        </defs>

        {/* ── The viewport, mid-pin ── */}
        <text x="110" y="14" className="pf-k">viewport</text>
        <text x="330" y="14" className="pf-m" textAnchor="end">p = 0.5</text>
        <rect x="110" y="24" width="220" height="172" rx="7" className="pf-ink pf-frame" stroke="currentColor" />
        <g clipPath="url(#pf-clip)">
          {/* fixed site nav */}
          <path d="M110 46 H330" className="pf-ink pf-thin" stroke="currentColor" />
          <path d="M124 35 H156" className="pf-ink pf-thin" stroke="currentColor" />
          <path d="M282 35 H316" className="pf-ink pf-thin" stroke="currentColor" />
          {/* the feature copy, moving past */}
          {[58, 108, 158, 208].map((y) => (
            <g key={y}>
              <path d={`M236 ${y} H312`} className="pf-ink pf-copy-h" stroke="currentColor" />
              <path d={`M236 ${y + 11} H318`} className="pf-ink pf-copy" stroke="currentColor" />
              <path d={`M236 ${y + 19} H304`} className="pf-ink pf-copy" stroke="currentColor" />
              <path d={`M236 ${y + 27} H312`} className="pf-ink pf-copy" stroke="currentColor" />
            </g>
          ))}
        </g>
        {/* the pinned image (#panel): a wireframe image box */}
        <rect x="124" y="64" width="98" height="112" className="pf-ink pf-pin" stroke="currentColor" />
        <path d="M124 64 L222 176 M222 64 L124 176" className="pf-ink pf-x" stroke="currentColor" />
        <text x="129" y="188" className="pf-m pf-acc">#panel · fixed</text>

        {/* top: 80 — viewport edge to the pinned edge */}
        <path d="M86 24 H104 M86 64 H120" className="pf-ink pf-thin" stroke="currentColor" />
        <path d="M94 28 V60" className="pf-ink pf-dim" stroke="currentColor" markerStart="url(#pf-arr)" markerEnd="url(#pf-arr)" />
        <text x="82" y="48" className="pf-v" textAnchor="end">top: 80</text>

        {/* copy scrolls up */}
        <path d="M346 168 V64" className="pf-ink pf-dim" stroke="currentColor" markerEnd="url(#pf-arr)" />
        <text x="354" y="120" className="pf-v">copy</text>
        <text x="354" y="135" className="pf-v">scrolls</text>

        {/* ── The scroll axis ── */}
        <path d="M220 196 V262" className="pf-ink pf-lead" stroke="currentColor" />
        <path d="M14 262 H418" className="pf-ink pf-thin" stroke="currentColor" markerEnd="url(#pf-arr)" />
        <text x="426" y="266" className="pf-m" textAnchor="end" dy="-12">scrollY</text>
        {/* the pin zone */}
        <path d="M120 262 H320" className="pf-ink pf-zone" stroke="currentColor" />
        <path d="M120 250 V274 M320 250 V274" className="pf-ink pf-tick" stroke="currentColor" />
        <path d="M124 232 H316" className="pf-ink pf-dim" stroke="currentColor" markerStart="url(#pf-arr)" markerEnd="url(#pf-arr)" />
        <path d="M120 226 V250 M320 226 V250" className="pf-ink pf-thin" stroke="currentColor" />
        <text x="220" y="226" className="pf-v" textAnchor="middle">pinDistance: 600</text>
        <circle cx="220" cy="262" r="3.5" className="pf-dot" />

        <text x="120" y="292" className="pf-v pf-acc" textAnchor="middle">onEnter ↓</text>
        <text x="120" y="310" className="pf-m" textAnchor="middle">onLeaveBack ↑</text>
        <text x="220" y="292" className="pf-v" textAnchor="middle">onProgress</text>
        <text x="220" y="310" className="pf-m" textAnchor="middle">p 0 → 1</text>
        <text x="320" y="292" className="pf-v pf-acc" textAnchor="middle">onLeave ↓</text>
        <text x="320" y="310" className="pf-m" textAnchor="middle">onEnterBack ↑</text>
      </svg>
    </ScrollDraw>
  );
}
