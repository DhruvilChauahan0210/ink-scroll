'use client';

import './signoff.css';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { CopyCommand } from './CopyCommand';
import { HeroScript } from './HeroScript';
import { SCRIPT_DRAW } from './art/script';
import {
  DELTA,
  FLANK,
  FLANK_NIB,
  FLANK_SQUARE,
  PLATE,
  PLATE_DIM,
  PLATE_DIM_AT,
  PLATE_LEADER_AT,
  PLATE_NOTES,
  PLATE_PENCIL,
  PLATE_PIECES,
  PROJECTION,
  SCRIPT_BOX_PCT,
  SLANT_GUIDES,
  type FlankView,
  type Tone,
  type Weight,
} from './art/sheet-geometry';

/**
 * The sign-off: the end of the page drawn as one engineering sheet. Trim line,
 * frame, zone ticks, crop and centring marks, the line the word is signed on,
 * the two instruments either side of it (the 14° set square that ruled its
 * slant guides, the nib that signed it), the parts list and the title block
 * all ink over a pencil underdrawing as the sheet scrolls in. The sheet's ScrollDraw (frame, notes, plate) is
 * measured on the sheet and finishes as the page does; a second one inside it
 * inks the tables as the foot itself comes on screen. The hand-lettered word
 * is HeroScript in scroll mode, with its own trigger and nib.
 *
 * Everything on the frame is axis-aligned, so each line is its own one-axis
 * SVG stretched along its length only: the stroke keeps its pixel width at
 * any sheet size, and the dash maths runs on the path's own length. Lines are
 * placed in document order top to bottom, which is the order they ink in.
 */

const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const EASING = 'ease-in-out' as const;
/** The trigger the brief sets: the sheet's top at 90% of the screen until its bottom meets the screen's. */
const TRIGGER = { start: 'top 90%', end: 'bottom bottom' } as const;
/** The word's own trigger and easing in HeroScript's scroll mode — the labels read them out. */
const PEN = { down: 'top 85%', up: 'top 35%', easing: 'ease-out' } as const;

/* ── Frame marks ──────────────────────────────────────────────────────────── */

type Rule = {
  kind: 'rule';
  dir: 'h' | 'v';
  /** Cross-axis position: `top` of a horizontal line, `left` of a vertical one. */
  at: string;
  from: string;
  len: string;
  rev?: boolean;
  w: Weight;
  tone: Tone;
  cls?: string;
};
type Arrow = { kind: 'arrow'; side: 't' | 'r' | 'b' | 'l' };
type Mark = Rule | Arrow;

const B = 'var(--so-band)';
const CROP = 'var(--so-crop)';
const GAP = 'var(--so-crop-gap)';
const PIN = 'var(--so-pin)';
const zx = (k: number): string => `calc(${B} + (100% - 2 * ${B}) * ${(k / 8).toFixed(4)})`;
const zy = (k: number): string => `calc(${B} + (100% - 2 * ${B}) * ${(k / 6).toFixed(4)})`;
const ZONE_H = `calc((100% - 2 * ${B}) / 6)`;
const ZONE_H_EDGE = `calc(${B} + (100% - 2 * ${B}) / 6)`;

const h = (at: string, from: string, len: string, w: Weight, tone: Tone, rev?: boolean, cls?: string): Rule => ({
  kind: 'rule', dir: 'h', at, from, len, w, tone, rev, cls,
});
const v = (at: string, from: string, len: string, w: Weight, tone: Tone, rev?: boolean, cls?: string): Rule => ({
  kind: 'rule', dir: 'v', at, from, len, w, tone, rev, cls,
});

/** Horizontal and vertical lines inside a laid-out box (a table cell, a column). */
const hr = (top: string, w: Weight, tone: Tone, cls?: string): Rule => h(top, '0px', '100%', w, tone, false, cls);
const vr = (left: string, w: Weight, tone: Tone, cls?: string): Rule => v(left, '0px', '100%', w, tone, false, cls);

/** Zone ticks on the top and bottom bands, from the centre outward. */
const TICK_ORDER = [3, 5, 2, 6, 1, 7];
const tickCls = (k: number): string => (k % 2 ? 'so-tick-odd' : '');

