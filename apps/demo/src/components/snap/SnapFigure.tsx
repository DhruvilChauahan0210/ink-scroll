/**
 * Fig. 1 — where an item snaps. Each row is one scroll port (the box that
 * scrolls) holding a row of items, with scroll-padding hatched at both ends.
 * The snapport is what is left between them, and the snap line is its start,
 * centre or end, as scroll-snap-align says. The snapped item has its matching
 * edge on the line.
 *
 * Underneath, the top row's snap positions on a scroll axis: each is the
 * scroll offset that puts an item's start edge on the line, clamped to
 * 0 … max. That is the arithmetic snapPosition() in ./snap-code does for the
 * preview's readout.
 */

import { snapPosition, type Align } from './snap-code';

const PX = 104;        // scroll port, left
const PW = 400;        // and width
const P = 24;          // scroll-padding at each end
const CW = 104;        // item width
const G = 16;          // gap
const STEP = CW + G;
const N = 6;           // items in the row
const MAX = N * CW + (N - 1) * G - PW;
const ROW_H = 60;      // port height
const ITEM_H = 36;

const ROWS: { align: Align; item: number; top: number; d: string }[] = [
  { align: 'start', item: 2, top: 28, d: 'start edge' },
  { align: 'center', item: 2, top: 148, d: 'middle' },
  { align: 'end', item: 3, top: 240, d: 'end edge' },
];

/** The scroll offset at which `item`'s edge is on the row's snap line. */
const scrollFor = (align: Align, item: number) => snapPosition(align, item * STEP, CW, PW, P, P, MAX);
const lineAt = (align: Align) => (align === 'start' ? P : align === 'end' ? PW - P : PW / 2);

const RULER_Y = 362;
const POSITIONS = Array.from({ length: N }, (_, i) => scrollFor('start', i));
const NOW = scrollFor('start', ROWS[0].item);
const rx = (pos: number) => PX + (pos / MAX) * PW;

/** Items sharing a position, as one tick: "4–6" for three at the end. */
const TICKS = POSITIONS.reduce<{ pos: number; items: number[] }[]>((all, pos, i) => {
  const last = all[all.length - 1];
  if (last && Math.abs(last.pos - pos) < 0.5) last.items.push(i + 1);
  else all.push({ pos, items: [i + 1] });
  return all;
}, []);
const tickLabel = (items: number[]) => (items.length > 1 ? `${items[0]}–${items[items.length - 1]}` : String(items[0]));
const FIRST = TICKS[0];
const LAST = TICKS[TICKS.length - 1];
const plural = (items: number[]) => (items.length > 1 ? 'items' : 'item');
const verb = (items: number[], one: string, many: string) => (items.length > 1 ? many : one);

