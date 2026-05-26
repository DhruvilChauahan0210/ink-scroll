import type { ScrollDrawOptions, ScrollDrawInstance } from './types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers, getElementLength, lerpColor } from './utils';

function warnDev(msg: string, el: Element): void {
  if (process.env.NODE_ENV !== 'production') console.warn(`[svg-scroll-draw] ${msg}`, el);
}

function checkElement(el: SVGElement): void {
  const stroke = el.getAttribute('stroke');
  const fill   = el.getAttribute('fill');
  if (!stroke || stroke === 'none') warnDev('Element has no stroke — path will not be visible.', el);
  else if (fill && fill !== 'none' && fill !== 'transparent') warnDev('Element has a fill — it may obscure the stroke animation.', el);
}

function createDebugOverlay(tStart: number, tEnd: number, axis: 'x' | 'y'): HTMLElement {
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
  return overlay;
}

// ── Path morphing helper ──────────────────────────────────────────────────────
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
  options: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') {
    return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    onProgress,
    onStart,
    onComplete,
  } = options;

  const clipDirection: 'left' | 'right' | 'top' | 'bottom' | 'center' | false =
    clip === true ? 'left' : (typeof clip === 'string' ? clip : false);

  const easeFn      = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

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
  let completed     = false;
  let started       = false;
  let rafId         = 0;
  let isVisible     = false;
  let frozenAlpha   = -1;
  let prevScroll    = -1;
  let paused        = false;
  let currentAlpha  = 0;
  let repeatCount   = 0;
  let repeatTimer: ReturnType<typeof setTimeout> | undefined;
  let debugOverlay: HTMLElement | null = null;
  const firedWaypoints = new Set<number>();

  // velocity tracking
  let prevVelScroll = -1;
  let prevVelTime   = performance.now();

  // ── Axis / container helpers ──────────────────────────────────────────────

  function scrollPos(): number {
    if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return axis === 'x' ? window.scrollX : window.scrollY;
  }

  function vpSize(): number {
    if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  }

  function cacheTriggers(): void {
    const rect = container.getBoundingClientRect();
    let pos: number, size: number, scroll: number;
    if (scrollEl) {
      const cr = scrollEl.getBoundingClientRect();
      pos    = axis === 'x' ? rect.left - cr.left + scrollEl.scrollLeft : rect.top - cr.top + scrollEl.scrollTop;
      size   = axis === 'x' ? rect.width : rect.height;
      scroll = scrollPos();
    } else {
      pos    = axis === 'x' ? rect.left : rect.top;
      size   = axis === 'x' ? rect.width : rect.height;
      scroll = scrollPos();
    }
    const result = computeTriggers({ top: pos, height: size }, scroll, vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
    if (debug && process.env.NODE_ENV !== 'production') {
      debugOverlay?.remove();
      debugOverlay = createDebugOverlay(tStart, tEnd, axis);
    }
  }

  // ── Apply alpha to all paths ──────────────────────────────────────────────

  function applyAlpha(alpha: number, dir: 'forward' | 'reverse'): void {
    if (clipDirection) {
      const a = dir === 'reverse' ? 1 - alpha : alpha;
      (container as HTMLElement).style.clipPath = computeClipPath(a);
      return;
    }
    paths.forEach((el, i) => {
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

      if (morphTo && el.tagName.toLowerCase() === 'path' && originalDs[i]) {
        el.setAttribute('d', morphPath(originalDs[i], morphTo, alpha));
      }
    });
  }

  function resetPaths(): void {
    if (clipDirection) {
      (container as HTMLElement).style.clipPath = computeClipPath(0);
      return;
    }
    paths.forEach((el, i) => {
      el.style.strokeDasharray  = `${lengths[i]}`;
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

  // ── Init paths ────────────────────────────────────────────────────────────

  paths.forEach((el) => {
    checkElement(el);
    const len = getElementLength(el);
    lengths.push(len);
    if (el.tagName.toLowerCase() === 'path') originalDs.push(el.getAttribute('d') ?? '');
    else originalDs.push('');

    if (prefersReduced) {
      el.style.strokeDasharray  = `${len}`;
      el.style.strokeDashoffset = direction === 'reverse' ? `${len}` : '0';
      if (fade) el.style.opacity = '1';
      if (colorTo) el.style.stroke = colorTo;
      if (widthTo !== null) el.style.strokeWidth = `${widthTo}`;
      if (fillOpacityTo !== null) el.style.fillOpacity = `${fillOpacityTo}`;
      if (morphTo && el.tagName.toLowerCase() === 'path') el.setAttribute('d', morphTo);
    } else {
      el.style.strokeDasharray  = `${len}`;
      el.style.strokeDashoffset = direction === 'reverse' ? '0' : `${len}`;
      if (fade) el.style.opacity = direction === 'reverse' ? '1' : '0';
      else el.style.opacity = '';
      if (colorFrom) el.style.stroke = colorFrom;
      if (widthFrom !== null) el.style.strokeWidth = `${widthFrom}`;
      if (fillOpacityFrom !== null) el.style.fillOpacity = `${fillOpacityFrom}`;
    }
  });

  if (clipDirection) {
    if (prefersReduced) {
      (container as HTMLElement).style.clipPath = computeClipPath(1);
      onComplete?.();
      return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 1 };
    }
    (container as HTMLElement).style.clipPath = computeClipPath(0);
  } else if (prefersReduced) {
    onComplete?.();
    return { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 1 };
  }

  cacheTriggers();

  // ── rAF update loop ───────────────────────────────────────────────────────

  function update(): void {
    if (!isVisible || paused) return;

    const now           = performance.now();
    const currentScroll = scrollPos();

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

    // ── Clip mode: animate clipPath on container, skip per-path logic ─────────
    if (clipDirection) {
      let alpha = easeFn(computeProgress(currentScroll, tStart, tEnd, effectiveSpeed));
      if (once && !autoReverse) {
        frozenAlpha = Math.max(frozenAlpha, alpha);
        alpha = frozenAlpha;
      }
      currentAlpha = alpha;
      const visual = effectiveDir === 'reverse' ? 1 - alpha : alpha;
      (container as HTMLElement).style.clipPath = computeClipPath(visual);
      onProgress?.(alpha);
      if (!started && computeProgress(currentScroll, tStart, tEnd, effectiveSpeed) > 0) {
        started = true;
        onStart?.();
      }
      if (alpha >= 1 && !completed) {
        completed = true;
        onComplete?.();
        const maxRepeats = repeat === 'infinite' ? Infinity : (repeat ?? 0);
        if (repeatCount < maxRepeats) {
          repeatCount++;
          repeatTimer = setTimeout(() => {
            frozenAlpha = -1; started = false; completed = false;
            (container as HTMLElement).style.clipPath = computeClipPath(0);
          }, repeatDelay);
        }
      } else if (alpha < 1 && !once) {
        completed = false;
      }
      rafId = requestAnimationFrame(update);
      return;
    }
    // ── End clip mode ─────────────────────────────────────────────────────────

    paths.forEach((el, i) => {
      const offset = i * stagger * range;
      let alpha = easeFn(computeProgress(currentScroll, tStart + offset, tEnd + offset, effectiveSpeed));

      if (once && !autoReverse) {
        frozenAlpha = Math.max(frozenAlpha, alpha);
        alpha = frozenAlpha;
      }

      currentAlpha = alpha;

      el.style.strokeDashoffset =
        effectiveDir === 'reverse' ? `${lengths[i] * alpha}` : `${lengths[i] * (1 - alpha)}`;

      if (fade) el.style.opacity = effectiveDir === 'reverse' ? `${1 - alpha}` : `${alpha}`;

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

      if (i === 0) onProgress?.(alpha);
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
      completed = true;
      onComplete?.();

      // repeat
      const maxRepeats = repeat === 'infinite' ? Infinity : (repeat ?? 0);
      if (repeatCount < maxRepeats) {
        repeatCount++;
        repeatTimer = setTimeout(() => {
          frozenAlpha = -1;
          started     = false;
          completed   = false;
          firedWaypoints.clear();
          resetPaths();
        }, repeatDelay);
      }
    } else if (!allComplete && !once) {
      completed = false;
    }

    rafId = requestAnimationFrame(update);
  }

  // ── IntersectionObserver ──────────────────────────────────────────────────

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
    { root: scrollEl ?? null, threshold, rootMargin }
  );

  // ── Resize ────────────────────────────────────────────────────────────────

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

  if (delay > 0) setTimeout(() => observer.observe(container), delay);
  else observer.observe(container);

  // ── Instance ──────────────────────────────────────────────────────────────

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      clearTimeout(repeatTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      debugOverlay?.remove();
    },

    replay() {
      frozenAlpha  = -1;
      prevScroll   = -1;
      prevVelScroll = -1;
      started      = false;
      completed    = false;
      repeatCount  = 0;
      paused       = false;
      firedWaypoints.clear();
      clearTimeout(repeatTimer);
      resetPaths();
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

    seek(progress: number) {
      const p = Math.min(1, Math.max(0, progress));
      currentAlpha = p;
      frozenAlpha  = p;
      paused       = true;
      cancelAnimationFrame(rafId);
      applyAlpha(p, direction);
    },

    getProgress() {
      return currentAlpha;
    },
  };
}
