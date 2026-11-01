/**
 * The hero's fountain pen, as an exploded technical drawing.
 *
 * Every part is drawn in its ASSEMBLED place on a local axis (nib tip at x 0,
 * the pen's centreline at y 0, plan view from above), and carries the offset
 * that explodes it. The sheet places the whole pen with one transform; the
 * page slides each part from exploded (offset) to assembled (zero) as you
 * scroll. Deterministic: plain numbers, fixed decimals.
 */

const f = (n: number) => n.toFixed(1);

export type Tone = 'ink' | 'mute' | 'accent';
export type Weight = 'p' | 's' | 'h';
export type Stroke = { d: string; w: Weight; t: Tone; fill?: boolean };
export type Engraving = { x: number; y: number; text: string; size: number };
export type Part = {
  key: 'nib' | 'feed' | 'section' | 'converter' | 'barrel' | 'cap';
  dx: number;
  dy: number;
  strokes: Stroke[];
  engraving?: Engraving[];
};

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;
const vlines = (x0: number, x1: number, step: number, y0: number, y1: number) => {
  let d = '';
  for (let x = x0; x <= x1 + 0.01; x += step) d += `M${f(x)} ${f(y0)} V${f(y1)} `;
  return d.trim();
};
/** A band across a cylinder of half-height r, seen from above: a soft arc. */
const band = (x: number, r: number, bow = 4) => `M${f(x)} ${f(-r)} C ${f(x - bow)} ${f(-r / 3)}, ${f(x - bow)} ${f(r / 3)}, ${f(x)} ${f(r)}`;
const thread = (x0: number, x1: number, y: number, dir: 1 | -1) => {
  let d = `M${f(x0)} ${f(y)}`;
  for (let x = x0 + 3; x <= x1; x += 3) d += ` L${f(x)} ${f(y + dir * ((x - x0) % 6 === 3 ? 3.5 : 0))}`;
  return d;
};

/* ── Parts (assembled positions) ───────────────────────────────────────── */

const NIB: Stroke[] = [
  {
    d: 'M0 0 C 24 -3, 60 -10, 94 -17 C 116 -21, 134 -22, 150 -22 V 22 C 134 22, 116 21, 94 17 C 60 10, 24 3, 0 0 Z',
    w: 'p', t: 'ink', fill: true,
  },
  // Tipping ball, slit and breather hole — the line the ink runs down.
  { d: circle(4.5, 0, 3.2), w: 's', t: 'accent' },
  { d: 'M8 0 H 95', w: 's', t: 'accent' },
  { d: circle(101, 0, 5.5), w: 's', t: 'accent' },
  // The two-tone plating line and the engraved scrollwork.
  { d: 'M70 -11.5 C 64 -4, 64 4, 70 11.5', w: 'h', t: 'ink' },
  { d: 'M110 -12 C 120 -17, 129 -9, 122 -3 C 116 2, 124 11, 133 7', w: 'h', t: 'ink' },
  { d: 'M110 12 C 120 17, 129 9, 122 3', w: 'h', t: 'ink' },
  { d: circle(101, 0, 10), w: 'h', t: 'ink' },
  // Shoulders, with the notch where the nib meets the section.
  { d: band(141, 21.5, 5), w: 's', t: 'ink' },
];

const FEED: Stroke[] = [
  { d: 'M44 -11 C 36 -11, 30 -6, 30 0 C 30 6, 36 11, 44 11 H 210 V -11 Z', w: 's', t: 'ink', fill: true },
  { d: vlines(102, 200, 5, -11, 11), w: 'h', t: 'ink' },
  { d: 'M38 0 H 96 M44 -5 H 92 M44 5 H 92', w: 'h', t: 'ink' },
  { d: band(206, 11, 2), w: 's', t: 'ink' },
];

const SECTION: Stroke[] = [
  { d: 'M150 -25 L 270 -28 H 296 V 28 H 270 L 150 25 Z', w: 'p', t: 'ink', fill: true },
  { d: rr(144, -27, 13, 54, 4), w: 's', t: 'ink' },
  { d: `${band(178, 25.8, 4)} ${band(188, 26.1, 4)} ${band(198, 26.4, 4)}`, w: 'h', t: 'ink' },
  { d: band(262, 27.8, 4), w: 's', t: 'ink' },
  { d: `${thread(272, 294, -28, -1)} ${thread(272, 294, 28, 1)}`, w: 'h', t: 'ink' },
  { d: 'M160 -15 H 258', w: 'h', t: 'mute' },
];

const CONVERTER: Stroke[] = [
  { d: rr(312, -17, 166, 34, 7), w: 's', t: 'ink', fill: true },
  { d: rr(298, -8, 16, 16, 4), w: 's', t: 'ink' },
  // The ink, its meniscus, and the piston that draws it up.
  { d: 'M326 -9 H 382 M326 9 H 382', w: 'h', t: 'ink' },
  { d: 'M382 -9 C 388 -3, 388 3, 382 9', w: 'h', t: 'ink' },
  { d: rr(400, -14, 10, 28, 3), w: 's', t: 'ink' },
  { d: 'M410 0 H 476', w: 'h', t: 'ink' },
  { d: rr(476, -16, 12, 32, 3), w: 'h', t: 'ink' },
  { d: rr(488, -14, 32, 28, 6), w: 's', t: 'ink' },
  { d: vlines(494, 514, 4, -14, 14), w: 'h', t: 'ink' },
];

