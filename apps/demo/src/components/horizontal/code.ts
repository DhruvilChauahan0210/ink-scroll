import { EXACT_CSS, NAMED, linearCss, linearText, type EasingName } from '@/data/easing';
import { SELF } from '@/data/competitors';

/**
 * Everything the horizontal scroll generator writes, from one settings object:
 * the HTML, the CSS for the script version, main.js, the React component and
 * the CSS-only version, plus the copy of that CSS the preview runs. Pure
 * functions, so the preview and the code cannot disagree: the preview's
 * stylesheet is this same CSS with its units mapped onto the box (vw → cqw of
 * the box, 100svh → the box's height).
 *
 * scrollHorizontal's defaults, which the code leaves out when they match, are
 * in packages/svg-scroll-draw/src/horizontal/index.ts (the destructuring in
 * scrollHorizontal): easing 'linear', trigger 'top top' → 'bottom bottom',
 * respectReducedMotion false, distance measured.
 */

export type Unit = 'vw' | 'px';
/** 'match': the scroll is as long as the travel (1:1). A number: that many vh of scroll. */
export type Length = 'match' | number;
export type Engine = 'js' | 'css';

export type Settings = {
  panels: number;
  unit: Unit;
  width: number;
  gap: number;
  length: Length;
  easing: EasingName;
  bar: boolean;
};

export const DEFAULTS: Settings = { panels: 5, unit: 'vw', width: 80, gap: 24, length: 'match', easing: 'linear', bar: true };

export const LIMITS = {
  panels: { min: 2, max: 8, step: 1 },
  vw: { min: 30, max: 100, step: 5, def: 80 },
  px: { min: 200, max: 960, step: 20, def: 480 },
  gap: { min: 0, max: 80, step: 4 },
  vh: { min: 50, max: 600, step: 50, def: 300 },
} as const;

/** scrollHorizontal's own defaults (horizontal/index.ts, the options destructuring). */
export const LIB = {
  easing: 'linear' as EasingName,
  start: 'top top',
  end: 'bottom bottom',
  respectReducedMotion: false,
};

/** The code tabs: what the generator writes, and the file each one is. */
export type Tab = 'html' | 'css' | 'js' | 'react' | 'only';
export const TABS: { k: Tab; label: string; file: string }[] = [
  { k: 'html', label: 'HTML', file: 'index.html' },
  { k: 'css', label: 'CSS', file: 'horizontal-scroll.css' },
  { k: 'js', label: 'JavaScript', file: 'main.js' },
  { k: 'react', label: 'React', file: 'HorizontalScroll.tsx' },
  { k: 'only', label: 'CSS only', file: 'horizontal-scroll.css' },
];

export const CDN_URL = `https://cdn.jsdelivr.net/npm/svg-scroll-draw@${SELF.version}/dist/horizontal/index.mjs`;

// ── Geometry ────────────────────────────────────────────────────────────────

/**
 * The strip in px for a stage `stageW` wide and `stageH` tall: each panel, the
 * whole track (the gap also before the first panel and after the last), how far
 * it travels (track minus stage, as scrollHorizontal's default distance), the
 * scroll that trip takes and the px sideways per px scrolled.
 */
export function geometry(s: Settings, stageW: number, stageH: number) {
  const panel = s.unit === 'vw' ? (s.width * stageW) / 100 : s.width;
  const track = s.panels * panel + (s.panels + 1) * s.gap;
  const travel = Math.max(0, track - stageW);
  const scroll = s.length === 'match' ? travel : (s.length * stageH) / 100;
  return { panel, track, travel, scroll, speed: scroll > 0 ? travel / scroll : 0 };
}

/**
 * The raw scroll progress at which an easing first shows `y` (0–1): the inverse
 * the preview's keyboard handler uses to scroll to a panel. Sampled, so it also
 * works for spring and elastic, where the first crossing is the one that counts.
 */
