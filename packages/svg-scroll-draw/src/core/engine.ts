import type { ScrollDrawOptions, ScrollDrawInstance } from './types';
import { resolveEasing } from './easing';
import { parseTrigger, computeProgress, computeTriggers } from './trigger';
import { measureTriggerFrame } from './trigger-frame';
import { getElementLength } from './geometry';
import { dashFor } from './dash';
import { lerpColor } from './color';
import { PRESETS } from './presets';
import { IS_DEV, warn as warnDev } from './env';
import { cssTimingFor } from './css-easing';
import { _register, _unregister } from './registry';
import { finishWhenReduced } from './motion-live';
import { frameGate } from './frame-gate';

// ── Native CSS scroll-driven animation (animation-timeline: view()) ───────────
// Which easings the fast path can express, and as what, lives in core/css-easing.
// 'spring', 'bounce', 'elastic' and custom function easings have no equivalent,
// so those configs stay on the JS engine.

// Unique keyframes name per native instance so multiple draws don't collide.
let nativeUid = 0;

function supportsNativeTimeline(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()') &&
    // The fast path anchors the timeline to the container via a named
    // view-timeline, so named-timeline support is also required — without it the
    // animation-timeline reference would not resolve and nothing would animate.
    CSS.supports('view-timeline-name: --x')
  );
}

/**
 * The paint that actually applies to `el`. Computed style folds in CSS classes,
 * inline styles and presentation attributes; the attribute is the fallback only
 * where there is no style engine to ask. Reading the attribute alone warned
 * "no stroke" for every path stroked from CSS — a class, Tailwind's
 * `stroke-current` — though those paths draw perfectly well.
 */
function paintOf(el: SVGElement, prop: 'stroke' | 'fill'): string {
  let computed = '';
  try {
    computed = getComputedStyle(el).getPropertyValue(prop).trim();
  } catch {
    /* no CSSOM — fall back to the attribute */
  }
  return computed || (el.getAttribute(prop) ?? '').trim();
}

const NO_PAINT = new Set(['', 'none', 'transparent', 'rgba(0, 0, 0, 0)']);

function checkElement(el: SVGElement): void {
  if (!IS_DEV) return;
  const stroke = paintOf(el, 'stroke');
  if (!stroke || stroke === 'none') {
    warnDev('Element has no stroke — path will not be visible.', el);
    return;
  }
  // Only a fill someone declared: browsers compute an unset fill as black, and
  // warning on every path that never mentions fill would be noise of its own.
  const declaredFill = (el.getAttribute('fill') ?? '').trim();
  if (declaredFill && !NO_PAINT.has(declaredFill) && !NO_PAINT.has(paintOf(el, 'fill')))
    warnDev('Element has a fill — it may obscure the stroke animation.', el);
}

/**
 * Debug overlay showing the computed trigger lines.
 *
 * Returns a teardown function as well as the node. The previous version only
 * returned the node, so its `scroll` listener was never removed — and because
 * cacheTriggers() rebuilds the overlay on every resize, listeners accumulated
 * while the detached nodes stayed reachable from those closures. A leak in the
 * tool you reach for when something is already wrong.
 */
