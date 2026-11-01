import { n } from '@/components/examples/ink/geo';

/* Greenline's plates: the report cover, the Kasigau project map, the
   before/after of plot K-14 and the nursery. Gradients and line art only,
   every position computed from fixed seeds so server and client agree. */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A ridge whose top edge is a run of canopy bumps, closed down to `floor`. */
function canopy(f: (x: number) => number, w: number, floor: number, rMin: number, rMax: number, seed: number) {
  const r = rng(seed);
  let x = -12;
  let d = `M ${n(x)} ${n(f(x))}`;
  while (x < w + 12) {
    const rad = rMin + r() * (rMax - rMin);
    const x2 = x + rad * 2;
    d += ` A ${n(rad)} ${n(rad * (0.8 + r() * 0.35))} 0 0 1 ${n(x2)} ${n(f(x2))}`;
    x = x2;
  }
  return `${d} V ${floor} H -12 Z`;
}
const hill = (f: (x: number) => number, w: number, floor: number, step = 8) => {
  let d = `M -10 ${n(f(-10))}`;
  for (let x = -10 + step; x <= w + 10; x += step) d += ` L ${n(x)} ${n(f(x))}`;
  return `${d} L ${w + 10} ${floor} L -10 ${floor} Z`;
};

/** A flat-topped acacia: forked trunk, two layers of umbrella canopy. */
function Acacia({ x, y, s = 1, fill, trunk }: { x: number; y: number; s?: number; fill: string; trunk: string }) {
  const h = 46 * s, w = 54 * s;
  return (
    <g>
      <path d={`M ${n(x)} ${n(y)} L ${n(x + 1 * s)} ${n(y - h * 0.55)} L ${n(x - w * 0.22)} ${n(y - h)} M ${n(x + 1 * s)} ${n(y - h * 0.55)} L ${n(x + w * 0.24)} ${n(y - h * 0.96)}`} fill="none" stroke={trunk} strokeWidth={n(2.2 * s)} strokeLinecap="round" />
      <ellipse cx={n(x)} cy={n(y - h)} rx={n(w * 0.52)} ry={n(w * 0.11)} fill={fill} />
      <ellipse cx={n(x + w * 0.08)} cy={n(y - h - w * 0.08)} rx={n(w * 0.34)} ry={n(w * 0.09)} fill={fill} />
    </g>
  );
}
/** A round-crowned tree (croton, mukau): trunk and three overlapping crowns. */
function Round({ x, y, s = 1, fill, shade, trunk }: { x: number; y: number; s?: number; fill: string; shade: string; trunk: string }) {
  const h = 30 * s, r = 12 * s;
  return (
    <g>
      <path d={`M ${n(x)} ${n(y)} V ${n(y - h)}`} stroke={trunk} strokeWidth={n(2 * s)} strokeLinecap="round" />
      <circle cx={n(x - r * 0.55)} cy={n(y - h)} r={n(r * 0.85)} fill={shade} />
      <circle cx={n(x + r * 0.6)} cy={n(y - h + r * 0.1)} r={n(r * 0.8)} fill={shade} />
      <circle cx={n(x)} cy={n(y - h - r * 0.45)} r={n(r)} fill={fill} />
    </g>
  );
}
/** A row of tree guards (the white tubes protecting each new seedling). */
function Guards({ x0, x1, y0, y1, gap, s = 1, seed }: { x0: number; x1: number; y0: number; y1: number; gap: number; s?: number; seed: number }) {
  const r = rng(seed);
  const out = [];
  for (let x = x0; x <= x1; x += gap) {
    const t = (x - x0) / (x1 - x0 || 1);
    const y = y0 + (y1 - y0) * t + (r() - 0.5) * 2;
    out.push(
      <g key={x}>
        <path d={`M ${n(x)} ${n(y)} l ${n(-4 * s)} ${n(-7 * s)} M ${n(x)} ${n(y - 2 * s)} l ${n(4 * s)} ${n(-8 * s)}`} stroke="#5f9b58" strokeWidth={n(1.3 * s)} strokeLinecap="round" />
        <rect x={n(x - 2 * s)} y={n(y - 8 * s)} width={n(4 * s)} height={n(9 * s)} rx={n(0.8 * s)} fill="#eef0e2" opacity="0.92" />
      </g>,
    );
  }
  return <g>{out}</g>;
}
const Birds = ({ pts, c }: { pts: [number, number, number][]; c: string }) => (
  <path d={pts.map(([x, y, s]) => `M ${n(x - 6 * s)} ${n(y - 2 * s)} Q ${n(x - 3 * s)} ${n(y - 5 * s)} ${n(x)} ${n(y)} Q ${n(x + 3 * s)} ${n(y - 5 * s)} ${n(x + 6 * s)} ${n(y - 2 * s)}`).join(' ')} fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
);

