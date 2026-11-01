'use client';

import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * Inks every `.cmp-ink` path inside it once, when it scrolls into view — the
 * feature matrix's marks are drawn by the library they are comparing.
 */
export function Ink({ className, children, duration = 520, stagger = 0.03 }: {
  className?: string;
  children: ReactNode;
  duration?: number;
  stagger?: number;
}) {
  return (
    <ScrollDraw className={className} selector=".cmp-ink" autoplay duration={duration} stagger={stagger} easing="ease-out" once>
      {/* A fragment, not the bare node: the package and the app resolve different @types/react. */}
      <>{children}</>
    </ScrollDraw>
  );
}
