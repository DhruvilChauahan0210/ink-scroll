import Link from 'next/link';
import { MobileMenu } from './MobileMenu';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { VERSUS, VERSUS_SLUGS } from '@/data/versus';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';

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

function Check() { return <span className="text-[#22c55e] font-bold text-base">✓</span>; }
function Cross() { return <span className="text-[#ef4444] font-bold text-base">✗</span>; }
function Partial() { return <span className="text-[#f59e0b] font-bold text-base">~</span>; }

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <Check />;
  if (val === false) return <Cross />;
  if (val === 'partial') return <Partial />;
  return <span className="text-[11px] font-mono font-bold text-pitch-black">{val}</span>;
}

export function VersusPage({ slug }: { slug: string }) {
  const v = VERSUS.find((x) => x.slug === slug);
  if (!v) return null;
  const them = COMPETITORS[v.competitorKey];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: v.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="bg-light-linen text-pitch-black min-h-screen">
        <Nav />

        <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">Comparison</p>
            <h1 className="font-display font-extrabold text-[clamp(32px,7vw,72px)] leading-[0.9] tracking-[-0.04em] mb-6">
              svg-scroll-draw
              <br />
              <span className="text-graphite-border">vs {them.label}.</span>
            </h1>
            <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-6">{v.intro}</p>
            <div className="rounded-xl border-2 border-creator-pink bg-creator-pink/5 p-5 mb-8 max-w-2xl">
              <p className="text-sm leading-relaxed">
                <strong className="text-pitch-black">Short version:</strong> {v.verdict}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-pitch-black text-light-linen rounded-full px-5 py-2.5 text-sm font-mono">
                <span className="opacity-50">$</span>
                <span>npm i svg-scroll-draw</span>
              </div>
              <Link href="/examples" className="px-5 py-2.5 rounded-full border border-pitch-black text-sm font-medium hover:bg-pitch-black hover:text-light-linen transition-colors">
                23 live examples →
              </Link>
            </div>
          </div>
        </header>

        {/* Size */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">01</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">Size.</h2>
            <div className="rounded-xl border border-subtle-ash bg-marketplace-gray/40 p-5 mb-8">
              <p className="text-[13px] text-graphite-border leading-relaxed">{v.sizeNote}</p>
            </div>
            <div className="space-y-4 mb-6">
              {[
                { label: `svg-scroll-draw ${SELF.version}`, kb: SELF.gzipKb, color: '#ff90e8', badge: 'yours' },
                { label: `${them.name} ${them.version}`, kb: them.gzipKb, color: '#d0d0d0', badge: them.gzipKb < SELF.gzipKb ? 'smaller' : null },
              ]
                .sort((a, b) => a.kb - b.kb)
                .map(({ label, kb, color, badge }) => {
                  const max = Math.max(SELF.gzipKb, them.gzipKb);
                  return (
                    <div key={label} className="flex items-center gap-4">
                      <div className="w-56 shrink-0 text-right">
                        <span className="text-[12px] font-mono text-graphite-border">{label}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="h-8 rounded-lg flex items-center px-3" style={{ width: `${(kb / max) * 100}%`, background: color, minWidth: 70 }}>
                          <span className="text-[11px] font-mono font-bold text-pitch-black whitespace-nowrap">{kb} KB</span>
                        </div>
                        {badge && (
                          <span className="text-[10px] font-mono text-graphite-border border border-subtle-ash px-2 py-0.5 rounded-full whitespace-nowrap">{badge}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="text-[12px] text-graphite-border font-mono">
              Minified + gzipped at level 9, measured {MEASURED_ON} against {them.name} {them.version} and svg-scroll-draw{' '}
              {SELF.version}. {them.name} is {them.license}.
            </p>
          </div>
        </section>

        {/* Matrix */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">02</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-10">Feature matrix.</h2>
            <div className="rounded-2xl border border-pitch-black overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] bg-[#111] text-light-linen">
                <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em]">Feature</div>
                <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-center whitespace-nowrap">svg-scroll-draw</div>
                <div className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-center whitespace-nowrap">{them.label}</div>
              </div>
              {v.rows.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-[1fr_auto_auto] items-center border-t border-subtle-ash ${i % 2 === 0 ? 'bg-white' : 'bg-light-linen'}`}>
                  <div className="px-5 py-3.5">
                    <span className="text-[13px] font-medium">{row.feature}</span>
                    {row.note && <p className="text-[11px] text-graphite-border mt-0.5 font-mono">{row.note}</p>}
                  </div>
                  <div className="px-5 py-3.5 text-center"><Cell val={row.us} /></div>
                  <div className="px-5 py-3.5 text-center"><Cell val={row.them} /></div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-graphite-border font-mono mt-4">
              ✓ supported · ✗ not supported · ~ partial or requires extra work. Checked against {them.name} {them.version}.
            </p>
          </div>
        </section>

        {/* Where they win — never optional */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">03</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">
              When {them.label} is the right call.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {v.theirWins.map((w) => (
                <div key={w.title} className="p-5 rounded-xl border border-subtle-ash bg-marketplace-gray/30">
                  <p className="font-semibold text-sm mb-1">{w.title}</p>
                  <p className="text-[13px] text-graphite-border leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">04</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">Questions.</h2>
            <div className="space-y-6">
              {v.faq.map((item) => (
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
            <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-6">Other comparisons</h2>
            <div className="flex flex-wrap gap-3">
              {[
                ...VERSUS_SLUGS.filter((s) => s !== v.slug).map((s) => ({
                  href: `/${s}`,
                  label: VERSUS.find((x) => x.slug === s)!.slug.replace('vs-', ''),
                })),
                { href: '/vs-gsap', label: 'gsap' },
                { href: '/vs-framer-motion', label: 'framer motion' },
                { href: '/vs-aos', label: 'aos / scrollreveal' },
                { href: '/lenis-scroll-animation', label: 'lenis (integration)' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="px-4 py-2 rounded-full border border-pitch-black bg-light-linen text-sm font-medium hover:shadow-[3px_3px_0px_#000] transition-shadow">
                  {l.label}
                </Link>
              ))}
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

export { SITE_URL };
