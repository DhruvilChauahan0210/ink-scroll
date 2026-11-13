import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { ENCODES, FILM, type Encode } from '@/data/videoscrub';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { SeekFigure } from './SeekFigure';

// Searches this post is for: "scroll video", "play video on scroll", "video
// scrub on scroll", "scroll controlled video", "apple video scroll". Every
// scrollVideo option and default is read from packages/svg-scroll-draw/src/
// video/index.ts, every seek time and size from data/videoscrub.ts, and every
// listing below was run as printed in Chromium, Firefox and WebKit.
const TITLE = 'How to Scrub a Video on Scroll (Play Video with Scroll)';
const DESCRIPTION =
  'Play a video with the scroll: map progress to currentTime, seek only on change, encode a keyframe every few frames, and handle iPhone and reduced motion.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/scroll-video-scrub';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll video',
    'play video on scroll',
    'video scrub on scroll',
    'scroll controlled video',
    'apple video scroll',
    'video currentTime scroll',
    'scrub video with scroll',
    'ffmpeg keyframe interval',
  ],
  alternates: { canonical: '/blog/scroll-video-scrub' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to scrub a video on scroll (play video with scroll)',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

// ── Figures from the measurements (data/videoscrub.ts) ──────────────────────

const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const enc = (codec: Encode['codec'], g: number | null) => ENCODES.find((e) => e.codec === codec && e.g === g);
const modern = (g: number | null) => ENCODES.filter((e) => e.codec !== 'VP8' && e.g === g);
const p95s = (g: number | null) => modern(g).flatMap((e) => BROWSERS.map((b) => e[b][1]));
const DEFAULT_P95 = p95s(null);
const G3_P95 = Math.max(...p95s(3));
const G15_P95 = Math.max(...p95s(15));
const DEFAULT_KEYS = modern(null)[0]?.keyframes ?? 0;
const G3_KEYS = modern(3)[0]?.keyframes ?? 0;
const FRAME_60 = (1000 / 60).toFixed(1);
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
const H264_DEFAULT = enc('H.264', null);
const H264_G3 = enc('H.264', 3);
const H264_G1 = enc('H.264', 1);
/** How far -g 1's median seek ever was from -g 3's, in ms, over both codecs and all three engines. */
const G1_GAIN = Math.max(
  ...(['VP9', 'H.264'] as const).flatMap((c) =>
    BROWSERS.map((b) => Math.abs((enc(c, 1)?.[b][0] ?? 0) - (enc(c, 3)?.[b][0] ?? 0))),
  ),
);
/** A hundred 1920×1080 frames, decoded at four bytes a pixel. */
const HD_MB = Math.round((100 * 1920 * 1080 * 4) / 1e6);
/** The CSS below: a 400vh track holds 300vh of film. */
const TRACK_VH = 400;

// ── Listings ─────────────────────────────────────────────────────────────────

const HTML = `<section class="film-track" id="film-track">
  <div class="film-stage">
    <video id="film" muted playsinline preload="auto"
      aria-label="Headphones turning, then taken apart">
      <source src="film.webm" type="video/webm">
      <source src="film.mp4" type="video/mp4">
    </video>
  </div>
</section>`;

const CSS = `/* The track holds the scroll room: the stage stays stuck for the
   track's height less one window, and the film runs that long. */
.film-track {
  position: relative;
  height: 400vh;
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

const FILM_JS = `const track = document.getElementById('film-track');
const video = document.getElementById('film');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lastTime = NaN; // the time last written to the video
let queued = false; // a frame is already booked

// 0 when the track's top reaches the top of the window, 1 when its
// bottom reaches the bottom: exactly the stretch the stage is stuck.
function progress() {
  const box = track.getBoundingClientRect();
  const room = box.height - innerHeight;
  return Math.min(1, Math.max(0, -box.top / room));
}

function update() {
  queued = false;
  const time = progress() * video.duration;
  // Every write to currentTime starts a seek, even to the time the
  // video is already at. Above and below the track the progress is
  // held at 0 or 1, so every scroll there asks for the same time.
  if (time === lastTime) return;
  lastTime = time;
  video.currentTime = time;
}

// Read the layout and seek in an animation frame, one per frame.
function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(update);
}

function start() {
  if (reduced) {
    video.currentTime = video.duration; // the last frame, held still
    return;
  }
  update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
}

// The duration is NaN until the metadata is in.
if (video.readyState >= 1) start();
else video.addEventListener('loadedmetadata', start, { once: true });`;

const ENCODE_SH = `# H.264 in MP4: a keyframe every 3 frames (-g 3), no audio track,
# and the index moved to the front of the file (+faststart)
ffmpeg -i input.mov -an -c:v libx264 -preset slow -crf 20 -g 3 \\
  -pix_fmt yuv420p -movflags +faststart film.mp4

