import { NAMED, type EasingName } from '@/data/easing';
import { cdnModule, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * What the morph generator writes: the scrollDraw call, the React component,
 * the CSS-only version and the pair itself, all from one Settings. Only
 * options that differ from scrollDraw's defaults are written
 * (packages/svg-scroll-draw/src/core/engine.ts, buildEngine): easing
 * 'linear', once false, no fillOpacity. morphTo and the trigger are always
 * there: the first is the point, the second is what the sticky layout needs.
 */

export const SLUG = 'svg-morph-generator';

export type Outline = 'whole' | 'draw';
export type Fill = 'none' | 'tint' | 'fade';

export type Settings = {
  from: string;
  to: string;
  viewBox: string;
  strokeWidth: number;
  easing: EasingName;
  outline: Outline;
  /** In draw mode, a pathLength just under the start shape's length, or null to leave it out. */
  pathLength: number | null;
  fill: Fill;
  once: boolean;
  /** `M C×20 Z`: the commands both paths now share. */
  skeleton: string;
  numbers: number;
  /** For the HTML file's one line of text, e.g. 'circle' and 'star'. */
  fromName: string;
  toName: string;
};

export const TRIGGER = { start: 'top top', end: 'bottom bottom' } as const;
export const TAB_COUNT = 4;

// ── CSS timing functions for the library's easings ─────────────────────────

/** t² and t(2 − t) exactly, as packages/svg-scroll-draw/src/core/css-easing.ts writes them. */
const QUAD_IN = 'cubic-bezier(0.333333, 0, 0.666667, 0.333333)';
const QUAD_OUT = 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)';

/** The easing as a CSS timing function: exact for the first three, linear() stops for the rest. */
export function cssTiming(e: EasingName): string {
  if (e === 'linear') return 'linear';
  if (e === 'ease-in') return QUAD_IN;
  if (e === 'ease-out') return QUAD_OUT;
  // 33 stops, as the library's native path samples ease-in-out; more for the springy ones.
  const n = e === 'ease-in-out' ? 33 : 61;
  const f = NAMED[e];
  const stops: string[] = [];
  for (let i = 0; i < n; i++) stops.push(String(Math.round(f(i / (n - 1)) * 1e4) / 1e4));
  return `linear(${stops.join(', ')})`;
}

// ── Pieces shared by the listings ────────────────────────────────────────────

const LAYOUT_CSS = `/* The section is three screens tall and the drawing sticks inside it,
   so the shape changes while the reader scrolls through. */
.morph {
  height: 300vh;
}
.morph-svg {
  position: sticky;
  top: 0;
  display: block;
  width: 100%;
  height: 100vh;
  padding: 12vh 24px;
  box-sizing: border-box;
}`;

const WHOLE_CSS = `/* scrollDraw draws the outline as it morphs. This keeps it whole,
   so only the shape changes. */
.morph path {
  stroke-dasharray: none !important;
}`;

function pageCss(s: Settings): string {
  return s.outline === 'whole' ? `${LAYOUT_CSS}\n\n${WHOLE_CSS}` : LAYOUT_CSS;
}

/** The path's attributes, as HTML. */
function pathAttrs(s: Settings, cssOnly: boolean): string[] {
  const a = [`d="${s.from}"`];
  if (cssOnly && s.outline === 'draw') a.push('pathLength="1"');
  else if (!cssOnly && s.pathLength != null) a.push(`pathLength="${s.pathLength}"`);
  if (s.fill === 'none') a.push('fill="none"');
  else a.push('fill="currentColor"', `fill-opacity="${s.fill === 'tint' ? '0.15' : '0'}"`);
  a.push('stroke="currentColor"', `stroke-width="${s.strokeWidth}"`, 'stroke-linecap="round"', 'stroke-linejoin="round"');
  return a;
}

function markup(s: Settings, cssOnly: boolean, id: boolean): string {
  return [
    `<section${id ? ' id="morph"' : ''} class="morph">`,
    `  <svg class="morph-svg" viewBox="${s.viewBox}" aria-hidden="true">`,
    `    <path`,
    ...pathAttrs(s, cssOnly).map((a) => `      ${a}`),
    `    />`,
    `  </svg>`,
    `</section>`,
  ].join('\n');
}

