import { smooth, type P } from '@/components/examples/ink/geo';

/* Ferrow's geometry and copy: the emblem, the origin drawings, the map, the
   roast log and the shop. Everything here is static; FerrowSite draws it. */

export const ring = (r: number, cx = 100, cy = 100) =>
  `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
export const BEAN = 'M 100 58 C 124 58 132 84 130 104 C 128 126 114 142 100 142 C 76 142 68 116 70 96 C 72 74 86 58 100 58 Z';
export const CREASE = 'M 101 60 C 86 84 116 114 99 140';

/* The renders, made by a WebGL scene of the bag (see the site's notes). */
export const IMG = {
  hero: { src: '/showcase/ferrow/hero-08452aa0.webp', w: 1100, h: 1300 },
  duo: { src: '/showcase/ferrow/duo-458da98c.webp', w: 1200, h: 900 },
  konga: { src: '/showcase/ferrow/konga-be7cdfd7.webp', w: 640, h: 768 },
  elalto: { src: '/showcase/ferrow/elalto-7651a5b6.webp', w: 640, h: 768 },
  esperanza: { src: '/showcase/ferrow/esperanza-ca8f722a.webp', w: 640, h: 768 },
  marvila: { src: '/showcase/ferrow/marvila-e0e73808.webp', w: 640, h: 768 },
};
/* Where the hero bag's label emblem sits in its render: centre and outer-ring
   radius, as fractions of the image (measured by the renderer). */
export const LABEL_EMBLEM = { x: 0.5, y: 0.4662, r: 0.1172 };

/* ── Origin drawings, 240 × 150 each ───────────────────────────────────── */
export const ORIGINS: Record<string, { ink: string[]; sun: string }> = {
  yirgacheffe: {
    sun: ring(13, 186, 40),
    ink: [
      smooth([[0, 112], [40, 98], [80, 104], [120, 90], [160, 96], [200, 84], [240, 90]]),
      smooth([[0, 126], [44, 114], [92, 120], [138, 106], [182, 112], [240, 104]]),
      smooth([[0, 140], [50, 130], [100, 136], [150, 124], [200, 130], [240, 122]]),
      'M 52 98 V 86 M 46 90 A 6 6 0 1 1 58 90 A 6 6 0 1 1 46 90 M 96 101 V 89 M 90 93 A 6 6 0 1 1 102 93 A 6 6 0 1 1 90 93 M 140 92 V 80 M 134 84 A 6 6 0 1 1 146 84 A 6 6 0 1 1 134 84',
    ],
  },
  tarrazu: {
    sun: ring(11, 52, 36),
    ink: [
      'M 20 132 L 104 50 Q 118 42 132 50 L 220 132',
      'M 106 52 Q 118 60 130 52',
      smooth([[70, 44], [86, 36], [100, 40], [114, 30], [132, 34], [150, 26]]),
      'M 34 140 H 206 M 56 132 l 6 -8 l 6 8 M 84 132 l 6 -8 l 6 8 M 144 132 l 6 -8 l 6 8 M 172 132 l 6 -8 l 6 8',
    ],
  },
  huila: {
    sun: ring(12, 196, 34),
    ink: [
      'M 0 108 L 40 70 L 66 90 L 104 46 L 140 84 L 168 62 L 210 100 L 240 84',
      'M 104 46 L 96 58 M 104 46 L 112 60 M 168 62 L 162 72',
      smooth([[10, 140], [60, 124], [104, 132], [150, 118], [200, 126], [236, 114]]),
      smooth([[22, 146], [70, 134], [118, 142], [170, 130], [226, 136]]),
    ],
  },
};

/* ── The farm-to-roastery map: equirectangular, lon −100…60, lat −12…50 ── */
export const MW = 800, MH = 360;
export const proj = (lon: number, lat: number): P => [((lon + 100) / 160) * MW, ((50 - lat) / 62) * MH];
const poly = (pts: number[]) => {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) {
    const [x, y] = proj(pts[i], pts[i + 1]);
    d += `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + 'Z';
};
/* Coastlines, simplified by hand to a few dozen points each. */
export const LAND = [
  poly([-100, 50, -64, 50, -64.5, 48.5, -66, 45, -70, 43.7, -70.5, 41.8, -74, 40.5, -75, 38.5, -76, 37, -75.5, 35.2, -78, 33.8, -81, 31.5, -80.5, 28.5, -80, 26.5, -80.5, 25.2, -81.8, 26, -82.8, 27.8, -84, 30, -86, 30.4, -89, 30.2, -90.5, 29.1, -94, 29.6, -97.3, 27.8, -97.5, 25, -97.8, 22.2, -96.2, 19.2, -94.5, 18.2, -91.5, 18.6, -90.5, 21, -87, 21.5, -87.7, 18.3, -88.3, 16, -86, 15.9, -83.4, 15, -83.6, 11, -82, 9, -79.5, 9.5, -77.5, 8.7, -75.5, 10.8, -72, 12, -71.5, 10.8, -68, 10.5, -62, 10.7, -60, 8.5, -57, 6, -52, 5, -50, 1.8, -48.5, -1, -44, -2.5, -39, -3.5, -35.2, -5.5, -35, -9, -37.3, -12, -77.2, -12, -79, -7.5, -81.2, -5.5, -80.4, -3.4, -80, -1, -80.1, 1, -78.8, 1.6, -77.4, 4, -77.4, 7, -78.4, 8.3, -80.5, 7.4, -81.8, 8.2, -83.6, 8.4, -85.7, 9.9, -85.8, 11.2, -87.5, 13, -91.5, 14, -94.5, 16.2, -96.5, 15.7, -100, 17]),
  poly([-85, 21.8, -82, 23.1, -77, 21.8, -74.2, 20.2, -77.5, 19.9, -80, 21.7]),
  poly([-74.4, 19.8, -72, 19.9, -68.4, 18.6, -70, 18.2, -74.3, 18.3]),
  poly([1.5, 50, 60, 50, 60, 25.3, 57, 25.7, 56.3, 27, 54, 26.6, 51.5, 27.9, 50, 30, 48, 30, 49.5, 27, 50.8, 24.8, 51.6, 24, 54, 24.1, 56, 24.5, 57.8, 23.6, 59.8, 22.5, 58.5, 20.4, 57.6, 19, 55, 17.2, 52, 16, 48.5, 14, 45, 12.8, 43.4, 12.7, 42.7, 15.5, 40.8, 19.5, 39, 21.6, 38.2, 24, 36.6, 26, 35, 28, 34.6, 29.5, 34, 27.8, 32.6, 29.9, 33.5, 27, 35.5, 23.9, 37.2, 21, 38.5, 18, 39.7, 15.5, 41.2, 14.5, 43.1, 12.7, 43.3, 11.5, 44.5, 10.4, 47, 11.2, 51.2, 11.8, 51, 10.4, 49.6, 7, 48, 4.5, 46, 2, 43.5, -0.5, 41.5, -2, 40, -3.5, 39.3, -5.5, 39.5, -8, 40.3, -10.5, 40.5, -12, 13.8, -12, 12.5, -8, 12.2, -5.8, 11.8, -4.5, 9.4, -1, 9.6, 1, 9.8, 3, 8.8, 4.5, 7, 4.4, 5.5, 4.8, 4.2, 6.3, 2, 6.3, -1, 5.1, -3, 5, -4.8, 5.2, -7.5, 4.4, -9.3, 5.5, -11.4, 6.9, -13.2, 8.5, -14.7, 10.7, -16.7, 12.4, -17.1, 14.7, -16.5, 16, -16.1, 18.5, -16.5, 19.5, -17, 21, -15.5, 24, -13.5, 27, -11.4, 28.1, -9.8, 29.7, -9.6, 31.6, -8.5, 33.3, -6.8, 34, -5.9, 35.8, -2, 35.1, 1, 36.5, 3.5, 36.8, 8.5, 36.9, 10.3, 37.2, 11, 36.8, 10.5, 34.5, 10.1, 33.8, 11.5, 33.1, 15.3, 32.3, 19, 30.3, 20, 31, 20, 32.3, 23, 32.6, 25, 31.6, 29, 30.9, 32, 31.2, 34.3, 31.3, 35, 33, 35.9, 35.5, 36, 36.8, 34.5, 36.8, 32.5, 36.1, 29.5, 36.6, 27.3, 37, 26.5, 39.5, 26.2, 40.6, 26, 40.8, 23.5, 40.2, 22.6, 38.5, 23.2, 36.4, 22.2, 36.5, 21.2, 37.9, 21, 39.6, 19.4, 41.8, 18.5, 42.4, 16, 43.5, 14.3, 45.3, 13.6, 45.7, 12.3, 45.3, 12.5, 44, 13.6, 43.5, 14.7, 42.1, 16, 41.4, 18.5, 40.2, 16.6, 38.9, 15.7, 38, 15.9, 39.5, 14.9, 40.2, 12.8, 41.3, 11, 42.5, 10.2, 43.9, 8.8, 44.4, 7.5, 43.8, 6, 43.1, 4.5, 43.5, 3.1, 43, 3.2, 41.9, 1, 41, 0, 39.8, -0.4, 38.5, -1.5, 37.5, -2.1, 36.7, -4.4, 36.7, -5.6, 36, -6.3, 36.8, -7.4, 37.2, -8.9, 37, -8.8, 38.7, -9.5, 38.8, -8.9, 40.5, -8.8, 42, -9.3, 43, -8, 43.7, -4, 43.4, -1.8, 43.4, -1.3, 44.5, -1.2, 46, -2.2, 47.1, -4.5, 47.8, -4.8, 48.5, -3, 48.8, -1.6, 48.6, -1.4, 49.7, 0.2, 49.7]),
  poly([9.6, 41, 9.3, 39.2, 8.4, 39, 8.2, 40.9]),
  poly([12.4, 38.1, 15.6, 38.3, 15.1, 36.7, 12.5, 37.6]),
].join(' ');
export const WATER = [
  poly([28, 41.2, 28.6, 43.4, 29.7, 45.2, 30.8, 46.5, 33.5, 46, 33.6, 44.5, 35.5, 45.3, 37.5, 45.3, 38.5, 46.9, 39.5, 47.2, 39, 45.8, 37.5, 44.7, 39.8, 43.3, 41.6, 41.6, 40, 40.9, 37, 41.2, 35, 42, 33, 41.9, 31, 41.2]),
  poly([47, 44, 46.7, 42.2, 48.5, 41.8, 49.2, 40.3, 49, 38.4, 49.5, 37.5, 51, 36.8, 53.9, 37, 53.8, 39.5, 53, 40.8, 52.7, 41.8, 54.2, 42.4, 52.5, 44.3, 51.3, 45.2, 53, 45.3, 53.1, 46.8, 51.2, 47.1, 49.2, 46.4, 48, 45.5]),
].join(' ');
export const GRATICULE = [
  ...[-80, -60, -40, -20, 0, 20, 40].map((lon) => `M ${proj(lon, 50)[0].toFixed(1)} 0 V ${MH}`),
  ...[40, 20, 0].map((lat) => `M 0 ${proj(-100, lat)[1].toFixed(1)} H ${MW}`),
].join(' ');
export const LISBON = proj(-9.14, 38.72);
/* Each route sails from the farm's port of export, so it leaves from the coast. */
export const FARMS = [
  { id: 'yirgacheffe', name: 'Yirgacheffe', at: proj(38.2, 6.16), port: proj(43.1, 11.6), portName: 'Djibouti', km: '6,900 km', days: '19 days', lift: 60, dx: 10, dy: 18 },
  { id: 'tarrazu', name: 'Tarrazú', at: proj(-84.0, 9.66), port: proj(-83.0, 10.0), portName: 'Puerto Limón', km: '8,300 km', days: '23 days', lift: 70, dx: -12, dy: -12 },
  { id: 'huila', name: 'Huila', at: proj(-75.6, 2.5), port: proj(-75.5, 10.4), portName: 'Cartagena', km: '8,000 km', days: '22 days', lift: 96, dx: 12, dy: 16 },
];
export const routeD = (f: (typeof FARMS)[number]) => {
  const [a, p, b] = [f.at, f.port, LISBON];
  const mx = (p[0] + b[0]) / 2, my = (p[1] + b[1]) / 2 - f.lift;
  const f1 = (n: number) => n.toFixed(1);
  return `M ${f1(a[0])} ${f1(a[1])} L ${f1(p[0])} ${f1(p[1])} Q ${f1(mx)} ${f1(my)} ${f1(b[0])} ${f1(b[1])}`;
};

