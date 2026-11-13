'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import type { ScrollDrawInstance } from 'svg-scroll-draw';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { edgeOffset, lineOffset, progressAt, readTrigger, triggerAt } from '@/data/trigger';
import { FILM } from '@/data/videoscrub';
import {
  DEFAULTS, DEMO, DEMO_SEQUENCE, DEMO_SOURCE, EASE, EASE_NAMES, LENGTH, LIB_CONCURRENCY, SLUG,
  bytesText, cssCode, decodedBytes, filesSequence, frameAt, frameName, framesFile, htmlCode, jsCode, nameOf,
  naturalCompare, pinnedRun, presetOf, presetsOf, reactApp, reactCode, stuckFor, videoSequence, windowWords,
  type Fit, type FramesSettings, type Sequence,
} from './frames-code';
import { Cancelled, canEncode, extractFrames, type ImageType } from './extract';
import { zipStore } from './zip';

/**
 * The scroll image sequence generator.
 *
 * - scrollFrames has no scrollContainer option: it reads the window's scroll.
 *   So the box below stands in for the window, and the progress is worked out
 *   from the box's scroll with the library's own arithmetic (data/trigger.ts,
 *   which mirrors core/trigger.ts), eased with core/easing.ts's functions, and
 *   handed to a real scrollFrames instance through seek(). Every pixel on the
 *   canvas is the instance's: its loading order, its nearest-frame fallback,
 *   its fit and its drawing buffer.
 * - The instance is paused as soon as it is made, so its own loop never
 *   follows the window. It is made again (and the old one destroyed) when the
 *   frames, the fit or the canvas change, and destroyed on unmount. The
 *   trigger, easing and once are the preview's arithmetic, so they are not
 *   passed to it; the code is written with them.
 * - Every frame is an object URL in this tab: the demo's are drawn here, yours
 *   are the files you picked, and a video's are drawn from it here. Nothing is
 *   uploaded. A set's URLs are revoked once another set has replaced it (a
 *   task later, after the old instance is gone) and when the tool unmounts.
 * - The demo is drawn once the tool is within 400px of the screen, so the
 *   page above it loads first.
 */

type Tab = 'html' | 'css' | 'js' | 'react';
type Mode = 'demo' | 'files' | 'video';
type FrameSet = {
  id: number;
  seq: Sequence;
  urls: string[];
  /** The images, when the set can be zipped (frames drawn from a video). */
  blobs: Blob[] | null;
  bytes: number;
  /** The video they came from, for a set drawn from one. */
  from: string | null;
};
type Geo = { v: number; top: number; h: number; max: number };
type Picked = { url: string; name: string; own: boolean };
type Run =
  | { state: 'idle' }
  | { state: 'running'; done: number; total: number }
  | { state: 'error'; text: string };

const TABS: { key: Tab; label: string; file: string }[] = [
  { key: 'html', label: 'HTML', file: 'frames.html' },
  { key: 'css', label: 'CSS', file: 'frames.css' },
  { key: 'js', label: 'JavaScript', file: 'frames.js' },
  { key: 'react', label: 'React', file: 'FrameScrub.jsx' },
];
const MODES: { key: Mode; label: string }[] = [
  { key: 'demo', label: 'Demo' },
  { key: 'files', label: 'Your frames' },
  { key: 'video', label: 'From a video' },
];
const FITS: { key: Fit; label: string }[] = [
  { key: 'cover', label: 'cover' },
  { key: 'contain', label: 'contain' },
];
const WIDTHS = [480, 640, 960, 1280, 1920];
const COUNT = { min: 12, max: 300, step: 6 } as const;
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
const IMAGE = /\.(png|jpe?g|webp|avif|gif|bmp)$/i;

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, i: number, count: number) => void;
/** DEMO_SOURCE's drawDemoFrame: the same text the downloaded page runs. */
let demoDraw: Draw | null = null;
function drawDemo(): Draw {
  demoDraw ??= new Function(`${DEMO_SOURCE}\nreturn drawDemoFrame;`)() as Draw;
  return demoDraw;
}

