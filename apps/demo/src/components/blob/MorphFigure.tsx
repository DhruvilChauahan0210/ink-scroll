import { blobFromRadii, blobRadii, lerpRadii, nextSeed, type BlobGeometry, type Pt } from './blob';

/**
 * Fig. 2 — a morph, drawn by the generator's own functions: two seeds with
 * the same number of points, and the blob half way between them. The spokes
 * are the same in all three, so each point only slides along its own spoke:
 * the path keeps its commands and only the numbers change.
 */

export const MORPH_FIG = { seed: 4127, points: 6, randomness: 0.5 };
const BOX = 260;
const OX = 10;
const OY = 10;

const ra = blobRadii(MORPH_FIG.seed, MORPH_FIG.points, MORPH_FIG.randomness);
const rb = blobRadii(nextSeed(MORPH_FIG.seed), MORPH_FIG.points, MORPH_FIG.randomness);
const A = blobFromRadii(ra, BOX, 0);
const B = blobFromRadii(rb, BOX, 0);
const H = blobFromRadii(lerpRadii(ra, rb, 0.5), BOX, 0);

const f = (n: number) => Math.round(n * 10) / 10;
const at = (p: Pt): Pt => [p[0] + OX, p[1] + OY];
const pathOf = (g: BlobGeometry) => {
  const cs = g.cubics.map((c) => c.map(at));
  const xy = (p: Pt) => `${f(p[0])},${f(p[1])}`;
  return `M${xy(cs[0][0])} ${cs.map((c) => `C${xy(c[1])} ${xy(c[2])} ${xy(c[3])}`).join(' ')} Z`;
};
const C = at([A.c, A.c]);
/** The spoke through each point, out to the farthest of the three blobs' points, plus a little. */
const spokes = A.points.map((p, i) => {
  const far = Math.max(...[A, B, H].map((g) => Math.hypot(g.points[i][0] - g.c, g.points[i][1] - g.c))) + 12;
  const a = Math.atan2(p[1] - A.c, p[0] - A.c);
  return [C, [C[0] + Math.cos(a) * far, C[1] + Math.sin(a) * far] as Pt] as const;
});

export function MorphFigure() {
  const n = MORPH_FIG.points;
  return (
    <figure className="stk-fig blbf blbf-sec">
      <svg
        viewBox="0 0 440 280"
        role="img"
        aria-label={`Two blobs of ${n} points, seeds ${MORPH_FIG.seed} and ${nextSeed(MORPH_FIG.seed)}, drawn over each other with the blob half way between them. All three share the same ${n} spokes; each point moves only along its own spoke.`}
      >
        <g className="blbf-pencil" fill="none" stroke="currentColor" strokeWidth="1">
          {spokes.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeDasharray="2 4" />)}
          <path d={pathOf(A)} strokeDasharray="5 4" />
        </g>
        <g className="blbf-ink" fill="none" stroke="currentColor">
          <path d={pathOf(B)} strokeWidth="1" />
          <path d={pathOf(H)} strokeWidth="2.5" />
        </g>
        <g className="blbf-ink" fill="currentColor">
          {H.points.map((p, i) => {
            const q = at(p);
            return <circle key={i} cx={q[0]} cy={q[1]} r={3.5} />;
          })}
          <circle cx={C[0]} cy={C[1]} r={2.5} />
        </g>
        <g className="blbf-pencil" fill="var(--bg)" stroke="currentColor" strokeWidth="1">
          {A.points.map((p, i) => {
            const q = at(p);
            return <circle key={i} cx={q[0]} cy={q[1]} r={2.5} />;
          })}
        </g>
        <g className="blbf-ink" fill="var(--bg)" stroke="currentColor" strokeWidth="1">
          {B.points.map((p, i) => {
            const q = at(p);
            return <rect key={i} x={q[0] - 2.5} y={q[1] - 2.5} width={5} height={5} />;
          })}
        </g>

        {/* The key. */}
        <g transform="translate(296 44)">
          <line className="blbf-pencil" x1="0" x2="22" y1="0" y2="0" stroke="currentColor" strokeDasharray="5 4" />
          <text className="blbf-k" x="30" y="4">t 0 · {MORPH_FIG.seed}</text>
          <line className="blbf-ink" x1="0" x2="22" y1="24" y2="24" stroke="currentColor" strokeWidth="2.5" />
          <text className="blbf-k" x="30" y="28">t 0.5</text>
          <line className="blbf-ink" x1="0" x2="22" y1="48" y2="48" stroke="currentColor" />
          <text className="blbf-k" x="30" y="52">t 1 · {nextSeed(MORPH_FIG.seed)}</text>
          <text className="blbf-n" x="0" y="92">each radius</text>
          <text className="blbf-n" x="0" y="107">a + (b − a) × t</text>
          <text className="blbf-n" x="0" y="134">all three</text>
          <text className="blbf-n" x="0" y="149">M · {n} × C · Z</text>
        </g>
      </svg>
      <figcaption className="stk-cap">
        Fig. 2 — seeds {MORPH_FIG.seed} and {nextSeed(MORPH_FIG.seed)}, {n} points each, and the blob half way. Every
        point slides along its own spoke, so the path’s commands never change, only its numbers.
      </figcaption>
    </figure>
  );
}
