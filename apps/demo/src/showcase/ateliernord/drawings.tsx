'use client';

import { r1, rng } from './plates';

/*
 * Atelier Nord's line drawings: the Bryggen Library section the page inks in
 * with ScrollDraw (only the `.dr` lines draw — the annotation layer of levels,
 * grid bubbles and room names is printed on the sheet already), a 1:5 joint
 * detail, a daylight study, a masterplan, the Oslo studio plan and two maps.
 */

/* ── Scale figures, the people every architectural drawing has ───────────── */
function Stand({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle className="dr" cx="0" cy="-37.5" r="4.5" />
      <path className="dr" d="M-6 -31 C-7.4 -31 -8 -30 -8 -28 L-8 -16 L-6 -16 L-5 0 L-1 0 L0 -12 L1 0 L5 0 L6 -16 L8 -16 L8 -28 C8 -30 7.4 -31 6 -31 Z" />
    </g>
  );
}
function Seat({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <circle className="dr" cx="0" cy="-33.5" r="4.5" />
      <path className="dr" d="M-5 -27 L5 -27 L6 -15 L17 -15 L17 0 L13 0 L13 -11 L-3 -11 L-6 -15 Z" />
      <path className="dr fine" d="M-9 0 V-20 M-9 -12 H6" />
    </g>
  );
}

function shelf(x0: number, x1: number, y0: number, y1: number, rows: number, seed: number) {
  const r = rng(seed);
  const rh = (y1 - y0) / rows;
  let frame = `M${x0} ${y1} V${y0} H${x1} V${y1}`;
  let books = '';
  for (let k = 1; k <= rows; k++) {
    const base = y0 + rh * k;
    if (k < rows) frame += ` M${x0} ${r1(base)} H${x1}`;
    let x = x0 + 3;
    while (x < x1 - 4) {
      const h = rh * (0.55 + r() * 0.3);
      if (r() < 0.08) { books += `M${r1(x)} ${r1(base)} L${r1(x + h * 0.45)} ${r1(base - h * 0.9)} `; x += 8; continue; }
      books += `M${r1(x)} ${r1(base)} V${r1(base - h)} `;
      x += 2.6 + r() * 2.4;
    }
  }
  return { frame, books };
}

const SHELVES = [
  shelf(222, 318, 452, 520, 4, 3),
  shelf(222, 318, 352, 420, 4, 5),
  shelf(800, 898, 352, 420, 4, 7),
  shelf(232, 318, 282, 320, 2, 9),
  shelf(800, 890, 282, 320, 2, 11),
];
const STAIR1 = 'M480 520 ' + 'v-10 h16 '.repeat(10);
const STAIR2 = 'M632 420 ' + 'v-10 h-16 '.repeat(10);
const HATCH = Array.from({ length: 15 }, (_, i) => `M${24 + i * 12} 546 L${46 + i * 12} 524`).join(' ') + ' ' + Array.from({ length: 4 }, (_, i) => `M${926 + i * 12} 546 L${948 + i * 12} 524`).join(' ');
const PILES = [234, 324, 414, 504, 594, 684, 774, 864].map((x) => `M${x - 4} 536 V606 L${x} 614 L${x + 4} 606 V536`).join(' ');
const WAVES = (y: number, x0: number, x1: number) => `M${x0} ${y} ` + Array.from({ length: Math.floor((x1 - x0) / 16) }, () => 'q 8 -4 16 0').join(' ');
const LEVELS: [number, string, string][] = [[520, '+0.000', 'Ground floor'], [420, '+4.200', 'Level 1'], [320, '+8.400', 'Level 2'], [274, '+10.250', 'Eaves'], [50, '+19.600', 'Ridge']];

