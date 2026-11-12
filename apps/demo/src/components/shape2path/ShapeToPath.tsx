'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { sanitizeSvg } from '@/lib/svg-sanitize';
import { cdnModule, downloadText, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { SHAPE_TAGS, fmt, type Precision, type ShapeTag } from './convert';
import { convertSvg, type Row } from './convert-svg';
import { SAMPLE } from './sample';

/**
 * The SVG shape to path converter.
 *
 * - The conversion (convert-svg.ts, maths in convert.ts) runs on the pasted
 *   text as data and writes text back; nothing pasted is put on the page.
 * - The two previews are the pasted SVG and the converted one, each rebuilt
 *   by sanitizeSvg and drawn by scrollDraw with its default selector, so the
 *   difference shows: an <ellipse> stays drawn on the left, a rounded rect's
 *   line closes early. Play replays both; the slider seek()s both.
 * - The code is written from the same result, with only the options that
 *   differ from scrollDraw's defaults, and each listing starts with the
 *   source line (lib/tool-export.ts).
 * - Under the code, the JavaScript tab runs as a page of its own: the drawing
 *   the After preview shows (Line view or as pasted, rebuilt by sanitizeSvg,
 *   so nothing pasted can run there either) in a page tall enough to scroll
 *   it through the window, as an HTML file or a React project on StackBlitz.
 *
 * Parsing needs DOMParser, so it starts after mount: the server render and
 * the first client render are the same empty state.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;
type Tab = 'svg' | 'd' | 'js' | 'react';
/**
 * The After preview written out as markup and as JSX, for the page under the
 * code. `src` and `lineView` say which preview it was written from, so a
 * drawing from the previous paste is never handed on.
 */
type Written = { src: unknown; lineView: boolean; markup: string; jsx: string };

const SLUG = 'svg-shape-to-path-converter';

/** scrollDraw's default `selector` (packages/svg-scroll-draw/src/core/engine.ts). */
const DEFAULT_SELECTOR = 'path, polyline, line, polygon, rect, circle';
const WITH_ELLIPSE = `${DEFAULT_SELECTOR}, ellipse`;
const GEOMETRY = WITH_ELLIPSE;
const PLAY_MS = 1600;
const MAX_ROWS = 200;
const PRECISIONS: readonly Precision[] = ['exact', 3, 2, 1];
const TABS: readonly [Tab, string, string][] = [
  ['svg', 'SVG', 'converted.svg'],
  ['d', 'Path data', 'paths.txt'],
  ['js', 'JavaScript', 'main.js'],
  ['react', 'React', 'Drawing.tsx'],
];

/**
 * A stagger that keeps the whole run under about twice one path's duration:
 * 0.1 for up to 11 paths, less for more (scrollDraw's own `stagger` option).
 */
function staggerFor(n: number): number {
  return n > 1 ? Math.max(0.01, Math.min(0.1, Math.floor(100 / (n - 1)) / 100)) : 0;
}

export function ShapeToPath({ version }: { version: string }) {
  const [input, setInput] = useState(SAMPLE);
  const [source, setSource] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<readonly ShapeTag[]>(SHAPE_TAGS);
  const [arcs, setArcs] = useState<2 | 4>(2);
  const [precision, setPrecision] = useState<Precision>('exact');
  const [lineView, setLineView] = useState(true);
  const [progress, setProgress] = useState(0);
  const [drawn, setDrawn] = useState<{ before: number; after: number; total: number } | null>(null);
  /** Reduced motion: scrollDraw shows every drawing finished, so there is nothing to play. */
  const [still, setStill] = useState(false);
  const [tab, setTab] = useState<Tab>('svg');
  /** The viewBox the previews were framed with when the paste had none (shapes on their own). */
  const [frame, setFrame] = useState<string | null>(null);
  const [written, setWritten] = useState<Written | null>(null);
  const beforeHost = useRef<HTMLDivElement>(null);
  const afterHost = useRef<HTMLDivElement>(null);
  const insts = useRef<Instance[]>([]);
  const first = useRef(true);

  // The first parse at once, then debounced so a half-pasted SVG is not parsed on every key.
  useEffect(() => {
    const id = setTimeout(() => setSource(input), first.current ? 0 : 250);
    first.current = false;
    return () => clearTimeout(id);
  }, [input]);

  const conv = useMemo(
    () => (source === null ? null : convertSvg(source, { arcs, precision }, enabled)),
    [source, arcs, precision, enabled],
  );
  const ok = conv?.ok ? conv : null;
  const preview = useMemo(() => (ok ? { before: sanitizeSvg(ok.before), after: sanitizeSvg(ok.after) } : null), [ok]);
  const previewError = !preview || (preview.before.ok && preview.after.ok) ? ''
    : [preview.before, preview.after].map((p) => (p.ok ? '' : p.error)).find((e) => /characters/.test(e))
      ?? 'Nothing to preview: every shape is inside <defs>, <symbol>, a mask or a pattern, drawn only where it is used. The conversion below still applies.';

  /** How many elements scrollDraw will draw in the converted SVG, with the selector the code passes. */
  const plan = useMemo(() => {
    if (!ok) return { n: 0, ellipse: false };
    // An ellipse left as one (switched off, or kept) needs the selector to say ellipse.
    const ellipse = ok.rows.some((r) => r.tag === 'ellipse' && r.status !== 'converted');
    const n = ok.paths + ok.rows.filter((r) => r.status === 'converted' || r.tag !== 'ellipse' || ellipse).length;
    return { n, ellipse };
  }, [ok]);
  const stagger = staggerFor(plan.n);

  useEffect(() => {
    const hb = beforeHost.current;
    const ha = afterHost.current;
    if (!hb || !ha) return;
    hb.replaceChildren();
    ha.replaceChildren();
    if (!preview?.before.ok || !preview.after.ok) return;

    // Copies: Line view restyles them, and the parse is kept for the next toggle.
    const svgs = [preview.before.svg, preview.after.svg].map((s) => s.cloneNode(true) as SVGSVGElement);
    [hb, ha].forEach((host, k) => { svgs[k].classList.add('s2p-svg'); host.appendChild(svgs[k]); });

    // No viewBox: frame both from the pasted drawing's bounds, so they line up.
    let framed: string | null = null;
    if (!svgs[0].getAttribute('viewBox')) {
      try {
        const b = svgs[0].getBBox();
        const pad = Math.max(b.width, b.height) * 0.06 + 2;
        framed = [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map((n) => fmt(n, 2)).join(' ');
        svgs.forEach((s) => s.setAttribute('viewBox', framed as string));
      } catch { /* nothing drawable */ }
    }

    // Line view: every shape as a line, fills off, a stroke where there is none.
    // Not vector-effect: non-scaling-stroke, which measures dashes in screen
    // pixels while the dash length is in SVG units.
    if (lineView) {
      for (const svg of svgs) {
        const vb = svg.viewBox.baseVal;
        const width = fmt(Math.max(vb?.width || 0, vb?.height || 0, 1) / 180, 2);
        for (const el of Array.from(svg.querySelectorAll<SVGElement>(GEOMETRY))) {
          const cs = getComputedStyle(el);
          const stroked = cs.stroke !== 'none' && cs.strokeWidth !== '0px' && cs.strokeOpacity !== '0';
          el.setAttribute('fill', 'none');
          el.removeAttribute('vector-effect');
          if (!stroked) {
            el.setAttribute('stroke', 'currentColor');
            el.setAttribute('stroke-width', width);
          }
        }
      }
    }
    // Written out before scrollDraw styles the shapes: the page under the code
    // runs the drawing the After preview shows.
    const out: Written = { src: preview, lineView, markup: markup(svgs[1], false), jsx: markup(svgs[1], true) };

    let live = true;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      setFrame(framed);
      setWritten(out);
      // autoplay plays each one when it comes on screen (once), on its own
      // clock; replay() and seek() drive both from the transport. once: true
      // already keeps scrollDraw off its CSS scroll-timeline path; native:
      // false says so outright, because in 2.23.2 and earlier autoplay alone
      // did not, and a lone shape with no callbacks followed the page scroll
      // instead of the clock (fixed in 2.23.3).
      insts.current = [hb, ha].map((host, k) => scrollDraw(host, {
        autoplay: true,
        duration: PLAY_MS,
        stagger,
        once: true,
        native: false,
        onProgress: k === 1 ? setProgress : undefined,
      }));
      setProgress(insts.current[1].getProgress());
      setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      setDrawn({
        before: hb.querySelectorAll(DEFAULT_SELECTOR).length,
        after: ha.querySelectorAll(DEFAULT_SELECTOR).length,
        total: hb.querySelectorAll(GEOMETRY).length,
      });
    });
    return () => {
      live = false;
      insts.current.forEach((i) => i.destroy());
      insts.current = [];
    };
  }, [preview, lineView, stagger]);

  function replay() {
    insts.current.forEach((i) => i.replay());
  }

  function scrub(p: number) {
    insts.current.forEach((i) => i.seek(p));
    setProgress(p);
  }

  function toggle(tag: ShapeTag) {
    setEnabled((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : SHAPE_TAGS.filter((t) => t === tag || cur.includes(t))));
  }

  function download() {
    if (!ok) return;
    const vb = frame ? ` viewBox="${frame}"` : '';
    const file = ok.fragment ? `<svg xmlns="http://www.w3.org/2000/svg"${vb}>\n${ok.output}\n</svg>` : ok.output;
    downloadText('converted.svg', `${withSource(file, SLUG, 'svg')}\n`, 'image/svg+xml');
  }

  const counts = useMemo(() => {
    const c: Partial<Record<ShapeTag, number>> = {};
    for (const r of ok?.rows ?? []) c[r.tag] = (c[r.tag] ?? 0) + 1;
    return c;
  }, [ok]);

  const allPaths = !!ok && ok.rows.every((r) => r.status === 'converted');
  const code = useMemo(() => {
    if (!ok) return '';
    if (tab === 'svg') return withSource(ok.output, SLUG, 'svg');
    if (tab === 'd') return withSource(pathData(ok.rows), SLUG, 'js');
    if (tab === 'js') return withSource(jsCode(stagger, plan.ellipse, allPaths), SLUG, 'js');
    return withSource(reactCode(stagger, plan.ellipse, ok.rootAttrs, ok.viewBox ?? frame), SLUG, 'tsx');
  }, [ok, tab, stagger, plan.ellipse, allPaths, frame]);
  const run = useMemo(
    () => (written && written.src === preview && written.lineView === lineView
      ? {
        html: htmlPage(written.markup, stagger, plan.ellipse, allPaths, version),
        react: reactProject(written.jsx, stagger, plan.ellipse, version),
      }
      : null),
    [written, preview, lineView, stagger, plan.ellipse, allPaths, version],
  );

  const error = conv && !conv.ok ? conv.error : '';
  const tally = ok ? summary(ok.rows, ok.paths) : '';

  return (
    <div className="s2p">
      <div className="s2p-panel">
        <label className="s2p-input">
          <span>Paste an SVG, or one or more shapes</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={8}
            aria-label="SVG markup"
          />
        </label>

        <div className="s2p-controls">
          <Field label="Convert" wide>
            <span className="s2p-types" role="group" aria-label="Shapes to convert">
              {SHAPE_TAGS.map((t) => (
                <button key={t} type="button" aria-pressed={enabled.includes(t)} onClick={() => toggle(t)}>
                  {t}<span>{counts[t] ?? 0}</span>
                </button>
              ))}
            </span>
          </Field>
          <Field label="circle and ellipse">
            <Seg value={String(arcs)} options={['2', '4']} labels={['2 arcs', '4 arcs']} onChange={(v) => setArcs(v === '4' ? 4 : 2)} label="Arcs per circle" />
          </Field>
          <Field label="numbers">
            <Seg
              value={String(precision)}
              options={PRECISIONS.map(String)}
              labels={['exact', '.000', '.00', '.0']}
              onChange={(v) => setPrecision(v === 'exact' ? 'exact' : (Number(v) as Precision))}
              label="Decimal places"
            />
          </Field>
          <Field label="input">
            <span className="s2p-pair">
              <button type="button" className="s2p-btn" onClick={() => setInput(SAMPLE)}>Sample</button>
              <button type="button" className="s2p-btn" onClick={() => setInput('')}>Clear</button>
            </span>
          </Field>
        </div>

        {error && <p className="s2p-error" role="alert">{error}</p>}
        {/* Kept mounted while an error shows: the next valid paste renders into it. */}
        <div hidden={!!error}>
          {previewError && <p className="s2p-error">{previewError}</p>}
          <div className="s2p-stages" hidden={!!previewError}>
            <div className="s2p-stage">
              <p className="s2p-stage-k">
                <span>Before · as pasted</span>
                <span>{drawn ? `scrollDraw draws ${drawn.before} of ${drawn.total}` : '…'}</span>
              </p>
              <div ref={beforeHost} className="s2p-host" />
            </div>
            <div className="s2p-stage">
              <p className="s2p-stage-k">
                <span>After · converted</span>
                <span>{drawn ? `scrollDraw draws ${drawn.after} of ${drawn.total}` : '…'}</span>
              </p>
              <div ref={afterHost} className="s2p-host" />
            </div>
          </div>
          <div className="s2p-transport" hidden={!!previewError}>
            <button type="button" className="s2p-btn" onClick={replay} disabled={still}>↻ Replay</button>
            <label className="s2p-scrub">
              <span>{still ? 'reduced motion is on · shown drawn' : `progress · ${progress.toFixed(2)}`}</span>
              <input
                type="range" min={0} max={1} step={0.01} value={progress} disabled={still}
                aria-label="Drawing progress" onChange={(e) => scrub(Number(e.target.value))}
              />
            </label>
            <label className="s2p-check">
              <input type="checkbox" checked={lineView} onChange={(e) => setLineView(e.target.checked)} />
              <span>Line view</span>
            </label>
          </div>
        </div>
      </div>

      {ok && (
        <>
          <div className="s2p-results">
            <p className="s2p-tally">{tally}</p>
            {ok.warnings.length > 0 && (
              <ul className="s2p-warn" aria-label="Checks">
                {ok.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
            {ok.rows.length > 0 && (
              <div className="s2p-scroll" tabIndex={0} role="region" aria-label="What was converted">
                <table className="s2p-table">
                  <thead>
                    <tr><th>#</th><th>Element</th><th>Became</th><th>Commands</th><th>Dash before</th><th>Dash after</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {ok.rows.slice(0, MAX_ROWS).map((r) => (
                      <tr key={r.i} className={r.status === 'converted' ? undefined : 'is-kept'}>
                        <td>{r.i}</td>
                        <td>{`<${r.tag}>`}{r.id ? ` #${r.id}` : ''}</td>
                        <td data-k="became">{r.status === 'converted' ? '<path>' : r.status === 'off' ? 'off' : 'kept'}</td>
                        <td data-k="commands">{r.commands}</td>
                        <td data-k="dash before">{r.before === null ? (r.tag === 'ellipse' && r.status !== 'kept' ? 'skipped' : '—') : fmt(r.before, 2)}</td>
                        <td data-k="dash after">{r.after === null ? '—' : fmt(r.after, 2)}</td>
                        <td className={r.notes.length ? 's2p-notes' : 's2p-notes is-empty'}>{r.notes.join(' ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {ok.rows.length > MAX_ROWS && <p className="s2p-tally">And {ok.rows.length - MAX_ROWS} more, all in the output below.</p>}
            {ok.rows.length > 0 && (
              <p className="s2p-legend">
                Dash: the length scrollDraw gives the line’s dash, in the shape’s own units. For a {'<rect>'} it is 2 ×
                (width + height), whatever the corners; a path is measured along its curves. Skipped: not in the default
                selector.
              </p>
            )}
          </div>

          <div className="s2p-code">
            <div className="s2p-code-bar">
              <div className="s2p-tabs" role="tablist" aria-label="Output">
                {TABS.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} className="s2p-tab" onClick={() => setTab(k)}>{label}</button>
                ))}
              </div>
              <button type="button" className="s2p-btn s2p-dl" onClick={download}>↓ Download .svg</button>
            </div>
            <CodeBox file={TABS.find(([k]) => k === tab)?.[2] ?? 'converted.svg'}>{code}</CodeBox>
            {run && <ToolExport title={RUN_TITLE} filename="converted-drawing.html" html={run.html} react={run.react} />}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`s2p-field${wide ? ' is-wide' : ''}`}>
      <span className="s2p-field-k">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, labels, onChange, label }: {
  value: string; options: readonly string[]; labels: readonly string[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <span className="s2p-seg" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{labels[i]}</button>
      ))}
    </span>
  );
}

// ── The written-out results ─────────────────────────────────────────────────

function summary(rows: Row[], paths: number): string {
  const n = (s: Row['status']) => rows.filter((r) => r.status === s).length;
  const parts = [
    [n('converted'), 'converted to a path', 'converted to paths'],
    [n('kept'), 'left as it is', 'left as they are'],
    [n('off'), 'switched off', 'switched off'],
  ] as const;
  const out = parts.filter(([c]) => c > 0).map(([c, one, many]) => `${c} ${c === 1 ? `shape ${one}` : `shapes ${many}`}`);
  if (paths) out.push(`${paths} ${paths === 1 ? 'path' : 'paths'} kept as written`);
  return out.join(' · ');
}

function pathData(rows: Row[]): string {
  const done = rows.filter((r) => r.d);
  if (!done.length) return '// Nothing was converted.';
  return done.map((r) => `// <${r.tag}> #${r.i}${r.id ? ` (id="${r.id}")` : ''}\n${r.d}`).join('\n\n');
}

/** The comment over the JavaScript tab's call, which the page under the code runs as written. */
function drawNote(ellipse: boolean, allPaths: boolean): string {
  return `// ${ellipse ? 'An <ellipse> is left, so the selector adds it.'
    : allPaths ? 'Every shape is a <path> now: the default selector finds them all.'
      : 'The default selector finds the paths and the shapes left as they are.'}`;
}

function drawCall(stagger: number, ellipse: boolean): string {
  const opts = [
    ellipse ? `  selector: '${WITH_ELLIPSE}',` : '',
    stagger ? `  stagger: ${stagger},` : '',
  ].filter(Boolean);
  return opts.length ? `scrollDraw('#drawing', {\n${opts.join('\n')}\n});` : `scrollDraw('#drawing');`;
}

function jsCode(stagger: number, ellipse: boolean, allPaths: boolean): string {
  return `// <div id="drawing"> + the converted SVG + </div>

import { scrollDraw } from 'svg-scroll-draw';

${drawNote(ellipse, allPaths)}
${drawCall(stagger, ellipse)}`;
}

/** The React tab's component around `svg`, JSX lines already indented to sit in it. */
function drawingComponent(stagger: number, ellipse: boolean, svg: string): string {
  const props = [ellipse ? ` selector="${WITH_ELLIPSE}"` : '', stagger ? ` stagger={${stagger}}` : ''].join('');
  return `export function Drawing() {
  return (
    <ScrollDraw${props}>
${svg}
    </ScrollDraw>
  );
}`;
}

function reactCode(stagger: number, ellipse: boolean, rootAttrs: [string, string][], viewBox: string | null): string {
  // The <svg>'s own attributes (the stroke the paths inherit, often), in JSX names.
  const attrs = rootAttrs.filter(([n]) => !/^(xmlns|version$|style$|xml:)/.test(n)).map(([n, v]) => [jsxName(n), v]);
  if (viewBox && !attrs.some(([n]) => n === 'viewBox')) attrs.unshift(['viewBox', viewBox]);
  const open = attrs.length > 2
    ? `<svg\n${attrs.map(([n, v]) => `        ${n}="${v.replace(/"/g, '&quot;')}"`).join('\n')}\n      >`
    : `<svg${attrs.map(([n, v]) => ` ${n}="${v.replace(/"/g, '&quot;')}"`).join('')}>`;
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

