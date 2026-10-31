import '@/app/home.css';
import './site.css';
import type { ReactNode } from 'react';
import { HomeNav } from '@/components/home/HomeNav';
import { Magnetic } from '@/components/home/Magnetic';
import { SignOff } from '@/components/home/SignOff';
import { SELF } from '@/data/competitors';
import { UNIT_TESTS, BROWSER_TESTS } from '@/data/facts';

/**
 * The homepage's frame for every other page: the same tokens, the glass nav
 * (solid from the start — inner pages have no hero to sit over) and the same
 * signed drawing sheet as the footer, with the site's links in its parts list.
 */
export function SiteShell({
  active,
  children,
  cta,
  kicker = '— / your turn',
}: {
  /** The nav link this page belongs to, e.g. '/docs'. */
  active?: string;
  children: ReactNode;
  /** The sign-off's first button, when "Read the docs" would point at this page. */
  cta?: { href: string; label: string };
  /** The sign-off's kicker, e.g. "docs / your turn". */
  kicker?: string;
}) {
  return (
    <div className="home site">
      <Magnetic />
      <HomeNav version={SELF.version} active={active} solid />
      <div className="site-body">{children}</div>
      <footer className="sec-cal">
        <SignOff
          version={SELF.version}
          gzipKb={SELF.gzipKb}
          unitTests={UNIT_TESTS}
          browserTests={BROWSER_TESTS}
          kicker={kicker}
          cta={cta}
        />
      </footer>
    </div>
  );
}