const TOP: Mark[] = [
  // trim line, then frame, each from the centre out to the corners
  h('0px', '0px', '50%', 'h', 'mute', true),
  h('0px', '50%', '50%', 'h', 'mute'),
  h(B, B, `calc(50% - ${B})`, 'p', 'ink', true),
  h(B, '50%', `calc(50% - ${B})`, 'p', 'ink'),
  // centring mark and its arrow
  v('50%', '0px', `calc(${B} + ${PIN})`, 's', 'ink'),
  { kind: 'arrow', side: 't' },
  // crop marks at the two top corners, drawn towards the corner
  h('0px', `calc(-1 * (${CROP} + ${GAP}))`, CROP, 'h', 'mute'),
  v('0px', `calc(-1 * (${CROP} + ${GAP}))`, CROP, 'h', 'mute'),
  h('0px', `calc(100% + ${GAP})`, CROP, 'h', 'mute', true),
  v('100%', `calc(-1 * (${CROP} + ${GAP}))`, CROP, 'h', 'mute'),
  ...TICK_ORDER.map((k) => v(zx(k), '0px', B, 'h', 'mute', false, tickCls(k))),
];

/** One zone down both sides: trim and frame segments, then the ticks or centring marks under it. */
function zone(z: number): Mark[] {
  const first = z === 0;
  const last = z === 5;
  const outerFrom = first ? '0px' : zy(z);
  const outerLen = first || last ? ZONE_H_EDGE : ZONE_H;
  const innerFrom = first ? B : zy(z);
  const marks: Mark[] = [
    v('0px', outerFrom, outerLen, 'h', 'mute'),
    v('100%', outerFrom, outerLen, 'h', 'mute'),
    v(B, innerFrom, ZONE_H, 'p', 'ink'),
    v(`calc(100% - ${B})`, innerFrom, ZONE_H, 'p', 'ink'),
  ];
  if (last) return marks;
  const y = zy(z + 1);
  if (z === 2) {
    marks.push(
      h(y, '0px', `calc(${B} + ${PIN})`, 's', 'ink'),
      { kind: 'arrow', side: 'l' },
      h(y, `calc(100% - ${B} - ${PIN})`, `calc(${B} + ${PIN})`, 's', 'ink', true),
      { kind: 'arrow', side: 'r' },
    );
  } else {
    marks.push(h(y, '0px', B, 'h', 'mute'), h(y, `calc(100% - ${B})`, B, 'h', 'mute', true));
  }
  return marks;
}
const ZONES: Mark[][] = [0, 1, 2, 3, 4, 5].map(zone);

const BOTTOM: Mark[] = [
  ...[...TICK_ORDER].reverse().map((k) => v(zx(k), `calc(100% - ${B})`, B, 'h', 'mute', true, tickCls(k))),
  v('50%', `calc(100% - ${B} - ${PIN})`, `calc(${B} + ${PIN})`, 's', 'ink', true),
  { kind: 'arrow', side: 'b' },
  // frame, then trim line, each from the corners in to the centre: the sheet closes
  h(`calc(100% - ${B})`, B, `calc(50% - ${B})`, 'p', 'ink'),
  h(`calc(100% - ${B})`, '50%', `calc(50% - ${B})`, 'p', 'ink', true),
  h('100%', '0px', '50%', 'h', 'mute'),
  h('100%', '50%', '50%', 'h', 'mute', true),
  h('100%', `calc(-1 * (${CROP} + ${GAP}))`, CROP, 'h', 'mute'),
  v('0px', `calc(100% + ${GAP})`, CROP, 'h', 'mute', true),
  h('100%', `calc(100% + ${GAP})`, CROP, 'h', 'mute', true),
  v('100%', `calc(100% + ${GAP})`, CROP, 'h', 'mute', true),
];

/* ── The parts list (the footer's links) and the title block ─────────────── */

type PartLink = { label: string; href: string; external?: boolean };
type PartCol = { key: string; title: string; links: PartLink[] };

const PARTS: PartCol[] = [
  {
    key: 'learn',
    title: 'Learn',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Examples', href: '/examples' },
      { label: 'Blocks', href: '/blocks' },
      { label: 'Playground', href: '/playground' },
    ],
  },
  {
    key: 'switch',
    title: 'Switch',
    links: [
      { label: 'Migration guides', href: '/guides' },
      { label: 'vs GSAP', href: '/vs-gsap' },
      { label: 'vs AOS', href: '/vs-aos' },
      { label: 'vs vivus', href: '/vs-vivus' },
    ],
  },
  {
    key: 'project',
    title: 'Project',
    links: [
      { label: 'GitHub', href: GH, external: true },
      { label: 'npm', href: NPM, external: true },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Blog', href: '/blog' },
    ],
  },
];
const ROWS = 4;
/** The item-number column, then the three link columns. */
const COLS: PartCol[] = [{ key: 'no', title: 'No.', links: [] }, ...PARTS];

