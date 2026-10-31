'use client';

import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import type { ScrollAnimateOptions } from 'svg-scroll-draw';

type Props = {
  children: React.ReactNode;
  className?: string;
  props: Record<string, [string | number, string | number]>;
  trigger: NonNullable<ScrollAnimateOptions['trigger']>;
  /** Measure the trigger window on this ancestor instead of the element. */
  triggerSelector?: string;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  once?: boolean;
};

/** scrollAnimate as a wrapper, for choreography like the hero's exit. */
export function ScrollFx({ children, className, props, trigger, triggerSelector, easing = 'linear', once }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggerElement = triggerSelector ? el.closest<HTMLElement>(triggerSelector) ?? undefined : undefined;
    const instance = scrollAnimate(el, { props, trigger, triggerElement, easing, once });
    return () => instance.destroy();
    // Options are static per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}
