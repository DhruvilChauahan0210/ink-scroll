'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * Full-width illustrated landscape section.
 * Uses <ScrollDraw> from svg-scroll-draw/react — the library animating its own site.
 * Elements draw in sequence (bottom to top, left to right) as you scroll into the section.
 */
export function ScrollShowcase() {
  return (
    <section className="relative border-b border-pitch-black bg-[#0e0e0e] overflow-hidden">

      {/* Label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#555]">
          svg-scroll-draw — animating its own site
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-creator-pink animate-pulse" />
      </div>

      {/* The illustration */}
      <div className="flex items-center justify-center py-16 px-4">
        <ScrollDraw
          easing="ease-out"
          speed={2}
          fade
          once
          stagger={0.04}
        >
          <svg
            width="100%"
            height="420"
            viewBox="0 0 1000 420"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            style={{ maxWidth: 1000 }}
          >
            {/* ── Ground / Horizon ──────────────────────────────────────── */}
            <line
              x1="0" y1="360" x2="1000" y2="360"
              stroke="#333" strokeWidth="1.5"
            />

            {/* ── Back mountains (far, subtle) ──────────────────────────── */}
            <path
              d="M 0 360 C 80 240 200 200 320 240 C 400 265 440 360 0 360"
              stroke="#333" strokeWidth="1.5" strokeLinejoin="round"
            />
            <path
              d="M 680 240 C 800 200 920 240 1000 360 L 680 360"
              stroke="#333" strokeWidth="1.5" strokeLinejoin="round"
            />

            {/* ── Mid mountain (main peak) ──────────────────────────────── */}
            <path
              d="M 280 360 C 360 220 440 175 500 162 C 560 175 640 220 720 360 L 280 360"
              stroke="#555" strokeWidth="2" strokeLinejoin="round"
            />

            {/* ── Front hills ──────────────────────────────────────────── */}
            <path
              d="M 0 360 C 60 300 160 270 250 310 C 310 335 360 360 0 360"
              stroke="#888" strokeWidth="2" strokeLinejoin="round"
            />
            <path
              d="M 750 310 C 840 270 940 300 1000 360 L 750 360"
              stroke="#888" strokeWidth="2" strokeLinejoin="round"
            />

            {/* ── Sun ──────────────────────────────────────────────────── */}
            <circle
              cx="500" cy="88" r="42"
              stroke="#ffc900" strokeWidth="2.5"
            />

            {/* ── Sun rays ─────────────────────────────────────────────── */}
            <line x1="500" y1="40"  x2="500" y2="27"  stroke="#ffc900" strokeWidth="2" />
            <line x1="530" y1="49"  x2="539" y2="38"  stroke="#ffc900" strokeWidth="2" />
            <line x1="549" y1="79"  x2="562" y2="75"  stroke="#ffc900" strokeWidth="2" />
            <line x1="540" y1="111" x2="551" y2="120" stroke="#ffc900" strokeWidth="2" />
            <line x1="500" y1="136" x2="500" y2="149" stroke="#ffc900" strokeWidth="2" />
            <line x1="460" y1="111" x2="449" y2="120" stroke="#ffc900" strokeWidth="2" />
            <line x1="451" y1="79"  x2="438" y2="75"  stroke="#ffc900" strokeWidth="2" />
            <line x1="470" y1="49"  x2="461" y2="38"  stroke="#ffc900" strokeWidth="2" />

            {/* ── Left pine tree ────────────────────────────────────────── */}
            <line x1="145" y1="360" x2="145" y2="295" stroke="#ff6b9d" strokeWidth="2" />
            <path d="M 118 328 L 145 295 L 172 328" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 124 312 L 145 280 L 166 312" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 130 296 L 145 265 L 160 296" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />

            {/* ── Right pine tree ───────────────────────────────────────── */}
            <line x1="855" y1="360" x2="855" y2="295" stroke="#ff6b9d" strokeWidth="2" />
            <path d="M 828 328 L 855 295 L 882 328" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 834 312 L 855 280 L 876 312" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 840 296 L 855 265 L 870 296" stroke="#ff6b9d" strokeWidth="1.8" strokeLinejoin="round" />

            {/* ── Birds ────────────────────────────────────────────────── */}
            <path
              d="M 360 200 C 372 188 382 200 394 188"
              stroke="#aaa" strokeWidth="1.8" strokeLinecap="round"
            />
            <path
              d="M 610 185 C 622 173 632 185 644 173"
              stroke="#aaa" strokeWidth="1.8" strokeLinecap="round"
            />
            <path
              d="M 430 230 C 440 220 448 230 458 220"
              stroke="#777" strokeWidth="1.5" strokeLinecap="round"
            />

            {/* ── Snow caps ─────────────────────────────────────────────── */}
            <path
              d="M 480 178 C 488 165 500 162 512 165 C 522 168 530 178 500 192 C 478 185 478 182 480 178"
              stroke="#eee" strokeWidth="1.5" strokeLinejoin="round"
            />

            {/* ── River / reflection ────────────────────────────────────── */}
            <path
              d="M 0 390 C 180 378 360 392 500 384 C 640 376 820 390 1000 382"
              stroke="#444" strokeWidth="1.5" strokeLinecap="round"
            />
            <path
              d="M 0 405 C 200 395 400 408 600 400 C 800 392 900 405 1000 398"
              stroke="#333" strokeWidth="1" strokeLinecap="round"
            />
          </svg>
        </ScrollDraw>
      </div>

    </section>
  );
}
