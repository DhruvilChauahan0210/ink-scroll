/**
 * The scroll video scrub generator's model and the code it writes. Pure
 * functions, no DOM: the page (server) and the tool (client) both read them,
 * so what the page says and what the tool writes cannot drift apart.
 *
 * Every figure about scrollVideo here is read from packages/svg-scroll-draw/
 * src/video/index.ts: the window defaults to 'top top' → 'bottom top', easing
 * to 'linear', `from` to 0 and `to` to the video's duration, read once its
 * metadata has loaded; the time written is from + (to − from) × eased progress.
 * The trigger arithmetic is data/trigger.ts, which mirrors core/trigger.ts.
 */

import { SITE_HOST, cdnModule, escapeHtml, htmlFile, withSource } from '@/lib/tool-export';
import { defaultsOf, edgeOffset, lineOffset, pairWords, readTrigger } from '@/data/trigger';
import { FILM } from '@/data/videoscrub';

export const SLUG = 'scroll-video-scrub-generator';

export type Edge = 'top' | 'center' | 'bottom';
export type Line = 'top' | '25%' | 'center' | '75%' | 'bottom';
export const EDGE_OPTIONS: readonly Edge[] = ['top', 'center', 'bottom'];
export const LINE_OPTIONS: readonly Line[] = ['top', '25%', 'center', '75%', 'bottom'];

export type Pair = { edge: Edge; line: Line };
export type EaseName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type PosterAt = 'none' | 'first' | 'last';

export type ScrubSettings = {
  /** Pinned: a sticky stage in a tall track, measured with triggerElement. */
  pin: boolean;
  /** The track's height in vh, when pinned. */
  length: number;
  start: Pair;
  end: Pair;
  easing: EaseName;
  /** Seconds. */
  from: number;
  /** Seconds; null is the end of the file (the option left out). */
  to: number | null;
  poster: PosterAt;
};

/**
 * The four smooth easings, as core/easing.ts EASINGS defines them. The library
 * does not export that table, so it is repeated here; keep the two in step.
 * spring, bounce and elastic are left out on purpose (see the page).
 */
export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};
export const EASE_NAMES = Object.keys(EASE) as EaseName[];

const words = (p: Pair) => `${p.edge} ${p.line}`;
const pairOf = (s: string): Pair => {
  const [edge, line] = s.split(' ') as [Edge, Line];
  return { edge, line };
};

/** scrollVideo's own window when `trigger` is left out (video/index.ts). */
export const LIB_WINDOW = defaultsOf('scrollVideo');
const LIB_START = pairOf(LIB_WINDOW.start);
const LIB_END = pairOf(LIB_WINDOW.end);

export type Preset = { key: string; label: string; start: Pair; end: Pair; what: string };

export const PIN_PRESETS: Preset[] = [
  {
    key: 'stuck',
    label: 'While stuck',
    start: { edge: 'top', line: 'top' },
    end: { edge: 'bottom', line: 'bottom' },
    what: 'Exactly while the stage is stuck: from the track’s top at the window’s top to its bottom at the window’s bottom.',
  },
  {
    key: 'pass',
    label: 'Whole pass',
    start: { edge: 'top', line: 'bottom' },
    end: { edge: 'bottom', line: 'top' },
    what: 'From the track’s first pixel on screen to its last, so the film also runs while the stage scrolls in and out.',
  },
];

export const FLOW_PRESETS: Preset[] = [
  {
    key: 'default',
    label: 'Default',
    start: LIB_START,
    end: LIB_END,
    what: 'scrollVideo’s own window: from the video’s top at the window’s top until its bottom gets there, so it plays as it leaves.',
  },
  {
    key: 'pass',
    label: 'Whole pass',
    start: { edge: 'top', line: 'bottom' },
    end: { edge: 'bottom', line: 'top' },
    what: 'From the moment its top comes into view until its bottom has left.',
  },
  {
    key: 'middle',
    label: 'Middle band',
    start: { edge: 'top', line: '75%' },
    end: { edge: 'bottom', line: '25%' },
    what: 'While it crosses the middle half of the window.',
  },
];

