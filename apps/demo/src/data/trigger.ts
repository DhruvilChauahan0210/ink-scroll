/**
 * The scroll trigger syntax, as svg-scroll-draw reads it.
 *
 * `parseTrigger`, `edgeOffset`, `lineOffset`, `triggerAt` and `progressAt`
 * mirror packages/svg-scroll-draw/src/core/trigger.ts step for step. That file
 * is internal (no public entry exports it), so the visualizer and the
 * reference tables work the same arithmetic here; keep the two in step.
 *
 * `readTrigger` adds what the library does not say out loud: which word fell
 * back to a default, and why.
 */

export type Edge = 'top' | 'center' | 'bottom';

/** The element words the parser knows (core/trigger.ts elementAnchorY). */
export const EDGES: readonly Edge[] = ['top', 'center', 'bottom'];
/** The viewport keywords it knows; any `N%` works as well (core/trigger.ts viewportAnchorY). */
export const LINES: readonly Edge[] = ['top', 'center', 'bottom'];

const PCT = /^\d+(\.\d+)?%$/;

/** core/trigger.ts parseTrigger: a lone percentage is the viewport line; missing words default to top, bottom. */
export function parseTrigger(str = 'top bottom'): { element: string; viewport: string } {
  const trimmed = str.trim();
  if (PCT.test(trimmed)) return { element: 'top', viewport: trimmed };
  const [element = 'top', viewport = 'bottom'] = trimmed.split(/\s+/).filter(Boolean);
  return { element, viewport };
}

/** How far down the element its edge is (elementAnchorY without the element's own position). */
export function edgeOffset(edge: string, height: number): number {
  if (edge === 'center') return height / 2;
  if (edge === 'bottom') return height;
  return 0;
}

/** How far down the viewport its line is (viewportAnchorY): unknown words are the bottom. */
export function lineOffset(line: string, vp: number): number {
  if (PCT.test(line)) return vp * (parseFloat(line) / 100);
  if (line === 'top') return 0;
  if (line === 'center') return vp / 2;
  return vp;
}

/** computeTriggers for one pair: the scroll position where the edge sits on the line. */
export function triggerAt(trigger: string, top: number, height: number, vp: number): number {
  const { element, viewport } = parseTrigger(trigger);
  return top + edgeOffset(element, height) - lineOffset(viewport, vp);
}

/** computeProgress: how far the scroll is from start to end, clamped to 0–1, times speed. */
export function progressAt(scroll: number, tStart: number, tEnd: number, speed = 1): number {
  if (tEnd === tStart) return 0;
  return Math.min(1, Math.max(0, ((scroll - tStart) / (tEnd - tStart)) * speed));
}

export type Reading = {
  /** The edge the library uses. */
  edge: Edge;
  /** The line as the library uses it: a keyword or `N%`. */
  line: string;
  /** The line as a fraction of the viewport, from its top. */
  at: number;
  /** The same trigger written the way the library reads it, e.g. `'top 85%'`. */
  canonical: string;
  /** What fell back to a default, in words. Empty when everything was read as written. */
  notes: string[];
};

const KNOWN = new Set<string>(EDGES);

/** What the parser makes of a trigger string, word by word. */
export function readTrigger(str: string): Reading {
  const { element, viewport } = parseTrigger(str);
  const words = str.trim().split(/\s+/).filter(Boolean);
  const notes: string[] = [];
  const edge: Edge = KNOWN.has(element) ? (element as Edge) : 'top';
  const known = KNOWN.has(viewport) || PCT.test(viewport);
  const line = known ? viewport : 'bottom';

  if (!words.length) {
    notes.push('Empty, so both words take their defaults: top, bottom.');
    // The engines read `trigger.start || default`: an empty string is unset,
    // a string of spaces is not (2.23.3; 2.23.2 used `??`).
    if (str === '') {
      notes.push(
        'As a trigger’s start or end, though, an empty string counts as unset and the function’s own default applies; 2.23.2 and earlier read it as top bottom, fixed in 2.23.3.',
      );
    }
  }
  else if (PCT.test(str.trim())) notes.push('A percentage on its own is the viewport line; the element edge is top.');
  else {
    if (!KNOWN.has(element)) {
      notes.push(
        PCT.test(element)
          ? `The element word cannot be a percentage: “${element}” reads as top.`
          : `“${element}” is not top, center or bottom, so the element edge reads as top.`,
      );
    }
    if (words.length === 1) notes.push('One word: the viewport line defaults to bottom.');
    else if (!known) notes.push(`“${viewport}” is not top, center, bottom or a percentage, so the line reads as bottom.`);
    if (words.length > 2) notes.push(`Only two words are read; “${words.slice(2).join(' ')}” is ignored.`);
  }
  if (PCT.test(line) && parseFloat(line) > 100) notes.push('Over 100%, the line is below the bottom of the viewport.');

  return { edge, line, at: lineOffset(line, 1), canonical: `${edge} ${line}`, notes };
}

