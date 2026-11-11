import { catmullRom, clip, edgeD, wavePoints, type WaveSettings } from './wave';

/**
 * Fig. 2: tension, drawn by the generator's own catmullRom(). The same seeded
 * points three times; at each point the two handles of the curve, which lie
 * along the line between its neighbours. Tension 0 is the classic
 * Catmull-Rom, 0.5 halves the handles, 1 leaves none: straight lines, the
 * peaks shape.
 */

const W = 360;
const S: WaveSettings = {
  mode: 'fill', layers: 1, amplitude: 0.9, waves: 3, smooth: 'curved', tension: 0, steps: 8, variation: 0.7,
  seed: 11, flipX: false, flipY: false, height: 64, strokeWidth: 4, stagger: 0, plays: 'scroll', finish: 'leave',
};
const ROWS = [
  { tension: 0, note: 'tension 0 · Catmull-Rom' },
  { tension: 0.5, note: 'tension 0.5 · handles halved' },
  { tension: 1, note: 'tension 1 · no handles: peaks' },
];
const pts = wavePoints(S, 0, W);
const inside = pts.filter((p) => p.x > 0 && p.x < W);

export function TensionFigure() {
  return (
    <figure className="stk-fig wvf is-body">
      <svg viewBox="0 0 420 300" role="img" aria-label={`The same ${inside.length} points joined three times: at tension 0 a round curve with long handles, at 0.5 a tighter curve with handles half as long, at 1 straight lines with no handles.`}>
        {ROWS.map((r, row) => {
          const pieces = clip(catmullRom(pts, r.tension), 0, W);
          // Handles at the real points only (not where the curve is cut at the edges).
          const handles = catmullRom(pts, r.tension).flatMap((p) => [[p[0], p[1]], [p[3], p[2]]])
            .filter(([a]) => a.x > 0 && a.x < W);
          return (
            <g key={r.tension} transform={`translate(30 ${16 + row * 96})`}>
              <text className="wvf-k" x="0" y="0">{r.note}</text>
              <g transform="translate(0 12)">
                <g className="wvf-pencil" fill="none" stroke="currentColor" strokeWidth="1">
                  <line x1="0" y1="-4" x2="0" y2={S.height + 4} strokeDasharray="2 3" />
                  <line x1={W} y1="-4" x2={W} y2={S.height + 4} strokeDasharray="2 3" />
                  {r.tension < 1 && handles.map(([a, h], i) => (
                    <line key={i} x1={a.x} y1={a.y} x2={h.x} y2={h.y} />
                  ))}
                </g>
                {r.tension < 1 && (
                  <g className="wvf-pencil" fill="currentColor">
                    {handles.map(([, h], i) => <rect key={i} x={h.x - 2} y={h.y - 2} width="4" height="4" />)}
                  </g>
                )}
                <path className="wvf-ink" d={edgeD(pieces)} fill="none" stroke="currentColor" strokeWidth="2" />
                <g className="wvf-ink" fill="currentColor">
                  {inside.map((p) => <circle key={p.x} cx={p.x} cy={p.y} r="3" />)}
                </g>
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption className="stk-cap">
        Fig. 2 — the same seeded points, joined at three tensions. Each point’s two handles lie on the line between its
        neighbours; tension shortens them, and at 1 the curve is straight lines.
      </figcaption>
    </figure>
  );
}
