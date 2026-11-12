import { cdnModule, htmlFile, withSource, type CodeLang, type ReactProject } from '@/lib/tool-export';
import {
  decimalsFor, fmt, nextSeed, pathDataLines, type BlobGeometry, type BlobSettings,
} from './blob';

/**
 * The generator's output, written from the same geometry the preview shows.
 * Every file stands on its own: the SVG opens as it is, the React component
 * needs nothing but React, and the scrollDraw call passes no options because
 * the drawing needs none of scrollDraw's defaults changed.
 *
 * Every listing a visitor copies or downloads starts with the site's source
 * line, except Path d: that is a value for a d attribute, and a comment line
 * would break it there.
 */

export const SLUG = 'svg-blob-generator';

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

/** The recipe and the path, once, for the components that draw it. */
const blobConst = (s: BlobSettings, g: BlobGeometry) => [`// ${recipe(s)}`, `const BLOB = '${g.d}';`];

/** The blob as made, as a component: typed and exported in Blob.tsx, plain JSX in the React project. */
function blobComponent(s: BlobSettings, g: BlobGeometry, ts: boolean): string[] {
  const attrs = s.mode === 'outline'
    ? `fill="none" stroke="${s.color}" strokeWidth={${r(s.line)}}`
    : `fill="${s.color}"`;
  return [
    ts ? 'export function Blob(props: SVGProps<SVGSVGElement>) {' : 'function Blob(props) {',
    '  return (',
    `    <svg viewBox="0 0 ${g.size} ${g.size}" width={${g.size}} height={${g.size}} aria-hidden="true" {...props}>`,
    `      <path d={BLOB} ${attrs} />`,
    '    </svg>',
    '  );',
    '}',
  ];
}