// ── In words ─────────────────────────────────────────────────────────────────

const EDGE_WORD: Record<Edge, string> = { top: 'top', center: 'middle', bottom: 'bottom' };

export function lineWords(line: string): string {
  if (PCT.test(line)) return `${line} down the viewport`;
  if (line === 'top') return 'the top of the viewport';
  if (line === 'center') return 'the middle of the viewport';
  return 'the bottom of the viewport';
}

/** “its top reaches 85% down the viewport” */
export function pairWords(r: Reading): string {
  return `its ${EDGE_WORD[r.edge]} reaches ${lineWords(r.line)}`;
}

// ── Each function's default window ───────────────────────────────────────────

export type TriggerDefault = { fn: string; entry: string; start: string; end: string };

/**
 * The window each function uses when no `trigger` is given, read from the
 * library: core/engine.ts, animate/engine.ts, progress/index.ts,
 * react/useScrollDrawProgress.ts, text/index.ts, reveal/index.ts,
 * counter/index.ts, video/index.ts and frames/index.ts.
 */
export const TRIGGER_DEFAULTS: TriggerDefault[] = [
  { fn: 'scrollDraw', entry: 'svg-scroll-draw', start: 'top bottom', end: 'bottom top' },
  { fn: 'scrollAnimate', entry: 'svg-scroll-draw', start: 'top bottom', end: 'bottom top' },
  { fn: 'scrollProgress', entry: 'svg-scroll-draw/progress', start: 'top bottom', end: 'bottom top' },
  { fn: 'useScrollDrawProgress', entry: 'svg-scroll-draw/react', start: 'top bottom', end: 'bottom top' },
  { fn: 'scrollText', entry: 'svg-scroll-draw/text', start: 'top 85%', end: 'top 40%' },
  { fn: 'scrollReveal', entry: 'svg-scroll-draw/reveal', start: 'top 88%', end: 'top 53%' },
  { fn: 'scrollCounter', entry: 'svg-scroll-draw', start: 'top 80%', end: 'top 20%' },
  { fn: 'scrollVideo', entry: 'svg-scroll-draw/video', start: 'top top', end: 'bottom top' },
  { fn: 'scrollFrames', entry: 'svg-scroll-draw/frames', start: 'top top', end: 'bottom top' },
];

export function defaultsOf(fn: string): TriggerDefault {
  return TRIGGER_DEFAULTS.find((d) => d.fn === fn) ?? TRIGGER_DEFAULTS[0];
}

/**
 * Strings the reference table runs through readTrigger, so its “read as”
 * column is the parser's own answer rather than a typed one.
 */
export const SYNTAX_SAMPLES: { written: string; what: string }[] = [
  { written: 'top 85%', what: 'An element edge, then a line across the viewport.' },
  { written: 'center center', what: 'The element’s middle on the viewport’s middle.' },
  { written: 'bottom top', what: 'The element’s bottom on the viewport’s top: it has just left.' },
  { written: '85.5%', what: 'Decimals are fine.' },
  { written: '85%', what: '' },
  { written: 'center', what: '' },
  { written: '', what: '' },
  { written: 'top 100px', what: 'Pixels are not read.' },
  { written: 'top bottom-=100px', what: 'Relative offsets are not read.' },
  { written: 'top+=100 center', what: '' },
  { written: '50% center', what: '' },
  { written: 'Top Center', what: 'Words are case-sensitive.' },
  { written: '120%', what: '' },
];
