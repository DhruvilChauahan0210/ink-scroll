import { MAX_SVG_CHARS } from '@/lib/svg-sanitize';
import { GEOMETRY_ATTRS, SHAPE_TAGS, fmt, shapePath, summarize, type ConvertOptions, type ShapeTag } from './convert';

/**
 * Converts every shape in a pasted SVG to a path, in the browser.
 *
 * The text is parsed into an inert XML document (DOMParser: nothing in it runs
 * or loads) and never inserted into the page: each shape is swapped for a
 * <path> with the same attributes, children and place, and the document is
 * written back out as text. Ids, classes, styles, defs and comments stay as
 * pasted. Only the previews are put on the page, and those go through
 * sanitizeSvg first (lib/svg-sanitize.ts), which rebuilds drawing elements
 * only.
 *
 * Browser-only (DOMParser, XMLSerializer): call it after mount.
 */

export type RowStatus = 'converted' | 'kept' | 'off';
export type Row = {
  i: number;
  tag: ShapeTag;
  id: string | null;
  status: RowStatus;
  d: string | null;
  commands: string;
  /** The dash length scrollDraw gives the element as pasted; null when its default selector skips it. */
  before: number | null;
  /** The path's length along its curves, which getTotalLength() measures. */
  after: number | null;
  notes: string[];
};

