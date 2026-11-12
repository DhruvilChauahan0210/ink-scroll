'use client';

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  EASING_NAMES, FACTORIES, FACTORY_KEYS, NAMED, curvePath, curveStats, factoryCurve, num,
  type Curve, type CurveStats, type EasingName, type FactoryKey,
} from '@/data/easing';
import {
  DEFAULTS, TAB_FILES, TITLE, WAVE, codeFor, easingHtml, factoryOf, isDefault, labelOf, rangeOf, reactProject,
  type Choice, type Params, type Tab,
} from './code';

/**
 * The easing visualizer. Every moving thing in it is svg-scroll-draw:
 *
 * - The plot draws the chosen curve, progress in across and eased progress
 *   out up. A factory's curve is the library's own createSpring /
 *   createBounce / createElastic once the dynamic import is in; the named
 *   curves, and the server render, use the copies in data/easing.ts.
 * - The drawings are scrollDraw instances in autoplay mode driven by seek():
 *   seek(t) sets the time, and the library applies the easing itself, so what
 *   you see past 1 is what the library does past 1. (A scroll-mode seek()
 *   takes progress that is already eased, and clamps it to 1.)
 * - "On real scroll" runs the same easing with no seek(), in a small scroll
 *   container (the scrollContainer option), as a page would.
 * - The code is generated from the same state, leaving out anything at its
 *   default (code.ts), and so is the page that Run it downloads or opens in
 *   StackBlitz: the same easings on real page scroll, the library loaded from
 *   jsDelivr at `version` (SELF.version, passed down by the page).
 */

type Lib = typeof import('svg-scroll-draw');
type Instance = ReturnType<Lib['scrollDraw']>;
type LibEasing = NonNullable<ScrollDrawOptions['easing']>;

const PLAY_MS = 1600;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The curve to plot: the library's factories when loaded, the copies before. */
function curveOf(p: Choice, params: Params, lib: Lib | null): Curve {
  const key = factoryOf(p);
  if (key) {
    const [a, b] = params[key];
    if (!lib) return factoryCurve(key, a, b);
    if (key === 'spring') return lib.createSpring({ tension: a, friction: b });
    if (key === 'bounce') return lib.createBounce({ bounces: a, decay: b });
    return lib.createElastic({ amplitude: a, period: b });
  }
  return NAMED[p as EasingName];
}

/** What to hand the library: the name itself, or the factory's function. */
function libEasingOf(p: Choice, params: Params, lib: Lib): LibEasing {
  const key = factoryOf(p);
  if (!key) return p as EasingName;
  const [a, b] = params[key];
  if (key === 'spring') return lib.createSpring({ tension: a, friction: b });
  if (key === 'bounce') return lib.createBounce({ bounces: a, decay: b });
  return lib.createElastic({ amplitude: a, period: b });
}

// ── The component ───────────────────────────────────────────────────────────

