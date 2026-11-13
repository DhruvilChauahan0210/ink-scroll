'use client';

import './frames-turn.css';
import { useEffect, useRef, useState } from 'react';
import type { ScrollDrawInstance } from 'svg-scroll-draw';

/**
 * The image-sequence card: 71 stills of NASA's Landsat 8 model on a
 * turntable, drawn on a canvas by scrollFrames while the card crosses the
 * window (the recipe on /examples/scroll-frames pins it instead). The module
 * and the frames are fetched only once the card is near the screen, so the
 * catalogue does not pay for them up front.
 */

const COUNT = 71;
const frameUrl = (i: number) => `/frames/landsat/frame_${String(i + 1).padStart(4, '0')}.webp`;

export function FramesTurnDemo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let live = true;
    let inst: ScrollDrawInstance | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import('svg-scroll-draw/frames').then(({ scrollFrames }) => {
          if (!live) return;
          inst = scrollFrames(el, {
            frames: frameUrl,
            count: COUNT,
            fit: 'contain',
            // The whole pass: from its top entering the window to its bottom leaving.
            trigger: { start: 'top bottom', end: 'bottom top' },
            onProgress: (_, i) => setFrame(i),
          });
        });
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => {
      live = false;
      io.disconnect();
      inst?.destroy();
    };
  }, []);

  return (
    <figure className="xf-turn">
      <div className="xf-bar">
        <span>{COUNT} frames · scroll turns it</span>
        <span className="xf-n" aria-hidden="true">frame {String(frame + 1).padStart(2, '0')} / {COUNT}</span>
      </div>
      <div className="xf-screen">
        <canvas ref={canvas} className="xf-canvas" role="img" aria-label="NASA's Landsat 8 satellite turning on a turntable as you scroll" />
      </div>
      <figcaption className="xf-credit">
        Landsat 8 (LDCM) model animation: NASA/Goddard Space Flight Center Conceptual Image Lab. Public domain
        (created by NASA). <a href="https://svs.gsfc.nasa.gov/10812">NASA SVS</a> ·{' '}
        <a href="https://commons.wikimedia.org/wiki/File:LDCM_spacecraft_rotating.webm">Wikimedia Commons</a>
      </figcaption>
    </figure>
  );
}
