'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { sanitizeSvg, type Sanitized } from '@/lib/svg-sanitize';
import {
  DEFAULTS, DRAWABLE_SELECTOR, EASINGS, FILL_FADES, LOOPS, ORDERS, OUTPUTS, SCROLL_END, SCROLL_START, STROKES, buildOutput,
  fmt, round, toDom, toTree, type Easing, type Loop, type Measured, type Order, type Output, type OutputKey, type Settings,
  type StrokeMode, type Tree,
} from './generate';
import { SAMPLE } from './sample';

/**
 * The SVG line drawing generator.
 *
 * - The paste is rebuilt by sanitizeSvg (lib/svg-sanitize.ts): only drawing
 *   elements and drawing attributes survive. That element is what everything
 *   else reads, as a Tree (generate.ts), so the output can only hold what the
 *   sanitiser let through plus what the generator adds.
 * - A hidden copy is mounted once per paste to measure it: getTotalLength()
 *   for the longest-first and shortest-first orders, and the computed stroke
 *   and fill for the checks.
 * - The preview is the generated SVG itself, built as elements with its own
 *   <style>, under its own class and keyframe names (an inline SVG's <style>
 *   applies to the whole page). The transport drives those CSS animations
 *   through the Web Animations API: they wait at 0 until the drawing is on
 *   screen, Replay restarts them, the slider sets their currentTime. Reduced
 *   motion stops them, through the output's own media query, and the preview
 *   shows the finished drawing.
 * - The scroll version is scrollDraw, the library this site is about, in a
 *   small box of its own (its scrollContainer option), so it scrolls without
 *   the page moving.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;
type Measurement = { of: Sanitized; shapes: Measured[]; viewBox: string | null; bare: string | null; size: number };

const PREVIEW_NAME = 'ldg-pv';
const RM = '(prefers-reduced-motion: reduce)';

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(RM);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(RM).matches,
    () => false,
  );
}

/** A width step that suits the drawing's size: 0.5 for a 240-wide viewBox. */
function widthStep(size: number): number {
  const raw = size / 480;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

export function LineDrawingGenerator() {
  const [input, setInput] = useState(SAMPLE);
  const [source, setSource] = useState<string | null>(null);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [tab, setTab] = useState<OutputKey>('file');
  const [measured, setMeasured] = useState<Measurement | null>(null);
  const measureHost = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const reduced = useReducedMotion();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  // The first parse at once, then debounced so a half-pasted SVG is not parsed on every key.
  useEffect(() => {
    const id = setTimeout(() => setSource(input), first.current ? 0 : 250);
    first.current = false;
    return () => clearTimeout(id);
  }, [input]);

  const parsed = useMemo(() => (source === null ? null : sanitizeSvg(source)), [source]);
  const tree = useMemo(() => (parsed?.ok ? toTree(parsed.svg) : null), [parsed]);

  // Measure a copy in the page, then take it out again.
  useEffect(() => {
    const host = measureHost.current;
    if (!host || !parsed?.ok) return;
    const copy = parsed.svg.cloneNode(true) as SVGSVGElement;
    host.replaceChildren(copy);
    const result = measure(copy, parsed.wasBarePath);
    host.replaceChildren();
    const id = requestAnimationFrame(() => setMeasured({ of: parsed, ...result }));
    return () => cancelAnimationFrame(id);
  }, [parsed]);

  const m = parsed?.ok && measured?.of === parsed ? measured : null;
  const step = widthStep(m?.size ?? 240);
  const width = s.width === null ? null : round(Math.min(Math.max(s.width, step), step * 24), 3);
  const settings = useMemo(() => ({ ...s, width }), [s, width]);
  const out = useMemo(
    () => (tree && m ? buildOutput(tree, m.shapes, settings, { viewBox: m.viewBox, bare: m.bare, previewName: PREVIEW_NAME }) : null),
    [tree, m, settings],
  );
  const notes = useMemo(() => (parsed?.ok && m ? checks(m, parsed, settings) : []), [parsed, m, settings]);
  const filled = m?.shapes.some((x) => x.filled) ?? false;

  function download() {
    if (!out) return;
    const url = URL.createObjectURL(new Blob([`${out.file}\n`], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'line-drawing.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const error = parsed && !parsed.ok ? parsed.error : '';
  const loop = s.loop !== 'none';

  return (
    <div className="ldg">
      <div className="ldg-panel">
        <label className="ldg-input">
          <span>Paste an SVG, or one path’s d value</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={8}
            aria-label="SVG markup or path data"
          />
        </label>

        <div className="ldg-controls">
          <div className="ldg-grid">
            <Field label={`duration · ${fmt(s.duration, 1)}s`}>
              <input
                type="range" min={0.3} max={6} step={0.1} value={s.duration}
                aria-label="Duration of each line, in seconds" onChange={(e) => set('duration', Number(e.target.value))}
              />
            </Field>
            <Field label={`stagger · ${fmt(s.stagger, 2)}s`}>
              <input
                type="range" min={0} max={1} step={0.01} value={s.stagger}
                aria-label="Stagger between one line and the next, in seconds" onChange={(e) => set('stagger', Number(e.target.value))}
              />
            </Field>
            <Field label="easing">
              <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value as Easing)}>
                {EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
            <Field label={s.hand ? `hand-drawn · ±${Math.round(s.hand * 100)}%` : 'hand-drawn · off'}>
              <input
                type="range" min={0} max={0.6} step={0.05} value={s.hand}
                aria-label="Hand-drawn variance in each line’s duration" onChange={(e) => set('hand', Number(e.target.value))}
              />
            </Field>
            <Field label={`order · ${ORDERS.find(([k]) => k === s.order)?.[1] ?? s.order}`} wide>
              <Seg value={s.order} options={ORDERS.map(([k]) => [k, k] as const)} onChange={(v) => set('order', v as Order)} label="Order" />
            </Field>
            <Field label="loop" wide>
              <Seg value={s.loop} options={LOOPS.map((l) => [l, l] as const)} onChange={(v) => set('loop', v as Loop)} label="Loop" />
            </Field>
            <Field label={loop ? `hold · ${fmt(s.hold, 1)}s` : 'hold · loops only'}>
              <input
                type="range" min={0} max={4} step={0.1} value={s.hold} disabled={!loop}
                aria-label="Hold: how long the finished drawing waits before the loop goes on, in seconds"
                onChange={(e) => set('hold', Number(e.target.value))}
              />
            </Field>
            <Field label={filled ? 'fill fade-in' : 'fill fade-in · no fills'}>
              <Seg
                value={String(s.fill)}
                options={FILL_FADES.map((f) => [String(f), f ? `${f}s` : 'off'] as const)}
                onChange={(v) => set('fill', Number(v))}
                label="Fill fade-in after the line"
              />
            </Field>
            <Field label="seed">
              <span className="ldg-pair">
                <input
                  type="number" min={1} max={9999} step={1} value={s.seed} disabled={!s.hand} className="ldg-num"
                  aria-label="Seed for the hand-drawn timing"
                  onChange={(e) => set('seed', Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))}
                />
                <button type="button" className="ldg-btn" disabled={!s.hand} aria-label="Next seed" onClick={() => set('seed', (s.seed % 9999) + 1)}>
                  Next
                </button>
              </span>
            </Field>
            <Field label="input">
              <span className="ldg-pair">
                <button type="button" className="ldg-btn" onClick={() => setInput(SAMPLE)}>Sample</button>
                <button type="button" className="ldg-btn" onClick={() => setInput('')}>Clear</button>
                <button type="button" className="ldg-btn" onClick={() => setS(DEFAULTS)}>Reset</button>
              </span>
            </Field>
            <Field label="stroke" wide>
              <span className="ldg-pair">
                <Seg value={s.stroke} options={STROKES} onChange={(v) => set('stroke', v as StrokeMode)} label="Stroke colour" />
                <input
                  type="color" value={s.color} disabled={s.stroke !== 'custom'}
                  aria-label="Stroke colour to use" onChange={(e) => set('color', e.target.value)}
                />
              </span>
            </Field>
            <Field label={width === null ? 'stroke width · keep' : `stroke width · ${fmt(width)}`} wide>
              <span className="ldg-pair">
                <Seg
                  value={width === null ? 'keep' : 'set'}
                  options={[['keep', 'keep'], ['set', 'set']] as const}
                  onChange={(v) => set('width', v === 'keep' ? null : step * 5)}
                  label="Stroke width"
                />
                <input
                  type="range" min={step} max={step * 24} step={step} value={width ?? step * 5} disabled={width === null}
                  aria-label="Stroke width, in the SVG’s own units" onChange={(e) => set('width', Number(e.target.value))}
                />
              </span>
            </Field>
          </div>
        </div>

        {error && <p className="ldg-error" role="alert">{error}</p>}
        <div hidden={!!error || !out}>
          {out && <Preview out={out} loop={s.loop} reduced={reduced} />}
        </div>
        <div ref={measureHost} className="ldg-measure" aria-hidden="true" />
      </div>

      {out && !error && (
        <>
          {notes.length > 0 && (
            <ul className="ldg-notes" aria-label="Checks">
              {notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}

          <div className="ldg-code">
            <div className="ldg-code-bar">
              <div className="ldg-tabs" role="tablist" aria-label="Output">
                {OUTPUTS.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} className="ldg-tab" onClick={() => setTab(k)}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className="ldg-btn ldg-dl" onClick={download}>↓ Download .svg</button>
            </div>
            <div className="ldg-out" role="tabpanel" aria-label={OUTPUTS.find(([k]) => k === tab)?.[1]}>
            {tab === 'file' && (
              <>
                <CodeBox file="line-drawing.svg">{out.file}</CodeBox>
                <p className="ldg-legend">
                  One file, no JavaScript: open it, use it as an {'<img>'} or a CSS background, or paste it inline. As an
                  image, currentColor is black; inline, it follows the text colour.
                </p>
              </>
            )}
            {tab === 'page' && (
              <>
                <CodeBox file="drawing.css">{out.css}</CodeBox>
                <CodeBox file="drawing.html">{out.markup}</CodeBox>
              </>
            )}
            {tab === 'scroll' && (
              <>
                <ScrollPreview tree={out.previewScroll} options={out.scroll.options} />
                <CodeBox file="main.js">{out.scroll.code}</CodeBox>
                <CodeBox file="drawing.html">{out.scrollMarkup}</CodeBox>
                <p className="ldg-legend">
                  The markup has no pathLength: scrollDraw measures every shape itself and sets the dash in the SVG’s own
                  units, which pathLength=“1” would scale up, drawing the whole line at once. Check the shapes first in
                  the <Link href="/svg-path-viewer">SVG path viewer</Link>.
                </p>
              </>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── The preview: the generated CSS animation, played and scrubbed ──────────

function Preview({ out, loop, reduced }: { out: Output; loop: Loop; reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const restart = useRef<() => void>(() => {});
  const [t, setT] = useState(0);
  const span = loop === 'none' ? out.timeline.run : out.timeline.cycle;

  const anims = () => {
    const svg = host.current?.querySelector('svg');
    return svg ? svg.getAnimations({ subtree: true }) : [];
  };

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    box.replaceChildren(toDom(out.preview));
    const query = () => box.querySelector('svg')?.getAnimations({ subtree: true })[0];
    let first = query();
    let raf = 0;
    // Follow the clock while the animations run: the time since they started.
    const tick = () => {
      if (!first || first.playState === 'idle') first = query();
      const tl = document.timeline.currentTime;
      if (!first || first.playState === 'paused' || first.playState === 'idle' || tl === null) return;
      const startTime = first.startTime;
      const sec = startTime === null ? 0 : (Number(tl) - Number(startTime)) / 1000;
      const more = loop !== 'none' || sec < span;
      setT(more ? (loop === 'none' ? sec : sec % span) : span);
      if (more) raf = requestAnimationFrame(tick);
    };
    restart.current = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    // Held at the start until the drawing is on screen, then played once:
    // otherwise it would have finished before the reader scrolled down to it.
    const all = box.querySelector('svg')?.getAnimations({ subtree: true }) ?? [];
    for (const a of all) {
      a.pause();
      a.currentTime = 0;
    }
    const seen = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      seen.disconnect();
      for (const a of all) a.play();
      setT(0);
      restart.current();
    });
    seen.observe(box);
    return () => {
      seen.disconnect();
      cancelAnimationFrame(raf);
      restart.current = () => {};
      box.replaceChildren();
    };
    // Rebuilt when reduced motion changes, so the clock follows the animations it brings back.
  }, [out, loop, span, reduced]);

  function replay() {
    for (const a of anims()) {
      a.currentTime = 0;
      a.play();
    }
    restart.current();
  }

  function scrub(v: number) {
    for (const a of anims()) {
      a.pause();
      a.currentTime = v * 1000;
    }
    setT(v);
  }

  return (
    <>
      <div className="ldg-stage">
        <div ref={host} className="ldg-host" />
      </div>
      <div className="ldg-transport">
        <button type="button" className="ldg-btn" onClick={replay} disabled={reduced}>↻ Replay</button>
        <label className="ldg-scrub">
          <span>
            {reduced ? 'reduced motion is on · shown drawn' : `time · ${Math.min(t, span).toFixed(2)}s of ${span.toFixed(2)}s${loop === 'none' ? '' : ` · one ${loop} cycle`}`}
          </span>
          <input
            type="range" min={0} max={span} step={0.01} value={reduced ? span : Math.min(t, span)} disabled={reduced}
            aria-label="Time in the animation, in seconds" onChange={(e) => scrub(Number(e.target.value))}
          />
        </label>
        <p className="ldg-count">{out.count} {out.count === 1 ? 'shape' : 'shapes'}</p>
      </div>
    </>
  );
}

// ── The scroll version, live in a box that scrolls ──────────────────────────

function ScrollPreview({ tree, options }: { tree: Tree; options: ScrollDrawOptions }) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = box.current;
    const h = host.current;
    if (!b || !h) return;
    h.replaceChildren(toDom(tree));
    let live = true;
    let inst: Instance | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      inst = scrollDraw(h, { ...options, scrollContainer: b });
    });
    return () => {
      live = false;
      inst?.destroy();
      h.replaceChildren();
    };
  }, [tree, options]);

  return (
    <div className="ldg-scroll">
      <p className="ldg-scroll-k">
        <span>On scroll · scrollDraw with these options</span>
        <span>starts {SCROLL_START}% down the box · done at {SCROLL_END}%</span>
      </p>
      <div ref={box} className="ldg-sbox" tabIndex={0} role="region" aria-label="Scroll inside this box to draw the scroll version">
        <div className="ldg-spacer"><p className="ldg-shint">Scroll down in this box ↓<br />the drawing draws as it rises</p></div>
        <div ref={host} className="ldg-shost" />
        <div className="ldg-spacer"><p className="ldg-shint">Scroll back up ↑<br />and it undraws</p></div>
      </div>
    </div>
  );
}

// ── Small parts ─────────────────────────────────────────────────────────────

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`ldg-field${wide ? ' is-wide' : ''}`}>
      <span className="ldg-field-k">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange, label }: {
  value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <span className="ldg-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </span>
  );
}

