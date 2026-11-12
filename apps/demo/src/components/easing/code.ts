import {
  EXACT_CSS, FACTORIES, linearCss, linearText, num, type Curve, type CurveStats, type EasingName, type FactoryKey,
} from '@/data/easing';
import { cdnModule, escapeHtml, htmlFile, withSource, type CodeLang, type ReactProject } from '@/lib/tool-export';

/**
 * What the easing visualizer writes, from its state (the easing picked, the
 * factory numbers, the comparison):
 *
 * - codeFor: the four code tabs, each with the source line on top. Options at
 *   their defaults are left out.
 * - easingHtml: a complete page that runs the picked easing (and the one it is
 *   compared with) on a scrollDraw line and a scrollAnimate dot over a pinned
 *   stretch of real page scroll, as the visualizer's scroll box does, with the
 *   library from jsDelivr. For Download and Open in StackBlitz.
 * - reactProject: the React tab's component in plain JSX, drawing a real line,
 *   inside an App to scroll it in.
 *
 * No React and no DOM here: the visualizer imports it, and so can a script
 * that runs what it writes.
 */

export const SLUG = 'easing-visualizer';
export const TITLE = 'Easing on scroll';

/** A named easing, or 'f:' and a factory key. */
export type Choice = EasingName | `f:${FactoryKey}`;
export type Params = Record<FactoryKey, [number, number]>;
export type Tab = 'draw' | 'animate' | 'react' | 'css';

export const DEFAULTS: Params = {
  spring: [FACTORIES.spring.params[0].def, FACTORIES.spring.params[1].def],
  bounce: [FACTORIES.bounce.params[0].def, FACTORIES.bounce.params[1].def],
  elastic: [FACTORIES.elastic.params[0].def, FACTORIES.elastic.params[1].def],
};

/** The file name each code tab is shown under, and its language for the source line. */
export const TAB_FILES: Record<Tab, string> = { draw: 'main.js', animate: 'motion.js', react: 'Drawing.tsx', css: 'easing.css' };
const TAB_LANG: Record<Tab, CodeLang> = { draw: 'js', animate: 'js', react: 'tsx', css: 'css' };

/** The line every preview draws, in a 320 × 76 box. */
export const WAVE = 'M14 58 C 44 58, 52 18, 86 18 S 128 58, 160 58 S 202 18, 236 18 S 278 58, 306 58';

export const factoryOf = (p: Choice): FactoryKey | null => (p.startsWith('f:') ? (p.slice(2) as FactoryKey) : null);
export const isDefault = (key: FactoryKey, v: [number, number]) => v[0] === DEFAULTS[key][0] && v[1] === DEFAULTS[key][1];

/** The easing as the code writes it: 'spring', or createSpring({ tension: 3 }). */
export function labelOf(p: Choice, params: Params): string {
  const key = factoryOf(p);
  if (!key) return `'${p}'`;
  const args = changedArgs(key, params[key]);
  return `${FACTORIES[key].fn}(${args ? `{ ${args} }` : ''})`;
}

/** The factory arguments that differ from their defaults, as code. */
function changedArgs(key: FactoryKey, v: [number, number]): string {
  return FACTORIES[key].params
    .map((spec, i) => (v[i] === spec.def ? null : `${spec.k}: ${num(v[i], 2)}`))
    .filter(Boolean)
    .join(', ');
}

/** The plot's value range: at least -0.25 to 1.5, wider in steps of 0.25 when a curve needs it, with room for the peak's label. */
export function rangeOf(stats: CurveStats[]): [number, number] {
  const min = Math.min(...stats.map((s) => s.min));
  const max = Math.max(...stats.map((s) => s.max));
  return [Math.min(-0.25, Math.floor((min - 0.05) * 4) / 4), Math.max(1.5, Math.ceil((max + 0.1) * 4) / 4)];
}

// ── The code tabs ────────────────────────────────────────────────────────────

type Expr = { value: string | null; imports: string[]; decl: string; note: string };