/* ── Roast profile: 0–12 min × 80–230 °C, in a 640 × 280 box ───────────── */
export const RX0 = 46, RX1 = 620, RY0 = 18, RY1 = 250;
export const rx = (min: number) => RX0 + (min / 12) * (RX1 - RX0);
export const ry = (c: number) => RY1 - ((c - 80) / 150) * (RY1 - RY0);
const ror = (v: number) => RY1 - (v / 25) * (RY1 - RY0) * 0.55;
export const BT: [number, number][] = [[0, 200], [0.6, 138], [1.5, 95], [3, 128], [4.5, 158], [6, 176], [7.5, 188], [8.67, 196], [10, 205], [10.92, 211]];
export const ROR: [number, number][] = [[1.5, 21], [3, 17.5], [4.5, 14], [6, 11], [7.5, 8.6], [8.67, 7], [10, 5.2], [10.92, 4.2]];
export const BT_PATH = smooth(BT.map(([m, c]) => [rx(m), ry(c)] as P));
export const ROR_PATH = smooth(ROR.map(([m, v]) => [rx(m), ror(v)] as P));
/* The development band: first crack to drop. */
export const DEV_BAND = `M ${rx(8.67).toFixed(1)} ${RY0} H ${rx(10.92).toFixed(1)} V ${RY1} H ${rx(8.67).toFixed(1)} Z`;
/* dx/dy place each label clear of the curve and of its neighbours. */
export const MILESTONES = [
  { at: 1.5, c: 95, label: 'Turning point', note: '1:30 · 95 °C', p: 0.18, dx: 12, dy: 4, end: false },
  { at: 4.5, c: 158, label: 'Drying ends', note: '4:30 · 158 °C', p: 0.45, dx: 12, dy: 18, end: false },
  { at: 8.67, c: 196, label: 'First crack', note: '8:40 · 196 °C', p: 0.78, dx: -12, dy: -12, end: true },
  { at: 10.92, c: 211, label: 'Drop', note: '10:55 · 211 °C', p: 0.9, dx: 8, dy: -16, end: true },
];
const lerpTable = (t: [number, number][], x: number) => {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) if (x <= t[i][0]) {
    const [x0, y0] = t[i - 1], [x1, y1] = t[i];
    return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return t[t.length - 1][1];
};
/* Draw progress → roast clock: the same stops the milestones use. */
const CLOCK: [number, number][] = [[0, 0], [0.18, 1.5], [0.45, 4.5], [0.78, 8.67], [0.97, 10.92], [1, 10.92]];
export function readout(p: number) {
  const m = lerpTable(CLOCK, p);
  const bt = lerpTable(BT, m), r = m < 1.5 ? null : lerpTable(ROR, m);
  const phase = p >= 0.96 ? 'Dropped' : m < 1.5 ? 'Charge' : m < 4.5 ? 'Drying' : m < 8.67 ? 'Maillard' : 'Development';
  const s = Math.round(m * 60);
  return {
    time: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    bt: `${Math.round(bt)} °C`,
    ror: r === null ? '—' : `${r.toFixed(1)} °C/min`,
    phase,
  };
}

