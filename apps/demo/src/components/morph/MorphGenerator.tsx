'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { sanitizeSvg } from '@/lib/svg-sanitize';
import { EASING_NAMES, NAMED, type EasingName } from '@/data/easing';
import { DEFAULT_PAIR, PRESETS, presetOf } from './shapes';
import {
  bounds, compatibility, lettersOf, matchShapes, meanTravel, morphPath, num, parsePath, pointsAt, shapeLength,
  skeleton, toD as writeD, tokenize, vertices, type Piece, type Pt, type Shape,
} from './path-morph';
import {
  TRIGGER, cssOnly, cssOnlyMarkup, htmlPage, jsCode, jsMarkup, pathsCode, reactCode, reactCss, reactProject,
  type Fill, type Outline, type Settings,
} from './code';

/**
 * The SVG morph generator.
 *
 * - Both shapes are read by path-morph.ts into absolute cubics, matched (the
 *   same pieces, the same segment count, the end shape's start point and
 *   direction turned for the least travel) and written back as two d strings
 *   with the same commands. What renders is always that output, numbers this
 *   page wrote; a pasted SVG goes through sanitizeSvg first.
 * - The preview is a small scroll box: a tall section with the drawing stuck
 *   inside, run by scrollDraw itself with morphTo, the generated trigger and
 *   `scrollContainer` set to the box, so the morph, the easing (overshoot
 *   included, which seek() would clamp) and the dash are the library's own.
 *   Play and the slider scroll the box.
 * - Under reduced motion scrollDraw shows the end shape at once, so the
 *   preview draws each frame itself with the library's morphPath, copied.
 */

type Side = 'from' | 'to';
type Choice = string; // a preset key, or 'paste'
type Tab = 'js' | 'react' | 'css' | 'paths';
type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;

const TABS: readonly [Tab, string][] = [['js', 'JavaScript'], ['react', 'React'], ['css', 'CSS only'], ['paths', 'Paths']];
const PLAY_MS = 2400;
const DECIMALS = [0, 1, 2, 3] as const;
const OVERSHOOT: readonly EasingName[] = ['spring', 'elastic'];
const MAX_POINTS = 64;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const f1 = (n: number) => num(n, 1);
const f2 = (n: number) => n.toFixed(2);

type Read =
  | { ok: true; name: string; shape: Shape; letters: string[]; notes: string[] }
  | { ok: false; name: string; error: string };

