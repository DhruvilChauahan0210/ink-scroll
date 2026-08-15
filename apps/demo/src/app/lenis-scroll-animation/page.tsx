import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';
const lenis = COMPETITORS.lenis;

export const metadata: Metadata = {
  title: 'Lenis + Scroll Animation — Smooth Scroll and Draw Together',
  description:
    'Use Lenis smooth scrolling with scroll-driven SVG animation. Lenis v2 needs no adapter; v1 has one at svg-scroll-draw/lenis. Working setup for both.',
  keywords: [
    'lenis scroll animation',
    'lenis smooth scroll animation',
    'lenis svg animation',
    'lenis scroll trigger',
    'smooth scroll with animation',
    'lenis gsap alternative',
    'studio freight lenis animation',
    'lenis scrolly integration',
  ],
  alternates: { canonical: '/lenis-scroll-animation' },
  openGraph: {
    type: 'article',
    title: 'Lenis + svg-scroll-draw — Smooth Scroll and Animation Together',
    description: 'Lenis smooths the scroll, svg-scroll-draw animates against it. Setup for Lenis v1 and v2.',
    url: `${SITE_URL}/lenis-scroll-animation`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lenis + svg-scroll-draw',
    description: 'Smooth scroll and scroll-driven animation, together. No adapter needed on Lenis v2.',
  },
};

const faq = [
  {
    q: 'Does svg-scroll-draw work with Lenis?',
    a: 'Yes. On Lenis v2 and later no adapter is needed at all — Lenis patches window.scrollY natively, so the animation engines read the correct value. On Lenis v1, which keeps scroll in a virtual value, import createLenisAdapter from svg-scroll-draw/lenis and pass it your Lenis instance.',
  },
  {
    q: 'Is Lenis an alternative to svg-scroll-draw?',
    a: 'No — they do different jobs and are designed to be used together. Lenis eases the scroll itself; svg-scroll-draw animates elements against scroll position. Neither replaces the other, which is why there is no versus page for Lenis on this site.',
  },
  {
    q: 'Why does Lenis v1 need an adapter?',
    a: 'Lenis v1 hijacks scrolling and stores the position in its own virtual value without updating window.scrollY, so anything reading native scroll position sees a stale number. The adapter patches window.scrollY and window.pageYOffset to report Lenis’s value, then restores them on destroy.',
  },
  {
    q: 'Does smooth scrolling hurt scroll animation performance?',
    a: 'It changes how it runs. With Lenis driving the frame loop, animation updates happen inside Lenis’s rAF tick. The native CSS fast path is bypassed for elements affected by a virtual scroll value, since a CSS view-timeline reads real scroll position — so expect the JS engine to handle those.',
  },
];

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      headline: 'Lenis + svg-scroll-draw — smooth scroll and scroll-driven animation together',
      description:
        'How to combine Lenis smooth scrolling with scroll-driven SVG animation, for both Lenis v1 and v2.',
      url: `${SITE_URL}/lenis-scroll-animation`,
      datePublished: '2026-08-15',
      dateModified: '2026-08-15',
      author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
      publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/lenis-scroll-animation` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

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

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLdData) }} />
      <div className="bg-light-linen text-pitch-black min-h-screen">
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

        <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-mono font-medium">Integration</p>
            <h1 className="font-display font-extrabold text-[clamp(32px,7vw,72px)] leading-[0.9] tracking-[-0.04em] mb-6">
              Lenis + svg-scroll-draw.
              <br />
              <span className="text-graphite-border">Not a competition.</span>
            </h1>
            <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl mb-6">
              Lenis is the smooth-scroll library everyone reaches for, and it comes up constantly as an
              &ldquo;alternative&rdquo; to scroll animation libraries. It is not one. Lenis eases the scroll itself;
              this library animates things against scroll position. They are complementary, we ship an adapter for it,
              and that is why there is no <code className="font-mono text-[0.85em] bg-marketplace-gray px-1.5 py-0.5 rounded">/vs-lenis</code> page here.
            </p>
            <div className="rounded-xl border-2 border-creator-pink bg-creator-pink/5 p-5 max-w-2xl">
              <p className="text-sm leading-relaxed">
                <strong className="text-pitch-black">Short version:</strong> on Lenis v2+ it just works, no adapter.
                On Lenis v1 you need three extra lines.
              </p>
            </div>
          </div>
        </header>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">01</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">Lenis v2 and later.</h2>
            <p className="text-graphite-border leading-relaxed mb-2 max-w-2xl">
              Nothing special required. Lenis v2 patches <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">window.scrollY</code>{' '}
              itself, so every engine here reads the correct position with no adapter and no configuration.
            </p>
            <CodeBlock file="main.js">{`import Lenis from 'lenis';
import { scrollDraw } from 'svg-scroll-draw';

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// No adapter — window.scrollY is already correct.
scrollDraw('#hero-svg', { easing: 'ease-out', speed: 1.2 });`}</CodeBlock>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">02</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">Lenis v1.</h2>
            <p className="text-graphite-border leading-relaxed mb-2 max-w-2xl">
              v1 keeps scroll position in a virtual value and never updates{' '}
              <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">window.scrollY</code>, so
              anything reading native scroll sees a stale number and your animations appear frozen. The adapter patches
              it and restores it on destroy.
            </p>
            <CodeBlock file="main.js">{`import Lenis from '@studio-freight/lenis';
import { createLenisAdapter } from 'svg-scroll-draw/lenis';
import { scrollDraw } from 'svg-scroll-draw';

const lenis = new Lenis();
const adapter = createLenisAdapter(lenis);

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

scrollDraw('#hero-svg', { easing: 'ease-out', speed: 1.2 });

// On teardown — restores native window.scrollY:
// adapter.destroy();`}</CodeBlock>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">03</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-6">The one trade-off.</h2>
            <p className="text-graphite-border leading-relaxed max-w-2xl mb-4">
              Worth knowing before you commit: the native CSS fast path does not survive a virtual scroll value. A CSS{' '}
              <code className="font-mono text-[0.9em] bg-marketplace-gray px-1.5 py-0.5 rounded">view-timeline</code> reads
              real scroll position, so when Lenis v1 is driving, affected animations fall back to the JavaScript engine.
              That is still the path most browsers take today, and the fallback is automatic — but you do lose the
              zero-per-frame-JS optimisation on those elements.
            </p>
            <p className="text-[12px] text-graphite-border font-mono">
              Lenis {lenis.version} is {lenis.gzipKb} KB gzipped, {lenis.license}, last published {lenis.lastPublish}.
              svg-scroll-draw {SELF.version} is {SELF.gzipKb} KB. Measured {MEASURED_ON} at gzip level 9.
            </p>
          </div>
        </section>

        <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">04</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] mb-8">Questions.</h2>
            <div className="space-y-6">
              {faq.map((item) => (
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
            <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em] mb-6">Comparisons</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { href: '/vs-gsap', label: 'gsap' },
                { href: '/vs-motion', label: 'motion' },
                { href: '/vs-scrollmagic', label: 'scrollmagic' },
                { href: '/vs-locomotive-scroll', label: 'locomotive scroll' },
                { href: '/vs-framer-motion', label: 'framer motion' },
                { href: '/vs-aos', label: 'aos / scrollreveal' },
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
