/**
 * Fig. 1 — what pathLength="1" does to the dash, with the generator's own
 * numbers: stroke-dasharray: 1 2 and an offset of 0.6.
 *
 * Top: the line, 0.4 drawn, as the browser draws it (the ink path really has
 * pathLength="1", dasharray 1 2 and dashoffset 0.6). Below: the same dash
 * pattern unrolled along a ruler. The path is the window from 0 to 1; the
 * offset pulls the pattern back 0.6, so the dash covers 0 → 0.4 of it. The
 * second scale is the same ruler in the SVG's own units: pathLength="1"
 * makes the browser scale every dash value by the path's real length, which
 * is worked out here from the curve itself (and matches getTotalLength()).
 */

type P = readonly [number, number];
type Seg = readonly [P, P, P, P];

const SEGS: readonly Seg[] = [
  [[28, 82], [100, 16], [176, 112], [232, 62]],
  [[232, 62], [288, 12], [356, 30], [412, 68]],
];
const D = `M${SEGS[0][0].join(' ')} ${SEGS.map(([, a, b, c]) => `C ${a.join(' ')}, ${b.join(' ')}, ${c.join(' ')}`).join(' ')}`;

function bez([p0, p1, p2, p3]: Seg, t: number): P {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [
    k[0] * p0[0] + k[1] * p1[0] + k[2] * p2[0] + k[3] * p3[0],
    k[0] * p0[1] + k[1] * p1[1] + k[2] * p2[1] + k[3] * p3[1],
  ];
}

/** The curve sampled finely, with the distance along it at each point. */
const TABLE: { len: number; p: P }[] = (() => {
  const out = [{ len: 0, p: SEGS[0][0] }];
  let len = 0;
  let prev = SEGS[0][0];
  for (const seg of SEGS) {
    for (let i = 1; i <= 800; i++) {
      const p = bez(seg, i / 800);
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      out.push({ len, p });
      prev = p;
    }
  }
  return out;
})();
const LENGTH = TABLE[TABLE.length - 1].len;

/** The point a fraction f of the way along the curve. */
function at(f: number): P {
  const target = f * LENGTH;
  const i = TABLE.findIndex((e) => e.len >= target);
  if (i <= 0) return TABLE[0].p;
  const a = TABLE[i - 1];
  const b = TABLE[i];
  const k = (target - a.len) / (b.len - a.len || 1);
  return [a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k];
}

const OFFSET = 0.6;
const DRAWN = 1 - OFFSET;
const one = (n: number) => String(Math.round(n * 10) / 10);

/* The ruler: pattern units across, 1 unit = U px, the path from X0. */
const U = 100;
const X0 = 140;
const x = (u: number) => X0 + u * U;
const BAR = 186;