export function firstReach(easing: EasingName, y: number): number {
  if (y <= 0) return 0;
  const f = NAMED[easing];
  const N = 2000;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    if (f(t) >= y) {
      const a = (i - 1) / N;
      const fa = f(a);
      const fb = f(t);
      return fb === fa ? t : a + ((y - fa) / (fb - fa)) * (t - a);
    }
  }
  return 1;
}

// ── CSS ─────────────────────────────────────────────────────────────────────

/** How the CSS is written: for the reader's page, or for the preview box. */
type Dialect = {
  /** Class prefix: 'hs' in the code, 'hz' in the preview. */
  p: string;
  /** Put before every selector: '' in the code, the preview's scope there. */
  scope: string;
  /** The window's width unit: vw on a page, cqw of the box in the preview. */
  vw: string;
  /** One screen: 100svh on a page, the box's height in the preview. */
  screen: string;
  /** n vh of scroll. */
  vh: (n: number) => string;
  /** Write the starter look (borders, padding, colours) too. */
  look: boolean;
  /** Write the explanatory comments. */
  notes: boolean;
};

const PAGE: Dialect = {
  p: 'hs', scope: '', vw: 'vw', screen: '100svh', vh: (n) => `${n}vh`, look: true, notes: true,
};

export function previewDialect(scope: string): Dialect {
  return {
    p: 'hz', scope, vw: 'cqw', screen: 'var(--hz-h)', vh: (n) => `calc(var(--hz-h) * ${n / 100})`, look: false, notes: false,
  };
}

/** A sum of terms with units, as CSS: zero terms left out, minus signs folded in. */
function sum(terms: [number, string][]): string {
  const kept = terms.filter(([n]) => n !== 0);
  if (!kept.length) return '0px';
  return kept
    .map(([n, u], i) => (i === 0 ? `${n}${u}` : n < 0 ? `- ${-n}${u}` : `+ ${n}${u}`))
    .join(' ');
}

/** The travel, n × w + (n + 1) × gap − one window width, as CSS. */
function travelExpr(s: Settings, d: Dialect): string {
  const gaps = (s.panels + 1) * s.gap;
  const terms: [number, string][] = s.unit === 'vw'
    ? [[s.panels * s.width - 100, d.vw], [gaps, 'px']]
    : [[s.panels * s.width + gaps, 'px'], [-100, d.vw]];
  return `max(0px, ${sum(terms)})`;
}

/** The outer's height: one screen for the stage to stay stuck, plus the scroll the trip takes. */
function outerHeight(s: Settings, d: Dialect): string {
  return `calc(${d.screen} + ${s.length === 'match' ? travelExpr(s, d) : d.vh(s.length)})`;
}

function travelNote(s: Settings): string {
  const w = `${s.width}${s.unit}`;
  return `${s.panels} × ${w} + ${s.panels + 1} × ${s.gap}px − 100vw`;
}

/** The CSS timing function for a library easing: exact where one exists, a linear() through enough points otherwise. */
export function cssTiming(easing: EasingName): { value: string; lines: string[]; error: number } {
  const exact = EXACT_CSS[easing];
  if (exact) return { value: exact, lines: [exact], error: 0 };
  const fit = linearCss(NAMED[easing]);
  const body = linearText(fit.stops, 5, '');
  return { value: `linear(${body.replace(/\n/g, ' ')})`, lines: ['linear(', ...body.split('\n').map((l) => `  ${l}`), ')'], error: fit.error };
}

type Rule = [selector: string, decls: (string | false)[]];

/** One rule, indented by `pad`; every selector in a list gets the dialect's scope. */
function block(d: Dialect, [sel, decls]: Rule, pad: string): string {
  const body = decls.filter((x): x is string => typeof x === 'string');
  const sels = sel.split(', ').map((x) => `${pad}${d.scope}${x}`).join(',\n');
  return [`${sels} {`, ...body.map((x) => `${pad}  ${x}`), `${pad}}`].join('\n');
}

const rules = (d: Dialect, list: Rule[], pad = '') => list.map((r) => block(d, r, pad)).join('\n\n');
const note = (d: Dialect, text: string): string | false => (d.notes ? text : false);
/** A comment above what follows, in the code only. */
const head = (d: Dialect, lines: string[], pad = '') => (d.notes ? lines.map((l) => pad + l).join('\n') + '\n' : '');

