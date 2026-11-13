import { cdnModule, escapeHtml, htmlFile, withSource } from '@/lib/tool-export';

/**
 * Everything the scroll marquee generator writes, from one settings object:
 * the HTML, the CSS for the script version, main.js, the React component and
 * the CSS-only version, plus the copy of that CSS the preview runs. Pure
 * functions, so the preview and the code cannot disagree: the preview's
 * stylesheet is this same CSS under the preview's own scope and names.
 *
 * Two motions, on two nested elements, so they add up:
 *
 * - the drift: a plain CSS animation on .mq-track, translateX(0) → (−50%).
 *   The track holds the row's items twice, so −50% is exactly one copy and
 *   the loop has no seam. The copy is aria-hidden.
 * - the scroll shift: .mq-shift moves `distance` px for every screen of
 *   scroll. The window it is spread over is the row's top at the window's
 *   bottom → its top at the window's top, which is one screen of scroll
 *   exactly: scrollAnimate's trigger { start: 'top bottom', end: 'top top' },
 *   or animation-range: entry 0% exit 0% on a view() timeline in CSS.
 *
 * Both stay inside [−distance, 0], and each copy is at least as wide as the
 * row plus that distance (min-width: calc(100cqw + distance)), so neither
 * motion ever shows the row's empty end.
 *
 * scrollAnimate's defaults, which matter here (packages/svg-scroll-draw/src/
 * animate/engine.ts, buildAnimateEngine): easing 'ease-out', so the code
 * passes 'linear'; trigger 'top bottom' → 'bottom top', so it passes its own
 * end; native true, but a trigger end other than 'bottom top' always runs on
 * the JavaScript engine; respectReducedMotion true, which applies the end
 * transform, so the CSS holds .mq-shift at none under reduced motion. Its
 * transform values interpolate number by number with the first value's unit,
 * so both ends are written in px ('translateX(0px)', not 'translateX(0)').
 *
 * The library's version comes in as an argument from the server page, so this
 * file never pulls data/competitors.ts into the client bundle.
 */

export const SLUG = 'scroll-marquee-generator';

export type Dir = 'left' | 'right';
export type Row = { items: string; dir: Dir };
export type Engine = 'js' | 'css';

export const SEPARATORS = ['✦', '•', '/', 'none'] as const;
export type Sep = (typeof SEPARATORS)[number];

export type Settings = {
  rows: Row[];
  /** px the row slides for each screen of scroll; 0 for none. */
  distance: number;
  gap: number;
  /** Font size, px. */
  size: number;
  drift: boolean;
  /** Seconds for the drift to move one copy along. */
  loop: number;
  sep: Sep;
};

/** The rows the generator offers, in order: adding a row takes the next one, directions alternating. */
export const ROW_PRESETS: Row[] = [
  { items: 'Scroll, Draw, Reveal, Pin, Parallax', dir: 'left' },
  { items: 'Zero dependencies, MIT, Native CSS', dir: 'right' },
  { items: 'Design, Build, Ship, Repeat', dir: 'left' },
  { items: 'React, Vue, Svelte, Astro, Vanilla', dir: 'right' },
];

export const DEFAULTS: Settings = {
  rows: ROW_PRESETS.slice(0, 2),
  distance: 300,
  gap: 48,
  size: 64,
  drift: true,
  loop: 40,
  sep: '✦',
};

export const LIMITS = {
  rows: { min: 1, max: ROW_PRESETS.length, step: 1 },
  distance: { min: 0, max: 800, step: 20 },
  gap: { min: 16, max: 160, step: 8 },
  size: { min: 24, max: 160, step: 4 },
  loop: { min: 8, max: 120, step: 2 },
  items: 12,
} as const;

/** scrollAnimate's own defaults that the code overrides (animate/engine.ts). */
export const LIB = {
  easing: 'ease-out',
  start: 'top bottom',
  end: 'bottom top',
  respectReducedMotion: true,
};