/** The scrollDraw options, one per line, for the JS call. */
function jsOptions(s: Settings): string[] {
  const o = [
    `  morphTo: '${s.to}',`,
    `  // From the section's top at the top of the screen to its bottom at the`,
    `  // bottom: the whole time the drawing is stuck in view.`,
    `  trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },`,
  ];
  if (s.easing !== 'linear') o.push(`  easing: '${s.easing}',`);
  if (s.fill === 'fade') o.push('  fillOpacity: [0, 1],');
  if (s.once) o.push('  once: true,');
  return o;
}

function pairComment(s: Settings): string[] {
  return [
    `// Both paths are written ${s.skeleton}, ${s.numbers} numbers each, so morphTo`,
    `// can move every number of the start shape to its partner.`,
  ];
}

function lengthComment(s: Settings): string[] {
  if (s.outline !== 'draw' || s.pathLength == null) return [];
  return [
    `// scrollDraw sizes the dash once, from the start shape. Its pathLength`,
    `// (${s.pathLength}, just under that length) keeps the dash in step as the`,
    `// outline changes, so the end shape finishes drawing too.`,
  ];
}

// ── The listings ─────────────────────────────────────────────────────────────

/** index.html for the JavaScript tab: the markup and its CSS. */
export function jsMarkup(s: Settings): string {
  const lines = [
    ...(s.outline === 'draw' && s.pathLength != null
      ? ["<!-- pathLength: just under the start shape's length, so the dash keeps", '     in step with the outline as it changes. -->']
      : []),
    markup(s, false, true),
    '',
    '<style>',
    pageCss(s),
    '</style>',
  ];
  return withSource(lines.join('\n'), SLUG, 'html');
}

/** main.js: the scrollDraw call. */
export function jsCode(s: Settings): string {
  const lines = [
    `import { scrollDraw } from 'svg-scroll-draw';`,
    '',
    ...pairComment(s),
    ...lengthComment(s),
    `scrollDraw('#morph', {`,
    ...jsOptions(s),
    `});`,
  ];
  return withSource(lines.join('\n'), SLUG, 'js');
}

function reactProps(s: Settings): string[] {
  const p = [
    `      className="morph"`,
    `      morphTo={TO}`,
    `      trigger={{ start: '${TRIGGER.start}', end: '${TRIGGER.end}' }}`,
  ];
  if (s.easing !== 'linear') p.push(`      easing="${s.easing}"`);
  if (s.fill === 'fade') p.push('      fillOpacity={[0, 1]}');
  if (s.once) p.push('      once');
  return p;
}

function reactPath(s: Settings): string[] {
  const a = ['          d={FROM}'];
  if (s.pathLength != null) a.push(`          pathLength={${s.pathLength}}`);
  if (s.fill === 'none') a.push('          fill="none"');
  else a.push('          fill="currentColor"', `          fillOpacity={${s.fill === 'tint' ? '0.15' : '0'}}`);
  a.push('          stroke="currentColor"', `          strokeWidth={${s.strokeWidth}}`, '          strokeLinecap="round"', '          strokeLinejoin="round"');
  return a;
}

function reactBody(s: Settings, name: string, exported: boolean): string[] {
  return [
    `// The start shape is the path's d; scrollDraw morphs it to the end shape.`,
    `const FROM = '${s.from}';`,
    `const TO = '${s.to}';`,
    '',
    `${exported ? 'export default ' : ''}function ${name}() {`,
    '  return (',
    '    <ScrollDraw',
    ...reactProps(s),
    '    >',
    `      <svg className="morph-svg" viewBox="${s.viewBox}" aria-hidden="true">`,
    '        <path',
    ...reactPath(s),
    '        />',
    '      </svg>',
    '    </ScrollDraw>',
    '  );',
    '}',
  ];
}

/** Morph.jsx for the React tab. */
export function reactCode(s: Settings): string {
  const lines = [
    `import { ScrollDraw } from 'svg-scroll-draw/react';`,
    `import './Morph.css';`,
    '',
    ...pairComment(s),
    ...lengthComment(s),
    ...reactBody(s, 'Morph', true),
  ];
  return withSource(lines.join('\n'), SLUG, 'jsx');
}

export function reactCss(s: Settings): string {
  return withSource(pageCss(s), SLUG, 'css');
}

/** The CSS-only version: d on a scroll-driven animation. */
export function cssOnlyMarkup(s: Settings): string {
  return withSource(markup(s, true, false), SLUG, 'html');
}

