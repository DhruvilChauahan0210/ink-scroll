'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import {
  DEFAULTS, OUTPUTS, PREVIEW, RING, SCOPES, STYLES, THICKNESS, TRIGGER,
  css, html, isSafeColor, js, react, ringGeometry, supports,
  type BarStyle, type Engine, type Scope, type Settings,
} from './code';

/**
 * The scroll progress bar generator. The preview runs the generated code:
 *
 * - Its stylesheet is css() from ./code with the preview's class names, so the
 *   bar is placed, sized and filled by the same rules the listing shows.
 * - The frame has a transform, which makes it the containing block of
 *   position: fixed descendants: the bar is fixed to the frame exactly as the
 *   copied bar is fixed to the window, and does not scroll with the box.
 * - JavaScript and React tabs: scrollProgress from svg-scroll-draw/progress,
 *   with the box as its scrollContainer. CSS tab: no script at all; the box is
 *   a named scroll timeline (scroll(root) would follow this page instead).
 *
 * Readouts are written to the DOM, never to state: scrollProgress reports on
 * every frame and the page should not re-render on every frame.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw/progress').scrollProgress>;
type Tab = 'css' | 'js' | 'react';

const TABS: { k: Tab; label: string; note: string }[] = [
  {
    k: 'css',
    label: OUTPUTS[0],
    note: 'No JavaScript: a CSS animation on the scroll timeline. Chrome and Edge 115+, Safari 26+, Firefox 159+; older browsers show no bar.',
  },
  {
    k: 'js',
    label: OUTPUTS[1],
    note: 'scrollProgress writes the progress into --scroll-progress and the CSS fills the bar from it. Works where scroll-driven animations do not.',
  },
  {
    k: 'react',
    label: OUTPUTS[2],
    note: 'The same as a client component: it starts on mount and destroy() stops it on unmount. Works in the Next.js App Router.',
  },
];

const PARAS = [
  'A reading progress bar answers one question: how much is left? It fills as you move down the page, and it moves only when you do.',
  'The number behind it is how far the page has scrolled, divided by how far it can scroll. At the top that is 0; at the very bottom it is 1.',
  'Scale the bar with a transform instead of changing its width. A transform never makes the browser lay the page out again, so long pages stay smooth.',
  'On a blog the page is more than the post: a header above it, comments and links below. Follow the article instead, and the bar is full when the last paragraph is on screen.',
  'Where the browser has scroll-driven animations, CSS can do all of it with animation-timeline. Everywhere else, scrollProgress writes the same number into a CSS variable.',
  'Keep it thin and out of the way, and hide it from screen readers: it repeats what the scrollbar already says.',
  'That is the whole trick. Scroll back up and it empties again.',
];

const subscribeNever = () => () => {};
/** CSS.supports, read on the client only: null while server rendering, so hydration matches. */
function useSupports(condition: string): boolean | null {
  return useSyncExternalStore(
    subscribeNever,
    () => typeof CSS !== 'undefined' && CSS.supports(condition),
    () => null,
  );
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ProgressBarGenerator() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [tab, setTab] = useState<Tab>('js');
  const [colorText, setColorText] = useState('');
  const [colorBad, setColorBad] = useState(false);
  /** The box is at its far end: the button then scrolls back. Changes twice a pass, not every frame. */
  const [atEnd, setAtEnd] = useState(false);
  const engine: Engine = tab === 'css' ? 'css' : 'js';
  const cssOk = useSupports(supports(s));

  const box = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const readP = useRef<HTMLElement>(null);
  const readY = useRef<HTMLElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const tween = useRef(0);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  // One instance per scope, style, track and engine: destroyed and made again on
  // any of them, and on unmount.
  useEffect(() => {
    const scroller = box.current;
    const target = s.scope === 'page' ? page.current : article.current;
    if (!scroller || !target) return;
    let live = true;
    let inst: Instance | null = null;
    let onScreen: IntersectionObserver | null = null;
    let shown = '';

    const show = (p: number | null) => {
      const text = p == null ? '—' : p.toFixed(3);
      if (text !== shown && readP.current) readP.current.textContent = text;
      shown = text;
    };
    /** The CSS engine's progress, read from the animation itself. */
    const animationProgress = () => {
      const el = target.querySelector('.pbg-x-bar, .pbg-x-ring');
      const p = el?.getAnimations({ subtree: true })[0]?.effect?.getComputedTiming().progress;
      return typeof p === 'number' ? p : null;
    };
    // A scroll timeline catches up with the scroll after the scroll event, and a
    // new one after its first frame: read it in the next animation frame.
    let raf = 0;
    const readSoon = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => show(animationProgress()));
    };
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (slider.current) slider.current.value = String(max > 0 ? Math.round((scroller.scrollTop / max) * 1000) : 0);
      if (readY.current) readY.current.textContent = `${Math.round(scroller.scrollTop)} / ${max}`;
      setAtEnd(max > 0 && scroller.scrollTop >= max - 1);
      if (engine === 'css') readSoon();
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (engine === 'css') raf = requestAnimationFrame(readSoon);

    if (engine === 'js') {
      import('svg-scroll-draw/progress').then(({ scrollProgress }) => {
        if (!live) return;
        inst = scrollProgress(target, {
          trigger: { ...TRIGGER },
          easedVariable: null,
          scrollContainer: scroller,
          onProgress: (raw) => show(raw),
        });
        // The box is its own root, so the instance would keep ticking with the
        // tool scrolled out of sight. Pause it there.
        onScreen = new IntersectionObserver(([e]) => (e?.isIntersecting ? inst?.resume() : inst?.pause()));
        onScreen.observe(scroller);
      });
    }

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      onScreen?.disconnect();
      inst?.destroy();
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [s.scope, s.style, s.track, engine]);

  useEffect(() => () => cancelAnimationFrame(tween.current), []);

  /**
   * Scroll the box to the far end and back, as a reader would. Instant under
   * reduced motion. The far end is set as scrollHeight, which the browser clamps
   * to its real end: scrollHeight − clientHeight is rounded, and in Firefox and
   * WebKit stopping there left the bar a pixel short (0.999).
   */
  function scrollThrough() {
    const el = box.current;
    if (!el) return;
    cancelAnimationFrame(tween.current);
    const max = el.scrollHeight - el.clientHeight;
    const to = el.scrollTop < max - 1 ? max : 0;
    const land = () => { el.scrollTop = to === 0 ? 0 : el.scrollHeight; };
    if (reducedMotion()) {
      land();
      return;
    }
    const from = el.scrollTop;
    const ms = Math.min(3200, Math.max(700, Math.abs(to - from) * 2.4));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      if (k < 1) {
        el.scrollTop = from + (to - from) * e;
        tween.current = requestAnimationFrame(step);
      } else land();
    };
    tween.current = requestAnimationFrame(step);
  }

  const stop = () => cancelAnimationFrame(tween.current);

  function scrub(v: number) {
    stop();
    const el = box.current;
    if (el) el.scrollTop = v >= 1000 ? el.scrollHeight : (v / 1000) * (el.scrollHeight - el.clientHeight);
  }

  function onColor(v: string) {
    setColorText(v);
    const t = v.trim();
    if (!t) {
      setColorBad(false);
      set('color', null);
      return;
    }
    const ok = isSafeColor(t) && CSS.supports('color', t);
    setColorBad(!ok);
    set('color', ok ? t : null);
  }

  const previewCss = useMemo(() => css(s, engine, PREVIEW), [s, engine]);
  const files = useMemo(() => listings(s, tab), [s, tab]);
  const note = TABS.find((t) => t.k === tab)?.note;
  const vertical = s.style === 'left';

  return (
    <div className="pbg">
      <style>{previewCss}</style>
      <div className="pbg-panel">
        <div className="pbg-controls">
          <Field label="style" wide>
            <Seg value={s.style} options={STYLES.map((o) => o.k)} hints={STYLES.map((o) => o.d)} onChange={(v) => set('style', v as BarStyle)} label="Style" />
          </Field>
          <Field label={`${s.style === 'ring' ? 'stroke' : vertical ? 'width' : 'height'} · ${s.thickness}px`} wide>
            <input
              type="range" min={THICKNESS.min} max={THICKNESS.max} step={1} value={s.thickness}
              aria-label="Thickness" onChange={(e) => set('thickness', Number(e.target.value))}
            />
          </Field>
          <Field label="track">
            <Seg value={s.track ? 'on' : 'off'} options={['off', 'on']} onChange={(v) => set('track', v === 'on')} label="Track" />
          </Field>
          <Field label="follows">
            <Seg value={s.scope} options={SCOPES.map((o) => o.k)} hints={SCOPES.map((o) => o.d)} onChange={(v) => set('scope', v as Scope)} label="Follows" />
          </Field>
          <Field label="color" wide>
            <span className="pbg-color">
              <input
                type="text" value={colorText} placeholder="currentColor" maxLength={64} spellCheck={false}
                aria-label="Bar colour, any CSS colour" aria-invalid={colorBad || undefined}
                onChange={(e) => onColor(e.target.value)}
              />
              <input
                type="color" aria-label="Pick a colour"
                value={/^#[0-9a-f]{6}$/i.test(colorText.trim()) ? colorText.trim() : '#000000'}
                onChange={(e) => onColor(e.target.value)}
              />
            </span>
          </Field>
        </div>

        <div className="pbg-stage">
          <p className="pbg-stage-k">
            <span>preview · {engine === 'css' ? 'CSS scroll timeline, no script' : 'scrollProgress'}</span>
            <span>{s.scope === 'page' ? 'the box stands in for the window' : 'following the outlined article'}</span>
          </p>
          <div className="pbg-frame">
            <div
              ref={box}
              className="pbg-scroll"
              tabIndex={0}
              role="region"
              aria-label="Preview page, scroll it"
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
            >
              <div ref={page} className="pbg-page">
                {s.scope === 'page' && <Indicator s={s} />}
                <div className="pbg-site" aria-hidden="true">
                  <span>your site</span>
                  <span>blog · about</span>
                </div>
                <article ref={article} className={`pbg-x-article pbg-article${s.scope === 'article' ? ' is-tracked' : ''}`}>
                  {s.scope === 'article' && <Indicator s={s} />}
                  <p className="pbg-art-k">{s.scope === 'article' ? '<article> · tracked' : 'field notes · 2 min read'}</p>
                  <p className="pbg-art-h">Reading progress, measured</p>
                  {PARAS.slice(0, 3).map((p) => <p key={p} className="pbg-art-p">{p}</p>)}
                  <PreviewFigure />
                  {PARAS.slice(3).map((p) => <p key={p} className="pbg-art-p">{p}</p>)}
                </article>
                <div className="pbg-after" aria-hidden="true">
                  <span className="pbg-after-k">comments · 3</span>
                  <span className="pbg-line" />
                  <span className="pbg-line is-short" />
                  <span className="pbg-after-k">related</span>
                  <span className="pbg-line" />
                  <span className="pbg-line is-short" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pbg-transport">
          <button type="button" className="pbg-btn" onClick={scrollThrough}>{atEnd ? '↺ Scroll back' : '▶ Scroll through'}</button>
          <label className="pbg-scrub">
            <span>box scroll position</span>
            <input ref={slider} type="range" min={0} max={1000} step={1} defaultValue={0} aria-label="Preview scroll position" onChange={(e) => scrub(Number(e.target.value))} />
          </label>
          <p className="pbg-read">
            <span>{engine === 'css' ? 'animation progress' : '--scroll-progress'} <b ref={readP}>0.000</b></span>
            <span>scrollTop <b ref={readY}>0</b></span>
          </p>
        </div>
        {engine === 'css' && cssOk === false && (
          <p className="pbg-warn" role="status">
            This browser has no scroll-driven animations, so the CSS-only bar stays hidden here, as it would for your
            readers on it. The JavaScript and React versions work in it.
          </p>
        )}
        {colorBad && (
          <p className="pbg-warn" role="status">
            “{colorText.trim()}” is not a CSS colour, so the code keeps <code>currentColor</code>.
          </p>
        )}
      </div>

      <div className="pbg-code">
        <div className="pbg-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className="pbg-tab" onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="pbg-code-note">{note}</p>
        {files.map((f) => <CodeBox key={f.file} file={f.file}>{f.code}</CodeBox>)}
      </div>
    </div>
  );
}

