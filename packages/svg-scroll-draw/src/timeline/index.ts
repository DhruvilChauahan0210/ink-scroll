import { EASINGS, parseTrigger, computeProgress, computeTriggers, getElementLength } from '../core/utils';
import { prefersReducedMotion, watchReducedMotion } from '../core/motion';
import { warn } from '../core/env';
import type { ScrollDrawInstance, EasingName } from '../core/types';

export interface TimelineTrack {
  /** CSS selector for paths within the container to animate on this track. */
  selector: string;
  /** Progress value (0–1) within the overall scroll range where this track starts. */
  from: number;
  /** Progress value (0–1) within the overall scroll range where this track ends. */
  to: number;
  /** Easing for this track. Defaults to 'linear'. */
  easing?: EasingName | ((t: number) => number);
  /** Fade opacity in sync with this track's draw progress. */
  fade?: boolean;
}

export interface ScrollDrawTimelineOptions {
  /** Scroll trigger window. Same syntax as scrollDraw(). */
  trigger?: { start?: string; end?: string };
  /** Overall speed multiplier. Default 1. */
  speed?: number;
  /** Lock at max progress once reached. Default false. */
  once?: boolean;
  /** Scroll axis. Default 'y'. */
  axis?: 'x' | 'y';
  /** Per-path animation tracks — each with independent start/end within the scroll range. */
  tracks: TimelineTrack[];
  /** Fires when all tracks have reached their full draw progress. */
  onComplete?: () => void;
  /**
   * Replay the timeline N times (or 'infinite') after it completes. Works with
   * `once: true` — after completion + delay, paths reset and the animation plays
   * again on the next scroll-into-view. With `once: false` (default) the timeline
   * already reverses naturally on scroll-up, so repeat is a no-op.
   */
  repeat?: number | 'infinite';
  /** Milliseconds to wait before each repeat. Default 0. */
  repeatDelay?: number;
  /**
   * After the scroll-driven animation completes, automatically replay the full
   * timeline as a time-driven loop — no further scroll input needed. Use `true`
   * to loop infinitely or a number to loop N additional times.
   *
   * Each iteration plays over `loopDuration` milliseconds, then waits
   * `repeatDelay` before the next iteration begins.
   */
  loop?: boolean | number;
  /** Duration of each time-driven loop iteration in milliseconds. Default 1500. */
  loopDuration?: number;
  /**
   * Show a developer overlay panel visualising each track's window and live
   * fill progress. Injected into document.body as a fixed HUD, removed on destroy().
   * Useful for tuning `from`/`to` values without guessing.
   */
  debug?: boolean;
  /** Label shown in the debug panel header. Defaults to the target selector string. */
  label?: string;
  /**
   * Honour `prefers-reduced-motion: reduce` for the time-driven `loop` only.
   * Default: `true`.
   *
   * The two halves of this API deserve different answers. Scroll scrubbing
   * advances 1:1 with the user's own input — direct manipulation, not motion
   * played at them — and suppressing it would freeze the drawing at whatever
   * fraction the first paint happened to compute, so it keeps scrubbing. `loop`
   * is the opposite: it replays the whole timeline off `performance.now()` with
   * no scroll input at all, which is autonomous motion by any definition and had
   * no check whatsoever. With reduced motion requested, the scroll pass runs
   * normally and the loop simply does not start.
   *
   * Set to `false` to loop regardless of the preference.
   */
  respectReducedMotion?: boolean;
}

const DEBUG_COLORS = ['#ff90e8', '#ffc900', '#5865F2', '#22c55e', '#f59e0b', '#ef4444', '#aaa', '#60a5fa'];

/**
 * Animate multiple path groups with independent start/end windows within a
 * single scroll range. Unlike `stagger` (which offsets by time), each track
 * defines its own `from`/`to` slice of the 0–1 progress range.
 *
 * @example
 * import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
 *
 * scrollDrawTimeline('#diagram', {
 *   trigger: { start: 'top 80%', end: 'bottom 20%' },
 *   tracks: [
 *     { selector: '.outline', from: 0,   to: 0.5, easing: 'ease-out' },
 *     { selector: '.detail',  from: 0.3, to: 0.8, easing: 'ease-in'  },
 *     { selector: '.label',   from: 0.7, to: 1.0, easing: 'spring'   },
 *   ],
 * });
 */
