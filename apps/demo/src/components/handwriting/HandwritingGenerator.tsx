'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import type { ScrollDrawOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { fmt, toDom, type Tree } from '@/components/linedraw/generate';
import { downloadText } from '@/lib/tool-export';
import {
  COLOURS, DEFAULTS, FADE, HOLD, LIMITS, OUTPUTS, SCROLL_END, SCROLL_START, SLUG, buildOutput, htmlPage, reactApp,
  type ColourMode, type Output, type OutputKey, type Settings,
} from './code';
import { FONTS, MAX_CHARS, type FontKey } from './layout';

/**
 * The handwriting animation generator.
 *
 * - The text is set in a Hershey single-stroke font (layout.ts), so each path
 *   is a pen stroke, drawn once, in writing order.
 * - The preview is the generated SVG itself, built as elements with its own
 *   <style>, under its own class and keyframe names (an inline SVG's <style>
 *   applies to the whole page), as the line drawing generator does. Its CSS
 *   animations wait at 0 until the line is on screen; Replay restarts them
 *   and the slider sets their currentTime. Reduced motion stops them through
 *   the output's own media query, and the preview shows the finished line.
 * - The scroll version is scrollDraw in a small box of its own (its
 *   scrollContainer option), so it scrolls without the page moving.
 * - The Run it row saves or opens one page with both versions in it.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;

const PREVIEW_NAME = 'hwg-pv';
const RM = '(prefers-reduced-motion: reduce)';

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(RM);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(RM).matches,
    () => false,
  );
}

export function HandwritingGenerator({ version }: { version: string }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [tab, setTab] = useState<OutputKey>('file');
  const reduced = useReducedMotion();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const out = useMemo(() => buildOutput(s, PREVIEW_NAME), [s]);
  const html = useMemo(() => htmlPage(out, version), [out, version]);
  const app = useMemo(() => reactApp(out.plan, s, out.scroll), [out, s]);
  const laid = out.plan.laid;
  const empty = laid.strokes.length === 0;

  function download() {
    downloadText('handwriting.svg', `${out.file}\n`, 'image/svg+xml');
  }

  const range = (k: keyof typeof LIMITS, label: string, aria: string) => {
    const [min, max, step] = LIMITS[k];
    return (
      <Field label={label}>
        <input
          type="range" min={min} max={max} step={step} value={s[k]} aria-label={aria}
          onChange={(e) => set(k, Number(e.target.value))}
        />
      </Field>
    );
  };

  return (
    <div className="hwg">
      <div className="hwg-panel">
        <label className="hwg-input">
          <span>Your text · a name, a signature, a short phrase (up to {MAX_CHARS} characters)</span>
          <input
            type="text" value={s.text} maxLength={MAX_CHARS} spellCheck={false} autoComplete="off"
            onChange={(e) => set('text', e.target.value)}
          />
        </label>

        <div className="hwg-controls">
          <div className="hwg-grid">
            <Field label="font" wide>
              <Seg value={s.font} options={FONTS} onChange={(v) => set('font', v as FontKey)} label="Font" />
            </Field>
            {range('size', `size · ${s.size}px`, 'Size: pixels to the em')}
            {range('width', `stroke width · ${fmt(s.width, 2)}px`, 'Stroke width, in pixels')}
            {range('duration', `duration · ${fmt(s.duration, 1)}s of ink`, 'Duration: seconds the pen spends drawing, without the pauses')}
            {range('stagger', `letter stagger · ${fmt(s.stagger, 2)}s`, 'Letter stagger: seconds the pen lifts between letters')}
            {range('wordPause', `word pause · ${fmt(s.wordPause, 2)}s`, 'Word pause: seconds the pen lifts at a space')}
            <Field label={s.loop ? `loop · hold ${HOLD}s, fade ${FADE}s` : 'loop'}>
              <Seg
                value={s.loop ? 'on' : 'off'}
                options={[['off', 'off'], ['on', 'on']] as const}
                onChange={(v) => set('loop', v === 'on')}
                label="Loop"
              />
            </Field>
            <Field label="colour" wide>
              <span className="hwg-pair">
                <Seg value={s.colour} options={COLOURS} onChange={(v) => set('colour', v as ColourMode)} label="Stroke colour" />
                <input
                  type="color" value={s.ink} disabled={s.colour !== 'custom'}
                  aria-label="Ink colour to use" onChange={(e) => set('ink', e.target.value)}
                />
              </span>
            </Field>
            <Field label="settings">
              <span className="hwg-pair">
                <button type="button" className="hwg-btn" onClick={() => setS(DEFAULTS)}>Reset</button>
              </span>
            </Field>
          </div>
        </div>

        {empty ? (
          <p className="hwg-error" role="alert">Type some letters: there is nothing to write yet.</p>
        ) : (
          <Preview out={out} loop={s.loop} reduced={reduced} />
        )}
      </div>

      {laid.missing.length > 0 && (
        <ul className="hwg-notes" aria-label="Checks">
          <li>
            Left out, not in the font: {laid.missing.map((c) => `“${c}”`).join(' ')}. The Hershey fonts have the 95
            printable ASCII characters; accents are dropped (é is written e) and curly quotes and dashes are straightened.
          </li>
        </ul>
      )}

      {!empty && (
        <div className="hwg-code">
          <div className="hwg-code-bar">
            <div className="hwg-tabs" role="tablist" aria-label="Output">
              {OUTPUTS.map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className="hwg-tab" onClick={() => setTab(k)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="hwg-btn hwg-dl" onClick={download}>↓ Download .svg</button>
          </div>
          <div className="hwg-out" role="tabpanel" aria-label={OUTPUTS.find(([k]) => k === tab)?.[1]}>
            {tab === 'file' && (
              <>
                <CodeBox file="handwriting.svg">{out.file}</CodeBox>
                <p className="hwg-legend">
                  One file, no JavaScript: open it, use it as an {'<img>'}, or paste it inline. As an image,
                  currentColor is black, so pick a colour above; inline, it follows the text colour. With reduced
                  motion asked for, it shows the finished line.
                </p>
              </>
            )}
            {tab === 'scroll' && (
              <>
                <ScrollPreview tree={out.previewScroll} options={out.scroll.options} />
                <CodeBox file="main.js">{out.scroll.code}</CodeBox>
                <CodeBox file="signature.html">{out.scrollMarkup}</CodeBox>
                <p className="hwg-legend">
                  The markup has no pathLength: scrollDraw measures every stroke itself, and pathLength=“1” would
                  scale its dash up and show the whole line at once. Each stroke gets an equal stretch of the scroll;
                  the pen speed and the pauses belong to the timed version. Under reduced motion scrollDraw shows the
                  line written.
                </p>
              </>
            )}
            {tab === 'react' && (
              <>
                <CodeBox file="Signature.jsx">{out.react}</CodeBox>
                <p className="hwg-legend">
                  The scroll version as a component, on <Link href="/docs#react">{'<ScrollDraw>'}</Link> from
                  svg-scroll-draw/react. For the timed version in React, save the SVG file and use it as an{' '}
                  {'<img src="/handwriting.svg" alt="…" />'}: the animation is inside the file.
                </p>
              </>
            )}
          </div>
          <ToolExport
            title="Handwriting animation"
            filename="handwriting.html"
            html={html}
            react={{ slug: SLUG, app: app.app, css: app.css, version }}
          />
        </div>
      )}
    </div>
  );
}

// ── The preview: the generated CSS animation, played and scrubbed ──────────

function Preview({ out, loop, reduced }: { out: Output; loop: boolean; reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const restart = useRef<() => void>(() => {});
  const [t, setT] = useState(0);
  const span = loop ? out.plan.cycle : out.plan.run;
  const strokes = out.plan.laid.strokes.length;
  const letters = out.plan.laid.letters;

  const anims = () => {
    const svg = host.current?.querySelector('svg');
    return svg ? svg.getAnimations({ subtree: true }) : [];
  };

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    box.replaceChildren(toDom(out.preview));
    const query = () => box.querySelector('svg')?.getAnimations({ subtree: true })[0];
    let first = query();
    let raf = 0;
    // Follow the clock while the animations run: the time since they started.
    const tick = () => {
      if (!first || first.playState === 'idle') first = query();
      const tl = document.timeline.currentTime;
      if (!first || first.playState === 'paused' || first.playState === 'idle' || tl === null) return;
      const startTime = first.startTime;
      const sec = startTime === null ? 0 : (Number(tl) - Number(startTime)) / 1000;
      const more = loop || sec < span;
      setT(more ? (loop ? sec % span : sec) : span);
      if (more) raf = requestAnimationFrame(tick);
    };
    restart.current = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    // Held at the start until the line is on screen, then played once.
    const all = box.querySelector('svg')?.getAnimations({ subtree: true }) ?? [];
    for (const a of all) {
      a.pause();
      a.currentTime = 0;
    }
    const seen = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      seen.disconnect();
      for (const a of all) a.play();
      setT(0);
      restart.current();
    });
    seen.observe(box);
    return () => {
      seen.disconnect();
      cancelAnimationFrame(raf);
      restart.current = () => {};
      box.replaceChildren();
    };
    // Rebuilt when reduced motion changes, so the clock follows the animations it brings back.
  }, [out, loop, span, reduced]);

  function replay() {
    for (const a of anims()) {
      a.currentTime = 0;
      a.play();
    }
    restart.current();
  }

  function scrub(v: number) {
    for (const a of anims()) {
      a.pause();
      a.currentTime = v * 1000;
    }
    setT(v);
  }

  return (
    <>
      <div className="hwg-stage">
        <div ref={host} className="hwg-host" />
      </div>
      <div className="hwg-transport">
        <button type="button" className="hwg-btn" onClick={replay} disabled={reduced}>↻ Replay</button>
        <label className="hwg-scrub">
          <span>
            {reduced ? 'reduced motion is on · shown written' : `time · ${Math.min(t, span).toFixed(2)}s of ${span.toFixed(2)}s${loop ? ' · one loop' : ''}`}
          </span>
          <input
            type="range" min={0} max={span} step={0.01} value={reduced ? span : Math.min(t, span)} disabled={reduced}
            aria-label="Time in the animation, in seconds" onChange={(e) => scrub(Number(e.target.value))}
          />
        </label>
        <p className="hwg-count">{strokes} {strokes === 1 ? 'stroke' : 'strokes'} · {letters} {letters === 1 ? 'letter' : 'letters'}</p>
      </div>
    </>
  );
}

// ── The scroll version, live in a box that scrolls ──────────────────────────

function ScrollPreview({ tree, options }: { tree: Tree; options: ScrollDrawOptions }) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = box.current;
    const h = host.current;
    if (!b || !h) return;
    h.replaceChildren(toDom(tree));
    let live = true;
    let inst: Instance | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      inst = scrollDraw(h, { ...options, scrollContainer: b });
    });
    return () => {
      live = false;
      inst?.destroy();
      h.replaceChildren();
    };
  }, [tree, options]);

  return (
    <div className="hwg-scroll">
      <p className="hwg-scroll-k">
        <span>On scroll · scrollDraw with these options</span>
        <span>starts {SCROLL_START}% down the box · done at {SCROLL_END}%</span>
      </p>
      <div ref={box} className="hwg-sbox" tabIndex={0} role="region" aria-label="Scroll inside this box to write the scroll version">
        <div className="hwg-spacer"><p className="hwg-shint">Scroll down in this box ↓<br />the line writes as it rises</p></div>
        <div ref={host} className="hwg-shost" />
        <div className="hwg-spacer"><p className="hwg-shint">Scroll back up ↑<br />and it unwrites</p></div>
      </div>
    </div>
  );
}

// ── Small parts ─────────────────────────────────────────────────────────────

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`hwg-field${wide ? ' is-wide' : ''}`}>
      <span className="hwg-field-k">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange, label }: {
  value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <span className="hwg-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </span>
  );
}
