'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { maxStagger } from '@/data/text-effects';
import { pairWords, progressAt, readTrigger } from '@/data/trigger';
import {
  DARK, DIRECTIONS, EDGES, ENGINES, FILE_OF, INITIAL, LIGHT, MAX_TEXT, RANGE_PRESETS, SPLITS, TAB_LABEL, TITLE,
  clean, codeFor, contrast, countPieces, fillVar, overlap, previewCss, rangeText, reactProject, runnableHtml,
  samePair, scrollAt, sequentialStagger, tabsOf, triggerText, unfilledColour,
  type CodeTab, type Direction, type Engine, type Point, type Settings, type Split, type Tag,
} from './model';
import type { Edge } from '@/data/trigger';

/**
 * The text fill on scroll generator.
 *
 * - The preview is a small scroll box standing in for the window, and what
 *   fills in it is the real thing: the CSS engine is the generated CSS itself
 *   (its viewport lengths in px of the box), scrollProgress runs with
 *   `scrollContainer` set to the box, and scrollText, which reads only the
 *   window's scroll, is driven by seek() with the progress the same trigger
 *   gives in the box.
 * - The lines, the progress and the "kept" value for once come from
 *   model.ts's scrollAt, the library's trigger arithmetic (core/trigger.ts).
 * - The code is written from the same settings by model.ts, leaving out every
 *   option that is at the library's default.
 *
 * scrollText rewrites its element's children, so its element is made here by
 * hand in a host React never renders into.
 */

type TextInstance = ReturnType<typeof import('svg-scroll-draw/text').scrollText>;
type Geo = { top: number; height: number; vp: number; max: number };

const PLAY_MS = 2600;
/** The preview box's height in textfill.css, until it is measured. */
const VP = 320;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;
const noSubscribe = () => () => {};
const getTimelines = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const ratio = (n: number) => `${n.toFixed(2)}:1`;

/** The scrollText pieces in an element: its aria-hidden spans, less the spaces between them. */
const domPieces = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>(':scope > span[aria-hidden="true"]')].filter((p) => p.style.whiteSpace !== 'pre').length;

