import type { Metadata } from 'next';
import '@/components/compare/compare.css';
import '@/components/framework.css';
import { seoTitle } from '../_lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FRAMEWORK_LANDINGS, FRAMEWORK_SLUGS } from '@/data/framework-landings';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON } from '@/data/competitors';
import { EXAMPLE_COUNT } from '@/data/examples-index';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { SizeScale } from '@/components/compare/SizeScale';
import { ImportMap, type ImportRow } from '@/components/compare/ImportMap';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';
const pad = (n: number) => String(n).padStart(2, '0');

export function generateStaticParams() {
  return FRAMEWORK_SLUGS.map((framework) => ({ framework }));
}

export const dynamicParams = false;

function find(slug: string) {
  return FRAMEWORK_LANDINGS.find((f) => f.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ framework: string }>;
}): Promise<Metadata> {
  const { framework } = await params;
  const f = find(framework);
  if (!f) return {};
  const url = `${SITE_URL}/${f.slug}`;
  return {
    title: seoTitle(f.title),
    description: f.description,
    keywords: f.keywords,
    alternates: { canonical: `/${f.slug}` },
    openGraph: { type: 'article', title: f.title, description: f.description, url },
    twitter: { card: 'summary_large_image', title: f.title, description: f.description },
  };
}

/**
 * What a sample takes from the package, read from its own code: the named
 * imports from any svg-scroll-draw entry, or — for a sample with no import —
 * the data-scroll-* attributes it sets (Astro) or the Scroll* components it
 * uses through a global plugin (Nuxt).
 */
function usedApis(code: string): string[] {
  const names = new Set<string>();
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]svg-scroll-draw[^'"]*['"]/g)) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => names.add(n));
  }
  if (names.size === 0) {
    for (const m of code.matchAll(/\b(data-scroll-[a-z-]+?)(?=[\s>=])/g)) {
      if (!m[1].endsWith('-options')) names.add(m[1]);
    }
    for (const m of code.matchAll(/<(Scroll[A-Z]\w*)/g)) names.add(`<${m[1]}>`);
  }
  return [...names];
}

