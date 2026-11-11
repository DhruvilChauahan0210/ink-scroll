'use client';

/**
 * sticky-feature — a left panel that stays in place while the steps on the
 * right scroll past it. The panel tracks the step in view and fills a progress
 * rail as the reader moves through the list.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * The pin is plain CSS `position: sticky` rather than `scrollPin`, because
 * scrollPin moves the element into a wrapper div and React expects to own that
 * node. Sticky does not work inside an ancestor with `overflow: hidden`, so keep
 * this block out of one. Below the `md` breakpoint it becomes a single column.
 *
 * Reduced motion is handled by the library: steps are shown at full opacity and
 * the rail is full. The active-step highlight is state, not motion, so it keeps
 * working either way.
 */

import { useEffect, useRef, useState } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { ScrollAnimate } from 'svg-scroll-draw/react';

export interface FeatureStep {
  title: string;
  body: string;
}

export interface StickyFeatureProps {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  steps?: FeatureStep[];
  className?: string;
}

const DEFAULT_STEPS: FeatureStep[] = [
  { title: 'Install', body: 'Add one package. It has no dependencies of its own, so nothing else comes with it.' },
  { title: 'Wrap', body: 'Put the component around the SVG or element you want to move.' },
  { title: 'Tune', body: 'Pick an easing and a trigger window. The defaults are a good start.' },
  { title: 'Ship', body: 'Server-rendered markup stays readable. The motion is added in the browser.' },
];

export function StickyFeature({
  eyebrow = 'How it works',
  heading = 'Four steps from idea to motion',
  intro = 'The panel stays put while the steps scroll by.',
  steps = DEFAULT_STEPS,
  className = '',
}: StickyFeatureProps) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);

  // Progress rail: scales from 0 to 1 between the first step reaching the middle
  // of the viewport and the last step being fully on screen. The rail sits inside
  // the sticky panel, so its own position never changes; `triggerElement`
  // measures the scrolling list instead.
  useEffect(() => {
    const list = listRef.current;
    const rail = railRef.current;
    if (!list || !rail) return;

    const anim = scrollAnimate(rail, {
      props: { transform: ['scaleY(0)', 'scaleY(1)'] },
      triggerElement: list,
      trigger: { start: 'top 60%', end: 'bottom 85%' },
      easing: 'linear',
    });
    return () => anim.destroy();
  }, []);

  // Keyed on the titles, not the count: the list items are keyed by title, so
  // the same number of renamed steps (a locale switch) replaces every <li>, and
  // an observer kept on the old ones froze the highlight.
  const titles = steps.map((s) => s.title).join('\u0000');

  // Active step: the last step with any part in the top half of the viewport.
  // A set of visible steps, rather than a thin band, so a fast scroll that jumps
  // a step straight past the middle still lands on the right one.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === 'undefined') return;

    const items = Array.from(list.querySelectorAll<HTMLElement>('[data-step]'));
    const inView = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (entry.isIntersecting) inView.add(index);
          else inView.delete(index);
        }
        if (inView.size) setActive(Math.max(...inView));
      },
      { rootMargin: '0px 0px -50% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [titles]);

  return (
    <section className={`mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-2 md:gap-16 ${className}`}>
      {/* Pinned panel */}
      <div className="md:sticky md:top-24 md:self-start">
        <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
          {heading}
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{intro}</p>

        <div className="mt-8 hidden gap-5 md:flex">
          <span className="relative w-1 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <span ref={railRef} className="absolute inset-0 origin-top bg-[#ff90e8]" style={{ transform: 'scaleY(0)' }} />
          </span>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                aria-current={i === active ? 'step' : undefined}
                className={`flex items-baseline gap-3 text-sm transition-colors duration-300 ${
                  i === active
                    ? 'font-semibold text-neutral-950 dark:text-neutral-50'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                {step.title}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Scrolling steps */}
      <ol ref={listRef} className="space-y-6 md:space-y-[30vh] md:py-[10vh]">
        {steps.map((step, i) => (
          <li key={step.title} data-step={i}>
            <ScrollAnimate
              props={{ opacity: [0.3, 1], transform: ['translateY(24px)', 'translateY(0px)'] }}
              trigger={{ start: 'top 85%', end: 'top 55%' }}
              easing="ease-out"
              className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                Step {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400">{step.body}</p>
            </ScrollAnimate>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default StickyFeature;
