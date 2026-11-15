'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
// The post's own listings, imported as printed: the figures run the code the
// reader copies.
import { harmonograph } from './listings/harmonograph.js';
import { flowField } from './listings/flow-field.js';

/** The same window draw-many.js solves: the last stroke lands as the centre reaches the middle. */
function scrollWindow(spread: number, from = 1.15, to = 0.5) {
  const end = (to + spread * from) / (1 + spread);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return { start: `center ${pct(from)}`, end: `center ${pct(end)}` };
}

const toPath = (line: [number, number][]) =>
  'M' + line.filter((_, i) => i % 3 === 0 || i === line.length - 1).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');

/**
 * One of the post's drawings, made in the browser from its listing (a few
 * hundred strokes would bloat the HTML) and drawn as the reader scrolls.
 */
const noopSubscribe = () => () => {};

export function PlotFigure({ kind }: { kind: 'harmonograph' | 'flow' }) {
  // False on the server and in the first render, true in the browser after:
  // the drawing is made only on the client.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const paths = useMemo(() => {
    if (!ready) return null;
    if (kind === 'harmonograph') return [harmonograph(34)];
    const lines = (flowField() as [number, number][][]).sort(
      (a, b) => Math.min(a[0][1], a[a.length - 1][1]) - Math.min(b[0][1], b[b.length - 1][1]),
    );
    return lines.map(toPath);
  }, [ready, kind]);
  const spread = kind === 'flow' ? 1 : 0;
  return (
    <div style={{ aspectRatio: '1', width: '100%' }}>
      {paths && (
        <ScrollDraw
          easing="linear"
          stagger={paths.length > 1 ? spread / (paths.length - 1) : 0}
          trigger={scrollWindow(spread)}
          style={{ width: '100%', height: '100%' }}
          aria-hidden
        >
          <svg viewBox="0 0 1000 1000" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={kind === 'flow' ? 1.1 : 1} strokeLinecap="round">
            {paths.map((d, i) => <path key={i} d={d} />)}
          </svg>
        </ScrollDraw>
      )}
    </div>
  );
}