const BARREL: Stroke[] = [
  { d: 'M296 -31 H 690 A 31 31 0 0 1 690 31 H 296 Z', w: 'p', t: 'ink', fill: true },
  { d: `${band(306, 31, 4)} ${band(318, 31, 4)}`, w: 'h', t: 'ink' },
  // The blind cap at the end, turned to fill the converter.
  { d: band(660, 31, 5), w: 's', t: 'ink' },
  { d: `${band(670, 31, 5)} ${band(676, 31, 5)}`, w: 'h', t: 'ink' },
  { d: 'M334 -19 H 650', w: 'h', t: 'mute' },
];

const CAP: Stroke[] = [
  { d: 'M600 -35 H 834 A 35 35 0 0 1 834 35 H 600 Z', w: 'p', t: 'ink', fill: true },
  // The band, with its engraving.
  { d: `${band(606, 35, 4)} ${band(632, 35, 4)}`, w: 's', t: 'ink' },
  // A tapered clip with its ring and ball.
  { d: 'M664 -7 L 836 -5 M664 7 L 836 5', w: 's', t: 'ink' },
  { d: rr(652, -10, 14, 20, 3), w: 's', t: 'ink' },
  { d: circle(846, 0, 10), w: 's', t: 'ink' },
  { d: circle(846, 0, 4.5), w: 'h', t: 'ink' },
  { d: 'M680 -24 H 820', w: 'h', t: 'mute' },
];

export const PARTS: Part[] = [
  { key: 'nib', dx: -84, dy: 0, strokes: NIB },
  { key: 'feed', dx: -36, dy: 90, strokes: FEED },
  { key: 'section', dx: -28, dy: 0, strokes: SECTION },
  { key: 'converter', dx: 26, dy: 94, strokes: CONVERTER },
  {
    key: 'barrel', dx: 36, dy: 0, strokes: BARREL,
    engraving: [{ x: 420, y: 4.5, text: 'SVG-SCROLL-DRAW', size: 12.5 }],
  },
  {
    key: 'cap', dx: 54, dy: -96, strokes: CAP,
    engraving: [{ x: 619, y: 3.5, text: 'MIT', size: 9 }],
  },
];

/* ── Placement on the sheet ─────────────────────────────────────────────── */

export const VIEWBOX = '0 0 1000 700';
export const PLACE = { x: 120, y: 470, rotate: -17, scale: 0.98 };
export const PLACE_TRANSFORM = `translate(${PLACE.x} ${PLACE.y}) rotate(${PLACE.rotate}) scale(${PLACE.scale})`;

/** A point on the pen's local axis, in sheet coordinates. */
export function toSheet(lx: number, ly: number): [number, number] {
  const a = (PLACE.rotate * Math.PI) / 180;
  const x = lx * PLACE.scale;
  const y = ly * PLACE.scale;
  return [PLACE.x + x * Math.cos(a) - y * Math.sin(a), PLACE.y + x * Math.sin(a) + y * Math.cos(a)];
}

/** The centreline the pen assembles along, in local units. */
export const AXIS = 'M-130 0 H 940';

/** Exploded-view guides: from each offset part back to its place on the axis. */
export const ASSEMBLY_GUIDES = PARTS.filter((p) => p.dy !== 0)
  .map((p) => {
    const cx = p.key === 'feed' ? 120 : p.key === 'converter' ? 410 : 730;
    return `M${f(cx + p.dx)} ${f(p.dy)} L${f(cx)} 0`;
  })
  .join(' ');

export type Note = {
  key: Part['key'];
  /** Anchor on the part, local, exploded. */
  at: [number, number];
  /** The shelf, in sheet units: elbow, then out to `end`. */
  elbow: [number, number];
  end: number;
  anchor: 'start' | 'end';
  title: string;
  value: string;
  accent?: boolean;
};

export const NOTES: Note[] = [
  { key: 'nib', at: [-84 + 101, 0], elbow: [96, 360], end: 10, anchor: 'start', title: 'NIB · THE DRAWING TIP', value: 'scrollDraw()', accent: true },
  { key: 'section', at: [-28 + 230, -27], elbow: [330, 250], end: 470, anchor: 'end', title: 'SECTION · WHAT YOU HOLD', value: 'one call' },
  { key: 'cap', at: [54 + 846, -96 - 10], elbow: [930, 92], end: 996, anchor: 'end', title: 'CAP', value: 'MIT · open source' },
  { key: 'feed', at: [-36 + 150, 90 + 11], elbow: [240, 640], end: 10, anchor: 'start', title: 'FEED', value: 'native timeline · rAF fallback' },
  { key: 'converter', at: [26 + 440, 94 + 17], elbow: [520, 668], end: 720, anchor: 'end', title: 'CONVERTER · INK', value: '10.7 KB gzipped' },
  { key: 'barrel', at: [36 + 600, 31], elbow: [860, 470], end: 996, anchor: 'end', title: 'BARREL', value: '0 dependencies' },
];
