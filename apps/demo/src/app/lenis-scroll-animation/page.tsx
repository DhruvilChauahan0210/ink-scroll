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
    'Scroll animations on Lenis smooth scrolling. Lenis 1.x scrolls the real page, so it needs no adapter: the setup, a custom wrapper, and what the adapter is for.',
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
    description: 'Scroll animations on Lenis smooth scrolling. Lenis 1.x scrolls the real page, so it needs no adapter: the setup, a custom wrapper, and what the adapter is for.',
    url: `${SITE_URL}/lenis-scroll-animation`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lenis Scroll Animation — Add Animations to Smooth Scroll',
    description: 'Scroll animations on Lenis smooth scrolling. Lenis 1.x scrolls the real page, so it needs no adapter: the setup, a custom wrapper, and what the adapter is for.',
  },
};

const faq = [
  {
    q: 'Does svg-scroll-draw work with Lenis?',
    a: 'Yes, with no adapter. Every Lenis release so far is 1.x, and on every frame Lenis moves the real scroll position: its setScroll() calls scrollTo() on the window with behavior "instant". So window.scrollY follows the eased scroll and every engine here reads the right value. Run Lenis’s rAF loop and call scrollDraw as usual.',
  },
  {
    q: 'Is Lenis an alternative to svg-scroll-draw?',
    a: 'No — they do different jobs and are designed to be used together. Lenis eases the scroll itself; svg-scroll-draw animates elements against scroll position. Neither replaces the other, which is why there is no versus page for Lenis on this site.',
  },
  {
    q: 'Then what is svg-scroll-draw/lenis for?',
    a: 'A scroller that keeps its position in a virtual value and never moves the page, so window.scrollY goes stale. createLenisAdapter takes anything with Lenis’s on("scroll") / off("scroll") shape, patches window.scrollY and window.pageYOffset to report its value, and puts the browser’s own properties back on destroy. Lenis 1.x does not need it.',
  },
  {
    q: 'What about Lenis v2?',
    a: 'There is no Lenis v2 release yet: 2.0 exists only as development prereleases, and lenis on npm is 1.x. Advice that splits Lenis into a v1 that needs an adapter and a v2 that patches scrollY matches no release: the 1.x line already scrolls the real page.',
  },
  {
    q: 'Does smooth scrolling hurt scroll animation performance?',
    a: 'Not with Lenis. Because it moves the real scroll position, a CSS view-timeline follows it, so where the browser supports animation-timeline the draw still runs as a native CSS scroll animation with no per-frame JavaScript. The exception is a virtual scroller patched by the adapter: CSS reads the real position, which does not move, so pass native: false there and let the JS engine draw.',
  },
];

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      headline: 'Lenis + svg-scroll-draw — smooth scroll and scroll-driven animation together',
      description:
        'How to combine Lenis smooth scrolling with scroll-driven SVG animation: Lenis 1.x needs no adapter.',
      url: `${SITE_URL}/lenis-scroll-animation`,
      datePublished: '2026-08-15',
      dateModified: '2026-11-13',
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

const LENIS_SETUP = `import Lenis from 'lenis';
import { scrollDraw } from 'svg-scroll-draw';

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// No adapter: Lenis scrolls the real page, so window.scrollY is already right.
scrollDraw('#hero-svg', { easing: 'ease-out', speed: 1.2 });`;

const WRAPPER_SETUP = `import Lenis from 'lenis';
import { scrollDraw } from 'svg-scroll-draw';

const wrapper = document.querySelector('#scroller');
const lenis = new Lenis({ wrapper, content: wrapper.firstElementChild });
// …the same rAF loop as above

// Lenis scrolls #scroller, not the window: point the draw at it.
scrollDraw('#hero-svg', { scrollContainer: wrapper });`;

