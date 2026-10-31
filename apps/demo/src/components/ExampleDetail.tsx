'use client';

import './examples.css';
import Link from 'next/link';
import { EXAMPLES } from './ExamplesPage';
import { CodeBox } from './site/CodeBox';
import { Plate } from './site/Plate';
import { CopyCommand } from './home/CopyCommand';
import { EXAMPLE_SEO } from '@/data/examples-seo';
import { SHOWCASE } from '@/showcase';
import { ShowcaseMedia, LiveButton } from '@/showcase/ShowcaseShot';

export function ExampleDetail({ slug }: { slug: string }) {
  const example = EXAMPLES.find((e) => e.id === slug);
  const seo = EXAMPLE_SEO[slug];
  if (!example || !seo) return null;

  const related = seo.related
    .map((id) => ({ seo: EXAMPLE_SEO[id], example: EXAMPLES.find((e) => e.id === id) }))
    .filter((r) => r.seo && r.example);

  const isDark = 'darkPreview' in example && !!example.darkPreview;
  const site = SHOWCASE[slug];
  const n = EXAMPLES.indexOf(example) + 1;
  const pad = (x: number) => String(x).padStart(2, '0');

  return (
    <div className="examples ex-detail">
      <header className="pg-head">
        {/* Breadcrumb — matches the BreadcrumbList JSON-LD on the server page */}
        <nav aria-label="Breadcrumb" className="pg-kicker ex-crumbs">
          <Link href="/">home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/examples">examples</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{seo.heading.toLowerCase()}</span>
        </nav>
        <h1 className="pg-title">{seo.heading}</h1>
        <p className="pg-lede">{seo.intro}</p>
        <div className="pg-actions">
          {site && (
            <Link href={`/showcase/${site.slug}`} className="btn btn-solid" data-magnetic>Open the live site ↗</Link>
          )}
          <CopyCommand />
          <Link href={`/examples#${slug}`} className="btn" data-magnetic>See it beside the others</Link>
        </div>
      </header>

      <div className="ex-list">
        <section className="ex-row" aria-labelledby="ex-code">
          <div className="ex-copy">
            <div className="tb">
              <span className="tb-n">{pad(n)}</span>
              <span className="tb-wrap">{example.tag}</span>
            </div>
            <h2 id="ex-code" className="ex-h2">The code</h2>
            <p className="ex-desc">{example.description}</p>
            <CodeBox file="Hero.tsx">{example.code}</CodeBox>
          </div>
          <div className="ex-plate">
            {site ? (
              <div className="sx-detail">
                <ShowcaseMedia site={site} priority />
                <div className="ex-card-head">
                  <div>
                    <p className="ex-card-k">{site.what}</p>
                    <p className="ex-card-t">{site.brand}</p>
                  </div>
                  <LiveButton site={site} />
                </div>
              </div>
            ) : <Plate n={n} dark={isDark}>{example.preview}</Plate>}
          </div>
        </section>
      </div>

      <section className="ex-rel" aria-labelledby="ex-rel">
        <h2 id="ex-rel" className="ex-rel-h">related examples</h2>
        {related.length > 0 && (
          <div className="ex-rel-list">
            {related.map(({ seo: r, example: ex }) => (
              <Link key={r!.slug} href={`/examples/${r!.slug}`} className="ex-rel-row">
                <span className="ex-rel-n">{pad(EXAMPLES.indexOf(ex!) + 1)}</span>
                <span>
                  <span className="ex-rel-t">{r!.heading}</span>
                  <span className="ex-rel-d">{r!.description}</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">open →</span>
              </Link>
            ))}
          </div>
        )}
        <p className="ex-rel-note">
          MIT licensed, zero runtime dependencies. Every API is a separate entry point, so you only
          ship what you import. <Link href="/docs" className="underline underline-offset-2">Full API reference →</Link>
        </p>
      </section>
    </div>
  );
}
