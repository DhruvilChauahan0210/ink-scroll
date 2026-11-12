'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode, type Ref } from 'react';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import type { ScrollVideoOptions } from 'svg-scroll-draw/video';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { edgeOffset, lineOffset, progressAt, triggerAt } from '@/data/trigger';
import { FILM } from '@/data/videoscrub';
import {
  DEFAULTS, EASE, EASE_NAMES, EDGE_OPTIONS, FILM_SOURCE, LENGTH, LINE_OPTIONS, SLUG,
  cssCode, fileSource, flowRun, htmlCode, jsCode, pinnedRun, posterCommand, posterTime, presetAt, presetsOf,
  reactApp, reactCode, scrubFile, secs, stuckFor, timeAt, toOption, windowWords,
  type Edge, type Line, type Pair, type PosterAt, type ScrubSettings,
} from './scrub-code';

/**
 * The scroll video scrub generator.
 *
 * - scrollVideo has no scrollContainer option: it reads the window's scroll.
 *   So the box below stands in for the window, and the progress is worked out
 *   from the box's scroll with the library's own arithmetic (data/trigger.ts,
 *   which mirrors core/trigger.ts), eased with core/easing.ts's functions, and
 *   handed to a real scrollVideo instance through seek(). Every currentTime
 *   write is the instance's; the readouts read the video back.
 * - The instance is paused as soon as it is made, so its own loop never
 *   follows the window. It is made again (and the old one destroyed) when an
 *   option changes or the video does, and destroyed on unmount.
 * - seek() before the video's metadata is in does nothing and is not replayed
 *   (video/index.ts applyAlpha returns until ready), so the first seek waits
 *   for onReady.
 * - A video picked from disk is played from URL.createObjectURL: it never
 *   leaves the browser, and the URL is revoked when another is picked and on
 *   unmount. So is the poster frame, drawn from the video onto a canvas.
 */

type Tab = 'html' | 'css' | 'js' | 'react';
type Picked = { url: string; name: string; bytes: number };
type Meta = { key: string; duration: number; width: number; height: number };
type Geo = { v: number; top: number; h: number; max: number };
type Seeks = { last: number; max: number; n: number };
type Poster = { key: string; url: string; width: number; height: number; bytes: number } | { key: string; error: string };

const TABS: { key: Tab; label: string; file: string }[] = [
  { key: 'html', label: 'HTML', file: 'film.html' },
  { key: 'css', label: 'CSS', file: 'film.css' },
  { key: 'js', label: 'JavaScript', file: 'film.js' },
  { key: 'react', label: 'React', file: 'FilmScrub.jsx' },
];
const POSTERS: { key: PosterAt; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'first', label: 'First frame' },
  { key: 'last', label: 'Last frame' },
];
const NO_SEEKS: Seeks = { last: 0, max: 0, n: 0 };
/** The preview box's height (--vsg-v in videoscrub.css), until it is measured. */
const VP = 360;

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const words = (p: Pair) => `${p.edge} ${p.line}`;
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

/** Waits for one event on `el`, or fails on its error event or after `ms`. */
function once(el: HTMLMediaElement, type: string, ms = 8000): Promise<void> {
  return new Promise((ok, no) => {
    const done = (fn: () => void) => () => {
      clearTimeout(timer);
      el.removeEventListener(type, onOk);
      el.removeEventListener('error', onNo);
      fn();
    };
    const onOk = done(ok);
    const onNo = done(() => no(new Error('The video could not be read.')));
    const timer = setTimeout(done(() => no(new Error('The video took too long to load.'))), ms);
    el.addEventListener(type, onOk);
    el.addEventListener('error', onNo);
  });
}

/** The frame on screen at `t`, as a JPEG: a second video element, seeked there and drawn on a canvas. */
async function grabFrame(url: string, t: number): Promise<{ blob: Blob; width: number; height: number }> {
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'auto';
  v.src = url;
  try {
    if (v.readyState < 1) await once(v, 'loadedmetadata');
    v.currentTime = Math.min(t, v.duration);
    await once(v, 'seeked');
    if (v.readyState < 2) await once(v, 'loadeddata');
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('No canvas here.');
    ctx.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
    if (!blob) throw new Error('The frame could not be saved.');
    return { blob, width: c.width, height: c.height };
  } finally {
    v.removeAttribute('src');
    v.load();
  }
}

