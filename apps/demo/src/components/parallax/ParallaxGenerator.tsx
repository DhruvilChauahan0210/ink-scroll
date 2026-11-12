'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ScrollParallaxOptions } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import {
  PARALLAX_DEFAULTS, PARALLAX_LAYERS, PARALLAX_PRESETS, SPEED_MAX, SPEED_MIN, SPEED_STEP,
  screenRate, travelPx, type LayerKey, type LayerSetting, type LayerSettings, type ParallaxAxis,
} from '@/data/parallax';
import { ParallaxScene, SCENE_LABEL } from './ParallaxScene';
import { jsCode, parallaxHtml, reactCode, reactProject } from './parallax-code';

/**
 * The parallax scrolling generator. Everything that moves is scrollParallax
 * itself, one instance per layer:
 *
 * - The preview scene sits in a small scrolling box. scrollParallax follows
 *   the window, not an element, so the box's scroll position is turned into
 *   each layer's progress with the library's own default window (the scene's
 *   top at the box's bottom → its bottom at the box's top, the box standing in
 *   for the window), and handed to the instances with seek(). That is the
 *   value the instance would compute from the page scroll; seek() applies it
 *   without easing, and scrollParallax's easing is 'linear'.
 * - "On real scroll" below runs the same settings with no seek(), on the
 *   page's own scroll, exactly as the generated code would.
 * - The code is generated from the same state, with every option that is at
 *   scrollParallax's default left out (parallax-code.ts). The Run it row under
 *   it saves the HTML tab's page with this scene drawn in its layers, or opens
 *   it, or the React tab's component in an App, in StackBlitz, with the
 *   library at `version` (SELF.version, passed down by the page).
 *
 * A layer whose speed or axis changes is destroyed and made again; the others
 * keep running. Every instance is destroyed on unmount.
 */

type Lib = typeof import('svg-scroll-draw');
type Instance = ReturnType<Lib['scrollParallax']>;
type Tab = 'js' | 'react' | 'html';
type Built = { s: LayerSetting; reduced: boolean; preview: Instance; page: Instance };
type Geo = { v: number; h: number; w: number };

const REDUCED = '(prefers-reduced-motion: reduce)';
const PLAY_MS = 4200;
const START = 0.5;
const KEYS = PARALLAX_LAYERS.map((l) => l.key);

function subscribeReduced(onChange: () => void) {
  const m = window.matchMedia(REDUCED);
  m.addEventListener('change', onChange);
  return () => m.removeEventListener('change', onChange);
}
const reducedNow = () => window.matchMedia(REDUCED).matches;
const reducedOnServer = () => false;

/**
 * A layer's trigger window in the box: 'top bottom' → 'bottom top', with the
 * box as the window. The layers fill the scene inside its border, so that is
 * the box measured, as scrollParallax measures the layer itself.
 */
function windowOf(box: HTMLElement, scene: HTMLElement) {
  const top = scene.offsetTop + scene.clientTop;
  return { start: top - box.clientHeight, end: top + scene.clientHeight };
}
function progressOf(box: HTMLElement, scene: HTMLElement): number {
  const { start, end } = windowOf(box, scene);
  return end === start ? 0 : Math.min(1, Math.max(0, (box.scrollTop - start) / (end - start)));
}
function scrollFor(box: HTMLElement, scene: HTMLElement, p: number): number {
  const { start, end } = windowOf(box, scene);
  return start + p * (end - start);
}
const layerIn = (root: HTMLElement, key: LayerKey) => root.querySelector<HTMLElement>(`[data-plx-layer="${key}"]`)!;
const optionsOf = (l: LayerSetting): ScrollParallaxOptions => ({ speed: l.speed, axis: l.axis });
const same = (a: LayerSettings, b: LayerSettings) => KEYS.every((k) => a[k].speed === b[k].speed && a[k].axis === b[k].axis);

/** A speed as the slider label shows it: a real minus sign, a plus on the positive side. */
const signed = (n: number) => (n === 0 ? '0' : n < 0 ? `−${Math.abs(n).toFixed(2)}` : `+${n.toFixed(2)}`);

function readout(l: LayerSetting, geo: Geo): { travel: string; rate: string } {
  if (l.speed === 0) return { travel: 'none', rate: 'with the page' };
  if (l.axis === 'x') {
    const t = travelPx(l.speed, geo.w);
    return { travel: `${t > 0 ? '←' : '→'} ${Math.round(Math.abs(t))}px`, rate: 'sideways' };
  }
  const t = travelPx(l.speed, geo.h);
  return { travel: `${t > 0 ? '↑' : '↓'} ${Math.round(Math.abs(t))}px`, rate: `${screenRate(l.speed, geo.h, geo.v).toFixed(2)}×` };
}

