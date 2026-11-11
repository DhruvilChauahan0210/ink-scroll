import { casteljau, cssOf, fmt, pointAt, solveS, type Bezier } from './bezier';

/**
 * Fig. 1 — the anatomy of a cubic-bezier(), drawn by the generator's own
 * maths (bezier.ts): P0 and P3 pinned at (0, 0) and (1, 1), the two control
 * points the four numbers set, their handles, and the curve. Time runs
 * across, progress up. To ease one moment of time t, find the point on the
 * curve whose x is t (at parameter s) and read its y: the dashed lines. The
 * pencil lines are de Casteljau's construction of that point: the handles and
 * the leg between them cut at s, those cuts joined and cut at s again.
 */

const FIG: Bezier = [0.7, 0.05, 0.3, 0.95];
const T = 0.35;

const O = { x: 96, y: 286 };
const U = 232;
const X = (x: number) => O.x + x * U;
const Y = (y: number) => O.y - y * U;

const r2 = (n: number) => Math.round(n * 100) / 100;

export function AnatomyFigure() {
  const [x1, y1, x2, y2] = FIG;
  const { s } = solveS(FIG, T);
  const b = pointAt(FIG, s);
  const c = casteljau(FIG, s);
  const P = (p: readonly [number, number]) => ({ x: X(p[0]), y: Y(p[1]) });
  const q = c.q.map(P);
  const r = c.r.map(P);
  const B = { x: X(b.x), y: Y(b.y) };
  const curve = `M${X(0)} ${Y(0)} C ${X(x1)} ${Y(y1)}, ${X(x2)} ${Y(y2)}, ${X(1)} ${Y(1)}`;

  return (
    <figure className="stk-fig bzf">
      <svg
        viewBox="0 0 440 330"
        role="img"
        aria-label={`The anatomy of ${cssOf(FIG)}: P0 at (0, 0) and P3 at (1, 1) are fixed; P1 at (${fmt(x1)}, ${fmt(y1)}) and P2 at (${fmt(x2)}, ${fmt(y2)}) pull the curve toward them along their handles. Time runs across, progress up. At time ${fmt(T)} the curve's point has parameter s = ${fmt(r2(s))} and progress ${fmt(r2(b.y))}.`}
      >
        {/* The unit square's far sides. */}
        <line className="bzf-g1" x1={X(0)} x2={X(1)} y1={Y(1)} y2={Y(1)} />
        <line className="bzf-g1" x1={X(1)} x2={X(1)} y1={Y(0)} y2={Y(1)} />

        {/* Axes: time across, progress up. */}
        <path className="bzf-axis" d={`M${X(0)} ${Y(0)} H${X(1) + 34} M${X(1) + 28} ${Y(0) - 4} l6 4 -6 4`} />
        <path className="bzf-axis" d={`M${X(0)} ${Y(0)} V${Y(1) - 28} M${X(0) - 4} ${Y(1) - 22} l4 -6 4 6`} />
        <text className="bzf-ax" x={X(1) + 40} y={Y(0) + 4}>time</text>
        <text className="bzf-ax" x={X(0)} y={Y(1) - 34} textAnchor="middle">progress</text>
        <text className="bzf-ax" x={X(1)} y={Y(0) + 18} textAnchor="middle">1</text>
        <text className="bzf-ax" x={X(0) - 10} y={Y(1) + 4} textAnchor="end">1</text>

        {/* De Casteljau at s: the handles and the leg between them cut at s, then cut again. */}
        <line className="bzf-pencil" x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />
        <line className="bzf-pencil" x1={q[0].x} y1={q[0].y} x2={q[1].x} y2={q[1].y} />
        <line className="bzf-pencil" x1={q[1].x} y1={q[1].y} x2={q[2].x} y2={q[2].y} />
        <line className="bzf-pencil" x1={r[0].x} y1={r[0].y} x2={r[1].x} y2={r[1].y} />
        {[...q, ...r].map((p, i) => <circle key={i} className="bzf-pdot" cx={p.x} cy={p.y} r={2} />)}

        {/* The handles, and the curve they pull. */}
        <line className="bzf-arm" x1={X(0)} y1={Y(0)} x2={X(x1)} y2={Y(y1)} />
        <line className="bzf-arm" x1={X(1)} y1={Y(1)} x2={X(x2)} y2={Y(y2)} />
        <path className="bzf-curve" d={curve} />

        {/* Easing time T: the point whose x is T, and its y. */}
        <line className="bzf-proj" x1={B.x} x2={B.x} y1={Y(0)} y2={B.y} />
        <line className="bzf-proj" x1={X(0)} x2={B.x} y1={B.y} y2={B.y} />
        <text className="bzf-n" x={B.x} y={Y(0) + 18} textAnchor="middle">t {fmt(T)}</text>
        <text className="bzf-n" x={X(0) - 10} y={B.y + 4} textAnchor="end">{fmt(r2(b.y))}</text>
        <circle className="bzf-b" cx={B.x} cy={B.y} r={4.5} />
        <text className="bzf-n" x={B.x - 8} y={B.y - 9} textAnchor="end">s {fmt(r2(s))}</text>

        {/* The four points. */}
        <rect className="bzf-end" x={X(0) - 4} y={Y(0) - 4} width={8} height={8} />
        <rect className="bzf-end" x={X(1) - 4} y={Y(1) - 4} width={8} height={8} />
        <circle className="bzf-h" cx={X(x1)} cy={Y(y1)} r={6} />
        <circle className="bzf-h" cx={X(x2)} cy={Y(y2)} r={6} />
        <text className="bzf-k" x={X(0) - 10} y={Y(0) + 4} textAnchor="end">P0</text>
        <text className="bzf-n" x={X(0) - 10} y={Y(0) + 20} textAnchor="end">(0, 0) start</text>
        <text className="bzf-k" x={X(1) + 12} y={Y(1) + 4}>P3</text>
        <text className="bzf-n" x={X(1) + 36} y={Y(1) + 4}>(1, 1) end</text>
        <text className="bzf-k" x={X(x1) + 12} y={Y(y1) - 10}>P1</text>
        <text className="bzf-n" x={X(x1) + 36} y={Y(y1) - 10}>(x1, y1)</text>
        <text className="bzf-k" x={X(x2) - 12} y={Y(y2) + 22} textAnchor="end">P2</text>
        <text className="bzf-n" x={X(x2) - 12} y={Y(y2) + 36} textAnchor="end">(x2, y2)</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — {cssOf(FIG)}. P0 and P3 are fixed; the four numbers place P1 and P2, and the curve leaves P0 toward
        P1 and arrives at P3 from P2. To ease time {fmt(T)}, find the point whose x is {fmt(T)} (s = {fmt(r2(s))}) and
        read its y: {fmt(r2(b.y))}. Pencil: de Casteljau’s construction of that point.
      </figcaption>
    </figure>
  );
}
