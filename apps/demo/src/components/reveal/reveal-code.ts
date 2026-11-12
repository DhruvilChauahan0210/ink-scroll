import type { ScrollRevealOptions } from 'svg-scroll-draw/reveal';
import { cdnModule, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { REVEAL_DEFAULTS, type RevealEasing } from '@/data/reveal';

/**
 * Everything the scroll reveal generator writes, from one options object with
 * every default left out (RevealGenerator's revealOptions):
 *
 * - jsCode and reactCode: the two code tabs, each with the source line.
 * - revealHtml: a complete page running the same call on nine cards, the
 *   library loaded from jsDelivr, for Download and Open in StackBlitz.
 * - reactProject: the component as plain JSX inside an App, for the React
 *   project on StackBlitz.
 */

export const SLUG = 'scroll-reveal-generator';
/** The parent perspective offered for flip and flipX, in px. */
export const PERSPECTIVE = 800;
/** Cards in the preview box, and in the page and the App the export writes. */
export const CARDS = 9;

const D = REVEAL_DEFAULTS;

/** The once: true easings whose look changed in 2.23.3 (see RevealGenerator's comment). */
export const ONCE_CHANGED: RevealEasing[] = ['spring', 'elastic', 'bounce'];

const onceNote = (o: ScrollRevealOptions) =>
  (o.once ?? D.once) && ONCE_CHANGED.includes((typeof o.easing === 'string' ? o.easing : D.easing) as RevealEasing);

function optionLines(o: ScrollRevealOptions): string[] {
  const out: string[] = [];
  if (o.preset) out.push(`preset: '${o.preset}'`);
  if (o.from) out.push(`from: { ${Object.entries(o.from).map(([k, v]) => `${k}: ${v}`).join(', ')} }`);
  if (o.stagger !== undefined) out.push(`stagger: ${o.stagger}`);
  if (typeof o.easing === 'string') out.push(`easing: '${o.easing}'`);
  if (o.once !== undefined) out.push(`once: ${o.once}`);
  if (o.trigger) out.push(`trigger: { ${Object.entries(o.trigger).map(([k, v]) => `${k}: '${v}'`).join(', ')} }`);
  return out;
}

const block = (lines: string[], indent: string) =>
  lines.length ? `, {\n${lines.map((l) => `${indent}  ${l},`).join('\n')}\n${indent}}` : '';

/** For spring, elastic and bounce with once: true, whose look changed in 2.23.3. */
const onceLine = (o: ScrollRevealOptions) =>
  `// ${o.easing} with once: true needs 2.23.3 or later: 2.23.2 and earlier ${
    o.easing === 'bounce' ? 'drop its dips' : 'stop it past its place'
  }.\n`;

/** The import and the call: the JS tab's code, and the downloaded page's script. */
const jsBody = (o: ScrollRevealOptions, from: string) => `import { scrollReveal } from '${from}';

${onceNote(o) ? onceLine(o) : ''}scrollReveal('.card'${block(optionLines(o), '')});`;

/** The JavaScript tab. */
export function jsCode(o: ScrollRevealOptions, depth: boolean): string {
  const css = depth ? `\n// CSS: .cards { perspective: ${PERSPECTIVE}px; } gives the flip its depth` : '';
  return withSource(
    `// <div class="cards">
//   <article class="card">…</article>
//   <article class="card">…</article>
// </div>${css}

${jsBody(o, 'svg-scroll-draw/reveal')}`,
    SLUG,
    'js',
  );
}

/** The Cards component, typed for the React tab or plain JSX for the StackBlitz App. */
function reactComponent(o: ScrollRevealOptions, depth: boolean, ts: boolean): string {
  const style = depth ? ` style={{ perspective: ${PERSPECTIVE} }}` : '';
  return `import { useEffect, useRef } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';
${onceNote(o) ? `\n${onceLine(o).trimEnd()}` : ''}
export function Cards(${ts ? '{ items }: { items: { id: string; title: string }[] }' : '{ items }'}) {
  const ref = useRef${ts ? '<HTMLDivElement>' : ''}(null);

  useEffect(() => {
    if (!ref.current) return;
    const reveal = scrollReveal(ref.current.querySelectorAll('.card')${block(optionLines(o), '    ')});
    return () => reveal.destroy();
  }, [items]);

  return (
    <div ref={ref} className="cards"${style}>
      {items.map((item) => (
        <article key={item.id} className="card">{item.title}</article>
      ))}
    </div>
  );
}`;
}

/** The React tab: a client component for the App Router or any React app. */
export function reactCode(o: ScrollRevealOptions, depth: boolean): string {
  return withSource(`'use client';\n\n${reactComponent(o, depth, true)}`, SLUG, 'tsx');
}

// ── Runnable files ───────────────────────────────────────────────────────────

/**
 * The page around the cards: a screen of room above, so every card starts
 * below the start line, and a screen below, so the last row can reach an end
 * line at the very top.
 */
const PAGE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
.spacer {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  color: #6b6b70;
}
.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
}
@media (max-width: 559px) {
  .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.card {
  min-height: 160px;
  padding: 20px;
  border: 1px solid #d6d6d0;
  background: #fff;
  font-weight: 600;
}`;

/** A complete page running the JS tab's call on nine cards, the library from jsDelivr. */
export function revealHtml(o: ScrollRevealOptions, depth: boolean, version: string): string {
  const cards = Array.from({ length: CARDS }, (_, i) => `  <article class="card">Card ${i + 1}</article>`);
  return htmlFile({
    slug: SLUG,
    title: 'Scroll reveal',
    css: depth ? `${PAGE_CSS}\n/* Gives the flip its depth. */\n.cards { perspective: ${PERSPECTIVE}px; }` : PAGE_CSS,
    body: ['<div class="spacer">Scroll down</div>', '', '<div class="cards">', ...cards, '</div>', '', '<div class="spacer">End of the page</div>'].join('\n'),
    script: jsBody(o, cdnModule(version, 'reveal')),
  });
}

/** The React project for StackBlitz: the same component in plain JSX, and a page to scroll it in. */
export function reactProject(o: ScrollRevealOptions, depth: boolean, version: string): Omit<ReactProject, 'title'> {
  return {
    slug: SLUG,
    app: `${reactComponent(o, depth, false)}

const ITEMS = Array.from({ length: ${CARDS} }, (_, i) => ({ id: String(i + 1), title: \`Card \${i + 1}\` }));

export default function App() {
  return (
    <>
      <div className="spacer">Scroll down</div>
      <Cards items={ITEMS} />
      <div className="spacer">End of the page</div>
    </>
  );
}
`,
    css: `${PAGE_CSS}\n`,
    version,
  };
}
