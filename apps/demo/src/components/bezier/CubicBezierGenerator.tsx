'use client';

import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { Y_MAX, Y_MIN, bezierEasing, bezierRange, cssOf, fmt, mirror, parseBezier, round6, type Bezier } from './bezier';
import { CSS_PRESETS, FAMILY_NAMES, LIB_PRESETS, NAMED_PRESETS, ceil1, presetByKey, presetLabel, type Preset } from './presets';
import { FILENAME, TABS, TITLE, WAVE, bezierHtml, codeFor, matchPreset, type Tab } from './code';

/**
 * The cubic-bezier generator. Drag P1 and P2 (or move them with the arrow
 * keys, or type the numbers), and everything below follows:
 *
 * - The race: two markers, the curve and a comparison, moved by
 *   requestAnimationFrame over the chosen duration. Under reduced motion,
 *   Play jumps to the end.
 * - The drawing is a scrollDraw instance whose `easing` is the curve as a
 *   function, driven by seek(). It runs in autoplay mode because only there
 *   does seek() take time and ease it (buildAutoplay's seek() and
 *   applyAutoAlpha() in core/engine.ts); a scroll-mode seek() takes progress
 *   already eased, and clamps it to 1, so a curve past 1 could not show. It is
 *   rebuilt, the old one destroyed, whenever the curve changes.
 * - The browser check runs the same cubic-bezier() through the Web Animations
 *   API and compares it with the JavaScript function.
 * - The code is generated from the same state (code.ts), and so is the page
 *   Run it downloads or opens in StackBlitz: the same curves on real page
 *   scroll, the library loaded from jsDelivr at `version` (SELF.version,
 *   passed down by the page).
 */

type Lib = typeof import('svg-scroll-draw');
type Instance = ReturnType<Lib['scrollDraw']>;
type Which = 1 | 2;

const START: Bezier = presetByKey('named:easeOutBack')?.v ?? [0.34, 1.56, 0.64, 1];
const START_CMP = 'css:ease';
const DURATIONS = [200, 300, 400, 600, 800, 1000, 1500, 2000];
const START_MS = 1000;
const FIELDS = ['x1', 'y1', 'x2', 'y2'] as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** x must stay in 0–1 (CSS); y in the editor's range. */
const limit = (i: number, n: number) => (i % 2 === 0 ? clamp(n, 0, 1) : clamp(n, Y_MIN, Y_MAX));
const show = (n: number, d = 3) => {
  const s = n.toFixed(d).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};

/** The editor's y range: -0.25 to 1.25, wider in quarters when a point or the comparison needs it. */
function rangeOf(v: Bezier, other: Bezier | null): [number, number] {
  const ys = [v[1], v[3]];
  if (other) {
    const r = bezierRange(other);
    ys.push(r.min, r.max);
  }
  return [
    Math.min(-0.25, Math.floor((Math.min(...ys) - 0.15) * 4) / 4),
    Math.max(1.25, Math.ceil((Math.max(...ys) + 0.15) * 4) / 4),
  ];
}

/** The first time the curve reaches half way, for the readout. */
function halfway(f: (t: number) => number): number {
  for (let i = 0; i <= 1000; i++) if (f(i / 1000) >= 0.5) return i / 1000;
  return 1;
}

function describe(v: Bezier): string {
  const r = bezierRange(v);
  const f = bezierEasing(v);
  const parts: string[] = [];
  if (r.min < -0.0005) parts.push(`pulls back to ${show(r.min)} at ${show(r.minAt, 2)}`);
  if (r.max > 1.0005) parts.push(`overshoots to ${show(r.max)} at ${show(r.maxAt, 2)}`);
  parts.push(`half way at time ${show(halfway(f), 2)}`);
  return parts.join(' · ');
}

/** The browser check's result: NaN when the browser cannot be asked. */
type Check = { css: string; gap: number; at: number };

/**
 * The browser's own cubic-bezier() against the JavaScript function: a paused
 * Web Animations animation with this easing, read at 201 times through
 * getComputedTiming().progress, which is the progress after the easing.
 */
