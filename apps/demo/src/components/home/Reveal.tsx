'use client';

import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Travel in px; default 36. */
  y?: number;
};

/** Fade + rise on entry, once, through the library's own scrollAnimate. */
export function Reveal({ children, className, y = 36 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollAnimate(ref.current, {
      props: { opacity: [0, 1], transform: [`translateY(${y}px)`, 'translateY(0px)'] },
      easing: 'ease-out',
      trigger: { start: 'top 92%', end: 'top 62%' },
      once: true,
    });
    return () => instance.destroy();
  }, [y]);

  return <div ref={ref} className={className}>{children}</div>;
}
