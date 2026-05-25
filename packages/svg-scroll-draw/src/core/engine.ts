import type { ScrollDrawOptions, ScrollDrawInstance } from './types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers } from './utils';

function warnDev(msg: string, el: Element): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[svg-scroll-draw] ${msg}`, el);
  }
}

function checkElement(el: SVGGeometryElement): void {
  const stroke = el.getAttribute('stroke');
  const fill = el.getAttribute('fill');

  if (!stroke || stroke === 'none') {
    warnDev('Element has no stroke — path will not be visible.', el);
  } else if (fill && fill !== 'none' && fill !== 'transparent') {
    warnDev('Element has a fill — it may obscure the stroke animation.', el);
  }
}

export function createEngine(
  container: Element,
  options: ScrollDrawOptions = {}
): ScrollDrawInstance {
  if (typeof window === 'undefined') return { destroy: () => {} };

  const {
    selector = 'path, polyline, line, polygon',
    speed = 1,
    fade = false,
    easing = 'linear',
    trigger = {},
    onComplete,
  } = options;

  const easeFn = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig = parseTrigger(trigger.end ?? 'bottom top');

  const paths = Array.from(container.querySelectorAll<SVGGeometryElement>(selector));
  const lengths: number[] = [];
  let tStart = 0;
  let tEnd = 0;
  let completed = false;
  let rafId = 0;
  let isVisible = false;

  function cacheTriggers(): void {
    const rect = container.getBoundingClientRect();
    const result = computeTriggers(
      { top: rect.top, height: rect.height },
      window.scrollY,
      window.innerHeight,
      startConfig,
      endConfig
    );
    tStart = result.tStart;
    tEnd = result.tEnd;
  }

  paths.forEach((el) => {
    checkElement(el);
    const len = el.getTotalLength();
    lengths.push(len);
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    if (fade) el.style.opacity = '0';
  });

  cacheTriggers();

  function update(): void {
    if (!isVisible) return;
    const alpha = easeFn(computeProgress(window.scrollY, tStart, tEnd, speed));

    paths.forEach((el, i) => {
      el.style.strokeDashoffset = `${lengths[i] * (1 - alpha)}`;
      if (fade) el.style.opacity = `${alpha}`;
    });

    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1) {
      completed = false;
    }

    rafId = requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      isVisible = e.isIntersecting;
      if (isVisible) {
        rafId = requestAnimationFrame(update);
      } else {
        cancelAnimationFrame(rafId);
      }
    });
  });

  observer.observe(container);

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      paths.forEach((el, i) => {
        lengths[i] = el.getTotalLength();
        el.style.strokeDasharray = `${lengths[i]}`;
      });
      cacheTriggers();
    }, 150);
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
    },
  };
}