# VP9 in WebM, with the same keyframe interval
ffmpeg -i input.mov -an -c:v libvpx-vp9 -b:v 0 -crf 32 -g 3 -row-mt 1 film.webm

# Count the keyframes in what you made
ffmpeg -i film.mp4 -vf showinfo -f null - 2>&1 | grep -c "iskey:1"`;

const LIB_JS = `import { scrollVideo } from 'svg-scroll-draw/video';

const film = scrollVideo('#film', {
  // The stage is sticky, so the video's own box moves with the scroll.
  // Measure the track that holds the scroll room instead.
  triggerElement: document.getElementById('film-track'),
  trigger: { start: 'top top', end: 'bottom bottom' },
});

// film.destroy() takes the listeners off and lets the video go.`;

const OPTIONS: [string, string, string][] = [
  ['trigger', "'top top' → 'bottom top'", 'The scroll window: an edge of the measured element, then a line across the window. Progress is 0 at start and 1 at end.'],
  ['triggerElement', 'the video', 'Measure the window on this element instead. In a sticky stage, the track.'],
  ['from', '0', 'The time, in seconds, at progress 0.'],
  ['to', 'the duration', 'The time at progress 1, read when the metadata loads if left out.'],
  ['easing', "'linear'", 'Shapes the progress before it becomes a time.'],
  ['once', 'false', 'Keep the furthest point reached, so scrolling back does not rewind.'],
  ['axis', "'y'", "'x' follows the window’s horizontal scroll."],
  ['preload', "'auto'", 'Set on the video only when it has no preload attribute of its own.'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="scroll-video-scrub"
      jsonLd={articleJsonLd}
      tags={['Video', 'Scroll scrub', 'Scroll effects']}
      title={<>How to scrub a video on scroll (play video with scroll)</>}
      lede={
        <>
          A video that plays forwards as you scroll down and backwards as you scroll up, the effect Apple’s product
          pages made familiar, is one line of arithmetic: how far through the section the reader is, times the
          video’s length, written to <code>currentTime</code>. The work is around that line. Here is the whole
          thing by hand, why the file’s encoding matters more than the code, what iPhones and reduced motion need,
          and the same in one call.
        </>
      }
      facts={[
        { k: 'Writes', v: 'currentTime' },
        { k: 'Keyframe every', v: `${FILM.keyEvery} frames` },
        { k: 'scrollVideo', v: `${SELF_ENTRIES.video.toFixed(1)} KB` },
      ]}
      figure={
        <Figure n={1} caption={<>how long a seek took on this site’s {FILM.frames}-frame film, re-encoded with only the keyframe interval changed and sought to every frame in Chromium, Firefox and WebKit. The dot is the median, the line runs to the slowest 5%. Left at the encoders’ defaults ({DEFAULT_KEYS} keyframes), seeks run long past one frame at 60 fps.</>}>
          <SeekFigure />
        </Figure>
      }
      further={[
        { href: '/blog/scroll-image-sequence-animation', label: 'Apple-style scroll image sequence animation', blurb: 'The same effect as numbered stills on a canvas, and when that is the better choice.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations, effect by effect', blurb: 'Why a scrubbed video shows its end frame, and what every other scroll effect should do.' },
      ]}
    >
      <Section id="idea" k="the idea" title="Scroll progress in, currentTime out">
        <p>
          Pick a stretch of the page for the film to run over. As the reader scrolls through it, work out how far
          along they are as a number from 0 to 1, multiply it by the video’s duration, and set the video’s{' '}
          <code>currentTime</code> to that. The video never plays: it stays paused, and each scroll moves it to a
          new frame. Scroll back and the frames run backwards, because the progress goes down.
        </p>
        <p>
          It takes a few lines of script, not CSS. Scroll-driven animations (<code>animation-timeline</code>) animate
          CSS properties, and <code>currentTime</code> is not one.
        </p>
      </Section>

      <Section id="by-hand" k="step 1" title="Pin the video and follow the scroll by hand">
        <p>
          The usual layout holds the video still while it scrubs: a stage with <code>position: sticky</code> and one
          window’s height, inside a track as tall as the scroll you want plus one window. A {TRACK_VH}vh track keeps
          the stage stuck, and the film running, for {TRACK_VH - 100}vh of scroll.
        </p>
        <Code file="index.html">{HTML}</Code>
        <Code file="film.css">{CSS}</Code>
        <p>
          The script measures the track, not the video. While the stage is stuck the video moves down the page with
          the scroll, so its own position says nothing about how far the reader is; the track’s does. Progress is 0
          when the track’s top reaches the top of the window and 1 when its bottom reaches the bottom.
        </p>
        <Code file="film.js">{FILM_JS}</Code>
        <ul>
          <li>
            <b>A passive listener and an animation frame.</b> <code>{'{ passive: true }'}</code> tells the browser the
            listener never cancels the scroll, so scrolling does not wait for it. The layout read and the seek
            happen in <code>requestAnimationFrame</code>, at most once a frame however many scroll and resize events
            arrive in between.
          </li>
          <li>
            <b>Write only on a change.</b> Setting <code>currentTime</code> starts a seek every time, even to the
            value it already has, and a seek asks the decoder for a frame. Above and below the track the progress is
            held at 0 or 1, so every scroll there would ask for the same frame again. Comparing with the last time
            written costs nothing and skips them.
          </li>
          <li>
            <b>Wait for the metadata.</b> Until <code>loadedmetadata</code>, <code>duration</code> is{' '}
            <code>NaN</code> and there is nothing to seek. The <code>readyState</code> check covers a video whose
            metadata arrived before the script ran.
          </li>
        </ul>
        <Callout k="if the stage does not stick">
          <code>position: sticky</code> sticks inside the nearest ancestor that scrolls. If one between the stage and
          the page has <code>overflow</code> set to <code>hidden</code>, <code>auto</code> or <code>scroll</code>, the
          stage sticks to that box instead and scrolls away with the page.
        </Callout>
      </Section>

      <Section id="encoding" k="step 2" title="Encode a keyframe every few frames">
        <p>
          This is the step that decides whether the scrub is smooth, and it is not in the code. A video file stores a
          few whole pictures, keyframes, and between them only what changed. To show any other frame, the decoder
          starts at the keyframe before it and works forward. Playing, that costs nothing extra. Scrubbing, every
          scroll is a seek, and each one pays for the frames since the last keyframe.
        </p>
        <p>
          Encoders space keyframes for playback, far apart: left at their defaults, both H.264 and VP9 put{' '}
          {DEFAULT_KEYS} keyframes in this site’s {FILM.duration}-second, {FILM.frames}-frame film. Measured on the{' '}
          <Link href="/scroll-video-scrub-generator">scroll video scrub generator</Link>, the slowest 5% of seeks on
          those files took {Math.min(...DEFAULT_P95)}–{Math.max(...DEFAULT_P95)} ms across the three browser
          engines, when a frame at 60 fps lasts {FRAME_60} ms. Re-encoded with a keyframe every 3 frames ({G3_KEYS}{' '}
          of them), the slowest 5% took {G3_P95} ms or less everywhere, as Fig. 1 shows. That is the stutter, and
          the fix.
        </p>
        <Code file="encode.sh">{ENCODE_SH}</Code>
        <p>
          <code>-g</code> is the most frames from one keyframe to the next. libx264 also takes it in its own spelling,{' '}
          <code>-x264-params keyint=3</code>; on the site’s film the two wrote byte-identical files. The last line
          counts what you got: with <code>-g 3</code>, at least a third of the frames, since the encoder may add one
          at a scene cut. <code>-an</code> drops the audio track, which a scrubbed film never plays.
        </p>
        <p>
          Shorter intervals cost bytes. The H.264 film was {H264_DEFAULT ? kb(H264_DEFAULT.bytes) : ''} at the
          default, {H264_G3 ? kb(H264_G3.bytes) : ''} with <code>-g 3</code> and{' '}
          {H264_G1 ? kb(H264_G1.bytes) : ''} with every frame a keyframe (<code>-g 1</code>), whose median seek
          was never more than {G1_GAIN} ms from <code>-g 3</code>’s, in either codec or any engine. A keyframe every 15 frames still kept the slowest 5% at {G15_P95} ms or under. Anything
          from 1 to 15 frames is a fair range; footage differs, so the generator times seeks on your own file.
        </p>
      </Section>

      <Section id="loading" k="step 3" title="Load the file, and serve it with Range requests">
        <p>
          A seek can only land on data the browser has. <code>{'preload="auto"'}</code> asks for the whole file, so
          once it has arrived every frame is local; <code>{'preload="metadata"'}</code> fetches only the duration and
          size, and each seek then waits on the network for its part of the file. <code>preload</code> is a hint the
          browser may scale back, to save a reader’s data for one, so expect the first scroll on a slow connection to
          wait.
        </p>
        <ul>
          <li>
            <b><code>+faststart</code> for MP4.</b> It moves the file’s index (the <code>moov</code> box) in front of
            the frames. Without it the index comes last, and the browser has to go to the end of the file for it
            before it knows the duration.
          </li>
          <li>
            <b>Range requests.</b> Browsers fetch and seek a video by byte ranges. Serve it from a server that answers
            them, with <code>206 Partial Content</code> and <code>Accept-Ranges: bytes</code>: against one that
            does not, Chromium did not seek at all in our tests, and Apple documents byte ranges as required for
            media on iOS.
          </li>
          <li>
            <b>A poster.</b> <code>poster</code> shows until the first frame is ready. Make it the frame the scrub
            starts on, so nothing jumps; the generator draws that frame from the video and saves it.
          </li>
          <li>
            <b>Two sources.</b> WebM first, then MP4 with H.264, which every major browser plays. A browser takes the
            first <code>{'<source>'}</code> it can play.
          </li>
        </ul>
      </Section>

      <Section id="iphone" k="iPhone" title="muted and playsinline, for iPhone">
        <p>
          The scrub itself never calls <code>play()</code>; it only writes <code>currentTime</code>. The two
          attributes are for anything else that might start the video. Without <code>playsinline</code>, an iPhone
          plays video in its fullscreen player, and <code>muted</code> keeps a <code>play()</code> allowed by
          autoplay rules. Leave out <code>autoplay</code>, <code>loop</code> and <code>controls</code>: autoplay
          would run the film on its own clock, and controls would let a tap do the same.
        </p>
      </Section>

      <Section id="reduced-motion" k="accessibility" title="Reduced motion: show the last frame">
        <p>
          A film that moves with the scroll is motion the reader did not start. Under{' '}
          <code>prefers-reduced-motion: reduce</code>, the script above seeks once to the end and never listens to
          the scroll, so the reader gets the last frame, held still. Make that frame one that stands on its own, and
          if chapters of copy follow the film, show them all. The <code>aria-label</code> on the video says what it
          shows; anything the reader should read belongs in real text beside it, not painted into the film. What
          every other kind of scroll effect should do is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="The same with scrollVideo">
        <p>
          svg-scroll-draw’s <code>scrollVideo</code> is the script above with the edges filed off, in its own{' '}
          {SELF_ENTRIES.video.toFixed(1)} KB entry. For the pinned film, point <code>triggerElement</code> at the
          track and run the window from <code>top top</code> to <code>bottom bottom</code>:
        </p>
        <Code file="film.js">{LIB_JS}</Code>
        <p>
          It pauses the video, sets <code>preload</code> when the video has none, waits for the metadata, and
          writes <code>currentTime = from + (to − from) × progress</code>, only when that time changes. It measures
          the trigger window once and again 150 ms after a resize or a layout change, rather than on every scroll,
          and it runs frames only while the scroll is inside the window. Under reduced motion it seeks once to{' '}
          <code>to</code> and does not follow the scroll; turned on during the visit, it goes to that frame and
          stops there.
        </p>
        <Table
          head={['Option', 'Default', 'What it does']}
          rows={OPTIONS.map(([k, def, what]) => [k, <code key="d">{def}</code>, what])}
          caption={<>Plus <code>onReady</code>, <code>onProgress</code> and <code>onComplete</code>. The instance has <code>seek(p)</code>, <code>pause()</code>, <code>resume()</code>, <code>replay()</code>, <code>getProgress()</code> and <code>destroy()</code>.</>}
        />
        <p>
          The <Link href="/scroll-video-scrub-generator">scroll video scrub generator</Link> sets the pin, window,
          range and easing on a video from your own disk and writes the HTML, CSS and JavaScript or a React
          component. The <Link href="/examples/scroll-video">scroll video example</Link> is this listing with
          chapters of copy that follow the film, and <Link href="/showcase/aural">Aural</Link> is a whole product
          page built around it.
        </p>
      </Section>

      <Section id="frames" k="frames or video" title="When an image sequence is the better choice">
        <p>
          A well-encoded video scrubs smoothly and stays one compressed file. An image sequence, numbered stills
          drawn on a <code>{'<canvas>'}</code>, has no keyframes at all: each frame is its own picture, so any scroll
          position shows its frame at once, in every browser, with no codec or <code>Range</code> requests in the way.
          The cost is memory, since every loaded frame is kept decoded at width × height × 4 bytes: a hundred
          1920×1080 frames come to {HD_MB} MB.
        </p>
        <p>
          For a short, high-value turn, a product spinning in a few dozen frames, use frames; for long footage, use a
          video encoded as above. How to build the frames version is in{' '}
          <Link href="/blog/scroll-image-sequence-animation">the scroll image sequence post</Link>, and the{' '}
          <Link href="/scroll-image-sequence-generator">scroll image sequence generator</Link> turns a video into
          frames in your browser.
        </p>
      </Section>

      <Closing
        title="Scrub your own video, copy the code"
        lede="Pick a video from your disk, pin it or let it scroll, set the window and the range, watch the seek times, and copy HTML, JavaScript or a React component."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/scroll-video-scrub-generator', label: 'Scroll video scrub generator →' },
          { href: '/scroll-image-sequence-generator', label: 'Image sequence generator' },
        ]}
      />
    </BlogArticle>
  );
}
