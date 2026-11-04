import type { Metadata } from 'next';
import '@/components/guides.css';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { GUIDES } from '@/data/guides';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: seoTitle('Migration Guides: GSAP, AOS, ScrollReveal and vivus'),
  description:
    'Move AOS, ScrollReveal and vivus projects in React and Next.js onto MIT drop-ins in one command, or map GSAP ScrollTrigger code to svg-scroll-draw call by call.',
  alternates: { canonical: '/guides' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const DROP_INS = ['aos', 'scrollreveal', 'vivus'];

/** The guides as a list, for search engines. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Migration guides',
  url: `${SITE_URL}/guides`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: GUIDES.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.title,
      url: `${SITE_URL}/guides/${g.slug}`,
    })),
  },
};

export default function GuidesIndex() {
  return (
    <SiteShell active="/guides" crumbs={[['Guides', '/guides']]} kicker="guides / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="guide">
        <header className="pg-head">
          <p className="pg-kicker"><span>guides / {GUIDES.length} migrations</span><span>react · next.js</span></p>
          <h1 className="pg-title">Migration guides</h1>
          <p className="pg-lede">
            Already on AOS, ScrollReveal or vivus? Each of those guides moves one onto its drop-in in React or
            Next.js — the same API and markup, maintained, MIT, with hooks that clean up after themselves.
            Coming from GSAP ScrollTrigger? That guide maps each call to its svg-scroll-draw equivalent, and
            says plainly what has none.
          </p>
          <dl className="pg-facts">
            <div>
              <dt>GSAP stack</dt>
              <dd>{COMPETITORS.gsapStack.gzipKb.toFixed(1)} → {SELF.gzipKb.toFixed(1)} KB</dd>
            </div>
            {DROP_INS.map((k) => (
              <div key={k}>
                <dt>{COMPETITORS[k].label}</dt>
                <dd>{COMPETITORS[k].gzipKb.toFixed(1)} → {SELF_ENTRIES[k].toFixed(1)} KB</dd>
              </div>
            ))}
          </dl>
        </header>
        <section className="gd-index" aria-label="Guides">
          <div className="ex-rel-list">
            {GUIDES.map((g, i) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="ex-rel-row">
                <span className="ex-rel-n">{pad(i + 1)}</span>
                <span>
                  <span className="ex-rel-t">{g.title}</span>
                  <span className="ex-rel-d">{g.from} · {g.framework} — {g.description}</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">read →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
