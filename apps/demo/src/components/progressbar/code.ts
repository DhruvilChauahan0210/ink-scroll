/**
 * The scroll progress bar generator's code, in one place: the page's tables,
 * the preview's stylesheet and the listings visitors copy are all written by
 * these functions, so what the preview runs is what the code says.
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

export function html(s: Settings, engine: Engine = 'js'): string {
  if (s.scope === 'page') {
    return `<!-- Anywhere in <body>: it is fixed to the window. -->\n${indicator(s, false, '')}`;
  }
  // A named view timeline is visible only to the element and what is inside it;
  // the variable is inherited the same way.
  const why = engine === 'css' ? 'so it can use the article’s view timeline' : `so it inherits ${LIB_DEFAULTS.variable}`;
  return `<!-- Inside the article, ${why}. -->
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

export function js(s: Settings): string {
  if (s.scope === 'page') {
    return `import { scrollProgress } from 'svg-scroll-draw/progress';

// 0 at the top of the page, 1 at the bottom, written to
// ${LIB_DEFAULTS.variable} on <html>; the bar’s CSS reads it.
scrollProgress(document.documentElement, {
${options('  ')}
});`;
  }
  return `import { scrollProgress } from 'svg-scroll-draw/progress';

// 0 when the article’s top reaches the top of the window, 1 when its
// bottom reaches the bottom. The bar inside it inherits ${LIB_DEFAULTS.variable}.
scrollProgress('article', {
${options('  ')}
});`;
}

export function react(s: Settings): string {
  const jsxIndent = s.style === 'ring' ? '    ' : '';
  if (s.scope === 'page') {
    const ret = s.style === 'ring'
      ? `  return (\n${indicator(s, true, jsxIndent)}\n  );`
      : `  return ${indicator(s, true, '').trim()};`;
    return `'use client';

import { useEffect } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';
import './progress.css';

/** Render it once, e.g. in app/layout.tsx. */
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
  return `'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';
import './progress.css';

export function Article({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

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
