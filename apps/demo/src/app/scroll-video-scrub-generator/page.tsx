import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/videoscrub/videoscrub.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { ENCODES, FILM, MEASURED, type Encode } from '@/data/videoscrub';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { VideoScrubGenerator } from '@/components/videoscrub/VideoScrubGenerator';
import { ScrubFigure } from '@/components/videoscrub/ScrubFigure';
import { LIB_WINDOW, SLUG, posterCommand } from '@/components/videoscrub/scrub-code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "scroll video scrub", "play video on scroll",
// "apple scroll video effect", "scrub video with scroll". Every option and
// default below is read from packages/svg-scroll-draw/src/video/index.ts, and
// every timing and size from data/videoscrub.ts, which says how it was measured.
const TITLE = 'Scroll Video Scrub Generator: Play Video on Scroll';
const DESCRIPTION =
  'Scrub a video with the scroll, the Apple product-page effect: pin it, set the trigger, range and easing, try your own file, and copy HTML, JS or React.';

// ── Figures derived from the measurements ───────────────────────────────────

const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const p95s = (rows: Encode[]) => rows.flatMap((e) => BROWSERS.map((b) => e[b][1]));
const enc = (codec: Encode['codec'], g: number | null) => ENCODES.find((e) => e.codec === codec && e.g === g);
const pick = (g: number | null) => ENCODES.filter((e) => e.codec !== 'VP8' && e.g === g);
const DEFAULT_P95 = p95s(pick(null));
const G3_P95 = p95s(pick(3));
const G15_P95 = p95s(pick(15));
const ratio = (a?: Encode, b?: Encode) => (a && b ? Math.round((a.bytes / b.bytes) * 10) / 10 : 0);
const G1_SIZE = [ratio(enc('H.264', 1), enc('H.264', 3)), ratio(enc('VP9', 1), enc('VP9', 3))].sort((a, b) => a - b);
const G15_SIZE = [ratio(enc('H.264', 15), enc('H.264', 3)), ratio(enc('VP9', 15), enc('VP9', 3))].sort((a, b) => a - b);
const DEFAULT_KEYS = pick(null)[0]?.keyframes ?? 0;
/** How far -g 1's median seek ever was from -g 3's, in ms, over both codecs and all three browsers. */
const G1_GAIN = Math.max(
  ...(['VP9', 'H.264'] as const).flatMap((c) =>
    BROWSERS.map((b) => Math.abs((enc(c, 1)?.[b][0] ?? 0) - (enc(c, 3)?.[b][0] ?? 0))),
  ),
);
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
const FRAME_60 = Math.round((1000 / 60) * 10) / 10;

const OPTIONS: { k: string; type: string; def: string; what: string }[] = [
  {
    k: 'trigger',
    type: '{ start?, end? }',
    def: `'${LIB_WINDOW.start}' → '${LIB_WINDOW.end}'`,
    what: 'The scroll window, in the two-word form: an edge of the measured element, then a line across the window. Progress is 0 at start and 1 at end. The default scrubs from when the video’s top reaches the top of the window until its bottom does: while it leaves.',
  },
  {
    k: 'triggerElement',
    type: 'Element',
    def: 'the video',
    what: 'Measure the window on this element instead of the video. A video in a sticky stage moves with the scroll while it is stuck, so measure the tall track that holds the scroll room.',
  },
  { k: 'from', type: 'number', def: '0', what: 'The time, in seconds, at progress 0.' },
  {
    k: 'to',
    type: 'number',
    def: 'the duration',
    what: 'The time at progress 1. Left out, it is the video’s duration, read once, when the metadata loads.',
  },
  {
    k: 'easing',
    type: "'linear' | 'ease-in' | … | (t) => number",
    def: "'linear'",
    what: 'Shapes progress before it becomes a time. The overshooting ones, spring and elastic, go past 1, and the time with it: past to (see the note below).',
  },
  {
    k: 'once',
    type: 'boolean',
    def: 'false',
    what: 'Keep the furthest point reached: scrolling back up does not rewind. In 2.23.2 and earlier it kept the eased value at its highest, so spring or elastic stayed on their peak; fixed in 2.23.3, which keeps the scroll progress and eases that.',
  },
  { k: 'axis', type: "'x' | 'y'", def: "'y'", what: "Which scroll to follow. 'x' reads the window’s horizontal scroll and the element’s left edge and width." },
  {
    k: 'preload',
    type: "'auto' | 'metadata'",
    def: "'auto'",
    what: 'Set on the video only when it has no preload attribute of its own.',
  },
  { k: 'onReady', type: '() => void', def: '—', what: 'Once the metadata is in and to is known.' },
  { k: 'onProgress', type: '(progress) => void', def: '—', what: 'Each time a time is written, with the eased progress.' },
  { k: 'onComplete', type: '() => void', def: '—', what: 'When progress reaches 1, and again after it has dropped below 1 (unless once).' },
];

