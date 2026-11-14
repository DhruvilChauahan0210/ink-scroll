import type { Easing, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { resolveEasing } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { measureTriggerFrame } from '../core/trigger-frame';
import { lerpColor } from '../core/color';
import { cssTimingFor } from '../core/css-easing';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import { finishWhenReduced } from '../core/motion-live';
import { frameGate } from '../core/frame-gate';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollAnimateOptions {
  props: Record<string, string | number | [string | number, string | number]>;
  trigger?: TriggerConfig;
  easing?: Easing;
  speed?: number;
  once?: boolean;
  axis?: 'x' | 'y';
  scrollContainer?: string | Element;
  native?: boolean;
  /**
   * Scale animation speed by scroll velocity — faster scrolling = faster animation.
   * Pass `true` for default sensitivity (1) or a number to control it.
   * Higher values = more dramatic speed-up. Default sensitivity: 1.
   */
  velocityScale?: boolean | number;
  /**
   * Honour `prefers-reduced-motion: reduce` by applying the final state and not
   * animating, also when the reader turns it on while the page is open.
   * Default: `true`.
   *
   * Set to `false` only when the movement is *scroll-linked scrubbing* rather
   * than autonomous motion — it advances solely as the user scrolls, 1:1 with
   * their input, so it is direct manipulation rather than something that plays at
   * them. `scrollHorizontal` sets this, because jumping to the final state there
   * would leave every panel but the last unreachable inside the sticky
   * `overflow: hidden` container.
   */
  respectReducedMotion?: boolean;
  /**
   * Element whose geometry defines the trigger window, when that is not the
   * element being animated. Defaults to the animated element.
   *
   * Needed whenever the animated element cannot supply the scroll length itself —
   * the case that matters is a `position: sticky` stage, where the pinned element
   * is exactly one viewport tall and all of the scroll room belongs to its
   * container. Resolving `top top` → `bottom bottom` against the pinned element
   * there yields tStart === tEnd, a zero-length window, and no movement at all.
   *
   * Setting this disables the native CSS fast path: `animation-timeline: view()`
   * always measures the element the animation is attached to, so it cannot express
   * a separate subject.
   */
  triggerElement?: Element;
  onProgress?: (alpha: number) => void;
  onComplete?: () => void;
  /** Fires when scroll enters the trigger zone (scrolling forward). */
  onEnter?: () => void;
  /** Fires when scroll exits the trigger zone at the end (scrolling forward). */
  onLeave?: () => void;
  /** Fires when scroll re-enters the trigger zone from the end (scrolling back). */
  onEnterBack?: () => void;
  /** Fires when scroll exits the trigger zone at the start (scrolling back). */
  onLeaveBack?: () => void;
}

// ── Value interpolation ───────────────────────────────────────────────────────

function isColorValue(val: string): boolean {
  return val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
}

/** A number and its unit anywhere in a CSS value: `40px`, `.5`, `-1e3`, `50%`. */
const NUM = /[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?([a-z%]*)/gi;

/**
 * A value with functions — `translateY(40px) scale(.9)`, `inset(0 50% 0 0)`,
 * `circle(0% at 50% 50%)`, `polygon(…)` — moves number by number inside the
 * from value's own text; a bare 0 takes the other end's unit. Each function
 * used to be rebuilt as `fn(a, b, c)`, so clip-path's inset() got commas (which
 * no browser accepts), circle() lost its `at` and polygon() the % of a bare 0.
 * Two values that differ in more than their numbers switch at the end.
 */
function interpolateFns(from: string, to: string, t: number): string {
  const ends = [...to.matchAll(NUM)];
  if (from.replace(NUM, '#') !== to.replace(NUM, '#')) return t < 1 ? from : to;
  let i = 0;
  return from.replace(NUM, (m: string, unit: string) => {
    const [end, endUnit] = ends[i++];
    const a = parseFloat(m);
    return `${a + (parseFloat(end) - a) * t}${unit || endUnit}`;
  });
}

export function interpolateValue(from: string | number, to: string | number, t: number): string {
  if (typeof from === 'number' && typeof to === 'number') {
    return String(from + (to - from) * t);
  }
  const f = String(from);
  const tStr = String(to);

  if (isColorValue(f)) return lerpColor(f, tStr, t);
  if (f.includes('(')) return interpolateFns(f, tStr, t);

  const fm = f.match(/^([-+]?[\d.]+)(.*)$/);
  const tm = tStr.match(/^([-+]?[\d.]+)(.*)$/);
  if (fm && tm) {
    const fNum = parseFloat(fm[1]);
    const tNum = parseFloat(tm[1]);
    return `${fNum + (tNum - fNum) * t}${fm[2] || tm[2]}`;
  }

  return t < 1 ? f : tStr;
}

// ── Prop normalisation ────────────────────────────────────────────────────────

function toCSSProp(prop: string): string {
  return prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

interface PropEntry {
  prop: string;
  from: string | number;
  to: string | number;
}

// ── Native CSS fast path ──────────────────────────────────────────────────────

const NATIVE_SAFE_PROPS = new Set([
  'opacity', 'transform', 'background-color', 'color',
  'filter', 'scale', 'translate', 'rotate',
]);

let animateNativeUid = 0;

/** Custom property the engine mirrors progress into, for CSS to read. */
const PROGRESS_VAR = '--scroll-draw-progress';

function supportsNativeTimeline(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()')
  );
}

// ── Engine ────────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function createAnimateEngine(
  el: Element,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  if (options.respectReducedMotion === false) return buildAnimateEngine(el, options, false);
  // Reduced motion turned on mid-visit applies the final state as a page loaded
  // under it would (core/motion-live).
  return finishWhenReduced(options, (opts, reduced) => buildAnimateEngine(el, opts, reduced));
}

function buildAnimateEngine(
  el: Element,
  options: ScrollAnimateOptions,
  prefersReduced: boolean,
): ScrollDrawInstance {

  const {
    props,
    trigger  = {},
    easing   = 'ease-out',
    speed    = 1,
    once     = false,
    axis     = 'y',
    scrollContainer,
    native   = true,
    velocityScale = false,
    triggerElement,
    onProgress,
    onComplete,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
  } = options;

  const easeFn         = resolveEasing(easing, 'ease-out');
  const startConfig    = parseTrigger(trigger.start || 'top bottom');
  const endConfig      = parseTrigger(trigger.end   || 'bottom top');

  /** Element the trigger window is measured from — the animated one unless overridden. */
  const triggerEl: Element = triggerElement ?? el;

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  const entries: PropEntry[] = Object.entries(props).map(([key, val]) => ({
    prop: toCSSProp(key),
    from: Array.isArray(val) ? val[0] : '',
    to:   Array.isArray(val) ? val[1] : val,
  }));

  function resolveFromValues(): void {
    const computed = window.getComputedStyle(el);
    for (const entry of entries) {
      if (entry.from === '') {
        entry.from = computed.getPropertyValue(entry.prop).trim() || '0';
      }
    }
  }

  function applyFinal(): void {
    for (const entry of entries) {
      (el as HTMLElement).style.setProperty(entry.prop, String(entry.to));
    }
  }

  /**
   * Inline styles as they were before this engine touched the element.
   *
   * Captured before the first write so `destroy()` can put them back. Without
   * this the engine leaves whatever the last frame wrote: destroy an element
   * mid-animation and it stays frozen at, say, opacity 0.34 and translateY(21px)
   * for the rest of the page's life — permanently faded and offset, which is
   * worse for the user than never having animated at all. `scrollPin` and
   * `scrollText` both restore on destroy; this one silently did not, which also
   * made `scrollReveal`'s documented "restore original styles" untrue.
   */
  const savedInline = new Map<string, string>();
  for (const prop of [...entries.map((e) => e.prop), PROGRESS_VAR]) {
    savedInline.set(prop, (el as HTMLElement).style.getPropertyValue(prop));
  }

  function restoreInline(): void {
    for (const [prop, value] of savedInline) {
      if (value) (el as HTMLElement).style.setProperty(prop, value);
      else (el as HTMLElement).style.removeProperty(prop);
    }
  }

  if (prefersReduced) {
    applyFinal();
    onComplete?.();
    // Nothing to tear down, but destroy() must still undo the styles it wrote —
    // otherwise the contract depends on the visitor's motion preference.
    return { ...NOOP, destroy: restoreInline, getProgress: () => 1 };
  }

  resolveFromValues();

  // Shared by both paths: the native one never has a scrollContainer.
  const scrollPos = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return axis === 'x' ? window.scrollX : window.scrollY;
  };

  const vpSize = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  };

  // ── Native fast path ────────────────────────────────────────────────────────

  /**
   * The CSS timing function that reproduces this instance's easing, or null
   * when there is none — see core/css-easing. Resolved once, because it is both
   * the eligibility test and the value the stylesheet needs.
   */
  const cssTiming = typeof easing === 'string' ? cssTimingFor(easing) : null;

  function nativeEligible(): boolean {
    if (!native) return false;
    if (!supportsNativeTimeline()) return false;
    if (!cssTiming) return false;
    if (axis !== 'y') return false;
    if (scrollEl) return false;
    // `animation-timeline: view()` always measures the element the animation is
    // attached to, so a separate trigger subject cannot be expressed in CSS.
    if (triggerEl !== el) return false;
    if (once) return false;
    if (speed !== 1) return false;
    if (onProgress || onComplete || onEnter || onLeave || onEnterBack || onLeaveBack) return false;
    if (velocityScale !== false) return false;
    if ((trigger.start || 'top bottom').trim() !== 'top bottom') return false;
    if ((trigger.end   || 'bottom top').trim() !== 'bottom top') return false;
    for (const entry of entries) {
      if (!NATIVE_SAFE_PROPS.has(entry.prop)) return false;
    }
    return true;
  }

  function buildNative(): ScrollDrawInstance {
    const cls = `ssd-a-${++animateNativeUid}`;
    const fromBody = entries.map((e) => `${e.prop}:${e.from}`).join(';');
    const toBody   = entries.map((e) => `${e.prop}:${e.to}`).join(';');
    const style    = document.createElement('style');
    style.setAttribute('data-ssd-animate', '');
    style.textContent =
      `@keyframes ${cls}{from{${fromBody}}to{${toBody}}}` +
      `.${cls}{animation-name:${cls};animation-duration:auto;` +
      `animation-timing-function:${cssTiming};` +
      `animation-fill-mode:both;animation-timeline:view();` +
      `animation-range:cover 0% cover 100%;}`;
    document.head.appendChild(style);
    (el as HTMLElement).classList.add(cls);

    const liveTriggers = () => {
      const rect = el.getBoundingClientRect();
      return computeTriggers({ top: rect.top, height: rect.height }, scrollPos(), vpSize(), startConfig, endConfig);
    };

    // The JS path below registers too. This one used to skip it, so a plain
    // scrollAnimate() — which takes this path in every browser with scroll
    // timelines — never showed up in devtools.
    _register(el, {
      type: 'animate',
      getProgress: () => instance.getProgress(),
      getTrigger: liveTriggers,
    });

    const instance: ScrollDrawInstance = {
      // The view() timeline measures the element every frame.
      refresh() {},
      destroy() {
        (el as HTMLElement).classList.remove(cls);
        style.remove();
        // seek()/pause() on this path write inline styles too, so the same
        // restore applies whether or not the animation was ever scrubbed.
        (el as HTMLElement).style.animationPlayState = '';
        restoreInline();
        _unregister(el);
      },
      replay() {
        (el as HTMLElement).classList.remove(cls);
        void (el as HTMLElement).offsetWidth;
        (el as HTMLElement).classList.add(cls);
      },
      pause()  { (el as HTMLElement).style.animationPlayState = 'paused'; },
      resume() { (el as HTMLElement).style.animationPlayState = ''; },
      seek(p: number) {
        const clamped = Math.min(1, Math.max(0, p));
        (el as HTMLElement).classList.remove(cls);
        for (const entry of entries) {
          (el as HTMLElement).style.setProperty(entry.prop, interpolateValue(entry.from, entry.to, clamped));
        }
      },
      getProgress() {
        const { tStart, tEnd } = liveTriggers();
        return easeFn(computeProgress(scrollPos(), tStart, tEnd, speed));
      },
    };
    return instance;
  }

  if (nativeEligible()) return buildNative();

  // ── JS scroll engine ────────────────────────────────────────────────────────

  let tStart           = 0;
  let tEnd             = 0;
  let paused           = false;
  /** With `once`, the floor seek() set, eased: -1 when there is none. */
  let frozenAlpha      = -1;
  /**
   * With `once`, the furthest raw scroll progress, eased after, as scrollText
   * has always done. Holding the eased value with Math.max froze spring and
   * elastic on their overshoot past "to", and flattened bounce's dips.
   */
  let frozenRaw        = 0;
  let currentAlpha     = 0;
  let completed        = false;
  let prevRawProgress  = NaN;
  let prevVelScroll    = -1;
  let prevVelTime      = 0;

  /**
   * The props this engine writes that move the element's box without moving its
   * layout. When the trigger is measured on the animated element itself, they are
   * put back to what the page set while it is measured: the first measurement ran
   * before any frame was applied, and a later one that saw the engine's own
   * translateY started scrollReveal's fade-up 32px late.
   */
  // Every prop this engine writes, not only transforms: an element animating its
  // own height measured with that height re-measured itself forever.
  const moving = triggerEl === el ? entries : [];
  let measured = false;

  function cacheTriggers(): void {
    const style = (el as HTMLElement).style;
    const held  = moving.map((e) => style.getPropertyValue(e.prop));
    // A CSS transition would start from the engine's own value, which the rect
    // would still read: keep transitions off until the frame is put back.
    const transition = style.transition;
    if (moving.length) style.transition = 'none';
    moving.forEach((e) => style.setProperty(e.prop, savedInline.get(e.prop) ?? ''));
    const frame  = measureTriggerFrame(triggerEl, scrollEl, axis);
    moving.forEach((e, i) => style.setProperty(e.prop, held[i]));
    if (moving.length) {
      void (el as HTMLElement).offsetWidth;
      style.transition = transition;
    }
    const result = computeTriggers(frame, frame.scroll, vpSize(), startConfig, endConfig);
    // A move under a pixel is rounding, not layout. Taking it would let an
    // element that animates its own size re-measure itself forever.
    if (measured && Math.abs(result.tStart - tStart) < 1 && Math.abs(result.tEnd - tEnd) < 1) return;
    measured = true;
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyAlpha(alpha: number): void {
    (el as HTMLElement).style.setProperty(PROGRESS_VAR, String(alpha));
    for (const entry of entries) {
      (el as HTMLElement).style.setProperty(entry.prop, interpolateValue(entry.from, entry.to, alpha));
    }
    onProgress?.(alpha);
  }

  function fireScrollCallbacks(raw: number): void {
    if (isNaN(prevRawProgress)) { prevRawProgress = raw; return; }
    // In the order the scroll crosses the edges: a jump back from past the end
    // to before the start enters back, then leaves back.
    if (prevRawProgress <= 0 && raw > 0) onEnter?.();
    if (prevRawProgress < 1 && raw >= 1) onLeave?.();
    if (prevRawProgress >= 1 && raw < 1) onEnterBack?.();
    if (prevRawProgress > 0 && raw <= 0) onLeaveBack?.();
    prevRawProgress = raw;
  }

  function update(): void {
    if (paused) return;
    const now           = performance.now();
    const currentScroll = scrollPos();

    let effectiveSpeed = speed;
    if (velocityScale !== false) {
      const dt  = now - prevVelTime;
      const vel = dt > 0 ? Math.abs(currentScroll - (prevVelScroll < 0 ? currentScroll : prevVelScroll)) / dt : 0;
      const sensitivity = typeof velocityScale === 'number' ? velocityScale : 1;
      effectiveSpeed = speed * Math.max(0.2, 1 + vel * sensitivity * 0.04);
    }
    prevVelScroll = currentScroll;
    prevVelTime   = now;

    const raw = tEnd === tStart ? 0 : (currentScroll - tStart) / (tEnd - tStart);
    fireScrollCallbacks(raw);
    const progress = computeProgress(currentScroll, tStart, tEnd, effectiveSpeed);
    const alpha = once
      ? Math.max(frozenAlpha, easeFn(frozenRaw = Math.max(frozenRaw, progress)))
      : easeFn(progress);
    currentAlpha = alpha;
    applyAlpha(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) {
      completed = false;
    }
  }

  /**
   * The frames follow the trigger window (core/frame-gate). They used to run
   * while an IntersectionObserver saw the element, but the element's box
   * includes its own transform and is cut by any overflow-hidden parent: a
   * parallax layer whose travel carried it out of its clip stopped updating and
   * stayed there for good, a fade-up started only once its offset box crossed
   * the fold, then jumped, and a jump across the whole window never painted its
   * last frame or fired onComplete. The window comes from layout with the
   * engine's own props left out (cacheTriggers). Never faster than the raw
   * window, so a fast `speed` still sees the end for onLeave, and a slow one
   * runs on until its progress reaches 1.
   *
   * The gate re-measures on a resize and on a layout change that is not one:
   * an image loading above the element, a font swapping in, content arriving
   * late.
   */
  const gate = frameGate(
    scrollEl ?? window,
    [triggerEl],
    () => computeProgress(scrollPos(), tStart, tEnd, Math.min(speed, 1)),
    update,
    cacheTriggers,
  );

  cacheTriggers();

  // A zero-length trigger window can never produce progress above 0, so the
  // element is silently inert — it looks configured, and nothing ever moves. This
  // is how `scrollHorizontal` shipped broken: its default `top top` → `bottom
  // bottom` window was measured against a sticky-pinned track exactly one
  // viewport tall, which collapses both ends onto the same scroll position.
  // Cheap to detect here, and it names the likely cause.
  if (tEnd === tStart) {
    // Worded as scrollVideo's warning is, which ships beside it.
    warn('scrollAnimate: zero-length trigger window, so it never animates. In a sticky stage, set triggerElement.', el);
  }

  // Apply initial state immediately so elements never flash at their "to" value
  // before the first frame.
  {
    frozenRaw    = computeProgress(scrollPos(), tStart, tEnd, speed);
    currentAlpha = easeFn(frozenRaw);
    applyAlpha(currentAlpha);
  }

  _register(el, {
    type: 'animate',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  // seek() paints a frame of its own, and a paused loop may have stopped
  // mid-window: resume() repaints from the scroll either way (hold).
  function halt(): void {
    paused = true;
    gate.hold(true);
  }

  return {
    destroy() {
      paused = true;
      gate.off();
      restoreInline();
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      frozenRaw    = 0;
      completed    = false;
      currentAlpha = 0;
      paused       = false;
      applyAlpha(0);
      // replay() used to leave the loop as it found it, so after pause() or
      // seek() it never ran again until the element left the screen and came
      // back. The next frame repaints from the scroll.
      gate.hold(false);
    },
    pause: halt,
    resume() {
      if (!paused) return;
      paused = false;
      gate.hold(false);
    },
    seek(p: number) {
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      frozenRaw     = 0;
      halt();
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
    refresh: gate.remeasure,
  };
}
