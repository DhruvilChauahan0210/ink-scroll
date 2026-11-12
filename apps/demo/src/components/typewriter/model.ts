import { TEXT_DEFAULTS } from '@/data/text-effects';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * Everything the typewriter effect generator writes, from one settings object:
 * the CSS, the markup, the JavaScript, the React component, the preview's own
 * copy of the CSS and the runnable HTML file. Pure functions, so the preview,
 * the code tabs and the download cannot disagree.
 *
 * Three ways to type:
 *
 * - css: the line's width runs from 0 to N ch in steps(N), in a monospace
 *   font, so each step uncovers one whole letter; border-right is the caret.
 * - scroll: scrollText (svg-scroll-draw/text, text/index.ts) splits the line
 *   into letters (split 'chars'), gives each 1 ÷ letters of the scroll
 *   (stagger) and shows it whole as its share begins (a step easing, from
 *   opacity 0). followCaret() moves the caret after the last letter shown.
 * - typer: TYPER_FN, a small setTimeout loop that types, holds, deletes and
 *   types the next phrase. typerAt() is the same schedule as a pure function of
 *   time, which the preview and the figures draw from.
 */

export const SLUG = 'typewriter-effect-generator';
export const TITLE = 'Typewriter effect';

export type Mode = 'css' | 'scroll' | 'typer';
export type Caret = 'bar' | 'block' | 'underscore' | 'none';
export type Start = 'load' | 'scroll';
export type Reach = 'short' | 'default' | 'long';
export type Appear = 'snap' | 'fade';
export type CodeTab = 'css' | 'html' | 'js' | 'react';

export type Settings = {
  mode: Mode;
  /** One phrase per line. CSS and scrollText type the first; the typer types each in turn. */
  text: string;
  /** css and typer: milliseconds per letter typed. */
  speed: number;
  /** css and typer: milliseconds per letter deleted. */
  erase: number;
  /** css and typer: milliseconds a whole phrase stays before it is deleted. */
  hold: number;
  /** css and typer: delete and type again, for ever; off types once and stops. */
  loop: boolean;
  caret: Caret;
  blink: boolean;
  /** css and typer: start at once, or when the text scrolls into view. */
  start: Start;
  /** scroll: how much scroll the typing takes (the trigger's end line). */
  reach: Reach;
  /** scroll: each letter appears whole, or fades in over its share. */
  appear: Appear;
  /** scroll: scrollText's once, keep the letters typed when scrolling back up. */
  once: boolean;
};

export const MODES: { key: Mode; label: string; what: string }[] = [
  {
    key: 'css',
    label: 'CSS only',
    what: 'No JavaScript: the line’s width grows one letter at a time with steps(), in a monospace font, and a border is the caret. One line, of a length the CSS is cut to.',
  },
  {
    key: 'scroll',
    label: 'On scroll · scrollText',
    what: 'The letters appear one by one as the reader scrolls: scrollText splits the text into letters and gives each its own share of the scroll. Any font, any number of lines.',
  },
  {
    key: 'typer',
    label: 'JS typer',
    what: 'A small script types each phrase on a clock, holds it, deletes it and types the next. For rotating words in a hero, and anything that has to change its text.',
  },
];

export const CARETS: { key: Caret; label: string }[] = [
  { key: 'bar', label: 'bar' },
  { key: 'block', label: 'block' },
  { key: 'underscore', label: 'underscore' },
  { key: 'none', label: 'none' },
];

/** scrollText's own start line; the reach moves the end line. */
export const SCROLL_START = TEXT_DEFAULTS.start;
export const REACHES: { key: Reach; label: string; end: string }[] = [
  { key: 'short', label: 'short', end: 'top 60%' },
  { key: 'default', label: 'default', end: TEXT_DEFAULTS.end },
  { key: 'long', label: 'long', end: 'top 15%' },
];
export const endOf = (r: Reach) => (REACHES.find((x) => x.key === r) ?? REACHES[1]).end;

/** The typer's defaults, as TYPER_FN declares them: the generated call leaves these out. */
export const TYPER_DEFAULTS = { speed: 80, eraseSpeed: 40, hold: 1500, pause: 400, loop: true, onScroll: false };
/** The blank before each phrase, in the typer and in the CSS loop. Not a setting: TYPER_FN's default. */
export const PAUSE = TYPER_DEFAULTS.pause;

