'use client';

import './b2-figures.css';
import { PRESETS, type PresetName } from 'svg-scroll-draw';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { presetSets } from './preset-sets';

/**
 * The five-patterns post's opening drawing: what each preset actually does to
 * a path, plotted. x is the scroll through the trigger window (0 → 1), y is how
 * much of the path is drawn. Every curve is computed from the preset's real
 * option bag (`PRESETS`, imported from the library) through the engine's own
 * progress maths — clamp((x − i·stagger) · speed), then the easing — so the
 * overshoot of `spring`, the early finish of `speed > 1` and the three offset
 * strokes of a staggered preset are measured, not drawn by eye.
 */

/** The engine's named easings (packages/svg-scroll-draw/src/core/utils.ts → EASINGS). */
const EASE: Record<string, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring: (t) => 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2),
};

const W = 200;
const H = 64;
const X0 = 4;
const X1 = W - 4;
const BASE = 56; // y of "nothing drawn"
const FULL = 22; // y of "fully drawn"
const px = (x: number) => X0 + x * (X1 - X0);
const py = (p: number) => BASE - p * (BASE - FULL);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

function curve(name: PresetName, i: number) {
  const o = PRESETS[name];
  const ease = EASE[(o.easing as string) ?? 'linear'] ?? EASE.linear;
  const speed = o.speed ?? 1;
  const stagger = o.stagger ?? 0;
  const pts: string[] = [];
  for (let s = 0; s <= 80; s++) {
    const x = s / 80;
    const p = ease(clamp((x - i * stagger) * speed));
    pts.push(`${px(x).toFixed(1)} ${py(p).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
}

export function PresetFigure({ order }: { order: PresetName[] }) {
  return (
    <ScrollDraw className="b2-pc" selector=".b2-pc-ink" autoplay duration={900} delay={300} stagger={0.06} easing="ease-out" once>
      <p className="b2-pc-hd"><span>preset</span><span>path drawn ↑ · scroll through the trigger →</span></p>
      {order.map((name, n) => {
        const o = PRESETS[name];
        const strokes = o.stagger ? 3 : 1;
        const speed = o.speed ?? 1;
        return (
          <div key={name} className="b2-pc-row">
            <span className="b2-pc-n">{String(n + 1).padStart(2, '0')}</span>
            <span className="b2-pc-name">
              <span>{name}</span>
              <span className="b2-pc-sets">{presetSets(name)}</span>
            </span>
            <svg className="b2-pc-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: ${presetSets(name)}`}>
              <path d={`M${X0} ${BASE} H${X1}`} className="b2-pc-axis" />
              <path d={`M${X0} ${FULL} H${X1}`} className="b2-pc-full" />
              {speed > 1 ? (
                <path d={`M${px(1 / speed).toFixed(1)} ${FULL - 6} V${BASE}`} className="b2-pc-done" />
              ) : null}
              {Array.from({ length: strokes }, (_, i) => (
                <path
                  key={i}
                  d={curve(name, i)}
                  className={`b2-pc-ink${i === 0 ? '' : ' is-late'}`}
                  stroke="currentColor"
                />
              ))}
            </svg>
          </div>
        );
      })}
    </ScrollDraw>
  );
}
