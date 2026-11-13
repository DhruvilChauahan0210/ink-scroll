import type { Easing, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { resolveEasing } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import { finishWhenReduced } from '../core/motion-live';
import { frameGate } from '../core/frame-gate';
import { clamp } from '../core/math';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollTextOptions {
  split?: 'chars' | 'words' | 'lines';
  stagger?: number;
  easing?: Easing;
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

/**
 * The whole text once more, for screen readers, after the split pieces (each
 * aria-hidden). It used to be an aria-label on the element, which ARIA forbids
 * on a paragraph, a span or a div, the elements scrollText runs on most: a
 * screen reader may skip it, and with every piece hidden it then reads nothing
 * (axe: aria-prohibited-attr, found on the site's own headline block).
 * Visually hidden, not selectable, so a copy picks up the text once.
 */
function readable(el: Element, text: string): void {
  const sr = document.createElement('span');
  sr.textContent = text;
  sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;user-select:none';
  el.appendChild(sr);
}

/** A split piece: hidden from screen readers, which read the copy readable() adds. */
function piece(text = ''): HTMLSpanElement {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = text;
  return span;
}

function splitIntoWords(el: Element): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  return text.split(/(\s+)/).filter(Boolean).map((chunk) => {
    const span = el.appendChild(piece(chunk));
    // Whitespace keeps its width in a `pre` span, and is not animated.
    const gap = /^\s+$/.test(chunk);
    if (gap) span.style.whiteSpace = 'pre';
    else span.style.display = 'inline-block';
    return gap ? null : span;
  }).filter((s): s is HTMLSpanElement => s !== null);
}

function splitIntoChars(el: Element): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  const units: HTMLSpanElement[] = [];
  let word: HTMLSpanElement | null = null;
  // By code point, not split(''): an emoji is two UTF-16 units, and splitting
  // them made two spans of lone surrogates, drawn as two U+FFFD.
  for (const char of text) {
    const span = piece(char);
    const gap  = char === ' ';
    if (gap) span.style.whiteSpace = 'pre';
    else {
      span.style.display = 'inline-block';
      units.push(span);
    }
    // From Thai (U+0E00) on — Thai, Lao, Khmer, Myanmar, CJK, kana, Hangul,
    // emoji — scripts either put no spaces between words or may break between
    // any two characters: in a word box a whole line of them never wrapped and
    // ran out of its paragraph. Each is a box of its own, so a line breaks
    // between them, as it did before word boxes. Latin, Greek, Cyrillic and
    // the other space-separated scripts below keep whole words.
    if (gap || char > '\u0dff') word = null;
    // Each word's letters sit in a nowrap inline-block: side by side as
    // inline-blocks, a line could break between any two of them, mid-word. As
    // one box a word breaks only where the text did, at its spaces.
    else if (!word) {
      word = el.appendChild(piece());
      word.style.cssText = 'display:inline-block;white-space:nowrap';
    }
    (word ?? el).appendChild(span);
  }
  return units;
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
    const lineSpan = piece();
    lineSpan.style.display = 'inline-block';

    words.forEach((ws, i) => {
      /*
       * The gap after this word, if there is one.
       *
       * `splitIntoWords` emits a `white-space: pre` span for every run of
       * whitespace and then filters those out of what it returns — so the array
       * being moved here is words only. Moving just the words and then clearing
       * the element threw every gap away, and "Hello world foo bar" rendered as
       * "Helloworldfoobar". Read before the move: appending re-parents the node
       * and changes what its sibling is.
       */
      const gap = ws.nextElementSibling as HTMLElement | null;
      lineSpan.appendChild(ws);
      if (i < words.length - 1 && gap && gap.style.whiteSpace === 'pre') {
        lineSpan.appendChild(gap);
      }
    });

    lineSpans.push(lineSpan);
  }

  // Clear el and add line spans back
  el.textContent = '';
  lineSpans.forEach((ls, i) => {
    el.appendChild(ls);
    // Between lines only. A trailing separator leaves the element's text one
    // space longer than the text it was given.
    if (i < lineSpans.length - 1) el.appendChild(document.createTextNode(' '));
  });

  return lineSpans;
}