export const INITIAL: Settings = {
  mode: 'css',
  text: 'Hello, I am a typewriter.\nI type one letter at a time.\nThen I delete it and try again.',
  speed: TYPER_DEFAULTS.speed,
  erase: TYPER_DEFAULTS.eraseSpeed,
  hold: TYPER_DEFAULTS.hold,
  loop: TYPER_DEFAULTS.loop,
  caret: 'bar',
  blink: true,
  start: 'load',
  reach: 'default',
  appear: 'snap',
  once: TEXT_DEFAULTS.once,
};

export const LIMITS = { speed: [20, 300], erase: [10, 200], hold: [0, 4000] } as const;
export const MAX_PHRASES = 6;
export const MAX_LEN = 60;

// ── Text ─────────────────────────────────────────────────────────────────────

/** The phrases, one per line: whitespace runs made one space, empty lines dropped, at most MAX_PHRASES of MAX_LEN. */
export function phrasesOf(text: string): string[] {
  const out = text
    .split('\n')
    .map((l) => Array.from(l.replace(/\s+/g, ' ').trim()).slice(0, MAX_LEN).join('').trim())
    .filter(Boolean)
    .slice(0, MAX_PHRASES);
  return out.length ? out : ['Your text'];
}

export const firstLine = (s: Settings) => phrasesOf(s.text)[0];

/** Characters as a reader counts them (code points): what the CSS needs room for and the typer types. */
export const charCount = (t: string) => Array.from(t).length;

/** scrollText's pieces for split 'chars': every UTF-16 unit but a space (text/index.ts splitIntoChars). */
export const scrollLetters = (t: string) => t.split('').filter((c) => c !== ' ').length;

/** Characters outside the BMP (emoji, most symbols added since 2010): scrollText splits each into two halves. */
export const hasAstral = (t: string) => /[\uD800-\uDBFF]/.test(t);

/** Characters about 2ch wide in a monospace font: CJK, Hangul, full-width forms, emoji. */
export const hasWide = (t: string) =>
  /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦\uD800-\uDBFF]/.test(t);

/**
 * Every phrase as one text, for screen readers and for readers who ask for
 * less motion: a comma between phrases, or just a space after one that ends
 * in punctuation.
 */
export function fullText(phrases: string[]): string {
  return phrases.reduce((all, p, i) => (i === 0 ? p : `${all}${/[.!?…,;:]$/.test(all) ? ' ' : ', '}${p}`), '');
}

// ── Timing ───────────────────────────────────────────────────────────────────

export const fmtS = (ms: number) => `${+(ms / 1000).toFixed(3)}s`;
const pct = (n: number) => `${+n.toFixed(2)}%`;

/** The CSS version's numbers: letters, typing time, and the whole cycle on a loop. */
export function cssTimes(s: Settings) {
  const n = charCount(firstLine(s));
  const type = n * s.speed;
  const erase = n * s.erase;
  const total = s.loop ? type + s.hold + erase + PAUSE : type;
  return { n, type, erase, total };
}

/** How many letters the CSS shows at time t: steps(n) jumps at the end of each step. */
export function cssLettersAt(s: Settings, t: number): number {
  const { n, type, total } = cssTimes(s);
  if (!s.loop) return t >= type ? n : Math.floor(t / s.speed);
  const u = ((t % total) + total) % total;
  if (u < type) return Math.floor(u / s.speed);
  if (u < type + s.hold) return n;
  const e = u - type - s.hold;
  if (e < n * s.erase) return n - Math.floor(e / s.erase);
  return 0;
}

export type TyperOptions = { speed: number; eraseSpeed: number; hold: number; pause: number; loop: boolean };
export const typerOptions = (s: Settings): TyperOptions => ({
  speed: s.speed, eraseSpeed: s.erase, hold: s.hold, pause: PAUSE, loop: s.loop,
});

/** One phrase's share of the clock: blank, typing, holding, deleting. */
function phraseSpan(letters: number, o: TyperOptions): number {
  return o.pause + (letters - 1) * o.speed + o.hold + (letters - 1) * o.eraseSpeed;
}

/** The length of one round of every phrase on a loop; without the loop, the time the last phrase is done. */
export function typerLength(phrases: string[], o: TyperOptions): number {
  const lens = phrases.map(charCount);
  if (o.loop) return lens.reduce((a, l) => a + phraseSpan(l, o), 0);
  const last = lens.length - 1;
  return lens.slice(0, last).reduce((a, l) => a + phraseSpan(l, o), 0) + o.pause + (lens[last] - 1) * o.speed;
}

export type TyperFrame = { text: string; busy: boolean; done: boolean; phrase: number };

