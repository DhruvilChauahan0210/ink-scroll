'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/* ─────────────────────────────────────────────────────────────
   Bundle section — cliff-dive comparison line
   Transitions strokeColor from #ccc → #ff6b9d as it draws.
───────────────────────────────────────────────────────────── */
export function BundleGraphLine() {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[280px] h-[200px] pointer-events-none hidden lg:block">
      <ScrollDraw
        easing="ease-out"
        speed={0.9}
        once
        strokeColor={['#ccc', '#ff6b9d']}
      >
        <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
          <line x1="30" y1="10"  x2="30"  y2="175" stroke="#e0e0e0" strokeWidth="1" />
          <line x1="30" y1="175" x2="270" y2="175" stroke="#e0e0e0" strokeWidth="1" />
          <path
            d="M 30 20 C 80 22 110 24 140 28 C 165 32 180 150 210 168 C 235 172 255 173 270 173"
            stroke="#ccc" strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="30"  cy="20"  r="4" stroke="#bbb"    strokeWidth="2" fill="none" />
          <circle cx="270" cy="173" r="4" stroke="#ff6b9d" strokeWidth="2" fill="none" />
          <line x1="24" y1="20"  x2="18" y2="20"  stroke="#ddd" strokeWidth="1" />
          <line x1="24" y1="173" x2="18" y2="173" stroke="#ddd" strokeWidth="1" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CTA section — bold angular mark
   3 paths drawing on the yellow background.
───────────────────────────────────────────────────────────── */
export function CtaBoldMark() {
  return (
    <div className="absolute right-8 md:right-20 top-1/2 -translate-y-1/2 w-[180px] h-[220px] pointer-events-none hidden md:block opacity-[0.12]">
      <ScrollDraw
        easing="ease-in-out"
        speed={1}
        once
        stagger={0.2}
        fade
      >
        <svg width="180" height="220" viewBox="0 0 180 220" fill="none">
          <path d="M 20 20 L 160 80"   stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <path d="M 10 110 C 50 70 130 150 170 110" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <path d="M 20 190 L 160 140" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </ScrollDraw>
    </div>
  );
}
