'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ScrollRevealOptions } from 'svg-scroll-draw/reveal';
import { CodeBox } from '@/components/site/CodeBox';
import {
  PRESET_AMOUNT, REVEAL_DEFAULTS, REVEAL_EASINGS, REVEAL_FROM, REVEAL_PRESETS, fromToProps, presetAmount,
  rowIndices, shiftPct, trig, type RevealEasing, type RevealFrom, type RevealPreset,
} from '@/data/reveal';

/**
 * The scroll reveal generator. One set of options, built from the controls
 * with every default left out, drives three things:
 *
 * - The code: exactly that options object, as a scrollReveal call.
 * - "On real scroll" below: scrollReveal itself, given that object, on cards
 *   in the page. It follows the window, as it will on yours.
 * - The preview box. scrollReveal follows the window only (it has no
 *   scrollContainer option), so to show a change without scrolling the page
 *   the box runs scrollReveal's engine through scrollAnimate, with the
 *   same props, easing, once and staggered trigger windows, computed by
 *   scrollReveal's own maths (data/reveal.ts), and scrollContainer set to the
 *   box. It plays when it first comes on screen, after each change (a change
 *   made while it is off screen plays when it comes back), and on Replay, by
 *   scrolling the box; scrolling it by hand stops that. Under reduced motion
 *   the cards are in place at once, as scrollReveal shows them, and the box
 *   jumps to them instead of scrolling.
 *
 * The number in each card's corner is getProgress(): the eased progress, which
 * spring and elastic take past 1 on the way.
 *
 * `once: true` changed in 2.23.3 (animate/engine.ts update()): 2.23.2 and
 * earlier held the highest eased value, so spring and elastic froze on their
 * overshoot and bounce lost its dips; 2.23.3 holds the furthest scroll
 * progress and eases it after. The preview runs whichever build the site has,
 * so the words about it name both versions.
 *
 * Every instance is destroyed on unmount and before each rebuild, which puts
 * the cards' inline styles back as they were.
 */

type Animate = typeof import('svg-scroll-draw').scrollAnimate;
type Instance = ReturnType<Animate>;
type Reveal = ReturnType<typeof import('svg-scroll-draw/reveal').scrollReveal>;

type Settings = {
  preset: RevealPreset;
  /** The preset's one moving number (PRESET_AMOUNT), as a positive value. */
  amount: number;
  opacity: number;
  stagger: number;
  easing: RevealEasing;
  once: boolean;
  start: number;
  end: number;
  /** A perspective on the parent, offered for the two flips. */
  depth: boolean;
};

const D = REVEAL_DEFAULTS;
const INITIAL: Settings = {
  preset: D.preset,
  amount: presetAmount(D.preset),
  opacity: REVEAL_FROM[D.preset].opacity ?? 1,
  stagger: D.stagger,
  easing: D.easing,
  once: D.once,
  start: D.start,
  end: D.end,
  depth: true,
};
const MIN_WINDOW = 5;
const PERSPECTIVE = 800;
const FLIPS: RevealPreset[] = ['flip', 'flipX'];

// ── The options, with every default left out ────────────────────────────────

function fromOverrides(s: Settings): RevealFrom | undefined {
  const base = REVEAL_FROM[s.preset];
  const a = PRESET_AMOUNT[s.preset];
  const out: RevealFrom = {};
  const v = +(s.amount * a.sign).toFixed(4) || 0;
  if (v !== base[a.key]) out[a.key] = v;
  if (s.opacity !== (base.opacity ?? 1)) out.opacity = s.opacity;
  return Object.keys(out).length ? out : undefined;
}

function revealOptions(s: Settings): ScrollRevealOptions {
  const o: ScrollRevealOptions = {};
  if (s.preset !== D.preset) o.preset = s.preset;
  const from = fromOverrides(s);
  if (from) o.from = from;
  if (s.stagger !== D.stagger) o.stagger = s.stagger;
  if (s.easing !== D.easing) o.easing = s.easing;
  if (s.once !== D.once) o.once = s.once;
  const t: { start?: string; end?: string } = {};
  if (s.start !== D.start) t.start = trig(s.start);
  if (s.end !== D.end) t.end = trig(s.end);
  if (t.start || t.end) o.trigger = t;
  return o;
}

