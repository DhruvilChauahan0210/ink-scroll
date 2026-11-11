/**
 * The generator's starting shapes: original drawings on a 200 × 200 grid,
 * each written the way a drawing tool might write it, with a different mix
 * of commands (arcs, H and V, relative lines, quadratics with T, smooth
 * cubics with S, several pieces), so every preset exercises a different part
 * of path-morph.ts.
 */

export type Preset = { key: string; name: string; d: string };

const f1 = (n: number) => String(Math.round(n * 10) / 10);

/** A star with `n` points, outer radius `r1`, inner `r2`, first point straight up. */
function star(cx: number, cy: number, r1: number, r2: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`);
  }
  return `M${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(' ')} Z`;
}

export const PRESETS: readonly Preset[] = [
  // Two half arcs, as a <circle> converts.
  { key: 'circle', name: 'Circle', d: 'M176 100 A76 76 0 1 1 24 100 A76 76 0 1 1 176 100 Z' },
  // H and V, closed by Z.
  { key: 'square', name: 'Square', d: 'M34 34 H166 V166 H34 Z' },
  // Relative lines and quarter arcs.
  { key: 'rounded', name: 'Rounded square', d: 'M68 30 h64 a38 38 0 0 1 38 38 v64 a38 38 0 0 1 -38 38 h-64 a38 38 0 0 1 -38 -38 v-64 a38 38 0 0 1 38 -38 z' },
  { key: 'triangle', name: 'Triangle', d: 'M100 24 L176 162 L24 162 Z' },
  { key: 'star', name: 'Star', d: star(100, 106, 82, 34, 5) },
  { key: 'heart', name: 'Heart', d: 'M100 170 C66 144 24 116 24 76 C24 50 44 32 68 32 C84 32 95 41 100 54 C105 41 116 32 132 32 C156 32 176 50 176 76 C176 116 134 144 100 170 Z' },
  // Relative c, then smooth s: each first control mirrors the last.
  { key: 'blob', name: 'Blob', d: 'M102 26 c40 0 72 26 72 68 s-22 52 -38 68 s-46 18 -70 4 s-42 -40 -38 -76 s38 -64 74 -64 z' },
  // Cubics and one arc.
  { key: 'drop', name: 'Drop', d: 'M100 22 C100 22 154 86 154 122 A54 54 0 0 1 46 122 C46 86 100 22 100 22 Z' },
  { key: 'arrow', name: 'Arrow', d: 'M24 82 h92 v-36 l60 54 l-60 54 v-36 h-92 z' },
  // Open: a quadratic, then two T that mirror it.
  { key: 'wave', name: 'Wave', d: 'M16 100 Q44 52 72 100 T128 100 T184 100' },
  { key: 'check', name: 'Check', d: 'M40 104 L84 146 L162 60' },
  // Three pieces, then two: the menu-to-close icon.
  { key: 'menu', name: 'Menu', d: 'M40 64 H160 M40 100 H160 M40 136 H160' },
  { key: 'close', name: 'Close', d: 'M52 52 L148 148 M148 52 L52 148' },
];

export const presetOf = (key: string): Preset => PRESETS.find((p) => p.key === key) ?? PRESETS[0];

/** The pair the generator opens with, and the figure draws. */
export const DEFAULT_PAIR = { from: 'circle', to: 'star' } as const;