/**
 * What TYPER_FN shows t ms after it starts. Each phrase of L letters: blank
 * for `pause`, letter k at pause + (k − 1) × speed, whole for `hold`, then one
 * letter fewer every `eraseSpeed`, the last gone (L − 1) × eraseSpeed after
 * the first, and the next phrase's blank begins. `busy` is TYPER_FN's
 * is-typing class: letters still coming or going.
 */
export function typerAt(phrases: string[], o: TyperOptions, t: number): TyperFrame {
  const words = phrases.map((p) => Array.from(p));
  const last = words.length - 1;
  const total = typerLength(phrases, { ...o, loop: true });
  if (!o.loop && t >= typerLength(phrases, o)) return { text: phrases[last], busy: false, done: true, phrase: last };
  let u = o.loop ? ((t % total) + total) % total : Math.max(0, t);
  for (let i = 0; i <= last; i++) {
    const w = words[i];
    const L = w.length;
    const span = phraseSpan(L, o);
    if (u >= span && i < last) {
      u -= span;
      continue;
    }
    if (u < o.pause) return { text: '', busy: false, done: false, phrase: i };
    u -= o.pause;
    const typing = (L - 1) * o.speed;
    if (u < typing) return { text: w.slice(0, Math.floor(u / o.speed) + 1).join(''), busy: true, done: false, phrase: i };
    u -= typing;
    if (u < o.hold) return { text: w.join(''), busy: false, done: false, phrase: i };
    u -= o.hold;
    const left = Math.max(0, L - (Math.floor(u / o.eraseSpeed) + 1));
    return { text: w.slice(0, left).join(''), busy: left > 0, done: false, phrase: i };
  }
  return { text: '', busy: false, done: false, phrase: 0 };
}

// ── Scroll ───────────────────────────────────────────────────────────────────

/** stagger = 1 ÷ letters: each letter starts its share as the one before ends (unitAlpha in text/index.ts). */
export const scrollStagger = (letters: number) => (letters > 0 ? 1 / letters : 0);

/** The step easing: a letter is hidden until its share of the scroll begins, then whole. */
export const snapEasing = (t: number) => (t > 0 ? 1 : 0);

/** Letters shown at progress p: with stagger 1/n each letter i shows once p passes i/n. */
export function scrollShownAt(letters: number, p: number): number {
  return p <= 0 ? 0 : Math.min(letters, Math.ceil(p * letters - 1e-9));
}

const pctOf = (line: string) => parseFloat(line.split(' ')[1] ?? '0');
/** The share of the window's height the reader scrolls while it types: from 85% to the end line. */
export const scrollSpan = (s: Settings) => pctOf(SCROLL_START) - pctOf(endOf(s.reach));

// ── CSS ──────────────────────────────────────────────────────────────────────

type Names = { typing: string; caret: string };
const NAMES: Names = { typing: 'typing', caret: 'caret' };

type CaretBox = { width: string; height: string; align: string };
const CARET_BOX: Record<Caret, CaretBox> = {
  bar: { width: '0.08em', height: '1em', align: '-0.12em' },
  block: { width: '0.6em', height: '1em', align: '-0.12em' },
  underscore: { width: '0.6em', height: '0.08em', align: '-0.16em' },
  none: { width: '0', height: '1em', align: '-0.12em' },
};

/**
 * The caret as an empty inline-block after the text: as wide as it is drawn,
 * with a negative margin of the same, so it takes no room and nothing moves
 * when it does. With no caret it stays, empty, to keep the line's height.
 */
function caretRule(s: Settings, selectors: string[], names: Names): string[] {
  const b = CARET_BOX[s.caret];
  const drawn = s.caret !== 'none';
  return [
    `${selectors.join(',\n')} {`,
    "  content: '';",
    '  display: inline-block;',
    ...(drawn ? [`  width: ${b.width};`] : []),
    `  height: ${b.height};`,
    ...(drawn ? [`  margin-right: -${b.width};`] : []),
    `  vertical-align: ${b.align};`,
    ...(drawn ? ['  background: currentColor;'] : []),
    ...(drawn && s.blink ? [`  animation: ${names.caret} 1s step-end infinite;`] : []),
    '}',
  ];
}

const blinkKeyframes = (names: Names) => [`@keyframes ${names.caret} {`, '  50% { opacity: 0; }', '}'];

/** The CSS version's caret: a border, outside the box overflow: hidden clips, so it is never cut. */
function cssCaretLines(c: Caret): string[] {
  if (c === 'bar') return ['border-right: 0.08em solid;'];
  if (c === 'block') return ['border-right: 1ch solid;'];
  if (c === 'underscore') {
    return [
      'border-right: 1ch solid transparent;',
      'background: linear-gradient(currentColor 0 0) 100% 88% / 1ch 0.08em no-repeat border-box;',
    ];
  }
  return [];
}

