import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers } from '../core/utils';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollVideoOptions {
  trigger?: TriggerConfig;
  from?: number;
  to?: number;
  easing?: EasingName | ((t: number) => number);
  once?: boolean;
  axis?: 'x' | 'y';
  preload?: 'auto' | 'metadata';
  onReady?: () => void;
  onComplete?: () => void;
  onProgress?: (alpha: number) => void;
}

// ── Engine ────────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function scrollVideo(
  target: string | HTMLVideoElement,
  options: ScrollVideoOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const raw = (typeof target === 'string'
    ? document.querySelector(target)
    : target) as HTMLVideoElement | null;

  if (!raw || raw.tagName.toLowerCase() !== 'video') {
    warn('scrollVideo: <video> element not found:', target);
    return NOOP;
  }

  const video = raw;

  const {
    trigger   = {},
    easing    = 'linear',
    once      = false,
    axis      = 'y',
    preload   = 'auto',
    onReady,
    onComplete,
    onProgress,
  } = options;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeFn         = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig    = parseTrigger(trigger.start ?? 'top top');
  const endConfig      = parseTrigger(trigger.end   ?? 'bottom top');

  // Ensure video is paused and preloaded
  video.pause();
  if (!video.hasAttribute('preload')) video.preload = preload;

  let from = options.from ?? 0;
  let to   = options.to;  // resolved after metadata loads

  // ── State ──────────────────────────────────────────────────────────────────
  let tStart       = 0;
  let tEnd         = 0;
  let rafId        = 0;
  let isVisible    = false;
  let paused       = false;
  let frozenAlpha  = -1;
  let currentAlpha = 0;
  let completed    = false;
  let ready        = false;

  const scrollPos = (): number => (axis === 'x' ? window.scrollX : window.scrollY);
  const vpSize    = (): number => (axis === 'x' ? window.innerWidth : window.innerHeight);

  function cacheTriggers(): void {
    const rect = video.getBoundingClientRect();
    const pos  = axis === 'x' ? rect.left : rect.top;
    const size = axis === 'x' ? rect.width : rect.height;
    const result = computeTriggers({ top: pos, height: size }, scrollPos(), vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyAlpha(alpha: number): void {
    if (!ready) return;
    const effectiveTo = to ?? video.duration ?? 0;
    video.currentTime = from + (effectiveTo - from) * alpha;
    video.style.setProperty('--scroll-draw-progress', String(alpha));
    onProgress?.(alpha);
  }

  function update(): void {
    if (!isVisible || paused || !ready) return;
    let alpha = easeFn(computeProgress(scrollPos(), tStart, tEnd, 1));
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

  function onMetadataLoaded(): void {
    ready = true;
    if (to === undefined) to = video.duration;
    if (prefersReduced) {
      applyAlpha(1);
      onReady?.();
      return;
    }
    cacheTriggers();
    onReady?.();
    if (isVisible && !paused) rafId = requestAnimationFrame(update);
  }

  // video may already have metadata
  if (video.readyState >= 1) {
    onMetadataLoaded();
  } else {
    video.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
  }

  if (!ready) cacheTriggers(); // best-effort before metadata

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused && ready) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
  );

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheTriggers, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  observer.observe(video);

  _register(video, {
    type: 'video',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      video.removeEventListener('loadedmetadata', onMetadataLoaded);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      _unregister(video);
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
      if (isVisible && ready) rafId = requestAnimationFrame(update);
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
