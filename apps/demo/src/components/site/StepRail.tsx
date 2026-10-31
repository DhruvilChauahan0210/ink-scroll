'use client';

import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * A numbered procedure with a rail down its left edge that the library inks
 * as you read through it — the line reaches each step as you do. The rail's
 * viewBox is 2 units wide and drawn at 2px, so stretching it to the list's
 * height scales it only lengthways and the stroke keeps its width.
 */
export function StepRail({ children }: { children: ReactNode }) {
  return (
    <ScrollDraw className="rail" selector=".rail-ink" trigger={{ start: 'top 60%', end: 'bottom 60%' }} easing="linear">
      <svg className="rail-svg" viewBox="0 0 2 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M1 0 V1000" className="rail-ink" stroke="currentColor" />
      </svg>
      <div className="rail-body">{children}</div>
    </ScrollDraw>
  );
}
