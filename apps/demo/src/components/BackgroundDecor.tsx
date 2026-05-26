'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/* ─────────────────────────────────────────────────────────────
   1. HERO WAVE ILLUSTRATION
   6 layered wave paths spanning the full width of the hero,
   drawing in with stagger as you scroll — the first thing a
   visitor sees that shows the library in action on itself.
───────────────────────────────────────────────────────────── */
export function HeroWaveIllustration() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[160px] pointer-events-none overflow-hidden">
      <ScrollDraw
        easing="ease-out"
        speed={0.7}
        fade
        once
        stagger={0.1}
      >
        <svg
          width="100%"
          height="160"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Bold black — primary wave */}
          <path
            d="M 0 90 C 180 35 360 145 540 75 C 720 5 900 125 1080 70 C 1260 10 1380 80 1440 90"
            stroke="#111" strokeWidth="2" strokeLinecap="round"
          />
          {/* Pink — offset phase */}
          <path
            d="M 0 105 C 180 50 360 160 540 90 C 720 20 900 140 1080 85 C 1260 25 1380 95 1440 105"
            stroke="#ff6b9d" strokeWidth="1.5" strokeLinecap="round"
          />
          {/* Yellow — counter-phase */}
          <path
            d="M 0 72 C 180 128 360 18 540 88 C 720 158 900 48 1080 118 C 1260 155 1380 88 1440 72"
            stroke="#ffc900" strokeWidth="1.5" strokeLinecap="round"
          />
          {/* Medium black — slightly below primary */}
          <path
            d="M 0 118 C 180 63 360 173 540 103 C 720 33 900 153 1080 98 C 1260 33 1380 113 1440 118"
            stroke="#111" strokeWidth="0.9" strokeLinecap="round"
          />
          {/* Pink dashed */}
          <path
            d="M 0 58 C 180 113 360 3 540 73 C 720 143 900 33 1080 103 C 1260 143 1380 73 1440 58"
            stroke="#ff6b9d" strokeWidth="0.8" strokeLinecap="round"
            strokeDasharray="8 12"
          />
          {/* Subtle black — deepest */}
          <path
            d="M 0 135 C 180 80 360 190 540 120 C 720 50 900 170 1080 115 C 1260 50 1380 130 1440 135"
            stroke="#333" strokeWidth="0.5" strokeLinecap="round"
          />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. BUNDLE COMPARISON GRAPH LINE
   A single dramatic "cliff-dive" path in the bundle section —
   starts high (heavy competitors), then drops off a cliff to
   our tiny 3KB. Color transitions from #aaa → #ff6b9d using
   strokeColor as the path draws. Clean, editorial, powerful.
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
          {/* Axis lines */}
          <line x1="30" y1="10" x2="30" y2="175" stroke="#ddd" strokeWidth="1" />
          <line x1="30" y1="175" x2="270" y2="175" stroke="#ddd" strokeWidth="1" />
          {/* Cliff-dive comparison line — high → dramatic drop → settled low */}
          <path
            d="M 30 20 C 80 22 110 24 140 28 C 165 32 180 150 210 168 C 235 172 255 173 270 173"
            stroke="#ccc" strokeWidth="3" strokeLinecap="round"
          />
          {/* Dot markers */}
          <circle cx="30"  cy="20"  r="4" stroke="#bbb"    strokeWidth="2" fill="none" />
          <circle cx="270" cy="173" r="4" stroke="#ff6b9d" strokeWidth="2" fill="none" />
          {/* Labels */}
          <line x1="24" y1="20"  x2="18" y2="20"  stroke="#ccc" strokeWidth="1" />
          <line x1="24" y1="173" x2="18" y2="173" stroke="#ccc" strokeWidth="1" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. CTA BOLD MARK
   Three bold angular paths on the yellow CTA background —
   an abstract mark that draws itself dramatically with stagger.
   Dark on yellow, confident and editorial.
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
          {/* Top diagonal slash */}
          <path
            d="M 20 20 L 160 80"
            stroke="#111" strokeWidth="5" strokeLinecap="round"
          />
          {/* Middle sweeping curve */}
          <path
            d="M 10 110 C 50 70 130 150 170 110"
            stroke="#111" strokeWidth="5" strokeLinecap="round"
          />
          {/* Bottom diagonal slash (reversed) */}
          <path
            d="M 20 190 L 160 140"
            stroke="#111" strokeWidth="5" strokeLinecap="round"
          />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. SECTION CONNECTOR — thin vertical line drawn between
   major sections, giving a sense of continuous motion.
───────────────────────────────────────────────────────────── */
export function SectionConnector() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-full pointer-events-none opacity-[0.08]">
      <ScrollDraw easing="linear" speed={0.5} once>
        <svg width="2" height="100%" viewBox="0 0 2 400" preserveAspectRatio="none" fill="none">
          <line x1="1" y1="0" x2="1" y2="400" stroke="#111" strokeWidth="1.5" />
        </svg>
      </ScrollDraw>
    </div>
  );
}