/** The trigger the code passes: one screen of scroll, top to top. */
export const TRIGGER = { start: 'top bottom', end: 'top top' } as const;

/** The code tabs: what the generator writes, and the file each one is. */
export type Tab = 'html' | 'css' | 'js' | 'react' | 'only';
export const TABS: { k: Tab; label: string; file: string }[] = [
  { k: 'html', label: 'HTML', file: 'index.html' },
  { k: 'css', label: 'CSS', file: 'marquee.css' },
  { k: 'js', label: 'JavaScript', file: 'main.js' },
  { k: 'react', label: 'React', file: 'ScrollMarquee.tsx' },
  { k: 'only', label: 'CSS only', file: 'marquee.css' },
];

/** A row's items: comma separated, trimmed, empty ones dropped, at most LIMITS.items. */
export function itemsOf(row: Row): string[] {
  const list = row.items.split(',').map((x) => x.trim()).filter(Boolean).slice(0, LIMITS.items);
  return list.length ? list : ['Your text'];
}

/** The shift of a row at progress p (0–1): left rows 0 → −distance, right rows −distance → 0. */
export function shiftAt(dir: Dir, distance: number, p: number): number {
  return dir === 'left' ? -distance * p : -distance * (1 - p);
}

// ── CSS ─────────────────────────────────────────────────────────────────────

/** How the CSS is written: for the reader's page, or for the preview box. */
export type Dialect = {
  /** Class prefix: 'mq' in the code, the preview's own in the preview. */
  p: string;
  /** Put before every selector: '' in the code, the preview's scope there. */
  scope: string;
  /** Keyframe names. */
  drift: string;
  shift: string;
  /** Write the starter look (font, the pause control) too. */
  look: boolean;
  /** Write the explanatory comments. */
  notes: boolean;
};

const PAGE: Dialect = { p: 'mq', scope: '', drift: 'mq-drift', shift: 'mq-shift', look: true, notes: true };

export function previewDialect(scope: string, id: string): Dialect {
  return { p: 'mqz', scope, drift: `mqz-drift${id}`, shift: `mqz-shift${id}`, look: false, notes: false };
}

type Rule = [selector: string, decls: (string | false)[]];

function block(d: Dialect, [sel, decls]: Rule, pad: string): string {
  const body = decls.filter((x): x is string => typeof x === 'string');
  const sels = sel.split(', ').map((x) => `${pad}${d.scope}${x}`).join(',\n');
  return [`${sels} {`, ...body.map((x) => `${pad}  ${x}`), `${pad}}`].join('\n');
}

const rules = (d: Dialect, list: Rule[], pad = '') => list.map((r) => block(d, r, pad)).join('\n\n');
const note = (d: Dialect, text: string): string | false => (d.notes ? text : false);
const head = (d: Dialect, lines: string[], pad = '') => (d.notes ? lines.map((l) => pad + l).join('\n') + '\n' : '');
/** Class selectors in the dialect's prefix: c('row') is .mq-row, c('') the section itself, .mq. */
const cls = (d: Dialect) => (x: string) => (x ? `.${d.p}-${x}` : `.${d.p}`);
const cssString = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** What the marquee does, in a sentence, for the top of the files. */
function summary(s: Settings): string {
  const n = s.rows.length;
  const moves = [
    s.distance > 0 && `slides ${s.distance}px for every screen of scroll`,
    s.drift && `drifts on its own, a loop every ${s.loop}s`,
  ].filter(Boolean);
  return `${n} row${n === 1 ? '' : 's'} of ${s.size}px text, ${s.gap}px apart. Each row ${moves.length ? moves.join(' and ') : 'stays still'}.`;
}