export function EasingVisualizer({ version }: { version: string }) {
  const [pick, setPick] = useState<Choice>('spring');
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [cmp, setCmp] = useState<EasingName | 'none'>('ease-out');
  const [t, setT] = useState(1);
  const [tab, setTab] = useState<Tab>('draw');
  const [lib, setLib] = useState<Lib | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hostA = useRef<HTMLDivElement>(null);
  const hostB = useRef<HTMLDivElement>(null);
  const instA = useRef<Instance | null>(null);
  const instB = useRef<Instance | null>(null);
  const tRef = useRef(1);
  /** Set once the reader moves the slider or picks an easing: the first-view play must not undo that. */
  const touched = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => { if (live) setLib(m); }).catch(() => { /* previews stay static */ });
    return () => { live = false; };
  }, []);

  const factory = factoryOf(pick);
  const curveA = useMemo(() => curveOf(pick, params, lib), [pick, params, lib]);
  const curveB = useMemo(() => (cmp === 'none' ? null : NAMED[cmp]), [cmp]);
  const statsA = useMemo(() => curveStats(curveA), [curveA]);
  const statsB = useMemo(() => (curveB ? curveStats(curveB) : null), [curveB]);
  const [lo, hi] = rangeOf(statsB ? [statsA, statsB] : [statsA]);
  const easingA = useMemo(() => (lib ? libEasingOf(pick, params, lib) : null), [pick, params, lib]);
  const nameA = labelOf(pick, params);
  const nameB = cmp === 'none' ? '' : `'${cmp}'`;

  /** Put both drawings, the plot and the readouts at progress p. */
  const moveTo = useCallback((p: number) => {
    tRef.current = p;
    setT(p);
    instA.current?.seek(p);
    instB.current?.seek(p);
  }, []);

  /** Run progress in from 0 to 1 at a steady speed, as a steady scroll would. */
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (reducedMotion()) { moveTo(1); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / PLAY_MS));
      moveTo(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [moveTo]);

  // Play once when the tool first comes on screen, unless the reader got there first.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { io.disconnect(); if (!touched.current) play(); }
    }, { threshold: 0.35 });
    io.observe(el);
    const frame = raf;
    return () => { io.disconnect(); cancelAnimationFrame(frame.current); };
  }, [play]);

  // The drawings: one scrollDraw instance each, rebuilt when its easing changes.
  useEffect(() => previewDraw(hostA.current, lib, easingA, instA, tRef), [lib, easingA]);
  useEffect(() => previewDraw(hostB.current, lib, cmp === 'none' ? null : cmp, instB, tRef), [lib, cmp]);

  function choose(p: Choice) {
    touched.current = true;
    setPick(p);
    play();
  }

  function setParam(key: FactoryKey, i: 0 | 1, v: number) {
    setParams((prev) => {
      const next = [...prev[key]] as [number, number];
      next[i] = v;
      return { ...prev, [key]: next };
    });
  }

  const outA = curveA(t);
  const outB = curveB ? curveB(t) : 0;
  // The CSS tab fits a linear() to the curve (a few ms); deferred, so dragging
  // a slider with it open keeps the plot and drawings at full speed.
  const codeKey = useMemo(() => ({ tab, pick, params, curveA }), [tab, pick, params, curveA]);
  const codeIn = useDeferredValue(codeKey);
  const code = useMemo(() => codeFor(codeIn.tab, codeIn.pick, codeIn.params, codeIn.curveA), [codeIn]);
  // Run it: a page with the same easings on real scroll, and the React tab as a project.
  const html = useMemo(() => easingHtml({ pick, params, cmp, range: [lo, hi], version }), [pick, params, cmp, lo, hi, version]);
  const react = useMemo(() => reactProject(pick, params, version), [pick, params, version]);

  return (
    <div className="ez">
      <div className="ez-panel" ref={panel}>
        <div className="ez-controls">
          <Field label="easing">
            <span className="ez-chips" role="radiogroup" aria-label="Easing">
              {EASING_NAMES.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={pick === n} onClick={() => choose(n)}>{n}</button>
              ))}
            </span>
            <span className="ez-chips" role="radiogroup" aria-label="Easing factory">
              {FACTORY_KEYS.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={pick === `f:${k}`} onClick={() => choose(`f:${k}`)}>
                  {FACTORIES[k].fn}()
                </button>
              ))}
            </span>
          </Field>
          <Field label="compare with">
            <select className="ez-select" value={cmp} aria-label="Compare with" onChange={(e) => setCmp(e.target.value as EasingName | 'none')}>
              <option value="none">nothing</option>
              {EASING_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          {/* Last, so on a phone the sliders sit right above the plot they change. */}
          {factory && (
            <div className="ez-params">
              {FACTORIES[factory].params.map((spec, i) => (
                <Field key={spec.k} label={`${spec.k} · ${num(params[factory][i], 2)}`}>
                  <input
                    type="range" min={spec.min} max={spec.max} step={spec.step} value={params[factory][i]}
                    aria-label={spec.k}
                    onChange={(e) => setParam(factory, i as 0 | 1, Number(e.target.value))}
                  />
                  <span className="ez-hint">default {spec.def}<span className="ez-hint-d"> · {spec.d}</span></span>
                </Field>
              ))}
              <button
                type="button" className="ez-btn ez-reset" disabled={isDefault(factory, params[factory])}
                onClick={() => setParams((prev) => ({ ...prev, [factory]: DEFAULTS[factory] }))}
              >
                Reset to defaults
              </button>
            </div>
          )}
        </div>

        <div className="ez-stage">
          <Plot curveA={curveA} curveB={curveB} statsA={statsA} lo={lo} hi={hi} t={t} outA={outA} outB={outB} nameA={nameA} />
          <div className="ez-prev">
            <PreviewRow k="A" name={nameA} out={outA} lo={lo} hi={hi}>
              <div ref={hostA} className="ez-draw"><Drawing /></div>
            </PreviewRow>
            {curveB && (
              <PreviewRow k="B" name={nameB} out={outB} lo={lo} hi={hi} dashed>
                <div ref={hostB} className="ez-draw is-b"><Drawing /></div>
              </PreviewRow>
            )}
          </div>
        </div>

        <div className="ez-transport">
          <button type="button" className="ez-btn" onClick={play}>▶ Play</button>
          <label className="ez-scrub">
            <span>progress in · {t.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.005} value={t} aria-label="Progress in"
              onChange={(e) => { touched.current = true; cancelAnimationFrame(raf.current); moveTo(Number(e.target.value)); }}
            />
          </label>
          <p className="ez-read">
            out · A {num(outA, 3)}{curveB ? ` · B ${num(outB, 3)}` : ''}
          </p>
        </div>

        <ul className="ez-stats" aria-label="What the curves do">
          <li><b>A · {nameA}</b> {describe(statsA)}</li>
          {statsB && <li><b>B · {nameB}</b> {describe(statsB)}</li>}
        </ul>
        <p className="ez-rm">
          Your system asks for reduced motion, so the library shows every drawing, and the scroll box’s markers,
          finished and does not move them. The plot, the slider, the marker under each drawing and the code still
          follow the easing.
        </p>
      </div>

      <div className="ez-code">
        <div className="ez-tabs" role="tablist" aria-label="Code">
          {([['draw', 'scrollDraw'], ['animate', 'scrollAnimate'], ['react', 'React'], ['css', 'CSS']] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="ez-tab" onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <CodeBox file={TAB_FILES[codeIn.tab]}>{code}</CodeBox>
        <ToolExport title={TITLE} filename="easing.html" html={html} react={react} />
      </div>

      <ScrollBox lib={lib} easingA={easingA} easingB={cmp === 'none' ? null : cmp} curveA={curveA} curveB={curveB} lo={lo} hi={hi} nameA={nameA} nameB={nameB} />
    </div>
  );
}

/**
 * One preview drawing: scrollDraw in autoplay mode, driven only by seek().
 *
 * Autoplay starts its own run when the drawing comes into view. `duration: 1`
 * makes that run a single frame, `once` stops it from running again, and
 * `onComplete` puts the drawing back where the slider is, so seek() is the
 * only thing that moves it. seek(t) scales the time, so the duration does not
 * change what it shows. Returns the effect's cleanup.
 */
function previewDraw(
  host: HTMLDivElement | null,
  lib: Lib | null,
  easing: LibEasing | null,
  slot: React.RefObject<Instance | null>,
  tRef: React.RefObject<number>,
): (() => void) | undefined {
  if (!host || !lib || !easing) return undefined;
  let inst: Instance | null = null;
  inst = lib.scrollDraw(host, {
    selector: '.ez-ink',
    autoplay: true,
    duration: 1,
    once: true,
    easing,
    onComplete: () => inst?.seek(tRef.current),
  });
  inst.seek(tRef.current);
  slot.current = inst;
  return () => {
    inst?.destroy();
    if (slot.current === inst) slot.current = null;
  };
}

function describe(s: CurveStats): string {
  const parts: string[] = [];
  if (s.min < -0.0005) parts.push(`dips below 0 to ${num(s.min)} at ${num(s.minAt)}`);
  if (s.max > 1.0005) parts.push(`overshoots to ${num(s.max)} at ${num(s.maxAt)}`);
  const early = s.reaches < 0.99;
  parts.push(early ? `first reaches 1 at ${num(s.reaches)}` : 'reaches 1 only at the end');
  // After the first arrival it falls back below 1 (unless that low point is the dip below 0 already given).
  if (early && s.after < 0.9995 && !(s.min < -0.0005 && s.after - s.min < 1e-9)) parts.push(`then falls back to ${num(s.after)}`);
  parts.push('ends at 1');
  return parts.join(' · ');
}

// ── The plot ────────────────────────────────────────────────────────────────

const PW = 360;
const PH = 290;
const BOX = { x: 40, y: 24, w: 306, h: 228 };

function Plot({ curveA, curveB, statsA, lo, hi, t, outA, outB, nameA }: {
  curveA: Curve; curveB: Curve | null; statsA: CurveStats; lo: number; hi: number; t: number; outA: number; outB: number; nameA: string;
}) {
  const clip = `ez-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const yOf = (v: number) => BOX.y + (1 - (v - lo) / (hi - lo)) * BOX.h;
  const xOf = (x: number) => BOX.x + x * BOX.w;
  const dA = useMemo(() => curvePath(curveA, BOX, lo, hi, 400), [curveA, lo, hi]);
  const dB = useMemo(() => (curveB ? curvePath(curveB, BOX, lo, hi, 400) : ''), [curveB, lo, hi]);
  const grid: number[] = [];
  for (let v = Math.ceil(lo * 4) / 4; v <= hi + 1e-9; v += 0.25) grid.push(Math.round(v * 100) / 100);
  const peak = statsA.max > 1.0005;
  // The label sits above the peak, running away from the nearer side.
  const peakLeft = statsA.maxAt > 0.6;

  return (
    <div className="ez-plot">
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        role="img"
        aria-label={`${nameA} plotted from progress 0 to 1. At progress ${t.toFixed(2)} it gives ${outA.toFixed(3)}.`}
      >
        <defs>
          {/* Outside 0–1 by more than the stroke, so a curve that only touches 1 stays ink. */}
          <clipPath id={clip}>
            <rect x={BOX.x} y={0} width={BOX.w} height={Math.max(0, yOf(1) - 2)} />
            <rect x={BOX.x} y={yOf(0) + 2} width={BOX.w} height={Math.max(0, PH - yOf(0) - 2)} />
          </clipPath>
        </defs>
        {grid.map((v) => (
          <g key={v}>
            <line className={v === 0 ? 'ez-g0' : v === 1 ? 'ez-g1' : 'ez-g'} x1={BOX.x} x2={BOX.x + BOX.w} y1={yOf(v)} y2={yOf(v)} />
            {Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 && (
              <text className="ez-ax" x={BOX.x - 8} y={yOf(v) + 3.5} textAnchor="end">{num(v)}</text>
            )}
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((x) => (
          <g key={x}>
            <line className={x === 0 ? 'ez-g0' : 'ez-g'} x1={xOf(x)} x2={xOf(x)} y1={BOX.y} y2={BOX.y + BOX.h} />
            {x !== 0.25 && x !== 0.75 && (
              <text className="ez-ax" x={xOf(x)} y={BOX.y + BOX.h + 16} textAnchor="middle">{num(x)}</text>
            )}
          </g>
        ))}
        <text className="ez-ax" x={BOX.x + BOX.w} y={PH - 4} textAnchor="end">progress in →</text>
        <text className="ez-ax" x={BOX.x + 4} y={BOX.y - 12}>out ↑</text>
        <text className="ez-ax" x={BOX.x + BOX.w - 4} y={yOf(1) - 5} textAnchor="end">1 · the end</text>

        {dB && <path className="ez-cb" d={dB} />}
        <path className="ez-ca" d={dA} />
        <path className="ez-over ez-ca-over" d={dA} clipPath={`url(#${clip})`} />
        {peak && (
          <g>
            <line className="ez-g1" x1={xOf(statsA.maxAt)} x2={xOf(statsA.maxAt)} y1={yOf(statsA.max) - 4} y2={yOf(1)} />
            <text
              className="ez-peak"
              x={xOf(statsA.maxAt) + (peakLeft ? 4 : -4)}
              y={yOf(statsA.max) - 8}
              textAnchor={peakLeft ? 'end' : 'start'}
            >
              overshoot {num(statsA.max)}
            </text>
          </g>
        )}

        <line className="ez-head" x1={xOf(t)} x2={xOf(t)} y1={BOX.y + BOX.h} y2={yOf(outA)} />
        <line className="ez-head" x1={BOX.x} x2={xOf(t)} y1={yOf(outA)} y2={yOf(outA)} />
        {curveB && <circle className="ez-dot-b" cx={xOf(t)} cy={yOf(outB)} r={3.5} />}
        <circle className="ez-dot" cx={xOf(t)} cy={yOf(outA)} r={4} />
      </svg>
    </div>
  );
}

// ── The previews ────────────────────────────────────────────────────────────

/** One line, drawn left to right: a pencil copy under it shows where it goes. */
function Drawing({ ink = 'ez-ink' }: { ink?: string }) {
  return (
    <svg viewBox="0 0 320 76" aria-hidden="true" focusable="false">
      <path className="ez-pencil" d={WAVE} />
      <path className={`ez-line ${ink}`} d={WAVE} />
      <text className="ez-ax" x={14} y={74}>start</text>
      <text className="ez-ax" x={306} y={74} textAnchor="end">end</text>
    </svg>
  );
}

function PreviewRow({ k, name, out, lo, hi, dashed, children }: {
  k: string; name: string; out: number; lo: number; hi: number; dashed?: boolean; children: ReactNode;
}) {
  return (
    <div className="ez-row">
      <p className="ez-row-h"><span>{k} · {name}</span><span>{num(out, 3)}</span></p>
      {children}
      <Track lo={lo} hi={hi} value={out} hollow={dashed} />
    </div>
  );
}

/** A marker on a ruler that runs from lo to hi: 0 and 1 marked, the marker at the eased value. */
function Track({ lo, hi, value, hollow }: { lo: number; hi: number; value: number; hollow?: boolean }) {
  const L = 8;
  const W = 304;
  const x = (v: number) => L + ((v - lo) / (hi - lo)) * W;
  return (
    <svg className="ez-track" viewBox="0 0 320 30" aria-hidden="true" focusable="false">
      <line className="ez-g" x1={x(lo)} x2={x(hi)} y1={12} y2={12} />
      <line className="ez-unit" x1={x(0)} x2={x(1)} y1={12} y2={12} />
      <line className="ez-g0" x1={x(0)} x2={x(0)} y1={6} y2={18} />
      <line className="ez-g0" x1={x(1)} x2={x(1)} y1={6} y2={18} />
      <text className="ez-ax" x={x(0)} y={29} textAnchor="middle">0</text>
      <text className="ez-ax" x={x(1)} y={29} textAnchor="middle">1</text>
      <circle className={hollow ? 'ez-dot-b' : 'ez-dot'} cx={x(value)} cy={12} r={4.5} />
    </svg>
  );
}

// ── On real scroll ──────────────────────────────────────────────────────────

/**
 * The same easing with nothing driving it but scrolling. The box is the
 * scroll container (scrollContainer); the drawing and markers stay pinned
 * (position: sticky) while the tall element behind them scrolls, and the
 * trigger runs from its top at the box's top to its bottom at the box's
 * bottom, so the whole scroll of the box is progress 0 → 1.
 */
function ScrollBox({ lib, easingA, easingB, curveA, curveB, lo, hi, nameA, nameB }: {
  lib: Lib | null; easingA: LibEasing | null; easingB: LibEasing | null; curveA: Curve; curveB: Curve | null;
  lo: number; hi: number; nameA: string; nameB: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const tall = useRef<HTMLDivElement>(null);
  const dotA = useRef<HTMLSpanElement>(null);
  const dotB = useRef<HTMLSpanElement>(null);
  const read = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = box.current;
    const track = tall.current;
    if (!lib || !scroller || !track) return;
    const trigger = { start: 'top top', end: 'bottom bottom' };
    const made: { destroy(): void }[] = [];
    const run = (easing: LibEasing, ink: string, dot: HTMLSpanElement | null) => {
      made.push(lib.scrollDraw(track, { easing, scrollContainer: scroller, trigger, selector: ink }));
      if (dot) {
        made.push(lib.scrollAnimate(dot, {
          props: { left: ['0%', '100%'] }, easing, scrollContainer: scroller, trigger, triggerElement: track,
        }));
      }
    };
    if (easingA) run(easingA, '.ez-sink-a', dotA.current);
    if (easingB) run(easingB, '.ez-sink-b', dotB.current);
    return () => made.forEach((m) => m.destroy());
  }, [lib, easingA, easingB]);

  // The readout: raw scroll progress and what each easing makes of it.
  useEffect(() => {
    const scroller = box.current;
    if (!scroller) return;
    const update = () => {
      const room = scroller.scrollHeight - scroller.clientHeight;
      const p = room > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / room)) : 0;
      if (read.current) {
        read.current.textContent = `scroll ${p.toFixed(2)} → A ${curveA(p).toFixed(2)}${curveB ? ` · B ${curveB(p).toFixed(2)}` : ''}`;
      }
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [curveA, curveB]);

  const unit = { left: `${(-lo / (hi - lo)) * 100}%`, width: `${(1 / (hi - lo)) * 100}%` };

  return (
    <div className="ez-live">
      <p className="ez-live-k">On real scroll · scroll inside the box, no seek()</p>
      <div ref={box} className="ez-sbox" tabIndex={0} role="region" aria-label="Scroll this box to run the easing">
        <div ref={tall} className="ez-tall">
          <div className="ez-sticky">
            <p className="ez-sread"><span ref={read} /></p>
            <div className="ez-srow">
              <span className="ez-sk">A · {nameA}</span>
              <Drawing ink="ez-sink-a" />
              <div className="ez-strack"><div className="ez-sunit" style={unit}><span ref={dotA} className="ez-sdot" /></div></div>
            </div>
            {curveB && (
              <div className="ez-srow">
                <span className="ez-sk">B · {nameB}</span>
                <Drawing ink="ez-sink-b" />
                <div className="ez-strack"><div className="ez-sunit" style={unit}><span ref={dotB} className="ez-sdot is-b" /></div></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="ez-live-note">
        The box’s whole scroll is progress 0 to 1 here: trigger from its top at the box’s top to its bottom at the
        box’s bottom. The markers are scrollAnimate moving <code>left</code> from 0% to 100%, so past 1 they run
        beyond the 1 mark.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ez-field">
      <span className="ez-label">{label}</span>
      {children}
    </div>
  );
}
