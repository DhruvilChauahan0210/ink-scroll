'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useStageFlag } from './useStageFlag';
import { shortCount, useStars } from './useStars';

/** When the count starts ticking: once the button's star has inked. */
const COUNT_DELAY_MS = 500;
const COUNT_MS = 900;

/**
 * The sign-off's "Star on GitHub" button. Its star is a stroke like every other
 * line on the sheet: pencil until the sheet's last stroke lands (SignOff sets
 * `data-done` on the stage), then it inks and fills with the accent and the
 * live count ticks up from 0. The count comes from /api/stars; with none, none is shown.
 * CSS in signoff.css.
 */
export function StarButton({ href }: { href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const done = useStageFlag(ref, 'data-done');
  const stars = useStars();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (stars === null) return;
    let raf = 0;
    let timer = 0;
    if (!done) {
      raf = requestAnimationFrame(() => setShown(0));
    } else if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => setShown(stars));
    } else {
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const tick = (now: number) => {
          const x = Math.min(1, (now - t0) / COUNT_MS);
          setShown(Math.round(stars * (1 - (1 - x) ** 3)));
          if (x < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, COUNT_DELAY_MS);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [done, stars]);

  return (
    <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className="btn so-star" data-magnetic>
      <svg className="so-star-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          className="so-star-pencil"
          d="M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z"
        />
        <path
          className="so-star-ink"
          pathLength={1}
          d="M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z"
        />
      </svg>
      <span>Star on GitHub</span>
      {stars !== null ? (
        <span className="so-star-n" aria-label={`${stars} stars`}>
          {shortCount(shown)}
        </span>
      ) : null}
    </a>
  );
}