function createDebugOverlay(
  tStart: number,
  tEnd: number,
  axis: 'x' | 'y',
): { el: HTMLElement; destroy: () => void } {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-svg-scroll-draw-debug', '');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;font-family:monospace;font-size:11px;top:0;left:0;right:0;bottom:0;';
  function update() {
    const scroll = axis === 'x' ? window.scrollX : window.scrollY;
    const a = tStart - scroll, b = tEnd - scroll, x = axis === 'x';
    overlay.innerHTML = `
      <div style="position:absolute;${x?`left:${a}px;top:0;bottom:0;border-left:2px dashed #22c55e;`:`top:${a}px;left:0;right:0;border-top:2px dashed #22c55e;`}padding:2px 6px;color:#22c55e;background:rgba(0,0,0,.6)">▶ start</div>
      <div style="position:absolute;${x?`left:${b}px;top:0;bottom:0;border-left:2px dashed #ef4444;`:`top:${b}px;left:0;right:0;border-top:2px dashed #ef4444;`}padding:2px 6px;color:#ef4444;background:rgba(0,0,0,.6)">■ end</div>`;
  }
  document.body.appendChild(overlay);
  window.addEventListener('scroll', update, { passive: true });
  update();
  return {
    el: overlay,
    destroy() {
      window.removeEventListener('scroll', update);
      overlay.remove();
    },
  };
}

// ── Path morphing helpers ─────────────────────────────────────────────────────

const PATH_NUMBER = /[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g;
const PATH_COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/g;

/**
 * Warns when two path strings cannot be interpolated coordinate-for-coordinate.
 *
 * morphPath() walks the numbers in `from` and pairs each with the number at the
 * same index in `to`. That is only meaningful when both paths have the same
 * command sequence and the same number count. When they differ the result is
 * silently wrong and never reaches the target shape:
 *
 *   'M10 10 L90 90' -> 'M10 10 C20 20, 40 40, 90 90'  ends at 'M10 10 L20 20'
 *   'M10 10 L50 50 L90 90' -> 'M20 20 L80 80'         ends at 'M20 20 L80 80 L90 90'
 *
 * Dev-only, and checked once at init rather than per frame.
 */
function checkMorphCompatible(from: string, to: string, el: SVGElement): void {
  if (!IS_DEV) return;

  const fromCmds = (from.match(PATH_COMMAND) ?? []).join('').toUpperCase();
  const toCmds   = (to.match(PATH_COMMAND) ?? []).join('').toUpperCase();
  const fromNums = (from.match(PATH_NUMBER) ?? []).length;
  const toNums   = (to.match(PATH_NUMBER) ?? []).length;

  if (fromCmds !== toCmds) {
    warnDev(
      `morphTo: command sequence differs (${fromCmds || '∅'} → ${toCmds || '∅'}). ` +
        `Interpolation is coordinate-for-coordinate, so the result will not reach ` +
        `the target shape. Redraw both paths with the same commands.`,
      el,
    );
    return;
  }

  if (fromNums !== toNums) {
    warnDev(
      `morphTo: coordinate count differs (${fromNums} → ${toNums}). ` +
        `Extra coordinates are ignored and missing ones hold their start value, ` +
        `so the result will not reach the target shape.`,
      el,
    );
  }
}

function morphPath(from: string, to: string, t: number): string {
  const toNums = (to.match(/[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
  let idx = 0;
  return from.replace(/[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g, (match) => {
    const f = parseFloat(match);
    const target = toNums[idx++] ?? f;
    return String(+(f + (target - f) * t).toFixed(4));
  });
}

export function createEngine(
  container: Element,
  rawOptions: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') {
    return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };
  }
  // Reduced motion turned on mid-visit finishes the drawing as a page loaded
  // under it would (core/motion-live).
  return finishWhenReduced(rawOptions, (options, reduced) => buildEngine(container, options, reduced));
}

function buildEngine(
  container: Element,
  rawOptions: ScrollDrawOptions,
  prefersReduced: boolean,
): ScrollDrawInstance {
  // Apply preset as base — user options always win
  const { preset, ...userOptions } = rawOptions;
  const options: ScrollDrawOptions = preset
    ? { ...PRESETS[preset], ...userOptions }
    : userOptions;

  const {
    selector       = 'path, polyline, line, polygon, rect, circle',
    speed          = 1,
    fade           = false,
    easing         = 'linear',
    trigger        = {},
    stagger        = 0,
    direction      = 'forward',
    once           = false,
    debug          = false,
    axis           = 'y',
    scrollContainer,
    autoReverse    = false,
    delay          = 0,
    strokeColor,
    strokeWidth,
    fillOpacity,
    waypoints,
    velocityScale  = false,
    threshold      = 0,
    rootMargin     = '0px',
    repeat         = 0,
    repeatDelay    = 0,
    morphTo,
    clip,
    autoplay    = false,
    duration    = 1000,
    native      = true,
    onProgress,
    onStart,
    onComplete,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
  } = options;

  const clipDirection: 'left' | 'right' | 'top' | 'bottom' | 'center' | false =
    clip === true ? 'left' : (typeof clip === 'string' ? clip : false);

  const easeFn      = resolveEasing(easing);
  const startConfig = parseTrigger(trigger.start || 'top bottom');
  const endConfig   = parseTrigger(trigger.end   || 'bottom top');

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  const colorFrom        = Array.isArray(strokeColor)  ? strokeColor[0]  : null;
  const colorTo          = Array.isArray(strokeColor)  ? strokeColor[1]  : (typeof strokeColor  === 'string' ? strokeColor  : null);
  const widthFrom        = Array.isArray(strokeWidth)  ? strokeWidth[0]  : null;
  const widthTo          = Array.isArray(strokeWidth)  ? strokeWidth[1]  : (typeof strokeWidth  === 'number' ? strokeWidth  : null);
  const fillOpacityFrom  = Array.isArray(fillOpacity)  ? fillOpacity[0]  : null;
  const fillOpacityTo    = Array.isArray(fillOpacity)  ? fillOpacity[1]  : (typeof fillOpacity  === 'number' ? fillOpacity  : null);

  // ── Clip-path helpers ────────────────────────────────────────────────────

  function computeClipPath(alpha: number): string {
    const p = alpha * 100;
    switch (clipDirection) {
      case 'right':  return `inset(0 0 0 ${100 - p}%)`;
      case 'top':    return `inset(0 0 ${100 - p}% 0)`;
      case 'bottom': return `inset(${100 - p}% 0 0 0)`;
      case 'center': return `circle(${alpha * 150}% at 50% 50%)`;
      default:       return `inset(0 ${100 - p}% 0 0)`;  // 'left'
    }
  }

  // In clip mode skip SVG path queries — nothing to stroke-animate
  const paths: SVGElement[] = clipDirection
    ? []
    : Array.from(container.querySelectorAll<SVGElement>(selector));
  const lengths:    number[]     = [];
  const originalDs: string[]     = [];

  let tStart        = 0;
  let tEnd          = 0;
  /** `stagger` as used: smaller only when the page ends first (fitStagger). */
  let staggerFit    = stagger;
  /**
   * The scroll range in which some path is mid-draw, stagger and speed
   * included: what runs the JS path's frames (core/frame-gate).
   */
  let gStart        = 0;
  let gEnd          = 0;
  let completed     = false;
  let started       = false;
  let rafId         = 0;
  let frozenAlpha   = -1;
  /**
   * With `once`, how far the scroll has got through each path's window, raw:
   * see latch(). Per path because `stagger` gives each its own window: a single
   * shared value handed the first path's progress to every later one, so `once`
   * quietly cancelled the stagger. Clip mode keeps its one value at index 0.
   * `frozenAlpha` is the floor under them, eased: what `seek()` sets.
   */
  let frozenPath: number[] = [];
  let prevScroll    = -1;
  let paused        = false;
  let currentAlpha  = 0;
  let repeatCount   = 0;
  let repeatTimer: ReturnType<typeof setTimeout> | undefined;
  /**
   * A repeat whose delay is up, waiting for the scroll to be inside the window
   * (restart()). Restarting wherever the scroll was repainted past the window
   * drawn whole at once: complete, the next timer, again, forever.
   */
  let parked        = false;
  let debugOverlay: { el: HTMLElement; destroy: () => void } | null = null;
  /** Tears down the overlay and its scroll listener, if one is mounted. */
  function destroyDebugOverlay(): void {
    debugOverlay?.destroy();
    debugOverlay = null;
  }
  const firedWaypoints = new Set<number>();

  // Idle short-circuit state. `lastAppliedScroll` is the scroll position the
  // currently-rendered frame was computed from; NaN means "nothing rendered yet".
  // `dirty` forces one recompute even when the scroll position is unchanged —
  // set by anything that invalidates the rendered frame (replay, repeat, resize,
  // resume).
  let lastAppliedScroll = NaN;
  let dirty             = true;

  // velocity tracking
  let prevVelScroll    = -1;
  let prevVelTime      = performance.now();
  let prevRawProgress  = NaN;

  // ── Axis / container helpers ──────────────────────────────────────────────

  function scrollPos(): number {
    if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return axis === 'x' ? window.scrollX : window.scrollY;
  }

  function vpSize(): number {
    if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  }

  /** The trigger window as the layout stands right now. */
  function measureTriggers(): { tStart: number; tEnd: number } {
    const frame = measureTriggerFrame(container, scrollEl, axis);
    return computeTriggers(frame, frame.scroll, vpSize(), startConfig, endConfig);
  }

  /**
   * Path i's window starts i × stagger × range after the first, so the last one
   * ends past trigger.end — near the bottom of a page, further than the page
   * scrolls. Measured on 2.19.0 with the page ending 200px after trigger.end:
   * the last two of four paths stopped at 0.75 and 0.5 drawn, on screen, and
   * onComplete never fired. Only then is the stagger tightened, evenly, so the
   * last path finishes where the page ends. A page with room keeps the stagger
   * as written, and a trigger whose own end is past the page is left alone:
   * stagger is not what stops that one. 1px of slack for a fractional scroll.
   *
   * The frames run from where the first path to start starts until the last
   * one is done (gStart, gEnd): past trigger.end, off screen, while a later
   * path is still mid-window.
   */
  function fitStagger(): void {
    const range = tEnd - tStart;
    const gaps  = paths.length - 1;
    const s     = scrollEl ?? document.documentElement;
    const d     = axis === 'x' ? 'Width' : 'Height';
    staggerFit = stagger;
    if (stagger > 0 && gaps > 0 && range > 0) {
      // How far the page scrolls past the point where the first path is done.
      const room = s[`scroll${d}`] - s[`client${d}`] - 1 - tStart - range / speed;
      if (room >= 0) staggerFit = Math.min(stagger, room / (gaps * range));
    }
    // Where the last path's window starts, and how long one runs: never faster
    // than the raw window, so a slow `speed` runs on until its progress reaches 1.
    const span = Math.max(0, gaps) * staggerFit * range;
    const len  = range / Math.min(speed, 1);
    // Every path's window, first start to last end, in scroll order: a
    // negative stagger starts the later paths first, and a trigger whose end
    // is above its start (a negative range) runs every window backwards.
    // Taking only the forward case left a staggered path half drawn there.
    gStart = tStart + Math.min(0, span, len, span + len);
    gEnd   = tStart + Math.max(0, span, len, span + len);
  }

  function cacheTriggers(): void {
    ({ tStart, tEnd } = measureTriggers());
    fitStagger();
    if (debug && IS_DEV) {
      destroyDebugOverlay();
      debugOverlay = createDebugOverlay(tStart, tEnd, axis);
    }
  }

  /**
   * List the instance in the shared registry so devtools can see it, and take it
   * out again on destroy(). Every live path (native, autoplay, JS) returns
   * through here; the inert ones (no window, reduced motion) do not register,
   * matching the other engines. The default trigger is measured live, because
   * only the JS path keeps a cached window.
   */
  function tracked(inst: ScrollDrawInstance, getTrigger = measureTriggers): ScrollDrawInstance {
    _register(container, { type: 'draw', getProgress: () => inst.getProgress(), getTrigger });
    const destroy = inst.destroy;
    inst.destroy = () => {
      destroy.call(inst);
      _unregister(container);
    };
    return inst;
  }

  /**
   * Path i's alpha from its raw scroll progress. With `once` the raw progress
   * is held at its furthest and eased after, as scrollText does: holding the
   * eased value with Math.max froze spring and elastic on their overshoot past
   * 1 (drawn 1.27 for good in Chromium on 2.23.2) and flattened bounce's dips.
   */
  function latch(i: number, raw: number): number {
    return once && !autoReverse
      ? Math.max(frozenAlpha, easeFn(frozenPath[i] = Math.max(frozenPath[i] ?? 0, raw)))
      : easeFn(raw);
  }

  // ── Apply alpha to all paths ──────────────────────────────────────────────

  function applyAlpha(alpha: number, dir: 'forward' | 'reverse'): void {
    (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(alpha));
    if (clipDirection) {
      const a = dir === 'reverse' ? 1 - alpha : alpha;
      (container as HTMLElement).style.clipPath = computeClipPath(a);
      return;
    }
    paths.forEach((el, i) => paint(el, i, alpha, dir));
  }

  /**
   * One path's frame at `alpha`, for seek(), the scroll loop and autoplay,
   * which each had their own copy of it until 2.23.3.
   */
  function paint(el: SVGElement, i: number, alpha: number, dir: 'forward' | 'reverse'): void {
    el.style.strokeDashoffset =
      dir === 'reverse' ? `${lengths[i] * alpha}` : `${lengths[i] * (1 - alpha)}`;

    if (fade) el.style.opacity = dir === 'reverse' ? `${1 - alpha}` : `${alpha}`;

    if (colorFrom && colorTo) el.style.stroke = lerpColor(colorFrom, colorTo, alpha);
    else if (colorTo) el.style.stroke = colorTo;

    if (widthFrom !== null && widthTo !== null)
      el.style.strokeWidth = `${widthFrom + (widthTo - widthFrom) * alpha}`;
    else if (widthTo !== null)
      el.style.strokeWidth = `${widthTo}`;

    if (fillOpacityFrom !== null && fillOpacityTo !== null)
      el.style.fillOpacity = `${fillOpacityFrom + (fillOpacityTo - fillOpacityFrom) * alpha}`;
    else if (fillOpacityTo !== null)
      el.style.fillOpacity = `${fillOpacityTo}`;

    if (morphTo && el.tagName.toLowerCase() === 'path' && originalDs[i])
      el.setAttribute('d', morphPath(originalDs[i], morphTo, alpha));
  }

  function resetPaths(): void {
    (container as HTMLElement).style.setProperty('--scroll-draw-progress', '0');
    if (clipDirection) {
      // Reversed, progress 0 is fully shown, as applyAlpha() draws it.
      (container as HTMLElement).style.clipPath = computeClipPath(direction === 'reverse' ? 1 : 0);
      return;
    }
    paths.forEach((el, i) => {
      el.style.strokeDasharray  = dashFor(lengths[i]);
      el.style.strokeDashoffset = direction === 'reverse' ? '0' : `${lengths[i]}`;
      if (fade) el.style.opacity = direction === 'reverse' ? '1' : '0';
      else el.style.opacity = '';
      if (colorFrom) el.style.stroke = colorFrom;
      if (widthFrom !== null) el.style.strokeWidth = `${widthFrom}`;
      if (fillOpacityFrom !== null) el.style.fillOpacity = `${fillOpacityFrom}`;
      if (morphTo && el.tagName.toLowerCase() === 'path' && originalDs[i])
        el.setAttribute('d', originalDs[i]);
    });
  }

  /**
   * Path i's dash, measured. With morphTo it is the longer of the path's own
   * outline and the target's, so the line is whole at both ends of the morph:
   * sized to the starting path alone, a morph to a longer outline ended at
   * progress 1 with most of it undrawn. Read here and on a layout change, not
   * every frame, with the path's `d` put back as it was.
   */
  function measure(el: SVGElement, i: number): void {
    const d = el.getAttribute('d');
    let len = getElementLength(el);
    if (morphTo && originalDs[i]) {
      el.setAttribute('d', morphTo);
      const target = getElementLength(el);
      el.setAttribute('d', originalDs[i]);
      len = Math.max(getElementLength(el), target);
      el.setAttribute('d', d!);
    }
    lengths[i] = len;
    el.style.strokeDasharray = dashFor(len);
  }

  // ── Init paths ────────────────────────────────────────────────────────────

  paths.forEach((el, i) => {
    checkElement(el);
    const isPath = el.tagName.toLowerCase() === 'path';
    if (isPath) originalDs.push(el.getAttribute('d') ?? '');
    else originalDs.push('');
    measure(el, i);
    const len = lengths[i];

    if (morphTo) {
      if (!isPath) {
        warnDev(`morphTo only applies to <path> elements — ignored on <${el.tagName}>.`, el);
      } else {
        checkMorphCompatible(originalDs[originalDs.length - 1], morphTo, el);
      }
    }

    if (prefersReduced) {
      el.style.strokeDashoffset = direction === 'reverse' ? `${len}` : '0';
      if (fade) el.style.opacity = '1';
      if (colorTo) el.style.stroke = colorTo;
      if (widthTo !== null) el.style.strokeWidth = `${widthTo}`;
      if (fillOpacityTo !== null) el.style.fillOpacity = `${fillOpacityTo}`;
      if (morphTo && el.tagName.toLowerCase() === 'path') el.setAttribute('d', morphTo);
    } else {
      el.style.strokeDashoffset = direction === 'reverse' ? '0' : `${len}`;
      if (fade) el.style.opacity = direction === 'reverse' ? '1' : '0';
      else el.style.opacity = '';
      if (colorFrom) el.style.stroke = colorFrom;
      if (widthFrom !== null) el.style.strokeWidth = `${widthFrom}`;
      if (fillOpacityFrom !== null) el.style.fillOpacity = `${fillOpacityFrom}`;
    }
  });

  if (prefersReduced) {
    if (clipDirection) (container as HTMLElement).style.clipPath = computeClipPath(1);
    onComplete?.();
    return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 1 };
  }
  // A reversed clip starts fully shown. computeClipPath(0) here hid it until
  // the first frame, which then showed it whole: a flash of nothing.
  if (clipDirection) (container as HTMLElement).style.clipPath = computeClipPath(direction === 'reverse' ? 1 : 0);

  // ── Native CSS fast path ──────────────────────────────────────────────────
  // Hand the draw to CSS scroll timelines when the config is simple enough that CSS
  // reproduces it exactly. Anything CSS can't express keeps the JS engine below.
  //
  // The timeline is a NAMED `view-timeline` declared on the container, which the
  // paths then reference. This matters: an earlier version put
  // `animation-timeline: view()` directly on each path, which makes each path
  // its own timeline subject. Since a path's bounding box is almost never the
  // same as its container's box, the native and JS engines silently disagreed —
  // measured at up to 6 percentage points apart in Chromium and 11 in WebKit
  // mid-scroll — and multi-path SVGs additionally got a different timeline per
  // path. Anchoring the timeline to the container is what actually makes the
  // native substitution equivalent to the JS trigger range.

  /**
   * The CSS timing function reproducing this instance's easing, or null when
   * there is none. Resolved once: it is both the eligibility test and the value
   * the generated stylesheet needs.
   */
  const cssTiming = typeof easing === 'string' ? cssTimingFor(easing) : null;

  function nativeEligible(): boolean {
    if (native === false) return false;
    // Autoplay runs on a clock, not the scroll: on 2.23.2 a plain
    // `{ autoplay: true }` came here and the drawing followed the page.
    if (autoplay) return false;
    // The trigger-line overlay is drawn by the JS engine only (cacheTriggers),
    // and only in a development build: debug left on in production keeps native.
    if (debug && IS_DEV) return false;
    if (!supportsNativeTimeline()) return false;
    if (!paths.length) return false;
    // Only easings CSS can reproduce (no 'spring', no custom fn).
    if (!cssTiming) return false;
    // Features with no declarative CSS equivalent → stay on the JS engine.
    if (clipDirection) return false;
    if (axis !== 'y') return false;          // view() block axis only
    if (scrollEl) return false;              // custom scroll container
    if (speed !== 1) return false;
    if (stagger !== 0) return false;
    if (once) return false;                  // CSS scroll progress can't latch
    if (autoReverse) return false;
    if (velocityScale !== false) return false;
    if (morphTo) return false;
    if (waypoints) return false;
    if (repeat) return false;
    if (delay > 0) return false;
    if (onProgress || onStart || onComplete || onEnter || onLeave || onEnterBack || onLeaveBack) return false;
    if (strokeColor != null || strokeWidth != null || fillOpacity != null) return false;
    // Only the default trigger maps cleanly to the CSS `cover` range.
    if ((trigger.start || 'top bottom').trim() !== 'top bottom') return false;
    if ((trigger.end   || 'bottom top').trim() !== 'bottom top') return false;
    return true;
  }

  function buildNative(): ScrollDrawInstance {
    const uid          = ++nativeUid;
    const cls          = `svg-scroll-draw-${uid}`;
    const containerCls = `svg-scroll-draw-host-${uid}`;
    const timeline     = `--svg-scroll-draw-${uid}`;

    const fromO  = direction === 'reverse' ? '0' : 'var(--ssd-len)';
    const toO    = direction === 'reverse' ? 'var(--ssd-len)' : '0';
    let fromBody = `stroke-dashoffset:${fromO};`;
    let toBody   = `stroke-dashoffset:${toO};`;
    if (fade) {
      fromBody += `opacity:${direction === 'reverse' ? 1 : 0};`;
      toBody   += `opacity:${direction === 'reverse' ? 0 : 1};`;
    }

    const style = document.createElement('style');
    style.setAttribute('data-svg-scroll-draw', '');
    style.textContent =
      `@keyframes ${cls}{from{${fromBody}}to{${toBody}}}` +
      // The container owns the timeline, so its box defines the range — matching
      // the JS engine's `top bottom` → `bottom top` window exactly.
      `.${containerCls}{view-timeline-name:${timeline};view-timeline-axis:block;}` +
      `.${cls}{animation-name:${cls};animation-duration:auto;` +
      `animation-timing-function:${cssTiming};` +
      `animation-fill-mode:both;animation-timeline:${timeline};` +
      `animation-range:cover 0% cover 100%;}`;
    document.head.appendChild(style);

    container.classList.add(containerCls);

    function attach(el: SVGElement, i: number): void {
      el.style.setProperty('--ssd-len', String(lengths[i]));
      el.style.strokeDasharray  = dashFor(lengths[i]);
      el.style.strokeDashoffset = '';
      el.style.opacity          = '';
      el.style.animationPlayState = '';
      el.classList.add(cls);
    }
    paths.forEach(attach);

    let paused   = false;
    let lastSeek = -1;

    function liveProgress(): number {
      if (lastSeek >= 0) return lastSeek;
      const rect = container.getBoundingClientRect();
      const { tStart, tEnd } = computeTriggers(
        { top: rect.top, height: rect.height },
        scrollPos(), vpSize(), startConfig, endConfig
      );
      return easeFn(computeProgress(scrollPos(), tStart, tEnd, speed));
    }

    return {
      destroy() {
        container.classList.remove(containerCls);
        paths.forEach((el) => {
          el.classList.remove(cls);
          el.style.removeProperty('--ssd-len');
          el.style.animationPlayState = '';
        });
        style.remove();
      },
      replay() {
        paused = false;
        lastSeek = -1;
        paths.forEach(attach);
      },
      pause() {
        paused = true;
        paths.forEach((el) => { el.style.animationPlayState = 'paused'; });
      },
      resume() {
        if (!paused) return;
        paused = false;
        paths.forEach((el) => { el.style.animationPlayState = 'running'; });
      },
      seek(progress: number) {
        const p = Math.min(1, Math.max(0, progress));
        lastSeek = p;
        paused = true;
        // Leave the scroll timeline and pin the frame manually.
        paths.forEach((el, i) => {
          el.classList.remove(cls);
          el.style.strokeDashoffset =
            direction === 'reverse' ? `${lengths[i] * p}` : `${lengths[i] * (1 - p)}`;
          if (fade) el.style.opacity = direction === 'reverse' ? `${1 - p}` : `${p}`;
        });
      },
      getProgress() {
        return liveProgress();
      },
      /**
       * Re-measure the path lengths.
       *
       * There is no trigger window to refresh on this path — the browser's own
       * view-timeline is live and never goes stale — but `--ssd-len` is a number
       * baked in at attach time, and the keyframes interpolate from it. A path
       * that changed length keeps animating to the old one until this is called.
       */
      refresh() {
        paths.forEach((el, i) => {
          measure(el, i);
          el.style.setProperty('--ssd-len', String(lengths[i]));
        });
      },
    };
  }

  if (nativeEligible()) return tracked(buildNative());

  // ── Autoplay / viewport-enter animation ──────────────────────────────────

  function buildAutoplay(): ScrollDrawInstance {
    const effectiveDuration = Math.max(1, duration);
    /**
     * The whole run: with a stagger, path i starts i × stagger × duration late,
     * so the last one ends (n − 1) × stagger × duration after the first. seek(),
     * getProgress(), onProgress, --scroll-draw-progress and waypoints all span
     * this, not `duration`: covering only `duration` left seek(1) with the later
     * paths part-drawn and getProgress() at 1 while they still drew. Without a
     * stagger (or in clip mode) it is just `duration`.
     */
    const runMs = clipDirection
      ? effectiveDuration
      : effectiveDuration * (1 + Math.max(0, paths.length - 1) * stagger);
    let startTime    = 0;
    let pausedElapsed = 0;
    // Whether a run is currently in flight. Guards pause()/resume() against
    // reading a stale startTime while the element sits outside the viewport.
    let running      = false;

    function applyAutoAlpha(elapsed: number): boolean {
      let allDone = true;
      // How far through the whole run (see runMs).
      const runRaw = Math.min(1, Math.max(0, elapsed / runMs));

      if (clipDirection) {
        const raw   = Math.min(1, Math.max(0, elapsed / effectiveDuration));
        const alpha = easeFn(raw);
        currentAlpha = alpha;
        (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(alpha));
        (container as HTMLElement).style.clipPath = computeClipPath(direction === 'reverse' ? 1 - alpha : alpha);
        onProgress?.(alpha);
        if (raw < 1) allDone = false;
      } else {
        paths.forEach((el, i) => {
          const staggerMs = i * stagger * effectiveDuration;
          const raw       = Math.min(1, Math.max(0, (elapsed - staggerMs) / effectiveDuration));
          paint(el, i, easeFn(raw), direction);
          if (raw < 1) allDone = false;
        });

        // The instance's progress is the run's, eased like each path: the
        // same as the one path without a stagger, and 1 only once the last
        // path is drawn.
        const runAlpha = easeFn(runRaw);
        currentAlpha = runAlpha;
        onProgress?.(runAlpha);
        (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(runAlpha));
      }

      if (waypoints) {
        const globalAlpha = easeFn(runRaw);
        for (const key in waypoints) {
          const t = parseFloat(key);
          if (globalAlpha >= t && !firedWaypoints.has(t)) {
            firedWaypoints.add(t);
            waypoints[key as unknown as number]?.();
          }
        }
      }

      return allDone;
    }

    function tick(now: number): void {
      if (paused) return;
      const elapsed = now - startTime;

      if (!started) { started = true; onStart?.(); }

      const done = applyAutoAlpha(elapsed);

      if (done && !completed) {
        completed = true;
        applyAutoAlpha(runMs);
        onComplete?.();
        const maxRepeats = repeat === 'infinite' ? Infinity : (repeat ?? 0);
        if (repeatCount < maxRepeats) {
          repeatCount++;
          repeatTimer = setTimeout(() => {
            startTime = performance.now();
            started   = false;
            completed = false;
            firedWaypoints.clear();
            resetPaths();
            rafId = requestAnimationFrame(tick);
          }, repeatDelay);
        }
        return;
      }

      if (!done) rafId = requestAnimationFrame(tick);
    }

    function startAnimation(): void {
      cancelAnimationFrame(rafId);
      clearTimeout(repeatTimer);
      startTime     = performance.now();
      pausedElapsed = 0;
      paused        = false;
      started       = false;
      completed     = false;
      repeatCount   = 0;
      running       = true;
      currentAlpha  = 0;
      firedWaypoints.clear();
      resetPaths();
      rafId = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !(once && completed)) {
            startAnimation();
          } else if (!e.isIntersecting && !once && !completed) {
            cancelAnimationFrame(rafId);
            clearTimeout(repeatTimer);
            // The next viewport entry calls startAnimation(), which re-stamps
            // startTime. Just mark the run as stopped — nulling startTime here
            // made pause() compute NaN and froze the animation permanently.
            running = false;
          }
        });
      },
      { root: scrollEl ?? null, threshold, rootMargin },
    );

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize(): void {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => paths.forEach(measure), 150);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    if (delay > 0) setTimeout(() => observer.observe(container), delay);
    else observer.observe(container);

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        clearTimeout(repeatTimer);
        observer.disconnect();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        clearTimeout(resizeTimer);
      },
      replay() {
        repeatCount = 0;
        startAnimation();
      },
      pause() {
        if (paused || !running) return;
        paused        = true;
        pausedElapsed = performance.now() - startTime;
        cancelAnimationFrame(rafId);
      },
      resume() {
        if (!paused) return;
        paused    = false;
        running   = true;
        startTime = performance.now() - pausedElapsed;
        rafId     = requestAnimationFrame(tick);
      },
      seek(p: number) {
        const clamped = Math.min(1, Math.max(0, p));
        currentAlpha  = clamped;
        paused        = true;
        pausedElapsed = clamped * runMs;
        startTime     = performance.now() - pausedElapsed;
        cancelAnimationFrame(rafId);
        applyAutoAlpha(pausedElapsed);
      },
      getProgress() { return currentAlpha; },
      /** No trigger window on this path — it runs on time — so lengths only. */
      refresh() {
        clearTimeout(resizeTimer);
        paths.forEach(measure);
      },
    };
  }

  if (autoplay) return tracked(buildAutoplay());

  cacheTriggers();

  // ── Repeat ────────────────────────────────────────────────────────────────

  /** Where the scroll is through the window every path's draw runs in. */
  const at = (): number => computeProgress(scrollPos(), gStart, gEnd, 1);

  /**
   * onComplete, and the next repeat when one is left. A repeat restarts while
   * the scroll is inside the window, as `repeat` meant while the drawing was on
   * screen up to 2.23.4. Past it, or before it, the timer only parks: the
   * drawing stays at the frame the scroll calls for, no frame runs, and the
   * first frame back inside the window restarts it. Restarting there instead
   * repainted the end of the window: drawn whole, complete, the next timer, 60
   * times a second with repeatDelay 0, and `repeat: 2` spent in one frame.
   */
  function complete(): void {
    completed = true;
    onComplete?.();
    if (repeatCount < (repeat === 'infinite' ? Infinity : repeat)) {
      repeatCount++;
      repeatTimer = setTimeout(() => { parked = true; }, repeatDelay);
    }
  }

  /** Back to the first frame: replay(), and a repeat inside the window. */
  function restart(): void {
    frozenAlpha = -1;
    frozenPath  = [];
    started     = false;
    completed   = false;
    parked      = false;
    firedWaypoints.clear();
    resetPaths();
    // Wound back to zero at an unchanged scroll position, so the frame must
    // recompute rather than short-circuit.
    dirty = true;
  }

  // ── rAF update loop ───────────────────────────────────────────────────────

  function update(): void {
    const now           = performance.now();
    const currentScroll = scrollPos();
    // Inside the window frames run every frame: a parked repeat starts here.
    // at() is in [0, 1], so `% 1` is 0 at either end of the window.
    if (parked && at() % 1) restart();

    // ── Idle short-circuit ────────────────────────────────────────────────────
    // While the scroll is inside the window this loop runs every frame whether
    // or not the user is scrolling. Measured in Chromium: 8 instances sitting in a
    // viewport with no scrolling at all cost 488 frames and 6.4 ms of JS per
    // second, recomputing identical values and rewriting identical styles.
    //
    // If the scroll position has not moved and nothing has invalidated the
    // rendered frame, skip the body but keep the loop alive so the next real
    // scroll is picked up immediately.
    //
    // velocityScale is excluded: its output depends on elapsed time as velocity
    // decays, so it genuinely needs a frame even at a fixed scroll position.
    if (!dirty && velocityScale === false && currentScroll === lastAppliedScroll) return;
    dirty = false;
    lastAppliedScroll = currentScroll;

    // Velocity scaling
    let effectiveSpeed = speed;
    if (velocityScale !== false) {
      const dt  = now - prevVelTime;
      const vel = dt > 0 ? Math.abs(currentScroll - (prevVelScroll < 0 ? currentScroll : prevVelScroll)) / dt : 0;
      const sensitivity = typeof velocityScale === 'number' ? velocityScale : 1;
      effectiveSpeed = speed * Math.max(0.2, 1 + vel * sensitivity * 0.04);
    }
    prevVelScroll = currentScroll;
    prevVelTime   = now;

    const effectiveDir = autoReverse
      ? (prevScroll === -1 || currentScroll >= prevScroll ? 'forward' : 'reverse')
      : direction;
    prevScroll = currentScroll;

    const range = tEnd - tStart;
    let allComplete = true;

    // ── Scroll callbacks (onEnter / onLeave / onEnterBack / onLeaveBack) ───────
    const rawProgress = range === 0 ? 0 : (currentScroll - tStart) / range;
    if (!isNaN(prevRawProgress)) {
      // In the order the scroll crosses the edges: a jump back from past the
      // end to before the start enters back, then leaves back, so a callback
      // pair that shows and hides ends hidden.
      if (prevRawProgress <= 0 && rawProgress > 0) onEnter?.();
      if (prevRawProgress < 1 && rawProgress >= 1) onLeave?.();
      if (prevRawProgress >= 1 && rawProgress < 1) onEnterBack?.();
      if (prevRawProgress > 0 && rawProgress <= 0) onLeaveBack?.();
    }
    prevRawProgress = rawProgress;

    // ── Clip mode: animate clipPath on container, skip per-path logic ─────────
    if (clipDirection) {
      const alpha = latch(0, computeProgress(currentScroll, tStart, tEnd, effectiveSpeed));
      currentAlpha = alpha;
      (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(alpha));
      const visual = effectiveDir === 'reverse' ? 1 - alpha : alpha;
      (container as HTMLElement).style.clipPath = computeClipPath(visual);
      onProgress?.(alpha);
      if (!started && computeProgress(currentScroll, tStart, tEnd, effectiveSpeed) > 0) {
        started = true;
        onStart?.();
      }
      if (alpha >= 1 && !completed) {
        complete();
      } else if (alpha < 1 && !once) {
        completed = false;
      }
      return;
    }
    // ── End clip mode ─────────────────────────────────────────────────────────

    paths.forEach((el, i) => {
      const offset = i * staggerFit * range;
      const alpha = latch(i, computeProgress(currentScroll, tStart + offset, tEnd + offset, effectiveSpeed));
      paint(el, i, alpha, effectiveDir);

      if (i === 0) {
        // The first path is the instance's progress, as on the autoplay path:
        // getProgress() used to take whichever path ran last, so under stagger
        // it read 0.3 while onProgress and --scroll-draw-progress read 0.9.
        // onComplete still waits for the last path.
        currentAlpha = alpha;
        onProgress?.(alpha);
        (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(alpha));
      }
      if (alpha < 1) allComplete = false;
    });

    // Waypoints
    if (waypoints) {
      const rawAlpha = easeFn(computeProgress(currentScroll, tStart, tEnd, effectiveSpeed));
      for (const key in waypoints) {
        const t = parseFloat(key);
        if (rawAlpha >= t && !firedWaypoints.has(t)) {
          firedWaypoints.add(t);
          waypoints[key as unknown as number]?.();
        }
      }
    }

    // onStart
    if (!started && computeProgress(currentScroll, tStart, tEnd, effectiveSpeed) > 0) {
      started = true;
      onStart?.();
    }

    if (allComplete && !completed) {
      complete();
    } else if (!allComplete && !once) {
      completed = false;
    }
  }

  // ── Frames ────────────────────────────────────────────────────────────────

  // The frames follow the trigger window. They used to run while an
  // IntersectionObserver saw the container, so a jump across the whole window
  // (the End key, an anchor link, the scroll a reload restores) never had it on
  // screen: the drawing stayed undrawn and onComplete never fired. A staggered
  // path still mid-window after trigger.end needed a tail of its own then; the
  // window here runs until the last path is done (gStart, gEnd).
  //
  // Trigger points were cached once at init and only recomputed on a window
  // resize. But an element's document position changes for many reasons that are
  // not a window resize: lazy-loaded images above it, web fonts swapping in,
  // framework hydration, an accordion opening, async content arriving. When that
  // happened the cached triggers went stale and the whole draw sat at a constant
  // offset for the rest of the page's life — measured at 0.0201 of the draw on
  // the demo's own /verify page, against a native CSS path that stays correct
  // because its view-timeline is live. The gate re-measures on a resize and on
  // the shared layout watcher (./layout-watch): the page's own height changing
  // and the container's box changing.
  const gate = frameGate(
    scrollEl ?? window,
    [container],
    at,
    update,
    () => {
      const before = lengths.join();
      paths.forEach(measure);
      cacheTriggers();
      // Trigger points moved — the rendered frame is stale even at the same
      // scroll offset.
      dirty = true;
      // A new length leaves the dash of the frame on screen wrong, in the
      // window or out of it: repaint. Otherwise only a scroll now elsewhere in
      // the window does (the gate wakes after this).
      if (lengths.join() !== before) go();
    },
  );
  /** `delay` holds the first frame back. */
  let waiting = delay > 0;
  /** Run the frames unless something stopped them; the next one repaints. */
  function go(): void {
    gate.hold(paused || waiting);
  }

  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  if (waiting) delayTimer = setTimeout(() => { waiting = false; go(); }, delay);
  go();

  // ── Instance ──────────────────────────────────────────────────────────────

  return tracked({
    destroy() {
      clearTimeout(repeatTimer);
      clearTimeout(delayTimer);
      gate.off();
      destroyDebugOverlay();
    },

    replay() {
      restart();
      prevScroll    = -1;
      prevVelScroll = -1;
      repeatCount   = 0;
      paused        = false;
      currentAlpha  = 0;
      clearTimeout(repeatTimer);
      go();
    },

    pause() {
      paused = true;
      gate.hold(true);
    },

    resume() {
      if (!paused) return;
      paused = false;
      dirty  = true;
      go();
    },

    seek(progress: number) {
      const p = Math.min(1, Math.max(0, progress));
      currentAlpha = p;
      frozenAlpha  = p;
      frozenPath   = [];
      paused       = true;
      gate.hold(true);
      applyAlpha(p, direction);
      // A later resume() must recompute from the live scroll position.
      dirty = true;
    },

    getProgress() {
      return currentAlpha;
    },

    /**
     * Re-measure now, rather than waiting for a resize that may never come.
     *
     * Same work the debounced resize handler does — path lengths and the trigger
     * window — run immediately and marked dirty so the next frame repaints from
     * the new numbers.
     */
    refresh: gate.remeasure,
  }, () => ({ tStart, tEnd }));
}