export function SectionAA() {
  return (
    <svg className="an-dwg" viewBox="0 0 1200 650" role="img" aria-label="Section A–A through Bryggen Library: an eighteenth-century timber warehouse on piles with two new reading floors, a central stair under a rooflight, and a glazed gable onto the harbour">
      <g className="an-anno">
        <path className="an-dash" d="M30 520 V318 L110 252 L190 318" />
        <path className="an-ray" d="M540 74 L494 300 M560 74 L560 300 M580 74 L626 300" />
        {LEVELS.map(([y, v, l]) => (
          <g key={y}>
            <path className="an-dash" d={`M${y === 50 ? 600 : 950} ${y} H1040`} />
            <path className="an-mark" d={`M1040 ${y - 9} H1054 L1047 ${y} Z`} />
            <text x="1062" y={y - 3}>{v}</text>
            <text className="an-t2" x="1062" y={y + 11}>{l}</text>
          </g>
        ))}
        {[['A', 200], ['B', 560], ['C', 920]].map(([k, x]) => (
          <g key={k}>
            <path className="an-dash" d={`M${x} 538 V612`} />
            <circle className="an-bub" cx={x} cy="624" r="11" />
            <text className="an-c" x={x} y="628">{k}</text>
          </g>
        ))}
        <path className="an-dim" d="M120 520 V50 M114 526 L126 514 M114 56 L126 44 M110 520 H130 M110 50 H130" />
        <text className="an-t2" transform="translate(112 300) rotate(-90)">19 600</text>
        <text x="226" y="446">Foyer · lending</text>
        <text x="790" y="452">Harbour café</text>
        <text x="226" y="346">Reading room</text>
        <text x="800" y="346">Local history</text>
        <text x="240" y="275">Children’s library</text>
        <text x="664" y="275">Study rooms</text>
        <text className="an-t2" x="346" y="214">Existing truss, 1702 — kept</text>
        <text className="an-t2" x="604" y="34">Rooflight</text>
        <text className="an-t2" x="1100" y="616">Vågen harbour</text>
        <text className="an-t2" x="238" y="634">Timber piles, relined</text>
      </g>

      <g className="an-ink">
        <path className="dr cut" d="M20 520 H200 M920 520 H980 V612" />
        <path className="dr cut" d="M200 520 H920 M200 534 H920" />
        <path className="dr fine" d={HATCH} />
        <path className="dr fine" d={PILES} />
        <path className="dr cut" d="M200 534 V274 M212 534 V267 M200 274 H212" />
        <path className="dr fine" d="M914 520 V274 M918 520 V274" />
        <path className="dr cut" d="M908 534 V520 M908 274 H920" />
        <path className="dr cut" d="M176 274 L560 50 L944 274 M200 274 L560 64 L920 274 M176 274 H200 M920 274 H944" />
        <path className="dr" d="M528 68 V36 H592 V68" />
        <path className="dr fine" d="M534 40 V64 M586 40 V64 M534 52 H586" />
        <path className="dr cut" d="M212 420 H470 V432 H212 M650 420 H908 M650 432 H908 M650 420 V432" />
        <path className="dr cut" d="M212 320 H470 V332 H212 M650 320 H908 M650 332 H908 M650 320 V332" />
        <path className="dr fine" d="M334 196 H786 M560 64 V196 M560 196 L430 140 M560 196 L690 140 M334 520 V432 M334 420 V332 M334 320 V196 M786 520 V432 M786 420 V332 M786 320 V196" />
        <path className="dr" d={STAIR1} />
        <path className="dr fine" d="M480 534 L650 432 M484 496 L644 396" />
        <path className="dr fine" d={STAIR2} />
        <path className="dr" d="M470 420 V396 M650 420 V396 M470 320 V296 M650 320 V296 M470 398 H486 M634 298 H650" />
        {SHELVES.map((s, i) => (
          <g key={i}>
            <path className="dr" d={s.frame} />
            <path className="dr fine" d={s.books} />
          </g>
        ))}
        <path className="dr" d="M680 520 V494 H772 V520 M676 494 H776" />
        <path className="dr" d="M836 498 H884 M846 498 V520 M874 498 V520" />
        <path className="dr" d="M360 402 H452 M368 402 V420 M444 402 V420 M680 402 H772 M688 402 V420 M764 402 V420" />
        <path className="dr" d="M350 302 H452 M358 302 V320 M444 302 V320" />
        <path className="dr" d="M700 320 V298 H730 V320 M700 308 H730 M730 298 V290" />
        <path className="dr fine" d="M406 332 V372 M726 332 V372 M406 432 V468 M726 432 V468 M400 186 V266 M840 222 V266" />
        <path className="dr" d="M396 380 L416 380 L412 372 L400 372 Z M716 380 L736 380 L732 372 L720 372 Z M396 476 L416 476 L412 468 L400 468 Z M716 476 L736 476 L732 468 L720 468 Z M390 274 L410 274 L406 266 L394 266 Z M830 274 L850 274 L846 266 L834 266 Z" />
        <path className="dr" d="M940 506 H972 M944 506 V520 M968 506 V520" />
        <path className="dr fine" d={WAVES(576, 984, 1196)} />
        <path className="dr fine" d={WAVES(592, 1000, 1180)} />
        <path className="dr" d="M1036 572 L1150 572 L1136 590 L1052 590 Z M1066 572 V556 H1100 V572" />
        <Stand x={420} y={520} />
        <Stand x={442} y={520} s={0.66} />
        <Stand x={568} y={470} />
        <Seat x={858} y={520} flip />
        <Seat x={376} y={420} />
        <Seat x={752} y={420} flip />
        <Stand x={826} y={420} />
        <Seat x={372} y={320} />
        <Stand x={766} y={320} />
      </g>
    </svg>
  );
}

