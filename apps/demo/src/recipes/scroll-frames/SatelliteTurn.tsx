'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollFrames } from 'svg-scroll-draw/frames';
import './satellite-turn.css';

/** 71 stills, frame_0001.webp … frame_0071.webp, 960×540 each. */
const COUNT = 71;

/** What the copy says, and from which point in the turn (0–1) it says it. */
const CHAPTERS = [
  { from: 0, title: 'Landsat 8', body: 'Launched in February 2013 to photograph the land, from 705 km up.' },
  { from: 0.4, title: 'One wing', body: 'A single solar array powers it through each 99-minute orbit.' },
  { from: 0.72, title: 'Two instruments', body: 'An imager and a thermal sensor look straight down, back over the same ground every 16 days.' },
];

const chapterAt = (p: number) => CHAPTERS.reduce((at, c, i) => (p >= c.from ? i : at), 0);

/** `base`: the folder holding the frames, with no trailing slash. */
export function SatelliteTurn({ base = '/frames/landsat' }: { base?: string }) {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [chapter, setChapter] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!track.current || !canvas.current) return;
    const turn = scrollFrames(canvas.current, {
      frames: (i) => `${base}/frame_${String(i + 1).padStart(4, '0')}.webp`,
      count: COUNT,
      fit: 'contain',
      // The stage is sticky, so the canvas's own box moves with the scroll.
      // Measure the track that holds the scroll room instead.
      triggerElement: track.current,
      trigger: { start: 'top top', end: 'bottom bottom' },
      onProgress: (p, i) => {
        setChapter(chapterAt(p));
        setFrame(i);
      },
    });
    return () => turn.destroy();
  }, [base]);

  return (
    <section ref={track} className="turn-track">
      <div className="turn-stage">
        <figure className="turn-film">
          <canvas ref={canvas} role="img" aria-label="NASA's Landsat 8 satellite turning a full circle on a turntable as you scroll" />
          <figcaption className="turn-meta">
            <span>
              Landsat 8 (LDCM) model animation: NASA/Goddard Space Flight Center Conceptual Image Lab. Public domain
              (created by NASA). <a href="https://svs.gsfc.nasa.gov/10812">NASA SVS</a> ·{' '}
              <a href="https://commons.wikimedia.org/wiki/File:LDCM_spacecraft_rotating.webm">Wikimedia Commons</a>
            </span>
            <span className="turn-n" aria-hidden="true">{String(frame + 1).padStart(2, '0')} / {COUNT}</span>
          </figcaption>
        </figure>
        <ol className="turn-copy">
          {CHAPTERS.map((c, i) => (
            <li key={c.title} aria-current={i === chapter ? 'step' : undefined}>
              <span className="turn-k">0{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
