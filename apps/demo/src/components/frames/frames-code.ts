/**
 * The scroll image sequence generator's model and the code it writes. Pure
 * functions, no DOM: the page (server), the tool (client) and
 * scripts/tool-pages.ts all read them, so what the page says and what the tool
 * writes cannot drift apart.
 *
 * Every figure about scrollFrames here is read from packages/svg-scroll-draw/
 * src/frames/index.ts: the window defaults to 'top top' → 'bottom top', easing
 * to 'linear', fit to 'cover', concurrency to 6; frame round(alpha × (count − 1))
 * is drawn, or the nearest loaded one until it arrives; the drawing buffer is
 * the canvas's CSS box × devicePixelRatio, capped at 2; under reduced motion
 * only the last frame is loaded and drawn. The trigger arithmetic is
 * data/trigger.ts, which mirrors core/trigger.ts.
 */

import { cdnModule, escapeHtml, htmlFile, withSource } from '@/lib/tool-export';
import { defaultsOf, edgeOffset, lineOffset, pairWords, readTrigger } from '@/data/trigger';

export const SLUG = 'scroll-image-sequence-generator';

export type EaseName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type Fit = 'cover' | 'contain';

/**
 * The four smooth easings, as core/easing.ts EASINGS defines them. The library
 * does not export that table, so it is repeated here (as scrub-code.ts does);
 * keep the two in step.
 */
export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};
export const EASE_NAMES = Object.keys(EASE) as EaseName[];

/** scrollFrames' own window when `trigger` is left out (frames/index.ts). */
export const LIB_WINDOW = defaultsOf('scrollFrames');
/** scrollFrames' default `concurrency` (frames/index.ts). */
export const LIB_CONCURRENCY = 6;

export type Preset = { key: string; label: string; start: string; end: string; what: string };

export const PIN_PRESETS: Preset[] = [
  {
    key: 'stuck',
    label: 'While stuck',
    start: 'top top',
    end: 'bottom bottom',
    what: 'Exactly while the stage is stuck: from the track’s top at the window’s top to its bottom at the window’s bottom.',
  },
  {
    key: 'pass',
    label: 'Whole pass',
    start: 'top bottom',
    end: 'bottom top',
    what: 'From the track’s first pixel on screen to its last, so the frames also turn while the stage scrolls in and out.',
  },
];

export const FLOW_PRESETS: Preset[] = [
  {
    key: 'default',
    label: 'Default',
    start: LIB_WINDOW.start,
    end: LIB_WINDOW.end,
    what: 'scrollFrames’ own window: from the canvas’s top at the window’s top until its bottom gets there, so it turns as it leaves.',
  },
  {
    key: 'pass',
    label: 'Whole pass',
    start: 'top bottom',
    end: 'bottom top',
    what: 'From the moment its top comes into view until its bottom has left.',
  },
  {
    key: 'middle',
    label: 'Middle band',
    start: 'top 75%',
    end: 'bottom 25%',
    what: 'While it crosses the middle half of the window.',
  },
];

export const presetsOf = (pin: boolean) => (pin ? PIN_PRESETS : FLOW_PRESETS);

export type FramesSettings = {
  /** Pinned: a sticky stage in a tall track, measured with triggerElement. */
  pin: boolean;
  /** The track's height in vh, when pinned. */
  length: number;
  /** A key of presetsOf(pin). */
  preset: string;
  fit: Fit;
  easing: EaseName;
  once: boolean;
};

export const LENGTH = { min: 150, max: 800, step: 25 } as const;

export const DEFAULTS: FramesSettings = {
  pin: true,
  length: 400,
  preset: PIN_PRESETS[0].key,
  fit: 'cover',
  easing: 'linear',
  once: false,
};

export const presetOf = (s: FramesSettings): Preset =>
  presetsOf(s.pin).find((p) => p.key === s.preset) ?? presetsOf(s.pin)[0];

/** Where the trigger window is, in words. */
export function windowWords(p: Preset): string {
  return `from when ${pairWords(readTrigger(p.start))} until ${pairWords(readTrigger(p.end))}`;
}

/** The scroll the frames run over while pinned, in vh, on a track `length` vh tall in a 100vh window. */
export function pinnedRun(s: FramesSettings): number {
  const p = presetOf(s);
  const at = (w: string) => {
    const r = readTrigger(w);
    return edgeOffset(r.edge, s.length) - lineOffset(r.line, 100);
  };
  return Math.round((at(p.end) - at(p.start)) * 100) / 100;
}

