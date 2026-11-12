'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { downloadText } from '@/lib/tool-export';
import {
  DEFAULTS, GALLERY, MAX_LINE, MAX_POINTS, MAX_RANDOMNESS, MAX_SEED, MAX_SIZE, MIN_LINE, MIN_POINTS, MIN_SIZE,
  blobFromRadii, blobGeometry, clampSettings, commandSummary, fmt, lerpRadii, nextSeed,
  type BlobGeometry, type BlobMode, type BlobSettings,
} from './blob';
import {
  DRAW_TABS, RUN_TITLE, TABS, codeFor, drawCodeFor, downloadName, htmlPage, reactProject, runName, svgFile,
  type DrawTab, type Tab,
} from './code';

/**
 * The SVG blob generator.
 *
 * - The blob is pure maths (blob.ts): the same settings give the same path on
 *   the server and in the browser, so nothing here waits for the client.
 * - Morph runs its own requestAnimationFrame loop between this seed's radii
 *   and the next seed's, both with the same number of points, so the two
 *   paths have the same commands. Under reduced motion it never plays by
 *   itself; the slider still moves it.
 * - "Draw it" is scrollDraw, the library this site is about: an autoplay
 *   instance whose own run lasts one frame (duration: 1, once), put back where
 *   the slider is on completion, so seek() is the only thing that moves it.
 *   Play runs progress from 0 to 1 at a steady speed, as a steady scroll would.
 * - The code is written from the same geometry, with no scrollDraw options:
 *   the drawing needs none of the defaults changed. Under Draw it's code, the
 *   Run it row takes the blob and its drawing off the site: an HTML file that
 *   imports svg-scroll-draw `version` from jsDelivr, or a React project.
 */

type Lib = typeof import('svg-scroll-draw');
type Instance = ReturnType<Lib['scrollDraw']>;

const SVG_NS = 'http://www.w3.org/2000/svg';
const DRAW_MS = 1600;
/** One way of the morph, then a rest at each end. */
const MORPH_MS = 1600;
const HOLD_MS = 700;
const CYCLE_MS = 2 * (MORPH_MS + HOLD_MS);
const REDUCED = '(prefers-reduced-motion: reduce)';
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia(REDUCED).matches;
function onReducedChange(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
/** Whether the reader asks for reduced motion, kept up to date (false on the server). */
const useReducedMotion = () => useSyncExternalStore(onReducedChange, reducedMotion, () => false);
const easeInOut = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);
const same = (a: { seed: number; points: number; randomness: number }, b: BlobSettings) =>
  a.seed === b.seed && a.points === b.points && Math.abs(a.randomness - b.randomness) < 1e-9;

/** The gallery's thumbnails: fixed, so made once. */
const THUMBS = GALLERY.map((g) => ({ ...g, d: blobGeometry({ ...g, size: 120, line: 0 }).d }));

