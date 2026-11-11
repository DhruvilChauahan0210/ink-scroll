'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { EASING_NAMES, NAMED, type EasingName } from '@/data/easing';
import {
  DEFAULTS, LIB, LIMITS, TABS, cssOnlyCss, firstReach, geometry, htmlCode, jsCode, previewDialect, reactCode, scriptCss,
  type Engine, type Settings, type Tab, type Unit,
} from './code';
import { PANEL_NAMES, PanelArt } from './PanelArt';

/**
 * The horizontal scroll section generator. Everything that moves in it is the
 * real thing:
 *
 * - The preview is a small scroll container holding the outer, the sticky
 *   stage and the track. With "scrollHorizontal" it runs the library on the
 *   track with the scrollContainer option, so scrolling inside the box drives
 *   the panels sideways, as the page would. With "CSS only" it runs the
 *   generated scroll-timeline CSS instead, and no script at all.
 * - The preview's stylesheet is the generated CSS itself, with its units mapped
 *   onto the box: vw is the box's width (cqw), 100svh the box's height.
 * - The code is written from the same settings, leaving out every option at
 *   scrollHorizontal's default.
 */

type Lib = typeof import('svg-scroll-draw/horizontal');


const REDUCE = '(prefers-reduced-motion: reduce)';
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const reducedNow = () => typeof window !== 'undefined' && window.matchMedia(REDUCE).matches;

const noop = () => () => {};
const supportsTimeline = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

