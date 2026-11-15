// Lines that follow a field of directions and never touch. Each new line
// starts one spacing away from an old one, and stops before it comes closer
// than half a spacing to anything already drawn.
export function flowField({ size = 1000, radius = 455, spacing = 7 } = {}) {
  const c = size / 2;
  // A drift from two slow waves, and a swirl round the centre. Blend them as
  // directions, not angles: atan2 jumps from π to −π on the left-hand side,
  // and adding angles across that jump draws a seam straight through the art.
  const angle = (x, y) => {
    const drift = Math.sin(x / 150) * 2 + Math.cos(y / 170) * 2;
    const swirl = Math.atan2(y - c, x - c) + Math.PI / 2;
    return Math.atan2(Math.sin(drift) + 0.5 * Math.sin(swirl), Math.cos(drift) + 0.5 * Math.cos(swirl));
  };

  // Every point drawn so far, filed by a grid cell one spacing wide.
  const grid = new Map();
  const cellOf = (x, y) => [Math.floor(x / spacing), Math.floor(y / spacing)];
  const inside = (x, y) => Math.hypot(x - c, y - c) < radius;
  const free = (x, y, d) => {
    const [cx, cy] = cellOf(x, y);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        for (const [px, py] of grid.get(`${cx + i},${cy + j}`) ?? []) {
          if ((px - x) ** 2 + (py - y) ** 2 < d * d) return false;
        }
      }
    }
    return true;
  };

  // Walk the field both ways from a seed point, 1.6 units a step.
  const trace = (sx, sy) => {
    const half = (dir) => {
      const out = [];
      let x = sx;
      let y = sy;
      for (let k = 0; k < 700; k++) {
        const a = angle(x, y);
        x += Math.cos(a) * 1.6 * dir;
        y += Math.sin(a) * 1.6 * dir;
        if (!inside(x, y) || !free(x, y, spacing / 2)) break;
        out.push([x, y]);
      }
      return out;
    };
    return [...half(-1).reverse(), [sx, sy], ...half(1)];
  };

  const lines = [];
  const seeds = [[c, c]];
  while (seeds.length) {
    const [sx, sy] = seeds.pop();
    if (!inside(sx, sy) || !free(sx, sy, spacing)) continue;
    const line = trace(sx, sy);
    if (line.length < 14) continue;
    for (const [x, y] of line) {
      const key = cellOf(x, y).join();
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push([x, y]);
    }
    // New seeds one spacing to either side, every few steps along the line.
    for (let i = 0; i < line.length; i += 6) {
      const [x, y] = line[i];
      const a = angle(x, y) + Math.PI / 2;
      seeds.push([x + Math.cos(a) * spacing, y + Math.sin(a) * spacing]);
      seeds.push([x - Math.cos(a) * spacing, y - Math.sin(a) * spacing]);
    }
    lines.push(line);
  }
  return lines;
}
