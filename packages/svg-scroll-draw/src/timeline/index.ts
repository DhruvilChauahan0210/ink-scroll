import { EASINGS, parseTrigger, computeProgress, computeTriggers, getElementLength } from '../core/utils';
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
}

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
    console.warn('[svg-scroll-draw/timeline] Container not found:', target);
    return noop;
  }
  const container = containerOrNull;

  const {
    trigger     = {},
    speed       = 1,
    once        = false,
    axis        = 'y',
    tracks,
    onComplete,
  } = options;

  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

  // Resolve each track's elements + lengths up front
  const trackData = tracks.map((track) => {
    const easeFn = typeof track.easing === 'function'
      ? track.easing
      : (EASINGS[track.easing ?? 'linear'] ?? EASINGS.linear);
    const elements = Array.from(container.querySelectorAll<SVGElement>(track.selector));
    const lengths  = elements.map((el) => getElementLength(el));
    elements.forEach((el, i) => {
      el.style.strokeDasharray  = `${lengths[i]}`;
      el.style.strokeDashoffset = `${lengths[i]}`;
      if (track.fade) el.style.opacity = '0';
    });
    return { ...track, elements, lengths, easeFn };
  });

  let tStart = 0, tEnd = 0;
  let isVisible = false, paused = false, rafId = 0;
  let completed = false, frozenAlpha = -1, currentAlpha = 0;

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
  }

  function update() {
    if (!isVisible || paused) return;
    let alpha = computeProgress(scrollPos(), tStart, tEnd, speed);
    if (once) { frozenAlpha = Math.max(frozenAlpha, alpha); alpha = frozenAlpha; }
    currentAlpha = alpha;
    applyGlobalAlpha(alpha);
    if (alpha >= 1 && !completed) { completed = true; onComplete?.(); }
    else if (alpha < 1 && !once)   { completed = false; }
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

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      trackData.forEach(({ elements, lengths }) => {
        elements.forEach((el, i) => {
          lengths[i] = getElementLength(el);
          el.style.strokeDasharray = `${lengths[i]}`;
        });
      });
      cacheTriggers();
    }, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    },
    replay() {
      frozenAlpha = -1; completed = false; paused = false;
      trackData.forEach(({ elements, lengths, fade }) => {
        elements.forEach((el, i) => {
          el.style.strokeDashoffset = `${lengths[i]}`;
          if (fade) el.style.opacity = '0';
        });
      });
      (container as HTMLElement).style.setProperty('--scroll-draw-progress', '0');
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
