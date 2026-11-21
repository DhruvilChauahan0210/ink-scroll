/**
 * `svg-scroll-draw/write`: text written by a pen as the page scrolls.
 *
 *   scrollWrite('#signature');            // writes the element's own text
 *   scrollWrite('#hello', { text: 'Hello', font: 'roman' });
 *
 * The text is set in a Hershey single-stroke font (./hershey.ts), so every
 * path is the pen's centre line, drawn once. An outline font's letters are
 * filled shapes: a line-drawing animation traces their edges, both sides of
 * every stroke, and the word comes out as a double line.
 *
 * The pen moves at one speed: each stroke gets a slice of the scroll window
 * in proportion to its length, one after another in writing order, and the
 * pen lifts for a moment between letters and longer at a space. Its own small
 * frame loop on the shared trigger window (core/frame-gate), like scrollText:
 * scrollDrawTimeline would do the same with 4 KB of debug panel and loops it
 * does not need, and the draw engine carries none of this either, so the main
 * entry stays its size. Scrolling back unwrites it.
 *
 * An entry of its own: the two fonts are most of its weight. No DOM at import.
 */
import { finishWhenReduced } from '../core/motion-live';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { frameGate } from '../core/frame-gate';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import type { ScrollDrawInstance, TriggerConfig } from '../core/types';
import { HERSHEY, type HersheyFont } from './hershey';

// core/math's clamp and core/dash's dashFor, inlined: importing their files
// split the chunks other entries share, and nuxt, angular and frames grew.
const clamp = (n: number) => Math.min(1, Math.max(0, n));

// ── Layout (pure) ─────────────────────────────────────────────────────────────

/** `script` joins up; `roman` is upright print; `italic` is roman slanted. */
export type WriteFont = 'script' | 'roman' | 'italic';

export interface WriteLayoutOptions {
  /** Default `'script'`. */
  font?: WriteFont;
  /** Pixels to the em (Hershey's 32 units). Default 64. */
  size?: number;
}

export interface WriteStroke {
  /** Path data in the layout's own pixels. */
  d: string;
  /** The pen's travel along it, in px. */
  length: number;
  /** Which letter it belongs to (spaces do not count), from 0. */
  letter: number;
  /** Which word, from 0. */
  word: number;
}

export interface WriteLayout {
  /** The text as set: characters the fonts have no glyph for are left out. */
  text: string;
  /** Every stroke, in writing order. */
  strokes: WriteStroke[];
  /** The line's advance width, in px. */
  width: number;
  /** One em, in px: the line's box runs from the em's top to its bottom. */
  height: number;
  /** The baseline's distance from the top, in px. */
  baseline: number;
  /** Characters left out. */
  missing: string[];
}

/** Hershey's em: 32 units, y from −16 to 16, the baseline at 9. */
const EM = 32;
const BASELINE = 9;

const FACE: Record<WriteFont, [HersheyFont, number]> = {
  script: ['script', 0],
  roman: ['roman', 0],
  // x moved right per unit up, pivoting on the baseline.
  italic: ['roman', 0.21],
};

/** Typographic characters a writer is likely to use, as the ASCII the fonts have. */
const ASCII_FOR: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '′': "'",
  '“': '"', '”': '"', '„': '"', '″': '"',
  '–': '-', '—': '-', '−': '-', '‐': '-',
  '…': '...', ' ': ' ',
};

/** Above this turn at a point (in degrees) the corner is kept; below it, the pen goes round it. */
const CORNER = Math.cos((70 * Math.PI) / 180);

const num = (n: number) => String(Math.round(n * 100) / 100);

/**
 * One stroke as path data. Hershey's points are a few units apart, so a curve
 * drawn point to point shows its facets at a large size. Where the pen turns
 * gently the path goes round the point instead, on a quadratic from the middle
 * of one segment to the middle of the next; a sharp turn (a cusp, the top of
 * an A) stays a corner. The same smoothing as the site's handwriting tool.
 */
function strokeD(pts: number[][]): string {
  const xy = (x: number, y: number) => `${num(x)} ${num(y)}`;
  const at = (i: number) => xy(pts[i][0], pts[i][1]);
  const mid = (i: number) => xy((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  // A dot: a zero-length line, which a round cap paints.
  if (pts.length === 1) return `M${at(0)}L${at(0)}`;
  let d = `M${at(0)}`;
  let onMid = false;
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i][0] - pts[i - 1][0];
    const ay = pts[i][1] - pts[i - 1][1];
    const bx = pts[i + 1][0] - pts[i][0];
    const by = pts[i + 1][1] - pts[i][1];
    const n = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (n > 0 && (ax * bx + ay * by) / n > CORNER) {
      if (!onMid) d += `L${mid(i - 1)}`;
      d += `Q${at(i)} ${mid(i)}`;
      onMid = true;
    } else {
      d += `L${at(i)}`;
      onMid = false;
    }
  }
  return `${d}L${at(pts.length - 1)}`;
}

