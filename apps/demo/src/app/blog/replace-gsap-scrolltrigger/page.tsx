import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { COMPETITORS, MEASURED_ON, SELF, provenance, ratioVsSelf } from '@/data/competitors';
import { BlogArticle, Section, Code, Compare, Callout, Figure } from '@/components/blog/BlogArticle';
import { Bars } from '@/components/blog/Bars';
import { MigrateFigure } from './MigrateFigure';

// Every size and ratio on this page comes from data/competitors.ts.
const OURS = SELF.gzipKb;
const CORE = COMPETITORS.gsapCore.gzipKb;
const STACK = COMPETITORS.gsapScroll.gzipKb;
const TRIGGER = Math.round((STACK - CORE) * 10) / 10;
const SPLIT = COMPETITORS.gsapSplitText.gzipKb;
const RATIO = ratioVsSelf('gsapScroll').toFixed(1);
const APPROX = `~${Math.round(OURS)} KB`;
const VERSION = COMPETITORS.gsapScroll.version;
const kb = (n: number) => `${n.toFixed(1)} KB`;

export const metadata: Metadata = {
  title: seoTitle('Replace GSAP ScrollTrigger with scrollAnimate'),
  description:
    `Migrate gsap.to() + ScrollTrigger to scrollAnimate for common scroll animations: about ${RATIO}× smaller, one call, no GSAP. Side-by-side code for each case.`,
  keywords: [
    'replace gsap scrolltrigger',
    'gsap alternative',
    'scrolltrigger alternative',
    'scroll animation without gsap',
    'scrollAnimate svg-scroll-draw',
    'gsap to replacement',
    'lightweight scroll animation library',
    'scroll animation javascript',
    'fade in on scroll javascript',
    'animate on scroll without gsap',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/replace-gsap-scrolltrigger' },
  openGraph: {
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description: `scrollAnimate covers the common ScrollTrigger use cases. About ${RATIO}× smaller. Zero deps. One function call.`,
    url: 'https://svg-scroll-draw.vercel.app/blog/replace-gsap-scrolltrigger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description: `About ${RATIO}× smaller than GSAP + ScrollTrigger. Zero deps. Same expressive API. Full migration guide.`,
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Replace GSAP ScrollTrigger with scrollAnimate — svg-scroll-draw v2',
  description: `scrollAnimate replaces gsap.to() + ScrollTrigger for the common scroll animation use cases. Zero GSAP dependency, about ${RATIO}× smaller, same one-call API. Full migration guide with side-by-side code.`,
  url: 'https://svg-scroll-draw.vercel.app/blog/replace-gsap-scrolltrigger',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/replace-gsap-scrolltrigger' },
};

/** The five recipes this post migrates, in the order it migrates them. */
const MAP = [
  { use: 'Fade + slide in', gsap: 'gsap.to() + scrollTrigger', ours: 'scrollAnimate', from: 'svg-scroll-draw' },
  { use: 'Parallax background', gsap: 'gsap.to({ y }) + scrub', ours: 'scrollParallax', from: 'svg-scroll-draw' },
  { use: 'Stats counter', gsap: 'gsap.to({ val }) + onUpdate', ours: 'scrollCounter', from: 'svg-scroll-draw' },
  { use: 'Text reveal', gsap: 'SplitText + gsap.from()', ours: 'scrollText', from: 'svg-scroll-draw/text' },
  { use: 'Video scrubbing', gsap: 'onUpdate → currentTime', ours: 'scrollVideo', from: 'svg-scroll-draw/video' },
];

export default function Page() {
  return (
    <BlogArticle
      slug="replace-gsap-scrolltrigger"
      jsonLd={articleJsonLd}
      tags={['ScrollTrigger', 'scrollAnimate', 'no GSAP']}
      title={<>Replace GSAP ScrollTrigger with scrollAnimate.</>}
      lede={
        <>
          svg-scroll-draw v2 ships <code>scrollAnimate</code> — a replacement for the common scroll animation use
          cases that today reach for GSAP + ScrollTrigger. About {RATIO}× smaller. Zero dependencies. One function call.
        </>
      }
      facts={[
        { k: 'GSAP stack', v: kb(STACK) },
        { k: 'svg-scroll-draw', v: kb(OURS) },
        { k: 'Smaller by', v: `${RATIO}×` },
        { k: 'Recipes migrated', v: String(MAP.length) },
      ]}
      figure={
        <Figure n={1} caption={<>the migration map — each ScrollTrigger recipe in this post and the one call that replaces it; weights to one scale, measured {COMPETITORS.gsapScroll.measuredOn ?? MEASURED_ON}</>}>
          <MigrateFigure
            rows={MAP}
            weights={[
              { label: 'gsap + ScrollTrigger', kb: STACK },
              { label: 'svg-scroll-draw', kb: OURS, self: true },
            ]}
          />
        </Figure>
      }
      further={[
        { href: '/docs#scroll-animate', label: 'scrollAnimate API docs', blurb: 'Every option, the trigger window and the instance methods.' },
        { href: '/examples', label: 'Live examples', blurb: 'Each API running on the page, with its code.' },
      ]}
    >
      <Section id="why-gsap" k="the cost" title="Why GSAP in the first place?">
        <p>
          GSAP is the de facto choice for scroll animations because it covers everything: fade, slide, color transitions,
          counters, text reveals, video scrubbing. Developers install it once and use it for everything.
        </p>
        <p>
          The cost: <strong>{kb(STACK)} gzipped</strong> (ScrollTrigger adds {kb(TRIGGER)} on top of GSAP core&apos;s{' '}
          {kb(CORE)}) and a non-trivial API surface. It is not a licence cost any more: since 2025 every GSAP plugin,
          SplitText included, is free. For most projects, though, much of that weight covers use cases you never touch.
        </p>
      </Section>

      <Section id="side-by-side" k="fade + slide" title="The side-by-side">
        <p>Here is the most common GSAP scroll pattern — fade + slide in on scroll:</p>
        <Compare
          before={{ label: 'GSAP + ScrollTrigger', file: 'gsap-before.js', code: `// GSAP — ${kb(STACK)} gzipped, needs two imports
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.to('#hero-text', {
  opacity:    1,
  y:          0,
  duration:   0.8,
  ease:       'power2.out',
  scrollTrigger: {
    trigger:  '#hero-text',
    start:    'top 80%',
    end:      'top 40%',
    scrub:    true,
    once:     true,
  },
});` }}
          after={{ label: 'svg-scroll-draw', file: 'svg-scroll-draw-after.js', code: `// svg-scroll-draw v2 — ${APPROX} total, one import, no plugin registration
import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#hero-text', {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  trigger: { start: 'top 80%', end: 'top 40%' },
  easing:  'ease-out',
  once:    true,
});` }}
        />
        <Callout k="bundle impact">
          GSAP {VERSION} core + ScrollTrigger = {kb(STACK)} gzipped. svg-scroll-draw&apos;s full main entry ={' '}
          {kb(OURS)} gzipped. For scroll animations, that is about a <strong>{RATIO}× size reduction</strong>.
        </Callout>
        <Figure n={2} caption={provenance([`gsap ${VERSION}`, `svg-scroll-draw ${SELF.version}`])}>
          <Bars
            rows={[
              { label: 'svg-scroll-draw', value: OURS, self: true },
              { label: COMPETITORS.gsapCore.label, value: CORE },
              { label: COMPETITORS.gsapScroll.label, value: STACK },
            ]}
          />
        </Figure>
      </Section>

      <Section id="patterns" k="migrated" title="Common patterns, migrated">
        <h3 className="ba-h3">Parallax background</h3>
        <Compare
          before={{ label: 'GSAP', file: 'parallax.js', code: `// GSAP
gsap.to('#bg', { y: -120, ease: 'none',
  scrollTrigger: { trigger: '#bg', start: 'top bottom', end: 'bottom top', scrub: true } });` }}
          after={{ label: 'svg-scroll-draw', file: 'parallax.js', code: `// svg-scroll-draw
import { scrollParallax } from 'svg-scroll-draw';
scrollParallax('#bg', { speed: 0.4 }); // speed = fraction of element height` }}
        />

        <h3 className="ba-h3">Stats counter</h3>
        <Compare
          before={{ label: 'GSAP', file: 'counter.js', code: `// GSAP (needs a custom plugin or TextPlugin)
gsap.to({ val: 0 }, {
  val: 50000, duration: 2, ease: 'power1.out',
  scrollTrigger: { trigger: '#count', start: 'top 80%', once: true },
  onUpdate() { document.getElementById('count').textContent = Math.round(this.targets()[0].val); },
});` }}
          after={{ label: 'svg-scroll-draw', file: 'counter.js', code: `// svg-scroll-draw
import { scrollCounter } from 'svg-scroll-draw';
scrollCounter('#count', { to: 50000, easing: 'ease-out', once: true });` }}
        />

        <h3 className="ba-h3">Text reveal (SplitText)</h3>
        <Compare
          before={{ label: 'GSAP SplitText', file: 'text.js', code: `// GSAP SplitText — free, ${kb(SPLIT)} (+ GSAP core to animate)
const split = new SplitText('#headline', { type: 'words' });
gsap.from(split.words, { opacity: 0, y: 24, stagger: 0.05, ease: 'power2.out',
  scrollTrigger: { trigger: '#headline', start: 'top 85%', once: true } });` }}
          after={{ label: 'svg-scroll-draw/text', file: 'text.js', code: `// svg-scroll-draw/text — free, MIT
import { scrollText } from 'svg-scroll-draw/text';
scrollText('#headline', { split: 'words', stagger: 0.05, from: { opacity: 0, y: 24 }, once: true });` }}
        />

        <h3 className="ba-h3">Video scrubbing</h3>
        <Compare
          before={{ label: 'GSAP', file: 'video.js', code: `// GSAP
gsap.to({}, {
  scrollTrigger: { trigger: '#section', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: self => { video.currentTime = self.progress * video.duration; } },
});` }}
          after={{ label: 'svg-scroll-draw/video', file: 'video.js', code: `// svg-scroll-draw/video
import { scrollVideo } from 'svg-scroll-draw/video';
scrollVideo('#hero-video', { trigger: { start: 'top top', end: 'bottom top' } });` }}
        />
      </Section>

      <Section id="instance-api" k="instance" title="The instance API is the same">
        <p>
          Every function in svg-scroll-draw returns the same instance object, so programmatic control feels identical to GSAP:
        </p>
        <Code file="instance.js">{`const anim = scrollAnimate('#el', { props: { opacity: [0, 1] } });

anim.pause();           // pause at current frame
anim.resume();          // resume
anim.seek(0.5);         // jump to 50%
anim.replay();          // reset and replay
anim.getProgress();     // → 0–1
anim.destroy();         // remove all listeners`}</Code>
      </Section>

      <Section id="when-gsap" k="honest guidance" title="When to still use GSAP">
        <p>svg-scroll-draw covers the common cases. There are scenarios where GSAP is still the right tool:</p>
        <ul>
          <li>Complex multi-element non-scroll timelines (absolute time, tweening unrelated to scroll)</li>
          <li>Physics simulations and draggable interactions (Draggable plugin)</li>
          <li>Advanced SVG morphing with incompatible path structures (MorphSVG plugin)</li>
          <li>Canvas / WebGL animations</li>
        </ul>
        <p>
          For everything scroll-driven — and that is the vast majority of landing page and marketing site animation —
          svg-scroll-draw v2 gets you there at a fraction of the bundle cost.
        </p>
      </Section>
    </BlogArticle>
  );
}
