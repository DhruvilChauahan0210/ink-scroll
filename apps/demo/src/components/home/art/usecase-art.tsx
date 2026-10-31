/**
 * Six line illustrations for the homepage use-case gallery. Each is a real
 * thing people build with svg-scroll-draw, drawn as precise strokes on a
 * 400 × 300 viewBox.
 *
 * All geometry is computed once at module load from fixed numbers — no
 * randomness — so the server and the client render identical markup.
 *
 * Every element meant to be drawn is a <path>; anything static (fills that
 * occlude, masks) carries the `uc-x` class so the tile's selector skips it.
 * DOM order is drawing order.
 */

type P = [number, number];

const n = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1));
const pt = (p: P) => `${n(p[0])} ${n(p[1])}`;

/* ── Geometry helpers ─────────────────────────────────────────────────────── */

/** Centripetal Catmull–Rom through `pts`, as cubic Bézier segments (no M). */
function crSegments(pts: P[]): string {
  const a = 0.5;
  let d = '';
  const ext = (p: P, q: P): P => [2 * p[0] - q[0], 2 * p[1] - q[1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i === 0 ? ext(pts[0], pts[1]) : pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : ext(pts[i + 1], pts[i]);
    const d1 = Math.max(1e-4, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
    const d2 = Math.max(1e-4, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]));
    const d3 = Math.max(1e-4, Math.hypot(p3[0] - p2[0], p3[1] - p2[1]));
    const d1a = Math.pow(d1, a), d2a = Math.pow(d2, a), d3a = Math.pow(d3, a);
    const d1a2 = d1a * d1a, d2a2 = d2a * d2a, d3a2 = d3a * d3a;
    const b1: P = [0, 0];
    const b2: P = [0, 0];
    for (let k = 0; k < 2; k++) {
      b1[k] = (d1a2 * p2[k] - d2a2 * p0[k] + (2 * d1a2 + 3 * d1a * d2a + d2a2) * p1[k]) / (3 * d1a * (d1a + d2a));
      b2[k] = (d3a2 * p1[k] - d2a2 * p3[k] + (2 * d3a2 + 3 * d3a * d2a + d2a2) * p2[k]) / (3 * d3a * (d3a + d2a));
    }
    d += ` C ${pt(b1)} ${pt(b2)} ${pt(p2)}`;
  }
  return d;
}

const smooth = (pts: P[]) => `M ${pt(pts[0])}${crSegments(pts)}`;

/** Monotone cubic (Fritsch–Carlson) through points sorted by x. */
function monotone(pts: P[]): string {
  const len = pts.length;
  const dx: number[] = [], m: number[] = [], t: number[] = [];
  for (let i = 0; i < len - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[len - 1] = m[len - 2];
  for (let i = 1; i < len - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < len - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const al = t[i] / m[i], be = t[i + 1] / m[i], s = al * al + be * be;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * al * m[i]; t[i + 1] = k * be * m[i]; }
  }
  let d = `M ${pt(pts[0])}`;
  for (let i = 0; i < len - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${pt([pts[i][0] + h, pts[i][1] + h * t[i]])} ${pt([pts[i + 1][0] - h, pts[i + 1][1] - h * t[i + 1]])} ${pt(pts[i + 1])}`;
  }
  return d;
}

/** Point on a rotated ellipse at angle `t` (radians). */
function onEllipse(cx: number, cy: number, rx: number, ry: number, rot: number, t: number): P {
  const c = Math.cos(rot), s = Math.sin(rot);
  const x = rx * Math.cos(t), y = ry * Math.sin(t);
  return [cx + x * c - y * s, cy + x * s + y * c];
}

/** A rotated-ellipse arc from angle a0 to a1 (radians), as cubic segments. */
function ellipseArc(cx: number, cy: number, rx: number, ry: number, rotDeg: number, a0: number, a1: number, move = true): string {
  const rot = (rotDeg * Math.PI) / 180;
  const segs = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2)));
  const step = (a1 - a0) / segs;
  const k = (4 / 3) * Math.tan(step / 4);
  const c = Math.cos(rot), s = Math.sin(rot);
  const tan = (t: number): P => {
    const x = -rx * Math.sin(t), y = ry * Math.cos(t);
    return [x * c - y * s, x * s + y * c];
  };
  const p0 = onEllipse(cx, cy, rx, ry, rot, a0);
  let d = move ? `M ${pt(p0)}` : '';
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + i * step, t1 = t0 + step;
    const q0 = onEllipse(cx, cy, rx, ry, rot, t0), q1 = onEllipse(cx, cy, rx, ry, rot, t1);
    const v0 = tan(t0), v1 = tan(t1);
    d += ` C ${pt([q0[0] + k * v0[0], q0[1] + k * v0[1]])} ${pt([q1[0] - k * v1[0], q1[1] - k * v1[1]])} ${pt(q1)}`;
  }
  return d;
}

const TAU = Math.PI * 2;
const ellipse = (cx: number, cy: number, rx: number, ry: number, rotDeg = 0, start = -Math.PI / 2) =>
  ellipseArc(cx, cy, rx, ry, rotDeg, start, start + TAU) + ' Z';
const circle = (cx: number, cy: number, r: number, start = -Math.PI / 2) => ellipse(cx, cy, r, r, 0, start);

/** A rounded rectangle drawn clockwise from the middle of its top edge. */
function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = 0.5523 * r;
  const mx = x + w / 2;
  return [
    `M ${n(mx)} ${n(y)}`,
    `H ${n(x + w - r)}`,
    `C ${n(x + w - r + k)} ${n(y)} ${n(x + w)} ${n(y + r - k)} ${n(x + w)} ${n(y + r)}`,
    `V ${n(y + h - r)}`,
    `C ${n(x + w)} ${n(y + h - r + k)} ${n(x + w - r + k)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)}`,
    `H ${n(x + r)}`,
    `C ${n(x + r - k)} ${n(y + h)} ${n(x)} ${n(y + h - r + k)} ${n(x)} ${n(y + h - r)}`,
    `V ${n(y + r)}`,
    `C ${n(x)} ${n(y + r - k)} ${n(x + r - k)} ${n(y)} ${n(x + r)} ${n(y)}`,
    'Z',
  ].join(' ');
}

/** An orthogonal polyline with rounded corners. */
function elbow(pts: P[], r: number): string {
  let d = `M ${pt(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const p1: P = [b[0] - ((b[0] - a[0]) / l1) * rr, b[1] - ((b[1] - a[1]) / l1) * rr];
    const p2: P = [b[0] + ((c[0] - b[0]) / l2) * rr, b[1] + ((c[1] - b[1]) / l2) * rr];
    d += ` L ${pt(p1)} Q ${pt(b)} ${pt(p2)}`;
  }
  return d + ` L ${pt(pts[pts.length - 1])}`;
}

/** An open chevron arrowhead whose tip sits at `tip`, pointing along `dir`. */
function arrowHead(tip: P, dir: 'r' | 'l' | 'u' | 'd', s = 4.2): string {
  const v: Record<string, P> = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };
  const [ux, uy] = v[dir];
  const back: P = [tip[0] - ux * s, tip[1] - uy * s];
  const px = -uy * s * 0.8, py = ux * s * 0.8;
  return `M ${pt([back[0] + px, back[1] + py])} L ${pt(tip)} L ${pt([back[0] - px, back[1] - py])}`;
}

