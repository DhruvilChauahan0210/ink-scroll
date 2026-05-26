'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/* ─────────────────────────────────────────────────────────────
   Hero — orbital arcs (top-right, complements CSS circles)
   Four sweeping curves draw in with stagger, opacity 0.07
───────────────────────────────────────────────────────────── */
export function HeroOrbitalDecor() {
  return (
    <div className="absolute top-0 right-0 w-[520px] h-[520px] pointer-events-none z-[1] opacity-[0.07]">
      <ScrollDraw easing="ease-out" speed={0.55} fade once stagger={0.14}>
        <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
          <path d="M 520 0 C 520 230 230 520 0 520"
            stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 520 70 C 490 270 210 500 20 510"
            stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 520 160 C 460 310 170 470 0 450"
            stroke="#ff6b9d" strokeWidth="1" strokeLinecap="round" />
          <path d="M 520 270 C 420 360 130 430 0 370"
            stroke="#111" strokeWidth="0.7" strokeLinecap="round" strokeDasharray="5 9" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero — constellation (bottom-left)
   6 nodes + 7 connecting lines draw in sequence, opacity 0.08
───────────────────────────────────────────────────────────── */
export function HeroConstellationDecor() {
  return (
    <div className="absolute bottom-10 left-0 w-[300px] h-[240px] pointer-events-none z-[1] opacity-[0.08]">
      <ScrollDraw easing="ease-out" speed={0.6} fade once stagger={0.05}>
        <svg width="300" height="240" viewBox="0 0 300 240" fill="none">
          <circle cx="40"  cy="160" r="4"   stroke="#111"    strokeWidth="2" />
          <circle cx="100" cy="100" r="3"   stroke="#111"    strokeWidth="2" />
          <circle cx="185" cy="130" r="4"   stroke="#111"    strokeWidth="2" />
          <circle cx="245" cy="70"  r="3"   stroke="#111"    strokeWidth="2" />
          <circle cx="210" cy="190" r="3.5" stroke="#ffc900" strokeWidth="2" />
          <circle cx="80"  cy="205" r="3"   stroke="#111"    strokeWidth="2" />
          <line x1="40"  y1="160" x2="100" y2="100" stroke="#111" strokeWidth="0.9" />
          <line x1="100" y1="100" x2="185" y2="130" stroke="#111" strokeWidth="0.9" />
          <line x1="185" y1="130" x2="245" y2="70"  stroke="#111" strokeWidth="0.9" />
          <line x1="185" y1="130" x2="210" y2="190" stroke="#111" strokeWidth="0.7" />
          <line x1="40"  y1="160" x2="80"  y2="205" stroke="#111" strokeWidth="0.7" />
          <line x1="80"  y1="205" x2="210" y2="190" stroke="#111" strokeWidth="0.6" />
          <line x1="100" y1="100" x2="210" y2="190" stroke="#111" strokeWidth="0.5"
                strokeDasharray="3 6" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Problems section — flowing S-curve (right side)
   Single organic bezier, yellow, opacity 0.18
───────────────────────────────────────────────────────────── */
export function ProblemsCurveDecor() {
  return (
    <div className="absolute top-0 right-0 w-[220px] h-full pointer-events-none z-0 opacity-[0.18]">
      <ScrollDraw easing="ease-in-out" speed={0.7} fade once>
        <svg width="220" height="400" viewBox="0 0 220 400" preserveAspectRatio="none" fill="none">
          <path d="M 180 0 C 60 60 220 140 80 200 C -20 250 200 320 120 400"
            stroke="#ffc900" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bundle size section — measurement brackets (left side)
   Technical tick marks, black, opacity 0.12
───────────────────────────────────────────────────────────── */
export function BundleMeasureDecor() {
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 w-[56px] h-[280px] pointer-events-none z-0 opacity-[0.12]">
      <ScrollDraw easing="ease-out" speed={0.8} once stagger={0.12}>
        <svg width="56" height="280" viewBox="0 0 56 280" fill="none">
          <line x1="28" y1="10"  x2="28" y2="270" stroke="#111" strokeWidth="1.5" />
          <line x1="16" y1="10"  x2="40" y2="10"  stroke="#111" strokeWidth="2" />
          <line x1="16" y1="270" x2="40" y2="270" stroke="#111" strokeWidth="2" />
          <line x1="20" y1="75"  x2="36" y2="75"  stroke="#111" strokeWidth="1.5" />
          <line x1="20" y1="140" x2="36" y2="140" stroke="#111" strokeWidth="1.5" />
          <line x1="20" y1="205" x2="36" y2="205" stroke="#111" strokeWidth="1.5" />
          <line x1="22" y1="42"  x2="34" y2="42"  stroke="#111" strokeWidth="1" />
          <line x1="22" y1="107" x2="34" y2="107" stroke="#111" strokeWidth="1" />
          <line x1="22" y1="172" x2="34" y2="172" stroke="#111" strokeWidth="1" />
          <line x1="22" y1="237" x2="34" y2="237" stroke="#111" strokeWidth="1" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   API reference section — radial spoke wheel (left background)
   6 spokes + 2 rings draw in, opacity 0.055
───────────────────────────────────────────────────────────── */
export function ApiRadialDecor() {
  return (
    <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-[340px] h-[340px] pointer-events-none z-0 opacity-[0.055]">
      <ScrollDraw easing="ease-out" speed={0.65} fade once stagger={0.09}>
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
          <circle cx="170" cy="170" r="150" stroke="#111" strokeWidth="1.5" />
          <circle cx="170" cy="170" r="55"  stroke="#111" strokeWidth="1.5" />
          <line x1="225" y1="170" x2="320" y2="170" stroke="#111" strokeWidth="1.5" />
          <line x1="197" y1="218" x2="245" y2="300" stroke="#111" strokeWidth="1.5" />
          <line x1="143" y1="218" x2="95"  y2="300" stroke="#111" strokeWidth="1.5" />
          <line x1="115" y1="170" x2="20"  y2="170" stroke="#111" strokeWidth="1.5" />
          <line x1="143" y1="122" x2="95"  y2="40"  stroke="#111" strokeWidth="1.5" />
          <line x1="197" y1="122" x2="245" y2="40"  stroke="#111" strokeWidth="1.5" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CTA section — bold diagonal slashes (yellow bg)
   3 angular marks, black, opacity 0.06
───────────────────────────────────────────────────────────── */
export function CtaSlashDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]">
      <ScrollDraw easing="ease-in-out" speed={0.9} fade once stagger={0.2}>
        <svg width="100%" height="100%" viewBox="0 0 800 300"
             preserveAspectRatio="xMidYMid slice" fill="none">
          <path d="M -40 300 L 200 -20"  stroke="#111" strokeWidth="4" strokeLinecap="round" />
          <path d="M 200 300 L 500 -20"  stroke="#111" strokeWidth="4" strokeLinecap="round" />
          <path d="M 520 300 L 840 -20"  stroke="#111" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </ScrollDraw>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Quickstart section — nested corner bracket (top-right)
   Angular L-shapes, pink, opacity 0.22
───────────────────────────────────────────────────────────── */
export function QuickstartBracketDecor() {
  return (
    <div className="absolute top-6 right-6 w-[80px] h-[80px] pointer-events-none z-0 opacity-[0.22]">
      <ScrollDraw easing="ease-out" speed={0.85} once stagger={0.3}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M 80 10 L 10 10 L 10 80"
            stroke="#ff6b9d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 80 28 L 28 28 L 28 80"
            stroke="#ff6b9d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ScrollDraw>
    </div>
  );
}
