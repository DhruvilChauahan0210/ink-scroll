'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { ScrollPinInstance, ScrollPinOptions } from 'svg-scroll-draw/pin';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  PIN_DEFAULTS, PX, SLUG, STEPS_MAX, STEPS_MIN, TOP, VH,
  cssCode, cssOnlyCode, cssOnlyFile, htmlCode, jsCode, jsFile, perStep, previewDistance, reactApp, reactCode,
  stepAt, stepProgress, stepsOf, type DistMode, type PinSettings,
} from './pin-code';

/**
 * The scroll pin generator.
 *
 * - The preview box stands in for the window, and the stage in it is pinned by
 *   scrollPin itself, with `scrollContainer` set to the box. Everything the
 *   readouts show (progress, the state, the callbacks) is what the instance
 *   reports.
 * - scrollContainer only changes whose scroll moves the pin. `top` is still a
 *   distance from the top of the window, and the pinned stage is
 *   `position: fixed`, so the preview passes the box's own top on screen plus
 *   your offset, and makes the pin again whenever the box moves on screen (the
 *   page scrolls, or the layout above it changes). That is what a real page
 *   needs when its scroll container is not at the top of the window.
 * - The frame clips with clip-path, which also clips a fixed descendant, so a
 *   pinned stage never draws outside the box.
 * - The callback log is what the instance fires, with one exception: a pin
 *   made again starts from before, so its first update's callbacks are put
 *   aside and the change from the last state is logged by setState()'s rule.
 * - The code is written from the same settings, leaving out every option at
 *   scrollPin's default.
 */

type Tab = 'html' | 'css' | 'js' | 'react' | 'css-only';
type Pos = 'static' | 'fixed' | 'absolute';
type Entry = { id: number; name: string; at: number; none?: boolean };

const TABS: { key: Tab; label: string; file: string }[] = [
  { key: 'html', label: 'HTML', file: 'tour.html' },
  { key: 'css', label: 'CSS', file: 'tour.css' },
  { key: 'js', label: 'JavaScript', file: 'tour.js' },
  { key: 'react', label: 'React', file: 'FeatureTour.jsx' },
  { key: 'css-only', label: 'CSS only', file: 'tour-css-only.css' },
];
const MODES: { key: DistMode; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'vh', label: 'vh' },
  { key: 'px', label: 'px' },
];
const STATE: Record<Pos, { k: string; d: string }> = {
  static: { k: 'Before', d: 'In the flow, scrolling with the content.' },
  fixed: { k: 'Pinned', d: 'position: fixed under the pin line.' },
  absolute: { k: 'After', d: 'position: absolute at the wrapper’s bottom.' },
};
/**
 * What each change of state fires: setState() in pin/index.ts calls a callback
 * only on a change to or from pinned.
 */
const CROSSING: Record<string, { name: string; none: boolean }> = {
  'static>fixed': { name: 'onEnter', none: false },
  'fixed>absolute': { name: 'onLeave', none: false },
  'absolute>fixed': { name: 'onEnterBack', none: false },
  'fixed>static': { name: 'onLeaveBack', none: false },
  'static>absolute': { name: 'before → after', none: true },
  'absolute>static': { name: 'after → before', none: true },
};
/** The preview box's height in pin.css, until it is measured. */
const VP = 340;
const LOG = 5;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const pad = (n: number) => String(n).padStart(2, '0');

/** Where things sit in the box's scroll content, in px. The box is `v` tall. */
function geometry(v: number, s: PinSettings) {
  const panel = Math.max(120, v - s.top);
  const lead = Math.max(s.top + 40, Math.round(v * 0.45));
  const dist = previewDistance(s, v);
  const start = lead - s.top;
  return { panel, lead, dist, start, end: start + dist, max: lead + panel + dist };
}

