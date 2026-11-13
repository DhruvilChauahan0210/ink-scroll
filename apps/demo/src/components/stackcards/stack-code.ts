/**
 * The stacking cards generator's model and the code it writes. Pure functions,
 * no DOM: the page (server), the tool (client) and scripts/tool-pages.ts all
 * read them, so the numbers the page quotes are the ones the tool computes.
 *
 * The geometry, in one place:
 *
 * - Card i is `position: sticky` at `top + i × step`, so each one stops `step`
 *   lower than the one before and the edges of the cards under it show.
 * - The list has `padding-top: top`, so card 0 sticks just as the list's top
 *   reaches the window's top. Then card i sticks after i × LAND px of scroll
 *   past that moment, where LAND = card height + gap − step, and card i + 1
 *   lands on it LAND px later. Every card's "being covered" window is
 *   [i × LAND, (i + 1) × LAND], measured from the same zero.
 * - That zero is exit-crossing 0 on a view timeline of the list (CSS only), and
 *   scrollProgress' trigger 'top top' on the list (JavaScript): its progress
 *   times the list's height is the scroll past it (progress/index.ts: raw is
 *   (scroll − tStart) ÷ (tEnd − tStart), and with 'top top' → 'bottom top' that
 *   span is the list's own height).
 */

import { cdnModule, htmlFile, withSource } from '@/lib/tool-export';

export const SLUG = 'stacking-cards-scroll-generator';

export type StackSettings = {
  /** How many cards. */
  cards: number;
  /** Where the first card sticks, in px from the top of the window. */
  top: number;
  /** How much lower each next card sticks, in px. */
  step: number;
  /** Each card's height, in px. */
  height: number;
  /** How much a covered card shrinks: it ends at scale 1 − scale. */
  scale: number;
  /** How much a covered card dims: it ends at brightness 1 − dim. */
  dim: number;
  /** Rounded corners, in px. */
  radius: number;
};

export const STACK_DEFAULTS: StackSettings = { cards: 4, top: 48, step: 16, height: 280, scale: 0.08, dim: 0.3, radius: 20 };

export const LIMITS = {
  cards: { min: 2, max: 6, step: 1 },
  top: { min: 0, max: 120, step: 4 },
  step: { min: 0, max: 40, step: 2 },
  height: { min: 200, max: 480, step: 10 },
  scale: { min: 0, max: 0.2, step: 0.01 },
  dim: { min: 0, max: 0.6, step: 0.05 },
  radius: { min: 0, max: 40, step: 2 },
} as const;

/** The space between cards before they stack, in px. */
export const GAP = 24;

/** scrollProgress' own defaults (progress/index.ts), for the options table. */
export const LIB_DEFAULTS = {
  variable: '--scroll-progress',
  easedVariable: '--scroll-progress-eased',
  start: 'top bottom',
  end: 'bottom top',
  easing: 'linear',
} as const;

/** The trigger the generated code passes: 0 when the list's top reaches the window's top, 1 when its bottom does. */
export const TRIGGER = { start: 'top top', end: 'bottom top' } as const;

/** The cards' copy and colours: the first `cards` of them are used. */
export const CARD_COPY: { title: string; body: string; bg: string }[] = [
  { title: 'Stick', body: 'Each card is position: sticky, a little lower than the one before.', bg: '#1f3a5f' },
  { title: 'Pile up', body: 'The next card scrolls up over it and stops one step further down.', bg: '#7a3b2e' },
  { title: 'Step back', body: 'The card underneath shrinks and dims while the next one arrives.', bg: '#2f5d50' },
  { title: 'Keep going', body: 'Every card gets the same stretch of scroll, however many there are.', bg: '#5b4a7a' },
  { title: 'Let go', body: 'When the list ends, the pile scrolls away with the page.', bg: '#7a5a1f' },
  { title: 'Scroll back', body: 'Going up lifts each card off again, in reverse.', bg: '#24515e' },
];

export const cardsOf = (s: StackSettings) => CARD_COPY.slice(0, s.cards);

