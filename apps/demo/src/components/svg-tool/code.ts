import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * The SVG path viewer's code, apart from the component: reading the shapes,
 * the code tabs and the page under the code. Client-safe and React-free, so
 * scripts/test-tools.mjs can build the page the tool hands out and run it.
 */

export type Shape = { i: number; tag: string; length: number | null; commands: string; stroke: boolean; fill: boolean; nonScaling: boolean; pieces: number };
/** The drawing as written out: the Clean SVG tab, and what the preview draws as markup and as JSX. */
export type Written = { clean: string; drawn: string; drawnJsx: string };

export const SLUG = 'svg-path-viewer';
const SVG_NS = 'http://www.w3.org/2000/svg';
/** What scrollDraw draws by default (its `selector` option). */
export const DRAWN = new Set(['path', 'polyline', 'line', 'polygon', 'rect', 'circle']);
const GEOMETRY = 'path, polyline, polygon, line, rect, circle, ellipse';
export const STAGGER = 0.12;

/**
 * Measure and write out `svg`, which must be in the document (getBBox and
 * getComputedStyle need it laid out): a viewBox when it has none, each
 * shape's length and look, and with `lineView` every shape restyled as a
 * line. Changes `svg` in place, as the preview shows it.
 */
export function writeDrawing(svg: SVGSVGElement, wasBarePath: boolean, lineView: boolean): { measured: Shape[]; extra: string[]; written: Written } {
  const extra: string[] = [];
  // No viewBox: frame the drawing from its own bounds, with a margin.
  if (!svg.getAttribute('viewBox')) {
    try {
      const b = svg.getBBox();
      const pad = Math.max(b.width, b.height) * 0.06 + 2;
      svg.setAttribute('viewBox', `${round(b.x - pad)} ${round(b.y - pad)} ${round(b.width + pad * 2)} ${round(b.height + pad * 2)}`);
    } catch { /* empty drawing */ }
    if (!wasBarePath) extra.push('The SVG has no viewBox, so the drawing will not scale with its box. One was worked out from the shapes for this preview.');
  }
  const clean = markup(svg, false);

  const els = Array.from(svg.querySelectorAll<SVGGeometryElement>(GEOMETRY));
  const measured: Shape[] = els.map((el, i) => {
    const cs = getComputedStyle(el);
    let length: number | null = null;
    try { length = lengthOf(el); } catch { length = null; }
    const d = el.getAttribute('d') ?? '';
    return {
      i: i + 1,
      tag: el.localName,
      length,
      commands: el.localName === 'path' ? summarize(d) : '—',
      stroke: cs.stroke !== 'none' && cs.strokeWidth !== '0px' && cs.strokeOpacity !== '0',
      fill: cs.fill !== 'none' && cs.fillOpacity !== '0',
      nonScaling: (el.getAttribute('vector-effect') ?? cs.getPropertyValue('vector-effect')).includes('non-scaling-stroke'),
      pieces: el.localName === 'path' ? (d.match(/[Mm]/g) ?? []).length : 1,
    };
  });

  // The preview look: every shape as a thin line, or as pasted.
  // Not vector-effect: non-scaling-stroke, which measures dashes in screen
  // pixels while the dash length is in SVG units, and leaves a scaled-up
  // drawing with gaps. The width is set from the viewBox size instead.
  // Line view shows every shape as a line: fills off, and a stroke added
  // where a shape has none. A shape that has a stroke keeps its own width.
  if (lineView) {
    const vb = svg.viewBox.baseVal;
    const width = String(round(Math.max(vb?.width || 0, vb?.height || 0, 1) / 180));
    els.forEach((el, k) => {
      el.setAttribute('fill', 'none');
      el.removeAttribute('vector-effect');
      if (!measured[k].stroke) {
        el.setAttribute('stroke', 'currentColor');
        el.setAttribute('stroke-width', width);
      }
      // One path of many pieces is one dash: the pieces would draw one
      // after another. Split it so each piece draws on its own (fills are
      // off here, so the fill rule's holes cannot change).
      const parts = splitPieces(el);
      if (parts) el.replaceWith(...parts);
    });
  }
  // Written out before scrollDraw styles the shapes: the page under the code
  // runs the same drawing the preview shows.
  const written: Written = { clean, drawn: markup(svg, false), drawnJsx: markup(svg, true) };
  return { measured, extra, written };
}

