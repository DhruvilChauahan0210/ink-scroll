import { memo, type ReactNode, type Ref } from 'react';
import { PARALLAX_LAYERS, type LayerKey } from '@/data/parallax';

/**
 * The generator's scene: four line-drawn layers, back to front — a sky with
 * the sun, clouds and birds, a far mountain ridge, near hills with trees, and
 * the ground with grass and a fence. Original drawing, made here from a few
 * sine curves and a seeded random sequence, so the server and the browser draw
 * the same thing.
 *
 * Each layer is a div as big as the scene (`inset: 0`), the element
 * scrollParallax moves, holding an SVG on the scene's 960 × 320 grid. The art
 * runs far past that grid on every side (the SVG overflows, the scene clips),
 * because a layer travels a fraction of its own size: a ridge that moves up
 * shows more of what was drawn below it, never a gap, and a layer moving on
 * axis x slides in more of the ridge from the side.
 */

const W = 960;
const H = 320;
/** How far the art runs past the grid, so a layer never runs out at the sliders' ±1, on either axis. */
const X0 = -1600;
const X1 = 2560;
const DEEP = 1400;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A small seeded random sequence (an LCG), so every render draws the same scene. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function ridge(f: (x: number) => number, step: number): string {
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += step) pts.push(`${x} ${r1(f(x))}`);
  return `M${pts.join('L')}`;
}

/** A ridge closed far below the grid, for the fill that hides what is behind it. */
const filled = (line: string) => `${line}L${X1} ${DEEP}L${X0} ${DEEP}Z`;

// ── Sky ──────────────────────────────────────────────────────────────────────

const SUN = { x: 650, y: 40, r: 22 };
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return `M${r1(SUN.x + c * (SUN.r + 7))} ${r1(SUN.y + s * (SUN.r + 7))}L${r1(SUN.x + c * (SUN.r + 14))} ${r1(SUN.y + s * (SUN.r + 14))}`;
}).join('');

/** A flat-bottomed cloud of width w: three arcs over the top, closed along the bottom. */
function cloud(x: number, y: number, w: number): string {
  const a = r1(0.28 * w);
  const b = r1(0.4 * w);
  const c = r1(0.32 * w);
  const up = r1(0.18 * w);
  return `M${x} ${y}a${r1(0.19 * w)} ${r1(0.19 * w)} 0 0 1 ${a} ${-up}a${r1(0.22 * w)} ${r1(0.22 * w)} 0 0 1 ${b} 0a${r1(0.19 * w)} ${r1(0.19 * w)} 0 0 1 ${c} ${up}Z`;
}

const CLOUDS = [
  [90, 84, 120], [330, 52, 88], [520, 104, 150], [870, 74, 108],
  [-1000, 80, 120], [-560, 62, 130], [-250, 94, 100], [1160, 58, 120],
  [1460, 92, 140], [1780, 64, 100], [2120, 84, 130],
].map(([x, y, w]) => cloud(x, y, w)).join('');

const BIRDS = [
  [392, 60, 1], [420, 72, 0.8], [452, 56, 0.9], [1320, 52, 1], [-420, 44, 0.9],
].map(([x, y, s]) => `M${x} ${y}q${r1(5 * s)} ${r1(-5 * s)} ${r1(10 * s)} 0q${r1(5 * s)} ${r1(-5 * s)} ${r1(10 * s)} 0`).join('');

// ── Mountains: straight-sided peaks, snow on the tall ones, hatched slopes ──