/** The scroll between one card sticking and the next landing on it. */
export const landOf = (s: StackSettings) => s.height + GAP - s.step;

/** Room after the last card, so the pile rests for one more card's scroll before it leaves. */
export const holdOf = (s: StackSettings) => landOf(s);

/** The list's height: the top padding, the cards and their gaps, and the rest after them. */
export const listHeight = (s: StackSettings) => s.top + s.cards * (s.height + GAP) + holdOf(s);

/** How tall the pile is once every card has landed: what has to fit in the window. */
export const pileHeight = (s: StackSettings) => s.top + (s.cards - 1) * s.step + s.height;

/** Where card i sticks, in px from the window's top. */
export const stickAt = (s: StackSettings, i: number) => s.top + i * s.step;

/** How far card i is covered (0–1) after `past` px of scroll past the list's top; the last card never is. */
export function coverAt(s: StackSettings, i: number, past: number): number {
  if (i >= s.cards - 1) return 0;
  return Math.min(1, Math.max(0, past / landOf(s) - i));
}

const num = (n: number) => String(Math.round(n * 1000) / 1000);

// ── Scoping, for the preview ─────────────────────────────────────────────────

/**
 * How the stylesheet is written. The listings use the plain names; the preview
 * puts every selector under its box's class, and names its keyframes and
 * timeline after the box, so its rules reach only its own cards.
 */
export type Names = { scope: string; keyframes: string; timeline: string };
export const PLAIN: Names = { scope: '', keyframes: 'stack-cover', timeline: '--stack' };

// ── The stylesheets ──────────────────────────────────────────────────────────

/** Layout and look, shared by both versions: sticky cards, stepped. */
export function baseCss(s: StackSettings, n: Names = PLAIN): string {
  const p = n.scope;
  const colours = cardsOf(s).map((c, i) => `${p}.stack-card:nth-child(${i + 1}) { background: ${c.bg}; }`).join('\n');
  const topLine = s.step
    ? `top: calc(${s.top}px + var(--i) * ${s.step}px); /* each card ${s.step}px lower than the last */`
    : `top: ${s.top}px; /* step 0: every card in the same place */`;
  return `/* The list's top padding is the first card's offset, so the first card
   sticks just as the list's top reaches the window's top. */
${p}.stack {
  margin: 0;
  padding: ${s.top}px 0 0;
  list-style: none;
}
/* Room for the pile to rest, one card's scroll, before it leaves. */
${p}.stack::after { content: ''; display: block; height: ${holdOf(s)}px; }

${p}.stack-card {
  position: sticky;
  ${topLine}
  box-sizing: border-box;
  height: ${s.height}px;
  margin-bottom: ${GAP}px;
  padding: 28px;
  overflow: hidden;${s.radius ? `\n  border-radius: ${s.radius}px;` : ''}
  color: #fff;
  box-shadow: 0 -6px 24px rgb(0 0 0 / 0.18);
  transform-origin: 50% 0; /* shrinks towards its top edge, which stays in view */
}
${colours}
${p}.stack-card-n { font: 600 13px/1 ui-monospace, monospace; opacity: 0.7; }
${p}.stack-card h3 { margin: 16px 0 8px; font-size: 28px; line-height: 1.15; }
${p}.stack-card p { max-width: 36ch; margin: 0; font-size: 16px; line-height: 1.5; opacity: 0.85; }`;
}

/** What a covered card ends as: the keyframe's (CSS only) or the calc's (script) target. */
function coveredLines(s: StackSettings, v: (amount: number) => string): string[] {
  const out: string[] = [];
  if (s.scale) out.push(`scale: ${v(s.scale)};`);
  if (s.dim) out.push(`filter: brightness(${v(s.dim)});`);
  return out;
}