/**
 * How the chosen easing is written, for an API whose default is `def`:
 * value null when it is that default; a factory at its defaults is written as
 * the named easing it equals ('spring', 'bounce', 'elastic' are createSpring(),
 * createBounce() and createElastic() at their defaults, core/easing.ts:107-109).
 */
function exprOf(pick: Choice, params: Params, def: EasingName, api: string): Expr {
  const key = factoryOf(pick);
  if (key && !isDefault(key, params[key])) {
    const f = FACTORIES[key];
    const defaults = f.params.map((p) => `${p.k} ${p.def}`).join(', ');
    return {
      value: key,
      imports: [f.fn],
      decl: `// ${f.fn} defaults: ${defaults}.\nconst ${key} = ${f.fn}({ ${changedArgs(key, params[key])} });\n\n`,
      note: '',
    };
  }
  const name = (key ?? pick) as EasingName;
  const same = key ? `// ${FACTORIES[key].fn}() at its defaults is the named '${name}' easing.\n` : '';
  if (name === def) return { value: null, imports: [], decl: '', note: `${same}// '${def}' is ${api}'s default easing, so there is nothing to set.\n` };
  return { value: `'${name}'`, imports: [], decl: '', note: same };
}

/** One code tab, with the source line on top. */
export function codeFor(tab: Tab, pick: Choice, params: Params, curve: Curve): string {
  return withSource(tabCode(tab, pick, params, curve), SLUG, TAB_LANG[tab]);
}

function tabCode(tab: Tab, pick: Choice, params: Params, curve: Curve): string {
  if (tab === 'css') return cssCode(pick, params, curve);
  if (tab === 'draw') {
    const e = exprOf(pick, params, 'linear', 'scrollDraw');
    const call = e.value ? `scrollDraw('#drawing', { easing: ${e.value} });` : `scrollDraw('#drawing');`;
    return `// <div id="drawing"><svg viewBox="…"><path d="…" /></svg></div>

import { ${['scrollDraw', ...e.imports].join(', ')} } from 'svg-scroll-draw';

${e.decl}${e.note}${call}`;
  }
  if (tab === 'animate') {
    const e = exprOf(pick, params, 'ease-out', 'scrollAnimate');
    return `// <div id="card">…</div>

import { ${['scrollAnimate', ...e.imports].join(', ')} } from 'svg-scroll-draw';

${e.decl}${e.note}// Moves #card 240px to the right as it scrolls through the window.
scrollAnimate('#card', {
  props: { transform: ['translateX(0px)', 'translateX(240px)'] },${e.value ? `\n  easing: ${e.value},` : ''}
});`;
  }
  // A function cannot be passed from a Server Component to a Client one, and
  // ScrollDraw is a Client Component: with a factory, this file must be one too.
  const client = exprOf(pick, params, 'linear', 'ScrollDraw').imports.length
    ? `'use client';\n// easing is a function, and a Server Component cannot pass one to ScrollDraw.\n\n`
    : '';
  return `${client}${drawingComponent(pick, params, '      <svg viewBox="…">{/* your paths */}</svg>')}`;
}

/** The React tab's Drawing component around `svg` (JSX, indented for inside <ScrollDraw>). */
function drawingComponent(pick: Choice, params: Params, svg: string): string {
  const e = exprOf(pick, params, 'linear', 'ScrollDraw');
  const prop = e.value ? (e.value.startsWith("'") ? ` easing="${e.value.slice(1, -1)}"` : ` easing={${e.value}}`) : '';
  const imports = e.imports.length ? `\nimport { ${e.imports.join(', ')} } from 'svg-scroll-draw';` : '';
  const decl = e.decl ? `\n${e.decl.replace(/\n\n$/, '\n').replace(/^(\/\/.*\n)/, '$1// Made once, outside the component.\n')}` : '';
  const note = e.note ? `\n${e.note}` : '';
  return `import { ScrollDraw } from 'svg-scroll-draw/react';${imports}
${decl}${note}
export function Drawing() {
  return (
    <ScrollDraw${prop}>
${svg}
    </ScrollDraw>
  );
}`;
}