export function reactCode(s: BlobSettings, g: BlobGeometry): string {
  return ["import type { SVGProps } from 'react';", '', ...blobConst(s, g), '', ...blobComponent(s, g, true)].join('\n');
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

const LANG: Record<Exclude<Tab, 'd'> | DrawTab, CodeLang> = { svg: 'svg', react: 'tsx', css: 'css', js: 'js' };

/** The SVG file as it is shown, copied and downloaded: the source line, then the file. */
export const svgFile = (s: BlobSettings, g: BlobGeometry) => withSource(svgCode(s, g), SLUG, 'svg');

/** One output tab's listing, as it is shown and copied. */
export function codeFor(tab: Tab, s: BlobSettings, g: BlobGeometry, next: BlobGeometry | null): string {
  if (tab === 'd') return pathCode(s, g, next);
  if (tab === 'svg') return svgFile(s, g);
  return withSource(tab === 'react' ? reactCode(s, g) : cssCode(s, g), SLUG, LANG[tab]);
}

// ── Draw it ─────────────────────────────────────────────────────────────────

/** The drawn outline's markup: a line drawing animates the stroke, so it always has one. */
function drawAttrs(s: BlobSettings) {
  return { stroke: s.color, width: r(s.line) };
}

/** The outline scrollDraw draws, in the element it is pointed at: the JS tab's markup and the HTML file's. */
function drawMarkup(s: BlobSettings, g: BlobGeometry): string[] {
  const a = drawAttrs(s);
  return [
    '<div id="blob">',
    `  <svg viewBox="0 0 ${g.size} ${g.size}" width="${g.size}" height="${g.size}">`,
    `    <path d="${g.d}" fill="none" stroke="${a.stroke}" stroke-width="${a.width}"/>`,
    '  </svg>',
    '</div>',
  ];
}

const DRAW_CALL = ['// Draws the outline as #blob scrolls through the window.', "scrollDraw('#blob');"];

export function drawJs(s: BlobSettings, g: BlobGeometry): string {
  return [
    ...drawMarkup(s, g).map((l) => `// ${l}`),
    '',
    "import { scrollDraw } from 'svg-scroll-draw';",
    '',
    ...DRAW_CALL,
  ].join('\n');
}

/** The drawn outline as a component: exported in DrawnBlob.tsx, local in the React project. */
function drawnComponent(s: BlobSettings, g: BlobGeometry, exported: boolean): string[] {
  const a = drawAttrs(s);
  return [
    '// Draws the outline as it scrolls through the window.',
    `${exported ? 'export ' : ''}function DrawnBlob() {`,
    '  return (',
    '    <ScrollDraw>',
    `      <svg viewBox="0 0 ${g.size} ${g.size}" width={${g.size}} height={${g.size}} aria-hidden="true">`,
    `        <path d={BLOB} fill="none" stroke="${a.stroke}" strokeWidth={${a.width}} />`,
    '      </svg>',
    '    </ScrollDraw>',
    '  );',
    '}',
  ];
}

export function drawReact(s: BlobSettings, g: BlobGeometry): string {
  return ["import { ScrollDraw } from 'svg-scroll-draw/react';", '', ...blobConst(s, g), '', ...drawnComponent(s, g, true)].join('\n');
}

/** One Draw it tab's listing, as it is shown and copied. */
export function drawCodeFor(tab: DrawTab, s: BlobSettings, g: BlobGeometry): string {
  return withSource(tab === 'js' ? drawJs(s, g) : drawReact(s, g), SLUG, LANG[tab]);
}

// ── Run it: the blob and its drawing, outside this page ─────────────────────

export const RUN_TITLE = 'SVG blob drawn on scroll';
/** The HTML download's name: the recipe, like the SVG's. */
export const runName = (s: BlobSettings) => `blob-${s.seed}-${s.points}p.html`;

const RUN_CSS = `:root { color-scheme: light dark; }
body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
@media (prefers-color-scheme: dark) {
  body { color: #e4e4e7; background: #111113; }
}
/* A screen above the drawing and more below it: room to scroll it in from
   the bottom of the window and out past the top. */
.intro, .outro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 48px 24px;
  text-align: center;
}
.outro { min-height: 120vh; }
h1 { margin: 0; font-size: 1.5rem; }
p { margin: 0; max-width: 36rem; }
.drawn { padding: 0 24px; }
svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }`;

const runIntro = (s: BlobSettings) =>
  `Seed ${s.seed}, ${s.points} points, randomness ${r(s.randomness)}: the blob as the SVG file draws it. Scroll down and scrollDraw draws its outline.`;
const RUN_OUTRO = 'Scroll back up and it undraws.';

const indent = (lines: string[], n: number) => lines.map((l) => (l ? ' '.repeat(n) + l : l));

/**
 * A complete page for the current settings: the SVG tab's blob, then a
 * screen down, the Draw it outline and its scrollDraw call, loading the
 * library from jsDelivr.
 */
export function htmlPage(s: BlobSettings, g: BlobGeometry, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: RUN_TITLE,
    css: RUN_CSS,
    body: [
      '<header class="intro">',
      `  <h1>${RUN_TITLE}</h1>`,
      `  <p>${runIntro(s)}</p>`,
      ...indent(svgCode(s, g).trimEnd().split('\n'), 2),
      '</header>',
      '<section class="drawn">',
      ...indent(drawMarkup(s, g), 2),
      '</section>',
      '<footer class="outro">',
      `  <p>${RUN_OUTRO}</p>`,
      '</footer>',
    ].join('\n'),
    script: [`import { scrollDraw } from '${cdnModule(version)}';`, '', ...DRAW_CALL].join('\n'),
  });
}

/** The same page as a Vite + React project: both generated components, in plain JSX, in an App. */
export function reactProject(s: BlobSettings, g: BlobGeometry, version: string): Omit<ReactProject, 'title'> {
  const app = [
    "import { ScrollDraw } from 'svg-scroll-draw/react';",
    '',
    ...blobConst(s, g),
    '',
    "// The blob as made: the React tab's Blob, in plain JSX.",
    ...blobComponent(s, g, false),
    '',
    ...drawnComponent(s, g, false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    `        <h1>${RUN_TITLE}</h1>`,
    `        <p>${runIntro(s)}</p>`,
    '        <Blob />',
    '      </header>',
    '      <section className="drawn">',
    '        <DrawnBlob />',
    '      </section>',
    '      <footer className="outro">',
    `        <p>${RUN_OUTRO}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(RUN_CSS, SLUG, 'css'), version };
}

/** The file name for the SVG download: the recipe, so it can be made again. */
export const downloadName = (s: BlobSettings) => `blob-${s.seed}-${s.points}p.svg`;