${drawingComponent(stagger, ellipse, `      ${open}
        {/* the converted paths: in JSX, stroke-width is strokeWidth and class is className */}
      </svg>`)}`;
}

/**
 * An element written out one to a line, as markup or as JSX (React's
 * attribute names). Used on the After preview, which sanitizeSvg rebuilt from
 * drawing elements and plain values only; the class the preview adds is left
 * out.
 */
function markup(el: Element, jsx: boolean, depth = 0): string {
  const pad = '  '.repeat(depth);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== 'class' && a.name !== 'style')
    .map((a) => ` ${jsx ? jsxName(a.name) : a.name}="${escapeHtml(a.value)}"`);
  const open = `${pad}<${el.localName}${attrs.join('')}`;
  const kids = Array.from(el.children);
  if (!kids.length) return `${open} />`;
  return [`${open}>`, ...kids.map((k) => markup(k, jsx, depth + 1)), `${pad}</${el.localName}>`].join('\n');
}

const indent = (s: string, n: number) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');

// ── The page under the code ─────────────────────────────────────────────────

const RUN_TITLE = 'Converted SVG on scroll';
const RUN_INTRO = 'Scroll down: the converted drawing draws as it passes through the window, and undraws as you scroll back up.';
const runOutro = (stagger: number) =>
  `That is scrollDraw’s default trigger: the drawing starts as its top comes into the bottom of the window and finishes as its bottom leaves the top${stagger ? ', each shape a little after the one before' : ''}.`;
/**
 * A screen above the drawing, so it starts undrawn, and more than a screen
 * below: the default trigger ends when the drawing's bottom leaves the top of
 * the window, and with a stagger the later shapes end after that.
 */
const RUN_CSS = `body {
  margin: 0;
  font: 16px/1.6 system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}