/* ── The shop ──────────────────────────────────────────────────────────── */
export type Lot = {
  id: keyof typeof IMG; name: string; farm: string; region: string; process: string; variety: string; alt: string;
  notes: [string, string][]; roast: number; use: 'filter' | 'espresso' | 'omni';
  p250: number; p1k: number; score: string; badge?: string; plate: string;
};
export const LOTS: Lot[] = [
  { id: 'konga', name: 'Konga', farm: 'Konga Cooperative', region: 'Yirgacheffe, Ethiopia', process: 'Washed', variety: 'Heirloom 74110', alt: '1,950–2,100 m',
    notes: [['Bergamot', '#d9a441'], ['White peach', '#f0b48a'], ['Jasmine', '#efe3c4']], roast: 1, use: 'filter', p250: 16, p1k: 54, score: '88.5', badge: 'Roasted this week', plate: '#f1dccb' },
  { id: 'elalto', name: 'El Alto', farm: 'Finca El Alto', region: 'Tarrazú, Costa Rica', process: 'Honey', variety: 'Caturra · Catuaí', alt: '1,600 m',
    notes: [['Cane sugar', '#c8955a'], ['Red apple', '#c4432f'], ['Cocoa', '#5a3424']], roast: 2, use: 'filter', p250: 15, p1k: 50, score: '86.25', plate: '#e8dccd' },
  { id: 'esperanza', name: 'La Esperanza', farm: 'Finca La Esperanza', region: 'Huila, Colombia', process: 'Natural', variety: 'Pink Bourbon', alt: '1,750 m',
    notes: [['Strawberry', '#d9485a'], ['Dark chocolate', '#3d2318'], ['Rum', '#9a5a2a']], roast: 2, use: 'omni', p250: 17, p1k: 58, score: '87.5', badge: 'Last 60 bags', plate: '#dfe0cc' },
  { id: 'marvila', name: 'Marvila', farm: 'House espresso', region: 'Brazil · Ethiopia', process: 'Natural & washed', variety: '60% Brazil · 40% Ethiopia', alt: '1,100–2,000 m',
    notes: [['Milk chocolate', '#7a4a2e'], ['Hazelnut', '#b07a45'], ['Orange', '#e2852f']], roast: 3, use: 'espresso', p250: 13, p1k: 42, score: '85.0', badge: 'Bestseller', plate: '#ecdfca' },
];
export const GRINDS = ['Whole bean', 'Espresso', 'V60 / filter', 'AeroPress', 'Cafetière'];

