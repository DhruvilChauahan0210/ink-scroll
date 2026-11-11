import type { Metadata } from 'next';
import '@/components/guides.css';
import Link from 'next/link';
import { seoTitle } from '../_lib/seo';
import { SELF } from '@/data/competitors';
import { TOOL_GROUPS, TOOLS } from '@/data/tools';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';

const TITLE = 'Free Scroll Animation Tools: Generators, SVG and Easing';
const DESCRIPTION = `${TOOLS.length} free tools for scroll animation: text, counter, reveal, parallax and progress bar generators, SVG path tools, easing and trigger visualizers.`;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll animation tools', 'scroll animation generator', 'svg animation tools', 'css animation generator',
    'easing visualizer', 'free animation tools',
  ],
  alternates: { canonical: '/tools' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/tools` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Each tool's number across all groups, 01 to the last. */
const NUMBER = new Map(TOOLS.map((t, i) => [t.slug, i + 1]));

/** The tools as a list, for search engines. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Scroll animation tools',
  url: `${SITE_URL}/tools`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/${t.slug}`,
    })),
  },
};

export default function ToolsIndex() {
  return (
    <SiteShell active="/tools" crumbs={[['Tools', '/tools']]} kicker="tools / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="guide">
        <header className="pg-head">
          <p className="pg-kicker"><span>tools / {TOOLS.length} free</span><span>run in your browser</span></p>
          <h1 className="pg-title">Scroll animation tools</h1>
          <p className="pg-lede">
            Generators that write the code for you, SVG tools that get a drawing ready to animate, and visualizers that
            show what an easing or a trigger actually does. Everything runs in your browser; nothing is uploaded. The
            code they write uses svg-scroll-draw {SELF.version}, MIT, {SELF.gzipKb} KB.
          </p>
          <dl className="pg-facts">
            {TOOL_GROUPS.map((g) => (
              <div key={g.key}><dt>{g.title}</dt><dd>{g.tools.length}</dd></div>
            ))}
            <div><dt>Uploads</dt><dd>0</dd></div>
          </dl>
        </header>
        {TOOL_GROUPS.map((g) => (
          <section key={g.key} className="gd-index" aria-labelledby={`tools-${g.key}`}>
            <p className="pg-kicker" id={`tools-${g.key}`}><span>{g.title}</span><span>{g.note}</span></p>
            <div className="ex-rel-list">
              {g.tools.map((t) => (
                <Link key={t.slug} href={`/${t.slug}`} className="ex-rel-row">
                  <span className="ex-rel-n">{pad(NUMBER.get(t.slug) ?? 0)}</span>
                  <span>
                    <span className="ex-rel-t">{t.name}</span>
                    <span className="ex-rel-d">{t.blurb}</span>
                  </span>
                  <span className="ex-rel-go" aria-hidden="true">Open →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