// ── The preview box: scrollReveal's loop, with the box as the scroller ──────

const pctOf = (t: string | undefined, d: number) => (t ? parseFloat(t.trim().split(/\s+/)[1]) : d);

function revealInBox(els: HTMLElement[], box: HTMLElement, o: ScrollRevealOptions, scrollAnimate: Animate) {
  const { preset = D.preset, from, stagger = D.stagger, easing = D.easing, once = D.once, trigger } = o;
  const props = fromToProps({ ...REVEAL_FROM[preset], ...from });
  const start = pctOf(trigger?.start, D.start);
  const end = pctOf(trigger?.end, D.end);
  const span = Math.abs(start - end);
  const step = Math.min(Math.max(stagger, 0), 1) * span;
  // Measured before any instance writes a transform, as scrollReveal does.
  const rows = rowIndices(els);
  const index = step > 0 ? rows : els.map(() => 0);
  const ends: number[] = [];
  const instances: Instance[] = els.map((el, i) => {
    const by = Math.min(index[i] * step, span);
    ends.push(by > 0 ? shiftPct(end, by) : end);
    return scrollAnimate(el, {
      props,
      easing,
      once,
      native: false,
      scrollContainer: box,
      trigger: by > 0
        ? { start: trig(shiftPct(start, by)), end: trig(shiftPct(end, by)) }
        : { start: trig(start), end: trig(end) },
    });
  });
  return { instances, ends, perRow: Math.max(0, ...rows) + 1 };
}

/** The once: true easings whose look changed in 2.23.3 (see the comment at the top). */
const ONCE_CHANGED: RevealEasing[] = ['spring', 'elastic', 'bounce'];

/**
 * A card's place in the box's content, from offsetTop, which ignores
 * transforms: where it sits, not where its start state draws it.
 */
