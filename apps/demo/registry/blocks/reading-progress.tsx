'use client';

/**
 * reading-progress — an article with a thin bar fixed to the top of the
 * viewport that fills as the reader moves through it.
 *
 * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
 * Needs: react, svg-scroll-draw 2.19 or later (`scrollProgress` re-measures
 * when the layout changes, such as images loading in the article; earlier
 * versions re-measure only on a window resize, so the bar would fill before
 * the end). Styling: Tailwind CSS.
 *
 * Uses `scrollProgress` from svg-scroll-draw/progress. It writes the reader's
 * position as a CSS variable, --reading-progress (0 to 1), and the bar's fill is
 * plain CSS, scaleX(var(--reading-progress)), so React does not render per frame.
 * The bar is empty when the article's top reaches the top of the viewport and
 * full when the article's bottom reaches the bottom of the viewport.
 *
 * Pass your article as `children`. The default is a placeholder essay, long on
 * purpose: the bar appears only for an article taller than the viewport, and
 * only while the article is on screen. `kicker`, `title` and `byline` fill the
 * header, `as` sets the title's heading level and `accent` colours the bar.
 *
 * The bar is decorative and aria-hidden: the scroll position already tells
 * assistive technology where the reader is, and a progressbar whose value
 * changed on every frame would only add noise. The library has no
 * reduced-motion path for scrollProgress, so the block sets its own: the fill
 * moves only as far as the reader scrolls, like a scrollbar, so it stays; the
 * fade in and out is removed.
 *
 * `position: fixed` places the bar against the viewport unless an ancestor has a
 * transform, filter, backdrop-filter, perspective or contain (page-transition
 * wrappers often add one), so keep the block out of one. The bar sits on the top
 * edge at z-50; to place it under a fixed site header instead, change `top-0` to
 * the header's height (`top-16` for a 64px header).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { scrollProgress } from 'svg-scroll-draw/progress';

export interface ReadingProgressProps {
  /** The article body. Defaults to a placeholder essay. */
  children?: ReactNode;
  kicker?: string;
  title?: string;
  /** Line under the title, such as the author and the reading time. */
  byline?: string;
  /** Heading level for the title. Use 'h1' when the article is the page's main content. */
  as?: 'h1' | 'h2';
  /** Colour of the bar's fill. Any CSS colour. */
  accent?: string;
  className?: string;
}

