/**
 * Shared browser-side helpers for the Playwright fixtures.
 *
 * Every fixture publishes a `read()` that returns plain, already-parsed numbers.
 * Keeping the parsing in the page rather than the spec means a spec never has to
 * pick apart a matrix string, and a wrong parse shows up as an obviously wrong
 * number in one place instead of in ten specs.
 */

/**
 * Resolved transform of an element, decomposed.
 *
 * `getComputedStyle().transform` is a matrix, not the authored `translateY(…)`,
 * so asserting on the string is useless across browsers. DOMMatrixReadOnly is
 * supported in all three engines under test.
 */
export function transformOf(el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const m = new DOMMatrixReadOnly(t);
  return {
    x: m.m41,
    y: m.m42,
    scaleX: Math.hypot(m.m11, m.m12),
    scaleY: Math.hypot(m.m21, m.m22),
  };
}

export function opacityOf(el) {
  return parseFloat(getComputedStyle(el).opacity);
}

/** Inline (author-set) values only — used to check destroy() cleans up after itself. */
export function inlineOf(el, ...props) {
  const out = {};
  for (const p of props) out[p] = el.style.getPropertyValue(p);
  return out;
}

/** Document-space top of an element, independent of current scroll. */
export function docTop(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

/**
 * Publish the probe and mark the fixture ready.
 *
 * Specs wait on `__ready` rather than `load`, because a module script that
 * throws still fires `load` — waiting on the flag makes an init error a timeout
 * instead of a silent pass against an uninitialised page.
 */
export function publish(probe) {
  window.__probe = probe;
  window.__ready = true;
}