// ── Report cover: the Kasigau corridor at dawn ─────────────────────────
export function CoverArt() {
  const far = (x: number) => 318 - 26 * Math.sin(x / 70) - 10 * Math.sin(x / 23);
  const kasigau = (x: number) => 334 - 78 * Math.exp(-(((x - 236) / 88) ** 2)) - 4 * Math.sin(x / 19);
  const mid = (x: number) => 372 - 18 * Math.sin(x / 60 + 1) - 6 * Math.sin(x / 17);
  const near = (x: number) => 430 - 26 * Math.sin(x / 95 + 2.2);
  const front = (x: number) => 486 + 0.14 * x - 14 * Math.sin(x / 80);
  const acacias: [number, number, number][] = [[52, 444, 1.15], [128, 438, 0.8], [306, 426, 0.95], [392, 420, 1.3], [446, 432, 0.75]];
  const rounds: [number, number, number][] = [[90, 452, 0.9], [216, 446, 1.1], [262, 440, 0.8], [352, 438, 0.85]];
  return (
    <svg viewBox="0 0 480 600" role="img" aria-label="Illustration: the Kasigau corridor at dawn, young acacia forest on the slopes and rows of guarded seedlings in the foreground">
      <defs>
        <linearGradient id="gl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dfb4" />
          <stop offset="0.45" stopColor="#efe5cc" />
          <stop offset="1" stopColor="#d7e3d2" />
        </linearGradient>
        <radialGradient id="gl-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2cf" />
          <stop offset="0.35" stopColor="#f9dc9d" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f6dfb4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gl-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3efe0" stopOpacity="0" />
          <stop offset="0.6" stopColor="#f3efe0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#f3efe0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gl-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c5a3a" />
          <stop offset="1" stopColor="#173322" />
        </linearGradient>
      </defs>
      <rect width="480" height="600" fill="url(#gl-sky)" />
      <circle cx="344" cy="232" r="120" fill="url(#gl-sun)" />
      <circle cx="344" cy="232" r="34" fill="#fbe6b4" />
      <Birds pts={[[392, 128, 1], [412, 140, 0.75], [296, 168, 0.85], [314, 176, 0.6]]} c="#5b6b52" />
      <path d={hill(far, 480, 600)} fill="#c9d6c0" />
      <path d={hill(kasigau, 480, 600, 6)} fill="#b4c8a9" />
      <path d={canopy((x) => kasigau(x) + 14, 480, 600, 2.5, 4.5, 4)} fill="#a3bd98" />
      <rect y="300" width="480" height="70" fill="url(#gl-mist)" />
      <path d={canopy(mid, 480, 600, 5, 10, 9)} fill="#7fa477" />
      <path d={canopy(near, 480, 600, 7, 14, 13)} fill="#4f7d55" />
      {rounds.map(([x, y, s]) => <Round key={x} x={x} y={y} s={s} fill="#3d6c47" shade="#335f3d" trunk="#2a4a32" />)}
      {acacias.map(([x, y, s]) => <Acacia key={x} x={x} y={y} s={s} fill="#2f5d3b" trunk="#24412c" />)}
      <path d={hill(front, 480, 600, 6)} fill="url(#gl-front)" />
      <Guards x0={34} x1={460} y0={512} y1={566} gap={22} s={1} seed={3} />
      <Guards x0={14} x1={470} y0={540} y1={606} gap={26} s={1.25} seed={5} />
      <path d="M0 600 L0 574 C 90 560, 170 586, 260 596 L 270 600 Z" fill="#132a1c" opacity="0.6" />
    </svg>
  );
}

