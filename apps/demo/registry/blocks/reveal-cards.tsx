'use client';

/**
 * reveal-cards — a grid of feature cards that fade up one after another as the
 * grid scrolls into view.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * Each card reveals once and stays revealed. Reduced motion is handled by the
 * library: every card is shown in its final state, with no animation.
 */

import { useEffect, useRef } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export interface RevealCard {
  title: string;
  body: string;
}

export interface RevealCardsProps {
  eyebrow?: string;
  heading?: string;
  cards?: RevealCard[];
  className?: string;
}

const DEFAULT_CARDS: RevealCard[] = [
  { title: 'Draw on scroll', body: 'SVG paths ink themselves in as the reader scrolls, tied to their position.' },
  { title: 'Reveal anything', body: 'Fade, slide or scale any element into place. One call for a whole grid.' },
  { title: 'Count up', body: 'Numbers climb from zero to their value as the section comes into view.' },
  { title: 'Split text', body: 'Headlines arrive word by word or letter by letter, still one string in the DOM.' },
  { title: 'Pin and scrub', body: 'Hold a panel in place while the story scrolls past it.' },
  { title: 'Motion-aware', body: 'Visitors who ask for reduced motion get the finished page, not the animation.' },
];

export function RevealCards({
  eyebrow = 'Features',
  heading = 'Everything moves when it should',
  cards = DEFAULT_CARDS,
  className = '',
}: RevealCardsProps) {
  const gridRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-reveal-card]'));
    // `stagger` starts each card in a row a fifth of the way into its
    // neighbour's reveal, so cards in the same row still arrive in reading order.
    const reveal = scrollReveal(items, {
      from: { opacity: 0, y: 40, scale: 0.97 },
      stagger: 0.2,
      once: true,
    });

    // StrictMode mounts effects twice in development: destroy() restores the
    // original inline styles, so the second run starts clean.
    return () => reveal.destroy();
    // Re-run only when the number of cards changes, not on every new array.
  }, [cards.length]);

  return (
    <section className={`mx-auto w-full max-w-5xl ${className}`}>
      <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
        {heading}
      </h2>

      <ul ref={gridRef} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <li
            key={card.title}
            data-reveal-card=""
            className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff90e8] font-mono text-xs font-medium text-neutral-950">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{card.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RevealCards;
