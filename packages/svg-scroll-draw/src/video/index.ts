import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import { watchReducedMotion } from '../core/motion-watch';
import { frameGate } from '../core/frame-gate';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollVideoOptions {
  trigger?: TriggerConfig;
  from?: number;
  to?: number;
  easing?: EasingName | ((t: number) => number);
  once?: boolean;
  axis?: 'x' | 'y';
  preload?: 'auto' | 'metadata';
  /**
   * Measure the trigger window from this element instead of the video.
   *
   * Needed for the pinned-film pattern: a video in a `position: sticky` stage
   * moves with the scroll while the stage is stuck, so its own box cannot
   * describe a scrub that runs the length of the pin — and re-measuring it on
   * a resize (a phone's address bar) lands on the wrong window. Point this at
   * the tall track that holds the scroll room, with `start: 'top top'` and
   * `end: 'bottom bottom'`, and the film runs exactly while the stage is stuck.
   */
  triggerElement?: Element;
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
    triggerElement,
    onReady,
    onComplete,
    onProgress,
  } = options;

  const measured: Element = triggerElement ?? video;

  let prefersReduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeFn         = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig    = parseTrigger(trigger.start || 'top top');
  const endConfig      = parseTrigger(trigger.end   || 'bottom top');

  // Ensure video is paused and preloaded
  video.pause();
  if (!video.hasAttribute('preload')) video.preload = preload;

  let from = options.from ?? 0;
  let to   = options.to;  // resolved after metadata loads

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
  let ready        = false;

  const scrollPos = (): number => (axis === 'x' ? window.scrollX : window.scrollY);
  const vpSize    = (): number => (axis === 'x' ? window.innerWidth : window.innerHeight);

  function cacheTriggers(): void {
    const rect = measured.getBoundingClientRect();
    const pos  = axis === 'x' ? rect.left : rect.top;
    const size = axis === 'x' ? rect.width : rect.height;
    const result = computeTriggers({ top: pos, height: size }, scrollPos(), vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
    // A window of no length never scrubs. The usual cause is measuring a video
    // that sits in a sticky stage one viewport tall; name the fix.
    if (ready && tEnd === tStart) {
      warn('scrollVideo: zero-length trigger window, so it never scrubs. In a sticky stage, set triggerElement.', video);
    }
  }

  /** The time last written, so an unchanged frame does not start a new seek. */
  let lastTime = NaN;

  function applyAlpha(alpha: number): void {
    if (!ready) return;
    const effectiveTo = to ?? video.duration ?? 0;
    const time = from + (effectiveTo - from) * alpha;
    /*
     * Every write to `currentTime` starts a seek — even to the value it already
     * has. `update()` runs every frame while the video is visible, so a page at
     * rest kept the decoder seeking 60 times a second, and in Firefox `seeking`
     * never settled (the CI paint test caught it). Write only on change.
     */
    if (time !== lastTime) {
      lastTime = time;
      video.currentTime = time;
    }
    video.style.setProperty('--scroll-draw-progress', String(alpha));
    onProgress?.(alpha);
  }

  /** Where the scroll is through the window: what runs the frames (core/frame-gate). */
  const at = (): number => computeProgress(scrollPos(), tStart, tEnd, 1);

  function update(): void {
    // Reduced motion shows the last frame once, at metadata. The triggers are
    // never measured then, so a scroll-driven update would seek back to frame 0.
    if (!ready || prefersReduced) return;
    const progress = at();
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

  // The frames follow the trigger window, not an observer of the video: a jump
  // across the whole window never had it on screen, so it stayed on its first
  // frame and onComplete never fired. It also re-measures on a resize or a
  // layout change: images, fonts, late content.
  const gate = frameGate(window, [measured], at, update, cacheTriggers);
  /** Frames only once there is a video to seek, and while nothing stopped them. */
  const go = (): void => gate.hold(paused || !ready || prefersReduced);
  go();

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
    // A seek() made before the metadata had nothing to write to yet: write it
    // now. It used to be lost, the video on frame 0 and getProgress() at 0.5.
    if (paused) applyAlpha(currentAlpha);
    else go();
  }

  // video may already have metadata
  if (video.readyState >= 1) {
    onMetadataLoaded();
  } else {
    video.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
  }

  if (!ready) cacheTriggers(); // best-effort before metadata

  // Reduced motion turned on mid-visit stops the scrub on the end frame, as a
  // page loaded under it would. One way, as everywhere (core/motion-live).
  const unwatchMotion = prefersReduced ? () => {} : watchReducedMotion((reduced) => {
    if (!reduced) return;
    unwatchMotion();
    prefersReduced = true;
    gate.hold(true);
    applyAlpha(1);
  });


  _register(video, {
    type: 'video',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  function resume(): void {
    if (!paused) return;
    paused = false;
    go();
  }

  return {
    destroy() {
      gate.off();
      video.removeEventListener('loadedmetadata', onMetadataLoaded);
      unwatchMotion();
      _unregister(video);
    },
    replay() {
      frozenAlpha  = -1;
      frozenRaw    = 0;
      completed    = false;
      currentAlpha = 0;
      lastTime     = NaN;   // an explicit replay always seeks
      applyAlpha(0);
      // After pause() or seek() the loop is stopped. replay() used to clear
      // `paused` and leave it so, and resume() then had nothing to restart.
      resume();
    },
    pause() {
      paused = true;
      gate.hold(true);
    },
    resume,
    seek(p: number) {
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      frozenRaw     = 0;
      paused        = true;
      gate.hold(true);
      lastTime      = NaN;  // an explicit seek always seeks
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
