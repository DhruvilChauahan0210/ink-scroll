import React, { useRef, useEffect, type RefObject } from 'react';
import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
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

// ── The engine behind each component ─────────────────────────────────────────

/**
 * Creates the engine on mount and rebuilds it when an option changes, so props
 * behave the way React props do. Equal options (an inline object recreated each
 * render) do not rebuild, and callbacks are read live (`liveFns`), so a new
 * arrow function each render does not either.
 */
function useEngine<O extends object>(
  ref: RefObject<Element | null>,
  options: O,
  create: (el: never, options: O) => { destroy(): void },
): void {
  const latest = useRef(options);
  latest.current = options;
  const key = optionsKey(options);

  useEffect(() => {
    if (!ref.current) return;
    const instance = create(ref.current as never, liveFns(latest.current, () => latest.current));
    return () => instance.destroy();
    // `key` stands for the options; `ref` and `create` never change.
  }, [key]);
}

// ── ScrollDraw ────────────────────────────────────────────────────────────────

type ScrollDrawProps = ScrollDrawOptions & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollDraw({ children, className, style, ...options }: ScrollDrawProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEngine(ref, options, createEngine);

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

  useEngine(ref, options, createAnimateEngine);

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

  useEngine(ref, options, scrollCounter);

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

  useEngine(ref, options, scrollVideo);

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

  useEngine(ref, options, scrollText);

  return React.createElement(Tag as string, { ref, className, style }, children);
}