/** The layout both versions share: the clipped rows, the doubled track, the copies. */
function baseRules(s: Settings, d: Dialect): Rule[] {
  const c = cls(d);
  const sep = s.sep !== 'none';
  const list: Rule[] = [];
  if (d.look) list.push([c(''), ['display: grid;', 'gap: 0.25em;', 'padding-block: 24px;']]);
  list.push(
    [c('row'), [
      'min-width: 0;',
      note(d, '/* clip, not hidden: hidden would make the row a scroll container. */'),
      'overflow: clip;',
      note(d, '/* So that 100cqw below is the row’s width. */'),
      'container-type: inline-size;',
    ]],
    [c('track'), ['display: flex;', 'width: max-content;']],
    [c('set'), [
      'display: flex;',
      'flex: none;',
      'align-items: center;',
      note(d, s.distance > 0
        ? `/* Each copy at least as wide as the row plus the ${s.distance}px shift, so neither`
        : '/* Each copy at least as wide as the row, so the drift never'),
      note(d, s.distance > 0
        ? '   motion shows the row’s end. Spare room is spread evenly, the seam included. */'
        : '   shows the row’s end. Spare room is spread evenly, the seam included. */'),
      `min-width: ${s.distance > 0 ? `calc(100cqw + ${s.distance}px)` : '100cqw'};`,
      'justify-content: space-around;',
      `gap: ${s.gap}px;`,
      'margin: 0;',
      note(d, '/* Half a gap at each end: a whole gap across the seam. */'),
      `padding: 0 ${s.gap / 2}px;`,
      'list-style: none;',
    ]],
    [c('item'), [
      'flex: none;',
      sep && 'position: relative;',
      `font-size: ${s.size}px;`,
      'line-height: 1.2;',
      'white-space: nowrap;',
      d.look && 'font-weight: 700;',
      d.look && 'letter-spacing: -0.02em;',
    ]],
  );
  if (sep) {
    list.push([`${c('item')}::after`, [
      note(d, '/* The separator, in the gap after every item. The second content line'),
      note(d, '   gives it empty alt text, so screen readers skip it. */'),
      `content: ${cssString(s.sep)};`,
      `content: ${cssString(s.sep)} / "";`,
      'position: absolute;',
      'inset-block: 0;',
      'left: 100%;',
      `width: ${s.gap}px;`,
      'display: flex;',
      'align-items: center;',
      'justify-content: center;',
      `font-size: min(0.4em, ${Math.round(s.gap * 0.6)}px);`,
    ]]);
  }
  if (s.drift) {
    list.push([`${c('pause')}`, [
      'display: inline-flex;',
      'align-items: center;',
      'gap: 0.5em;',
      d.look && 'justify-self: end;',
      d.look && 'margin-inline: 16px;',
      d.look && 'font: 14px/1.2 system-ui, sans-serif;',
      'cursor: pointer;',
    ]]);
  }
  return list;
}

/** The drift and the pause, inside prefers-reduced-motion: no-preference. */
function driftRules(s: Settings, d: Dialect): Rule[] {
  if (!s.drift) return [];
  const c = cls(d);
  return [
    [c('track'), [
      note(d, `/* One copy along every ${s.loop}s; the copy behind it takes its place. */`),
      `animation: ${d.drift} ${s.loop}s linear infinite;`,
    ]],
    [`${c('row')}.is-right ${c('track')}`, ['animation-direction: reverse;']],
    [`${c('')}:has(${c('pause')} input:checked) ${c('track')}`, [
      note(d, '/* The pause control (WCAG 2.2.2): a checkbox, so it needs no script. */'),
      'animation-play-state: paused;',
    ]],
  ];
}

/** Under reduced motion: nothing moves, every item on show, the copy gone. */
function stillRules(s: Settings, d: Dialect): Rule[] {
  const c = cls(d);
  return [
    ...(s.distance > 0
      ? [[c('shift'), [
        note(d, '/* Over the inline transform scrollAnimate would set at its end. */'),
        'transform: none !important;',
      ]] as Rule]
      : []),
    [c('track'), ['width: auto;']],
    [c('set'), ['flex: 1 1 auto;', 'flex-wrap: wrap;', 'justify-content: center;', 'row-gap: 0;', 'min-width: 0;']],
    [`${c('set')}[aria-hidden]`, ['display: none;']],
    [c('item'), [note(d, '/* An item wider than the row wraps too. */'), 'flex: 0 1 auto;', 'white-space: normal;', 'text-align: center;']],
    ...(s.drift ? [[c('pause'), ['display: none;']] as Rule] : []),
  ];
}