// ── Reading the shapes ──────────────────────────────────────────────────────

export const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A path whose data has several pieces (one M per piece), split into one path
 * per piece with the same attributes; null if it is one piece, or if it uses
 * relative commands, whose pieces depend on where the previous one ended.
 */
function splitPieces(el: Element): Element[] | null {
  if (el.localName !== 'path') return null;
  const d = el.getAttribute('d') ?? '';
  if (/[mlhvcsqtaz]/.test(d.replace(/\d[eE][+-]?\d/g, '0'))) return null;
  const pieces = d.split(/(?=M)/).map((p) => p.trim()).filter(Boolean);
  if (pieces.length < 2) return null;
  return pieces.map((piece) => {
    const copy = el.cloneNode(false) as Element;
    copy.setAttribute('d', piece);
    return copy;
  });
}

/**
 * A shape's length as scrollDraw measures it (getElementLength in
 * packages/svg-scroll-draw/src/core/geometry.ts), so the table shows the dash
 * length the library will use: 2πr for a circle, the perimeter for a rect, the
 * browser's getTotalLength() for the rest. (Chrome's own getTotalLength() for
 * a circle is slightly short.)
 */
function lengthOf(el: SVGGeometryElement): number {
  const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
  if (el.localName === 'circle') return 2 * Math.PI * n('r');
  if (el.localName === 'rect') return 2 * (n('width') + n('height'));
  return el.getTotalLength();
}

/** "M 1 · C 3 · Z 1": how many of each command the path data uses. */
function summarize(d: string): string {
  const counts = new Map<string, number>();
  for (const c of d.match(/[MLHVCSQTAZ]/gi) ?? []) {
    const k = c.toUpperCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([k, n]) => `${k} ${n}`).join(' · ') || '—';
}

