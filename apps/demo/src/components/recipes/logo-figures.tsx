'use client';

import { useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the logo recipe. Each shows one stage of the
 * real thing, drawn by the library with the options that step introduces, in
 * the site's own ink — pencil for what is only planned, ink for what draws.
 */

const ring = (r: number) =>
  `M 100 ${100 - r} A ${r} ${r} 0 1 1 100 ${100 + r} A ${r} ${r} 0 1 1 100 ${100 - r}`;
const BEAN = 'M 100 58 C 124 58 132 84 130 104 C 128 126 114 142 100 142 C 76 142 68 116 70 96 C 72 74 86 58 100 58 Z';
const CREASE = 'M 101 60 C 86 84 116 114 99 140';

const OUTLINE = [
  { k: 'outer ring', d: ring(86), w: 2.4 },
  { k: 'inner ring', d: ring(70), w: 1 },
  { k: 'bean', d: BEAN, w: 2.4 },
  { k: 'crease', d: CREASE, w: 2.4 },
];

/** The recipe's own trigger, so every figure draws on the same schedule as the code beside it. */
const TRIGGER = { start: 'top 85%', end: 'top 35%' };
const STAGGER = 0.12;

function Outline() {
  return (
    <>
      {OUTLINE.map((o) => (
        <path key={o.k} className={`rf-ink rf-${o.k.replace(' ', '-')}`} d={o.d} strokeWidth={o.w} />
      ))}
    </>
  );
}

/**
 * The colour shapes. `hatched` draws them the way a drawing sheet marks a
 * filled area — hatching — so in fig. 1.2 they read as "there, but not drawn"
 * even where the ink outline runs over their edges.
 */
function Colour({ hatched = false }: { hatched?: boolean }) {
  if (hatched) {
    return (
      <>
        <defs>
          <pattern id="rf-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line className="rf-hatch-line" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>
        <path className="rf-hatched" d={ring(70)} />
        <path className="rf-hatched" d={BEAN} />
      </>
    );
  }
  return (
    <>
      <path className="rf-disc" d={ring(70)} />
      <path className="rf-beanfill" d={BEAN} />
    </>
  );
}

function Emblem({ children }: { children: React.ReactNode }) {
  return (
    <svg className="rf-svg" viewBox="0 0 200 200" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Step 1: the logo as two layers — an outline that can be drawn, and colour that waits. */
export function FigLayers() {
  return (
    <div className="rf-pair">
      <div className="rf-cell">
        <ScrollDraw selector=".rf-ink" trigger={TRIGGER} easing="ease-out" once>
          <Emblem><Outline /></Emblem>
        </ScrollDraw>
        <p className="rf-k">.logo-line — stroked, drawn</p>
      </div>
      <span className="rf-plus" aria-hidden="true">+</span>
      <div className="rf-cell">
        <Emblem><Colour /></Emblem>
        <p className="rf-k">.logo-fill — filled, hidden</p>
      </div>
    </div>
  );
}

/** Step 2: the selector inks the outline and leaves the colour shapes as they are. */
export function FigSelector() {
  return (
    <div className="rf-solo">
      <ScrollDraw selector=".rf-ink" trigger={TRIGGER} easing="ease-out" once>
        <Emblem>
          <Colour hatched />
          <Outline />
        </Emblem>
      </ScrollDraw>
      <ul className="rf-legend">
        <li><span className="rf-sw rf-sw-ink" />drawn — matches <code>.logo-line</code></li>
        <li><span className="rf-sw rf-sw-hatch" />left alone — <code>.logo-fill</code></li>
      </ul>
    </div>
  );
}

/**
 * Step 3: when each stroke draws. Path i draws over the trigger's range shifted
 * by i × stagger of it — the engine's own arithmetic — so the last of four ends
 * 0.36 of the range after `end`. The chart and the emblem share the trigger and
 * the top of the figure, so they draw in step.
 */
export function FigStagger() {
  const span = 1 + (OUTLINE.length - 1) * STAGGER; // 1.36
  const x = (t: number) => 34 + (t / span) * 200;
  return (
    <div className="rf-timing">
      <ScrollDraw selector=".rf-ink" trigger={TRIGGER} easing="ease-out" stagger={STAGGER} once>
        <Emblem><Outline /></Emblem>
      </ScrollDraw>
      <ScrollDraw selector=".rf-bar" trigger={TRIGGER} easing="linear" stagger={STAGGER} once>
        <svg className="rf-chart" viewBox="0 0 250 132" role="img" aria-label="Each stroke starts 0.12 of the range after the one before; the last finishes 0.36 after end.">
          <line className="rf-axis" x1={x(0)} x2={x(span)} y1="112" y2="112" />
          {[0, 1, span].map((t) => (
            <line key={t} className="rf-tick" x1={x(t)} x2={x(t)} y1="8" y2="116" />
          ))}
          <text className="rf-t" x={x(0)} y="128" textAnchor="middle">start</text>
          <text className="rf-t" x={x(1)} y="128" textAnchor="middle">end</text>
          <text className="rf-t" x={x(span)} y="128" textAnchor="middle">+0.36</text>
          {OUTLINE.map((o, i) => {
            const y = 20 + i * 24;
            return (
              <g key={o.k}>
                <text className="rf-t" x="0" y={y + 4}>{i + 1}</text>
                <line className="rf-slot" x1={x(i * STAGGER)} x2={x(1 + i * STAGGER)} y1={y} y2={y} />
                <path className="rf-bar" d={`M ${x(i * STAGGER)} ${y} H ${x(1 + i * STAGGER)}`} />
              </g>
            );
          })}
        </svg>
      </ScrollDraw>
      <p className="rf-k rf-wide">1 outer ring · 2 inner ring · 3 bean · 4 crease — the order of the paths</p>
    </div>
  );
}

/** Step 4: the real hand-off — the outline finishes, onComplete fires, the colour floods. */
export function FigFlood() {
  const [inked, setInked] = useState(false);
  return (
    <div className="rf-solo">
      <ScrollDraw
        className={inked ? 'rf-flood is-inked' : 'rf-flood'}
        selector=".rf-ink"
        trigger={TRIGGER}
        easing="ease-out"
        stagger={STAGGER}
        once
        onComplete={() => setInked(true)}
      >
        <Emblem>
          <g className="rf-fills"><Colour /></g>
          <Outline />
        </Emblem>
      </ScrollDraw>
      <p className="rf-state" aria-live="polite">
        {inked ? <>onComplete → <code>.is-inked</code></> : 'drawing — keep scrolling'}
      </p>
    </div>
  );
}