function wrapMedia(query: string, body: string): string {
  return [`@media (${query}) {`, body, '}'].join('\n');
}

function keyframes(s: Settings, d: Dialect, shift: boolean): string[] {
  const out: string[] = [];
  if (s.drift) out.push(`@keyframes ${d.drift} {\n  from { transform: translateX(0); }\n  to   { transform: translateX(-50%); }\n}`);
  if (shift && s.distance > 0) out.push(`@keyframes ${d.shift} {\n  from { transform: translateX(0); }\n  to   { transform: translateX(-${s.distance}px); }\n}`);
  return out;
}

/** The CSS of the script version: the layout and the drift; main.js does the scroll shift. */
export function scriptCss(s: Settings, d: Dialect = PAGE): string {
  const drift = driftRules(s, d);
  return [
    head(d, [`/* A scroll marquee: ${summary(s)}`, '   main.js moves the rows with the scroll; this file does the rest. */']) + rules(d, baseRules(s, d)),
    ...(drift.length ? [wrapMedia('prefers-reduced-motion: no-preference', rules(d, drift, '  '))] : []),
    head(d, ['/* Reduced motion: nothing moves, and every item is on show. */']) +
      wrapMedia('prefers-reduced-motion: reduce', rules(d, stillRules(s, d), '  ')),
    ...keyframes(s, d, false),
  ].join('\n\n');
}

/** The CSS-only version: the same, plus the scroll shift on a view() timeline inside @supports. */
export function cssOnlyCss(s: Settings, d: Dialect = PAGE): string {
  const c = cls(d);
  const drift = driftRules(s, d);
  const shift: Rule[] = s.distance > 0
    ? [
      [c('shift'), [
        `animation-name: ${d.shift};`,
        'animation-duration: auto;',
        'animation-timing-function: linear;',
        'animation-fill-mode: both;',
        'animation-timeline: view();',
        note(d, "/* From the row's top at the window's bottom to its top at the window's top:"),
        note(d, `   one screen of scroll, ${s.distance}px of travel. */`),
        'animation-range: entry 0% exit 0%;',
      ]],
      [`${c('row')}.is-right ${c('shift')}`, ['animation-direction: reverse;']],
    ]
    : [];
  const moving = [
    ...(drift.length ? [rules(d, drift, '  ')] : []),
    ...(shift.length ? [['  @supports (animation-timeline: view()) {', rules(d, shift, '    '), '  }'].join('\n')] : []),
  ];
  return [
    head(d, s.distance > 0
      ? [
        `/* A scroll marquee in CSS only: ${summary(s)}`,
        '   The scroll shift runs where the browser has scroll timelines; elsewhere the',
        `   rows ${s.drift ? 'only drift' : 'stay still'}. */`,
      ]
      : [`/* A scroll marquee in CSS only: ${summary(s)} */`]) + rules(d, baseRules(s, d)),
    ...(moving.length ? [wrapMedia('prefers-reduced-motion: no-preference', moving.join('\n\n'))] : []),
    head(d, ['/* Reduced motion: nothing moves, and every item is on show. */']) +
      wrapMedia('prefers-reduced-motion: reduce', rules(d, stillRules(s, d), '  ')),
    ...keyframes(s, d, true),
  ].join('\n\n');
}

export const cssCode = (s: Settings) => withSource(scriptCss(s), SLUG, 'css');
export const cssOnlyCode = (s: Settings) => withSource(cssOnlyCss(s), SLUG, 'css');

