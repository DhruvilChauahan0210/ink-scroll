import { MAX_SVG_CHARS, sanitizeSvg } from '@/lib/svg-sanitize';
import { SVG_NS, type SvgEl, type SvgKid } from './convert';

/**
 * Reads a pasted SVG into the two trees the converter can work from, in the
 * browser (DOMParser).
 *
 * - `all`: the paste as written. DOMParser builds an inert XML document:
 *   nothing in it runs or loads, and it is never put on the page. The
 *   converter then leaves out what could run (convert.ts).
 * - `drawing`: what sanitizeSvg (lib/svg-sanitize.ts) rebuilds from it, which
 *   is exactly what the preview shows: drawing elements and drawing attributes
 *   only, no classes, styles, text, gradients, ids or sizes.
 *
 * sanitizeSvg also decides what counts as an SVG at all, and the size limit.
 * An SVG with no shapes in it (only text, say) has no drawing to preview, but
 * still converts.
 */

export type Prolog = { declaration: boolean; doctype: boolean; comments: number };

export type Read =
  | {
    ok: true;
    all: SvgEl;
    /** Null when the SVG has no shapes for the preview to draw. */
    drawing: SvgEl | null;
    /** The preview: sanitizeSvg's element. */
    preview: SVGSVGElement | null;
    previewNote: string;
    /** A path's d value pasted on its own, so the drawing has no viewBox yet. */
    bare: boolean;
    prolog: Prolog;
  }
  | { ok: false; error: string };

/** An element as the file writes it. `ns` is the root's namespace: anything else is an editor's. */
export function readElement(el: Element, ns: string | null): SvgEl {
  const kids: SvgKid[] = [];
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === 1) kids.push(readElement(n as Element, ns));
    else if (n.nodeType === 3 || n.nodeType === 4) kids.push({ text: (n as CharacterData).data });
    else if (n.nodeType === 8) kids.push({ comment: (n as CharacterData).data });
  }
  return {
    tag: el.nodeName,
    foreign: el.namespaceURI !== ns,
    attrs: Array.from(el.attributes, (a) => [a.name, a.value] as [string, string]),
    kids,
  };
}

export function readSvg(input: string): Read {
  const text = input.trim();
  if (text.length > MAX_SVG_CHARS) {
    return { ok: false, error: `That is over ${MAX_SVG_CHARS.toLocaleString('en')} characters. Paste a smaller SVG.` };
  }
  const clean = sanitizeSvg(text);

  // A bare d value: both trees are the one path sanitizeSvg wrapped it in.
  if (clean.ok && clean.wasBarePath) {
    const drawing = readElement(clean.svg, SVG_NS);
    return { ok: true, all: drawing, drawing, preview: clean.svg, previewNote: '', bare: true, prolog: { declaration: false, doctype: false, comments: 0 } };
  }

  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.getElementsByTagName('parsererror').length || root.localName !== 'svg') {
    return { ok: false, error: clean.ok ? 'That is not valid SVG.' : clean.error };
  }
  const all = readElement(root, root.namespaceURI);
  const prolog: Prolog = {
    declaration: /^<\?xml/i.test(text),
    doctype: !!doc.doctype,
    comments: Array.from(doc.childNodes).filter((n) => n.nodeType === 8).length,
  };
  if (!clean.ok) {
    return { ok: true, all, drawing: null, preview: null, previewNote: `Nothing to preview: ${clean.error.replace(/^No /, 'no ').replace(/\.$/, '')}. The conversion below still applies.`, bare: false, prolog };
  }
  const drawing = readElement(clean.svg, SVG_NS);
  // sanitizeSvg's element has its namespace without the attribute: write it if the paste did.
  if (all.attrs.some(([n]) => n === 'xmlns')) drawing.attrs.unshift(['xmlns', SVG_NS]);
  return { ok: true, all, drawing, preview: clean.svg, previewNote: '', bare: false, prolog };
}