type CssOpts = { scope?: string; unit?: string; names?: Names; reduced?: boolean };

/** The CSS-only typewriter, for one line. */
function cssOnly(s: Settings, { scope = '', unit = 'vw', names = NAMES, reduced = true }: CssOpts = {}): string {
  const sel = `${scope}.typewriter`;
  const line = firstLine(s);
  const { n, type, erase, total } = cssTimes(s);
  const caret = cssCaretLines(s.caret);
  const blinks = s.caret !== 'none' && s.blink;
  const typing = `${names.typing} ${fmtS(total)} steps(${n}) ${s.loop ? 'infinite' : 'both'}`;
  // Off the loop, the caret holds still while it types and blinks once it has.
  const blink = `${names.caret} 1s step-end${!s.loop && type > 0 ? ` ${fmtS(type)}` : ''} infinite`;
  const fit = +(150 / n).toFixed(2);
  const out = [
    `/* One line in a monospace font, where every letter is 1ch wide: the ${n}`,
    `   letters of “${line.replace(/\*\//g, '* /')}” are ${n}ch, and steps(${n}) uncovers one at a time. */`,
    `${sel} {`,
    '  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;',
    `  /* Up to 2rem, and small enough for all ${n} letters to fit 90% of the screen`,
    '     (a monospace letter is about 0.6em wide). */',
    `  font-size: min(2rem, ${fit}${unit});`,
    '  line-height: 1.2;',
    '  letter-spacing: 0;',
    `  width: ${n}ch;`,
    '  box-sizing: content-box;',
    '  overflow: hidden;',
    '  white-space: nowrap;',
    ...caret.map((l) => `  ${l}`),
    blinks ? `  animation:\n    ${typing},\n    ${blink};` : `  animation: ${typing};`,
    '}',
    '',
  ];
  if (s.loop) {
    const a = (type / total) * 100;
    const b = ((type + s.hold) / total) * 100;
    const c = ((type + s.hold + erase) / total) * 100;
    out.push(
      `/* ${fmtS(type)} typing, ${fmtS(s.hold)} held, ${fmtS(erase)} deleting, ${fmtS(PAUSE)} blank: ${fmtS(total)} in all. */`,
      `@keyframes ${names.typing} {`,
      '  0% { width: 0; }',
      pct(a) === pct(b) ? `  ${pct(a)} { width: ${n}ch; }` : `  ${pct(a)}, ${pct(b)} { width: ${n}ch; }`,
      `  ${pct(c)}, 100% { width: 0; }`,
      '}',
    );
  } else {
    out.push(`@keyframes ${names.typing} {`, '  from { width: 0; }', '}');
  }
  if (blinks) {
    out.push(
      '',
      `@keyframes ${names.caret} {`,
      s.caret === 'underscore' ? '  50% { background-size: 0 0; }' : '  50% { border-right-color: transparent; }',
      '}',
    );
  }
  if (reduced) {
    out.push('', '/* Less motion asked for: the whole line, still. */', '@media (prefers-reduced-motion: reduce) {', `  ${sel} {`, '    animation: none;', '  }', '}');
  }
  return out.join('\n');
}

function cssScroll(s: Settings, { scope = '', names = NAMES, reduced = true }: CssOpts = {}): string {
  const el = `${scope}.typed`;
  const carets = [`${el} > .is-caret::after`, `${el}.is-caret::before`];
  const out = [
    '/* scrollText makes each letter an inline-block, and a line can break between',
    '   any two of those, inside a word. These letters only change opacity, so',
    '   plain inline is enough, keeps every word whole, and lets the spaces wrap. */',
    `${el} > span[aria-hidden] {`,
    '  display: inline !important;',
    '  white-space: inherit !important;',
    '}',
  ];
  if (s.caret !== 'none') {
    out.push(
      '',
      '/* The caret: after the last letter shown, or before the first while none is.',
      '   followCaret (main.js) moves .is-caret as scrollText shows the letters. */',
      ...caretRule(s, carets, names),
    );
    if (s.blink) {
      out.push('', ...blinkKeyframes(names));
      if (reduced) out.push('', '@media (prefers-reduced-motion: reduce) {', `  ${carets.join(',\n  ')} {`, '    animation: none;', '  }', '}');
    }
  }
  return out.join('\n');
}