// ── HTML ────────────────────────────────────────────────────────────────────

/** The marquee itself, the same in every file. */
function markup(s: Settings): string {
  const rows = s.rows.map((row) => {
    const items = itemsOf(row).map((t) => `          <li class="mq-item">${escapeHtml(t)}</li>`);
    return [
      `  <div class="mq-row${row.dir === 'right' ? ' is-right' : ''}">`,
      '    <div class="mq-shift">',
      '      <div class="mq-track">',
      '        <ul class="mq-set">',
      ...items,
      '        </ul>',
      '        <ul class="mq-set" aria-hidden="true">',
      ...items,
      '        </ul>',
      '      </div>',
      '    </div>',
      '  </div>',
    ].join('\n');
  });
  return [
    '<section class="mq" aria-label="Highlights">',
    ...(s.drift ? ['  <label class="mq-pause"><input type="checkbox" /> Pause motion</label>'] : []),
    ...rows,
    '</section>',
  ].join('\n');
}

export function htmlCode(s: Settings): string {
  return withSource([
    '<!-- Each row holds its items twice: the second copy makes the loop seamless,',
    '     and aria-hidden keeps screen readers to the first. -->',
    markup(s),
    '',
    ...(s.distance > 0
      ? ['<!-- The script version. The CSS-only version needs no script. -->', '<script type="module" src="main.js"></script>']
      : ['<!-- No scroll shift (distance 0): no script needed. -->']),
  ].join('\n'), SLUG, 'html');
}

// ── JavaScript ──────────────────────────────────────────────────────────────

function jsBody(s: Settings, from: string, cdn?: string): string {
  if (s.distance === 0) {
    return [
      '// The distance is 0: the rows do not follow the scroll, so there is nothing',
      '// for a script to do. The CSS tab is the whole marquee.',
    ].join('\n');
  }
  return [
    `import { scrollAnimate } from '${from}';`,
    ...(cdn ? ['// No bundler? Import it from', `// ${cdn}`] : []),
    '',
    `// px each row slides for every screen of scroll.`,
    `const DISTANCE = ${s.distance};`,
    '',
    "for (const row of document.querySelectorAll('.mq-row')) {",
    '  // .is-right rows run the other way: from −DISTANCE back to 0.',
    "  const [from, to] = row.classList.contains('is-right') ? [-DISTANCE, 0] : [0, -DISTANCE];",
    "  scrollAnimate(row.querySelector('.mq-shift'), {",
    '    props: { transform: [`translateX(${from}px)`, `translateX(${to}px)`] },',
    "    // From the row's top at the window's bottom to its top at the window's",
    '    // top: one screen of scroll.',
    `    trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },`,
    "    easing: 'linear',",
    '  });',
    '}',
  ].join('\n');
}

export const jsCode = (s: Settings, version: string) => withSource(jsBody(s, 'svg-scroll-draw', cdnModule(version)), SLUG, 'js');

// ── React ───────────────────────────────────────────────────────────────────

/**
 * The React component. `ts`: the TSX file the React tab shows, a client
 * component importing its CSS; otherwise plain JSX for the StackBlitz project,
 * whose stylesheet main.jsx imports.
 */
