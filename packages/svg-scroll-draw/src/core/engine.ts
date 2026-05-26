import type { ScrollDrawOptions, ScrollDrawInstance } from './types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers, getElementLength } from './utils';

function warnDev(msg: string, el: Element): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[svg-scroll-draw] ${msg}`, el);
  }
}

function checkElement(el: SVGElement): void {
  const stroke = el.getAttribute('stroke');
  const fill = el.getAttribute('fill');
  if (!stroke || stroke === 'none') {
    warnDev('Element has no stroke — path will not be visible.', el);
  } else if (fill && fill !== 'none' && fill !== 'transparent') {
    warnDev('Element has a fill — it may obscure the stroke animation.', el);
  }
}

function createDebugOverlay(tStart: number, tEnd: number, axis: 'x' | 'y'): HTMLElement {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-svg-scroll-draw-debug', '');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;font-family:monospace;font-size:11px;top:0;left:0;right:0;bottom:0;';

  function update() {
    const scroll = axis === 'x' ? window.scrollX : window.scrollY;
    const startPx = tStart - scroll;
    const endPx   = tEnd   - scroll;
    const isX = axis === 'x';

    overlay.innerHTML = `
      <div style="position:absolute;
        ${isX ? `left:${startPx}px;top:0;bottom:0;border-left:2px dashed #22c55e;` : `top:${startPx}px;left:0;right:0;border-top:2px dashed #22c55e;`}
        padding:2px 6px;color:#22c55e;background:rgba(0,0,0,0.6);">▶ start</div>
      <div style="position:absolute;
        ${isX ? `left:${endPx}px;top:0;bottom:0;border-left:2px dashed #ef4444;` : `top:${endPx}px;left:0;right:0;border-top:2px dashed #ef4444;`}
        padding:2px 6px;color:#ef4444;background:rgba(0,0,0,0.6);">■ end</div>
    `;
  }

  document.body.appendChild(overlay);
  const evt = axis === 'x' ? 'scroll' : 'scroll';
  window.addEventListener(evt, update, { passive: true });
  update();

  return overlay;
}

export function createEngine(
  container: Element,
  options: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') return { destroy: () => {}, replay: () => {} };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const {
    selector  = 'path, polyline, line, polygon, rect, circle',
    speed     = 1,
    fade      = false,
    easing    = 'linear',
    trigger   = {},
    stagger   = 0,
    direction = 'forward',
    once      = false,
    debug     = false,
    axis      = 'y',
    onProgress,
    onStart,
    onComplete,
  } = options;

  const easeFn      = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

  const paths: SVGElement[] = Array.from(container.querySelectorAll<SVGElement>(selector));
  const lengths: number[]   = [];
  let tStart     = 0;
  let tEnd       = 0;
  let completed  = false;
  let started    = false;
  let rafId      = 0;
  let isVisible  = false;
  let frozenAlpha = -1;
  let debugOverlay: HTMLElement | null = null;

  // ── axis helpers ────────────────────────────────────────────────────────────

  function scrollPos(): number {
    return axis === 'x' ? window.scrollX : window.scrollY;
  }

  function viewportSize(): number {
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  }

  function rectPos(rect: DOMRect): number {
    return axis === 'x' ? rect.left : rect.top;
  }

  function rectSize(rect: DOMRect): number {
    return axis === 'x' ? rect.width : rect.height;
  }

  // ── trigger calculation ──────────────────────────────────────────────────────

  function cacheTriggers(): void {
    const rect = container.getBoundingClientRect();
    const result = computeTriggers(
      { top: rectPos(rect), height: rectSize(rect) },
      scrollPos(),
      viewportSize(),
      startConfig,
      endConfig
    );
    tStart = result.tStart;
    tEnd   = result.tEnd;

    if (debug && process.env.NODE_ENV !== 'production') {
      debugOverlay?.remove();
      debugOverlay = createDebugOverlay(tStart, tEnd, axis);
    }
  }

  // ── initialise paths ─────────────────────────────────────────────────────────

  function resetPaths(): void {
    paths.forEach((el, i) => {
      el.style.strokeDasharray  = `${lengths[i]}`;
      el.style.strokeDashoffset = direction === 'reverse' ? '0' : `${lengths[i]}`;
      if (fade) el.style.opacity = direction === 'reverse' ? '1' : '0';
      else el.style.opacity = '';
    });
  }

  paths.forEach((el) => {
    checkElement(el);
    const len = getElementLength(el);
    lengths.push(len);

    if (prefersReduced) {
      el.style.strokeDasharray  = `${len}`;
      el.style.strokeDashoffset = direction === 'reverse' ? `${len}` : '0';
      if (fade) el.style.opacity = '1';
    } else {
      el.style.strokeDasharray  = `${len}`;
      el.style.strokeDashoffset = direction === 'reverse' ? '0' : `${len}`;
      if (fade) el.style.opacity = direction === 'reverse' ? '1' : '0';
    }
  });

  if (prefersReduced) {
    onComplete?.();
    return { destroy: () => {}, replay: () => {} };
  }

  cacheTriggers();

  // ── rAF update loop ──────────────────────────────────────────────────────────

  function update(): void {
    if (!isVisible) return;
    const range = tEnd - tStart;
    let allComplete = true;

    paths.forEach((el, i) => {
      const offset = i * stagger * range;
      let alpha = easeFn(computeProgress(scrollPos(), tStart + offset, tEnd + offset, speed));

      if (once) {
        frozenAlpha = Math.max(frozenAlpha, alpha);
        alpha = frozenAlpha;
      }

      el.style.strokeDashoffset =
        direction === 'reverse'
          ? `${lengths[i] * alpha}`
          : `${lengths[i] * (1 - alpha)}`;

      if (fade) el.style.opacity = direction === 'reverse' ? `${1 - alpha}` : `${alpha}`;
      if (i === 0) onProgress?.(alpha);
      if (alpha < 1) allComplete = false;
    });

    if (!started) {
      const rawAlpha = computeProgress(scrollPos(), tStart, tEnd, speed);
      if (rawAlpha > 0) { started = true; onStart?.(); }
    }

    if (allComplete && !completed) {
      completed = true;
      onComplete?.();
    } else if (!allComplete && !once) {
      completed = false;
    }

    rafId = requestAnimationFrame(update);
  }

  // ── intersection observer ────────────────────────────────────────────────────

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      isVisible = e.isIntersecting;
      if (isVisible) rafId = requestAnimationFrame(update);
      else cancelAnimationFrame(rafId);
    });
  });

  observer.observe(container);

  // ── resize ───────────────────────────────────────────────────────────────────

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      paths.forEach((el, i) => {
        lengths[i] = getElementLength(el);
        el.style.strokeDasharray = `${lengths[i]}`;
      });
      cacheTriggers();
    }, 150);
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // ── instance ─────────────────────────────────────────────────────────────────

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      debugOverlay?.remove();
    },

    replay() {
      frozenAlpha = -1;
      started     = false;
      completed   = false;
      resetPaths();
    },
  };
}