function topIn(c: HTMLElement, box: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = c;
  while (n && n !== box && n !== box.offsetParent) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return n === box ? y : y - box.offsetTop;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// ── The cards: original line drawings, one per card ─────────────────────────

const GLYPHS: ReactNode[] = [
  <g key="bars"><path d="M14 50V30M30 50V18M46 50V36M62 50V12M78 50V26M94 50V20" /><path d="M6 50.5H114" /></g>,
  <g key="line"><path d="M8 46L28 30L44 38L64 16L84 26L112 10" /><circle cx="64" cy="16" r="3" /></g>,
  <g key="target"><circle cx="60" cy="30" r="20" /><circle cx="60" cy="30" r="9" /><path d="M60 4V56M34 30H86" /></g>,
  <g key="wave"><path d="M6 30C20 6 32 6 46 30S72 54 86 30S106 10 114 22" /><path d="M6 44H114" strokeDasharray="2 4" /></g>,
  <g key="dots">{[0, 1, 2, 3, 4].flatMap((c) => [0, 1, 2].map((r) => <circle key={`${c}${r}`} cx={24 + c * 18} cy={14 + r * 16} r={c === r + 1 ? 4 : 1.5} />))}</g>,
  <g key="hills"><path d="M6 52L38 22L56 38L76 14L114 52Z" /><circle cx="96" cy="16" r="6" /></g>,
  <g key="frames"><rect x="22" y="6" width="76" height="48" /><rect x="34" y="14" width="52" height="32" /><rect x="46" y="22" width="28" height="16" /></g>,
  <g key="steps"><path d="M8 52H30V40H52V28H74V16H96V6H112" /><path d="M8 52.5H112" strokeDasharray="2 4" /></g>,
  <g key="pie"><circle cx="60" cy="30" r="22" /><path d="M60 30V8M60 30L79 41" /></g>,
];
const BOX_CARDS = GLYPHS.length;
const LIVE_CARDS = 6;

function MockCard({ n }: { n: number }) {
  return (
    <article className="srg-card">
      <span className="srg-card-top">
        <span>{String(n + 1).padStart(2, '0')}</span>
        <span className="srg-card-p" />
      </span>
      <svg className="srg-thumb" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid meet">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          {GLYPHS[n % GLYPHS.length]}
        </g>
      </svg>
      <span className="srg-line is-title" />
      <span className="srg-line" />
      <span className="srg-line is-short" />
    </article>
  );
}

// ── The generator ───────────────────────────────────────────────────────────

export function RevealGenerator() {
  const [s, setS] = useState<Settings>(INITIAL);
  const [tab, setTab] = useState<'js' | 'react'>('js');
  const [lines, setLines] = useState(true);
  const [perRow, setPerRow] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const liveHost = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance[]>([]);
  /** Where each card's window ends, % down the box: the replay stops once the last is in place. */
  const ends = useRef<number[]>([]);
  const onScreen = useRef(false);
  const played = useRef(false);
  /** A change made while the box was off screen, to play when it is back. */
  const pending = useRef(false);
  const tween = useRef(0);
  const readout = useRef(0);
  const [reduced, setReduced] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const opts = useMemo(() => revealOptions(s), [s]);
  const depth = FLIPS.includes(s.preset) && s.depth;
  const amount = PRESET_AMOUNT[s.preset];
  const span = Math.abs(s.start - s.end);
  const step = +(Math.min(Math.max(s.stagger, 0), 1) * span).toFixed(2);
  // scrollReveal never shifts a window more than one window: past that, the
  // rest of a row all start one window after its first.
  const capped = step > 0 && perRow > 1 && (perRow - 1) * step > span + 1e-9;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /**
   * Scroll the box down as a reader would, every card back at its start, and
   * stop just after the last card's window ends, so the cards are in view.
   * Under reduced motion the cards are already in place: jump to them.
   */
  const play = useCallback(() => {
    const el = box.current;
    if (!el) return;
    cancelAnimationFrame(tween.current);
    el.scrollTop = 0;
    inst.current.forEach((i) => i.replay());
    if (reducedMotion()) {
      const grid = el.querySelector<HTMLElement>('.srg-grid');
      if (grid) el.scrollTop = Math.max(0, topIn(grid, el) - 16);
      return;
    }
    const h = el.clientHeight;
    const last = [...el.querySelectorAll<HTMLElement>('.srg-card')].reduce(
      (m, c, n) => Math.max(m, topIn(c, el) - (h * (ends.current[n] ?? D.end)) / 100),
      0,
    );
    const max = Math.min(el.scrollHeight - h, Math.ceil(last) + 24);
    const ms = Math.min(4200, Math.max(2000, max * 2.6));
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      el.scrollTop = max * easeInOut(p);
      if (p < 1) tween.current = requestAnimationFrame(tick);
    };
    tween.current = requestAnimationFrame(tick);
  }, []);

  /** Each card's progress, written into its corner while the box is on screen. */
  const startReadout = useCallback(() => {
    cancelAnimationFrame(readout.current);
    const el = box.current;
    if (!el) return;
    const labels = [...el.querySelectorAll<HTMLElement>('.srg-card-p')];
    const tick = () => {
      inst.current.forEach((i, n) => {
        const text = i.getProgress().toFixed(2);
        if (labels[n] && labels[n].textContent !== text) labels[n].textContent = text;
      });
      readout.current = requestAnimationFrame(tick);
    };
    readout.current = requestAnimationFrame(tick);
  }, []);

  // Build the preview on every change of options; tear it down first.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let live = true;
    const cards = [...el.querySelectorAll<HTMLElement>('.srg-card')];
    import('svg-scroll-draw').then(({ scrollAnimate }) => {
      if (!live) return;
      const built = revealInBox(cards, el, opts, scrollAnimate);
      inst.current = built.instances;
      ends.current = built.ends;
      // Off screen, the instances wait: nothing to draw for a box no one sees.
      if (!onScreen.current) built.instances.forEach((i) => i.pause());
      setPerRow(built.perRow);
    });
    return () => {
      live = false;
      inst.current.forEach((i) => i.destroy());
      inst.current = [];
    };
  }, [opts]);

  // The same options through scrollReveal itself, on cards in the page.
  useEffect(() => {
    const host = liveHost.current;
    if (!host) return;
    let live = true;
    let reveal: Reveal | null = null;
    import('svg-scroll-draw/reveal').then(({ scrollReveal }) => {
      if (live) reveal = scrollReveal(host.querySelectorAll('.srg-card'), opts);
    });
    return () => {
      live = false;
      reveal?.destroy();
    };
  }, [opts]);

  // A change replays the preview, once the controls have settled; one made
  // with the box off screen waits for it to come back.
  useEffect(() => {
    if (!onScreen.current) {
      if (played.current) pending.current = true;
      return;
    }
    const id = setTimeout(play, 280);
    return () => clearTimeout(id);
  }, [opts, play]);

  // Run only while the preview is on screen; play it the first time it is.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        inst.current.forEach((i) => i.resume());
        startReadout();
        if (!played.current || pending.current) {
          played.current = true;
          pending.current = false;
          setTimeout(play, 200);
        }
      } else {
        inst.current.forEach((i) => i.pause());
        cancelAnimationFrame(readout.current);
        cancelAnimationFrame(tween.current);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(readout.current);
      cancelAnimationFrame(tween.current);
    };
  }, [play, startReadout]);

  // Scrolling the box by hand takes over from the replay.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const stop = () => cancelAnimationFrame(tween.current);
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach((e) => el.addEventListener(e, stop, { passive: true }));
    return () => events.forEach((e) => el.removeEventListener(e, stop));
  }, []);

  const onceNote = s.once && ONCE_CHANGED.includes(s.easing);
  const code = useMemo(
    () => (tab === 'js' ? jsCode(opts, depth, onceNote) : reactCode(opts, depth, onceNote)),
    [opts, depth, tab, onceNote],
  );
  const gridStyle = depth ? { perspective: `${PERSPECTIVE}px` } : undefined;
  // The first row starts just below the start line, so a replay begins with
  // every card at 0 wherever the line is.
  const heroStyle = { minHeight: `calc(var(--srg-h) * ${Math.max(0.9, s.start / 100 + 0.02)})` };
  const overshoot = s.once && (s.easing === 'spring' || s.easing === 'elastic');
  const bounceOnce = s.once && s.easing === 'bounce';
  const still = s.opacity === 1 && s.amount === (s.preset === 'scale' ? 1 : 0);

  return (
    <div className="srg">
      <div className="srg-panel">
        <div className="srg-controls">
          <div className="srg-field is-wide">
            <span id="srg-preset-k">preset</span>
            <span className="srg-presets" role="radiogroup" aria-labelledby="srg-preset-k">
              {REVEAL_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={s.preset === p}
                  onClick={() => setS((prev) => ({ ...prev, preset: p, amount: presetAmount(p) }))}
                >
                  {p}
                </button>
              ))}
            </span>
          </div>
          <Field label={`from.${amount.key} · ${+(s.amount * amount.sign).toFixed(4) || 0}${amount.unit}`}>
            <input
              type="range" min={amount.min} max={amount.max} step={amount.step} value={s.amount}
              aria-label={amount.label} onChange={(e) => set('amount', Number(e.target.value))}
            />
          </Field>
          <Field label={`from.opacity · ${s.opacity}`}>
            <input
              type="range" min={0} max={1} step={0.05} value={s.opacity}
              aria-label="Start opacity" onChange={(e) => set('opacity', Number(e.target.value))}
            />
          </Field>
          <Field label={`trigger.start · top ${s.start}%`}>
            <input
              type="range" min={50} max={100} step={1} value={s.start} aria-label="Trigger start, percent of the window"
              onChange={(e) => {
                const v = Number(e.target.value);
                setS((p) => ({ ...p, start: v, end: Math.min(p.end, v - MIN_WINDOW) }));
              }}
            />
          </Field>
          <Field label={`trigger.end · top ${s.end}%`}>
            <input
              type="range" min={0} max={s.start - MIN_WINDOW} step={1} value={s.end}
              aria-label="Trigger end, percent of the window" onChange={(e) => set('end', Number(e.target.value))}
            />
          </Field>
          <Field label={`stagger · ${s.stagger}`}>
            <input
              type="range" min={0} max={1} step={0.05} value={s.stagger}
              aria-label="Stagger" onChange={(e) => set('stagger', Number(e.target.value))}
            />
          </Field>
          <Field label="easing">
            <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value as RevealEasing)}>
              {REVEAL_EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="once" group>
            <Seg value={s.once ? 'true' : 'false'} options={['true', 'false']} onChange={(v) => set('once', v === 'true')} label="Once" />
          </Field>
          {FLIPS.includes(s.preset) && (
            <Field label="parent perspective" group>
              <Seg
                value={s.depth ? `${PERSPECTIVE}px` : 'none'}
                options={[`${PERSPECTIVE}px`, 'none']}
                onChange={(v) => set('depth', v !== 'none')}
                label="Parent perspective"
              />
            </Field>
          )}
        </div>

        <div ref={frame} className="srg-frame">
          <div
            ref={box}
            className="srg-box"
            tabIndex={0}
            role="region"
            aria-label="Preview: scroll inside this box to reveal the cards"
          >
            <div aria-hidden="true">
              <div className="srg-hero" style={heroStyle}>
                <span className="srg-hero-k">Your page</span>
                <span className="srg-line is-head" />
                <span className="srg-line is-head is-short" />
                <span className="srg-hero-hint">Scroll inside this box ↓</span>
              </div>
              <div className="srg-grid" style={gridStyle}>
                {Array.from({ length: BOX_CARDS }, (_, n) => <MockCard key={n} n={n} />)}
              </div>
              <div className="srg-foot"><span>End of the page</span></div>
            </div>
          </div>
          {lines && (
            <div className="srg-lines" aria-hidden="true">
              <span className="srg-trig" style={{ top: `${s.start}%` }}><b>Start · top {s.start}%</b></span>
              <span className="srg-trig" style={{ top: `${s.end}%` }}><b>End · top {s.end}%</b></span>
            </div>
          )}
        </div>

        <div className="srg-transport">
          <button type="button" className="srg-btn" onClick={play}>
            <span aria-hidden="true">▶ </span>Replay
          </button>
          <label className="srg-check">
            <input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} />
            Trigger lines
          </label>
          <button type="button" className="srg-btn is-quiet" onClick={() => setS(INITIAL)}>Reset</button>
          <p className="srg-count">
            {BOX_CARDS} cards{perRow > 0 && ` · ${perRow} per row`} ·{' '}
            {step > 0
              ? `each starts ${step}% of the window after the one before it${capped ? `, none more than ${span}% after the first in its row` : ''}`
              : 'a row reveals all at once'}
            {' '}· corner: eased progress
          </p>
        </div>
        {reduced && (
          <p className="srg-warn is-info" role="status">
            Your system asks for reduced motion, so every card is in place at once, with nothing moving: what
            scrollReveal shows readers who ask the same.
          </p>
        )}
        {still && (
          <p className="srg-warn is-info" role="status">
            With <code>opacity</code> 1 and nothing to move, the start state is the end state: nothing changes.
          </p>
        )}
        {overshoot && (
          <p className="srg-warn" role="status">
            In 2.23.2 and earlier, <code>once: true</code> kept the highest eased value, and {s.easing} goes past 1 on
            the way: each card stopped past its place, on the top of the overshoot. Fixed in 2.23.3, which keeps the
            furthest scroll progress and eases it, so the card overshoots and settles. On 2.23.2 or earlier, set{' '}
            <code>once: false</code> for {s.easing}.
          </p>
        )}
        {bounceOnce && (
          <p className="srg-warn" role="status">
            In 2.23.2 and earlier, <code>once: true</code> kept the highest eased value, so bounce’s dips back below 1
            never showed: it arrived like a quick ease-out. Fixed in 2.23.3, which keeps the furthest scroll progress
            and eases it, so the dips show as you scroll. On 2.23.2 or earlier, set <code>once: false</code> to see them.
          </p>
        )}
      </div>

      <div className="srg-code">
        <div className="srg-tabs" role="tablist" aria-label="Code">
          {(['js', 'react'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="srg-tab" onClick={() => setTab(t)}>
              {t === 'js' ? 'JavaScript' : 'React'}
            </button>
          ))}
        </div>
        <CodeBox file={tab === 'js' ? 'main.js' : 'Cards.tsx'}>{code}</CodeBox>
      </div>

      <div className="srg-live">
        <p className="srg-live-k">On real scroll · scrollReveal itself, the same options, no box</p>
        <div ref={liveHost} className="srg-grid is-live" style={gridStyle} aria-hidden="true">
          {Array.from({ length: LIVE_CARDS }, (_, n) => <MockCard key={n} n={n} />)}
        </div>
        <p className="srg-live-note">
          These follow the page: each card starts when its top reaches {s.start}% of the window and is in place at{' '}
          {s.end}%{step > 0 ? ', the next in its row a little later' : ''}.
        </p>
      </div>
    </div>
  );
}