export const presetsOf = (pin: boolean) => (pin ? PIN_PRESETS : FLOW_PRESETS);
export const samePair = (a: Pair, b: Pair) => a.edge === b.edge && a.line === b.line;
export const presetAt = (s: ScrubSettings) =>
  presetsOf(s.pin).find((p) => samePair(p.start, s.start) && samePair(p.end, s.end)) ?? null;

export const LENGTH = { min: 150, max: 800, step: 25 } as const;

export const DEFAULTS: ScrubSettings = {
  pin: true,
  length: 400,
  start: PIN_PRESETS[0].start,
  end: PIN_PRESETS[0].end,
  easing: 'linear',
  from: 0,
  to: FILM.to,
  poster: 'none',
};

// ── The video the code is written for ───────────────────────────────────────

export type Source = {
  /** The file name the listings use. */
  name: string;
  /** Where the runnable files load it from: the site's URL, or the bare name. */
  runSrc: string;
  /** True for the site's own film, which the runnable files can play as they are. */
  hosted: boolean;
  /** The video's aria-label. */
  label: string;
  /** Seconds, once known. */
  duration: number | null;
};

export const FILM_SOURCE: Source = {
  name: FILM.file,
  runSrc: `https://${SITE_HOST}${FILM.src}`,
  hosted: true,
  label: FILM.label,
  duration: FILM.duration,
};

export const fileSource = (name: string, duration: number | null): Source => ({
  name,
  runSrc: encodeURI(name),
  hosted: false,
  label: 'Describe what the video shows',
  duration,
});

// ── Numbers ──────────────────────────────────────────────────────────────────

/** Seconds as the code writes them: at most two decimals. */
export const secs = (t: number) => String(Math.round(t * 100) / 100);

/** The `to` the code passes, or null when it is the end of the file (left out). */
export function toOption(s: ScrubSettings, src: Source): number | null {
  if (s.to === null) return null;
  if (src.duration !== null && Math.abs(s.to - src.duration) < 0.005) return null;
  return s.to;
}

/** The time scrollVideo writes at eased progress `alpha` (video/index.ts applyAlpha). */
export function timeAt(s: ScrubSettings, duration: number, alpha: number): number {
  const to = s.to ?? duration;
  return s.from + (to - s.from) * alpha;
}

/**
 * The scroll the film runs over while pinned, in vh: the window between the
 * two trigger positions on a track `length` vh tall in a 100vh window.
 */
export function pinnedRun(s: ScrubSettings): number {
  const at = (p: Pair) => edgeOffset(p.edge, s.length) - lineOffset(p.line, 100);
  return Math.round((at(s.end) - at(s.start)) * 100) / 100;
}

/** How long the stage stays stuck: the track less one window. */
export const stuckFor = (s: ScrubSettings) => s.length - 100;

/**
 * The film's run in flow, as a share of the video's height plus vh:
 * { video: 1, vh: 0 } is "the video's own height".
 */
export function flowRun(s: ScrubSettings): { video: number; vh: number } {
  return {
    video: edgeOffset(s.end.edge, 1) - edgeOffset(s.start.edge, 1),
    vh: lineOffset(s.start.line, 100) - lineOffset(s.end.line, 100),
  };
}

/** Where the trigger window is, in words. */
export const windowWords = (s: ScrubSettings) =>
  `from when ${pairWords(readTrigger(words(s.start)))} until ${pairWords(readTrigger(words(s.end)))}`;

