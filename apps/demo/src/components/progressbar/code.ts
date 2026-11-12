/**
 * The scroll progress bar generator's code, in one place: the page's tables,
 * the preview's stylesheet, the listings visitors copy and the page the export
 * row runs are all written by these functions, so what the preview runs is what
 * the code says.
 *
 * Two engines write the same bar:
 *
 * - 'css': no JavaScript. The bar's transform (or the ring's dash offset) is a
 *   CSS animation on a scroll timeline: scroll(root block) for the whole page,
 *   a named view timeline on the article for one article.
 * - 'js': scrollProgress from svg-scroll-draw/progress writes the progress
 *   into --scroll-progress on the target, and the bar's CSS reads it.
 *
 * Every scrollProgress option here is one that differs from its default
 * (packages/svg-scroll-draw/src/progress/index.ts, the destructuring in
 * scrollProgress): the trigger, because the default window ('top bottom' to
 * 'bottom top') starts before the page has scrolled at all, and easedVariable,
 * because the bar only reads the raw value.
 */

import { cdnModule, escapeHtml, htmlFile, type ReactProject } from '@/lib/tool-export';

/** The tool's slug, for the source line on everything it writes. */
export const TOOL_SLUG = 'scroll-progress-bar-generator';

export type BarStyle = 'top' | 'bottom' | 'left' | 'ring';
export type Scope = 'page' | 'article';
export type Engine = 'css' | 'js';
export type Settings = {
  style: BarStyle;
  /** Bar height (top, bottom), width (left) or ring stroke, in px. */
  thickness: number;
  /** A faint full-length track behind the fill. */
  track: boolean;
  scope: Scope;
  /** Any CSS colour; null leaves the bar in currentColor. */
  color: string | null;
};

export const STYLES: { k: BarStyle; d: string }[] = [
  { k: 'top', d: 'A line across the top of the window, filling left to right. The usual reading progress bar.' },
  { k: 'bottom', d: 'The same line along the bottom edge, out of the way of a sticky header.' },
  { k: 'left', d: 'A line down the left edge, filling top to bottom, the way the page moves.' },
  { k: 'ring', d: 'A circle in the corner whose stroke closes as you read: stroke-dashoffset, not a transform.' },
];

export const SCOPES: { k: Scope; d: string }[] = [
  { k: 'page', d: '0 at the top of the page, 1 at the very bottom.' },
  { k: 'article', d: '0 when the article’s top reaches the top of the window, 1 when its bottom reaches the bottom.' },
];

/** What the generator writes, one tab each. */
export const OUTPUTS = ['CSS only', 'JavaScript', 'React'] as const;

export const DEFAULTS: Settings = { style: 'top', thickness: 4, track: false, scope: 'page', color: null };
export const THICKNESS = { min: 1, max: 12 } as const;

/** scrollProgress's own defaults, as its destructuring sets them (progress/index.ts). */
export const LIB_DEFAULTS = {
  variable: '--scroll-progress',
  easedVariable: '--scroll-progress-eased',
  start: 'top bottom',
  end: 'bottom top',
  easing: 'linear',
  speed: 1,
  axis: 'y',
} as const;

/** The window the bar fills over: the target's top at the window's top, to its bottom at the window's bottom. */
export const TRIGGER = { start: 'top top', end: 'bottom bottom' } as const;

/** The ring: a 48px square, 24px from the corner. Its radius leaves room for the stroke. */
export const RING = { size: 48, inset: 24 } as const;

export function ringGeometry(thickness: number): { r: number; c: number } {
  const r = (RING.size - thickness) / 2;
  // Rounded up, so a dash this long always covers the whole circle.
  const c = Math.ceil(2 * Math.PI * r * 100) / 100;
  return { r, c };
}