/** A dot drawn as a tiny stroked circle, so it inks in like everything else. */
const dot = (cx: number, cy: number) => circle(cx, cy, 0.9, Math.PI / 2);

/* ── 1. Signature ─────────────────────────────────────────────────────────── */

const SIG_BASE = 186;
const SIG_SLANT = 0.24;
/** Lifts the whole signature so it and its rule sit optically centred. */
const SIG_LIFT = 6;

/** Cubic segments (c1, c2, end) of a centripetal Catmull–Rom chain. */
type Seg = [P, P, P];
function crCubics(pts: P[]): Seg[] {
  const out: Seg[] = [];
  const ext = (p: P, q: P): P => [2 * p[0] - q[0], 2 * p[1] - q[1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i === 0 ? ext(pts[0], pts[1]) : pts[i - 1];
    const p1 = pts[i], p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : ext(pts[i + 1], pts[i]);
    const d1 = Math.sqrt(Math.max(1e-4, Math.hypot(p1[0] - p0[0], p1[1] - p0[1])));
    const d2 = Math.sqrt(Math.max(1e-4, Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
    const d3 = Math.sqrt(Math.max(1e-4, Math.hypot(p3[0] - p2[0], p3[1] - p2[1])));
    const b1: P = [0, 0], b2: P = [0, 0];
    for (let k = 0; k < 2; k++) {
      b1[k] = (d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2));
      b2[k] = (d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2));
    }
    out.push([b1, b2, p2]);
  }
  return out;
}
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** de Casteljau split of a cubic at t: returns the [p0..t] half as (c1, c2, end). */
function cubicHead(p0: P, c1: P, c2: P, p3: P, t: number): Seg {
  const a = lerp(p0, c1, t), b = lerp(c1, c2, t), c = lerp(c2, p3, t);
  const d = lerp(a, b, t), e = lerp(b, c, t);
  return [a, d, lerp(d, e, t)];
}

/**
 * "Ada Park" as one continuous pen stroke (the dash pattern restarts on every
 * sub-path, so a signature must never lift the pen). Written upright on a
 * baseline of 186, then sheared to a 0.24 slant.
 *
 * The P is a real stem-and-bowl: the pen runs along the baseline out of the
 * first word, climbs the stem, rounds the bowl back to the stem, retraces the
 * lower stem exactly (invisible) and leaves from the foot into "ark".
 */
const SIGNATURE = (() => {
  const segs: Seg[] = [];
  const chain = (pts: P[]) => segs.push(...crCubics(pts));
  const start: P = [24, 202];
  // A — lead-in and the rising left leg
  chain([start, [38, 196], [54, 171], [69, 132], [83, 94], [93, 68]]);
  // A — right leg down
  chain([[93, 68], [98, 110], [103, 150], [107, 186]]);
  // crossbar: back up and left, a small loop, then a long stroke into the d
  chain([[107, 186], [97, 167], [83, 153], [69, 146], [61, 147], [60, 152], [67, 155], [86, 153], [112, 148], [136, 146], [149, 150], [153, 156]]);
  // d — bowl, then up the ascender
  chain([[153, 156], [139, 153], [125, 162], [121, 177], [128, 186], [141, 184], [151, 172], [155, 156], [159, 124], [162, 96]]);
  // d — back down the stem and out
  chain([[162, 96], [159, 136], [156, 168], [158, 183], [166, 186], [177, 178], [186, 163], [196, 157]]);
  // a — bowl
  chain([[196, 157], [183, 154], [172, 163], [170, 178], [177, 186], [189, 182], [196, 168], [198, 156]]);
  // a — stem, then out along the baseline to the foot of the P
  chain([[198, 156], [198, 172], [201, 183], [209, 187], [222, 188.5], [236, 188]]);
  // P — stem, one cubic so its lower half can be retraced exactly
  const s0: P = [236, 188], c1: P = [237, 150], c2: P = [240, 100], s1: P = [244, 64];
  segs.push([c1, c2, s1]);
  const lower = cubicHead(s0, c1, c2, s1, 0.56);
  const j = lower[2];
  // P — bowl: over the top, round, and home to the stem at J
  segs.push([[245, 56], [255, 51], [270, 51]]);
  segs.push([[294, 51], [313, 62], [313, 82]]);
  segs.push([[313, 103], [292, 115], [267, 117]]);
  segs.push([[256, 118], [246, j[1] + 0.5], j]);
  // P — retrace the lower stem back to the foot
  segs.push([lower[1], lower[0], s0]);
  // foot → up into the a
  chain([s0, [248, 189], [262, 183], [276, 170], [286, 160], [292, 157]]);
  // a — bowl
  chain([[292, 157], [280, 154], [269, 163], [268, 178], [275, 186], [286, 182], [293, 168], [295, 156]]);
  // a — stem and up into the r
  chain([[295, 156], [295, 172], [298, 184], [306, 183], [312, 169], [315, 154]]);
  chain([[315, 154], [319, 160], [325, 160], [331, 156]]);
  // r — shoulder, down, then up into the k's loop and down its stem
  chain([[331, 156], [330, 171], [332, 186], [339, 182], [346, 164], [352, 136], [356, 108], [357, 94], [353, 89], [348, 96], [346, 122], [344, 156], [342, 186]]);
  // k — arm, kick, and the flourish home under the name
  chain([[342, 186], [345, 170], [356, 160], [365, 159], [366, 166], [356, 172], [349, 172], [358, 178], [367, 186], [378, 189], [384, 193], [380, 198], [364, 202], [324, 207], [256, 211], [186, 211], [122, 208], [80, 203], [58, 199]]);
  const sh = ([x, y]: P): P => [x + (SIG_BASE - y) * SIG_SLANT, y - SIG_LIFT];
  return `M ${pt(sh(start))}` + segs.map((s) => ` C ${pt(sh(s[0]))} ${pt(sh(s[1]))} ${pt(sh(s[2]))}`).join('');
})();

export function SignatureArt() {
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      <path className="uc-ink" d={SIGNATURE} />
      <path className="uc-h" d="M 40 246 H 360" />
      <text className="uc-t" x="40" y="264">ADA PARK</text>
      <text className="uc-t" x="360" y="264" textAnchor="end">31 · 10 · 2026</text>
    </svg>
  );
}

