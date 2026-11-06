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

// ── Attributes for the element ───────────────────────────────────────────────

/**
 * Props that belong on the rendered element, not in the engine options.
 *
 * Every prop but `children`, `className` and `style` used to become an option,
 * so `data-testid`, `aria-label` and `id` never reached the page (TypeScript
 * does not check hyphenated JSX attributes, so nothing warned), and each change
 * to a `data-*` value changed the options and rebuilt the engine (4 builds for
 * 3 changes, measured). No engine option has any of these names.
 */
const ATTR = /^(data-|aria-)|^(id|role|title|tabIndex|lang|dir|hidden)$/;

type ElementAttrs = React.AriaAttributes &
  Pick<React.HTMLAttributes<HTMLElement>, 'id' | 'role' | 'title' | 'tabIndex' | 'lang' | 'dir' | 'hidden'> & {
    [data: `data-${string}`]: string | number | boolean | undefined;
  };

/** Split props into engine options and attributes for the element. */
function split<O>(props: object): [O, Record<string, unknown>] {
  const options: Record<string, unknown> = {};
  const attrs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (ATTR.test(k) ? attrs : options)[k] = v;
  return [options as O, attrs];
}

// ── ScrollDraw ────────────────────────────────────────────────────────────────

type ScrollDrawProps = ScrollDrawOptions & ElementAttrs & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollDraw({ children, className, style, ...rest }: ScrollDrawProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [options, attrs] = split<ScrollDrawOptions>(rest);

  useEngine(ref, options, createEngine);

  return (
    <div ref={ref} className={className} style={style} {...attrs}>
      {children}
    </div>
  );
}

// ── ScrollAnimate ─────────────────────────────────────────────────────────────

type ScrollAnimateProps = ScrollAnimateOptions & ElementAttrs & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollAnimate({ children, className, style, ...rest }: ScrollAnimateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [options, attrs] = split<ScrollAnimateOptions>(rest);

  useEngine(ref, options, createAnimateEngine);

  return (
    <div ref={ref} className={className} style={style} {...attrs}>
      {children}
    </div>
  );
}

// ── ScrollCounter ─────────────────────────────────────────────────────────────

type ScrollCounterProps = ScrollCounterOptions & ElementAttrs & {
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollCounter({ className, style, ...rest }: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [options, attrs] = split<ScrollCounterOptions>(rest);

  useEngine(ref, options, scrollCounter);

  return <span ref={ref} className={className} style={style} {...attrs} />;
}

// ── ScrollVideo ───────────────────────────────────────────────────────────────

type ScrollVideoProps = ScrollVideoOptions & ElementAttrs & {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  muted?: boolean;
  playsInline?: boolean;
};

export function ScrollVideo({ src, className, style, muted = true, playsInline = true, ...rest }: ScrollVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [options, attrs] = split<ScrollVideoOptions>(rest);

  useEngine(ref, options, scrollVideo);

  return (
    <video
      {...attrs}
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

type ScrollTextProps = ScrollTextOptions & ElementAttrs & {
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollText({ children, as: Tag = 'p', className, style, ...rest }: ScrollTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [options, attrs] = split<ScrollTextOptions>(rest);

  useEngine(ref, options, scrollText);

  return React.createElement(Tag as string, { ...attrs, ref, className, style }, children);
}
