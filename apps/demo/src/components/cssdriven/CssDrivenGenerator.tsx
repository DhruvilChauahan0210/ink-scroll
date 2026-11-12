'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  CLIP_FROMS, EASE_FN, EASING_KEYS, PRESETS, RANGE_NAMES, RANGE_PICKS, presetOf,
  type ClipFrom, type EasingKey, type PresetKey, type RangeEdge, type RangeName,
} from '@/data/cssdriven';
import {
  cssCode, easingOf, fallbackCode, jsCode, kindOf, libOptions, nativeVerdict, previewCss,
  rangeScroll, rangeText, reactCode, runnable, type Settings,
} from './code';

/**
 * The CSS scroll-driven animation generator. Everything in the preview is the
 * output itself:
 *
 * - In CSS mode the box runs the generated stylesheet (scoped to the preview),
 *   so each card's animation is the browser's own view() timeline on the box,
 *   the nearest scroller. The progress figures are read back from the browser
 *   (getAnimations()), not computed.
 * - In svg-scroll-draw mode the same settings run through scrollAnimate,
 *   scrollDraw or scrollProgress with the box as their scrollContainer, which
 *   is the library's JS engine (a scroll container keeps it off the native
 *   path). Browsers without scroll timelines get this mode.
 * - The track beside the box draws where each card's range falls on the box's
 *   scroll (rangeScroll in ./code), with a line for where the box is now.
 *
 * The preview's elements are made here by hand, never rendered by React, so
 * nothing the engines write to them survives a rebuild.
 *
 * Under the code, the export row runs the tab on show outside the site: the
 * CSS as a page, or the library's call with svg-scroll-draw from jsDelivr at
 * `version` (SELF.version, passed down by the page), and the React component
 * as a project.
 */

type Engine = 'css' | 'js';
type Instance = { destroy: () => void; getProgress: () => number };
type Geom = { max: number; rows: { s0: number; s1: number }[] };

const INITIAL: Settings = {
  preset: 'fade-up',
  amount: 40,
  clip: 'left',
  easing: 'ease-out',
  start: { name: 'entry', pct: 0 },
  end: { name: 'cover', pct: 50 },
  dir: 'in',
  fallback: 'none',
};
const CARDS = 3;
const ARTICLE_LINES = [92, 100, 84, 96, 70, 0, 100, 88, 94, 60, 0, 98, 90, 100, 76, 0, 86, 100, 92, 54];
const THROUGH_MS = 3200;
let runs = 0;

// ── Browser facts, read without setting state in an effect ──────────────────

const never = () => () => {};
function useSupports(query: string): boolean | null {
  return useSyncExternalStore(
    never,
    () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports(query),
    () => null,
  );
}

const REDUCE = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia(REDUCE);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}
function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCE).matches, () => false);
}