/* ── 2. Route map ─────────────────────────────────────────────────────────── */

const MAP_ROT = (-13 * Math.PI) / 180;
const mr = ([x, y]: P): P => {
  const c = Math.cos(MAP_ROT), s = Math.sin(MAP_ROT);
  const dx = x - 200, dy = y - 150;
  return [200 + dx * c - dy * s, 150 + dx * s + dy * c];
};
const AV = [18, 92, 166, 232, 304, 382];
const ST = [8, 74, 140, 204, 270];
const mapLine = (a: P, b: P) => `M ${pt(mr(a))} L ${pt(mr(b))}`;
const MAP_STREETS = [
  ...ST.map((y) => mapLine([-60, y], [460, y])),
  ...AV.map((x) => mapLine([x, -60], [x, 360])),
];
const MAP_DIAG = smooth(([[-40, 300], [120, 190], [250, 120], [440, 30]] as P[]).map(mr));
const riverA: P[] = [[-50, 196], [40, 176], [130, 196], [210, 172], [290, 120], [360, 112], [450, 128]];
const riverB: P[] = riverA.map(([x, y]) => [x + 4, y + 15] as P);
const RIVER_1 = smooth(riverA.map(mr));
const RIVER_2 = smooth(riverB.map(mr));
const RIVER_FILL =
  smooth(riverA.map(mr)) + ' L ' + pt(mr(riverB[riverB.length - 1])) +
  crSegments([...riverB].reverse().map(mr)) + ' Z';
const PARK_BOX = (() => {
  const x0 = AV[3] + 7, y0 = ST[1] + 7, x1 = AV[4] - 7, y1 = ST[2] - 7, r = 6;
  const pts: P[] = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  const q = pts.map(mr);
  const corner = (k: P) => pt(mr(k));
  return `M ${pt(q[0])} L ${pt(q[1])} Q ${corner([x1, y0])} ${pt(q[2])} L ${pt(q[3])} Q ${corner([x1, y1])} ${pt(q[4])} L ${pt(q[5])} Q ${corner([x0, y1])} ${pt(q[6])} L ${pt(q[7])} Q ${corner([x0, y0])} ${pt(q[0])} Z`;
})();
const PARK_PATH = smooth(([[AV[3] + 7, ST[1] + 50], [AV[3] + 26, ST[1] + 40], [AV[3] + 44, ST[1] + 22], [AV[4] - 7, ST[1] + 16]] as P[]).map(mr));
const PARK_POND = (() => {
  const c = mr([AV[3] + 50, ST[1] + 44]);
  return ellipse(c[0], c[1], 9, 5, -13);
})();
const PIN_R = 7;
const A_LOCAL: P = [AV[1], ST[3] + 40];
const B_LOCAL: P = [AV[4], ST[1] - 38];
// The route leaves pin A's ring and arrives at pin B's, so the pins need not
// hide it and every element can draw in story order.
const ROUTE_LOCAL: P[] = [[A_LOCAL[0], A_LOCAL[1] - PIN_R - 2.5], [AV[1], ST[2]], [AV[3], ST[2]], [AV[3], ST[1]], [AV[4], ST[1]], [B_LOCAL[0], B_LOCAL[1] + PIN_R + 2.5]];
const ROUTE = elbow(ROUTE_LOCAL.map(mr), 10);
const PIN_A = mr(A_LOCAL);
const PIN_B = mr(B_LOCAL);

