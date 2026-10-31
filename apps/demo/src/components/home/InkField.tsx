'use client';

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The hero's ink wash: streamlines traced through a deterministic flow field,
 * so the server and the client generate the same strokes. Three depth layers
 * drift with the pointer (see --mx/--my on .hero), and every stroke draws in
 * under `scrollDraw` autoplay the moment the preloader's curtain lifts.
 */
const W = 1000;
const H = 640;
const COLS = 22;
const ROWS = 12;
const STEPS = 34;
const STEP = 7;

function angle(x: number, y: number): number {
  const nx = x / W;
  const ny = y / H;
  return (
    Math.sin(nx * 4.1 + ny * 2.3) * 1.3 +
    Math.cos(nx * 2.2 - ny * 5.7) * 1.1 +
    Math.sin((nx + ny) * 7.3) * 0.5 +
    0.9
  );
}

function streamline(sx: number, sy: number): string {
  let x = sx;
  let y = sy;
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 0; i < STEPS; i++) {
    const a = angle(x, y);
    x += Math.cos(a) * STEP;
    y += Math.sin(a) * STEP;
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

type Stroke = { d: string; layer: 0 | 1 | 2; accent: boolean };

const STROKES: Stroke[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    const jx = Math.sin(i * 12.9898) * 43758.5453;
    const jy = Math.sin(i * 78.233) * 12345.678;
    const sx = (c + 0.5 + (jx - Math.floor(jx) - 0.5) * 0.9) * (W / COLS);
    const sy = (r + 0.5 + (jy - Math.floor(jy) - 0.5) * 0.9) * (H / ROWS);
    STROKES.push({ d: streamline(sx, sy), layer: (i % 3) as 0 | 1 | 2, accent: i % 13 === 4 });
  }
}

export function InkField() {
  const [ready, setReady] = useState(false);

  // Wait for the preloader so the strokes do not draw behind its curtain.
  useEffect(() => {
    const home = document.querySelector('.home');
    if (!home) return;
    if (home.hasAttribute('data-ready')) { setReady(true); return; }
    const mo = new MutationObserver(() => {
      if (home.hasAttribute('data-ready')) { setReady(true); mo.disconnect(); }
    });
    mo.observe(home, { attributes: true, attributeFilter: ['data-ready'] });
    return () => mo.disconnect();
  }, []);

  if (!ready) return <div className="field" aria-hidden="true" />;

  return (
    <ScrollDraw className="field" autoplay duration={2600} stagger={0.0022} easing="ease-out" fade>
      {[0, 1, 2].map((layer) => (
        <svg
          key={layer}
          className={`field-layer field-layer-${layer}`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {STROKES.filter((s) => s.layer === layer).map((s, i) => (
            <path key={i} d={s.d} className={s.accent ? 'stroke stroke-accent' : 'stroke'} />
          ))}
        </svg>
      ))}
    </ScrollDraw>
  );
}
