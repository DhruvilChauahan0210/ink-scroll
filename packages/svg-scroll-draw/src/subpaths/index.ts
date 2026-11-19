/**
 * `svg-scroll-draw/subpaths`: one <path> per subpath, so a drawing's subpaths
 * can draw one after another.
 *
 * Browsers restart the dash pattern at every subpath (each M), so a path with
 * several subpaths draws all of them at once, each from its own start.
 * Measured on 2026-11-17 in Chromium, WebKit and Firefox: at 30% of the total
 * length, subpaths of 360, 180 and 80 px showed 186, 180 and 80 px drawn. The
 * only way to draw them one after another is to make each its own element;
 * then any engine draws them as ordinary paths, and `stagger` orders them.
 *
 *   scrollDraw(splitSubpaths('#logo'), { stagger: 1 });
 *
 * An entry of its own, so the draw engine carries none of it. No DOM at import.
 */

type Target = string | Element | ArrayLike<Element> | null | undefined;

/** What a split path needs to be put back exactly. */
type Saved = { d: string | null; style: string | null; len: string | null; pieces: Element[] };

const SPLIT = 'data-scroll-draw-split';
const PIECE = 'data-scroll-draw-piece';
const saved = new WeakMap<Element, Saved>();
const NUM = /[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;

/**
 * `d` cut before every moveto, one string per subpath, as written. A moveto
 * that draws nothing (`M10 10 M20 20 …`: at most one pair and no other
 * command) stays with what follows it, so no piece is empty.
 */
function cut(d: string): string[] {
  const out: string[] = [];
  let carry = '';
  for (const s of d.trim().split(/(?=[Mm])/)) {
    carry += s;
    // Any command letter after the moveto (e is an exponent), or a second pair.
    if (/[a-df-z]/i.test(s.slice(1)) || (s.match(NUM) ?? []).length > 2) {
      out.push(carry);
      carry = '';
    }
  }
  if (carry) out.push((out.pop() ?? '') + carry);
  return out;
}

/** Every element `target` names, and every <path> inside them, the elements themselves included. */
function pathsIn(target: Target, sel: string): Element[] {
  if (typeof document === 'undefined' || !target) return [];
  const roots =
    typeof target === 'string' ? Array.from(document.querySelectorAll(target))
    : target instanceof Element ? [target]
    : Array.from(target);
  const out = new Set<Element>();
  for (const r of roots) {
    if (r.matches(sel)) out.add(r);
    r.querySelectorAll(sel).forEach((p) => out.add(p));
  }
  return [...out];
}

/**
 * Split every <path> in `target` (a selector, matching every element it
 * names; an element; or a list of elements) that has more than one subpath
 * into one <path> per subpath, in document order, and return `target` so it
 * chains into any engine: `scrollDraw(splitSubpaths('#logo'), { stagger: 1 })`.
 *
 * The path itself keeps the first subpath, so a framework that rendered it
 * still finds its node where it left it, and each later subpath is a copy
 * inserted after it: same attributes (class, stroke, transform, style), less
 * `id` and `pathLength`, marked `data-scroll-draw-piece`. The path is marked
 * `data-scroll-draw-split`, loses its `pathLength` while split (each piece is
 * measured in its own units), and is skipped if split again. A piece that
 * starts with a relative `m` starts with an absolute `M` instead, from where
 * the piece before it ends (its start after a `z`), read from the browser, so
 * arcs and every other command go through the browser's own parser. A path
 * with one subpath is left alone.
 *
 * Call it before the drawing starts, on the element the engine will draw.
 * `joinSubpaths(target)` puts everything back. Without a DOM it does nothing.
 */
export function splitSubpaths<T extends Target>(target: T): T {
  for (const el of pathsIn(target, 'path')) {
    const d = el.getAttribute('d');
    const ds = cut(d ?? '');
    if (ds.length < 2 || saved.has(el)) continue;
    const s: Saved = { d, style: el.getAttribute('style'), len: el.getAttribute('pathLength'), pieces: [] };
    saved.set(el, s);
    el.setAttribute(SPLIT, '');
    el.removeAttribute('pathLength');
    let at = el as SVGGeometryElement;
    ds.forEach((piece, k) => {
      if (k && piece[0] === 'm') {
        const { x, y } = at.getPointAtLength(at.getTotalLength());
        // The moveto's own numbers: the first pair moves, any more are lines.
        const [, args, rest] = /^m([^a-df-z]*)(.*)$/is.exec(piece)!;
        const [dx, dy, ...more] = args.match(NUM)!;
        piece = `M${x + +dx} ${y + +dy}${more.length ? `l${more.join(' ')}` : ''}${rest}`;
      }
      if (k) {
        const p = el.cloneNode() as SVGGeometryElement;
        p.removeAttribute('id');
        p.removeAttribute(SPLIT);
        p.setAttribute(PIECE, '');
        p.setAttribute('d', piece);
        at.after(p);
        s.pieces.push((at = p));
      } else el.setAttribute('d', piece);
    });
  }
  return target;
}

/**
 * Undo `splitSubpaths` for every split path in `target`: the pieces are
 * removed and the path gets back its `d`, `pathLength` and `style` attribute
 * exactly as they were (an engine's inline styles from the split drawing go
 * too). Destroy the drawing first. Returns `target`.
 */
export function joinSubpaths<T extends Target>(target: T): T {
  for (const el of pathsIn(target, `[${SPLIT}]`)) {
    const s = saved.get(el);
    if (!s) continue;
    saved.delete(el);
    s.pieces.forEach((p) => p.remove());
    for (const [k, v] of [['d', s.d], ['style', s.style], ['pathLength', s.len], [SPLIT, null]] as const) {
      if (v === null) el.removeAttribute(k);
      else el.setAttribute(k, v);
    }
  }
  return target;
}
