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

/**
 * How much of a path is drawn: 0 = undrawn, 1 = fully drawn.
 *
 * Read from the *computed* dashoffset over the element's real length, so it works
 * for both engines — the JS path writes the offset inline every frame while the
 * native CSS path animates it on the compositor with nothing inline to read.
 */
export function drawnFraction(el) {
  const len = el.getTotalLength();
  if (!len) return 0;
  const offset = parseFloat(getComputedStyle(el).strokeDashoffset) || 0;
  return 1 - offset / len;
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
 * Wrap `requestAnimationFrame` and `IntersectionObserver` so a fixture can ask
 * whether anything is still running after it tore its components down.
 *
 * This is what "unmount cleanly" means for the framework wrappers: not just that
 * the element left the DOM, but that the engine behind it stopped. A leaked rAF
 * loop is invisible — the page looks right and burns a frame's work forever, on
 * every route change, for as long as the tab is open.
 *
 * Must be installed before anything is mounted. `ticksOver` deliberately waits on
 * the *original* rAF, so the sampling loop does not count itself.
 */
export function installLeakCounters() {
  const nativeRaf = window.requestAnimationFrame.bind(window);
  let ticks = 0;
  window.requestAnimationFrame = (cb) => nativeRaf((t) => { ticks++; return cb(t); });

  const NativeIO = window.IntersectionObserver;
  let live = 0;
  window.IntersectionObserver = class extends NativeIO {
    #observed = 0;
    observe(el, opts) { this.#observed++; live++; return super.observe(el, opts); }
    unobserve(el) {
      if (this.#observed > 0) { this.#observed--; live--; }
      return super.unobserve(el);
    }
    disconnect() { live -= this.#observed; this.#observed = 0; return super.disconnect(); }
  };

  return {
    liveObservers: () => live,
    /** Frames of animation work observed across `n` real frames. */
    async ticksOver(n) {
      const before = ticks;
      for (let i = 0; i < n; i++) await new Promise((r) => nativeRaf(r));
      return ticks - before;
    },
  };
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
