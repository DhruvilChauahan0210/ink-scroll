import Image from 'next/image';
import Link from 'next/link';
import type { Showcase } from './index';

/** A showcase site's first screen, linking to the live site. */
export function ShowcaseShot({ site, priority = false }: { site: Showcase; priority?: boolean }) {
  return (
    <Link href={`/showcase/${site.slug}`} className="sx-shot" aria-label={`Open the live ${site.brand} demo site`}>
      <span className="sx-frame">
        <span className="sx-bar" aria-hidden="true">
          <i /><i /><i />
          <span className="sx-url">svg-scroll-draw.vercel.app/showcase/{site.slug}</span>
        </span>
        <Image
          src={site.image}
          alt={`${site.brand} — ${site.what.toLowerCase()} — the first screen of its demo site`}
          width={site.width}
          height={site.height}
          sizes="(min-width: 1000px) 580px, 92vw"
          priority={priority}
          className="sx-img"
        />
      </span>
      <span className="sx-go">
        <span><b>{site.brand}</b> — {site.what}</span>
        <span className="sx-cta">Open the live site ↗</span>
      </span>
    </Link>
  );
}