// ── Per-unit alpha with stagger ───────────────────────────────────────────────

function unitAlpha(masterAlpha: number, index: number, total: number, stagger: number): number {
  if (total <= 1 || stagger === 0) return masterAlpha;
  // No more stagger than the units fit in the window. Past 1 / total (26 units
  // at the default 0.04, a short line split into chars) each unit was a step:
  // the first shown at progress 0, and every unit from the 27th on never shown.
  stagger = Math.min(stagger, 1 / total);
  const totalDelay = (total - 1) * stagger;
  const start = index * stagger;
  const end   = start + (1 - totalDelay);
  if (end <= start) return masterAlpha >= start ? 1 : 0;
  return clamp((masterAlpha - start) / (end - start), 0, 1);
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
  return parts.join(' ');
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
    warn('scrollText: element not found:', target);
    return NOOP;
  }

  const el = raw as HTMLElement;
  // Reduced motion turned on mid-visit shows the final text as a page loaded
  // under it would (core/motion-live).
  return finishWhenReduced(options, (opts, reduced) => buildText(el, opts, reduced));
}

function buildText(el: HTMLElement, options: ScrollTextOptions, prefersReduced: boolean): ScrollDrawInstance {
  const {
    split   = 'words',
    stagger = 0.04,
    easing  = 'ease-out',
    from    = { opacity: 0, y: 24 },
    trigger = {},
    once    = true,
    onComplete,
  } = options;

  const easeFn         = resolveEasing(easing, 'ease-out');
  const startConfig    = parseTrigger(trigger.start || 'top 85%');
  const endConfig      = parseTrigger(trigger.end   || 'top 40%');

  // Saved for destroy() and for the screen-reader copy.
  const originalHTML = el.innerHTML;
  const text = el.textContent ?? '';

  // Split the element
  let spans: HTMLSpanElement[];
  if (split === 'chars') spans = splitIntoChars(el);
  else if (split === 'lines') spans = splitIntoLines(el);
  else spans = splitIntoWords(el);
  readable(el, text);

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
    return { ...NOOP, destroy: () => { el.innerHTML = originalHTML; }, getProgress: () => 1 };
  }

  // Set initial state
  applyAll(0);

  let tStart       = 0;
  let tEnd         = 0;
  let frozenAlpha  = -1;
  let currentAlpha = 0;
  let completed    = false;

  function cacheTriggers(): void {
    ({ tStart, tEnd } = computeTriggers(
      el.getBoundingClientRect(),
      window.scrollY, window.innerHeight, startConfig, endConfig,
    ));
  }

  /** Where the scroll is through the window: what runs the frames (core/frame-gate). */
  const at = (): number => computeProgress(window.scrollY, tStart, tEnd, 1);

  function update(): void {
    // With `once`, held at the furthest point.
    const alpha = once ? (frozenAlpha = Math.max(frozenAlpha, at())) : at();
    currentAlpha = alpha;
    applyAll(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) {
      completed = false;
    }
  }

  cacheTriggers();

  // The frames follow the trigger window, not an observer of the element: a
  // jump across the whole window never had it on screen, so the text stayed
  // hidden and onComplete never fired.
  // It also re-measures on a resize or a layout change: images, fonts, late
  // content. Lines are split again then, since they wrap where the width says.
  const gate = frameGate(window, [el], at, update, () => {
    if (split === 'lines') {
      el.innerHTML = originalHTML;
      spans = splitIntoLines(el);
      readable(el, text);
      applyAll(currentAlpha);
    }
    cacheTriggers();
  });

  _register(el, {
    type: 'text',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  const resume = (): void => gate.hold(false);

  return {
    destroy() {
      gate.off();
      el.innerHTML = originalHTML;
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      completed    = false;
      currentAlpha = 0;
      applyAll(0);
      // After pause() or seek() the loop is stopped. replay() used to clear
      // `paused` and leave it so, and resume() then had nothing to restart.
      resume();
    },
    pause: () => gate.hold(true),
    resume,
    seek(p: number) {
      gate.hold(true);
      applyAll(currentAlpha = frozenAlpha = clamp(p, 0, 1));
    },
    getProgress() { return currentAlpha; },
  };
}
