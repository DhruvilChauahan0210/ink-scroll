/**
 * The scroll pin generator's model and the code it writes. Pure functions, no
 * DOM: the page (server) and the tool (client) both read them, so the numbers
 * the page quotes are the ones the tool computes.
 *
 * Every figure about scrollPin here comes from packages/svg-scroll-draw/src/
 * pin/index.ts: `top` defaults to 0, `pinDistance` to window.innerHeight; the
 * wrapper is the element's height plus the pin distance; progress is
 * (top − wrapper top) ÷ pinDistance, clamped to 0–1.
 */

import { cdnModule, htmlFile, withSource } from '@/lib/tool-export';

export const SLUG = 'scroll-pin-generator';

export type DistMode = 'default' | 'vh' | 'px';

export type PinSettings = {
  /** How many steps the tour shows while pinned. */
  steps: number;
  /** pinDistance: left out (one window height), a vh string or a pixel number. */
  mode: DistMode;
  vh: number;
  px: number;
  /** The `top` option: where the stage pins, in px from the top of the window. */
  top: number;
};

export const PIN_DEFAULTS: PinSettings = { steps: 4, mode: 'vh', vh: 300, px: 1200, top: 64 };

/** scrollPin's own defaults (pin/index.ts: `top: pinnedViewportTop = 0`, distance() → window.innerHeight). */
export const LIB_DEFAULTS = { top: 0, pinDistance: 'window.innerHeight' } as const;

export const STEPS_MIN = 2;
export const STEPS_MAX = 6;
export const VH = { min: 50, max: 600, step: 25 };
export const PX = { min: 200, max: 3000, step: 50 };
export const TOP = { min: 0, max: 120, step: 4 };

/** The tour's copy: one entry per step, the first `steps` of them used. */
export const STEP_COPY: { title: string; body: string }[] = [
  { title: 'Pin the stage', body: 'It holds still while the rest of the page scrolls on.' },
  { title: 'Split the scroll', body: 'The pin distance is shared out: each step gets an equal part.' },
  { title: 'Show one step', body: 'onProgress says how far in you are, so one step shows at a time.' },
  { title: 'Draw as you go', body: 'Each line draws through its own share of the scroll.' },
  { title: 'Let it go', body: 'At the end of the pin distance the stage scrolls on with the page.' },
  { title: 'Scroll back', body: 'Going up runs it all in reverse, back to the first step.' },
];

const r1 = (n: number) => String(Math.round(n * 10) / 10);

/** A regular polygon with `sides` corners, its first at the top: step i is drawn with i + 3 sides. */
export function polygonPath(sides: number, r = 38, c = 50): string {
  const pts = Array.from({ length: sides }, (_, k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / sides;
    return `${r1(c + r * Math.cos(a))} ${r1(c + r * Math.sin(a))}`;
  });
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

export const stepsOf = (s: PinSettings) =>
  STEP_COPY.slice(0, s.steps).map((c, i) => ({ ...c, d: polygonPath(i + 3) }));

/** Which step a progress shows: p split into `n` equal parts, the last one closed. */
export const stepAt = (p: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor(p * n)));

/** How far through its own step the current one is, 0–1. */
export const stepProgress = (p: number, n: number) => {
  const i = stepAt(p, n);
  return Math.min(1, Math.max(0, p * n - i));
};

/** The pin distance as a CSS length: what the CSS-only version and the comments use. */
export function distanceCss(s: PinSettings): string {
  if (s.mode === 'vh') return `${s.vh}vh`;
  if (s.mode === 'px') return `${s.px}px`;
  return '100vh';
}

/** The pinDistance option as written, or null when it is left at the default. */
export function distanceOption(s: PinSettings): string | null {
  if (s.mode === 'vh') return `'${s.vh}vh'`;
  if (s.mode === 'px') return String(s.px);
  return null;
}

/** One step's share of the pin distance, in the distance's own unit. */
export function perStep(s: PinSettings): string {
  const fmt = (n: number) => String(Math.round(n * 100) / 100);
  if (s.mode === 'vh') return `${fmt(s.vh / s.steps)}vh`;
  if (s.mode === 'px') return `${fmt(s.px / s.steps)}px`;
  return `${fmt(100 / s.steps)}vh`;
}

