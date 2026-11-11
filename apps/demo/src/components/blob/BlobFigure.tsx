import { HANDLE, blobFromRadii, blobRadii, spokeAngle, type Pt } from './blob';

/**
 * Fig. 1 — the polar construction, drawn by the generator's own functions:
 * seven spokes at equal angles from a centre, a seeded radius on each, and the
 * closed Catmull-Rom curve through their ends. One piece, p1 to p2, is picked
 * out with its two handles: c1 runs from p1 parallel to the chord p0 → p2, a
 * sixth of its length, which is why no point is a corner.
 */

const N = 7;
const SEED = 2468;
const RANDOMNESS = 0.45;
const BOX = 300;
const OX = 14;
const OY = 14;
const SIXTH = Math.round(1 / HANDLE);

const g = blobFromRadii(blobRadii(SEED, N, RANDOMNESS), BOX, 0);
const at = (p: Pt): Pt => [p[0] + OX, p[1] + OY];
const C: Pt = [g.c + OX, g.c + OY];
const P = g.points.map(at);
const HL = 1; // the piece from p1 to p2
const piece = g.cubics[HL].map(at);
const f = (n: number) => Math.round(n * 10) / 10;
const xy = (p: Pt) => `${f(p[0])},${f(p[1])}`;
const curve = (() => {
  const cs = g.cubics.map((c) => c.map(at));
  return `M${xy(cs[0][0])} ${cs.map((c) => `C${xy(c[1])} ${xy(c[2])} ${xy(c[3])}`).join(' ')} Z`;
})();
const pieceD = `M${xy(piece[0])} C${xy(piece[1])} ${xy(piece[2])} ${xy(piece[3])}`;

/** A point `k` out from the centre at angle `a` (radians). */
const polar = (a: number, k: number): Pt => [C[0] + Math.cos(a) * k, C[1] + Math.sin(a) * k];
const mid = (a: Pt, b: Pt, t = 0.5): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A label just outside a point, away from the centre, anchored so it runs outward. */
function outward(p: Pt, k = 12): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const dx = p[0] - C[0];
  const dy = p[1] - C[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const anchor = ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle';
  return { x: f(p[0] + ux * k), y: f(p[1] + uy * k + (uy > 0.35 ? 8 : uy < -0.35 ? -2 : 4)), anchor };
}

// The angle between the last spoke and the first, marked up and to the left.
const ARC_R = 30;
const arcFrom = polar(spokeAngle(N - 1, N), ARC_R);
const arcTo = polar(spokeAngle(0, N), ARC_R);
const arcLabel = polar((spokeAngle(N - 1, N) + spokeAngle(N, N)) / 2, ARC_R + 12);

export function BlobFigure() {
  const p0 = P[HL - 1];
  const p2 = P[HL + 1];
  const r4 = mid(C, P[4], 0.45);
  const labels: [Pt, string][] = [[P[0], 'p0 · M'], [P[1], 'p1'], [P[2], 'p2'], [P[3], 'p3']];
  return (
    <figure className="stk-fig blbf">
      <svg
        viewBox="0 0 400 330"
        role="img"
        aria-label={`A blob built from ${N} spokes ${f(360 / N)} degrees apart around a centre, each with its own seeded radius, joined by one smooth closed curve through their ends. The piece from p1 to p2 is shown with its two Bézier handles; the first runs parallel to the dashed line from p0 to p2.`}
      >
        {/* Pencil: the longest radius, the spokes, the angle, the chord the tangent follows. */}
        <g className="blbf-pencil" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx={C[0]} cy={C[1]} r={g.scale} strokeDasharray="2 4" />
          {P.map((p, i) => <line key={i} x1={C[0]} y1={C[1]} x2={p[0]} y2={p[1]} strokeDasharray="3 4" />)}
          <path d={`M${xy(arcFrom)} A${ARC_R},${ARC_R} 0 0 1 ${xy(arcTo)}`} />
          <line x1={p0[0]} y1={p0[1]} x2={p2[0]} y2={p2[1]} strokeDasharray="6 4" />
        </g>

        {/* Ink: the curve, the picked piece's handles. */}
        <g className="blbf-ink" fill="none" stroke="currentColor">
          <path d={curve} strokeWidth="2" />
          <line x1={piece[0][0]} y1={piece[0][1]} x2={piece[1][0]} y2={piece[1][1]} strokeWidth="1" />
          <line x1={piece[3][0]} y1={piece[3][1]} x2={piece[2][0]} y2={piece[2][1]} strokeWidth="1" />
        </g>
        <path className="blbf-hl" d={pieceD} fill="none" stroke="currentColor" strokeWidth="3" />
        <g className="blbf-ink" fill="currentColor">
          {P.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 4 : 3} />)}
          <circle cx={C[0]} cy={C[1]} r={2.5} />
        </g>
        <g className="blbf-ink" fill="var(--bg)" stroke="currentColor" strokeWidth="1">
          {[piece[1], piece[2]].map((p, i) => <rect key={i} x={p[0] - 3} y={p[1] - 3} width={6} height={6} />)}
        </g>

        {/* Labels. */}
        {labels.map(([p, t]) => {
          const l = outward(p);
          return <text key={t} className="blbf-k" x={l.x} y={l.y} textAnchor={l.anchor}>{t}</text>;
        })}
        {(['c1', 'c2'] as const).map((t, i) => {
          const l = outward(piece[i + 1], 10);
          return <text key={t} className="blbf-k" x={l.x} y={l.y} textAnchor={l.anchor}>{t}</text>;
        })}
        <text className="blbf-n" x={C[0] + 7} y={C[1] + 14}>centre</text>
        <text className="blbf-n" x={f(arcLabel[0])} y={f(arcLabel[1])} textAnchor="end">360° ÷ {N}</text>
        <text className="blbf-n" x={f(r4[0]) - 6} y={f(r4[1])} textAnchor="end">r4 · seeded</text>
        <text className="blbf-n" x={f(C[0] + g.scale * 0.71) + 6} y={f(C[1] + g.scale * 0.71) + 6}>longest radius</text>
        <text className="blbf-k" x="396" y="324" textAnchor="end">M · {N} × C · Z</text>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — {N} spokes {f(360 / N)}° apart, a seeded radius on each, one smooth curve through their ends. The
        piece p1 → p2 is a cubic Bézier with c1 = p1 + (p2 − p0) ÷ {SIXTH} and c2 = p2 − (p3 − p1) ÷ {SIXTH}, so it
        leaves p1 parallel to the dashed line p0 → p2. Every point joins that way, p0 included, where the path closes.
      </figcaption>
    </figure>
  );
}