/** Words as a CSS comment, wrapped to `width` columns. */
function comment(text: string, width = 76): string {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width - 3) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  lines.push(line);
  return `/* ${lines.join('\n   ')} */`;
}

/** Up to 4 decimals, rounded up, so "within" is never an understatement. */
const ceil4 = (n: number) => num(Math.ceil(Math.max(n, 0.0001) * 1e4) / 1e4, 4);

function cssCode(pick: Choice, params: Params, curve: Curve): string {
  const key = factoryOf(pick);
  const name = key ?? (pick as EasingName);
  const label = labelOf(pick, params);
  const exact = !key ? EXACT_CSS[pick as EasingName] : undefined;
  const usage = (v: string) => `.card {
  transition: transform 0.8s ${v};
}

/* Add the class and the card moves 240px along the curve. */
.card.is-moved {
  transform: translateX(240px);
}`;
  if (exact === 'linear') {
    return `/* 'linear' is the same curve in CSS: the keyword linear. */
${usage('linear')}`;
  }
  if (exact) {
    const v = `--ease-${name.replace('ease-', '')}-quad`;
    return `${comment(`svg-scroll-draw's ${label} is ${name === 'ease-in' ? 't²' : 't(2 − t)'}, and this cubic-bezier is that curve to within 0.0000003. CSS's own ${name} keyword is a different curve, up to 0.069 away.`)}
:root {
  ${v}: ${exact};
}

${usage(`var(${v})`)}`;
  }
  const { stops, error, tailError } = linearCss(curve);
  const v = `--ease-${name.replace('ease-', '')}`;
  // A spring with friction under 1 shoots up to 1 at the very end, faster than
  // any list of points can follow: say where the error is, not only how big.
  const fit = tailError > Math.max(error * 1.5, 0.002)
    ? `within ${ceil4(error)} of the curve until the last 0.1% of the run, where the curve jumps to 1 faster than any list of points can follow and this is up to ${ceil4(tailError)} off.`
    : `within ${ceil4(Math.max(error, tailError))} of the curve everywhere.`;
  return `${comment(`svg-scroll-draw's ${label} as a CSS easing: linear() through ${stops.length} points, ${fit} Chrome 113+, Firefox 112+, Safari 17.2+.`)}
:root {
  ${v}: linear(
${linearText(stops, 4)}
  );
}

${usage(`var(${v})`)}`;
}

// ── Runnable files ───────────────────────────────────────────────────────────

/** The easing written out in full for a runnable file, defaults included, so it is one line to change. */
function spelled(pick: Choice, params: Params): { value: string; imports: string[]; decl: string; note: string } {
  const key = factoryOf(pick);
  if (!key) return { value: `'${pick}'`, imports: [], decl: '', note: '' };
  const f = FACTORIES[key];
  if (isDefault(key, params[key])) {
    return { value: `'${key}'`, imports: [], decl: '', note: `// ${f.fn}() at its defaults is the named '${key}' easing.\n` };
  }
  const defaults = f.params.map((p) => `${p.k} ${p.def}`).join(', ');
  return {
    value: key,
    imports: [f.fn],
    decl: `// ${f.fn} defaults: ${defaults}.\nconst ${key} = ${f.fn}({ ${changedArgs(key, params[key])} });\n\n`,
    note: '',
  };
}

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export type HtmlInput = {
  pick: Choice;
  params: Params;
  /** The easing it is compared with, or 'none'. */
  cmp: EasingName | 'none';
  /** The rulers' range, the plot's: from rangeOf() over both curves. */
  range: [number, number];
  /** svg-scroll-draw's version, for the jsDelivr URL. */
  version: string;
};