export function VideoScrubGenerator({ version }: { version: string }) {
  const [s, setS] = useState<ScrubSettings>(DEFAULTS);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState<{ key: string; text: string } | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [scroll, setScroll] = useState(0);
  const [shown, setShown] = useState<{ key: string; t: number } | null>(null);
  const [seeks, setSeeks] = useState<Seeks>(NO_SEEKS);
  const [tick, setTick] = useState(0);
  const [rmView, setRmView] = useState(false);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [tab, setTab] = useState<Tab>('js');
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inst = useRef<ScrollDrawInstance | null>(null);
  const raf = useRef(0);
  const seekAt = useRef(0);
  const reset = useRef(true);
  const fileUrl = useRef<string | null>(null);
  const posterUrl = useRef<string | null>(null);

  const srcUrl = picked ? picked.url : FILM.src;
  const srcKey = srcUrl;
  const videoKey = `${srcKey}|${s.pin ? 'pin' : 'flow'}`;
  const m = meta && meta.key === srcKey ? meta : null;
  const error = err && err.key === srcKey ? err.text : null;
  const finite = m !== null && Number.isFinite(m.duration) && m.duration > 0;
  const duration = finite ? m.duration : picked ? null : FILM.duration;
  const pickedName = picked?.name ?? null;
  const source = useMemo(
    () => (pickedName !== null ? fileSource(pickedName, duration) : FILM_SOURCE),
    [pickedName, duration],
  );
  const startW = words(s.start);
  const endW = words(s.end);

  // ── Geometry of the little page, and where the scroll is in its window ───
  const v = geo?.v ?? VP;
  const tStart = geo ? triggerAt(startW, geo.top, geo.h, geo.v) : 0;
  const tEnd = geo ? triggerAt(endW, geo.top, geo.h, geo.v) : 0;
  const raw = geo ? progressAt(scroll, tStart, tEnd) : 0;
  const alpha = EASE[s.easing](raw);
  const target = rmView ? 1 : alpha;
  const asked = duration !== null ? timeAt(s, duration, target) : null;
  const max = geo?.max ?? 0;
  const stuck = s.pin && geo !== null && scroll >= geo.top && scroll <= geo.top + geo.h - geo.v;

  // The box's real height and the measured element's place in it: the
  // track when pinned (triggerElement), the video itself in the flow.
  useEffect(() => {
    const b = box.current;
    const el = s.pin ? track.current : video.current;
    if (!b || !el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const top = Math.round(r.top - br.top - b.clientTop + b.scrollTop);
      if (reset.current) {
        reset.current = false;
        b.scrollTop = top;
      }
      setGeo({ v: b.clientHeight || VP, top, h: Math.round(r.height), max: b.scrollHeight - b.clientHeight });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(el);
    return () => ro.disconnect();
  }, [s.pin, videoKey]);

  // The instance: scrollVideo on the preview's video, with the same options
  // the code is written with, paused at once and driven through seek().
  const metaReady = finite;
  useEffect(() => {
    const el = video.current;
    if (!el || !metaReady) return;
    let live = true;
    let made: ScrollDrawInstance | null = null;
    import('svg-scroll-draw/video').then(({ scrollVideo }) => {
      if (!live) return;
      const options: ScrollVideoOptions = {
        trigger: { start: startW, end: endW },
        from: s.from,
        easing: s.easing,
        onReady: () => setTick((n) => n + 1),
      };
      if (s.to !== null) options.to = s.to;
      if (s.pin && track.current) options.triggerElement = track.current;
      made = scrollVideo(el, options);
      made.pause();
      inst.current = made;
      setTick((n) => n + 1);
    });
    return () => {
      live = false;
      made?.destroy();
      if (inst.current === made) inst.current = null;
    };
  }, [videoKey, metaReady, s.pin, s.from, s.to, s.easing, startW, endW]);

  // The scrub itself: every change of progress is one seek() on the instance.
  useEffect(() => {
    if (tick) inst.current?.seek(target);
  }, [target, tick]);

  // The poster frame, drawn from the video a moment after the settings rest.
  const pT = duration !== null ? posterTime(s, duration) : null;
  const posterKey = s.poster !== 'none' && pT !== null && !error ? `${srcUrl}@${pT}` : null;
  useEffect(() => {
    if (!posterKey || pT === null) return;
    let live = true;
    const timer = setTimeout(() => {
      grabFrame(srcUrl, pT).then(
        (g) => {
          if (!live) return;
          const url = URL.createObjectURL(g.blob);
          if (posterUrl.current) URL.revokeObjectURL(posterUrl.current);
          posterUrl.current = url;
          setPoster({ key: posterKey, url, width: g.width, height: g.height, bytes: g.blob.size });
        },
        (e: unknown) => {
          if (live) setPoster({ key: posterKey, error: e instanceof Error ? e.message : 'The frame could not be drawn.' });
        },
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [posterKey, pT, srcUrl]);

  // Object URLs go when the tool does.
  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    if (posterUrl.current) URL.revokeObjectURL(posterUrl.current);
  }, []);

  const set = (patch: Partial<ScrubSettings>) => setS((o) => ({ ...o, ...patch }));

  function setPin(pin: boolean) {
    if (pin === s.pin) return;
    const p = presetsOf(pin)[0];
    reset.current = true;
    set({ pin, start: p.start, end: p.end });
  }

  function chooseFilm() {
    if (!picked) return;
    stop();
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    fileUrl.current = null;
    reset.current = true;
    setPicked(null);
    setSeeks(NO_SEEKS);
    set({ from: 0, to: FILM.to });
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    stop();
    // Read in place: the file never leaves this browser.
    const url = URL.createObjectURL(file);
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    fileUrl.current = url;
    reset.current = true;
    setPicked({ url, name: file.name, bytes: file.size });
    setSeeks(NO_SEEKS);
    set({ from: 0, to: null });
  }

  function stop() {
    cancelAnimationFrame(raf.current);
  }

  function jump(y: number) {
    stop();
    const b = box.current;
    if (b) b.scrollTop = clamp(y, 0, max);
  }

  /** Scroll the box through the window, as a reader would; a quarter at a time under reduced motion. */
  function play() {
    stop();
    const b = box.current;
    if (!b || !geo) return;
    const lo = clamp(Math.min(tStart, tEnd), 0, max);
    const hi = clamp(Math.max(tStart, tEnd), 0, max);
    if (hi <= lo) return;
    if (getReduced()) {
      const at = (b.scrollTop - lo) / (hi - lo);
      const next = at >= 0.999 || at < 0 ? 0 : Math.min(1, Math.floor(at * 4 + 1e-6) / 4 + 0.25);
      b.scrollTop = lo + (hi - lo) * next;
      return;
    }
    const ms = clamp(((hi - lo) / v) * 1100, 2400, 6400);
    b.scrollTop = lo;
    let t0 = -1;
    const step = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / ms);
      b.scrollTop = lo + (hi - lo) * t;
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  // ── Code ────────────────────────────────────────────────────────────────
  const code = useMemo(() => {
    if (tab === 'html') return htmlCode(s, source);
    if (tab === 'css') return cssCode(s);
    if (tab === 'react') return reactCode(s, source);
    return jsCode(s, source);
  }, [tab, s, source]);
  const file = useMemo(() => scrubFile(s, source, version), [s, source, version]);
  const app = useMemo(() => reactApp(s, source), [s, source]);

  // ── Readouts ────────────────────────────────────────────────────────────
  const preset = presetAt(s);
  const runPin = pinnedRun(s);
  const runFlow = flowRun(s);
  const zero = geo !== null && tEnd === tStart;
  const backwards = geo !== null && tEnd < tStart;
  const dur = duration ?? 0;
  const toNow = s.to ?? dur;
  const shownT = shown && shown.key === videoKey ? shown.t : null;
  const frame = !picked && shownT !== null ? Math.min(FILM.frames - 1, Math.floor(shownT * FILM.fps + 1e-6)) : null;
  const key = frame !== null ? Math.floor(frame / FILM.keyEvery) * FILM.keyEvery : null;
  const at = (y: number) => `${max > 0 ? clamp((y / max) * 100, 0, 100) : 0}%`;
  const onTimeline = (t: number) => `${dur > 0 ? clamp((t / dur) * 100, 0, 100) : 0}%`;
  const posterNow = poster && poster.key === posterKey ? poster : null;
  const lineAt = (l: Line) => clamp(lineOffset(l, v), 0, v - 1);
  const toCode = toOption(s, source);

  const videoEl = (
    <PreviewVideo
      key={videoKey}
      ref={video}
      src={srcUrl}
      label={source.label}
      ratio={s.pin ? undefined : m ? `${m.width} / ${m.height}` : `${FILM.width} / ${FILM.height}`}
      onMeta={(el) => setMeta({ key: srcKey, duration: el.duration, width: el.videoWidth, height: el.videoHeight })}
      onSeeking={() => { seekAt.current = performance.now(); }}
      onSeeked={(el) => {
        const dt = performance.now() - seekAt.current;
        setShown({ key: videoKey, t: el.currentTime });
        setSeeks((o) => ({ last: dt, max: Math.max(o.max, dt), n: o.n + 1 }));
      }}
      onFail={(text) => setErr({ key: srcKey, text })}
    />
  );

  return (
    <div className="vsg">
      <div className="vsg-panel">
        <div className="vsg-source">
          <div className="vsg-field" role="group" aria-label="The video">
            <span className="vsg-field-k">Video</span>
            <span className="vsg-seg">
              <button type="button" aria-pressed={!picked} onClick={chooseFilm}>The site’s film</button>
              <label className="vsg-pick" data-on={picked ? true : undefined}>
                <input type="file" accept="video/*" onChange={pickFile} aria-describedby="vsg-file-note" />
                <span>{picked ? 'Another file…' : 'Your own file…'}</span>
              </label>
            </span>
          </div>
          <p className="vsg-hint" id="vsg-file-note">
            {picked ? (
              <>
                <b>{picked.name}</b>
                {m ? ` · ${m.width}×${m.height}` : ''}
                {finite ? ` · ${secs(m.duration)} s` : ''} · {mb(picked.bytes)} · played from this browser’s memory,
                never uploaded.
              </>
            ) : (
              <>
                <b>{FILM.file}</b> · {FILM.codec} {FILM.width}×{FILM.height} · {FILM.duration} s · {FILM.fps} fps · a
                keyframe every {FILM.keyEvery} frames. Or pick a video from your disk: it stays in this browser.
              </>
            )}
          </p>
          {error && <p className="vsg-warn" role="alert">{error}</p>}
        </div>

        <div className="vsg-controls">
          <Field label="Pin the video while it scrubs">
            <span className="vsg-seg" role="radiogroup" aria-label="Pin the video while it scrubs">
              <button type="button" role="radio" aria-checked={s.pin} onClick={() => setPin(true)}>Pinned · sticky</button>
              <button type="button" role="radio" aria-checked={!s.pin} onClick={() => setPin(false)}>In the flow</button>
            </span>
            <span className="vsg-hint">
              {s.pin
                ? 'A sticky stage in a tall track; scrollVideo measures the track (triggerElement).'
                : 'The video scrolls with the page; scrollVideo measures the video.'}
            </span>
          </Field>

          <Field label={s.pin ? `Scroll length · track ${s.length}vh` : 'Scroll length'}>
            {s.pin ? (
              <>
                <span className="vsg-range">
                  <input
                    type="range" min={LENGTH.min} max={LENGTH.max} step={LENGTH.step} value={s.length}
                    aria-label="Track height in vh: the scroll room the film runs over"
                    onChange={(e) => set({ length: Number(e.target.value) })}
                  />
                  <output className="vsg-val">{s.length}vh</output>
                </span>
                <span className="vsg-hint">
                  Stuck for {stuckFor(s)}vh; the film runs over {runPin}vh of scroll
                  {runPin === stuckFor(s) ? ', exactly while stuck.' : '.'}
                </span>
              </>
            ) : (
              <span className="vsg-hint">
                Set by the window and the video’s height: the film runs over{' '}
                {runFlow.video === 0 ? '' : runFlow.video === 1 ? 'the video’s height' : `${runFlow.video} × the video’s height`}
                {runFlow.video !== 0 && runFlow.vh !== 0 ? (runFlow.vh > 0 ? ' plus ' : ' less ') : ''}
                {runFlow.vh !== 0 ? `${Math.abs(runFlow.vh)}vh` : runFlow.video === 0 ? 'no scroll at all' : ''} of scroll.
              </span>
            )}
          </Field>

          <Field label="Trigger window">
            <span className="vsg-seg" role="radiogroup" aria-label="Trigger window presets">
              {presetsOf(s.pin).map((p) => (
                <button
                  key={p.key} type="button" role="radio" aria-checked={preset?.key === p.key}
                  onClick={() => set({ start: p.start, end: p.end })}
                >
                  {p.label}
                </button>
              ))}
            </span>
            <span className="vsg-words">
              <PairPicker label="start" value={s.start} onChange={(start) => set({ start })} />
              <PairPicker label="end" value={s.end} onChange={(end) => set({ end })} />
            </span>
            <span className="vsg-hint">{preset ? preset.what : `Your own window: ${windowWords(s)}.`}</span>
          </Field>

          <Field label="Range · from → to">
            <span className="vsg-range">
              <input
                type="range" min={0} max={dur || 1} step={0.01} value={Math.min(s.from, dur || 1)} disabled={!finite && !!picked}
                aria-label="from: the time the scrub starts at, in seconds"
                onChange={(e) => set({ from: Number(e.target.value) })}
              />
              <output className="vsg-val">{secs(s.from)} s</output>
            </span>
            <span className="vsg-range">
              <input
                type="range" min={0} max={dur || 1} step={0.01} value={Math.min(toNow, dur || 1)} disabled={!finite && !!picked}
                aria-label="to: the time the scrub ends at, in seconds"
                onChange={(e) => {
                  const t = Number(e.target.value);
                  set({ to: dur && Math.abs(t - dur) < 0.005 ? null : t });
                }}
              />
              <output className="vsg-val">{secs(toNow)} s</output>
            </span>
            <span className="vsg-hint">
              {s.from > toNow
                ? 'from is after to: the film runs backwards as the page scrolls down.'
                : toCode === null
                  ? 'to is the end of the file, so the code leaves it out.'
                  : !picked && toCode === FILM.to
                    ? `This film stops at ${FILM.to} s: colourway stills follow it in the same file.`
                    : `The scrub plays ${secs(s.from)} s to ${secs(toNow)} s of the file.`}
            </span>
          </Field>

          <Field label="Easing">
            <span className="vsg-seg is-wrap" role="radiogroup" aria-label="Easing">
              {EASE_NAMES.map((e) => (
                <button key={e} type="button" role="radio" aria-checked={s.easing === e} onClick={() => set({ easing: e })}>
                  {e}
                </button>
              ))}
            </span>
            <span className="vsg-hint">
              {s.easing === 'linear'
                ? 'One scroll pixel is the same slice of film everywhere.'
                : `Progress ${raw.toFixed(2)} becomes ${alpha.toFixed(2)}: ${s.easing === 'ease-in' ? 'slow at the start, fast at the end' : s.easing === 'ease-out' ? 'fast at the start, slow at the end' : 'slow at both ends'}.`}
            </span>
          </Field>

          <Field label="Poster">
            <span className="vsg-seg" role="radiogroup" aria-label="Poster">
              {POSTERS.map((p) => (
                <button key={p.key} type="button" role="radio" aria-checked={s.poster === p.key} onClick={() => set({ poster: p.key })}>
                  {p.label}
                </button>
              ))}
            </span>
            <span className="vsg-hint">
              {s.poster === 'none'
                ? 'Shown until the first frame is ready, and instead of the film where a browser cannot play it.'
                : s.poster === 'first'
                  ? 'The frame the scrub starts on, so nothing jumps when the film arrives.'
                  : 'The frame at to: what reduced-motion visitors see, since scrollVideo holds them there.'}
            </span>
          </Field>
        </div>

        <div className="vsg-view">
          <p className="vsg-k">
            Window · {v}px tall · scroll it · {s.pin ? (stuck ? 'the stage is stuck' : 'the stage scrolls') : 'the video is measured'}
          </p>
          <div className="vsg-frame">
            <div
              ref={box}
              className="vsg-box"
              tabIndex={0}
              role="region"
              aria-label="Preview window: scroll it to scrub the video"
              onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
              onWheel={stop}
              onTouchStart={stop}
              onPointerDown={stop}
              onKeyDown={stop}
            >
              <div className="vsg-flow">
                <span>Content before</span>
                <span>scroll ↓</span>
              </div>
              {s.pin ? (
                <div ref={track} className="vsg-track" style={{ height: `calc(var(--vsg-v) * ${s.length / 100})` }}>
                  <div className="vsg-stage">
                    {videoEl}
                  </div>
                </div>
              ) : (
                <div className="vsg-inflow">
                  {videoEl}
                </div>
              )}
              <div className="vsg-flow is-after">
                <span>Content after</span>
              </div>
            </div>
            <div className="vsg-overlay" aria-hidden="true">
              <span className={`vsg-line${lineAt(s.start.line) < 18 ? ' is-low' : ''}`} style={{ top: lineAt(s.start.line) }}>
                <i>start · {s.start.line}</i>
              </span>
              <span className={`vsg-line is-end${lineAt(s.end.line) < 18 ? ' is-low' : ''}`} style={{ top: lineAt(s.end.line) }}>
                <i>end · {s.end.line}</i>
              </span>
            </div>
          </div>
        </div>

        <div className="vsg-transport">
          <button type="button" className="vsg-btn" onClick={play} disabled={!geo || zero}>
            {reduced ? 'Next quarter' : '▶ Play'}
          </button>
          <button type="button" className="vsg-btn" onClick={() => jump(Math.min(tStart, tEnd))}>Window start</button>
          <button type="button" className="vsg-btn" onClick={() => jump(Math.max(tStart, tEnd))}>Window end</button>
          <label className="vsg-scrub">
            <span>Scroll · {Math.round(scroll)}px</span>
            <input
              type="range" min={0} max={Math.max(1, max)} step={1} value={Math.round(clamp(scroll, 0, Math.max(1, max)))}
              aria-label="Scroll position of the preview"
              onChange={(e) => jump(Number(e.target.value))}
            />
          </label>
          <label className="vsg-check">
            <input type="checkbox" checked={rmView} onChange={(e) => setRmView(e.target.checked)} />
            <span>As a reduced-motion visitor sees it</span>
          </label>
        </div>

        <div className="vsg-read">
          <div className="vsg-big">
            <div>
              <span className="vsg-k">Progress, eased</span>
              <output className="vsg-num" aria-label="Eased progress">{target.toFixed(2)}</output>
            </div>
            <div>
              <span className="vsg-k">currentTime</span>
              <output className="vsg-num" aria-label="The video’s currentTime, read back after each seek">
                {shownT !== null ? shownT.toFixed(2) : '–'}<small> s</small>
              </output>
            </div>
          </div>

          <div className="vsg-tl">
            <span className="vsg-k">
              Film · 0 to {secs(dur)} s{!picked ? ` · ${FILM.keyframes} keyframes` : ''}
            </span>
            <div className="vsg-tl-bar" aria-hidden="true">
              <span
                className="vsg-tl-range"
                style={{ left: onTimeline(Math.min(s.from, toNow)), width: `calc(${onTimeline(Math.max(s.from, toNow))} - ${onTimeline(Math.min(s.from, toNow))})` }}
              />
              {!picked && Array.from({ length: FILM.keyframes }, (_, k) => (
                <i key={k} className="vsg-tl-key" style={{ left: onTimeline((k * FILM.keyEvery) / FILM.fps) }} />
              ))}
              {asked !== null && <span className="vsg-tl-ask" style={{ left: onTimeline(asked) }} />}
              {shownT !== null && <span className="vsg-tl-now" style={{ left: onTimeline(shownT) }} />}
            </div>
            <p className="vsg-tl-read">
              {frame !== null && key !== null
                ? `Frame ${frame} of 0–${FILM.frames - 1}. The keyframe before it is frame ${key}, so this seek decoded ${frame - key + 1} ${frame - key ? 'frames' : 'frame'}.`
                : picked
                  ? 'A browser cannot list a file’s keyframes; the seek times below show where they are sparse.'
                  : 'Waiting for the film.'}
            </p>
          </div>

          <dl className="vsg-seeks">
            <div><dt>Last seek</dt><dd>{seeks.n ? `${seeks.last.toFixed(1)} ms` : '–'}</dd></div>
            <div><dt>Slowest</dt><dd>{seeks.n ? `${seeks.max.toFixed(1)} ms` : '–'}</dd></div>
            <div><dt>Seeks</dt><dd>{seeks.n}</dd></div>
          </dl>
          <p className="vsg-hint">
            From the <code>seeking</code> event to <code>seeked</code>, in this browser. Tens of milliseconds means few
            keyframes: see section 04.
          </p>

          <div className="vsg-rail-wrap" aria-hidden="true">
            <span className="vsg-k">Scroll · 0 to {max}px</span>
            <div className="vsg-rail">
              <span
                className="vsg-win"
                style={{ left: at(Math.min(tStart, tEnd)), width: `calc(${at(Math.max(tStart, tEnd))} - ${at(Math.min(tStart, tEnd))})` }}
              />
              <Mark left={at(tStart)} label={`start ${Math.round(tStart)}`} />
              <Mark left={at(tEnd)} label={`end ${Math.round(tEnd)}`} below />
              <span className="vsg-now" style={{ left: at(scroll) }} />
            </div>
          </div>

          {geo && (
            <dl className="vsg-math">
              <div><dt>Window</dt><dd>{geo.v}px tall: the box. Its vh are of it.</dd></div>
              <div>
                <dt>Measured</dt>
                <dd>{s.pin ? 'the track (triggerElement)' : 'the video'}: {geo.top}px down, {geo.h}px tall</dd>
              </div>
              <div>
                <dt>start</dt>
                <dd>‘{startW}’: {geo.top} + {Math.round(edgeOffset(s.start.edge, geo.h))} − {Math.round(lineOffset(s.start.line, geo.v))} = {Math.round(tStart)}px</dd>
              </div>
              <div>
                <dt>end</dt>
                <dd>‘{endW}’: {geo.top} + {Math.round(edgeOffset(s.end.edge, geo.h))} − {Math.round(lineOffset(s.end.line, geo.v))} = {Math.round(tEnd)}px</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>({Math.round(scroll)} − {Math.round(tStart)}) ÷ ({Math.round(tEnd)} − {Math.round(tStart)}) = {raw.toFixed(2)}, clamped</dd>
              </div>
              {s.easing !== 'linear' && <div><dt>Eased</dt><dd>{s.easing}({raw.toFixed(2)}) = {alpha.toFixed(2)}</dd></div>}
              <div>
                <dt>Time</dt>
                <dd>
                  {secs(s.from)} + ({secs(toNow)} − {secs(s.from)}) × {target.toFixed(2)} = {asked !== null ? asked.toFixed(2) : '–'} s
                </dd>
              </div>
            </dl>
          )}

          {(zero || backwards) && (
            <p className="vsg-warn">
              {zero
                ? 'start and end are the same scroll position: a window of no length never scrubs.'
                : 'end comes before start: the film runs backwards, from to back to from, as the page scrolls down.'}
            </p>
          )}
        </div>

        <div className="vsg-poster-area">
          {s.poster !== 'none' && (
            <div className="vsg-poster">
              <span className="vsg-k">poster.jpg · the frame at {pT !== null ? secs(pT) : '–'} s</span>
              {posterNow && 'url' in posterNow ? (
                <>
                  <div
                    className="vsg-thumb" role="img" aria-label={`The poster frame, ${posterNow.width} by ${posterNow.height}`}
                    style={{ backgroundImage: `url(${posterNow.url})`, aspectRatio: `${posterNow.width} / ${posterNow.height}` }}
                  />
                  <p className="vsg-hint">
                    {posterNow.width}×{posterNow.height} JPEG, {Math.round(posterNow.bytes / 1024)} KB, drawn from the video in
                    this browser.{' '}
                    <a className="vsg-btn is-link" href={posterNow.url} download="poster.jpg">↓ Save poster.jpg</a>
                  </p>
                </>
              ) : posterNow && 'error' in posterNow ? (
                <p className="vsg-warn">{posterNow.error}</p>
              ) : (
                <p className="vsg-hint">Drawing the frame…</p>
              )}
              {pT !== null && (
                <p className="vsg-cmd"><code>{posterCommand(source.name, pT)}</code></p>
              )}
            </div>
          )}
        </div>

        {(reduced || rmView) && (
          <p className="vsg-rm">
            {rmView
              ? `With reduced motion on, scrollVideo seeks once to to (${secs(toNow)} s) when the metadata is in, and never follows the scroll. The preview now does the same.`
              : 'Your system asks for reduced motion. On a real page scrollVideo would show the frame at to and not scrub; tick the box above to see that. The preview moves only when you scroll it, and Play steps a quarter at a time.'}
          </p>
        )}
      </div>

      <div className="vsg-code">
        <div className="vsg-tabs" role="tablist" aria-label="Code">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="vsg-tab" onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <CodeBox file={TABS.find((t) => t.key === tab)?.file ?? 'film.js'}>{code}</CodeBox>
        <p className="vsg-hint">
          The HTML, CSS and JavaScript tabs are one page. Options at scrollVideo’s defaults are left out.
          {picked ? ` The downloaded file expects ${picked.name} beside it.` : ' The downloaded file plays this site’s film.'}
        </p>
        <ToolExport
          title="Scroll video scrub"
          filename="scroll-video-scrub.html"
          html={file}
          react={{ slug: SLUG, app: app.app, css: app.css, version }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="vsg-field" role="group" aria-label={label}>
      <span className="vsg-field-k">{label}</span>
      {children}
    </div>
  );
}

function PairPicker({ label, value, onChange }: { label: string; value: Pair; onChange: (p: Pair) => void }) {
  return (
    <span className="vsg-pair">
      <span className="vsg-pair-k">{label}</span>
      <select
        aria-label={`${label}: the edge of the measured element`} value={value.edge}
        onChange={(e) => onChange({ ...value, edge: e.target.value as Edge })}
      >
        {EDGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <select
        aria-label={`${label}: the line across the window`} value={value.line}
        onChange={(e) => onChange({ ...value, line: e.target.value as Line })}
      >
        {LINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </span>
  );
}

function Mark({ left, label, below = false }: { left: string; label: string; below?: boolean }) {
  const p = parseFloat(left);
  const align = p < 12 ? ' is-l' : p > 88 ? ' is-r' : '';
  return (
    <span className={`vsg-mark${below ? ' is-below' : ''}${align}`} style={{ left }}>
      <i>{label}</i>
    </span>
  );
}

function PreviewVideo({
  ref, src, label, ratio, onMeta, onSeeking, onSeeked, onFail,
}: {
  ref: Ref<HTMLVideoElement>;
  src: string;
  label: string;
  ratio?: string;
  onMeta: (el: HTMLVideoElement) => void;
  onSeeking: () => void;
  onSeeked: (el: HTMLVideoElement) => void;
  onFail: (text: string) => void;
}) {
  return (
    <video
      ref={ref}
      className="vsg-video"
      src={src}
      muted
      playsInline
      preload="auto"
      aria-label={label}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        if (!Number.isFinite(el.duration)) {
          onFail('This file does not say how long it is (its duration reads as Infinity), so there is no timeline to scrub. Re-encode it with ffmpeg first.');
        }
        onMeta(el);
      }}
      onSeeking={onSeeking}
      onSeeked={(e) => onSeeked(e.currentTarget)}
      onError={(e) => {
        const code = e.currentTarget.error?.code;
        onFail(
          code === 4
            ? 'This browser cannot play that file: its codec or container is not supported here. Try an MP4 (H.264) or a WebM (VP9).'
            : 'The video could not be read.',
        );
      }}
    />
  );
}