export function HorizontalGenerator() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [fixedVh, setFixedVh] = useState<number>(LIMITS.vh.def);
  const [engine, setEngine] = useState<Engine>('js');
  const [tab, setTab] = useState<Tab>('html');
  const [lib, setLib] = useState<Lib | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const timeline = useSyncExternalStore(noop, supportsTimeline, () => true);

  const box = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const scrubLabel = useRef<HTMLSpanElement>(null);
  const read = useRef<HTMLSpanElement>(null);
  const readGeo = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  // A stable, CSS-safe id for this preview's scope, keyframes and timeline.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const scopeClass = `hz-b${id}`;
  const css = useMemo(() => {
    const d = previewDialect(`.site .${scopeClass} `);
    return engine === 'js'
      ? scriptCss(s, d)
      : cssOnlyCss(s, d, { slide: `hz-slide${id}`, fill: `hz-fill${id}`, timeline: `--hz-trip${id}` });
  }, [s, engine, scopeClass, id]);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw/horizontal').then((m) => { if (live) setLib(m); }).catch(() => { /* the CSS preview still runs */ });
    return () => { live = false; };
  }, []);

  // The box stands in for the window: its size is what vw and 100svh mean in the preview.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** The readout: where the box is scrolled, what that is as progress, and where the track really is. */
  const readout = useCallback(() => {
    const b = box.current, o = outer.current, st = stage.current, tr = track.current;
    if (!b || !o || !st || !tr) return;
    const max = b.scrollHeight - b.clientHeight;
    const at = max > 0 ? clamp01(b.scrollTop / max) : 0;
    if (scrub.current) scrub.current.value = String(Math.round(at * 1000));
    if (scrubLabel.current) scrubLabel.current.textContent = `box scroll · ${Math.round(at * 100)}%`;
    if (!read.current) return;
    const pinned = getComputedStyle(st).position === 'sticky';
    const travel = Math.max(0, tr.scrollWidth - st.clientWidth);
    const run = o.offsetHeight - b.clientHeight;
    if (readGeo.current) {
      readGeo.current.textContent = pinned
        ? `in this box · stage ${st.clientWidth} × ${st.clientHeight}px · track ${tr.scrollWidth}px · travel ${travel}px over ${Math.max(0, run)}px of scroll · ${run > 0 ? `${(travel / run).toFixed(2)}px sideways per px scrolled` : 'no scroll'}`
        : `in this box · stage ${st.clientWidth}px · track ${tr.scrollWidth}px · the row scrolls sideways on its own`;
    }
    if (!pinned) {
      const room = Math.max(0, st.scrollWidth - st.clientWidth);
      read.current.textContent = `fallback row · scrolled ${Math.round(st.scrollLeft)} of ${Math.round(room)}px sideways`;
      return;
    }
    const tf = getComputedStyle(tr).transform;
    const x = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).m41 : 0;
    const raw = run > 0 ? clamp01((b.scrollTop - o.offsetTop) / run) : 0;
    const eased = NAMED[s.easing](raw);
    read.current.textContent =
      `scroll p ${raw.toFixed(2)} → ${s.easing} ${eased.toFixed(2)} · translateX(${Math.round(x)}px) of −${Math.round(travel)}px`;
  }, [s.easing]);

  /** Read after the engine's own frame, so what it wrote is what we read. */
  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => { frame.current = requestAnimationFrame(readout); });
  }, [readout]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // The library, on the track, inside the box: rebuilt on every setting.
  useEffect(() => {
    const tr = track.current, b = box.current;
    if (!lib || engine !== 'js' || !tr || !b) return;
    const fill = bar.current;
    const strip = lib.scrollHorizontal(tr, {
      scrollContainer: b,
      ...(s.easing !== LIB.easing && { easing: s.easing }),
      onProgress: (p) => { if (fill) fill.style.transform = `scaleX(${p})`; },
    });
    schedule();
    return () => {
      strip.destroy();
      // The bar's transform is ours, not the library's: put it back too.
      if (fill) fill.style.transform = '';
    };
  }, [lib, engine, s, schedule]);

  // The CSS-only preview has no instance; read it once its stylesheet is in.
  useEffect(() => { schedule(); }, [engine, css, size, schedule]);

  /** The box scroll at which panel `el` is in view: the arithmetic the generated focus handler does. */
  const scrollFor = useCallback((el: Element): number | null => {
    const b = box.current, o = outer.current, st = stage.current, tr = track.current;
    const first = tr?.firstElementChild;
    if (!b || !o || !st || !tr || !first) return null;
    const travel = tr.scrollWidth - st.clientWidth;
    const at = el.getBoundingClientRect().left - first.getBoundingClientRect().left;
    const p = travel > 0 ? Math.min(1, at / travel) : 0;
    return o.offsetTop + firstReach(s.easing, p) * (o.offsetHeight - b.clientHeight);
  }, [s.easing]);

  // Tab into a panel (scrollHorizontal only): scroll the box to where the strip shows it.
  // The CSS-only version does this in CSS, with :has(:focus-visible).
  useEffect(() => {
    const tr = track.current;
    if (!tr || engine !== 'js') return;
    const onFocus = (e: FocusEvent) => {
      const panel = (e.target as Element).closest('.hz-panel');
      if (!panel || !stage.current || getComputedStyle(stage.current).position !== 'sticky') return;
      const top = scrollFor(panel);
      if (top !== null) requestAnimationFrame(() => box.current?.scrollTo({ top }));
    };
    tr.addEventListener('focusin', onFocus);
    return () => tr.removeEventListener('focusin', onFocus);
  }, [engine, scrollFor]);

  /** Previous or next panel: scroll the box there, or, in the fallback row, the row. */
  function step(dir: 1 | -1) {
    const b = box.current, st = stage.current, tr = track.current;
    if (!b || !st || !tr) return;
    const behavior: ScrollBehavior = reducedNow() ? 'auto' : 'smooth';
    const panels = [...tr.children];
    const pick = (targets: number[], now: number) =>
      dir > 0 ? targets.find((t) => t > now + 1) : [...targets].reverse().find((t) => t < now - 1);
    if (getComputedStyle(st).position !== 'sticky') {
      const first = panels[0]?.getBoundingClientRect().left ?? 0;
      const lefts = panels.map((p) => p.getBoundingClientRect().left - first);
      const left = pick(lefts, st.scrollLeft);
      if (left !== undefined) st.scrollTo({ left, behavior });
      return;
    }
    const tops = panels.map((p) => scrollFor(p)).filter((t): t is number => t !== null);
    const top = pick(tops, b.scrollTop);
    if (top !== undefined) b.scrollTo({ top, behavior });
  }

  function onScrub(v: number) {
    const b = box.current;
    if (b) b.scrollTop = (v / 1000) * (b.scrollHeight - b.clientHeight);
  }

  const geo = size.w > 0 ? geometry(s, size.w, size.h) : null;
  const code = useMemo(() => {
    switch (tab) {
      case 'html': return htmlCode(s);
      case 'css': return scriptCss(s);
      case 'js': return jsCode(s);
      case 'react': return reactCode(s);
      case 'only': return cssOnlyCss(s);
    }
  }, [s, tab]);
  const file = TABS.find((t) => t.k === tab)?.file ?? '';
  const limits = LIMITS[s.unit];
  const lengthLabel = s.length === 'match' ? '1:1 with the travel' : `${s.length}vh`;

  function setUnit(u: Unit) {
    if (u === s.unit) return;
    setS((p) => ({ ...p, unit: u, width: LIMITS[u].def }));
  }

  return (
    <div className="hz">
      <div className="hz-frame">
        <div className="hz-controls">
          <Field label={`panels · ${s.panels}`}>
            <input
              type="range" min={LIMITS.panels.min} max={LIMITS.panels.max} step={LIMITS.panels.step} value={s.panels}
              aria-label="Panels" onChange={(e) => set('panels', Number(e.target.value))}
            />
          </Field>
          <Field label={`gap · ${s.gap}px`}>
            <input
              type="range" min={LIMITS.gap.min} max={LIMITS.gap.max} step={LIMITS.gap.step} value={s.gap}
              aria-label="Gap in px" onChange={(e) => set('gap', Number(e.target.value))}
            />
          </Field>
          <Field label={`panel width · ${s.width}${s.unit}`} pair>
            <span className="hz-pair">
              <input
                type="range" min={limits.min} max={limits.max} step={limits.step} value={s.width}
                aria-label={`Panel width in ${s.unit}`} onChange={(e) => set('width', Number(e.target.value))}
              />
              <Seg label="Panel width unit" value={s.unit} options={['vw', 'px']} onChange={(v) => setUnit(v as Unit)} />
            </span>
          </Field>
          <Field label={`scroll length · ${lengthLabel}`} pair>
            <span className={`hz-pair${s.length === 'match' ? ' is-idle' : ''}`}>
              <input
                type="range" min={LIMITS.vh.min} max={LIMITS.vh.max} step={LIMITS.vh.step}
                value={s.length === 'match' ? fixedVh : s.length}
                aria-label="Scroll length in vh"
                onChange={(e) => { const v = Number(e.target.value); setFixedVh(v); set('length', v); }}
              />
              <Seg
                label="Scroll length mode" value={s.length === 'match' ? '1:1' : 'fixed'} options={['1:1', 'fixed']}
                onChange={(v) => set('length', v === '1:1' ? 'match' : fixedVh)}
              />
            </span>
          </Field>
          <Field label="easing">
            <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value as EasingName)}>
              {EASING_NAMES.map((n) => <option key={n} value={n}>{n}{n === LIB.easing ? ' (default)' : ''}</option>)}
            </select>
          </Field>
          <Field label="progress bar">
            <Seg label="Progress bar" value={s.bar ? 'on' : 'off'} options={['on', 'off']} onChange={(v) => set('bar', v === 'on')} />
          </Field>
          <Field label="preview with" wide>
            <Seg
              label="Preview with" value={engine === 'js' ? 'scrollHorizontal' : 'CSS only'} options={['scrollHorizontal', 'CSS only']}
              onChange={(v) => setEngine(v === 'CSS only' ? 'css' : 'js')}
            />
          </Field>
        </div>

        <div className="hz-stagewrap">
          <style>{css}</style>
          <div
            ref={box}
            className={`hz-box ${scopeClass}`}
            tabIndex={0}
            role="region"
            aria-label="Preview: scroll inside this box to move the panels sideways"
            onScroll={schedule}
          >
            <div className="hz-before"><span>↓ scroll inside the box</span></div>
            <section ref={outer} className={`hz-outer${engine === 'js' ? ' is-pinned' : ''}`} aria-label="Preview panels">
              <div ref={stage} className="hz-stage" onScroll={schedule}>
                <ul ref={track} className="hz-track">
                  {Array.from({ length: s.panels }, (_, i) => (
                    <li key={i} className="hz-panel" tabIndex={0} aria-label={`Panel ${i + 1} of ${s.panels}: ${PANEL_NAMES[i]}`}>
                      <span className="hz-panel-h"><b>{String(i + 1).padStart(2, '0')}</b><span>{PANEL_NAMES[i]}</span></span>
                      <PanelArt i={i} />
                    </li>
                  ))}
                </ul>
                {s.bar && <div className="hz-bar" aria-hidden="true"><span ref={bar} /></div>}
              </div>
            </section>
            <div className="hz-after"><span>the page goes on</span></div>
          </div>
        </div>

        <div className="hz-transport">
          <button type="button" className="hz-btn" onClick={() => step(-1)}>← Previous</button>
          <button type="button" className="hz-btn" onClick={() => step(1)}>Next →</button>
          <label className="hz-scrub">
            <span ref={scrubLabel}>box scroll · 0%</span>
            <input type="range" min={0} max={1000} step={1} defaultValue={0} ref={scrub} aria-label="Scroll the preview box" onChange={(e) => onScrub(Number(e.target.value))} />
          </label>
        </div>
        <div className="hz-read">
          <p><span ref={read}>scroll p 0.00</span></p>
          <p><span ref={readGeo}>in this box</span></p>
        </div>
        {geo && geo.travel === 0 && (
          <p className="hz-warn" role="status">
            The panels fit inside the stage, so there is nothing to scroll sideways. Add panels or make them wider.
          </p>
        )}
        {engine === 'css' && !timeline && (
          <p className="hz-note" role="status">
            This browser has no scroll timelines, so the CSS-only version shows its fallback: a row you scroll sideways.
            Every panel stays in reach.
          </p>
        )}
        <p className="hz-rm">
          Your system asks for reduced motion. scrollHorizontal keeps the scrub anyway (<code>respectReducedMotion</code>{' '}
          is <code>false</code> by default): it moves only as you scroll. The CSS-only version shows its fallback row
          instead.
        </p>
      </div>

      <div className="hz-code">
        <div className="hz-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className="hz-tab" onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
        <CodeBox file={file}>{code}</CodeBox>
        <p className="hz-code-note">
          {tab === 'only'
            ? 'The same HTML, without the script tag. It pins and moves only where the browser has scroll timelines and the reader has not asked for less motion; everywhere else it is a row you scroll sideways.'
            : tab === 'react'
              ? 'Import the CSS tab as horizontal-scroll.css next to this file. A client component, so it works in the Next.js App Router.'
              : 'Three files: the HTML, the CSS and main.js. Without the script the section is a row you scroll sideways; with it, it pins and moves as the page scrolls.'}
        </p>
      </div>
    </div>
  );
}

function Field({ label, wide, pair, children }: { label: string; wide?: boolean; pair?: boolean; children: ReactNode }) {
  return (
    <div className={`hz-field${wide ? ' is-wide' : ''}${pair ? ' is-pair' : ''}`}>
      <span className="hz-label">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="hz-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}
