'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { downloadText } from '@/lib/tool-export';
import {
  FILL_TABS, LINE_TABS, MAX_LAYERS, RANGE, RUN, SMOOTHS, TOKENS, WIDTH, buildWave, htmlPage, isColour, layerFrame,
  listing, num, reactProject, svgFile, wavelength, type PageColours, type Smooth, type Tab, type Token, type WaveSettings,
} from './wave';

/**
 * The SVG wave generator.
 *
 * - Everything drawn comes from wave.ts: points from the settings and a seeded
 *   generator, a curve through them, cut to exactly 0..WIDTH.
 * - Fill mode is a static SVG, rendered by React: one closed path per layer.
 * - Line mode draws the edges with scrollDraw, the library this site is
 *   about. The SVG is made here by hand (scrollDraw writes the paths' dash
 *   styles, so React never reconciles them), and the instance is driven only
 *   by seek(): Play runs it 0 → 1, the slider scrubs it. Autoplay with
 *   `duration: 1` and `once` makes the library's own run on entering the
 *   screen a single frame, and onComplete puts the drawing back where the
 *   slider is (the easing visualizer's trick). Autoplay's seek() spans a
 *   staggered run, where a scroll-mode seek() gives every path the same
 *   progress, so the stagger shows.
 * - Colours: a swatch is one of the site's neutral tokens, shown as var() and
 *   written into the code as the value it has in the theme on screen, read
 *   from the page's CSS. Typed text is used only when isColour() accepts it.
 * - Every listing starts with the source line (wave.ts `listing`), and the Run
 *   it row under the code saves or opens a page with the wave in it, on the
 *   preview's background, importing svg-scroll-draw `version` from jsDelivr.
 */

type Instance = ReturnType<typeof import('svg-scroll-draw').scrollDraw>;

const INITIAL: WaveSettings = {
  mode: 'fill',
  layers: 3,
  amplitude: 0.7,
  waves: 2.5,
  smooth: 'curved',
  tension: 0,
  steps: 8,
  variation: 0.45,
  seed: 2026,
  flipX: false,
  flipY: false,
  height: 200,
  strokeWidth: 4,
  stagger: 0.15,
  plays: 'scroll',
  finish: 'leave',
};
/** Colours from the front layer back: the front is the next section's colour. */
const INITIAL_PICKS: Token[] = ['fg', 'fg-3', 'line-2', 'line'];
const PLAY_MS = 1600;
const NS = 'http://www.w3.org/2000/svg';
/** The run-it page's colours until the theme's are read: the light theme's panel and text. */
const LIGHT_PAGE: PageColours = { bg: '#f8f6f1', fg: '#121110' };

// ── What the page and the system say ────────────────────────────────────────

/**
 * The neutral tokens' values in the theme on screen, '|'-joined; '' on the
 * server. The theme is a class on <html>, so the read is kept until it changes.
 */