/**
 * `text` set on one line in a Hershey single-stroke font: every stroke's path
 * data, in writing order (letter by letter, and within a letter as Dr. Hershey
 * drew it). Accents are dropped (é → e), curly quotes and dashes straightened,
 * runs of whitespace become one space, and any other character outside ASCII
 * 32–126 is left out and listed in `missing`. Pure: no DOM, so it runs on a
 * server to render the SVG there.
 */
export function writePaths(text: string, options: WriteLayoutOptions = {}): WriteLayout {
  const [font, slant] = FACE[options.font ?? 'script'] ?? FACE.script;
  const k = (options.size ?? 64) / EM;
  const missing = new Set<string>();
  let set = '';
  for (const ch of text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')) {
    for (const c of ASCII_FOR[ch] ?? ch) {
      const code = c.charCodeAt(0);
      if (code >= 32 && code <= 126) set += c;
      else missing.add(c);
    }
  }
  const strokes: WriteStroke[] = [];
  let x = 0;
  let letter = -1;
  let word = 0;
  let inWord = false;
  for (const ch of set) {
    const g = HERSHEY[font][ch.charCodeAt(0) - 32];
    const v = (i: number) => g.charCodeAt(i) - 82;
    if (ch === ' ') {
      if (inWord) word += 1;
      inWord = false;
    } else {
      inWord = true;
      // A glyph with no strokes of its own is not a letter the pen writes.
      if (g.length > 2) letter += 1;
    }
    const ox = x - v(0);
    for (const run of g.slice(2).split(' R')) {
      if (!run) continue;
      const pts: number[][] = [];
      let length = 0;
      for (let i = 0; i < run.length; i += 2) {
        const gy = run.charCodeAt(i + 1) - 82;
        pts.push([(ox + run.charCodeAt(i) - 82 + (BASELINE - gy) * slant) * k, (gy + EM / 2) * k]);
        const n = pts.length - 1;
        if (n) length += Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]);
      }
      strokes.push({ d: strokeD(pts), length, letter, word });
    }
    x += v(1) - v(0);
  }
  return {
    text: set,
    strokes,
    width: x * k,
    height: EM * k,
    baseline: (BASELINE + EM / 2) * k,
    missing: [...missing],
  };
}

/**
 * When each stroke starts and ends, as fractions of the whole run, for a pen
 * at one speed that lifts for `letterPause` em of travel between letters and
 * `wordPause` em at a space. Exported for the tests.
 */
export function penTimes(
  strokes: readonly WriteStroke[],
  size: number,
  letterPause: number,
  wordPause: number,
): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let t = 0;
  strokes.forEach((s, i) => {
    const prev = strokes[i - 1];
    if (prev && s.word !== prev.word) t += wordPause;
    else if (prev && s.letter !== prev.letter) t += letterPause;
    const from = t;
    t += s.length / size;
    spans.push([from, t]);
  });
  return spans.map(([a, b]) => [t ? a / t : 0, t ? b / t : 1]);
}

// ── scrollWrite ───────────────────────────────────────────────────────────────

export interface ScrollWriteOptions extends WriteLayoutOptions {
  /** What to write. Default: the element's own text. */
  text?: string;
  /**
   * Pixels to the em. Default: 1.5 × the element's font size, which makes the
   * written capitals about as tall as the type they replace.
   */
  size?: number;
  /** Line width in px. Default: size / 28. */
  strokeWidth?: number;
  /** Ink colour. Default `currentColor`, so the text's own colour. */
  color?: string;
  /**
   * How long the pen lifts between letters, as the scroll it would take to
   * write this many em of line. Default 0.3.
   */
  letterPause?: number;
  /** How long it lifts at a space, in the same em. Default 2. */
  wordPause?: number;
  /**
   * The scroll window, on the written line. Default: from its top 85% down
   * the window to its top 35% down, where the last stroke lands.
   */
  trigger?: TriggerConfig;
  /** Stay written once written. Default false: scrolling back unwrites it. */
  once?: boolean;
  onComplete?: () => void;
  /** Write `--scroll-draw-progress` on the <svg> every frame. Default true. */
  progressVar?: boolean;
}

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

const SVG = 'http://www.w3.org/2000/svg';

/**
 * Replace `target`'s content with its text (or `options.text`) written in a
 * single-stroke font, and write it as the page scrolls: one stroke after
 * another at one pen speed, in writing order. The <svg> is hidden from screen
 * readers, which read a visually hidden copy of the text instead, as with
 * scrollText. `destroy()` puts the element's content back exactly.
 *
 * Under `prefers-reduced-motion: reduce` the text is written at once, as
 * scrollDraw draws at once; turned on mid-visit, it finishes then.
 * Without a DOM it does nothing.
 */
export function scrollWrite(target: string | Element, options: ScrollWriteOptions = {}): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    warn('scrollWrite: element not found:', target);
    return NOOP;
  }
  return finishWhenReduced(options, (opts, reduced) => buildWrite(el as HTMLElement, opts, reduced));
}

