'use client';

/**
 * video-scrub — a product film pinned to the screen and scrubbed by the scroll,
 * with numbered chapters beside it that follow the film.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw 2.18 or later (`scrollVideo` from
 * `svg-scroll-draw/video`, with `triggerElement` and `onProgress`).
 * Styling: Tailwind CSS.
 *
 * Props: `src` is required, the URL of your film; there is no default film.
 * Optional: `fallbackSrc` (an MP4 copy for browsers that cannot play `src`),
 * `poster`, `label` (what the film shows, for screen readers), `chapters`,
 * `from` and `to` (the stretch of the file to scrub, in seconds) and
 * `className`. The default chapters and label are placeholders: replace them.
 *
 * The track is four screens tall and the stage inside it is sticky, so the
 * stage stays stuck for three screens of scroll, and that stretch is the film.
 * For more or less scroll per film, change `h-[400vh]` on the track. The scrub
 * is measured on the track, not the video: a video in a sticky stage moves with
 * the scroll, so its own box gives the wrong window, and a phone's address bar
 * showing or hiding is a resize that measures it wrong again.
 *
 * Encode the film for scrubbing. Every scroll frame is a seek, and a seek
 * decodes from the last keyframe; exports usually put one every few seconds.
 * Put one every few frames (`-g 3`): measured in Chromium on a 5-second film,
 * that kept every seek under 7.3 ms, against up to 53.6 ms with one keyframe
 * for the whole clip. `-an` drops the audio, and `-auto-alt-ref 0` turns off
 * alternate reference frames, which tripled seek times on a test film.
 *
 *   ffmpeg -i film.mov -an -c:v libvpx -cpu-used 1 -pix_fmt yuv420p \
 *     -g 3 -auto-alt-ref 0 -b:v 2400k -crf 4 -qmin 0 -qmax 26 film.webm
 *
 * For `fallbackSrc`, keep the same short keyframe interval:
 *
 *   ffmpeg -i film.mov -an -c:v libx264 -pix_fmt yuv420p -g 3 -crf 20 \
 *     -movflags +faststart film.mp4
 *
 * Serve the film from a server that answers Range requests (206 Partial
 * Content, Accept-Ranges: bytes), or it will not scrub once deployed. Sticky
 * does not work inside an ancestor with `overflow: hidden`, `auto` or `scroll`;
 * use `overflow: clip` there, or keep this block out of one.
 *
 * Below the `md` breakpoint the stage shows one chapter at a time, so it still
 * fits one screen. Reduced motion is handled by the library for the film: it
 * shows the last frame and does not scrub. This block then shows every chapter
 * and drops the scroll room, so nobody scrolls three screens past a still.
 */

import { useEffect, useRef, useState } from 'react';
import { scrollVideo } from 'svg-scroll-draw/video';

export interface FilmChapter {
  /** Where this chapter takes over: a point in the film from 0 (start) to 1 (end). */
  from: number;
  title: string;
  body: string;
}

export interface VideoScrubProps {
  /** Required. A muted film encoded for scrubbing (see above). */
  src: string;
  /** An MP4 copy of the film, encoded the same way, for browsers that cannot play `src`. */
  fallbackSrc?: string;
  /** Image shown until the film's first frame is ready. */
  poster?: string;
  /** What the film shows, for screen readers. */
  label?: string;
  /** In film order, the first from 0. Each one shows until the next one's `from`. */
  chapters?: FilmChapter[];
  /** Where the scrub starts in the file, in seconds. Default 0. */
  from?: number;
  /** Where the scrub stops in the file, in seconds. Leave it out to use the whole file. */
  to?: number;
  className?: string;
}

const DEFAULT_CHAPTERS: FilmChapter[] = [
  { from: 0, title: 'Built to be worn all day', body: 'A sprung steel band and memory-foam cushions, 254 g all in.' },
  { from: 0.45, title: 'Taken apart', body: 'The cup comes apart layer by layer: the cap, the shell, the board.' },
  { from: 0.75, title: 'The part you hear', body: 'A 40 mm driver with a beryllium-coated dome, 4 Hz to 40 kHz.' },
];

/** The last chapter that has started at film progress `p` (0 to 1). */
function chapterAt(chapters: FilmChapter[], p: number): number {
  return chapters.reduce((at, chapter, i) => (p >= chapter.from ? i : at), 0);
}

