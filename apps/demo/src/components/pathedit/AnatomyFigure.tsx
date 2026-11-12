import { arcCenter, arcPoint, geometry, parsePath, writeD, type Pt } from './path-data';

/**
 * Fig. 1 — what a cubic segment and an arc segment are made of, drawn from
 * the editor's own functions: one path, M then C then A. The cubic's two
 * control points pull the curve; the arc is part of an ellipse found from its
 * two end points, its radii, its rotation and two flags. The dashed ellipse
 * and its centre are worked out by arcCenter(), the dotted one is the ellipse
 * the other large-arc flag would pick.
 */

const D = 'M40 222 C70 70 200 58 232 170 A100 60 -20 0 1 412 170';
const segs = parsePath(D).segs;
const [m, c, a] = geometry(segs);
const arc = a.arc!;
const ctr = arcCenter(a.start, a.end, arc)!;
const other = arcCenter(a.start, a.end, { ...arc, large: 1 - arc.large })!;

const f = (n: number) => Math.round(n * 10) / 10;
const deg = (ctr.phi * 180) / Math.PI;
const rxEnd = arcPoint(ctr, 0);
const ryEnd = arcPoint(ctr, -Math.PI / 2);
/** A point part way along the arc, and the direction it runs there, for the arrow. */
const mid = ctr.theta1 + ctr.dtheta * 0.42;
const midPt = arcPoint(ctr, mid);
const ahead = arcPoint(ctr, mid + 0.05);
const dir = Math.atan2(ahead[1] - midPt[1], ahead[0] - midPt[0]);
const arrow = (p: Pt, t: number) => {
  const s = 7;
  const l: Pt = [p[0] - s * Math.cos(t - 0.45), p[1] - s * Math.sin(t - 0.45)];
  const r: Pt = [p[0] - s * Math.cos(t + 0.45), p[1] - s * Math.sin(t + 0.45)];
  return `M${f(l[0])} ${f(l[1])} L${f(p[0])} ${f(p[1])} L${f(r[0])} ${f(r[1])}`;
};
/** The rotation, drawn as a short arc from the horizontal to the ellipse's x axis. */
const rotR = 34;
/** The highest the arc and the other ellipse reach, so the sweep label clears both. */
const top = Math.min(ctr.cy - ctr.ry, other.cy - other.ry);
const rotPath = `M${f(ctr.cx + rotR)} ${f(ctr.cy)} A${rotR} ${rotR} 0 0 ${ctr.phi < 0 ? 0 : 1} ${f(ctr.cx + rotR * Math.cos(ctr.phi))} ${f(ctr.cy + rotR * Math.sin(ctr.phi))}`;

const LEGEND: { cmd: string; parts: string }[] = [
  { cmd: writeD([segs[0]]), parts: 'the pen goes down here' },
  { cmd: writeD([segs[1]]).replace(/^C/, 'C '), parts: 'x1 y1 · x2 y2 · x y' },
  { cmd: writeD([segs[2]]).replace(/^A/, 'A '), parts: 'rx ry · rotation · large-arc · sweep · x y' },
];