function browserGap(v: Bezier, el: HTMLElement | null): Check {
  const css = cssOf(v);
  const none = { css, gap: NaN, at: 0 };
  if (!el || typeof el.animate !== 'function') return none;
  const f = bezierEasing(v);
  let anim: Animation | null = null;
  try {
    anim = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: css, fill: 'both' });
    anim.pause();
    let gap = 0;
    let at = 0;
    for (let i = 0; i <= 200; i++) {
      anim.currentTime = i * 5;
      const p = anim.effect?.getComputedTiming().progress;
      if (typeof p !== 'number') return none;
      const e = Math.abs(p - f(i / 200));
      if (e > gap) { gap = e; at = i / 200; }
    }
    return { css, gap, at };
  } catch {
    return none;
  } finally {
    anim?.cancel();
  }
}

// ── The component ───────────────────────────────────────────────────────────

export function CubicBezierGenerator({ version }: { version: string }) {
  const [v, setV] = useState<Bezier>(START);
  const [cmpKey, setCmpKey] = useState<string>(START_CMP);
  const [ms, setMs] = useState(START_MS);
  const [t, setT] = useState(1);
  const [tab, setTab] = useState<Tab>('css');
  const [lib, setLib] = useState<Lib | null>(null);
  const [drafts, setDrafts] = useState<(string | null)[]>([null, null, null, null]);
  const [text, setText] = useState<string | null>(null);
  const [check, setCheck] = useState<Check | null>(null);
  const [copied, setCopied] = useState(false);
  /** While a point is dragged, the range it was picked up in: the view must not rescale under the pointer. */
  const [frozen, setFrozen] = useState<[number, number] | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const inst = useRef<Instance | null>(null);
  const tRef = useRef(1);
  const raf = useRef(0);
  /** Set once the reader moves anything: the first-view play must not undo that. */
  const touched = useRef(false);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => { if (live) setLib(m); }).catch(() => { /* the drawing stays static */ });
    return () => { live = false; };
  }, []);

  const cmp = cmpKey === 'none' ? null : presetByKey(cmpKey) ?? null;
  const fnA = useMemo(() => bezierEasing(v), [v]);
  const fnB = useMemo(() => (cmp ? bezierEasing(cmp.v) : null), [cmp]);
  const rangeA = useMemo(() => bezierRange(v), [v]);
  const rangeB = useMemo(() => (cmp ? bezierRange(cmp.v) : null), [cmp]);
  const [lo, hi] = frozen ?? rangeOf(v, cmp?.v ?? null);
  const match = matchPreset(v);
  const nameA = match ? (match.group === 'named' ? match.name : presetLabel(match)) : 'your curve';
  const nameB = cmp ? presetLabel(cmp) : '';

  /** Put the race, the drawing and the playhead at time p. */
  const moveTo = useCallback((p: number) => {
    tRef.current = p;
    setT(p);
    inst.current?.seek(p);
  }, []);

  /** Run time from 0 to 1 over the chosen duration. */
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (reducedMotion()) { moveTo(1); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = clamp((now - t0) / ms, 0, 1);
      moveTo(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [moveTo, ms]);

  // Play once when the tool first comes on screen, unless the reader got there first.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { io.disconnect(); if (!touched.current) play(); }
    }, { threshold: 0.3 });
    io.observe(el);
    const frame = raf;
    return () => { io.disconnect(); cancelAnimationFrame(frame.current); };
  }, [play]);

  // The drawing: one scrollDraw instance, rebuilt when the curve changes.
  useEffect(() => previewDraw(host.current, lib, fnA, inst, tRef), [lib, fnA]);

  // The browser check, a frame after the curve settles.
  useEffect(() => {
    const id = requestAnimationFrame(() => setCheck(browserGap(v, probe.current)));
    return () => cancelAnimationFrame(id);
  }, [v]);

  /** A new curve from anywhere: the drafts of the other inputs give way to it. */
  function apply(next: Bezier, keep?: 'text' | number) {
    touched.current = true;
    setV(next.map((n, i) => limit(i, round6(n))) as unknown as Bezier);
    if (keep !== 'text') setText(null);
    setDrafts((d) => d.map((s, i) => (i === keep ? s : null)));
  }

  /** A preset: set it, then play it, so the change is seen as motion. */
  function pick(p: Preset) {
    apply(p.v);
    play();
  }

  function setPoint(which: Which, x: number, y: number) {
    apply(which === 1 ? [x, y, v[2], v[3]] : [v[0], v[1], x, y]);
  }

  function onNumber(i: number, s: string) {
    setDrafts((d) => d.map((old, j) => (j === i ? s : old)));
    const n = Number(s);
    if (s.trim() !== '' && Number.isFinite(n)) apply(v.map((old, j) => (j === i ? n : old)) as unknown as Bezier, i);
  }

  function onText(s: string) {
    setText(s);
    const p = parseBezier(s);
    if (p.ok) apply(p.value, 'text');
  }

  const parsed = text === null ? null : parseBezier(text);
  const numberHint = drafts
    .map((s, i) => {
      if (s === null || s.trim() === '') return '';
      const n = Number(s);
      if (!Number.isFinite(n)) return `${FIELDS[i]} is not a number.`;
      if (i % 2 === 0 && (n < 0 || n > 1)) return `${FIELDS[i]} stays between 0 and 1: CSS treats cubic-bezier() with any other x as invalid.`;
      if (i % 2 === 1 && (n < Y_MIN || n > Y_MAX)) return `${FIELDS[i]} stays between ${Y_MIN} and ${Y_MAX} here. CSS takes any y.`;
      return '';
    })
    .find(Boolean);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(cssOf(v));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  const outA = fnA(t);
  const outB = fnB ? fnB(t) : 0;
  const trackLo = Math.min(0, rangeA.min, rangeB?.min ?? 0);
  const trackHi = Math.max(1, rangeA.max, rangeB?.max ?? 1);
  const code = useMemo(() => codeFor(tab, v, ms), [tab, v, ms]);
  // Run it: a page with the same curves on real scroll, and the CSS tab on a card.
  const cmpV = cmp?.v ?? null;
  const html = useMemo(() => bezierHtml({ v, cmp: cmpV, ms, version }), [v, cmpV, ms, version]);
  const checkNow = check && check.css === cssOf(v) ? check : null;
  const named = match?.group === 'named' ? match.key : '';

  return (
    <div className="bz">
      <div className="bz-panel" ref={panel}>
        <div className="bz-controls">
          <Field label="start from">
            <span className="bz-chips" role="group" aria-label="CSS keywords">
              <span className="bz-row-k" aria-hidden="true">CSS</span>
              {CSS_PRESETS.map((p) => (
                <button key={p.key} type="button" aria-pressed={match?.key === p.key} onClick={() => pick(p)}>
                  <Mini v={p.v} />{p.name}
                </button>
              ))}
            </span>
            <span className="bz-chips" role="group" aria-label="svg-scroll-draw’s own easings">
              <span className="bz-row-k" aria-hidden="true">svg-scroll-draw</span>
              {LIB_PRESETS.map((p) => (
                <button key={p.key} type="button" aria-pressed={match?.key === p.key} onClick={() => pick(p)}>
                  <Mini v={p.v} />{p.name} · {p.formula}
                </button>
              ))}
            </span>
          </Field>
          <div className="bz-selects">
            <Field label="named curves" htmlFor="bz-named">
              <select
                id="bz-named" className="bz-select" value={named}
                onChange={(e) => { const p = presetByKey(e.target.value); if (p) pick(p); }}
              >
                <option value="" disabled>pick a curve</option>
                {FAMILY_NAMES.map((fam) => (
                  <optgroup key={fam} label={fam}>
                    {NAMED_PRESETS.filter((p) => p.family === fam).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="compare with" htmlFor="bz-cmp">
              <select id="bz-cmp" className="bz-select" value={cmpKey} onChange={(e) => setCmpKey(e.target.value)}>
                <option value="none">nothing</option>
                <optgroup label="CSS keywords">
                  {CSS_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                </optgroup>
                <optgroup label="svg-scroll-draw">
                  {LIB_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.name} · {p.formula}</option>)}
                </optgroup>
                {FAMILY_NAMES.map((fam) => (
                  <optgroup key={fam} label={fam}>
                    {NAMED_PRESETS.filter((p) => p.family === fam).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="duration" htmlFor="bz-ms">
              <select id="bz-ms" className="bz-select" value={ms} onChange={(e) => setMs(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} ms</option>)}
              </select>
            </Field>
            <div className="bz-field">
              <span className="bz-label" aria-hidden="true">flip</span>
              <button type="button" className="bz-btn" onClick={() => apply(mirror(v))}>Mirror · in ↔ out</button>
            </div>
          </div>
        </div>

        <div className="bz-stage">
          <Editor
            v={v} cmp={cmp?.v ?? null} lo={lo} hi={hi} t={t} outA={outA} outB={outB}
            onMove={setPoint} onGrab={() => setFrozen([lo, hi])} onDrop={() => setFrozen(null)}
          />
          <div className="bz-side">
            <div className="bz-value">
              <div className="bz-value-h">
                <label className="bz-label" htmlFor="bz-text">cubic-bezier() · type or paste one</label>
                <button type="button" className="bz-btn bz-copy" onClick={copyValue} aria-label="Copy the cubic-bezier() value">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <input
                id="bz-text" className="bz-text" type="text" spellCheck={false} autoComplete="off"
                value={text ?? cssOf(v)} aria-invalid={parsed ? !parsed.ok : undefined}
                aria-describedby="bz-text-msg"
                onChange={(e) => onText(e.target.value)} onBlur={() => setText(null)}
              />
              <p id="bz-text-msg" className="bz-msg" aria-live="polite">{parsed && !parsed.ok ? parsed.error : ''}</p>
            </div>
            <p className="bz-label bz-nums-k">P1 (x1, y1) · P2 (x2, y2) · x is time, y is progress</p>
            <div className="bz-nums">
              {FIELDS.map((k, i) => (
                <label key={k} className="bz-num">
                  <span className="bz-label">{k}</span>
                  <input
                    type="number" inputMode="decimal" step={0.01}
                    min={i % 2 === 0 ? 0 : Y_MIN} max={i % 2 === 0 ? 1 : Y_MAX}
                    value={drafts[i] ?? fmt(v[i])}
                    onChange={(e) => onNumber(i, e.target.value)}
                    onBlur={() => setDrafts((d) => d.map((s, j) => (j === i ? null : s)))}
                  />
                </label>
              ))}
            </div>
            <p className="bz-msg" aria-live="polite">{numberHint ?? ''}</p>

            <div className="bz-race" role="group" aria-label="The race: where each curve is at this time">
              <Lane k="A" name={nameA} value={outA} lo={trackLo} hi={trackHi} />
              {cmp && <Lane k="B" name={nameB} value={outB} lo={trackLo} hi={trackHi} hollow />}
              <div className="bz-draw-row">
                <p className="bz-row-h"><span>scrollDraw · easing: your curve</span><span>{show(outA)}</span></p>
                <div ref={host} className="bz-draw">
                  <svg viewBox="0 0 320 60" aria-hidden="true" focusable="false">
                    <path className="bz-pencil" d={WAVE} />
                    <path className="bz-line bz-ink" d={WAVE} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bz-transport">
          <button type="button" className="bz-btn" onClick={() => { touched.current = true; play(); }}>▶ Play · {ms} ms</button>
          <label className="bz-scrub">
            <span>time · {t.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.005} value={t} aria-label="Time"
              onChange={(e) => { touched.current = true; cancelAnimationFrame(raf.current); moveTo(Number(e.target.value)); }}
            />
          </label>
          <p className="bz-read">
            progress · A {show(outA)}{cmp ? ` · B ${show(outB)}` : ''}
          </p>
        </div>

        <ul className="bz-stats" aria-label="What the curves do">
          <li><b>A · {nameA}</b> {describe(v)}</li>
          {cmp && <li><b>B · {nameB}</b> {describe(cmp.v)}</li>}
          <li className="bz-check" hidden={checkNow ? Number.isNaN(checkNow.gap) : false}>
            <b>Browser check</b>{' '}
            {checkNow && !Number.isNaN(checkNow.gap)
              ? `your browser’s own ${cssOf(v)}, read at 201 times through the Web Animations API, is within ${ceil1(checkNow.gap)} of the JavaScript function below${checkNow.gap >= 0.0005 ? ` (largest at time ${show(checkNow.at, 3)}, where the curve is steep and a tiny step in time moves progress a long way)` : ''}.`
              : 'comparing your browser’s own cubic-bezier() with the JavaScript function…'}
            <span ref={probe} className="bz-probe" aria-hidden="true" />
          </li>
        </ul>
        <p className="bz-rm">
          Your system asks for reduced motion, so Play jumps to the end and the library shows the drawing finished.
          The editor, the time slider, the markers and the code still follow the curve.
        </p>
      </div>

      <div className="bz-code">
        <div className="bz-tabs" role="tablist" aria-label="Code">
          {TABS.map((x) => (
            <button key={x.k} type="button" role="tab" aria-selected={tab === x.k} className="bz-tab" onClick={() => setTab(x.k)}>{x.label}</button>
          ))}
        </div>
        <CodeBox file={TABS.find((x) => x.k === tab)?.file ?? 'easing.css'}>{code}</CodeBox>
        <ToolExport title={TITLE} filename={FILENAME} html={html} />
      </div>
    </div>
  );
}

/**
 * The drawing: scrollDraw in autoplay mode, driven only by seek().
 *
 * Autoplay starts its own run when the drawing comes into view. `duration: 1`
 * makes that run a single frame, `once` stops it from running again, and
 * `onComplete` puts the drawing back where the time slider is, so seek() is
 * the only thing that moves it. Returns the effect's cleanup, which destroys
 * the instance.
 */
function previewDraw(
  el: HTMLDivElement | null,
  lib: Lib | null,
  easing: (t: number) => number,
  slot: React.RefObject<Instance | null>,
  tRef: React.RefObject<number>,
): (() => void) | undefined {
  if (!el || !lib) return undefined;
  let made: Instance | null = null;
  made = lib.scrollDraw(el, {
    selector: '.bz-ink',
    autoplay: true,
    duration: 1,
    once: true,
    easing,
    onComplete: () => made?.seek(tRef.current),
  });
  made.seek(tRef.current);
  slot.current = made;
  return () => {
    made?.destroy();
    if (slot.current === made) slot.current = null;
  };
}

// ── The editor ──────────────────────────────────────────────────────────────

const EW = 320;
const EH = 396;
const BOX = { x: 50, y: 16, w: 232, h: 348 };

/**
 * The curve editor. The drawing is one SVG; the two handles are HTML elements
 * laid over it at the same points, because a browser honours touch-action on
 * an HTML element but not on a shape inside an SVG (Chrome panned the page
 * under a finger dragging an SVG handle). So a finger on a handle drags it,
 * and a finger anywhere else on the editor still scrolls the page.
 */
function Editor({ v, cmp, lo, hi, t, outA, outB, onMove, onGrab, onDrop }: {
  v: Bezier; cmp: Bezier | null; lo: number; hi: number; t: number; outA: number; outB: number;
  onMove: (which: Which, x: number, y: number) => void; onGrab: () => void; onDrop: () => void;
}) {
  const plot = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ which: Which; id: number } | null>(null);
  const handles = useRef<Record<Which, HTMLDivElement | null>>({ 1: null, 2: null });
  const [active, setActive] = useState<Which | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clip = `bz-clip-${uid}`;
  const hint = `bz-hint-${uid}`;

  const X = (x: number) => BOX.x + x * BOX.w;
  const Y = (y: number) => BOX.y + ((hi - y) / (hi - lo)) * BOX.h;
  const [x1, y1, x2, y2] = v;
  const curve = (b: Bezier) => `M${X(0)} ${Y(0)} C ${X(b[0])} ${Y(b[1])}, ${X(b[2])} ${Y(b[3])}, ${X(1)} ${Y(1)}`;

  /** The pointer as a point in the editor, x in 0–1, y in the range picked up in. */
  function at(e: ReactPointerEvent): [number, number] | null {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const x = (p.x - BOX.x) / BOX.w;
    const y = hi - ((p.y - BOX.y) / BOX.h) * (hi - lo);
    return [clamp(round2(x), 0, 1), clamp(round2(y), Math.max(lo, Y_MIN), Math.min(hi, Y_MAX))];
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const hit = (e.target as Element).closest('[data-h]');
    let which: Which;
    if (hit) which = hit.getAttribute('data-h') === '2' ? 2 : 1;
    else {
      // A finger on the background scrolls the page; a mouse or a pen moves the nearer point there.
      if (e.pointerType === 'touch') return;
      const p = at(e);
      if (!p) return;
      which = Math.hypot(p[0] - x1, (p[1] - y1) * 0.6) <= Math.hypot(p[0] - x2, (p[1] - y2) * 0.6) ? 1 : 2;
      onMove(which, p[0], p[1]);
    }
    e.preventDefault();
    try {
      plot.current?.setPointerCapture(e.pointerId);
    } catch {
      // A pointer the browser no longer tracks: the drag still follows it while it is over the editor.
    }
    drag.current = { which, id: e.pointerId };
    setActive(which);
    onGrab();
    handles.current[which]?.focus({ preventScroll: true });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = at(e);
    if (p) onMove(d.which, p[0], p[1]);
  }

  function end(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    drag.current = null;
    setActive(null);
    onDrop();
  }

  function onKey(which: Which, e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const [x, y] = which === 1 ? [x1, y1] : [x2, y2];
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onMove(which, clamp(round2(x + m[0]), 0, 1), clamp(round2(y + m[1]), Y_MIN, Y_MAX));
  }

  const grid: number[] = [];
  for (let g = Math.ceil(lo * 4) / 4; g <= hi + 1e-9; g += 0.25) grid.push(Math.round(g * 100) / 100);

  /**
   * Where a handle's label goes: on past the handle, along its arm from P0 or
   * P3, so it never sits on the arm and seldom on the curve. A handle on top
   * of its end point gets the corner away from the square.
   */
  function labelAt(which: Which, x: number, y: number): { lx: number; ly: number; anchor: 'start' | 'middle' | 'end' } {
    let dx = X(x) - (which === 1 ? X(0) : X(1));
    let dy = Y(y) - (which === 1 ? Y(0) : Y(1));
    if (Math.hypot(dx, dy) < 8) { dx = which === 1 ? 1 : -1; dy = which === 1 ? 1 : -1; }
    const n = Math.hypot(dx, dy);
    const ux = dx / n;
    const uy = dy / n;
    return { lx: X(x) + ux * 17, ly: Y(y) + uy * 17 + 4, anchor: ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle' };
  }
  const points: [Which, number, number][] = [[1, x1, y1], [2, x2, y2]];

  return (
    <div className="bz-editor">
      <div
        ref={plot}
        className="bz-plot"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${EW} ${EH}`}
          role="img"
          aria-label={`${cssOf(v)} plotted: time across, progress up, with P1 and P2 and their handles.`}
        >
          <defs>
            {/* Outside 0–1 by more than the stroke, so a curve that only touches 0 or 1 stays ink. */}
            <clipPath id={clip}>
              <rect x={BOX.x} y={0} width={BOX.w} height={Math.max(0, Y(1) - 2)} />
              <rect x={BOX.x} y={Y(0) + 2} width={BOX.w} height={Math.max(0, EH - Y(0) - 2)} />
            </clipPath>
          </defs>
          <rect className="bz-bg" x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} />
          {grid.map((g) => (
            <g key={g}>
              <line className={g === 0 || g === 1 ? 'bz-g1' : 'bz-g'} x1={BOX.x} x2={BOX.x + BOX.w} y1={Y(g)} y2={Y(g)} />
              {Math.abs(g * 2 - Math.round(g * 2)) < 1e-9 && (
                <text className="bz-ax" x={BOX.x - 8} y={Y(g) + 3.5} textAnchor="end">{fmt(g)}</text>
              )}
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((x) => (
            <g key={x}>
              <line className={x === 0 || x === 1 ? 'bz-g1' : 'bz-g'} x1={X(x)} x2={X(x)} y1={BOX.y} y2={BOX.y + BOX.h} />
              {(x === 0 || x === 0.5 || x === 1) && <text className="bz-ax" x={X(x)} y={BOX.y + BOX.h + 15} textAnchor="middle">{fmt(x)}</text>}
            </g>
          ))}
          <text className="bz-ax" x={BOX.x + BOX.w} y={EH - 4} textAnchor="end">time →</text>
          <text className="bz-ax" x={6} y={BOX.y + 4} transform={`rotate(-90 ${6} ${BOX.y + 4})`} textAnchor="end">progress →</text>
          <line className="bz-diag" x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} />

          {cmp && <path className="bz-cb" d={curve(cmp)} />}
          <line className="bz-arm" x1={X(0)} y1={Y(0)} x2={X(x1)} y2={Y(y1)} />
          <line className="bz-arm" x1={X(1)} y1={Y(1)} x2={X(x2)} y2={Y(y2)} />
          <path className="bz-ca" d={curve(v)} />
          <path className="bz-over" d={curve(v)} clipPath={`url(#${clip})`} />

          <line className="bz-head" x1={X(t)} x2={X(t)} y1={BOX.y + BOX.h} y2={Y(outA)} />
          <line className="bz-head" x1={BOX.x} x2={X(t)} y1={Y(outA)} y2={Y(outA)} />
          {cmp && <circle className="bz-dot-b" cx={X(t)} cy={Y(outB)} r={3.5} />}
          <circle className="bz-dot" cx={X(t)} cy={Y(outA)} r={4} />

          <rect className="bz-end" x={X(0) - 3.5} y={Y(0) - 3.5} width={7} height={7} />
          <rect className="bz-end" x={X(1) - 3.5} y={Y(1) - 3.5} width={7} height={7} />
          <text className="bz-ax" x={X(0) - 8} y={Y(0) + 17} textAnchor="end">P0</text>
          <text className="bz-ax" x={X(1) + 8} y={Y(1) + 4}>P3</text>
          {points.map(([which, x, y]) => {
            const { lx, ly, anchor } = labelAt(which, x, y);
            return <text key={which} className="bz-h-k" x={lx} y={ly} textAnchor={anchor}>P{which}</text>;
          })}
        </svg>
        {points.map(([which, x, y]) => (
          <div
            key={which}
            ref={(el) => { handles.current[which] = el; }}
            className={`bz-h${active === which ? ' is-active' : ''}`}
            style={{ left: `${(X(x) / EW) * 100}%`, top: `${(Y(y) / EH) * 100}%` }}
            data-h={which}
            tabIndex={0}
            role="slider"
            aria-label={`P${which}, control point ${which}`}
            aria-valuenow={y}
            aria-valuemin={Y_MIN}
            aria-valuemax={Y_MAX}
            aria-valuetext={`x ${fmt(x)}, y ${fmt(y)}`}
            aria-describedby={hint}
            onKeyDown={(e) => onKey(which, e)}
          />
        ))}
      </div>
      <p id={hint} className="bz-hint">
        Drag P1 or P2. Or focus one (Tab) and use the arrow keys: 0.01 a press, 0.1 with Shift. x stays between 0 and 1.
      </p>
    </div>
  );
}

// ── Small parts ─────────────────────────────────────────────────────────────

/** A curve the size of a letter, for the preset chips. */
function Mini({ v }: { v: Bezier }) {
  const r = bezierRange(v);
  const lo = Math.min(0, r.min);
  const hi = Math.max(1, r.max);
  const Y = (y: number) => 13 - ((y - lo) / (hi - lo)) * 12;
  return (
    <svg className="bz-mini" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d={`M1 ${Y(0)} C ${1 + v[0] * 12} ${Y(v[1])}, ${1 + v[2] * 12} ${Y(v[3])}, 13 ${Y(1)}`} />
    </svg>
  );
}

/** One lane of the race: a ruler from lo to hi with 0 and 1 marked, the marker at the curve's progress. */
function Lane({ k, name, value, lo, hi, hollow }: { k: string; name: string; value: number; lo: number; hi: number; hollow?: boolean }) {
  const L = 8;
  const W = 304;
  const x = (n: number) => L + ((n - lo) / (hi - lo)) * W;
  return (
    <div className="bz-lane">
      <p className="bz-row-h"><span>{k} · {name}</span><span>{show(value)}</span></p>
      <svg viewBox="0 0 320 28" aria-hidden="true" focusable="false">
        <line className="bz-g" x1={x(lo)} x2={x(hi)} y1={10} y2={10} />
        <line className="bz-unit" x1={x(0)} x2={x(1)} y1={10} y2={10} />
        <line className="bz-g1" x1={x(0)} x2={x(0)} y1={4} y2={16} />
        <line className="bz-g1" x1={x(1)} x2={x(1)} y1={4} y2={16} />
        <text className="bz-ax" x={x(0)} y={27} textAnchor="middle">0</text>
        <text className="bz-ax" x={x(1)} y={27} textAnchor="middle">1</text>
        <circle className={hollow ? 'bz-dot-b' : 'bz-dot'} cx={x(value)} cy={10} r={5} />
      </svg>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="bz-field">
      {htmlFor ? <label className="bz-label" htmlFor={htmlFor}>{label}</label> : <span className="bz-label">{label}</span>}
      {children}
    </div>
  );
}