// ── The listings ─────────────────────────────────────────────────────────────

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function optionLines(s: ScrubSettings, src: Source, track: string): string[] {
  const out: string[] = [];
  if (s.pin) {
    out.push("// The stage is sticky, so the video's own box moves with the scroll.");
    out.push('// Measure the track that holds the scroll room instead.');
    out.push(`triggerElement: ${track},`);
  }
  if (!samePair(s.start, LIB_START) || !samePair(s.end, LIB_END)) {
    out.push(`trigger: { start: '${words(s.start)}', end: '${words(s.end)}' },`);
  }
  if (s.from !== 0) out.push(`from: ${secs(s.from)}, // the scrub starts ${secs(s.from)} s in`);
  const to = toOption(s, src);
  if (to !== null) {
    const why = src.hosted && to === FILM.to ? 'stills follow the film in this file' : `and stops at ${secs(to)} s`;
    out.push(`to: ${secs(to)}, // ${why}`);
  }
  if (s.easing !== 'linear') out.push(`easing: '${s.easing}',`);
  return out;
}

function jsBody(s: ScrubSettings, src: Source, from: string): string {
  const opts = optionLines(s, src, "document.querySelector('#film-track')");
  const call = opts.length
    ? `const film = scrollVideo(document.querySelector('#film'), {\n${opts.map((l) => `  ${l}`).join('\n')}\n});`
    : `// Every option at its default: it scrubs ${windowWords(s)}.\nconst film = scrollVideo(document.querySelector('#film'));`;
  return `import { scrollVideo } from '${from}';

${call}

// film.destroy() lets the video go. With reduced motion on, scrollVideo
// shows the frame at \`to\` and does not scrub.`;
}

function videoAttrs(s: ScrubSettings, src: Source, jsx: boolean): string {
  const poster = s.poster === 'none' ? '' : jsx ? ' poster="/poster.jpg"' : ' poster="poster.jpg"';
  const label = jsx ? ` aria-label=${JSON.stringify(src.label)}` : ` aria-label="${escapeHtml(src.label)}"`;
  return jsx
    ? `muted playsInline preload="auto"${poster}${label}`
    : `muted playsinline preload="auto"${poster}${label}`;
}

/** The markup: a track and a sticky stage, or the video in the flow. */
export function markup(s: ScrubSettings, src: Source, href = encodeURI(src.name)): string {
  const video = `<video id="film"${s.pin ? '' : ' class="film"'} src="${escapeHtml(href)}"\n  ${videoAttrs(s, src, false)}></video>`;
  if (!s.pin) return video;
  return [
    '<section class="film-track" id="film-track">',
    '  <div class="film-stage">',
    video.split('\n').map((l) => `    ${l}`).join('\n'),
    '  </div>',
    '</section>',
  ].join('\n');
}

/** The stylesheet. Pinned, its comment gives the scroll the film runs over. */
export function css(s: ScrubSettings): string {
  if (!s.pin) {
    return `/* In the flow: the video scrolls with the page, and scrollVideo
   measures the video itself. */
.film {
  display: block;
  width: 100%;
  height: auto;
}`;
  }
  const run = pinnedRun(s);
  const stuck = stuckFor(s);
  const same = run === stuck;
  return `/* The track holds the scroll room: the stage stays stuck for the
   track's height less one window (${stuck}vh), and ${same ? 'the film runs over exactly that' : `the trigger runs the film over ${run}vh of scroll`}. */
.film-track {
  position: relative;
  height: ${s.length}vh;
}

.film-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh; /* never taller than a phone's smallest window */
}

.film-stage video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}`;
}

