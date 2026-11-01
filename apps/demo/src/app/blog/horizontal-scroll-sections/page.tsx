import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Table, Figure, Steps, Step } from '@/components/blog/BlogArticle';
import { HorizontalFigure } from '@/components/blog/HorizontalFigure';

export const metadata: Metadata = {
  title: seoTitle('Horizontal Scroll Sections Without GSAP — scrollHorizontal'),
  description:
    'Build the Apple / Stripe scroll-sideways section without GSAP: scrollHorizontal drives translateX from vertical scroll. One call, sticky CSS, React code.',
  keywords: [
    'horizontal scroll sections javascript',
    'scroll to move horizontally',
    'apple scroll animation',
    'horizontal parallax scroll',
    'scrollHorizontal without gsap',
    'sticky horizontal scroll',
    'gsap horizontal scroll alternative',
    'translate x on scroll javascript',
    'scroll driven horizontal animation',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections' },
  openGraph: {
    title: 'Horizontal scroll sections without GSAP',
    description: 'scrollHorizontal: vertical scroll → horizontal motion. Apple-style pattern. One call.',
    url: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Horizontal scroll sections without GSAP — scrollHorizontal',
  description: 'Build the Apple / Stripe "scroll sideways" pattern without GSAP. scrollHorizontal drives translateX from vertical scroll — one call, sticky CSS, zero dependencies.',
  url: 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections' },
};

const API: [string, string, string][] = [
  ['distance', 'number', 'Horizontal travel in px. Default: track.scrollWidth - window.innerWidth'],
  ['easing', 'EasingName | fn', 'Easing for horizontal movement. Default: linear'],
  ['trigger', 'TriggerConfig', 'Scroll window. Default: top top → bottom bottom'],
  ['scrollContainer', 'string | Element', 'Custom scroll container. Default: window'],
  ['triggerElement', 'string | Element', 'Element whose height is the scroll runway. Default: the container of the nearest position:sticky ancestor'],
  ['respectReducedMotion', 'boolean', 'Default: false. The scrub advances only as the user scrolls, and holding a final state would hide every panel but one'],
  ['onProgress', '(p: number) => void', 'Progress 0–1 through the horizontal travel'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="horizontal-scroll-sections"
      jsonLd={articleJsonLd}
      tags={['scrollHorizontal', 'svg-scroll-draw/horizontal', 'no GSAP']}
      title={<>Horizontal scroll sections without GSAP.</>}
      lede={
        <>
          Apple does it. Stripe does it. Linear does it. Vertical scroll drives horizontal movement —
          and it&apos;s one of the most striking effects on the web. Here&apos;s how to build it in{' '}
          <code>~10 lines</code>, no GSAP.
        </>
      }
      facts={[
        { k: 'Setup', v: 'one call' },
        { k: 'Default trigger', v: 'top top → bottom bottom' },
        { k: 'Options', v: API.length },
        { k: 'Every API', v: `${SELF.gzipKb.toFixed(1)} KB · ${SELF.license}` },
      ]}
      figure={
        <Figure n={1} caption="the three layers at p = 0.5: the track translated under the sticky stage, and the outer container's runway that drives it">
          <HorizontalFigure />
        </Figure>
      }
      further={[
        { href: '/blog/scroll-pin-without-gsap', label: 'scrollPin without GSAP', blurb: 'The same sticky-stage idea, holding one element while the page scrolls past it.' },
        { href: '/vs-gsap', label: 'Full GSAP comparison', blurb: 'Measured sizes, and where GSAP is still the better call.' },
        { href: '/docs', label: 'API Reference', blurb: 'Every option of every API.' },
      ]}
    >
      <Section id="how-it-works" k="the idea" title="How it works">
        <p>The pattern has three layers:</p>
        <ol>
          <li><strong>A tall outer container</strong> — gives the page enough scroll height for the horizontal travel distance</li>
          <li><strong>A sticky inner container</strong> — stays fixed in the viewport while the user scrolls through the outer</li>
          <li><strong>A horizontal track</strong> — slides left (translateX) proportional to how far through the outer the user has scrolled</li>
        </ol>
        <p>
          You set up the CSS. <code>scrollHorizontal</code> drives the translateX.
        </p>
      </Section>

      <Section id="build" k="css · html · js" title="Build it in three steps">
        <Steps>
          <Step n={1} title="CSS setup">
            <Code file="styles.css">{`.outer {
  height: 400vh;             /* scroll space = 3 extra viewport heights */
}

.sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.track {
  display: flex;
  width: max-content;        /* as wide as all sections combined */
  height: 100%;
}

.section {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
}`}</Code>
          </Step>
          <Step n={2} title="HTML">
            <Code file="index.html">{`<div class="outer">
  <div class="sticky">
    <div class="track" id="track">
      <section class="section">Section 1</section>
      <section class="section">Section 2</section>
      <section class="section">Section 3</section>
      <section class="section">Section 4</section>
    </div>
  </div>
</div>`}</Code>
          </Step>
          <Step n={3} title="JavaScript">
            <Code file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

const track = document.querySelector('#track');

scrollHorizontal(track, {
  // Travel the full width of all sections minus one viewport
  distance: track.scrollWidth - window.innerWidth,
  easing:   'linear',  // linear = scrub feel (matches scroll exactly)
});`}</Code>
            <p>
              That&apos;s it. The trigger defaults to <code>top top → bottom bottom</code> which maps the full scroll
              height of the outer container to the full horizontal travel distance.
            </p>
          </Step>
        </Steps>
      </Section>

      <Section id="runway" k="triggerElement" title="Which element sets the runway">
        <p>
          Note <em>which</em> element that window is measured from: the outer container, not the track. The track
          can’t supply it — the sticky stage pins the track at exactly one viewport tall, so measuring against it
          would put the start and end of the window at the same scroll position, and nothing would move.{' '}
          <code>scrollHorizontal</code> finds the outer container for you by walking up to the nearest{' '}
          <code>position: sticky</code> ancestor and taking its parent, which is the structure above.
        </p>
        <p>
          If your layout doesn&apos;t use a sticky stage — a custom pinning approach, or a nested scroll container — pass
          the element that owns the scroll length explicitly:
        </p>
        <Code file="app.js">{`scrollHorizontal(track, {
  distance:       track.scrollWidth - window.innerWidth,
  triggerElement: '#outer',   // the element whose height is the scroll runway
});`}</Code>
      </Section>

      <Section id="react" k="react" title="React version">
        <Code file="HorizontalScroll.tsx">{`'use client';
import { useEffect, useRef } from 'react';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

const SECTIONS = ['Intro', 'Features', 'Pricing', 'Contact'];

export function HorizontalScroll() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const inst = scrollHorizontal(track, {
      distance: track.scrollWidth - window.innerWidth,
      easing:   'linear',
    });

    // Recalculate on resize
    const onResize = () => inst.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      inst.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div style={{ height: '400vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div ref={trackRef} style={{ display: 'flex', width: 'max-content', height: '100%' }}>
          {SECTIONS.map(s => (
            <section key={s} style={{ width: '100vw', height: '100vh', flexShrink: 0 }}>
              <h2>{s}</h2>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}`}</Code>
      </Section>

      <Section id="progress" k="onProgress" title="Progress indicators">
        <p>Use <code>onProgress</code> to drive dot indicators:</p>
        <Code file="app.js">{`const dots = document.querySelectorAll('.dot');

scrollHorizontal('#track', {
  distance:   3 * window.innerWidth,
  easing:     'linear',
  onProgress: (p) => {
    // p is 0→1 across all sections
    const activeIndex = Math.round(p * (dots.length - 1));
    dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
  },
});`}</Code>
      </Section>

      <Section id="combine" k="scrollReveal · scrollProgress" title="Combine with scrollReveal inside sections">
        <Code file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
import { scrollReveal }     from 'svg-scroll-draw/reveal';
import { scrollProgress }   from 'svg-scroll-draw/progress';

// Drive horizontal movement
scrollHorizontal('#track', { distance: 3 * window.innerWidth });

// Reveal content inside sections as they come into view
scrollReveal('.section-content', {
  preset:  'fadeUp',
  stagger: 0.1,
});

// Expose progress as CSS variable for background color transitions
scrollProgress('#track', {
  variable: '--scroll-p',
  easing:   'ease-in-out',
});
// CSS: background: hsl(calc(240 + var(--scroll-p) * 120), 60%, 10%);`}</Code>
        <Callout k="performance tip">
          Use <code>easing: &apos;linear&apos;</code> for a true scrub feel. Non-linear easings work too but feel less
          physically accurate — the horizontal position will lead or lag the scroll position, which can feel jarring.
        </Callout>
      </Section>

      <Section id="api" k="reference" title="API">
        <Table head={['Option', 'Type', 'Description']} rows={API.map(([o, t, d]) => [o, <code key="t">{t}</code>, d])} />
      </Section>
    </BlogArticle>
  );
}