/** The demo's frames as JPEG blobs, drawn a frame at a time. */
async function makeDemo(isLive: () => boolean): Promise<Blob[] | null> {
  const draw = drawDemo();
  const c = document.createElement('canvas');
  c.width = DEMO.width;
  c.height = DEMO.height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const blobs: Blob[] = [];
  for (let i = 0; i < DEMO.count; i++) {
    if (!isLive()) return null;
    draw(ctx, c.width, c.height, i, DEMO.count);
    const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, DEMO.type, DEMO.quality));
    if (!b) return null;
    blobs.push(b);
  }
  return blobs;
}

/** An image's natural size, read from its URL. */
function sizeOf(url: string): Promise<{ w: number; h: number }> {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => no(new Error('That image could not be read.'));
    img.src = url;
  });
}

/** Saves a Blob as `name`; the URL is revoked a task later (Safari cancels it otherwise). */
function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

let nextId = 1;

export function FramesGenerator({ version }: { version: string }) {
  const [s, setS] = useState<FramesSettings>(DEFAULTS);
  const [set, setSet] = useState<FrameSet | null>(null);
  const [mode, setMode] = useState<Mode>('demo');
  const [tab, setTab] = useState<Tab>('js');
  const [geo, setGeo] = useState<Geo | null>(null);
  const [scroll, setScroll] = useState(0);
  const [peak, setPeak] = useState<{ key: string; v: number }>({ key: '', v: 0 });
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<{ key: string; ready: boolean; all: boolean } | null>(null);
  const [rmView, setRmView] = useState(false);
  const [near, setNear] = useState(false);
  const [demoWanted, setDemoWanted] = useState(1);
  const [filesNote, setFilesNote] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pickedMeta, setPickedMeta] = useState<{ url: string; duration: number; w: number; h: number } | null>(null);
  const [exCount, setExCount] = useState(60);
  const [exWidth, setExWidth] = useState(1280);
  const [exType, setExType] = useState<ImageType>('image/webp');
  const [exQuality, setExQuality] = useState(0.8);
  const [webp, setWebp] = useState<boolean | null>(null);
  const [run, setRun] = useState<Run>({ state: 'idle' });
  const [zipping, setZipping] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inst = useRef<ScrollDrawInstance | null>(null);
  const raf = useRef(0);
  const reset = useRef(true);
  const mounted = useRef(false);
  const current = useRef<FrameSet | null>(null);
  const pickedRef = useRef<Picked | null>(null);
  const abort = useRef<AbortController | null>(null);

  const seq = set?.seq ?? DEMO_SEQUENCE;
  const count = seq.count;
  const preset = presetOf(s);

  // ── Geometry of the little page, and where the scroll is in its window ───
  const v = geo?.v ?? VP;
  const tStart = geo ? triggerAt(preset.start, geo.top, geo.h, geo.v) : 0;
  const tEnd = geo ? triggerAt(preset.end, geo.top, geo.h, geo.v) : 0;
  const raw = geo ? progressAt(scroll, tStart, tEnd) : 0;
  const peakKey = `${s.once}|${s.pin}|${s.preset}|${s.length}|${set?.id ?? 0}`;
  const held = s.once ? Math.max(raw, peak.key === peakKey ? peak.v : 0) : raw;
  const alpha = EASE[s.easing](held);
  const target = rmView ? 1 : alpha;
  const frame = frameAt(target, count);
  const max = geo?.max ?? 0;
  const stuck = s.pin && geo !== null && scroll >= geo.top && scroll <= geo.top + geo.h - geo.v;
  const instKey = `${set?.id ?? 0}|${s.fit}|${s.pin}`;
  const st = status && status.key === instKey ? status : null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Draw the demo only once the tool is close to the screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Whether this browser writes WebP (Safari answers a WebP request with PNG).
  useEffect(() => {
    let live = true;
    canEncode('image/webp').then((ok) => {
      if (!live) return;
      setWebp(ok);
      if (!ok) setExType('image/jpeg');
    });
    return () => {
      live = false;
    };
  }, []);

  // The demo: drawn when asked for (on load, and on choosing Demo again).
  useEffect(() => {
    if (!near || !demoWanted) return;
    let live = true;
    makeDemo(() => live).then((blobs) => {
      if (!live || !blobs) return;
      setDemoWanted(0);
      setSet({
        id: nextId++,
        seq: DEMO_SEQUENCE,
        urls: blobs.map((b) => URL.createObjectURL(b)),
        blobs: null,
        bytes: blobs.reduce((n, b) => n + b.size, 0),
        from: null,
      });
    });
    return () => {
      live = false;
    };
  }, [near, demoWanted]);

  // A set's URLs go a task after another set replaces it (the old instance is
  // destroyed first), or when the tool unmounts. The check in the timeout
  // keeps them through a remount (React's StrictMode runs effects twice).
  useEffect(() => {
    current.current = set;
    if (!set) return;
    return () => {
      setTimeout(() => {
        if (!mounted.current || current.current !== set) set.urls.forEach((u) => URL.revokeObjectURL(u));
      }, 0);
    };
  }, [set]);

  // The picked video's URL, the same way; a running extraction stops on unmount.
  useEffect(() => {
    pickedRef.current = picked;
    if (!picked) return;
    return () => {
      setTimeout(() => {
        if (picked.own && (!mounted.current || pickedRef.current !== picked)) URL.revokeObjectURL(picked.url);
      }, 0);
    };
  }, [picked]);
  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    setTimeout(() => {
      if (!mounted.current) abort.current?.abort();
    }, 0);
  }, []);

  // The box's real height and the measured element's place in it: the
  // track when pinned (triggerElement), the canvas itself in the flow.
  useEffect(() => {
    const b = box.current;
    const el = s.pin ? track.current : canvas.current;
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
  }, [s.pin]);

  // The instance: scrollFrames on the preview's canvas with these frames and
  // this fit, paused at once and driven through seek().
  useEffect(() => {
    const el = canvas.current;
    if (!el || !set) return;
    let live = true;
    let made: ScrollDrawInstance | null = null;
    const key = `${set.id}|${s.fit}|${s.pin}`;
    import('svg-scroll-draw/frames').then(({ scrollFrames }) => {
      if (!live) return;
      made = scrollFrames(el, {
        frames: set.urls,
        fit: s.fit,
        onReady: () => setStatus((o) => ({ key, ready: true, all: o?.key === key ? o.all : false })),
        onLoad: () => setStatus((o) => ({ key, ready: o?.key === key ? o.ready : true, all: true })),
      });
      made.pause();
      inst.current = made;
      setTick((n) => n + 1);
    });
    return () => {
      live = false;
      made?.destroy();
      if (inst.current === made) inst.current = null;
    };
  }, [set, s.fit, s.pin]);

  // The scrub itself: every change of progress is one seek() on the instance.
  useEffect(() => {
    if (tick) inst.current?.seek(target);
  }, [target, tick]);

  const set_ = (patch: Partial<FramesSettings>) => setS((o) => ({ ...o, ...patch }));

  /** A new set of frames; the box stays where it is scrolled. */
  function replace(next: Omit<FrameSet, 'id'>) {
    stop();
    setSet({ ...next, id: nextId++ });
  }

  function setPin(pin: boolean) {
    if (pin === s.pin) return;
    reset.current = true;
    set_({ pin, preset: presetsOf(pin)[0].key });
  }

  function chooseMode(m: Mode) {
    setMode(m);
    if (m === 'demo' && set?.seq.kind !== 'demo') setDemoWanted((n) => n + 1);
  }

  // ── Your own frames ─────────────────────────────────────────────────────
  async function takeFiles(list: File[]) {
    const imgs = list.filter((f) => f.type.startsWith('image/') || IMAGE.test(f.name));
    const skipped = list.length - imgs.length;
    if (!imgs.length) {
      setFilesNote(list.length ? 'None of those are images: pick PNG, JPEG, WebP, AVIF or GIF files.' : null);
      return;
    }
    const sorted = [...imgs].sort((a, b) => naturalCompare(a.name, b.name));
    const urls = sorted.map((f) => URL.createObjectURL(f));
    const size = await sizeOf(urls[0]).catch(() => null);
    setFilesNote(skipped ? `${skipped} file${skipped === 1 ? ' was' : 's were'} not an image and left out.` : null);
    replace({
      seq: filesSequence(sorted.map((f) => f.name), size?.w ?? null, size?.h ?? null),
      urls,
      blobs: null,
      bytes: sorted.reduce((n, f) => n + f.size, 0),
      from: null,
    });
  }

  function pickFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    void takeFiles(files);
  }

  function dropFiles(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    void takeFiles([...e.dataTransfer.files]);
  }

  // ── From a video ────────────────────────────────────────────────────────
  function cancel() {
    abort.current?.abort();
    abort.current = null;
  }

  function pickVideo(next: Picked) {
    cancel();
    setRun({ state: 'idle' });
    setPicked(next);
    // Its length and size, for the readout: a throwaway element, metadata only.
    const probe = document.createElement('video');
    probe.muted = true;
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      setPickedMeta({ url: next.url, duration: probe.duration, w: probe.videoWidth, h: probe.videoHeight });
      probe.removeAttribute('src');
      probe.load();
    };
    probe.onerror = () => {
      setRun({ state: 'error', text: 'This browser cannot read that video. Try an MP4 (H.264) or a WebM (VP9).' });
    };
    probe.src = next.url;
  }

  function pickVideoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Read in place: the file never leaves this browser.
    pickVideo({ url: URL.createObjectURL(file), name: file.name, own: true });
  }

  async function extract() {
    if (!picked) return;
    cancel();
    const ac = new AbortController();
    abort.current = ac;
    const type = exType;
    setRun({ state: 'running', done: 0, total: exCount });
    try {
      const r = await extractFrames(picked.url, {
        count: exCount,
        maxWidth: exWidth,
        type,
        quality: exQuality,
        signal: ac.signal,
        onProgress: (done, total) => {
          if (!ac.signal.aborted) setRun({ state: 'running', done, total });
        },
      });
      if (ac.signal.aborted) return;
      const ext = type === 'image/webp' ? '.webp' : '.jpg';
      replace({
        seq: videoSequence(r.blobs.length, ext, r.width, r.height),
        urls: r.blobs.map((b) => URL.createObjectURL(b)),
        blobs: r.blobs,
        bytes: r.blobs.reduce((n, b) => n + b.size, 0),
        from: picked.name,
      });
      setRun({ state: 'idle' });
    } catch (e) {
      if (e instanceof Cancelled || ac.signal.aborted) setRun({ state: 'idle' });
      else setRun({ state: 'error', text: e instanceof Error ? e.message : 'The frames could not be drawn.' });
    } finally {
      if (abort.current === ac) abort.current = null;
    }
  }

  async function downloadZip() {
    if (!set?.blobs || zipping) return;
    setZipping(true);
    try {
      const n = set.seq.naming;
      const ext = n.kind === 'pattern' ? n.ext : '.webp';
      const zip = await zipStore(set.blobs.map((b, i) => ({ name: `frames/${frameName(i, ext)}`, data: b })));
      saveBlob('frames.zip', zip);
    } finally {
      setZipping(false);
    }
  }

  // ── The preview's transport ─────────────────────────────────────────────
  function stop() {
    cancelAnimationFrame(raf.current);
  }

  function jump(y: number) {
    stop();
    const b = box.current;
    if (b) b.scrollTop = clamp(y, 0, max);
  }

  function onScroll(y: number) {
    setScroll(y);
    if (!s.once || !geo) return;
    const p = progressAt(y, tStart, tEnd);
    setPeak((o) => ({ key: peakKey, v: Math.max(o.key === peakKey ? o.v : 0, p) }));
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
    if (tab === 'html') return htmlCode(s, seq);
    if (tab === 'css') return cssCode(s, seq);
    if (tab === 'react') return reactCode(s, seq);
    return jsCode(s, seq);
  }, [tab, s, seq]);
  const file = useMemo(() => framesFile(s, seq, version), [s, seq, version]);
  const app = useMemo(() => reactApp(s, seq), [s, seq]);

  // ── Readouts ────────────────────────────────────────────────────────────
  const run1 = pinnedRun(s);
  const zero = geo !== null && tEnd === tStart;
  const at = (y: number) => `${max > 0 ? clamp((y / max) * 100, 0, 100) : 0}%`;
  const lineAt = (w: string) => clamp(lineOffset(readTrigger(w).line, v), 0, v - 1);
  const startR = readTrigger(preset.start);
  const endR = readTrigger(preset.end);
  const w = seq.width;
  const h = seq.height;
  const bytes = set?.bytes ?? 0;
  const busy = run.state === 'running';
  const pm = pickedMeta && picked && pickedMeta.url === picked.url ? pickedMeta : null;
  const outW = pm ? Math.min(exWidth, pm.w) : exWidth;
  const outH = pm && pm.w ? Math.round((outW * pm.h) / pm.w) : null;
  const ratioCss = w && h ? `${w} / ${h}` : '16 / 10';

  const canvasEl = (
    <canvas
      key={s.pin ? 'pin' : 'flow'}
      ref={canvas}
      className="isg-canvas"
      role="img"
      aria-label={seq.label}
      style={s.pin ? undefined : { aspectRatio: ratioCss }}
    />
  );

  return (
    <div ref={root} className="vsg isg">
      <div className="vsg-panel">
        <div className="isg-source">
          <Field label="The frames">
            <span className="vsg-seg" role="radiogroup" aria-label="Where the frames come from">
              {MODES.map((m) => (
                <button key={m.key} type="button" role="radio" aria-checked={mode === m.key} onClick={() => chooseMode(m.key)}>
                  {m.label}
                </button>
              ))}
            </span>
          </Field>

          {mode === 'demo' && (
            <p className="vsg-hint">
              {DEMO.count} frames of a box turning half a turn, {DEMO.width}×{DEMO.height} JPEGs drawn in this browser
              with canvas 2D, so the preview needs nothing from a server. The code is written for the same frames
              hosted as <code>frames/{frameName(0, '.jpg')}</code> … <code>{frameName(DEMO.count - 1, '.jpg')}</code>.
            </p>
          )}

          {mode === 'files' && (
            <div className="isg-pane">
              <label
                className="isg-drop"
                data-over={dragOver ? true : undefined}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={dropFiles}
              >
                <input type="file" accept="image/*" multiple onChange={pickFiles} aria-describedby="isg-files-note" />
                <span className="isg-drop-t">Drop your frames here, or pick them</span>
                <span className="vsg-hint">Many images at once: PNG, JPEG, WebP or AVIF.</span>
              </label>
              <p className="vsg-hint" id="isg-files-note">
                Put in order by file name, the way people number them: frame2 before frame10. They stay in this browser
                and are never uploaded.
              </p>
              {filesNote && <p className="vsg-warn" role="status">{filesNote}</p>}
            </div>
          )}

          {mode === 'video' && (
            <div className="isg-pane">
              <div className="isg-row">
                <span className="vsg-seg">
                  <label className="vsg-pick" data-on={picked?.own ? true : undefined}>
                    <input type="file" accept="video/*" onChange={pickVideoFile} disabled={busy} aria-describedby="isg-video-note" />
                    <span>{picked?.own ? 'Another video…' : 'Pick a video…'}</span>
                  </label>
                  <button
                    type="button" aria-pressed={picked !== null && !picked.own} disabled={busy}
                    onClick={() => pickVideo({ url: FILM.src, name: FILM.file, own: false })}
                  >
                    This site’s film
                  </button>
                </span>
              </div>
              <p className="vsg-hint" id="isg-video-note">
                {picked ? (
                  <>
                    <b>{picked.name}</b>
                    {pm ? ` · ${pm.w}×${pm.h}${Number.isFinite(pm.duration) ? ` · ${Math.round(pm.duration * 100) / 100} s` : ''}` : ''}
                    {picked.own ? ' · read from this browser’s memory, never uploaded.' : ` · ${FILM.codec}, from this site.`}
                  </>
                ) : (
                  'Any video this browser can play. It is sought to each time in turn and drawn onto a canvas, here: nothing is uploaded.'
                )}
              </p>

              <div className="isg-opts">
                <Field label={`Frames · ${exCount}`}>
                  <span className="vsg-range">
                    <input
                      type="range" min={COUNT.min} max={COUNT.max} step={COUNT.step} value={exCount} disabled={busy}
                      aria-label="How many frames to take from the video"
                      onChange={(e) => setExCount(Number(e.target.value))}
                    />
                    <output className="vsg-val">{exCount}</output>
                  </span>
                </Field>
                <Field label="Width">
                  <span className="isg-select">
                    <select
                      aria-label="The widest a frame may be, in pixels" value={exWidth} disabled={busy}
                      onChange={(e) => setExWidth(Number(e.target.value))}
                    >
                      {WIDTHS.map((n) => <option key={n} value={n}>{n}px</option>)}
                    </select>
                    <span className="vsg-hint">{outH ? `${outW}×${outH} each` : 'never wider than the video'}</span>
                  </span>
                </Field>
                <Field label="Format">
                  <span className="vsg-seg" role="radiogroup" aria-label="Image format">
                    <button
                      type="button" role="radio" aria-checked={exType === 'image/webp'} disabled={busy || webp === false}
                      onClick={() => setExType('image/webp')}
                    >
                      WebP
                    </button>
                    <button type="button" role="radio" aria-checked={exType === 'image/jpeg'} disabled={busy} onClick={() => setExType('image/jpeg')}>
                      JPEG
                    </button>
                  </span>
                  {webp === false && <span className="vsg-hint">This browser’s canvas cannot write WebP, so JPEG it is.</span>}
                </Field>
                <Field label={`Quality · ${Math.round(exQuality * 100)}`}>
                  <span className="vsg-range">
                    <input
                      type="range" min={0.5} max={0.95} step={0.05} value={exQuality} disabled={busy}
                      aria-label="Image quality, 50 to 95"
                      onChange={(e) => setExQuality(Number(e.target.value))}
                    />
                    <output className="vsg-val">{Math.round(exQuality * 100)}</output>
                  </span>
                </Field>
              </div>

              <div className="isg-row">
                {busy ? (
                  <>
                    <div
                      className="isg-bar" role="progressbar" aria-label="Frames drawn"
                      aria-valuemin={0} aria-valuemax={run.total} aria-valuenow={run.done}
                    >
                      <span style={{ width: `${(run.done / Math.max(1, run.total)) * 100}%` }} />
                    </div>
                    <span className="isg-count">{run.done} / {run.total}</span>
                    <button type="button" className="vsg-btn" onClick={cancel}>Cancel</button>
                  </>
                ) : (
                  <button type="button" className="vsg-btn is-solid" onClick={extract} disabled={!picked}>
                    Extract {exCount} frames
                  </button>
                )}
              </div>
              {run.state === 'error' && <p className="vsg-warn" role="alert">{run.text}</p>}
            </div>
          )}

          {set && set.blobs && (
            <div className="isg-row isg-zip">
              <button type="button" className="vsg-btn" onClick={downloadZip} disabled={zipping}>
                {zipping ? 'Zipping…' : `↓ Download frames.zip · ${set.seq.count} files · ${bytesText(set.bytes)}`}
              </button>
              <span className="vsg-hint">
                Drawn from <b>{set.from}</b>: <code>frames/{nameOf(set.seq.naming, 0)}</code> to{' '}
                <code>{nameOf(set.seq.naming, set.seq.count - 1)}</code>, stored uncompressed (the images are).
              </span>
            </div>
          )}
        </div>

        <div className="vsg-controls">
          <Field label="Pin the canvas while it scrubs">
            <span className="vsg-seg" role="radiogroup" aria-label="Pin the canvas while it scrubs">
              <button type="button" role="radio" aria-checked={s.pin} onClick={() => setPin(true)}>Pinned · sticky</button>
              <button type="button" role="radio" aria-checked={!s.pin} onClick={() => setPin(false)}>In the flow</button>
            </span>
            <span className="vsg-hint">
              {s.pin
                ? 'A sticky stage in a tall track; scrollFrames measures the track (triggerElement). The usual pattern.'
                : 'The canvas scrolls with the page; scrollFrames measures the canvas.'}
            </span>
          </Field>

          <Field label={s.pin ? `Scroll length · track ${s.length}vh` : 'Scroll length'}>
            {s.pin ? (
              <>
                <span className="vsg-range">
                  <input
                    type="range" min={LENGTH.min} max={LENGTH.max} step={LENGTH.step} value={s.length}
                    aria-label="Track height in vh: the scroll room the frames run over"
                    onChange={(e) => set_({ length: Number(e.target.value) })}
                  />
                  <output className="vsg-val">{s.length}vh</output>
                </span>
                <span className="vsg-hint">
                  Stuck for {stuckFor(s)}vh; the frames run over {run1}vh of scroll
                  {run1 === stuckFor(s) ? ', exactly while stuck' : ''}: {count > 1 ? `${Math.round((run1 / (count - 1)) * 100) / 100}vh` : '–'} a frame.
                </span>
              </>
            ) : (
              <span className="vsg-hint">Set by the window and the canvas’s height: {windowWords(preset)}.</span>
            )}
          </Field>

          <Field label="Trigger window">
            <span className="vsg-seg" role="radiogroup" aria-label="Trigger window">
              {presetsOf(s.pin).map((p) => (
                <button key={p.key} type="button" role="radio" aria-checked={preset.key === p.key} onClick={() => set_({ preset: p.key })}>
                  {p.label}
                </button>
              ))}
            </span>
            <span className="vsg-hint">
              <code>{`'${preset.start}' → '${preset.end}'`}</code>. {preset.what}
            </span>
          </Field>

          <Field label="Fit">
            <span className="vsg-seg" role="radiogroup" aria-label="Fit">
              {FITS.map((f) => (
                <button key={f.key} type="button" role="radio" aria-checked={s.fit === f.key} onClick={() => set_({ fit: f.key })}>
                  {f.label}
                </button>
              ))}
            </span>
            <span className="vsg-hint">
              {s.fit === 'cover'
                ? 'Fills the canvas and crops what does not fit, centred. The default.'
                : 'Shows the whole frame inside the canvas, centred, with empty bands where the shapes differ.'}
            </span>
          </Field>

          <Field label="Easing">
            <span className="vsg-seg is-wrap" role="radiogroup" aria-label="Easing">
              {EASE_NAMES.map((e) => (
                <button key={e} type="button" role="radio" aria-checked={s.easing === e} onClick={() => set_({ easing: e })}>
                  {e}
                </button>
              ))}
            </span>
            <span className="vsg-hint">
              {s.easing === 'linear'
                ? 'One scroll pixel is the same slice of the sequence everywhere.'
                : `Progress ${held.toFixed(2)} becomes ${alpha.toFixed(2)}: ${s.easing === 'ease-in' ? 'slow at the start, fast at the end' : s.easing === 'ease-out' ? 'fast at the start, slow at the end' : 'slow at both ends'}.`}
            </span>
          </Field>

          <Field label="Once">
            <label className="vsg-check">
              <input type="checkbox" checked={s.once} onChange={(e) => set_({ once: e.target.checked })} />
              <span>Hold the furthest frame reached</span>
            </label>
            <span className="vsg-hint">
              {s.once ? 'Scrolling back up does not turn it back.' : 'Scrolling back up turns it back, frame by frame.'}
            </span>
          </Field>
        </div>

        <div className="vsg-view">
          <p className="vsg-k">
            Window · {v}px tall · scroll it · {s.pin ? (stuck ? 'the stage is stuck' : 'the stage scrolls') : 'the canvas is measured'}
          </p>
          <div className="vsg-frame">
            <div
              ref={box}
              className="vsg-box"
              tabIndex={0}
              role="region"
              aria-label="Preview window: scroll it to scrub the frames"
              onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
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
                  <div className="vsg-stage">{canvasEl}</div>
                </div>
              ) : (
                <div className="vsg-inflow">{canvasEl}</div>
              )}
              <div className="vsg-flow is-after">
                <span>Content after</span>
              </div>
            </div>
            <div className="vsg-overlay" aria-hidden="true">
              <span className={`vsg-line${lineAt(preset.start) < 18 ? ' is-low' : ''}`} style={{ top: lineAt(preset.start) }}>
                <i>start · {startR.line}</i>
              </span>
              <span className={`vsg-line is-end${lineAt(preset.end) < 18 ? ' is-low' : ''}`} style={{ top: lineAt(preset.end) }}>
                <i>end · {endR.line}</i>
              </span>
            </div>
            {!set && <p className="isg-wait">Drawing the demo frames…</p>}
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
              <span className="vsg-k">Frame</span>
              <output className="vsg-num" aria-label="The frame the scroll calls for, counted from 0">
                {frame}<small> / {count - 1}</small>
              </output>
            </div>
          </div>
          <p className="vsg-tl-read">
            {set
              ? <><code>{nameOf(seq.naming, frame)}</code> · {st?.all ? `all ${count} frames loaded` : st?.ready ? 'loading the rest, nearest loaded frame shown' : 'loading'}.</>
              : 'Waiting for the frames.'}
          </p>

          <dl className="vsg-seeks">
            <div><dt>Frames</dt><dd>{count}</dd></div>
            <div><dt>Each</dt><dd>{w && h ? `${w}×${h}` : '–'}</dd></div>
            <div><dt>All, on disk</dt><dd>{set ? bytesText(bytes) : '–'}</dd></div>
          </dl>
          <p className="vsg-hint">
            {set ? `${bytesText(Math.round(bytes / Math.max(1, count)))} a frame on average` : ''}
            {set && w && h ? `; decoded, ${bytesText(decodedBytes(count, w, h))} at 4 bytes a pixel` : ''}
            {set ? '. ' : ''}A visitor downloads every one of them (the last only, under reduced motion).
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
                <dd>{s.pin ? 'the track (triggerElement)' : 'the canvas'}: {geo.top}px down, {geo.h}px tall</dd>
              </div>
              <div>
                <dt>start</dt>
                <dd>‘{preset.start}’: {geo.top} + {Math.round(edgeOffset(startR.edge, geo.h))} − {Math.round(lineOffset(startR.line, geo.v))} = {Math.round(tStart)}px</dd>
              </div>
              <div>
                <dt>end</dt>
                <dd>‘{preset.end}’: {geo.top} + {Math.round(edgeOffset(endR.edge, geo.h))} − {Math.round(lineOffset(endR.line, geo.v))} = {Math.round(tEnd)}px</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>({Math.round(scroll)} − {Math.round(tStart)}) ÷ ({Math.round(tEnd)} − {Math.round(tStart)}) = {raw.toFixed(2)}, clamped{s.once && held > raw ? `; held at ${held.toFixed(2)} (once)` : ''}</dd>
              </div>
              {s.easing !== 'linear' && <div><dt>Eased</dt><dd>{s.easing}({held.toFixed(2)}) = {alpha.toFixed(2)}</dd></div>}
              <div>
                <dt>Frame</dt>
                <dd>round({target.toFixed(2)} × ({count} − 1)) = {frame}</dd>
              </div>
            </dl>
          )}
          {zero && <p className="vsg-warn">start and end are the same scroll position: a window of no length never scrubs.</p>}
        </div>

        {(reduced || rmView) && (
          <p className="vsg-rm">
            {rmView
              ? `With reduced motion on, scrollFrames loads only the last frame (${nameOf(seq.naming, count - 1)}), draws it, and never follows the scroll. The preview shows that frame.`
              : 'Your system asks for reduced motion, so the preview’s scrollFrames loaded and drew only the last frame, as it would on a real page; tick the box above to see what the scroll would call for instead. The preview moves only when you scroll it, and Play steps a quarter at a time.'}
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
        <CodeBox file={TABS.find((t) => t.key === tab)?.file ?? 'frames.js'}>{code}</CodeBox>
        <p className="vsg-hint">
          The HTML, CSS and JavaScript tabs are one page; options at scrollFrames’ defaults are left out (concurrency
          stays at {LIB_CONCURRENCY}).{' '}
          {seq.kind === 'demo'
            ? 'The downloaded file draws the demo frames itself, so it runs on its own.'
            : seq.kind === 'video'
              ? 'The downloaded file expects the frames/ folder from frames.zip beside it.'
              : `The downloaded file expects your ${count} frames in a frames/ folder beside it.`}
          {seq.naming.kind === 'list' ? ' Your file names do not follow one numbered pattern, so the code lists them.' : ''}
        </p>
        <ToolExport
          title="Scroll image sequence"
          filename="scroll-image-sequence.html"
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

function Mark({ left, label, below = false }: { left: string; label: string; below?: boolean }) {
  const p = parseFloat(left);
  const align = p < 12 ? ' is-l' : p > 88 ? ' is-r' : '';
  return (
    <span className={`vsg-mark${below ? ' is-below' : ''}${align}`} style={{ left }}>
      <i>{label}</i>
    </span>
  );
}