/* ── Detail 1:5 — glulam beam to column, slotted steel plate ─────────────── */
export function JointDetail() {
  const grain = (y0: number, n: number, x0: number, x1: number) =>
    Array.from({ length: n }, (_, i) => `M${x0} ${y0 + i * 9} C${x0 + 60} ${y0 + i * 9 - 3} ${x0 + 120} ${y0 + i * 9 + 3} ${x1} ${y0 + i * 9}`).join(' ');
  return (
    <svg className="an-dwg an-dwg-sm" viewBox="0 0 420 300" role="img" aria-label="Detail at 1:5: a glulam beam meets a glulam column on a slotted steel plate with six dowels">
      <path className="an-fill" d="M168 16 H252 V284 H168 Z" />
      <path className="ln" d="M168 16 V104 M252 16 V104 M168 196 V284 M252 196 V284" />
      <path className="ln" d="M24 104 H396 M24 196 H396 M24 104 V196 M396 104 V196" />
      <path className="ln fine" d={grain(113, 9, 24, 168)} />
      <path className="ln fine" d={grain(113, 9, 252, 396)} />
      <path className="ln fine" d="M184 16 V104 M200 16 V104 M220 16 V104 M236 16 V104 M184 196 V284 M200 196 V284 M220 196 V284 M236 196 V284" />
      <path className="an-dash" d="M132 120 H288 V180 H132 Z" />
      {[[150, 132], [180, 132], [240, 132], [270, 132], [150, 168], [270, 168]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle className="ln" cx={x} cy={y} r="6" />
          <path className="ln fine" d={`M${x - 4} ${y} H${x + 4} M${x} ${y - 4} V${y + 4}`} />
        </g>
      ))}
      <path className="ln fine" d="M330 92 L300 132 M84 58 L150 128 M84 236 L180 168 M330 236 L270 172" />
      <circle className="an-mark" cx="300" cy="132" r="2" />
      <circle className="an-mark" cx="150" cy="128" r="2" />
      <circle className="an-mark" cx="180" cy="168" r="2" />
      <circle className="an-mark" cx="270" cy="172" r="2" />
      <text x="276" y="62">Glulam GL30c</text>
      <text className="an-t2" x="276" y="78">215 × 405 beam</text>
      <text x="24" y="38">Ø12 steel</text>
      <text className="an-t2" x="24" y="54">dowels × 6</text>
      <text x="24" y="252">Slotted steel</text>
      <text className="an-t2" x="24" y="268">plate 10 mm</text>
      <text x="276" y="252">Fire: R60</text>
      <text className="an-t2" x="276" y="268">by charring</text>
    </svg>
  );
}

