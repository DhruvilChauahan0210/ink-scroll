'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollVideo } from 'svg-scroll-draw/video';
import './film-scrub.css';

/** What the copy says, and from which point in the film (0–1) it says it. */
const CHAPTERS = [
  { from: 0, title: 'Built to be worn all day', body: 'A sprung steel band and memory-foam cushions, 254 g all in.' },
  { from: 0.45, title: 'Taken apart', body: 'The cup comes apart layer by layer: the cap, the shell, the board.' },
  { from: 0.75, title: 'The part you hear', body: 'A 40 mm driver with a beryllium-coated dome, 4 Hz to 40 kHz.' },
];

const chapterAt = (p: number) => CHAPTERS.reduce((at, c, i) => (p >= c.from ? i : at), 0);

/**
 * `src`: a muted film encoded for scrubbing (a keyframe every few frames).
 * `to`: where the scrub stops, in seconds; leave it out to use the whole file.
 */
export function FilmScrub({ src = '/film.webm', to }: { src?: string; to?: number }) {
  const track = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    if (!track.current || !video.current) return;
    const film = scrollVideo(video.current, {
      to,
      // The stage is sticky, so the video's own box moves with the scroll.
      // Measure the track that holds the scroll room instead.
      triggerElement: track.current,
      trigger: { start: 'top top', end: 'bottom bottom' },
      onProgress: (p) => setChapter(chapterAt(p)),
    });
    return () => film.destroy();
  }, [to]);

  return (
    <section ref={track} className="film-track">
      <div className="film-stage">
        <video ref={video} src={src} muted playsInline preload="auto" aria-label="The headphones turning, then taken apart" />
        <ol className="film-copy">
          {CHAPTERS.map((c, i) => (
            <li key={c.title} aria-current={i === chapter ? 'step' : undefined}>
              <span className="film-n">0{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