/* ── The farms ─────────────────────────────────────────────────────────── */
export const FARM_STORIES = [
  { id: 'yirgacheffe', lot: 'Konga', who: 'Konga Cooperative', where: 'Yirgacheffe, Ethiopia', coords: '6.16° N · 38.20° E', alt: '2,000 m',
    since: '2019', harvest: 'Nov – Jan', paid: '€7.40 / kg', premium: '2.6× Fairtrade', lot2: '42 bags · 60 kg',
    quote: 'They cup our lots in March and pay in April. Nobody else pays before the coffee leaves the port.', by: 'Tesfaye Bekele, washing-station manager' },
  { id: 'tarrazu', lot: 'El Alto', who: 'The Solís family', where: 'Tarrazú, Costa Rica', coords: '9.66° N · 84.00° W', alt: '1,600 m',
    since: '2020', harvest: 'Dec – Mar', paid: '€6.90 / kg', premium: '2.4× Fairtrade', lot2: '30 bags · 69 kg',
    quote: 'We dry the honey lots on raised beds now. Ferrow paid for the first twelve.', by: 'Marta Solís, producer' },
  { id: 'huila', lot: 'La Esperanza', who: 'Finca La Esperanza', where: 'Huila, Colombia', coords: '2.50° N · 75.60° W', alt: '1,750 m',
    since: '2021', harvest: 'Apr – Jun', paid: '€8.10 / kg', premium: '2.8× Fairtrade', lot2: '18 bags · 70 kg',
    quote: 'Pink Bourbon is hard to grow and easy to lose. A buyer who comes back every year makes it worth it.', by: 'Andrés Rojas, producer' },
];