/* ── Daylight study: three sun paths over Bergen (60°N) ───────────────────── */
type Arch = { x0: number; x1: number; yb: number; top: number };
const archPt = (a: Arch, t: number): [number, number] => [a.x0 + (a.x1 - a.x0) * t, a.yb - (a.yb - a.top) * Math.sin(Math.PI * t)];
const archD = (a: Arch) => 'M' + Array.from({ length: 41 }, (_, i) => archPt(a, i / 40).map(r1).join(' ')).join(' L');
const JUNE: Arch = { x0: 470, x1: 90, yb: 236, top: 52 };
const MARCH: Arch = { x0: 520, x1: 40, yb: 262, top: 150 };
const DEC: Arch = { x0: 404, x1: 156, yb: 306, top: 256 };
export function SunPath() {
  return (
    <svg className="an-dwg an-dwg-sm" viewBox="0 0 560 340" role="img" aria-label="Daylight study: the sun's path over the site on 21 June, 21 March and 21 December">
      <ellipse className="ln fine" cx="280" cy="262" rx="240" ry="58" />
      <path className="an-dash" d="M40 262 H520 M280 204 V320" />
      <text className="an-c" x="280" y="198">N</text>
      <text className="an-c" x="280" y="336">S</text>
      <text className="an-c" x="536" y="266">E</text>
      <text className="an-c" x="24" y="266">W</text>
      <path className="ln" d={archD(JUNE)} />
      <path className="ln" d={archD(MARCH)} />
      <path className="ln accent" d={archD(DEC)} />
      {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.94].map((t) => { const [x, y] = archPt(JUNE, t); return <circle key={t} className="an-mark" cx={r1(x)} cy={r1(y)} r="2.6" />; })}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => { const [x, y] = archPt(MARCH, t); return <circle key={t} className="an-mark" cx={r1(x)} cy={r1(y)} r="2.2" />; })}
      {[0.25, 0.5, 0.75].map((t) => { const [x, y] = archPt(DEC, t); return <circle key={t} className="an-mark accent" cx={r1(x)} cy={r1(y)} r="3.2" />; })}
      <path className="ln" d="M256 290 V262 L280 248 L304 262 V290 Z M256 262 H304" />
      <text x="372" y="62">21 June</text>
      <text className="an-t2" x="372" y="78">18 h 49 min</text>
      <text x="452" y="170">21 March</text>
      <text className="an-t2" x="452" y="186">12 h 10 min</text>
      <text className="accent" x="412" y="324">21 Dec · 5 h 53 min</text>
    </svg>
  );
}