function cssTyper(s: Settings, { scope = '', names = NAMES, reduced = true }: CssOpts = {}): string {
  const copy = `${scope}.typer-copy`;
  const after = `${scope}.typer-text::after`;
  const blinks = s.caret !== 'none' && s.blink;
  const out = [
    '/* The whole text for screen readers, read once: the typed letters are',
    '   aria-hidden, so the letters coming and going are never read out. */',
    `${copy} {`,
    '  position: absolute;',
    '  width: 1px;',
    '  height: 1px;',
    '  overflow: hidden;',
    '  clip-path: inset(50%);',
    '  white-space: nowrap;',
    '  user-select: none;',
    '}',
    '',
    s.caret === 'none'
      ? '/* No caret: an empty box keeps the line’s height while no letter is there. */'
      : '/* The caret, after the typed letters. */',
    ...caretRule(s, [after], names),
  ];
  if (blinks) {
    out.push(
      '',
      '/* Solid while letters come and go, as a real caret is; it blinks in the pauses. */',
      `${scope}.typer.is-typing .typer-text::after {`,
      '  animation: none;',
      '}',
      '',
      ...blinkKeyframes(names),
    );
    if (reduced) out.push('', '@media (prefers-reduced-motion: reduce) {', `  ${after} {`, '    animation: none;', '  }', '}');
  }
  return out.join('\n');
}

/** The CSS for the visitor's page. */
export function typeCss(s: Settings): string {
  if (s.mode === 'css') return cssOnly(s);
  if (s.mode === 'scroll') return cssScroll(s);
  return cssTyper(s);
}

/**
 * The same rules for the preview: scoped to its stage, keyframes renamed, the
 * viewport unit swapped for the stage's own width (it is a size container),
 * and no reduced-motion block: the preview holds still by itself.
 */
export function previewCss(s: Settings, scope: string): string {
  const names = { typing: 'typ-typing', caret: 'typ-caret' };
  const o = { scope: `${scope} `, unit: 'cqi', names, reduced: false };
  if (s.mode === 'css') return cssOnly(s, o);
  if (s.mode === 'scroll') return cssScroll(s, o);
  return cssTyper(s, o);
}

// ── Markup ───────────────────────────────────────────────────────────────────

export function markup(s: Settings): string {
  const phrases = phrasesOf(s.text);
  if (s.mode === 'css') return `<p class="typewriter">${escapeHtml(phrases[0])}</p>`;
  // No space around the text: scrollText would make a piece of a line break.
  if (s.mode === 'scroll') return `<p class="typed">${escapeHtml(phrases[0])}</p>`;
  return [
    '<p class="typer">',
    `  <span class="typer-copy">${escapeHtml(fullText(phrases))}</span>`,
    `  <span class="typer-text" aria-hidden="true">${escapeHtml(phrases[0])}</span>`,
    '</p>',
  ].join('\n');
}

// ── JavaScript ───────────────────────────────────────────────────────────────

/** A JavaScript string literal, safe inside an inline <script> as well. */
const str = (t: string) => JSON.stringify(t).replace(/</g, '\\u003c');

/** The typer, written by hand: no library. Declares TYPER_DEFAULTS. */
export const TYPER_FN = `/**
 * Types each phrase, holds it, deletes it and types the next. The typed
 * letters are aria-hidden: screen readers read .typer-copy, once, in full.
 * Returns a function that stops it.
 */
function typewriter(el, phrases, {
  speed = ${TYPER_DEFAULTS.speed},        // ms per letter typed
  eraseSpeed = ${TYPER_DEFAULTS.eraseSpeed},   // ms per letter deleted
  hold = ${TYPER_DEFAULTS.hold},       // ms a whole phrase stays
  pause = ${TYPER_DEFAULTS.pause},       // ms of blank before each phrase
  loop = ${TYPER_DEFAULTS.loop},       // false: stop on the last phrase
  onScroll = ${TYPER_DEFAULTS.onScroll},  // true: wait until it is in view
} = {}) {
  const out = el.querySelector('.typer-text');
  // Less motion asked for: every phrase, still.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    out.textContent = el.querySelector('.typer-copy').textContent;
    return () => {};
  }
  // Array.from counts characters, so an emoji is never cut in half.
  const words = phrases.map((p) => Array.from(p));
  let i = 0, n = 0, back = false, timer = 0;
  const step = () => {
    const word = words[i];
    n += back ? -1 : 1;
    out.textContent = word.slice(0, n).join('');
    const full = !back && n === word.length;
    const empty = back && n === 0;
    if (full && !loop && i === words.length - 1) return el.classList.remove('is-typing');
    let wait = back ? eraseSpeed : speed;
    if (full) { back = true; wait = hold; }
    if (empty) { back = false; i = (i + 1) % words.length; wait = pause; }
    // The caret holds still while letters come and go, and blinks in the pauses.
    el.classList.toggle('is-typing', !full && !empty);
    timer = setTimeout(step, wait);
  };
  const begin = () => { timer = setTimeout(step, pause); };
  out.textContent = '';
  if (!onScroll) {
    begin();
    return () => clearTimeout(timer);
  }
  // Start when its top is 85% of the way down the window.
  const seen = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { seen.disconnect(); begin(); }
  }, { rootMargin: '0px 0px -15% 0px' });
  seen.observe(el);
  return () => { seen.disconnect(); clearTimeout(timer); };
}`;