/** The listings for a tab: markup, stylesheet and script, in the order you add them. */
function listings(s: Settings, tab: Tab): { file: string; code: string }[] {
  if (tab === 'css') return [{ file: 'index.html', code: html(s, 'css') }, { file: 'progress.css', code: css(s, 'css') }];
  if (tab === 'js') {
    return [
      { file: 'index.html', code: html(s, 'js') },
      { file: 'progress.css', code: css(s, 'js') },
      { file: 'main.js', code: js(s) },
    ];
  }
  return [
    { file: s.scope === 'page' ? 'ReadingProgress.tsx' : 'Article.tsx', code: react(s) },
    { file: 'progress.css', code: css(s, 'js') },
  ];
}

/** The bar or ring, with the preview's class names: the same markup as the listing. */
function Indicator({ s }: { s: Settings }) {
  if (s.style !== 'ring') return <div className="pbg-x-bar" aria-hidden="true" />;
  const { r } = ringGeometry(s.thickness);
  const c = RING.size / 2;
  return (
    <svg className="pbg-x-ring" width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`} aria-hidden="true">
      {s.track && <circle className="pbg-x-ring-track" cx={c} cy={c} r={r} />}
      <circle className="pbg-x-ring-fill" cx={c} cy={c} r={r} />
    </svg>
  );
}

/** A small line drawing in the sample article, so it has a figure like a real post. */
function PreviewFigure() {
  return (
    <svg className="pbg-art-fig" viewBox="0 0 320 96" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <line x1="16" y1="80" x2="304" y2="80" />
        <line x1="16" y1="16" x2="16" y2="80" />
        <polyline points="16,80 88,62 160,46 232,30 304,16" strokeWidth="2" />
        {[16, 88, 160, 232, 304].map((x) => <line key={x} x1={x} y1="80" x2={x} y2="84" />)}
      </g>
    </svg>
  );
}

/** A labelled control. `wide` takes the whole row on a phone, where the rest pair up. */
function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`pbg-field${wide ? ' is-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </div>
  );
}

/**
 * A segmented control with radio semantics, so it behaves like a radio group:
 * one tab stop (the checked option), and the arrow keys move the choice.
 */
function Seg({ value, options, hints, onChange, label }: {
  value: string; options: readonly string[]; hints?: string[]; onChange: (v: string) => void; label: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : step == null ? -1 : (i + step + options.length) % options.length;
    if (to < 0) return;
    e.preventDefault();
    onChange(options[to]);
    (e.currentTarget.parentElement?.children[to] as HTMLElement | undefined)?.focus();
  }
  return (
    <span className="pbg-seg" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o} type="button" role="radio" aria-checked={value === o} tabIndex={value === o ? 0 : -1}
          title={hints?.[i]} onClick={() => onChange(o)} onKeyDown={(e) => onKeyDown(e, i)}
        >
          {o}
        </button>
      ))}
    </span>
  );
}
