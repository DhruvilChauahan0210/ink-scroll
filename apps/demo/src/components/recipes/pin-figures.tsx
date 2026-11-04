'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/*
 * The figures beside each step of the pinned feature tour. Diagrams of what
 * scrollPin really does, inked by the library as they scroll in: pencil for
 * the page and the viewport, ink for the stage.
 */

const INK = { start: 'top 85%', end: 'top 40%' };

/** The tour's three drawings, as in the recipe file. */
const ART = [
  [
    'M 8 112 C 44 84 78 88 104 98 S 160 80 192 92',
    'M 8 138 C 58 116 122 132 192 120',
    'M 30 104 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0',
    'M 150 26 A 16 16 0 1 1 150 58 A 16 16 0 1 1 150 26',
  ],
  [
    'M 64 46 H 136 A 32 32 0 0 1 136 110 H 64 A 32 32 0 0 1 64 46 Z',
    'M 100 62 A 16 16 0 1 1 100 94 A 16 16 0 1 1 100 62',
    'M 120 46 V 24 H 132 V 46',
    'M 70 110 V 128 M 130 110 V 128',
    'M 100 152 C 88 142 92 132 100 124 C 108 132 112 142 100 152 Z',
  ],
  [
    'M 50 62 L 100 42 L 150 62 L 150 118 L 100 138 L 50 118 Z',
    'M 50 62 L 100 82 L 150 62 M 100 82 V 138',
    'M 76 52 L 126 72',
    'M 18 96 H 38 M 24 110 H 40',
  ],
];

/** Step 1: the screen, the header, and the stage that fills what is left. */
export function FigStage() {
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" once>
      <svg className="rf-svg" viewBox="0 0 240 180" role="img" aria-label="The viewport, the header at its top, and the stage filling the rest: 100svh minus the header.">
        <defs>
          <pattern id="rf-hatch-pin" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line className="rf-hatch-line" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>
        <rect className="rf-frame" x="40" y="10" width="140" height="160" />
        <rect x="40" y="10" width="140" height="18" fill="url(#rf-hatch-pin)" />
        <text className="rf-t" x="34" y="22" textAnchor="end">header</text>
        <path className="rf-ink" d="M 40 28 H 180 V 170 H 40 Z" strokeWidth="1.6" />
        <path className="rf-ink" d="M 52 68 H 106 V 128 H 52 Z" strokeWidth="1" />
        <path className="rf-ink" d="M 116 74 H 166 M 116 82 H 158 M 116 100 H 150 M 116 108 H 160 M 116 122 H 146" strokeWidth="1" />
        <path className="rf-dim" d="M 196 28 V 170 M 192 28 H 200 M 192 170 H 200" />
        <text className="rf-t" x="204" y="96">100svh</text>
        <text className="rf-t" x="204" y="108">− header</text>
        <text className="rf-t" x="110" y="160" textAnchor="middle">.tour-stage</text>
      </svg>
    </ScrollDraw>
  );
}

/**
 * Step 2: the wrapper scrollPin adds stays in the page; the viewport slides
 * down it. The stage rides along at `top` while the viewport is inside, and
 * comes to rest at the wrapper's bottom when it leaves.
 */
export function FigPinStates() {
  const cols = [
    { x: 14, label: 'before', vy: 8, sy: 40 },
    { x: 92, label: 'pinned', vy: 66, sy: 74 },
    { x: 170, label: 'after', vy: 118, sy: 150 },
  ];
  return (
    <ScrollDraw selector=".rf-ink" trigger={INK} easing="ease-out" stagger={0.25} once>
      <svg className="rf-svg" viewBox="0 0 240 244" role="img" aria-label="Before: the stage at the top of its wrapper. Pinned: fixed below the header while the wrapper scrolls. After: at the wrapper's bottom.">
        {cols.map((c) => (
          <g key={c.label}>
            <rect className="rf-wrap" x={c.x} y="40" width="56" height="150" />
            <rect className="rf-view" x={c.x - 6} y={c.vy} width="68" height="78" />
            <path className="rf-ink" d={`M ${c.x + 4} ${c.sy} h 48 v 40 h -48 Z`} strokeWidth="1.6" />
            <text className="rf-t" x={c.x + 28} y="216" textAnchor="middle">{c.label}</text>
          </g>
        ))}
        <text className="rf-t" x="120" y="238" textAnchor="middle">dashed: wrapper · grey: screen · ink: stage</text>
      </svg>
    </ScrollDraw>
  );
}

/** Step 3: progress 0 → 1 through the pin, cut into thirds — floor(p × 3) is the feature. */
export function FigThirds() {
  const x = (p: number) => 20 + p * 200;
  return (
    <div className="rf-full">
      <ScrollDraw selector=".rf-ink" trigger={INK} easing="linear" once>
        <svg className="rf-svg" viewBox="0 0 240 132" role="img" aria-label="Progress from 0 to 1 split into thirds; each third shows one feature.">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <g transform={`translate(${x(i / 3) + 9} 4) scale(0.26)`}>
                {ART[i].map((d) => <path key={d} className="rf-art" d={d} />)}
              </g>
              <text className="rf-t" x={x((i + 0.5) / 3)} y="60" textAnchor="middle">0{i + 1}</text>
            </g>
          ))}
          <path className="rf-dim" d={`M ${x(0)} 76 H ${x(1)}`} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} className="rf-dim" d={`M ${x(k / 3)} 70 V 82`} />
          ))}
          <path className="rf-ink" d={`M ${x(0)} 76 H ${x(1)}`} strokeWidth="3" />
          <text className="rf-t" x={x(0)} y="98" textAnchor="middle">0</text>
          <text className="rf-t" x={x(1 / 3)} y="98" textAnchor="middle">⅓</text>
          <text className="rf-t" x={x(2 / 3)} y="98" textAnchor="middle">⅔</text>
          <text className="rf-t" x={x(1)} y="98" textAnchor="middle">1</text>
          <text className="rf-t rf-t-ink" x="120" y="122" textAnchor="middle">i = floor(p × 3)</text>
        </svg>
      </ScrollDraw>
    </div>
  );
}

/** Step 4: each drawing gets its own third — the same schedule seek() gives them in the tour. */
export function FigThirdsDrawn() {
  const windows = [
    { start: 'top 85%', end: 'top 70%' },
    { start: 'top 70%', end: 'top 55%' },
    { start: 'top 55%', end: 'top 40%' },
  ];
  return (
    <div className="rf-row3">
      {ART.map((paths, i) => (
        <div key={i} className="rf-cell">
          <ScrollDraw selector=".rf-art-ink" trigger={windows[i]} easing="linear" once>
            <svg className="rf-svg" viewBox="0 0 200 160" aria-hidden="true">
              {paths.map((d) => <path key={d} className="rf-art-ink" d={d} />)}
            </svg>
          </ScrollDraw>
          <p className="rf-k">0{i + 1} · {['p × 3', 'p × 3 − 1', 'p × 3 − 2'][i]}</p>
        </div>
      ))}
    </div>
  );
}
