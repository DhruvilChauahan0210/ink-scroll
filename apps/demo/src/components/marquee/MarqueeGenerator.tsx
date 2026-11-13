'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  DEFAULTS, LIMITS, ROW_PRESETS, SEPARATORS, SLUG, TABS, TRIGGER, cssCode, cssOnlyCode, cssOnlyCss, cssOnlyFile, htmlCode,
  itemsOf, jsCode, jsFile, previewDialect, reactApp, reactCode, scriptCss, shiftAt,
  type Dir, type Engine, type Sep, type Settings, type Tab,
} from './code';

/**
 * The scroll marquee generator. Everything that moves in it is the real thing:
 *
 * - The preview is a small scroll container standing in for the window. With
 *   "scrollAnimate" it runs the library on each row's .shift element with the
 *   scrollContainer option and the trigger the code writes ('top bottom' →
 *   'top top'), so a box's height of scroll moves a row `distance` px. With
 *   "CSS only" it runs the generated view() timeline instead, and no script:
 *   view() measures against the nearest scroll container, which is the box.
 * - The preview's stylesheet is the generated CSS itself, under the preview's
 *   own scope, class prefix and keyframe names. The drift and its pause
 *   control are that CSS in both modes, as they are in the code.
 * - The code is written from the same settings. Under it, the same marquee as
 *   a page that runs on its own (the CSS only tab's, or the script version's),
 *   and the React tab's component as a StackBlitz project.
 *
 * `version` is the library's, from the server page: the CDN URLs pin it.
 */

type Lib = typeof import('svg-scroll-draw');

const REDUCE = '(prefers-reduced-motion: reduce)';
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const reducedNow = () => typeof window !== 'undefined' && window.matchMedia(REDUCE).matches;
const noop = () => () => {};
const supportsTimeline = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

