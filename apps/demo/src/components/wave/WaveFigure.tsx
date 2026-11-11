import { catmullRom, clip, edgeD, layerFrame, wavePoints, wavelength, type WaveSettings } from './wave';

/**
 * Fig. 1: how amplitude and wavelength map onto the curve, drawn by the
 * generator's own functions. A crest, then a trough, every half wavelength,
 * A above and below the baseline; the curve through those points, its handles
 * at one trough; the curve carrying on past both edges (dashed) and cut at
 * exactly 0 and the width; then the shape closed down the side and along the
 * bottom.
 */

const W = 360;
const S: WaveSettings = {
  mode: 'fill', layers: 1, amplitude: 0.78, waves: 1.5, smooth: 'curved', tension: 0, steps: 8, variation: 0,
  seed: 1, flipX: false, flipY: false, height: 150, strokeWidth: 4, stagger: 0, plays: 'scroll', finish: 'leave',
};
const OX = 30;
const OY = 40;

const pts = wavePoints(S, 0, W);
const full = catmullRom(pts, 0);
const edge = clip(catmullRom(pts, 0), 0, W);
const { b, A } = layerFrame(S, 0);
const lambda = wavelength(S.waves, W);
const inside = pts.filter((p) => p.x >= -0.01 && p.x <= W + 0.01);
/** The piece that starts at the first trough: its handles are drawn. */
const shown = full.find((p) => Math.abs(p[0].x - lambda / 2) < 0.01);
const before = full.find((p) => Math.abs(p[p.length - 1].x - lambda / 2) < 0.01);

export function WaveFigure() {
  if (!shown || !before || inside.length < 3) return null;
  const crest0 = inside[0];
  const trough = inside[1];
  const crest1 = inside[2];
  const H = S.height;
  return (
    <figure className="stk-fig wvf">
      <svg
        viewBox="0 0 420 240"
        role="img"
        aria-label="A wave between x = 0 and the width: points at a crest, then a trough, every half wavelength. The wavelength runs crest to crest, the amplitude A from the baseline to a crest. The curve continues past both edges and is cut at exactly 0 and the width, then closed down the side and along the bottom."
      >
        <g transform={`translate(${OX} ${OY})`}>
          {/* The closed shape, faint. */}
          <path className="wvf-area" d={`${edgeD(edge)}V${H}H0Z`} />

          {/* Construction: the box edges, the baseline, the curve past the edges. */}
          <g className="wvf-pencil" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1="0" y1={-26} x2="0" y2={H + 8} />
            <line x1={W} y1={-26} x2={W} y2={H + 8} />
            <line x1={-OX} y1={b} x2={W + OX} y2={b} strokeDasharray="3 4" />
            <path d={edgeD(full)} strokeDasharray="2 4" />
            {/* The closing sides: V height, H 0, Z. */}
            <path d={`M${W} ${edge[edge.length - 1][3].y}V${H}H0V${edge[0][0].y}`} strokeDasharray="3 4" />
            {/* One trough's handles: along the line between its neighbours, a sixth of it each side. */}
            <line x1={before[2].x} y1={before[2].y} x2={shown[1].x} y2={shown[1].y} />
          </g>
          <g className="wvf-pencil" fill="currentColor">
            <rect x={before[2].x - 2.5} y={before[2].y - 2.5} width="5" height="5" />
            <rect x={shown[1].x - 2.5} y={shown[1].y - 2.5} width="5" height="5" />
          </g>

          {/* The curve, cut to the box. */}
          <path className="wvf-ink" d={edgeD(edge)} fill="none" stroke="currentColor" strokeWidth="2.25" />
          <g className="wvf-ink" fill="currentColor">
            {inside.map((p) => <circle key={p.x} cx={p.x} cy={p.y} r="3.2" />)}
          </g>

          {/* λ: crest to crest, above the wave. */}
          <g className="wvf-ink" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1={crest0.x} y1={-18} x2={crest1.x} y2={-18} />
            <path d={`M${crest0.x + 6} ${-21}L${crest0.x} ${-18}L${crest0.x + 6} ${-15}`} />
            <path d={`M${crest1.x - 6} ${-21}L${crest1.x} ${-18}L${crest1.x - 6} ${-15}`} />
            <line x1={crest1.x} y1={-22} x2={crest1.x} y2={crest1.y - 6} strokeDasharray="2 3" />
            {/* A: baseline to crest. */}
            <line x1={crest1.x + 14} y1={b} x2={crest1.x + 14} y2={crest1.y} />
            <path d={`M${crest1.x + 11} ${crest1.y + 6}L${crest1.x + 14} ${crest1.y}L${crest1.x + 17} ${crest1.y + 6}`} />
            <path d={`M${crest1.x + 11} ${b - 6}L${crest1.x + 14} ${b}L${crest1.x + 17} ${b - 6}`} />
          </g>
          <text className="wvf-dim" x={(crest0.x + crest1.x) / 2} y={-25} textAnchor="middle">λ = width ÷ waves</text>
          <text className="wvf-dim" x={crest1.x + 21} y={(b + crest1.y) / 2 + 4}>A</text>
          <text className="wvf-n" x={W + 4} y={b - 5} textAnchor="end">baseline</text>

          <text className="wvf-n" x={crest0.x + 7} y={crest0.y - 7}>crest</text>
          <text className="wvf-n" x={trough.x} y={trough.y - 11} textAnchor="middle">trough</text>
          <text className="wvf-n" x={before[2].x - 7} y={before[2].y + 4} textAnchor="end">handles</text>

          <text className="wvf-k" x="0" y={H + 22}>x = 0</text>
          <text className="wvf-k" x={W} y={H + 22} textAnchor="end">x = width</text>
          <text className="wvf-n" x={W / 2} y={H + 22} textAnchor="middle">V height · H 0 · Z</text>
          <text className="wvf-n" x="0" y={H + 40}>
            waves {S.waves} · λ {Math.round(lambda)} · A {Math.round(A)} · height {H} · tension {S.tension}
          </text>
        </g>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — the points come first: a crest, then a trough, every half wavelength, A above and below the baseline.
        The curve runs on past both edges (dashed) and is cut at exactly 0 and the width, so the shape closes with no gap.
      </figcaption>
    </figure>
  );
}