/** y at which a Catmull–Rom chain crosses x (sampled finely; local map units). */
function yAtX(pts: P[], x: number): number {
  let p0 = pts[0], prev = pts[0];
  for (const [c1, c2, e] of crCubics(pts)) {
    for (let i = 1; i <= 96; i++) {
      const t = i / 96, u = 1 - t;
      const q: P = [
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1],
      ];
      if ((prev[0] - x) * (q[0] - x) <= 0 && q[0] !== prev[0]) return prev[1] + ((x - prev[0]) / (q[0] - prev[0])) * (q[1] - prev[1]);
      prev = q;
    }
    p0 = e;
  }
  return pts[0][1];
}

// Where the route crosses the river: a bridge, drawn the cartographer's way —
// two rails with splayed ends, the river broken beneath the deck.
const BRIDGE = (() => {
  const x = AV[1], w = 5.5, f = 2.6;
  const y0 = yAtX(riverA, x) - 3.5, y1 = yAtX(riverB, x) + 3.5;
  const rail = (sx: number) =>
    `M ${pt(mr([x + sx * (w + f), y0 - f]))} L ${pt(mr([x + sx * w, y0]))} L ${pt(mr([x + sx * w, y1]))} L ${pt(mr([x + sx * (w + f), y1 + f]))}`;
  const deck = [mr([x - w, y0]), mr([x + w, y0]), mr([x + w, y1]), mr([x - w, y1])];
  return { rails: `${rail(-1)} ${rail(1)}`, deck: `M ${deck.map(pt).join(' L ')} Z` };
})();

export function RouteArt() {
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <radialGradient id="uc-map-fade" cx="50%" cy="50%" r="50%">
          <stop offset="45%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id="uc-map-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="300">
          <path className="uc-x" d="M0 0H400V300H0Z" style={{ fill: 'url(#uc-map-fade)' }} />
        </mask>
      </defs>
      <g mask="url(#uc-map-mask)">
        {MAP_STREETS.map((d, i) => <path key={i} className="uc-h" d={d} />)}
        <path className="uc-h uc-h2" d={MAP_DIAG} />
        <path className="uc-x uc-occ" d={RIVER_FILL} />
        <path className="uc-s" d={RIVER_1} />
        <path className="uc-s" d={RIVER_2} />
        <path className="uc-x uc-occ" d={BRIDGE.deck} />
        <path className="uc-x uc-occ" d={PARK_BOX} />
        <path className="uc-s" d={PARK_BOX} />
        <path className="uc-h" d={PARK_PATH} />
        <path className="uc-h" d={PARK_POND} />
        <path className="uc-s" d={BRIDGE.rails} />
      </g>
      <path className="uc-x uc-occ" d={circle(PIN_A[0], PIN_A[1], PIN_R)} />
      <path className="uc-p" d={circle(PIN_A[0], PIN_A[1], PIN_R)} />
      <path className="uc-dot" d={dot(PIN_A[0], PIN_A[1])} />
      <path className="uc-a uc-route" d={ROUTE} />
      <path className="uc-x uc-occ" d={circle(PIN_B[0], PIN_B[1], PIN_R)} />
      <path className="uc-a uc-pin" d={circle(PIN_B[0], PIN_B[1], PIN_R)} />
      <path className="uc-dot uc-dot-a" d={dot(PIN_B[0], PIN_B[1])} />
      <text className="uc-t" x={n(PIN_A[0] + 13)} y={n(PIN_A[1] + 3)}>A</text>
      <text className="uc-t uc-t-a" x={n(PIN_B[0] + 13)} y={n(PIN_B[1] + 3)}>B · 14 MIN</text>
      <path className="uc-h" d="M 300 276 H 366 M 300 273 V 279 M 333 274.5 V 277.5 M 366 273 V 279" />
      <text className="uc-t" x="300" y="268">0</text>
      <text className="uc-t" x="366" y="268" textAnchor="end">400 M</text>
    </svg>
  );
}

/* ── 3. Chart ─────────────────────────────────────────────────────────────── */

const CH = { x0: 52, x1: 372, y0: 62, y1: 238 };
// Last year (ink) against this year (accent): this year starts behind,
// crosses in early summer and finishes well ahead.
const SERIES_A = [35, 37, 40, 39, 42, 46, 47, 48, 51, 53, 55, 58];
const SERIES_B = [18, 20, 25, 26, 31, 39, 46, 52, 59, 66, 74, 83];
const YOY = Math.round((SERIES_B[SERIES_B.length - 1] / SERIES_A[SERIES_A.length - 1] - 1) * 100);
const cx = (i: number) => CH.x0 + ((CH.x1 - CH.x0) * i) / (SERIES_A.length - 1);
const cy = (v: number) => CH.y1 - ((CH.y1 - CH.y0) * v) / 100;
const END_A: P = [cx(SERIES_A.length - 1), cy(SERIES_A[SERIES_A.length - 1])];
const END_B: P = [cx(SERIES_B.length - 1), cy(SERIES_B[SERIES_B.length - 1])];
const RING_A = 2.8, RING_B = 3.4;
/**
 * A series that ends by circling its last value: the stroke reaches the end
 * point, steps out to the ring and goes once round it. One sub-path, so the
 * ring inks in exactly as the line arrives — in any stagger, at any scroll
 * speed. A static occluder above hides the short step inside the ring.
 */
const seriesPath = (vals: number[], end: P, r: number) =>
  monotone(vals.map((v, i) => [cx(i), cy(v)] as P)) +
  ` L ${pt([end[0] + r, end[1]])}` +
  ellipseArc(end[0], end[1], r, r, 0, 0, TAU, false);
