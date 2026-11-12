import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/aos/aos.css';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import {
  AOS_ANCHOR_PLACEMENTS, AOS_ATTRIBUTES, AOS_EASINGS, AOS_EFFECT_COUNT, AOS_FAMILIES,
} from '@/data/aos-effects';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { AosGallery } from '@/components/aos/AosGallery';
import { AosFamilies } from '@/components/aos/AosFamilies';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searchers type "aos animation" and want to see the effects; small demo
// pages rank for it. This one shows every effect live, on the AOS drop-in.
const TITLE = `AOS Animation Examples: All ${AOS_EFFECT_COUNT} data-aos Effects, Live`;
const DESCRIPTION =
  `Every AOS animation running live: fade, zoom, slide and flip, with the data-aos markup to copy, all ${AOS_EASINGS.length} easings and every attribute.`;

const AOS = COMPETITORS.aos;
const AOS_CDN = `<link rel="stylesheet" href="https://unpkg.com/aos@${AOS.version}/dist/aos.css">
<script src="https://unpkg.com/aos@${AOS.version}/dist/aos.js"></script>

<div data-aos="fade-up">Fades up as it scrolls into view</div>

<script>AOS.init();</script>`;

const DROPIN_JS = `// The same markup and the same API. No aos.css: the styles ship inside.
import AOS from 'svg-scroll-draw/aos';

AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true });`;

const DROPIN_CDN = `<script src="https://unpkg.com/svg-scroll-draw@${SELF.version}/dist/cdn/aos.global.js"></script>
<script>AOS.init();</script>`;

const INIT_OPTIONS = `AOS.init({
  offset: 120,        // px from the trigger point
  delay: 0,           // ms, on the way in only
  duration: 400,      // ms
  easing: 'ease',
  once: false,        // animate only the first time
  mirror: false,      // also animate out when scrolled past
  anchorPlacement: 'top-bottom',
});`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is AOS?',
    a: `AOS (Animate On Scroll) is a small JavaScript library that animates elements as they scroll into view. You mark an element with a data-aos attribute naming the effect, load aos.css, and call AOS.init(). It has ${AOS_EFFECT_COUNT} effects in four families (fade, zoom, slide and flip). Its latest release is ${AOS.version}.`,
  },
  {
    q: 'How do I use AOS?',
    a: 'Load aos.css and aos.js (from npm or a CDN), add data-aos="fade-up" (or any effect name) to the elements to animate, and call AOS.init() once. Timing goes on each element with data-aos-duration, data-aos-delay and data-aos-easing, or for the whole page in the AOS.init() options.',
  },
  {
    q: 'Why is my AOS animation not working?',
    a: 'The usual causes: AOS.init() is never called, or is called before the elements exist (call AOS.refreshHard() after adding them); aos.css is not loaded, so nothing moves; or the element scrolls inside its own container, while AOS only watches the window scroll.',
  },
  {
    q: 'How do I make an AOS animation play only once?',
    a: 'Add data-aos-once="true" to the element, or pass once: true to AOS.init() for every element. By default AOS animates an element out again when you scroll back above it, and in again when it returns.',
  },
  {
    q: 'How do I use AOS in React or Next.js?',
    a: "Call AOS.init() once in the browser, in a useEffect in your root component, and keep the data-aos attributes in your JSX. In the Next.js App Router that needs a small 'use client' component in app/layout.tsx; the svg-scroll-draw drop-in ships one, <AOSInit />.",
  },
  {
    q: 'Does AOS respect prefers-reduced-motion?',
    a: `AOS ${AOS.version} does not check it, so elements still move for readers who asked their system for less motion. The svg-scroll-draw drop-in shows every element in its final state instead, including when the setting is turned on while the page is open.`,
  },
];

