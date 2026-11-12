import { cdnModule, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * What the path editor writes for the path on screen: the SVG with its
 * <path>, the scrollDraw call that draws it on scroll, the same as a React
 * component, and a page that runs on its own. Options are written only when
 * they differ from scrollDraw's defaults (packages/svg-scroll-draw/src/core/
 * engine.ts, buildEngine: fade false, once false).
 */

export const SLUG = 'svg-path-editor';

export type Settings = {
  d: string;
  viewBox: string;
  strokeWidth: number;
  round: boolean;
  fade: boolean;
  once: boolean;
};

export const TAB_COUNT = 3;

/** The path's attributes, as HTML. */
function attrs(s: Settings): string[] {
  const a = [`d="${s.d}"`, 'fill="none"', 'stroke="currentColor"', `stroke-width="${s.strokeWidth}"`];
  if (s.round) a.push('stroke-linecap="round"', 'stroke-linejoin="round"');
  return a;
}

function svgMarkup(s: Settings, indent: string, extra = ''): string[] {
  return [
    `${indent}<svg${extra} viewBox="${s.viewBox}" aria-hidden="true">`,
    `${indent}  <path`,
    ...attrs(s).map((a) => `${indent}    ${a}`),
    `${indent}  />`,
    `${indent}</svg>`,
  ];
}

/** drawing.svg: the path on its own, in an SVG that fits it. */
export function svgFile(s: Settings): string {
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}">`,
    `  <path`,
    ...attrs(s).map((a) => `    ${a}`),
    `  />`,
    `</svg>`,
  ];
  return withSource(lines.join('\n'), SLUG, 'svg');
}

function options(s: Settings): string[] {
  const o: string[] = [];
  if (s.fade) o.push('fade: true');
  if (s.once) o.push('once: true');
  return o;
}

function call(s: Settings, from: string): string[] {
  const o = options(s);
  return [
    `import { scrollDraw } from '${from}';`,
    '',
    `// Draws the line as #drawing crosses the screen: from its top at the`,
    `// bottom of the window to its bottom at the top (the default trigger).`,
    o.length ? `scrollDraw('#drawing', { ${o.join(', ')} });` : `scrollDraw('#drawing');`,
  ];
}

const DRAWING_CSS = `#drawing svg {
  display: block;
  width: min(100%, 640px);
  height: auto;
  margin: 0 auto;
}`;

/** index.html for the JavaScript tab. */
export function jsMarkup(s: Settings): string {
  return withSource(['<div id="drawing">', ...svgMarkup(s, '  '), '</div>', '', '<style>', DRAWING_CSS, '</style>'].join('\n'), SLUG, 'html');
}

/** main.js: the scrollDraw call. */
export function jsCode(s: Settings): string {
  return withSource(call(s, 'svg-scroll-draw').join('\n'), SLUG, 'js');
}

function reactProps(s: Settings): string {
  const p = [s.fade ? ' fade' : '', s.once ? ' once' : ''].join('');
  return p;
}

function reactBody(s: Settings, exported: boolean): string[] {
  const path = [
    '          d={D}',
    '          fill="none"',
    '          stroke="currentColor"',
    `          strokeWidth={${s.strokeWidth}}`,
    ...(s.round ? ['          strokeLinecap="round"', '          strokeLinejoin="round"'] : []),
  ];
  return [
    `const D = '${s.d}';`,
    '',
    `${exported ? 'export default ' : ''}function Drawing() {`,
    '  return (',
    `    <ScrollDraw${reactProps(s)}>`,
    `      <svg viewBox="${s.viewBox}" aria-hidden="true" style={{ display: 'block', width: '100%', height: 'auto' }}>`,
    '        <path',
    ...path,
    '        />',
    '      </svg>',
    '    </ScrollDraw>',
    '  );',
    '}',
  ];
}

/** Drawing.jsx for the React tab. */
export function reactCode(s: Settings): string {
  return withSource([`import { ScrollDraw } from 'svg-scroll-draw/react';`, '', ...reactBody(s, true)].join('\n'), SLUG, 'jsx');
}

// ── Files that run on their own ──────────────────────────────────────────────

const PAGE_CSS = `:root { color-scheme: light dark; }
body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
@media (prefers-color-scheme: dark) {
  body { color: #e4e4e7; background: #111113; }
}
.intro, .outro {
  display: grid;
  place-content: center;
  padding: 0 24px;
  text-align: center;
}
/* A screen above and one and a half below: scrollDraw's default window runs
   from the drawing's top at the bottom of the screen to its bottom at the top. */
.intro { min-height: 100vh; }
.outro { min-height: 150vh; }
#drawing {
  padding: 10vh 24px;
}
${DRAWING_CSS}`;

const intro = (s: Settings) => `Scroll down: the path draws itself as it crosses the screen${s.once ? ', and stays drawn' : ', and undraws as you scroll back'}.`;

/** A complete page for the visitor's path, loading the library from jsDelivr. */
export function htmlPage(s: Settings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'SVG path drawn on scroll',
    css: PAGE_CSS,
    body: [
      '<header class="intro">',
      '  <h1>SVG path drawn on scroll</h1>',
      `  <p>${intro(s)}</p>`,
      '</header>',
      '<div id="drawing">',
      ...svgMarkup(s, '  '),
      '</div>',
      '<footer class="outro">',
      '  <p>That was one path, drawn by scrollDraw.</p>',
      '</footer>',
    ].join('\n'),
    script: call(s, cdnModule(version)).join('\n'),
  });
}

/** The same page as a Vite + React project. */
export function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const app = [
    `import { ScrollDraw } from 'svg-scroll-draw/react';`,
    '',
    ...reactBody(s, false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    '        <h1>SVG path drawn on scroll</h1>',
    `        <p>${intro(s)}</p>`,
    '      </header>',
    '      <div id="drawing">',
    '        <Drawing />',
    '      </div>',
    '      <footer className="outro">',
    '        <p>That was one path, drawn by scrollDraw.</p>',
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(PAGE_CSS, SLUG, 'css'), version };
}