// ── Measuring and checking the paste ────────────────────────────────────────

function measure(svg: SVGSVGElement, bare: boolean): Omit<Measurement, 'of'> {
  if (bare) {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
  }
  const els = Array.from(svg.querySelectorAll<SVGGeometryElement>(DRAWABLE_SELECTOR));
  const shapes: Measured[] = els.map((el) => {
    const cs = getComputedStyle(el);
    let length = 0;
    try { length = el.getTotalLength(); } catch { length = 0; }
    return {
      length,
      stroked: cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 && cs.strokeOpacity !== '0',
      // A <line> computes a fill (black, by default) but has no inside to paint.
      filled: el.localName !== 'line' && cs.fill !== 'none' && cs.fillOpacity !== '0',
      fillOpacity: parseFloat(cs.fillOpacity) || 1,
      nonScaling: (el.getAttribute('vector-effect') ?? '').includes('non-scaling-stroke'),
      pieces: el.localName === 'path' ? ((el.getAttribute('d') ?? '').match(/[Mm]/g) ?? []).length : 1,
    };
  });
  let viewBox: string | null = null;
  let size = 0;
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const [, , w, h] = vb.split(/[\s,]+/).map(Number);
    size = Math.max(w || 0, h || 0);
  } else {
    try {
      const b = svg.getBBox();
      const pad = Math.max(b.width, b.height) * 0.06 + 2;
      viewBox = [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map((n) => fmt(n, 2)).join(' ');
      size = Math.max(b.width, b.height) + pad * 2;
    } catch { /* nothing drawable */ }
  }
  return { shapes, viewBox, size, bare: bare ? fmt(Math.max(size, 1) / 120, 2) : null };
}