/* ── Elvehagen masterplan, figure-ground ─────────────────────────────────── */
const EL_OLD = (() => {
  const r = rng(13);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) {
    const x = 20 + i * 74 + r() * 6, y = 16 + j * 50 + r() * 4;
    out.push(`M${r1(x)} ${r1(y)} h${r1(58 + r() * 6)} v${r1(36 + r() * 4)} h${r1(-(58 + r() * 6))} Z`);
  }
  return out.join(' ');
})();
export function Masterplan() {
  const block = (x: number, y: number, w: number, h: number) => `M${x} ${y} h${w} v${h} h${-w} Z M${x + 12} ${y + 12} v${h - 24} h${w - 24} v${-(h - 24)} Z`;
  return (
    <svg className="an-dwg an-dwg-sm" viewBox="0 0 560 340" role="img" aria-label="Masterplan for Elvehagen: six new perimeter blocks and a river park beside the existing town">
      <path className="an-old" d={EL_OLD} />
      <path className="an-river" d="M0 250 C120 230 220 280 330 262 C420 248 480 210 560 214 V258 C480 254 430 290 330 306 C220 324 120 276 0 296 Z" />
      <path className="an-park" d="M0 296 C120 276 220 324 330 306 C430 290 480 254 560 258 V340 H0 Z" />
      <path className="an-new" fillRule="evenodd" d={[block(36, 176, 70, 54), block(122, 172, 70, 58), block(208, 176, 64, 56), block(290, 168, 70, 60), block(378, 160, 66, 56), block(462, 156, 70, 48)].join(' ')} />
      <path className="ln fine" d="M0 166 C140 160 300 158 560 146" />
      {[[60, 314], [120, 326], [210, 330], [300, 322], [400, 300], [480, 290], [520, 310]].map(([x, y]) => <circle key={x} className="an-tree" cx={x} cy={y} r="7" />)}
    </svg>
  );
}

/* ── The Oslo studio, plan 1:100 ─────────────────────────────────────────── */
export function StudioPlan() {
  const desks: string[] = [];
  const chairs: [number, number][] = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
    const x = 62 + i * 58, y = 80 + row * 70;
    desks.push(`M${x} ${y} h50 v22 h-50 Z M${x + 25} ${y} v22`);
    chairs.push([x + 12, y - 8], [x + 38, y - 8]);
  }
  return (
    <svg className="an-dwg" viewBox="0 0 680 400" role="img" aria-label="Plan of the Oslo studio: twelve shared desks, a model workshop, a materials library, a kitchen with one long table and a meeting room on the harbour side">
      <path className="an-poche" fillRule="evenodd" d="M30 30 H650 V370 H30 Z M40 40 V360 H640 V40 Z" />
      <path className="an-win" d="M80 35 h80 M200 35 h80 M320 35 h80 M440 35 h80 M560 35 h60 M645 80 v80 M645 220 v100" />
      <path className="ln fine" d="M80 35 h80 M200 35 h80 M320 35 h80 M440 35 h80 M560 35 h60 M645 80 v80 M645 220 v100" />
      {[[300, 40], [300, 360], [470, 40], [470, 360]].map(([x, y]) => <rect key={`${x}-${y}`} className="an-col" x={x - 6} y={y === 40 ? 40 : 348} width="12" height="12" />)}
      <path className="ln" d="M300 40 V150 M300 190 V360 M300 250 H470 M470 40 V170 M470 210 V250 M470 250 V360 M470 160 H640" />
      <path className="ln fine" d="M300 150 A40 40 0 0 1 340 190 M470 170 A40 40 0 0 1 510 210" />
      <path className="ln" d={desks.join(' ')} />
      {chairs.map(([x, y]) => <circle key={`${x}-${y}`} className="ln fine" cx={x} cy={y} r="5" />)}
      <path className="ln" d="M320 60 H450 V90 H320 Z M320 120 H380 V160 H320 Z M400 120 h50 v40 h-50 Z" />
      <path className="ln fine" d="M330 70 h20 v10 h-20 Z M360 70 h30 M360 80 h50 M406 126 l38 28 M444 126 l-38 28" />
      <path className="ln" d="M320 270 H450 M320 270 V350 M320 350 H450 M330 270 V350 M440 270 V350" />
      <path className="ln fine" d="M320 286 H450 M320 302 H450 M320 318 H450 M320 334 H450" />
      <path className="ln" d="M490 40 H630 V64 H490 Z M500 90 H620 V130 H500 Z" />
      {[510, 540, 570, 600].map((x) => <circle key={x} className="ln fine" cx={x} cy="82" r="5" />)}
      {[510, 540, 570, 600].map((x) => <circle key={`b${x}`} className="ln fine" cx={x} cy="138" r="5" />)}
      <path className="ln" d="M500 270 H620 V320 H500 Z" />
      {[[490, 284], [490, 306], [630, 284], [630, 306], [530, 260], [590, 260], [530, 330], [590, 330]].map(([x, y]) => <circle key={`${x}-${y}`} className="ln fine" cx={x} cy={y} r="5" />)}
      <text x="62" y="316">Studio · 24 desks</text>
      <text x="320" y="214">Model workshop</text>
      <text className="an-t2" x="320" y="228">Laser, CNC, card</text>
      <text x="320" y="264">Materials library</text>
      <text x="482" y="152">Kitchen</text>
      <path className="ln" d="M590 176 H630 V240 H590 Z" />
      <path className="ln fine" d="M590 192 H630 M590 208 H630 M590 224 H630" />
      <text x="482" y="240">Archive</text>
      <text x="500" y="346">Meeting room</text>
      <path className="ln" d="M600 380 V352 M600 352 L594 364 M600 352 L606 364" />
      <text className="an-c" x="600" y="394">N</text>
    </svg>
  );
}

