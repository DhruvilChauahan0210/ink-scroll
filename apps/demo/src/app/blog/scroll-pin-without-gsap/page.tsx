import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Defs, Table, Figure } from '@/components/blog/BlogArticle';
import { PinFigure } from '@/components/blog/PinFigure';

export const metadata: Metadata = {
  title: seoTitle('Scroll Pin Without GSAP — Pin Sections While You Scroll'),
  description:
    'Pin an element as the page scrolls past it, without GSAP: custom pin point, progress callbacks, an Apple-style pinned image, React usage and snapping.',
  keywords: [
    'scroll pin without gsap',
    'gsap pin alternative',
    'sticky scroll section javascript',
    'scrolltrigger pin alternative',
    'pin element on scroll',
    'scroll-driven sticky section',
    'svg-scroll-draw scrollPin',
    'pin animation javascript',
    'position fixed on scroll',
    'scroll snap and pin',
  ],
  alternates: { canonical: '/blog/scroll-pin-without-gsap' },
  openGraph: {
    title: 'Scroll Pin Without GSAP — Pin Sections While You Scroll',
    description: 'Pin an element as the page scrolls past it, without GSAP: custom pin point, progress callbacks, an Apple-style pinned image, React usage and snapping.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scroll Pin Without GSAP — Pin Sections While You Scroll',
    description: 'Pin an element as the page scrolls past it, without GSAP: custom pin point, progress callbacks, an Apple-style pinned image, React usage and snapping.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Pin sections on scroll without GSAP — scrollPin',
  description: 'How to pin any element at a viewport position while the page scrolls past it — without GSAP. scrollPin from svg-scroll-draw: wrapper-based, no layout shift, full lifecycle callbacks.',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/scroll-pin-without-gsap' },
};

const API: [string, string, string][] = [
  ['pinDistance', 'number', 'Pixels of scroll to stay pinned. Default: window.innerHeight'],
  ['top', 'number', 'Viewport Y (px) to pin at. Default: 0 (viewport top)'],
  ['scrollContainer', 'string | Element', 'Custom scroll container. Default: window'],
  ['onEnter', '() => void', 'Fires when pin zone is entered (scrolling down)'],
  ['onLeave', '() => void', 'Fires when pin zone is exited at end (scrolling down)'],
  ['onEnterBack', '() => void', 'Fires when pin zone is re-entered (scrolling up)'],
  ['onLeaveBack', '() => void', 'Fires when pin zone is exited at start (scrolling up)'],
  ['onProgress', '(p: number) => void', 'Progress 0–1 through the pin zone, every frame'],
];

export default function Page() {
  const total = `~${Math.round(SELF.gzipKb)} KB`;
  return (
    <BlogArticle
      slug="scroll-pin-without-gsap"
      jsonLd={articleJsonLd}
      tags={['scrollPin', 'svg-scroll-draw/pin', 'no GSAP']}
      title={<>Pin sections on scroll without GSAP.</>}
      lede={
        <>
          The Apple product page. The Stripe feature walkthrough. The sticky image with scrolling text.
          These all use the same pattern: pin an element in place while the page scrolls past it.
          Here&apos;s how to do it without GSAP — in <code>{total}</code> total.
        </>
      }
      facts={[
        { k: 'scrollPin alone', v: `${SELF_ENTRIES.pin.toFixed(1)} KB` },
        { k: 'Every API', v: `${SELF.gzipKb.toFixed(1)} KB` },
        { k: 'Callbacks', v: `${API.filter(([o]) => /^on(Enter|Leave)/.test(o)).length} + progress` },
        { k: 'Licence', v: SELF.license },
      ]}
      figure={
        <Figure n={1} caption="what scrollPin does: the viewport mid-pin, and where on the scroll each callback fires">
          <PinFigure />
        </Figure>
      }
      further={[
        { href: '/blog/replace-gsap-scrolltrigger', label: 'Replace GSAP ScrollTrigger', blurb: 'The full migration guide: fade, parallax, counters, text and video, side by side.' },
        { href: '/vs-gsap', label: 'Full GSAP comparison', blurb: 'Measured sizes, and where GSAP is still the better call.' },
        { href: '/docs', label: 'API Reference', blurb: 'Every option of every API.' },
      ]}
    >
      <Section id="what-pin-means" k="the idea" toc="What “pin” means" title={<>What &ldquo;pin&rdquo; means</>}>
        <p>
          A pinned element is fixed to a viewport position while the page scrolls a defined distance past it.
          When the scroll reaches the end of the &ldquo;pin zone&rdquo;, the element is released and continues with the page.
        </p>
        <p>
          GSAP ScrollTrigger built the mental model: <code>pin: true</code> + a scroll distance. svg-scroll-draw ships
          the same pattern as <code>scrollPin</code> in the <code>svg-scroll-draw/pin</code> sub-path.
        </p>
      </Section>

      <Section id="install" k="install" title="Install">
        <Code file="terminal">{`npm install svg-scroll-draw`}</Code>
      </Section>

      <Section id="simplest-pin" k="minimum" title="The simplest pin">
        <p>
          Pin <code>#panel</code> at the top of the viewport for one full viewport-height of scroll:
        </p>
        <Code file="app.js">{`import { scrollPin } from 'svg-scroll-draw/pin';

const instance = scrollPin('#panel', {
  pinDistance: window.innerHeight, // default
});

// Later: remove pin and restore the DOM
// instance.destroy();`}</Code>
        <p>
          That&apos;s it. <code>scrollPin</code> wraps the target in a spacer div (so the page layout doesn’t jump),
          applies <code>position: fixed</code> when the element hits the viewport top, and releases it when the pin zone ends.
        </p>
      </Section>

      <Section id="custom-position" k="top" title="Pin at a custom viewport position">
        <p>
          Use the <code>top</code> option to pin at a different viewport Y offset — e.g. 80px below the top (for a fixed navbar):
        </p>
        <Code file="app.js">{`scrollPin('#sticky-image', {
  top:         80,           // pin 80px from viewport top
  pinDistance: 600,          // hold for 600px of scroll
});`}</Code>
      </Section>

      <Section id="lifecycle" k="callbacks" title="Lifecycle callbacks">
        <p>Four callbacks mirror GSAP&apos;s ScrollTrigger API exactly:</p>
        <Code file="app.js">{`scrollPin('#feature-panel', {
  pinDistance: 800,
  onEnter:     () => panel.classList.add('active'),
  onLeave:     () => panel.classList.remove('active'),
  onEnterBack: () => panel.classList.add('active'),
  onLeaveBack: () => panel.classList.remove('active'),
});`}</Code>
        <Callout k="when">
          <Defs
            items={[
              ['onEnter', 'fires when scroll first reaches the pin zone (scrolling down).'],
              ['onLeave', 'fires when scroll exits the pin zone at the end (scrolling down).'],
              ['onEnterBack', 'fires when scroll re-enters the pin zone (scrolling back up).'],
              ['onLeaveBack', 'fires when scroll exits the pin zone at the start (scrolling back up).'],
            ]}
          />
        </Callout>
      </Section>

      <Section id="progress" k="onProgress" title="Progress callback">
        <p>
          Use <code>onProgress</code> to drive another animation while the element is pinned:
        </p>
        <Code file="app.js">{`import { scrollPin }    from 'svg-scroll-draw/pin';
import { scrollAnimate } from 'svg-scroll-draw';

// Fade in a caption as the user scrolls through the pin zone
scrollPin('#hero-image', {
  pinDistance: 600,
  onProgress: (p) => {
    // p is 0 → 1 through the pin zone
    caption.style.opacity = p.toFixed(3);
  },
});`}</Code>
      </Section>

      <Section id="apple-style" k="pattern" title="Apple-style: pin image, scroll text">
        <p>The classic pattern: image stays fixed while feature copy scrolls past it.</p>
        <Code file="feature-section.js">{`import { scrollPin }    from 'svg-scroll-draw/pin';
import { scrollAnimate } from 'svg-scroll-draw';

// Pin the product image
const pin = scrollPin('#product-image', {
  top:         80,
  pinDistance: window.innerHeight * 3,
  onEnter: () => image.src = '/hero-active.png',
});

// Animate each feature block as it scrolls in
document.querySelectorAll('.feature-block')
  .forEach(el => {
    scrollAnimate(el, {
      props: {
        opacity:   [0, 1],
        transform: ['translateY(32px)', 'translateY(0)'],
      },
      easing: 'ease-out',
      once:   true,
    });
  });`}</Code>
      </Section>

      <Section id="react" k="react" title="React usage">
        <Code file="FeatureSection.tsx">{`'use client';
import { useEffect, useRef } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function FeatureSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;
    const instance = scrollPin(imageRef.current, {
      top:         80,
      pinDistance: window.innerHeight * 2,
      onEnter:     () => console.log('pinned'),
      onLeave:     () => console.log('released'),
    });
    return () => instance.destroy();
  }, []);

  return (
    <section className="flex gap-16">
      <div ref={imageRef} className="w-1/2">
        <img src="/product.png" alt="Product" />
      </div>
      <div className="w-1/2 space-y-64 py-32">
        <p>Feature one text...</p>
        <p>Feature two text...</p>
        <p>Feature three text...</p>
      </div>
    </section>
  );
}`}</Code>
      </Section>

      <Section id="snapping" k="scrollSnap" title="Section snapping">
        <p>Often pin sections are combined with scroll snap. svg-scroll-draw ships both:</p>
        <Code file="app.js">{`import { scrollPin }  from 'svg-scroll-draw/pin';
import { scrollSnap } from 'svg-scroll-draw/snap';

// Snap between fullscreen sections
scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  onSnap:    (index) => console.log('section', index),
});

// Pin the nav while scrolling
scrollPin('#nav', {
  top:         0,
  pinDistance: document.body.scrollHeight,
});`}</Code>
      </Section>

      <Section id="cleanup" k="destroy · refresh" title="Cleanup">
        <p>
          Every <code>scrollPin</code> call returns an instance with <code>destroy()</code> and <code>refresh()</code>.
          Call <code>destroy()</code> in component cleanup / route change. Call <code>refresh()</code> if the page layout
          changes dynamically (accordion opens, dynamic content loads).
        </p>
        <Code file="app.js">{`const pin = scrollPin('#panel', { pinDistance: 600 });

// Recalculate after layout change
document.querySelector('#accordion').addEventListener('click', () => {
  pin.refresh();
});

// Remove on page unload
window.addEventListener('beforeunload', () => pin.destroy());`}</Code>
      </Section>

      <Section id="api" k="reference" title="Full API">
        <Table head={['Option', 'Type', 'Description']} rows={API.map(([o, t, d]) => [o, <code key="t">{t}</code>, d])} />
      </Section>
    </BlogArticle>
  );
}