/** How long the stage stays stuck: the track less one window. */
export const stuckFor = (s: FramesSettings) => s.length - 100;

/** The frame scrollFrames draws at eased progress `alpha` (frames/index.ts applyAlpha). */
export const frameAt = (alpha: number, count: number) =>
  Math.min(count - 1, Math.max(0, Math.round(alpha * (count - 1))));

// ── The frames the code is written for ──────────────────────────────────────

/** How frame i (0-based) is named: a numbered pattern, or a list of names. */
export type Naming =
  | { kind: 'pattern'; prefix: string; start: number; width: number; ext: string }
  | { kind: 'list'; names: string[] };

export type Sequence = {
  /** The built-in demo, frames picked from disk, or frames drawn from a video. */
  kind: 'demo' | 'files' | 'video';
  count: number;
  naming: Naming;
  /** The canvas's aria-label. */
  label: string;
  /** The first frame's size, once known. */
  width: number | null;
  height: number | null;
};

/** The demo: drawn in the browser, named as an extracted set would be. */
export const DEMO = { count: 72, width: 960, height: 600, type: 'image/jpeg', quality: 0.85 } as const;

/** What an extracted or zipped frame is called: frame_0001.webp, from 1. */
export const frameName = (i: number, ext: string) => `frame_${String(i + 1).padStart(4, '0')}${ext}`;
export const zipPattern = (ext: string): Naming => ({ kind: 'pattern', prefix: 'frame_', start: 1, width: 4, ext });

export const DEMO_SEQUENCE: Sequence = {
  kind: 'demo',
  count: DEMO.count,
  naming: zipPattern('.jpg'),
  label: 'A box turning half a turn as the page scrolls',
  width: DEMO.width,
  height: DEMO.height,
};

/** Natural order: frame2 before frame10, as people number files. */
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
export const naturalCompare = (a: string, b: string) => collator.compare(a, b);

/**
 * The pattern a list of file names follows, when there is one: one prefix,
 * one extension, numbers counting up by one with the same zero padding (or
 * none). Anything else is written out as a list.
 */
export function namingOf(sorted: string[]): Naming {
  const parts = sorted.map((n) => /^(.*?)(\d+)(\.[A-Za-z0-9]+)$/.exec(n));
  const first = parts[0];
  if (first && parts.every(Boolean)) {
    const [, prefix, digits, ext] = first;
    const start = Number(digits);
    const padded = digits.length > 1 && digits.startsWith('0');
    const ok = parts.every((m, i) => {
      const [, p, d, e] = m!;
      if (p !== prefix || e !== ext || Number(d) !== start + i) return false;
      return padded ? d.length === digits.length : String(Number(d)) === d;
    });
    if (ok) return { kind: 'pattern', prefix, start, width: padded ? digits.length : 0, ext };
  }
  return { kind: 'list', names: sorted };
}

export const filesSequence = (sorted: string[], width: number | null, height: number | null): Sequence => ({
  kind: 'files',
  count: sorted.length,
  naming: namingOf(sorted),
  label: 'Describe what the frames show',
  width,
  height,
});

export const videoSequence = (count: number, ext: string, width: number, height: number): Sequence => ({
  kind: 'video',
  count,
  naming: zipPattern(ext),
  label: 'Describe what the frames show',
  width,
  height,
});

/** The name of frame i as the code would ask for it. */
export function nameOf(n: Naming, i: number): string {
  if (n.kind === 'list') return n.names[i] ?? '';
  const num = String(i + n.start);
  return `${n.prefix}${n.width ? num.padStart(n.width, '0') : num}${n.ext}`;
}

// ── Numbers ──────────────────────────────────────────────────────────────────

