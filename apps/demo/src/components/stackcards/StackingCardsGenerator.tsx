'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  GAP, LIMITS, SLUG, STACK_DEFAULTS, TRIGGER,
  cardsOf, cssCode, cssOnlyCode, cssOnlyCss, cssOnlyFile, htmlCode, jsCode, jsFile, landOf, pileHeight, reactApp,
  reactCode, scriptCss, stickAt, type StackSettings,
} from './stack-code';

/**
 * The stacking cards generator. Everything that moves in it is the real thing:
 *
 * - The preview is a small scroll container standing in for the window. Its
 *   stylesheet is the generated CSS itself, every selector put under the box's
 *   class and the keyframes and timeline named after it, so the cards stick
 *   and stack by the same rules a page gets.
 * - With "scrollProgress" it runs the library on the list with the
 *   scrollContainer option, and the same onProgress the JavaScript tab writes.
 *   With "CSS only" there is no script at all: the view timeline on the list,
 *   whose scroller is the box, scales and dims the cards.
 * - The readout is read back from the cards as the browser lays them out:
 *   where each one is, and its computed scale and brightness.
 *
 * `version` is the library's, from the server page: the CDN URLs pin it.
 */

type Tab = 'html' | 'css' | 'js' | 'react' | 'css-only';
type Engine = 'js' | 'css';
type Lib = typeof import('svg-scroll-draw/progress');
type Card = { top: number; scale: number; bright: number; stuck: boolean };

const TABS: { key: Tab; label: string; file: string }[] = [
  { key: 'html', label: 'HTML', file: 'stack.html' },
  { key: 'css', label: 'CSS', file: 'stack.css' },
  { key: 'js', label: 'JavaScript', file: 'stack.js' },
  { key: 'react', label: 'React', file: 'StackingCards.jsx' },
  { key: 'css-only', label: 'CSS only', file: 'stack-css-only.css' },
];