/**
 * A complete page: the picked easing (row A) and the comparison (row B) each
 * drive a line drawn by scrollDraw and a dot moved by scrollAnimate, over a
 * section three screens tall whose stage stays pinned, so the whole scroll
 * through it is progress 0 to 1, as in the visualizer's scroll box. Each
 * ruler runs over the plot's range with 0 and 1 marked, so an overshoot
 * shows as the dot passing the 1.
 */
export function easingHtml({ pick, params, cmp, range: [lo, hi], version }: HtmlInput): string {
  const a = spelled(pick, params);
  const labelA = labelOf(pick, params);
  const labelB = cmp === 'none' ? null : `'${cmp}'`;
  const imports = ['scrollDraw', 'scrollAnimate', ...a.imports].join(', ');
  const pct = (v: number) => `${num(v * 100, 3)}%`;
  const row = (key: 'a' | 'b', label: string) => [
    `<div class="row row-${key}">`,
    `  <p class="row-h"><span>${key.toUpperCase()} · ${escapeHtml(label)}</span><output id="out-${key}"></output></p>`,
    '  <svg viewBox="0 0 320 76" aria-hidden="true">',
    `    <path class="pencil" d="${WAVE}" />`,
    `    <path class="ink ink-${key}" d="${WAVE}" />`,
    '  </svg>',
    `  <div class="ruler"><div class="unit"><span class="dot dot-${key}" id="dot-${key}"></span></div></div>`,
    '</div>',
  ];
  const heading = labelB ? `${labelA} and ${labelB}` : labelA;

  const css = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
.intro, .end {
  display: grid;
  align-content: center;
  gap: 12px;
  min-height: 80vh;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px;
}
.intro h1 { margin: 0; font: 600 clamp(20px, 5vw, 30px)/1.25 ${MONO}; overflow-wrap: anywhere; }
.intro p, .end p { margin: 0; color: #55555c; }
.kicker { font: 500 12px/1.4 ${MONO}; }
/* Three screens of scroll, and a stage that stays on screen while they pass. */
.run { height: 300vh; }
.stage {
  position: sticky;
  top: 0;
  display: grid;
  align-content: center;
  gap: 24px;
  height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
.read, .row-h { display: flex; justify-content: space-between; gap: 12px; margin: 0; font: 500 13px/1.4 ${MONO}; }
.row-h span { min-width: 0; overflow-wrap: anywhere; }
output { font-variant-numeric: tabular-nums; }
.row { display: grid; gap: 6px; }
.row svg { display: block; width: 100%; height: auto; overflow: visible; }
.pencil { fill: none; stroke: #c9c9c2; stroke-width: 1; stroke-dasharray: 3 4; }
.ink { fill: none; stroke: #16161a; stroke-width: 3; }
.ink-b { stroke: #77777d; }
/* The ruler runs from ${num(lo)} to ${num(hi)}; .unit spans 0 to 1 on it. */
.ruler { position: relative; height: 18px; margin-bottom: 18px; border-bottom: 1px solid #c9c9c2; }
.unit {
  position: absolute;
  top: 0;
  bottom: -1px;
  left: ${pct(-lo / (hi - lo))};
  width: ${pct(1 / (hi - lo))};
  border-left: 1px solid #77777d;
  border-right: 1px solid #77777d;
}
.unit::before, .unit::after { position: absolute; top: 100%; transform: translateX(-50%); font: 12px/1.5 ${MONO}; color: #55555c; }
.unit::before { content: '0'; left: 0; }
.unit::after { content: '1'; left: 100%; }
.dot {
  position: absolute;
  top: 3px;
  left: 0;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background: #16161a;
}
.dot-b { background: #f4f4f1; border: 2px solid #77777d; }
.key, .rm { margin: 0; font-size: 14px; color: #55555c; }
.rm { display: none; }
@media (prefers-reduced-motion: reduce) { .rm { display: block; } }`;

  const body = [
    '<header class="intro">',
    `  <p class="kicker">svg-scroll-draw ${escapeHtml(version)} · easing</p>`,
    `  <h1>${escapeHtml(heading)}</h1>`,
    `  <p>Scroll down. The next section is three screens tall and its stage stays put, so scrolling through it runs progress from 0 to 1. ${labelB ? 'Each line is' : 'The line is'} drawn by scrollDraw and ${labelB ? 'each dot' : 'the dot'} moved by scrollAnimate, with the easing named above it.</p>`,
    '</header>',
    '',
    '<section id="run" class="run">',
    '  <div class="stage">',
    '    <p class="read"><span>progress in</span><output id="in">0.000</output></p>',
    ...row('a', labelA).map((l) => `    ${l}`),
    ...(labelB ? row('b', labelB).map((l) => `    ${l}`) : []),
    '    <p class="key">Beside each name is the eased progress, and the dot shows it on a ruler marked 0 and 1. The library does not clamp it, so an easing that overshoots carries both past 1.</p>',
    '    <p class="rm">Your system asks for reduced motion, so svg-scroll-draw shows every line and dot finished.</p>',
    '  </div>',
    '</section>',
    '',
    '<footer class="end">',
    '  <p>The end of the run. Scroll back up and it plays backwards.</p>',
    '</footer>',
  ].join('\n');

  const script = `import { ${imports} } from '${cdnModule(version)}';

${a.decl}// #run's whole scroll is progress 0 to 1: from its top at the top of the
// window to its bottom at the bottom, while its stage stays pinned.
const run = document.querySelector('#run');
const trigger = { start: 'top top', end: 'bottom bottom' };

/** Row \`key\`: its line drawn by scrollDraw, its dot moved by scrollAnimate. */
function show(key, easing) {
  const out = document.querySelector(\`#out-\${key}\`);
  scrollDraw(run, {
    easing,
    trigger,
    selector: \`.ink-\${key}\`,
    // The eased progress, past 1 too.
    onProgress: (p) => { out.textContent = p.toFixed(3); },
  });
  // left 0% is 0 on the row's ruler and 100% is 1.
  scrollAnimate(\`#dot-\${key}\`, {
    props: { left: ['0%', '100%'] },
    easing,
    trigger,
    triggerElement: run,
  });
}

${a.note}show('a', ${a.value});${labelB ? `\nshow('b', ${labelB});` : ''}

// Progress in, for the readout: how far the scroll is through #run.
const input = document.querySelector('#in');
function readIn() {
  const box = run.getBoundingClientRect();
  input.textContent = Math.min(1, Math.max(0, -box.top / (box.height - innerHeight))).toFixed(3);
}
addEventListener('scroll', readIn, { passive: true });
readIn();`;

  return htmlFile({ slug: SLUG, title: `${heading} · ${TITLE}`, css, body, script });
}

const APP_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
main { max-width: 720px; margin: 0 auto; padding: 0 16px; }
.note { display: grid; align-content: center; min-height: 100vh; margin: 0; color: #55555c; }
.note code { font: 500 0.92em ${MONO}; color: #16161a; overflow-wrap: anywhere; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
path { fill: none; stroke: currentColor; stroke-width: 3; }
`;

/** The React project for StackBlitz: the React tab's Drawing, with a real line in it, and a page to scroll it on. */
export function reactProject(pick: Choice, params: Params, version: string): Omit<ReactProject, 'title'> {
  const svg = `      <svg viewBox="0 0 320 76" aria-hidden="true">
        <path d="${WAVE}" />
      </svg>`;
  return {
    slug: SLUG,
    app: `${drawingComponent(pick, params, svg)}

export default function App() {
  return (
    <main>
      <p className="note">
        <span>
          Scroll down. The line is drawn with <code>{${JSON.stringify(labelOf(pick, params))}}</code> from the moment
          its top enters at the bottom of the window to the moment its bottom leaves at the top: ScrollDraw’s default
          trigger.
        </span>
      </p>
      <Drawing />
      <p className="note">The end of the page. Scroll back up and it runs backwards.</p>
    </main>
  );
}
`,
    css: APP_CSS,
    version,
  };
}