.intro, .outro {
  display: grid;
  place-content: center;
  min-height: 100vh;
  padding: 0 24px;
  text-align: center;
}
.outro { min-height: 150vh; }
svg {
  display: block;
  width: min(100% - 48px, 560px);
  height: auto;
  max-height: 80vh;
  margin: 0 auto;
}`;

/** The JavaScript tab as a page, around the drawing the After preview shows. */
function htmlPage(svg: string, stagger: number, ellipse: boolean, allPaths: boolean, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: RUN_TITLE,
    css: RUN_CSS,
    body: [
      '<header class="intro">',
      `  <h1>${RUN_TITLE}</h1>`,
      `  <p>${RUN_INTRO}</p>`,
      '</header>',
      '<div id="drawing">',
      indent(svg, 2),
      '</div>',
      '<footer class="outro">',
      `  <p>${runOutro(stagger)}</p>`,
      '</footer>',
    ].join('\n'),
    script: [
      `import { scrollDraw } from '${cdnModule(version)}';`,
      '',
      drawNote(ellipse, allPaths),
      drawCall(stagger, ellipse),
    ].join('\n'),
  });
}

/** The React tab's component with the drawing in it, as a Vite project. */
function reactProject(svgJsx: string, stagger: number, ellipse: boolean, version: string): Omit<ReactProject, 'title'> {
  const app = [
    "import { ScrollDraw } from 'svg-scroll-draw/react';",
    '',
    drawingComponent(stagger, ellipse, indent(svgJsx, 6)),
    '',
    'export default function App() {',
    '  return (',
    '    <main>',
    '      <header className="intro">',
    `        <h1>${RUN_TITLE}</h1>`,
    `        <p>${RUN_INTRO}</p>`,
    '      </header>',
    '      <Drawing />',
    '      <footer className="outro">',
    `        <p>${runOutro(stagger)}</p>`,
    '      </footer>',
    '    </main>',
    '  );',
    '}',
  ].join('\n');
  return { slug: SLUG, app, css: withSource(RUN_CSS, SLUG, 'css'), version };
}

/** An SVG attribute's name in JSX: class is className, the rest camelCase (data-* and aria-* stay). */
function jsxName(name: string): string {
  if (name === 'class') return 'className';
  if (/^(data|aria)-/.test(name)) return name;
  return name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());
}
