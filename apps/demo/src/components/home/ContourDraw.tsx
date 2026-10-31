'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The showpiece: fourteen contour rings, generated once with a deterministic
 * wobble so the server and the client agree, drawn in by scroll position
 * across a pinned, 320vh-tall chapter. Every fourth ring is vermilion.
 *
 * The ScrollDraw container is the tall stage itself — the trigger window is
 * measured on the container, and a sticky child never moves relative to the
 * viewport, so measuring that would give a progress stuck at zero.
 */
const RINGS = 14;
const STEPS = 84;
const CX = 500;
const CY = 420;

function ringPoints(i: number): [number, number][] {
  const pts: [number, number][] = [];
  const base = 34 + i * 24;
  for (let k = 0; k < STEPS; k++) {
    const a = (k / STEPS) * Math.PI * 2;
    const wob =
      Math.sin(a * 3 + i * 0.7) * 7 +
      Math.sin(a * 5 - i * 1.3) * 4 +
      Math.sin(a * 2 + i * 2.1) * 9 +
      Math.sin(a * 7 + i * 0.4) * 2;
    const r = base + wob * (0.5 + i * 0.07);
    pts.push([CX + Math.cos(a) * r * 1.38, CY + Math.sin(a) * r * 0.92]);
  }
  return pts;
}

/** Closed Catmull-Rom spline as cubic beziers. */
function closedSpline(p: [number, number][]): string {
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

const PATHS = Array.from({ length: RINGS }, (_, i) => ({
  d: closedSpline(ringPoints(i)),
  accent: i % 4 === 2,
}));

/* The chapter's copy lives here rather than as props: multi-child JSX handed
   from a server component to a client one trips React's key check. */
export function ContourDraw() {
  return (
    <ScrollDraw
      className="draw-stage"
      trigger={{ start: 'top top', end: 'bottom bottom' }}
      stagger={0.045}
      easing="ease-in-out"
    >
      <div className="draw-sticky">
        <div className="draw-panel">
          <div className="draw-top">
            <span className="label"><b>01</b> / scrollDraw</span>
            <h2 id="draw-title" className="h2">Scroll is the pen. <span className="dim">Scrub it.</span></h2>
          </div>
          <div className="contour">
            <svg viewBox="0 0 1000 840" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              {PATHS.map((p, i) => (
                <path key={i} d={p.d} className={p.accent ? 'ring ring-accent' : 'ring'} />
              ))}
            </svg>
          </div>
          <div className="draw-bottom">
            <p className="body">
              Fourteen rings, drawn by your scroll position. Go back up and they un-draw.
              No timeline to tune, no plugin to buy — one call, and the stroke follows the page.
            </p>
            <code className="draw-code">
              <b>scrollDraw</b>(&apos;#rings&apos;, {'{'} stagger: 0.045, easing: &apos;ease-in-out&apos; {'}'})
            </code>
          </div>
        </div>
      </div>
    </ScrollDraw>
  );
}
