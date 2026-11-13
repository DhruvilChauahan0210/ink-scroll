'use client';

import { shortCount, useStars } from '@/components/home/useStars';

export const REPO_URL = 'https://github.com/DhruvilChauahan0210/ink-scroll';

/**
 * A compact "Star on GitHub" link for where search traffic lands: the end of
 * every tool and every blog post. The count comes from /api/stars, the same
 * hour-cached figure the sign-off's StarButton shows (one request per page
 * view, shared between them, never to GitHub itself); with none, none is shown.
 * The count's "stars" is read out but not shown, so the link's accessible name
 * starts with its visible text. CSS in site.css.
 */
export function GitHubStar({ className = '' }: { className?: string }) {
  const stars = useStars();
  return (
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={`btn gh-star ${className}`.trim()}>
      <svg className="gh-star-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z" />
      </svg>
      <span>Star on GitHub</span>
      {stars !== null ? (
        // The space keeps "GitHub" and the count apart when read out; flex hides it.
        <>{' '}<span className="gh-star-n">
          {shortCount(stars)}
          <span className="gh-star-sr"> stars</span>
        </span></>
      ) : null}
    </a>
  );
}
