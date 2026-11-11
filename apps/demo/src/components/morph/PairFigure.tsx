import { matchShapes, morphPath, parsePath, skeleton, toD, vertices, type Pt } from './path-morph';
import { DEFAULT_PAIR, presetOf } from './shapes';

/**
 * Fig. 1 — what a morph is made of, drawn by the generator's own functions:
 * the circle and the star it opens with, both rewritten as the same 20
 * cubics, each of the circle's points joined by a thin line to its partner
 * on the star. morphTo moves every point along its line; the dashed frame is
 * morphPath() at t = 0.5.
 */

const A = presetOf(DEFAULT_PAIR.from);
const B = presetOf(DEFAULT_PAIR.to);
const pa = parsePath(A.d);
const pb = parsePath(B.d);
const m = pa.ok && pb.ok ? matchShapes(pa.shape, pb.shape) : null;

const K = 1.2;
const OX = 14;
const OY = 18;
const at = (p: Pt): Pt => [OX + p[0] * K, OY + p[1] * K];
const fmt = (n: number) => Math.round(n * 10) / 10;

export const FIG_POINTS = m ? m.counts[0] : 0;

export function PairFigure() {
  if (!m || !pa.ok || !pb.ok) return null;
  const from = toD(m.from, 2, m.closed);
  const to = toD(m.to, 2, m.closed);
  const mid = morphPath(from, to, 0.5);
  const va = vertices(m.from[0]).slice(0, -1);
  const vb = vertices(m.to[0]).slice(0, -1);
  const n = va.length;
  const out = skeleton(['M', ...Array<string>(n).fill('C'), 'Z']);
  const c: Pt = at([100, 100]);
  const L = 290;
  return (
    <figure className="stk-fig mphf">
      <svg
        viewBox="0 0 470 280"
        role="img"
        aria-label={`A circle and a star drawn over each other, each rewritten as ${n} cubic curves. A thin line joins each of the circle's ${n} points to its partner on the star; half way along the lines, a dashed shape between the two.`}
      >
        <g transform={`translate(${OX} ${OY}) scale(${K})`} fill="none" strokeLinejoin="round">
          <path className="mphf-mid" d={mid} strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <path className="mphf-to" d={to} strokeWidth="1.5" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" />
          <path className="mphf-from" d={from} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </g>
        <g className="mphf-travel" strokeWidth="0.75">
          {va.map((p, i) => {
            const [x1, y1] = at(p);
            const [x2, y2] = at(vb[i]);
            return <line key={i} x1={fmt(x1)} y1={fmt(y1)} x2={fmt(x2)} y2={fmt(y2)} />;
          })}
        </g>
        {vb.map((p, i) => {
          const [x, y] = at(p);
          return <circle key={`b${i}`} className="mphf-pt-to" cx={fmt(x)} cy={fmt(y)} r="2.6" strokeWidth="1" />;
        })}
        {va.map((p, i) => {
          const [x, y] = at(p);
          return <circle key={`a${i}`} className="mphf-pt" cx={fmt(x)} cy={fmt(y)} r={i === 0 ? 3.8 : 2.6} />;
        })}
        {va.map((p, i) => {
          if (i % 2) return null;
          const [x, y] = at(p);
          const dx = x - c[0];
          const dy = y - c[1];
          const d = Math.hypot(dx, dy) || 1;
          return (
            <text key={`n${i}`} className="mphf-num" x={fmt(x + (dx / d) * 13)} y={fmt(y + (dy / d) * 13 + 3.5)} textAnchor="middle">
              {i + 1}
            </text>
          );
        })}

        <g className="mphf-legend">
          <line className="mphf-from" x1={L} x2={L + 22} y1="40" y2="40" strokeWidth="2" />
          <text className="mphf-k" x={L + 30} y="44">start · {A.name.toLowerCase()}</text>
          <text className="mphf-d" x={L} y="62">d = {skeleton(pa.letters)}</text>
          <text className="mphf-d" x={L} y="78">→ {out}</text>

          <line className="mphf-to" x1={L} x2={L + 22} y1="108" y2="108" strokeWidth="1.5" strokeDasharray="5 3" />
          <text className="mphf-k" x={L + 30} y="112">end · {B.name.toLowerCase()}</text>
          <text className="mphf-d" x={L} y="130">d = {skeleton(pb.letters)}</text>
          <text className="mphf-d" x={L} y="146">→ {out}</text>

          <line className="mphf-mid" x1={L} x2={L + 22} y1="176" y2="176" strokeWidth="1" strokeDasharray="2 3" />
          <text className="mphf-k" x={L + 30} y="180">t = 0.5</text>
          <text className="mphf-dim" x={L} y="198">each point i, each step t:</text>
          <text className="mphf-d" x={L} y="214">x = x₀ + (x₁ − x₀) · t</text>
          <text className="mphf-d" x={L} y="230">y = y₀ + (y₁ − y₀) · t</text>
          <text className="mphf-dim" x={L} y="254">{n} points, {n * 6 + 2} numbers</text>
        </g>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the circle and star this page opens with, each rewritten as {n} cubics. A thin line joins every point to
        its partner; morphTo moves each one along its line as you scroll. Dashed: the frame half way.
      </figcaption>
    </figure>
  );
}