/** The rules both versions share: the fallback row. */
function baseRules(s: Settings, d: Dialect): Rule[] {
  const c = (x: string) => `.${d.p}-${x}`;
  const list: Rule[] = [
    [c('stage'), ['overflow-x: auto;']],
    [c('track'), [
      'display: flex;',
      `gap: ${s.gap}px;`,
      note(d, '/* As wide as its panels, so it can be measured and moved. */'),
      'width: max-content;',
      'flex: none;',
      'margin: 0;',
      `padding: 0 ${s.gap}px;`,
      'list-style: none;',
    ]],
    [c('panel'), [
      'flex: none;',
      d.look && 'box-sizing: border-box;',
      `width: ${s.width}${s.unit === 'vw' ? d.vw : 'px'};`,
      d.look && 'min-height: 60svh;',
      d.look && 'padding: 32px;',
      d.look && 'border: 1px solid;',
    ]],
  ];
  if (s.bar) {
    list.push([c('bar'), ['display: none;']]);
    list.push([`${c('bar')} span`, [
      'display: block;',
      'height: 100%;',
      d.look && 'background: currentColor;',
      'transform: scaleX(0);',
      'transform-origin: left;',
    ]]);
  }
  return list;
}

/** The pinned outer and stage, the same in both versions; `outer` and `stage` are how the selectors reach them. */
function pinnedRules(s: Settings, d: Dialect, outer: string, stage: string, extra: { outer: (string | false)[]; stage: (string | false)[] }): Rule[] {
  return [
    [outer, [
      note(d, '/* One screen for the stage to stay stuck, plus the scroll the trip takes'),
      note(d, s.length === 'match'
        ? `   (the travel itself, ${travelNote(s)}: a px of scroll moves it a px). */`
        : `   (${s.length}vh). */`),
      `height: ${outerHeight(s, d)};`,
      ...extra.outer,
    ]],
    [stage, [
      'position: sticky;',
      'top: 0;',
      'display: flex;',
      'align-items: center;',
      `height: ${d.screen};`,
      note(d, '/* clip, not hidden: a hidden box can still be scrolled by focus. */'),
      'overflow: clip;',
      ...extra.stage,
    ]],
  ];
}

function barPinned(d: Dialect, sel: string): Rule {
  return [sel, [
    'display: block;',
    'position: absolute;',
    'inset: auto 24px 24px;',
    'height: 2px;',
    note(d, '/* Keeps an overshoot past 1 (spring, elastic) inside the bar. */'),
    'overflow: hidden;',
    d.look && 'background: rgb(127 127 127 / 0.3);',
  ]];
}

/** The CSS of the script version: a fallback row, pinned once main.js adds .is-pinned. */
export function scriptCss(s: Settings, d: Dialect = PAGE): string {
  const c = (x: string) => `.${d.p}-${x}`;
  const pinned = pinnedRules(s, d, `${c('outer')}.is-pinned`, `.is-pinned ${c('stage')}`, { outer: [], stage: [] });
  if (s.bar) pinned.push(barPinned(d, `.is-pinned ${c('bar')}`));
  return [
    head(d, [
      `/* A horizontal scroll section: ${s.panels} panels, ${s.width}${s.unit} wide, ${s.gap}px apart.`,
      '   Without the script, and before it runs, it is a row you scroll sideways. */',
    ]) + rules(d, baseRules(s, d)),
    head(d, ['/* Pinned: main.js adds .is-pinned, then starts scrollHorizontal. */']) + rules(d, pinned),
    ...(d.notes
      ? [[
        '/* html, body { overflow-x: hidden } makes body a scroll container that the',
        '   stage sticks to instead of the window. To stop sideways scrolling there,',
        '   use overflow-x: clip. */',
      ].join('\n')]
      : []),
  ].join('\n\n');
}

