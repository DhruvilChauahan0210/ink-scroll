import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import { watchReducedMotion } from '../core/motion-watch';
import { frameGate } from '../core/frame-gate';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollFramesOptions {
  /** Image URLs in order, or a function from index (0-based) to URL. */
  frames: string[] | ((index: number) => string);
  /** Number of frames; required when `frames` is a function, else frames.length. */
  count?: number;
  trigger?: TriggerConfig;
  easing?: EasingName | ((t: number) => number);
  once?: boolean;
  axis?: 'x' | 'y';
  /**
   * Measure the trigger window from this element instead of the canvas: the
   * pinned-stage pattern, as in scrollVideo. Point it at the tall track that
   * holds the scroll room, with `start: 'top top'` and `end: 'bottom bottom'`.
   */
  triggerElement?: Element;
  /** How each frame fills the canvas box: 'cover' (default) or 'contain'. */
  fit?: 'cover' | 'contain';
  /** How many images load at once. Default 6. */
  concurrency?: number;
  /** The first frame is drawn. */
  onReady?: () => void;
  /** Every frame has loaded (or failed). */
  onLoad?: () => void;
  onComplete?: () => void;
  /**
   * Every animation frame while the scroll is inside the trigger window (and on
   * seek(), replay() and the frame that crosses an edge), as scrollVideo's
   * does: the eased progress, and the index of the frame it calls for. The
   * canvas shows the nearest loaded frame until that one arrives.
   */
  onProgress?: (alpha: number, frame: number) => void;
}

// ── Engine ────────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

/**
 * The order to fetch `n` frames in: the first, the last, then the midpoints of
 * every gap, coarse to fine. A fast scrub has a frame near wherever it lands
 * after a handful of loads instead of after all of them.
 */
function loadOrder(n: number): number[] {
  const order = n > 1 ? [0, n - 1] : [0];
  const gaps: [number, number][] = [[0, n - 1]];
  for (let g = 0; g < gaps.length; g++) {
    const [lo, hi] = gaps[g];
    if (hi - lo < 2) continue;
    const mid = (lo + hi) >> 1;
    order.push(mid);
    gaps.push([lo, mid], [mid, hi]);
  }
  return order;
}

/**
 * Scrub an image sequence on a canvas with the scroll: the Apple product-page
 * film. Frame `round(alpha × (count − 1))` is drawn, or the nearest one that
 * has loaded until it arrives.
 */
