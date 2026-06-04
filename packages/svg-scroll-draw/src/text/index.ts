import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers } from '../core/utils';
import { _register, _unregister } from '../core/registry';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollTextOptions {
  split?: 'chars' | 'words' | 'lines';
  stagger?: number;
  easing?: EasingName | ((t: number) => number);
  from?: {
    opacity?: number;
    y?: number;
    x?: number;
    rotate?: number;
    scale?: number;
  };
  trigger?: TriggerConfig;
  once?: boolean;
  onComplete?: () => void;
}

// ── Text splitting helpers ────────────────────────────────────────────────────

function splitIntoWords(el: Element): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  return text.split(/(\s+)/).filter(Boolean).map((chunk) => {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    if (/^\s+$/.test(chunk)) {
      // Whitespace — use a non-breaking space span
      span.textContent = chunk;
      span.style.whiteSpace = 'pre';
    } else {
      span.textContent = chunk;
      span.style.display = 'inline-block';
    }
    el.appendChild(span);
    return /^\s+$/.test(chunk) ? null : span;
  }).filter((s): s is HTMLSpanElement => s !== null);
}

function splitIntoChars(el: Element): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  return text.split('').map((char) => {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = char;
    if (char === ' ') {
      span.style.whiteSpace = 'pre';
    } else {
      span.style.display = 'inline-block';
    }
    el.appendChild(span);
    return char === ' ' ? null : span;
  }).filter((s): s is HTMLSpanElement => s !== null);
}

function splitIntoLines(el: Element): HTMLSpanElement[] {
  // First split into words, then group by offsetTop
  const wordSpans = splitIntoWords(el);
  const lineMap = new Map<number, HTMLSpanElement[]>();
  for (const span of wordSpans) {
    const top = span.offsetTop;
    if (!lineMap.has(top)) lineMap.set(top, []);
    lineMap.get(top)!.push(span);
  }

  // Wrap each line's words in a line span
  const lineSpans: HTMLSpanElement[] = [];
  const sortedTops = Array.from(lineMap.keys()).sort((a, b) => a - b);
  for (const top of sortedTops) {
    const words = lineMap.get(top)!;
    const lineSpan = document.createElement('span');
    lineSpan.setAttribute('aria-hidden', 'true');
    lineSpan.style.display = 'inline-block';
    // Move word spans into line span
    for (const ws of words) {
      lineSpan.appendChild(ws);
    }
    lineSpans.push(lineSpan);
  }

  // Clear el and add line spans back
  el.textContent = '';
  for (const ls of lineSpans) {
    el.appendChild(ls);
    el.appendChild(document.createTextNode(' '));
  }

  return lineSpans;
}

// ── Per-unit alpha with stagger ───────────────────────────────────────────────

function unitAlpha(masterAlpha: number, index: number, total: number, stagger: number): number {
  if (total <= 1 || stagger === 0) return masterAlpha;
  const totalDelay = (total - 1) * stagger;
  const start = index * stagger;
  const end   = start + (1 - totalDelay);
  if (end <= start) return masterAlpha >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (masterAlpha - start) / (end - start)));
}

function buildTransform(
  alpha: number,
  from: ScrollTextOptions['from'],
): string {
  const parts: string[] = [];
  if (from?.y !== undefined) parts.push(`translateY(${from.y * (1 - alpha)}px)`);
  if (from?.x !== undefined) parts.push(`translateX(${from.x * (1 - alpha)}px)`);
  if (from?.rotate !== undefined) parts.push(`rotate(${from.rotate * (1 - alpha)}deg)`);
  if (from?.scale !== undefined) {
    const s = from.scale + (1 - from.scale) * alpha;
    parts.push(`scale(${s})`);
  }
  return parts.join(' ') || '';
}

// ── Engine ────────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function scrollText(
  target: string | Element,
  options: ScrollTextOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const raw = typeof target === 'string' ? document.querySelector(target) : target;
  if (!raw) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[svg-scroll-draw] scrollText: element not found:', target);
    }
    return NOOP;
  }

  const el = raw as HTMLElement;

  const {
    split   = 'words',
    stagger = 0.04,
    easing  = 'ease-out',
    from    = { opacity: 0, y: 24 },
    trigger = {},
    once    = true,
    onComplete,
  } = options;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeFn         = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS['ease-out']);
  const startConfig    = parseTrigger(trigger.start ?? 'top 85%');
  const endConfig      = parseTrigger(trigger.end   ?? 'top 40%');

  // Save original text for accessibility and destroy()
  const originalHTML = el.innerHTML;
  el.setAttribute('aria-label', el.textContent ?? '');

  // Split the element
  let spans: HTMLSpanElement[];
  if (split === 'chars') spans = splitIntoChars(el);
  else if (split === 'lines') spans = splitIntoLines(el);
  else spans = splitIntoWords(el);

  const n = spans.length;

  // Apply initial `from` state
  function applyUnitAlpha(span: HTMLSpanElement, alpha: number): void {
    if (from?.opacity !== undefined) {
      span.style.opacity = String(from.opacity + (1 - from.opacity) * alpha);
    }
    const tx = buildTransform(alpha, from);
    if (tx) span.style.transform = tx;
  }

  function applyAll(masterAlpha: number): void {
    el.style.setProperty('--scroll-draw-progress', String(masterAlpha));
    spans.forEach((span, i) => {
      const ua = easeFn(unitAlpha(masterAlpha, i, n, stagger));
      applyUnitAlpha(span, ua);
    });
  }

  if (prefersReduced) {
    applyAll(1);
    onComplete?.();
    return {
      destroy() {
        el.innerHTML = originalHTML;
        el.removeAttribute('aria-label');
      },
      replay: () => {}, pause: () => {}, resume: () => {},
      seek: () => {}, getProgress: () => 1,
    };
  }

  // Set initial state
  applyAll(0);

  let tStart       = 0;
  let tEnd         = 0;
  let rafId        = 0;
  let isVisible    = false;
  let paused       = false;
  let frozenAlpha  = -1;
  let currentAlpha = 0;
  let completed    = false;

  const scrollPos = (): number => window.scrollY;
  const vpSize    = (): number => window.innerHeight;

  function cacheTriggers(): void {
    const rect = el.getBoundingClientRect();
    const result = computeTriggers(
      { top: rect.top, height: rect.height },
      scrollPos(), vpSize(), startConfig, endConfig,
    );
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function update(): void {
    if (!isVisible || paused) return;
    let alpha = computeProgress(scrollPos(), tStart, tEnd, 1);
    if (once) {
      frozenAlpha = Math.max(frozenAlpha, alpha);
      alpha = frozenAlpha;
    }
    currentAlpha = alpha;
    applyAll(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) {
      completed = false;
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
  );

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (split === 'lines') {
        // Re-measure lines on resize
        const savedAlpha = currentAlpha;
        el.innerHTML = originalHTML;
        el.setAttribute('aria-label', el.textContent ?? '');
        spans = splitIntoLines(el);
        applyAll(savedAlpha);
      }
      cacheTriggers();
    }, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  observer.observe(el);

  _register(el, {
    type: 'text',
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
      el.innerHTML = originalHTML;
      el.removeAttribute('aria-label');
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      completed    = false;
      currentAlpha = 0;
      paused       = false;
      applyAll(0);
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
      applyAll(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
