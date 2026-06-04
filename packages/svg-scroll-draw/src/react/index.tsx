import React, { useRef, useEffect } from 'react';
import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';
export { useScrollDrawProgress } from './useScrollDrawProgress';
export type { UseScrollDrawProgressOptions } from './useScrollDrawProgress';

// ── ScrollDraw ────────────────────────────────────────────────────────────────

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

// ── ScrollAnimate ─────────────────────────────────────────────────────────────

type ScrollAnimateProps = ScrollAnimateOptions & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollAnimate({ children, className, style, ...options }: ScrollAnimateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = createAnimateEngine(ref.current, options);
    return () => instance.destroy();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

// ── ScrollCounter ─────────────────────────────────────────────────────────────

type ScrollCounterProps = ScrollCounterOptions & {
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollCounter({ className, style, ...options }: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollCounter(ref.current, options);
    return () => instance.destroy();
  }, []);

  return <span ref={ref} className={className} style={style} />;
}

// ── ScrollVideo ───────────────────────────────────────────────────────────────

type ScrollVideoProps = ScrollVideoOptions & {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  muted?: boolean;
  playsInline?: boolean;
};

export function ScrollVideo({ src, className, style, muted = true, playsInline = true, ...options }: ScrollVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollVideo(ref.current, options);
    return () => instance.destroy();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      style={style}
      muted={muted}
      playsInline={playsInline}
      preload="auto"
    />
  );
}

// ── ScrollText ────────────────────────────────────────────────────────────────

type ScrollTextProps = ScrollTextOptions & {
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollText({ children, as: Tag = 'p', className, style, ...options }: ScrollTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = scrollText(ref.current, options);
    return () => instance.destroy();
  }, []);

  return React.createElement(Tag as string, { ref, className, style }, children);
}