const MOUNTAINS = (() => {
  const rnd = seeded(7);
  const pts: [number, number][] = [];
  let x = X0;
  let peak = true;
  while (x <= X1 + 120) {
    pts.push([x, peak ? 80 + rnd() * 50 : 150 + rnd() * 26]);
    x += 50 + rnd() * 72;
    peak = !peak;
  }
  const line = `M${pts.map(([px, py]) => `${r1(px)} ${r1(py)}`).join('L')}`;
  const snow: string[] = [];
  const hatch: string[] = [];
  pts.forEach(([px, py], i) => {
    if (i % 2 === 1 || i === 0 || i === pts.length - 1) return;
    const [lx, ly] = pts[i - 1];
    const [rx, ry] = pts[i + 1];
    if (py < 106) {
      const t = 0.24;
      const ax = px + (lx - px) * t; const ay = py + (ly - py) * t;
      const dx = px + (rx - px) * t; const dy = py + (ry - py) * t;
      snow.push(`M${r1(ax)} ${r1(ay)}L${r1(ax + (dx - ax) * 0.34)} ${r1(Math.max(ay, dy) - 3)}L${r1(ax + (dx - ax) * 0.62)} ${r1(Math.max(ay, dy) + 4)}L${r1(dx)} ${r1(dy)}`);
    }
    // Shade the right-hand slope: short strokes parallel to the left one.
    const len = Math.hypot(lx - px, ly - py) || 1;
    const ux = (lx - px) / len; const uy = (ly - py) / len;
    const side = Math.hypot(rx - px, ry - py);
    for (const t of [0.42, 0.6, 0.78]) {
      const sx = px + (rx - px) * t; const sy = py + (ry - py) * t;
      const l = side * (1 - t) * 0.5 + 4;
      hatch.push(`M${r1(sx)} ${r1(sy + 3)}L${r1(sx + ux * l)} ${r1(sy + 3 + uy * l)}`);
    }
  });
  return { line, snow: snow.join(''), hatch: hatch.join('') };
})();

// ── Hills: a rolling ridge with conifers and round trees, furrowed fields ───

const hillY = (x: number) => 178 + 9 * Math.sin(x / 97 + 1) + 6 * Math.sin(x / 41 + 2) + 3 * Math.sin(x / 23);
const HILLS = ridge(hillY, 16);
const FIELDS = [26, 52, 80].map((d) => ridge((x) => hillY(x) + d + 4 * Math.sin(x / 61), 32)).join('');
const TREES = (() => {
  const rnd = seeded(31);
  const out: string[] = [];
  for (let x = -900 + rnd() * 40; x < 1860; x += 36 + rnd() * 66) {
    const base = hillY(x) + 3;
    const h = 20 + rnd() * 18;
    if (rnd() < 0.68) {
      const w = h * 0.34;
      out.push(`M${r1(x)} ${r1(base)}V${r1(base - 6)}M${r1(x - w)} ${r1(base - 6)}L${r1(x)} ${r1(base - h)}L${r1(x + w)} ${r1(base - 6)}Z`);
    } else {
      const r = h * 0.28;
      out.push(`M${r1(x)} ${r1(base)}V${r1(base - h + 2 * r)}M${r1(x - r)} ${r1(base - h + r)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`);
    }
  }
  return out.join('');
})();

// ── Ground: a low ridge, grass, a fence, a path, stones and flowers ─────────

const groundY = (x: number) => 262 + 5 * Math.sin(x / 130) + 3 * Math.sin(x / 53 + 1);
const GROUND = ridge(groundY, 24);
const GRASS = (() => {
  const rnd = seeded(101);
  const out: string[] = [];
  // Three loose rows: along the ridge, then further down, nearer the reader.
  // Each tuft is three blades that rise from the ground and bend outward.
  for (const [lift, gap, size] of [[0, 28, 1], [30, 76, 1.3], [64, 104, 1.6]]) {
    for (let x = X0 + rnd() * gap; x < X1; x += gap + rnd() * gap) {
      if (lift && x > 380 && x < 600) continue; // the path
      const g = groundY(x) + 1 + lift + (lift ? rnd() * 12 : 0);
      const h = (6 + rnd() * 5) * size;
      const w = h * 0.5;
      // Whole units: a tuft is a few pixels across, and there are a few hundred of them.
      const q = Math.round;
      out.push(
        `M${q(x - 1)} ${q(g)}Q${q(x - 1)} ${q(g - h * 0.5)} ${q(x - w)} ${q(g - h * 0.78)}` +
        `M${q(x)} ${q(g)}Q${q(x)} ${q(g - h * 0.6)} ${q(x + w * 0.2)} ${q(g - h)}` +
        `M${q(x + 1)} ${q(g)}Q${q(x + 1)} ${q(g - h * 0.5)} ${q(x + w)} ${q(g - h * 0.72)}`,
      );
    }
  }
  return out.join('');
})();
const FENCE = [[-700, -300], [620, 940], [1400, 1800]]
  .map(([a, b]) => {
    const posts: number[] = [];
    for (let x = a; x <= b; x += 40) posts.push(x);
    const rail = (lift: number) => `M${posts.map((x) => `${x} ${r1(groundY(x) - lift)}`).join('L')}`;
    return posts.map((x) => `M${x} ${r1(groundY(x) + 2)}V${r1(groundY(x) - 26)}`).join('') + rail(10) + rail(20);
  })
  .join('');
