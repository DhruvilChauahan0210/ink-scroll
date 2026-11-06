'use client';

/**
 * headline-text-reveal — a hero headline whose words rise into place one after
 * another as it scrolls into view, followed by the supporting line.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS.
 *
 * The text stays one string in the server HTML, so search engines and screen
 * readers get the full sentence. Reduced motion is handled by the library: the
 * words are shown in place, with no animation.
 *
 * At the very top of a page the headline is already inside the trigger window
 * on load, so it starts part-way revealed. For a reveal that begins as soon as
 * the reader scrolls, pass `trigger={{ start: 'top bottom', end: 'top 20%' }}`.
 */

import { ScrollText } from 'svg-scroll-draw/react';

export interface HeadlineTextRevealProps {
  eyebrow?: string;
  /** Plain text only: the words are split at runtime. */
  headline?: string;
  /** Plain text only. */
  subline?: string;
  /** Heading level for the headline. Use 'h1' when this is the page's hero. */
  as?: 'h1' | 'h2' | 'h3';
  /** Scroll window for the headline, e.g. { start: 'top 90%', end: 'top 30%' }. */
  trigger?: { start?: string; end?: string };
  className?: string;
}

export function HeadlineTextReveal({
  eyebrow = 'Single-origin coffee',
  headline = 'Coffee from three farms, roasted the week you drink it',
  subline = 'Words arrive in reading order, at the pace the reader sets with their own scroll.',
  as = 'h2',
  trigger = { start: 'top 90%', end: 'top 35%' },
  className = '',
}: HeadlineTextRevealProps) {
  return (
    <section className={`mx-auto w-full max-w-4xl text-center ${className}`}>
      <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
        {eyebrow}
      </p>

      {/* `key` remounts the split if the text changes: ScrollText reads its
          string once, on mount, and splits it into word spans. */}
      <ScrollText
        key={headline}
        as={as}
        split="words"
        stagger={0.08}
        from={{ opacity: 0, y: 32 }}
        easing="ease-out"
        once
        trigger={trigger}
        className="mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-tight text-neutral-950 text-balance dark:text-neutral-50"
      >
        {headline}
      </ScrollText>

      <ScrollText
        key={subline}
        as="p"
        split="words"
        stagger={0.03}
        from={{ opacity: 0, y: 12 }}
        easing="ease-out"
        once
        trigger={{ start: 'top 92%', end: 'top 55%' }}
        className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400"
      >
        {subline}
      </ScrollText>
    </section>
  );
}

export default HeadlineTextReveal;
