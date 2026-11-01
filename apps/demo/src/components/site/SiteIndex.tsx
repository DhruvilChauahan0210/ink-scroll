import Link from 'next/link';
import { INDEX } from './sitemap';

/**
 * Every page, in one band under the drawing sheet. The sheet's parts list keeps
 * its twelve hand-ruled links; this is the plain index beside it, so any page is
 * one click from any other. Server-rendered: no JavaScript ships for it.
 */
export function SiteIndex() {
  return (
    <nav className="site-index" aria-label="Site index">
      <p className="site-index-k">Index — every page</p>
      <div className="site-index-cols">
        {INDEX.map((g) => (
          <div key={g.key} className={`site-index-col site-index-${g.key}`}>
            <p className="site-index-h">{g.title}</p>
            <ul>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
