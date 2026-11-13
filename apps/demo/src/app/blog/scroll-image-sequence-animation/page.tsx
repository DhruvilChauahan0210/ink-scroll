import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { ENCODES, FILM } from '@/data/videoscrub';
import { LIB_CONCURRENCY } from '@/components/frames/frames-code';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { LoadOrderFigure } from './LoadOrderFigure';

// Searches this post is for: "apple scroll animation", "image sequence scroll
// animation", "scroll frame animation canvas", "airpods scroll animation",
// "video to image sequence". Every scrollFrames option and default is read from
// packages/svg-scroll-draw/src/frames/index.ts; the ffmpeg lines were run with
// ffmpeg 9.0 on this site's film; every listing was run in Chromium, Firefox
// and WebKit on the example's own frames.
const TITLE = 'How to Build an Apple-Style Scroll Image Sequence Animation';
const DESCRIPTION =
  'Turn a video into an image sequence, draw it on a canvas frame by frame as the page scrolls, Apple-style, and keep its memory and reduced motion in check.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/scroll-image-sequence-animation';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'apple scroll animation',
    'image sequence scroll animation',
    'scroll frame animation canvas',
    'airpods scroll animation',
    'video to image sequence',
    'canvas image sequence on scroll',
    'apple product page scroll animation',
    'scroll scrub image sequence',
  ],
  alternates: { canonical: '/blog/scroll-image-sequence-animation' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to build an Apple-style scroll image sequence animation',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

// ── Figures, derived ─────────────────────────────────────────────────────────

/**
 * The example's sequence: apps/demo/public/frames/landsat/ (its README, and
 * ffprobe on frame_0001.webp: 960×540). `bytes` is the 71 files added up with
 * stat; `trackVh` is the track height in src/recipes/scroll-frames/index.html.
 */
const LANDSAT = { count: 71, width: 960, height: 540, bytes: 767308, trackVh: 400 } as const;
/** Four bytes a pixel, decoded (RGBA). */
const decoded = (n: number, w: number, h: number) => n * w * h * 4;
const mb = (bytes: number) => Math.round(bytes / 1e6);
const FRAME_MB = (decoded(1, LANDSAT.width, LANDSAT.height) / 1e6).toFixed(1);
const ALL_MB = mb(decoded(LANDSAT.count, LANDSAT.width, LANDSAT.height));
const DISK_KB = Math.round(LANDSAT.bytes / 1000);
const RATIO = Math.round(decoded(LANDSAT.count, LANDSAT.width, LANDSAT.height) / LANDSAT.bytes / 10) * 10;
/** The README's memory note: a hundred 1920×1080 frames. */
const HD_MB = mb(decoded(100, 1920, 1080));
/** Scroll per frame in the example: the track minus the one screen the stage fills, over count − 1 steps. */
const VH_PER_FRAME = ((LANDSAT.trackVh - 100) / (LANDSAT.count - 1)).toFixed(1);

/** The seek timings on /scroll-video-scrub-generator (data/videoscrub.ts). */
const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const NAMES = { chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' } as const;
const modern = (g: number | null) => ENCODES.filter((e) => e.codec !== 'VP8' && e.g === g);
const p95 = (g: number | null) => modern(g).flatMap((e) => BROWSERS.map((b) => ({ ms: e[b][1], b, codec: e.codec })));
const DEFAULT_P95 = p95(null).map((x) => x.ms);
const G3_P95 = Math.max(...p95(3).map((x) => x.ms));
const WORST = p95(null).reduce((a, x) => (x.ms > a.ms ? x : a));
const BEST = p95(null).reduce((a, x) => (x.ms < a.ms ? x : a));
const DEFAULT_KEYS = modern(null)[0]?.keyframes ?? 0;
const FRAME_60 = (1000 / 60).toFixed(1);

// ── Listings ─────────────────────────────────────────────────────────────────

const FFMPEG_SH = `mkdir frames

# 12 frames for each second of video, 960px wide (the height follows,
# rounded to an even number), as WebP: frames/frame_0001.webp …
ffmpeg -i input.mp4 -an -vf "fps=12,scale=960:-2" \\
  -c:v libwebp -quality 80 frames/frame_%04d.webp

# How many came out: the COUNT to use
ls frames | wc -l`;

const HTML = `<section class="track" id="track">
  <div class="stage">
    <canvas id="film" role="img"
      aria-label="Landsat 8 turning a full circle as you scroll"></canvas>
  </div>
</section>`;

const CSS = `/* The track holds the scroll room: the stage stays stuck for the
   track's height minus one screen, and the film runs that long. */
.track { height: 400vh; }
.stage { position: sticky; top: 0; height: 100vh; }
.stage canvas { display: block; width: 100%; height: 100%; }`;

const FILM_JS = `const COUNT = 71;
const url = (i) => \`frames/frame_\${String(i + 1).padStart(4, '0')}.webp\`;

const track = document.getElementById('track');
const canvas = document.getElementById('film');
const ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const images = [];                     // images[i] once frame i has loaded
let wanted = reduced ? COUNT - 1 : 0;  // the frame the scroll calls for
let drawn = -1;                        // the frame on the canvas

// Load every frame; under reduced motion, only the last one.
for (let i = reduced ? COUNT - 1 : 0; i < COUNT; i++) {
  const img = new Image();
  img.onload = () => { images[i] = img; draw(); };
  img.src = url(i);
}

// The loaded frame nearest i, so the canvas never waits for one.
function nearest(i) {
  for (let d = 0; d < COUNT; d++) {
    if (images[i - d]) return i - d;
    if (images[i + d]) return i + d;
  }
  return -1;
}

function draw() {
  const i = nearest(wanted);
  if (i < 0 || i === drawn) return; // nothing new to show
  const img = images[i];
  const { width: cw, height: ch } = canvas;
  // Cover: scale until the box is full, centre, crop what spills over.
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  drawn = i;
}

function update() {
  if (!reduced) {
    // 0 when the track's top reaches the top of the screen, 1 when
    // its bottom reaches the bottom: exactly while the stage is stuck.
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    wanted = Math.round(p * (COUNT - 1));
  }
  draw();
}

// The drawing buffer is the CSS box × devicePixelRatio (2 at most),
// so the picture is sharp on a high-density screen.
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr); // this clears it
  canvas.height = Math.round(canvas.clientHeight * dpr);
  drawn = -1;
  update();
}

// One update per animation frame at most; passive, so it never
// holds up the scroll.
let queued = false;
if (!reduced) {
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
}
addEventListener('resize', resize);
resize();`;

const LIB_JS = `import { scrollFrames } from 'svg-scroll-draw/frames';

// The same track, stage and canvas as above.
scrollFrames('#film', {
  frames: (i) => \`frames/frame_\${String(i + 1).padStart(4, '0')}.webp\`,
  count: 71,
  // The canvas is in a sticky stage, so its own box moves with the
  // scroll: measure the track that holds the scroll room instead.
  triggerElement: document.getElementById('track'),
  trigger: { start: 'top top', end: 'bottom bottom' },
});`;

const FILM_LINES = FILM_JS.split('\n').length;

export default function Page() {
  return (
    <BlogArticle
      slug="scroll-image-sequence-animation"
      jsonLd={articleJsonLd}
      tags={['Image sequence', 'Canvas', 'Scroll effects']}
      title={<>How to build an Apple-style scroll image sequence animation</>}
      lede={
        <>
          The product that turns in mid-air as you scroll, the effect Apple’s pages for things like AirPods made
          famous, is often not a video. It is a few dozen numbered stills drawn on a <code>&lt;canvas&gt;</code>, one
          for each scroll position. Here is why, how to get the stills out of a video, the whole thing by hand in{' '}
          {FILM_LINES} lines, the same in one call, and what the frames cost.
        </>
      }
      facts={[
        { k: 'Example', v: `${LANDSAT.count} frames · ${LANDSAT.width}×${LANDSAT.height}` },
        { k: 'Decoded', v: `${ALL_MB} MB` },
        { k: 'scrollFrames', v: `${SELF_ENTRIES.frames.toFixed(1)} KB` },
      ]}
      figure={
        <Figure n={1} caption="the order scrollFrames fetches 9 frames in, first, last, then the middle of every gap, and what a reader whose scroll calls for frame 5 sees after each load: the nearest frame in, until frame 5 itself arrives.">
          <LoadOrderFigure />
        </Figure>
      }
      further={[
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations, effect by effect', blurb: 'What a scrubbed film should show instead, and how the rest of the library behaves.' },
        { href: '/blog/scroll-pin-without-gsap', label: 'Pin sections on scroll without GSAP', blurb: 'Holding a stage in place while the story inside it changes.' },
      ]}
    >
      <Section id="why" k="frames or video" title="Why stills on a canvas, not a video">
        <p>
          The obvious way to tie footage to the scroll is a <code>&lt;video&gt;</code> whose <code>currentTime</code>{' '}
          follows the scroll. Every scroll change is then a seek, and a video can only seek by going back to the
          keyframe before the frame you asked for and decoding forward from there. Encoders put keyframes seconds
          apart, because that is cheap for playback: left at their defaults, VP9 and H.264 both put only{' '}
          {DEFAULT_KEYS} keyframes in this site’s {FILM.duration}-second, {FILM.frames}-frame film. Timed on the{' '}
          <Link href="/scroll-video-scrub-generator">scroll video scrub generator</Link>, the slowest 5% of seeks
          on those files took {Math.min(...DEFAULT_P95)}–{Math.max(...DEFAULT_P95)} ms across Chromium, Firefox and
          WebKit, when a frame at 60 fps lasts {FRAME_60} ms. That is the stutter.
        </p>
        <p>
          An image sequence has no keyframes. Each frame is its own picture, fetched and decoded once, so any scroll
          position can show its frame at once, in every browser: drawing a decoded image onto a canvas is a copy.
          The scroll names a frame number and that exact picture is drawn, with no codec, no{' '}
          <code>Range</code> requests and no seek in flight to wait for.
        </p>
        <Callout k="when video is fine">
          The stutter is the encode, not video as such. Re-encoded with a keyframe every 3 frames, the slowest 5%
          of the same film’s seeks fell to {G3_P95} ms or under in all three engines, and it stays one compressed file that
          does not hold every frame in memory. Nor is it one browser’s problem: the worst default figure was{' '}
          {NAMES[WORST.b]} with {WORST.codec} ({WORST.ms} ms), and the best was {NAMES[BEST.b]} with {BEST.codec}{' '}
          ({BEST.ms} ms). For long footage, use a video and{' '}
          <Link href="/scroll-video-scrub-generator">encode it for scrubbing</Link>. For a short, high-value
          sequence, a product turning, frames are simpler to get right everywhere.
        </Callout>
      </Section>

      <Section id="frames" k="step 1" title="Turn a video into an image sequence">
        <p>
          Most sequences start as a video: a 3D render, a turntable shot, a screen recording. The{' '}
          <Link href="/scroll-image-sequence-generator">scroll image sequence generator</Link> does it in the browser:
          pick a file, a frame count, a width and WebP or JPEG, and it seeks the video to the middle of each equal
          slice in turn, draws that picture onto a canvas and saves it. <b>Download frames.zip</b> hands you{' '}
          <code>frame_0001.webp</code> and on, and nothing is uploaded. Safari’s canvas cannot write WebP, so there
          it writes JPEG.
        </p>
        <p>From a terminal, for a long video or a build step, ffmpeg does the same:</p>
        <Code file="frames.sh">{FFMPEG_SH}</Code>
        <p>
          Run with ffmpeg 9.0 on this site’s {FILM.duration} s film, <code>fps=12</code> gives 65 frames, 960×720,
          numbered from <code>frame_0001</code>. The <code>libwebp</code> line needs an ffmpeg built with it, as most
          are; for JPEG, swap the codec options for <code>-q:v 3</code> and the extension for <code>.jpg</code>.
        </p>
      </Section>

      <Section id="by-hand" k="step 2" title="Draw it by hand: a sticky stage and a canvas">
        <p>
          The page needs a tall track that holds the scroll room and a stage inside it that sticks to the top of
          the screen while the track goes by. The canvas fills the stage. With a 400vh track, the stage stays stuck
          for 300vh of scroll, and that is how long the film runs.
        </p>
        <Code file="index.html">{HTML}</Code>
        <Code file="film.css">{CSS}</Code>
        <p>The script loads the frames, works out which one the scroll calls for, and draws it:</p>
        <Code file="film.js">{FILM_JS}</Code>
        <p>
          Five details carry it. The scroll listener is <code>passive</code> and only queues one{' '}
          <code>requestAnimationFrame</code>, so the work runs once per frame, however many scroll events arrive.
          Progress is the track’s top scrolled past, over the track’s height minus one screen, so it runs from 0 to 1
          exactly while the stage is stuck. The canvas’s drawing buffer is its CSS size times{' '}
          <code>devicePixelRatio</code>, capped at 2, or the picture is soft on a phone; setting it clears the
          canvas, so <code>resize</code> redraws. The cover arithmetic scales the frame by the larger of the two
          ratios and centres it, so the box is always full. And <code>nearest</code> means a frame that has not
          arrived yet never leaves the canvas blank: the closest one that has is drawn, and{' '}
          <code>draw</code> does nothing when the frame to show has not changed.
        </p>
        <Callout k="sticky does not stick?">
          Usually an ancestor has <code>overflow</code> set to <code>hidden</code>, <code>auto</code> or{' '}
          <code>scroll</code>: <code>position: sticky</code> sticks inside the nearest scrolling box, and that box is
          not the page.
        </Callout>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="The same with scrollFrames">
        <p>
          svg-scroll-draw’s <code>scrollFrames</code>, from its own <code>svg-scroll-draw/frames</code> entry (
          {SELF_ENTRIES.frames.toFixed(1)} KB), does the script above in one call, on the same HTML and CSS:
        </p>
        <Code file="film.js">{LIB_JS}</Code>
        <p>
          It draws frame <code>round(progress × (count − 1))</code>, or the nearest loaded one until that arrives, and
          redraws only when the frame to show changes. What it adds is the loading. It fetches frame 0 first, then
          the last, then the middle of every gap, coarse to fine (Fig. 1), at most {LIB_CONCURRENCY} at a time (
          <code>concurrency</code>), so a reader who scrolls fast is never far from a real frame after a handful of
          loads. A frame that fails to load is skipped for its neighbour, with one console warning naming its URL.
          It resizes the drawing buffer with a <code>ResizeObserver</code>, not only on window resizes, and{' '}
          <code>destroy()</code> stops the loads still in flight.
        </p>
        <p>
          <code>triggerElement</code> is what makes the pinned version work: the canvas sits in a sticky stage, so
          its own box moves with the scroll for as long as it is stuck, and a window measured on it comes out wrong.
          Measure the track with <code>{"'top top'"}</code> to <code>{"'bottom bottom'"}</code> instead, as above.
          Leave <code>triggerElement</code> out for a canvas that scrolls with the page, and the window defaults
          to <code>{"'top top'"}</code> → <code>{"'bottom top'"}</code>: the film runs as the canvas leaves.{' '}
          <code>fit: &apos;contain&apos;</code> shows the whole frame instead of cropping, and{' '}
          <code>onProgress(alpha, frame)</code> hands you the frame number for a counter or captions. Every option
          is in <Link href="/docs#scroll-frames">the scrollFrames docs</Link>.
        </p>
        <p>
          The <Link href="/examples/scroll-frames">scroll image sequence example</Link> is this listing on{' '}
          {LANDSAT.count} frames of NASA’s Landsat 8, {LANDSAT.width}×{LANDSAT.height}, with chapters of copy that
          follow the frame, and <Link href="/showcase/groundtrack">Groundtrack</Link> is a whole site built around
          it.
        </p>
      </Section>

      <Section id="budget" k="weight" title="Budget the frames">
        <p>
          A sequence is paid for frame by frame. On the wire, WebP keeps it small: the example’s {LANDSAT.count}{' '}
          frames are {DISK_KB} KB together. In memory it is another matter, because a decoded frame is its width ×
          height × 4 bytes, and a sequence keeps every frame it has loaded so it can show any of them at once. One{' '}
          {LANDSAT.width}×{LANDSAT.height} frame is {FRAME_MB} MB decoded; all {LANDSAT.count} are {ALL_MB} MB,
          about {RATIO} times their size on disk. A hundred 1920×1080 frames would be {HD_MB} MB.
        </p>
        <ul>
          <li>
            <b>Make each frame the size it is shown.</b> The canvas never draws more than its box ×{' '}
            <code>devicePixelRatio</code>, capped at 2, so a frame wider than twice the canvas’s widest box costs
            bytes and memory for nothing. Export WebP, or JPEG, at that size, not the camera’s originals.
          </li>
          <li>
            <b>Use as few frames as the motion needs.</b> The example spreads {LANDSAT.count} frames over{' '}
            {LANDSAT.trackVh - 100}vh of scroll, about {VH_PER_FRAME}vh each. Halving the count halves the bytes
            and the memory; the generator shows the scroll each frame covers and the weight of the set as you
            change them.
          </li>
          <li>
            <b>Cache them for good.</b> The frames do not change once made: give the folder a long cache lifetime
            and rename it when they do.
          </li>
        </ul>
      </Section>

      <Section id="a11y" k="accessibility" title="Accessibility and reduced motion">
        <p>
          A canvas is a blank box to a screen reader. Give it <code>{'role="img"'}</code> and an{' '}
          <code>aria-label</code> that says what the film shows, as the HTML above does: scrollFrames adds no ARIA,
          so that is up to you. Any copy that changes with the frame should be real text beside the canvas, not
          painted into the frames.
        </p>
        <p>
          A film scrubbed by the scroll is motion the reader did not start, so under{' '}
          <code>prefers-reduced-motion: reduce</code> both versions load only the last frame, draw it and leave the
          scroll alone. scrollFrames also stops on the last frame if the setting is turned on during the visit,
          and loads nothing more. Make that last frame one that stands on its own, and if chapters of copy follow
          the film, show them all, as the example does. What every other kind of scroll effect should do is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Closing
        title="Turn a video into frames, copy the code"
        lede="Extract frames from a video in your browser, scrub them in the preview, pin them or let them scroll, and copy HTML, JavaScript or a React component."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/scroll-image-sequence-generator', label: 'Scroll image sequence generator →' },
          { href: '/examples/scroll-frames', label: 'The pinned example' },
        ]}
      />
    </BlogArticle>
  );
}