export function PathLengthFigure() {
  const start = at(0);
  const tip = at(DRAWN);
  const end = at(1);
  const L = one(LENGTH);
  return (
    <figure className="stk-fig ldgf">
      <svg
        viewBox="0 0 440 284"
        role="img"
        aria-label={`A path with pathLength 1, stroke-dasharray 1 2 and stroke-dashoffset ${OFFSET}: ${DRAWN} of it is drawn. Below, the dash pattern unrolled: the offset pulls the dash of 1 back by ${OFFSET}, so it covers 0 to ${DRAWN} of the path, which is 1 long in dash units and ${L} in the SVG’s own units.`}
      >
        {/* The line itself. */}
        <text className="ldgf-k" x="12" y="14">{'<path pathLength="1">'}</text>
        <text className="ldgf-n" x="428" y="14" textAnchor="end">stroke-dashoffset: {OFFSET}</text>
        <path className="ldgf-pencil" d={D} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
        <path
          className="ldgf-ink"
          d={D}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 2"
          strokeDashoffset={OFFSET}
        />
        <circle className="ldgf-dot" cx={start[0]} cy={start[1]} r="3.5" />
        <circle className="ldgf-tip" cx={tip[0]} cy={tip[1]} r="4" strokeWidth="1.5" />
        <text className="ldgf-v" x={start[0]} y={start[1] + 20} textAnchor="middle">0</text>
        <text className="ldgf-v" x={tip[0]} y={tip[1] - 12} textAnchor="middle">{DRAWN}</text>
        <text className="ldgf-v" x={end[0]} y={end[1] + 20} textAnchor="middle">1</text>

        {/* The dash pattern, unrolled. */}
        <text className="ldgf-k" x="12" y="138">the dash pattern, unrolled along the path</text>
        <text className="ldgf-n" x={x(0) - 6} y="160" textAnchor="end">offset {OFFSET}</text>
        <text className="ldgf-n" x={(x(0) + x(1)) / 2} y="160" textAnchor="middle">the path</text>
        <g fill="none" stroke="currentColor">
          {/* the offset: the pattern pulled back */}
          <path className="ldgf-ink" d={`M${x(0)} 166 H ${x(-OFFSET) + 1} m 5 -3.5 l -5 3.5 5 3.5`} strokeWidth="1" />
          {/* the window the path sees */}
          <rect className="ldgf-ink" x={x(0)} y={BAR - 14} width={U} height="28" strokeWidth="1" />
          {/* the gap before, the dash, the gap, the next dash */}
          <line className="ldgf-pencil" x1="12" x2={x(-OFFSET)} y1={BAR} y2={BAR} strokeWidth="1" strokeDasharray="3 4" />
          <line className="ldgf-pencil" x1={x(-OFFSET)} x2={x(0)} y1={BAR} y2={BAR} strokeWidth="6" />
          <line className="ldgf-ink" x1={x(0)} x2={x(DRAWN)} y1={BAR} y2={BAR} strokeWidth="6" />
          <line className="ldgf-pencil" x1={x(DRAWN)} x2={x(DRAWN + 2)} y1={BAR} y2={BAR} strokeWidth="1" strokeDasharray="3 4" />
          <line className="ldgf-pencil" x1={x(DRAWN + 2)} x2="428" y1={BAR} y2={BAR} strokeWidth="6" />
          {/* dimension lines: dash 1, gap 2 */}
          <g className="ldgf-dim" strokeWidth="1">
            <path d={`M${x(-OFFSET)} 210 H ${x(DRAWN)} M${x(-OFFSET)} 205 v 10 M${x(DRAWN)} 205 v 10 M${x(DRAWN + 2)} 205 v 10 M${x(DRAWN)} 210 H ${x(DRAWN + 2)}`} />
          </g>
          {/* leaders from the window down to the two scales */}
          <g className="ldgf-lead" strokeWidth="1" strokeDasharray="1 3">
            {/* broken around the dimension labels */}
            {[0, DRAWN, 1].map((u) => <path key={u} d={`M${x(u)} ${BAR + 14} V 214 M${x(u)} 232 V 242`} />)}
          </g>
        </g>
        <text className="ldgf-n" x={(x(-OFFSET) + x(DRAWN)) / 2} y="226" textAnchor="middle">dash 1</text>
        <text className="ldgf-n" x={(x(DRAWN) + x(DRAWN + 2)) / 2} y="226" textAnchor="middle">gap 2</text>

        {/* The two scales of the same ruler. */}
        <text className="ldgf-k" x="12" y="254">pathLength</text>
        <text className="ldgf-k" x="12" y="274">user units</text>
        {[0, DRAWN, 1].map((u) => (
          <g key={u}>
            <text className="ldgf-v" x={x(u)} y="254" textAnchor="middle">{u}</text>
            <text className="ldgf-v" x={x(u)} y="274" textAnchor="middle">{one(u * LENGTH)}</text>
          </g>
        ))}
        <text className="ldgf-n" x="290" y="264">× {L}</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — with {'pathLength="1"'} the line is 1 long in dash units, whatever it measures ({L} here). A
        dash of 1 and a gap of 2, pulled back by the offset: at {OFFSET} the dash covers 0 → {DRAWN} of the path. At 1
        it covers none of it, at 0 all of it.
      </figcaption>
    </figure>
  );
}