const LINE_A = seriesPath(SERIES_A, END_A, RING_A);
const LINE_B = seriesPath(SERIES_B, END_B, RING_B);
const GRID = [25, 50, 75, 100];
const MONTHS = ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV'];

export function ChartArt() {
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      {GRID.map((v) => <path key={v} className="uc-h uc-h2" d={`M ${CH.x0} ${n(cy(v))} H ${CH.x1}`} />)}
      <path className="uc-h" d={`M ${CH.x0} ${CH.y1} H ${CH.x1}`} />
      <path className="uc-s" d={LINE_A} />
      <path className="uc-a" d={LINE_B} />
      <path className="uc-x uc-occ" d={circle(END_A[0], END_A[1], RING_A - 0.7)} />
      <path className="uc-x uc-occ" d={circle(END_B[0], END_B[1], RING_B - 1)} />
      {[0, ...GRID].map((v) => (
        <text key={v} className="uc-t" x={CH.x0 - 10} y={n(cy(v) + 3)} textAnchor="end">{v}</text>
      ))}
      {MONTHS.map((m, i) => (
        <text key={m} className="uc-t" x={n(cx(i * 2))} y={CH.y1 + 18} textAnchor="middle">{m}</text>
      ))}
      <path className="uc-s uc-key" d={`M ${CH.x0} 31 H ${CH.x0 + 12}`} />
      <text className="uc-t" x={CH.x0 + 19} y="34">2025</text>
      <path className="uc-a uc-key" d={`M ${CH.x0 + 66} 31 H ${CH.x0 + 78}`} />
      <text className="uc-t uc-t-a" x={CH.x0 + 85} y="34">2026</text>
      <text className="uc-t uc-t-a uc-t-b uc-late" x={CH.x1} y="34" textAnchor="end">{`+${YOY}% YOY`}</text>
    </svg>
  );
}

/* ── 4. Headphones ────────────────────────────────────────────────────────── */

type Disc = { c: P; rx: number; ry: number; rot: number };
const disc = (c: P, rx: number, ry: number, rot: number): Disc => ({ c, rx, ry, rot });
const shift = (d: Disc, v: P, grow = 0): Disc => ({ ...d, c: [d.c[0] + v[0], d.c[1] + v[1]], rx: d.rx + grow * 0.7, ry: d.ry + grow });

/**
 * The silhouette of a short cylinder: the disc `d` pushed back by `v`.
 * Back half of the rear disc, two tangent walls, front half of the front disc.
 */
function cylinder(d: Disc, v: P): string {
  const rot = (d.rot * Math.PI) / 180;
  const c = Math.cos(-rot), s = Math.sin(-rot);
  const lx = v[0] * c - v[1] * s, ly = v[0] * s + v[1] * c;
  const t1 = Math.atan2(-d.ry * lx, d.rx * ly);
  const back = shift(d, v);
  const mid = (t: number) => onEllipse(0, 0, d.rx, d.ry, rot, t);
  const m = mid(t1 + Math.PI / 2);
  const away = m[0] * v[0] + m[1] * v[1] > 0; // does the +90° side face the back?
  const [a0, a1] = away ? [t1, t1 + Math.PI] : [t1 + Math.PI, t1 + 2 * Math.PI];
  return (
    ellipseArc(back.c[0], back.c[1], back.rx, back.ry, d.rot, a0, a1) +
    ' L ' + pt(onEllipse(d.c[0], d.c[1], d.rx, d.ry, rot, a1)) +
    ellipseArc(d.c[0], d.c[1], d.rx, d.ry, d.rot, a1, a0 + 2 * Math.PI, false) +
    ' Z'
  );
}
const discPath = (d: Disc, start = -Math.PI / 2) => ellipse(d.c[0], d.c[1], d.rx, d.ry, d.rot, start);

/** A curved band between two concentric elliptical arcs, with round ends. */
function band(c: P, rx: number, ry: number, rot: number, w: number, a0: number, a1: number): string {
  const o = ellipseArc(c[0], c[1], rx + w / 2, ry + w / 2, rot, a0, a1);
  const i = ellipseArc(c[0], c[1], rx - w / 2, ry - w / 2, rot, a1, a0, false);
  const r = (rot * Math.PI) / 180;
  const pI1 = onEllipse(c[0], c[1], rx - w / 2, ry - w / 2, r, a1);
  const pO0 = onEllipse(c[0], c[1], rx + w / 2, ry + w / 2, r, a0);
  return `${o} A ${n(w / 2)} ${n(w / 2)} 0 0 1 ${pt(pI1)}${i} A ${n(w / 2)} ${n(w / 2)} 0 0 1 ${pt(pO0)} Z`;
}