/* ── The two offices, as maps ────────────────────────────────────────────── */
export function OfficeMap({ city }: { city: 'oslo' | 'bergen' }) {
  const oslo = city === 'oslo';
  return (
    <svg className="an-map" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={oslo ? 'Map: Tollbugata in Kvadraturen, two blocks from the Oslofjord' : 'Map: Bryggen, on the east side of Vågen harbour'}>
      <rect className="an-map-bg" width="320" height="200" />
      <path className="an-river" d={oslo ? 'M0 150 C60 140 110 160 160 150 C220 138 260 170 320 160 V200 H0 Z' : 'M120 0 C140 40 150 80 140 120 C132 150 150 180 170 200 H0 V0 Z'} />
      <path className="an-park" d={oslo ? 'M230 20 h60 v40 h-60 Z' : 'M250 140 h50 v40 h-50 Z'} />
      <path className="an-st" d={oslo ? 'M0 40 H320 M0 80 H320 M0 118 H320 M40 0 V140 M100 0 V150 M160 0 V150 M220 0 V140 M280 0 V160' : 'M170 0 L190 200 M210 0 L240 200 M250 0 L290 200 M150 30 H320 M156 70 H320 M160 110 H320 M168 150 H320'} />
      <path className="an-st an-st-b" d={oslo ? 'M0 118 H320 M160 0 V150' : 'M170 0 L190 200 M160 110 H320'} />
      <circle className="an-pin-r" cx={oslo ? 130 : 200} cy={oslo ? 99 : 90} r="14" />
      <circle className="an-pin" cx={oslo ? 130 : 200} cy={oslo ? 99 : 90} r="5" />
      <text x={oslo ? 18 : 30} y={oslo ? 182 : 40}>{oslo ? 'Oslofjorden' : 'Vågen'}</text>
    </svg>
  );
}

/* ── Materials board — CSS swatches, not a drawing ───────────────────────── */
export const MATERIALS = [
  { k: 'oak', t: 'Oiled oak', s: 'Floors, stair' },
  { k: 'tar', t: 'Pine-tar timber', s: 'Cladding' },
  { k: 'slate', t: 'Otta slate', s: 'Thresholds' },
  { k: 'wool', t: 'Wool felt', s: 'Acoustic panels' },
  { k: 'brass', t: 'Brushed brass', s: 'Handrails' },
  { k: 'lime', t: 'Lime plaster', s: 'Walls' },
];
export function MaterialBoard() {
  return (
    <div className="an-board" role="img" aria-label="Materials board for Bryggen Library: oiled oak, pine-tar timber, slate, wool felt, brushed brass and lime plaster">
      {MATERIALS.map((m) => (
        <span key={m.k} className={`an-sw an-sw-${m.k}`}>
          <i />
          <b>{m.t}</b>
          <em>{m.s}</em>
        </span>
      ))}
    </div>
  );
}