export function AnatomyFigure() {
  return (
    <figure className="stk-fig pedf">
      <svg
        viewBox="0 0 480 384"
        role="img"
        aria-label={`One path, ${D}. A cubic curve from the start point to its end, with lines to its two control points; then an arc to the right along a dashed ellipse whose centre, radii and ${f(deg)} degree rotation are marked, and a dotted second ellipse the other large-arc flag would use.`}
      >
        {/* The other ellipse through the same two points. */}
        <ellipse className="pedf-other" cx={f(other.cx)} cy={f(other.cy)} rx={f(other.rx)} ry={f(other.ry)} transform={`rotate(${f(deg)} ${f(other.cx)} ${f(other.cy)})`} />
        {/* The arc's ellipse, its centre, radii and rotation. */}
        <ellipse className="pedf-ell" cx={f(ctr.cx)} cy={f(ctr.cy)} rx={f(ctr.rx)} ry={f(ctr.ry)} transform={`rotate(${f(deg)} ${f(ctr.cx)} ${f(ctr.cy)})`} />
        <line className="pedf-dim" x1={f(ctr.cx)} y1={f(ctr.cy)} x2={f(rxEnd[0])} y2={f(rxEnd[1])} />
        <line className="pedf-dim" x1={f(ctr.cx)} y1={f(ctr.cy)} x2={f(ryEnd[0])} y2={f(ryEnd[1])} />
        <line className="pedf-ref" x1={f(ctr.cx)} y1={f(ctr.cy)} x2={f(ctr.cx + rotR + 14)} y2={f(ctr.cy)} />
        <path className="pedf-dim" d={rotPath} />
        <path className="pedf-cross" d={`M${f(ctr.cx - 4)} ${f(ctr.cy)} H${f(ctr.cx + 4)} M${f(ctr.cx)} ${f(ctr.cy - 4)} V${f(ctr.cy + 4)}`} />
        <text className="pedf-k" x={f(ctr.cx - 8)} y={f(ctr.cy + 18)} textAnchor="end">centre</text>
        <text className="pedf-n" x={f((ctr.cx + rxEnd[0]) / 2 - 4)} y={f((ctr.cy + rxEnd[1]) / 2 - 7)} textAnchor="end">rx {arc.rx}</text>
        <text className="pedf-n" x={f((ctr.cx + ryEnd[0]) / 2 - 6)} y={f((ctr.cy + ryEnd[1]) / 2 + 2)} textAnchor="end">ry {arc.ry}</text>
        <text className="pedf-n" x={f(ctr.cx + 8)} y={f(ctr.cy + 18)}>rotation {arc.rot}°</text>

        {/* The cubic's handles. */}
        <line className="pedf-arm" x1={m.end[0]} y1={m.end[1]} x2={c.c1![0]} y2={c.c1![1]} />
        <line className="pedf-arm" x1={c.c2![0]} y1={c.c2![1]} x2={c.end[0]} y2={c.end[1]} />

        {/* The path itself. */}
        <path className="pedf-path" d={D} />
        <path className="pedf-path" d={arrow(midPt, dir)} />

        <rect className="pedf-ctrl" x={c.c1![0] - 4} y={c.c1![1] - 4} width="8" height="8" />
        <rect className="pedf-ctrl" x={c.c2![0] - 4} y={c.c2![1] - 4} width="8" height="8" />
        <circle className="pedf-pt" cx={m.end[0]} cy={m.end[1]} r="4.5" />
        <circle className="pedf-pt" cx={c.end[0]} cy={c.end[1]} r="4.5" />
        <circle className="pedf-pt" cx={a.end[0]} cy={a.end[1]} r="4.5" />

        <text className="pedf-k" x={c.c1![0] + 10} y={c.c1![1] + 4}>x1 y1</text>
        <text className="pedf-k" x={c.c2![0] - 10} y={c.c2![1] - 6} textAnchor="end">x2 y2</text>
        <text className="pedf-k" x={m.end[0] + 10} y={m.end[1] + 4}>M · start</text>
        <text className="pedf-k" x={c.end[0] - 10} y={c.end[1] + 18} textAnchor="end">C ends, A starts</text>
        <text className="pedf-k" x={a.end[0] + 9} y={a.end[1] + 4}>x y</text>
        <text className="pedf-n" x={f(midPt[0])} y={f(Math.min(midPt[1], top) - 14)} textAnchor="middle">sweep {arc.sweep} · clockwise</text>

        {/* The d string, command by command. */}
        <g className="pedf-legend">
          <line className="pedf-rule" x1="16" x2="464" y1="270" y2="270" />
          {LEGEND.map((l, i) => (
            <g key={l.cmd}>
              <text className="pedf-d" x="16" y={292 + i * 36}>{l.cmd}</text>
              <text className="pedf-dim-t" x="28" y={308 + i * 36}>{l.parts}</text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — a cubic and an arc in one path. The cubic is pulled toward two control points; the arc is part of an
        ellipse fixed by its end points, radii, rotation and two flags. Dotted: the other ellipse through the same
        two points, whose long way round large-arc 1 would take.
      </figcaption>
    </figure>
  );
}