function buildWrite(el: HTMLElement, options: ScrollWriteOptions, reduced: boolean): ScrollDrawInstance {
  const {
    // The site's handwriting tool's 0.05 s and 0.35 s against 3 s of ink, for
    // 'Ada Lovelace' (16.7 em of line): 0.28 and 1.95 em.
    letterPause = 0.3,
    wordPause = 2,
    trigger = {},
    once = false,
    onComplete,
    progressVar,
  } = options;
  const originalHTML = el.innerHTML;
  const text = (options.text ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const size = options.size ?? (parseFloat(getComputedStyle(el).fontSize) * 1.5 || 48);
  const laid = writePaths(text, { font: options.font, size });
  if (laid.missing.length) warn('scrollWrite: no glyph for', laid.missing.join(' '));

  const svg = document.createElementNS(SVG, 'svg');
  const attrs: Record<string, string> = {
    viewBox: `0 0 ${num(laid.width)} ${num(laid.height)}`,
    width: num(laid.width),
    height: num(laid.height),
    fill: 'none',
    stroke: options.color ?? 'currentColor',
    'stroke-width': num(options.strokeWidth ?? size / 28),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    'data-scroll-write': '',
    // Ink may reach past the em box (a swash, the slant); a narrow parent
    // scales the line down rather than cutting it.
    style: 'overflow:visible;max-width:100%;height:auto',
  };
  for (const name in attrs) svg.setAttribute(name, attrs[name]);
  laid.strokes.forEach((s, i) => {
    const p = svg.appendChild(document.createElementNS(SVG, 'path'));
    p.setAttribute('d', s.d);
    p.setAttribute('data-stroke', String(i));
  });

  el.textContent = '';
  el.appendChild(svg);
  // For screen readers, which skip the aria-hidden <svg>. Visually hidden, not
  // selectable (scrollText's readable()).
  const sr = el.appendChild(document.createElement('span'));
  sr.textContent = text;
  sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;user-select:none';

  const restore = () => { el.innerHTML = originalHTML; };

  if (reduced) {
    onComplete?.();
    return { ...NOOP, destroy: restore, getProgress: () => 1 };
  }

  const spans = penTimes(laid.strokes, size, letterPause, wordPause);
  const paths = Array.from(svg.children) as SVGPathElement[];
  const startConfig = parseTrigger(trigger.start || 'top 85%');
  const endConfig = parseTrigger(trigger.end || 'top 35%');
  let lengths: number[] = [];
  /** The offset on screen per stroke, so a frame writes only the strokes that moved. */
  let shown: number[] = [];
  let tStart = 0;
  let tEnd = 0;
  let frozen = -1;
  let current = 0;
  let completed = false;

  function measure(): void {
    // Paths this entry made, with no pathLength: the browser's own length.
    lengths = paths.map((p) => p.getTotalLength());
    shown = [];
    // core/dash: the line, then a gap twice as long.
    paths.forEach((p, i) => { p.style.strokeDasharray = `${lengths[i]} ${lengths[i] * 2}`; });
    ({ tStart, tEnd } = computeTriggers(svg.getBoundingClientRect(), window.scrollY, window.innerHeight, startConfig, endConfig));
  }

  /** The pen at `alpha` of the run: strokes before it written, the one under it part way. */
  function apply(alpha: number): void {
    if (progressVar !== false) svg.style.setProperty('--scroll-draw-progress', String(alpha));
    paths.forEach((p, i) => {
      const [from, to] = spans[i];
      const off = lengths[i] * (1 - clamp(to > from ? (alpha - from) / (to - from) : +(alpha >= to)));
      if (shown[i] !== off) p.style.strokeDashoffset = String((shown[i] = off));
    });
  }

  const at = (): number => computeProgress(window.scrollY, tStart, tEnd, 1);

  function frame(): void {
    // With `once`, held at the furthest point.
    const alpha = once ? (frozen = Math.max(frozen, at())) : at();
    apply((current = alpha));
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) completed = false;
  }

  measure();
  apply(0);
  // The frames follow the trigger window (core/frame-gate): a jump past it
  // still writes the whole line and fires onComplete. A resize or a layout
  // change re-measures the strokes (the <svg> scales with its parent) and the window.
  const gate = frameGate(window, [svg], at, frame, () => {
    measure();
    apply(current);
  });
  _register(svg, { type: 'draw', getProgress: () => current, getTrigger: () => ({ tStart, tEnd }) });
  const resume = (): void => gate.hold(false);

  return {
    destroy() {
      gate.off();
      _unregister(svg);
      restore();
    },
    replay() {
      frozen = -1;
      completed = false;
      apply((current = 0));
      resume();
    },
    pause: () => gate.hold(true),
    resume,
    seek(p: number) {
      gate.hold(true);
      apply((current = frozen = clamp(p)));
    },
    getProgress: () => current,
  };
}