function make(tag: string, cls: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  return el;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = EASE_FN['ease-in-out'];

export function CssDrivenGenerator({ version }: { version: string }) {
  const [s, setS] = useState<Settings>(INITIAL);
  const [tab, setTab] = useState<'css' | 'js' | 'react'>('css');
  const [choice, setChoice] = useState<Engine | null>(null);
  const [geom, setGeom] = useState<Geom | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const valuesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const scrubRef = useRef<HTMLInputElement>(null);
  const scrubLabelRef = useRef<HTMLSpanElement>(null);
  const tween = useRef(0);

  const viewOk = useSupports('animation-timeline: view()');
  const scrollOk = useSupports('animation-timeline: scroll()');
  const reduced = useReducedMotion();
  const kind = kindOf(s);
  const preset = presetOf(s.preset);
  const cssOk = kind === 'scroll' ? scrollOk : viewOk;
  // Unknown until hydrated; then CSS where the browser has it, unless the reader picked the library.
  const engine: Engine | null = cssOk === null ? null : cssOk ? (choice ?? 'css') : 'js';

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setEdge = (which: 'start' | 'end', patch: Partial<RangeEdge>) =>
    setS((p) => ({ ...p, [which]: { ...p[which], ...patch } }));

  function pickPreset(key: PresetKey) {
    const next = presetOf(key);
    setS((p) => ({ ...p, preset: key, amount: next.amount?.def ?? p.amount }));
  }

  // ── The preview: build it, run it, read it back ──────────────────────────
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !engine) return;
    const id = ++runs;
    const scope = `cssd-run-${id}`;
    const k = kindOf(s);
    const wrap = make('div', `cssd-content ${scope}${k === 'scroll' ? ' is-page' : ''}`);
    const subjects: HTMLElement[] = [];

    if (k === 'scroll') {
      const bar = make('div', 'cssd-bar');
      wrap.append(bar);
      subjects.push(bar);
      const article = make('div', 'cssd-article');
      article.append(make('span', 'cssd-article-k', 'an article · scroll inside this box ↓'));
      for (const w of ARTICLE_LINES) {
        const line = make('span', w ? 'cssd-line' : 'cssd-line is-break');
        if (w) line.style.width = `${w}%`;
        article.append(line);
      }
      wrap.append(article);
    } else {
      wrap.append(make('div', 'cssd-gap', 'scroll inside this box ↓'));
      for (let i = 0; i < CARDS; i++) {
        const card = make('div', `cssd-subj${k === 'clip' ? ' is-solid' : ''}`);
        const top = make('span', 'cssd-subj-top');
        top.append(make('span', '', String(i + 1).padStart(2, '0')), make('span', '', k === 'clip' ? 'clip-path' : 'view()'));
        card.append(top, make('span', 'cssd-subj-l'), make('span', 'cssd-subj-l is-short'));
        wrap.append(card);
        subjects.push(card);
      }
      wrap.append(make('div', 'cssd-gap is-end', 'the end of the box'));
    }

    if (engine === 'css') {
      const style = document.createElement('style');
      style.textContent = previewCss(s, `.${scope}`, `cssd-k-${id}`);
      wrap.prepend(style);
    }

    const keep = box.scrollTop;
    box.replaceChildren(wrap);
    box.scrollTop = keep;

    let live = true;
    let insts: Instance[] = [];
    let geo: Geom = { max: 1, rows: [] };
    let frame = 0;
    // A few frames of reading after each scroll: the JS engine paints on a frame
    // of its own after the scroll moves (scrollDraw and scrollProgress wake from
    // an IntersectionObserver, which reports after the frame that moved it).
    let settle = 0;
    const ease = EASE_FN[easingOf(s)];

    /** Each subject's progress as its engine reports it: the browser's own timing, or the instance's. */
    function progressOf(i: number): number | null {
      if (engine === 'js') return insts[i]?.getProgress() ?? null;
      const p = subjects[i].getAnimations()[0]?.effect?.getComputedTiming().progress;
      return typeof p === 'number' ? ease(p) : null;
    }

    function readout() {
      frame = 0;
      if (!live || !box) return;
      if (settle > 0) { settle--; frame = requestAnimationFrame(readout); }
      const max = Math.max(1, box.scrollHeight - box.clientHeight);
      const at = clamp01(box.scrollTop / max);
      if (headRef.current) headRef.current.style.top = `${at * 100}%`;
      if (scrubRef.current) scrubRef.current.value = String(Math.round(at * 1000));
      if (scrubLabelRef.current) scrubLabelRef.current.textContent = `box scroll · ${Math.round(at * 100)}%`;
      subjects.forEach((_, i) => {
        const out = valuesRef.current[i];
        if (!out) return;
        const p = progressOf(i);
        // Under reduced motion the CSS is off: no animation, the card as written.
        out.textContent = p !== null ? p.toFixed(2) : window.matchMedia(REDUCE).matches ? 'off' : '—';
      });
    }
    // After the engines' own frame, so the instance has written what we read.
    const schedule = () => {
      settle = 12;
      if (!frame) frame = requestAnimationFrame(readout);
    };

    function measure() {
      if (!live || !box) return;
      const H = box.clientHeight;
      const max = Math.max(1, box.scrollHeight - H);
      const rows = k === 'scroll'
        ? [{ s0: 0, s1: max }]
        : subjects.map((el) => ({
          s0: rangeScroll(s.start, el.offsetTop, el.offsetHeight, H),
          s1: rangeScroll(s.end, el.offsetTop, el.offsetHeight, H),
        }));
      const same = rows.length === geo.rows.length && max === geo.max &&
        rows.every((r, i) => Math.abs(r.s0 - geo.rows[i].s0) < 0.5 && Math.abs(r.s1 - geo.rows[i].s1) < 0.5);
      if (!same) {
        geo = { max, rows };
        setGeom(geo);
      }
      schedule();
    }

    if (engine === 'js') {
      const o = libOptions(s);
      const loaded = k === 'scroll'
        ? import('svg-scroll-draw/progress').then(({ scrollProgress }) => [
          scrollProgress(wrap, { scrollContainer: box, trigger: o.trigger }),
        ])
        : import('svg-scroll-draw').then(({ scrollAnimate, scrollDraw }) => subjects.map((el) => (k === 'clip'
          ? scrollDraw(el, { clip: o.clip, trigger: o.trigger, easing: o.easing, direction: o.direction, scrollContainer: box })
          : scrollAnimate(el, { props: o.props, trigger: o.trigger, easing: o.easing, scrollContainer: box }))));
      loaded.then((made) => {
        if (!live) { made.forEach((m) => m.destroy()); return; }
        insts = made;
        schedule();
      });
    }

    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(wrap);
    box.addEventListener('scroll', schedule, { passive: true });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      box.removeEventListener('scroll', schedule);
      insts.forEach((m) => m.destroy());
      wrap.remove();
    };
  }, [s, engine]);

  // Stop a running "scroll through" when the reader takes over, or on unmount.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const stop = () => cancelAnimationFrame(tween.current);
    const opts = { passive: true } as const;
    box.addEventListener('wheel', stop, opts);
    box.addEventListener('touchstart', stop, opts);
    box.addEventListener('pointerdown', stop, opts);
    box.addEventListener('keydown', stop);
    return () => {
      stop();
      box.removeEventListener('wheel', stop);
      box.removeEventListener('touchstart', stop);
      box.removeEventListener('pointerdown', stop);
      box.removeEventListener('keydown', stop);
    };
  }, []);

  /** Scroll the box from the top to the bottom, or jump there under reduced motion. */
  function scrollThrough() {
    const box = boxRef.current;
    if (!box) return;
    cancelAnimationFrame(tween.current);
    const max = box.scrollHeight - box.clientHeight;
    if (reduced) {
      box.scrollTop = box.scrollTop >= max - 1 ? 0 : max;
      return;
    }
    box.scrollTop = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / THROUGH_MS);
      box.scrollTop = easeInOut(p) * max;
      if (p < 1) tween.current = requestAnimationFrame(tick);
    };
    tween.current = requestAnimationFrame(tick);
  }

  function scrub(v: number) {
    const box = boxRef.current;
    if (!box) return;
    cancelAnimationFrame(tween.current);
    box.scrollTop = (v / 1000) * (box.scrollHeight - box.clientHeight);
  }

  const verdict = useMemo(() => nativeVerdict(s), [s]);
  const code = useMemo(() => ({
    css: cssCode(s),
    fallback: s.fallback === 'library' ? fallbackCode(s) : '',
    js: jsCode(s),
    react: reactCode(s),
  }), [s]);
  const out = useMemo(() => runnable(s, tab, version), [s, tab, version]);
  const backwards = geom !== null && kind !== 'scroll' && geom.rows.some((r) => r.s1 <= r.s0);
  const lanes = geom?.rows ?? [];

  return (
    <div className="cssd">
      <p className={`cssd-support${cssOk === false ? ' is-off' : ''}`} role="status">
        {cssOk === null && 'Checking your browser for scroll timelines…'}
        {cssOk === true && (
          <>Your browser supports <code>animation-timeline: {kind === 'scroll' ? 'scroll()' : 'view()'}</code>: the preview is the CSS below, running.</>
        )}
        {cssOk === false && (
          <>
            Your browser does not support <code>animation-timeline: {kind === 'scroll' ? 'scroll()' : 'view()'}</code>, so
            the CSS on its own would leave these elements still. The preview runs the same animation on svg-scroll-draw’s
            JS engine instead: the fallback the CSS tab can add.
          </>
        )}
      </p>

      <div className="cssd-panel">
        <div className="cssd-controls">
          <Field label="preset">
            <select name="preset" value={s.preset} aria-label="Preset" onChange={(e) => pickPreset(e.target.value as PresetKey)}>
              {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>
          {preset.amount && (
            <Field label={`${preset.amount.label} · ${s.amount}${preset.amount.unit}`}>
              <input
                name="amount" type="range" min={preset.amount.min} max={preset.amount.max} step={preset.amount.step} value={s.amount}
                aria-label={preset.amount.label} onChange={(e) => set('amount', Number(e.target.value))}
              />
            </Field>
          )}
          <Field label="easing">
            <select
              name="easing" value={easingOf(s)} aria-label="Easing" disabled={kind === 'scroll'}
              onChange={(e) => set('easing', e.target.value as EasingKey)}
            >
              {EASING_KEYS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          {kind !== 'scroll' && (
            <Field label="plays" group>
              <Seg value={s.dir} options={['in', 'out']} onChange={(v) => set('dir', v as 'in' | 'out')} label="Plays" />
            </Field>
          )}
          <Field label="fallback" group>
            <Seg
              value={s.fallback} options={['none', 'library']}
              onChange={(v) => set('fallback', v as 'none' | 'library')} label="Fallback for browsers without support"
            />
          </Field>
          {kind === 'clip' && (
            <Field label="from" wide group>
              <Seg value={s.clip} options={CLIP_FROMS} onChange={(v) => set('clip', v as ClipFrom)} label="Reveal from" />
            </Field>
          )}

          {kind === 'scroll' ? (
            <p className="cssd-hint is-wide">
              <code>scroll()</code> has no entry or exit: the bar runs from the top of its scroller to the bottom, linear,
              so it says exactly how far down you are.
            </p>
          ) : (
            <div className="cssd-range is-wide">
              <div className="cssd-picks" role="group" aria-label="Range presets">
                {RANGE_PICKS.map((r) => {
                  const on = r.start.name === s.start.name && r.start.pct === s.start.pct &&
                    r.end.name === s.end.name && r.end.pct === s.end.pct;
                  return (
                    <button
                      key={r.label} type="button" aria-pressed={on}
                      onClick={() => setS((p) => ({ ...p, start: r.start, end: r.end, dir: r.dir }))}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
              <Edge label="range start" edge={s.start} onChange={(patch) => setEdge('start', patch)} />
              <Edge label="range end" edge={s.end} onChange={(patch) => setEdge('end', patch)} />
              {backwards && (
                <p className="cssd-hint">
                  The end is at or before the start for these cards, so CSS has no stretch to animate over and jumps
                  from the first keyframe to the last, while svg-scroll-draw’s trigger window runs backwards.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="cssd-stage">
          <div className="cssd-frame">
            <div ref={boxRef} className="cssd-box" tabIndex={0} role="region" aria-label="Preview: scroll inside this box" />
          </div>
          <div className="cssd-track" aria-hidden="true">
            <div className="cssd-track-k">{lanes.map((_, i) => <span key={i}>{kind === 'scroll' ? 'bar' : String(i + 1).padStart(2, '0')}</span>)}</div>
            <div className="cssd-track-body">
              {lanes.map((r, i) => {
                const a = clamp01(Math.min(r.s0, r.s1) / (geom?.max ?? 1));
                const b = clamp01(Math.max(r.s0, r.s1) / (geom?.max ?? 1));
                return (
                  <span key={i} className="cssd-lane">
                    <i style={{ top: `${a * 100}%`, height: `${(b - a) * 100}%` }} />
                  </span>
                );
              })}
              <span ref={headRef} className="cssd-head" />
            </div>
            <div className="cssd-track-v">
              {lanes.map((_, i) => <span key={i} ref={(el) => { valuesRef.current[i] = el; }} />)}
            </div>
          </div>
        </div>

        <div className="cssd-transport">
          <Seg
            value={engine ?? 'css'} options={['css', 'js']}
            labels={{ css: 'CSS', js: 'svg-scroll-draw' }} disabled={cssOk === false ? ['css'] : []}
            onChange={(v) => setChoice(v as Engine)} label="Preview engine"
          />
          <button type="button" className="cssd-btn" onClick={scrollThrough}>↓ Scroll through</button>
          <label className="cssd-scrub">
            <span ref={scrubLabelRef}>box scroll · 0%</span>
            <input
              ref={scrubRef} name="box-scroll" type="range" min={0} max={1000} step={1} defaultValue={0}
              aria-label="Scroll position of the preview box" onChange={(e) => scrub(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="cssd-note">
          {engine === 'js'
            ? 'svg-scroll-draw mode: the same settings through the library, with this box as its scrollContainer, which runs its JS engine.'
            : `CSS mode: ${kind === 'scroll' ? 'the bar runs a scroll() timeline on this box' : 'each card runs its own view() timeline on this box, its nearest scroller'}. The figures are ${kind === 'scroll' ? 'its' : 'each card’s'} progress as the browser reports it, through the same easing.`}{' '}
          The bars beside the box are where each {kind === 'scroll' ? 'animation' : 'card’s range'} falls on the box’s scroll; the line is where it is now.
          {reduced && kind !== 'scroll' && (engine === 'js'
            ? ` Your system asks for reduced motion, so svg-scroll-draw does not animate: ${kind === 'clip' ? 'it shows each card in full' : `it sets each card’s end values${s.dir === 'out' ? ', which hides them' : ''}`}.`
            : ' Your system asks for reduced motion, so the CSS here is off, as it is in the code, and each card shows unanimated.')}
        </p>
      </div>

      <div className="cssd-code">
        <div className="cssd-tabs" role="tablist" aria-label="Code">
          {(['css', 'js', 'react'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="cssd-tab" onClick={() => setTab(t)}>
              {t === 'css' ? 'CSS' : t === 'js' ? 'JavaScript' : 'React'}
            </button>
          ))}
        </div>
        <div className="cssd-files">
          {tab === 'css' && <CodeBox file="styles.css">{code.css}</CodeBox>}
          {tab === 'css' && code.fallback && <CodeBox file="fallback.js">{code.fallback}</CodeBox>}
          {tab === 'js' && <CodeBox file="main.js">{code.js}</CodeBox>}
          {tab === 'react' && <CodeBox file={kind === 'scroll' ? 'ReadingProgress.tsx' : 'Reveal.tsx'}>{code.react}</CodeBox>}
        </div>
        <ToolExport title={out.title} filename={out.filename} html={out.html} react={out.react} />
      </div>

      <div className={`cssd-verdict${verdict.native ? ' is-native' : ''}`}>
        <p className="cssd-verdict-k">
          svg-scroll-draw · {verdict.native ? 'writes this same CSS itself' : 'runs this on its JS engine'}
        </p>
        <p className="cssd-verdict-d">{verdict.why}</p>
        {kind !== 'scroll' && <p className="cssd-verdict-d">This range, as written: <code>animation-range: {rangeText(s)}</code>.</p>}
      </div>
    </div>
  );
}

/** A labelled control. A group of buttons gets a plain box: a <label> would hand its clicks to the first button. */
function Field({ label, wide, group, children }: { label: string; wide?: boolean; group?: boolean; children: ReactNode }) {
  const cls = `cssd-field${wide ? ' is-wide' : ''}`;
  if (group) {
    return (
      <div className={cls}>
        <span aria-hidden="true">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className={cls}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Edge({ label, edge, onChange }: { label: string; edge: RangeEdge; onChange: (patch: Partial<RangeEdge>) => void }) {
  return (
    <div className="cssd-edge">
      <span className="cssd-edge-k">{label}</span>
      <select name={`${label}-name`.replace(/ /g, '-')} value={edge.name} aria-label={`${label}: named range`} onChange={(e) => onChange({ name: e.target.value as RangeName })}>
        {RANGE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <input
        name={`${label}-pct`.replace(/ /g, '-')} type="range" min={0} max={100} step={5} value={edge.pct}
        aria-label={`${label}: percentage`} onChange={(e) => onChange({ pct: Number(e.target.value) })}
      />
      <span className="cssd-edge-v">{edge.pct}%</span>
    </div>
  );
}

function Seg({ value, options, labels, disabled = [], onChange, label }: {
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  disabled?: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <span className="cssd-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o} type="button" role="radio" aria-checked={value === o} disabled={disabled.includes(o)}
          onClick={() => onChange(o)}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </span>
  );
}