export type Conversion =
  | {
    ok: true;
    output: string;
    /** Shapes pasted on their own, without an <svg> around them. */
    fragment: boolean;
    rows: Row[];
    paths: number;
    warnings: string[];
    /** Markup for the previews (always a whole <svg>), before and after. */
    before: string;
    after: string;
    viewBox: string | null;
    /** The pasted <svg>'s own attributes (none for a fragment), for the React code. */
    rootAttrs: [string, string][];
  }
  | { ok: false; error: string };

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE_STYLE = /(^|;)\s*(x|y|width|height|rx|ry|cx|cy|r)\s*:/i;
/** The same geometry properties in a <style> block (not stroke-width: the name must stand alone). */
const SIZE_CSS = /(^|[{;\s])(x|y|width|height|rx|ry|cx|cy|r)\s*:/i;
const MARKER = ['marker-start', 'marker-mid', 'marker-end', 'marker'];
/** Containers whose shapes are used by reference, not drawn where they are. */
const NOT_DRAWN = 'defs, symbol, clipPath, mask, pattern, marker';

export function convertSvg(input: string, options: ConvertOptions, enabled: readonly ShapeTag[]): Conversion {
  const text = input.trim();
  if (!text) return { ok: false, error: 'Paste an SVG, or one or more shapes such as <circle cx="50" cy="50" r="40"/>.' };
  if (text.length > MAX_SVG_CHARS) {
    return { ok: false, error: `That is over ${MAX_SVG_CHARS.toLocaleString('en')} characters. Paste a smaller SVG.` };
  }
  if (!text.includes('<')) {
    return /^(d\s*=\s*["'])?\s*[Mm][\s\d.,\-eE+]/.test(text)
      ? { ok: false, error: 'That looks like a path’s d value: it is a path already. Paste the SVG with the shapes in it.' }
      : { ok: false, error: 'That is not SVG markup. Paste the whole <svg>…</svg>, or one or more shape elements.' };
  }

  // A whole <svg>, or shapes on their own, wrapped for parsing.
  const parser = new DOMParser();
  const parse = (s: string) => {
    const doc = parser.parseFromString(s, 'image/svg+xml');
    return doc.getElementsByTagName('parsererror').length ? null : doc;
  };
  let doc = parse(text);
  let fragment = false;
  if (!doc || doc.documentElement.localName !== 'svg') {
    const wrapped = /^<\?xml|<!DOCTYPE/i.test(text) ? null : parse(`<svg xmlns="${SVG_NS}">${text}</svg>`);
    if (!wrapped || !wrapped.documentElement.children.length) {
      return { ok: false, error: 'That is not valid SVG. Paste the whole <svg>…</svg>, or one or more shape elements.' };
    }
    doc = wrapped;
    fragment = true;
  }
  const root = doc.documentElement;
  const ns = root.namespaceURI;
  const before = serialize(doc);

  const all = Array.from(doc.getElementsByTagName('*')).filter((el) => el.namespaceURI === ns);
  const shapes = all.filter((el) => (SHAPE_TAGS as readonly string[]).includes(el.localName));
  const paths = all.filter((el) => el.localName === 'path').length;
  if (!shapes.length && !paths) return { ok: false, error: 'No shapes or paths found in that SVG.' };

  const animated = animatedAttributes(all);
  const rows: Row[] = [];
  const converted = new Set<ShapeTag>();

  shapes.forEach((el, k) => {
    const tag = el.localName as ShapeTag;
    const get = (name: string) => el.getAttribute(name);
    const row: Row = {
      i: k + 1, tag, id: get('id'), status: 'kept', d: null, commands: '—',
      before: scrollDrawLength(tag, get), after: null, notes: [],
    };
    rows.push(row);
    const keep = (why: string) => { row.notes.push(why); row.before = null; };

    if (!enabled.includes(tag)) {
      row.status = 'off';
      row.notes.push(`Left as a <${tag}>: switched off above.`);
      return;
    }
    if (SIZE_STYLE.test(get('style') ?? '')) {
      return keep('Its size or position is set in style="…", which the converter does not read. Left as it is.');
    }
    const anim = animated.get(el)?.filter((a) => GEOMETRY_ATTRS[tag].includes(a));
    if (anim?.length) {
      return keep(`An <animate> or <set> changes its ${anim.join(', ')}, which a path does not have. Left as it is.`);
    }
    const marker = MARKER.find((m) => get(m)) ?? (/marker/i.test(get('style') ?? '') ? 'a marker' : null);
    if (marker && (tag === 'rect' || tag === 'circle' || tag === 'ellipse')) {
      return keep(`Has ${marker}: browsers draw markers on a path but not on a <${tag}>, so converting would add them. Left as it is.`);
    }

    const res = shapePath(tag, get, options);
    if (!res.ok) return keep(res.reason);

    const path = doc.createElementNS(el.namespaceURI, el.prefix ? `${el.prefix}:path` : 'path');
    const geometry = GEOMETRY_ATTRS[tag];
    let placed = false;
    for (const attr of Array.from(el.attributes)) {
      if (geometry.includes(attr.name)) {
        if (!placed) { path.setAttribute('d', res.d); placed = true; }
        continue;
      }
      path.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    }
    if (!placed) {
      // No geometry attributes at all (a <line/> at 0,0): d goes first.
      const rest = Array.from(path.attributes).map((a) => [a.namespaceURI, a.name, a.value] as const);
      rest.forEach(([, name]) => path.removeAttribute(name));
      path.setAttribute('d', res.d);
      rest.forEach(([uri, name, value]) => path.setAttributeNS(uri, name, value));
    }
    while (el.firstChild) path.appendChild(el.firstChild);
    const holder = el.closest(NOT_DRAWN);
    if (holder) row.notes.push(`Inside <${holder.localName}>: converted, but drawn only where it is used, so not in the preview.`);
    el.replaceWith(path);

    converted.add(tag);
    Object.assign(row, { status: 'converted', d: res.d, commands: summarize(res.segments), after: res.length });
    row.notes.push(...res.notes);
    if (tag === 'ellipse') row.notes.push('scrollDraw’s default selector skips an <ellipse>, so it stayed drawn. As a path it draws.');
    if (row.before !== null && row.before - res.length > 0.005) {
      row.notes.push(`As a <rect>, scrollDraw’s dash was ${fmt(row.before - res.length, 2)} longer than the outline, so the line was whole before the animation ended.`);
    }
  });

  const warnings: string[] = [];
  const css = Array.from(doc.getElementsByTagName('style')).map((s) => s.textContent ?? '').join('\n');
  const named = [...converted].filter((t) => new RegExp(`(^|[\\s,>+~}(])${t}(?=[\\s,.:#\\[{>+~)])`).test(css));
  if (named.length) {
    warnings.push(`A <style> block selects ${named.map((t) => `<${t}>`).join(', ')} by element name. Those rules no longer match the paths: give the shapes a class and select that instead.`);
  }
  const sized = converted.size ? SIZE_CSS.exec(css)?.[2] : undefined;
  if (sized) {
    warnings.push(`A <style> block sets ${sized} as a CSS property. The converter reads attributes only, so a shape sized by that rule is converted from its attributes and will not match: set the size in attributes, or check those shapes.`);
  }
  if (!shapes.length) warnings.push(`Nothing to convert: ${paths === 1 ? 'the drawing is' : `all ${paths} elements are`} already ${paths === 1 ? 'a path' : 'paths'}.`);

  const out = fragment ? fragmentOf(root) : serialize(doc);
  const decl = fragment ? '' : (/^<\?xml[^>]*\?>/.exec(text)?.[0] ?? '');
  return {
    ok: true,
    output: decl ? `${decl}\n${out}` : out,
    fragment,
    rows,
    paths,
    warnings,
    before,
    after: serialize(doc),
    viewBox: root.getAttribute('viewBox'),
    rootAttrs: fragment ? [] : Array.from(root.attributes).map((a) => [a.name, a.value] as [string, string]),
  };
}

/**
 * The dash length scrollDraw sets on an element as pasted (getElementLength
 * in packages/svg-scroll-draw/src/core/geometry.ts): 2 × (width + height) for
 * a rect, read with parseFloat, whatever its corners; 2πr for a circle; the
 * browser's getTotalLength() for the rest, which for a line or a poly shape is
 * its exact length. An ellipse is not in its default selector, so it gets none.
 */
function scrollDrawLength(tag: ShapeTag, get: (name: string) => string | null): number | null {
  const n = (a: string) => parseFloat(get(a) ?? '0');
  const len = tag === 'rect' ? 2 * (n('width') + n('height'))
    : tag === 'circle' ? 2 * Math.PI * n('r')
    : tag === 'ellipse' ? NaN
    : (() => { const r = shapePath(tag, get); return r.ok ? r.length : NaN; })();
  return Number.isFinite(len) ? len : null;
}

/** Which attributes an <animate> or <set> changes, per target element. */
function animatedAttributes(all: Element[]): Map<Element, string[]> {
  const byId = new Map<string, Element>();
  for (const el of all) { const id = el.getAttribute('id'); if (id) byId.set(id, el); }
  const out = new Map<Element, string[]>();
  for (const a of all) {
    if (a.localName !== 'animate' && a.localName !== 'set') continue;
    const href = a.getAttribute('href') ?? a.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    const target = href?.startsWith('#') ? byId.get(href.slice(1)) : a.parentElement;
    const name = a.getAttribute('attributeName');
    if (target && name) out.set(target, [...(out.get(target) ?? []), name]);
  }
  return out;
}

const serialize = (doc: Document) => {
  const s = new XMLSerializer();
  return Array.from(doc.childNodes).map((n) => s.serializeToString(n)).join('\n');
};

/**
 * The pasted shapes without the <svg> the parser needed. Each one serialised
 * alone gets the namespace written on it, so that is taken off again.
 */
function fragmentOf(root: Element): string {
  const s = new XMLSerializer();
  return Array.from(root.childNodes)
    .map((n) => s.serializeToString(n).replace(/^(<[\w:-]+) xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '$1'))
    .join('');
}
