import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { WRAP_DEFAULTS, type WrapOptions } from './convert';

/**
 * The SVG to JSX converter's Run it: the preview's drawing as a page and the
 * component as a React project. Client-safe and React-free, so
 * scripts/test-tools.mjs can build the page the tool hands out and run it.
 */

export const SLUG = 'svg-to-jsx-converter';

/** Where the drawing finishes: trigger.end. The first is ScrollDraw's default. */
export const ENDS: readonly [string, string][] = [
  [WRAP_DEFAULTS.end, 'its bottom leaves the top'],
  ['center center', 'its middle reaches the middle'],
  ['bottom bottom', 'it is wholly in view'],
];

// ── Run it: the page and the project under the code ─────────────────────────

/**
 * The preview's drawing written out one element to a line. It is sanitizeSvg's
 * rebuild (drawing elements and plain values only), so nothing pasted reaches
 * the page; the preview's own class is left off.
 */
export function markup(el: Element, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== 'class')
    .map((a) => ` ${a.name}="${escapeHtml(a.value)}"`);
  const open = `${pad}<${el.localName}${attrs.join('')}`;
  const kids = Array.from(el.children);
  if (!kids.length) return `${open} />`;
  return [`${open}>`, ...kids.map((k) => markup(k, depth + 1)), `${pad}</${el.localName}>`].join('\n');
}

const indent = (s: string, n: number) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/** CoffeeCup → coffee-cup, for the file name. */
export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();

export const runTitle = (name: string, w: WrapOptions | null) => (w ? `${name} drawn on scroll` : name);

/** What the page says above the drawing. */
function runIntro(w: WrapOptions | null): string {
  if (!w) return 'The drawing as the converter’s preview shows it: its paths and shapes.';
  return `Scroll down: the drawing draws as it passes through the window${w.once ? ' and stays drawn' : ', and undraws as you scroll back up'}.`;
}

/** What the page says under it: the trigger, in words. */
function runOutro(name: string, w: WrapOptions): string {
  const end = ENDS.find(([v]) => v === w.end)?.[1] ?? `its trigger.end (${w.end}) is reached`;
  return `These are the options ScrollDraw gets in ${name}: it starts as the drawing’s top comes up past the bottom of the window and finishes when ${end}${w.stagger ? ', each shape a little after the one before' : ''}.`;
}

/** scrollDraw's options for the ones the component's ScrollDraw is given (wrapProps, as JavaScript). */
function drawOptions(w: WrapOptions): string[] {
  const d = WRAP_DEFAULTS;
  const out: string[] = [];
  if (w.easing !== d.easing) out.push(`easing: '${w.easing}'`);
  if (w.stagger !== d.stagger) out.push(`stagger: ${w.stagger}`);
  if (w.once !== d.once) out.push('once: true');
  if (w.end !== d.end) out.push(`trigger: { end: '${w.end}' }`);
  if (w.fillFade !== d.fillFade) out.push('fillOpacity: [0, 1]');
  return out;
}

const BASE_CSS = `body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
svg {
  display: block;
  width: min(100% - 48px, 560px);
  height: auto;
  max-height: 80vh;
  margin: 0 auto;
}`;
/**
 * Drawn on scroll: a screen above the drawing, so it starts undrawn, and more
 * than a screen below, since the default trigger ends when the drawing's
 * bottom leaves the top of the window and a stagger ends the later shapes
 * after that. Still: one screen, the drawing in the middle.
 */
const runCss = (scroll: boolean) => `${BASE_CSS}
${scroll ? `.intro, .outro {
  display: grid;
  place-content: center;
  min-height: 100vh;
  padding: 0 24px;
  text-align: center;
}
.outro { min-height: 150vh; }` : `.still {
  display: grid;
  align-content: center;
  gap: 16px;
  min-height: 100vh;
  padding: 24px 0;
  text-align: center;
}
.still h1, .still p { margin: 0 24px; }`}`;

/** The preview's drawing as a page: drawn by scrollDraw with the code's options when the wrap is on. */
export function htmlPage(name: string, svg: string, w: WrapOptions | null, version: string): string {
  const title = escapeHtml(runTitle(name, w));
  const intro = escapeHtml(runIntro(w));
  if (!w) {
    return htmlFile({
      slug: SLUG,
      title: runTitle(name, w),
      css: runCss(false),
      body: ['<main class="still">', `  <h1>${title}</h1>`, `  <p>${intro}</p>`, '  <div id="drawing">', indent(svg, 4), '  </div>', '</main>'].join('\n'),
    });
  }
  const opts = drawOptions(w);
  return htmlFile({
    slug: SLUG,
    title: runTitle(name, w),
    css: runCss(true),
    body: [
      '<header class="intro">',
      `  <h1>${title}</h1>`,
      `  <p>${intro}</p>`,
      '</header>',
      '<div id="drawing">',
      indent(svg, 2),
      '</div>',
      '<footer class="outro">',
      `  <p>${escapeHtml(runOutro(name, w))}</p>`,
      '</footer>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      `// The options <ScrollDraw> gets in ${name}, on the drawing the converter's preview shows.`,
      opts.length ? `scrollDraw('#drawing', {\n${opts.map((o) => `  ${o},`).join('\n')}\n});` : `scrollDraw('#drawing');`,
    ].join('\n'),
  });
}

/** The component as the code tab writes it, in JavaScript, and a page that renders it, as a Vite project. */
export function reactProject(name: string, js: string, w: WrapOptions | null, version: string): Omit<ReactProject, 'title'> {
  // The component may be called App itself.
  const host = name === 'App' ? 'Demo' : 'App';
  const page = w
    ? [
      '    <main>',
      '      <header className="intro">',
      `        <h1>${runTitle(name, w)}</h1>`,
      `        <p>${runIntro(w)}</p>`,
      '      </header>',
      `      <${name} />`,
      '      <footer className="outro">',
      `        <p>${runOutro(name, w)}</p>`,
      '      </footer>',
      '    </main>',
    ]
    : [
      '    <main className="still">',
      `      <h1>${name}</h1>`,
      `      <${name} />`,
      '    </main>',
    ];
  const app = [js.trimEnd(), '', `export default function ${host}() {`, '  return (', ...page, '  );', '}', ''].join('\n');
  return { slug: SLUG, app, css: withSource(runCss(!!w), SLUG, 'css'), version };
}
