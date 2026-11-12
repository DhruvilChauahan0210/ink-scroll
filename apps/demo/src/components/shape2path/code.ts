import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { fmt } from './convert';
import type { Conversion, Row } from './convert-svg';

/**
 * The shape to path converter's code, apart from the component: the preview
 * written out, the code tabs and the page under the code. Client-safe and
 * React-free, so scripts/test-tools.mjs can build the page the tool hands out
 * and run it.
 */

export const SLUG = 'svg-shape-to-path-converter';

/** scrollDraw's default `selector` (packages/svg-scroll-draw/src/core/engine.ts). */
export const DEFAULT_SELECTOR = 'path, polyline, line, polygon, rect, circle';
const WITH_ELLIPSE = `${DEFAULT_SELECTOR}, ellipse`;
export const GEOMETRY = WITH_ELLIPSE;

/**
 * A stagger that keeps the whole run under about twice one path's duration:
 * 0.1 for up to 11 paths, less for more (scrollDraw's own `stagger` option).
 */
export function staggerFor(n: number): number {
  return n > 1 ? Math.max(0.01, Math.min(0.1, Math.floor(100 / (n - 1)) / 100)) : 0;
}

/** How many elements scrollDraw will draw in the converted SVG, with the selector the code passes. */
export function drawPlan(ok: Extract<Conversion, { ok: true }> | null): { n: number; ellipse: boolean } {
  if (!ok) return { n: 0, ellipse: false };
  // An ellipse left as one (switched off, or kept) needs the selector to say ellipse.
  const ellipse = ok.rows.some((r) => r.tag === 'ellipse' && r.status !== 'converted');
  const n = ok.paths + ok.rows.filter((r) => r.status === 'converted' || r.tag !== 'ellipse' || ellipse).length;
  return { n, ellipse };
}

/**
 * Frame and restyle the two previews, which must be in the document
 * (getBBox and getComputedStyle need them laid out): with no viewBox both are
 * framed from the pasted drawing's bounds, and with `lineView` every shape
 * is drawn as a line. Returns the viewBox it framed them with, or null.
 */
export function writeDrawings(svgs: SVGSVGElement[], lineView: boolean): string | null {
  // No viewBox: frame both from the pasted drawing's bounds, so they line up.
  let framed: string | null = null;
  if (!svgs[0].getAttribute('viewBox')) {
    try {
      const b = svgs[0].getBBox();
      const pad = Math.max(b.width, b.height) * 0.06 + 2;
      framed = [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map((n) => fmt(n, 2)).join(' ');
      svgs.forEach((s) => s.setAttribute('viewBox', framed as string));
    } catch { /* nothing drawable */ }
  }

  // Line view: every shape as a line, fills off, a stroke where there is none.
  // Not vector-effect: non-scaling-stroke, which measures dashes in screen
  // pixels while the dash length is in SVG units.
  if (lineView) {
    for (const svg of svgs) {
      const vb = svg.viewBox.baseVal;
      const width = fmt(Math.max(vb?.width || 0, vb?.height || 0, 1) / 180, 2);
      for (const el of Array.from(svg.querySelectorAll<SVGElement>(GEOMETRY))) {
        const cs = getComputedStyle(el);
        const stroked = cs.stroke !== 'none' && cs.strokeWidth !== '0px' && cs.strokeOpacity !== '0';
        el.setAttribute('fill', 'none');
        el.removeAttribute('vector-effect');
        if (!stroked) {
          el.setAttribute('stroke', 'currentColor');
          el.setAttribute('stroke-width', width);
        }
      }
    }
  }
  return framed;
}

// ── The written-out results ─────────────────────────────────────────────────

export function summary(rows: Row[], paths: number): string {
  const n = (s: Row['status']) => rows.filter((r) => r.status === s).length;
  const parts = [
    [n('converted'), 'converted to a path', 'converted to paths'],
    [n('kept'), 'left as it is', 'left as they are'],
    [n('off'), 'switched off', 'switched off'],
  ] as const;
  const out = parts.filter(([c]) => c > 0).map(([c, one, many]) => `${c} ${c === 1 ? `shape ${one}` : `shapes ${many}`}`);
  if (paths) out.push(`${paths} ${paths === 1 ? 'path' : 'paths'} kept as written`);
  return out.join(' · ');
}

export function pathData(rows: Row[]): string {
  const done = rows.filter((r) => r.d);
  if (!done.length) return '// Nothing was converted.';
  return done.map((r) => `// <${r.tag}> #${r.i}${r.id ? ` (id="${r.id}")` : ''}\n${r.d}`).join('\n\n');
}

/** The comment over the JavaScript tab's call, which the page under the code runs as written. */
function drawNote(ellipse: boolean, allPaths: boolean): string {
  return `// ${ellipse ? 'An <ellipse> is left, so the selector adds it.'
    : allPaths ? 'Every shape is a <path> now: the default selector finds them all.'
      : 'The default selector finds the paths and the shapes left as they are.'}`;
}

function drawCall(stagger: number, ellipse: boolean): string {
  const opts = [
    ellipse ? `  selector: '${WITH_ELLIPSE}',` : '',
    stagger ? `  stagger: ${stagger},` : '',
  ].filter(Boolean);
  return opts.length ? `scrollDraw('#drawing', {\n${opts.join('\n')}\n});` : `scrollDraw('#drawing');`;
}

export function jsCode(stagger: number, ellipse: boolean, allPaths: boolean): string {
  return `// <div id="drawing"> + the converted SVG + </div>

import { scrollDraw } from 'svg-scroll-draw';

${drawNote(ellipse, allPaths)}
${drawCall(stagger, ellipse)}`;
}

/** The React tab's component around `svg`, JSX lines already indented to sit in it. */
function drawingComponent(stagger: number, ellipse: boolean, svg: string): string {
  const props = [ellipse ? ` selector="${WITH_ELLIPSE}"` : '', stagger ? ` stagger={${stagger}}` : ''].join('');
  return `export function Drawing() {
  return (
    <ScrollDraw${props}>
${svg}
    </ScrollDraw>
  );
}`;
}

export function reactCode(stagger: number, ellipse: boolean, rootAttrs: [string, string][], viewBox: string | null): string {
  // The <svg>'s own attributes (the stroke the paths inherit, often), in JSX names.
  const attrs = rootAttrs.filter(([n]) => !/^(xmlns|version$|style$|xml:)/.test(n)).map(([n, v]) => [jsxName(n), v]);
  if (viewBox && !attrs.some(([n]) => n === 'viewBox')) attrs.unshift(['viewBox', viewBox]);
  const open = attrs.length > 2
    ? `<svg\n${attrs.map(([n, v]) => `        ${n}="${v.replace(/"/g, '&quot;')}"`).join('\n')}\n      >`
    : `<svg${attrs.map(([n, v]) => ` ${n}="${v.replace(/"/g, '&quot;')}"`).join('')}>`;
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

