import { clamp } from '../core/utils';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';

export interface ScrollPinOptions {
  /** Extra pixels of scroll to stay pinned after the element hits its viewport position. Default: viewport height. */
  pinDistance?: number;
  /** Viewport Y position (px) where the element pins. Default: 0 (top of viewport). */
  top?: number;
  /** Custom scroll container (CSS selector or Element). Default: window. */
  scrollContainer?: string | Element;
  /** Fires when the element begins being pinned (scrolling forward). */
  onEnter?: () => void;
  /** Fires when the element unpins at the end of the pin zone (scrolling forward). */
  onLeave?: () => void;
  /** Fires when the element re-pins after scrolling back into the pin zone. */
  onEnterBack?: () => void;
  /** Fires when the element unpins back before the pin zone (scrolling back). */
  onLeaveBack?: () => void;
  /** Progress through the pin zone (0 = start, 1 = end). */
  onProgress?: (progress: number) => void;
}

export interface ScrollPinInstance {
  /** Remove pin behaviour and restore the element to its original state. */
  destroy: () => void;
  /** Recalculate pin dimensions after a layout change. */
  refresh: () => void;
  /** Returns progress through the pin zone (0–1). */
  getProgress: () => number;
}

type PinState = 'before' | 'pinned' | 'after';

const NOOP: ScrollPinInstance = { destroy: () => {}, refresh: () => {}, getProgress: () => 0 };

export function scrollPin(
  target: string | Element,
  options: ScrollPinOptions = {},
): ScrollPinInstance {
  if (typeof window === 'undefined') return NOOP;

  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    warn('scrollPin: element not found:', target);
    return NOOP;
  }

  const htmlEl = el as HTMLElement;
  const {
    top: pinnedViewportTop = 0,
    scrollContainer,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
    onProgress,
  } = options;

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  // Save original inline styles so we can restore them on destroy
  const savedStyles = {
    position:  htmlEl.style.position,
    top:       htmlEl.style.top,
    bottom:    htmlEl.style.bottom,
    left:      htmlEl.style.left,
    width:     htmlEl.style.width,
    boxSizing: htmlEl.style.boxSizing,
  };

  // Wrap the element — wrapper stays in document flow carrying the pin zone height
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-ssd-pin-wrapper', '');
  wrapper.style.cssText = 'position:relative;';
  htmlEl.parentNode?.insertBefore(wrapper, htmlEl);
  wrapper.appendChild(htmlEl);

  let elWidth     = 0;
  let elHeight    = 0;
  let pinDistance = 0;
  let state: PinState = 'before';
  let currentProgress = 0;
  let rafId  = 0;
  let dirty  = false;

  function measure(): void {
    elWidth     = wrapper.offsetWidth;
    elHeight    = htmlEl.offsetHeight;
    pinDistance = options.pinDistance ?? window.innerHeight;
    wrapper.style.height = `${elHeight + pinDistance}px`;
  }

  function setState(newState: PinState): void {
    if (state === newState) return;
    const prev = state;
    state = newState;

    if (newState === 'before') {
      htmlEl.style.position  = savedStyles.position;
      htmlEl.style.top       = savedStyles.top;
      htmlEl.style.bottom    = savedStyles.bottom;
      htmlEl.style.left      = savedStyles.left;
      htmlEl.style.width     = savedStyles.width;
      htmlEl.style.boxSizing = savedStyles.boxSizing;
      if (prev === 'pinned') onLeaveBack?.();
    } else if (newState === 'pinned') {
      const wRect = wrapper.getBoundingClientRect();
      htmlEl.style.position  = 'fixed';
      htmlEl.style.top       = `${pinnedViewportTop}px`;
      htmlEl.style.bottom    = '';
      htmlEl.style.left      = `${wRect.left}px`;
      htmlEl.style.width     = `${elWidth}px`;
      htmlEl.style.boxSizing = 'border-box';
      if (prev === 'before') onEnter?.();
      else if (prev === 'after') onEnterBack?.();
    } else {
      // after: element is stuck to bottom of wrapper
      htmlEl.style.position  = 'absolute';
      htmlEl.style.top       = '';
      htmlEl.style.bottom    = '0';
      htmlEl.style.left      = '0';
      htmlEl.style.width     = '100%';
      htmlEl.style.boxSizing = 'border-box';
      if (prev === 'pinned') onLeave?.();
    }
  }

  function update(): void {
    dirty = false;
    const wRect = wrapper.getBoundingClientRect();
    const wTop    = wRect.top;
    const wBottom = wRect.bottom;

    const progress = clamp((pinnedViewportTop - wTop) / pinDistance, 0, 1);
    currentProgress = progress;
    onProgress?.(progress);

    if (wTop > pinnedViewportTop) {
      setState('before');
    } else if (wBottom - elHeight <= pinnedViewportTop) {
      setState('after');
    } else {
      setState('pinned');
    }
  }

  function scheduleUpdate(): void {
    if (!dirty) {
      dirty = true;
      rafId = requestAnimationFrame(() => update());
    }
  }

  // Use scroll + resize listeners — pin needs to react to every scroll event
  const scrollTarget = scrollEl ?? window;
  scrollTarget.addEventListener('scroll', scheduleUpdate, { passive: true });

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { measure(); scheduleUpdate(); }, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // ResizeObserver — auto-refresh when the element or document layout changes
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { measure(); scheduleUpdate(); }, 100);
    });
    ro.observe(wrapper);
    ro.observe(document.documentElement);
  }

  measure();
  scheduleUpdate();

  _register(wrapper, {
    type: 'pin',
    getProgress: () => currentProgress,
    getTrigger: () => ({ tStart: 0, tEnd: 1 }),
  });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      scrollTarget.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      ro?.disconnect();

      // Restore original styles
      htmlEl.style.position  = savedStyles.position;
      htmlEl.style.top       = savedStyles.top;
      htmlEl.style.bottom    = savedStyles.bottom;
      htmlEl.style.left      = savedStyles.left;
      htmlEl.style.width     = savedStyles.width;
      htmlEl.style.boxSizing = savedStyles.boxSizing;

      // Unwrap: move element back to where wrapper is, then remove wrapper
      wrapper.parentNode?.insertBefore(htmlEl, wrapper);
      wrapper.remove();

      _unregister(wrapper);
    },

    refresh() {
      measure();
      scheduleUpdate();
    },

    getProgress() {
      return currentProgress;
    },
  };
}