const HP = (() => {
  // Near cup (right): outer face toward us. Layers step back along -X.
  const nFace = disc([288, 194], 35, 54, -4);
  const nWall: P = [-11, -1.2];
  const nShellBack = shift(nFace, nWall);
  const nCushFront = shift(nShellBack, [0, 0], 4);
  const nCushV: P = [-15, -1.6];
  // Far cup (left): we look into its cushion. Layers step back along -X.
  const fFace = disc([124, 178], 27, 45, 6);
  const fCushV: P = [-11, -1];
  const fShellFront = shift(fFace, fCushV, -3);
  const fShellV: P = [-9, -0.8];

  const rN = (nFace.rot * Math.PI) / 180;
  const yokeC: P = [nFace.c[0] - 9, nFace.c[1] - 1];
  const yokeRx = nFace.rx + 13, yokeRy = nFace.ry + 12;
  const pivN1 = onEllipse(yokeC[0], yokeC[1], yokeRx, yokeRy, rN, Math.PI * 1.02);
  const pivN2 = onEllipse(yokeC[0], yokeC[1], yokeRx, yokeRy, rN, -0.02);
  const yokeNTop = onEllipse(yokeC[0], yokeC[1], yokeRx, yokeRy, rN, -Math.PI / 2);

  const rF = (fFace.rot * Math.PI) / 180;
  const yokeFC: P = [fFace.c[0] - 11, fFace.c[1] - 1];
  const yokeFRx = fFace.rx + 11, yokeFRy = fFace.ry + 10;
  const pivF1 = onEllipse(yokeFC[0], yokeFC[1], yokeFRx, yokeFRy, rF, Math.PI * 1.02);
  const pivF2 = onEllipse(yokeFC[0], yokeFC[1], yokeFRx, yokeFRy, rF, -0.02);
  const yokeFTop = onEllipse(yokeFC[0], yokeFC[1], yokeFRx, yokeFRy, rF, -Math.PI / 2);

  // Sliders rise from each yoke into the band.
  const nS0: P = [yokeNTop[0], yokeNTop[1] - 3], nS1: P = [yokeNTop[0] - 1.5, yokeNTop[1] - 24];
  const fS0: P = [yokeFTop[0], yokeFTop[1] - 3], fS1: P = [yokeFTop[0] + 1.5, yokeFTop[1] - 22];
  const rail = (a: P, b: P, dx: number) => `M ${pt([a[0] - dx, a[1]])} L ${pt([b[0] - dx, b[1]])} M ${pt([a[0] + dx, a[1]])} L ${pt([b[0] + dx, b[1]])}`;

  // Headband: outer edge, inner edge and the cushion seam beneath.
  const f0 = fS1, n0 = nS1;
  const bandOuter = smooth([[f0[0] - 6, f0[1] + 2], [f0[0] - 4, f0[1] - 34], [f0[0] + 30, f0[1] - 66], [200, n0[1] - 76], [n0[0] - 26, n0[1] - 62], [n0[0] + 6, n0[1] - 30], [n0[0] + 7, n0[1] + 2]]);
  const bandInner = smooth([[f0[0] + 6, f0[1] + 2], [f0[0] + 8, f0[1] - 28], [f0[0] + 38, f0[1] - 56], [200, n0[1] - 64], [n0[0] - 32, n0[1] - 52], [n0[0] - 6, n0[1] - 26], [n0[0] - 6, n0[1] + 2]]);
  const bandPad = smooth([[f0[0] + 9, f0[1] - 26], [f0[0] + 20, f0[1] - 42], [f0[0] + 46, f0[1] - 52], [200, n0[1] - 57], [n0[0] - 38, n0[1] - 46], [n0[0] - 18, n0[1] - 32], [n0[0] - 7, n0[1] - 22]]);
  const capN = roundRect(n0[0] - 8, n0[1] - 2, 16, 9, 2.5);
  const capF = roundRect(f0[0] - 7, f0[1] - 2, 14, 8, 2.5);

  return {
    // near
    nCush: cylinder(nCushFront, nCushV),
    nCushSeam: ellipseArc(nCushFront.c[0] + nCushV[0] / 2, nCushFront.c[1] + nCushV[1] / 2, nCushFront.rx, nCushFront.ry, nFace.rot, Math.PI * 0.62, Math.PI * 1.38),
    nShell: cylinder(nFace, nWall),
    nFace: discPath(nFace),
    nPlate: ellipse(nFace.c[0] + 1.5, nFace.c[1], nFace.rx - 9, nFace.ry - 11, nFace.rot, Math.PI / 2),
    nLed: dot(...onEllipse(nFace.c[0] + 1.5, nFace.c[1], nFace.rx - 9, nFace.ry - 11, rN, Math.PI * 0.32)),
    nYoke: band(yokeC, yokeRx, yokeRy, nFace.rot, 6, Math.PI * 1.02, Math.PI * 1.98),
    nPiv1: circle(pivN1[0], pivN1[1], 4.6), nPiv2: circle(pivN2[0], pivN2[1], 4.6),
    nPivDot1: dot(pivN1[0], pivN1[1]), nPivDot2: dot(pivN2[0], pivN2[1]),
    nRail: rail(nS0, nS1, 3.2),
    capN,
    // far
    fShell: cylinder(fShellFront, fShellV),
    fCush: cylinder(fFace, fCushV),
    fFace: discPath(fFace, Math.PI / 2),
    fHole: ellipse(fFace.c[0] + 3, fFace.c[1] + 1, fFace.rx - 11, fFace.ry - 15, fFace.rot, Math.PI / 2),
    fYoke: band(yokeFC, yokeFRx, yokeFRy, fFace.rot, 5, Math.PI * 1.02, Math.PI * 1.98),
    fPiv1: circle(pivF1[0], pivF1[1], 3.8), fPiv2: circle(pivF2[0], pivF2[1], 3.8),
    fRail: rail(fS0, fS1, 2.8),
    capF,
    // band
    bandOuter, bandInner, bandPad,
    // construction: the hinge axis through both cups
    axis: `M ${pt([fFace.c[0] - 70, fFace.c[1] - 9])} L ${pt([nFace.c[0] + 62, nFace.c[1] + 8])}`,
    vert: `M ${n(nFace.c[0])} ${n(nFace.c[1] - nFace.ry - 22)} V ${n(nFace.c[1] + nFace.ry + 22)}`,
  };
})();