function reactComponent(s: ScrubSettings, src: Source, client: boolean): string {
  const opts = optionLines(s, src, 'track.current');
  const call = opts.length
    ? `scrollVideo(video.current, {\n${opts.map((l) => `      ${l}`).join('\n')}\n    })`
    : 'scrollVideo(video.current)';
  const tag = `<video ref={video}${s.pin ? '' : ' className="film"'} src={src} ${videoAttrs(s, src, true)} />`;
  const body = s.pin
    ? `    <section ref={track} className="film-track">
      <div className="film-stage">
        ${tag}
      </div>
    </section>`
    : `    ${tag}`;
  return `${client ? "'use client';\n\n" : ''}import { useEffect, useRef } from 'react';
import { scrollVideo } from 'svg-scroll-draw/video';

export function FilmScrub({ src = ${q(`/${encodeURI(src.name)}`)} }) {
${s.pin ? '  const track = useRef(null);\n' : ''}  const video = useRef(null);

  useEffect(() => {
    const film = ${call};
    return () => film.destroy();
  }, [src]);

  return (
${body}
  );
}`;
}

export const jsCode = (s: ScrubSettings, src: Source) => withSource(jsBody(s, src, 'svg-scroll-draw/video'), SLUG, 'js');
export const htmlCode = (s: ScrubSettings, src: Source) => withSource(markup(s, src), SLUG, 'html');
export const cssCode = (s: ScrubSettings) => withSource(css(s), SLUG, 'css');
export const reactCode = (s: ScrubSettings, src: Source) => withSource(reactComponent(s, src, true), SLUG, 'jsx');

// ── Whole files ──────────────────────────────────────────────────────────────

const PAGE_CSS = `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; color: #ece8e1; background: #121212; }
.spacer { display: grid; place-items: center; height: 100vh; color: #8a867f; }`;

function sourceNote(s: ScrubSettings, src: Source): string {
  const lines = src.hosted
    ? ['The film is svg-scroll-draw’s own, from its site. Use yours, encoded', 'with a keyframe every few frames.']
    : [`Put ${src.name} next to this file, and open it from a server`, 'that answers Range requests (npx serve, for one).'];
  if (s.poster !== 'none') lines.push('poster.jpg: save it from the generator, or make it with ffmpeg.');
  return `<!-- ${lines.join('\n     ')} -->`;
}

/** A complete page running the scrub, the library from jsDelivr. */
export function scrubFile(s: ScrubSettings, src: Source, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'Scroll video scrub',
    css: `${PAGE_CSS}\n\n${css(s)}`,
    body: [
      '<div class="spacer">Scroll down</div>',
      '',
      sourceNote(s, src),
      markup(s, src, src.runSrc),
      '',
      '<div class="spacer">After the film</div>',
    ].join('\n'),
    script: jsBody(s, src, cdnModule(version, 'video')),
  });
}

/** The React project for StackBlitz: the component, and a page to scroll it in. */
export function reactApp(s: ScrubSettings, src: Source): { app: string; css: string } {
  const where = src.hosted
    ? `${q(src.runSrc)}; // svg-scroll-draw's own film`
    : `${q(`/${encodeURI(src.name)}`)}; // put ${src.name.replace(/\n/g, ' ')} in public/`;
  return {
    app: `${reactComponent(s, src, false)}

const SRC = ${where}

export default function App() {
  return (
    <>
      <div className="spacer">Scroll down</div>
      <FilmScrub src={SRC} />
      <div className="spacer">After the film</div>
    </>
  );
}`,
    css: `${PAGE_CSS}\n\n${css(s)}\n`,
  };
}

// ── The poster ───────────────────────────────────────────────────────────────

/** The time the poster's frame is at: where the scrub starts, or `to`, where reduced motion holds it. */
export function posterTime(s: ScrubSettings, duration: number): number {
  return s.poster === 'last' ? (s.to ?? duration) : s.from;
}

const shellArg = (s: string) => (/^[\w.@%+=:,/-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/**
 * ffmpeg's line for the frame on screen at `t`: the last one that starts at or
 * before it, which is the one a browser shows. (`-ss t` would give the first
 * frame at or after t, one later whenever t falls inside a frame.)
 */
export function posterCommand(name: string, t: number): string {
  return `ffmpeg -i ${shellArg(name)} -vf "select=lte(t\\,${secs(t)})" -update 1 -q:v 2 poster.jpg`;
}