export function bytesText(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Decoded, a frame is held as width × height pixels at 4 bytes each (RGBA). */
export const decodedBytes = (count: number, w: number, h: number) => count * w * h * 4;

// ── The listings ─────────────────────────────────────────────────────────────

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Frame i's URL as a JavaScript expression of `i`, in the folder `dir`. */
function urlExpr(n: Extract<Naming, { kind: 'pattern' }>, dir: string): string {
  const num = n.start === 0 ? 'i' : `i + ${n.start}`;
  const padded = n.width ? `String(${num}).padStart(${n.width}, '0')` : num;
  // Encoded like the list form's names, so a '#', '?' or '%' in a file name
  // stays part of the path.
  const tpl = (s: string) => encodeURIComponent(s).replace(/[`$\\]/g, '\\$&');
  return `\`${dir}${tpl(n.prefix)}\${${padded}}${tpl(n.ext)}\``;
}

/** The line that names the frames, and the count when frames is a function. */
function frameLines(src: Sequence, dir: string): string[] {
  const n = src.naming;
  if (n.kind === 'list') return ['frames: FRAMES,'];
  return [`frames: (i) => ${urlExpr(n, dir)},`, `count: ${src.count},`];
}

/** The constant a list of names needs, above the call. */
function listConst(src: Sequence, dir: string): string {
  const n = src.naming;
  if (n.kind !== 'list') return '';
  return `const FRAMES = [\n${n.names.map((name) => `  ${q(dir + encodeURIComponent(name))},`).join('\n')}\n];\n\n`;
}

/** What the frames are, in one comment line. */
function framesComment(src: Sequence, dir: string): string {
  const n = src.naming;
  if (n.kind === 'list') return `// ${src.count} frames, in this order`;
  const last = nameOf(n, src.count - 1);
  return src.count > 1
    ? `// ${src.count} frames: ${dir}${nameOf(n, 0)} … ${dir}${last}`
    : `// 1 frame: ${dir}${last}`;
}

function optionLines(s: FramesSettings, src: Sequence, dir: string, track: string): string[] {
  const p = presetOf(s);
  const out = frameLines(src, dir);
  if (s.pin) {
    out.push("// The stage is sticky, so the canvas's own box moves with the scroll.");
    out.push('// Measure the track that holds the scroll room instead.');
    out.push(`triggerElement: ${track},`);
  }
  if (p.start !== LIB_WINDOW.start || p.end !== LIB_WINDOW.end) {
    out.push(`trigger: { start: '${p.start}', end: '${p.end}' },`);
  }
  if (s.fit !== 'cover') out.push(`fit: '${s.fit}', // the whole frame, letterboxed`);
  if (s.easing !== 'linear') out.push(`easing: '${s.easing}',`);
  if (s.once) out.push('once: true, // scrolling back up does not turn it back');
  return out;
}

const TAIL = `// film.destroy() stops it and the loads still in flight. With reduced
// motion on, scrollFrames loads and shows the last frame only.`;

function jsBody(s: FramesSettings, src: Sequence, from: string, dir: string): string {
  const opts = optionLines(s, src, dir, "document.querySelector('#frames-track')");
  return `import { scrollFrames } from '${from}';

${listConst(src, dir)}${framesComment(src, dir)}
const film = scrollFrames(document.querySelector('#frames'), {
${opts.map((l) => `  ${l}`).join('\n')}
});

${TAIL}`;
}

/** The markup: a track and a sticky stage, or the canvas in the flow. */
export function markup(s: FramesSettings, src: Sequence): string {
  const label = escapeHtml(src.label);
  if (!s.pin) {
    return `<!-- The library adds no ARIA: say what the frames show. -->
<canvas id="frames" class="frames" role="img" aria-label="${label}"></canvas>`;
  }
  return `<section class="frames-track" id="frames-track">
  <div class="frames-stage">
    <!-- The library adds no ARIA: say what the frames show. -->
    <canvas id="frames" role="img" aria-label="${label}"></canvas>
  </div>
</section>`;
}

const ratio = (src: Sequence) => (src.width && src.height ? `${src.width} / ${src.height}` : '16 / 9');

/** The stylesheet. The canvas is sized by CSS; scrollFrames sizes its drawing buffer to match. */
export function css(s: FramesSettings, src: Sequence): string {
  if (!s.pin) {
    return `/* In the flow: the canvas scrolls with the page, and scrollFrames
   measures the canvas itself. Size it with CSS: the library sets its
   drawing buffer to this box × devicePixelRatio (capped at 2). */
.frames {
  display: block;
  width: 100%;
  aspect-ratio: ${ratio(src)};
}`;
  }
  const run = pinnedRun(s);
  const stuck = stuckFor(s);
  return `/* The track holds the scroll room: the stage stays stuck for the
   track's height less one window (${stuck}vh), and ${run === stuck ? 'the frames run over exactly that' : `the trigger runs the frames over ${run}vh of scroll`}. */
.frames-track {
  position: relative;
  height: ${s.length}vh;
}

.frames-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh; /* never taller than a phone's smallest window */
}

/* Size the canvas with CSS: scrollFrames sets its drawing buffer to this
   box × devicePixelRatio (capped at 2) and redraws when it changes. */
.frames-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}`;
}

/** The <ScrollFrames> props, one per line, with the comments optionLines gives them. */
function reactProps(s: FramesSettings, src: Sequence): string[] {
  const p = presetOf(s);
  const out = src.naming.kind === 'pattern' ? ['frames={frames}', 'count={count}'] : ['frames={frames}'];
  if (s.pin) {
    out.push("// The stage is sticky, so the canvas's own box moves with the scroll.");
    out.push('// Measure the track that holds the scroll room instead.');
    out.push('triggerElement={track}');
  }
  if (p.start !== LIB_WINDOW.start || p.end !== LIB_WINDOW.end) {
    out.push(`trigger={{ start: '${p.start}', end: '${p.end}' }}`);
  }
  if (s.fit !== 'cover') out.push(`fit="${s.fit}" // the whole frame, letterboxed`);
  if (s.easing !== 'linear') out.push(`easing="${s.easing}"`);
  if (s.once) out.push('once // scrolling back up does not turn it back');
  out.push('aria-label={label}');
  return out;
}

/**
 * The React component: <ScrollFrames> from svg-scroll-draw/react, which renders
 * the canvas and starts and stops the film. `hooks` are the React hooks the
 * file imports beside the ones the component needs (the StackBlitz app adds its own).
 */
function reactComponent(s: FramesSettings, src: Sequence, client: boolean, hooks: string[] = []): string {
  const dir = '/frames/';
  const n = src.naming;
  const pattern = n.kind === 'pattern';
  const head = pattern
    ? `${framesComment(src, dir)}, in public/frames\nconst frameUrl = (i) => ${urlExpr(n, dir)};\n\n`
    : `// ${src.count} frames, in public/frames, in this order\n${listConst(src, dir)}`;
  const props = pattern
    ? `{ frames = frameUrl, count = ${src.count}, label = ${q(src.label)} }`
    : `{ frames = FRAMES, label = ${q(src.label)} }`;
  const indent = s.pin ? '        ' : '    ';
  const film = [
    '<ScrollFrames',
    ...(s.pin ? [] : ['className="frames"']).concat(reactProps(s, src)).map((l) => `  ${l}`),
    '/>',
  ].map((l) => indent + l).join('\n');
  const body = s.pin
    ? `    <section ref={track} className="frames-track">
      <div className="frames-stage">
${film}
      </div>
    </section>`
    : film;
  const used = [...(s.pin ? ['useRef'] : []), ...hooks].sort();
  const react = used.length ? `import { ${used.join(', ')} } from 'react';\n` : '';
  return `${client ? "'use client';\n\n" : ''}${react}import { ScrollFrames } from 'svg-scroll-draw/react';

${head}// <ScrollFrames> renders the canvas (role="img") and stops the film, and
// the loads still in flight, when it unmounts. A frames function is compared
// by the URLs it gives, so a re-render keeps the film and its loaded frames.
// With reduced motion on, it loads and shows the last frame only.
export function FrameScrub(${props}) {
${s.pin ? '  const track = useRef(null);\n\n' : ''}  return (
${body}
  );
}`;
}

/** The folder the HTML file's frames are in, relative to it. */
const HTML_DIR = 'frames/';

export const jsCode = (s: FramesSettings, src: Sequence) =>
  withSource(jsBody(s, src, 'svg-scroll-draw/frames', HTML_DIR), SLUG, 'js');
export const htmlCode = (s: FramesSettings, src: Sequence) => withSource(markup(s, src), SLUG, 'html');
export const cssCode = (s: FramesSettings, src: Sequence) => withSource(css(s, src), SLUG, 'css');
export const reactCode = (s: FramesSettings, src: Sequence) => withSource(reactComponent(s, src, true), SLUG, 'jsx');

// ── The demo frames, as a script ────────────────────────────────────────────

/**
 * The demo sequence: a box turning half a turn under a light that stays put,
 * drawn with canvas 2D. Kept as source text because the downloaded page and
 * the StackBlitz project run it as written; the tool evaluates the same text
 * (FramesGenerator.tsx), so the preview and the file show the same frames.
 */
export const DEMO_SOURCE = `function drawDemoFrame(ctx, w, h, i, count) {
  const t = count > 1 ? i / (count - 1) : 0;
  const yaw = -0.55 + t * Math.PI;        // half a turn
  const pitch = 0.5 - t * 0.22;           // the eye drops a little
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#24221f');
  bg.addColorStop(1, '#0f0e0d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const size = Math.min(w, h) * 0.24;
  const cx = w / 2;
  const cy = h * 0.5;
  const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  // Turn about the vertical axis, then tip towards the eye; z grows away from it.
  const turn = ([x, y, z]) => {
    const x1 = x * cy1 + z * sy1;
    const z1 = -x * sy1 + z * cy1;
    return [x1, y * cp + z1 * sp, -y * sp + z1 * cp];
  };
  const project = (p) => {
    const [x, y, z] = turn(p);
    const f = 5 / (5 + z);
    return [cx + x * size * f, cy - y * size * f];
  };
  const path = (pts) => {
    ctx.beginPath();
    pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
  };

  // The shadow on the floor.
  const floor = cy + size * 1.55;
  const shadow = ctx.createRadialGradient(cx, floor, 0, cx, floor, size * 1.9);
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, floor, size * 1.9, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // A box 1.6 wide, 2.2 tall and 1.6 deep; each face with its outward normal.
  const X = 0.8, Y = 1.1, Z = 0.8;
  const faces = [
    { n: [0, 0, -1], c: [[-X, -Y, -Z], [X, -Y, -Z], [X, Y, -Z], [-X, Y, -Z]], mark: 'dial' },
    { n: [1, 0, 0], c: [[X, -Y, -Z], [X, -Y, Z], [X, Y, Z], [X, Y, -Z]], mark: 'slots' },
    { n: [0, 0, 1], c: [[X, -Y, Z], [-X, -Y, Z], [-X, Y, Z], [X, Y, Z]], mark: 'dot' },
    { n: [-1, 0, 0], c: [[-X, -Y, Z], [-X, -Y, -Z], [-X, Y, -Z], [-X, Y, Z]] },
    { n: [0, 1, 0], c: [[-X, Y, -Z], [X, Y, -Z], [X, Y, Z], [-X, Y, Z]] },
  ];
  const light = [0.35, 0.6, -0.72];       // from above, in front, a little right
  for (const face of faces) {
    const n = turn(face.n);
    if (n[2] >= 0) continue;                 // facing away
    const lit = Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
    const k = 0.3 + 0.7 * lit;
    ctx.fillStyle = 'rgb(' + Math.round(232 * k) + ', ' + Math.round(163 * k) + ', ' + Math.round(61 * k) + ')';
    path(face.c.map(project));
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 244, 224, 0.35)';
    ctx.lineWidth = Math.max(1, size / 90);
    ctx.stroke();

    // A mark on three faces, so the turn reads.
    ctx.fillStyle = 'rgba(20, 16, 12, ' + (0.25 + 0.5 * k) + ')';
    if (face.mark === 'dial') {
      const ring = [];
      for (let a = 0; a < 32; a++) {
        const th = (a / 32) * Math.PI * 2;
        ring.push(project([Math.cos(th) * 0.5, 0.15 + Math.sin(th) * 0.5, -Z]));
      }
      path(ring);
      ctx.fill();
    } else if (face.mark === 'slots') {
      for (let s = 0; s < 4; s++) {
        const y = 0.55 - s * 0.32;
        path([[X, y, -0.5], [X, y, 0.5], [X, y - 0.12, 0.5], [X, y - 0.12, -0.5]].map(project));
        ctx.fill();
      }
    } else if (face.mark === 'dot') {
      const dot = [];
      for (let a = 0; a < 24; a++) {
        const th = (a / 24) * Math.PI * 2;
        dot.push(project([Math.cos(th) * 0.16, -0.6 + Math.sin(th) * 0.16, Z]));
      }
      path(dot);
      ctx.fill();
    }
  }

  // The frame's number, centred, so a cropping fit keeps it.
  ctx.fillStyle = 'rgba(236, 232, 225, 0.7)';
  ctx.font = Math.round(h / 28) + 'px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('frame ' + String(i + 1).padStart(String(count).length, '0') + ' / ' + count, w / 2, h - h / 24);
  ctx.textAlign = 'start';
}

// Every frame as a JPEG in this tab's memory, one object URL each.
async function demoFrames(count, width = ${DEMO.width}, height = ${DEMO.height}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const urls = [];
  for (let i = 0; i < count; i++) {
    drawDemoFrame(ctx, width, height, i, count);
    const blob = await new Promise((done) => canvas.toBlob(done, '${DEMO.type}', ${DEMO.quality}));
    urls.push(URL.createObjectURL(blob));
  }
  return urls;
}`;

// ── Whole files ──────────────────────────────────────────────────────────────

const PAGE_CSS = `body { margin: 0; font: 16px/1.6 system-ui, sans-serif; color: #ece8e1; background: #121212; }
.spacer { display: grid; place-items: center; height: 100vh; color: #8a867f; }`;

/** The script of the runnable page: the demo draws its own frames; yours load from frames/. */
function fileScript(s: FramesSettings, src: Sequence, version: string): string {
  const from = cdnModule(version, 'frames');
  if (src.kind !== 'demo') return jsBody(s, src, from, HTML_DIR);
  // The demo's frames are made in the page, so it runs with nothing beside it.
  const opts = optionLines(s, src, HTML_DIR, "document.querySelector('#frames-track')");
  const own = opts.slice(0, 2).map((l) => `//   ${l}`).join('\n');
  const rest = opts.slice(2);
  return `import { scrollFrames } from '${from}';

${DEMO_SOURCE}

// The demo's frames are drawn in this page, so the file runs on its own.
// For frames you host, pass their URLs instead:
${own}
const film = scrollFrames(document.querySelector('#frames'), {
  frames: await demoFrames(${src.count}),
${rest.map((l) => `  ${l}`).join('\n')}
});

${TAIL}`;
}

function fileNote(src: Sequence): string {
  if (src.kind === 'demo') return '';
  const lines = src.kind === 'video'
    ? ['Unzip frames.zip next to this file: it holds the frames/ folder.']
    : [`Put your ${src.count} frames in a frames/ folder next to this file.`];
  lines.push('Open it from a local server (npx serve, for one).');
  return `<!-- ${lines.join('\n     ')} -->\n`;
}

/** A complete page running the sequence, the library from jsDelivr. */
export function framesFile(s: FramesSettings, src: Sequence, version: string): string {
  return htmlFile({
    slug: SLUG,
    title: 'Scroll image sequence',
    css: `${PAGE_CSS}\n\n${css(s, src)}`,
    body: [
      '<div class="spacer">Scroll down</div>',
      '',
      `${fileNote(src)}${markup(s, src)}`,
      '',
      '<div class="spacer">After the frames</div>',
    ].join('\n'),
    script: fileScript(s, src, version),
  });
}

/** The React project for StackBlitz: the component, and a page to scroll it in. */
export function reactApp(s: FramesSettings, src: Sequence): { app: string; css: string } {
  const app = src.kind === 'demo'
    ? `${reactComponent(s, src, false, ['useEffect', 'useState'])}

// The demo's frames are drawn in the browser, so the project runs as it is.
// With your own frames in public/frames, render <FrameScrub /> and drop this.
${DEMO_SOURCE}

export default function App() {
  const [urls, setUrls] = useState(null);
  useEffect(() => {
    let live = true;
    let made = [];
    demoFrames(${src.count}).then((u) => {
      made = u;
      if (live) setUrls(u);
      else u.forEach((url) => URL.revokeObjectURL(url));
    });
    return () => {
      live = false;
      made.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <>
      <div className="spacer">Scroll down</div>
      {urls ? <FrameScrub frames={urls}${src.naming.kind === 'pattern' ? ` count={${src.count}}` : ''} /> : <div className="spacer">Drawing the frames…</div>}
      <div className="spacer">After the frames</div>
    </>
  );
}`
    : `${reactComponent(s, src, false)}

// Put the ${src.count} frames in public/frames.
export default function App() {
  return (
    <>
      <div className="spacer">Scroll down</div>
      <FrameScrub />
      <div className="spacer">After the frames</div>
    </>
  );
}`;
  return { app, css: `${PAGE_CSS}\n\n${css(s, src)}\n` };
}