export function SketchArt() {
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      <g transform="matrix(1.14 0 0 1.14 -29.4 -19.6)">
      <path className="uc-h uc-h2" d={HP.axis} />
      <path className="uc-h uc-h2" d={HP.vert} />
      {/* headband */}
      <path className="uc-p" d={HP.bandOuter} />
      <path className="uc-s" d={HP.bandInner} />
      <path className="uc-h" d={HP.bandPad} />
      {/* far side */}
      <path className="uc-s" d={HP.fRail} />
      <path className="uc-x uc-occ" d={HP.capF} />
      <path className="uc-s" d={HP.capF} />
      <path className="uc-x uc-occ" d={HP.fYoke} />
      <path className="uc-s" d={HP.fYoke} />
      <path className="uc-x uc-occ" d={HP.fShell} />
      <path className="uc-s" d={HP.fShell} />
      <path className="uc-x uc-occ" d={HP.fCush} />
      <path className="uc-p" d={HP.fCush} />
      <path className="uc-s" d={HP.fFace} />
      <path className="uc-h" d={HP.fHole} />
      <path className="uc-x uc-occ" d={HP.fPiv1} />
      <path className="uc-s" d={HP.fPiv1} />
      <path className="uc-x uc-occ" d={HP.fPiv2} />
      <path className="uc-s" d={HP.fPiv2} />
      {/* near side */}
      <path className="uc-s" d={HP.nRail} />
      <path className="uc-x uc-occ" d={HP.capN} />
      <path className="uc-s" d={HP.capN} />
      <path className="uc-x uc-occ" d={HP.nYoke} />
      <path className="uc-s" d={HP.nYoke} />
      <path className="uc-x uc-occ" d={HP.nCush} />
      <path className="uc-p" d={HP.nCush} />
      <path className="uc-h" d={HP.nCushSeam} />
      <path className="uc-x uc-occ" d={HP.nShell} />
      <path className="uc-p" d={HP.nShell} />
      <path className="uc-s" d={HP.nFace} />
      <path className="uc-h" d={HP.nPlate} />
      <path className="uc-x uc-occ" d={HP.nPiv1} />
      <path className="uc-s" d={HP.nPiv1} />
      <path className="uc-x uc-occ" d={HP.nPiv2} />
      <path className="uc-s" d={HP.nPiv2} />
      <path className="uc-dot uc-dot-s" d={HP.nPivDot1} />
      <path className="uc-dot uc-dot-s" d={HP.nPivDot2} />
      <path className="uc-dot uc-dot-a uc-late" d={HP.nLed} />
      </g>
    </svg>
  );
}

/* ── 5. Logo ──────────────────────────────────────────────────────────────── */

const LG = { cx: 200, cy: 116, R: 66, r: 22, t: 15 };
const LOGO = (() => {
  const { cx: x, cy: y, r, t } = LG;
  const up: P = [x, y - r];
  const lo: P = [x, y + r];
  const ro = r + t / 2, ri = r - t / 2;
  const deg = (d: number) => (d * Math.PI) / 180;
  // Upper arc runs from -30° the long way round to 90° (counter-clockwise on screen).
  const u0 = deg(-34), u1 = deg(-270);
  const l0 = deg(-90), l1 = deg(146);
  // S ribbon outline: outer edge of the upper arc, inner edge of the lower arc… as one closed contour.
  const A = (c: P, rad: number, a: number): P => [c[0] + rad * Math.cos(a), c[1] + rad * Math.sin(a)];
  const arc = (c: P, rad: number, a0: number, a1: number) => ellipseArc(c[0], c[1], rad, rad, 0, a0, a1, false);
  const s =
    `M ${pt(A(up, ro, u0))}` +
    arc(up, ro, u0, u1) +
    arc(lo, ri, l0, l1) +
    ` L ${pt(A(lo, ro, l1))}` +
    arc(lo, ro, l1, l0) +
    arc(up, ri, u1, u0) +
    ' Z';
  const ring = circle(x, y, LG.R, -Math.PI / 2);
  const ringInner = circle(x, y, LG.R - 7, Math.PI / 2);
  const guideUp = circle(up[0], up[1], r, Math.PI);
  const guideLo = circle(lo[0], lo[1], r, 0);
  const cross = `M ${x - LG.R - 16} ${y} H ${x + LG.R + 16} M ${x} ${y - LG.R - 16} V ${y + LG.R + 16}`;
  const b = LG.R + 14, k = 9;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    .map(([sx, sy]) => `M ${x + sx * b} ${y + sy * (b - k)} V ${y + sy * b} H ${x + sx * (b - k)}`)
    .join(' ');
  return { s, ring, ringInner, guideUp, guideLo, cross, corners };
})();

// Monoline geometric "STUDIO": cap height 18, laid out from a centre line.
const WORD = (() => {
  const h = 18, y0 = 236, y1 = y0 - h, gap = 13;
  const widths = [13, 14, 14, 14, 0, 18];
  const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
  let x = 200 - total / 2;
  const out: string[] = [];
  const r = h / 4;
  // S
  {
    const w = widths[0], cx0 = x + w / 2;
    out.push(
      `M ${n(x + w)} ${n(y1 + 2.5)} C ${n(x + w - 2)} ${n(y1)} ${n(x + 2)} ${n(y1 - 0.5)} ${n(x + 0.5)} ${n(y1 + r)} ` +
      `C ${n(x - 1)} ${n(y1 + 2 * r)} ${n(cx0)} ${n(y1 + 2 * r)} ${n(x + w - 0.5)} ${n(y1 + 2 * r + 2.5)} ` +
      `C ${n(x + w + 1.2)} ${n(y0 - 2)} ${n(x + w - 2)} ${n(y0 + 0.5)} ${n(cx0)} ${n(y0)} ` +
      `C ${n(x + 3)} ${n(y0)} ${n(x + 0.5)} ${n(y0 - 1)} ${n(x)} ${n(y0 - 3)}`,
    );
    x += w + gap;
  }
  // T
  { const w = widths[1]; out.push(`M ${n(x)} ${y1} H ${n(x + w)} M ${n(x + w / 2)} ${y1} V ${y0}`); x += w + gap; }
  // U
  { const w = widths[2]; out.push(`M ${n(x)} ${y1} V ${n(y0 - w / 2)} A ${n(w / 2)} ${n(w / 2)} 0 0 0 ${n(x + w)} ${n(y0 - w / 2)} V ${y1}`); x += w + gap; }
  // D
  { const w = widths[3]; out.push(`M ${n(x)} ${y1} V ${y0} H ${n(x + w - 9)} A 9 9 0 0 0 ${n(x + w)} ${n(y0 - 9)} A 9 9 0 0 0 ${n(x + w - 9)} ${y1} Z`); x += w + gap; }
  // I
  { out.push(`M ${n(x)} ${y1} V ${y0}`); x += gap; }
  // O
  { const w = widths[5]; out.push(circle(x + w / 2, y0 - h / 2, h / 2)); }
  return out;
})();