export function VideoScrub({
  src,
  fallbackSrc,
  poster,
  label = 'Headphones turning, then taken apart layer by layer',
  chapters = DEFAULT_CHAPTERS,
  from,
  to,
  className = '',
}: VideoScrubProps) {
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chaptersRef = useRef(chapters);
  // The film's progress (0 to 1), kept only when it crosses into another
  // chapter, and the current chapter is worked out from it on every render.
  // Keeping every frame's progress would re-render 60 times a second. Keeping
  // a chapter number would go stale when `chapters` changes and no frame
  // follows, as under reduced motion, where the film reports only once.
  const [progress, setProgress] = useState(0);
  const [motionChanges, setMotionChanges] = useState(0);

  // The progress callback reads the latest chapters through a ref, so new
  // chapters do not restart the film.
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  // scrollVideo reads prefers-reduced-motion once, when it starts, while the
  // layout below follows the setting live (motion-safe / motion-reduce). Start
  // the film again when the setting changes, so the two never disagree.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setMotionChanges((n) => n + 1);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    const film = scrollVideo(video, {
      from,
      to,
      // The stage is sticky, so the video's own box moves with the scroll.
      // Measure the track that holds the scroll room instead: `top top` to
      // `bottom bottom` is exactly the stretch the stage is stuck.
      triggerElement: track,
      trigger: { start: 'top top', end: 'bottom bottom' },
      // Runs every frame while the film is on screen. Handing back the same
      // value while the chapter is unchanged lets React skip the render. Under
      // reduced motion it runs once, with 1, for the last frame.
      onProgress: (p) => {
        const list = chaptersRef.current;
        setProgress((kept) => (chapterAt(list, kept) === chapterAt(list, p) ? kept : p));
      },
    });
    // StrictMode mounts effects twice in development: destroy() removes every
    // listener and observer, so the second run starts clean.
    return () => film.destroy();
    // A new `src` or `fallbackSrc` remounts the <video> (see its `key`), so
    // bind the new element.
  }, [src, fallbackSrc, from, to, motionChanges]);

  const current = chapterAt(chapters, progress);

  return (
    // The track holds the scroll room: the stage stays stuck for its height
    // minus one screen, and the film runs exactly that long. Under reduced
    // motion there is nothing to scroll through, so it collapses to the stage.
    <section
      ref={trackRef}
      className={`relative h-[400vh] bg-[#121212] text-[#ece8e1] motion-reduce:h-auto ${className}`}
    >
      {/* One screen tall, measured on the small viewport (svh) so a phone's
          address bar never hides the bottom of it; plain vh where svh is not
          supported. A minimum rather than a fixed height, so content that does
          not fit (every chapter at once, under reduced motion) grows the stage
          instead of spilling out of it. */}
      <div className="sticky top-0 box-border grid min-h-screen grid-cols-1 content-center items-center gap-5 px-[6vw] supports-[height:100svh]:min-h-[100svh] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-12 motion-reduce:py-16">
        {/* No autoplay and no controls: the scroll is the playhead. With a
            fallback, the two files become <source>s, tried in order. */}
        <video
          key={`${src}|${fallbackSrc ?? ''}`}
          ref={videoRef}
          src={fallbackSrc ? undefined : src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          aria-label={label}
          className="block aspect-[4/3] h-auto max-h-[80vh] w-full object-cover"
        >
          {fallbackSrc && (
            <>
              <source src={src} />
              <source src={fallbackSrc} type="video/mp4" />
            </>
          )}
        </video>

        {/* On a phone the chapters share one grid cell and cross-fade, so the
            stage keeps the height of the tallest one and the film above never
            jumps. Under reduced motion they are all shown, in full, in order. */}
        <ol className="m-0 grid list-none gap-7 p-0">
          {chapters.map((chapter, i) => {
            const isCurrent = i === current;
            return (
              <li
                key={chapter.title}
                aria-current={isCurrent ? 'step' : undefined}
                className={`transition-[opacity,visibility] duration-300 motion-reduce:transition-none max-md:motion-safe:col-start-1 max-md:motion-safe:row-start-1 ${
                  isCurrent
                    ? 'opacity-100'
                    : 'opacity-[0.32] motion-reduce:opacity-100 max-md:motion-safe:invisible max-md:motion-safe:opacity-0'
                }`}
              >
                <span className="font-mono text-xs font-semibold leading-none text-[#d0a15c]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mb-1.5 mt-2 text-2xl font-semibold leading-[1.2]">{chapter.title}</h3>
                <p className="m-0 max-w-[34ch] text-base leading-[1.6]">{chapter.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default VideoScrub;
