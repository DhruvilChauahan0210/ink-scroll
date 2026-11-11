/**
 * The anatomy of `start: 'top 85%'`. The first word is an edge of the element,
 * the second a line across the viewport, counted from its top. The scroll
 * position at which the two meet is where progress is 0; the end pair
 * ('top 40%' here, drawn lighter) is where it reaches 1. The arithmetic is
 * core/trigger.ts computeTriggers: edge position − line position.
 */

const VX = 56;          // viewport frame, left
const VW = 240;         // and width
const VY = 56;          // top
const VH = 280;         // height
const START = 0.85;
const END = 0.4;
const EX0 = 104;        // the element's sides
const EX1 = 264;
const LABEL_X = 324;

const yAt = (f: number) => VY + f * VH;

export function TriggerFigure() {
  const ys = yAt(START);
  const ye = yAt(END);
  const bottom = VY + VH;
  return (
    <figure className="stk-fig trgf">
      <svg
        viewBox="0 0 520 384"
        role="img"
        aria-label="A viewport with a line 85% of the way down. The element’s top edge sits on that line: that scroll position is progress 0. A second, lighter line at 40% is where progress reaches 1."
      >
        <text className="trgf-code" x={VX} y={26}>start: ‘top 85%’ · end: ‘top 40%’</text>
        <text className="trgf-k" x={VX} y={VY - 10}>viewport</text>

        <g fill="none" stroke="currentColor" strokeWidth="1">
          {/* The viewport, and its scale down the left. */}
          <rect className="trgf-frame" x={VX} y={VY} width={VW} height={VH} />
          {[0, 0.5, 1].map((f) => (
            <line key={f} className="trgf-tick" x1={VX - 8} x2={VX} y1={yAt(f)} y2={yAt(f)} />
          ))}

          {/* 85% of the viewport's height, measured from its top. */}
          <line className="trgf-dim" x1={VX + 14} x2={VX + 14} y1={VY + 4} y2={ys - 4} />
          <path className="trgf-dim" d={`M${VX + 10} ${VY + 10} L${VX + 14} ${VY + 3} L${VX + 18} ${VY + 10}`} />
          <path className="trgf-dim" d={`M${VX + 10} ${ys - 10} L${VX + 14} ${ys - 3} L${VX + 18} ${ys - 10}`} />

          {/* The end line, lighter: progress 1 when the same edge reaches it. */}
          <line className="trgf-end" x1={VX} x2={LABEL_X - 8} y1={ye} y2={ye} strokeDasharray="2 4" />

          {/* The element: its top on the start line, the rest still below the fold. */}
          <path className="trgf-el" d={`M${EX0} ${bottom} V${ys} M${EX1} ${ys} V${bottom}`} />
          <path className="trgf-el-out" d={`M${EX0} ${bottom} V${bottom + 36} M${EX1} ${bottom} V${bottom + 36}`} strokeDasharray="3 4" />
          <line className="trgf-start" x1={VX} x2={LABEL_X - 8} y1={ys} y2={ys} strokeDasharray="6 4" />
          <line className="trgf-edge" x1={EX0} x2={EX1} y1={ys} y2={ys} />

          {/* Scrolling down carries the element up, towards the end line. */}
          <line className="trgf-dim" x1={EX1 - 28} x2={EX1 - 28} y1={ys - 10} y2={ye + 14} />
          <path className="trgf-dim" d={`M${EX1 - 32} ${ye + 21} L${EX1 - 28} ${ye + 14} L${EX1 - 24} ${ye + 21}`} />
        </g>
        <circle className="trgf-dot" cx={EX0} cy={ys} r="3.5" />

        {[['0%', 0], ['50%', 0.5], ['100%', 1]].map(([t, f]) => (
          <text key={t} className="trgf-axis" x={VX - 12} y={yAt(f as number) + 3.5} textAnchor="end">{t}</text>
        ))}
        <text className="trgf-n" x={VX + 22} y={ys - 40}>85%</text>
        <text className="trgf-n" x={EX1 - 34} y={(ys + ye) / 2 + 4} textAnchor="end">scrolling down</text>
        <text className="trgf-k" x={EX0 + 10} y={ys + 22}>element</text>
        <text className="trgf-k" x={EX0 + 10} y={bottom + 22}>below the fold</text>

        <text className="trgf-l" x={LABEL_X} y={ye - 4}>end · top 40%</text>
        <text className="trgf-s" x={LABEL_X} y={ye + 15}>progress 1</text>

        <text className="trgf-l" x={LABEL_X} y={ye + 62}>‘top’</text>
        <text className="trgf-s" x={LABEL_X + 56} y={ye + 62}>element edge</text>
        <text className="trgf-l" x={LABEL_X} y={ye + 80}>‘85%’</text>
        <text className="trgf-s" x={LABEL_X + 56} y={ye + 80}>viewport line</text>

        <text className="trgf-l" x={LABEL_X} y={ys - 4}>start · top 85%</text>
        <text className="trgf-s" x={LABEL_X} y={ys + 15}>progress 0: they meet</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — ‘top 85%’: the first word is an edge of the element, the second a line across the viewport,
        counted from its top. Progress is 0 at the scroll position where they meet, and 1 where the end pair does.
      </figcaption>
    </figure>
  );
}
