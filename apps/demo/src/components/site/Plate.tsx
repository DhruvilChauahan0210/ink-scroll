import type { ReactNode } from 'react';

/**
 * A live preview mounted like a plate in a drawing set: a caption strip with
 * the figure number, then the specimen on its own ground. Previews keep their
 * own colours (a Vue demo stays Vue green), so the ground is paper or slate
 * whatever the page theme.
 */
export function Plate({ n, dark = false, caption = 'live — scroll to draw', children }: {
  n: number | string;
  dark?: boolean;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className="plate">
      <figcaption className="plate-cap">
        <span className="plate-n">Fig. {typeof n === 'number' ? String(n).padStart(2, '0') : n}</span>
        <span>{caption}</span>
      </figcaption>
      <div className={`plate-body${dark ? ' is-dark' : ''}`}>{children}</div>
    </figure>
  );
}