export function BlobGenerator({ version }: { version: string }) {
  const [s, setS] = useState<BlobSettings>(DEFAULTS);
  const [seedText, setSeedText] = useState(String(DEFAULTS.seed));
  const [morph, setMorph] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [guides, setGuides] = useState(false);
  const [tab, setTab] = useState<Tab>('svg');
  const [lib, setLib] = useState<Lib | null>(null);
  const [lastColor, setLastColor] = useState('#4a6fa5');

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => { if (live) setLib(m); }).catch(() => { /* the drawing stays still */ });
    return () => { live = false; };
  }, []);

  const set = <K extends keyof BlobSettings>(k: K, v: BlobSettings[K]) => setS((p) => clampSettings({ ...p, [k]: v }));

  function setSeed(seed: number) {
    const next = clampSettings({ ...s, seed });
    setS(next);
    setSeedText(String(next.seed));
  }

  function shuffle() {
    setSeed(Math.floor(Math.random() * MAX_SEED) + 1);
  }

  function load(g: (typeof GALLERY)[number]) {
    setS((p) => clampSettings({ ...p, ...g }));
    setSeedText(String(g.seed));
  }

  function toggleMorph(on: boolean) {
    setMorph(on);
    setPlaying(on && !reducedMotion());
  }

  const g = useMemo(() => blobGeometry(s), [s]);
  const next = useMemo(() => (morph ? blobGeometry({ ...s, seed: nextSeed(s.seed) }) : null), [morph, s]);
  const code = useMemo(() => codeFor(tab, s, g, next), [tab, s, g, next]);
  const file = TABS.find(([k]) => k === tab)?.[2] ?? 'blob.svg';
  const custom = s.color !== 'currentColor';

  function download() {
    downloadText(downloadName(s), svgFile(s, g), 'image/svg+xml');
  }

  return (
    <div className="blb">
      <div className="blb-panel">
        <div className="blb-controls">
          <Field label={`points · ${s.points}`}>
            <input
              type="range" min={MIN_POINTS} max={MAX_POINTS} step={1} value={s.points}
              aria-label="Points" onChange={(e) => set('points', Number(e.target.value))}
            />
          </Field>
          <Field label={`randomness · ${s.randomness.toFixed(2)}`}>
            <input
              type="range" min={0} max={MAX_RANDOMNESS} step={0.01} value={s.randomness}
              aria-label="Randomness" onChange={(e) => set('randomness', Number(e.target.value))}
            />
          </Field>
          <Field label={`size · ${s.size} px`}>
            <input
              type="range" min={MIN_SIZE} max={MAX_SIZE} step={10} value={s.size}
              aria-label="Size in pixels" onChange={(e) => set('size', Number(e.target.value))}
            />
          </Field>
          <Field label={`line · ${fmt(s.line, 1)} px`}>
            <input
              type="range" min={MIN_LINE} max={MAX_LINE} step={0.5} value={s.line}
              aria-label="Line width in pixels" onChange={(e) => set('line', Number(e.target.value))}
            />
          </Field>
          <Field label="seed">
            <span className="blb-pair">
              <input
                type="number" inputMode="numeric" min={1} max={MAX_SEED} step={1} value={seedText}
                aria-label="Seed"
                onChange={(e) => {
                  setSeedText(e.target.value);
                  const n = Number(e.target.value);
                  if (/^\d+$/.test(e.target.value) && n >= 1 && n <= MAX_SEED) set('seed', n);
                }}
                onBlur={() => setSeedText(String(s.seed))}
              />
              <button type="button" className="blb-btn" onClick={shuffle}>Shuffle</button>
            </span>
          </Field>
          <Field label="style">
            <Seg
              value={s.mode} options={['fill', 'outline']} label="Fill or outline"
              onChange={(v) => set('mode', v as BlobMode)}
            />
          </Field>
          <Field label="colour">
            <span className="blb-pair">
              <button
                type="button" className="blb-btn blb-cc" aria-pressed={!custom}
                onClick={() => set('color', custom ? 'currentColor' : lastColor)}
              >
                currentColor
              </button>
              <input
                type="color" value={custom ? s.color : lastColor} aria-label="Custom colour"
                className={custom ? 'is-on' : undefined}
                onChange={(e) => { setLastColor(e.target.value); set('color', e.target.value); }}
              />
            </span>
          </Field>
          <Field label="preview">
            <span className="blb-checks">
              <label className="blb-check">
                <input type="checkbox" checked={morph} onChange={(e) => toggleMorph(e.target.checked)} />
                <span>Morph</span>
              </label>
              <label className="blb-check">
                <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
                <span>Construction</span>
              </label>
            </span>
          </Field>
        </div>

        <Stage s={s} g={g} next={next} guides={guides} playing={playing} onPlaying={setPlaying} />

        <div className="blb-gallery" role="group" aria-label={`Gallery: ${GALLERY.length} seeds to load`}>
          {THUMBS.map((t) => (
            <button
              key={t.seed} type="button" aria-pressed={same(t, s)} onClick={() => load(t)}
              aria-label={`${t.seed} · ${t.points}p: load seed ${t.seed}, ${t.points} points, randomness ${t.randomness.toFixed(2)}`}
            >
              <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path d={t.d} /></svg>
              <span>{t.seed} · {t.points}p</span>
            </button>
          ))}
        </div>
      </div>

      <div className="blb-code">
        <div className="blb-code-bar">
          <div className="blb-tabs" role="tablist" aria-label="Output">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className="blb-tab" onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>
          <button type="button" className="blb-btn blb-dl" onClick={download}>↓ Download .svg</button>
        </div>
        <CodeBox file={file}>{code}</CodeBox>
      </div>

      <DrawIt s={s} g={g} lib={lib} version={version} />
    </div>
  );
}

// ── The stage: the blob, and the morph ──────────────────────────────────────