const ADAPTER_SETUP = `import { createLenisAdapter } from 'svg-scroll-draw/lenis';
import { scrollDraw } from 'svg-scroll-draw';

// \`scroller\` keeps a virtual position and emits
// 'scroll' with { scroll, velocity, direction, progress }.
const adapter = createLenisAdapter(scroller);

// CSS reads the real scroll position, which never moves here.
scrollDraw('#hero-svg', { native: false });

// On teardown: puts the browser's own window.scrollY back.
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
  { id: 'lenis-setup', label: 'Lenis 1.x: no adapter' },
  { id: 'custom-wrapper', label: 'A custom wrapper' },
  { id: 'adapter', label: 'What the adapter is for' },
  { id: 'cost', label: 'What the pair costs' },
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
                Lenis + <span className="stk-nw">svg-scroll-draw,</span> <span className="dim">not a competition</span>
              </h1>
              <p className="pg-lede">
                Lenis is the smooth-scroll library everyone reaches for, and it comes up constantly as an
                &ldquo;alternative&rdquo; to scroll animation libraries. It is not one. Lenis eases the scroll itself;
                this library animates things against scroll position. They are complementary, they need nothing to
                join them, and that is why there is no <C>/vs-lenis</C> page here.
              </p>
              <p className="stk-short">
                <span className="stk-short-k">Short version</span>
                <span><b>On Lenis it just works, no adapter.</b> Lenis 1.x scrolls the real page, so <C>window.scrollY</C> is always right.</span>
              </p>
              <dl className="pg-facts">
                <div><dt>Lenis {lenis.version}</dt><dd>{lenis.gzipKb} KB</dd></div>
                <div><dt>svg-scroll-draw</dt><dd>{SELF.gzipKb} KB</dd></div>
                <div><dt>Adapter for Lenis</dt><dd>None</dd></div>
                <div><dt>Native CSS path</dt><dd>Kept</dd></div>
              </dl>
            </div>
            <ScrollChain />
          </header>

          <div className="stk-body">
            <Toc label="On this page" items={TOC} />
            <div className="stk-main">

              {/* ── 01 Lenis 1.x ──────────────────────────────── */}
              <Sec n={1} k="lenis 1.x" id="lenis-setup" title="Lenis 1.x: no adapter">
                <p className="stk-p">
                  Nothing special required. Every Lenis release so far is 1.x (2.0 exists only as development
                  prereleases), and on every frame Lenis moves the real scroll position: its <C>setScroll()</C> calls{' '}
                  <C>scrollTo()</C> with <C>{"behavior: 'instant'"}</C>. So <C>window.scrollY</C> follows the eased
                  scroll, and every engine here reads it with no adapter and no configuration.
                </p>
                <CodeBox file="main.js">{LENIS_SETUP}</CodeBox>
              </Sec>

              {/* ── 02 A custom wrapper ───────────────────────── */}
              <Sec n={2} k="custom wrapper" id="custom-wrapper" title="A custom wrapper">
                <p className="stk-p">
                  Give Lenis a <C>wrapper</C> element and it scrolls that element instead of the window. Point the
                  animation at the same element with <C>scrollContainer</C>. A custom scroll container is one of the
                  options the CSS path cannot express, so those animations run on the JavaScript engine.
                </p>
                <CodeBox file="main.js">{WRAPPER_SETUP}</CodeBox>
              </Sec>

              {/* ── 03 The adapter ────────────────────────────── */}
              <Sec n={3} k="adapter" id="adapter" title="What the adapter is for">
                <p className="stk-p">
                  <C>svg-scroll-draw/lenis</C> is for a scroller that keeps its position in a virtual value and never
                  moves the page, so <C>window.scrollY</C> goes stale and animations look frozen. It takes anything with
                  Lenis’s <C>{"on('scroll')"}</C> shape, patches <C>window.scrollY</C> and{' '}
                  <C>window.pageYOffset</C> to report that value, and puts the browser’s own properties back on
                  destroy. CSS still reads the real position, which does not move, so pass <C>native: false</C>.
                </p>
                <CodeBox file="main.js">{ADAPTER_SETUP}</CodeBox>
              </Sec>

              {/* ── 04 The cost ───────────────────────────────── */}
              <Sec n={4} k="the cost" id="cost" title="What the pair costs">
                <p className="stk-p">
                  Nothing in speed: because Lenis moves the real scroll position, a CSS <C>view-timeline</C> follows it,
                  and where the browser supports <C>animation-timeline</C> the draw still runs as a native CSS scroll
                  animation with no per-frame JavaScript. Elsewhere the JavaScript engine reads <C>window.scrollY</C> on
                  each frame, as it would without Lenis. What you pay is bytes:
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

              {/* ── 05 Questions ──────────────────────────────── */}
              <Sec n={5} k="questions" id="questions" title="Questions">
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

              {/* ── 06 Comparisons ────────────────────────────── */}
              <Sec n={6} k="comparisons" id="comparisons" title="Comparisons">
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
