'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { sanitizeSvg } from '@/lib/svg-sanitize';

/**
 * The SVG path viewer. Paste an SVG (or one path's d value): it is rebuilt from
 * drawing elements only (lib/svg-sanitize.ts), shown, measured with the
 * browser's own getTotalLength(), checked for what stops a line drawing from
 * working, and drawn with scrollDraw, the library this site is about. The
 * preview plays when it comes on screen and on Replay, and the progress slider
 * scrubs it, all through the instance's seek().
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;
type Shape = { i: number; tag: string; length: number | null; commands: string; stroke: boolean; fill: boolean; nonScaling: boolean };

/** What scrollDraw draws by default (its `selector` option). */
const DRAWN = new Set(['path', 'polyline', 'line', 'polygon', 'rect', 'circle']);
const GEOMETRY = 'path, polyline, polygon, line, rect, circle, ellipse';
const PLAY_MS = 1800;
const STAGGER = 0.12;
const EMPTY: Record<string, number> = {};

/** A small line illustration: a striped sun setting into the sea, two palms on a beach, a city skyline. */
const SAMPLE = `<svg viewBox="0 0 320 180" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 130 H310" />
  <path d="M124 130 A 42 42 0 0 1 208 130" />
  <path d="M140 100 H192 M132 110 H200 M128 120 H204" />
  <path d="M136 140 H196 M148 148 H184 M158 156 H174" />
  <path d="M214 130 V100 H226 V88 H236 V104 H246 V76 H256 V96 H266 V70 L272 62 L278 70 V110 H288 V92 H298 V130" />
  <path d="M14 160 Q 70 150 130 160" />
  <path d="M60 157 C 62 130, 58 100, 72 74" />
  <path d="M72 74 Q 52 64 34 74 M72 74 Q 60 54 40 52 M72 74 Q 84 54 104 56 M72 74 Q 92 66 106 82" />
  <path d="M96 156 C 98 140, 94 124, 102 108" />
  <path d="M102 108 Q 88 100 76 108 M102 108 Q 108 98 116 101" />
</svg>`;