export function ReadingProgress({
  children,
  kicker = 'Field notes',
  title = 'We close on Wednesdays now. Here is what changed.',
  byline = 'The bakery on Kessel Street · 2 min read',
  as: Heading = 'h2',
  accent = '#ff90e8',
  className = '',
}: ReadingProgressProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // scrollProgress writes its variable on the element it measures. Set on the
    // article, every element inside would inherit the new value and be restyled
    // with it on every scroll frame. `frame` is an empty layer over the same box
    // with only the bar inside, so the bar is all that is restyled.
    const progress = scrollProgress(frame, {
      variable: '--reading-progress',
      // Only the linear value is used: skip writing the eased one.
      easedVariable: null,
      // The end is a point every page can reach: however the page ends, the
      // article's bottom can always scroll up to the bottom of the viewport.
      trigger: { start: 'top top', end: 'bottom bottom' },
    });

    // scrollProgress updates only while the element it measures is on screen.
    // That is invisible for most uses, but this bar is fixed and stays in view:
    // a jump over the whole article in one step, or the browser restoring a
    // scroll position past the article after load, would leave the bar showing a
    // value that is no longer true. So the bar is shown only while the article
    // is on screen, where the library keeps it exact on every frame.
    //
    // It also stays hidden for an article no taller than the viewport. There is
    // nothing to scroll through, and the window runs backwards (its end comes
    // before its start), so the bar would start full and empty as you scroll.
    let onScreen = false;
    const sync = () => setShown(onScreen && frame.getBoundingClientRect().height > window.innerHeight);

    const io = new IntersectionObserver((entries) => {
      // Entries arrive in order, so the last one is the current state.
      for (const entry of entries) onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(frame);

    // The article's height changes as images and fonts load; the viewport's
    // changes on a resize, including a mobile toolbar showing or hiding. The
    // library re-measures its own window on both; these only decide `shown`.
    // ResizeObserver is missing in jsdom, where component tests often stub
    // IntersectionObserver alone.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    ro?.observe(frame);
    window.addEventListener('resize', sync);

    // StrictMode mounts effects twice in development: destroy() removes the
    // variable, so the second run starts clean.
    return () => {
      progress.destroy();
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  return (
    <article className={`relative mx-auto w-full max-w-2xl ${className}`}>
      {/* The layer scrollProgress measures and writes to: it covers the article
          exactly and takes no clicks, so text under it can still be selected. */}
      <div ref={frameRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className={`fixed inset-x-0 top-0 z-50 h-[3px] bg-neutral-900/10 print:hidden motion-safe:transition-opacity motion-safe:duration-300 dark:bg-white/15 ${
            shown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Transform, not width, so a scroll frame never triggers layout. Until
              the effect runs the variable is unset and the fallback keeps the
              fill empty. It fills from the reading start: the right on an RTL page. */}
          <div
            className="h-full origin-left will-change-transform [transform:scaleX(var(--reading-progress,0))] rtl:origin-right"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>

      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          {kicker}
        </p>
        <Heading className="mt-3 text-4xl font-bold tracking-tight text-neutral-950 text-balance sm:text-5xl dark:text-neutral-50">
          {title}
        </Heading>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">{byline}</p>
      </header>

      <div className="mt-10 space-y-6 text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        {children ?? <PlaceholderEssay heading={Heading === 'h1' ? 'h2' : 'h3'} />}
      </div>
    </article>
  );
}

/** Placeholder copy. Replace it by passing your own article as children. */
function PlaceholderEssay({ heading: Subheading }: { heading: 'h2' | 'h3' }) {
  const subheading = 'pt-4 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50';

  return (
    <>
      <p>
        For eleven years the bakery on Kessel Street opened six days a week. The ovens were lit at four,
        the first rye came out at half past five, and by Friday everyone behind the counter was running on
        coffee and habit. Last March we tried something smaller: open four days, Thursday to Sunday, with
        Wednesday kept for the work that never fitted between customers.
      </p>

      <Subheading className={subheading}>Why we stopped</Subheading>
      <p>
        It was not about rest at first. It was about waste. On Tuesdays and Wednesdays we baked for the
        crowd we hoped for and sold to the crowd we had, and about one loaf in five went to the food bank or
        the compost. Those days only looked like they paid their way because the weekend was paying for them.
      </p>
      <p>
        Closing on the slow days let us bake later on the busy ones. The second bake moved to eleven, so the
        sourdough that used to sit on the shelf from dawn came out in time for lunch. A regular asked whether
        we had changed the flour. We had changed the clock.
      </p>

      <Subheading className={subheading}>What the numbers did</Subheading>
      <p>
        Six months in, we sell about as many loaves a week as before, in four days instead of six. Waste
        fell from a fifth of each bake to roughly one loaf in twenty. Takings dipped in the first month,
        while people learned the new days, and were back to normal by the third.
      </p>
      <p>
        Wednesday changed the most. With the door locked, the team tests recipes, fixes what broke during
        the week and trains the apprentice on the shaping bench without a queue at the counter. The proofing
        cabinet that leaked all winter was mended on the second Wednesday. Two of the loaves on today&apos;s
        board started as Wednesday experiments.
      </p>

      <Subheading className={subheading}>What we would tell another small shop</Subheading>
      <p>
        Count what you throw away before you count what you sell; the quiet days are often the expensive
        ones. Tell customers early and in plain words, on the door, on the receipts and at the till. We lost
        fewer regulars to the new hours than to the six weeks the road outside was dug up.
      </p>
      <p>
        We are not going back. The ovens still light at four, only now four times a week, and the people who
        light them have Monday and Tuesday to themselves.
      </p>
    </>
  );
}

export default ReadingProgress;
