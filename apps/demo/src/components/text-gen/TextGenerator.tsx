'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ScrollTextOptions } from 'svg-scroll-draw/text';
import { CodeBox } from '@/components/site/CodeBox';
import {
  TEXT_DEFAULTS, TEXT_EASINGS, TEXT_EFFECTS, TEXT_SPLITS, maxStagger, type TextFrom, type TextSplit,
} from '@/data/text-effects';

/**
 * The text animation generator. Everything it shows is scrollText itself:
 *
 * - The preview is a scrollText instance driven by seek(): the scrub slider
 *   sets the progress directly, and Play runs it from 0 to 1. On a page the
 *   same progress comes from the scroll position instead.
 * - "On real scroll" below runs the same options with no seek(), as a page
 *   would: it animates as it crosses the trigger window.
 * - The code is generated from the same state, with every option that is at
 *   scrollText's default left out.
 *
 * scrollText rewrites its element's children, so each instance gets an element
 * made here by hand, never one React renders and would try to reconcile.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw/text').scrollText>;
type Settings = { text: string; split: TextSplit; effect: string; stagger: number; easing: string; once: boolean };

const INITIAL: Settings = {
  text: 'Every word arrives as you scroll',
  split: 'words',
  effect: 'fade-up',
  stagger: 0.08,
  easing: 'ease-out',
  once: true,
};
const PLAY_MS = 1400;
const MAX_TEXT = 140;

function optionsOf(s: Settings): ScrollTextOptions {
  const from = TEXT_EFFECTS.find((e) => e.key === s.effect)?.from ?? TEXT_DEFAULTS.from;
  return { split: s.split, stagger: s.stagger, easing: s.easing as ScrollTextOptions['easing'], from, once: s.once };
}

/** Make a fresh element in `host`, run scrollText on it, report its piece count. */
function useScrollText(
  host: React.RefObject<HTMLDivElement | null>,
  tag: 'p' | 'h2',
  s: Settings,
  onPieces?: (n: number) => void,
): React.RefObject<Instance | null> {
  const inst = useRef<Instance | null>(null);
  useEffect(() => {
    const box = host.current;
    if (!box) return;
    let live = true;
    const el = document.createElement(tag);
    el.className = 'tg-text';
    el.textContent = s.text || ' ';
    box.replaceChildren(el);
    import('svg-scroll-draw/text').then(({ scrollText }) => {
      if (!live) return;
      inst.current = scrollText(el, optionsOf(s));
      const pieces = [...el.querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].filter((p) => p.style.whiteSpace !== 'pre');
      onPieces?.(pieces.length);
    });
    return () => {
      live = false;
      inst.current?.destroy();
      inst.current = null;
      box.replaceChildren();
    };
    // Re-create on any setting: split and text change the pieces themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.text, s.split, s.effect, s.stagger, s.easing, s.once]);
  return inst;
}

export function TextGenerator() {
  const [s, setS] = useState<Settings>(INITIAL);
  const [pieces, setPieces] = useState(0);
  const [progress, setProgress] = useState(1);
  const [tab, setTab] = useState<'js' | 'react'>('js');
  const previewHost = useRef<HTMLDivElement>(null);
  const liveHost = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const preview = useScrollText(previewHost, 'p', s, setPieces);
  useScrollText(liveHost, 'h2', s);

  /** Run the preview from 0 to 1, as if the reader scrolled through the trigger window. */
  function play() {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / PLAY_MS);
      preview.current?.seek(p);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  // A new setting rebuilds the preview: play it once so the change is visible.
  useEffect(() => {
    const id = setTimeout(play, 80);
    return () => { clearTimeout(id); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  function scrub(p: number) {
    cancelAnimationFrame(raf.current);
    preview.current?.seek(p);
    setProgress(p);
  }

  const cap = maxStagger(pieces);
  const tooMuch = pieces > 1 && s.stagger >= cap;
  const code = useMemo(() => (tab === 'js' ? jsCode(s) : reactCode(s)), [s, tab]);

  return (
    <div className="tg">
      <div className="tg-panel">
        <div className="tg-controls">
          <Field label="Text" wide>
            <input
              type="text"
              value={s.text}
              maxLength={MAX_TEXT}
              aria-label="Text to animate"
              onChange={(e) => set('text', e.target.value)}
            />
          </Field>
          <Field label="split">
            <Seg value={s.split} options={TEXT_SPLITS} onChange={(v) => set('split', v as TextSplit)} label="Split" />
          </Field>
          <Field label="from">
            <select value={s.effect} aria-label="Effect" onChange={(e) => set('effect', e.target.value)}>
              {TEXT_EFFECTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </Field>
          <Field label="easing">
            <select value={s.easing} aria-label="Easing" onChange={(e) => set('easing', e.target.value)}>
              {TEXT_EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <Field label={`stagger · ${s.stagger.toFixed(2)}`}>
            <input
              type="range" min={0} max={0.3} step={0.01} value={s.stagger}
              aria-label="Stagger" onChange={(e) => set('stagger', Number(e.target.value))}
            />
          </Field>
          <Field label="once">
            <Seg value={s.once ? 'true' : 'false'} options={['true', 'false']} onChange={(v) => set('once', v === 'true')} label="Once" />
          </Field>
        </div>

        <div className="tg-stage">
          <div ref={previewHost} className="tg-host" />
        </div>
        <div className="tg-transport">
          <button type="button" className="tg-btn" onClick={play}>▶ Play</button>
          <label className="tg-scrub">
            <span>progress · {progress.toFixed(2)}</span>
            <input type="range" min={0} max={1} step={0.01} value={progress} aria-label="Scroll progress" onChange={(e) => scrub(Number(e.target.value))} />
          </label>
          <p className="tg-count">{pieces} {s.split === 'chars' ? 'characters' : s.split}</p>
        </div>
        {tooMuch && (
          <p className="tg-warn" role="status">
            With {pieces} pieces, a stagger of {cap.toFixed(2)} or more leaves each one no time to move, so they pop on
            instead of animating. Try {Math.max(0, Math.floor(cap * 0.8 * 100) / 100).toFixed(2)} or less.
          </p>
        )}
      </div>

      <div className="tg-code">
        <div className="tg-tabs" role="tablist" aria-label="Code">
          {(['js', 'react'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="tg-tab" onClick={() => setTab(t)}>
              {t === 'js' ? 'JavaScript' : 'React'}
            </button>
          ))}
        </div>
        <CodeBox file={tab === 'js' ? 'main.js' : 'Headline.tsx'}>{code}</CodeBox>
      </div>

      <div className="tg-live">
        <p className="tg-live-k">On real scroll · the same settings, no seek()</p>
        <div ref={liveHost} className="tg-live-host" />
        <p className="tg-live-note">
          This one is driven by the page: it starts when its top reaches 85% of the window and finishes at 40%.
        </p>
      </div>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`tg-field${wide ? ' is-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="tg-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}

// ── The generated code ───────────────────────────────────────────────────────

/** The options that differ from scrollText's defaults, as code lines. */
function changed(s: Settings): string[] {
  const from = TEXT_EFFECTS.find((e) => e.key === s.effect)?.from ?? TEXT_DEFAULTS.from;
  const out: string[] = [];
  if (s.split !== TEXT_DEFAULTS.split) out.push(`split: '${s.split}'`);
  if (s.stagger !== TEXT_DEFAULTS.stagger) out.push(`stagger: ${s.stagger}`);
  if (s.easing !== TEXT_DEFAULTS.easing) out.push(`easing: '${s.easing}'`);
  if (!sameFrom(from, TEXT_DEFAULTS.from)) out.push(`from: ${fromLiteral(from)}`);
  if (s.once !== TEXT_DEFAULTS.once) out.push(`once: ${s.once}`);
  return out;
}

const sameFrom = (a: TextFrom, b: TextFrom) => JSON.stringify(a) === JSON.stringify(b);
const fromLiteral = (f: TextFrom) => `{ ${Object.entries(f).map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
const text = (s: Settings) => (s.text || 'Your text').replace(/[<>{}]/g, '');

function jsCode(s: Settings): string {
  const opts = changed(s);
  const call = opts.length
    ? `scrollText('#headline', {\n${opts.map((o) => `  ${o},`).join('\n')}\n});`
    : `scrollText('#headline');`;
  return `// <h2 id="headline">${text(s)}</h2>

import { scrollText } from 'svg-scroll-draw/text';

${call}`;
}

function reactCode(s: Settings): string {
  const opts = changed(s).map((o) => {
    const [k, ...rest] = o.split(': ');
    const v = rest.join(': ');
    return v.startsWith("'") ? `${k}="${v.slice(1, -1)}"` : `${k}={${v}}`;
  });
  const props = ['as="h2"', ...opts];
  return `import { ScrollText } from 'svg-scroll-draw/react';

export function Headline() {
  return (
    <ScrollText
${props.map((p) => `      ${p}`).join('\n')}
    >
      ${text(s)}
    </ScrollText>
  );
}`;
}