const NEEDS: { k: string; why: string }[] = [
  {
    k: 'muted, playsinline',
    why: 'scrollVideo never calls play(): it only writes currentTime. These are for anything else that might start the video: without playsinline an iPhone plays video in its fullscreen player, and muted keeps a play() allowed by autoplay rules. The library’s React ScrollVideo sets both by default.',
  },
  {
    k: 'preload="auto"',
    why: 'Asks the browser for the whole file, so a seek lands on data that is already there. scrollVideo sets it when the attribute is missing.',
  },
  {
    k: 'Range requests',
    why: 'Browsers seek a video by asking the server for byte ranges. The scroll-video recipe measured Chromium against a server that ignores them: asked for 3 s, the film stayed at 0. Apple documents byte ranges as required for media on iOS. Check for 206 Partial Content and Accept-Ranges: bytes.',
  },
  {
    k: 'poster',
    why: 'Shown until the first frame is ready, and instead of the film where a browser cannot play it. Make it the frame the scrub starts on.',
  },
  {
    k: 'no autoplay, loop or controls',
    why: 'scrollVideo pauses the video once, when it is made, and never again; autoplay would start it on its own clock. Controls would let a click do the same.',
  },
];

const ARITHMETIC_JS = `// What scrollVideo does on each animation frame while the video is on
// screen (video/index.ts in svg-scroll-draw), simplified:
const progress = Math.min(1, Math.max(0, (scrollY - startAt) / (endAt - startAt)));
const time = from + (to - from) * easing(progress);

// Every write to currentTime starts a seek, so it writes only on a change.
if (time !== lastTime) video.currentTime = lastTime = time;`;

const SOURCES_HTML = `<video id="film" muted playsinline preload="auto" poster="poster.jpg">
  <source src="film.webm" type="video/webm">
  <source src="film.mp4" type="video/mp4">
</video>`;

