import Link from 'next/link';
import { MobileMenu } from './MobileMenu';
import { SELF } from '@/data/competitors';
import { GUIDES } from '@/data/guides';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
        svg-scroll-draw
      </Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Docs', 'Examples', 'Blocks', 'Guides', 'Blog'].map((l) => (
          <Link key={l} href={`/${l.toLowerCase()}`} className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">
            {l}
          </Link>
        ))}
      </div>
      <div className="flex lg:hidden"><MobileMenu /></div>
    </nav>
  );
}

/** Code card whose dark body fills the card, so a short sample never shows a white strip. */
function Code({ file, children }: { file?: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black flex flex-col min-w-0">
      {file && (
        <div className="bg-[#111] px-4 py-2.5">
          <span className="text-[11px] text-[#888] font-mono">{file}</span>
        </div>
      )}
      <pre className="flex-1 bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">{children}</pre>
    </div>
  );
}

export function GuidePage({ slug }: { slug: string }) {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: g.title,
      description: g.description,
      step: g.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ];
  const others = GUIDES.filter((x) => x.slug !== g.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="bg-light-linen text-pitch-black min-h-screen">
        <Nav />

        <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">
              Guide · {g.from} in {g.framework}
            </p>
            <h1 className="font-display font-extrabold text-[clamp(32px,6.5vw,64px)] leading-[0.95] tracking-[-0.04em] mb-6">{g.headline}</h1>
            <p className="text-base sm:text-lg text-graphite-border leading-relaxed mb-8">{g.intro}</p>
            <div className="flex flex-wrap gap-3">
              <a href={g.starter} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-full bg-creator-pink border border-pitch-black text-sm font-semibold hover:opacity-90 transition-opacity">
                Try it on StackBlitz →
              </a>
              <Link href={g.compare.href} className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">
                {g.compare.label}
              </Link>
            </div>
          </div>
        </header>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-5">What goes wrong with the usual setup</h2>
            <ul className="space-y-3">
              {g.problems.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-graphite-border">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pitch-black" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12">
          <div className="max-w-3xl mx-auto space-y-12">
            {g.steps.map((s, i) => (
              <div key={s.title}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">Step {i + 1}</p>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-3">{s.title}</h2>
                <p className="text-[15px] text-graphite-border leading-relaxed mb-5">{s.body}</p>
                {s.code && <Code file={s.file}>{s.code}</Code>}
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-5">What stays exactly the same</h2>
            <ul className="space-y-3">
              {g.unchanged.map((u) => (
                <li key={u} className="flex gap-3 text-[15px] leading-relaxed text-graphite-border">
                  <span aria-hidden className="text-[#22c55e] font-bold">✓</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-8">Questions</h2>
            <div className="space-y-6">
              {g.faq.map((item) => (
                <div key={item.q}>
                  <h3 className="font-display font-extrabold text-lg tracking-[-0.02em] mb-2">{item.q}</h3>
                  <p className="text-graphite-border leading-relaxed text-[15px]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 md:px-12 py-12 bg-marketplace-gray border-b border-pitch-black">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-6">More migration guides</h2>
            <div className="flex flex-wrap gap-3">
              {others.map((o) => (
                <Link key={o.slug} href={`/guides/${o.slug}`} className="px-4 py-2 rounded-full border border-pitch-black bg-light-linen text-sm font-medium hover:shadow-[3px_3px_0px_#000] transition-shadow">
                  {o.from} in {o.framework}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <footer className="px-6 md:px-12 py-6 text-center text-[11px] font-mono text-graphite-border">
          svg-scroll-draw · MIT · {SELF.gzipKb} KB gzipped ·{' '}
          <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
            GitHub
          </a>
        </footer>
      </div>
    </>
  );
}