export function PinGenerator({ version }: { version: string }) {
  const [s, setS] = useState<PinSettings>(PIN_DEFAULTS);
  const [vp, setVp] = useState(VP);
  const [scroll, setScroll] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pos, setPos] = useState<Pos>('static');
  const [log, setLog] = useState<Entry[]>([]);
  const [tab, setTab] = useState<Tab>('js');
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const seq = useRef(0);
  const lastPos = useRef<Pos>('static');

  const g = geometry(vp, s);
  const n = s.steps;
  const steps = useMemo(() => stepsOf(s), [s]);
  const current = stepAt(progress, n);
  const local = stepProgress(progress, n);

  // The box's real height: the preview's vh are of it.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp(el.clientHeight || VP));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The pin: scrollPin on the stage, watching the box. Made again when the
  // settings change, and whenever the box moves on screen (see the top).
  useEffect(() => {
    const el = stage.current;
    const sc = box.current;
    if (!el || !sc) return;
    let live = true;
    let pinFn: ((t: Element, o: ScrollPinOptions) => ScrollPinInstance) | null = null;
    let inst: ScrollPinInstance | null = null;
    let builtAt = NaN;
    let quiet = false;
    // The state the last instance left, kept across a change of settings.
    const last = lastPos;

    const topOf = () => sc.getBoundingClientRect().top + sc.clientTop;
    const note = (name: string, none = false) => {
      if (quiet) return;
      const entry = { id: ++seq.current, name, at: Math.round(sc.scrollTop), none };
      setLog((l) => [entry, ...l].slice(0, LOG));
    };

    function build() {
      if (!pinFn || !el || !sc) return;
      // Taking the wrapper out shortens the box's content for a moment, which
      // can pull its scroll position back; put it where it was.
      const kept = sc.scrollTop;
      inst?.destroy();
      builtAt = topOf();
      quiet = true;
      inst = pinFn(el, {
        top: builtAt + s.top,
        pinDistance: g.dist,
        scrollContainer: sc,
        onEnter: () => note('onEnter'),
        onLeave: () => note('onLeave'),
        onEnterBack: () => note('onEnterBack'),
        onLeaveBack: () => note('onLeaveBack'),
        onProgress: (p) => {
          setProgress(p);
          const settling = quiet;
          // update() calls onProgress before it changes the state, so the
          // state is read once the update is over.
          queueMicrotask(() => {
            const now = (el.style.position || 'static') as Pos;
            quiet = false;
            if (now !== last.current) {
              const crossed = CROSSING[`${last.current}>${now}`];
              // A jump across the whole pin, which fires none of the four. And
              // the first update of a pin made again: it starts from before, so
              // what it fired is put aside, and the change from the state the
              // last instance left is logged as setState() would have fired it.
              if (crossed.none || settling) note(crossed.name, crossed.none);
            }
            last.current = now;
            setPos(now);
          });
        },
      });
      if (sc.scrollTop !== kept) sc.scrollTop = kept;
    }

    // In the capture phase, so a scroll of the box itself is seen before the
    // instance's own listener: the pin is made again first if the box moved.
    const check = () => {
      if (Math.abs(topOf() - builtAt) < 0.5) return;
      const r = sc.getBoundingClientRect();
      const near = r.bottom > -r.height && r.top < window.innerHeight + r.height;
      if (near || el.style.position === 'fixed') build();
    };
    const ro = new ResizeObserver(check);

    import('svg-scroll-draw/pin').then((m) => {
      if (!live) return;
      pinFn = m.scrollPin;
      build();
      window.addEventListener('scroll', check, { capture: true, passive: true });
      window.addEventListener('resize', check);
      ro.observe(document.documentElement);
    });
    return () => {
      live = false;
      window.removeEventListener('scroll', check, { capture: true });
      window.removeEventListener('resize', check);
      ro.disconnect();
      inst?.destroy();
    };
  }, [s.top, g.dist]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function stop() {
    cancelAnimationFrame(raf.current);
  }

  function jump(y: number) {
    stop();
    const el = box.current;
    if (el) el.scrollTop = clamp(y, 0, g.max);
  }

  /** Scroll the box through the whole pin, as a reader would; one step at a time under reduced motion. */
  function play() {
    stop();
    const el = box.current;
    if (!el) return;
    if (getReduced()) {
      const next = el.scrollTop < g.start ? 0 : (current + 1) % n;
      el.scrollTop = g.start + g.dist * ((next + 0.5) / n);
      return;
    }
    const from = clamp(g.start - g.lead * 0.5, 0, g.max);
    const to = clamp(g.end + g.panel * 0.4, 0, g.max);
    const ms = clamp(2000 + (g.dist / vp) * 700, 2400, 6400);
    el.scrollTop = from;
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / ms);
      el.scrollTop = from + (to - from) * t;
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  const set = (patch: Partial<PinSettings>) => setS((o) => ({ ...o, ...patch }));

  const code = useMemo(() => {
    if (tab === 'html') return htmlCode(s);
    if (tab === 'css') return cssCode(s);
    if (tab === 'react') return reactCode(s);
    if (tab === 'css-only') return cssOnlyCode(s);
    return jsCode(s);
  }, [tab, s]);
  const exportFile = useMemo(
    () => (tab === 'css-only' ? cssOnlyFile(s) : jsFile(s, version)),
    [tab, s, version],
  );
  const app = useMemo(() => reactApp(s), [s]);

  const raw = (scroll - g.start) / g.dist;
  const at = (y: number) => `${clamp((y / g.max) * 100, 0, 100)}%`;
  const state = STATE[pos];
  const value = s.mode === 'vh' ? s.vh : s.px;
  const range = s.mode === 'vh' ? VH : PX;

  return (
    <div className="spn">
      <div className="spn-panel">
        <div className="spn-controls">
          <Field label="Steps while pinned">
            <span className="spn-seg" role="radiogroup" aria-label="Steps while pinned">
              {Array.from({ length: STEPS_MAX - STEPS_MIN + 1 }, (_, i) => i + STEPS_MIN).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={n === k} onClick={() => set({ steps: k })}>
                  {k}
                </button>
              ))}
            </span>
          </Field>

          <Field label={`pinDistance · ${perStep(s)} per step`}>
            <span className="spn-seg" role="radiogroup" aria-label="Pin distance unit">
              {MODES.map((m) => (
                <button key={m.key} type="button" role="radio" aria-checked={s.mode === m.key} onClick={() => set({ mode: m.key })}>
                  {m.label}
                </button>
              ))}
            </span>
            {s.mode === 'default' ? (
              <span className="spn-hint">Left out: one window height (window.innerHeight), read again on resize.</span>
            ) : (
              <span className="spn-range">
                <input
                  type="range" min={range.min} max={range.max} step={range.step} value={value}
                  aria-label={`Pin distance in ${s.mode}`}
                  onChange={(e) => set(s.mode === 'vh' ? { vh: Number(e.target.value) } : { px: Number(e.target.value) })}
                />
                <output className="spn-val">{s.mode === 'vh' ? `'${s.vh}vh'` : s.px}</output>
              </span>
            )}
            <button type="button" className="spn-chip" onClick={() => set({ mode: 'vh', vh: Math.min(VH.max, n * 100) })}>
              100vh per step
            </button>
          </Field>

          <Field label="top · the pin line">
            <span className="spn-range">
              <input
                type="range" min={TOP.min} max={TOP.max} step={TOP.step} value={s.top}
                aria-label="top: how far below the window’s top the stage pins, in px"
                onChange={(e) => set({ top: Number(e.target.value) })}
              />
              <output className="spn-val">{s.top}</output>
            </span>
            <span className="spn-hint">{s.top ? `Pins ${s.top}px down, under a header that tall.` : 'Pins at the very top (the default).'}</span>
          </Field>
        </div>

        <div className="spn-view">
          <p className="spn-k">Window · {vp}px tall · scroll it</p>
          <div className="spn-frame">
            <div
              ref={box}
              className="spn-box"
              tabIndex={0}
              role="region"
              aria-label="Preview window: scroll it to move through the pin"
              onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
              onKeyDown={stop}
            >
              <div className="spn-flow" style={{ height: g.lead }}>
                <span>Content before the pin</span>
                <span>scroll ↓</span>
              </div>
              {/* scrollPin moves the stage into a wrapper inside this div, so
                  the stage is its only child and React never inserts beside it. */}
              <div className="spn-host">
                <div
                  ref={stage}
                  className="spn-stage"
                  style={{ height: g.panel, '--progress': progress } as CSSProperties}
                >
                  <ol className="spn-steps">
                    {steps.map((st, i) => (
                      <li
                        key={st.title}
                        className="spn-step"
                        aria-current={i === current ? 'step' : undefined}
                        style={{ '--draw': i < current ? 1 : i > current ? 0 : local } as CSSProperties}
                      >
                        <svg viewBox="0 0 100 100" aria-hidden="true">
                          <path pathLength={1} d={st.d} />
                        </svg>
                        <div>
                          <span className="spn-step-n">{pad(i + 1)} / {pad(n)}</span>
                          <p className="spn-step-t">{st.title}</p>
                          <p className="spn-step-b">{st.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="spn-stage-foot" aria-hidden="true">
                    <span className="spn-ticks">
                      {steps.map((st, i) => <i key={st.title} data-on={i <= current || undefined} />)}
                    </span>
                    <span className="spn-pbar"><span /></span>
                  </div>
                </div>
              </div>
              <div className="spn-flow is-after" style={{ height: vp }}>
                <span>Content after the pin</span>
              </div>
            </div>
            <div className="spn-overlay" aria-hidden="true">
              {s.top > 0 && <span className="spn-header" style={{ height: s.top }}>header · {s.top}px</span>}
              <span className={`spn-line${s.top < 14 ? ' is-low' : ''}`} style={{ top: s.top }}>
                <i>pin line · top {s.top}</i>
              </span>
            </div>
          </div>
        </div>

        <div className="spn-transport">
          <button type="button" className="spn-btn" onClick={play}>{reduced ? 'Next step' : '▶ Play'}</button>
          {/* A pixel past each end: exactly on one, sub-pixel layout can tip
              the state either way. */}
          <button type="button" className="spn-btn" onClick={() => jump(g.start + 1)}>Pin start</button>
          <button type="button" className="spn-btn" onClick={() => jump(g.end + 1)}>Pin end</button>
          <label className="spn-scrub">
            <span>Scroll · {Math.round(scroll)}px</span>
            <input
              type="range" min={0} max={g.max} step={1} value={Math.round(clamp(scroll, 0, g.max))}
              aria-label="Scroll position of the preview"
              onChange={(e) => jump(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="spn-read">
          <div className="spn-big">
            <div>
              <span className="spn-k">onProgress</span>
              <output className="spn-num" aria-label="Progress">{progress.toFixed(2)}</output>
            </div>
            <div>
              <span className="spn-k">Step</span>
              <output className="spn-num" aria-label="Current step">{current + 1}<small> / {n}</small></output>
            </div>
          </div>
          <span className="spn-bar"><span style={{ transform: `scaleX(${progress})` }} /></span>
          <p className="spn-state"><b>{state.k}</b> · {state.d}</p>

          <div className="spn-track" aria-hidden="true">
            <span className="spn-k">Scroll · 0 to {g.max}px</span>
            <div className="spn-rail">
              <span className="spn-win" style={{ left: at(g.start), width: `calc(${at(g.end)} - ${at(g.start)})` }} />
              {Array.from({ length: n - 1 }, (_, k) => (
                <span key={k} className="spn-cut" style={{ left: at(g.start + (g.dist * (k + 1)) / n) }} />
              ))}
              <Mark left={at(g.start)} label={`start ${g.start}`} />
              <Mark left={at(g.end)} label={`end ${g.end}`} below />
              <span className="spn-now" style={{ left: at(scroll) }} />
            </div>
          </div>

          <div className="spn-log">
            <span className="spn-k">Callbacks · newest first</span>
            {log.length === 0 ? (
              <p className="spn-log-empty">None yet: scroll the box into the pin.</p>
            ) : (
              <ol aria-live="polite">
                {log.map((e) => (
                  <li key={e.id} className={e.none ? 'is-none' : undefined}>
                    <code>{e.name}</code>
                    <span>{e.none ? 'in one frame: none of the four fire' : `at ${e.at}px`}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <dl className="spn-math">
            <div><dt>Window</dt><dd>{vp}px tall: the box. Its vh are of it.</dd></div>
            <div><dt>Wrapper</dt><dd>{g.lead}px down the content, {g.panel} + {g.dist} = {g.panel + g.dist}px tall</dd></div>
            <div><dt>Pin start</dt><dd>{g.lead} − top {s.top} = {g.start}px of scroll</dd></div>
            <div><dt>Pin end</dt><dd>{g.start} + pinDistance {g.dist} = {g.end}px</dd></div>
            <div>
              <dt>Progress</dt>
              <dd>
                ({Math.round(scroll)} − {g.start}) ÷ {g.dist} = {raw.toFixed(2)}
                {raw < 0 || raw > 1 ? `, clamped to ${clamp(raw, 0, 1).toFixed(0)}` : ''}
              </dd>
            </div>
            <div><dt>Step</dt><dd>⌊{progress.toFixed(2)} × {n}⌋ + 1 = {current + 1}, capped at {n}</dd></div>
          </dl>
        </div>

        {reduced && (
          <p className="spn-rm">
            Your system asks for reduced motion: the lines show complete and steps change without a fade, as the
            generated CSS does. Play moves one step at a time.
          </p>
        )}
      </div>

      <div className="spn-code">
        <div className="spn-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="spn-tab" onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <CodeBox file={TABS.find((t) => t.key === tab)?.file ?? 'tour.js'}>{code}</CodeBox>
        <p className="spn-hint">
          {tab === 'css-only'
            ? 'The same markup as the HTML tab, with no aria-current and no script: position: sticky holds the stage, and a view timeline on the tall wrapper changes the steps.'
            : 'The HTML, CSS and JavaScript tabs are one tour. Options at scrollPin’s default are left out.'}
        </p>
        <ToolExport
          title={tab === 'css-only' ? 'Pinned feature tour, CSS only' : 'Pinned feature tour'}
          filename={tab === 'css-only' ? 'scroll-pin-css-only.html' : 'scroll-pin.html'}
          html={exportFile}
          react={tab === 'css-only' ? undefined : { slug: SLUG, app: app.app, css: app.css, version }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="spn-field" role="group" aria-label={label}>
      <span className="spn-field-k">{label}</span>
      {children}
    </div>
  );
}

function Mark({ left, label, below = false }: { left: string; label: string; below?: boolean }) {
  const p = parseFloat(left);
  const align = p < 12 ? ' is-l' : p > 88 ? ' is-r' : '';
  return (
    <span className={`spn-mark${below ? ' is-below' : ''}${align}`} style={{ left }}>
      <i>{label}</i>
    </span>
  );
}
