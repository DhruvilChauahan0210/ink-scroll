/**
 * How a line drawing works: the stroke is one dash as long as the path
 * (stroke-dasharray), pushed back by stroke-dashoffset. Offset 1 hides it all,
 * 0.5 shows half, 0 shows it whole. pathLength="1" makes those numbers exact,
 * the same trick the viewer's CSS output uses.
 */

const D = 'M16 34 C 70 -6, 120 74, 176 30 S 280 4, 330 32';
const STATES = [
  { offset: 1, note: 'offset 1 · nothing drawn' },
  { offset: 0.5, note: 'offset 0.5 · half' },
  { offset: 0, note: 'offset 0 · drawn' },
];

export function DashFigure() {
  return (
    <figure className="stk-fig svf">
      <svg viewBox="0 0 350 216" role="img" aria-label="The same path at dash offset 1, 0.5 and 0: nothing, half, and the whole line drawn.">
        {STATES.map((s, i) => (
          <g key={s.offset} transform={`translate(0 ${i * 72})`}>
            <path className="svf-pencil" d={D} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
            <path
              className="svf-ink"
              d={D}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={s.offset}
            />
            <text className="svf-k" x="16" y="62">stroke-dashoffset: {s.offset}</text>
            <text className="svf-n" x="330" y="62" textAnchor="end">{s.note}</text>
          </g>
        ))}
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — one dash as long as the path, slid back by the offset. Animate the offset from 1 to 0 and the line draws.
      </figcaption>
    </figure>
  );
}
