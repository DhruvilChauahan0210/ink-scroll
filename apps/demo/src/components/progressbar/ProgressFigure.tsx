/**
 * How the scroll position becomes the bar's scale, drawn at three moments:
 * the window (solid) over the page (dashed) at the top, half way and the
 * bottom, with the bar along the window's top edge. The bar is the window's
 * travel over its whole possible travel, scrollY / (scrollHeight − innerHeight),
 * which is what scrollProgress computes for document.documentElement with the
 * trigger 'top top' → 'bottom bottom' (computeProgress in
 * packages/svg-scroll-draw/src/core/trigger.ts) and what scroll(root) is in CSS.
 */

const W = 520;
const H = 312;
const COLS = [34, 164, 294];
const COL_W = 100;
const DOC_TOP = 36;
const DOC_H = 220;
const VP_H = 88;
const TRAVEL = DOC_H - VP_H;
const STATES = [
  { f: 0, y: '0' },
  { f: 0.5, y: '½ max' },
  { f: 1, y: 'max' },
];
const LINE_LENGTHS = [70, 80, 62, 76, 54];
const VP_PAD = 6;

export function ProgressFigure() {
  const docBottom = DOC_TOP + DOC_H;
  const lastTop = DOC_TOP + TRAVEL;
  const dimX = COLS[2] + COL_W + VP_PAD + 14;
  return (
    <figure className="stk-fig pbf">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="The window over the page at the top, half way and the bottom: the bar along its top edge is empty, half full and full."
      >
        <text className="pbf-title" x={COLS[0] - VP_PAD} y="16">progress = scrollY ÷ (scrollHeight − innerHeight)</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          {COLS.map((x, i) => {
            const { f } = STATES[i];
            const top = DOC_TOP + f * TRAVEL;
            const vx = x - VP_PAD;
            const vw = COL_W + VP_PAD * 2;
            return (
              <g key={x}>
                <rect className="pbf-doc" x={x} y={DOC_TOP} width={COL_W} height={DOC_H} strokeDasharray="3 3" />
                {Array.from({ length: 17 }, (_, k) => (
                  <line
                    key={k}
                    className="pbf-text"
                    x1={x + 10}
                    x2={x + 10 + LINE_LENGTHS[k % LINE_LENGTHS.length]}
                    y1={DOC_TOP + 12 + k * 12}
                    y2={DOC_TOP + 12 + k * 12}
                  />
                ))}
                <rect className="pbf-vp" x={vx} y={top} width={vw} height={VP_H} />
                <line className="pbf-track" x1={vx} x2={vx + vw} y1={top + 3} y2={top + 3} />
                {f > 0 && <line className="pbf-bar" x1={vx} x2={vx + f * vw} y1={top + 3} y2={top + 3} />}
              </g>
            );
          })}

          {/* scrollHeight, on the left */}
          <g className="pbf-dim">
            <line x1="21" x2="21" y1={DOC_TOP} y2={docBottom} />
            <line x1="18" x2="24" y1={DOC_TOP} y2={DOC_TOP} />
            <line x1="18" x2="24" y1={docBottom} y2={docBottom} />
            <line x1="24" x2={COLS[0] - VP_PAD - 2} y1={DOC_TOP} y2={DOC_TOP} strokeDasharray="2 2" />
            <line x1="24" x2={COLS[0] - 2} y1={docBottom} y2={docBottom} strokeDasharray="2 2" />
          </g>

          {/* max scrollY and innerHeight, beside the last window */}
          <g className="pbf-dim">
            <line x1={dimX} x2={dimX} y1={DOC_TOP} y2={docBottom} />
            {[DOC_TOP, lastTop, docBottom].map((y) => (
              <g key={y}>
                <line x1={dimX - 4} x2={dimX + 4} y1={y} y2={y} />
                <line x1={COLS[2] + COL_W + VP_PAD + 2} x2={dimX - 4} y1={y} y2={y} strokeDasharray="2 2" />
              </g>
            ))}
          </g>
        </g>

        <text className="pbf-k" transform={`translate(14 ${DOC_TOP + DOC_H / 2}) rotate(-90)`} textAnchor="middle">scrollHeight</text>
        <text className="pbf-k" x={dimX + 8} y={DOC_TOP + TRAVEL / 2 + 4}>max scrollY</text>
        <text className="pbf-k" x={dimX + 8} y={lastTop + VP_H / 2 + 4}>innerHeight</text>

        {COLS.map((x, i) => (
          <g key={x}>
            <text className="pbf-k" x={x + COL_W / 2} y={docBottom + 22} textAnchor="middle">scrollY {STATES[i].y}</text>
            <text className="pbf-v" x={x + COL_W / 2} y={docBottom + 40} textAnchor="middle">scaleX({STATES[i].f})</text>
          </g>
        ))}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the window (solid) over the page (dashed). The bar along its top edge is how far the window has
        travelled over how far it can: 0 at the top, 0.5 half way, 1 at the bottom.
      </figcaption>
    </figure>
  );
}
