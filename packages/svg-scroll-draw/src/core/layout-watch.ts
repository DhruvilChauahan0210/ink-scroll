/**
 * Tell an engine when the layout has moved under it.
 *
 * Engines measure their trigger window once and keep it, because measuring on
 * every scroll frame forces layout. A window resize re-measured it, but most
 * layout changes are not window resizes: an image loading above the element,
 * a web font swapping in, an accordion opening, content arriving late. Measured
 * with a 480px image loading 800ms after init above the element: scrollReveal
 * was fully revealed at the point it should have started, scrollAnimate on the
 * JS path was at 0.72 instead of 0, and scrollCounter showed its final value
 * where it should have shown its first.
 *
 * One ResizeObserver serves every engine on the page. It watches body
 * (documentElement's box does not follow content growth in a scrolling
 * document — a 21px page growth produced no callback), documentElement, and
 * each engine's own elements. Any change reaches every engine: each one
 * debounces and compares before it does anything, and 50 engines re-measuring
 * after one image loaded took 0.10ms in all.
 *
 * An element's first report counts only if its box changed since it was
 * observed (the observer reports every element once on observe). Engines drop a
 * re-measure that moves the window by less than a pixel, or an element
 * animating its own size can re-measure itself forever over sub-pixel rounding
 * (measured: 304.140px ↔ 304.142px, six times a second).
 */

let observer: ResizeObserver | undefined;
const watchers = new Set<() => void>();
/**
 * Each target's box when it was observed, until its first report; after that a
 * value no box can have, so every later report counts.
 */
const boxes = new WeakMap<Element, string>();
/** How many watchers observe each element: one engine's destroy must not blind another. */
const uses = new Map<Element, number>();
const boxOf = (t: Element) => { const r = t.getBoundingClientRect(); return r.width + ' ' + r.height; };

/**
 * The targets and every box that can move them: the previous siblings of each
 * target and of each of its ancestors, up to body. Content that grows above an
 * element always grows one of these. body alone did not do: inside a custom
 * scroll container, or on a page with `html, body { height: 100% }`, body keeps
 * its size while the content inside it grows, and nothing was reported.
 */
function above(targets: Element[]): Set<Element> {
  const out = new Set<Element>();
  for (let n of targets as (Element | null)[]) {
    for (; n && n !== document.body; n = n.parentElement) {
      for (let s: Element | null = n; s; s = s.previousElementSibling) out.add(s);
    }
  }
  return out;
}

/**
 * Call `onChange` when the page or any of `targets` changes size. Debounce in
 * `onChange` as for a window resize. Returns the function that stops watching.
 */
export function watchLayout(targets: Element[], onChange: () => void): () => void {
  if (typeof ResizeObserver === 'undefined' || typeof document === 'undefined') return () => {};
  // A function of its own, so one handler watched twice is two watchers.
  const fire = () => onChange();
  observer ??= new ResizeObserver((entries) => {
    let moved = false;
    for (const { target } of entries) {
      // A first report is a change only when the box moved since it was
      // observed: content can land between an engine's init and its first frame.
      if (boxes.get(target) !== boxOf(target)) moved = true;
      boxes.set(target, '');
    }
    if (moved) watchers.forEach((w) => w());
  });
  watchers.add(fire);
  // No body in a standalone SVG document.
  const all = above(targets);
  [document.body, document.documentElement].forEach((t) => t && all.add(t));
  all.forEach((t) => {
    if (!boxes.has(t)) boxes.set(t, boxOf(t));
    uses.set(t, (uses.get(t) ?? 0) + 1);
    observer!.observe(t);
  });
  return () => {
    if (!watchers.delete(fire)) return;
    all.forEach((t) => {
      const n = (uses.get(t) ?? 1) - 1;
      if (n) return void uses.set(t, n);
      uses.delete(t);
      observer?.unobserve(t);
    });
    if (!watchers.size) {
      // Nothing left to watch: let the observer go rather than keep it idle.
      observer?.disconnect();
      observer = undefined;
    }
  };
}
