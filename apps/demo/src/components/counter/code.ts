import {
  COUNTER_DEFAULTS, COUNTER_TRIGGERS, formatExpr, formatPlan, formatterOf, intlLiteral, lit, parseNumber,
  type CounterNumber, type CounterSettings, type CounterTrigger, type FormatPlan,
} from '@/data/counter';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * What the animated counter generator writes, from its settings: the
 * JavaScript and React listings (source line on top), a complete page that
 * runs the same scrollCounter call from jsDelivr, and the same component as a
 * Vite + React project. Every option at scrollCounter's default is left out of
 * the code.
 *
 * No React and no DOM here: the generator imports it, and so can a test that
 * runs what it writes.
 */

export const SLUG = 'counter-animation-generator';
export const TITLE = 'Animated counter';

// ── Settings → numbers ───────────────────────────────────────────────────────

export type Resolved = { from: number; to: number; plan: FormatPlan; fmt: (n: number) => string };

export function resolve(s: CounterNumber): Resolved {
  const plan = formatPlan(s);
  return { from: parseNumber(s.from) ?? 0, to: parseNumber(s.to) ?? 0, plan, fmt: formatterOf(plan) };
}

export const triggerOf = (k: CounterTrigger) => COUNTER_TRIGGERS.find((t) => t.key === k) ?? COUNTER_TRIGGERS[0];

// ── The code ─────────────────────────────────────────────────────────────────

/** The options that differ from scrollCounter's defaults (`to` has none), as `key: value` pairs. */
function changed(s: CounterSettings, r: Resolved): [string, string][] {
  const out: [string, string][] = [];
  if (r.from !== COUNTER_DEFAULTS.from) out.push(['from', String(r.from)]);
  out.push(['to', String(r.to)]);
  if (r.plan.kind === 'decimals') out.push(['decimals', String(r.plan.decimals)]);
  if (r.plan.kind === 'format') out.push(['format', `(n) => ${formatExpr(r.plan)}`]);
  if (s.easing !== COUNTER_DEFAULTS.easing) out.push(['easing', lit(s.easing)]);
  const t = triggerOf(s.trigger);
  if (t.start !== COUNTER_DEFAULTS.start || t.end !== COUNTER_DEFAULTS.end) {
    out.push(['trigger', `{ start: ${lit(t.start)}, end: ${lit(t.end)} }`]);
  }
  if (s.once !== COUNTER_DEFAULTS.once) out.push(['once', String(s.once)]);
  return out;
}

const SR_NOTE = '// sr-only hides the copy from sight, not from screen readers (Tailwind has the class).';

function formatter(r: Resolved): string {
  if (r.plan.kind !== 'format') return '';
  const zero = r.plan.zero === undefined ? '' : `// Close to zero, Intl.NumberFormat prints -0: those show as 0.\n`;
  return `const nf = new Intl.NumberFormat(${lit(r.plan.locale)}, ${intlLiteral(r.plan.intl)});\n${zero}\n`;
}

/** The import and the scrollCounter call, the import from `from`. */
function jsBody(s: CounterSettings, r: Resolved, from: string): string {
  const opts = changed(s, r).map(([k, v]) => `  ${k}: ${v},`).join('\n');
  return `import { scrollCounter } from '${from}';

${formatter(r)}scrollCounter('#stat', {
${opts}
});`;
}

/** The JavaScript tab: the markup it runs on, as comments, then the call. */
export function jsCode(s: CounterSettings, r: Resolved): string {
  const final = r.fmt(r.to);
  const markup = s.srCopy
    ? `// <span class="sr-only">${final}</span>\n// <span id="stat" aria-hidden="true">${final}</span>\n${SR_NOTE}`
    : `// <span id="stat">${final}</span>`;
  return withSource(`${markup}\n\n${jsBody(s, r, 'svg-scroll-draw')}`, SLUG, 'js');
}

/**
 * The Stat component, without the source line. `next` adds the 'use client'
 * the Next.js App Router needs when a function is passed as a prop; a Vite
 * project has no server components and leaves it out.
 */
function component(s: CounterSettings, r: Resolved, next: boolean): string {
  const props = changed(s, r).map(([k, v]) => (v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`));
  const client = next && r.plan.kind === 'format'
    ? `'use client';\n// format is a function, so in the Next.js App Router this is a client component.\n\n`
    : '';
  const counter = (pad: string, extra: string[]) =>
    `${pad}<ScrollCounter\n${[...extra, ...props].map((p) => `${pad}  ${p}`).join('\n')}\n${pad}/>`;
  const body = s.srCopy
    ? `    <>
      <span className="sr-only">${r.fmt(r.to)}</span>
${counter('      ', ['aria-hidden="true"'])}
    </>`
    : counter('    ', []);
  return `${client}import { ScrollCounter } from 'svg-scroll-draw/react';

${formatter(r)}${s.srCopy ? `${SR_NOTE}\n` : ''}export function Stat() {
  return (
${body}
  );
}`;
}

/** The React tab. */
export const reactCode = (s: CounterSettings, r: Resolved) => withSource(component(s, r, true), SLUG, 'tsx');

// ── Run it ───────────────────────────────────────────────────────────────────

/**
 * The page around the number in the runnable files: a screen above it and one
 * below, so the number crosses every trigger window the generator offers (its
 * top from the bottom of the window, or 80% of it, up to 20%) as you scroll.
 * The number's padding keeps the top of its text, which sits a little above
 * its line, below the window at load, so a count that starts at 'top bottom'
 * starts on `from`. Every digit is the same width, so the number does not
 * jitter as it counts.
 */
const PAGE_CSS = `:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

main {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.hint,
.after {
  display: grid;
  place-items: center;
  height: 100vh;
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.6;
}

.stat {
  margin: 0;
  padding: 0.25em 0;
  font-size: clamp(3rem, 12vw, 6rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}`;

const SR_CSS = `

/* Out of sight, still read by screen readers. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`;

const pageCss = (s: CounterSettings) => PAGE_CSS + (s.srCopy ? SR_CSS : '');

/** A complete page running the JavaScript tab's call, the library from jsDelivr. */
export function runnableHtml(s: CounterSettings, r: Resolved, version: string): string {
  const final = escapeHtml(r.fmt(r.to));
  const stat = s.srCopy
    ? [
        '  <p class="stat">',
        `    <span class="sr-only">${final}</span>`,
        `    <span id="stat" aria-hidden="true">${final}</span>`,
        '  </p>',
      ]
    : [`  <p class="stat"><span id="stat">${final}</span></p>`];
  return htmlFile({
    slug: SLUG,
    title: TITLE,
    css: pageCss(s),
    body: ['<main>', '  <p class="hint">Scroll down ↓</p>', ...stat, '  <p class="after">The end.</p>', '</main>'].join('\n'),
    script: jsBody(s, r, cdnModule(version)),
  });
}

/** The React tab's component in a page of the same shape, as a Vite project. */
export function reactProject(s: CounterSettings, r: Resolved, version: string): Omit<ReactProject, 'title'> {
  const app = [
    component(s, r, false),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <p className="hint">Scroll down ↓</p>',
    '      <p className="stat">',
    '        <Stat />',
    '      </p>',
    '      <p className="after">The end.</p>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
  return { slug: SLUG, app, css: `${pageCss(s)}\n`, version };
}
