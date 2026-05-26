'use client';

import { useRef, useEffect } from 'react';

function getLen(el: Element): number {
  const tag = el.tagName.toLowerCase();
  if (tag === 'circle') {
    const r = parseFloat(el.getAttribute('r') ?? '0');
    return 2 * Math.PI * r;
  }
  if (tag === 'ellipse') {
    const rx = parseFloat(el.getAttribute('rx') ?? '0');
    const ry = parseFloat(el.getAttribute('ry') ?? '0');
    return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  }
  if (tag === 'line') {
    const x1 = parseFloat(el.getAttribute('x1') ?? '0');
    const y1 = parseFloat(el.getAttribute('y1') ?? '0');
    const x2 = parseFloat(el.getAttribute('x2') ?? '0');
    const y2 = parseFloat(el.getAttribute('y2') ?? '0');
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  try { return (el as SVGGeometryElement).getTotalLength(); }
  catch { return 600; }
}

function easeOut(t: number): number {
  return t * (2 - t);
}

/**
 * Hero right-side cosmos illustration.
 * Uses the same stroke-dashoffset technique as svg-scroll-draw,
 * triggered on page load rather than scroll.
 */
export function HeroIllustration() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const DELAY  = 0.11;  // seconds between each element starting
    const DURATION = 1.6; // seconds per element

    const elements = Array.from(
      svg.querySelectorAll<Element>('path, circle, line, ellipse')
    );

    // Initialise all paths to invisible
    elements.forEach((el) => {
      const len = getLen(el);
      (el as SVGElement).style.strokeDasharray  = String(len);
      (el as SVGElement).style.strokeDashoffset = String(len);
      (el as SVGElement).style.opacity = '0';
    });

    const startTime = performance.now();
    let rafId: number;

    function tick() {
      const elapsed = (performance.now() - startTime) / 1000;

      elements.forEach((el, i) => {
        const delay = i * DELAY;
        const raw   = Math.min(1, Math.max(0, (elapsed - delay) / DURATION));
        const alpha = easeOut(raw);
        const len   = getLen(el);
        (el as SVGElement).style.strokeDashoffset = String(len * (1 - alpha));
        (el as SVGElement).style.opacity           = String(alpha);
      });

      const totalTime = (elements.length - 1) * DELAY + DURATION;
      if (elapsed < totalTime) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <svg
      ref={ref}
      width="420"
      height="360"
      viewBox="0 0 420 360"
      fill="none"
      aria-hidden="true"
    >
      {/* ── Stars ─────────────────────────────────────────── */}
      <circle cx="40"  cy="30"  r="2.5" stroke="#111" strokeWidth="1.8" />
      <circle cx="65"  cy="58"  r="2"   stroke="#111" strokeWidth="1.5" />
      <circle cx="42"  cy="88"  r="3"   stroke="#111" strokeWidth="1.8" />
      <circle cx="375" cy="28"  r="2.5" stroke="#111" strokeWidth="1.8" />
      <circle cx="402" cy="90"  r="2"   stroke="#111" strokeWidth="1.5" />
      <circle cx="395" cy="255" r="2"   stroke="#111" strokeWidth="1.5" />

      {/* ── Constellation lines (cluster top-left) ──────── */}
      <line x1="40"  y1="30"  x2="65"  y2="58"  stroke="#111" strokeWidth="0.9" />
      <line x1="65"  y1="58"  x2="42"  y2="88"  stroke="#111" strokeWidth="0.9" />
      <line x1="42"  y1="88"  x2="40"  y2="30"  stroke="#111" strokeWidth="0.9" />

      {/* ── Outer orbit ─────────────────────────────────── */}
      <ellipse
        cx="210" cy="180" rx="178" ry="106"
        stroke="#bbb" strokeWidth="1"
        strokeDasharray="5 8"
      />

      {/* ── Inner orbit ─────────────────────────────────── */}
      <ellipse
        cx="210" cy="180" rx="94" ry="56"
        stroke="#ccc" strokeWidth="1"
        strokeDasharray="3 6"
      />

      {/* ── Sun ─────────────────────────────────────────── */}
      <circle cx="210" cy="180" r="22" stroke="#ffc900" strokeWidth="2.5" />

      {/* ── Sun rays ────────────────────────────────────── */}
      <line x1="210" y1="154" x2="210" y2="143" stroke="#ffc900" strokeWidth="2" />
      <line x1="232" y1="180" x2="243" y2="180" stroke="#ffc900" strokeWidth="2" />
      <line x1="210" y1="206" x2="210" y2="217" stroke="#ffc900" strokeWidth="2" />
      <line x1="188" y1="180" x2="177" y2="180" stroke="#ffc900" strokeWidth="2" />

      {/* ── Planet 1 — pink, inner orbit right ──────────── */}
      <circle cx="304" cy="180" r="13" stroke="#ff6b9d" strokeWidth="2.2" />
      <path
        d="M 289 180 C 292 171 316 171 319 180"
        stroke="#ff6b9d" strokeWidth="1.5" strokeLinecap="round"
      />

      {/* ── Planet 2 — yellow, outer orbit lower-right ─── */}
      <circle cx="362" cy="234" r="14" stroke="#ffc900" strokeWidth="2" />
      <path
        d="M 346 234 C 349 225 375 225 378 234"
        stroke="#ffc900" strokeWidth="1.5" strokeLinecap="round"
      />

      {/* ── Comet ───────────────────────────────────────── */}
      <path
        d="M 390 48 C 360 72 330 100 308 118"
        stroke="#999" strokeWidth="2" strokeLinecap="round"
      />
      <path
        d="M 390 48 L 412 34"
        stroke="#bbb" strokeWidth="1.2" strokeLinecap="round"
      />
      <path
        d="M 390 48 L 408 44"
        stroke="#ccc" strokeWidth="1" strokeLinecap="round"
      />
    </svg>
  );
}