export function LogoArt() {
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      <path className="uc-h uc-h2" d={LOGO.cross} />
      <path className="uc-h" d={LOGO.corners} />
      <path className="uc-h uc-h2" d={LOGO.guideUp} />
      <path className="uc-h uc-h2" d={LOGO.guideLo} />
      <path className="uc-p" d={LOGO.ring} />
      <path className="uc-h" d={LOGO.ringInner} />
      <path className="uc-a uc-logo-s" d={LOGO.s} />
      {WORD.map((d, i) => <path key={i} className="uc-p uc-word" d={d} />)}
    </svg>
  );
}

/* ── 6. Diagram ───────────────────────────────────────────────────────────── */

const BW = 78, BH = 32;
const BOX = {
  client: { x: 20, y: 120, label: 'client' },
  edge: { x: 160, y: 48, label: 'edge' },
  auth: { x: 160, y: 192, label: 'auth' },
  api: { x: 300, y: 120, label: 'api' },
  db: { x: 300, y: 222, label: 'db' },
} as const;
type BoxKey = keyof typeof BOX;
const right = (k: BoxKey): P => [BOX[k].x + BW, BOX[k].y + BH / 2];
const left = (k: BoxKey): P => [BOX[k].x, BOX[k].y + BH / 2];
const topOf = (k: BoxKey): P => [BOX[k].x + BW / 2, BOX[k].y];
const bottom = (k: BoxKey): P => [BOX[k].x + BW / 2, BOX[k].y + BH];
const GAP = 3;
const FLOW = (() => {
  const c = right('client'), mid = (c[0] + BOX.edge.x) / 2;
  const e = left('edge'), a = left('auth');
  const er = right('edge'), ar = right('auth'), mid2 = (er[0] + BOX.api.x) / 2;
  const al = left('api');
  const ab = bottom('api'), dt = topOf('db');
  return {
    toEdge: elbow([c, [mid, c[1]], [mid, e[1]], [e[0] - GAP, e[1]]], 8),
    toAuth: elbow([[mid, c[1]], [mid, a[1]], [a[0] - GAP, a[1]]], 8),
    edgeApi: elbow([er, [mid2, er[1]], [mid2, al[1] - 5], [al[0] - GAP, al[1] - 5]], 8),
    authApi: elbow([ar, [mid2 + 0.01, ar[1]], [mid2 + 0.01, al[1] + 5], [al[0] - GAP, al[1] + 5]], 8),
    apiDb: `M ${pt(ab)} L ${pt([dt[0], dt[1] - GAP])}`,
    hEdge: arrowHead([e[0] - GAP, e[1]], 'r'),
    hAuth: arrowHead([a[0] - GAP, a[1]], 'r'),
    hApi1: arrowHead([al[0] - GAP, al[1] - 5], 'r'),
    hApi2: arrowHead([al[0] - GAP, al[1] + 5], 'r'),
    hDb: arrowHead([dt[0], dt[1] - GAP], 'd'),
    port: dot(mid, c[1]),
  };
})();

export function FlowArt() {
  const keys = Object.keys(BOX) as BoxKey[];
  return (
    <svg className="uc-svg" viewBox="0 0 400 300" aria-hidden="true">
      {keys.map((k) => (
        <path key={k} className={k === 'auth' ? 'uc-h uc-box-dim' : 'uc-s'} d={roundRect(BOX[k].x, BOX[k].y, BW, BH, 7)} />
      ))}
      <path className="uc-h" d={FLOW.toAuth} />
      <path className="uc-h" d={FLOW.hAuth} />
      <path className="uc-h" d={FLOW.authApi} />
      <path className="uc-h" d={FLOW.hApi2} />
      <path className="uc-a uc-flow" d={FLOW.toEdge} />
      <path className="uc-a uc-flow" d={FLOW.hEdge} />
      <path className="uc-a uc-flow" d={FLOW.edgeApi} />
      <path className="uc-a uc-flow" d={FLOW.hApi1} />
      <path className="uc-a uc-flow" d={FLOW.apiDb} />
      <path className="uc-a uc-flow" d={FLOW.hDb} />
      <path className="uc-dot uc-dot-a" d={FLOW.port} />
      {keys.map((k) => (
        <text key={k} className={k === 'auth' ? 'uc-t uc-t-box uc-t-dim' : 'uc-t uc-t-box'} x={n(BOX[k].x + BW / 2)} y={n(BOX[k].y + BH / 2 + 3.2)} textAnchor="middle">
          {BOX[k].label}
        </text>
      ))}
    </svg>
  );
}
