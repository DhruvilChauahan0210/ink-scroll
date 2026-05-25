import React, { useRef, useEffect } from 'react';
import { createEngine } from '../core/engine';
import type { ScrollDrawOptions } from '../core/types';

type ScrollDrawProps = ScrollDrawOptions & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollDraw({ children, className, style, ...options }: ScrollDrawProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = createEngine(ref.current, options);
    return () => instance.destroy();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