/** One side's input, read: a preset, or what was pasted (a d value, or an SVG run through sanitizeSvg). */
function readSide(choice: Choice, text: string): Read {
  if (choice !== 'paste') {
    const p = presetOf(choice);
    const r = parsePath(p.d);
    return r.ok ? { ok: true, name: p.name.toLowerCase(), shape: r.shape, letters: r.letters, notes: [] } : { ok: false, name: p.name, error: r.error };
  }
  const t = text.trim();
  if (!t) return { ok: false, name: 'shape', error: 'Paste a path’s d value, or an SVG with a <path> in it.' };
  const notes: string[] = [];
  let d = t;
  if (t.includes('<')) {
    if (typeof DOMParser === 'undefined') return { ok: false, name: 'shape', error: 'Reading…' };
    const s = sanitizeSvg(t);
    if (!s.ok) return { ok: false, name: 'shape', error: s.error };
    const paths = Array.from(s.svg.querySelectorAll('path')).filter((p) => (p.getAttribute('d') ?? '').trim());
    if (!paths.length) {
      const shapes = s.svg.querySelectorAll('rect, circle, ellipse, line, polyline, polygon').length;
      return {
        ok: false,
        name: 'shape',
        error: shapes
          ? 'No <path> in it, only shapes: convert them with the SVG shape to path converter first, then paste the path.'
          : 'No <path> with a d value in that SVG.',
      };
    }
    if (paths.length > 1) notes.push(`Took the first of its ${paths.length} paths.`);
    let el: Element | null = paths[0];
    while (el) {
      if (el.hasAttribute('transform')) { notes.push('Its transform is left out: the numbers are read as written.'); break; }
      el = el.parentElement;
    }
    d = paths[0].getAttribute('d') ?? '';
  } else {
    d = t.replace(/^d\s*=\s*["']?/, '').replace(/["']\s*\/?>?\s*$/, '');
  }
  const r = parsePath(d);
  return r.ok ? { ok: true, name: 'shape', shape: r.shape, letters: r.letters, notes } : { ok: false, name: 'shape', error: r.error };
}

/** The viewBox both shapes fit in: the presets' 200 × 200 grid when they fit it, else their bounds and a margin. */
function frameOf(shapes: Shape[]): { vb: string; size: number; box: [number, number, number, number] } {
  const b = bounds(shapes) ?? { x: 0, y: 0, w: 200, h: 200 };
  if (b.x >= 0 && b.y >= 0 && b.x + b.w <= 200 && b.y + b.h <= 200) return { vb: '0 0 200 200', size: 200, box: [0, 0, 200, 200] };
  const size = Math.max(b.w, b.h, 1);
  const pad = size * 0.1;
  const box: [number, number, number, number] = [
    b.x - pad - (size - b.w) / 2, b.y - pad - (size - b.h) / 2, size + pad * 2, size + pad * 2,
  ];
  return { vb: box.map(f1).join(' '), size: size + pad * 2, box };
}

/** The points a morph moves, piece by piece, without a closed piece's last point (its first, again). */
function movingPoints(from: Piece[], to: Piece[], closed: boolean, t: number): Pt[] {
  return pointsAt(from, to, t).flatMap((pts, i) => (closed || (from[i].closed && to[i].closed) ? pts.slice(0, -1) : pts));
}

/** Which points get a number: all of them up to 12, then every k-th, always the first. */
function labelled(total: number): (i: number) => boolean {
  const k = total > 12 ? Math.ceil(total / 10) : 1;
  return (i) => i % k === 0;
}

export function MorphGenerator({ version }: { version: string }) {
  const [choice, setChoice] = useState<Record<Side, Choice>>({ from: DEFAULT_PAIR.from, to: DEFAULT_PAIR.to });
  const [paste, setPaste] = useState<Record<Side, string>>({ from: presetOf(DEFAULT_PAIR.from).d, to: presetOf(DEFAULT_PAIR.to).d });
  const [points, setPoints] = useState<number | null>(null);
  /** A start point and direction the visitor chose, for the pair it was chosen on. */
  const [manual, setManual] = useState<{ key: string; rotate: number; reverse: boolean } | null>(null);
  const [decimals, setDecimals] = useState<number>(1);
  const [easing, setEasing] = useState<EasingName>('ease-in-out');
  const [outline, setOutline] = useState<Outline>('whole');
  const [keepDash, setKeepDash] = useState(true);
  const [fill, setFill] = useState<Fill>('none');
  const [once, setOnce] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [tab, setTab] = useState<Tab>('js');
  const [raw, setRaw] = useState(0);
  const [liveAlpha, setLiveAlpha] = useState(0);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const inst = useRef<Instance | null>(null);
  const raf = useRef(0);

  const from = useMemo(() => readSide(choice.from, paste.from), [choice.from, paste.from]);
  const to = useMemo(() => readSide(choice.to, paste.to), [choice.to, paste.to]);
  const pairKey = useMemo(
    () => (from.ok && to.ok ? `${JSON.stringify(from.shape)}|${JSON.stringify(to.shape)}|${points ?? 'auto'}` : ''),
    [from, to, points],
  );
  const chosen = manual && manual.key === pairKey ? manual : null;

  const morph = useMemo(() => {
    if (!from.ok || !to.ok) return null;
    const m = matchShapes(from.shape, to.shape, { points, rotate: chosen?.rotate ?? null, reverse: chosen?.reverse ?? null });
    const best = chosen ? matchShapes(from.shape, to.shape, { points }) : m;
    const fromD = writeD(m.from, decimals, m.closed);
    const toDs = writeD(m.to, decimals, m.closed);
    const c = compatibility(fromD, toDs);
    const t = tokenize(fromD);
    // Lengths of the written paths, rounding included: pathLength has to sit under the real one.
    const pf = parsePath(fromD);
    const pt = parsePath(toDs);
    const l0 = pf.ok ? shapeLength(pf.shape) : 0;
    const l1 = pt.ok ? shapeLength(pt.shape) : 0;
    return {
      m,
      fromD,
      toD: toDs,
      numbers: c.numbers[0],
      skel: t.ok ? skeleton(lettersOf(t.commands)) : '',
      travel: meanTravel(m.from, m.to),
      bestTravel: meanTravel(best.from, best.to),
      isBest: m.rotate === best.rotate && m.reverse === best.reverse,
      bestRotate: best.rotate,
      bestReverse: best.reverse,
      l0,
      l1,
      frame: frameOf([m.from, m.to]),
    };
  }, [from, to, points, chosen, decimals]);

  const n0 = morph ? morph.m.counts[0] : 0;
  const pathLength = morph && outline === 'draw' && keepDash ? Math.floor(morph.l0 * 0.999 * 10) / 10 : null;
  const strokeWidth = morph ? Math.max(0.5, Math.round((morph.frame.size / 50) * 10) / 10) : 4;
  const ease = NAMED[easing];
  const alpha = reduced ? ease(raw) : liveAlpha;

  const fromName = from.ok ? from.name : 'shape';
  const toName = to.ok ? (to.name === fromName ? `other ${to.name}` : to.name) : 'shape';

  const code = useMemo(() => {
    if (!morph) return null;
    const s: Settings = {
      from: morph.fromD,
      to: morph.toD,
      viewBox: morph.frame.vb,
      strokeWidth,
      easing,
      outline,
      pathLength,
      fill,
      once,
      skeleton: morph.skel,
      numbers: morph.numbers,
      fromName,
      toName,
    };
    const tabs: Record<Tab, [string, string][]> = {
      js: [['index.html', jsMarkup(s)], ['main.js', jsCode(s)]],
      react: [['Morph.jsx', reactCode(s)], ['Morph.css', reactCss(s)]],
      css: [['index.html', cssOnlyMarkup(s)], ['morph.css', cssOnly(s)]],
      paths: [['paths.js', pathsCode(s)]],
    };
    return { tabs, html: htmlPage(s, version), react: reactProject(s, version) };
  }, [morph, strokeWidth, easing, outline, pathLength, fill, once, fromName, toName, version]);

  const fade = fill === 'fade';

  // The library's own morph, in the scroll box. Rebuilt when anything it reads changes.
  useEffect(() => {
    const track = trackRef.current;
    const box = boxRef.current;
    const path = liveRef.current;
    if (!track || !box || !path || !morph) return;
    // A destroyed instance leaves its last frame on the path: start from the start shape.
    path.removeAttribute('style');
    if (reduced) return;
    path.setAttribute('d', morph.fromD);
    let live = true;
    let made: Instance | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      made = scrollDraw(track, {
        morphTo: morph.toD,
        trigger: { ...TRIGGER },
        scrollContainer: box,
        // Only the live path: the ghosts and points in the same drawing stay as they are.
        selector: '.mph-live',
        ...(easing !== 'linear' ? { easing } : {}),
        ...(fade ? { fillOpacity: [0, 1] as [number, number] } : {}),
        ...(once ? { once: true } : {}),
        onProgress: (a: number) => setLiveAlpha(a),
      });
      inst.current = made;
    });
    return () => {
      live = false;
      made?.destroy();
      if (inst.current === made) inst.current = null;
    };
  }, [morph, easing, fade, once, reduced]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const maxScroll = () => {
    const box = boxRef.current;
    return box ? Math.max(1, box.scrollHeight - box.clientHeight) : 1;
  };
  function stop() {
    cancelAnimationFrame(raf.current);
  }
  function scrollTo(p: number) {
    const box = boxRef.current;
    if (box) box.scrollTop = clamp(p, 0, 1) * maxScroll();
  }
  function play() {
    stop();
    const box = boxRef.current;
    if (!box) return;
    if (getReduced()) {
      scrollTo(1);
      return;
    }
    scrollTo(0);
    // With once, start over: replay() lets the morph go back to the start shape.
    inst.current?.replay();
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / PLAY_MS);
      scrollTo(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function pick(side: Side, c: Choice) {
    setChoice((o) => ({ ...o, [side]: c }));
  }
  function swap() {
    setChoice((o) => ({ from: o.to, to: o.from }));
    setPaste((o) => ({ from: o.to, to: o.from }));
  }
  function setMatch(rotate: number, reverse: boolean) {
    setManual({ key: pairKey, rotate, reverse });
  }

  const rotate = morph?.m.rotate ?? 0;
  const reverse = morph?.m.reverse ?? false;
  const turnable = morph?.m.turnable ?? false;
  const minPts = morph?.m.minFirst ?? 1;

  // ── Messages ──────────────────────────────────────────────────────────────
  const msgs: { k: string; text: ReactNode }[] = [];
  if (morph && outline === 'draw' && !keepDash && morph.l1 > morph.l0 * 1.01) {
    const pct = Math.round((morph.l1 / morph.l0 - 1) * 100);
    const gap = Math.round((1 - morph.l0 / morph.l1) * 100);
    msgs.push({
      k: 'Dash',
      text: `The end shape is ${pct}% longer than the start. scrollDraw sizes the dash once, from the start shape, so at the end the last ${gap}% of the outline stays undrawn. Turn on “Keep the dash in step” to draw it whole.`,
    });
  } else if (morph && outline === 'draw' && !keepDash && morph.l1 < morph.l0 * 0.99) {
    msgs.push({
      k: 'Dash',
      text: 'The end shape is shorter than the start, so with the dash sized to the start shape the line is whole a little before the morph ends.',
    });
  }
  if (once && (OVERSHOOT.includes(easing) || easing === 'bounce')) {
    msgs.push({
      k: '2.23.2',
      text: `In 2.23.2 and earlier, once held the eased value, so ${easing === 'bounce' ? 'bounce lost its dips' : `${easing} stayed for good on its overshoot, a shape past the end one`}. 2.23.3 holds the scroll progress and eases after, so it settles on the end shape.`,
    });
  }
  if (morph && (morph.m.addedFrom || morph.m.addedTo)) {
    const n = morph.m.addedFrom || morph.m.addedTo;
    msgs.push({
      k: 'Pieces',
      text: morph.m.addedTo
        ? `The start shape has ${n} more piece${n > 1 ? 's' : ''} (M commands) than the end shape. Pieces pair in order, so the last ${n > 1 ? `${n} shrink` : 'one shrinks'} to the point of the end shape nearest ${n > 1 ? 'each' : 'it'}, where the line covers the dot a round cap leaves.`
        : `The end shape has ${n} more piece${n > 1 ? 's' : ''} (M commands) than the start shape. Pieces pair in order, so the last ${n > 1 ? `${n} grow` : 'one grows'} from the point of the start shape nearest ${n > 1 ? 'each' : 'it'}.`,
    });
  }
  if (morph && !morph.m.closed && from.ok && to.ok && (from.shape.some((p) => p.closed) || to.shape.some((p) => p.closed))) {
    msgs.push({ k: 'Open', text: 'One shape is open, so both are written without Z: the closed one still ends where it starts, with a line cap there instead of a join.' });
  }
  for (const r of [from, to]) if (r.ok) for (const note of r.notes) msgs.push({ k: 'Paste', text: note });
  if (reduced) {
    msgs.push({
      k: 'Reduced motion',
      text: 'Your system asks for reduced motion, so on a real page scrollDraw shows the end shape at once. Here the preview draws each frame itself, with the library’s own interpolation, so you can still step through it.',
    });
  }
  if (fill !== 'none') {
    msgs.push({ k: 'Fill', text: 'A development build warns that a fill may hide the line. Here the fill is the point, so that warning can be ignored.' });
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  const live = morph ? movingPoints(morph.m.from, morph.m.to, morph.m.closed, alpha) : [];
  const dot = morph ? morph.frame.size / 200 : 1;

  return (
    <div className="mph">
      <div className="mph-panel">
        <div className="mph-picks">
          {(['from', 'to'] as const).map((side) => (
            <Picker
              key={side}
              side={side}
              choice={choice[side]}
              text={paste[side]}
              read={side === 'from' ? from : to}
              onPick={(c) => pick(side, c)}
              onText={(t) => setPaste((o) => ({ ...o, [side]: t }))}
              extra={side === 'to' ? <button type="button" className="mph-btn mph-swap" onClick={swap}>⇄ Swap</button> : null}
            />
          ))}
        </div>

        <div className="mph-views">
          <div className="mph-view">
            <p className="mph-k">Points · start {'→'} end</p>
            <div className="mph-frame">
              {morph ? (
                <svg
                  className="mph-svg"
                  viewBox={morph.frame.vb}
                  role="img"
                  aria-label={`The start shape solid and the end shape dashed, with ${live.length} numbered points; a thin line joins each point of the start shape to its partner on the end shape.`}
                >
                  <Pairs from={morph.m.from} to={morph.m.to} fromD={morph.fromD} toD={morph.toD} closed={morph.m.closed} dot={dot} />
                </svg>
              ) : (
                <p className="mph-empty">{!from.ok ? `Start shape: ${from.error}` : !to.ok ? `End shape: ${to.error}` : ''}</p>
              )}
            </div>
          </div>

          <div className="mph-view">
            <p className="mph-k">Preview · scrollDraw · scroll the box</p>
            <div className="mph-frame">
              <div
                ref={boxRef}
                className="mph-box"
                tabIndex={0}
                role="region"
                aria-label="Preview: scroll this box to morph the shape"
                onScroll={(e) => setRaw(e.currentTarget.scrollTop / maxScroll())}
                onWheel={stop}
                onTouchStart={stop}
                onPointerDown={stop}
                onKeyDown={stop}
              >
                <div ref={trackRef} className={`mph-track${outline === 'whole' ? ' mph-whole' : ''}`}>
                  <div className="mph-stage">
                    {morph ? (
                      <svg className="mph-svg" viewBox={morph.frame.vb} aria-hidden="true">
                        <path className="mph-ghost" d={morph.fromD} fill="none" />
                        <path className="mph-ghost" d={morph.toD} fill="none" />
                        {/* A new element when reduced motion flips, so the frame React writes is the one shown. */}
                        <path
                          key={reduced ? 'still' : 'live'}
                          ref={liveRef}
                          className="mph-live"
                          d={reduced ? morphPath(morph.fromD, morph.toD, alpha) : morph.fromD}
                          pathLength={pathLength ?? undefined}
                          fill={fill === 'none' ? 'none' : 'currentColor'}
                          fillOpacity={fill === 'tint' ? 0.15 : fill === 'fade' ? (reduced ? clamp(alpha, 0, 1) : 0) : undefined}
                          stroke="currentColor"
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {showPoints && live.map((p, i) => (
                          <circle key={i} className="mph-move" cx={p[0]} cy={p[1]} r={2.4 * dot} />
                        ))}
                      </svg>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mph-transport">
          <button type="button" className="mph-btn" onClick={play} disabled={!morph}>▶ Play</button>
          <label className="mph-scrub">
            <span>Scroll · {f2(raw)} {'→'} morph {f2(alpha)}</span>
            <input
              type="range" min={0} max={1000} step={1} value={Math.round(raw * 1000)}
              aria-label="Scroll progress of the preview"
              aria-valuetext={`scroll ${f2(raw)}, morph ${f2(alpha)}`}
              disabled={!morph}
              onChange={(e) => { stop(); scrollTo(Number(e.target.value) / 1000); }}
            />
          </label>
          <label className="mph-check">
            <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
            Show points
          </label>
        </div>

        <div className="mph-controls">
          <fieldset className="mph-group">
            <legend>Matching</legend>
            <div className="mph-field">
              <span>
                End shape’s start point · {turnable ? `${rotate + 1} of ${n0}` : 'open path'}
              </span>
              <div className="mph-stepper">
                <button type="button" className="mph-btn" aria-label="Move the start point back one" disabled={!turnable}
                  onClick={() => setMatch((rotate - 1 + n0) % n0, reverse)}>−</button>
                <input
                  type="range" min={0} max={Math.max(0, n0 - 1)} step={1} value={rotate} disabled={!turnable}
                  aria-label="End shape’s start point" aria-valuetext={`point ${rotate + 1} of ${n0}`}
                  onChange={(e) => setMatch(Number(e.target.value), reverse)}
                />
                <button type="button" className="mph-btn" aria-label="Move the start point on one" disabled={!turnable}
                  onClick={() => setMatch((rotate + 1) % n0, reverse)}>+</button>
              </div>
            </div>
            <div className="mph-field">
              <span>Direction of the end shape</span>
              <Seg
                label="Direction of the end shape"
                value={reverse ? 'rev' : 'as'}
                options={[['as', 'As drawn'], ['rev', 'Reversed']]}
                onChange={(v) => setMatch(rotate, v === 'rev')}
              />
            </div>
            <div className="mph-field">
              <span>Least travel</span>
              <button
                type="button"
                className="mph-btn"
                aria-pressed={morph?.isBest ?? true}
                disabled={!morph}
                onClick={() => setManual(null)}
              >
                {morph?.isBest ? 'Best fit · in use' : 'Use the best fit'}
              </button>
            </div>
            <div className="mph-field">
              <span>Points per piece · {n0}{points === null ? ' (auto)' : ''}</span>
              <div className="mph-stepper">
                <input
                  type="range" min={minPts} max={Math.max(MAX_POINTS, minPts)} step={1} value={clamp(n0, minPts, Math.max(MAX_POINTS, minPts))}
                  aria-label="Points per piece" disabled={!morph}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
                <button type="button" className="mph-btn" aria-pressed={points === null} disabled={!morph} onClick={() => setPoints(null)}>Auto</button>
              </div>
            </div>
            <div className="mph-field">
              <span>Decimals</span>
              <Seg label="Decimals" value={String(decimals)} options={DECIMALS.map((d) => [String(d), String(d)])} onChange={(v) => setDecimals(Number(v))} />
            </div>
          </fieldset>

          <fieldset className="mph-group">
            <legend>Animation</legend>
            <label className="mph-field">
              <span>Easing</span>
              <select value={easing} onChange={(e) => setEasing(e.target.value as EasingName)}>
                {EASING_NAMES.map((e) => <option key={e} value={e}>{e}{e === 'linear' ? ' (default)' : ''}</option>)}
              </select>
            </label>
            <div className="mph-field">
              <span>Outline</span>
              <Seg label="Outline" value={outline} options={[['whole', 'Stays whole'], ['draw', 'Draws in']]} onChange={(v) => setOutline(v as Outline)} />
            </div>
            {outline === 'draw' ? (
              <label className="mph-check">
                <input type="checkbox" checked={keepDash} onChange={(e) => setKeepDash(e.target.checked)} />
                Keep the dash in step (pathLength)
              </label>
            ) : null}
            <div className="mph-field">
              <span>Fill</span>
              <Seg label="Fill" value={fill} options={[['none', 'None'], ['tint', 'Tint'], ['fade', 'Fades in']]} onChange={(v) => setFill(v as Fill)} />
            </div>
            <label className="mph-check">
              <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} />
              Stay morphed (once)
            </label>
          </fieldset>
        </div>

        {morph ? (
          <dl className="mph-read">
            <div>
              <dt>Start</dt>
              <dd>{from.ok ? `d = ${skeleton(from.letters)}` : ''}</dd>
            </div>
            <div>
              <dt>End</dt>
              <dd>{to.ok ? `d = ${skeleton(to.letters)}` : ''}</dd>
            </div>
            <div>
              <dt>Both now</dt>
              <dd>d = {morph.skel} · {morph.numbers} numbers each</dd>
            </div>
            <div>
              <dt>Travel</dt>
              <dd>
                {f1(morph.travel)} units per point on average
                {morph.isBest ? ', the least' : `; the best fit, start point ${morph.bestRotate + 1}${morph.bestReverse ? ' reversed' : ''}, is ${f1(morph.bestTravel)}`}
              </dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>
                start {f1(morph.l0)} · end {f1(morph.l1)}
                {pathLength != null ? ` · pathLength ${pathLength}` : ''}
              </dd>
            </div>
          </dl>
        ) : null}

        {msgs.length > 0 && (
          <ul className="mph-msgs" aria-live="polite">
            {msgs.map((m) => (
              <li key={m.k + String(m.text)}>
                <span className="mph-msg-k">{m.k}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mph-code">
        <div className="mph-tabs" role="tablist" aria-label="Generated code">
          {TABS.map(([t, label]) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`mph-tab-${t}`}
              aria-controls="mph-tabpanel"
              aria-selected={tab === t}
              className="mph-tab"
              onClick={() => setTab(t)}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id="mph-tabpanel" aria-labelledby={`mph-tab-${tab}`} className="mph-tabpanel">
          {code ? (
            <>
              {code.tabs[tab].map(([file, text]) => <CodeBox key={file} file={file}>{text}</CodeBox>)}
              {tab === 'css' ? (
                <p className="mph-hint">
                  Tested in Playwright’s Chromium, Firefox and WebKit: Chromium and Firefox animate <code>d</code> on
                  the scroll timeline; WebKit runs the timeline but has no <code>d</code> property in CSS, so the
                  shape stays the start one there.
                </p>
              ) : tab === 'paths' ? (
                <p className="mph-hint">
                  The two strings on their own, for morphTo, CSS <code>d: path()</code>, SMIL’s{' '}
                  <code>{'<animate attributeName="d">'}</code> or any tool that moves numbers.
                </p>
              ) : (
                <p className="mph-hint">
                  Only options that differ from scrollDraw’s defaults are written; the trigger is the sticky
                  section’s ({TRIGGER.start} → {TRIGGER.end}).
                </p>
              )}
              <ToolExport title="SVG morph" filename="svg-morph.html" html={code.html} react={code.react} />
            </>
          ) : (
            <p className="mph-empty">Fix the shape above to get the code.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function Picker({
  side, choice, text, read, onPick, onText, extra,
}: {
  side: Side;
  choice: Choice;
  text: string;
  read: Read;
  onPick: (c: Choice) => void;
  onText: (t: string) => void;
  extra: ReactNode;
}) {
  const title = side === 'from' ? 'Start shape' : 'End shape';
  return (
    <fieldset className="mph-pick">
      <legend className="mph-legend">
        <span>{title}</span>
        {extra}
      </legend>
      <div className="mph-chips" role="group" aria-label={title}>
        {PRESETS.map((p) => (
          <button key={p.key} type="button" className="mph-chip" aria-pressed={choice === p.key} onClick={() => onPick(p.key)}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <path d={p.d} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{p.name.split(' ')[0]}</span>
          </button>
        ))}
        <button type="button" className="mph-chip is-paste" aria-pressed={choice === 'paste'} onClick={() => onPick('paste')}>
          <span className="mph-chip-icon" aria-hidden="true">d=</span>
          <span>Paste</span>
        </button>
      </div>
      {choice === 'paste' ? (
        <label className="mph-paste">
          <span>{title}: a path’s d value, or an SVG with a path</span>
          <textarea value={text} spellCheck={false} rows={4} onChange={(e) => onText(e.target.value)} />
        </label>
      ) : null}
      <p className={`mph-as${read.ok ? '' : ' is-error'}`} role={read.ok ? undefined : 'status'}>
        {read.ok
          ? `d = ${skeleton(read.letters)} · ${read.shape.reduce((n, p) => n + p.segs.length, 0)} segments as cubics${read.shape.length > 1 ? `, in ${read.shape.length} pieces` : ''}`
          : read.error}
      </p>
    </fieldset>
  );
}

function Seg({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void }) {
  return (
    <span className="mph-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </span>
  );
}

/** Both shapes with their points numbered, and a thin line from each point to its partner. */
function Pairs({ from, to, fromD, toD, closed, dot }: { from: Shape; to: Shape; fromD: string; toD: string; closed: boolean; dot: number }) {
  const rows: { a: Pt; b: Pt; n: number }[] = [];
  let n = 0;
  from.forEach((p, i) => {
    const va = vertices(p);
    const vb = vertices(to[i]);
    // A closed piece's last point is its first.
    const count = closed || (p.closed && to[i].closed) ? va.length - 1 : va.length;
    for (let k = 0; k < count; k++) rows.push({ a: va[k], b: vb[k], n: n++ });
  });
  const show = labelled(rows.length);
  return (
    <>
      <path className="mph-pair-to" d={toD} fill="none" />
      <path className="mph-pair-from" d={fromD} fill="none" />
      {rows.map((r) => (
        <line key={`l${r.n}`} className="mph-travel" x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]} />
      ))}
      {rows.map((r) => (
        <circle key={`b${r.n}`} className="mph-pt-to" cx={r.b[0]} cy={r.b[1]} r={2.6 * dot} />
      ))}
      {rows.map((r) => (
        <circle key={`a${r.n}`} className={`mph-pt-from${r.n === 0 ? ' is-first' : ''}`} cx={r.a[0]} cy={r.a[1]} r={(r.n === 0 ? 4 : 2.8) * dot} />
      ))}
      {rows.filter((r) => show(r.n)).map((r) => {
        // The number sits just outside the start point, away from its partner.
        const dx = r.a[0] - r.b[0];
        const dy = r.a[1] - r.b[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = 9 * dot;
        return (
          <text key={`t${r.n}`} className="mph-num" x={r.a[0] + (dx / len) * off} y={r.a[1] + (dy / len) * off + 3.4 * dot} fontSize={9.5 * dot} textAnchor="middle">
            {r.n + 1}
          </text>
        );
      })}
    </>
  );
}
