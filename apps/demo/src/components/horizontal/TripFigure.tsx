/**
 * The header drawing: the three boxes of a horizontal scroll section, side by
 * side. On the left, the page side on: the outer is one screen plus the
 * scroll length, and the sticky stage sits inside it at p = 0, 0.5 and 1. On
 * the right, what the stage shows at each of those p: the track behind it,
 * moved left by p × travel (linear easing), where travel is the track's width
 * minus the stage's, scrollHorizontal's default distance
 * (packages/svg-scroll-draw/src/horizontal/index.ts, resolveDistance). The
 * panels outside the stage are off screen, so they are dashed.
 */

const STAGE_H = 50;
const RUN = 180; // the scroll length, in figure units
const TOP = 52; // the outer's top
const OUTER_X = 46;
const OUTER_W = 68;

const PANEL = 52;
const GAP = 8;
const PANELS = 3;
const TRACK = PANELS * PANEL + (PANELS + 1) * GAP; // 188
const WIN_W = PANEL + 2 * GAP; // 68: one panel and its gaps
const TRAVEL = TRACK - WIN_W; // 120
const RIGHT = 154; // the track's left edge at p = 1
const WIN_X = RIGHT + TRAVEL; // 274

const ROWS = [
  { p: 0, stage: 'pins', label: 'p 0 · translateX(0)' },
  { p: 0.5, stage: 'stuck', label: 'p 0.5 · translateX(−0.5 × travel)' },
  { p: 1, stage: 'lets go', label: 'p 1 · translateX(−travel)' },
];

export function TripFigure() {
  const bottom = TOP + RUN + STAGE_H;
  return (
    <figure className="stk-fig hzf">
      <svg
        viewBox="0 0 470 352"
        role="img"
        aria-label="A tall outer box, one screen plus the scroll length, with the sticky stage inside it at the start, the middle and the end of the scroll; beside it, the wide track behind the stage moved left by none, half and all of its travel."
      >
        <text className="hzf-h" x={OUTER_X - 30} y={18}>the page, side on</text>
        <text className="hzf-h" x={RIGHT} y={18}>what the stage shows</text>

        {/* The outer: one screen for the stage plus the scroll the trip takes. */}
        <text className="hzf-k" x={OUTER_X} y={TOP - 10}>.hs-outer</text>
        <rect className="hzf-outer" x={OUTER_X} y={TOP} width={OUTER_W} height={RUN + STAGE_H} />
        {/* Dimensions on the left: the scroll length, then one screen. */}
        <path className="hzf-dim" d={`M${OUTER_X - 14} ${TOP} V${TOP + RUN} M${OUTER_X - 18} ${TOP} H${OUTER_X - 10} M${OUTER_X - 18} ${TOP + RUN} H${OUTER_X - 10} M${OUTER_X - 14} ${bottom} V${TOP + RUN} M${OUTER_X - 18} ${bottom} H${OUTER_X - 10}`} />
        <text className="hzf-m" transform={`translate(${OUTER_X - 20} ${TOP + RUN / 2}) rotate(-90)`} textAnchor="middle">scroll length</text>
        <text className="hzf-m" transform={`translate(${OUTER_X - 20} ${TOP + RUN + STAGE_H / 2}) rotate(-90)`} textAnchor="middle">100vh</text>

        {ROWS.map(({ p, stage, label }) => {
          const y = TOP + p * RUN;
          const x0 = WIN_X - p * TRAVEL;
          return (
            <g key={p}>
              {/* The stage, where it sticks for this p. */}
              <rect className="hzf-ghost" x={OUTER_X + 3} y={y + 1} width={OUTER_W - 6} height={STAGE_H - 2} />
              <text className="hzf-m" x={OUTER_X + OUTER_W / 2} y={y + STAGE_H / 2 + 4} textAnchor="middle">{stage}</text>
              <path className="hzf-lead" d={`M${OUTER_X + OUTER_W + 4} ${y + STAGE_H / 2} H${RIGHT - 8}`} />

              {/* What it shows: the track behind it, moved left. */}
              <text className="hzf-k" x={RIGHT} y={y - 8}>{label}</text>
              <rect className="hzf-track" x={x0} y={y + 1} width={TRACK} height={STAGE_H - 2} />
              {Array.from({ length: PANELS }, (_, i) => {
                const x = x0 + GAP + i * (PANEL + GAP);
                const seen = x >= WIN_X && x + PANEL <= WIN_X + WIN_W;
                return (
                  <g key={i} className={seen ? 'hzf-in' : 'hzf-off'}>
                    <rect x={x} y={y + 6} width={PANEL} height={STAGE_H - 12} />
                    <path d={`M${x + 8} ${y + 34} q 9 -12 18 0 t 18 0`} />
                    <text x={x + 7} y={y + 18}>{i + 1}</text>
                  </g>
                );
              })}
              <rect className="hzf-win" x={WIN_X} y={y - 2} width={WIN_W} height={STAGE_H + 4} />
            </g>
          );
        })}

        {/* travel: how far the track's left edge moves, p 0 to p 1. */}
        <path className="hzf-dim" d={`M${RIGHT} ${bottom + 10} H${WIN_X} M${RIGHT} ${bottom + 5} V${bottom + 15} M${WIN_X} ${bottom + 5} V${bottom + 15}`} />
        <text className="hzf-m" x={WIN_X + 8} y={bottom + 14}>travel = track − stage width</text>

        <text className="hzf-f" x={16} y={bottom + 42}>p = (scroll − outer top) ÷ (outer height − 100vh)</text>
        <text className="hzf-f" x={16} y={bottom + 60}>translateX = −easing(p) × travel</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the outer is one screen plus the scroll length. The stage sticks inside it while that scroll goes by,
        and the track behind the stage moves left by easing(p) × travel. Dashed panels are off screen.
      </figcaption>
    </figure>
  );
}
