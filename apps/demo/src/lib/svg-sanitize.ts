/**
 * Turns SVG text a visitor pasted into a safe SVG element for the path viewer.
 *
 * The markup is parsed, never inserted: only drawing elements and drawing
 * attributes are copied onto fresh elements, so a pasted <script>, an onload,
 * a javascript: link, a <foreignObject>, an <image> or a <use> pointing
 * somewhere else cannot run or load anything. What is left out is counted, so
 * the tool can say what it ignored.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The shapes a path drawing can use, and the groups that hold them. */
const ELEMENTS = new Set(['svg', 'g', 'path', 'polyline', 'polygon', 'line', 'rect', 'circle', 'ellipse']);

const SHAPE_ATTRS = [
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
  'transform', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity', 'vector-effect',
];
const ROOT_ATTRS = ['viewBox', 'preserveAspectRatio', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];

/** Plain values only: no url(), no script, nothing that can reach outside the drawing. */
const SAFE_VALUE = /^[\w\s.,%#()+\-/:]*$/;
const UNSAFE = /url\s*\(|javascript:|expression\s*\(|@import/i;

export const MAX_SVG_CHARS = 200_000;
export const MAX_SHAPES = 400;

export type Sanitized =
  | { ok: true; svg: SVGSVGElement; removed: Record<string, number>; derivedViewBox: boolean; wasBarePath: boolean }
  | { ok: false; error: string };

export function sanitizeSvg(input: string): Sanitized {
  const text = input.trim();
  if (!text) return { ok: false, error: 'Paste an SVG, or the d value of a single path.' };
  if (text.length > MAX_SVG_CHARS) return { ok: false, error: `That is over ${MAX_SVG_CHARS.toLocaleString('en')} characters. Paste a smaller SVG.` };

  // A bare path: "M10 10 L 90 90" or d="…".
  const bare = /^(d\s*=\s*["'])?\s*[Mm][\s\d.,\-eE+]/.test(text) && !text.includes('<');
  const markup = bare
    ? `<svg xmlns="${SVG_NS}"><path d="${text.replace(/^d\s*=\s*["']|["']$/g, '').replace(/"/g, '')}"/></svg>`
    : text;

  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const source = doc.documentElement;
  if (doc.getElementsByTagName('parsererror').length || source.localName !== 'svg') {
    return { ok: false, error: 'That is not valid SVG. Paste the whole <svg>…</svg>, or one path’s d value.' };
  }

  const removed: Record<string, number> = {};
  const drop = (name: string) => { removed[name] = (removed[name] ?? 0) + 1; };
  let shapes = 0;

  const copyAttrs = (from: Element, to: Element, allowed: string[]) => {
    for (const name of allowed) {
      const value = from.getAttribute(name);
      if (value === null) continue;
      if (UNSAFE.test(value) || (name !== 'd' && name !== 'points' && !SAFE_VALUE.test(value))) {
        // A gradient or pattern fill (url(#…)) still means "filled".
        if ((name === 'fill' || name === 'stroke') && /url\s*\(/i.test(value)) to.setAttribute(name, 'currentColor');
        else drop(`${name}="…"`);
        continue;
      }
      if ((name === 'd' || name === 'points') && !/^[\s\d.,\-eE+MmLlHhVvCcSsQqTtAaZz]*$/.test(value)) { drop(`${name}="…"`); continue; }
      to.setAttribute(name, value);
    }
  };

  const build = (from: Element, root: boolean): Element | null => {
    const tag = from.localName;
    if (!ELEMENTS.has(tag) || (tag === 'svg' && !root)) { drop(`<${tag}>`); return null; }
    const to = document.createElementNS(SVG_NS, tag);
    copyAttrs(from, to, root ? ROOT_ATTRS : SHAPE_ATTRS);
    // Classes and inline styles are not carried over (a style can hold url()).
    if (from.hasAttribute('class')) drop('class="…"');
    if (from.hasAttribute('style')) drop('style="…"');
    if (tag !== 'svg' && tag !== 'g') {
      shapes += 1;
      if (shapes > MAX_SHAPES) { drop(`<${tag}> past ${MAX_SHAPES}`); return null; }
    }
    for (const child of Array.from(from.children)) {
      const built = build(child, false);
      if (built) to.appendChild(built);
    }
    return to;
  };

  const svg = build(source, true) as SVGSVGElement;
  let derivedViewBox = false;
  if (!svg.getAttribute('viewBox')) {
    const w = parseFloat(source.getAttribute('width') ?? '');
    const h = parseFloat(source.getAttribute('height') ?? '');
    if (w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    derivedViewBox = true;
  }
  if (!shapes) return { ok: false, error: 'No paths or shapes found in that SVG.' };
  return { ok: true, svg, removed, derivedViewBox, wasBarePath: bare };
}
