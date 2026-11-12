'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  EDGES, LINES, defaultsOf, edgeOffset, lineOffset, pairWords, progressAt, readTrigger, triggerAt,
  type Edge, type Reading,
} from '@/data/trigger';
import { DRAWING, TARGETS, fileOf, jsCode, reactCode, reactProject, triggerHtml, type Target } from './code';

/**
 * The scroll trigger visualizer.
 *
 * - The preview is a small scroll box standing in for the window. The element
 *   in it holds a drawing run by scrollDraw with the chosen trigger and
 *   `scrollContainer` set to the box, so what draws is the library itself.
 * - The two lines, the scroll track and the worked numbers come from
 *   data/trigger.ts, which repeats core/trigger.ts's arithmetic: they keep
 *   counting while the element is out of view, where the library rests.
 * - The code is written from the same state by code.ts, leaving out any part
 *   of the trigger that matches the chosen function's default window. Its Run
 *   it row downloads (or opens in StackBlitz) a page running that code on an
 *   element of the chosen height, with the lines, edges and progress drawn,
 *   the library from jsDelivr at `version` (SELF.version, passed down by the
 *   page).
 */

type Which = 'start' | 'end';

/** The preview box's height in trigger.css, until it is measured. */
const VP = 300;
const HEIGHTS = [0.4, 0.8, 1.6] as const;
const PLAY_MS = 2400;
const LINE_KINDS = [...LINES, 'percent'] as const;

const INITIAL = { start: 'top 85%', end: 'top 40%', ratio: 0.4 as number };

const PRESETS: { label: string; start: string; end: string; ratio?: number }[] = [
  { label: 'scrollDraw default', start: defaultsOf('scrollDraw').start, end: defaultsOf('scrollDraw').end },
  { label: 'scrollText default', start: defaultsOf('scrollText').start, end: defaultsOf('scrollText').end },
  { label: 'scrollReveal default', start: defaultsOf('scrollReveal').start, end: defaultsOf('scrollReveal').end },
  { label: 'Through the middle', start: 'top center', end: 'bottom center' },
  { label: 'Taller than the viewport', start: 'top top', end: 'bottom bottom', ratio: 1.6 },
];

/** Where things sit inside the preview's scroll content, in px. */
function geometry(vp: number, ratio: number) {
  const pad = Math.round(vp * 0.25);
  const height = Math.round(vp * ratio);
  // A viewport of room above the element, so every window starts in view.
  const top = pad + vp;
  return { pad, height, top, max: pad * 2 + vp + height };
}

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1));

