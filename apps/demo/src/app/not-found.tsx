import type { Metadata } from 'next';
import '@/components/guides.css';
import Link from 'next/link';
import { SiteShell } from '@/components/site/SiteShell';
import { EXAMPLE_COUNT } from '@/data/examples-index';
import { GUIDES } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Page not found — svg-scroll-draw',
  robots: { index: false },
};

/** Where a lost visitor most likely meant to go, in the nav's order. */
const WAYS = [
  { href: '/docs', t: 'Docs', d: 'Every API and option, with the defaults it ships with.' },
  { href: '/examples', t: 'Examples', d: `${EXAMPLE_COUNT} real interfaces drawn on scroll, each with its code.` },
  { href: '/guides', t: 'Migration guides', d: `${GUIDES.length} guides off AOS, ScrollReveal, vivus and GSAP ScrollTrigger.` },
  { href: '/blog', t: 'Blog', d: 'How the native path works, performance, and patterns in under ten lines.' },
  { href: '/', t: 'Home', d: 'What the library is, measured.' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export default function NotFound() {
  return (
    <SiteShell kicker="404 / your turn">
      <div className="guide">
        <header className="pg-head">
          <p className="pg-kicker"><span>404</span><span>no page at this address</span></p>
          <h1 className="pg-title">Nothing is drawn here.</h1>
          <p className="pg-lede">
            The link may be old, or the address mistyped. These are where most links into the site lead.
          </p>
        </header>
        <section className="gd-index" aria-label="Where to go">
          <div className="ex-rel-list">
            {WAYS.map((w, i) => (
              <Link key={w.href} href={w.href} className="ex-rel-row">
                <span className="ex-rel-n">{pad(i + 1)}</span>
                <span>
                  <span className="ex-rel-t">{w.t}</span>
                  <span className="ex-rel-d">{w.d}</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">go →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