/** The pin distance in the preview box, where the box stands in for the window. */
export function previewDistance(s: PinSettings, boxHeight: number): number {
  if (s.mode === 'vh') return Math.round((boxHeight * s.vh) / 100);
  if (s.mode === 'px') return s.px;
  return boxHeight;
}

/** The stage's height: the window below `top`. */
const stageHeight = (s: PinSettings, unit: 'vh' | 'svh') =>
  s.top ? `calc(100${unit} - ${s.top}px)` : `100${unit}`;

// ── The listings ─────────────────────────────────────────────────────────────

const ind = (text: string, n: number) =>
  text.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/** The tour's markup. With `js`, the first step starts as the current one. */
export function markup(s: PinSettings, js = true): string {
  const items = stepsOf(s).map((st, i) => [
    `<li class="tour-step"${js && i === 0 ? ' aria-current="step"' : ''}>`,
    `  <svg viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="${st.d}" /></svg>`,
    `  <h3>${st.title}</h3>`,
    `  <p>${st.body}</p>`,
    '</li>',
  ].join('\n'));
  return [
    '<section class="tour">',
    `  <div class="tour-stage"${js ? ' id="tour-stage"' : ''}>`,
    '    <ol class="tour-steps">',
    ind(items.join('\n'), 6),
    '    </ol>',
    '    <div class="tour-bar"></div>',
    '  </div>',
    '</section>',
  ].join('\n');
}

const TYPE = `.tour-step svg { display: block; width: 96px; height: 96px; }
.tour-step h3 { margin: 16px 0 8px; font-size: 24px; line-height: 1.2; }
.tour-step p { max-width: 36ch; margin: 0; }`;

/** The stylesheet for the scrollPin version. */
export function css(s: PinSettings): string {
  const under = s.top ? ` below the ${s.top}px header` : '';
  return `/* The stage fills the window${under}: while it is pinned,
   anything that does not fit can never be scrolled to. */
.tour-stage {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: ${stageHeight(s, 'vh')};
  height: ${stageHeight(s, 'svh')};
  padding: 32px 6vw;
}
.tour-steps { display: grid; align-items: center; margin: 0; padding: 0; list-style: none; }

/* Every step in the same place; the current one shows. */
.tour-step { grid-area: 1 / 1; opacity: 0; transition: opacity 0.3s ease; }
.tour-step[aria-current] { opacity: 1; }
${TYPE}
.tour-step path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-dasharray: 1;
  /* --draw: 0 → 1 through its step. Times 1px: Firefox drops a calc() of
     plain numbers here, and pathLength="1" makes 1px the whole line. */
  stroke-dashoffset: calc((1 - var(--draw, 0)) * 1px);
}

.tour-bar {
  height: 2px;
  background: currentColor;
  transform: scaleX(var(--progress, 0)); /* --progress: 0 → 1 through the pin */
  transform-origin: 0 50%;
}

@media (prefers-reduced-motion: reduce) {
  .tour-step { transition: none; }
  .tour-step path { stroke-dashoffset: 0; }
}`;
}

/** The scrollPin call's options, with a comment on each; only what differs from the defaults. */
function optionLines(s: PinSettings): string[] {
  const out: string[] = [];
  if (s.top !== LIB_DEFAULTS.top) out.push(`top: ${s.top}, // pins ${s.top}px down, under a ${s.top}px header`);
  const d = distanceOption(s);
  if (d) out.push(`pinDistance: ${d}, // ${s.steps} steps, ${perStep(s)} of scroll each`);
  return out;
}

function jsBody(s: PinSettings, from: string): string {
  const opts = optionLines(s);
  const lead = opts.length ? '' : '// top and pinDistance left out: it pins at the very top, for one window height.\n';
  const d = distanceOption(s);
  const note = !d && opts.length ? '  // pinDistance left out: one window height, read again on resize.\n' : '';
  return `import { scrollPin } from '${from}';

const stage = document.querySelector('#tour-stage');
const steps = [...stage.querySelectorAll('.tour-step')];
let current = 0;

${lead}const pin = scrollPin(stage, {
${opts.map((l) => `  ${l}`).join('\n')}${opts.length ? '\n' : ''}${note}  onProgress: (p) => {
    // p runs 0 → 1 through the pin; each step gets an equal share of it.
    const i = Math.min(steps.length - 1, Math.floor(p * steps.length));
    stage.style.setProperty('--progress', p);
    steps.forEach((step, j) => {
      step.style.setProperty('--draw', j < i ? 1 : j > i ? 0 : p * steps.length - i);
    });
    if (i !== current) {
      steps[current].removeAttribute('aria-current');
      steps[i].setAttribute('aria-current', 'step');
      current = i;
    }
  },
});

// pin.destroy() unpins it and puts the stage back where it was.`;
}

