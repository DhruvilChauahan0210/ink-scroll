'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ScrollCounterOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  COUNTER_DECIMALS, COUNTER_EASINGS, COUNTER_EXAMPLES, COUNTER_INITIAL, COUNTER_LOCALES, COUNTER_TRIGGERS,
  AFFIX_MAX, cleanAffix, parseNumber, type CounterEasing, type CounterLocale, type CounterSettings, type CounterTrigger,
} from '@/data/counter';
import { TITLE, jsCode, reactCode, reactProject, resolve, runnableHtml, triggerOf, type Resolved } from './code';

/**
 * The animated counter generator. Everything it shows is scrollCounter itself:
 *
 * - The preview is a scrollCounter instance driven by seek(). seek(p) writes
 *   from + (to − from) × p as given, with no easing and p clamped to 0..1
 *   (seek() in counter/index.ts), so the preview applies the easing itself, as
 *   update() does on scroll. The slider is the reader's scroll on the way
 *   down, so `once` does not change it: since 2.23.3 `once` holds the furthest
 *   scroll progress and eases after it, which only shows when the reader
 *   scrolls back up (2.23.2 and earlier held the highest eased value, so
 *   spring and elastic stopped on their overshoot; curveNote says so).
 *   Play runs that as a steady scroll through the window; the slider sets it.
 * - The cards below are scrollCounter instances with no seek(), as a page
 *   would run them: they count as they cross their window.
 * - The code (./code.ts) is generated from the same state, leaving out every
 *   option that is at the counter's default, and so is the page under
 *   "Run it", which runs that code from jsDelivr.
 *
 * scrollCounter rewrites its element's text, so every element it runs on is
 * one React renders empty and never fills.
 */

type Lib = typeof import('svg-scroll-draw');
type Instance = ReturnType<Lib['scrollCounter']>;
type Ease = (t: number) => number;

const PLAY_MS = 1600;
const SAMPLES = 2000;
const NUM_MAX = 16;

// ── Reduced motion, read as React state ──────────────────────────────────────

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

// ── The easings ──────────────────────────────────────────────────────────────

/**
 * The named easings, as the counter resolves them. The first four are
 * EASINGS in core/easing.ts, which the package does not export; the other
 * three are the exported factories at their defaults, which is what the named
 * ones are (EASINGS.spring is createSpring's formula at tension 2.5, friction
 * 2.2). If EASINGS changes, change this.
 */