/** The script version's effect: --cover, written by main.js, scales and dims the card. */
export function scriptCss(s: StackSettings, n: Names = PLAIN): string {
  const p = n.scope;
  const lines = coveredLines(s, (a) => `calc(1 - var(--cover, 0) * ${num(a)})`);
  const effect = lines.length
    ? `/* --cover: 0 → 1 while the next card slides over this one (set by the script). */
${p}.stack-card {
${lines.map((l) => `  ${l}`).join('\n')}
}

/* The cards still stack; they only stop shrinking and dimming. */
@media (prefers-reduced-motion: reduce) {
  ${p}.stack-card { scale: none; filter: none; }
}`
    : '/* Scale and dim are both 0: the cards only stack. */';
  return `${baseCss(s, n)}\n\n${effect}`;
}

/** The CSS-only version: sticky, and a view timeline on the list for the scale and dim. */
export function cssOnlyCss(s: StackSettings, n: Names = PLAIN): string {
  const p = n.scope;
  const land = landOf(s);
  const lines = coveredLines(s, (a) => num(1 - a));
  if (!lines.length) return `${baseCss(s, n)}\n\n/* Scale and dim are both 0: the cards only stack, with no timeline. */`;
  return `${baseCss(s, n)}

/* Where scroll-driven animations run, a covered card shrinks and dims.
   Everywhere else this block is skipped: the cards still stack. */
@supports (animation-timeline: view()) and (view-timeline-name: --x) {
  ${p}.stack { view-timeline: ${n.timeline} block; }
  /* exit-crossing 0 is the list's top at the window's top: card 0 sticks
     there, and card i, i × ${land}px later (height ${s.height} + gap ${GAP} − step ${s.step}).
     Each card's range is the ${land}px in which the next one lands on it. */
  ${p}.stack-card {
    animation-name: ${n.keyframes};
    animation-duration: auto;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
    animation-timeline: ${n.timeline};
    animation-range: exit-crossing calc(var(--i) * ${land}px) exit-crossing calc(var(--i) * ${land}px + ${land}px);
  }
  ${p}.stack-card:last-child { animation: none; } /* nothing lands on the last one */
}

@keyframes ${n.keyframes} {
  to { ${lines.join(' ')} }
}

/* The cards still stack; they only stop shrinking and dimming. */
@media (prefers-reduced-motion: reduce) {
  ${p}.stack-card { animation: none; }
}`;
}

// ── The listings ─────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** The list. `--i` is each card's place: its sticky offset and its stretch of scroll. */
export function markup(s: StackSettings): string {
  const n = s.cards;
  const items = cardsOf(s).map((c, i) => [
    `  <li class="stack-card" style="--i: ${i}">`,
    `    <span class="stack-card-n">${pad(i + 1)} / ${pad(n)}</span>`,
    `    <h3>${c.title}</h3>`,
    `    <p>${c.body}</p>`,
    '  </li>',
  ].join('\n'));
  return ['<ol class="stack">', ...items, '</ol>'].join('\n');
}

function landComment(s: StackSettings): string {
  return `// The scroll between one card sticking and the next landing on it:
// card height ${s.height} + gap ${GAP} − step ${s.step}.`;
}

function jsBody(s: StackSettings, from: string): string {
  return `import { scrollProgress } from '${from}';

const stack = document.querySelector('.stack');
// Every card but the last: nothing lands on that one.
const covered = [...stack.querySelectorAll('.stack-card')].slice(0, -1);
${landComment(s)}
const LAND = ${landOf(s)};

scrollProgress(stack, {
  // 0 when the list's top reaches the window's top, 1 when its bottom does.
  trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
  easedVariable: null,
  onProgress: (p) => {
    const past = p * stack.offsetHeight; // px scrolled since the list's top passed the window's top
    covered.forEach((card, i) => {
      // 0 → 1 while card i + 1 slides up over card i.
      card.style.setProperty('--cover', Math.min(1, Math.max(0, past / LAND - i)));
    });
  },
});`;
}

export const htmlCode = (s: StackSettings) => withSource(markup(s), SLUG, 'html');
export const cssCode = (s: StackSettings) => withSource(scriptCss(s), SLUG, 'css');
export const jsCode = (s: StackSettings) => withSource(jsBody(s, 'svg-scroll-draw/progress'), SLUG, 'js');
export const cssOnlyCode = (s: StackSettings) => withSource(cssOnlyCss(s), SLUG, 'css');