${drawingComponent(stagger, ellipse, `      ${open}
        {/* the converted paths: in JSX, stroke-width is strokeWidth and class is className */}
      </svg>`)}`;
}

/**
 * An element written out one to a line, as markup or as JSX (React's
 * attribute names). Used on the After preview, which sanitizeSvg rebuilt from
 * drawing elements and plain values only; the class the preview adds is left
 * out.
 */
export function markup(el: Element, jsx: boolean, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== 'class' && a.name !== 'style')
    .map((a) => ` ${jsx ? jsxName(a.name) : a.name}="${escapeHtml(a.value)}"`);
  const open = `${pad}<${el.localName}${attrs.join('')}`;
  const kids = Array.from(el.children);
  if (!kids.length) return `${open} />`;
  return [`${open}>`, ...kids.map((k) => markup(k, jsx, depth + 1)), `${pad}</${el.localName}>`].join('\n');
}

const indent = (s: string, n: number) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');

// ── The page under the code ─────────────────────────────────────────────────

export const RUN_TITLE = 'Converted SVG on scroll';
const RUN_INTRO = 'Scroll down: the converted drawing draws as it passes through the window, and undraws as you scroll back up.';
const runOutro = (stagger: number) =>
  `That is scrollDraw’s default trigger: the drawing starts as its top comes into the bottom of the window and finishes as its bottom leaves the top${stagger ? ', each shape a little after the one before' : ''}.`;
/**
 * A screen above the drawing, so it starts undrawn, and more than a screen
 * below: the default trigger ends when the drawing's bottom leaves the top of
 * the window, and with a stagger the later shapes end after that.
 */
const RUN_CSS = `body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
.intro, .outro {
  display: grid;
  place-content: center;
  min-height: 100vh;
  padding: 0 24px;
  text-align: center;
}
.outro { min-height: 150vh; }
svg {
  display: block;
  width: min(100% - 48px, 560px);
  height: auto;
  max-height: 80vh;
  margin: 0 auto;
}`;

/** The JavaScript tab as a page, around the drawing the After preview shows. */
export function htmlPage(svg: string, stagger: number, ellipse: boolean, allPaths: boolean, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: RUN_TITLE,
    css: RUN_CSS,
    body: [
      '<header class="intro">',
      `  <h1>${RUN_TITLE}</h1>`,
      `  <p>${RUN_INTRO}</p>`,
      '</header>',
      '<div id="drawing">',
      indent(svg, 2),
      '</div>',
      '<footer class="outro">',
      `  <p>${runOutro(stagger)}</p>`,
      '</footer>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      drawNote(ellipse, allPaths),
      drawCall(stagger, ellipse),
    ].join('\n'),
  });
}

/** The React tab's component with the drawing in it, as a Vite project. */
export function reactProject(svgJsx: string, stagger: number, ellipse: boolean, version: string): Omit<ReactProject, 'title'> {
  const app = [
    "import { ScrollDraw } from 'svg-scroll-draw/react';",
    '',
    drawingComponent(stagger, ellipse, indent(svgJsx, 6)),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    `        <h1>${RUN_TITLE}</h1>`,
    `        <p>${RUN_INTRO}</p>`,
    '      </header>',
    '      <Drawing />',
    '      <footer className="outro">',
    `        <p>${runOutro(stagger)}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(RUN_CSS, SLUG, 'css'), version };
}

/** An SVG attribute's name in JSX: class is className, the rest camelCase (data-* and aria-* stay). */
function jsxName(name: string): string {
  if (name === 'class') return 'className';
  if (/^(data|aria)-/.test(name)) return name;
  return name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());
}