/** Class names and timelines. The page copies OUTPUT; the preview runs the same CSS under its own names. */
export type Names = {
  /** Class prefix: `${cls}-bar`, `${cls}-ring`, `${cls}-ring-fill`… */
  cls: string;
  /** Prepended to every selector, to scope the preview's copy. */
  scope: string;
  /** The article's selector. */
  article: string;
  /** Prefix for @keyframes names. */
  keyframes: string;
  /** What the whole-page bar's animation-timeline is. */
  pageTimeline: string;
  /** The article's view-timeline name. */
  articleTimeline: string;
};

export const OUTPUT: Names = {
  cls: 'progress',
  scope: '',
  article: 'article',
  keyframes: 'progress',
  pageTimeline: 'scroll(root block)',
  articleTimeline: '--article',
};

/**
 * The preview's copy of the same CSS. Its scroll box stands in for the window:
 * the box is named --pbg-root, since scroll(root) would follow this page.
 */
export const PREVIEW: Names = {
  cls: 'pbg-x',
  scope: '.site .pbg-frame ',
  article: '.pbg-x-article',
  keyframes: 'pbg-x',
  pageTimeline: '--pbg-root',
  articleTimeline: '--pbg-x-article',
};

/** A colour safe to write into a stylesheet: no way out of the declaration. */
export const isSafeColor = (v: string) => /^[#a-zA-Z0-9(),.%\s/+-]{1,64}$/.test(v);

// ── CSS ──────────────────────────────────────────────────────────────────────

/** A declaration: property, value and an optional comment after it. */
type Decl = [string, string, string?];

function rule(selector: string, decls: Decl[], indent = ''): string {
  const body = decls.map(([k, v, note]) => `${indent}  ${k}: ${v};${note ? ` /* ${note} */` : ''}`).join('\n');
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

/** Where the bar sits, as declarations. */
function placement(s: Settings): Decl[] {
  const t = `${s.thickness}px`;
  if (s.style === 'top') return [['position', 'fixed'], ['top', '0'], ['left', '0'], ['right', '0'], ['z-index', '1000'], ['height', t]];
  if (s.style === 'bottom') return [['position', 'fixed'], ['bottom', '0'], ['left', '0'], ['right', '0'], ['z-index', '1000'], ['height', t]];
  if (s.style === 'left') return [['position', 'fixed'], ['top', '0'], ['bottom', '0'], ['left', '0'], ['z-index', '1000'], ['width', t]];
  const px = `${RING.size}px`;
  return [
    ['position', 'fixed'], ['right', `${RING.inset}px`], ['bottom', `${RING.inset}px`], ['z-index', '1000'],
    ['width', px], ['height', px],
  ];
}

const colorDecl = (s: Settings): Decl[] => (s.color ? [['color', s.color]] : []);
const vertical = (s: Settings) => s.style === 'left';
const origin = (s: Settings): Decl => ['transform-origin', vertical(s) ? '50% 0' : '0 50%'];
const scale = (s: Settings, v: string) => (vertical(s) ? `scaleY(${v})` : `scaleX(${v})`);

/**
 * The animation longhands for the CSS engine. Longhands, as the library's own
 * fast path writes them. `empty` is the fill's own resting value, the first
 * keyframe: on a page too short to scroll the timeline is inactive and the
 * animation applies nothing, and without it the bar showed full (measured in
 * Chromium 158, Firefox 159 and WebKit 27.2).
 */
function animation(s: Settings, n: Names, name: string, empty: Decl): Decl[] {
  const out: Decl[] = [
    [empty[0], empty[1], 'empty while there is nothing to scroll'],
    ['animation-name', name],
    ['animation-duration', 'auto'],
    ['animation-timing-function', 'linear'],
    ['animation-fill-mode', 'both'],
  ];
  if (s.scope === 'page') out.push(['animation-timeline', n.pageTimeline]);
  else out.push(['animation-timeline', n.articleTimeline], ['animation-range', 'contain 0% contain 100%']);
  return out;
}

/** The stylesheet for one engine. */
export function css(s: Settings, engine: Engine, n: Names = OUTPUT): string {
  const sel = (part: string) => `${n.scope}.${n.cls}-${part}`;
  const art = `${n.scope}${n.article}`;
  const isCss = engine === 'css';
  const blocks: string[] = [];
  const ind = isCss ? '  ' : '';
  const variable = `var(${LIB_DEFAULTS.variable}, 0)`;

  if (s.style === 'ring') {
    const { c } = ringGeometry(s.thickness);
    const ringName = `${n.keyframes}-ring`;
    blocks.push(rule(sel('ring'), [
      ...placement(s),
      ...(isCss ? [['display', 'block'] as Decl] : []),
      ...colorDecl(s),
      ['transform', 'rotate(-90deg)', 'start at twelve o’clock'],
      ['pointer-events', 'none'],
    ], ind));
    blocks.push(rule(`${sel('ring')} circle`, [['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', `${s.thickness}px`]], ind));
    if (s.track) blocks.push(rule(sel('ring-track'), [['opacity', '0.15']], ind));
    blocks.push(rule(sel('ring-fill'), [
      ['stroke-dasharray', `${c}px`, '2π × r, the circle’s length'],
      ...(isCss
        ? animation(s, n, ringName, ['stroke-dashoffset', `${c}px`])
        : [['stroke-dashoffset', `calc(${c}px * (1 - ${variable}))`] as Decl]),
    ], ind));
    if (isCss) {
      if (s.scope === 'article') blocks.unshift(rule(art, [['view-timeline-name', n.articleTimeline], ['view-timeline-axis', 'block']], ind));
      return [
        '/* Hidden where the browser has no scroll-driven animations. */',
        rule(sel('ring'), [['display', 'none']]),
        '',
        `@supports ${supports(s)} {\n${blocks.join('\n\n')}\n}`,
        '',
        `@keyframes ${ringName} {\n  from { stroke-dashoffset: ${c}px; }\n  to { stroke-dashoffset: 0; }\n}`,
      ].join('\n');
    }
    return blocks.join('\n\n');
  }

  const grow = `${n.keyframes}-grow`;
  const fill: Decl[] = isCss
    ? [origin(s), ...animation(s, n, grow, ['transform', scale(s, '0')])]
    : [origin(s), ['transform', scale(s, variable)]];

  if (s.track) {
    blocks.push(rule(sel('bar'), [...placement(s), ...colorDecl(s), ['pointer-events', 'none']], ind));
    blocks.push(rule(`${sel('bar')}::before,\n${ind}${sel('bar')}::after`, [
      ['content', "''"], ['position', 'absolute'], ['inset', '0'], ['background', 'currentColor'],
    ], ind));
    blocks.push(rule(sel('bar') + '::before', [['opacity', '0.15']], ind).replace('{', '{ /* the track */'));
    blocks.push(rule(sel('bar') + '::after', fill, ind));
  } else {
    blocks.push(rule(sel('bar'), [
      ...placement(s), ...colorDecl(s), ['background', 'currentColor'], ...fill, ['pointer-events', 'none'],
    ], ind));
  }

  if (!isCss) return blocks.join('\n\n');
  if (s.scope === 'article') blocks.unshift(rule(art, [['view-timeline-name', n.articleTimeline], ['view-timeline-axis', 'block']], ind));
  return [
    '/* No bar where the browser has no scroll-driven animations:',
    '   the empty element takes no space and shows nothing. */',
    `@supports ${supports(s)} {\n${blocks.join('\n\n')}\n}`,
    '',
    `@keyframes ${grow} {\n  from { transform: ${scale(s, '0')}; }\n  to { transform: ${scale(s, '1')}; }\n}`,
  ].join('\n');
}

/** The feature test for the CSS engine: a scroll() timeline, or a named view timeline for the article. */
export const supports = (s: Settings) =>
  s.scope === 'page' ? '(animation-timeline: scroll())' : '(animation-timeline: view()) and (view-timeline-name: --x)';

// ── Markup ───────────────────────────────────────────────────────────────────

function ringMarkup(s: Settings, jsx: boolean, indent: string): string {
  const { r } = ringGeometry(s.thickness);
  const c = RING.size / 2;
  const attr = jsx ? 'className' : 'class';
  const circle = (part: string) => `${indent}  <circle ${attr}="progress-ring-${part}" cx="${c}" cy="${c}" r="${r}" />`;
  const size = `width="${RING.size}" height="${RING.size}" viewBox="0 0 ${RING.size} ${RING.size}"`;
  return [
    `${indent}<svg ${attr}="progress-ring" ${size} aria-hidden="true">`,
    ...(s.track ? [circle('track')] : []),
    circle('fill'),
    `${indent}</svg>`,
  ].join('\n');
}

function indicator(s: Settings, jsx: boolean, indent: string): string {
  if (s.style === 'ring') return ringMarkup(s, jsx, indent);
  return jsx
    ? `${indent}<div className="progress-bar" aria-hidden="true" />`
    : `${indent}<div class="progress-bar" aria-hidden="true"></div>`;
}

/** The comment over the markup: where the bar goes, and why. */
function where(s: Settings, engine: Engine): string {
  if (s.scope === 'page') return '<!-- Anywhere in <body>: it is fixed to the window. -->';
  // A named view timeline is visible only to the element and what is inside it;
  // the variable is inherited the same way.
  const why = engine === 'css' ? 'so it can use the article’s view timeline' : `so it inherits ${LIB_DEFAULTS.variable}`;
  return `<!-- Inside the article, ${why}. -->`;
}

export function html(s: Settings, engine: Engine = 'js'): string {
  if (s.scope === 'page') return `${where(s, engine)}\n${indicator(s, false, '')}`;
  return `${where(s, engine)}
<article>
${indicator(s, false, '  ')}
  <h1>Your article</h1>
  <p>…</p>
</article>`;
}

// ── Script ───────────────────────────────────────────────────────────────────

function options(indent: string): string {
  return [
    `${indent}trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },`,
    `${indent}easedVariable: null, // the bar only reads the raw value`,
  ].join('\n');
}

/** main.js. `from` is where scrollProgress is imported from: the package, or jsDelivr in the downloaded page. */
export function js(s: Settings, from = 'svg-scroll-draw/progress'): string {
  if (s.scope === 'page') {
    return `import { scrollProgress } from '${from}';

// 0 at the top of the page, 1 at the bottom, written to
// ${LIB_DEFAULTS.variable} on <html>; the bar’s CSS reads it.
scrollProgress(document.documentElement, {
${options('  ')}
});`;
  }
  return `import { scrollProgress } from '${from}';

// 0 when the article’s top reaches the top of the window, 1 when its
// bottom reaches the bottom. The bar inside it inherits ${LIB_DEFAULTS.variable}.
scrollProgress('article', {
${options('  ')}
});`;
}

/**
 * The client component. `ts` false is the same component for the Vite project
 * the export row opens: plain JSX, no 'use client', and no stylesheet import,
 * since that project imports its one stylesheet in main.jsx.
 */
export function react(s: Settings, ts = true): string {
  const head = ts ? `'use client';\n\n` : '';
  const sheet = ts ? `import './progress.css';\n` : '';
  const jsxIndent = s.style === 'ring' ? '    ' : '';
  if (s.scope === 'page') {
    const ret = s.style === 'ring'
      ? `  return (\n${indicator(s, true, jsxIndent)}\n  );`
      : `  return ${indicator(s, true, '').trim()};`;
    return `${head}import { useEffect } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';
${sheet}
/** Render it once, ${ts ? 'e.g. in app/layout.tsx' : 'at the top of the app'}. */
export function ReadingProgress() {
  useEffect(() => {
    const progress = scrollProgress(document.documentElement, {
${options('      ')}
    });
    return () => progress.destroy();
  }, []);

${ret}
}`;
  }
  return `${head}import { useEffect, useRef${ts ? ', type ReactNode' : ''} } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';
${sheet}
export function Article({ children }${ts ? ': { children: ReactNode }' : ''}) {
  const ref = useRef${ts ? '<HTMLElement>' : ''}(null);

  useEffect(() => {
    if (!ref.current) return;
    const progress = scrollProgress(ref.current, {
${options('      ')}
    });
    return () => progress.destroy();
  }, []);

  return (
    <article ref={ref}>
${indicator(s, true, '      ')}
      {children}
    </article>
  );
}`;
}

// ── The page the export row runs ─────────────────────────────────────────────

/** The sample article: in the preview, and in the page the export row downloads. */
export const PARAS = [
  'A reading progress bar answers one question: how much is left? It fills as you move down the page, and it moves only when you do.',
  'The number behind it is how far the page has scrolled, divided by how far it can scroll. At the top that is 0; at the very bottom it is 1.',
  'Scale the bar with a transform instead of changing its width. A transform never makes the browser lay the page out again, so long pages stay smooth.',
  'On a blog the page is more than the post: a header above it, comments and links below. Follow the article instead, and the bar is full when the last paragraph is on screen.',
  'Where the browser has scroll-driven animations, CSS can do all of it with animation-timeline. Everywhere else, scrollProgress writes the same number into a CSS variable.',
  'Keep it thin and out of the way, and hide it from screen readers: it repeats what the scrollbar already says.',
  'That is the whole trick. Scroll back up and it empties again.',
];

/**
 * More of the article for the downloaded page. An article bar needs an article
 * taller than the window (page.tsx, "Short articles"), and a page bar needs a
 * page with somewhere to go.
 */
const MORE = [
  'Long posts are where it earns its place. A reader who sees the bar a third of the way along knows how much is left, and can decide to stay.',
  'A ring in the corner says the same in less room. Its stroke is one dash as long as the circle, pushed back by an offset that shrinks as you read.',
  'Nothing in the bar knows about this text. Put your own article in its place, keep the markup and the stylesheet, and it measures whatever is there.',
  'Fonts, images and late content change how tall the page is. The scroll timeline follows them as they load; scrollProgress measures again when they do.',
  'If the bar sits under a sticky header, move it to the bottom edge, or give it a z-index above the header.',
  'Give images a width and a height. The page then holds its length while they arrive, and the bar does not jump back as they load.',
  'Colour is the one place to be bold. A thin bar in the site’s accent reads at a glance without pulling the eye from the text.',
  'On a phone it matters more: the scrollbar hides until you touch the screen, and the bar is the one steady sign of how far there is to go.',
  'Measured this way, every pixel of scroll moves the bar by the same amount, from the first line to the last.',
];

const PAGE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 18px/1.7 Georgia, 'Times New Roman', serif;
  color: #1d1d1b;
  background: #fbfbf8;
}
.site, article, .after {
  max-width: 40rem;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
}
.site {
  display: flex;
  justify-content: space-between;
  padding-top: 28px;
  padding-bottom: 28px;
  font: 14px/1.4 system-ui, sans-serif;
  color: #6b6b66;
}
.kicker {
  margin: 24px 0 8px;
  font: 13px/1.4 ui-monospace, Menlo, monospace;
  color: #6b6b66;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
h1 { margin: 0 0 24px; font-size: 40px; line-height: 1.15; }
article p { margin: 0 0 1.2em; }
.after {
  padding-top: 32px;
  padding-bottom: 70vh; /* room to scroll past the article */
  border-top: 1px solid #deded8;
  font: 15px/1.6 system-ui, sans-serif;
  color: #6b6b66;
}`;

/** The article's content as HTML lines: its heading, a note where the CSS cannot run, and the text. */
function articleLines(engine: Engine, indent: string): string[] {
  const kicker = `${indent}<p class="kicker">Field notes · 3 min read</p>`;
  const lines = [kicker, `${indent}<h1>Reading progress, measured</h1>`];
  if (engine === 'css') lines.push(`${indent}<p class="no-timeline">This browser has no CSS scroll timelines, so the bar stays hidden. The JavaScript version from the generator works here.</p>`);
  const paras = [...PARAS.slice(0, 6), ...MORE, PARAS[6]];
  return [...lines, ...paras.map((p) => `${indent}<p>${escapeHtml(p)}</p>`)];
}

const afterText = (s: Settings) => s.scope === 'page'
  ? 'Comments, related posts, the footer: the rest of the page. The bar follows the whole page, so it is full only at the very bottom.'
  : 'Comments, related posts, the footer: the rest of the page. The bar follows the article, so it was full when the article’s bottom reached the bottom of the window.';

/** A complete page with the bar for these settings: the CSS only tab's code, or the JavaScript tab's. */
function pageHtml(s: Settings, engine: Engine, title: string, version: string): string {
  const site = ['<header class="site">', '  <strong>Your site</strong>', '  <span>Blog · About</span>', '</header>'];
  const after = ['<footer class="after">', '  <p>Comments · 3</p>', `  <p>${escapeHtml(afterText(s))}</p>`, '</footer>'];
  const bar = indicator(s, false, s.scope === 'page' ? '' : '  ');
  const article = s.scope === 'page'
    ? ['<article>', ...articleLines(engine, '  '), '</article>']
    : [where(s, engine), '<article>', bar, ...articleLines(engine, '  '), '</article>'];
  const body = [
    ...(s.scope === 'page' ? [where(s, engine), bar, ''] : []),
    ...site, '', ...article, '', ...after,
  ].join('\n');
  const note = engine === 'css'
    ? `\n\n.no-timeline { display: none; padding: 12px 16px; border: 1px solid #deded8; font: 15px/1.5 system-ui, sans-serif; }\n@supports not (${supports(s)}) {\n  .no-timeline { display: block; }\n}`
    : '';
  return htmlFile({
    slug: TOOL_SLUG,
    title,
    css: `${PAGE_CSS}${note}\n\n${css(s, engine)}`,
    body,
    script: engine === 'js' ? js(s, cdnModule(version, 'progress')) : undefined,
  });
}

const SITE_JSX = ['<header className="site">', '  <strong>Your site</strong>', '  <span>Blog · About</span>', '</header>'];

/** The same page as a Vite + React project: the React tab's component, in plain JSX. */
function reactProject(s: Settings, version: string): Omit<ReactProject, 'title'> {
  const q = (t: string) => `'${t.replace(/[\\']/g, '\\$&')}'`;
  const paras = [...PARAS.slice(0, 6), ...MORE, PARAS[6]];
  const content = [
    '<p className="kicker">Field notes · 3 min read</p>',
    '<h1>Reading progress, measured</h1>',
    '{PARAGRAPHS.map((p) => <p key={p}>{p}</p>)}',
  ];
  const main = s.scope === 'page'
    ? ['<ReadingProgress />', ...SITE_JSX, '<article>', ...content.map((l) => `  ${l}`), '</article>']
    : [...SITE_JSX, '<Article>', ...content.map((l) => `  ${l}`), '</Article>'];
  const app = `${react(s, false)}

const PARAGRAPHS = [
${paras.map((p) => `  ${q(p)},`).join('\n')}
];

export default function App() {
  return (
    <>
${[...main, '<footer className="after">', '  <p>Comments · 3</p>', `  <p>${afterText(s)}</p>`, '</footer>'].map((l) => `      ${l}`).join('\n')}
    </>
  );
}
`;
  return { slug: TOOL_SLUG, app, css: `${PAGE_CSS}\n\n${css(s, 'js')}\n`, version };
}

/**
 * What the export row under the code runs, for the tab on show: the CSS only
 * tab gives a page with no script; the JavaScript and React tabs a page running
 * scrollProgress from jsDelivr, and the React component as a project.
 */
export function runnable(s: Settings, engine: Engine, version: string): {
  title: string;
  filename: string;
  html: string;
  react?: Omit<ReactProject, 'title'>;
} {
  if (engine === 'css') {
    const title = 'Scroll progress bar, CSS only';
    return { title, filename: 'scroll-progress-bar-css.html', html: pageHtml(s, 'css', title, version) };
  }
  const title = 'Scroll progress bar';
  return { title, filename: 'scroll-progress-bar.html', html: pageHtml(s, 'js', title, version), react: reactProject(s, version) };
}