/** A path that winds down from the ridge toward the reader, widening as it comes. */
const TRAIL = (() => {
  const top = r1(groundY(500) + 1);
  return `M494 ${top}C 476 290, 420 318, 404 360L380 720M508 ${top}C 520 292, 586 314, 590 360L620 720`;
})();
const STONES = [[372, 7], [392, 4], [612, 6], [180, 5], [1030, 5], [-120, 6], [1240, 4]]
  .map(([x, r]) => {
    const g = r1(groundY(x) + (x > 300 && x < 700 ? 52 : 12));
    return `M${x - r} ${g}a${r} ${r * 0.6} 0 0 1 ${2 * r} 0Z`;
  })
  .join('');
const FLOWERS = [[240, 30], [268, 44], [690, 36], [716, 52], [120, 58], [840, 62]]
  .map(([x, d]) => {
    const g = r1(groundY(x) + d);
    return `M${x} ${g}V${r1(g - 12)}M${x + 2.5} ${r1(g - 14.5)}a2.5 2.5 0 1 1 -5 0a2.5 2.5 0 1 1 5 0Z`;
  })
  .join('');

/** Each layer's drawing. Strokes use currentColor; the layer's class sets it. */
const ART: Record<LayerKey, ReactNode> = {
  sky: (
    <>
      <circle className="plx-sun" cx={SUN.x} cy={SUN.y} r={SUN.r} />
      <path className="plx-sun" d={RAYS} />
      <path className="plx-fill" d={CLOUDS} />
      <path d={BIRDS} />
    </>
  ),
  mountains: (
    <>
      <path className="plx-fill" d={filled(MOUNTAINS.line)} />
      <path d={MOUNTAINS.snow} />
      <path className="plx-thin" d={MOUNTAINS.hatch} />
    </>
  ),
  hills: (
    <>
      <path className="plx-fill" d={filled(HILLS)} />
      <path className="plx-thin plx-dash" d={FIELDS} />
      <path className="plx-fill" d={TREES} />
    </>
  ),
  ground: (
    <>
      <path className="plx-fill" d={filled(GROUND)} />
      <path d={TRAIL} />
      <path d={GRASS} />
      <path d={FENCE} />
      <path className="plx-fill" d={STONES} />
      <path className="plx-fill" d={FLOWERS} />
    </>
  ),
};

/**
 * The scene, its layers in stacking order, each marked `data-plx-layer` for the
 * generator to find. Memoised: the generator re-renders on every scroll frame
 * of the preview, and the drawing never changes.
 */
export const ParallaxScene = memo(function ParallaxScene({ ref, label }: { ref?: Ref<HTMLDivElement>; label: string }) {
  return (
    <div ref={ref} className="plx-scene" role="img" aria-label={label}>
      {PARALLAX_LAYERS.map(({ key }) => (
        <div key={key} className={`plx-layer plx-l-${key}`} data-plx-layer={key}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              {ART[key]}
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
});
