import type { Metadata } from 'next';
import { seoTitle } from '../_lib/seo';
import '@/components/stack/stack.css';
import Link from 'next/link';
import { COMPETITORS, SELF, MEASURED_ON } from '@/data/competitors';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { ScrollChain } from '@/components/stack/ScrollChain';
import { SizeBars } from '@/components/stack/SizeBars';
import { C, Sec, Toc, pad } from '@/components/stack/parts';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';
const lenis = COMPETITORS.lenis;

export const metadata: Metadata = {
  title: seoTitle('Lenis Scroll Animation — Add Animations to Smooth Scroll'),
  description:
    'Add scroll animations to Lenis smooth scrolling. Lenis v2 needs no adapter; v1 uses svg-scroll-draw/lenis. Working setup for both, plus the one trade-off.',
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
    title: 'Lenis Scroll Animation — Add Animations to Smooth Scroll',
    description: 'Add scroll animations to Lenis smooth scrolling. Lenis v2 needs no adapter; v1 uses svg-scroll-draw/lenis. Working setup for both, plus the one trade-off.',
    url: `${SITE_URL}/lenis-scroll-animation`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lenis Scroll Animation — Add Animations to Smooth Scroll',
    description: 'Add scroll animations to Lenis smooth scrolling. Lenis v2 needs no adapter; v1 uses svg-scroll-draw/lenis. Working setup for both, plus the one trade-off.',
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

const V2_SETUP = `import Lenis from 'lenis';
import { scrollDraw } from 'svg-scroll-draw';

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// No adapter — window.scrollY is already correct.
scrollDraw('#hero-svg', { easing: 'ease-out', speed: 1.2 });`;

const V1_SETUP = `import Lenis from '@studio-freight/lenis';
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
// adapter.destroy();`;

const COMPARISONS = [
  { href: '/vs-gsap', label: 'gsap' },
  { href: '/vs-motion', label: 'motion' },
  { href: '/vs-scrollmagic', label: 'scrollmagic' },
  { href: '/vs-locomotive-scroll', label: 'locomotive scroll' },
  { href: '/vs-framer-motion', label: 'framer motion' },
  { href: '/vs-aos', label: 'aos / scrollreveal' },
];

/** Both libraries on one page, to one decimal. */
const TOGETHER_KB = Math.round((lenis.gzipKb + SELF.gzipKb) * 10) / 10;

const TOC = [
  { id: 'lenis-v2', label: 'Lenis v2 and later' },
  { id: 'lenis-v1', label: 'Lenis v1' },
  { id: 'trade-off', label: 'The one trade-off' },
  { id: 'questions', label: `Questions · ${faq.length}` },
  { id: 'comparisons', label: 'Comparisons' },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLdData) }} />
      <SiteShell active="/lenis-scroll-animation" crumbs={[['Lenis', '/lenis-scroll-animation']]} kicker="lenis / your turn">
        <div className="stk stk-lenis">

          {/* ── Opening ────────────────────────────────────── */}
          <header className="pg-head stk-head">
            <div>
              <p className="pg-kicker">
                <span>integration / lenis</span>
                <span>smooth scroll + scroll animation</span>
              </p>
              <h1 className="pg-title stk-title">
                Lenis + <span className="stk-nw">svg-scroll-draw.</span> <span className="dim">Not a competition.</span>
              </h1>
              <p className="pg-lede">
                Lenis is the smooth-scroll library everyone reaches for, and it comes up constantly as an
                &ldquo;alternative&rdquo; to scroll animation libraries. It is not one. Lenis eases the scroll itself;
                this library animates things against scroll position. They are complementary, we ship an adapter for it,
                and that is why there is no <C>/vs-lenis</C> page here.
              </p>
              <p className="stk-short">
                <span className="stk-short-k">short version</span>
                <span><b>On Lenis v2+ it just works, no adapter.</b> On Lenis v1 you need three extra lines.</span>
              </p>
              <dl className="pg-facts">
                <div><dt>Lenis {lenis.version}</dt><dd>{lenis.gzipKb} KB</dd></div>
                <div><dt>svg-scroll-draw</dt><dd>{SELF.gzipKb} KB</dd></div>
                <div><dt>Adapter on v2</dt><dd>None</dd></div>
                <div><dt>Adapter on v1</dt><dd>3 lines</dd></div>
              </dl>
            </div>
            <ScrollChain />
          </header>

          <div className="stk-body">
            <Toc label="on this page" items={TOC} />
            <div className="stk-main">

              {/* ── 01 Lenis v2 ───────────────────────────────── */}
              <Sec n={1} k="lenis v2+" id="lenis-v2" title="Lenis v2 and later.">
                <p className="stk-p">
                  Nothing special required. Lenis v2 patches <C>window.scrollY</C> itself, so every engine here reads
                  the correct position with no adapter and no configuration.
                </p>
                <CodeBox file="main.js">{V2_SETUP}</CodeBox>
              </Sec>

              {/* ── 02 Lenis v1 ───────────────────────────────── */}
              <Sec n={2} k="lenis v1 · adapter" id="lenis-v1" title="Lenis v1.">
                <p className="stk-p">
                  v1 keeps scroll position in a virtual value and never updates <C>window.scrollY</C>, so anything
                  reading native scroll sees a stale number and your animations appear frozen. The adapter patches it
                  and restores it on destroy.
                </p>
                <CodeBox file="main.js">{V1_SETUP}</CodeBox>
              </Sec>

              {/* ── 03 The trade-off ──────────────────────────── */}
              <Sec n={3} k="the trade-off" id="trade-off" title="The one trade-off.">
                <p className="stk-p">
                  Worth knowing before you commit: the native CSS fast path does not survive a virtual scroll value.
                  A CSS <C>view-timeline</C> reads real scroll position, so when Lenis v1 is driving, affected animations
                  fall back to the JavaScript engine. That is still the path most browsers take today, and the fallback
                  is automatic — but you do lose the zero-per-frame-JS optimisation on those elements.
                </p>
                <SizeBars
                  caption="fig. 2 — what the pair costs, minified + gzipped, to one scale"
                  rows={[
                    { label: 'Lenis', note: `${lenis.version} · ${lenis.license}`, kb: lenis.gzipKb },
                    { label: 'svg-scroll-draw', note: `${SELF.version} · ${SELF.license}`, kb: SELF.gzipKb, self: true },
                    { label: 'Both, together', note: 'smooth scroll + animation', kb: TOGETHER_KB, sum: true },
                  ]}
                />
                <p className="stk-src">
                  Lenis {lenis.version} is {lenis.gzipKb} KB gzipped, {lenis.license}, last published {lenis.lastPublish}.
                  svg-scroll-draw {SELF.version} is {SELF.gzipKb} KB. Measured {MEASURED_ON} at gzip level 9.
                </p>
              </Sec>

              {/* ── 04 Questions ──────────────────────────────── */}
              <Sec n={4} k="questions" id="questions" title="Questions.">
                <div className="stk-faq">
                  {faq.map((item, i) => (
                    <div key={item.q} className="stk-q">
                      <span className="stk-q-n">Q{i + 1}</span>
                      <div>
                        <h3 className="stk-q-t">{item.q}</h3>
                        <p className="stk-p">{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Sec>

              {/* ── 05 Comparisons ────────────────────────────── */}
              <Sec n={5} k="comparisons" id="comparisons" title="Comparisons">
                <div className="ex-rel-list">
                  {COMPARISONS.map((l, i) => (
                    <Link key={l.href} href={l.href} className="ex-rel-row">
                      <span className="ex-rel-n">{pad(i + 1)}</span>
                      <span>
                        <span className="ex-rel-t">{l.label}</span>
                        <span className="ex-rel-d">{l.href}</span>
                      </span>
                      <span className="ex-rel-go" aria-hidden="true">compare →</span>
                    </Link>
                  ))}
                </div>
                <div className="pg-actions">
                  <CopyCommand />
                  <Link href="/docs#lenis-adapter" className="btn" data-magnetic>Lenis adapter in the docs →</Link>
                </div>
              </Sec>
            </div>
          </div>
        </div>
      </SiteShell>
    </>
  );
}
