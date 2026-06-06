import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers, lerpColor } from '../core/utils';
import { _register, _unregister } from '../core/registry';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollAnimateOptions {
  props: Record<string, string | number | [string | number, string | number]>;
  trigger?: TriggerConfig;
  easing?: EasingName | ((t: number) => number);
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

export interface ScrollParallaxOptions {
  speed?: number;
  axis?: 'x' | 'y';
  easing?: EasingName | ((t: number) => number);
  trigger?: TriggerConfig;
  onProgress?: (alpha: number) => void;
}

// ── Value interpolation ───────────────────────────────────────────────────────

function isColorValue(val: string): boolean {
  return val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
}

function parseTransformFns(str: string): Array<{ fn: string; nums: number[]; units: string[] }> {
  const result: Array<{ fn: string; nums: number[]; units: string[] }> = [];
  const re = /([\w]+)\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    const nums: number[] = [];
    const units: string[] = [];
    const raw = m[2].trim();
    if (raw) {
      for (const arg of raw.split(/[\s,]+/)) {
        const pm = arg.match(/^([-+]?[\d.eE]+)(.*)$/);
        nums.push(pm ? parseFloat(pm[1]) : 0);
        units.push(pm ? pm[2] : '');
      }
    }
    result.push({ fn: m[1], nums, units });
  }
  return result;
}

function interpolateTransform(from: string, to: string, t: number): string {
  const fp = parseTransformFns(from);
  const tp = parseTransformFns(to);
  if (fp.length === 0 || fp.length !== tp.length) return t < 1 ? from : to;
  return fp.map((f, i) => {
    const tf = tp[i];
    if (f.fn !== tf.fn || f.nums.length !== tf.nums.length) {
      return t < 1
        ? `${f.fn}(${f.nums.map((n, j) => `${n}${f.units[j]}`).join(', ')})`
        : `${tf.fn}(${tf.nums.map((n, j) => `${n}${tf.units[j]}`).join(', ')})`;
    }
    return `${f.fn}(${f.nums.map((n, j) => `${n + (tf.nums[j] - n) * t}${f.units[j]}`).join(', ')})`;
  }).join(' ');
}