export const jsCode = (s: PinSettings) => withSource(jsBody(s, 'svg-scroll-draw/pin'), SLUG, 'js');
export const htmlCode = (s: PinSettings) => withSource(markup(s), SLUG, 'html');
export const cssCode = (s: PinSettings) => withSource(css(s), SLUG, 'css');

function reactComponent(s: PinSettings, client: boolean): string {
  const opts = optionLines(s);
  const steps = stepsOf(s)
    .map((st) => `  { title: '${st.title}', body: '${st.body}', d: '${st.d}' },`)
    .join('\n');
  return `${client ? "'use client';\n\n" : ''}import { useEffect, useRef, useState } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

const STEPS = [
${steps}
];

export function FeatureTour() {
  const stage = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const steps = el.querySelectorAll('.tour-step');
    const n = steps.length;
    const pin = scrollPin(el, {
${opts.map((l) => `      ${l}`).join('\n')}${opts.length ? '\n' : ''}      onProgress: (p) => {
        const i = Math.min(n - 1, Math.floor(p * n));
        el.style.setProperty('--progress', String(p));
        steps.forEach((step, j) => {
          step.style.setProperty('--draw', String(j < i ? 1 : j > i ? 0 : p * n - i));
        });
        setCurrent(i);
      },
    });
    return () => pin.destroy();
  }, []);

  return (
    // scrollPin moves the stage into a wrapper of its own, so the stage must
    // not be this component's root: React looks for its root where it left it.
    <section className="tour">
      <div ref={stage} className="tour-stage">
        <ol className="tour-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="tour-step" aria-current={i === current ? 'step' : undefined}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path pathLength="1" d={s.d} />
              </svg>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="tour-bar" />
      </div>
    </section>
  );
}`;
}

export const reactCode = (s: PinSettings) => withSource(reactComponent(s, true), SLUG, 'jsx');

// ── The CSS-only version ─────────────────────────────────────────────────────