/** The caret for scrollText, written by hand: the preview runs followCaret() below, the same steps. */
export const FOLLOW_CARET_FN = `/** Keeps .is-caret on the last letter shown, or on the element while none is. */
function followCaret(el) {
  const place = () => {
    let last = null;
    for (const child of el.children) if (Number(child.style.opacity) > 0) last = child;
    for (const old of el.querySelectorAll('.is-caret')) old.classList.remove('is-caret');
    el.classList.toggle('is-caret', !last);
    last?.classList.add('is-caret');
  };
  // Each time scrollText changes a letter's opacity.
  const watch = new MutationObserver(place);
  watch.observe(el, { attributes: true, attributeFilter: ['style'], subtree: true });
  place();
  return () => watch.disconnect();
}`;

/** FOLLOW_CARET_FN, for the preview. */
export function followCaret(el: HTMLElement): () => void {
  const place = () => {
    let last: HTMLElement | null = null;
    for (const child of Array.from(el.children) as HTMLElement[]) if (Number(child.style.opacity) > 0) last = child;
    for (const old of Array.from(el.querySelectorAll('.is-caret'))) old.classList.remove('is-caret');
    el.classList.toggle('is-caret', !last);
    last?.classList.add('is-caret');
  };
  const watch = new MutationObserver(place);
  watch.observe(el, { attributes: true, attributeFilter: ['style'], subtree: true });
  place();
  return () => watch.disconnect();
}

/** scrollText's options, only those away from its defaults, as `key: value` lines (with a comment where one helps). */
function scrollOptionLines(s: Settings, stagger: string): string[] {
  const out = ["split: 'chars'", `stagger: ${stagger}`];
  if (s.appear === 'snap') out.push('easing: (t) => (t > 0 ? 1 : 0) // each letter whole, as its share begins');
  // Always written: the default from is { opacity: 0, y: 24 }, which also moves each letter.
  out.push('from: { opacity: 0 }');
  const end = endOf(s.reach);
  if (end !== TEXT_DEFAULTS.end) out.push(`trigger: { end: '${end}' }`);
  if (s.once !== TEXT_DEFAULTS.once) out.push(`once: ${s.once}`);
  return out;
}

const withComma = (line: string) => (line.includes(' // ') ? line.replace(' // ', ', // ') : `${line},`);

/** The CSS version's script: only when it waits for the line to scroll into view. */
const CSS_ON_SCROLL = `// Hold the typing until its top is 85% of the way down the window.
const line = document.querySelector('.typewriter');
line.style.animationPlayState = 'paused';
const seen = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  seen.disconnect();
  line.style.animationPlayState = '';
}, { rootMargin: '0px 0px -15% 0px' });
seen.observe(line);`;

/** The non-default typer options, as an object literal, or '' for none. */
function typerCallOptions(s: Settings): string {
  const o: string[] = [];
  if (s.speed !== TYPER_DEFAULTS.speed) o.push(`speed: ${s.speed}`);
  if (s.erase !== TYPER_DEFAULTS.eraseSpeed) o.push(`eraseSpeed: ${s.erase}`);
  if (s.hold !== TYPER_DEFAULTS.hold) o.push(`hold: ${s.hold}`);
  if (s.loop !== TYPER_DEFAULTS.loop) o.push(`loop: ${s.loop}`);
  if ((s.start === 'scroll') !== TYPER_DEFAULTS.onScroll) o.push(`onScroll: ${s.start === 'scroll'}`);
  return o.length ? `{ ${o.join(', ')} }` : '';
}

const phrasesLiteral = (phrases: string[]) => `[\n${phrases.map((p) => `  ${str(p)},`).join('\n')}\n]`;

