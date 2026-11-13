import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/videoscrub/videoscrub.css';
import '@/components/frames/frames.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { FramesGenerator } from '@/components/frames/FramesGenerator';
import { FramesFigure } from '@/components/frames/FramesFigure';
import { DEMO, LIB_CONCURRENCY, LIB_WINDOW, SLUG } from '@/components/frames/frames-code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "image sequence scroll animation", "apple scroll
// animation", "scroll frame animation canvas", "video to image sequence". Every
// option and default below is read from packages/svg-scroll-draw/src/frames/
// index.ts; the ffmpeg lines were run with ffmpeg 9.0 on this site's film.
const TITLE = 'Scroll Image Sequence Generator: Apple-Style Frames';
const DESCRIPTION =
  'Scrub an image sequence on a canvas as the page scrolls, Apple-style: turn a video into frames in your browser, download a zip, and copy HTML, JS or React.';

const OPTIONS: { k: string; type: string; def: string; what: string }[] = [
  {
    k: 'frames',
    type: 'string[] | (i) => string',
    def: 'required',
    what: 'The image URLs in order, or a function from a 0-based index to a URL. A function needs count.',
  },
  { k: 'count', type: 'number', def: 'frames.length', what: 'How many frames. Required when frames is a function; with a list, it can only shorten it.' },
  {
    k: 'trigger',
    type: '{ start?, end? }',
    def: `'${LIB_WINDOW.start}' → '${LIB_WINDOW.end}'`,
    what: 'The scroll window, in the two-word form: an edge of the measured element, then a line across the window. Progress is 0 at start and 1 at end. The default turns the frames from when the canvas’s top reaches the top of the window until its bottom does: while it leaves.',
  },
  {
    k: 'triggerElement',
    type: 'Element',
    def: 'the canvas',
    what: 'Measure the window on this element instead of the canvas. A canvas in a sticky stage moves with the scroll while it is stuck, so measure the tall track that holds the scroll room.',
  },
  { k: 'easing', type: "'linear' | 'ease-in' | … | (t) => number", def: "'linear'", what: 'Shapes progress before it picks a frame.' },
  { k: 'once', type: 'boolean', def: 'false', what: 'Hold the furthest frame reached: scrolling back up does not turn it back.' },
  { k: 'axis', type: "'x' | 'y'", def: "'y'", what: "Which scroll to follow. 'x' reads the window’s horizontal scroll and the element’s left edge and width." },
  {
    k: 'fit',
    type: "'cover' | 'contain'",
    def: "'cover'",
    what: 'How each frame fills the canvas: cover fills it and crops, contain shows the whole frame; both centred.',
  },
  { k: 'concurrency', type: 'number', def: String(LIB_CONCURRENCY), what: 'How many images load at once.' },
  { k: 'onReady', type: '() => void', def: '—', what: 'The first frame is drawn.' },
  { k: 'onLoad', type: '() => void', def: '—', what: 'Every frame has loaded or failed.' },
  { k: 'onProgress', type: '(alpha, frame) => void', def: '—', what: 'Each time the scroll moves it: the eased progress, and the index of the frame it calls for.' },
  { k: 'onComplete', type: '() => void', def: '—', what: 'When progress reaches 1, and again after it has dropped below 1 (unless once).' },
];

const ARITHMETIC_JS = `// What scrollFrames does on each animation frame the scroll moves
// (frames/index.ts in svg-scroll-draw), simplified:
const progress = Math.min(1, Math.max(0, (scrollY - startAt) / (endAt - startAt)));
const wanted = Math.round(easing(progress) * (count - 1));

// The frame drawn is the loaded one nearest \`wanted\`, and the canvas is
// redrawn only when that changes, not on every animation frame.
const show = nearestLoaded(wanted);
if (show !== drawn) {
  draw(images[show]); // cover or contain, centred
  drawn = show;
}`;

