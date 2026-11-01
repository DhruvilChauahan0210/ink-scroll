import { smooth, type P } from '@/components/examples/ink/geo';

/*
 * Stride's run geometry: Sunday's 21.1 km loop through Monsanto, in a
 * 600 × 400 map, and its elevation every half kilometre. The route is a
 * closed uniform Catmull–Rom so the km markers can sit exactly on it.
 */

export const MW = 600;
export const MH = 400;
const f = (v: number) => v.toFixed(1);

type Bez = [P, P, P, P];

function closedBeziers(pts: P[]): Bez[] {
  const n = pts.length;
  const out: Bez[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return out;
}
const at = ([a, b, c, d]: Bez, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};

const LOOP: P[] = [
  [132, 318], [146, 290], [172, 268], [190, 236], [206, 204], [238, 182], [262, 160], [284, 134],
  [318, 112], [356, 94], [402, 88], [444, 102], [474, 130], [492, 168], [486, 206], [466, 238],
  [432, 256], [396, 262], [366, 280], [330, 294], [294, 286], [262, 298], [232, 318], [196, 334], [158, 336],
];
const BEZ = closedBeziers(LOOP);

export const ROUTE = BEZ.reduce((d, b) => `${d} C ${f(b[1][0])} ${f(b[1][1])} ${f(b[2][0])} ${f(b[2][1])} ${f(b[3][0])} ${f(b[3][1])}`, `M ${f(LOOP[0][0])} ${f(LOOP[0][1])}`);
export const START = LOOP[0];

/** Dense samples along the loop with running length, for the km markers. */
const SAMPLES = (() => {
  const s: { p: P; l: number }[] = [{ p: LOOP[0], l: 0 }];
  for (const b of BEZ) {
    for (let k = 1; k <= 24; k++) {
      const p = at(b, k / 24), q = s[s.length - 1];
      s.push({ p, l: q.l + Math.hypot(p[0] - q.p[0], p[1] - q.p[1]) });
    }
  }
  return s;
})();
const TOTAL = SAMPLES[SAMPLES.length - 1].l;
export const KM_MARKS = [5, 10, 15, 20].map((km) => {
  const want = (km / 21.1) * TOTAL;
  const hit = SAMPLES.find((x) => x.l >= want) ?? SAMPLES[SAMPLES.length - 1];
  return { km, p: hit.p };
});

/* The map behind it: Monsanto forest, trails, roads, the river and the city edge. */
export const PARK = smooth([[40, 70], [120, 40], [240, 36], [360, 40], [470, 60], [536, 110], [546, 200], [520, 268], [440, 300], [340, 322], [240, 340], [150, 352], [70, 330], [30, 250], [24, 150], [40, 70]] as P[]) + ' Z';
export const RIVER = `${smooth([[-10, 372], [100, 366], [220, 374], [340, 366], [460, 376], [610, 368]] as P[])} L 610 410 L -10 410 Z`;
export const ROADS_MAJOR = [
  smooth([[-10, 214], [60, 200], [130, 176], [180, 128], [214, 70], [236, -10]] as P[]),
  smooth([[560, -10], [556, 120], [548, 240], [560, 360]] as P[]),
  smooth([[-10, 356], [120, 352], [260, 358], [400, 352], [610, 356]] as P[]),
];
export const ROADS_MINOR = [
  smooth([[300, -10], [318, 40], [352, 70], [404, 70], [470, 40], [520, 0]] as P[]),
  smooth([[440, 300], [470, 330], [520, 344], [610, 330]] as P[]),
  smooth([[20, 300], [70, 280], [110, 300], [140, 340]] as P[]),
];
export const TRAILS = [
  smooth([[90, 120], [150, 150], [200, 130], [260, 100], [320, 80]] as P[]),
  smooth([[110, 250], [160, 220], [240, 240], [300, 220], [360, 200], [420, 210]] as P[]),
  smooth([[330, 160], [380, 150], [420, 170], [440, 210]] as P[]),
  smooth([[60, 180], [100, 200], [120, 240], [100, 290]] as P[]),
  smooth([[250, 280], [280, 240], [300, 190], [330, 160]] as P[]),
];
export const CITY = (() => {
  let d = '';
  for (let y = 4; y < 360; y += 22) {
    for (let x = 562; x < 600; x += 20) d += `M${x} ${y}h14v16h-14z`;
  }
  for (let x = 4; x < 560; x += 24) {
    const y0 = 340 + Math.round(Math.sin(x / 40) * 3);
    if (x > 120 && x < 520) d += `M${x} ${y0 + 2}h18v8h-18z`;
  }
  return d;
})();

/* Elevation every 0.5 km, 0 → 21 km (metres). */
export const ELEV = [14, 22, 38, 61, 84, 108, 126, 142, 158, 171, 186, 198, 205, 196, 182, 174, 181, 194, 203, 197, 184, 171, 162, 168, 177, 170, 156, 141, 128, 118, 104, 96, 88, 74, 61, 52, 43, 36, 28, 22, 18, 15, 14];
/** The profile drawn at a given size; uniform scaling keeps the dash honest. */
function profile(w: number, h: number, left: number) {
  const x = (i: number) => left + (i * (w - left)) / (ELEV.length - 1);
  const y = (v: number) => h - 6 - (v / 230) * (h - 16);
  const d = smooth(ELEV.map((v, i) => [x(i), y(v)] as P));
  return { w, h, left, d, area: `${d} L ${w} ${h} L ${left} ${h} Z`, grid: [0, 100, 200].map((m) => ({ m, y: y(m) })) };
}
export const PROFILE_WIDE = profile(860, 140, 44);
export const PROFILE_NARROW = profile(340, 140, 40);

/* Pace per km, in seconds, for the splits strip under the profile. */
export const SPLITS = [331, 342, 358, 352, 347, 339, 312, 321, 329, 315, 308, 318, 304, 299, 301, 297, 295, 298, 293, 291, 289];
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* A small route for the social feed: Belém to Cais do Sodré along the river. */
export const FEED_ROUTE = smooth([[14, 70], [50, 64], [90, 70], [130, 60], [170, 64], [210, 52], [246, 44], [286, 30]] as P[]);
export const FEED_RIVER = `${smooth([[-4, 86], [80, 82], [160, 80], [240, 66], [304, 56]] as P[])} L 304 104 L -4 104 Z`;