/** The script for the visitor's page, without the library's import line. */
function jsBody(s: Settings): string | null {
  if (s.mode === 'css') return s.start === 'scroll' ? CSS_ON_SCROLL : null;
  if (s.mode === 'scroll') {
    const opts = scrollOptionLines(s, '1 / letters');
    return [
      "const el = document.querySelector('.typed');",
      '',
      '// One letter after another: scrollText makes a piece of every character but',
      '// the spaces, and each piece gets 1 ÷ that many of the scroll.',
      "const letters = el.textContent.split('').filter((c) => c !== ' ').length;",
      '',
      'scrollText(el, {',
      ...opts.map((l) => `  ${withComma(l)}`),
      '});',
      ...(s.caret !== 'none' ? ['', 'followCaret(el);', '', FOLLOW_CARET_FN] : []),
    ].join('\n');
  }
  const phrases = phrasesOf(s.text);
  const opts = typerCallOptions(s);
  return [
    `const PHRASES = ${phrasesLiteral(phrases)};`,
    '',
    `typewriter(document.querySelector('.typer'), PHRASES${opts ? `, ${opts}` : ''});`,
    '',
    TYPER_FN,
  ].join('\n');
}

export function jsCode(s: Settings): string {
  const body = jsBody(s) ?? '';
  return s.mode === 'scroll' ? `import { scrollText } from 'svg-scroll-draw/text';\n\n${body}` : body;
}

// ── React ────────────────────────────────────────────────────────────────────