export function interpolateValue(from: string | number, to: string | number, t: number): string {
  if (typeof from === 'number' && typeof to === 'number') {
    return String(from + (to - from) * t);
  }
  const f = String(from);
  const tStr = String(to);

  if (isColorValue(f)) return lerpColor(f, tStr, t);
  if (f.includes('(')) return interpolateTransform(f, tStr, t);

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

const CSS_ANIMATE_EASINGS: Record<string, string> = {
  linear: 'linear',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
};

const NATIVE_SAFE_PROPS = new Set([
  'opacity', 'transform', 'background-color', 'color',
  'filter', 'scale', 'translate', 'rotate',
]);

let animateNativeUid = 0;

function supportsNativeTimeline(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()')
  );
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function createAnimateEngine(
  el: Element,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  const NOOP: ScrollDrawInstance = {
    destroy: () => {}, replay: () => {}, pause: () => {},
    resume: () => {}, seek: () => {}, getProgress: () => 0,
  };
  if (typeof window === 'undefined') return NOOP;

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
    onProgress,
    onComplete,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
  } = options;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeFn         = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS['ease-out']);
  const startConfig    = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig      = parseTrigger(trigger.end   ?? 'bottom top');

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

  if (prefersReduced) {
    applyFinal();
    onComplete?.();
    return NOOP;
  }

  resolveFromValues();

  // ── Native fast path ────────────────────────────────────────────────────────

  function nativeEligible(): boolean {
    if (!native) return false;
    if (!supportsNativeTimeline()) return false;
    if (typeof easing !== 'string' || !(easing in CSS_ANIMATE_EASINGS)) return false;
    if (axis !== 'y') return false;
    if (scrollEl) return false;
    if (once) return false;
    if (speed !== 1) return false;
    if (onProgress || onComplete || onEnter || onLeave || onEnterBack || onLeaveBack) return false;
    if (velocityScale !== false) return false;
    if ((trigger.start ?? 'top bottom').trim() !== 'top bottom') return false;
    if ((trigger.end   ?? 'bottom top').trim() !== 'bottom top') return false;
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
      `animation-timing-function:${CSS_ANIMATE_EASINGS[easing as string]};` +
      `animation-fill-mode:both;animation-timeline:view();` +
      `animation-range:cover 0% cover 100%;}`;
    document.head.appendChild(style);
    (el as HTMLElement).classList.add(cls);

    const scrollPos = (): number => (axis === 'x' ? window.scrollX : window.scrollY);
    const vpSize    = (): number => (axis === 'x' ? window.innerWidth : window.innerHeight);

    return {
      destroy() {
        (el as HTMLElement).classList.remove(cls);
        style.remove();
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
        const rect    = el.getBoundingClientRect();
        const scroll  = scrollPos();
        const vp      = vpSize();
        const { tStart, tEnd } = computeTriggers(
          { top: rect.top, height: rect.height }, scroll, vp, startConfig, endConfig,
        );
        return easeFn(computeProgress(scroll, tStart, tEnd, speed));
      },
    };
  }

  if (nativeEligible()) return buildNative();

  // ── JS scroll engine ────────────────────────────────────────────────────────

  let tStart           = 0;
  let tEnd             = 0;
  let rafId            = 0;
  let isVisible        = false;
  let paused           = false;
  let frozenAlpha      = -1;
  let currentAlpha     = 0;
  let completed        = false;
  let prevRawProgress  = NaN;
  let prevVelScroll    = -1;
  let prevVelTime      = 0;

  const scrollPos = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return axis === 'x' ? window.scrollX : window.scrollY;
  };

  const vpSize = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  };

  function cacheTriggers(): void {
    const rect = el.getBoundingClientRect();
    let pos: number, size: number;
    if (scrollEl) {
      const cr = scrollEl.getBoundingClientRect();
      pos  = axis === 'x' ? rect.left - cr.left + scrollEl.scrollLeft : rect.top - cr.top + scrollEl.scrollTop;
      size = axis === 'x' ? rect.width : rect.height;
    } else {
      pos  = axis === 'x' ? rect.left : rect.top;
      size = axis === 'x' ? rect.width : rect.height;
    }
    const result = computeTriggers({ top: pos, height: size }, scrollPos(), vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyAlpha(alpha: number): void {
    (el as HTMLElement).style.setProperty('--scroll-draw-progress', String(alpha));
    for (const entry of entries) {
      (el as HTMLElement).style.setProperty(entry.prop, interpolateValue(entry.from, entry.to, alpha));
    }
    onProgress?.(alpha);
  }

  function fireScrollCallbacks(raw: number): void {
    if (isNaN(prevRawProgress)) { prevRawProgress = raw; return; }
    if (prevRawProgress <= 0 && raw > 0) onEnter?.();
    else if (prevRawProgress > 0 && raw <= 0) onLeaveBack?.();
    if (prevRawProgress < 1 && raw >= 1) onLeave?.();
    else if (prevRawProgress >= 1 && raw < 1) onEnterBack?.();
    prevRawProgress = raw;
  }

  function update(): void {
    if (!isVisible || paused) return;
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
    let alpha = easeFn(computeProgress(currentScroll, tStart, tEnd, effectiveSpeed));
    if (once) {
      frozenAlpha = Math.max(frozenAlpha, alpha);
      alpha = frozenAlpha;
    }
    currentAlpha = alpha;
    applyAlpha(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) {
      completed = false;
    }
    rafId = requestAnimationFrame(update);
  }

  cacheTriggers();

  // Apply initial state immediately so elements never flash at their "to" value
  // before the IntersectionObserver fires for the first time.
  {
    const initAlpha = easeFn(computeProgress(scrollPos(), tStart, tEnd, speed));
    if (once && initAlpha > 0) frozenAlpha = initAlpha;
    currentAlpha = initAlpha;
    applyAlpha(initAlpha);
  }

  const observer = new IntersectionObserver(
    (ioEntries) => {
      ioEntries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
    { root: scrollEl ?? null },
  );

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheTriggers, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  observer.observe(el);

  _register(el, {
    type: 'animate',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      completed    = false;
      currentAlpha = 0;
      paused       = false;
      applyAlpha(0);
    },
    pause() {
      paused = true;
      cancelAnimationFrame(rafId);
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (isVisible) rafId = requestAnimationFrame(update);
    },
    seek(p: number) {
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      paused        = true;
      cancelAnimationFrame(rafId);
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function scrollAnimate(
  target: string | Element,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[svg-scroll-draw] scrollAnimate: element not found:', target);
    }
    return NOOP;
  }
  return createAnimateEngine(el, options);
}

export function scrollParallax(
  target: string | Element,
  options: ScrollParallaxOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[svg-scroll-draw] scrollParallax: element not found:', target);
    }
    return NOOP;
  }

  const { speed = 0.3, axis = 'y', easing = 'linear', trigger, onProgress } = options;
  const rect   = el.getBoundingClientRect();
  const size   = axis === 'x' ? rect.width : rect.height;
  const travel = speed * size;

  return createAnimateEngine(el, {
    props: axis === 'x'
      ? { transform: [`translateX(0px)`, `translateX(${-travel}px)`] }
      : { transform: [`translateY(0px)`, `translateY(${-travel}px)`] },
    trigger: trigger ?? { start: 'top bottom', end: 'bottom top' },
    easing,
    native: false,
    onProgress,
  });
}