export const CUPPING: [string, number][] = [
  ['Fragrance', 8.5], ['Flavour', 8.75], ['Aftertaste', 8.25], ['Acidity', 8.75], ['Body', 7.75],
  ['Balance', 8.25], ['Uniformity', 10], ['Clean cup', 10], ['Sweetness', 10], ['Overall', 8.25],
];

export const BREWS = [
  { k: 'V60', d: 'Bright and clean — how we drink Konga.', dose: '15 g', water: '250 g', temp: '94 °C', time: '2:45', grind: 'Medium-fine', ratio: '1 : 16.7',
    steps: ['Rinse the paper, add 15 g of coffee', 'Bloom with 45 g of water for 40 s', 'Pour to 150 g by 1:15, to 250 g by 1:45', 'Swirl once; drawdown by 2:45'] },
  { k: 'AeroPress', d: 'Forgiving, sweet, and fine on a campsite.', dose: '14 g', water: '200 g', temp: '90 °C', time: '2:00', grind: 'Medium', ratio: '1 : 14.3',
    steps: ['Inverted, 14 g of coffee in', 'Fill to 200 g and stir three times', 'Cap at 1:00, flip at 1:30', 'Press gently for 30 s'] },
  { k: 'Espresso', d: 'Marvila, dialled in on our La Marzocco.', dose: '18 g', water: '40 g out', temp: '93 °C', time: '28 s', grind: 'Fine', ratio: '1 : 2.2',
    steps: ['18 g in a 18 g basket, level and tamp', 'Pre-infuse for 5 s', '40 g in the cup at 26–30 s', 'Milk: 160 ml at 60 °C for a flat white'] },
];