export function cssOnly(s: Settings): string {
  const from: string[] = [`d: path('${s.from}');`];
  const to: string[] = [`d: path('${s.to}');`];
  if (s.outline === 'draw') { from.push('stroke-dashoffset: 1;'); to.push('stroke-dashoffset: 0;'); }
  if (s.fill === 'fade') { from.push('fill-opacity: 0;'); to.push('fill-opacity: 1;'); }
  const timing = cssTiming(s.easing);
  const lines = [
    `/* Chromium and Firefox animate d. Safari has no d property in CSS, so there`,
    `   the path keeps its d attribute: the start shape${s.outline === 'draw' ? ', which still draws' : ''}.${s.once ? '' : ' */'}`,
    ...(s.once ? ['   once has no CSS form: this follows the scroll both ways. */'] : []),
    '.morph {',
    '  height: 300vh;',
    '  view-timeline: --morph block;',
    '}',
    '.morph-svg {',
    '  position: sticky;',
    '  top: 0;',
    '  display: block;',
    '  width: 100%;',
    '  height: 100vh;',
    '  padding: 12vh 24px;',
    '  box-sizing: border-box;',
    '}',
    '',
    '@supports (animation-timeline: view()) {',
    '  .morph path {',
    ...(s.outline === 'draw' ? ['    stroke-dasharray: 1;'] : []),
    `    animation: morph both;`,
    `    animation-timing-function: ${timing};`,
    '    animation-timeline: --morph;',
    `    /* contain: from the section's top at the screen's top to its bottom at`,
    `       the screen's bottom, scrollDraw's '${TRIGGER.start}' to '${TRIGGER.end}'. */`,
    '    animation-range: contain 0% contain 100%;',
    '  }',
    '}',
    '',
    '@keyframes morph {',
    `  from { ${from.join(' ')} }`,
    `  to { ${to.join(' ')} }`,
    '}',
    '',
    '/* Reduced motion: no morph; the start shape, drawn whole. */',
    '@media (prefers-reduced-motion: reduce) {',
    '  .morph path {',
    '    animation: none;',
    '    stroke-dasharray: none;',
    ...(s.fill === 'fade' ? ['    fill-opacity: 1;'] : []),
    '  }',
    '}',
  ];
  return withSource(lines.join('\n'), SLUG, 'css');
}

/** paths.js: just the pair. */
export function pathsCode(s: Settings): string {
  const lines = [
    `// Both written ${s.skeleton}, ${s.numbers} numbers each.`,
    `// FROM is the d of the path you draw; TO is scrollDraw's morphTo.`,
    `export const FROM = '${s.from}';`,
    `export const TO = '${s.to}';`,
  ];
  return withSource(lines.join('\n'), SLUG, 'js');
}

// ── Files that run on their own ──────────────────────────────────────────────

const BASE_CSS = `:root { color-scheme: light dark; }
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
  min-height: 70vh;
  padding: 0 24px;
  text-align: center;
}`;

const intro = (s: Settings) =>
  `Scroll down: the ${s.fromName} turns into the ${s.toName}${s.once ? ', and stays' : ', and back as you scroll up'}.`;

/** A complete page for the visitor's settings, loading the library from jsDelivr. */
export function htmlPage(s: Settings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'SVG morph on scroll',
    css: `${BASE_CSS}\n\n${pageCss(s)}`,
    body: [
      '<header class="intro">',
      '  <h1>SVG morph on scroll</h1>',
      `  <p>${intro(s)}</p>`,
      '</header>',
      markup(s, false, true),
      '<footer class="outro">',
      `  <p>That was ${s.skeleton}, ${s.numbers} numbers each.</p>`,
      '</footer>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      `scrollDraw('#morph', {`,
      ...jsOptions(s),
      `});`,
    ].join('\n'),
  });
}

/** The same page as a Vite + React project. */
export function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const app = [
    `import { ScrollDraw } from 'svg-scroll-draw/react';`,
    '',
    ...reactBody(s, 'Morph', false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    '        <h1>SVG morph on scroll</h1>',
    `        <p>${intro(s)}</p>`,
    '      </header>',
    '      <Morph />',
    '      <footer className="outro">',
    `        <p>That was ${s.skeleton}, ${s.numbers} numbers each.</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(`${BASE_CSS}\n\n${pageCss(s)}`, SLUG, 'css'), version };
}