function checks(m: Measurement, parsed: Extract<Sanitized, { ok: true }>, s: Settings): string[] {
  const out: string[] = [];
  const list = (pick: (x: Measured) => boolean) => m.shapes.flatMap((x, i) => (pick(x) ? [`#${i + 1}`] : [])).join(', ');
  if (m.bare) out.push(`A bare path: drawn with stroke="currentColor", no fill, and a stroke width of ${m.bare}.`);
  if (m.viewBox && !m.bare) out.push('The SVG had no viewBox, so one was worked out from the shapes; the output carries it.');
  const unstroked = s.stroke === 'keep' ? list((x) => !x.stroked) : '';
  if (unstroked) out.push(`No stroke on ${unstroked}: the animation draws the stroke, so ${unstroked.includes(',') ? 'these show' : 'it shows'} nothing, or only a fill. Choose a stroke colour above.`);
  const filled = list((x) => x.filled);
  if (filled && !s.fill) out.push(`Fill on ${filled}: it shows from the start, before its outline draws. Turn on the fill fade-in.`);
  const nonScaling = list((x) => x.nonScaling);
  if (nonScaling) out.push(`vector-effect="non-scaling-stroke" taken off ${nonScaling}: with it the dash is measured on screen, not along the path, so pathLength="1" no longer matches and part of the line shows before it draws. The stroke now scales with the drawing.`);
  const multi = m.shapes.flatMap((x, i) => (x.pieces > 1 ? [`#${i + 1} (${x.pieces})`] : []));
  if (multi.length) out.push(`One path of several pieces: ${multi.join(', ')}. The pieces draw one after another, as one line; split them into a path each to draw them together.`);
  const empty = list((x) => x.length === 0);
  if (empty) out.push(`No length: ${empty}. A shape with no length has nothing to draw.`);
  const r = parsed.removed;
  if (r['<style>'] || r['class="…"'] || r['style="…"']) out.push('Styles from a <style> block, classes or style="" are not carried over, so a stroke or fill set that way is lost. Put them in attributes (stroke="…") instead.');
  const ignored = Object.entries(r).filter(([k]) => !/^<(title|desc|metadata|defs|style)>$|^(class|style)="…"$/.test(k));
  if (ignored.length) out.push(`Left out (not drawing shapes, or not safe to keep): ${ignored.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ')}.`);
  return out;
}
