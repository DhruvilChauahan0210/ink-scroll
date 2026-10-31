/**
 * Geometry for the example drawings — the same helpers the homepage's
 * use-case art is built from (components/home/art/usecase-art.tsx), so the
 * examples share its line quality. Fixed numbers only: server and client
 * render identical markup.
 */

export type P = [number, number];

export const n = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1));
export const pt = (p: P) => `${n(p[0])} ${n(p[1])}`;

/** Centripetal Catmull–Rom through `pts`, as one smooth path. */
export function smooth(pts: P[]): string {
  const a = 0.5;
  let d = `M ${pt(pts[0])}`;
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
    const b1: P = [0, 0];
    const b2: P = [0, 0];
    for (let k = 0; k < 2; k++) {
      b1[k] = (d1a * d1a * p2[k] - d2a * d2a * p0[k] + (2 * d1a * d1a + 3 * d1a * d2a + d2a * d2a) * p1[k]) / (3 * d1a * (d1a + d2a));
      b2[k] = (d3a * d3a * p1[k] - d2a * d2a * p3[k] + (2 * d3a * d3a + 3 * d3a * d2a + d2a * d2a) * p2[k]) / (3 * d3a * (d3a + d2a));
    }
    d += ` C ${pt(b1)} ${pt(b2)} ${pt(p2)}`;
  }
  return d;
}

export const line = (a: P, b: P) => `M ${pt(a)} L ${pt(b)}`;
export const poly = (pts: P[], close = false) => `M ${pts.map(pt).join(' L ')}${close ? ' Z' : ''}`;

/** A circle as one path, starting at `start` radians, so it inks as one stroke. */
export function circle(cx: number, cy: number, r: number, start = -Math.PI / 2): string {
  const a = [cx + r * Math.cos(start), cy + r * Math.sin(start)] as P;
  const b = [cx - r * Math.cos(start), cy - r * Math.sin(start)] as P;
  return `M ${pt(a)} A ${n(r)} ${n(r)} 0 1 1 ${pt(b)} A ${n(r)} ${n(r)} 0 1 1 ${pt(a)}`;
}
/** A dot: a tiny circle drawn with a fat stroke (class uc-dot), so it inks in too. */
export const dot = (cx: number, cy: number) => circle(cx, cy, 0.9, Math.PI / 2);

/** Rounded rectangle as one path, starting top-left, clockwise. */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const R = Math.min(r, w / 2, h / 2);
  return [
    `M ${n(x + R)} ${n(y)}`,
    `H ${n(x + w - R)}`, `A ${n(R)} ${n(R)} 0 0 1 ${n(x + w)} ${n(y + R)}`,
    `V ${n(y + h - R)}`, `A ${n(R)} ${n(R)} 0 0 1 ${n(x + w - R)} ${n(y + h)}`,
    `H ${n(x + R)}`, `A ${n(R)} ${n(R)} 0 0 1 ${n(x)} ${n(y + h - R)}`,
    `V ${n(y + R)}`, `A ${n(R)} ${n(R)} 0 0 1 ${n(x + R)} ${n(y)}`, 'Z',
  ].join(' ');
}

/** Orthogonal polyline with rounded corners of radius `r`. */
export function elbow(input: P[], r: number): string {
  // Repeated points (a connector that runs straight) would divide by zero below.
  const pts = input.filter((p, i) => i === 0 || Math.hypot(p[0] - input[i - 1][0], p[1] - input[i - 1][1]) > 0.01);
  if (pts.length < 2) return `M ${pt(input[0])}`;
  let d = `M ${pt(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const p1: P = [b[0] - ((b[0] - a[0]) / l1) * rr, b[1] - ((b[1] - a[1]) / l1) * rr];
    const p2: P = [b[0] + ((c[0] - b[0]) / l2) * rr, b[1] + ((c[1] - b[1]) / l2) * rr];
    d += ` L ${pt(p1)} Q ${pt(b)} ${pt(p2)}`;
  }
  return `${d} L ${pt(pts[pts.length - 1])}`;
}

/** An open arrowhead whose tip sits at `tip`, pointing r/l/u/d. */
export function arrowHead(tip: P, dir: 'r' | 'l' | 'u' | 'd', s = 4.2): string {
  const [x, y] = tip;
  const v: Record<typeof dir, [P, P]> = {
    r: [[x - s, y - s * 0.8], [x - s, y + s * 0.8]],
    l: [[x + s, y - s * 0.8], [x + s, y + s * 0.8]],
    u: [[x - s * 0.8, y + s], [x + s * 0.8, y + s]],
    d: [[x - s * 0.8, y - s], [x + s * 0.8, y - s]],
  };
  const [a, b] = v[dir];
  return `M ${pt(a)} L ${pt(tip)} L ${pt(b)}`;
}

/** Tick marks along a horizontal line, for rulers and axes. */
export function ticks(x0: number, x1: number, y: number, count: number, len: number): string {
  let d = '';
  for (let i = 0; i <= count; i++) {
    const x = x0 + ((x1 - x0) * i) / count;
    d += `M ${n(x)} ${n(y)} V ${n(y + len)} `;
  }
  return d.trim();
}