/** Keyframe and timeline names: the page's, or the preview's own. */
export type Keys = { slide: string; fill: string; timeline: string };
const PAGE_KEYS: Keys = { slide: 'hs-slide', fill: 'hs-fill', timeline: '--hs-trip' };

/** The CSS-only version: the same fallback row, pinned and moved by a scroll timeline inside @supports. */
export function cssOnlyCss(s: Settings, d: Dialect = PAGE, keys: Keys = PAGE_KEYS): string {
  const c = (x: string) => `.${d.p}-${x}`;
  const timing = cssTiming(s.easing);
  const pad = '    ';
  const anim = (name: string, notes: boolean): (string | false)[] => [
    `animation-name: ${name};`,
    'animation-duration: auto;',
    ...(timing.lines.length === 1
      ? [`animation-timing-function: ${timing.value};`]
      : [`animation-timing-function: ${timing.lines[0]}`, ...timing.lines.slice(1, -1), `${timing.lines[timing.lines.length - 1]};`]),
    'animation-fill-mode: both;',
    `animation-timeline: ${keys.timeline};`,
    notes && note(d, "/* From the outer's top at the window's top to its bottom at the window's"),
    notes && note(d, "   bottom: scrollHorizontal's default trigger, 'top top' → 'bottom bottom'. */"),
    'animation-range: contain 0% contain 100%;',
  ];
  const pinned = pinnedRules(s, d, c('outer'), c('stage'), {
    outer: [note(d, '/* Its trip through the window, as a timeline the track can follow. */'), `view-timeline: ${keys.timeline} block;`],
    stage: [note(d, '/* So that 100cqw in the keyframes is the stage’s width. */'), 'container-type: inline-size;'],
  });
  pinned.push([c('track'), anim(keys.slide, true)]);
  pinned.push([`${c('stage')}:has(:focus-visible)`, [
    note(d, '/* Tab into a panel: stop the slide, and the row scrolls to it. */'),
    'overflow-x: auto;',
  ]]);
  pinned.push([`${c('stage')}:has(:focus-visible) ${c('track')}`, ['animation: none;']]);
  if (s.bar) {
    pinned.push(barPinned(d, c('bar')));
    pinned.push([`${c('bar')} span`, anim(keys.fill, false)]);
  }
  const keyframes = [
    `@keyframes ${keys.slide} {\n  from { transform: translateX(0); }\n  to   { transform: translateX(calc(100cqw - 100%)); }\n}`,
    ...(s.bar ? [`@keyframes ${keys.fill} {\n  from { transform: scaleX(0); }\n  to   { transform: scaleX(1); }\n}`] : []),
  ];
  return [
    head(d, [
      `/* A horizontal scroll section in CSS only: ${s.panels} panels, ${s.width}${s.unit} wide, ${s.gap}px apart.`,
      '   Where the browser has no scroll timelines, or the reader asks for less',
      '   motion, it stays a row you scroll sideways. */',
    ]) + rules(d, baseRules(s, d)),
    [
      '@supports (animation-timeline: view()) {',
      '  @media (prefers-reduced-motion: no-preference) {',
      rules(d, pinned, pad),
      '  }',
      '}',
    ].join('\n'),
    ...keyframes,
    ...(timing.error > 0 && d.notes ? [`/* linear() follows '${s.easing}' to within ${timing.error.toFixed(4)} of its curve. */`] : []),
  ].join('\n\n');
}

// ── HTML ────────────────────────────────────────────────────────────────────

export function htmlCode(s: Settings): string {
  const panels = Array.from({ length: s.panels }, (_, i) => [
    '      <li class="hs-panel">',
    `        <h3>Panel ${i + 1}</h3>`,
    '        <p>Your content.</p>',
    `        <a href="/panel-${i + 1}">Read more</a>`,
    '      </li>',
  ].join('\n'));
  return [
    '<section class="hs-outer" aria-label="Highlights">',
    '  <div class="hs-stage">',
    '    <ul class="hs-track">',
    ...panels,
    '    </ul>',
    ...(s.bar ? ['    <div class="hs-bar" aria-hidden="true"><span></span></div>'] : []),
    '  </div>',
    '</section>',
    '',
    '<!-- The script version. The CSS-only version needs no script. -->',
    '<script type="module" src="main.js"></script>',
  ].join('\n');
}

