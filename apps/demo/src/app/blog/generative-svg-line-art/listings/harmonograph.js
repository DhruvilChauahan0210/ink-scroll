import { random } from './random.js';

// Two damped pendulums: x and y are each the sum of two sines that die away.
export function harmonograph(seed, size = 1000) {
  const rand = random(seed);
  // Ratios close to whole numbers make the figure turn slowly as it shrinks.
  const f = [2, 3, 3, 2].map((n) => n + rand() * 0.02);
  const p = f.map(() => rand() * Math.PI);
  const damp = 0.0042 + rand() * 0.0015;
  const r = size * 0.23;
  const points = [];
  // Small steps keep the wide outer loops round. Stop when the swing is a
  // fifth of what it was, or the middle fills in solid.
  for (let t = 0; ; t += 0.05) {
    const e = Math.exp(-damp * t);
    if (e < 0.2) break;
    points.push([
      size / 2 + r * e * (Math.sin(f[0] * t + p[0]) + Math.sin(f[1] * t + p[1])),
      size / 2 + r * e * (Math.sin(f[2] * t + p[2]) + Math.sin(f[3] * t + p[3])),
    ]);
  }
  return 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
}