/** The stylesheet for position: sticky and a view timeline, with a plain list where there is neither. */
export function cssOnly(s: PinSettings): string {
  const n = s.steps;
  const d = distanceCss(s);
  const share = (k: number) => {
    if (k === 0) return '0px';
    if (s.mode === 'px') return `${Math.round((s.px * k) / n * 100) / 100}px`;
    const total = s.mode === 'vh' ? s.vh : 100;
    return `${Math.round((total * k) / n * 100) / 100}vh`;
  };
  const range = (a: number, b: number) => `exit-crossing ${share(a)} exit-crossing ${share(b)}`;
  const lines: string[] = [];
  for (let k = 0; k < n; k++) {
    const sel = `.tour-step:nth-child(${k + 1})`;
    if (k === 0) {
      lines.push(`  ${sel} { animation-range: ${range(1, n)}; }`);
      lines.push(`  ${sel} path { animation-range: ${range(0, 1)}; }`);
    } else {
      lines.push(`  ${sel},\n  ${sel} path { animation-range: ${range(k, k + 1)}; }`);
    }
  }
  const at = s.top ? `${s.top}px down` : 'at the top';
  const anim = (name: string, fill: string) => `    animation-name: ${name};
    animation-duration: auto;
    animation-timing-function: linear;
    animation-fill-mode: ${fill};
    animation-timeline: --tour;`;
  return `/* Without scroll-driven animations the tour is a plain list:
   every step shows, and nothing pins. */
.tour-stage { box-sizing: border-box; padding: 32px 6vw; }
.tour-steps { display: grid; gap: 48px; margin: 0; padding: 0; list-style: none; }
${TYPE}
.tour-step path { fill: none; stroke: currentColor; stroke-width: 2; }
.tour-bar { display: none; }

@supports (animation-timeline: view()) and (view-timeline-name: --x) {
  /* The tall wrapper: the stage, plus the pin distance (${d}). */
  .tour {
    height: calc(${stageHeight(s, 'vh')} + ${d});
    height: calc(${stageHeight(s, 'svh')} + ${d});
    view-timeline-name: --tour;
    view-timeline-axis: block;${s.top ? `\n    view-timeline-inset: ${s.top}px 0px; /* measured from the pin line, not the window's top */` : ''}
  }
  /* Sticks ${at} for as long as the wrapper lasts: ${d} of scroll. */
  .tour-stage {
    position: sticky;
    top: ${s.top}px;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    height: ${stageHeight(s, 'vh')};
    height: ${stageHeight(s, 'svh')};
  }
  .tour-steps { gap: 0; align-items: center; }

  /* Each step shows for its share of the pin. The first one's resting value
     is shown, and the lines' undrawn, rather than a backwards fill: WebKit
     left a backwards fill off before its range began. */
  .tour-step {
    grid-area: 1 / 1;
    opacity: 0;
${anim('tour-show', 'none')}
  }
  .tour-step:first-child { opacity: 1; animation-name: tour-hide; animation-fill-mode: forwards; }
  .tour-step:last-child { animation-fill-mode: forwards; }
  .tour-step path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
${anim('tour-draw', 'forwards')}
  }

  /* exit-crossing 0 is the wrapper's top on the pin line: where the pin
     starts. A length after it is that much scroll later. */
${lines.join('\n')}

  .tour-bar {
    display: block;
    height: 2px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: 0 50%;
${anim('tour-bar', 'forwards')}
    animation-range: ${range(0, n)};
  }
}

@keyframes tour-show { from, to { opacity: 1; } }
@keyframes tour-hide { from, to { opacity: 0; } }
@keyframes tour-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes tour-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }

@media (prefers-reduced-motion: reduce) {
  .tour-step path { animation-name: none; stroke-dashoffset: 0; }
}`;
}

export const cssOnlyCode = (s: PinSettings) => withSource(cssOnly(s), SLUG, 'css');

// ── Whole files ──────────────────────────────────────────────────────────────

/** The page around the tour in the downloadable files: a header `top` tall, and room to scroll. */
function pageCss(s: PinSettings): string {
  return `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; color: #1b1a18; background: #f6f4ef; }
${s.top ? `.page-header {
  position: sticky;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: ${s.top}px;
  padding: 0 6vw;
  border-bottom: 1px solid #d9d5cc;
  background: #f6f4ef;
  font: 500 13px/1 ui-monospace, monospace;
}
` : ''}.spacer { display: grid; place-items: center; height: 100vh; color: #6b675f; }`;
}

function pageBody(s: PinSettings, js: boolean): string {
  return [
    ...(s.top ? [`<header class="page-header">Your header · ${s.top}px</header>`] : []),
    '<div class="spacer">Scroll down</div>',
    '',
    markup(s, js),
    '',
    '<div class="spacer">After the tour</div>',
  ].join('\n');
}

/** A complete page running the scrollPin version, the library from jsDelivr. */
export function jsFile(s: PinSettings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'Pinned feature tour',
    css: `${pageCss(s)}\n\n${css(s)}`,
    body: pageBody(s, true),
    script: jsBody(s, cdnModule(version, 'pin')),
  });
}

/** A complete page running the CSS-only version: no script at all. */
export function cssOnlyFile(s: PinSettings): string {
  return htmlFile({
    slug: SLUG,
    title: 'Pinned feature tour, CSS only',
    css: `${pageCss(s)}\n\n${cssOnly(s)}`,
    body: pageBody(s, false),
  });
}

/** The React project for StackBlitz: the component, and a page to scroll it in. */
export function reactApp(s: PinSettings): { app: string; css: string } {
  return {
    app: `${reactComponent(s, false)}

export default function App() {
  return (
    <>
${s.top ? `      <header className="page-header">Your header · ${s.top}px</header>\n` : ''}      <div className="spacer">Scroll down</div>
      <FeatureTour />
      <div className="spacer">After the tour</div>
    </>
  );
}`,
    css: `${pageCss(s)}\n\n${css(s)}\n`,
  };
}
