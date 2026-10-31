'use client';

import '../../home/usecases.css';
import './ink.css';
import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/** When a plate's drawing inks: from its top at 85% of the viewport to 35%. */
export const TRIGGER = { start: 'top 85%', end: 'top 35%' } as const;

/**
 * A line drawing on an example plate, in the homepage's stroke system
 * (usecases.css): uc-p ink, uc-s secondary, uc-h pencil, uc-a the accent,
 * uc-dot dots, uc-t mono labels that fade up with the drawing. Paths marked
 * uc-x stay static. DOM order is drawing order.
 */
export function InkSheet({
  children,
  label,
  stagger = 0.03,
  viewBox = '0 0 400 300',
  speed,
  onComplete,
  onProgress,
  className,
}: {
  children: ReactNode;
  /** What the drawing shows, for screen readers. */
  label: string;
  stagger?: number;
  viewBox?: string;
  speed?: number;
  onComplete?: () => void;
  onProgress?: (p: number) => void;
  className?: string;
}) {
  return (
    <ScrollDraw
      className={`ink-sheet${className ? ` ${className}` : ''}`}
      trigger={TRIGGER}
      selector="path:not(.uc-x)"
      stagger={stagger}
      speed={speed}
      easing="ease-out"
      onComplete={onComplete}
      onProgress={onProgress}
    >
      <svg className="uc-svg ink-svg" viewBox={viewBox} role="img" aria-label={label}>
        <>{children}</>
      </svg>
    </ScrollDraw>
  );
}