/** One column's rules: top, left, under the header, between rows; the last closes the table. */
function colRules(key: string, last: boolean): Rule[] {
  const rules: Rule[] = [
    hr('0px', 's', 'ink'),
    vr('0px', 'h', 'mute'),
    hr('var(--so-hd)', 'h', 'mute'),
    ...Array.from({ length: ROWS - 1 }, (_, r) => hr(`calc(var(--so-hd) + var(--so-row) * ${r + 1})`, 'h', 'faint')),
  ];
  if (last) rules.push(vr('100%', 'h', 'mute'));
  // On a phone the switch column sits beside an empty slot, so it closes itself.
  if (key === 'switch') rules.push(hr('100%', 'h', 'mute', 'so-pl-close'));
  return rules;
}
const COL_RULES: Rule[][] = COLS.map((c, i) => colRules(c.key, i === COLS.length - 1));
const PARTS_STROKES = COL_RULES.reduce((sum, r) => sum + r.length, 0);

/** The graphic scale between the tables: its outline, then its divisions. */
const SCALE_STROKES = 2;

type CellKey = 'project' | 'projection' | 'drawn' | 'rev' | 'licence' | 'weight' | 'tests' | 'scale' | 'sheet' | 'strokes';
const CELLS: { key: CellKey; title: string; extra: number }[] = [
  { key: 'project', title: 'Project', extra: 0 },
  { key: 'projection', title: 'Projection', extra: PROJECTION.pieces.length },
  { key: 'drawn', title: 'Drawn by', extra: 0 },
  { key: 'rev', title: 'Rev', extra: 1 },
  { key: 'licence', title: 'Licence', extra: 0 },
  { key: 'weight', title: 'Weight', extra: 0 },
  { key: 'tests', title: 'Tests', extra: 0 },
  { key: 'scale', title: 'Scale', extra: 0 },
  { key: 'sheet', title: 'Sheet', extra: 0 },
  { key: 'strokes', title: 'Strokes', extra: 0 },
];
const TB_STROKES = CELLS.reduce((s, c) => s + 2 + c.extra, 0);

/* ── Corner notes: general notes top left, the line weights top right ──── */

const NOTES = [
  'Zero runtime dependencies.',
  'SSR-safe: no DOM on the server.',
  'Honours reduced motion.',
  'Do not scale. It scales itself.',
];
/** The sheet's own line weights, as set for `.so-rule` in signoff.css. */
const WEIGHTS: { w: Weight; px: string; name: string }[] = [
  { w: 'p', px: '1.6', name: 'Frame' },
  { w: 's', px: '1.0', name: 'Tables' },
  { w: 'h', px: '0.75', name: 'Hairline' },
];
/** An underline under each heading, then one sample per weight. */
const CORNER_STROKES = 2 + WEIGHTS.length;

/* ── The ledgers: where each group starts, in document order ───────────── */

/**
 * Two instances share the work. The sheet's (frame and plate) is measured on
 * the whole sheet; the foot's (parts list and title block) on the foot alone,
 * so the tables ink while they are on screen rather than while the reader is
 * still at the word. Timing is the library's own: in scroll mode every stroke
 * gets `1 / speed` of its window and stroke i starts `i × stagger` later.
 */
function ledger(count: number, speed: number, end: number) {
  const stagger = Number(((end - 1 / speed) / (count - 1)).toFixed(5));
  return {
    count,
    speed,
    stagger,
    doneAt: (i: number): string => Math.min(1, i * stagger + 1 / speed).toFixed(3),
    startAt: (i: number): string => (i * stagger).toFixed(3),
    inkedAt: (p: number): number =>
      p < 1 / speed ? 0 : Math.min(count, Math.floor((p - 1 / speed) / stagger + 1e-6) + 1),
  };
}