const TOC = [
  { id: 'answer', label: 'AOS in three lines' },
  { id: 'effects', label: `Every effect · ${AOS_EFFECT_COUNT}` },
  { id: 'attributes', label: `Attributes · ${AOS_ATTRIBUTES.length}` },
  { id: 'easings', label: `Easings · ${AOS_EASINGS.length}` },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'aos animation', 'aos animation examples', 'animate on scroll', 'data-aos',
    'aos fade up', 'aos zoom', 'aos easing', 'aos react', 'aos nextjs', 'aos alternative',
  ],
  alternates: { canonical: '/aos-animation' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/aos-animation` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      headline: TITLE,
      description: DESCRIPTION,
      url: `${SITE_URL}/aos-animation`,
      author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
      publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
      about: { '@id': `${SITE_URL}/#software` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/aos-animation` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function AosAnimationPage() {
  return (
    <SiteShell active="/aos-animation" crumbs={[['AOS animation', '/aos-animation']]} kicker="aos / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>aos / animate on scroll</span>
              <span>every effect, live</span>
            </p>
            <h1 className="pg-title stk-title">AOS animation, every effect</h1>
            <p className="pg-lede">
              All {AOS_EFFECT_COUNT} <C>data-aos</C> effects running on this page, each with the markup to copy.
              Set the duration and easing once and every specimen follows. The markup is the same for AOS {AOS.version}{' '}
              and for the drop-in this page runs on.
            </p>
            <div className="pg-actions">
              <a href="#effects" className="btn btn-solid" data-magnetic>See every effect ↓</a>
              <Link href="/vs-aos" className="btn" data-magnetic>AOS compared →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Effects</dt><dd>{AOS_EFFECT_COUNT}</dd></div>
              <div><dt>Easings</dt><dd>{AOS_EASINGS.length}</dd></div>
              <div><dt>Anchor placements</dt><dd>{AOS_ANCHOR_PLACEMENTS.length}</dd></div>
              <div><dt>Drop-in</dt><dd>{SELF_ENTRIES.aos} KB</dd></div>
            </dl>
          </div>
          <AosFamilies />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The answer" id="answer" title="AOS in three lines">
              <p className="stk-p">
                Load the stylesheet and the script, name an effect on any element with <C>data-aos</C>, and call{' '}
                <C>AOS.init()</C> once. The element animates when it scrolls into view.
              </p>
              <CodeBox file="index.html">{AOS_CDN}</CodeBox>
            </Sec>

            <Sec n={2} k={`${AOS_EFFECT_COUNT} effects · live`} id="effects" title="Every AOS effect, live">
              <p className="stk-p">
                {AOS_FAMILIES.map((f, i) => (
                  <span key={f.key}>{i > 0 && (i === AOS_FAMILIES.length - 1 ? ' and ' : ', ')}{f.effects.length} {f.title.toLowerCase()}</span>
                ))}{' '}
                effects. Each specimen below is a <C>data-aos</C> element, so what you see is exactly what the
                attribute does on your page. Copy takes its markup with the duration and easing you set; Run it
                downloads a page of every effect at that timing, or opens it in StackBlitz.
              </p>
              <AosGallery version={SELF.version} />
            </Sec>

            <Sec n={3} k={`${AOS_ATTRIBUTES.length} attributes`} id="attributes" title="Every data-aos attribute">
              <p className="stk-p">
                Each attribute sets one element. The same settings for the whole page go in <C>AOS.init()</C>, under
                the option name; an attribute on an element wins over the option.
              </p>
              <div className="aosg-scroll">
                <table className="aosg-table">
                  <thead><tr><th>Attribute</th><th>Option</th><th>Default</th><th>What it does</th></tr></thead>
                  <tbody>
                    {AOS_ATTRIBUTES.map((a) => (
                      <tr key={a.attr}><td>{a.attr}</td><td>{a.option}</td><td>{a.def}</td><td>{a.what}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBox file="AOS.init() — the defaults">{INIT_OPTIONS}</CodeBox>
              <Note k="Anchor placement">
                <C>data-aos-anchor-placement</C> names which edge of the element meets which edge of the window:{' '}
                <C>top-bottom</C>, the default, starts the animation when the element’s top is the offset (120px
                unless you set one) above the bottom of the window. All {AOS_ANCHOR_PLACEMENTS.length}:{' '}
                {AOS_ANCHOR_PLACEMENTS.join(', ')}. As in AOS, an element with its own{' '}
                <C>data-aos-anchor-placement</C> and no <C>data-aos-offset</C> uses an offset of 0.
              </Note>
            </Sec>

            <Sec n={4} k={`${AOS_EASINGS.length} names`} id="easings" title="AOS easings">
              <p className="stk-p">
                <C>data-aos-easing</C> takes CSS’s five built-in timing names or one of AOS’s fifteen curves.
                Pick one in the gallery’s easing control to see it on every effect.
              </p>
              <ul className="aosg-names">
                {AOS_EASINGS.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </Sec>

            <Sec n={5} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                Every specimen above runs on <C>svg-scroll-draw/aos</C>, not on AOS, which has not had a release since{' '}
                {AOS.version}. The drop-in speaks the same API and the same markup, with the styles inside the module
                ({SELF_ENTRIES.aos} KB against AOS’s {AOS.gzipKb} KB with its stylesheet) and reduced motion respected.
                Switching is an import change. The page the gallery downloads loads the same entry from jsDelivr as
                an ES module, pinned to {SELF.version}.
              </p>
              <CodeBox file="main.js">{DROPIN_JS}</CodeBox>
              <CodeBox file="index.html (no build step)">{DROPIN_CDN}</CodeBox>
              <p className="stk-p stk-more">
                Step by step for <Link href="/guides/aos-react">React</Link> and{' '}
                <Link href="/guides/aos-nextjs">Next.js</Link>; the full comparison with AOS and ScrollReveal is on{' '}
                <Link href="/vs-aos">AOS compared</Link>.
              </p>
              <ToolNextStep
                slug="aos-animation"
                api="AOS"
                importLine="import AOS from 'svg-scroll-draw/aos'"
                entry="aos"
                docs="/vs-aos#drop-in"
                related={['scroll-reveal-generator', 'cubic-bezier-generator']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="AOS questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