export function SnapFigure() {
  return (
    <figure className="stk-fig snpf">
      <svg
        viewBox="0 0 520 412"
        role="img"
        aria-label={`Three scroll ports, each with scroll-padding hatched at both ends. The snap line is at the start, the centre or the end of the space between them, and the snapped item has its start edge, its middle or its end edge on it. Below, the top row’s snap positions along the scroll offset: the first is clamped to 0 and the last ${LAST.items.length} share the end.`}
      >
        <defs>
          <pattern id="snpf-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="snpf-hatch" stroke="currentColor" strokeWidth="1" />
          </pattern>
          {ROWS.map((r) => (
            <clipPath key={r.align} id={`snpf-port-${r.align}`}>
              <rect x={PX} y={r.top} width={PW} height={ROW_H} />
            </clipPath>
          ))}
        </defs>

        {ROWS.map((r, ri) => {
          const scroll = scrollFor(r.align, r.item);
          const line = PX + lineAt(r.align);
          const itemY = r.top + (ROW_H - ITEM_H) / 2;
          return (
            <g key={r.align}>
              <text className="snpf-l" x={16} y={r.top + 26}>{r.align}</text>
              <text className="snpf-s" x={16} y={r.top + 42}>{r.d}</text>

              <rect className="snpf-band" x={PX} y={r.top} width={P} height={ROW_H} fill="url(#snpf-hatch)" />
              <rect className="snpf-band" x={PX + PW - P} y={r.top} width={P} height={ROW_H} fill="url(#snpf-hatch)" />

              <g clipPath={`url(#snpf-port-${r.align})`}>
                {Array.from({ length: N }, (_, i) => {
                  const x = PX + i * STEP - scroll;
                  const on = i === r.item;
                  return (
                    <g key={i}>
                      <rect
                        className={on ? 'snpf-on' : 'snpf-item'}
                        x={x} y={itemY} width={CW} height={ITEM_H}
                        fill="none" stroke="currentColor" strokeWidth={on ? 2 : 1}
                      />
                      <text className={on ? 'snpf-n is-on' : 'snpf-n'} x={x + 8} y={itemY + 14}>{i + 1}</text>
                    </g>
                  );
                })}
              </g>

              <rect className="snpf-port" x={PX} y={r.top} width={PW} height={ROW_H} fill="none" stroke="currentColor" strokeWidth="1" />
              <line className="snpf-line" x1={line} x2={line} y1={r.top - 8} y2={r.top + ROW_H + 8} stroke="currentColor" strokeWidth="1.5" />
              <path className="snpf-line-cap" d={`M${line - 4} ${r.top - 14} L${line + 4} ${r.top - 14} L${line} ${r.top - 8} Z`} />
              {ri === 0 && <text className="snpf-k" x={line + 8} y={r.top - 7}>snap line</text>}
              {ri === 0 && <text className="snpf-k" x={PX + PW} y={r.top - 7} textAnchor="end">scroll port</text>}
            </g>
          );
        })}

        {/* Under the top row: what the padding and the snapport are. */}
        <g className="snpf-dim" fill="none" stroke="currentColor" strokeWidth="1">
          <path d={`M${PX} ${ROWS[0].top + ROW_H + 18} H${PX + P} M${PX} ${ROWS[0].top + ROW_H + 14} V${ROWS[0].top + ROW_H + 22} M${PX + P} ${ROWS[0].top + ROW_H + 14} V${ROWS[0].top + ROW_H + 22}`} />
          <path d={`M${PX + P} ${ROWS[0].top + ROW_H + 18} H${PX + PW - P} M${PX + PW - P} ${ROWS[0].top + ROW_H + 14} V${ROWS[0].top + ROW_H + 22}`} />
          <path d={`M${PX + PW - P} ${ROWS[0].top + ROW_H + 18} H${PX + PW} M${PX + PW} ${ROWS[0].top + ROW_H + 14} V${ROWS[0].top + ROW_H + 22}`} />
        </g>
        <text className="snpf-s" x={PX} y={ROWS[0].top + ROW_H + 36}>scroll-padding</text>
        <text className="snpf-s" x={PX + PW / 2} y={ROWS[0].top + ROW_H + 36} textAnchor="middle">snapport</text>
        <text className="snpf-s" x={PX + PW} y={ROWS[0].top + ROW_H + 36} textAnchor="end">scroll-padding</text>

        {/* The top row's snap positions along the scroll offset, 0 to max. */}
        <text className="snpf-k" x={16} y={RULER_Y + 4}>snap</text>
        <text className="snpf-k" x={16} y={RULER_Y + 18}>positions</text>
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <line className="snpf-axis" x1={PX} x2={PX + PW} y1={RULER_Y} y2={RULER_Y} />
          {TICKS.map((t) => (
            <line key={t.pos} className={t.items.includes(ROWS[0].item + 1) ? 'snpf-on' : 'snpf-tick'} x1={rx(t.pos)} x2={rx(t.pos)} y1={RULER_Y - 8} y2={RULER_Y + 8} strokeWidth={t.items.includes(ROWS[0].item + 1) ? 2 : 1} />
          ))}
        </g>
        <path className="snpf-line-cap" d={`M${rx(NOW) - 4} ${RULER_Y - 18} L${rx(NOW) + 4} ${RULER_Y - 18} L${rx(NOW)} ${RULER_Y - 11} Z`} />
        <text className="snpf-s" x={rx(NOW) - 8} y={RULER_Y - 12} textAnchor="end">top row is here</text>
        {TICKS.map((t) => (
          <text key={t.pos} className="snpf-n" x={rx(t.pos)} y={RULER_Y + 22} textAnchor={t.pos === 0 ? 'start' : t.pos === MAX ? 'end' : 'middle'}>
            {tickLabel(t.items)}
          </text>
        ))}
        <text className="snpf-s" x={PX} y={RULER_Y + 38}>0</text>
        <text className="snpf-s" x={PX + PW} y={RULER_Y + 38} textAnchor="end">max</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the snap line is the start, centre or end of the snapport: the scroll port minus scroll-padding. A
        snap position is the scroll offset that puts an item’s edge on it, clamped to what the box can scroll, so{' '}
        {plural(FIRST.items)} {tickLabel(FIRST.items)} {verb(FIRST.items, 'rests', 'rest')} at 0 and {plural(LAST.items)}{' '}
        {tickLabel(LAST.items)} {verb(LAST.items, 'takes', 'share')} the end.
      </figcaption>
    </figure>
  );
}
