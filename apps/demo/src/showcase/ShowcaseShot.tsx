import Image from 'next/image';
import Link from 'next/link';
import type { Showcase } from './index';

export function ArrowIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden="true">
      <path d="M3.5 8.5 L8.5 3.5 M4.5 3.5 H8.5 V7.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A showcase site's first screen, edge to edge, linking to the live site. */
export function ShowcaseMedia({ site, priority = false }: { site: Showcase; priority?: boolean }) {
  return (
    <Link href={`/showcase/${site.slug}`} className="sx-media" aria-label={`Open the live ${site.brand} demo site`}>
      <Image
        src={site.image}
        alt={`${site.brand}, ${site.what.toLowerCase()}: the first screen of its demo site`}
        width={site.width}
        height={site.height}
        sizes="(min-width: 1000px) 50vw, 100vw"
        priority={priority}
        className="sx-img"
      />
      <span className="sx-hover" aria-hidden="true"><span>Open live site <ArrowIcon /></span></span>
    </Link>
  );
}

/** The live-site button that sits beside a showcase's name. */
export function LiveButton({ site }: { site: Showcase }) {
  return (
    <Link href={`/showcase/${site.slug}`} className="sx-live">
      Live site <ArrowIcon />
    </Link>
  );
}