export function scrollDrawTimeline(
  target: string | Element,
  options: ScrollDrawTimelineOptions,
): ScrollDrawInstance {
  const noop: ScrollDrawInstance = { destroy: () => {}, replay: () => {}, pause: () => {}, resume: () => {}, seek: () => {}, getProgress: () => 0 };
  if (typeof window === 'undefined') return noop;

  const containerOrNull = typeof target === 'string' ? document.querySelector(target) : target;
  if (!containerOrNull) {
    warn('timeline: Container not found:', target);
    return noop;
  }
  const container = containerOrNull;

  const {
    trigger      = {},
    speed        = 1,
    once         = false,
    axis         = 'y',
    tracks,
    onComplete,
    repeat,
    repeatDelay  = 0,
    loop         = false,
    loopDuration = 1500,
    debug        = false,
    label,
    respectReducedMotion = true,
  } = options;

  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

  let repeatCount: number = repeat === 'infinite' ? Infinity : (repeat ?? 0);
  let repeatTimer: ReturnType<typeof setTimeout> | undefined;

  // ── Loop state ────────────────────────────────────────────────────────────
  const maxLoops: number = loop === true ? Infinity : (typeof loop === 'number' ? loop : 0);
  let looping    = false;
  let loopStart  = 0;
  let loopsLeft  = maxLoops;

  /**
   * The time-driven replay is the one part of this module that is not
   * scroll-linked, and therefore the one part `prefers-reduced-motion` applies to
   * — see the option's docs. Tracked live rather than read once, so toggling the
   * OS setting takes effect without a reload, and a loop already in flight is
   * abandoned rather than finishing its iteration.
   */
  let motionReduced = respectReducedMotion && prefersReducedMotion();
  const stopWatchingMotion = watchReducedMotion((reduced) => {
    motionReduced = respectReducedMotion && reduced;
    if (!motionReduced) return;
    looping = false;
    clearTimeout(repeatTimer);
    repeatTimer = undefined;
  });

  /** Whether this instance should behave as though `loop` were set at all. */
  const loopActive = (): boolean => maxLoops > 0 && !motionReduced;

  /**
   * Inline styles as they were before this instance touched anything.
   *
   * Without this, `destroy()` left every path frozen at whatever dashoffset the
   * last frame wrote — a diagram destroyed mid-scroll stayed half-drawn (and with
   * `fade`, half-transparent) for the rest of the page's life. `scrollAnimate`,
   * `scrollPin` and `scrollText` all restore what they wrote; this module was the
   * last one that did not.
   */
  const savedInline = new Map<SVGElement, string>();

  // Resolve each track's elements + lengths up front
  const trackData = tracks.map((track) => {
    const easeFn = typeof track.easing === 'function'
      ? track.easing
      : (EASINGS[track.easing ?? 'linear'] ?? EASINGS.linear);
    const elements = Array.from(container.querySelectorAll<SVGElement>(track.selector));
    const lengths  = elements.map((el) => getElementLength(el));
    elements.forEach((el, i) => {
      if (!savedInline.has(el)) savedInline.set(el, el.getAttribute('style') ?? '');
      el.style.strokeDasharray  = `${lengths[i]}`;
      el.style.strokeDashoffset = `${lengths[i]}`;
      if (track.fade) el.style.opacity = '0';
    });
    return { ...track, elements, lengths, easeFn };
  });

  function restoreInline(): void {
    for (const [el, style] of savedInline) {
      if (style) el.setAttribute('style', style);
      else el.removeAttribute('style');
    }
  }

  let tStart = 0, tEnd = 0;
  let isVisible = false, paused = false, rafId = 0;
  let completed = false, frozenAlpha = -1, currentAlpha = 0;

  // ── Debug overlay ─────────────────────────────────────────────────────────
  let debugEl: HTMLDivElement | null = null;
  if (debug) {
    debugEl = document.createElement('div');
    Object.assign(debugEl.style, {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      zIndex: '9999',
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff',
      minWidth: '240px',
      pointerEvents: 'none',
      lineHeight: '1.4',
    });
    document.body.appendChild(debugEl);
  }

  function updateDebug(globalAlpha: number) {
    if (!debugEl) return;
    const panelLabel = label ?? (typeof target === 'string' ? target : 'timeline');
    const rows = tracks.map(({ selector, from, to }, i) => {
      const color    = DEBUG_COLORS[i % DEBUG_COLORS.length];
      const localRaw = to > from ? Math.min(1, Math.max(0, (globalAlpha - from) / (to - from))) : 0;
      const pct      = Math.round(localRaw * 100);
      return `<div style="margin:4px 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span style="color:${color};max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${selector}</span>
          <span style="color:#666;margin-left:8px">${pct}%</span>
        </div>
        <div style="height:3px;background:#2a2a2a;border-radius:2px;position:relative;overflow:hidden">
          <div style="position:absolute;left:${from * 100}%;width:${(to - from) * 100}%;height:100%;background:${color}33;border-radius:2px"></div>
          <div style="position:absolute;left:${from * 100}%;width:${(to - from) * localRaw * 100}%;height:100%;background:${color};border-radius:2px;transition:width 0.05s linear"></div>
        </div>
      </div>`;
    }).join('');

    debugEl.innerHTML = `
      <div style="color:#555;margin-bottom:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:6px">
        scrollDrawTimeline · ${panelLabel}
      </div>
      ${rows}
      <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span style="color:#555">scroll</span>
          <span style="color:#666">${Math.round(globalAlpha * 100)}%</span>
        </div>
        <div style="height:2px;background:#2a2a2a;border-radius:1px;overflow:hidden">
          <div style="height:100%;background:#fff;border-radius:1px;width:${globalAlpha * 100}%;transition:width 0.05s linear"></div>
        </div>
      </div>`;
  }

  // ── Core ──────────────────────────────────────────────────────────────────

  function scrollPos() { return axis === 'x' ? window.scrollX : window.scrollY; }
  function vpSize()    { return axis === 'x' ? window.innerWidth : window.innerHeight; }

  function cacheTriggers() {
    const rect   = container.getBoundingClientRect();
    const scroll = scrollPos();
    const pos    = axis === 'x' ? rect.left : rect.top;
    const size   = axis === 'x' ? rect.width : rect.height;
    const result = computeTriggers({ top: pos, height: size }, scroll, vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyGlobalAlpha(globalAlpha: number) {
    (container as HTMLElement).style.setProperty('--scroll-draw-progress', String(globalAlpha));
    trackData.forEach(({ elements, lengths, from, to, easeFn, fade }) => {
      const range      = to - from;
      const localRaw   = range > 0 ? Math.min(1, Math.max(0, (globalAlpha - from) / range)) : 0;
      const localAlpha = easeFn(localRaw);
      elements.forEach((el, i) => {
        el.style.strokeDashoffset = `${lengths[i] * (1 - localAlpha)}`;
        if (fade) el.style.opacity = String(localAlpha);
      });
    });
    updateDebug(globalAlpha);
  }

  function doReset() {
    frozenAlpha  = -1;
    currentAlpha = 0;
    completed    = false;
    trackData.forEach(({ elements, lengths, fade }) => {
      elements.forEach((el, i) => {
        el.style.strokeDashoffset = `${lengths[i]}`;
        if (fade) el.style.opacity = '0';
      });
    });
    (container as HTMLElement).style.setProperty('--scroll-draw-progress', '0');
  }

  function update() {
    if (!isVisible || paused) return;

    let alpha: number;
    if (looping) {
      alpha = Math.min(1, (performance.now() - loopStart) / loopDuration);
    } else {
      alpha = computeProgress(scrollPos(), tStart, tEnd, speed);
      if (once || loopActive()) { frozenAlpha = Math.max(frozenAlpha, alpha); alpha = frozenAlpha; }
    }

    currentAlpha = alpha;
    applyGlobalAlpha(alpha);

    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();

      if (loopActive() && !looping && !repeatTimer) {
        // First completion (scroll-driven) — start time-driven loop after delay
        repeatTimer = setTimeout(() => {
          repeatTimer = undefined;
          if (loopsLeft !== Infinity) loopsLeft--;
          doReset();
          looping    = true;
          loopStart  = performance.now();
        }, repeatDelay);
      } else if (repeatCount > 0 && once && !looping && !repeatTimer) {
        // repeat (scroll-re-entry mode)
        repeatTimer = setTimeout(() => {
          repeatTimer = undefined;
          if (repeatCount !== Infinity) repeatCount--;
          doReset();
        }, repeatDelay);
      }
    } else if (!looping && alpha < 1 && !once) {
      completed = false;
    }

    // End of a loop iteration — reset and continue or stop
    if (looping && alpha >= 1 && !repeatTimer) {
      completed = false;
      if (loopsLeft > 0 && loopActive()) {
        repeatTimer = setTimeout(() => {
          repeatTimer = undefined;
          if (loopsLeft !== Infinity) loopsLeft--;
          doReset();
          loopStart = performance.now();
        }, repeatDelay);
      } else {
        looping = false; // exhausted all loop iterations — stop
      }
    }

    rafId = requestAnimationFrame(update);
  }

  cacheTriggers();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
    { threshold: 0 },
  );
  observer.observe(container);

  /** Everything layout-dependent, re-read. Shared by resize and refresh(). */
  function remeasure() {
    trackData.forEach(({ elements, lengths }) => {
      elements.forEach((el, i) => {
        lengths[i] = getElementLength(el);
        el.style.strokeDasharray = `${lengths[i]}`;
      });
    });
    cacheTriggers();
  }

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(remeasure, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      clearTimeout(repeatTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      stopWatchingMotion();
      if (debugEl) { debugEl.remove(); debugEl = null; }
      // Put the paths back the way they were found, rather than leaving them
      // frozen on the last frame this instance happened to write.
      restoreInline();
      (container as HTMLElement).style.removeProperty('--scroll-draw-progress');
    },
    /** Re-measure path lengths and the trigger window after a layout change. */
    refresh() {
      clearTimeout(resizeTimer);
      remeasure();
    },
    replay() {
      repeatCount = repeat === 'infinite' ? Infinity : (repeat ?? 0);
      loopsLeft   = maxLoops;
      looping     = false;
      clearTimeout(repeatTimer);
      repeatTimer = undefined;
      doReset();
      paused = false;
    },
    pause()  { paused = true;  cancelAnimationFrame(rafId); },
    resume() { if (!paused) return; paused = false; if (isVisible) rafId = requestAnimationFrame(update); },
    seek(p: number) {
      currentAlpha = Math.min(1, Math.max(0, p));
      frozenAlpha  = currentAlpha;
      paused       = true;
      cancelAnimationFrame(rafId);
      applyGlobalAlpha(currentAlpha);
    },
    getProgress() { return currentAlpha; },
  };
}