// ── JavaScript ──────────────────────────────────────────────────────────────

/** The options that differ from scrollHorizontal's defaults, as [key, code]. */
function optionLines(s: Settings, bar: string): [string, string][] {
  const out: [string, string][] = [];
  if (s.easing !== LIB.easing) out.push(['easing', `'${s.easing}'`]);
  if (s.bar) out.push(['onProgress', `(p) => { ${bar}.style.transform = \`scaleX(\${p})\`; }`]);
  return out;
}

/**
 * How the focus handler turns a panel's place in the track (p, the share of the
 * travel) into the scroll that shows it, for this easing: the inverse of the
 * curve, where the strip first reaches p. The curves are the library's own
 * (core/easing.ts: EASINGS, createSpring, createBounce and createElastic at
 * their defaults); `ts` adds the parameter types for the React version.
 */
function undoEasing(easing: EasingName, pad: string, ts: boolean): string[] {
  const n = ts ? 't: number' : 't';
  const search = (name: string, fn: string) => [
    `${pad}// '${name}' runs past its end, so the strip shows p before the scroll gets`,
    `${pad}// there: find the first scroll where it does, on the same curve.`,
    `${pad}const ${name} = (${n}) => ${fn};`,
    `${pad}let t = 0;`,
    `${pad}while (t < 1 && ${name}(t) < p) t += 0.001;`,
    `${pad}p = t;`,
  ];
  switch (easing) {
    case 'linear':
      return [];
    case 'ease-in':
      return [`${pad}// ease-in is t², so the scroll that shows p is √p.`, `${pad}p = Math.sqrt(p);`];
    case 'ease-out':
      return [`${pad}// ease-out is t(2 − t); undo it.`, `${pad}p = 1 - Math.sqrt(1 - p);`];
    case 'ease-in-out':
      return [`${pad}// ease-in-out is 2t² to ½, then −1 + (4 − 2t)t; undo it.`, `${pad}p = p < 0.5 ? Math.sqrt(p / 2) : 1 - Math.sqrt((1 - p) / 2);`];
    case 'bounce':
      return [
        `${pad}// 'bounce' first rises to 1 as t(2 − t) over the first 1 / (1.5 + √½)`,
        `${pad}// of the scroll, then dips and lands again; undo that first rise.`,
        `${pad}p = (1 - Math.sqrt(1 - p)) / (1.5 + Math.SQRT1_2);`,
      ];
    case 'spring':
      return search('spring', '1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2)');
    case 'elastic':
      return search('elastic', '(t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1)');
  }
}

export function jsCode(s: Settings): string {
  const opts = optionLines(s, 'bar');
  const call = opts.length
    ? [`scrollHorizontal(track, {`, ...opts.map(([k, v]) => `  ${k}: ${v},`), '});']
    : ['scrollHorizontal(track);'];
  const undo = undoEasing(s.easing, '  ', false);
  return [
    "import { scrollHorizontal } from 'svg-scroll-draw/horizontal';",
    '// No bundler? Import it from',
    `// ${CDN_URL}`,
    '',
    "const outer = document.querySelector('.hs-outer');",
    "const track = outer.querySelector('.hs-track');",
    ...(s.bar ? ["const bar = outer.querySelector('.hs-bar span');"] : []),
    '',
    '// Pin it first: scrollHorizontal finds the sticky stage when it starts, and',
    '// takes the scroll window from the stage’s parent, .hs-outer.',
    "outer.classList.add('is-pinned');",
    '',
    ...call,
    '',
    '// The stage is overflow: clip, so Tab cannot scroll it to a panel off to the',
    '// side. Scroll the page to where the strip shows that panel instead, a frame',
    '// later, after the browser’s own scroll to the focused element.',
    "track.addEventListener('focusin', (e) => {",
    "  const panel = e.target.closest('.hs-panel');",
    '  if (!panel) return;',
    '  const travel = track.scrollWidth - track.parentElement.clientWidth;',
    '  // How far this panel starts after the first; both carry the same translateX.',
    '  const at = panel.getBoundingClientRect().left - track.firstElementChild.getBoundingClientRect().left;',
    `  ${undo.length ? 'let' : 'const'} p = travel > 0 ? Math.min(1, at / travel) : 0;`,
    ...undo,
    '  const top = outer.getBoundingClientRect().top + scrollY + p * (outer.offsetHeight - innerHeight);',
    '  requestAnimationFrame(() => scrollTo({ top }));',
    '});',
  ].join('\n');
}