const FFMPEG_SH = `mkdir frames

# WebP, 12 frames for each second of video, 960px wide (the height follows,
# rounded to an even number); numbered from 1: frames/frame_0001.webp …
ffmpeg -i input.mp4 -an -vf "fps=12,scale=960:-2" \\
  -c:v libwebp -quality 80 frames/frame_%04d.webp

# The same as JPEG, for a browser or a pipeline without WebP
ffmpeg -i input.mp4 -an -vf "fps=12,scale=960:-2" -q:v 3 frames/frame_%04d.jpg

# How many came out: the count to pass
ls frames | wc -l`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make an Apple-style scroll animation with an image sequence?',
    a: "Export the animation as numbered stills, draw them on a <canvas> one at a time, and pick the still from how far the reader has scrolled. scrollFrames from svg-scroll-draw/frames does the drawing: it works out a progress from 0 to 1 over a trigger window and draws frame round(progress × (count − 1)), the nearest loaded one until that arrives. For the product-page version, put the canvas in a position: sticky stage inside a tall track and point triggerElement at the track, with start 'top top' and end 'bottom bottom'. The generator above writes all of it, and turns a video into the stills.",
  },
  {
    q: 'Image sequence or video: which should I scrub on scroll?',
    a: "A video is one file, much smaller for the same footage, but every scroll change is a seek, and a seek decodes from the keyframe before the frame asked for: encoded for playback, scrubbing stutters (the scroll video scrub generator measures it). An image sequence shows any frame at once in every browser, because each one is a picture already decoded, at the cost of many requests and more bytes and memory. Short, high-value sequences, such as a product turning, suit images; long footage suits a video encoded with a keyframe every few frames.",
  },
  {
    q: 'How do I turn a video into an image sequence?',
    a: 'In the generator, choose From a video, pick a file, set the number of frames, the width, the format and the quality, and press Extract: the video is sought to each time in turn in your browser and drawn onto a canvas, and you can download the frames as frames.zip, named frame_0001.webp and on. Nothing is uploaded. With ffmpeg, the lines in section 04 give the same naming.',
  },
  {
    q: 'How many frames should a scroll image sequence have?',
    a: 'Enough that one frame does not cover a visible jump of scroll, and few enough that the reader can download them all. The generator shows how many scroll pixels each frame covers and the total weight of the set as you change them. Each frame is a separate request and, once decoded, about width × height × 4 bytes of memory; the weight readout adds that up for your set.',
  },
  {
    q: 'WebP, AVIF or JPEG for the frames?',
    a: 'Any format the browser can show as an <img> works: scrollFrames loads each frame with new Image(). WebP is usually smaller than JPEG at the same quality and every current major browser shows it. The in-browser extractor writes WebP or JPEG, because those are the formats a canvas can save; Safari’s canvas cannot write WebP, so it offers JPEG there. For AVIF, convert the frames with a tool that encodes it.',
  },
  {
    q: 'What happens with reduced motion on?',
    a: 'Under prefers-reduced-motion: reduce, scrollFrames loads only the last frame, draws it, and does not follow the scroll. Turned on during a visit, the scrub stops on the last frame and nothing more is loaded. There is no option to change this; make the last frame one that stands on its own.',
  },
  {
    q: 'Does it need a React component?',
    a: 'No. There is no scrollFrames component; call it in a useEffect with a ref to the canvas (and one to the track when pinned) and return its destroy, which also stops the loads still in flight. The React tab writes exactly that.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'model', label: 'From scroll to frame' },
  { id: 'options', label: `Every option · ${OPTIONS.length}` },
  { id: 'video', label: 'Video to image sequence' },
  { id: 'weight', label: 'Size, weight and hosting' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'image sequence scroll animation', 'apple scroll animation', 'scroll frame animation canvas', 'video to image sequence',
    'scroll image sequence', 'canvas image sequence', 'apple product page scroll', 'scroll scrub frames',
    'scrollFrames', 'extract frames from video', 'video to webp frames',
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
      name: 'Scroll image sequence generator',
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

export default function ScrollImageSequenceGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Scroll image sequence generator', `/${SLUG}`]]}
      kicker="frames / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / image sequence</span>
              <span>scroll · frame · canvas</span>
            </p>
            <h1 className="pg-title stk-title">Scroll image sequence generator</h1>
            <p className="pg-lede">
              The product-page effect drawn one still at a time: a numbered image sequence painted on a canvas as the
              page scrolls. Try it on the demo, on frames of your own, or on frames this page draws from a video in
              your browser and hands you as a zip; pin it or let it scroll, and copy the HTML, CSS and JavaScript or a
              React component.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <a href="#video" className="btn" data-magnetic>Video to frames ↓</a>
              <Link href="/examples/scroll-frames" className="btn" data-magnetic>The pinned recipe →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Demo frames</dt><dd>{DEMO.count}</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <FramesFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Scrub an image sequence with the scroll">
              <p className="stk-p">
                The box below is a small window. Scroll it, drag the slider or press Play: the scroll is turned into a
                progress with scrollFrames’ own arithmetic and handed to a real scrollFrames instance, which draws the
                frame on the canvas. The demo’s {DEMO.count} frames are drawn in your browser, so it starts at once; pick
                your own frames, or turn a video into frames, and the preview, the readouts and the code follow.
              </p>
              <FramesGenerator version={SELF.version} />
              <Note k="Preview">
                scrollFrames follows the window’s scroll and has no <C>scrollContainer</C> option, so the preview works
                out the progress from the box’s scroll (the same arithmetic, fig. 1) and passes it to the instance’s{' '}
                <C>seek()</C>. On your page the instance follows the window by itself.
              </Note>
              <Note k="Privacy">
                Frames you pick and videos you extract from are read with <C>URL.createObjectURL</C>: they never leave
                this tab, and the URLs are let go when you load another set or leave the page.
              </Note>
            </Sec>

            <Sec n={2} k="The arithmetic" id="model" title="From a scroll position to a frame">
              <p className="stk-p">
                scrollFrames measures one element, the canvas or its <C>triggerElement</C>, and turns the two trigger
                pairs into two scroll positions, as every scroll animation in the library does. Between them, progress
                runs from 0 to 1 in a straight line; the easing bends it; and the frame is that share of the way through
                the sequence, rounded: <C>{'round(progress × (count − 1))'}</C> (fig. 1).
              </p>
              <CodeBox file="what-it-does.js">{ARITHMETIC_JS}</CodeBox>
              <Note k="Loading">
                Frame 0 loads first, then the last frame, then the midpoint of every gap, coarse to fine, at most{' '}
                <C>concurrency</C> ({LIB_CONCURRENCY}) at a time. A reader who scrolls fast has a frame near wherever they
                land after a handful of loads; until the one the scroll calls for arrives, the nearest loaded one shows,
                and the canvas redraws as closer ones come in. A frame that fails to load is skipped the same way, with
                one console warning naming its URL.
              </Note>
              <Note k="Canvas">
                Size the canvas with CSS. scrollFrames sets its drawing buffer to that box ×{' '}
                <C>devicePixelRatio</C>, capped at 2, and redraws when the box changes size (a ResizeObserver) or the
                window does.
              </Note>
              <Note k="Pinned">
                In a sticky stage the canvas’s own box moves with the scroll for as long as it is stuck, so measured on
                the canvas the window comes out wrong. Measure the
                track instead, with <C>{"start: 'top top'"}</C> and <C>{"end: 'bottom bottom'"}</C>: the stretch the
                stage is stuck.
              </Note>
              <Note k="Reduced motion">
                With reduced motion asked for, scrollFrames loads only the last frame, draws it, and never follows the
                scroll; turned on during a visit, the scrub stops on the last frame and nothing more is loaded. There
                is no option to change this. The generator’s check box shows it.
              </Note>
            </Sec>

            <Sec n={3} k={`${OPTIONS.length} options`} id="options" title="Every scrollFrames option">
              <p className="stk-p">
                <C>{'scrollFrames(target, options)'}</C> takes a <C>{'<canvas>'}</C> or a selector for one and returns
                an instance. Leave an option out and it takes the default; the generator leaves out every option at its
                default.
              </p>
              <div className="vsg-scroll" tabIndex={0} role="region" aria-label="Every scrollFrames option">
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
                <C>seek(p)</C>, <C>pause()</C>, <C>resume()</C>, <C>replay()</C>, <C>getProgress()</C> (the eased
                progress) and <C>destroy()</C>, which takes the observers and listeners off and stops the loads still
                in flight. <C>seek(p)</C> shows progress <C>p</C> and stops the instance following the scroll until{' '}
                <C>resume()</C>. On the server, for a target that is not a canvas, or with no frames, scrollFrames
                returns an instance that does nothing.
              </Note>
              <Note k="ARIA">
                The library adds none. Give the canvas <C>{'role="img"'}</C> and an <C>aria-label</C> that says what
                the sequence shows: the generated code has both, with a label to replace.
              </Note>
            </Sec>

            <Sec n={4} k="Frames" id="video" title="Video to image sequence">
              <p className="stk-p">
                Most sequences start as a video: a render, a turntable shot, a screen recording. The generator’s{' '}
                <b>From a video</b> tab turns one into frames without leaving the page: it seeks a{' '}
                <C>{'<video>'}</C> to the middle of each of N equal slices of the file in turn, waits for{' '}
                <C>seeked</C>, draws the picture onto a canvas at the width you chose, and saves it with{' '}
                <C>toBlob</C> as WebP or JPEG. The frames go straight into the preview, and <b>Download frames.zip</b>{' '}
                hands them over as <C>frames/frame_0001.webp</C> and on, the names the code asks for. Try it on this
                site’s film with one click.
              </p>
              <Note k="Formats">
                A browser decodes the videos it can play: MP4 (H.264) and WebM in every major browser, with the codecs
                that browser has. A canvas saves JPEG everywhere and WebP in Chromium and Firefox; Safari’s answers a
                WebP request with PNG, so there the generator writes JPEG.
              </Note>
              <Note k="Zip">
                The archive stores each image as it is, without compressing it again (WebP and JPEG are compressed
                already), so it is about the size of the frames together. It is written in the page by a few dozen lines
                of code, with a CRC-32 per file: no library, no server.
              </Note>
              <p className="stk-p">Or with ffmpeg, from a terminal, for a long video or a pipeline:</p>
              <CodeBox file="frames.sh">{FFMPEG_SH}</CodeBox>
              <Note k="Checked">
                Run with ffmpeg 9.0 on this site’s 5.4 s film: <C>fps=12</C> gave 65 frames, numbered from{' '}
                <C>frame_0001</C>, 960×720. The WebP line needs an ffmpeg built with libwebp (most are); the{' '}
                <C>-quality</C> and <C>-q:v</C> values are a starting point, not a measurement.
              </Note>
            </Sec>

            <Sec n={5} k="Weight" id="weight" title="Frame size, weight and hosting">
              <p className="stk-p">
                A sequence is paid for frame by frame: a reader downloads every image, and each one, decoded, takes
                about width × height × 4 bytes of memory. The generator’s readout adds up the set you have loaded: its files on disk,
                the average frame, and the decoded total.
              </p>
              <Note k="Width">
                The canvas never draws more pixels than its box × <C>devicePixelRatio</C>, capped at 2. A frame wider
                than twice the widest the canvas is ever shown costs bytes and memory for nothing; for a full-width
                stage, 1280 to 1920 px is plenty, and a phone needs far less.
              </Note>
              <Note k="Count">
                Fewer frames over the same scroll means each covers more of it: the pinned readout gives the scroll
                each frame covers, in vh. Halving the count halves the bytes.
              </Note>
              <Note k="Hosting">
                Put the frames in one folder on any static host or CDN, next to the page or in <C>public/frames</C> for
                Next.js or Vite, and point the URL pattern at it. Unlike a video, an image needs no Range requests. Give
                the folder a long cache lifetime: the frames do not change once made, so rename them (or the folder)
                when they do.
              </Note>
            </Sec>

            <Sec n={6} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollFrames has an entry of its own, <C>svg-scroll-draw/frames</C>, and the generated code imports it
                from there. It is not in the script-tag build, so the HTML file imports the ES module from jsDelivr.
              </p>
              <ToolNextStep
                slug={SLUG}
                api="scrollFrames"
                entry="frames"
                docs="/docs#scroll-frames"
                related={['scroll-video-scrub-generator', 'scroll-pin-generator']}
              />
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Image sequence questions">
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
                More with svg-scroll-draw {SELF.version}: <Link href="/examples/scroll-frames">the pinned image
                sequence recipe</Link>, on 71 frames of NASA’s Landsat 8, <Link href="/docs#scroll-frames">scrollFrames
                in the docs</Link>, the <Link href="/scroll-video-scrub-generator">scroll video scrub generator</Link> for the
                same effect from one video file, and the <Link href="/scroll-pin-generator">scroll pin
                generator</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
