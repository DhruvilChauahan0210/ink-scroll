import { HERSHEY, type HersheyFont } from './hershey-data';

/**
 * Text set in a Hershey single-stroke font, as the pen draws it.
 *
 * Every glyph is a list of strokes: the pen's centre line, put down and lifted
 * once each, in the order the font draws them. Laying out a line is placing
 * glyphs edge to edge, left to right, so the strokes come out in writing
 * order: letter by letter, and within a letter as Dr. Hershey drew it. In the
 * script font a letter's last stroke ends where the next one's starts, so the
 * line joins up.
 *
 * Pure: no DOM. The page uses it on the server for its figure, the generator
 * in the browser.
 */

export const FONTS = [
  ['script', 'Script'],
  ['roman', 'Roman'],
  ['italic', 'Roman italic'],
] as const;
export type FontKey = (typeof FONTS)[number][0];

/** The data each choice reads, and its slant (x moved right per unit up). */
const FACE: Record<FontKey, { data: HersheyFont; slant: number }> = {
  script: { data: 'script', slant: 0 },
  roman: { data: 'roman', slant: 0 },
  italic: { data: 'roman', slant: 0.21 },
};

/** Hershey's em: 32 units, y from −16 to 16. A size of 64 px makes a unit 2 px. */
export const EM = 32;
/** The baseline's y in font units: letters sit on it, slants pivot on it. */
const BASELINE = 9;
/** Longest text the tool lays out. */
export const MAX_CHARS = 48;

export type Point = readonly [number, number];

export type Stroke = {
  /** The pen's points, in px, from where it goes down to where it lifts. */
  pts: Point[];
  /** Its length in px. */
  len: number;
  /** Which letter it belongs to (spaces do not count), from 0. */
  letter: number;
  /** Which word, from 0. */
  word: number;
};

export type Laid = {
  /** The text as set: what could not be set is left out. */
  text: string;
  strokes: Stroke[];
  /** Letters drawn (no spaces). */
  letters: number;
  words: number;
  /** The ink's box, in px. */
  box: { x: number; y: number; w: number; h: number };
  /** Characters the fonts have no glyph for, left out. */
  missing: string[];
};

/** Typographic characters a reader is likely to type, as the ASCII the fonts have. */
const ASCII_FOR: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '′': "'",
  '“': '"', '”': '"', '„': '"', '″': '"',
  '–': '-', '—': '-', '−': '-', '‐': '-',
  '…': '...', ' ': ' ', '\t': ' ', '\n': ' ',
};

/**
 * The text in the fonts' 95 characters: accents dropped (é → e), curly quotes
 * and dashes straightened, anything else left out and listed.
 */
export function toAscii(input: string): { text: string; missing: string[] } {
  const missing = new Set<string>();
  let text = '';
  for (const ch of input.normalize('NFD').replace(/[̀-ͯ]/g, '')) {
    const mapped = ASCII_FOR[ch] ?? ch;
    for (const c of mapped) {
      const code = c.charCodeAt(0);
      if (code >= 32 && code <= 126) text += c;
      else missing.add(c);
    }
  }
  return { text: text.slice(0, MAX_CHARS), missing: [...missing] };
}

/** One glyph's edges and strokes, in font units. */
export function glyph(font: HersheyFont, ch: string): { left: number; right: number; strokes: Point[][] } {
  const g = HERSHEY[font][ch.charCodeAt(0) - 32] ?? HERSHEY[font][0];
  const v = (i: number) => g.charCodeAt(i) - 82;
  const strokes = g
    .slice(2)
    .split(' R')
    .filter(Boolean)
    .map((s) => {
      const pts: Point[] = [];
      for (let i = 0; i < s.length; i += 2) pts.push([s.charCodeAt(i) - 82, s.charCodeAt(i + 1) - 82]);
      return pts;
    });
  return { left: v(0), right: v(1), strokes };
}

const lengthOf = (pts: readonly Point[]) => {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
};

/** `input` set in `font` at `size` px to the em, strokes in writing order. */
export function layout(input: string, font: FontKey, size: number): Laid {
  const { text, missing } = toAscii(input);
  const face = FACE[font];
  const k = size / EM;
  const strokes: Stroke[] = [];
  let x = 0;
  let letter = -1;
  let word = 0;
  let inWord = false;
  for (const ch of text) {
    const g = glyph(face.data, ch);
    if (ch === ' ') {
      if (inWord) word += 1;
      inWord = false;
    } else {
      inWord = true;
      if (g.strokes.length) letter += 1;
    }
    const ox = x - g.left;
    for (const s of g.strokes) {
      const pts = s.map(([gx, gy]): Point => [(ox + gx + (BASELINE - gy) * face.slant) * k, gy * k]);
      strokes.push({ pts, len: lengthOf(pts), letter, word });
    }
    x += g.right - g.left;
  }
  // A trailing space counted a word that never came.
  const words = strokes.length ? strokes[strokes.length - 1].word + 1 : 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of strokes) {
    for (const [px, py] of s.pts) {
      x0 = Math.min(x0, px);
      y0 = Math.min(y0, py);
      x1 = Math.max(x1, px);
      y1 = Math.max(y1, py);
    }
  }
  const box = strokes.length ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
  return { text, strokes, letters: letter + 1, words, box, missing };
}