export function scrollFrames(
  target: string | HTMLCanvasElement,
  options: ScrollFramesOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const raw = (typeof target === 'string'
    ? document.querySelector(target)
    : target) as HTMLCanvasElement | null;

  if (!raw || raw.tagName.toLowerCase() !== 'canvas') {
    warn('scrollFrames: <canvas> element not found:', target);
    return NOOP;
  }

  const canvas = raw;

  const {
    frames,
    trigger     = {},
    easing      = 'linear',
    once        = false,
    axis        = 'y',
    fit         = 'cover',
    triggerElement,
    onReady,
    onLoad,
    onComplete,
    onProgress,
  } = options || ({} as ScrollFramesOptions);

  // Every input is checked before anything is set up: a refusal leaves no
  // listener, observer or load behind.
  const list = Array.isArray(frames) ? frames : null;
  const countOpt = options?.count;
  const count = Math.floor(
    list ? Math.min(countOpt ?? list.length, list.length) : (countOpt ?? NaN),
  );
  if (!(list || typeof frames === 'function') || !Number.isFinite(count) || count < 1) {
    warn('scrollFrames: no frames. Pass `frames` as an array of URLs, or a function with a finite `count` of 1 or more.', canvas);
    return NOOP;
  }

  let concurrency = options.concurrency ?? 6;
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    warn('scrollFrames: `concurrency` must be a finite number of 1 or more; using 6.', options.concurrency);
    concurrency = 6;
  }
  concurrency = Math.floor(concurrency);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    warn('scrollFrames: the canvas has no 2D context.', canvas);
    return NOOP;
  }

  const last  = count - 1;

  const measured: Element = triggerElement ?? canvas;

  let prefersReduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeFn         = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  /** An easing that returns NaN (a custom one dividing by zero) reads as the start. */
  const ease = (t: number): number => {
    const v = easeFn(t);
    return v === v ? v : 0;
  };
  const startConfig    = parseTrigger(trigger.start || 'top top');
  const endConfig      = parseTrigger(trigger.end   || 'bottom top');

  // ── State ──────────────────────────────────────────────────────────────────
  let tStart       = 0;
  let tEnd         = 0;
  let paused       = false;
  /** With `once`, the floor seek() set: -1 when there is none. */
  let frozenAlpha  = -1;
  /** With `once`, the furthest raw scroll progress, eased after (see scrollAnimate). */
  let frozenRaw    = 0;
  let currentAlpha = 0;
  let completed    = false;
  let destroyed    = false;
  let readyFired   = false;
  /** The zero-length-window warning, given once. */
  let warnedWindow = false;

  /** The frame the scroll calls for. */
  let wanted = 0;
  /** The frame on the canvas: -1 for none, or a canvas cleared by a resize. */
  let drawn  = -1;

  /** Decoded images by index; a hole is a frame not loaded yet, or one that failed. */
  const images: (HTMLImageElement | undefined)[] = new Array(count);
  /** Requested yet, by index. */
  const asked  = new Uint8Array(count);
  /** Images in flight, so destroy() can stop them. */
  const pending = new Set<HTMLImageElement>();
  /** What will load, in order. Reduced motion loads the last frame only. */
  let order   = prefersReduced ? [last] : loadOrder(count);
  let cursor  = 0;
  let settled = 0;
  let loadFired = false;

  /*
   * A user callback that throws must not skip the engine's own steps: before
   * this, an onReady that threw inside an image's settle left the loader
   * stalled (no pump, onLoad never fired), and a throwing onLoad under reduced
   * motion left the canvas blank. Every callback runs through here, after the
   * engine's work, and its error is reported as uncaught (reportError: the
   * window's error event and the console, as if it had thrown from a listener)
   * rather than swallowed or allowed to unwind the engine.
   */
  const fire = <A extends unknown[]>(fn: ((...a: A) => void) | undefined, ...a: A): void => {
    if (!fn) return;
    try {
      fn(...a);
    } catch (e) {
      if (typeof reportError === 'function') reportError(e);
      else setTimeout(() => { throw e; });
    }
  };

  /** The URL of frame `i`, or null when there is none (the function threw, or gave no string). */
  let warnedUrl = false;
  const urlOf = (i: number): string | null => {
    let url: unknown;
    try {
      url = list ? list[i] : (frames as (index: number) => string)(i);
    } catch (e) {
      url = e;
    }
    if (typeof url === 'string' && url) return url;
    if (!warnedUrl) {
      warnedUrl = true;
      warn(`scrollFrames: no URL for frame ${i}; it is skipped for its nearest neighbour.`, url);
    }
    return null;
  };

  const scrollPos = (): number => (axis === 'x' ? window.scrollX : window.scrollY);
  const vpSize    = (): number => (axis === 'x' ? window.innerWidth : window.innerHeight);

  // ── Loading ────────────────────────────────────────────────────────────────

  /** onLoad, once, when everything in the plan has loaded or failed. */
  function loadedAll(): void {
    if (!loadFired && settled === order.length) {
      loadFired = true;
      fire(onLoad);
    }
  }

  function pump(): void {
    while (!destroyed && pending.size < concurrency && cursor < order.length) {
      const i = order[cursor++];
      if (!asked[i]) load(i);
    }
  }

  function load(i: number): void {
    asked[i] = 1;
    const url = urlOf(i);
    if (url === null) {
      // Counted as settled, so onLoad still comes. Deferred, so a pump inside
      // init does not fire onLoad before scrollFrames() has returned.
      settled++;
      queueMicrotask(() => { if (!destroyed) loadedAll(); });
      return;
    }
    const img = new Image();
    let done = false;
    const finish = (ok: boolean): void => {
      if (done || destroyed) return;
      done = true;
      img.onload = img.onerror = null;
      pending.delete(img);
      if (ok) images[i] = img;
      else warn('scrollFrames: a frame failed to load; its nearest neighbour shows instead:', url);
      settled++;
      // The engine's work first, the callbacks (onReady in paint, onLoad) last.
      pump();
      paint();
      loadedAll();
    };
    pending.add(img);
    img.decoding = 'async';
    img.onerror = () => finish(false);
    img.src = url;
    if (typeof img.decode === 'function') {
      // decode() also rejects for an image that is fine (a src it lost a race
      // with, an engine that cannot decode off-thread): fall back to the load.
      img.decode().then(() => finish(true), () => {
        if (img.complete) finish(img.naturalWidth > 0);
        else img.onload = () => finish(true);
      });
    } else {
      img.onload = () => finish(true);
    }
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  /** The loaded frame nearest `i`, searching outward: -1 while none has loaded. */
  function nearest(i: number): number {
    for (let d = 0; d <= last; d++) {
      if (images[i - d]) return i - d;
      if (images[i + d]) return i + d;
    }
    return -1;
  }

  /** The backing store follows the CSS box × devicePixelRatio, capped at 2. */
  function resize(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // No box (display: none, not laid out): keep the canvas's own size.
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw  = Math.round(w * dpr);
    const bh  = Math.round(h * dpr);
    // Setting either clears the canvas, even to the value it has. Within a
    // device pixel is the rounding of a fractional box, not a resize: writing
    // it made a box sized from the attributes creep a pixel a frame.
    if (Math.abs(canvas.width - bw) <= 1 && Math.abs(canvas.height - bh) <= 1) return;
    canvas.width  = bw;
    canvas.height = bh;
    drawn = -1;
    /*
     * A canvas with no CSS size takes its box from these attributes, and one
     * with a CSS width and an auto height takes its height from their ratio.
     * Writing them then moved the box, the observer saw a resize, and at a
     * ratio of 2 an unstyled canvas doubled every frame without end. If this
     * write moved the box, hold the box where it was: its size when both sides
     * followed, its ratio when one did (the other side keeps its CSS).
     */
    const w2 = canvas.clientWidth;
    const h2 = canvas.clientHeight;
    if (w2 !== w || h2 !== h) {
      const st = canvas.style;
      if (w2 !== w && h2 !== h) {
        st.width  = `${w}px`;
        st.height = `${h}px`;
      } else {
        st.aspectRatio = `${w} / ${h}`;
      }
    }
  }

  /** Draw the frame to show, if it is not the one on the canvas already. */
  function paint(): void {
    const show = nearest(wanted);
    if (show < 0 || show === drawn) return;
    const img = images[show]!;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || cw;
    const ih = img.naturalHeight || ch;
    const s  = (fit === 'contain' ? Math.min : Math.max)(cw / iw, ch / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx!.clearRect(0, 0, cw, ch);
    ctx!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    drawn = show;
    if (!readyFired) {
      readyFired = true;
      fire(onReady);
    }
  }

  function applyAlpha(alpha: number): void {
    wanted = Math.min(last, Math.max(0, Math.round(alpha * last)));
    canvas.style.setProperty('--scroll-draw-progress', String(alpha));
    paint();
    fire(onProgress, alpha, wanted);
  }

  // ── Scroll ─────────────────────────────────────────────────────────────────

  function cacheTriggers(): void {
    const rect = measured.getBoundingClientRect();
    const pos  = axis === 'x' ? rect.left : rect.top;
    const size = axis === 'x' ? rect.width : rect.height;
    const result = computeTriggers({ top: pos, height: size }, scrollPos(), vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
    // Once, and only for an element with a box: one hidden at init (display:
    // none) measures zero on every re-measure until it is shown.
    if (tEnd === tStart && size > 0 && !prefersReduced && !warnedWindow) {
      warnedWindow = true;
      warn('scrollFrames: zero-length trigger window, so it never scrubs. In a sticky stage, set triggerElement.', canvas);
    }
  }

  /** Where the scroll is through the window: what runs the frames (core/frame-gate). */
  const at = (): number => computeProgress(scrollPos(), tStart, tEnd, 1);

  function update(): void {
    // Reduced motion shows the last frame and nothing else.
    if (prefersReduced) return;
    const progress = at();
    const alpha = once
      ? Math.max(frozenAlpha, ease(frozenRaw = Math.max(frozenRaw, progress)))
      : ease(progress);
    currentAlpha = alpha;
    applyAlpha(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      fire(onComplete);
    } else if (alpha < 1 && !once) {
      completed = false;
    }
  }

  function showLast(): void {
    currentAlpha = 1;
    applyAlpha(1);
  }

  resize();
  if (!prefersReduced) cacheTriggers();

  // The frames follow the trigger window, as every engine's do: a jump across
  // the whole window paints its last frame. A resize or a layout change
  // re-measures it, and the backing store with it (a zoom changes the ratio).
  const gate = frameGate(window, [measured], at, update, () => {
    resize();
    if (!prefersReduced) cacheTriggers();
    paint();
  });
  /** Frames while nothing stopped them (resume() is the way back, and it checks destroy()). */
  const go = (): void => gate.hold(paused || prefersReduced);
  go();

  if (prefersReduced) showLast();
  pump();

  // A box that changes size without a window resize (a container query, a
  // grid track) redraws at the new size.
  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => { resize(); paint(); })
    : null;
  ro?.observe(canvas);

  // Reduced motion turned on mid-visit stops the scrub on the last frame, as a
  // page loaded under it would, and loads nothing more but that frame. One way,
  // as everywhere (core/motion-live).
  const unwatchMotion = prefersReduced ? () => {} : watchReducedMotion((reduced) => {
    if (!reduced) return;
    unwatchMotion();
    prefersReduced = true;
    gate.hold(true);
    order = order.slice(0, cursor);
    if (!asked[last]) order.push(last);
    loadedAll();
    showLast();
    pump();
  });

  _register(canvas, {
    type: 'frames',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  /*
   * Every method is inert after destroy(). resume() and replay() used to
   * restart the gate destroy() had stopped: its frames ran for good, 60 a
   * second, calling onProgress on a canvas nothing owned.
   */
  function resume(): void {
    if (destroyed || !paused) return;
    paused = false;
    go();
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      gate.off();
      ro?.disconnect();
      unwatchMotion();
      // Stop what is still loading; a decode() that settles later is ignored.
      for (const img of pending) {
        img.onload = img.onerror = null;
        img.src = '';
      }
      pending.clear();
      _unregister(canvas);
    },
    replay() {
      if (destroyed) return;
      frozenAlpha  = -1;
      frozenRaw    = 0;
      completed    = false;
      currentAlpha = 0;
      applyAlpha(0);
      // After pause() or seek() the loop is stopped: start it again.
      resume();
    },
    pause() {
      if (destroyed) return;
      paused = true;
      gate.hold(true);
    },
    resume,
    seek(p: number) {
      if (destroyed) return;
      const clamped = Math.min(1, Math.max(0, p === p ? p : 0));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      frozenRaw     = 0;
      paused        = true;
      gate.hold(true);
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