export function MarqueeGenerator({ version }: { version: string }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [engine, setEngine] = useState<Engine>('js');
  const [tab, setTab] = useState<Tab>('html');
  const [lib, setLib] = useState<Lib | null>(null);
  const timeline = useSyncExternalStore(noop, supportsTimeline, () => true);

  const box = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const scrubLabel = useRef<HTMLSpanElement>(null);
  const read = useRef<HTMLSpanElement>(null);
  const readRate = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setRow = (i: number, patch: Partial<Settings['rows'][number]>) =>
    setS((p) => ({ ...p, rows: p.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const setCount = (n: number) =>
    setS((p) => ({ ...p, rows: n <= p.rows.length ? p.rows.slice(0, n) : [...p.rows, ...ROW_PRESETS.slice(p.rows.length, n)] }));

  // A stable, CSS-safe id for this preview's scope and keyframes.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const scopeClass = `mqg-b${id}`;
  const css = useMemo(() => {
    const d = previewDialect(`.site .${scopeClass} `, id);
    return engine === 'js' ? scriptCss(s, d) : cssOnlyCss(s, d);
  }, [s, engine, scopeClass, id]);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => { if (live) setLib(m); }).catch(() => { /* the CSS preview still runs */ });
    return () => { live = false; };
  }, []);

  /** The readout: where the box is scrolled, and where each row really is against where it should be. */
  const readout = useCallback(() => {
    const b = box.current, sec = section.current;
    if (!b || !sec) return;
    const max = b.scrollHeight - b.clientHeight;
    const at = max > 0 ? clamp01(b.scrollTop / max) : 0;
    if (scrub.current) scrub.current.value = String(Math.round(at * 1000));
    if (scrubLabel.current) scrubLabel.current.textContent = `box scroll · ${Math.round(at * 100)}%`;
    if (!read.current) return;
    const rows = [...sec.querySelectorAll<HTMLElement>('.mqz-row')];
    const top = b.getBoundingClientRect().top;
    const V = b.clientHeight;
    read.current.textContent = rows.map((row, i) => {
      const shift = row.querySelector('.mqz-shift');
      const tf = shift ? getComputedStyle(shift).transform : 'none';
      const x = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).m41 : 0;
      const p = clamp01((V - (row.getBoundingClientRect().top - top)) / V);
      return `row ${i + 1} · p ${p.toFixed(2)} · translateX(${minus(Math.round(x))}px)`;
    }).join('   ');
    if (readRate.current) {
      readRate.current.textContent = s.distance > 0
        ? `in this box · one screen = ${V}px of box scroll · each row slides ${s.distance}px over it, ${(s.distance / V).toFixed(2)}px sideways per px scrolled`
        : 'in this box · distance 0: the rows do not follow the scroll';
    }
  }, [s.distance]);

  /** Read after the engine's own frame, so what it wrote is what we read. */
  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => { frame.current = requestAnimationFrame(readout); });
  }, [readout]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Start with the rows in the middle of the box, once: after that the
  // scroll is the reader's. The readout effect below reads it.
  useEffect(() => {
    const b = box.current, sec = section.current;
    if (b && sec) b.scrollTop = sec.offsetTop + (sec.offsetHeight - b.clientHeight) / 2;
  }, []);

  // The library, one scrollAnimate per row, inside the box: rebuilt on every setting.
  useEffect(() => {
    const b = box.current, sec = section.current;
    if (!lib || engine !== 'js' || !b || !sec || s.distance === 0) return;
    const shifts = [...sec.querySelectorAll<HTMLElement>('.mqz-row')].map((row) => {
      const right = row.classList.contains('is-right');
      const [from, to] = right ? [-s.distance, 0] : [0, -s.distance];
      return lib.scrollAnimate(row.querySelector('.mqz-shift')!, {
        props: { transform: [`translateX(${from}px)`, `translateX(${to}px)`] },
        trigger: { start: TRIGGER.start, end: TRIGGER.end },
        easing: 'linear',
        scrollContainer: b,
      });
    });
    schedule();
    return () => shifts.forEach((x) => x.destroy());
  }, [lib, engine, s, schedule]);

  // The CSS-only preview has no instance; read it once its stylesheet is in.
  useEffect(() => { schedule(); }, [engine, css, schedule]);

  function onScrub(v: number) {
    const b = box.current;
    if (b) b.scrollTop = (v / 1000) * (b.scrollHeight - b.clientHeight);
  }

  /** Scroll the box one screen (its own height) up or down. */
  function screen(dir: 1 | -1) {
    const b = box.current;
    if (b) b.scrollBy({ top: dir * b.clientHeight, behavior: reducedNow() ? 'auto' : 'smooth' });
  }

  const code = useMemo(() => {
    switch (tab) {
      case 'html': return htmlCode(s);
      case 'css': return cssCode(s);
      case 'js': return jsCode(s, version);
      case 'react': return reactCode(s);
      case 'only': return cssOnlyCode(s);
    }
  }, [s, tab, version]);
  const cssOnly = tab === 'only';
  const page = useMemo(() => (cssOnly ? cssOnlyFile(s) : jsFile(s, version)), [s, cssOnly, version]);
  const app = useMemo(() => reactApp(s), [s]);
  const file = TABS.find((t) => t.k === tab)?.file ?? '';

  return (
    <div className="mqg">
      <div className="mqg-frame">
        <div className="mqg-controls">
          <Field label={`rows · ${s.rows.length}`}>
            <input
              type="range" min={LIMITS.rows.min} max={LIMITS.rows.max} step={LIMITS.rows.step} value={s.rows.length}
              aria-label="Rows" onChange={(e) => setCount(Number(e.target.value))}
            />
          </Field>
          <Field label={`distance · ${s.distance}px per screen`}>
            <input
              type="range" min={LIMITS.distance.min} max={LIMITS.distance.max} step={LIMITS.distance.step} value={s.distance}
              aria-label="Distance in px per screen of scroll" onChange={(e) => set('distance', Number(e.target.value))}
            />
          </Field>
          <Field label={`text size · ${s.size}px`}>
            <input
              type="range" min={LIMITS.size.min} max={LIMITS.size.max} step={LIMITS.size.step} value={s.size}
              aria-label="Text size in px" onChange={(e) => set('size', Number(e.target.value))}
            />
          </Field>
          <Field label={`gap · ${s.gap}px`}>
            <input
              type="range" min={LIMITS.gap.min} max={LIMITS.gap.max} step={LIMITS.gap.step} value={s.gap}
              aria-label="Gap in px" onChange={(e) => set('gap', Number(e.target.value))}
            />
          </Field>
          <Field label="separator">
            <Seg label="Separator" value={s.sep} options={SEPARATORS} onChange={(v) => set('sep', v as Sep)} />
          </Field>
          <Field label={s.drift ? `drift · a loop every ${s.loop}s` : 'drift · off'} pair>
            <span className={`mqg-pair${s.drift ? '' : ' is-idle'}`}>
              <input
                type="range" min={LIMITS.loop.min} max={LIMITS.loop.max} step={LIMITS.loop.step} value={s.loop}
                aria-label="Seconds per drift loop" disabled={!s.drift} onChange={(e) => set('loop', Number(e.target.value))}
              />
              <Seg label="Drift" value={s.drift ? 'on' : 'off'} options={['on', 'off']} onChange={(v) => set('drift', v === 'on')} />
            </span>
          </Field>
          <Field label="preview with" wide>
            <Seg
              label="Preview with" value={engine === 'js' ? 'scrollAnimate' : 'CSS only'} options={['scrollAnimate', 'CSS only']}
              onChange={(v) => setEngine(v === 'CSS only' ? 'css' : 'js')}
            />
          </Field>
        </div>

        <div className="mqg-rows">
          {s.rows.map((row, i) => (
            <div key={i} className="mqg-rowedit">
              <label className="mqg-rowlabel">
                <span className="mqg-label">row {i + 1} · items, comma separated</span>
                <input
                  type="text" value={row.items} spellCheck={false} maxLength={240}
                  onChange={(e) => setRow(i, { items: e.target.value })}
                />
              </label>
              <Seg
                label={`Row ${i + 1} direction`} value={row.dir === 'left' ? '← left' : 'right →'} options={['← left', 'right →']}
                onChange={(v) => setRow(i, { dir: (v === '← left' ? 'left' : 'right') as Dir })}
              />
            </div>
          ))}
        </div>

        <div className="mqg-stagewrap">
          <style>{css}</style>
          <div
            ref={box}
            className={`mqg-box ${scopeClass}`}
            tabIndex={0}
            role="region"
            aria-label="Preview: scroll inside this box to move the rows sideways"
            onScroll={schedule}
          >
            <div className="mqg-before"><span>↓ scroll inside the box</span></div>
            <section ref={section} className="mqz" aria-label="Preview marquee">
              {s.drift && <label className="mqz-pause"><input type="checkbox" /> Pause motion</label>}
              {s.rows.map((row, r) => (
                <div key={r} className={row.dir === 'right' ? 'mqz-row is-right' : 'mqz-row'}>
                  <div className="mqz-shift">
                    <div className="mqz-track">
                      {[false, true].map((copy) => (
                        <ul key={String(copy)} className="mqz-set" aria-hidden={copy || undefined}>
                          {itemsOf(row).map((item, k) => <li key={k} className="mqz-item">{item}</li>)}
                        </ul>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <div className="mqg-after"><span>the page goes on</span></div>
          </div>
        </div>

        <div className="mqg-transport">
          <button type="button" className="mqg-btn" onClick={() => screen(-1)}>↑ One screen</button>
          <button type="button" className="mqg-btn" onClick={() => screen(1)}>↓ One screen</button>
          <label className="mqg-scrub">
            <span ref={scrubLabel}>box scroll · 0%</span>
            <input type="range" min={0} max={1000} step={1} defaultValue={0} ref={scrub} aria-label="Scroll the preview box" onChange={(e) => onScrub(Number(e.target.value))} />
          </label>
        </div>
        <div className="mqg-read">
          <p><span ref={read}>row 1 · p 0.00</span></p>
          <p><span ref={readRate}>in this box</span></p>
          <p className="mqg-ends">
            {s.rows.map((row, i) => (
              <span key={i}>
                row {i + 1}: translateX({minus(shiftAt(row.dir, s.distance, 0))}px) → ({minus(shiftAt(row.dir, s.distance, 1))}px)
              </span>
            ))}
          </p>
        </div>
        {engine === 'css' && !timeline && s.distance > 0 && (
          <p className="mqg-note" role="status">
            This browser has no scroll timelines, so the CSS-only version only drifts here. Switch to scrollAnimate to see
            the rows follow the scroll.
          </p>
        )}
        {!s.drift && s.distance === 0 && (
          <p className="mqg-warn" role="status">
            Distance 0 and no drift: nothing moves. Turn one of them on.
          </p>
        )}
        <p className="mqg-rm">
          Your system asks for reduced motion, so the preview does what the code does for you: nothing moves, the copy is
          hidden and every item wraps onto the rows, in both versions.
        </p>
      </div>

      <div className="mqg-code">
        <div className="mqg-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className="mqg-tab" onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
        <CodeBox file={file}>{code}</CodeBox>
        <p className="mqg-code-note">
          {tab === 'only'
            ? 'The same HTML, without the script tag. The rows follow the scroll where the browser has scroll timelines; everywhere else they only drift. Nothing moves for readers who ask for less motion.'
            : tab === 'react'
              ? 'Import the CSS tab as marquee.css next to this file. A client component, so it works in the Next.js App Router.'
              : 'Three files: the HTML, the CSS and main.js. The CSS does the drift and the pause; main.js makes the rows follow the scroll, in every browser.'}
        </p>
        <ToolExport
          title={cssOnly ? 'Scroll marquee, CSS only' : 'Scroll marquee'}
          filename={cssOnly ? 'scroll-marquee-css-only.html' : 'scroll-marquee.html'}
          html={page}
          react={cssOnly ? undefined : { slug: SLUG, app: app.app, css: app.css, version }}
        />
      </div>
    </div>
  );
}

function Field({ label, wide, pair, children }: { label: string; wide?: boolean; pair?: boolean; children: ReactNode }) {
  return (
    <div className={`mqg-field${wide ? ' is-wide' : ''}${pair ? ' is-pair' : ''}`}>
      <span className="mqg-label">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="mqg-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}