/** The preview box's height in stackcards.css, until it is measured. */
const VP = 460;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;
const noop = () => () => {};
const supportsTimeline = () =>
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --x');

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export function StackingCardsGenerator({ version }: { version: string }) {
  const [s, setS] = useState<StackSettings>(STACK_DEFAULTS);
  const [engine, setEngine] = useState<Engine>('js');
  const [tab, setTab] = useState<Tab>('css-only');
  const [lib, setLib] = useState<Lib | null>(null);
  const [vp, setVp] = useState(VP);
  const [scroll, setScroll] = useState({ at: 0, max: 1, past: 0 });
  const [cards, setCards] = useState<Card[]>([]);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const timeline = useSyncExternalStore(noop, supportsTimeline, () => true);

  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const frame = useRef(0);
  const raf = useRef(0);

  // A stable, CSS-safe id for this preview's scope, keyframes and timeline.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const scopeClass = `scg-b${id}`;
  const css = useMemo(() => {
    const names = { scope: `.site .${scopeClass} `, keyframes: `scg-cover${id}`, timeline: `--scg-stack${id}` };
    return engine === 'js' ? scriptCss(s, names) : cssOnlyCss(s, names);
  }, [s, engine, scopeClass, id]);

  const land = landOf(s);
  const n = s.cards;
  const copy = useMemo(() => cardsOf(s), [s]);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw/progress').then((m) => { if (live) setLib(m); }).catch(() => { /* the CSS preview still runs */ });
    return () => { live = false; };
  }, []);

  // The box stands in for the window: the pile has to fit its height.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp(el.clientHeight || VP));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Where the box is scrolled, and each card as the browser has it now. */
  const readout = useCallback(() => {
    const b = box.current, l = list.current;
    if (!b || !l) return;
    const boxTop = b.getBoundingClientRect().top + b.clientTop;
    const past = b.scrollTop - l.offsetTop;
    setScroll({ at: b.scrollTop, max: Math.max(1, b.scrollHeight - b.clientHeight), past });
    setCards([...l.children].map((el, i) => {
      const cs = getComputedStyle(el);
      const scale = cs.scale === 'none' || !cs.scale ? 1 : parseFloat(cs.scale);
      const m = /brightness\(([\d.]+)\)/.exec(cs.filter);
      const top = el.getBoundingClientRect().top - boxTop;
      return { top, scale, bright: m ? parseFloat(m[1]) : 1, stuck: Math.abs(top - stickAt(s, i)) < 1 };
    }));
  }, [s]);

  /**
   * Read after the engine's own frame, so what it wrote is what we read. One
   * read at a time: cancelling and asking again on every scroll event would
   * starve it for as long as the box keeps scrolling, as it does under Play.
   */
  const read = useRef(readout);
  useEffect(() => { read.current = readout; }, [readout]);
  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        read.current();
      });
    });
  }, []);

  useEffect(() => () => { cancelAnimationFrame(frame.current); cancelAnimationFrame(raf.current); }, []);

  // The library on the list, inside the box: the JavaScript tab's call, with
  // scrollContainer. Made again on every setting.
  useEffect(() => {
    const l = list.current, b = box.current;
    if (!lib || engine !== 'js' || !l || !b) return;
    const covered = [...l.children].slice(0, -1) as HTMLElement[];
    const progress = lib.scrollProgress(l, {
      scrollContainer: b,
      trigger: { start: TRIGGER.start, end: TRIGGER.end },
      easedVariable: null,
      onProgress: (p) => {
        const past = p * l.offsetHeight;
        covered.forEach((card, i) => card.style.setProperty('--cover', String(clamp(past / land - i, 0, 1))));
      },
    });
    schedule();
    return () => {
      progress.destroy();
      covered.forEach((card) => card.style.removeProperty('--cover'));
    };
  }, [lib, engine, s, land, schedule]);

  // The CSS-only preview has no instance; read it once its stylesheet is in.
  useEffect(() => { schedule(); }, [engine, css, vp, schedule]);

  const stop = () => cancelAnimationFrame(raf.current);

  /** Scroll the box so `past` px of the list have gone above its top. */
  function jumpPast(past: number, smooth = false) {
    stop();
    const b = box.current, l = list.current;
    if (!b || !l) return;
    b.scrollTo({ top: l.offsetTop + past, behavior: smooth && !getReduced() ? 'smooth' : 'auto' });
  }

  /** The card on top now: the last one that has landed (or is landing). */
  const current = clamp(Math.floor(scroll.past / land + 0.001), 0, n - 1);

  function card(dir: 1 | -1) {
    const target = scroll.past < -1 && dir > 0 ? 0 : clamp(Math.round(scroll.past / land) + dir, 0, n - 1);
    jumpPast(target * land, true);
  }

  /** Scroll the box through the whole stack, as a reader would; one card at a time under reduced motion. */
  function play() {
    stop();
    const b = box.current, l = list.current;
    if (!b || !l) return;
    if (getReduced()) {
      card(1);
      return;
    }
    const from = Math.max(0, l.offsetTop - vp * 0.6);
    const to = Math.min(b.scrollHeight - b.clientHeight, l.offsetTop + (n - 1) * land + land * 0.6);
    const ms = clamp(1400 + (n - 1) * 900, 2400, 6400);
    b.scrollTop = from;
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / ms);
      b.scrollTop = from + (to - from) * t;
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  const set = <K extends keyof StackSettings>(k: K, v: StackSettings[K]) => setS((o) => ({ ...o, [k]: v }));

  const code = useMemo(() => {
    switch (tab) {
      case 'html': return htmlCode(s);
      case 'css': return cssCode(s);
      case 'js': return jsCode(s);
      case 'react': return reactCode(s);
      case 'css-only': return cssOnlyCode(s);
    }
  }, [tab, s]);
  const cssOnly = tab === 'css-only';
  const page = useMemo(() => (cssOnly ? cssOnlyFile(s) : jsFile(s, version)), [s, cssOnly, version]);
  const app = useMemo(() => reactApp(s), [s]);
  const pile = pileHeight(s);
  const noEffect = !s.scale && !s.dim;

  return (
    <div className="scg">
      <div className="scg-panel">
        <div className="scg-controls">
          <Field label="Cards">
            <span className="scg-seg" role="radiogroup" aria-label="Cards">
              {Array.from({ length: LIMITS.cards.max - LIMITS.cards.min + 1 }, (_, i) => i + LIMITS.cards.min).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={n === k} onClick={() => set('cards', k)}>{k}</button>
              ))}
            </span>
          </Field>
          <Range label="top · first card sticks at" unit="px" k="top" s={s} set={set} />
          <Range label="step · each next card lower by" unit="px" k="step" s={s} set={set} />
          <Range label="card height" unit="px" k="height" s={s} set={set} />
          <Range label="scale · a covered card shrinks by" k="scale" s={s} set={set} show={(v) => `${Math.round(v * 100)}%`} />
          <Range label="dim · a covered card darkens by" k="dim" s={s} set={set} show={(v) => `${Math.round(v * 100)}%`} />
          <Range label="rounded corners" unit="px" k="radius" s={s} set={set} />
          <Field label="Preview with" wide>
            <span className="scg-seg" role="radiogroup" aria-label="Preview with">
              {(['js', 'css'] as const).map((e) => (
                <button key={e} type="button" role="radio" aria-checked={engine === e} onClick={() => setEngine(e)}>
                  {e === 'js' ? 'scrollProgress' : 'CSS only'}
                </button>
              ))}
            </span>
          </Field>
        </div>

        <div className="scg-view">
          <p className="scg-k">Window · {vp}px tall · scroll it</p>
          <style>{css}</style>
          <div className="scg-frame">
            <div
              ref={box}
              className={`scg-box ${scopeClass}`}
              tabIndex={0}
              role="region"
              aria-label="Preview window: scroll it to stack the cards"
              onScroll={schedule}
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
              onKeyDown={stop}
            >
              <div className="scg-flow" style={{ height: Math.round(vp * 0.6) }}>
                <span>Content before the cards</span>
                <span>scroll ↓</span>
              </div>
              <ol ref={list} className="stack" aria-label="Preview cards">
                {copy.map((c, i) => (
                  <li key={c.title} className="stack-card" style={{ '--i': i } as CSSProperties}>
                    <span className="stack-card-n">{pad(i + 1)} / {pad(n)}</span>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ol>
              <div className="scg-flow is-after" style={{ height: vp }}>
                <span>The page goes on</span>
              </div>
            </div>
            {s.top > 0 && (
              <div className="scg-overlay" aria-hidden="true">
                <span className="scg-header" style={{ height: s.top }}>header · {s.top}px</span>
              </div>
            )}
          </div>
        </div>

        <div className="scg-transport">
          <button type="button" className="scg-btn" onClick={play}>{reduced ? 'Next card' : '▶ Play'}</button>
          <button type="button" className="scg-btn" onClick={() => card(-1)}>← Card</button>
          <button type="button" className="scg-btn" onClick={() => card(1)}>Card →</button>
          <label className="scg-scrub">
            <span>Scroll · {Math.round(scroll.at)}px</span>
            <input
              type="range" min={0} max={Math.round(scroll.max)} step={1} value={Math.round(clamp(scroll.at, 0, scroll.max))}
              aria-label="Scroll position of the preview"
              onChange={(e) => { stop(); if (box.current) box.current.scrollTop = Number(e.target.value); }}
            />
          </label>
        </div>

        <div className="scg-read">
          <div className="scg-big">
            <div>
              <span className="scg-k">Past the list’s top</span>
              <output className="scg-num" aria-label="Scroll past the list’s top">{Math.round(scroll.past)}<small>px</small></output>
            </div>
            <div>
              <span className="scg-k">On top</span>
              <output className="scg-num" aria-label="Card on top">{scroll.past < 0 ? '–' : current + 1}<small> / {n}</small></output>
            </div>
          </div>
          <div className="scg-cards" role="table" aria-label="Each card now">
            <div role="row" className="scg-row is-head">
              <span role="columnheader">Card</span>
              <span role="columnheader">Sticks at</span>
              <span role="columnheader">Covered</span>
              <span role="columnheader">scale · brightness</span>
            </div>
            {copy.map((c, i) => {
              const cd = cards[i];
              const done = cd && i < n - 1 && (s.scale ? (1 - cd.scale) / s.scale : s.dim ? (1 - cd.bright) / s.dim : 0);
              return (
                <div role="row" key={c.title} className="scg-row" data-stuck={cd?.stuck || undefined}>
                  <span role="cell">{pad(i + 1)}</span>
                  <span role="cell">{stickAt(s, i)}px{cd?.stuck ? ' · stuck' : ''}</span>
                  <span role="cell" className="scg-meter">
                    {i < n - 1 ? <i style={{ transform: `scaleX(${clamp(done || 0, 0, 1)})` }} /> : <em>last: never</em>}
                  </span>
                  <span role="cell">{cd ? `${fmt(cd.scale)} · ${fmt(cd.bright)}` : '1.00 · 1.00'}</span>
                </div>
              );
            })}
          </div>
          <dl className="scg-math">
            <div><dt>Land</dt><dd>height {s.height} + gap {GAP} − step {s.step} = {land}px of scroll a card</dd></div>
            <div><dt>Card i</dt><dd>sticks at {s.top} + i × {s.step}px, after i × {land}px; covered over the next {land}px</dd></div>
            <div><dt>Pile</dt><dd>{s.top} + {n - 1} × {s.step} + {s.height} = {pile}px tall once every card is in</dd></div>
            <div>
              <dt>Engine</dt>
              <dd>
                {engine === 'js'
                  ? `scrollProgress · p × list height = px past; cover = clamp(px ÷ ${land} − i, 0, 1)`
                  : timeline
                    ? `view timeline on the list · exit-crossing i × ${land}px → + ${land}px`
                    : 'no scroll timelines here: the cards stack, and do not shrink'}
              </dd>
            </div>
          </dl>
        </div>

        {pile > vp && (
          <p className="scg-warn" role="status">
            The pile is {pile}px tall and this window {vp}px, so the last card runs off its bottom. On a page, check
            the pile against the shortest window you support: a lower card height, top or step makes it fit.
          </p>
        )}
        {noEffect && (
          <p className="scg-note" role="status">Scale and dim are both 0: the cards only stack, which needs no script.</p>
        )}
        {engine === 'css' && !timeline && (
          <p className="scg-note" role="status">
            This browser has no scroll timelines, so the CSS-only version skips its @supports block: the cards still
            stick and stack, without shrinking or dimming.
          </p>
        )}
        {reduced && (
          <p className="scg-note">
            Your system asks for reduced motion: the cards still stack as you scroll, but do not shrink or dim, as the
            generated CSS does. Play moves one card at a time.
          </p>
        )}
      </div>

      <div className="scg-code">
        <div className="scg-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="scg-tab" onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <CodeBox file={TABS.find((t) => t.key === tab)?.file ?? 'stack.css'}>{code}</CodeBox>
        <p className="scg-hint">
          {tab === 'css-only'
            ? 'With the HTML tab’s markup and no script: position: sticky stacks the cards, and a view timeline on the list scales and dims them. Without scroll timelines they still stack.'
            : tab === 'react'
              ? 'Import the CSS tab as a stylesheet next to it. A client component, so it works in the Next.js App Router.'
              : 'The HTML, CSS and JavaScript tabs are one stack. Without the script the cards still stack; the script adds the shrink and dim.'}
        </p>
        <ToolExport
          title={cssOnly ? 'Stacking cards on scroll, CSS only' : 'Stacking cards on scroll'}
          filename={cssOnly ? 'stacking-cards-css-only.html' : 'stacking-cards.html'}
          html={page}
          react={cssOnly ? undefined : { slug: SLUG, app: app.app, css: app.css, version }}
        />
      </div>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`scg-field${wide ? ' is-wide' : ''}`} role="group" aria-label={label}>
      <span className="scg-field-k">{label}</span>
      {children}
    </div>
  );
}

type NumKey = 'top' | 'step' | 'height' | 'scale' | 'dim' | 'radius';

function Range({
  label, k, s, set, unit = '', show,
}: {
  label: string;
  k: NumKey;
  s: StackSettings;
  set: (k: NumKey, v: number) => void;
  unit?: string;
  show?: (v: number) => string;
}) {
  const r = LIMITS[k];
  return (
    <Field label={label}>
      <span className="scg-range">
        <input
          type="range" min={r.min} max={r.max} step={r.step} value={s[k]}
          aria-label={`${label}${unit ? `, in ${unit}` : ''}`}
          onChange={(e) => set(k, Number(e.target.value))}
        />
        <output className="scg-val">{show ? show(s[k]) : `${s[k]}${unit}`}</output>
      </span>
    </Field>
  );
}