export const REVIEWS = [
  { n: 'Inês M.', where: 'Porto', lot: 'Konga', s: 5, d: '4 days ago', t: 'Tastes exactly like the label says',
    b: 'Bergamot on the first sip, peach as it cools. The roast date on the bag was two days before it arrived.' },
  { n: 'Jonas W.', where: 'Berlin', lot: 'Subscription', s: 5, d: '2 weeks ago', t: 'Fourteen months, never a dull bag',
    b: 'I skip a delivery when I travel and it takes ten seconds. Every bag comes with the farm notes and a brew card.' },
  { n: 'Priya S.', where: 'Lisbon', lot: 'Marvila', s: 5, d: '1 month ago', t: 'Our office machine finally makes good coffee',
    b: 'Ordered the 1 kg of Marvila, ground for espresso. Ada emailed back a recipe for our grinder within the hour.' },
];

export const FAQ: [string, string][] = [
  ['When will my coffee be roasted?', 'We roast every Tuesday. Order by Monday at 23:59 and your coffee is roasted the next day and shipped on Wednesday morning. Orders after that go into the following Tuesday’s roast.'],
  ['Whole bean or ground?', 'Whole bean keeps its aroma two to three times longer. If you don’t have a grinder, choose your brewer and we grind it to suit on roast day, the same morning it ships.'],
  ['How long does delivery take?', 'Portugal: 1–2 working days, free over €40. Spain: 2–3 days. The rest of the EU: 3–5 days, from €6.90. Every order gets a tracking link on Wednesday.'],
  ['Can I pause or change my subscription?', 'Yes, any time before the Sunday ahead of roast day: skip a delivery, change the grind, swap to espresso or cancel. No fees, no notice period.'],
  ['Are the bags recyclable?', 'They’re home-compostable: a paper outer, a plant-based lining and a compostable valve. Allow about 26 weeks in a home compost bin.'],
];