export function ParallaxGenerator({ version }: { version: string }) {
  const [layers, setLayers] = useState<LayerSettings>(PARALLAX_PRESETS[0].layers);
  const [lib, setLib] = useState<Lib | null>(null);
  const [progress, setProgress] = useState(START);
  const [geo, setGeo] = useState<Geo>({ v: 360, h: 276, w: 828 });
  const [tab, setTab] = useState<Tab>('js');
  const [playing, setPlaying] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, reducedNow, reducedOnServer);
  const ticks = useId();
  const box = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const built = useRef(new Map<LayerKey, Built>());
  const raf = useRef(0);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw').then((m) => {
      if (live) setLib(m);
    });
    return () => {
      live = false;
    };
  }, []);

  // Start with the scene in the middle of the box, and keep the readouts' sizes
  // current. A resize moves the window under the same scrollTop, so the layers
  // are placed again from it.
  useEffect(() => {
    const b = box.current;
    const s = scene.current;
    if (!b || !s) return;
    b.scrollTop = scrollFor(b, s, START);
    const ro = new ResizeObserver(() => {
      setGeo({ v: b.clientHeight, h: s.clientHeight, w: s.clientWidth });
      const p = progressOf(b, s);
      built.current.forEach((x) => x.preview.seek(p));
      setProgress(p);
    });
    ro.observe(b);
    ro.observe(s);
    return () => ro.disconnect();
  }, []);

  // One scrollParallax per layer in each scene; a changed layer is destroyed and made again.
  useEffect(() => {
    const b = box.current;
    const s = scene.current;
    const pg = page.current;
    if (!lib || !b || !s || !pg) return;
    const map = built.current;
    const p = progressOf(b, s);
    for (const key of KEYS) {
      const want = layers[key];
      const had = map.get(key);
      if (had && had.reduced === reduced && had.s.speed === want.speed && had.s.axis === want.axis) continue;
      had?.preview.destroy();
      had?.page.destroy();
      const preview = lib.scrollParallax(layerIn(s, key), optionsOf(want));
      preview.seek(p);
      map.set(key, { s: want, reduced, preview, page: lib.scrollParallax(layerIn(pg, key), optionsOf(want)) });
    }
  }, [lib, layers, reduced]);

  useEffect(() => {
    const map = built.current;
    const frame = raf;
    return () => {
      cancelAnimationFrame(frame.current);
      map.forEach((b) => {
        b.preview.destroy();
        b.page.destroy();
      });
      map.clear();
    };
  }, []);

  function onScroll() {
    const b = box.current;
    const s = scene.current;
    if (!b || !s) return;
    const p = progressOf(b, s);
    built.current.forEach((x) => x.preview.seek(p));
    setProgress(p);
  }

  function stop() {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setPlaying(false);
  }

  /** Scroll the box through the scene's whole window, at a steady rate. */
  function play() {
    const b = box.current;
    const s = scene.current;
    if (!b || !s || reduced) return;
    cancelAnimationFrame(raf.current);
    setPlaying(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PLAY_MS);
      b.scrollTop = scrollFor(b, s, t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else {
        raf.current = 0;
        setPlaying(false);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  function scrub(p: number) {
    stop();
    const b = box.current;
    const s = scene.current;
    if (!b || !s) return;
    b.scrollTop = scrollFor(b, s, p);
    setProgress(p);
  }

  const setLayer = (key: LayerKey, patch: Partial<LayerSetting>) =>
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const preset = useMemo(() => PARALLAX_PRESETS.find((p) => same(p.layers, layers)) ?? null, [layers]);
  const moving = KEYS.filter((k) => layers[k].speed !== 0).length;
  const code = useMemo(
    () => (tab === 'js' ? jsCode(layers) : tab === 'react' ? reactCode(layers) : parallaxHtml(layers, version, false)),
    [layers, tab, version],
  );
  const html = useMemo(() => parallaxHtml(layers, version, true), [layers, version]);
  const react = useMemo(() => reactProject(layers, version), [layers, version]);

  return (
    <div className="plx">
      <div className="plx-panel">
        <div className="plx-presets">
          <span className="plx-k">preset</span>
          <span className="plx-seg is-wide" role="radiogroup" aria-label="Preset">
            {PARALLAX_PRESETS.map((p) => (
              <button key={p.key} type="button" role="radio" aria-checked={preset?.key === p.key} onClick={() => setLayers(p.layers)}>
                {p.label}
              </button>
            ))}
          </span>
          <p className="plx-preset-note">{preset ? preset.note : 'Your own mix: pick a preset to start again.'}</p>
        </div>

        <div className="plx-window">
          <span className="plx-edge is-top" aria-hidden="true">window top</span>
          <span className="plx-edge is-bottom" aria-hidden="true">window bottom</span>
          <div
            ref={box}
            className="plx-box"
            role="region"
            aria-label="Preview: scroll inside this box to move the scene through it"
            tabIndex={0}
            onScroll={onScroll}
            onWheel={playing ? stop : undefined}
            onTouchStart={playing ? stop : undefined}
            onPointerDown={playing ? stop : undefined}
            onKeyDown={playing ? stop : undefined}
          >
            <div className="plx-pad">
              <p className="plx-hint">Scroll inside this box ↓</p>
              <Bars />
            </div>
            <ParallaxScene ref={scene} label={SCENE_LABEL} />
            <div className="plx-pad is-end">
              <Bars />
              <p className="plx-hint">The scene has left the window ↑</p>
            </div>
          </div>
        </div>

        <div className="plx-transport">
          <button type="button" className="plx-btn" onClick={playing ? stop : play} disabled={reduced}>
            {playing ? '■ Stop' : '▶ Scroll through'}
          </button>
          <button type="button" className="plx-btn" onClick={() => scrub(1)}>End position</button>
          <label className="plx-scrub">
            <span>progress · {progress.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.005} value={progress}
              aria-label="Progress through the scene’s window"
              onChange={(e) => scrub(Number(e.target.value))}
            />
          </label>
          <p className="plx-count">{moving} of {KEYS.length} layers move</p>
        </div>
        {reduced && (
          <p className="plx-note" role="status">
            Your system asks for reduced motion, so scrollParallax puts every layer at its end position and leaves it
            there, here as on your page. The code below is the same either way.
          </p>
        )}

        <div className="plx-rows" role="group" aria-label="Layers, back to front">
          <div className="plx-row is-head" aria-hidden="true">
            <span>layer</span><span>speed</span><span>axis</span><span>travel</span><span>on screen</span>
          </div>
          {PARALLAX_LAYERS.map((L, i) => {
            const l = layers[L.key];
            const r = readout(l, geo);
            return (
              <div key={L.key} className="plx-row">
                <span className="plx-name">
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <span>{L.label}<small>{L.note}</small></span>
                </span>
                <label className="plx-speed">
                  <span>{signed(l.speed)}</span>
                  <input
                    type="range" min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP} value={l.speed} list={ticks}
                    aria-label={`${L.label} speed`}
                    onChange={(e) => setLayer(L.key, { speed: Number(e.target.value) })}
                  />
                </label>
                <Seg
                  value={l.axis}
                  options={['y', 'x']}
                  label={`${L.label} axis`}
                  onChange={(v) => setLayer(L.key, { axis: v as ParallaxAxis })}
                />
                <span className="plx-out is-travel" title="How far it moves over its whole window">{r.travel}</span>
                <span className="plx-out is-rate" title="How fast it crosses the screen, as a multiple of the scroll">{r.rate}</span>
              </div>
            );
          })}
          <datalist id={ticks}>
            <option value={0} />
            <option value={PARALLAX_DEFAULTS.speed} />
          </datalist>
        </div>
      </div>

      <div className="plx-code">
        <div className="plx-tabs" role="tablist" aria-label="Code">
          {(['js', 'react', 'html'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className="plx-tab" onClick={() => setTab(t)}>
              {t === 'js' ? 'JavaScript' : t === 'react' ? 'React' : 'HTML + CSS'}
            </button>
          ))}
        </div>
        <CodeBox file={tab === 'js' ? 'parallax.js' : tab === 'react' ? 'ParallaxScene.tsx' : 'index.html'}>{code}</CodeBox>
        <ToolExport title="Parallax scrolling" filename="parallax-scrolling.html" html={html} react={react} />
      </div>

      <div className="plx-live">
        <p className="plx-k">On real scroll · the same settings, no seek()</p>
        <ParallaxScene ref={page} label={SCENE_LABEL} />
        <p className="plx-live-note">
          This one follows the page. Each layer’s window runs from its top reaching the bottom of your window to its
          bottom leaving the top, so the whole effect plays while the scene is in view.
        </p>
      </div>
    </div>
  );
}

function Seg({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <span className="plx-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </span>
  );
}

/** A few lines of placeholder page text, so the box reads as a page around the scene. */
function Bars(): ReactNode {
  return (
    <span className="plx-bars" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}
