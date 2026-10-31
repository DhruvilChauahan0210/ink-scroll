import type { Metadata } from 'next';
import '@/components/guides.css';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { GUIDES } from '@/data/guides';
import { COMPETITORS, SELF_ENTRIES } from '@/data/competitors';
import { SiteShell } from '@/components/site/SiteShell';

export const metadata: Metadata = {
  title: seoTitle('Migration Guides: AOS, ScrollReveal and vivus in React'),
  description:
    'Step-by-step guides for moving AOS, ScrollReveal and vivus projects in React and Next.js onto maintained, MIT drop-ins — one command, same markup.',
  alternates: { canonical: '/guides' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const DROP_INS = ['aos', 'scrollreveal', 'vivus'];

export default function GuidesIndex() {
  return (
    <SiteShell active="/guides" kicker="guides / your turn">
      <div className="guide">
        <header className="pg-head">
          <p className="pg-kicker"><span>guides / {GUIDES.length} migrations</span><span>react · next.js</span></p>
          <h1 className="pg-title">Migration guides</h1>
          <p className="pg-lede">
            Already on AOS, ScrollReveal or vivus? Each guide moves one of them onto its drop-in in React or
            Next.js — the same API and markup, maintained, MIT, with hooks that clean up after themselves.
          </p>
          <dl className="pg-facts">
            {DROP_INS.map((k) => (
              <div key={k}>
                <dt>{COMPETITORS[k].label}</dt>
                <dd>{COMPETITORS[k].gzipKb.toFixed(1)} → {SELF_ENTRIES[k].toFixed(1)} KB</dd>
              </div>
            ))}
            <div><dt>Migrate</dt><dd>1 command</dd></div>
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
