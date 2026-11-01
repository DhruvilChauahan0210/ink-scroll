'use client';

import './b2-figures.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The horizontal-scroll post's opening drawing: the real three-layer layout,
 * caught at p = 0.5. Above, the track of four 100vw sections, translated left
 * by p · distance, with the sticky stage (one viewport) over it — panels outside
 * the stage are off-screen, so they are dashed. Below, the outer container's
 * scroll runway: the default trigger runs top top → bottom bottom, and the
 * marker on it is the scroll position that produced the track above.
 */

const PANEL = 92;
const PANELS = 4;
const STAGE_X = 184; // where the sticky stage (the viewport) sits
const P = 0.5;
const DIST = (PANELS - 1) * PANEL; // track.scrollWidth − innerWidth
const TRACK_X = STAGE_X - P * DIST;
const AX0 = 60;
const AX1 = 380;

export function HorizontalFigure() {
  return (
    <ScrollDraw className="b2-hz" selector=".b2-ink" autoplay duration={900} delay={300} stagger={0.05} easing="ease-out" once>
      <svg viewBox="0 0 440 318" role="img" aria-labelledby="b2-hz-t">
        <title id="b2-hz-t">
          Four full-width sections in a horizontal track, translated left by half the travel distance, under a sticky
          viewport; below, the outer container&apos;s scroll runway from top top to bottom bottom with the current
          position at p = 0.5.
        </title>
        <defs>
          <marker id="b2-hz-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8" className="b2-head" />
          </marker>
        </defs>

        {/* ── The track, translated ── */}
        <text x={TRACK_X} y="16" className="b2-k">.track</text>
        <text x={TRACK_X + PANELS * PANEL} y="16" className="b2-v b2-acc" textAnchor="end">translateX(−p · distance)</text>
        <path d={`M${TRACK_X + PANELS * PANEL} 30 H${TRACK_X + PANELS * PANEL - 84}`} className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-hz-arr)" />
        {Array.from({ length: PANELS }, (_, i) => {
          const x = TRACK_X + i * PANEL;
          const seen = x + PANEL > STAGE_X && x < STAGE_X + PANEL;
          return (
            <g key={i}>
              <rect x={x} y="48" width={PANEL} height="84" className={`b2-ink ${seen ? 'b2-panel' : 'b2-off'}`} stroke="currentColor" />
              <path d={`M${x + 12} 72 H${x + 54}`} className={`b2-ink ${seen ? 'b2-copy-h' : 'b2-off'}`} stroke="currentColor" />
              <path d={`M${x + 12} 84 H${x + 70} M${x + 12} 93 H${x + 62}`} className={`b2-ink ${seen ? 'b2-copy' : 'b2-off'}`} stroke="currentColor" />
              <text x={x + 12} y="122" className={seen ? 'b2-v' : 'b2-m'}>{`section ${i + 1}`}</text>
            </g>
          );
        })}
        {/* the sticky stage: one viewport, overflow hidden */}
        <rect x={STAGE_X - 4} y="42" width={PANEL + 8} height="96" rx="6" className="b2-ink b2-stage" stroke="currentColor" />
        <text x={STAGE_X - 4 + (PANEL + 8) / 2} y="154" className="b2-v b2-acc" textAnchor="middle">.sticky · 100vh</text>

        {/* distance: panel 1's left edge to panel 4's */}
        <path d={`M${TRACK_X} 166 V178 M${TRACK_X + DIST} 166 V178`} className="b2-ink b2-thin" stroke="currentColor" />
        <path d={`M${TRACK_X + 4} 172 H${TRACK_X + DIST - 4}`} className="b2-ink b2-dim" stroke="currentColor" markerStart="url(#b2-hz-arr)" markerEnd="url(#b2-hz-arr)" />
        <text x={TRACK_X + DIST / 2} y="192" className="b2-v" textAnchor="middle">distance = track.scrollWidth − innerWidth</text>

        {/* ── The outer container's runway ── */}
        <path d={`M${AX0 + P * (AX1 - AX0)} 204 V258`} className="b2-ink b2-lead" stroke="currentColor" />
        <path d="M20 258 H420" className="b2-ink b2-thin" stroke="currentColor" markerEnd="url(#b2-hz-arr)" />
        <text x="420" y="246" className="b2-m" textAnchor="end">scrollY</text>
        <path d={`M${AX0} 258 H${AX1}`} className="b2-ink b2-zone" stroke="currentColor" />
        <path d={`M${AX0} 246 V270 M${AX1} 246 V270`} className="b2-ink b2-tick" stroke="currentColor" />
        <text x={AX0} y="236" className="b2-k" dx="-2">.outer · 400vh</text>
        <circle cx={AX0 + P * (AX1 - AX0)} cy="258" r="3.5" className="b2-dot" />
        <text x={AX0 + P * (AX1 - AX0) + 8} y="250" className="b2-v b2-acc">p = {P}</text>

        <text x={AX0} y="290" className="b2-v" textAnchor="middle">top top</text>
        <text x={AX0} y="308" className="b2-m" textAnchor="middle">p = 0</text>
        <text x={(AX0 + AX1) / 2} y="290" className="b2-v" textAnchor="middle">onProgress(p)</text>
        <text x={(AX0 + AX1) / 2} y="308" className="b2-m" textAnchor="middle">linear = scrub</text>
        <text x={AX1} y="290" className="b2-v" textAnchor="middle">bottom bottom</text>
        <text x={AX1} y="308" className="b2-m" textAnchor="middle">p = 1</text>
      </svg>
    </ScrollDraw>
  );
}
