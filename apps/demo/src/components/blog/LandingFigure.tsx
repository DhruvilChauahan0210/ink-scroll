'use client';

import './b2-figures.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

export type LandingZone = { id: string; name: string; api: string };

/**
 * The complete guide's opening drawing: a key plan of one product landing page
 * that uses every pattern in the guide, each zone numbered to its section — the
 * reading-progress bar, the nav that highlights on scroll, the parallax hero
 * with its split headline and drawn logo, the stats that count, the cards that
 * fade up, the pinned product shot, the scrubbed video, the sideways gallery,
 * the colour-shifting band and the sections that snap. The key beside it links
 * each zone to its section.
 */

/** Marker positions: [zone number, side, y]. Left and right alternate so none collide. */
const MARKS: [number, 'l' | 'r', number][] = [
  [10, 'r', 21], [11, 'l', 34], [6, 'l', 70], [2, 'r', 84], [12, 'l', 108], [7, 'r', 147],
  [1, 'l', 185], [4, 'r', 240], [8, 'l', 296], [9, 'l', 339], [3, 'r', 372], [5, 'l', 414],
];

const pad = (n: number) => String(n).padStart(2, '0');

export function LandingFigure({ zones }: { zones: LandingZone[] }) {
  return (
    <ScrollDraw className="b2-lk" selector=".b2-ink" autoplay duration={700} delay={250} stagger={0.02} easing="ease-out" once>
      <svg className="b2-lk-svg" viewBox="0 0 196 442" role="img" aria-labelledby="b2-lk-t">
        <title id="b2-lk-t">
          A product landing page from top to bottom, with each scroll pattern from the guide marked where it is used.
        </title>
        <defs>
          <pattern id="b2-lk-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 V5" className="b2-hatch" />
          </pattern>
          <marker id="b2-lk-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8" className="b2-head" />
          </marker>
        </defs>

        {/* the browser and the page */}
        <rect x="28" y="4" width="140" height="434" rx="5" className="b2-ink b2-frame-ink" stroke="currentColor" />
        <path d="M28 17 H168" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M36 10.5 H38 M42 10.5 H44 M48 10.5 H50 M62 10.5 H150" className="b2-ink b2-thin" stroke="currentColor" />

        {/* 10 · reading progress from a CSS variable */}
        <path d="M28 21 H84" className="b2-ink b2-bar b2-acc-ink" stroke="currentColor" />
        {/* 11 · nav, the active link set from onEnter */}
        <rect x="34" y="28" width="12" height="11" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M100 34 H114 M122 34 H138 M146 34 H162" className="b2-ink b2-copy" stroke="currentColor" />
        <path d="M122 40 H138" className="b2-ink b2-acc-ink" stroke="currentColor" />
        <path d="M28 45 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 02 · parallax background: the shape and where scroll has moved it */}
        <circle cx="132" cy="78" r="22" className="b2-ink b2-off" stroke="currentColor" />
        <circle cx="132" cy="90" r="22" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M160 70 V92" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-lk-arr)" />
        {/* 06 · the headline, split into words */}
        <path d="M36 64 H56 M61 64 H78 M83 64 H98" className="b2-ink b2-word" stroke="currentColor" />
        <path d="M36 76 H62" className="b2-ink b2-word" stroke="currentColor" />
        <path d="M67 76 H88" className="b2-ink b2-word is-late" stroke="currentColor" />
        {/* 12 · the logo, drawn natively */}
        <path d="M36 112 C42 96 50 96 54 106 S62 120 68 106 S80 94 88 108" className="b2-ink b2-logo b2-acc-ink" stroke="currentColor" />
        <path d="M28 128 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 07 · stats that count up */}
        <path d="M36 142 H58 M80 142 H102 M124 142 H146" className="b2-ink b2-num" stroke="currentColor" />
        <path d="M36 152 H52 M80 152 H98 M124 152 H140" className="b2-ink b2-copy" stroke="currentColor" />
        <path d="M28 162 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 01 · cards that fade up, the last still arriving */}
        <rect x="34" y="170" width="38" height="30" className="b2-ink b2-thin" stroke="currentColor" />
        <rect x="79" y="170" width="38" height="30" className="b2-ink b2-thin" stroke="currentColor" />
        <rect x="124" y="177" width="38" height="30" className="b2-ink b2-off" stroke="currentColor" />
        <path d="M143 214 V204" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-lk-arr)" />
        <path d="M28 220 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 04 · product shot pinned, copy scrolling past */}
        <rect x="34" y="226" width="58" height="42" className="b2-ink b2-pin b2-acc-ink" stroke="currentColor" />
        <path d="M34 226 L92 268 M92 226 L34 268" className="b2-ink b2-x b2-acc-ink" stroke="currentColor" />
        <path d="M100 230 H150 M100 238 H158 M100 252 H146 M100 260 H156" className="b2-ink b2-copy" stroke="currentColor" />
        <path d="M28 276 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 08 · video scrubbed by scroll */}
        <rect x="34" y="282" width="128" height="28" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M93 289 L105 296 L93 303 Z" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M34 316 H162" className="b2-ink b2-hair" stroke="currentColor" />
        <path d="M34 316 H86" className="b2-ink b2-scrub b2-acc-ink" stroke="currentColor" />
        <circle cx="86" cy="316" r="2.6" className="b2-dot" />
        <path d="M28 324 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 09 · a gallery that runs sideways, off the page edge */}
        <rect x="34" y="330" width="44" height="22" className="b2-ink b2-thin" stroke="currentColor" />
        <rect x="83" y="330" width="44" height="22" className="b2-ink b2-thin" stroke="currentColor" />
        <path d="M168 330 H132 V352 H168" className="b2-ink b2-off" stroke="currentColor" />
        <path d="M120 358 H86" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-lk-arr)" />

        {/* 03 · a band whose colour scroll is changing */}
        <rect x="28" y="364" width="140" height="20" fill="url(#b2-lk-hatch)" className="b2-band" />
        <path d="M28 364 H168 M28 384 H168" className="b2-ink b2-hair" stroke="currentColor" />

        {/* 05 · full-height sections that snap */}
        <path d="M36 398 H70 M36 406 H62" className="b2-ink b2-copy" stroke="currentColor" />
        <path d="M28 416 H168" className="b2-ink b2-thin b2-acc-ink" stroke="currentColor" />
        <path d="M150 400 C160 404 160 410 154 414" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-lk-arr)" />
        <path d="M36 426 H74" className="b2-ink b2-copy" stroke="currentColor" />

        {/* zone markers */}
        {MARKS.map(([n, side, y]) => {
          const cx = side === 'l' ? 11 : 185;
          return (
            <g key={n}>
              <path d={side === 'l' ? `M21 ${y} H32` : `M164 ${y} H175`} className="b2-ink b2-lead" stroke="currentColor" />
              <circle cx={cx} cy={y} r="10" className="b2-mk" />
              <text x={cx} y={y + 3.8} className="b2-mk-t" textAnchor="middle">{pad(n)}</text>
            </g>
          );
        })}
      </svg>

      <ol className="b2-lk-key">
        {zones.map((z, i) => (
          <li key={z.id}>
            <a href={`#${z.id}`}>
              <span className="b2-lk-n">{pad(i + 1)}</span>
              <span className="b2-lk-t">{z.name}</span>
              <span className="b2-lk-api">{z.api}</span>
            </a>
          </li>
        ))}
      </ol>
    </ScrollDraw>
  );
}
