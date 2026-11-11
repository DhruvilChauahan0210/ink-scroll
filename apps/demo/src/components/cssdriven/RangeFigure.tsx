/**
 * The four named ranges of a view() timeline, drawn: an element of height h
 * crossing a viewport of height H, at the four moments that bound them —
 * a, its top meets the viewport's bottom; b, its bottom meets the bottom;
 * c, its top meets the top; d, its bottom meets the top. The frames sit along
 * a scroll axis at their true scroll distances (0, h, H, H + h), so the
 * element's centre travels in a straight line through them, and the bars below
 * are the ranges as stretches of that axis. The same geometry the generator's
 * track uses (rangeScroll in ./code), checked against the browser's own
 * view-timeline progress.
 */

const H = 120; // viewport
const h = 36; // element
const X0 = 96;
const X1 = 528;
const x = (s: number) => X0 + (s / (H + h)) * (X1 - X0);
const VP_TOP = 58;
const VP_BOT = VP_TOP + H;
const FW = 48;
const EW = 32;

/** Each moment: its scroll distance from a, and the element's top relative to the viewport's top. */
const MOMENTS = [
  { k: 'a', s: 0, top: H, inside: false },
  { k: 'b', s: h, top: H - h, inside: true },
  { k: 'c', s: H, top: 0, inside: true },
  { k: 'd', s: H + h, top: -h, inside: false },
];
const AXIS: [number, string][] = [[0, '0'], [h, 'h'], [H, 'H'], [H + h, 'H + h']];
const BARS: { name: string; from: number; to: number }[] = [
  { name: 'cover', from: 0, to: H + h },
  { name: 'entry', from: 0, to: h },
  { name: 'contain', from: h, to: H },
  { name: 'exit', from: H, to: H + h },
];
const AXIS_Y = 236;
const BAR_Y = 274;
const ROW = 22;

export function RangeFigure() {
  const height = BAR_Y + BARS.length * ROW;
  return (
    <figure className="stk-fig cssdf">
      <svg
        viewBox={`0 0 560 ${height}`}
        role="img"
        aria-label="An element crossing a viewport at four moments: a, its top meets the viewport's bottom; b, its bottom meets the bottom; c, its top meets the top; d, its bottom meets the top. Below, cover runs from a to d, entry from a to b, contain from b to c, and exit from c to d."
      >
        <g fill="none" stroke="currentColor" strokeWidth="1">
          {/* The element's path through the four frames: straight, because the frames sit at their scroll distances. */}
          <line className="cssdf-path" x1={x(0)} y1={VP_TOP + H + h / 2} x2={x(H + h)} y2={VP_TOP - h / 2} strokeDasharray="2 4" />
          {MOMENTS.map((m) => {
            const cx = x(m.s);
            const top = VP_TOP + m.top;
            return (
              <g key={m.k}>
                <rect className="cssdf-vp" x={cx - FW / 2} y={VP_TOP} width={FW} height={H} />
                <rect
                  className={m.inside ? 'cssdf-el is-in' : 'cssdf-el'}
                  x={cx - EW / 2}
                  y={top}
                  width={EW}
                  height={h}
                  strokeDasharray={m.inside ? undefined : '3 3'}
                />
                <line className="cssdf-guide" x1={cx} x2={cx} y1={VP_BOT + h + 4} y2={AXIS_Y} strokeDasharray="1 3" />
              </g>
            );
          })}
          <line className="cssdf-axis" x1={X0} x2={X1 + 16} y1={AXIS_Y} y2={AXIS_Y} />
          <path className="cssdf-axis" d={`M${X1 + 10} ${AXIS_Y - 4} L${X1 + 16} ${AXIS_Y} L${X1 + 10} ${AXIS_Y + 4}`} />
          {AXIS.map(([s]) => (
            <line key={s} className="cssdf-axis" x1={x(s)} x2={x(s)} y1={AXIS_Y - 4} y2={AXIS_Y + 4} />
          ))}
          {BARS.map((b, i) => {
            const y = BAR_Y + i * ROW;
            return (
              <g key={b.name} className="cssdf-bar">
                <line x1={x(b.from)} x2={x(b.to)} y1={y} y2={y} strokeWidth="2" />
                <line x1={x(b.from)} x2={x(b.from)} y1={y - 5} y2={y + 5} />
                <line x1={x(b.to)} x2={x(b.to)} y1={y - 5} y2={y + 5} />
              </g>
            );
          })}
        </g>
        {MOMENTS.map((m) => (
          <text key={m.k} className="cssdf-k" x={x(m.s)} y={14} textAnchor="middle">{m.k}</text>
        ))}
        <text className="cssdf-n" transform={`translate(${x(0) - FW / 2 - 8} ${VP_TOP + H / 2}) rotate(-90)`} textAnchor="middle">viewport · H</text>
        <text className="cssdf-n" x={x(0) + EW / 2 + 8} y={VP_BOT + h - 4}>element · h</text>
        {AXIS.map(([s, label]) => (
          <text key={s} className="cssdf-n" x={x(s)} y={AXIS_Y + 18} textAnchor="middle">{label}</text>
        ))}
        {/* Left of d's guide line, which used to run through it. */}
        <text className="cssdf-n" x={x(H + h) - 8} y={AXIS_Y - 8} textAnchor="end">scroll</text>
        {BARS.map((b, i) => (
          <text key={b.name} className="cssdf-r" x={8} y={BAR_Y + i * ROW + 4}>{b.name}</text>
        ))}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — an element crossing its viewport, at the four moments that bound a view() timeline’s ranges: cover is
        a → d, entry a → b, contain b → c, exit c → d. svg-scroll-draw’s default trigger, ‘top bottom’ → ‘bottom top’,
        is a → d.
      </figcaption>
    </figure>
  );
}
