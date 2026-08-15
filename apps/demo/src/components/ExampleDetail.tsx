'use client';

import Link from 'next/link';
import { EXAMPLES } from './ExamplesPage';
import { CopyButton } from './CopyButton';
import { MobileMenu } from './MobileMenu';
import { EXAMPLE_SEO } from '@/data/examples-seo';

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{filename}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[11px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

export function ExampleDetail({ slug }: { slug: string }) {
  const example = EXAMPLES.find((e) => e.id === slug);
  const seo = EXAMPLE_SEO[slug];
  if (!example || !seo) return null;

  const related = seo.related
    .map((id) => ({ seo: EXAMPLE_SEO[id], example: EXAMPLES.find((e) => e.id === id) }))
    .filter((r) => r.seo && r.example);

  const isDark = 'darkPreview' in example && example.darkPreview;

  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          {['Docs', 'Examples', 'Blog', 'Changelog'].map((l) => (
            <Link
              key={l}
              href={`/${l.toLowerCase()}`}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors font-medium ${
                l === 'Examples'
                  ? 'border-pitch-black bg-pitch-black text-light-linen'
                  : 'border-subtle-ash hover:border-pitch-black'
              }`}
            >
              {l}
            </Link>
          ))}
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            ⚡ Playground
          </Link>
        </div>
        <div className="flex lg:hidden"><MobileMenu /></div>
      </nav>

      {/* Breadcrumb — matches the BreadcrumbList JSON-LD on the server page */}
      <div className="px-4 sm:px-6 md:px-12 pt-6">
        <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto text-[12px] font-mono text-graphite-border">
          <Link href="/" className="hover:text-pitch-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/examples" className="hover:text-pitch-black transition-colors">Examples</Link>
          <span className="mx-2">/</span>
          <span className="text-pitch-black">{seo.heading}</span>
        </nav>
      </div>

      <header className="px-4 sm:px-6 md:px-12 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <code className="text-[10px] sm:text-[11px] font-mono bg-sunshine-yellow/30 text-pitch-black px-2 py-0.5 rounded-full border border-sunshine-yellow/50">
            {example.tag}
          </code>
          <h1 className="font-display font-extrabold text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.04em] mt-4 mb-5">
            {seo.heading}
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            {seo.intro}
          </p>
        </div>
      </header>

      <section className="px-4 sm:px-6 md:px-12 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">The code</h2>
            <p className="text-graphite-border leading-relaxed mb-5 text-[14px] sm:text-[15px]">
              {example.description}
            </p>
            <div className="max-w-full overflow-hidden">
              <CodeBlock filename="Hero.tsx">{example.code}</CodeBlock>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl tracking-[-0.02em] mb-4">Live — scroll it</h2>
            <div
              className={`flex items-center justify-center rounded-2xl border border-pitch-black shadow-[4px_4px_0px_#000] min-h-[240px] overflow-hidden ${
                isDark ? 'bg-[#1e1f22] p-0' : 'bg-white p-4 sm:p-8'
              }`}
            >
              {example.preview}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-pitch-black px-4 sm:px-6 md:px-12 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-5">Install</h2>
          <div className="max-w-md">
            <CodeBlock filename="terminal">{`npm i svg-scroll-draw`}</CodeBlock>
          </div>
          <p className="text-[13px] text-graphite-border mt-4">
            MIT licensed, zero runtime dependencies. Every API is a separate entry point, so you
            only ship what you import.{' '}
            <Link href="/docs" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
              Full API reference →
            </Link>
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-pitch-black px-4 sm:px-6 md:px-12 py-10 sm:py-12 bg-marketplace-gray">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-6">Related examples</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(({ seo: r }) => (
                <Link
                  key={r!.slug}
                  href={`/examples/${r!.slug}`}
                  className="block p-5 rounded-xl border border-pitch-black bg-light-linen hover:shadow-[3px_3px_0px_#000] transition-shadow"
                >
                  <p className="font-display font-extrabold text-lg mb-1">{r!.heading}</p>
                  <p className="text-[13px] text-graphite-border">{r!.description}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/examples"
              className="inline-block mt-6 text-sm font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              ← All examples
            </Link>
          </div>
        </section>
      )}

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
