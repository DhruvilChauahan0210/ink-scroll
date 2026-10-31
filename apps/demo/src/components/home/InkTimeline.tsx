'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * A line that draws down the page as you read the steps beside it — scrubbed
 * by scroll position, so it reverses when you scroll back. The grey track is
 * the same path, drawn underneath and left alone.
 */
export function InkTimeline() {
  const d = 'M40 0 C 40 120, 70 160, 70 260 S 10 420, 10 520 S 66 700, 66 820 S 40 960, 40 1000';
  return (
    <div className="timeline-line" aria-hidden="true">
      <svg viewBox="0 0 80 1000" preserveAspectRatio="none" fill="none">
        <path className="track" d={d} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <ScrollDraw
        style={{ position: 'absolute', inset: 0 }}
        trigger={{ start: 'top 75%', end: 'bottom 55%' }}
        native={false}
      >
        <svg viewBox="0 0 80 1000" preserveAspectRatio="none" fill="none" style={{ width: '100%', height: '100%' }}>
          <path className="ink" d={d} strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </ScrollDraw>
    </div>
  );
}