// ── React ───────────────────────────────────────────────────────────────────

export function reactCode(s: Settings): string {
  const opts = optionLines(s, 'bar.current').map(([k, v]) =>
    k === 'onProgress'
      ? ['      onProgress: (p) => {', '        if (bar.current) bar.current.style.transform = `scaleX(${p})`;', '      },']
      : [`      ${k}: ${v},`],
  ).flat();
  const call = opts.length ? ['    const strip = scrollHorizontal(row, {', ...opts, '    });'] : ['    const strip = scrollHorizontal(row);'];
  const undo = undoEasing(s.easing, '      ', true);
  return [
    "'use client';",
    '',
    "import { useEffect, useRef } from 'react';",
    "import { scrollHorizontal } from 'svg-scroll-draw/horizontal';",
    "import './horizontal-scroll.css';",
    '',
    'const PANELS = [',
    ...Array.from({ length: s.panels }, (_, i) => `  { title: 'Panel ${i + 1}', href: '/panel-${i + 1}' },`),
    '];',
    '',
    'export function HorizontalScroll() {',
    '  const outer = useRef<HTMLElement>(null);',
    '  const track = useRef<HTMLUListElement>(null);',
    ...(s.bar ? ['  const bar = useRef<HTMLSpanElement>(null);'] : []),
    '',
    '  useEffect(() => {',
    '    const section = outer.current;',
    '    const row = track.current;',
    '    if (!section || !row) return;',
    '',
    '    // Pin it first: scrollHorizontal finds the sticky stage when it starts.',
    "    section.classList.add('is-pinned');",
    ...call,
    '',
    '    // overflow: clip keeps Tab from scrolling the stage: scroll the page to the panel.',
    '    const onFocus = (e: FocusEvent) => {',
    "      const panel = (e.target as Element).closest('.hs-panel');",
    '      const first = row.firstElementChild;',
    '      if (!panel || !first) return;',
    '      const travel = row.scrollWidth - (row.parentElement?.clientWidth ?? 0);',
    '      const at = panel.getBoundingClientRect().left - first.getBoundingClientRect().left;',
    `      ${undo.length ? 'let' : 'const'} p = travel > 0 ? Math.min(1, at / travel) : 0;`,
    ...undo,
    '      const top = section.getBoundingClientRect().top + window.scrollY + p * (section.offsetHeight - window.innerHeight);',
    '      requestAnimationFrame(() => window.scrollTo({ top }));',
    '    };',
    "    row.addEventListener('focusin', onFocus);",
    '',
    '    return () => {',
    "      row.removeEventListener('focusin', onFocus);",
    '      strip.destroy();',
    "      section.classList.remove('is-pinned');",
    '    };',
    '  }, []);',
    '',
    '  return (',
    '    <section ref={outer} className="hs-outer" aria-label="Highlights">',
    '      <div className="hs-stage">',
    '        <ul ref={track} className="hs-track">',
    '          {PANELS.map((panel) => (',
    '            <li key={panel.href} className="hs-panel">',
    '              <h3>{panel.title}</h3>',
    '              <p>Your content.</p>',
    '              <a href={panel.href}>Read more</a>',
    '            </li>',
    '          ))}',
    '        </ul>',
    ...(s.bar ? ['        <div className="hs-bar" aria-hidden="true"><span ref={bar} /></div>'] : []),
    '      </div>',
    '    </section>',
    '  );',
    '}',
  ].join('\n');
}