let n = 0;
const take = (count: number): number => {
  const start = n;
  n += count;
  return start;
};
const AT_TOP = take(TOP.length);
const AT_ZONE: number[] = [];
AT_ZONE[0] = take(ZONES[0].length);
const AT_CORNERS = take(CORNER_STROKES);
AT_ZONE[1] = take(ZONES[1].length);
// The frame reaches zone C before the instruments either side of it ink.
AT_ZONE[2] = take(ZONES[2].length);
const AT_FLANK_L = take(FLANK_SQUARE.pieces.length);
const AT_PLATE = take(PLATE_PIECES.length);
const AT_FLANK_R = take(FLANK_NIB.pieces.length);
AT_ZONE[3] = take(ZONES[3].length);
AT_ZONE[4] = take(ZONES[4].length);
AT_ZONE[5] = take(ZONES[5].length);
const AT_BOTTOM = take(BOTTOM.length);

/** The sheet: the last stroke lands at 0.94, a short hold before the page ends. */
const SHEET = ledger(n, 9, 0.94);
/** The foot: parts list, the scale, then the title block, filled in row by row. */
const FOOT = ledger(PARTS_STROKES + SCALE_STROKES + TB_STROKES, 6, 0.92);
const AT_PARTS = 0;
const AT_SCALE = PARTS_STROKES;
const AT_TB = AT_SCALE + SCALE_STROKES;
/** First stroke of each parts-list column (item numbers first) and of each title-block cell. */
const COL_AT: number[] = [];
for (let c = 0, k = AT_PARTS; c < COLS.length; c++) {
  COL_AT.push(k);
  k += COL_RULES[c].length;
}
const CELL_AT: number[] = [];
for (let c = 0, k = AT_TB; c < CELLS.length; c++) {
  CELL_AT.push(k);
  k += 2 + CELLS[c].extra;
}
const TOTAL = SHEET.count + FOOT.count;

const SHEET_SELECTOR = '.so-layer .so-ink, .so-corner .so-ink, .so-flank .so-ink, .so-plate .so-ink';
const FOOT_SELECTOR = '.so-ink';
/** The tables start inking as the foot's top edge comes on screen. */
const FOOT_TRIGGER = { start: 'top bottom', end: 'bottom bottom' } as const;

const pad = (x: number): string => String(x).padStart(String(TOTAL).length, '0');
const at = (i: number): CSSProperties => ({ '--so-at': SHEET.doneAt(i) }) as CSSProperties;
const atFoot = (i: number): CSSProperties => ({ '--so-at': FOOT.doneAt(i) }) as CSSProperties;

/* ── Drawing primitives ───────────────────────────────────────────────────── */

const H_D = 'M0 2H1000';
const H_R = 'M1000 2H0';
const V_D = 'M2 0V1000';
const V_R = 'M2 1000V0';

/** One straight line stretched along its own axis, over its pencil line. */
function Line({ r, className }: { r: Rule; className?: string }) {
  const d = r.dir === 'h' ? (r.rev ? H_R : H_D) : r.rev ? V_R : V_D;
  const style: CSSProperties =
    r.dir === 'h' ? { top: r.at, left: r.from, width: r.len } : { left: r.at, top: r.from, height: r.len };
  return (
    <svg
      className={`so-rule so-rule-${r.dir}${r.cls ? ` ${r.cls}` : ''}${className ? ` ${className}` : ''}`}
      viewBox={r.dir === 'h' ? '0 0 1000 4' : '0 0 4 1000'}
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path className="so-pencil" d={d} />
      <path className={`so-ink so-w-${r.w} so-t-${r.tone}`} stroke="currentColor" d={d} />
    </svg>
  );
}

/** A centring arrow: inked as an outline, then filled once it is closed. */
function ArrowMark({ side, i }: { side: Arrow['side']; i: number }) {
  return (
    <svg className={`so-arrow so-arrow-${side}`} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path className="so-arrow-fill so-fade" d="M1.5 2.5H10.5L6 10.5Z" style={at(i)} />
      <path className="so-pencil" d="M1.5 2.5H10.5L6 10.5Z" />
      <path className="so-ink so-w-s so-t-ink" stroke="currentColor" d="M1.5 2.5H10.5L6 10.5Z" />
    </svg>
  );
}

function Marks({ marks, base }: { marks: Mark[]; base: number }) {
  return (
    <>
      {marks.map((m, k) =>
        m.kind === 'rule' ? <Line key={k} r={m} /> : <ArrowMark key={k} side={m.side} i={base + k} />,
      )}
    </>
  );
}