export default async function Page({ params }: { params: Promise<{ framework: string }> }) {
  const { framework } = await params;
  const f = find(framework);
  if (!f) notFound();

  const url = `${SITE_URL}/${f.slug}`;
  const ratio = Math.round((COMPETITORS.gsapStack.gzipKb / SELF.gzipKb) * 100) / 100;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: f.title,
        description: f.description,
        url,
        datePublished: '2026-08-15',
        dateModified: '2026-08-15',
        author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
        publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@type': 'FAQPage',
        mainEntity: f.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  const rows: ImportRow[] = f.samples.map((s, i) => ({
    n: pad(i + 1),
    file: s.file,
    heading: s.heading,
    href: `#fw-s${i + 1}`,
    names: usedApis(s.code),
  }));

  // Its own related pages first, then the rest, then the two with their own routes.
  const order = [...f.related, ...FRAMEWORK_SLUGS.filter((s) => !f.related.includes(s))];
  const others = [
    ...order
      .filter((s) => s !== f.slug)
      .map((s) => FRAMEWORK_LANDINGS.find((o) => o.slug === s)!)
      .filter(Boolean)
      .map((o) => ({ href: `/${o.slug}`, t: o.name, d: `${o.worksWith} — ${o.primitive.toLowerCase()} from ${o.entry}`, swatch: o.accent })),
    { href: '/react-scroll-animation', t: 'React', d: 'Components and hooks from svg-scroll-draw/react', swatch: '#61dafb' },
    { href: '/nextjs-scroll-animation', t: 'Next.js', d: 'The React wrappers in the App Router', swatch: 'currentColor' },
  ];

  const toc: [string, string][] = [
    ['fw-start', `Quick start · ${f.samples.length}`],
    ['fw-size', 'Size'],
    ['fw-faq', `Questions · ${f.faq.length}`],
    ['fw-more', 'Other frameworks'],
  ];
  const short = f.name.toLowerCase();

  return (
    <SiteShell active={`/${f.slug}`} kicker={`${short} / your turn`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="cmp fw" style={{ '--fw': f.accent } as React.CSSProperties}>

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head cmp-head">
          <div>
            <p className="pg-kicker">
              <span>framework / <b>{short}</b></span>
              <span>{f.worksWith}</span>
            </p>
            <h1 className="pg-title cmp-title fw-title">
              {f.name} scroll animations. <span className="dim">{f.headline}</span>
            </h1>
            <p className="pg-lede">{f.intro}</p>
            <div className="pg-actions">
              <CopyCommand />
              <Link href="/docs" className="btn" data-magnetic>API reference →</Link>
              <Link href="/examples" className="btn" data-magnetic>{EXAMPLE_COUNT} live examples →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Every API</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>Reveal only</dt><dd>{SELF_ENTRIES.reveal} KB</dd></div>
              <div><dt>GSAP stack</dt><dd>{COMPETITORS.gsapStack.gzipKb} KB</dd></div>
              <div><dt>Version</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <aside aria-label={`What the samples use from ${f.entry}`}>
            <ImportMap entry={f.entry} swatch={f.accent} name={f.name} rows={rows} />
          </aside>
        </header>

        <div className="cmp-body">
          <nav className="cmp-toc" aria-label="On this page">
            <p className="cmp-toc-h">on this page</p>
            {toc.map(([id, label], i) => (
              <a key={id} href={`#${id}`} className="cmp-toc-a"><span>{pad(i + 1)}</span>{label}</a>
            ))}
            <p className="cmp-toc-h fw-toc-h">samples</p>
            {f.samples.map((s, i) => (
              <a key={s.file} href={`#fw-s${i + 1}`} className="cmp-toc-a"><span>{pad(i + 1)}</span>{s.file}</a>
            ))}
          </nav>
          <div className="cmp-main">

            {/* ── 01 Quick start ─────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="fw-start">
              <div className="tb"><span className="tb-n">01</span><span>{f.primitive}</span></div>
              <h2 id="fw-start" className="cmp-h2">Quick start</h2>
              <p className="cmp-p">
                Import from <code className="fw-code">{f.entry}</code> — every sample below is written against the
                wrappers this package actually exports.
              </p>

              <ol className="fw-samples">
                {f.samples.map((s, i) => (
                  <li key={s.heading} id={`fw-s${i + 1}`} className="fw-sample">
                    <p className="fw-sample-k"><span>sample {pad(i + 1)}</span><span>{s.file}</span></p>
                    <h3 className="fw-h3">{s.heading}</h3>
                    <CodeBox file={s.file}>{s.code}</CodeBox>
                  </li>
                ))}
              </ol>

              <div className="cmp-note">
                <div className="tb"><span className="tb-n">!</span><span>worth knowing</span></div>
                <p className="cmp-note-body">{f.note}</p>
              </div>
            </section>

            {/* ── 02 Size ────────────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="fw-size">
              <div className="tb"><span className="tb-n">02</span><span>size</span></div>
              <h2 id="fw-size" className="cmp-h2">Size</h2>
              <p className="cmp-p">
                {SELF.gzipKb} KB gzipped for every API at once, and each one is a separate entry point — so a page that
                only reveals elements ships {SELF_ENTRIES.reveal} KB, not the lot. The equivalent GSAP stack for the same
                work is {COMPETITORS.gsapStack.gzipKb} KB, which makes this {ratio}× smaller. GSAP is free and considerably
                broader; if you need timelines, Draggable or Flip, use GSAP.
              </p>
              <div className="fw-fig">
                <SizeScale
                  n={2}
                  caption="the same work, to one scale"
                  bars={[
                    { label: `svg-scroll-draw ${SELF.version}`, sub: 'every API, main entry', kb: SELF.gzipKb, ours: true },
                    { label: 'scrollReveal', sub: 'its own entry point, for a reveal-only page', kb: SELF_ENTRIES.reveal, ours: true },
                    { label: `gsap ${COMPETITORS.gsapStack.version}`, sub: COMPETITORS.gsapStack.label, kb: COMPETITORS.gsapStack.gzipKb },
                  ]}
                />
              </div>
              <p className="cmp-small">
                Measured {MEASURED_ON} at gzip level 9 against gsap {COMPETITORS.gsapStack.version} and svg-scroll-draw{' '}
                {SELF.version}.{' '}
                <Link href="/vs-gsap">Full comparison →</Link>
              </p>
            </section>

            {/* ── 03 Questions ───────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="fw-faq">
              <div className="tb"><span className="tb-n">03</span><span>questions</span></div>
              <h2 id="fw-faq" className="cmp-h2">{f.name} questions</h2>
              <div className="cmp-faq">
                {f.faq.map((item, i) => (
                  <div key={item.q} className="cmp-q">
                    <span className="cmp-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="cmp-q-t">{item.q}</h3>
                      <p className="cmp-p">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 04 Other frameworks ────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="fw-more">
              <div className="tb"><span className="tb-n">04</span><span>other frameworks</span></div>
              <h2 id="fw-more" className="cmp-h2">Other frameworks</h2>
              <div className="ex-rel-list">
                {others.map((o, i) => (
                  <Link key={o.href} href={o.href} className="ex-rel-row">
                    <span className="ex-rel-n">{pad(i + 1)}</span>
                    <span>
                      <span className="ex-rel-t"><i className="fw-sw" style={{ background: o.swatch }} aria-hidden="true" />{o.t}</span>
                      <span className="ex-rel-d">{o.d}</span>
                    </span>
                    <span className="ex-rel-go" aria-hidden="true">open →</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