function Stage({ s, g, next, guides, playing, onPlaying }: {
  s: BlobSettings; g: BlobGeometry; next: BlobGeometry | null; guides: boolean; playing: boolean; onPlaying: (on: boolean) => void;
}) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const morph = next !== null;

  // The loop: there and back, easing in and out, resting at each end. It picks
  // up from wherever the slider left it, and stops if reduced motion comes on.
  useEffect(() => {
    if (!morph || !playing) return;
    const mq = window.matchMedia(REDUCED);
    const t0 = performance.now() - (Math.acos(1 - 2 * tRef.current) / Math.PI) * MORPH_MS;
    let id = 0;
    const tick = (now: number) => {
      if (mq.matches) { onPlaying(false); return; }
      const ph = (now - t0) % CYCLE_MS;
      const u = ph < MORPH_MS ? ph / MORPH_MS
        : ph < MORPH_MS + HOLD_MS ? 1
          : ph < 2 * MORPH_MS + HOLD_MS ? 1 - (ph - MORPH_MS - HOLD_MS) / MORPH_MS
            : 0;
      tRef.current = easeInOut(u);
      setT(tRef.current);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [morph, playing, onPlaying]);

  function scrub(v: number) {
    onPlaying(false);
    tRef.current = v;
    setT(v);
  }

  function toggle() {
    if (playing) { onPlaying(false); return; }
    if (reducedMotion()) {
      // No tween: go straight to the other end.
      const v = tRef.current < 0.5 ? 1 : 0;
      tRef.current = v;
      setT(v);
      return;
    }
    onPlaying(true);
  }

  const shown = useMemo(
    () => (next && t > 0 ? blobFromRadii(lerpRadii(g.radii, next.radii, t), g.size, s.line) : g),
    [g, next, t, s.line],
  );
  const outline = s.mode === 'outline';
  const label = `A blob of ${s.points} points from seed ${s.seed}${morph ? `, ${Math.round(t * 100)}% of the way to seed ${nextSeed(s.seed)}` : ''}, ${outline ? 'as an outline' : 'filled'}.`;

  return (
    <>
      <div className="blb-stage">
        <svg
          className="blb-svg" viewBox={`0 0 ${g.size} ${g.size}`} role="img" aria-label={label}
          style={{ '--blb-size': `${g.size}px` } as React.CSSProperties}
        >
          <rect className="blb-box" x={0} y={0} width={g.size} height={g.size} />
          <path
            className={`blb-shape${guides && !outline ? ' is-faint' : ''}`}
            d={shown.d}
            fill={outline ? 'none' : s.color}
            stroke={outline ? s.color : undefined}
            strokeWidth={outline ? s.line : undefined}
          />
          {guides && <Construction geo={shown} />}
        </svg>
      </div>
      {morph && (
        <div className="blb-transport">
          <button type="button" className="blb-btn" onClick={toggle}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <label className="blb-scrub">
            <span>morph · seed {s.seed} → {nextSeed(s.seed)} · {t.toFixed(2)}</span>
            <input type="range" min={0} max={1} step={0.01} value={t} aria-label="Morph progress" onChange={(e) => scrub(Number(e.target.value))} />
          </label>
        </div>
      )}
      <p className="blb-read">
        <span>{s.points} points · {commandSummary(s.points)}</span>
        <span>length {fmt(shown.length, 1)} px</span>
        <span>{g.size} × {g.size}</span>
        {guides && <span>ring: where the path starts and closes</span>}
      </p>
      {morph && (
        <p className="blb-rm">
          Your system asks for reduced motion, so the morph does not play by itself. Drag the slider to move between
          the two seeds, or press Play to jump from one to the other.
        </p>
      )}
    </>
  );
}

/**
 * The polar construction over the blob: the longest radius, the spokes, each
 * piece's two handles, the points, and the centre. The first point, where the
 * path starts and closes, is a ring.
 */
function Construction({ geo }: { geo: BlobGeometry }) {
  const { c, scale, points, cubics, size } = geo;
  const dot = size * 0.009;
  return (
    <g className="blb-guides" aria-hidden="true">
      <circle className="blb-g-r" cx={c} cy={c} r={scale} vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <line key={`s${i}`} className="blb-g-spoke" x1={c} y1={c} x2={p[0]} y2={p[1]} vectorEffect="non-scaling-stroke" />
      ))}
      {cubics.map((cb, i) => (
        <g key={`h${i}`} className="blb-g-handle">
          <line x1={cb[0][0]} y1={cb[0][1]} x2={cb[1][0]} y2={cb[1][1]} vectorEffect="non-scaling-stroke" />
          <line x1={cb[3][0]} y1={cb[3][1]} x2={cb[2][0]} y2={cb[2][1]} vectorEffect="non-scaling-stroke" />
          <rect x={cb[1][0] - dot * 0.8} y={cb[1][1] - dot * 0.8} width={dot * 1.6} height={dot * 1.6} />
          <rect x={cb[2][0] - dot * 0.8} y={cb[2][1] - dot * 0.8} width={dot * 1.6} height={dot * 1.6} />
        </g>
      ))}
      {points.map((p, i) => (i === 0
        ? <circle key="p0" className="blb-g-start" cx={p[0]} cy={p[1]} r={dot * 1.9} vectorEffect="non-scaling-stroke" />
        : <circle key={`p${i}`} className="blb-g-pt" cx={p[0]} cy={p[1]} r={dot} />))}
      <circle className="blb-g-pt" cx={c} cy={c} r={dot} />
    </g>
  );
}