/* ── The signature plate ──────────────────────────────────────────────────── */

const PLATE_VB = `0 0 ${PLATE.w} ${PLATE.h}`;
const NOTE_VALUE: Record<(typeof PLATE_NOTES)[number]['key'], string> = { down: PEN.down, up: PEN.up };

function Plate() {
  return (
    <div className="so-plate-clip">
      <div className="so-plate">
        <svg className="so-plate-svg so-plate-pencil" viewBox={PLATE_VB} aria-hidden="true" focusable="false">
          {PLATE_PENCIL.map((d, k) => (
            <path key={k} className="so-pencil" d={d} />
          ))}
        </svg>
        <svg className="so-plate-svg" viewBox={PLATE_VB} aria-hidden="true" focusable="false">
          {PLATE_PIECES.map((p, k) => (
            <path
              key={k}
              className={`so-ink so-w-${p.w} so-t-${p.tone}${p.note ? ' so-lead' : ''}`}
              stroke="currentColor"
              d={p.d}
            />
          ))}
          <g className="so-notes">
            <text className="so-fade so-dim" x={PLATE_DIM.x.toFixed(1)} y={PLATE_DIM.y.toFixed(1)} textAnchor="middle" style={at(AT_PLATE + PLATE_DIM_AT)}>
              {PLATE_DIM.text}
            </text>
            {PLATE_NOTES.map((note) => {
              const i = AT_PLATE + PLATE_LEADER_AT[note.key];
              return (
                <g key={note.key}>
                  <circle
                    className="so-fade so-dot"
                    cx={note.dot[0].toFixed(1)}
                    cy={note.dot[1].toFixed(1)}
                    r="4"
                    style={{ '--so-at': SHEET.startAt(i) } as CSSProperties}
                  />
                  <text className="so-fade so-label" x={note.text[0].toFixed(1)} y={note.text[1].toFixed(1)} textAnchor={note.anchor} style={at(i)}>
                    <tspan className="so-label-t" x={note.text[0].toFixed(1)} dy="-21">
                      {note.title}
                    </tspan>
                    <tspan className="so-label-v" x={note.text[0].toFixed(1)} dy="23">
                      {NOTE_VALUE[note.key]}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="so-word" style={{ left: SCRIPT_BOX_PCT.left, top: SCRIPT_BOX_PCT.top, width: SCRIPT_BOX_PCT.width }}>
          <HeroScript d={SCRIPT_DRAW.d} viewBox={SCRIPT_DRAW.viewBox} strokeWidth={SCRIPT_DRAW.strokeWidth} mode="scroll" />
        </div>
      </div>
    </div>
  );
}

/* ── The flanks: the set square and the nib that drew the plate ────────────── */

const FLANK_VB = `0 0 ${FLANK.w} ${FLANK.h}`;
/** Each label states a real number: the plate's guide count and the word's own options. */
const FLANK_VALUE: Record<string, string> = {
  guides: `${SLANT_GUIDES} ruled`,
  tip: `strokeWidth ${SCRIPT_DRAW.strokeWidth}`,
  flow: PEN.easing,
};

/**
 * One instrument beside the plate, at the plate's own scale where the sheet
 * is wide enough to hold it. Pencil first, static, in its own SVG; the ink
 * traces over it with the sheet.
 */
function Flank({ side, view, base }: { side: 'l' | 'r'; view: FlankView; base: number }) {
  return (
    <div className={`so-flank so-flank-${side}`} aria-hidden="true">
      <div className="so-flank-art">
        <svg className="so-flank-svg so-flank-pencil" viewBox={FLANK_VB} focusable="false">
          {view.pieces.map((p, k) => (p.note ? null : <path key={k} className="so-pencil" d={p.d} />))}
        </svg>
        <svg className="so-flank-svg" viewBox={FLANK_VB} focusable="false">
          {view.pieces.map((p, k) => (
            <path key={k} className={`so-ink so-w-${p.w} so-t-${p.tone}${p.note ? ' so-lead' : ''}`} stroke="currentColor" d={p.d} />
          ))}
          <g className="so-notes">
            {view.dim ? (
              <text className="so-fade so-dim" x={view.dim.x.toFixed(1)} y={view.dim.y.toFixed(1)} textAnchor="middle" style={at(base + view.dim.at)}>
                {view.dim.text}
              </text>
            ) : null}
            {view.notes.map((note) => {
              const i = base + view.leaderAt[note.key];
              return (
                <g key={note.key}>
                  <circle
                    className="so-fade so-dot"
                    cx={note.dot[0].toFixed(1)}
                    cy={note.dot[1].toFixed(1)}
                    r="3.2"
                    style={{ '--so-at': SHEET.startAt(i) } as CSSProperties}
                  />
                  <text className="so-fade so-label" x={note.text[0].toFixed(1)} y={note.text[1].toFixed(1)} textAnchor={note.anchor} style={at(i)}>
                    <tspan className="so-label-t" x={note.text[0].toFixed(1)} dy="-21">
                      {note.title}
                    </tspan>
                    <tspan className="so-label-v" x={note.text[0].toFixed(1)} dy="23">
                      {FLANK_VALUE[note.key]}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ── Corner notes and the graphic scale ───────────────────────────────────── */

function Corners() {
  const base = AT_CORNERS;
  return (
    <>
      <div className="so-corner so-corner-l">
        <p className="so-cn-h">
          Notes
          <Line r={hr('100%', 'h', 'mute')} />
        </p>
        <ol className="so-cn-list so-fade" style={at(base)}>
          {NOTES.map((t, i) => (
            <li key={t}>
              <span className="so-cn-n">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
      <div className="so-corner so-corner-r" aria-hidden="true">
        <p className="so-cn-h">
          Lines
          <Line r={hr('100%', 'h', 'mute')} />
        </p>
        <ul className="so-cn-list">
          {WEIGHTS.map((wt, i) => (
            <li key={wt.w}>
              <span className="so-cn-sample">
                <Line r={hr('50%', wt.w, 'ink')} />
              </span>
              <span className="so-fade" style={at(base + 2 + i)}>
                <span className="so-cn-n">{wt.px}</span>
                {wt.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const SCALE_BOX = 'M0 0H100V6H0Z';

/** A graphic scale, 100 px at 1:1: it inks, then its alternate bays fill. */
function ScaleBar() {
  return (
    <div className="so-scale" aria-hidden="true">
      <span className="so-scale-t">Scale 1:1</span>
      <svg className="so-scale-svg" viewBox="0 0 100 6" focusable="false">
        <path className="so-scale-fill so-fade" d="M0 0H25V6H0ZM50 0H75V6H50Z" style={atFoot(AT_SCALE + 1)} />
        <path className="so-pencil" d={SCALE_BOX} />
        <path className="so-ink so-w-s so-t-ink" stroke="currentColor" d={SCALE_BOX} />
        <path className="so-ink so-w-h so-t-ink" stroke="currentColor" d="M25 0V6M50 0V6M75 0V6" />
      </svg>
      <span className="so-scale-n" style={{ left: '0%' }}>0</span>
      <span className="so-scale-n" style={{ left: '50%' }}>50</span>
      <span className="so-scale-n" style={{ left: '100%' }}>100 px</span>
    </div>
  );
}

/* ── Zone labels ──────────────────────────────────────────────────────────── */

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const NUMBERS_PHONE = [1, 2, 3, 4];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function ZoneNumbers({ edge, i }: { edge: 't' | 'b'; i: number }) {
  return (
    <>
      {NUMBERS.map((num) => (
        <span
          key={num}
          className={`so-zl so-zl-${edge} so-zl-wide so-fade`}
          style={{ left: `calc(${B} + (100% - 2 * ${B}) * ${((2 * num - 1) / 16).toFixed(4)})`, ...at(i) } as CSSProperties}
        >
          {num}
        </span>
      ))}
      {NUMBERS_PHONE.map((num) => (
        <span
          key={`p${num}`}
          className={`so-zl so-zl-${edge} so-zl-phone so-fade`}
          style={{ left: `calc(${B} + (100% - 2 * ${B}) * ${((2 * num - 1) / 8).toFixed(4)})`, ...at(i) } as CSSProperties}
        >
          {num}
        </span>
      ))}
    </>
  );
}

function ZoneLetter({ z }: { z: number }) {
  const top = `calc(${B} + (100% - 2 * ${B}) * ${((2 * z + 1) / 12).toFixed(4)})`;
  const style = (side: 'l' | 'r') => ({ top, ...at(AT_ZONE[z] + (side === 'l' ? 2 : 3)) }) as CSSProperties;
  return (
    <>
      <span className="so-zl so-zl-l so-fade" style={style('l')}>
        {LETTERS[z]}
      </span>
      <span className="so-zl so-zl-r so-fade" style={style('r')}>
        {LETTERS[z]}
      </span>
    </>
  );
}

function ZoneLayer({ z }: { z: number }) {
  return (
    <div className="so-layer" aria-hidden="true">
      <Marks marks={ZONES[z]} base={AT_ZONE[z]} />
      <ZoneLetter z={z} />
    </div>
  );
}

/* ── Parts list ───────────────────────────────────────────────────────────── */

function PartsList() {
  return (
    <nav className="so-parts" aria-label="Footer">
      {COLS.map((c, ci) => {
        const base = COL_AT[ci];
        const isNo = c.key === 'no';
        return (
          <div key={c.key} className={`so-pl-col so-pl-${c.key}`} aria-hidden={isNo ? true : undefined}>
            {COL_RULES[ci].map((r, ri) => (
              <Line key={ri} r={r} />
            ))}
            <p className="so-pl-h">{c.title}</p>
            {isNo ? (
              <ol className="so-pl-list">
                {Array.from({ length: ROWS }, (_, r) => (
                  <li key={r} className="so-pl-num so-fade" style={atFoot(base + 2 + r)}>
                    {String(r + 1).padStart(2, '0')}
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="so-pl-list">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a className="so-pl-a" href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                        <span className="so-pl-ext" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <Link className="so-pl-a" href={l.href}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ── Title block ──────────────────────────────────────────────────────────── */

function TitleBlock({ values }: { values: Record<CellKey, ReactNode> }) {
  return (
    <dl className="so-tb">
      {CELLS.map((c, ci) => {
        const base = CELL_AT[ci];
        return (
          <div key={c.key} className={`so-tb-cell so-tb-${c.key}`}>
            {/* The field names are printed on the form from the start; each
                cell's rules ink over their pencil, then its value is filled in. */}
            <dt className="so-tb-k">
              <Line r={hr('0px', 'h', 'mute', 'so-tb-top')} />
              <Line r={vr('var(--so-split)', 'h', 'mute', 'so-tb-left')} />
              {c.title}
              {c.key === 'rev' ? (
                <svg className="so-delta" viewBox={DELTA.viewBox} aria-hidden="true" focusable="false">
                  <path className="so-pencil" d={DELTA.d} />
                  <path className="so-ink so-w-s so-t-accent" stroke="currentColor" d={DELTA.d} />
                </svg>
              ) : null}
            </dt>
            <dd
              className={`so-tb-v${c.key === 'projection' ? '' : ' so-fade'}`}
              style={c.key === 'projection' ? undefined : atFoot(base + 1 + c.extra)}
            >
              {c.key === 'projection' ? (
                <svg className="so-proj" viewBox={PROJECTION.viewBox} role="img" aria-label="Third-angle projection">
                  {PROJECTION.pieces.map((p, pi) => (
                    <path key={`p${pi}`} className="so-pencil" d={p.d} />
                  ))}
                  {PROJECTION.pieces.map((p, pi) => (
                    <path key={pi} className={`so-ink so-w-${p.w} so-t-${p.tone}`} stroke="currentColor" d={p.d} />
                  ))}
                </svg>
              ) : (
                values[c.key]
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ── Reduced motion, as an external store ─────────────────────────────────── */

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReduced = (): boolean => window.matchMedia(REDUCED).matches;
const getReducedOnServer = (): boolean => false;

/* ── The sheet ────────────────────────────────────────────────────────────── */

type Props = { version: string; gzipKb: number; unitTests: number; browserTests: number };

export function SignOff({ version, gzipKb, unitTests, browserTests }: Props) {
  const stageRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  /** Strokes inked by each instance, and the last count written to the page. */
  const inked = useRef({ sheet: 0, foot: 0, shown: -1 });

  const writeCount = useCallback(() => {
    const c = inked.current;
    const total = c.sheet + c.foot;
    if (total !== c.shown && countRef.current) {
      c.shown = total;
      countRef.current.textContent = pad(total);
    }
  }, []);

  /* The engine reports stroke 0's eased alpha, which finishes early, so each
     callback is used as the per-frame tick and its element's own position is
     read here, over the same window as its trigger. One style write per frame;
     the counter's text only changes with the count. */
  const onSheet = useCallback(() => {
    const sheet = stageRef.current?.querySelector<HTMLElement>('.so-sheet');
    if (!sheet) return;
    const r = sheet.getBoundingClientRect();
    const vh = window.innerHeight;
    const span = r.height - vh * 0.1; // top 90% → bottom bottom
    const p = span > 0 ? Math.min(1, Math.max(0, (vh * 0.9 - r.top) / span)) : 1;
    sheet.style.setProperty('--so-p', p.toFixed(4));
    inked.current.sheet = SHEET.inkedAt(p);
    writeCount();
  }, [writeCount]);

  const onFoot = useCallback(() => {
    const foot = stageRef.current?.querySelector<HTMLElement>('.so-foot-draw');
    if (!foot) return;
    const r = foot.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = r.height > 0 ? Math.min(1, Math.max(0, (vh - r.top) / r.height)) : 1; // top bottom → bottom bottom
    foot.style.setProperty('--so-p', p.toFixed(4));
    inked.current.foot = FOOT.inkedAt(p);
    writeCount();
  }, [writeCount]);

  /* Reduced motion: the library draws everything at once and never ticks, so
     the finished sheet shows (the CSS default for --so-p is 1); the counter
     is the only thing left to finish. */
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  useEffect(() => {
    if (reduced && countRef.current) countRef.current.textContent = pad(TOTAL);
  }, [reduced]);

  const values: Record<CellKey, ReactNode> = {
    project: <span className="so-tb-name">svg-scroll-draw</span>,
    projection: null,
    drawn: 'scrollDraw()',
    rev: <span className="so-tb-rev">v{version}</span>,
    licence: 'MIT',
    weight: `${gzipKb} KB gzip`,
    tests: `${unitTests} unit + ${browserTests} × 3 browsers`,
    scale: '1:1',
    sheet: '1 / 1',
    strokes: String(TOTAL),
  };

  return (
    <section className="so-stage" aria-labelledby="so-title" ref={stageRef}>
      <ScrollDraw
        className="so-sheet"
        selector={SHEET_SELECTOR}
        trigger={TRIGGER}
        stagger={SHEET.stagger}
        speed={SHEET.speed}
        easing={EASING}
        onProgress={onSheet}
      >
        <div className="so-layer" aria-hidden="true">
          <Marks marks={TOP} base={AT_TOP} />
          <ZoneNumbers edge="t" i={AT_TOP + 3} />
        </div>
        <ZoneLayer z={0} />
        <Corners />
        <ZoneLayer z={1} />
        <ZoneLayer z={2} />

        <div className="so-head">
          <p className="so-kicker">
            <span>09 / your turn</span>
            <span className="so-count" aria-hidden="true">
              <span ref={countRef}>{pad(0)}</span> / {TOTAL} strokes
            </span>
          </p>
          <Flank side="l" view={FLANK_SQUARE} base={AT_FLANK_L} />
          <Plate />
          <Flank side="r" view={FLANK_NIB} base={AT_FLANK_R} />
          <h2 id="so-title" className="so-title">
            <span>One install. One call.</span> <span>The page follows the scroll.</span>
          </h2>
          <div className="so-cta">
            <CopyCommand />
            <Link href="/docs" className="btn btn-solid" data-magnetic>
              Read the docs
            </Link>
            <a href={GH} target="_blank" rel="noopener noreferrer" className="btn" data-magnetic>
              Star on GitHub
            </a>
          </div>
        </div>

        <ZoneLayer z={3} />
        <ZoneLayer z={4} />

        <ScrollDraw
          className="so-foot-draw"
          selector={FOOT_SELECTOR}
          trigger={FOOT_TRIGGER}
          stagger={FOOT.stagger}
          speed={FOOT.speed}
          easing={EASING}
          onProgress={onFoot}
        >
          <footer className="so-foot">
            <PartsList />
            <ScaleBar />
            <TitleBlock values={values} />
          </footer>
        </ScrollDraw>

        <ZoneLayer z={5} />
        <div className="so-layer" aria-hidden="true">
          <Marks marks={BOTTOM} base={AT_BOTTOM} />
          <ZoneNumbers edge="b" i={AT_BOTTOM + 11} />
        </div>
      </ScrollDraw>
    </section>
  );
}