const indent = (code: string, n: number) => code.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/** Typewriter.jsx. `cssImport` off for the StackBlitz project, whose main.jsx imports styles.css. */
export function reactComponent(s: Settings, cssImport = true): string {
  const css = cssImport ? ["import './typewriter.css';"] : [];
  const phrases = phrasesOf(s.text);

  if (s.mode === 'css') {
    if (s.start === 'load') {
      return [
        ...css,
        ...(css.length ? [''] : []),
        `const TEXT = ${str(phrases[0])};`,
        '',
        `// No JavaScript: the CSS types it. It is cut to this text’s ${charCount(phrases[0])} letters,`,
        '// so a different text needs the CSS made again.',
        'export function Typewriter() {',
        '  return <p className="typewriter">{TEXT}</p>;',
        '}',
      ].join('\n');
    }
    return [
      "'use client';",
      '',
      "import { useEffect, useRef } from 'react';",
      ...css,
      '',
      `const TEXT = ${str(phrases[0])};`,
      '',
      `// The CSS types it, cut to this text’s ${charCount(phrases[0])} letters; the effect`,
      '// holds it until its top is 85% of the way down the window.',
      'export function Typewriter() {',
      '  const ref = useRef(null);',
      '  useEffect(() => {',
      '    const line = ref.current;',
      "    line.style.animationPlayState = 'paused';",
      '    const seen = new IntersectionObserver(([entry]) => {',
      '      if (!entry.isIntersecting) return;',
      '      seen.disconnect();',
      "      line.style.animationPlayState = '';",
      "    }, { rootMargin: '0px 0px -15% 0px' });",
      '    seen.observe(line);',
      '    return () => seen.disconnect();',
      '  }, []);',
      '  return <p ref={ref} className="typewriter">{TEXT}</p>;',
      '}',
    ].join('\n');
  }

  if (s.mode === 'scroll') {
    const caret = s.caret !== 'none';
    const props = [
      'className="typed"',
      ...scrollOptionLines(s, '1 / letters(children)').map((l) => {
        const line = l.split(' // ')[0];
        const [k, ...rest] = line.split(': ');
        const v = rest.join(': ');
        if (k === 'easing') return 'easing={snap}';
        return v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`;
      }),
    ];
    const text = [
      '<ScrollText',
      ...props.map((p) => `  ${p}`),
      '>',
      '  {children}',
      '</ScrollText>',
    ].join('\n');
    return [
      // A function prop (the easing) cannot cross from a Server Component.
      "'use client';",
      '',
      ...(caret ? ["import { useEffect, useRef } from 'react';"] : []),
      "import { ScrollText } from 'svg-scroll-draw/react';",
      ...css,
      '',
      ...(s.appear === 'snap' ? ['// Each letter whole, as its share of the scroll begins.', 'const snap = (t) => (t > 0 ? 1 : 0);'] : []),
      '// scrollText makes a piece of every character but the spaces.',
      "const letters = (text) => text.split('').filter((c) => c !== ' ').length;",
      '',
      `// <Typewriter>${phrases[0].replace(/[<>{}]/g, '')}</Typewriter>`,
      'export function Typewriter({ children }) {',
      ...(caret
        ? [
            '  const box = useRef(null);',
            '  useEffect(() => followCaret(box.current.firstElementChild), []);',
            '  return (',
            '    <div ref={box}>',
            indent(text, 6),
            '    </div>',
            '  );',
          ]
        : ['  return (', indent(text, 4), '  );']),
      '}',
      ...(caret ? ['', FOLLOW_CARET_FN] : []),
    ].join('\n');
  }

  const opts = typerCallOptions(s);
  return [
    "'use client';",
    '',
    "import { useEffect, useRef } from 'react';",
    ...css,
    '',
    `const PHRASES = ${phrasesLiteral(phrases)};`,
    '// What screen readers read: every phrase, once.',
    `const COPY = ${str(fullText(phrases))};`,
    '',
    'export function Typewriter() {',
    '  const ref = useRef(null);',
    `  useEffect(() => typewriter(ref.current, PHRASES${opts ? `, ${opts}` : ''}), []);`,
    '  return (',
    '    <p ref={ref} className="typer">',
    '      <span className="typer-copy">{COPY}</span>',
    '      <span className="typer-text" aria-hidden="true">{PHRASES[0]}</span>',
    '    </p>',
    '  );',
    '}',
    '',
    TYPER_FN,
  ].join('\n');
}

// ── Code tabs ────────────────────────────────────────────────────────────────

export function tabsOf(s: Settings): CodeTab[] {
  return s.mode === 'css' && s.start === 'load' ? ['css', 'html', 'react'] : ['css', 'html', 'js', 'react'];
}

export const TAB_LABEL: Record<CodeTab, string> = { css: 'CSS', html: 'HTML', js: 'JavaScript', react: 'React' };
export const FILE_OF: Record<CodeTab, string> = {
  css: 'typewriter.css', html: 'index.html', js: 'main.js', react: 'Typewriter.jsx',
};

/** One tab's listing, with the source line on top. */
export function codeFor(s: Settings, tab: CodeTab): string {
  if (tab === 'css') return withSource(typeCss(s), SLUG, 'css');
  if (tab === 'html') return withSource(markup(s), SLUG, 'html');
  if (tab === 'js') return withSource(jsCode(s), SLUG, 'js');
  return withSource(reactComponent(s), SLUG, 'jsx');
}

// ── Runnable files ───────────────────────────────────────────────────────────

/** Whether the page needs room to scroll: the effect waits for, or follows, the scroll. */
const scrolls = (s: Settings) => s.mode === 'scroll' || s.start === 'scroll';

function pageCss(s: Settings): string {
  const room = scrolls(s)
    ? ['.room {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n  margin: 0;\n  font-size: 0.875rem;\n  opacity: 0.6;\n}']
    : [];
  const type = s.mode === 'css'
    ? []
    : [`.${s.mode === 'scroll' ? 'typed' : 'typer'} {\n  margin: 0;\n  font-size: clamp(1.5rem, 5vw, 2.5rem);\n  line-height: 1.25;\n}`];
  return [
    'body {\n  margin: 0;\n  background: #fafaf9;\n  color: #161514;\n  font-family: system-ui, sans-serif;\n}',
    `main {\n  max-width: 40rem;\n  margin: 0 auto;\n  padding: 0 1.5rem;${scrolls(s) ? '' : '\n  display: grid;\n  place-items: center;\n  min-height: 100vh;'}\n}`,
    ...room,
    ...type,
  ].join('\n\n');
}

function pageBody(s: Settings): string {
  const m = markup(s).split('\n').map((l) => `  ${l}`);
  if (!scrolls(s)) return ['<main>', ...m, '</main>'].join('\n');
  return ['<main>', '  <p class="room">Scroll down ↓</p>', ...m, '  <p class="room">The end.</p>', '</main>'].join('\n');
}

export function runnableHtml(s: Settings, version: string): string {
  const body = jsBody(s);
  const script = body == null
    ? undefined
    : s.mode === 'scroll'
      ? `import { scrollText } from '${cdnModule(version, 'text')}';\n\n${body}`
      : body;
  return htmlFile({
    slug: SLUG,
    title: TITLE,
    css: `${pageCss(s)}\n\n${typeCss(s)}`,
    body: pageBody(s),
    script,
  });
}

export function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const phrases = phrasesOf(s.text);
  const use = s.mode === 'scroll'
    ? `      <Typewriter>{${str(phrases[0])}}</Typewriter>`
    : '      <Typewriter />';
  const app = [
    reactComponent(s, false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    ...(scrolls(s) ? ['      <p className="room">Scroll down ↓</p>'] : []),
    use,
    ...(scrolls(s) ? ['      <p className="room">The end.</p>'] : []),
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
  return { slug: SLUG, app, css: `${pageCss(s)}\n\n${typeCss(s)}\n`, version };
}