export function TriggerVisualizer({ version }: { version: string }) {
  const [start, setStart] = useState(INITIAL.start);
  const [end, setEnd] = useState(INITIAL.end);
  const [ratio, setRatio] = useState<number>(INITIAL.ratio);
  const [vp, setVp] = useState(VP);
  const [scroll, setScroll] = useState(0);
  const [target, setTarget] = useState<Target>('scrollDraw');
  const [tab, setTab] = useState<'js' | 'react'>('js');
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const scroller = useRef<HTMLDivElement>(null);
  const element = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const rs = useMemo(() => readTrigger(start), [start]);
  const re = useMemo(() => readTrigger(end), [end]);
  const g = geometry(vp, ratio);
  const tStart = triggerAt(rs.canonical, g.top, g.height, vp);
  const tEnd = triggerAt(re.canonical, g.top, g.height, vp);
  const progress = progressAt(scroll, tStart, tEnd);

  // The box's real height: the percentages are of it.
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const ro = new ResizeObserver(() => setVp(box.clientHeight || VP));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Open half way through the first window, so the lines are already doing something.
  // Once the box's real height is in: on a phone it is shorter than VP, and the
  // content laid out for VP would put that scroll position somewhere else.
  const placed = useRef(false);
  useEffect(() => {
    const box = scroller.current;
    if (!box || placed.current) return;
    if (box.clientHeight && box.clientHeight !== vp) return;
    placed.current = true;
    const g0 = geometry(vp, INITIAL.ratio);
    const a = triggerAt(INITIAL.start, g0.top, g0.height, vp);
    const b = triggerAt(INITIAL.end, g0.top, g0.height, vp);
    box.scrollTop = (a + b) / 2;
  }, [vp]);

  // The drawing: scrollDraw on the element, watching the box instead of the window.
  // Rebuilt whenever the trigger or the layout it was measured from changes.
  useEffect(() => {
    const el = element.current;
    const box = scroller.current;
    if (!el || !box) return;
    let live = true;
    let inst: { destroy: () => void } | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      inst = scrollDraw(el, { trigger: { start: rs.canonical, end: re.canonical }, scrollContainer: box });
    });
    return () => {
      live = false;
      inst?.destroy();
    };
  }, [rs.canonical, re.canonical, g.height, vp]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function stop() {
    cancelAnimationFrame(raf.current);
  }

  /** Scroll the box from one position to another, as a reader would; at once under reduced motion. */
  function run(from: number, to: number) {
    stop();
    const box = scroller.current;
    if (!box) return;
    if (getReduced()) {
      box.scrollTop = to;
      return;
    }
    box.scrollTop = from;
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / PLAY_MS);
      box.scrollTop = from + (to - from) * t;
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  /** Play through a window with a little before and after it. */
  function playWindow(a: number, b: number, max: number, h: number) {
    const lead = h * 0.15;
    run(clamp(Math.min(a, b) - lead, 0, max), clamp(Math.max(a, b) + lead, 0, max));
  }

  function jump(y: number) {
    stop();
    const box = scroller.current;
    if (box) box.scrollTop = clamp(y, 0, g.max);
  }

  function choose(p: (typeof PRESETS)[number]) {
    const r = p.ratio ?? ratio;
    setStart(p.start);
    setEnd(p.end);
    setRatio(r);
    const g1 = geometry(vp, r);
    const a = triggerAt(p.start, g1.top, g1.height, vp);
    const b = triggerAt(p.end, g1.top, g1.height, vp);
    // After the new layout is in: a taller element makes room the box does not have yet.
    requestAnimationFrame(() => playWindow(a, b, g1.max, vp));
  }

  const setPair = (w: Which, v: string) => (w === 'start' ? setStart(v) : setEnd(v));
  const readingOf = (w: Which) => (w === 'start' ? rs : re);
  const onEdge = (w: Which, edge: Edge) => setPair(w, `${edge} ${readingOf(w).line}`);
  const onLine = (w: Which, kind: string) => {
    const r = readingOf(w);
    setPair(w, kind === 'percent' ? `${r.edge} ${isPct(r.line) ? r.line : `${Math.round(r.at * 100)}%`}` : `${r.edge} ${kind}`);
  };
  const onPct = (w: Which, n: number) => setPair(w, `${readingOf(w).edge} ${n}%`);

  const same = Math.abs(tEnd - tStart) < 0.5;
  const backwards = !same && tEnd < tStart;
  const status = same
    ? 'Start and end are the same scroll position, so progress stays 0.'
    : backwards
      ? 'End comes before start: progress runs from 1 down to 0 as you scroll down.'
      : scroll <= tStart
        ? 'Before the start line: nothing has happened yet.'
        : scroll >= tEnd
          ? 'Past the end: finished.'
          : 'Between start and end: running.';
  const raw = same ? 0 : (scroll - tStart) / (tEnd - tStart);

  const code = useMemo(() => (tab === 'js' ? jsCode(target, rs, re) : reactCode(target, rs, re)), [tab, target, rs, re]);
  const html = useMemo(() => triggerHtml({ target, rs, re, ratio }, version), [target, rs, re, ratio, version]);
  const react = useMemo(() => reactProject({ target, rs, re, ratio }, version), [target, rs, re, ratio, version]);
  const def = defaultsOf(target);
  // A place on the scroll track, as a percentage of it; off either end, the end.
  const pos = (n: number) => clamp((n / g.max) * 100, 0, 100);
  const at = (n: number) => `${pos(n)}%`;
  const winFrom = pos(Math.min(tStart, tEnd));
  const winTo = pos(Math.max(tStart, tEnd));

  return (
    <div className="trg">
      <div className="trg-panel">
        <div className="trg-presets" role="group" aria-label="Presets">
          <span className="trg-k">Presets</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="trg-chip"
              aria-pressed={rs.canonical === readTrigger(p.start).canonical && re.canonical === readTrigger(p.end).canonical}
              onClick={() => choose(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="trg-controls">
          <Pair which="start" title="Start · progress 0" value={start} reading={rs}
            onText={setStart} onEdge={onEdge} onLine={onLine} onPct={onPct} />
          <Pair which="end" title="End · progress 1" value={end} reading={re}
            onText={setEnd} onEdge={onEdge} onLine={onLine} onPct={onPct} />
          <div className="trg-field trg-height">
            <span>Element height · of the viewport</span>
            <span className="trg-seg" role="radiogroup" aria-label="Element height">
              {HEIGHTS.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={ratio === h} onClick={() => setRatio(h)}>
                  {Math.round(h * 100)}%
                </button>
              ))}
            </span>
          </div>
        </div>

        <p className="trg-words">
          Starts when {pairWords(rs)}; done when {pairWords(re)}.
        </p>

        {/* The preview, its transport and the readouts are the panel's own grid
            cells: beside each other on a wide screen, and on a phone the preview
            comes first and stays in view while the controls scroll under it. */}
        <div className="trg-view">
          <p className="trg-k">Viewport · {vp}px tall · scroll it</p>
          <div className="trg-frame">
            <div
              ref={scroller}
              className="trg-scroller"
              tabIndex={0}
              role="region"
              aria-label="Preview viewport: scroll it to move the element past the start and end lines"
              onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
              onKeyDown={stop}
            >
              <div style={{ height: g.top }} />
              <div ref={element} className="trg-el" style={{ height: g.height }}>
                <svg className="trg-svg" viewBox="0 0 240 64" aria-hidden="true">
                  <path d={DRAWING} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="trg-el-k">#drawing</span>
                <Edges start={rs.edge} end={re.edge} />
              </div>
              <div style={{ height: vp + g.pad }} />
            </div>
            <div className="trg-overlay" aria-hidden="true">
              {[0.25, 0.5, 0.75].map((f) => (
                <span key={f} className="trg-tick" style={{ top: `${f * 100}%` }}>{f * 100}%</span>
              ))}
              <ViewLine kind="end" reading={re} />
              <ViewLine kind="start" reading={rs} />
            </div>
          </div>
        </div>

        <div className="trg-transport">
          <button type="button" className="trg-btn" onClick={() => playWindow(tStart, tEnd, g.max, vp)}>▶ Play</button>
          <button type="button" className="trg-btn" onClick={() => jump(tStart)}>To start</button>
          <button type="button" className="trg-btn" onClick={() => jump(tEnd)}>To end</button>
          <label className="trg-scrub">
            <span>Scroll · {fmt(scroll)}px</span>
            <input
              type="range" min={0} max={g.max} step={1} value={Math.round(clamp(scroll, 0, g.max))}
              aria-label="Scroll position of the preview"
              onChange={(e) => jump(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="trg-read">
          <div className="trg-prog">
            <span className="trg-k">Progress</span>
            <output className="trg-num" aria-label="Progress">{progress.toFixed(2)}</output>
            <span className="trg-bar"><span style={{ transform: `scaleX(${progress})` }} /></span>
            <p className="trg-status">{status}</p>
          </div>

          <div className="trg-track" aria-hidden="true">
            <span className="trg-k">Scroll position · 0 to {g.max}px</span>
            <div className="trg-rail">
              <span className="trg-win" style={{ left: `${winFrom}%`, width: `${winTo - winFrom}%` }} />
              <Mark className="is-start" left={at(tStart)} label={`start ${fmt(tStart)}`} />
              <Mark className="is-end" left={at(tEnd)} label={`end ${fmt(tEnd)}`} />
              <span className="trg-now" style={{ left: at(scroll) }} />
            </div>
          </div>

          <dl className="trg-math">
            <div><dt>Viewport</dt><dd>{vp}px tall: the scroll box</dd></div>
            <div><dt>Element</dt><dd>top {g.top}px down the content, {g.height}px tall</dd></div>
            <Row k="Start" r={rs} top={g.top} height={g.height} vp={vp} t={tStart} />
            <Row k="End" r={re} top={g.top} height={g.height} vp={vp} t={tEnd} />
            <div><dt>Scroll</dt><dd>{fmt(scroll)}px</dd></div>
            <div>
              <dt>Progress</dt>
              <dd>
                {same
                  ? 'end = start, so 0'
                  : <>({fmt(scroll)} − {fmt(tStart)}) ÷ ({fmt(tEnd)} − {fmt(tStart)}) = {raw.toFixed(2)}{raw < 0 || raw > 1 ? `, clamped to ${progress.toFixed(0)}` : ''}</>}
              </dd>
            </div>
          </dl>
        </div>

        {(same || backwards || reduced) && (
          <div className="trg-msgs">
            {same && (
              <p className="trg-warn" role="status">
                The window has no length: with start and end at one scroll position, the library returns 0 for every
                scroll. Move one of the lines.
              </p>
            )}
            {backwards && (
              <p className="trg-warn" role="status">
                End comes before start, so it plays backwards: complete until the end pair meets, undone by the time the
                start pair does. Swap start and end to play it forwards.
                {rs.edge !== re.edge ? ' With two different edges the order also depends on the element’s height.' : ''}
              </p>
            )}
            {reduced && (
              <p className="trg-rm">
                Your system asks for reduced motion, so the drawing shows complete, as the library does for every reader
                who asks. The lines and numbers still follow the scroll.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="trg-code">
        <label className="trg-for">
          <span>Code for</span>
          <select value={target} onChange={(e) => setTarget(e.target.value as Target)} aria-label="Function to write the code for">
            {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <div className="trg-tabs" role="tablist" aria-label="Code">
          {(['js', 'react'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="trg-tab" onClick={() => setTab(t)}>
              {t === 'js' ? 'JavaScript' : 'React'}
            </button>
          ))}
        </div>
        <CodeBox file={fileOf(target, tab)}>{code}</CodeBox>
        <p className="trg-hint">
          Anything that matches {target}’s own default window ({def.start} → {def.end}) is left out of the code.
          Run it makes a page of its own from this code: the element {Math.round(ratio * 100)}% of the window’s
          height, with the two lines, its edges and the progress drawn as here.
        </p>
        <ToolExport title="Scroll trigger" filename="scroll-trigger.html" html={html} react={react} />
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const isPct = (line: string) => /%$/.test(line);

function Pair({
  which, title, value, reading, onText, onEdge, onLine, onPct,
}: {
  which: Which;
  title: string;
  value: string;
  reading: Reading;
  onText: (v: string) => void;
  onEdge: (w: Which, e: Edge) => void;
  onLine: (w: Which, kind: string) => void;
  onPct: (w: Which, n: number) => void;
}) {
  const pct = isPct(reading.line);
  return (
    <fieldset className="trg-pair">
      <legend>{title}</legend>
      <div className="trg-row">
        <Field label="Element edge">
          <select value={reading.edge} aria-label={`${which} element edge`} onChange={(e) => onEdge(which, e.target.value as Edge)}>
            {EDGES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Viewport line">
          <select value={pct ? 'percent' : reading.line} aria-label={`${which} viewport line`} onChange={(e) => onLine(which, e.target.value)}>
            {LINE_KINDS.map((k) => <option key={k} value={k}>{k === 'percent' ? 'a percentage' : k}</option>)}
          </select>
        </Field>
      </div>
      {pct && (
        <Field label={`Line · ${reading.line} down`}>
          <input
            type="range" min={0} max={100} step={1} value={Math.min(100, parseFloat(reading.line))}
            aria-label={`${which} viewport line, percent`}
            onChange={(e) => onPct(which, Number(e.target.value))}
          />
        </Field>
      )}
      <Field label="As written">
        <input type="text" value={value} spellCheck={false} maxLength={40} aria-label={`${which} trigger, as written`}
          onChange={(e) => onText(e.target.value)} />
      </Field>
      {reading.notes.length > 0 && (
        <ul className="trg-notes">
          <li>Read as ‘{reading.canonical}’.</li>
          {reading.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="trg-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** The element's start and end edges, marked on it. */
function Edges({ start, end }: { start: Edge; end: Edge }) {
  const at = (e: Edge) => (e === 'top' ? '0%' : e === 'center' ? '50%' : '100%');
  if (start === end) return <span className={`trg-edge is-${start}`} style={{ top: at(start) }}><i>start + end edge</i></span>;
  return (
    <>
      <span className={`trg-edge is-${start}`} style={{ top: at(start) }}><i>start edge</i></span>
      <span className={`trg-edge is-end is-${end}`} style={{ top: at(end) }}><i>end edge</i></span>
    </>
  );
}

/** A line across the preview viewport, where the trigger's second word puts it. */
function ViewLine({ kind, reading }: { kind: Which; reading: Reading }) {
  const below = reading.at > 1;
  const f = Math.min(1, reading.at);
  return (
    <span className={`trg-line is-${kind}${f < 0.12 ? ' is-low' : ''}`} style={{ top: `${f * 100}%` }}>
      <i>{kind} · {reading.line}{below ? ' (below)' : ''}</i>
    </span>
  );
}

function Mark({ className, left, label }: { className: string; left: string; label: string }) {
  const p = parseFloat(left);
  const align = p < 12 ? 'is-l' : p > 88 ? 'is-r' : '';
  return (
    <span className={`trg-mark ${className} ${align}`} style={{ left }}>
      <i>{label}</i>
    </span>
  );
}

/** One trigger, worked: the edge's place in the content minus the line's place in the viewport. */
function Row({ k, r, top, height, vp, t }: { k: string; r: Reading; top: number; height: number; vp: number; t: number }) {
  const edge = top + edgeOffset(r.edge, height);
  const line = lineOffset(r.line, vp);
  return (
    <div>
      <dt>{k}</dt>
      <dd>
        {`'${r.canonical}'`}: {fmt(edge)} − {fmt(line)} = {fmt(t)}px
        <small>element {r.edge} at {fmt(edge)} · {r.line} of {vp} = {fmt(line)}</small>
      </dd>
    </div>
  );
}