const ENCODE_SH = `# VP9 in WebM: a keyframe every 3 frames, no audio track
ffmpeg -i input.mov -an -c:v libvpx-vp9 -b:v 0 -crf 32 -g 3 -row-mt 1 film.webm

# H.264 in MP4, the same keyframes; +faststart puts the index first
ffmpeg -i input.mov -an -c:v libx264 -preset slow -crf 20 -g 3 \\
  -pix_fmt yuv420p -movflags +faststart film.mp4

# Count the keyframes in what you made
ffmpeg -i film.mp4 -vf showinfo -f null - 2>&1 | grep -c "iskey:1"

# The poster: the frame on screen at 0 s
${posterCommand('film.mp4', 0)}`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I play a video on scroll, like Apple’s product pages?',
    a: "Tie the video's currentTime to how far the reader has scrolled. scrollVideo from svg-scroll-draw/video does it in one call: it works out a progress from 0 to 1 over a trigger window, as scroll animations do, and writes currentTime = from + (to − from) × progress on each animation frame that changes it. For the product-page version, put the video in a position: sticky stage inside a tall track and point triggerElement at the track, with start 'top top' and end 'bottom bottom', so the film runs exactly while the stage is stuck. Encode the video with a keyframe every few frames, or it will stutter. The generator above writes all of it.",
  },
  {
    q: 'Why is my scroll-scrubbed video choppy?',
    a: `Almost always the keyframes. Every change of scroll is a seek, and a seek decodes from the keyframe before the frame asked for. Measured on this site’s film, left at the encoders’ defaults (${DEFAULT_KEYS} keyframes in ${FILM.frames} frames), the slowest 5% of seeks took ${Math.min(...DEFAULT_P95)}–${Math.max(...DEFAULT_P95)} ms in Chromium, Firefox and WebKit; with a keyframe every 3 frames, ${Math.max(...G3_P95)} ms or less. At 60 frames a second a frame lasts ${FRAME_60} ms. Re-encode with -g 3 (section 04). The other causes: a server that ignores Range requests, a file that has not finished arriving, and a resolution far above what the screen shows.`,
  },
  {
    q: 'What keyframe interval should a scroll scrub video have?',
    a: `A short one: every 1 to 15 frames. In the measurements on this page, a keyframe every 15 frames kept the slowest 5% of seeks at ${Math.max(...G15_P95)} ms or under, at ${G15_SIZE[0]}–${G15_SIZE[1]} times the size of a keyframe every 3 frames, and making every frame a keyframe (-g 1) kept the median seek within ${G1_GAIN} ms of -g 3 at ${G1_SIZE[0]}–${G1_SIZE[1]} times the size. Your footage will differ: pick your own file in the generator and watch the seek times.`,
  },
  {
    q: 'Can I scrub a video on scroll with CSS only?',
    a: 'Not a <video>. CSS scroll-driven animations (animation-timeline: scroll() or view()) animate CSS properties, and currentTime is not one, so it takes a few lines of script. What CSS alone can scrub is a sprite sheet: every frame in one image, its background-position stepped with steps() on a scroll timeline, at the cost of sending every frame as a picture.',
  },
  {
    q: 'Does a scroll-scrubbed video work on iPhone and in Safari?',
    a: 'It can, given the usual attributes and server. Give the video muted, playsinline and preload="auto", serve it from a server that answers byte-range requests (Apple documents them as required for media on iOS), and add an MP4 (H.264) source beside a WebM one for any browser that cannot play WebM, plus a poster. Visitors who have asked their system for reduced motion see the frame at to, held still, instead of a scrub.',
  },
  {
    q: 'How do I make the video play backwards when scrolling up?',
    a: "It already does. Scrolling up lowers the progress, and scrollVideo seeks back frame by frame. A backward seek decodes from the keyframe before the frame too, which is why sparse keyframes stutter both ways. To have the film run backwards as the page scrolls down, give from a later time than to, such as from: 5, to: 0.",
  },
  {
    q: 'How do I keep the video pinned while it scrubs?',
    a: "Put it in a stage with position: sticky, top: 0 and one window's height, inside a track as tall as the scroll you want plus one window: 400vh gives 300vh of film. The video's own box moves while the stage is stuck, so measure the track: triggerElement: track, trigger: { start: 'top top', end: 'bottom bottom' }. If the stage does not stick, an ancestor probably has overflow set to hidden, auto or scroll. scrollPin from svg-scroll-draw/pin pins with position: fixed instead, with callbacks at both ends.",
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'model', label: 'From scroll to frame' },
  { id: 'options', label: `Every option · ${OPTIONS.length}` },
  { id: 'encoding', label: 'Encoding for scrubbing' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll video scrub', 'play video on scroll', 'apple scroll video effect', 'scrub video with scroll',
    'scroll video', 'video scroll animation', 'scroll controlled video', 'video currentTime scroll',
    'scrollVideo', 'video keyframes scrubbing', 'ffmpeg keyframe interval',
  ],
  alternates: { canonical: `/${SLUG}` },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/${SLUG}` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Scroll video scrub generator',
      url: `${SITE_URL}/${SLUG}`,
      description: DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@id': `${SITE_URL}/#software` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