let tokenCache: { key: string; value: string } | null = null;
function readTokens(): string {
  const key = document.documentElement.className;
  if (tokenCache?.key === key) return tokenCache.value;
  const root = document.querySelector('.home') ?? document.documentElement;
  const cs = getComputedStyle(root);
  const value = TOKENS.map((t) => cs.getPropertyValue(`--${t}`).trim()).join('|');
  // Not cached while the tokens are missing (styles still loading).
  if (value.replace(/\|/g, '')) tokenCache = { key, value };
  return value;
}
function watchTheme(cb: () => void): () => void {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => { mo.disconnect(); mq.removeEventListener('change', cb); };
}
const REDUCED = '(prefers-reduced-motion: reduce)';
function watchMotion(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const supportsColour = (v: string) => typeof CSS !== 'undefined' && CSS.supports('color', v);

// ── The component ───────────────────────────────────────────────────────────

export function WaveGenerator({ version }: { version: string }) {
  const [s, setS] = useState<WaveSettings>(INITIAL);
  const [seedText, setSeedText] = useState(String(INITIAL.seed));
  const [picks, setPicks] = useState<Token[]>(INITIAL_PICKS);
  const [texts, setTexts] = useState<string[]>(['', '', '', '']);
  const [tab, setTab] = useState<Tab>('svg');
  const [narrow, setNarrow] = useState(false);
  const [progress, setProgress] = useState(1);
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const progressRef = useRef(1);
  const playOnBuild = useRef(false);
  const raf = useRef(0);
  const id = useId();

  const tokenLine = useSyncExternalStore(watchTheme, readTokens, () => '');
  const still = useSyncExternalStore(watchMotion, () => window.matchMedia(REDUCED).matches, () => false);
  const tokenValues = useMemo(() => {
    const v = tokenLine.split('|');
    return tokenLine ? Object.fromEntries(TOKENS.map((t, i) => [t, v[i] ?? ''])) as Record<Token, string> : null;
  }, [tokenLine]);

  const set = <K extends keyof WaveSettings>(k: K, v: WaveSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  const layers = useMemo(() => buildWave(s), [s]);

  /** Each layer's colour, back first: for the preview (var() allowed) and for the code (a value, or null until read). */
  const colours = useMemo(() => {
    return Array.from({ length: s.layers }, (_, i) => {
      const slot = s.layers - 1 - i;
      const text = texts[slot].trim();
      const typed = text !== '' && isColour(text, supportsColour);
      const token = picks[slot];
      const tokenValue = tokenValues?.[token] ?? '';
      return {
        slot,
        token,
        typed,
        bad: text !== '' && !typed ? text : '',
        css: typed ? text : `var(--${token})`,
        value: typed ? text : (tokenValue && isColour(tokenValue, supportsColour) ? tokenValue : null),
      };
    });
  }, [s.layers, texts, picks, tokenValues]);
  const values = colours.every((c) => c.value) ? colours.map((c) => c.value as string) : null;
  /** The preview's background and text, for the page the Run it row writes. */
  const page = useMemo<PageColours>(() => {
    const bg = tokenValues?.panel ?? '';
    const fg = tokenValues?.fg ?? '';
    return isColour(bg, supportsColour) && isColour(fg, supportsColour) ? { bg, fg } : LIGHT_PAGE;
  }, [tokenValues]);

  // ── Line mode: a scrollDraw instance on the edges, driven by seek() ──────

  const lineSpec = useMemo(
    () => (s.mode === 'line'
      ? { lines: layers.map((l) => l.line), strokes: colours.map((c) => c.css), sw: s.strokeWidth, h: s.height, stagger: s.layers > 1 ? s.stagger : 0 }
      : null),
    [s.mode, s.strokeWidth, s.height, s.layers, s.stagger, layers, colours],
  );

  useEffect(() => {
    const box = host.current;
    if (!box || !lineSpec) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${num(lineSpec.h)}`);
    svg.setAttribute('class', 'wv-line-svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-width', num(lineSpec.sw));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `The wave’s ${lineSpec.lines.length === 1 ? 'line' : `${lineSpec.lines.length} lines`}, drawn by scrollDraw`);
    lineSpec.lines.forEach((d, i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.style.stroke = lineSpec.strokes[i];
      svg.appendChild(p);
    });
    box.replaceChildren(svg);

    let live = true;
    let mine: Instance | null = null;
    import('svg-scroll-draw').then(({ scrollDraw }) => {
      if (!live) return;
      mine = scrollDraw(box, {
        autoplay: true,
        duration: 1,
        once: true,
        stagger: lineSpec.stagger,
        onComplete: () => mine?.seek(progressRef.current),
      });
      mine.seek(progressRef.current);
      inst.current = mine;
      if (playOnBuild.current) {
        playOnBuild.current = false;
        play();
      }
    }).catch(() => { /* the line stays drawn, as it is before the library loads */ });
    return () => {
      live = false;
      cancelAnimationFrame(raf.current);
      mine?.destroy();
      if (inst.current === mine) inst.current = null;
      box.replaceChildren();
    };
    // play() only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineSpec]);

  function moveTo(p: number) {
    progressRef.current = p;
    inst.current?.seek(p);
    setProgress(p);
  }

  /** Run progress from 0 to 1 at an even speed, as an even scroll would. */
  function play() {
    cancelAnimationFrame(raf.current);
    if (window.matchMedia(REDUCED).matches) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / PLAY_MS));
      moveTo(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function setMode(mode: WaveSettings['mode']) {
    if (mode === s.mode) return;
    if (mode === 'line') playOnBuild.current = true;
    else cancelAnimationFrame(raf.current);
    set('mode', mode);
  }

  function setSeed(text: string) {
    setSeedText(text);
    const v = Number(text);
    if (/^\d+$/.test(text.trim()) && v >= RANGE.seed[0] && v <= RANGE.seed[1]) set('seed', v);
  }

  function shuffle() {
    const v = RANGE.seed[0] + Math.floor(Math.random() * (RANGE.seed[1] - RANGE.seed[0] + 1));
    setSeedText(String(v));
    set('seed', v);
  }

  function pick(slot: number, t: Token) {
    setPicks((p) => p.map((x, i) => (i === slot ? t : x)));
    setTexts((p) => p.map((x, i) => (i === slot ? '' : x)));
  }

  function type(slot: number, v: string) {
    setTexts((p) => p.map((x, i) => (i === slot ? v.slice(0, 64) : x)));
  }

  function download() {
    if (values) downloadText(s.mode === 'fill' ? 'wave.svg' : 'wave-line.svg', listing('svg', s, layers, values), 'image/svg+xml');
  }

  // ── The code ─────────────────────────────────────────────────────────────

  const tabs = s.mode === 'fill' ? FILL_TABS : LINE_TABS;
  const active = tabs.find(([k]) => k === tab) ?? tabs[0];
  const code = useMemo(() => (values ? listing(active[0], s, layers, values) : '…'), [active, s, layers, values]);
  const run = useMemo(
    () => (values
      ? { html: htmlPage(s, layers, values, page, version), react: reactProject(s, layers, values, page, version) }
      : null),
    [s, layers, values, page, version],
  );
  const bytes = values ? svgFile(s, layers, values).length : 0;

  const front = layerFrame(s, s.layers - 1);
  const lambda = wavelength(s.waves);
  const label = (i: number) => (s.layers === 1 ? 'wave' : i === s.layers - 1 ? 'front' : i === 0 ? 'back' : `layer ${i + 1}`);
  const bad = colours.filter((c) => c.bad);

  return (
    <div className="wv">
      <div className="wv-panel">
        <div className="wv-controls">
          <Field label="output">
            <Seg value={s.mode} options={['fill', 'line']} onChange={(v) => setMode(v as WaveSettings['mode'])} label="Output" />
          </Field>
          <Field label="layers">
            <Seg
              value={String(s.layers)}
              options={Array.from({ length: MAX_LAYERS }, (_, i) => String(i + 1))}
              onChange={(v) => set('layers', Number(v))}
              label="Layers"
            />
          </Field>
          <Field label="shape">
            <Seg value={s.smooth} options={SMOOTHS} onChange={(v) => set('smooth', v as Smooth)} label="Shape" />
          </Field>
          <Range
            label={`amplitude · ${num(front.A)}`}
            aria="Amplitude"
            min={0} max={1} step={0.01} value={s.amplitude}
            onChange={(v) => set('amplitude', v)}
          />
          <Range
            label={`waves · ${s.waves} · λ ${num(lambda)}`}
            aria="Waves across the width"
            min={RANGE.waves[0]} max={RANGE.waves[1]} step={0.5} value={s.waves}
            onChange={(v) => set('waves', v)}
          />
          {s.smooth === 'curved' && (
            <Range
              label={`tension · ${s.tension.toFixed(2)}`}
              aria="Tension"
              min={0} max={1} step={0.05} value={s.tension}
              onChange={(v) => set('tension', v)}
            />
          )}
          {s.smooth === 'steps' && (
            <Range
              label={`steps per wave · ${s.steps}`}
              aria="Steps per wave"
              min={RANGE.steps[0]} max={RANGE.steps[1]} step={2} value={s.steps}
              onChange={(v) => set('steps', v)}
            />
          )}
          {s.smooth === 'peaks' && (
            <Field label="tension">
              <p className="wv-hint">Peaks are straight lines between the points: tension 1.</p>
            </Field>
          )}
          <Range
            label={`variation · ${s.variation.toFixed(2)}`}
            aria="Variation"
            min={0} max={1} step={0.01} value={s.variation}
            onChange={(v) => set('variation', v)}
          />
          <div className="wv-field">
            <label className="wv-field-k" htmlFor={`${id}-seed`}>seed</label>
            <span className="wv-pair">
              <input
                id={`${id}-seed`}
                className="wv-text"
                type="text"
                inputMode="numeric"
                value={seedText}
                aria-describedby={`${id}-hint`}
                onChange={(e) => setSeed(e.target.value)}
              />
              <button type="button" className="wv-btn" onClick={shuffle}>Shuffle</button>
            </span>
            <span id={`${id}-hint`} className="wv-hint">
              {s.variation === 0 ? 'variation is 0: the seed changes nothing' : 'same seed, same wave'}
            </span>
          </div>
          <Range
            label={`height · ${s.height}`}
            aria="Height"
            min={RANGE.height[0]} max={RANGE.height[1]} step={4} value={s.height}
            onChange={(v) => set('height', v)}
          />
          <Field label="flip">
            <span className="wv-pair">
              <button type="button" className="wv-toggle" aria-pressed={s.flipY} onClick={() => set('flipY', !s.flipY)}>↕ vertical</button>
              <button type="button" className="wv-toggle" aria-pressed={s.flipX} onClick={() => set('flipX', !s.flipX)}>↔ horizontal</button>
            </span>
          </Field>
          {s.mode === 'line' && (
            <>
              <Range
                label={`stroke width · ${s.strokeWidth}`}
                aria="Stroke width"
                min={RANGE.strokeWidth[0]} max={RANGE.strokeWidth[1]} step={1} value={s.strokeWidth}
                onChange={(v) => set('strokeWidth', v)}
              />
              <Field label="draws">
                <Seg
                  value={s.plays}
                  options={['scroll', 'seen']}
                  labels={['with scroll', 'once, seen']}
                  onChange={(v) => set('plays', v as WaveSettings['plays'])}
                  label="When it draws"
                />
              </Field>
              <Field label="done">
                <Seg
                  value={s.finish}
                  options={['leave', 'middle']}
                  labels={['leaving', 'mid-screen']}
                  onChange={(v) => set('finish', v as WaveSettings['finish'])}
                  label="Where the drawing finishes"
                  disabled={s.plays === 'seen'}
                />
              </Field>
              {s.layers > 1 && (
                <Range
                  label={`stagger · ${s.stagger.toFixed(2)}`}
                  aria="Stagger"
                  min={RANGE.stagger[0]} max={RANGE.stagger[1]} step={0.05} value={s.stagger}
                  onChange={(v) => set('stagger', v)}
                />
              )}
            </>
          )}
        </div>

        <div className="wv-colours" role="group" aria-label="Colours">
          {colours.map((c, i) => {
            const name = label(i);
            return (
              <div key={c.slot} className="wv-colour">
                <span className="wv-colour-k" id={`${id}-c${c.slot}`}>
                  {name}
                  <span>{c.typed ? 'typed' : `--${c.token}`}{c.value ? ` · ${c.value}` : ''}</span>
                </span>
                <span className="wv-swatches" role="radiogroup" aria-labelledby={`${id}-c${c.slot}`}>
                  {TOKENS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={!c.typed && c.token === t}
                      aria-label={`--${t}`}
                      title={`--${t}${tokenValues ? ` · ${tokenValues[t]}` : ''}`}
                      style={{ background: `var(--${t})` }}
                      onClick={() => pick(c.slot, t)}
                    />
                  ))}
                </span>
                <input
                  className="wv-text"
                  type="text"
                  value={texts[c.slot]}
                  placeholder="or any CSS colour"
                  spellCheck={false}
                  aria-label={`${name}: any CSS colour`}
                  aria-invalid={c.bad ? true : undefined}
                  onChange={(e) => type(c.slot, e.target.value)}
                />
              </div>
            );
          })}
          {bad.length > 0 && (
            <p className="wv-warn" role="status">
              {bad.map((c) => `“${c.bad}”`).join(', ')} {bad.length === 1 ? 'is' : 'are'} not a colour the SVG can carry, so
              the swatch is used. Any CSS colour works (#3056d3, rgb(48 86 211 / 60%), oklch(55% 0.2 265)); var(),
              currentColor and inherit do not, because a CSS background cannot see the page.
            </p>
          )}
          <p className="wv-hint">
            Swatches are this site’s neutral colours in the theme you are viewing; the code writes their values.
          </p>
        </div>

        <div className={`wv-stage${narrow ? ' is-narrow' : ''}`}>
          {s.mode === 'fill' ? (
            <div className={`wv-frame${s.flipY ? ' is-flipped' : ''}`}>
              <svg
                className="wv-svg"
                viewBox={`0 0 ${WIDTH} ${num(s.height)}`}
                preserveAspectRatio="none"
                width="100%"
                height={s.height}
                role="img"
                aria-label={`A ${s.layers === 1 ? 'wave' : `${s.layers}-layer wave`}, ${s.height} units tall, ${s.waves} waves across`}
              >
                {layers.map((l, i) => <path key={i} d={l.fill} style={{ fill: colours[i].css }} />)}
              </svg>
              <div className="wv-next" style={{ background: colours[colours.length - 1].css }} aria-hidden="true" />
            </div>
          ) : (
            <div ref={host} className="wv-host" />
          )}
        </div>

        <div className="wv-transport">
          {s.mode === 'line' && (
            <>
              <button type="button" className="wv-btn" onClick={play} disabled={still}>▶ Play</button>
              <label className="wv-scrub">
                <span>{still ? 'reduced motion is on · shown drawn' : `progress · ${progress.toFixed(2)}`}</span>
                <input
                  type="range" min={0} max={1} step={0.01} value={progress} disabled={still}
                  aria-label="Drawing progress"
                  onChange={(e) => { cancelAnimationFrame(raf.current); moveTo(Number(e.target.value)); }}
                />
              </label>
            </>
          )}
          <p className="wv-read">
            {[`viewBox 0 0 ${WIDTH} ${s.height}`, `λ ${num(lambda)}`, `A ${num(front.A)}`, bytes ? `${(bytes / 1024).toFixed(1)} KB` : '…']
              .map((t, i) => <span key={i}>{i ? ' · ' : ''}<span>{t}</span></span>)}
          </p>
          <Seg
            value={narrow ? '390' : 'fit'}
            options={['fit', '390']}
            labels={['fit', '390px']}
            onChange={(v) => setNarrow(v === '390')}
            label="Preview width"
          />
        </div>
        {s.mode === 'fill' && (
          <p className="wv-note">
            The band {s.flipY ? 'above' : 'under'} the wave is the next section, in the {s.layers > 1 ? 'front layer’s' : 'wave’s'} colour.
            The SVG stretches to any width at a fixed height: try 390px.
          </p>
        )}
        {s.mode === 'line' && (
          <p className="wv-note">
            Play runs the drawing as a steady scroll would{s.plays === 'seen' ? ', the same way autoplay runs it over its duration' : ''}.
            The line scales evenly, so its stroke stays even at any width.
          </p>
        )}
      </div>

      <div className="wv-code">
        <div className="wv-code-bar">
          <div className="wv-tabs" role="tablist" aria-label="Output">
            {tabs.map(([k, name]) => (
              <button key={k} type="button" role="tab" aria-selected={active[0] === k} className="wv-tab" onClick={() => setTab(k)}>{name}</button>
            ))}
          </div>
          <button type="button" className="wv-btn" onClick={download} disabled={!values}>↓ Download .svg</button>
        </div>
        <CodeBox file={active[2]}>{code}</CodeBox>
        {run && <ToolExport title={RUN[s.mode].title} filename={RUN[s.mode].filename} html={run.html} react={run.react} />}
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="wv-field">
      <span className="wv-field-k">{label}</span>
      {children}
    </div>
  );
}

function Range({ label, aria, min, max, step, value, onChange }: {
  label: string; aria: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="wv-field">
      <span className="wv-field-k">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={aria} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Seg({ value, options, labels, onChange, label, disabled }: {
  value: string; options: readonly string[]; labels?: readonly string[]; onChange: (v: string) => void; label: string; disabled?: boolean;
}) {
  return (
    <span className="wv-seg" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} disabled={disabled} onClick={() => onChange(o)}>
          {labels?.[i] ?? o}
        </button>
      ))}
    </span>
  );
}
