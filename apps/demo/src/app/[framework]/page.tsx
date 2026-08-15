import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';
import { FRAMEWORK_LANDINGS, FRAMEWORK_SLUGS } from '@/data/framework-landings';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';

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
    title: f.title,
    description: f.description,
    keywords: f.keywords,
    alternates: { canonical: `/${f.slug}` },
    openGraph: { type: 'article', title: f.title, description: f.description, url },
    twitter: { card: 'summary_large_image', title: f.title, description: f.description },
  };
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
        svg-scroll-draw
      </Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Docs', 'Examples', 'Blog', 'Changelog'].map((l) => (
          <Link key={l} href={`/${l.toLowerCase()}`} className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            {l}
          </Link>
        ))}
        <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
          ⚡ Playground
        </Link>
      </div>
      <div className="flex lg:hidden"><MobileMenu /></div>
    </nav>
  );
}

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-4">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="bg-light-linen text-pitch-black min-h-screen">
        <Nav />

        <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span
                className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full text-pitch-black border"
                style={{ background: `${f.accent}22`, borderColor: `${f.accent}66` }}
              >
                {f.name}
              </span>
              <span className="text-[10px] font-mono text-graphite-border">{f.worksWith}</span>
            </div>
            <h1 className="font-display font-extrabold text-[clamp(32px,7vw,76px)] leading-[0.9] tracking-[-0.04em] mb-6">
              {f.name} scroll animations.
              <br />
              <span className="text-graphite-border">{f.headline}</span>
            </h1>
            <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-8">
              {f.intro}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 py-2.5 text-sm font-mono">
                <span className="opacity-50">$</span>
                <span>npm i svg-scroll-draw</span>
              </div>
              <Link href="/docs" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">
                API reference →
              </Link>
              <Link href="/examples" className="px-5 py-2.5 rounded-full border border-subtle-ash text-sm font-medium hover:border-pitch-black transition-colors text-graphite-border">
                23 live examples →
              </Link>
            </div>
          </div>
        </header>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">
              {f.primitive}
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">Quick start.</h2>
            <div className="rounded-xl border border-subtle-ash bg-marketplace-gray/40 p-4 mb-8">
              <p className="text-[13px] text-graphite-border leading-relaxed">
                <code className="font-mono text-[0.9em] bg-white px-1.5 py-0.5 rounded border border-subtle-ash">
                  {f.entry}
                </code>{' '}
                — every sample below is written against the wrappers this package actually exports.
              </p>
            </div>

            {f.samples.map((s) => (
              <div key={s.heading}>
                <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-3 mt-10">{s.heading}</h3>
                <CodeBlock file={s.file}>{s.code}</CodeBlock>
              </div>
            ))}

            <div className="mt-8 border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl">
              <p className="text-sm leading-relaxed text-graphite-border">
                <strong className="text-pitch-black">Worth knowing:</strong> {f.note}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">Size.</h2>
            <p className="text-graphite-border leading-relaxed mb-6 max-w-2xl">
              {SELF.gzipKb} KB gzipped for every API at once, and each one is a separate entry point — so a page that
              only reveals elements ships 3.9 KB, not the lot. The equivalent GSAP stack for the same work is{' '}
              {COMPETITORS.gsapStack.gzipKb} KB, which makes this {ratio}× smaller. GSAP is free and considerably
              broader; if you need timelines, Draggable or Flip, use GSAP.
            </p>
            <p className="text-[12px] text-graphite-border font-mono">
              Measured {MEASURED_ON} at gzip level 9 against gsap {COMPETITORS.gsapStack.version} and svg-scroll-draw{' '}
              {SELF.version}.{' '}
              <Link href="/vs-gsap" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
                Full comparison →
              </Link>
            </p>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">
              {f.name} questions.
            </h2>
            <div className="space-y-6">
              {f.faq.map((item) => (
                <div key={item.q}>
                  <h3 className="font-display font-extrabold text-lg tracking-[-0.02em] mb-2">{item.q}</h3>
                  <p className="text-graphite-border leading-relaxed text-[15px]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 md:px-12 py-12 bg-marketplace-gray border-b border-pitch-black">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-6">Other frameworks</h2>
            <div className="flex flex-wrap gap-3">
              {FRAMEWORK_LANDINGS.filter((o) => o.slug !== f.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/${o.slug}`}
                  className="px-4 py-2 rounded-full border border-pitch-black bg-light-linen text-sm font-medium hover:shadow-[3px_3px_0px_#000] transition-shadow"
                >
                  {o.name}
                </Link>
              ))}
              <Link href="/react-scroll-animation" className="px-4 py-2 rounded-full border border-pitch-black bg-light-linen text-sm font-medium hover:shadow-[3px_3px_0px_#000] transition-shadow">
                React
              </Link>
              <Link href="/nextjs-scroll-animation" className="px-4 py-2 rounded-full border border-pitch-black bg-light-linen text-sm font-medium hover:shadow-[3px_3px_0px_#000] transition-shadow">
                Next.js
              </Link>
            </div>
          </div>
        </section>

        <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
          svg-scroll-draw · MIT · {SELF.gzipKb} KB gzipped ·{' '}
          <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
            GitHub
          </a>
        </footer>
      </div>
    </>
  );
}