// ── Draw it: scrollDraw on the outline ──────────────────────────────────────

function DrawIt({ s, g, lib, version }: { s: BlobSettings; g: BlobGeometry; lib: Lib | null; version: string }) {
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const pRef = useRef(0);
  const raf = useRef(0);
  const [p, setP] = useState(0);
  const still = useReducedMotion();
  const [tab, setTab] = useState<DrawTab>('js');

  // One instance per outline; rebuilt (and put back at the slider's progress)
  // when the path or its paint changes, and destroyed on the way out.
  useEffect(() => {
    const box = host.current;
    if (!box || !lib) return;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${g.size} ${g.size}`);
    svg.setAttribute('class', 'blb-dsvg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.setProperty('--blb-size', `${g.size}px`);
    const pencil = document.createElementNS(SVG_NS, 'path');
    for (const [k, v] of [['d', g.d], ['class', 'blb-pencil'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1'], ['stroke-dasharray', '3 5'], ['vector-effect', 'non-scaling-stroke']]) pencil.setAttribute(k, v);
    const ink = document.createElementNS(SVG_NS, 'path');
    for (const [k, v] of [['d', g.d], ['class', 'blb-ink'], ['fill', 'none'], ['stroke', s.color], ['stroke-width', fmt(s.line, 2)]]) ink.setAttribute(k, v);
    svg.append(pencil, ink);
    box.replaceChildren(svg);

    // once and onComplete keep this on the JavaScript engine in every version:
    // in 2.23.2 and earlier autoplay alone did not keep scrollDraw off its CSS
    // scroll-timeline path (fixed in 2.23.3).
    let made: Instance | null = null;
    made = lib.scrollDraw(box, {
      selector: '.blb-ink',
      autoplay: true,
      duration: 1,
      once: true,
      onComplete: () => made?.seek(pRef.current),
    });
    made.seek(pRef.current);
    inst.current = made;
    return () => {
      made?.destroy();
      if (inst.current === made) inst.current = null;
      box.replaceChildren();
    };
  }, [lib, g.d, g.size, s.color, s.line]);

  /** Progress 0 to 1 at a steady speed, as if the reader scrolled through the trigger window. */
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (reducedMotion()) { pRef.current = 1; setP(1); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const v = Math.min(1, Math.max(0, (now - t0) / DRAW_MS));
      pRef.current = v;
      inst.current?.seek(v);
      setP(v);
      if (v < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  // Play once when it first comes on screen.
  useEffect(() => {
    const box = host.current;
    if (!box) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { io.disconnect(); play(); }
    }, { threshold: 0.4 });
    io.observe(box);
    const frame = raf;
    return () => { io.disconnect(); cancelAnimationFrame(frame.current); };
  }, [play]);

  function scrub(v: number) {
    cancelAnimationFrame(raf.current);
    pRef.current = v;
    inst.current?.seek(v);
    setP(v);
  }

  const code = useMemo(() => drawCodeFor(tab, s, g), [tab, s, g]);
  const run = useMemo(() => ({ html: htmlPage(s, g, version), react: reactProject(s, g, version) }), [s, g, version]);

  return (
    <div className="blb-draw">
      <div className="blb-draw-head">
        <p className="blb-draw-k">Draw it · the outline with scrollDraw, driven here by seek()</p>
        <p className="blb-draw-n">
          On a page the same progress comes from the scroll: it starts as the blob’s top enters the bottom of the
          window and finishes as its bottom leaves the top.
        </p>
      </div>
      <div className="blb-panel">
        <div className="blb-stage is-draw">
          <div ref={host} className="blb-dhost" />
        </div>
        <div className="blb-transport">
          <button type="button" className="blb-btn" onClick={play} disabled={still}>▶ Play</button>
          <label className="blb-scrub">
            <span>{still ? 'reduced motion is on · shown drawn' : `progress · ${p.toFixed(2)}`}</span>
            <input
              type="range" min={0} max={1} step={0.01} value={still ? 1 : p} disabled={still}
              aria-label="Drawing progress" onChange={(e) => scrub(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
      <div className="blb-code">
        <div className="blb-tabs" role="tablist" aria-label="Draw it code">
          {DRAW_TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="blb-tab" onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <CodeBox file={DRAW_TABS.find(([k]) => k === tab)?.[2] ?? 'main.js'}>{code}</CodeBox>
        <ToolExport title={RUN_TITLE} filename={runName(s)} html={run.html} react={run.react} />
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="blb-field">
      <span className="blb-label">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="blb-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}
