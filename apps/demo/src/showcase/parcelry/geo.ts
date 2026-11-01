import { smooth, type P } from '@/components/examples/ink/geo';

/*
 * Parcelry's map geometry: a stylised central Lisbon in a 640 × 480 box,
 * north up. City blocks are generated district by district from a rotated
 * grid with a seeded jitter, so server and client render the same markup.
 */

export const W = 640;
export const H = 480;

const f = (v: number) => v.toFixed(1);

/** The north bank of the Tejo: y of the waterline at x. */
export const shore = (x: number) => 428 - x * 0.046 - 7 * Math.sin(x / 70);

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function inside(p: P, poly: P[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export const PARKS: { name: string; pts: P[] }[] = [
  { name: 'estrela', pts: [[30, 192], [98, 184], [106, 246], [38, 258]] },
  { name: 'principe', pts: [[146, 92], [186, 86], [192, 116], [152, 122]] },
  { name: 'martires', pts: [[322, 46], [366, 42], [370, 104], [326, 110]] },
  { name: 'castelo', pts: [[396, 238], [428, 214], [474, 220], [486, 248], [452, 270], [404, 266]] },
  { name: 'graca', pts: [[506, 162], [532, 156], [536, 176], [510, 182]] },
];

type District = {
  o: P; rot: number; bw: number; bh: number; g: number;
  cols: number; rows: number; mask: P[]; seed: number; jitter?: number;
};

const DISTRICTS: District[] = [
  // Baixa — the Pombaline grid, square to the river
  { o: [270, 190], rot: 0, bw: 20, bh: 22, g: 6, cols: 4, rows: 6, mask: [[260, 180], [380, 180], [380, 356], [260, 356]], seed: 3 },
  // Chiado and Bairro Alto
  { o: [118, 150], rot: -8, bw: 17, bh: 13, g: 5, cols: 8, rows: 14, mask: [[116, 148], [262, 150], [262, 362], [232, 400], [116, 414]], seed: 11, jitter: 0.25 },
  // Estrela and Lapa
  { o: [-6, 130], rot: -16, bw: 22, bh: 17, g: 6, cols: 6, rows: 16, mask: [[-10, 120], [110, 120], [110, 440], [-10, 450]], seed: 19, jitter: 0.2 },
  // Príncipe Real and Rato, west of the Avenida
  { o: [56, -6], rot: -22, bw: 20, bh: 15, g: 6, cols: 9, rows: 8, mask: [[50, -4], [222, -4], [282, 146], [112, 148], [50, 116]], seed: 23, jitter: 0.2 },
  // Santana, east of the Avenida
  { o: [246, -10], rot: -20, bw: 18, bh: 14, g: 6, cols: 7, rows: 9, mask: [[240, -4], [372, -4], [372, 150], [306, 150]], seed: 29, jitter: 0.2 },
  // Mouraria
  { o: [376, 140], rot: 12, bw: 14, bh: 11, g: 5, cols: 6, rows: 8, mask: [[380, 150], [444, 122], [454, 214], [398, 236], [380, 214]], seed: 31, jitter: 0.45 },
  // Alfama
  { o: [372, 242], rot: -6, bw: 13, bh: 10, g: 4.5, cols: 14, rows: 12, mask: [[376, 262], [420, 250], [480, 238], [560, 250], [560, 400], [376, 410]], seed: 37, jitter: 0.5 },
  // Graça
  { o: [452, 24], rot: 18, bw: 22, bh: 16, g: 6, cols: 9, rows: 10, mask: [[448, 102], [470, 34], [646, 34], [646, 240], [560, 250], [474, 236]], seed: 41, jitter: 0.2 },
  // Anjos and Arroios
  { o: [372, -4], rot: 3, bw: 26, bh: 18, g: 7, cols: 11, rows: 3, mask: [[372, -4], [646, -4], [646, 36], [470, 36], [446, 100], [372, 140]], seed: 43, jitter: 0.15 },
  // São Vicente down to Santa Apolónia
  { o: [560, 236], rot: -10, bw: 18, bh: 14, g: 5, cols: 5, rows: 10, mask: [[556, 246], [646, 236], [646, 400], [556, 404]], seed: 47, jitter: 0.25 },
];

function districtBlocks(d: District) {
  const r = (d.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const at = (x: number, y: number): P => [d.o[0] + x * c - y * s, d.o[1] + x * s + y * c];
  const rnd = rand(d.seed);
  const j = d.jitter ?? 0;
  let out = '';
  for (let row = 0; row < d.rows; row++) {
    for (let col = 0; col < d.cols; col++) {
      const x0 = col * (d.bw + d.g), y0 = row * (d.bh + d.g);
      const w = d.bw * (1 - j * 0.5 * rnd()), h = d.bh * (1 - j * 0.5 * rnd());
      const dx = j * 3 * (rnd() - 0.5), dy = j * 3 * (rnd() - 0.5);
      const corners = [at(x0 + dx, y0 + dy), at(x0 + dx + w, y0 + dy), at(x0 + dx + w, y0 + dy + h), at(x0 + dx, y0 + dy + h)];
      const mid = at(x0 + w / 2, y0 + h / 2);
      if (!inside(mid, d.mask)) continue;
      if (corners.some((p) => p[1] > shore(p[0]) - 16)) continue;
      if (PARKS.some((pk) => inside(mid, pk.pts))) continue;
      if (j && rnd() < 0.06) continue;
      out += `M${corners.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
    }
  }
  return out;
}

export const BLOCKS = DISTRICTS.map(districtBlocks).join('');

/** Praça do Comércio's arcaded wings and the Rossio. */
export const PLAZAS = 'M282 364H358V400H282Z M284 160H344V184H284Z M362 166H384V186H362Z M496 132H520V150H496Z';
export const WINGS = 'M268 360H280V402H268Z M360 360H372V402H360Z M282 358H358V362H282Z';

export const RIVER = (() => {
  const top: P[] = [];
  for (let x = -10; x <= W + 10; x += 20) top.push([x, shore(x)]);
  return `${smooth(top)} L ${W + 10} ${H + 10} L -10 ${H + 10} Z`;
})();
export const QUAY = (() => {
  const pts: P[] = [];
  for (let x = -10; x <= W + 10; x += 20) pts.push([x, shore(x) - 9]);
  return smooth(pts);
})();

/** Arterials: yellow avenues, then white streets. */
export const AVENUES = [
  smooth([[300, 160], [276, 104], [252, 50], [232, -6]]),
  smooth([[376, 180], [390, 120], [404, 60], [418, -6]]),
];
export const STREETS = [
  smooth([[84, 336], [150, 316], [214, 304]]),
  smooth([[110, 148], [104, 230], [96, 320], [86, 420]]),
  smooth([[452, 124], [500, 142], [566, 138], [646, 124]]),
  smooth([[486, 256], [534, 240], [600, 236], [646, 230]]),
  smooth([[-6, 120], [60, 128], [118, 146], [190, 148], [282, 150]]),
  smooth([[372, 190], [372, 270], [374, 356]]),
  smooth([[268, 186], [264, 260], [264, 356]]),
  smooth([[446, 30], [450, 80], [452, 124]]),
];

/** The ride: Rua Garrett, across the Baixa, up Rua da Mouraria to Graça. */
export const ROUTE_PTS: P[] = [[206, 305], [267, 299], [319, 299], [319, 187], [371, 187], [384, 172], [416, 150], [446, 128], [492, 142], [528, 130]];
export const SHOP = ROUTE_PTS[0];
export const DOOR = ROUTE_PTS[ROUTE_PTS.length - 1];

/** A point part-way along the route (straight segments), for the rider. */
export function along(pts: P[], t: number): P {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]) {
      const k = left / seg[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    left -= seg[i];
  }
  return pts[pts.length - 1];
}
export const RIDER = along(ROUTE_PTS, 0.64);

/** Uniform Catmull–Rom through a closed ring of points. */
export function ring(pts: P[]) {
  const n = pts.length;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
}
export const parkPath = (pts: P[]) => ring(pts);