// ── Project map: Kasigau corridor, Taita-Taveta ────────────────────────
function closed(pts: [number, number][]) {
  const k = pts.length;
  let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < k; i++) {
    const p0 = pts[(i - 1 + k) % k], p1 = pts[i], p2 = pts[(i + 1) % k], p3 = pts[(i + 2) % k];
    d += ` C ${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return `${d} Z`;
}
const contour = (cx: number, cy: number, R: number, ph: number) =>
  closed(Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = R * (1 + 0.13 * Math.sin(3 * a + ph) + 0.07 * Math.sin(5 * a + ph * 2));
    return [cx + r * Math.cos(a) * 1.25, cy + r * Math.sin(a) * 0.86] as [number, number];
  }));

export type Plot = { id: string; y: 2023 | 2024 | 2025 | 2026; c: [number, number]; r: number; on?: boolean };
export const PLOTS: Plot[] = [
  { id: 'K-09', y: 2023, c: [150, 128], r: 30 },
  { id: 'K-11', y: 2023, c: [228, 100], r: 26 },
  { id: 'K-12', y: 2024, c: [342, 122], r: 30 },
  { id: 'K-14', y: 2024, c: [418, 236], r: 40, on: true },
  { id: 'K-15', y: 2024, c: [326, 296], r: 30 },
  { id: 'K-17', y: 2025, c: [184, 284], r: 32 },
  { id: 'K-18', y: 2025, c: [96, 214], r: 25 },
  { id: 'K-21', y: 2025, c: [528, 138], r: 30 },
  { id: 'K-23', y: 2026, c: [566, 254], r: 32 },
  { id: 'K-24', y: 2026, c: [250, 360], r: 28 },
];
/** A land parcel: straight-edged, irregular, never a tidy square. */
function parcel({ c: [cx, cy], r }: Plot, seed: number) {
  const k = rng(seed);
  const m = 5 + Math.floor(k() * 3);
  const rot = k() * Math.PI;
  return Array.from({ length: m }, (_, i) => {
    const a = rot + (i / m) * Math.PI * 2 + (k() - 0.5) * 0.5;
    const rr = r * (0.72 + k() * 0.42);
    return [cx + Math.cos(a) * rr * 1.18, cy + Math.sin(a) * rr * 0.9] as [number, number];
  });
}
const centroid = (pts: [number, number][]) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

export function PlotMap() {
  const peak: [number, number] = [262, 196];
  return (
    <svg viewBox="0 0 720 460" role="img" aria-label="Map of the Kasigau corridor: ten planting plots around Kasigau Hill, coloured by the year they were planted, with the river, the road, three villages and the Greenline nursery">
      <defs>
        <pattern id="gl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#f4f1e4" />
          <path d="M0 0 V7" stroke="#8fae86" strokeWidth="2" />
        </pattern>
        <radialGradient id="gl-relief" cx="0.36" cy="0.42" r="0.5">
          <stop offset="0" stopColor="#dfe3cd" />
          <stop offset="1" stopColor="#eef0e3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="460" fill="#eef0e3" />
      <rect width="720" height="460" fill="url(#gl-relief)" />
      <g fill="none" stroke="#cdd2b9">
        {[34, 62, 92, 124, 158, 196, 238, 284].map((R, i) => (
          <path key={R} d={contour(peak[0], peak[1], R, 0.6 + i * 0.12)} strokeWidth={i % 4 === 3 ? 1.6 : 0.9} />
        ))}
        <path d={contour(560, 190, 40, 2)} strokeWidth="0.9" />
        <path d={contour(560, 190, 72, 2.2)} strokeWidth="0.9" />
      </g>
      <g fill="#c3d1ad">
        {Array.from({ length: 34 }, (_, i) => {
          const a = i * 2.39996, rr = 9 + Math.sqrt(i) * 8.2;
          return <circle key={i} cx={n(peak[0] + Math.cos(a) * rr * 1.25)} cy={n(peak[1] + Math.sin(a) * rr * 0.86)} r={n(3.2 + (i % 3))} />;
        })}
      </g>
      <path d="M -10 34 C 60 30, 120 52, 170 30 S 250 -4, 300 -10" fill="none" stroke="#9fb38f" strokeWidth="1.4" strokeDasharray="6 4" />
      <text className="gl-map-park" x="16" y="62">Tsavo West National Park</text>
      <text className="gl-map-park" x="648" y="44" textAnchor="end">Tsavo East →</text>
      <path d="M720 64 C 640 92, 610 150, 640 214 S 690 330, 610 376 S 470 420, 420 470" fill="none" stroke="#a9cbd6" strokeWidth="9" strokeLinecap="round" />
      <path d="M720 64 C 640 92, 610 150, 640 214 S 690 330, 610 376 S 470 420, 420 470" fill="none" stroke="#c9e0e6" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-10 412 C 120 396, 200 420, 300 404 S 470 352, 560 360 S 680 400, 730 392" fill="none" stroke="#d9c69c" strokeWidth="4" strokeDasharray="10 6" />
      {PLOTS.map((p, i) => {
        const pts = parcel(p, 40 + i * 7);
        const [cx, cy] = centroid(pts);
        return (
          <g key={p.id} className={`gl-plot y${p.y}${p.on ? ' on' : ''}`}>
            <path d={`M ${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join(' L ')} Z`} />
            <text x={n(cx)} y={n(cy + 3.5)} textAnchor="middle">{p.id}</text>
          </g>
        );
      })}
      <path className="gl-leader" d="M 438 250 L 506 298" fill="none" stroke="#13261b" strokeWidth="1.2" strokeDasharray="3 3" />
      <circle className="gl-leader" cx="438" cy="250" r="3" fill="#13261b" />
      <path d={`M ${peak[0] - 7} ${peak[1] + 6} L ${peak[0]} ${peak[1] - 6} L ${peak[0] + 7} ${peak[1] + 6} Z`} fill="#3d4a3a" />
      <text className="gl-map-label" x={peak[0] + 12} y={peak[1] + 4}>Kasigau Hill · 1,641 m</text>
      {([[56, 384, 'Rukanga'], [456, 384, 'Bungule'], [590, 420, 'Makwasinyi']] as const).map(([x, y, t]) => (
        <g key={t}>
          <rect x={x - 4} y={y - 4} width="8" height="8" fill="#3d4a3a" />
          <text className="gl-map-label" x={x + 9} y={y + 4}>{t}</text>
        </g>
      ))}
      <g transform="translate(72 336)">
        <circle r="8.5" fill="#fff" stroke="#1f5a3a" strokeWidth="2" />
        <path d="M0 5 V -3 M0 0 c -3 -1 -4 -4 -3 -6 c 2 0 4 2 3 6 M0 -1 c 3 -1 4 -4 3 -6 c -2 0 -4 2 -3 6" fill="none" stroke="#1f5a3a" strokeWidth="1.3" strokeLinecap="round" />
        <text className="gl-map-label is-strong" x="14" y="4">Greenline nursery</text>
      </g>
      <g transform="translate(676 40)">
        <circle r="17" fill="#f7f6ee" stroke="#cdd2b9" />
        <path d="M0 -11 L5 5 L0 1.5 L-5 5 Z" fill="#3d4a3a" />
        <text className="gl-map-label" x="-3.5" y="-20">N</text>
      </g>
    </svg>
  );
}

// ── Plot K-14: March 2023 and October 2026 ─────────────────────────────
const ROCKS: [number, number, number][] = [[118, 352, 10], [470, 384, 14], [642, 338, 9], [300, 398, 7]];
const POSTS = [40, 110, 180, 250, 320, 390, 460, 530, 600, 670, 740];
const postY = (x: number) => 300 + x * 0.035;

function Common({ ground, far, hillC }: { ground: string; far: string; hillC: string }) {
  return (
    <>
      <path d={hill((x) => 196 - 34 * Math.sin(x / 120 + 0.6) - 10 * Math.sin(x / 37), 800, 420)} fill={far} />
      <path d={hill((x) => 248 - 30 * Math.exp(-(((x - 560) / 160) ** 2)) - 8 * Math.sin(x / 50), 800, 420)} fill={hillC} />
      <path d={hill((x) => 284 + 0.03 * x - 6 * Math.sin(x / 70), 800, 420)} fill={ground} />
      {POSTS.map((x) => <path key={x} d={`M ${x} ${n(postY(x))} v -26`} stroke="#6b5640" strokeWidth="3" strokeLinecap="round" />)}
      <path d={`M ${POSTS[0]} ${n(postY(POSTS[0]) - 20)} L ${POSTS[POSTS.length - 1]} ${n(postY(POSTS[POSTS.length - 1]) - 20)} M ${POSTS[0]} ${n(postY(POSTS[0]) - 10)} L ${POSTS[POSTS.length - 1]} ${n(postY(POSTS[POSTS.length - 1]) - 10)}`} stroke="#7d6a55" strokeWidth="1" opacity="0.7" />
      {ROCKS.map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r * 1.5} ry={r * 0.8} fill="#9b8f7e" />)}
    </>
  );
}

export function BeforePlate() {
  const r = rng(21);
  const stumps = Array.from({ length: 9 }, (_, i) => [60 + i * 84 + r() * 30, 330 + r() * 70] as const);
  return (
    <svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="gl-bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2e7cf" /><stop offset="1" stopColor="#e7d5b1" /></linearGradient>
        <linearGradient id="gl-bground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfa36b" /><stop offset="1" stopColor="#b07a45" /></linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#gl-bsky)" />
      <circle cx="640" cy="92" r="30" fill="#f8e7c0" />
      <Common ground="url(#gl-bground)" far="#d6c3a0" hillC="#c4a77d" />
      <g fill="none" stroke="#8a5a32" strokeLinecap="round">
        <path d="M150 300 C 170 330, 140 360, 180 420" strokeWidth="5" />
        <path d="M168 340 C 200 352, 214 372, 236 380" strokeWidth="2.5" />
        <path d="M520 306 C 500 340, 540 372, 512 420" strokeWidth="6" />
        <path d="M514 352 C 480 366, 470 380, 446 384" strokeWidth="2.5" />
        <path d="M680 320 C 700 350, 690 380, 712 420" strokeWidth="3.5" />
      </g>
      <g fill="none" stroke="#a5713f" strokeWidth="1.1" strokeLinecap="round" opacity="0.7">
        {Array.from({ length: 14 }, (_, i) => {
          const x = 40 + i * 56 + r() * 20, y = 350 + r() * 60;
          return <path key={i} d={`M ${n(x)} ${n(y)} l 14 4 l 8 -6 M ${n(x + 14)} ${n(y + 4)} l 4 10`} />;
        })}
      </g>
      <g transform="translate(336 322)">
        <path d="M-52 0 C -40 -30, 40 -30, 52 0 Z" fill="#4a3a2c" />
        <path d="M-40 -6 C -28 -22, 26 -22, 40 -6" fill="none" stroke="#2e241b" strokeWidth="2" />
        <path d="M6 -24 C 0 -44, 22 -54, 12 -74 C 4 -90, 26 -100, 20 -118" fill="none" stroke="#b9ab96" strokeWidth="9" strokeLinecap="round" opacity="0.45" />
        <path d="M6 -24 C 0 -44, 22 -54, 12 -74 C 4 -90, 26 -100, 20 -118" fill="none" stroke="#d6cbb8" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </g>
      {stumps.map(([x, y], i) => (
        <path key={i} d={`M ${n(x - 6)} ${n(y)} L ${n(x - 4)} ${n(y - 10)} L ${n(x + 4)} ${n(y - 11)} L ${n(x + 6)} ${n(y)} Z`} fill="#6e5038" />
      ))}
      <g fill="none" stroke="#7a6248" strokeWidth="1.4" strokeLinecap="round">
        {[[260, 340], [420, 372], [600, 360], [90, 392]].map(([x, y]) => (
          <path key={x} d={`M ${x} ${y} l -8 -16 M ${x} ${y} l 2 -20 M ${x} ${y} l 10 -14 M ${x - 4} ${y - 9} l -7 -4 M ${x + 6} ${y - 9} l 6 -6`} />
        ))}
      </g>
    </svg>
  );
}

export function AfterPlate() {
  const r = rng(33);
  const grass = Array.from({ length: 70 }, () => [r() * 800, 300 + r() * 120] as const);
  return (
    <svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="gl-asky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e4eee4" /><stop offset="1" stopColor="#d3e2cf" /></linearGradient>
        <linearGradient id="gl-aground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86ad6c" /><stop offset="1" stopColor="#5d8a4f" /></linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#gl-asky)" />
      <circle cx="640" cy="92" r="30" fill="#f6f1d6" />
      <Birds pts={[[210, 96, 1.2], [236, 110, 0.9], [420, 70, 1], [444, 80, 0.7]]} c="#4c5f48" />
      <Common ground="url(#gl-aground)" far="#a8c29d" hillC="#7ea56f" />
      <path d={canopy((x) => 262 - 30 * Math.exp(-(((x - 560) / 150) ** 2)) - 4 * Math.sin(x / 40), 800, 300, 5, 11, 7)} fill="#6f9c63" />
      {[[40, 300, 0.7], [120, 296, 0.62], [300, 292, 0.7], [470, 282, 0.66], [560, 270, 0.8], [700, 286, 0.6]].map(([x, y, s]) => (
        <Acacia key={x} x={x} y={y} s={s} fill="#4f8452" trunk="#4b5a3c" />
      ))}
      {[[200, 300, 0.75], [390, 294, 0.7], [640, 290, 0.8]].map(([x, y, s]) => (
        <Round key={x} x={x} y={y} s={s} fill="#578c56" shade="#4c7f4c" trunk="#4b5a3c" />
      ))}
      <g fill="none" stroke="#4d7a3f" strokeWidth="1.3" strokeLinecap="round">
        {grass.map(([x, y], i) => <path key={i} d={`M ${n(x)} ${n(y)} l -3 -9 M ${n(x)} ${n(y)} l 1 -11 M ${n(x)} ${n(y)} l 5 -8`} />)}
      </g>
      {[[70, 344, 1.3], [250, 330, 1.05], [430, 372, 1.6], [610, 334, 1.15], [748, 360, 1.35]].map(([x, y, s]) => (
        <Acacia key={x} x={x} y={y} s={s} fill="#2f6340" trunk="#3c3a2a" />
      ))}
      {[[160, 368, 1.25], [340, 318, 0.95], [520, 342, 1.1], [600, 318, 0.9], [690, 396, 1.45]].map(([x, y, s]) => (
        <Round key={x} x={x} y={y} s={s} fill="#3f7a49" shade="#336a3e" trunk="#3c3a2a" />
      ))}
    </svg>
  );
}

// ── The nursery at Rukanga ─────────────────────────────────────────────
export function NurseryArt() {
  const rows = [
    { y: 318, x0: 60, x1: 420, r: 6.5, c: 14 },
    { y: 288, x0: 82, x1: 398, r: 5.5, c: 15 },
    { y: 262, x0: 102, x1: 378, r: 4.6, c: 16 },
    { y: 240, x0: 120, x1: 360, r: 3.8, c: 17 },
    { y: 222, x0: 134, x1: 346, r: 3.2, c: 18 },
  ];
  return (
    <svg viewBox="0 0 480 400" role="img" aria-label="Illustration: inside the Rukanga nursery, rows of seedling trays under a shade net, with labelled stakes for each species">
      <defs>
        <linearGradient id="gl-nbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9efe0" /><stop offset="1" stopColor="#dbe4cf" /></linearGradient>
        <linearGradient id="gl-net" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f5d3b" stopOpacity="0.85" /><stop offset="1" stopColor="#2f5d3b" stopOpacity="0.55" /></linearGradient>
        <linearGradient id="gl-nfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d2b98f" /><stop offset="1" stopColor="#bf9f6e" /></linearGradient>
        <pattern id="gl-mesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0 L6 6 M6 0 L0 6" stroke="#ffffff" strokeWidth="0.5" opacity="0.25" /></pattern>
      </defs>
      <rect width="480" height="400" fill="url(#gl-nbg)" />
      <path d={hill((x) => 168 - 22 * Math.exp(-(((x - 120) / 90) ** 2)) - 5 * Math.sin(x / 30), 480, 220)} fill="#b9cdb0" />
      <path d={canopy((x) => 186 - 6 * Math.sin(x / 50), 480, 220, 4, 9, 17)} fill="#93b289" />
      <path d="M0 196 L480 196 L480 400 L0 400 Z" fill="url(#gl-nfloor)" />
      <path d="M-10 70 L240 30 L490 70 L490 92 L240 56 L-10 92 Z" fill="url(#gl-net)" />
      <path d="M-10 70 L240 30 L490 70 L490 92 L240 56 L-10 92 Z" fill="url(#gl-mesh)" />
      <path d="M0 92 L240 56 L480 92" fill="none" stroke="#244a31" strokeWidth="2" />
      <path d="M460 140 C 430 150, 440 190, 410 210 S 380 250, 420 290 S 470 320, 440 352" fill="none" stroke="#3d6f8a" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <g stroke="#6b5640" strokeWidth="4" strokeLinecap="round">
        <path d="M20 88 V 360 M460 88 V 360 M150 66 V 214 M330 66 V 214" />
      </g>
      <path d="M150 214 L330 214" stroke="#6b5640" strokeWidth="2" opacity="0.6" />
      <g transform="translate(36 150)">
        <rect x="0" y="0" width="58" height="62" rx="6" fill="#4f7f8f" />
        <path d="M0 14 H58 M0 30 H58 M0 46 H58" stroke="#3e6877" strokeWidth="2" />
        <rect x="-3" y="-6" width="64" height="9" rx="3" fill="#3e6877" />
      </g>
      <path d="M216 60 V 88 M264 60 V 88" stroke="#244a31" strokeWidth="1.5" />
      <rect x="196" y="88" width="88" height="30" rx="3" fill="#fbf8ec" stroke="#cdbf9d" />
      <text className="gl-sign" x="240" y="101" textAnchor="middle">RUKANGA</text>
      <text className="gl-sign is-sm" x="240" y="112" textAnchor="middle">tree nursery · est. 2021</text>
      {rows.map((row) => {
        const step = (row.x1 - row.x0) / (row.c - 1);
        return (
          <g key={row.y}>
            <rect x={row.x0 - row.r * 1.6} y={row.y + row.r * 1.1} width={row.x1 - row.x0 + row.r * 3.2} height={row.r * 0.9} rx="2" fill="#a88a5f" opacity="0.55" />
            <rect x={row.x0 - row.r * 1.6} y={row.y - row.r * 0.3} width={row.x1 - row.x0 + row.r * 3.2} height={row.r * 1.7} rx="2" fill="#7a5c3c" />
            <rect x={row.x0 - row.r * 1.6} y={row.y - row.r * 0.3} width={row.x1 - row.x0 + row.r * 3.2} height={row.r * 0.45} rx="1" fill="#5d4530" />
            {Array.from({ length: row.c }, (_, i) => {
              const x = row.x0 + i * step;
              return (
                <g key={i}>
                  <path d={`M ${n(x)} ${n(row.y)} V ${n(row.y - row.r * 1.8)}`} stroke="#4a7a3c" strokeWidth={n(row.r * 0.28)} />
                  <ellipse cx={n(x - row.r * 0.6)} cy={n(row.y - row.r * 1.7)} rx={n(row.r * 0.7)} ry={n(row.r * 0.38)} fill="#5f9b4f" transform={`rotate(-28 ${n(x - row.r * 0.6)} ${n(row.y - row.r * 1.7)})`} />
                  <ellipse cx={n(x + row.r * 0.6)} cy={n(row.y - row.r * 2)} rx={n(row.r * 0.72)} ry={n(row.r * 0.38)} fill="#74b061" transform={`rotate(24 ${n(x + row.r * 0.6)} ${n(row.y - row.r * 2)})`} />
                </g>
              );
            })}
          </g>
        );
      })}
      {([[64, 352, 'Melia volkensii', '14 Aug'], [300, 356, 'Croton megalocarpus', '2 Sep']] as const).map(([x, y, t, d]) => (
        <g key={t}>
          <path d={`M ${x + 10} ${y + 30} V ${y}`} stroke="#6b5640" strokeWidth="2.5" />
          <rect x={x} y={y - 22} width={t.length * 6.4 + 18} height="30" rx="3" fill="#fbf8ec" stroke="#cdbf9d" />
          <text className="gl-tag-t" x={x + 9} y={y - 9}>{t}</text>
          <text className="gl-tag-d" x={x + 9} y={y + 2}>sown {d}</text>
        </g>
      ))}
      <g transform="translate(410 330)" fill="none" stroke="#3b5f6e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-18 0 h 30 l 4 -26 h -38 z" fill="#7fa9b6" />
        <path d="M16 -20 l 16 -16 M -14 -26 c 0 -14 22 -14 22 0" />
      </g>
    </svg>
  );
}

// ── Leaf glyphs for the species table ──────────────────────────────────
export function Leaf({ kind }: { kind: 'pinnate' | 'oval' | 'palm' | 'mangrove' | 'oak' }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {kind === 'pinnate' && <g {...p}><path d="M16 30 V5" /><ellipse cx="16" cy="5.5" rx="2" ry="3.4" />{[10, 15.5, 21].map((y) => <g key={y}><ellipse cx="11" cy={y} rx="4.2" ry="1.9" transform={`rotate(-24 11 ${y})`} /><ellipse cx="21" cy={y} rx="4.2" ry="1.9" transform={`rotate(24 21 ${y})`} /></g>)}</g>}
      {kind === 'oval' && <g {...p}><path d="M16 29 V 22 M16 22 C 6 18, 7 7, 16 3 C 25 7, 26 18, 16 22 Z M16 22 V 7 M16 16 l -4 -3 M16 12 l 4 -3 M16 18 l 4 -3" /></g>}
      {kind === 'palm' && <g {...p}><path d="M16 29 C 16 20, 17 12, 22 4" />{[[18, 18], [19, 13], [20.5, 9]].map(([x, y]) => <path key={y} d={`M${x} ${y} l -9 -2 M${x} ${y} l 8 -5`} />)}</g>}
      {kind === 'mangrove' && <g {...p}><path d="M16 4 V 20 M16 20 C 12 22, 9 25, 7 29 M16 20 C 20 22, 23 25, 25 29 M16 20 V 29 M16 9 c -6 -2 -9 1 -10 4 c 5 1 8 0 10 -4 M16 12 c 6 -2 9 1 10 4 c -5 1 -8 0 -10 -4" /></g>}
      {kind === 'oak' && <g {...p}><path d="M16 29 V 24 M16 24 C 11 24, 13 20, 9 19 C 12 17, 9 14, 12 12 C 10 9, 13 6, 16 4 C 19 6, 22 9, 20 12 C 23 14, 20 17, 23 19 C 19 20, 21 24, 16 24 Z M16 24 V 8" /></g>}
    </svg>
  );
}