export function TextFillGenerator({ version }: { version: string }) {
  const [s, setS] = useState<Settings>(INITIAL);
  const [pick, setPick] = useState<CodeTab>('css');
  const [scroll, setScroll] = useState(0);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [kept, setKept] = useState(0);
  const [run, setRun] = useState(0);
  const [pieces, setPieces] = useState<number | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const timelines = useSyncExternalStore(noSubscribe, getTimelines, () => true);

  const boxRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const cssHost = useRef<HTMLDivElement>(null);
  const textHost = useRef<HTMLDivElement>(null);
  const textInst = useRef<TextInstance | null>(null);
  const shownRef = useRef(0);
  const raf = useRef(0);

  const isText = s.engine === 'text';
  const vp = geo?.vp ?? VP;
  const tS = geo ? scrollAt(s.start, geo.top, geo.height, geo.vp) : 0;
  const tE = geo ? scrollAt(s.end, geo.top, geo.height, geo.vp) : 0;
  const raw = geo ? progressAt(scroll, tS, tE) : 0;
  const keeps = s.once && s.engine !== 'css';
  const shown = keeps ? Math.max(kept, raw) : raw;

  /** Change settings. A fresh instance remembers nothing, so neither does the readout. */
  function update(patch: Partial<Settings>) {
    setS((p) => ({ ...p, ...patch }));
    setKept(0);
  }

  // ── The box and the block's place in it ───────────────────────────────────
  useEffect(() => {
    const box = boxRef.current;
    const subject = subjectRef.current;
    if (!box || !subject) return;
    const measure = () => {
      const el = subject.querySelector('.text-fill') ?? subject;
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      setGeo({
        top: r.top - b.top - box.clientTop + box.scrollTop,
        height: r.height,
        vp: box.clientHeight || VP,
        max: Math.max(0, box.scrollHeight - box.clientHeight),
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(subject);
    return () => ro.disconnect();
  }, []);

  // Open part way through the window, so the first thing seen is a fill in progress.
  const placed = useRef(false);
  useEffect(() => {
    const box = boxRef.current;
    if (placed.current || !geo || !box) return;
    placed.current = true;
    const a = scrollAt(INITIAL.start, geo.top, geo.height, geo.vp);
    const b = scrollAt(INITIAL.end, geo.top, geo.height, geo.vp);
    box.scrollTop = a + (b - a) * 0.45;
  }, [geo]);

  // ── scrollText, driven by seek() ──────────────────────────────────────────
  useEffect(() => {
    shownRef.current = shown;
    textInst.current?.seek(shown);
  }, [shown]);

  useEffect(() => {
    const host = textHost.current;
    if (s.engine !== 'text' || !host) return;
    let live = true;
    let inst: TextInstance | null = null;
    const el = document.createElement(s.tag);
    el.className = 'text-fill';
    el.textContent = clean(s.text);
    host.replaceChildren(el);
    import('svg-scroll-draw/text').then(({ scrollText }) => {
      if (!live) return;
      // No trigger or once here: seek() sets the progress, from the box's scroll.
      inst = scrollText(el, { split: s.split, stagger: s.stagger, from: { opacity: s.dimOpacity } });
      inst.seek(shownRef.current);
      textInst.current = inst;
      setPieces(domPieces(el));
    });
    return () => {
      live = false;
      inst?.destroy();
      textInst.current = null;
      el.remove();
    };
  }, [s.engine, s.tag, s.text, s.split, s.stagger, s.dimOpacity]);

  // ── scrollProgress, watching the box ──────────────────────────────────────
  useEffect(() => {
    const box = boxRef.current;
    const el = cssHost.current?.querySelector<HTMLElement>('.text-fill');
    if (s.engine !== 'progress' || !box || !el) return;
    let live = true;
    let inst: { destroy: () => void } | null = null;
    const start = triggerText(s.start);
    const end = triggerText(s.end);
    const once = s.once;
    import('svg-scroll-draw/progress').then(({ scrollProgress }) => {
      if (!live) return;
      let furthest = 0;
      inst = scrollProgress(el, {
        trigger: { start, end },
        scrollContainer: box,
        // The generated code's once, word for word.
        onProgress: once
          ? (r) => {
              furthest = Math.max(furthest, r);
              el.style.setProperty('--text-fill', String(furthest));
            }
          : undefined,
      });
    });
    return () => {
      live = false;
      inst?.destroy();
      el.style.removeProperty('--text-fill');
    };
  }, [s.engine, s.start, s.end, s.once, s.tag, s.direction, s.text, run]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // ── Transport ─────────────────────────────────────────────────────────────
  function stop() {
    cancelAnimationFrame(raf.current);
  }

  /** Scroll the box through the window, from a little before it to a little after; at once under reduced motion. */
  function play() {
    stop();
    const box = boxRef.current;
    if (!box || !geo) return;
    const lead = geo.vp * 0.12;
    const from = clamp(Math.min(tS, tE) - lead, 0, geo.max);
    const to = clamp(Math.max(tS, tE) + lead, 0, geo.max);
    box.scrollTop = from;
    setKept(0);
    setRun((r) => r + 1);
    if (getReduced()) {
      box.scrollTop = to;
      return;
    }
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / PLAY_MS);
      box.scrollTop = from + (to - from) * t;
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function jump(y: number) {
    stop();
    const box = boxRef.current;
    if (box) box.scrollTop = clamp(y, 0, geo?.max ?? 0);
  }

  function onScroll(y: number) {
    setScroll(y);
    if (geo) setKept((k) => Math.max(k, progressAt(y, tS, tE)));
  }

  // ── What the settings mean ────────────────────────────────────────────────
  const n = isText ? pieces ?? countPieces(s.text, s.split) : null;
  const cap = n != null ? maxStagger(n) : 1;
  const pops = isText && n != null && n > 1 && s.stagger >= cap;
  const same = geo != null && Math.abs(tE - tS) < 0.5;
  const backwards = geo != null && !same && tE < tS;
  const unfilled = unfilledColour(s);
  const cUnfilled = contrast(unfilled, s.bg);
  const cFilled = contrast(s.full, s.bg);
  const engine = ENGINES.find((e) => e.key === s.engine) ?? ENGINES[0];
  const presetOn = (p: (typeof RANGE_PRESETS)[number]) => samePair(s, p.start, p.end);

  const tabs = tabsOf(s.engine);
  // CSS is every engine's first tab.
  const tab: CodeTab = tabsOf(s.engine).includes(pick) ? pick : 'css';
  const code = useMemo(() => codeFor(s, tab), [s, tab]);
  const html = useMemo(() => runnableHtml(s, version), [s, version]);
  const react = useMemo(() => reactProject(s, version), [s, version]);
  const css = useMemo(() => previewCss(s, '.tfl-box', vp), [s, vp]);

  const Tag = s.tag;
  const text = clean(s.text);
  const frameStyle = { '--tfl-bg': s.bg, '--tfl-ink': s.full } as CSSProperties;
  const status = same
    ? 'No window: start and end are one scroll position.'
    : backwards
      ? 'End comes before start.'
      : raw <= 0
        ? 'Before the start line: unfilled.'
        : raw >= 1
          ? 'Past the end line: filled.'
          : 'Between the lines: filling.';

  return (
    <div className="tfl">
      <div className="tfl-panel">
        <div className="tfl-engine">
          <span className="tfl-k">Engine</span>
          <Seg
            label="Engine"
            value={s.engine}
            options={ENGINES.map((e) => ({ key: e.key, label: e.label }))}
            onChange={(v) => update({ engine: v as Engine })}
          />
          <p className="tfl-engine-d">{engine.what}</p>
        </div>

        <div className="tfl-view">
          <p className="tfl-k">Viewport · {Math.round(vp)}px tall · scroll it</p>
          <div className="tfl-frame" style={frameStyle}>
            <style>{css}</style>
            <div
              ref={boxRef}
              className="tfl-box"
              tabIndex={0}
              role="region"
              aria-label="Preview viewport: scroll it to move the text past the start and end lines"
              onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
              onKeyDown={stop}
            >
              <div className="tfl-room" />
              <div ref={subjectRef} className="tfl-subject">
                {isText ? (
                  <div key="text" ref={textHost} className="tfl-host" />
                ) : (
                  <div key="css" ref={cssHost} className="tfl-host">
                    <Tag className="text-fill">{s.direction === 'reading' ? <span>{text}</span> : text}</Tag>
                  </div>
                )}
                <Edges start={s.start.edge} end={s.end.edge} />
              </div>
              <div className="tfl-room" />
            </div>
            <div className="tfl-ruler" aria-hidden="true" />
            <div className="tfl-overlay" aria-hidden="true">
              <ViewLine kind="end" p={s.end} />
              <ViewLine kind="start" p={s.start} />
            </div>
          </div>
          <p className="tfl-legend">
            <span><i className="tfl-dot" /> start edge · {s.start.edge}</span>
            <span><i className="tfl-dot is-end" /> end edge · {s.end.edge}</span>
          </p>
        </div>

        <div className="tfl-transport">
          <button type="button" className="tfl-btn" onClick={play}>▶ Play</button>
          <label className="tfl-scrub">
            <span>Scroll · {Math.round(scroll)}px</span>
            <input
              type="range" min={0} max={Math.round(geo?.max ?? 0)} step={1} value={Math.round(clamp(scroll, 0, geo?.max ?? 0))}
              aria-label="Scroll position of the preview"
              onChange={(e) => jump(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="tfl-read">
          <div className="tfl-prog">
            <span className="tfl-k">Progress</span>
            <output className="tfl-num" aria-label="Progress">{shown.toFixed(2)}</output>
            <span className="tfl-bar"><span style={{ transform: `scaleX(${shown})` }} /></span>
            <p className="tfl-status">
              {status}
              {keeps && kept > raw ? ` Kept at ${kept.toFixed(2)}: once holds the furthest point.` : ''}
            </p>
          </div>
          <dl className="tfl-math">
            <div><dt>Starts</dt><dd>when {pairWords(readTrigger(triggerText(s.start)))}</dd></div>
            <div><dt>Done</dt><dd>when {pairWords(readTrigger(triggerText(s.end)))}</dd></div>
            {s.engine === 'css' ? (
              <div><dt>CSS</dt><dd><code>animation-range: {rangeText(s)}</code></dd></div>
            ) : (
              <div><dt>Trigger</dt><dd><code>{`{ start: '${triggerText(s.start)}', end: '${triggerText(s.end)}' }`}</code></dd></div>
            )}
            <div>
              <dt>Contrast</dt>
              <dd>
                unfilled {ratio(cUnfilled)} · filled {ratio(cFilled)}
                <small>{contrastWords(cUnfilled)}</small>
              </dd>
            </div>
            {isText && n != null ? (
              <div>
                <dt>Pieces</dt>
                <dd>
                  {n} {s.split === 'chars' ? 'letters' : s.split}
                  <small>
                    {pops ? 'none has time to fade: they switch on' : `about ${fmtOverlap(overlap(n, s.stagger))} part way at any moment`}
                  </small>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="tfl-controls">
          <fieldset className="tfl-group">
            <legend>Text</legend>
            <label className="tfl-field">
              <span>Text <em aria-hidden="true">· {clean(s.text).length} of {MAX_TEXT}</em></span>
              <textarea
                value={s.text}
                aria-label="Text to fill"
                maxLength={MAX_TEXT}
                rows={3}
                onChange={(e) => update({ text: e.target.value })}
              />
            </label>
            <div className="tfl-field">
              <span>Element</span>
              <Seg label="Element" value={s.tag} options={[{ key: 'p', label: '<p>' }, { key: 'h2', label: '<h2>' }]} onChange={(v) => update({ tag: v as Tag })} />
            </div>
          </fieldset>

          {isText ? (
            <fieldset className="tfl-group">
              <legend>Pieces · scrollText</legend>
              <div className="tfl-field">
                <span>split</span>
                <Seg label="Split" value={s.split} options={SPLITS.map((x) => ({ key: x.key, label: x.key }))} onChange={(v) => update({ split: v as Split })} />
              </div>
              <label className="tfl-field">
                <span>Unfilled opacity · from.opacity {s.dimOpacity.toFixed(2)}</span>
                <input
                  type="range" min={0} max={0.9} step={0.05} value={s.dimOpacity}
                  aria-label="Unfilled opacity"
                  onChange={(e) => update({ dimOpacity: Number(e.target.value) })}
                />
              </label>
              <label className="tfl-field">
                <span>stagger · {s.stagger.toFixed(3)}</span>
                <input
                  type="range" min={0} max={0.2} step={0.005} value={s.stagger}
                  aria-label="Stagger"
                  onChange={(e) => update({ stagger: Number(e.target.value) })}
                />
              </label>
              <button
                type="button"
                className="tfl-btn is-small"
                disabled={n == null || n < 2}
                onClick={() => n != null && update({ stagger: sequentialStagger(n) })}
              >
                One after another{n != null && n > 1 ? ` · ${sequentialStagger(n)}` : ''}
              </button>
            </fieldset>
          ) : (
            <fieldset className="tfl-group">
              <legend>Fill · gradient</legend>
              <div className="tfl-field">
                <span>Direction</span>
                <Seg
                  label="Direction"
                  value={s.direction}
                  options={DIRECTIONS.map((d) => ({ key: d.key, label: d.label }))}
                  onChange={(v) => update({ direction: v as Direction })}
                />
              </div>
              <p className="tfl-help">{DIRECTIONS.find((d) => d.key === s.direction)?.what}</p>
            </fieldset>
          )}

          <fieldset className="tfl-group">
            <legend>Colours</legend>
            <div className="tfl-swatches">
              <Swatch label={isText ? 'Text' : 'Filled'} value={s.full} onChange={(v) => update({ full: v })} />
              {isText ? null : <Swatch label="Unfilled" value={s.dim} onChange={(v) => update({ dim: v })} />}
              <Swatch label="Background" value={s.bg} onChange={(v) => update({ bg: v })} />
            </div>
            <div className="tfl-chips" role="group" aria-label="Colour presets">
              <button type="button" className="tfl-chip" aria-pressed={s.bg === DARK.bg && s.full === DARK.full && (isText || s.dim === DARK.dim)} onClick={() => update(DARK)}>Dark</button>
              <button type="button" className="tfl-chip" aria-pressed={s.bg === LIGHT.bg && s.full === LIGHT.full && (isText || s.dim === LIGHT.dim)} onClick={() => update(LIGHT)}>Light</button>
            </div>
          </fieldset>

          <fieldset className="tfl-group">
            <legend>Scroll range</legend>
            <div className="tfl-chips" role="group" aria-label="Range presets">
              {RANGE_PRESETS.map((p) => (
                <button key={p.label} type="button" className="tfl-chip" aria-pressed={presetOn(p)} onClick={() => update({ start: p.start, end: p.end })}>
                  {p.label}
                </button>
              ))}
            </div>
            <PointField title="Start · unfilled" which="start" p={s.start} onChange={(start) => update({ start })} />
            <PointField title="End · filled" which="end" p={s.end} onChange={(end) => update({ end })} />
          </fieldset>

          <fieldset className="tfl-group">
            <legend>After it fills</legend>
            <Seg
              label="After it fills"
              value={s.engine === 'css' ? 'scrub' : s.once ? 'once' : 'scrub'}
              options={[{ key: 'scrub', label: 'follow the scroll' }, { key: 'once', label: 'stay filled' }]}
              disabled={s.engine === 'css'}
              onChange={(v) => update({ once: v === 'once' })}
            />
            <p className="tfl-help">
              {s.engine === 'css'
                ? 'A CSS scroll timeline always follows the scroll: scrolling back up unfills the text. To keep it filled, use scrollProgress or scrollText.'
                : s.once
                  ? s.engine === 'text'
                    ? 'once: scrollText keeps the furthest progress it has reached (its default).'
                    : 'onProgress keeps the furthest progress in --text-fill, and the CSS reads that instead.'
                  : `Scrolling back up unfills it again${s.engine === 'text' ? ' (once: false; scrollText’s default is true)' : ''}.`}
            </p>
          </fieldset>
        </div>

        <div className="tfl-msgs">
          {s.engine === 'css' && !timelines ? (
            <p className="tfl-warn" role="status">
              This browser has no CSS scroll timelines, so the preview shows what its readers get from this CSS: the
              text filled, from the rule outside <code>@supports</code>. Switch to scrollProgress to fill it here too.
            </p>
          ) : null}
          {isText && reduced ? (
            <p className="tfl-note">
              Your system asks for reduced motion, so scrollText shows the text in full at once, as it does for every
              reader who asks. The two gradient engines change colour without moving anything, and still fill.
            </p>
          ) : null}
          {same ? (
            <p className="tfl-warn" role="status">
              Start and end are the same scroll position, so there is no stretch of scroll to fill the text over. Move
              one of the lines.
            </p>
          ) : null}
          {backwards ? (
            <p className="tfl-warn" role="status">
              End comes before start. scrollProgress and scrollText then run backwards, filled before the text arrives
              and unfilled after; a CSS range whose end comes first has no length, so the text snaps to filled or never
              fills. Swap the two.
            </p>
          ) : null}
          {pops ? (
            <p className="tfl-warn" role="status">
              With {n} pieces, a stagger of {cap.toFixed(3)} or more leaves each piece no time to fade: they switch on
              one by one. Try {sequentialStagger(n ?? 0)} for one after another.
            </p>
          ) : null}
          {cUnfilled < 3 ? (
            <p className="tfl-warn" role="status">
              Unfilled text is {ratio(cUnfilled)} on its background. It is still text a reader may be reading, so it is
              worth keeping at 3:1 or more for large text, 4.5:1 for body text: raise the {isText ? 'opacity' : 'unfilled colour'}.
            </p>
          ) : null}
        </div>
      </div>

      <div className="tfl-code">
        <div className="tfl-tabs" role="tablist" aria-label="Code">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="tfl-tab" onClick={() => setPick(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <CodeBox file={FILE_OF[tab]}>{code}</CodeBox>
        <p className="tfl-hint">
          {s.engine === 'css'
            ? 'No JavaScript. The range is written in vh: on the page, the window is the viewport.'
            : s.engine === 'progress'
              ? `The CSS reads ${fillVar(s)}; main.js writes it. Options at scrollProgress’s defaults are left out.`
              : 'Options at scrollText’s defaults are left out; from is always written, since its default also moves each piece 24px.'}
        </p>
        <ToolExport title={TITLE} filename="text-fill.html" html={html} react={react} />
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

const fmtOverlap = (k: number) => (k >= 10 ? Math.round(k) : k.toFixed(1)).toString();

function contrastWords(c: number): string {
  if (c >= 4.5) return 'unfilled text meets 4.5:1, enough for body text';
  if (c >= 3) return 'unfilled text meets 3:1, enough for large text only';
  return 'unfilled text is under 3:1: hard to read until it fills';
}

function Seg({
  label, value, options, onChange, disabled = false,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <span className="tfl-seg" role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          disabled={disabled}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="tfl-swatch">
      <span>{label}</span>
      <span className="tfl-swatch-in">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code>{value}</code>
      </span>
    </label>
  );
}

function PointField({ title, which, p, onChange }: { title: string; which: string; p: Point; onChange: (p: Point) => void }) {
  return (
    <div className="tfl-point">
      <span className="tfl-point-t">{title} · <code>{`'${triggerText(p)}'`}</code></span>
      <div className="tfl-point-row">
        <label className="tfl-field">
          <span>Text edge</span>
          <select value={p.edge} aria-label={`${which} text edge`} onChange={(e) => onChange({ ...p, edge: e.target.value as Edge })}>
            {EDGES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="tfl-field">
          <span>Viewport line · {p.at}% down</span>
          <input
            type="range" min={0} max={100} step={1} value={p.at}
            aria-label={`${which} viewport line, percent down`}
            onChange={(e) => onChange({ ...p, at: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}

/** Where the trigger's edges are on the text block. */
function Edges({ start, end }: { start: Edge; end: Edge }) {
  const at = (e: Edge) => (e === 'top' ? '0%' : e === 'center' ? '50%' : '100%');
  return (
    <span className="tfl-edges" aria-hidden="true">
      <i className="tfl-dot" style={{ top: at(start) }} />
      <i className="tfl-dot is-end" style={{ top: at(end) }} />
    </span>
  );
}

/**
 * A line across the preview viewport, `p.at` percent down it, labelled in the
 * ruler beside the box so the label never covers the text. The start label
 * sits under its line and the end label over it, unless that would leave the box.
 */
function ViewLine({ kind, p }: { kind: 'start' | 'end'; p: Point }): ReactNode {
  const flip = kind === 'start' ? p.at > 90 : p.at < 10;
  return (
    <span className={`tfl-line is-${kind}${flip ? ' is-flip' : ''}`} style={{ top: `${p.at}%` }}>
      <i>{kind}<br />{p.at}%</i>
    </span>
  );
}