export function findProblems(shapes: Shape[], removed: Record<string, number>): string[] {
  const out: string[] = [];
  const noStroke = shapes.filter((s) => !s.stroke).map((s) => s.i);
  const filled = shapes.filter((s) => s.fill).map((s) => s.i);
  const ellipses = shapes.filter((s) => s.tag === 'ellipse').map((s) => s.i);
  const empty = shapes.filter((s) => s.length === 0).map((s) => s.i);
  const list = (ns: number[]) => ns.map((n) => `#${n}`).join(', ');
  if (noStroke.length) out.push(`No stroke on ${list(noStroke)}: a line drawing animates the stroke, so these would not be seen. Add stroke="currentColor" (Line view adds one for the preview).`);
  if (filled.length) out.push(`Fill on ${list(filled)}: the filled area shows before its outline draws. Set fill="none", or fade the fill in once the line is done.`);
  if (ellipses.length) out.push(`<ellipse> (${list(ellipses)}) is not in scrollDraw’s default selector, so it would not draw. Add it to the selector (selector: '${[...DRAWN].join(', ')}, ellipse') or draw it as a path.`);
  const nonScaling = shapes.filter((s) => s.nonScaling).map((s) => s.i);
  if (nonScaling.length) out.push(`vector-effect="non-scaling-stroke" on ${list(nonScaling)}: dashes are then measured in screen pixels but the length is in SVG units, so a drawing shown larger than its viewBox draws with gaps. Remove it for line drawings.`);
  const multi = shapes.filter((s) => s.pieces > 1);
  if (multi.length) out.push(`${multi.map((s) => `#${s.i} is one path of ${s.pieces} pieces`).join(', ')}: drawn as one line, the pieces trace one after another along a single dash. Split them into one path each (Line view does this for the preview) so they draw together.`);
  if (empty.length) out.push(`Zero length: ${list(empty)}. A shape with no length has nothing to draw.`);
  if (removed['<style>'] || removed['class="…"'] || removed['style="…"']) out.push('Styles from a <style> block, classes or style="" are not read here, so a stroke or fill set that way shows as none. Put them in attributes (stroke="…") to check them.');
  const ignored = Object.entries(removed).filter(([k]) => !/^<(title|desc|metadata|defs|style)>$|^(class|style)="…"$/.test(k));
  if (ignored.length) out.push(`Left out (not drawing shapes, or not safe to run): ${ignored.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ')}.`);
  return out;
}

// ── The generated code ──────────────────────────────────────────────────────

export function cssCode(): string {
  return `/* Add pathLength="1" to each shape: every length becomes 1,
   so one rule draws them all, whatever their real length. */
.drawing :is(path, line, polyline, polygon, rect, circle) {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}`;
}

/** Whether the code staggers: more than one shape that scrollDraw draws by default. */
export function staggers(shapes: Shape[]): boolean {
  return shapes.filter((s) => DRAWN.has(s.tag)).length > 1;
}

const DRAW_NOTE = '// Draws as the drawing scrolls through the window.';
/** The JavaScript tab's call, which the page under the code runs as written. */
const drawCall = (many: boolean) => `scrollDraw('#drawing'${many ? `, { stagger: ${STAGGER} }` : ''});`;

export function jsCode(many: boolean): string {
  return `// <div id="drawing"><svg …>…</svg></div>

import { scrollDraw } from 'svg-scroll-draw';

${DRAW_NOTE}
${drawCall(many)}`;
}

/** The React tab's component around `svg`, JSX lines already indented to sit in it. */
function drawingComponent(many: boolean, svg: string): string {
  return `export function Drawing() {
  return (
    <ScrollDraw${many ? ` stagger={${STAGGER}}` : ''}>
${svg}
    </ScrollDraw>
  );
}`;
}

export function reactCode(many: boolean): string {
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

${drawingComponent(many, '      <svg viewBox="…">{/* your paths */}</svg>')}`;
}

/**
 * The SVG written out one element to a line. As markup it carries the SVG
 * namespace, which a .svg file needs to open on its own (the rebuilt element
 * has it as its namespace, not as an attribute); as JSX the attributes take
 * React's names (stroke-width is strokeWidth).
 */
function markup(el: Element, jsx: boolean, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== 'class')
    .map((a) => ` ${jsx ? a.name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) : a.name}="${escapeHtml(a.value)}"`);
  if (depth === 0 && !jsx && !el.hasAttribute('xmlns')) attrs.unshift(` xmlns="${SVG_NS}"`);
  const open = `${pad}<${el.localName}${attrs.join('')}`;
  const kids = Array.from(el.children);
  if (!kids.length) return `${open} />`;
  return [`${open}>`, ...kids.map((k) => markup(k, jsx, depth + 1)), `${pad}</${el.localName}>`].join('\n');
}

const indent = (s: string, n: number) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');

// ── The page under the code ─────────────────────────────────────────────────

export const RUN_TITLE = 'SVG drawing on scroll';
const RUN_INTRO = 'Scroll down: the drawing draws as it passes through the window, and undraws as you scroll back up.';
const RUN_OUTRO = 'That is scrollDraw’s default trigger: it starts as the drawing’s top comes into the bottom of the window and finishes as its bottom leaves the top.';
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

/** The JavaScript tab as a page, around the drawing the preview shows. */
export function htmlPage(svg: string, many: boolean, version: string): string {
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
      `  <p>${RUN_OUTRO}</p>`,
      '</footer>',
    ].join('\n'),
    script: [`import { scrollDraw } from '${cdnModule(version)}';`, '', DRAW_NOTE, drawCall(many)].join('\n'),
  });
}

/** The React tab's component with the drawing in it, as a Vite project. */
export function reactProject(svgJsx: string, many: boolean, version: string): Omit<ReactProject, 'title'> {
  const app = [
    "import { ScrollDraw } from 'svg-scroll-draw/react';",
    '',
    drawingComponent(many, indent(svgJsx, 6)),
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
    `        <p>${RUN_OUTRO}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(RUN_CSS, SLUG, 'css'), version };
}