function reactComponent(s: Settings, ts: boolean): string {
  const rows = s.rows.map((row) =>
    `  { dir: '${row.dir}', items: [${itemsOf(row).map((t) => JSON.stringify(t)).join(', ')}] },`);
  const effect = s.distance > 0
    ? [
      `  const root = ${ts ? 'useRef<HTMLElement>(null)' : 'useRef(null)'};`,
      '',
      '  useEffect(() => {',
      '    const rows = [...(root.current?.querySelectorAll' + (ts ? '<HTMLElement>' : '') + "('.mq-row') ?? [])];",
      '    const shifts = rows.map((row) => {',
      "      const [from, to] = row.classList.contains('is-right') ? [-DISTANCE, 0] : [0, -DISTANCE];",
      "      return scrollAnimate(row.querySelector('.mq-shift')" + (ts ? '!' : '') + ', {',
      '        props: { transform: [`translateX(${from}px)`, `translateX(${to}px)`] },',
      `        trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },`,
      "        easing: 'linear',",
      '      });',
      '    });',
      '    return () => shifts.forEach((shift) => shift.destroy());',
      '  }, []);',
      '',
    ]
    : [];
  return [
    ...(ts ? ["'use client';", ''] : []),
    ...(s.distance > 0
      ? ["import { useEffect, useRef } from 'react';", "import { scrollAnimate } from 'svg-scroll-draw';"]
      : []),
    ...(ts ? ["import './marquee.css';"] : []),
    ...(s.distance > 0 || ts ? [''] : []),
    ...(s.distance > 0 ? ['// px each row slides for every screen of scroll.', `const DISTANCE = ${s.distance};`, ''] : []),
    `const ROWS${ts ? ": { dir: 'left' | 'right'; items: string[] }[]" : ''} = [`,
    ...rows,
    '];',
    '',
    'export function ScrollMarquee() {',
    ...effect,
    '  return (',
    `    <section${s.distance > 0 ? ' ref={root}' : ''} className="mq" aria-label="Highlights">`,
    ...(s.drift ? ['      <label className="mq-pause"><input type="checkbox" /> Pause motion</label>'] : []),
    '      {ROWS.map((row, r) => (',
    "        <div key={r} className={row.dir === 'right' ? 'mq-row is-right' : 'mq-row'}>",
    '          <div className="mq-shift">',
    '            <div className="mq-track">',
    '              {/* Twice: the copy makes the loop seamless, and is hidden from screen readers. */}',
    '              {[false, true].map((copy) => (',
    '                <ul key={String(copy)} className="mq-set" aria-hidden={copy || undefined}>',
    '                  {row.items.map((item, i) => <li key={i} className="mq-item">{item}</li>)}',
    '                </ul>',
    '              ))}',
    '            </div>',
    '          </div>',
    '        </div>',
    '      ))}',
    '    </section>',
    '  );',
    '}',
  ].join('\n');
}

export const reactCode = (s: Settings) => withSource(reactComponent(s, true), SLUG, 'tsx');

// ── Files that run on their own ─────────────────────────────────────────────

/** The page around the marquee: a screen before it and one after, to scroll through. */
const PAGE_CSS = `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; color: #1b1a18; background: #f6f4ef; }
.spacer { display: grid; place-items: center; height: 100vh; color: #6b675f; }`;

function pageBody(s: Settings): string {
  return ['<div class="spacer">Scroll down</div>', '', markup(s), '', '<div class="spacer">The page goes on</div>'].join('\n');
}

/** A complete page running the script version: the CSS tab, and main.js with the library from jsDelivr. */
export function jsFile(s: Settings, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'Scroll marquee',
    css: `${PAGE_CSS}\n\n${scriptCss(s)}`,
    body: pageBody(s),
    ...(s.distance > 0 && { script: jsBody(s, cdnModule(version)) }),
  });
}

/** A complete page running the CSS-only version: no script at all. */
export function cssOnlyFile(s: Settings): string {
  return htmlFile({
    slug: SLUG,
    title: 'Scroll marquee, CSS only',
    css: `${PAGE_CSS}\n\n${cssOnlyCss(s)}`,
    body: pageBody(s),
  });
}

/** The React project for StackBlitz: the component in plain JSX, and a page to scroll it in. */
export function reactApp(s: Settings): { app: string; css: string } {
  return {
    app: `${reactComponent(s, false)}

export default function App() {
  return (
    <>
      <div className="spacer">Scroll down</div>
      <ScrollMarquee />
      <div className="spacer">The page goes on</div>
    </>
  );
}
`,
    css: `${PAGE_CSS}\n\n${scriptCss(s)}\n`,
  };
}