function easingsOf(lib: Lib): Record<CounterEasing, Ease> {
  return {
    linear: (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    spring: lib.createSpring(),
    bounce: lib.createBounce(),
    elastic: lib.createElastic(),
  };
}

/**
 * One steady pass through the window: the highest the eased value gets (above
 * 1 for spring and elastic), and the lowest it falls back to after it first
 * reaches 1 (bounce drops back to 0.5).
 */
function curveOf(ease: Ease) {
  let top = 1;
  let dip = 1;
  let reached = false;
  for (let i = 0; i <= SAMPLES; i++) {
    const v = ease(i / SAMPLES);
    top = Math.max(top, v);
    if (v >= 1 - 1e-3) reached = true;
    if (reached) dip = Math.min(dip, v);
  }
  // The samples fall either side of bounce's trough at 0.5: 625,001 for 625,000.
  return { top, dip: Math.round(dip * 1000) / 1000 };
}

// ── Settings → options ───────────────────────────────────────────────────────

/** The number at eased progress e. */
const valueAt = (r: Resolved, e: number) => r.from + (r.to - r.from) * e;

/**
 * The widest text the count shows on its way, so the space for it is held
 * from the start and nothing moves while it counts: compact notation is wider
 * half way (999.9K) than at either end (0, 1.3M), and an overshoot is wider
 * than the end (135.79% for 99.98%).
 */
function widest(r: Resolved, top: number): string {
  let out = r.fmt(r.to);
  for (let i = 0; i <= 200; i++) {
    const text = r.fmt(valueAt(r, (i / 200) * top));
    if (text.length > out.length) out = text;
  }
  return out;
}

/** The texts whose space is held: the start, the end and the widest on the way, once each. */
const holdsOf = (r: Resolved, wide: string) => [...new Set([r.fmt(r.from), r.fmt(r.to), wide])];

function formatOptions(r: Resolved): Pick<ScrollCounterOptions, 'format' | 'decimals'> {
  if (r.plan.kind === 'decimals') return { decimals: r.plan.decimals };
  if (r.plan.kind === 'format') return { format: r.fmt };
  return {};
}

/** The options a page passes: what the generated code says, at run time. */
function pageOptions(s: CounterSettings, r: Resolved): ScrollCounterOptions {
  const t = triggerOf(s.trigger);
  return { from: r.from, to: r.to, ...formatOptions(r), easing: s.easing, trigger: { start: t.start, end: t.end }, once: s.once };
}

/**
 * The preview's options. Its range runs to the curve's peak, so seek(e / top)
 * shows from + (to − from) × e even where the eased value e is above 1, as a
 * spring's is on the page. Under reduced motion the counter writes `to` at
 * once and ignores seek(), so it keeps the real range.
 */
function previewOptions(r: Resolved, top: number, reduced: boolean): ScrollCounterOptions {
  return { from: r.from, to: valueAt(r, reduced ? 1 : top), ...formatOptions(r) };
}

// ── The generator ────────────────────────────────────────────────────────────

export function CounterGenerator({ version }: { version: string }) {
  const [s, setS] = useState<CounterSettings>(COUNTER_INITIAL);
  // The two number fields as typed. Only a valid number reaches `s`, so the
  // preview and the code keep the last good one while a field is mid-edit.
  const [typed, setTyped] = useState({ from: COUNTER_INITIAL.from, to: COUNTER_INITIAL.to });
  const [lib, setLib] = useState<Lib | null>(null);
  const [progress, setProgress] = useState(1);
  const [tab, setTab] = useState<'js' | 'react'>('js');
  const reduced = useReducedMotion();
  const stage = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const preview = useRef<Instance | null>(null);
  const raf = useRef(0);
  const set = <K extends keyof CounterSettings>(k: K, v: CounterSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setNum = (k: 'from' | 'to', v: string) => {
    setTyped((p) => ({ ...p, [k]: v }));
    if (parseNumber(v) !== null) set(k, v);
  };

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => {
      if (live) setLib(m);
    });
    return () => { live = false; };
  }, []);

  // Only what decides the number: a change to the code options alone keeps the preview as it is.
  const { from, to, decimals, prefix, suffix, locale, grouping, compact } = s;
  const r = useMemo(
    () => resolve({ from, to, decimals, prefix, suffix, locale, grouping, compact }),
    [from, to, decimals, prefix, suffix, locale, grouping, compact],
  );
  const ease = useMemo(() => (lib ? easingsOf(lib)[s.easing] : null), [lib, s.easing]);
  const curve = useMemo(() => (ease ? curveOf(ease) : null), [ease]);
  const hold = useMemo(() => widest(r, curve?.top ?? 1), [r, curve]);

  /** Show the number for scroll progress t, as the page would on its way down. */
  const show = useCallback((t: number) => {
    if (!ease || !curve) return;
    preview.current?.seek(ease(t) / curve.top);
    setProgress(t);
  }, [ease, curve]);

  /** Run t from 0 to 1, as if the reader scrolled through the window at a steady pace. */
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    // The counter has written its final number and ignores seek().
    if (reduced) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PLAY_MS);
      show(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [reduced, show]);

  // A new setting builds a new preview: show the end at once, then play it.
  useEffect(() => {
    const el = stage.current;
    if (!lib || !el || !ease || !curve) return;
    const inst = lib.scrollCounter(el, previewOptions(r, curve.top, reduced));
    preview.current = inst;
    inst.seek(ease(1) / curve.top);
    const id = window.setTimeout(play, 220);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf.current);
      inst.destroy();
      preview.current = null;
    };
  }, [lib, r, ease, curve, reduced, play]);

  function scrub(t: number) {
    cancelAnimationFrame(raf.current);
    show(t);
  }

  function load(next: CounterSettings) {
    setS(next);
    setTyped({ from: next.from, to: next.to });
    panel.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  const code = useMemo(() => (tab === 'js' ? jsCode(s, r) : reactCode(s, r)), [s, r, tab]);
  const html = useMemo(() => runnableHtml(s, r, version), [s, r, version]);
  const react = useMemo(() => reactProject(s, r, version), [s, r, version]);
  const final = r.fmt(r.to);
  const t = reduced ? 1 : progress;
  const eased = !reduced && ease ? ease(t) : 1;
  const motion = curve ? curveNote(s, r, curve) : null;

  return (
    <div className="ctr">
      <div ref={panel} className="ctr-panel">
        <div className="ctr-controls">
          <NumField label="from" value={typed.from} onChange={(v) => setNum('from', v)} />
          <NumField label="to" value={typed.to} onChange={(v) => setNum('to', v)} />
          <Field label="decimals" group>
            <Seg value={String(s.decimals)} options={COUNTER_DECIMALS} label="Decimals" onChange={(v) => set('decimals', Number(v))} />
          </Field>
          <Field label="prefix">
            <input
              type="text" value={s.prefix} maxLength={AFFIX_MAX} placeholder="none" aria-label="Prefix"
              onChange={(e) => set('prefix', cleanAffix(e.target.value))}
            />
          </Field>
          <Field label="suffix">
            <input
              type="text" value={s.suffix} maxLength={AFFIX_MAX} placeholder="none" aria-label="Suffix"
              onChange={(e) => set('suffix', cleanAffix(e.target.value))}
            />
          </Field>
          <Field label="locale">
            <select value={s.locale} aria-label="Locale" onChange={(e) => set('locale', e.target.value as CounterLocale)}>
              {COUNTER_LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="separators" group>
            <Seg value={s.grouping ? 'on' : 'off'} options={['on', 'off']} label="Separators" onChange={(v) => set('grouping', v === 'on')} />
          </Field>
          <Field label="notation" group>
            <Seg value={s.compact ? 'compact' : 'full'} options={['full', 'compact']} label="Notation" onChange={(v) => set('compact', v === 'compact')} />
          </Field>
          <Field label="easing">
            <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value as CounterEasing)}>
              {COUNTER_EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="once" group>
            <Seg value={s.once ? 'true' : 'false'} options={['true', 'false']} label="Once" onChange={(v) => set('once', v === 'true')} />
          </Field>
          <Field label="trigger · start → end" wide>
            <select value={s.trigger} aria-label="Trigger window" onChange={(e) => set('trigger', e.target.value as CounterTrigger)}>
              {COUNTER_TRIGGERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="screen-reader copy" group>
            <Seg value={s.srCopy ? 'on' : 'off'} options={['on', 'off']} label="Screen-reader copy in the code" onChange={(v) => set('srCopy', v === 'on')} />
          </Field>
        </div>

        <div className="ctr-stage">
          <span className="ctr-sr">Preview. Final value: {final}</span>
          <span className="ctr-num ctr-num-big" aria-hidden="true">
            {holdsOf(r, hold).map((h) => <span key={h} className="ctr-hold">{h}</span>)}
            <span ref={stage} className="ctr-run" data-final={final} />
          </span>
        </div>
        <div className="ctr-transport">
          <button type="button" className="ctr-btn" onClick={play} disabled={reduced}>▶ Play</button>
          <label className="ctr-scrub">
            <span>scroll progress · {t.toFixed(2)} → eased · {eased.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.01} value={t} disabled={reduced}
              aria-label="Scroll progress through the trigger window" onChange={(e) => scrub(Number(e.target.value))}
            />
          </label>
        </div>
        {reduced && (
          <p className="ctr-note" role="status">
            Your system asks for reduced motion, so the counter shows its final number at once, with no count. Readers
            with the same setting get the same on your page.
          </p>
        )}
        {motion && <p className="ctr-warn" role="status">{motion}</p>}
      </div>

      <div className="ctr-code">
        <div className="ctr-tabs" role="tablist" aria-label="Code">
          {(['js', 'react'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="ctr-tab" onClick={() => setTab(k)}>
              {k === 'js' ? 'JavaScript' : 'React'}
            </button>
          ))}
        </div>
        <CodeBox file={tab === 'js' ? 'main.js' : 'Stat.tsx'}>{code}</CodeBox>
        <ToolExport title={TITLE} filename="animated-counter.html" html={html} react={react} />
      </div>

      <div className="ctr-live">
        <p className="ctr-live-k">On real scroll · each one counts as it crosses its window, no seek()</p>
        <div className="ctr-cards">
          <LiveCard lib={lib} label="Yours" note="the settings above" settings={s} yours />
          {COUNTER_EXAMPLES.map((x) => (
            <LiveCard key={x.key} lib={lib} label={x.label} note={x.note} settings={x.settings} onLoad={() => load(x.settings)} />
          ))}
        </div>
        <p className="ctr-live-note">
          These follow the page. With <code>once: true</code>, scrolling back up leaves each number where it got to;
          an example’s Edit button loads its settings into the generator.
        </p>
      </div>
    </div>
  );
}

/**
 * What an easing that leaves the range does to the number, from the curve:
 * spring and elastic run past `to` and come back, bounce reaches it early and
 * drops back. `once` changed for both in 2.23.3 (counter/index.ts update()).
 */
function curveNote(s: CounterSettings, r: Resolved, c: { top: number; dip: number }): ReactNode {
  const final = r.fmt(r.to);
  if (c.top > 1.001) {
    const peak = r.fmt(valueAt(r, c.top));
    return (
      <>
        {s.easing} runs past the end and comes back, so on the way the number reaches {peak} before it settles on{' '}
        {final}.{s.once && (
          <> In svg-scroll-draw 2.23.2 and earlier, <code>once: true</code> held the highest number reached, so the
            count stopped as high as {peak}; 2.23.3 settles on {final}.</>
        )}
      </>
    );
  }
  if (c.dip < 0.999) {
    return (
      <>
        {s.easing} reaches {final} early, then drops back as far as {r.fmt(valueAt(r, c.dip))} and climbs again before
        it settles.{s.once && (
          <> In svg-scroll-draw 2.23.2 and earlier, <code>once: true</code> skipped those dips and stayed on {final};
            2.23.3 keeps them.</>
        )}
      </>
    );
  }
  return null;
}

// ── A counter on the page's own scroll ───────────────────────────────────────

function LiveCard({ lib, label, note, settings, yours, onLoad }: {
  lib: Lib | null; label: string; note: string; settings: CounterSettings; yours?: boolean; onLoad?: () => void;
}) {
  const run = useRef<HTMLSpanElement>(null);
  const r = useMemo(() => resolve(settings), [settings]);
  const top = useMemo(() => (lib ? curveOf(easingsOf(lib)[settings.easing]).top : 1), [lib, settings.easing]);
  const hold = useMemo(() => widest(r, top), [r, top]);

  useEffect(() => {
    const el = run.current;
    if (!lib || !el) return;
    const inst = lib.scrollCounter(el, pageOptions(settings, r));
    return () => inst.destroy();
  }, [lib, settings, r]);

  const final = r.fmt(r.to);
  return (
    <div className={`ctr-card${yours ? ' is-yours' : ''}`}>
      <p className="ctr-card-k">{label}</p>
      <p className="ctr-card-v">
        <span className="ctr-sr">{final}</span>
        <span className="ctr-num" aria-hidden="true">
          {holdsOf(r, hold).map((h) => <span key={h} className="ctr-hold">{h}</span>)}
          <span ref={run} className="ctr-run" data-final={final} />
        </span>
      </p>
      <p className="ctr-card-n">{note}</p>
      {onLoad && (
        <button type="button" className="ctr-card-btn" onClick={onLoad}>
          Edit<span className="ctr-sr"> {label} in the generator</span> <span aria-hidden="true">↑</span>
        </button>
      )}
    </div>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

/** A label and its control. A group of buttons gets a div: a <label> would click its first button. */
function Field({ label, group, wide, children }: { label: string; group?: boolean; wide?: boolean; children: ReactNode }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className={`ctr-field${wide ? ' is-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </Tag>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = parseNumber(value) !== null;
  return (
    <Field label={valid ? label : `${label} · a number, . for decimals`}>
      <input
        type="text" inputMode="decimal" value={value} maxLength={NUM_MAX} spellCheck={false} aria-invalid={!valid}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="ctr-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}