/** A control with its mono label. A group of buttons gets a div: a label would pass its clicks to the first button. */
function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className="srg-field">
      <span>{label}</span>
      {children}
    </Tag>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="srg-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}

// ── The generated code ──────────────────────────────────────────────────────

function optionLines(o: ScrollRevealOptions): string[] {
  const out: string[] = [];
  if (o.preset) out.push(`preset: '${o.preset}'`);
  if (o.from) out.push(`from: { ${Object.entries(o.from).map(([k, v]) => `${k}: ${v}`).join(', ')} }`);
  if (o.stagger !== undefined) out.push(`stagger: ${o.stagger}`);
  if (typeof o.easing === 'string') out.push(`easing: '${o.easing}'`);
  if (o.once !== undefined) out.push(`once: ${o.once}`);
  if (o.trigger) out.push(`trigger: { ${Object.entries(o.trigger).map(([k, v]) => `${k}: '${v}'`).join(', ')} }`);
  return out;
}

const block = (lines: string[], indent: string) =>
  lines.length ? `, {\n${lines.map((l) => `${indent}  ${l},`).join('\n')}\n${indent}}` : '';

/** For spring, elastic and bounce with once: true, whose look changed in 2.23.3. */
const onceLine = (o: ScrollRevealOptions, indent: string) =>
  `${indent}// ${o.easing} with once: true needs 2.23.3 or later: 2.23.2 and earlier ${
    o.easing === 'bounce' ? 'drop its dips' : 'stop it past its place'
  }.\n`;

function jsCode(o: ScrollRevealOptions, depth: boolean, onceNote: boolean): string {
  const css = depth ? `\n// CSS: .cards { perspective: ${PERSPECTIVE}px; } gives the flip its depth` : '';
  return `// <div class="cards">
//   <article class="card">…</article>
//   <article class="card">…</article>
// </div>${css}

import { scrollReveal } from 'svg-scroll-draw/reveal';

${onceNote ? onceLine(o, '') : ''}scrollReveal('.card'${block(optionLines(o), '')});`;
}

function reactCode(o: ScrollRevealOptions, depth: boolean, onceNote: boolean): string {
  const style = depth ? ` style={{ perspective: ${PERSPECTIVE} }}` : '';
  return `'use client';

import { useEffect, useRef } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';
${onceNote ? `\n${onceLine(o, '').trimEnd()}` : ''}
export function Cards({ items }: { items: { id: string; title: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const reveal = scrollReveal(ref.current.querySelectorAll('.card')${block(optionLines(o), '    ')});
    return () => reveal.destroy();
  }, [items]);

  return (
    <div ref={ref} className="cards"${style}>
      {items.map((item) => (
        <article key={item.id} className="card">{item.title}</article>
      ))}
    </div>
  );
}`;
}
