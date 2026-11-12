import type { ScrollTextOptions } from 'svg-scroll-draw/text';
import { TEXT_DEFAULTS, TEXT_EFFECTS, type TextFrom, type TextSplit } from '@/data/text-effects';
import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';

/**
 * What the text animation generator writes, from its settings: the JavaScript
 * and React listings (source line on top), a complete page that runs the same
 * scrollText call from jsDelivr, and the same component as a Vite + React
 * project. Every option at scrollText's default is left out of the code.
 */

export const SLUG = 'text-animation-generator';
export const TITLE = 'Text animation';

export type Settings = { text: string; split: TextSplit; effect: string; stagger: number; easing: string; once: boolean };

const fromOf = (s: Settings): TextFrom => TEXT_EFFECTS.find((e) => e.key === s.effect)?.from ?? TEXT_DEFAULTS.from;

/** The options the preview passes to scrollText: all of them, defaults included. */
export function optionsOf(s: Settings): ScrollTextOptions {
  return { split: s.split, stagger: s.stagger, easing: s.easing as ScrollTextOptions['easing'], from: fromOf(s), once: s.once };
}

/** The options that differ from scrollText's defaults, as code lines. */
function changed(s: Settings): string[] {
  const from = fromOf(s);
  const out: string[] = [];
  if (s.split !== TEXT_DEFAULTS.split) out.push(`split: '${s.split}'`);
  if (s.stagger !== TEXT_DEFAULTS.stagger) out.push(`stagger: ${s.stagger}`);
  if (s.easing !== TEXT_DEFAULTS.easing) out.push(`easing: '${s.easing}'`);
  if (!sameFrom(from, TEXT_DEFAULTS.from)) out.push(`from: ${fromLiteral(from)}`);
  if (s.once !== TEXT_DEFAULTS.once) out.push(`once: ${s.once}`);
  return out;
}

const sameFrom = (a: TextFrom, b: TextFrom) => JSON.stringify(a) === JSON.stringify(b);
const fromLiteral = (f: TextFrom) => `{ ${Object.entries(f).map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
/** The text as the code writes it: no characters that would break the JSX. */
const text = (s: Settings) => (s.text || 'Your text').replace(/[<>{}]/g, '');

/** The import and the scrollText call, the import from `from`. */
function jsBody(s: Settings, from: string): string {
  const opts = changed(s);
  const call = opts.length
    ? `scrollText('#headline', {\n${opts.map((o) => `  ${o},`).join('\n')}\n});`
    : `scrollText('#headline');`;
  return `import { scrollText } from '${from}';\n\n${call}`;
}

/** The JavaScript tab. */
export const jsCode = (s: Settings) =>
  withSource(`// <h2 id="headline">${text(s)}</h2>\n\n${jsBody(s, 'svg-scroll-draw/text')}`, SLUG, 'js');

/** The Headline component, without the source line. */
function component(s: Settings): string {
  const opts = changed(s).map((o) => {
    const [k, ...rest] = o.split(': ');
    const v = rest.join(': ');
    return v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`;
  });
  const props = ['as="h2"', ...opts];
  return `import { ScrollText } from 'svg-scroll-draw/react';

export function Headline() {
  return (
    <ScrollText
${props.map((p) => `      ${p}`).join('\n')}
    >
      ${text(s)}
    </ScrollText>
  );
}`;
}

/** The React tab. */
export const reactCode = (s: Settings) => withSource(component(s), SLUG, 'tsx');

/**
 * The page around the heading in the runnable files: a screen above it and
 * one below, so the heading crosses the whole trigger window (its top from
 * 85% of the window to 40%) as you scroll.
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

h2 {
  margin: 0;
  font-size: clamp(2rem, 7vw, 4rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}`;

/** A complete page running the JavaScript tab's call, the library from jsDelivr. */
export function runnableHtml(s: Settings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: TITLE,
    css: PAGE_CSS,
    body: [
      '<main>',
      '  <p class="hint">Scroll down ↓</p>',
      `  <h2 id="headline">${escapeHtml(text(s))}</h2>`,
      '  <p class="after">The end.</p>',
      '</main>',
    ].join('\n'),
    script: jsBody(s, cdnModule(version, 'text')),
  });
}

/** The React tab's component in a page of the same shape, as a Vite project. */
export function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const app = [
    component(s),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <p className="hint">Scroll down ↓</p>',
    '      <Headline />',
    '      <p className="after">The end.</p>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
  return { slug: SLUG, app, css: `${PAGE_CSS}\n`, version };
}