const ms = (pair: [number, number]) => `${pair[0]} · ${pair[1]}`;

export default function ScrollVideoScrubGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Scroll video scrub generator', `/${SLUG}`]]}
      kicker="video / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll video</span>
              <span>scroll · seek · frame</span>
            </p>
            <h1 className="pg-title stk-title">Scroll video scrub generator</h1>
            <p className="pg-lede">
              A video that plays forwards and backwards with the scroll: the product-page effect. Pin it or let it
              scroll, set the trigger window, the range and the easing, try it on a video from your own disk, and copy
              the HTML, CSS and JavaScript or a React component. Then encode the film so every seek is quick.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/examples/scroll-video" className="btn" data-magnetic>The pinned film recipe →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Keyframe every</dt><dd>{FILM.keyEvery} frames</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <ScrubFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Scrub a video with the scroll">
              <p className="stk-p">
                The box below is a small window. Scroll it, drag the slider or press Play: the scroll is turned into a
                progress with scrollVideo’s own arithmetic and handed to a real scrollVideo instance, which writes the
                video’s <C>currentTime</C>. The readouts read the video back, and time every seek. The film is this
                site’s own, {FILM.width}×{FILM.height} at {FILM.fps} fps; pick a file of yours to see how it scrubs.
              </p>
              <VideoScrubGenerator version={SELF.version} />
              <Note k="Preview">
                scrollVideo follows the window’s scroll and has no <C>scrollContainer</C> option, so the preview works
                out the progress from the box’s scroll (the same arithmetic, fig. 1) and passes it to the instance’s{' '}
                <C>seek()</C>. On your page the instance follows the window by itself.
              </Note>
              <Note k="Recipe">
                For the whole pinned film with chapters of copy that follow it, see{' '}
                <Link href="/examples/scroll-video" className="vsg-a">the scroll-video recipe</Link>; for the same
                scrub drawn in lines instead of footage, <Link href="/examples#scroll-video" className="vsg-a">the
                blueprint phone</Link> on the examples page.
              </Note>
              <Note k="Frames">
                For footage that has to scrub smoothly at any speed, draw it as an image sequence on a canvas instead:
                the <Link href="/scroll-image-sequence-generator" className="vsg-a">scroll image sequence
                generator</Link> turns a video into frames in your browser and writes the scrollFrames code.
              </Note>
            </Sec>

            <Sec n={2} k="The arithmetic" id="model" title="From a scroll position to a frame">
              <p className="stk-p">
                scrollVideo measures one element, the video or its <C>triggerElement</C>, and turns the two trigger
                pairs into two scroll positions, as every scroll animation in the library does. Between them, progress
                runs from 0 to 1 in a straight line; the easing bends it; and the time is that share of the way from{' '}
                <C>from</C> to <C>to</C> (fig. 1).
              </p>
              <CodeBox file="what-it-does.js">{ARITHMETIC_JS}</CodeBox>
              <Note k="When">
                Each scroll compares where it is in the window with the frame on screen. The loop runs on animation
                frames while the scroll is inside the window, and stops on the frame that leaves it, so a jump past the
                whole window (the End key, an anchor link) still lands on the end frame; outside the window a scroll
                costs one comparison. Up to 2.23.4 the loop ran while an IntersectionObserver saw the video. The two
                positions are measured when it is made, when the metadata loads, 150ms after a resize, and when the
                measured element’s layout changes.
              </Note>
              <Note k="Pinned">
                In a sticky stage the video’s own box moves with the scroll for as long as it is stuck, so measured on
                the video the window comes out wrong, and a resize in mid-pin (a phone’s address bar) measures it wrong
                again. Measure the track instead, with <C>{"start: 'top top'"}</C> and <C>{"end: 'bottom bottom'"}</C>:
                the stretch the stage is stuck.
              </Note>
              <Note k="Reduced motion">
                With reduced motion asked for, scrollVideo seeks once to <C>to</C> when the metadata is in and never
                follows the scroll; turned on during a visit, it seeks to that frame and stops there. There is no option to change
                this. The generator’s check box shows it.
              </Note>
              <Note k="seek()">
                <C>seek(p)</C> shows progress <C>p</C> and stops the instance following the scroll until{' '}
                <C>resume()</C>. A <C>seek()</C> made before the video’s metadata has loaded does nothing, and is not
                applied when it loads: wait for <C>onReady</C>.
              </Note>
            </Sec>

            <Sec n={3} k={`${OPTIONS.length} options`} id="options" title="Every scrollVideo option">
              <p className="stk-p">
                <C>{'scrollVideo(target, options)'}</C> takes a <C>{'<video>'}</C> or a selector for one and returns
                an instance. Leave an option out and it takes the default; the generator leaves out every option at its
                default.
              </p>
              <div className="vsg-scroll" tabIndex={0} role="region" aria-label="Every scrollVideo option">
                <table className="vsg-table">
                  <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>What it does</th></tr></thead>
                  <tbody>
                    {OPTIONS.map((o) => (
                      <tr key={o.k}>
                        <th scope="row" className="is-key">{o.k}</th>
                        <td className="is-code">{o.type}</td>
                        <td className="is-code">{o.def}</td>
                        <td>{o.what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Instance">
                <C>seek(p)</C>, <C>pause()</C>, <C>resume()</C>, <C>getProgress()</C> (the eased progress) and{' '}
                <C>destroy()</C>, which takes the observers and listeners off. <C>replay()</C> goes back to the first
                frame; in 2.23.3 and earlier, called after <C>pause()</C> it did not follow the scroll again until the
                video left the screen and came back, fixed in 2.23.4. On the server, or for a target that is not a video, scrollVideo returns an instance that does
                nothing.
              </Note>
              <Note k="Overshoot">
                The time is not clamped to the range, so <C>spring</C> and <C>elastic</C>, which pass 1, ask for
                frames after <C>to</C> (the browser stops at the end of the file), and <C>bounce</C> runs the film
                back and forth through the second half of the window. The generator offers the four smooth easings.
              </Note>
              <p className="stk-p">What the <C>{'<video>'}</C> element needs:</p>
              <div className="vsg-scroll" tabIndex={0} role="region" aria-label="What the video element needs">
                <table className="vsg-table">
                  <thead><tr><th>Give it</th><th>Why</th></tr></thead>
                  <tbody>
                    {NEEDS.map((n) => (
                      <tr key={n.k}>
                        <th scope="row" className="is-key">{n.k}</th>
                        <td>{n.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="React">
                The generated React code calls scrollVideo in an effect rather than rendering the library’s{' '}
                <C>{'<ScrollVideo>'}</C>, because a <C>triggerElement</C> needs the track’s element, which a ref
                holds only after the first render. For a video in the flow, <C>{'<ScrollVideo>'}</C> does the same
                job: it takes a <C>poster</C>, sets <C>muted</C> and <C>playsInline</C> by default, and its{' '}
                <C>preload</C> follows the option, <C>auto</C> when left out. Up to 2.23.3 it dropped the poster and
                always rendered <C>{'preload="auto"'}</C>; fixed in 2.23.4.
              </Note>
            </Sec>

            <Sec n={4} k="Encoding" id="encoding" title="Encode the video for smooth scrubbing">
              <p className="stk-p">
                A video file stores a few whole pictures, keyframes, and between them only what changed. To show any
                other frame, the decoder starts at the keyframe before it and works forward. Playing, that costs
                nothing extra. Scrubbing, every new scroll position is a seek, so each one pays for the frames since the
                last keyframe, and exports usually put keyframes seconds apart: left to their defaults, both encoders
                below put {DEFAULT_KEYS} in this {FILM.frames}-frame film. A short interval, set with <C>-g</C>, keeps
                every seek short, at the cost of a bigger file.
              </p>
              <div className="vsg-scroll" tabIndex={0} role="region" aria-label="Seek times by keyframe interval">
                <table className="vsg-table">
                  <thead>
                    <tr>
                      <th>Encode</th><th>Keyframes</th><th>Size</th>
                      <th>Chromium ms</th><th>Firefox ms</th><th>WebKit ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENCODES.map((e) => (
                      <tr key={`${e.codec}-${e.g}`}>
                        <th scope="row" className="is-key">{e.codec} {e.g === null ? 'default' : `-g ${e.g}`}</th>
                        <td className="is-num">{e.keyframes} / {FILM.frames}</td>
                        <td className="is-num">{kb(e.bytes)}</td>
                        <td className="is-num">{ms(e.chromium)}</td>
                        <td className="is-num">{ms(e.firefox)}</td>
                        <td className="is-num">{ms(e.webkit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                Each cell is the median seek, then the 95th percentile: the slowest 5% took at least that. The site’s
                film ({FILM.codec}, {FILM.width}×{FILM.height}, {FILM.duration} s) was re-encoded with only{' '}
                <C>-g</C> changed, served with Range support, buffered whole, then sought to every frame, last to first
                and back, twice, in Playwright {MEASURED.playwright}’s {MEASURED.browsers.chromium},{' '}
                {MEASURED.browsers.firefox} and {MEASURED.browsers.webkit} on {MEASURED.machine}. Firefox and WebKit
                report whole milliseconds. One film on one machine: the generator times your own.
              </p>
              <CodeBox file="encode.sh">{ENCODE_SH}</CodeBox>
              <Note k="General advice">
                These commands are a starting point, not a rule. What was checked, with ffmpeg {MEASURED.ffmpeg} on the
                film above: each command runs; <C>-g 3</C> gives a keyframe every 3 frames in both codecs (counted with
                the showinfo line); <C>+faststart</C> moves the MP4’s index (<C>moov</C>) in front of the frames, where
                without it the index comes last; and the poster line writes the exact frame a browser shows at that
                time. The quality settings (<C>-crf</C>, <C>-preset</C>) were not compared: raise <C>-crf</C> for a
                smaller file.
              </Note>
              <Note k="Which codec">
                Offer both, the WebM first: a browser plays the first <C>{'<source>'}</C> it can, and H.264 in MP4 is
                the one every major browser plays. All three test browsers played both files here. <C>-an</C> drops the
                audio track, which a scrubbed film never plays; <C>-pix_fmt yuv420p</C> keeps the H.264 file to the
                colour format browsers decode.
              </Note>
              <CodeBox file="film.html">{SOURCES_HTML}</CodeBox>
              <Note k="Poster">
                Use the frame the scrub starts on, so nothing jumps when the film arrives. <C>-ss 4.98</C> before{' '}
                <C>-i</C> would give the first frame at or after 4.98 s; on this film that is frame 150, a colourway
                still, where a browser at 4.98 s shows frame 149. The <C>select</C> line keeps the last frame that
                starts at or before the time, which is the one on screen. The generator draws the same frame from the
                video itself and saves it for you.
              </Note>
              <Note k="Also">
                Decoding cost grows with the picture: a film larger than it is ever shown costs every seek for nothing.
                For VP8, the recipe’s command also turns off alternate reference frames (<C>-auto-alt-ref 0</C>),
                which the recipe found had tripled seek times on this film.
              </Note>
            </Sec>

            <Sec n={5} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollVideo has an entry of its own, <C>svg-scroll-draw/video</C>, and the generated code imports it
                from there. It is not in the script-tag build, so the HTML file imports the ES module from jsDelivr.
              </p>
              <ToolNextStep
                slug={SLUG}
                api="scrollVideo"
                entry="video"
                docs="/docs#scroll-video"
                related={['scroll-image-sequence-generator', 'scroll-pin-generator']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll video questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p stk-more">
                More on scroll video with svg-scroll-draw {SELF.version}: <Link href="/examples/scroll-video">the
                pinned film recipe</Link>, <Link href="/docs#scroll-video">scrollVideo in the docs</Link> and the{' '}
                <Link href="/scroll-pin-generator">scroll pin generator</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