function reactComponent(s: StackSettings, client: boolean): string {
  const cards = cardsOf(s).map((c) => `  { title: '${c.title}', body: '${c.body}' },`).join('\n');
  return `${client ? "'use client';\n\n" : ''}import { useEffect, useRef } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';

const CARDS = [
${cards}
];

${landComment(s)}
const LAND = ${landOf(s)};

export function StackingCards() {
  const list = useRef(null);

  useEffect(() => {
    const stack = list.current;
    if (!stack) return;
    const covered = [...stack.children].slice(0, -1);
    const progress = scrollProgress(stack, {
      trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
      easedVariable: null,
      onProgress: (p) => {
        const past = p * stack.offsetHeight;
        covered.forEach((card, i) => {
          card.style.setProperty('--cover', String(Math.min(1, Math.max(0, past / LAND - i))));
        });
      },
    });
    return () => {
      progress.destroy();
      covered.forEach((card) => card.style.removeProperty('--cover'));
    };
  }, []);

  return (
    <ol ref={list} className="stack">
      {CARDS.map((card, i) => (
        <li key={card.title} className="stack-card" style={{ '--i': i }}>
          <span className="stack-card-n">
            {String(i + 1).padStart(2, '0')} / {String(CARDS.length).padStart(2, '0')}
          </span>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </li>
      ))}
    </ol>
  );
}`;
}

export const reactCode = (s: StackSettings) => withSource(reactComponent(s, true), SLUG, 'jsx');

// ── Whole files ──────────────────────────────────────────────────────────────

/** The page around the list in the downloadable files: a header `top` tall, and room to scroll. */
function pageCss(s: StackSettings): string {
  return `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; color: #1b1a18; background: #f6f4ef; }
${s.top ? `.page-header {
  position: sticky;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: ${s.top}px;
  padding: 0 24px;
  border-bottom: 1px solid #d9d5cc;
  background: #f6f4ef;
  font: 500 13px/1 ui-monospace, monospace;
}
` : ''}main { max-width: 720px; margin: 0 auto; padding: 0 16px; }
.spacer { display: grid; place-items: center; height: 100vh; color: #6b675f; }`;
}

function pageBody(s: StackSettings): string {
  return [
    ...(s.top ? [`<header class="page-header">Your header · ${s.top}px</header>`] : []),
    '<main>',
    '  <div class="spacer">Scroll down</div>',
    markup(s).split('\n').map((l) => `  ${l}`).join('\n'),
    '  <div class="spacer">After the cards</div>',
    '</main>',
  ].join('\n');
}

/** A complete page running the scrollProgress version, the library from jsDelivr. */
export function jsFile(s: StackSettings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'Stacking cards on scroll',
    css: `${pageCss(s)}\n\n${scriptCss(s)}`,
    body: pageBody(s),
    script: jsBody(s, cdnModule(version, 'progress')),
  });
}

/** A complete page running the CSS-only version: no script at all. */
export function cssOnlyFile(s: StackSettings): string {
  return htmlFile({
    slug: SLUG,
    title: 'Stacking cards on scroll, CSS only',
    css: `${pageCss(s)}\n\n${cssOnlyCss(s)}`,
    body: pageBody(s),
  });
}

/** The React project for StackBlitz: the component, and a page to scroll it in. */
export function reactApp(s: StackSettings): { app: string; css: string } {
  return {
    app: `${reactComponent(s, false)}

export default function App() {
  return (
    <>
${s.top ? `      <header className="page-header">Your header · ${s.top}px</header>\n` : ''}      <main>
        <div className="spacer">Scroll down</div>
        <StackingCards />
        <div className="spacer">After the cards</div>
      </main>
    </>
  );
}`,
    css: `${pageCss(s)}\n\n${scriptCss(s)}\n`,
  };
}
