import {
  decimalsFor, fmt, nextSeed, pathDataLines, type BlobGeometry, type BlobSettings,
} from './blob';

/**
 * The generator's output, written from the same geometry the preview shows.
 * Every file stands on its own: the SVG opens as it is, the React component
 * needs nothing but React, and the scrollDraw call passes no options because
 * the drawing needs none of scrollDraw's defaults changed.
 */

export type Tab = 'svg' | 'd' | 'react' | 'css';
export const TABS: readonly [Tab, string, string][] = [
  ['svg', 'SVG', 'blob.svg'],
  ['d', 'Path d', 'blob.txt'],
  ['react', 'React', 'Blob.tsx'],
  ['css', 'CSS clip-path', 'blob.css'],
];
export type DrawTab = 'js' | 'react';
export const DRAW_TABS: readonly [DrawTab, string, string][] = [
  ['js', 'JavaScript', 'main.js'],
  ['react', 'React', 'DrawnBlob.tsx'],
];
/** Everything the tool writes: four files, and the drawing's two. */
export const OUTPUT_COUNT = TABS.length + DRAW_TABS.length;

const r = (n: number) => fmt(n, 2);

/** What made this blob, as a comment: enough to make it again here. */
export function recipe(s: BlobSettings): string {
  return `seed ${s.seed} · ${s.points} points · randomness ${r(s.randomness)} · ${s.size} × ${s.size}`;
}

/** The paint attributes, as SVG attributes. */
function paint(s: BlobSettings, outline: boolean): string {
  return outline
    ? `fill="none" stroke="${s.color}" stroke-width="${r(s.line)}"`
    : `fill="${s.color}"`;
}

export function svgCode(s: BlobSettings, g: BlobGeometry): string {
  const lines = pathDataLines(g.cubics, decimalsFor(g.size));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.size} ${g.size}" width="${g.size}" height="${g.size}">
  <!-- ${recipe(s)} -->
  <path ${paint(s, s.mode === 'outline')} d="${lines[0]}
    ${lines.slice(1, -1).join('\n    ')}
    Z"/>
</svg>
`;
}

/** The bare path data; with the morph on, the next seed's too: same commands, number for number. */
export function pathCode(s: BlobSettings, g: BlobGeometry, next: BlobGeometry | null): string {
  if (!next) return g.d;
  return `// from · ${recipe(s)}
${g.d}

// to · seed ${nextSeed(s.seed)}, the same ${s.points} points: M, ${s.points} × C, Z in both
${next.d}`;
}

export function reactCode(s: BlobSettings, g: BlobGeometry): string {
  const attrs = s.mode === 'outline'
    ? `fill="none" stroke="${s.color}" strokeWidth={${r(s.line)}}`
    : `fill="${s.color}"`;
  return `import type { SVGProps } from 'react';

// ${recipe(s)}
const BLOB = '${g.d}';

export function Blob(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 ${g.size} ${g.size}" width={${g.size}} height={${g.size}} aria-hidden="true" {...props}>
      <path d={BLOB} ${attrs} />
    </svg>
  );
}`;
}

export function cssCode(s: BlobSettings, g: BlobGeometry): string {
  return `/* ${recipe(s)}
   path() counts in px of the element's own box and does not scale:
   keep the element ${g.size} × ${g.size}, or set Size and copy again. */
.blob {
  width: ${g.size}px;
  height: ${g.size}px;
  background: ${s.color};
  clip-path: path('${g.d}');
}`;
}

export function codeFor(tab: Tab, s: BlobSettings, g: BlobGeometry, next: BlobGeometry | null): string {
  if (tab === 'svg') return svgCode(s, g);
  if (tab === 'd') return pathCode(s, g, next);
  if (tab === 'react') return reactCode(s, g);
  return cssCode(s, g);
}

// ── Draw it ─────────────────────────────────────────────────────────────────

/** The drawn outline's markup: a line drawing animates the stroke, so it always has one. */
function drawAttrs(s: BlobSettings) {
  return { stroke: s.color, width: r(s.line) };
}

export function drawJs(s: BlobSettings, g: BlobGeometry): string {
  const a = drawAttrs(s);
  return `// <div id="blob">
//   <svg viewBox="0 0 ${g.size} ${g.size}" width="${g.size}" height="${g.size}">
//     <path d="${g.d}" fill="none" stroke="${a.stroke}" stroke-width="${a.width}"/>
//   </svg>
// </div>

import { scrollDraw } from 'svg-scroll-draw';

// Draws the outline as #blob scrolls through the window.
scrollDraw('#blob');`;
}

export function drawReact(s: BlobSettings, g: BlobGeometry): string {
  const a = drawAttrs(s);
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

// ${recipe(s)}
const BLOB = '${g.d}';

// Draws the outline as it scrolls through the window.
export function DrawnBlob() {
  return (
    <ScrollDraw>
      <svg viewBox="0 0 ${g.size} ${g.size}" width={${g.size}} height={${g.size}} aria-hidden="true">
        <path d={BLOB} fill="none" stroke="${a.stroke}" strokeWidth={${a.width}} />
      </svg>
    </ScrollDraw>
  );
}`;
}

export function drawCodeFor(tab: DrawTab, s: BlobSettings, g: BlobGeometry): string {
  return tab === 'js' ? drawJs(s, g) : drawReact(s, g);
}

/** The file name for the SVG download: the recipe, so it can be made again. */
export const downloadName = (s: BlobSettings) => `blob-${s.seed}-${s.points}p.svg`;