export function SvgPathViewer() {
  const [input, setInput] = useState(SAMPLE);
  const [source, setSource] = useState(SAMPLE);
  const [lineView, setLineView] = useState(true);
  const [result, setResult] = useState<{ shapes: Shape[]; notes: string[]; clean: string }>({ shapes: [], notes: [], clean: '' });
  const [progress, setProgress] = useState(1);
  const [tab, setTab] = useState<'css' | 'js' | 'react' | 'svg'>('css');
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const raf = useRef(0);

  // Debounce typing so a half-pasted SVG is not parsed on every key.
  useEffect(() => {
    const id = setTimeout(() => setSource(input), 300);
    return () => clearTimeout(id);
  }, [input]);

  // Parsing is pure: the error and what was left out come straight from it.
  const parsed = useMemo(() => (typeof window === 'undefined' ? null : sanitizeSvg(source)), [source]);
  const error = parsed && !parsed.ok ? parsed.error : '';
  const removed = parsed?.ok ? parsed.removed : EMPTY;
  const { shapes, notes, clean } = parsed?.ok ? result : { shapes: [] as Shape[], notes: [] as string[], clean: '' };

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    box.replaceChildren();
    if (!parsed?.ok) return;
    const res = parsed;
    // A copy: Line view restyles the shapes, and the parse is kept for the next toggle.
    const svg = res.svg.cloneNode(true) as SVGSVGElement;
    svg.classList.add('sv-svg');
    box.appendChild(svg);

    const extra: string[] = [];
    // No viewBox: frame the drawing from its own bounds, with a margin.
    if (!svg.getAttribute('viewBox')) {
      try {
        const b = svg.getBBox();
        const pad = Math.max(b.width, b.height) * 0.06 + 2;
        svg.setAttribute('viewBox', `${round(b.x - pad)} ${round(b.y - pad)} ${round(b.width + pad * 2)} ${round(b.height + pad * 2)}`);
      } catch { /* empty drawing */ }
      if (!res.wasBarePath) extra.push('The SVG has no viewBox, so the drawing will not scale with its box. One was worked out from the shapes for this preview.');
    }
    const cleanSvg = svg.outerHTML.replace(/ class="sv-svg"/, '');

    const els = Array.from(svg.querySelectorAll<SVGGeometryElement>(GEOMETRY));
    const measured: Shape[] = els.map((el, i) => {
      const cs = getComputedStyle(el);
      let length: number | null = null;
      try { length = lengthOf(el); } catch { length = null; }
      const d = el.getAttribute('d') ?? '';
      return {
        i: i + 1,
        tag: el.localName,
        length,
        commands: el.localName === 'path' ? summarize(d) : '—',
        stroke: cs.stroke !== 'none' && cs.strokeWidth !== '0px' && cs.strokeOpacity !== '0',
        fill: cs.fill !== 'none' && cs.fillOpacity !== '0',
        nonScaling: (el.getAttribute('vector-effect') ?? cs.getPropertyValue('vector-effect')).includes('non-scaling-stroke'),
      };
    });

    // The preview look: every shape as a thin line, or as pasted.
    // Not vector-effect: non-scaling-stroke, which measures dashes in screen
    // pixels while the dash length is in SVG units, and leaves a scaled-up
    // drawing with gaps. The width is set from the viewBox size instead.
    if (lineView) {
      const vb = svg.viewBox.baseVal;
      const width = String(round(Math.max(vb?.width || 0, vb?.height || 0, 1) / 180));
      for (const el of els) {
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', 'currentColor');
        el.setAttribute('stroke-width', width);
        el.removeAttribute('vector-effect');
      }
    }

    let live = true;
    let seen: IntersectionObserver | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      // Played here with seek() rather than autoplay's own clock, so Replay
      // and the slider drive one timeline. With several shapes it staggers as
      // the generated code does (seek() spans the whole staggered run).
      inst.current = scrollDraw(box, { autoplay: true, duration: PLAY_MS, stagger: els.length > 1 ? STAGGER : 0 });
      inst.current.seek(0);
      setProgress(0);
      setResult({ shapes: measured, notes: extra, clean: cleanSvg });
      // Play once the drawing is on screen, as autoplay would.
      seen = new IntersectionObserver(([e]) => {
        if (e?.isIntersecting) { play(); seen?.disconnect(); }
      });
      seen.observe(box);
    });
    return () => {
      live = false;
      seen?.disconnect();
      cancelAnimationFrame(raf.current);
      inst.current?.destroy();
      inst.current = null;
    };
  }, [parsed, lineView]);

  /** Draw from 0 to 1 over PLAY_MS, eased like the default ease-out. */
  function play() {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PLAY_MS);
      const p = 1 - (1 - t) * (1 - t);
      inst.current?.seek(p);
      setProgress(p);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function scrub(p: number) {
    cancelAnimationFrame(raf.current);
    inst.current?.seek(p);
    setProgress(p);
  }

  const problems = useMemo(() => findProblems(shapes, removed), [shapes, removed]);
  const code = useMemo(() => {
    if (!clean) return '';
    const many = shapes.filter((s) => DRAWN.has(s.tag)).length > 1;
    if (tab === 'css') return cssCode();
    if (tab === 'js') return jsCode(many);
    if (tab === 'react') return reactCode(many);
    return pretty(clean);
  }, [tab, clean, shapes]);

  return (
    <div className="sv">
      <div className="sv-panel">
        <label className="sv-input">
          <span>Paste an SVG, or one path’s d value</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={7}
            aria-label="SVG markup or path data"
          />
        </label>
        {error && <p className="sv-error" role="alert">{error}</p>}
        {/* Kept mounted while an error shows: the next valid paste renders into it. */}
        <div hidden={!!error}>
            <div className="sv-stage">
              <div ref={host} className="sv-host" />
            </div>
            <div className="sv-transport">
              <button type="button" className="sv-btn" onClick={play}>↻ Replay</button>
              <label className="sv-scrub">
                <span>progress · {progress.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.01} value={progress} aria-label="Drawing progress" onChange={(e) => scrub(Number(e.target.value))} />
              </label>
              <label className="sv-check">
                <input type="checkbox" checked={lineView} onChange={(e) => setLineView(e.target.checked)} />
                <span>Line view</span>
              </label>
            </div>
        </div>
      </div>

      {!error && shapes.length > 0 && (
        <>
          <div className="sv-results">
            <div className="sv-scroll">
              <table className="sv-table">
                <thead><tr><th>#</th><th>Element</th><th>Length</th><th>Commands</th><th>Stroke</th><th>Fill</th></tr></thead>
                <tbody>
                  {shapes.map((s) => (
                    <tr key={s.i}>
                      <td>{s.i}</td>
                      <td>&lt;{s.tag}&gt;</td>
                      <td>{s.length === null ? '—' : round(s.length)}</td>
                      <td>{s.commands}</td>
                      <td>{s.stroke ? 'yes' : 'none'}</td>
                      <td>{s.fill ? 'yes' : 'none'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sv-total">
              {shapes.length} shape{shapes.length === 1 ? '' : 's'} · total length{' '}
              {round(shapes.reduce((n, s) => n + (s.length ?? 0), 0))} (in viewBox units)
            </p>
            <ul className="sv-problems" aria-label="Checks">
              {[...problems, ...notes].map((p) => <li key={p}>{p}</li>)}
              {!problems.length && !notes.length && <li className="is-ok">Nothing in the way: every shape has a stroke and will draw.</li>}
            </ul>
          </div>

          <div className="sv-code">
            <div className="sv-tabs" role="tablist" aria-label="Code">
              {([['css', 'CSS'], ['js', 'JavaScript'], ['react', 'React'], ['svg', 'Clean SVG']] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className="sv-tab" onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
            <CodeBox file={{ css: 'draw.css', js: 'main.js', react: 'Drawing.tsx', svg: 'drawing.svg' }[tab]}>{code}</CodeBox>
          </div>
        </>
      )}
    </div>
  );
}

// ── Reading the shapes ──────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A shape's length as scrollDraw measures it (getElementLength in
 * packages/svg-scroll-draw/src/core/geometry.ts), so the table shows the dash
 * length the library will use: 2πr for a circle, the perimeter for a rect, the
 * browser's getTotalLength() for the rest. (Chrome's own getTotalLength() for
 * a circle is slightly short.)
 */
function lengthOf(el: SVGGeometryElement): number {
  const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
  if (el.localName === 'circle') return 2 * Math.PI * n('r');
  if (el.localName === 'rect') return 2 * (n('width') + n('height'));
  return el.getTotalLength();
}

/** "M 1 · C 3 · Z 1": how many of each command the path data uses. */
function summarize(d: string): string {
  const counts = new Map<string, number>();
  for (const c of d.match(/[MLHVCSQTAZ]/gi) ?? []) {
    const k = c.toUpperCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].map(([k, n]) => `${k} ${n}`).join(' · ') || '—';
}

function findProblems(shapes: Shape[], removed: Record<string, number>): string[] {
  const out: string[] = [];
  const noStroke = shapes.filter((s) => !s.stroke).map((s) => s.i);
  const filled = shapes.filter((s) => s.fill).map((s) => s.i);
  const ellipses = shapes.filter((s) => s.tag === 'ellipse').map((s) => s.i);
  const empty = shapes.filter((s) => s.length === 0).map((s) => s.i);
  const list = (ns: number[]) => ns.map((n) => `#${n}`).join(', ');
  if (noStroke.length) out.push(`No stroke on ${list(noStroke)}: a line drawing animates the stroke, so these would not be seen. Add stroke="currentColor" (Line view does this for the preview).`);
  if (filled.length) out.push(`Fill on ${list(filled)}: the filled area shows before its outline draws. Set fill="none", or fade the fill in once the line is done.`);
  if (ellipses.length) out.push(`<ellipse> (${list(ellipses)}) is not in scrollDraw’s default selector. Pass selector: 'path, ellipse' or draw it as a path.`);
  const nonScaling = shapes.filter((s) => s.nonScaling).map((s) => s.i);
  if (nonScaling.length) out.push(`vector-effect="non-scaling-stroke" on ${list(nonScaling)}: dashes are then measured in screen pixels but the length is in SVG units, so a drawing shown larger than its viewBox draws with gaps. Remove it for line drawings.`);
  if (empty.length) out.push(`Zero length: ${list(empty)}. A shape with no length has nothing to draw.`);
  if (removed['<style>'] || removed['class="…"'] || removed['style="…"']) out.push('Styles from a <style> block, classes or style="" are not read here, so a stroke or fill set that way shows as none. Put them in attributes (stroke="…") to check them.');
  const ignored = Object.entries(removed).filter(([k]) => !/^<(title|desc|metadata|defs|style)>$|^(class|style)="…"$/.test(k));
  if (ignored.length) out.push(`Left out (not drawing shapes, or not safe to run): ${ignored.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ')}.`);
  return out;
}

// ── The generated code ──────────────────────────────────────────────────────

function cssCode(): string {
  return `/* Add pathLength="1" to each shape: every length becomes 1,
   so one rule draws them all, whatever their real length. */
.drawing :is(path, line, polyline, polygon, rect, circle) {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}`;
}

function jsCode(many: boolean): string {
  return `// <div id="drawing"><svg …>…</svg></div>

import { scrollDraw } from 'svg-scroll-draw';

// Draws as the drawing scrolls through the window.
scrollDraw('#drawing'${many ? ', { stagger: 0.12 }' : ''});`;
}

function reactCode(many: boolean): string {
  return `import { ScrollDraw } from 'svg-scroll-draw/react';

export function Drawing() {
  return (
    <ScrollDraw${many ? ' stagger={0.12}' : ''}>
      <svg viewBox="…">{/* your paths */}</svg>
    </ScrollDraw>
  );
}`;
}

function pretty(svg: string): string {
  return svg.replace(/></g, '>\n  <').replace(/\n {2}<\/svg>/, '\n</svg>');
}
