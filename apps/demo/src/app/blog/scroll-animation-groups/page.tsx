import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { GroupFigure } from './GroupFigure';

export const metadata: Metadata = {
  title: seoTitle('Animate Multiple Elements on Scroll — Group APIs'),
  description:
    'Animate many elements on scroll, together or in sequence: scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup and scrollDrawGroup, with code.',
  keywords: [
    'animate multiple elements on scroll',
    'scroll animation group javascript',
    'fan out scroll animation',
    'stagger elements on scroll',
    'scroll animation sequence',
    'scrollAnimateGroup',
    'scrollParallaxGroup',
    'parallax multiple elements',
    'scroll animation multiple divs',
    'animate list items on scroll',
    'cascade scroll animation',
    'scroll animation without gsap',
    'gsap scrolltrigger batch alternative',
    'animate grid on scroll',
  ],
  alternates: { canonical: '/blog/scroll-animation-groups' },
  openGraph: {
    title: 'Animate multiple elements on scroll — Group APIs',
    description: 'scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup — fan-out scroll animations across multiple elements with one call.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-groups',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animate multiple elements on scroll — Group APIs',
    description: 'Fan-out, cascade, or parallax — one call, any number of elements.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Animate multiple elements on scroll — scrollAnimateGroup, scrollParallaxGroup',
  description: 'How to animate multiple HTML elements simultaneously or in sequence on scroll using svg-scroll-draw group APIs. scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup — with copy-paste examples.',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-groups',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-groups' },
};

/** [function, behaviour, options type] — the API summary table. */
const API: [string, string, string][] = [
  ['scrollAnimateGroup', 'All elements animate simultaneously', 'ScrollAnimateOptions'],
  ['scrollAnimateSequence', 'Each starts only after the previous completes', 'ScrollAnimateOptions'],
  ['scrollParallaxGroup', 'All elements parallax at the same speed', 'ScrollParallaxOptions'],
  ['scrollDrawGroup', 'All SVG containers draw simultaneously', 'ScrollDrawOptions'],
  ['scrollDrawSequence', 'SVG containers draw in strict sequence', 'ScrollDrawOptions'],
];

/** The methods every group call's combined instance carries. */
const METHODS = ['destroy', 'replay', 'pause', 'resume', 'seek', 'getProgress'];

export default function BlogScrollAnimationGroups() {
  return (
    <BlogArticle
      slug="scroll-animation-groups"
      jsonLd={articleJsonLd}
      tags={['svg-scroll-draw/group', 'stagger', 'parallax']}
      title={<>Animate multiple elements on scroll — one call</>}
      lede={
        <>
          Every real landing page needs more than one animated element. svg-scroll-draw ships four group APIs for
          fan-out, cascade, and parallax — all in <code>svg-scroll-draw/group</code>.
        </>
      }
      facts={[
        { k: 'Group functions', v: String(API.length) },
        { k: 'Instances returned', v: 'one per call' },
        { k: 'Instance methods', v: String(METHODS.length) },
        { k: 'Licence', v: SELF.license },
      ]}
      figure={
        <Figure n={1} caption="the two ways to animate a set, over the section's scroll — together from each element's own position, or one after another">
          <GroupFigure />
        </Figure>
      }
    >
      <Section id="the-problem" k="before" title="The problem with animating many elements">
        <p>
          When you have a feature grid, testimonials row, or pricing table, you end up writing the same{' '}
          <code>scrollAnimate</code> call for every element:
        </p>
        <Code file="before.js">{`// Before group APIs — repetitive and brittle
scrollAnimate(card1, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });
scrollAnimate(card2, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });
scrollAnimate(card3, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });

// And you have to track all three instances for cleanup:
// inst1.destroy(); inst2.destroy(); inst3.destroy();`}</Code>
        <p>
          The group APIs collapse this to one call that returns a single combined instance — <code>destroy()</code> cleans
          up everything at once.
        </p>
      </Section>

      <Section id="scrollAnimateGroup" k="fan-out" toc="scrollAnimateGroup" title={<><code className="gp-code">scrollAnimateGroup</code> — fan-out simultaneously</>}>
        <p>
          All elements animate at the same time as the section scrolls into view. Each tracks its own scroll position
          independently, so elements higher on the page reveal slightly before lower ones — natural cascade for free.
        </p>
        <Code file="feature-grid.js">{`import { scrollAnimateGroup } from 'svg-scroll-draw/group';

// All cards animate simultaneously — same options, one call
const group = scrollAnimateGroup(
  document.querySelectorAll('.feature-card'),
  {
    props: {
      opacity:   [0, 1],
      transform: ['translateY(40px)', 'translateY(0)'],
    },
    easing: 'ease-out',
    once:   true,
  }
);

// Full instance API on the whole group
group.replay();   // replay all
group.pause();    // pause all
group.destroy();  // cleanup on unmount`}</Code>

        <h3 className="ba-h3">React</h3>
        <Code file="FeatureGrid.tsx">{`import { useEffect, useRef } from 'react';
import { scrollAnimateGroup } from 'svg-scroll-draw/group';

export function FeatureGrid({ features }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.card');
    const group = scrollAnimateGroup(Array.from(cards), {
      props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
      easing: 'ease-out',
      once:   true,
    });
    return () => group.destroy();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-6">
      {features.map(f => (
        <div key={f.id} className="card p-6 rounded-2xl border">
          <h3>{f.title}</h3>
          <p>{f.description}</p>
        </div>
      ))}
    </div>
  );
}`}</Code>

        <Callout k="trigger offsets">
          <strong>Trigger offsets for free:</strong> Because each element computes its own scroll position, a card near the
          top of the grid will reveal before a card at the bottom — even with identical trigger settings. No manual offset
          needed.
        </Callout>
      </Section>

      <Section id="scrollAnimateSequence" k="cascade" toc="scrollAnimateSequence" title={<><code className="gp-code">scrollAnimateSequence</code> — cascade one by one</>}>
        <p>
          Each element starts only after the previous one reaches 100%. Perfect for step-by-step reveals, numbered lists, or
          onboarding flows.
        </p>
        <Code file="steps.js">{`import { scrollAnimateSequence } from 'svg-scroll-draw/group';

// Step 1 animates fully, then step 2 starts, then step 3
scrollAnimateSequence(
  document.querySelectorAll('.onboarding-step'),
  {
    props: {
      opacity:   [0, 1],
      transform: ['translateX(-24px)', 'translateX(0)'],
    },
    easing:     'ease-out',
    onComplete: () => console.log('a step finished'),
  }
);`}</Code>
        <p>
          Internally each step is forced to <code>once: true</code> so completing a step and scrolling back doesn’t
          reset it and break the chain.
        </p>
      </Section>

      <Section id="scrollParallaxGroup" k="parallax" toc="scrollParallaxGroup" title={<><code className="gp-code">scrollParallaxGroup</code> — multi-layer parallax</>}>
        <p>
          Apply the same parallax speed to multiple elements at once. Typical use: floating UI badges, background texture
          elements, or decorative shapes that all move at the same rate.
        </p>
        <Code file="hero.js">{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';

// All three decorative shapes float upward at 30% of scroll speed
scrollParallaxGroup(
  ['#circle-1', '#circle-2', '#dot-cluster'],
  { speed: 0.3 }
);

// Background layer drifts opposite direction
scrollParallaxGroup(
  ['#bg-gradient', '#noise-overlay'],
  { speed: -0.15 }
);`}</Code>

        <h3 className="ba-h3">Multi-layer depth effect</h3>
        <p>
          Call <code>scrollParallaxGroup</code> multiple times with different speeds for a classic depth illusion:
        </p>
        <Code file="parallax-layers.js">{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';

// Far background — moves slowest
scrollParallaxGroup(['.layer-far'],  { speed: 0.1 });

// Mid layer
scrollParallaxGroup(['.layer-mid'],  { speed: 0.25 });

// Near foreground — moves fastest
scrollParallaxGroup(['.layer-near'], { speed: 0.5 });

// Floating UI elements — drift opposite direction
scrollParallaxGroup(['.badge', '.tag', '.pill'], { speed: -0.2 });`}</Code>
      </Section>

      <Section id="scrollDrawGroup" k="SVG" toc="scrollDrawGroup" title={<><code className="gp-code">scrollDrawGroup</code> — SVG paths in sync</>}>
        <p>
          The original group API — animate multiple SVG containers simultaneously with <code>scrollDraw</code>. Same
          pattern: one call, combined instance.
        </p>
        <Code file="icons.js">{`import { scrollDrawGroup, scrollDrawSequence } from 'svg-scroll-draw/group';

// Three SVG icons draw at the same time
const group = scrollDrawGroup(
  ['#icon-speed', '#icon-size', '#icon-framework'],
  { easing: 'ease-out', fade: true, once: true }
);

// Or draw them in sequence (speed → size → framework)
const seq = scrollDrawSequence(
  ['#icon-speed', '#icon-size', '#icon-framework'],
  { easing: 'spring', fade: true }
);`}</Code>
      </Section>

      <Section id="patterns" k="real-world" title="Real-world patterns">
        <h3 className="ba-h3">Pricing section — staggered cards + counters</h3>
        <Code file="pricing.js">{`import { scrollAnimateGroup } from 'svg-scroll-draw/group';
import { scrollCounter } from 'svg-scroll-draw';

// Pricing cards fan in
scrollAnimateGroup(document.querySelectorAll('.pricing-card'), {
  props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  easing: 'ease-out',
  once:   true,
});

// Price numbers count up independently
document.querySelectorAll('.price-number').forEach((el, i) => {
  const prices = [9, 29, 79];
  scrollCounter(el, {
    to:     prices[i],
    format: n => '$' + Math.round(n),
    easing: 'ease-out',
    once:   true,
    trigger: { start: \`top \${85 - i * 5}%\`, end: \`top \${50 - i * 5}%\` },
  });
});`}</Code>

        <h3 className="ba-h3">Hero with parallax depth + text reveal</h3>
        <Code file="hero-section.js">{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';
import { scrollText } from 'svg-scroll-draw/text';

// Background layers drift at different depths
scrollParallaxGroup(['.bg-blur', '.bg-gradient'], { speed: 0.12 });
scrollParallaxGroup(['.hero-badge', '.hero-dot'],  { speed: -0.18 });

// Headline reveals word by word on top
scrollText('#hero-headline', {
  split:   'words',
  stagger: 0.06,
  from:    { opacity: 0, y: 32 },
  once:    true,
});`}</Code>

        <h3 className="ba-h3">Feature list — sequential entrance</h3>
        <Code file="feature-list.js">{`import { scrollAnimateSequence } from 'svg-scroll-draw/group';

// Each feature row slides in after the previous one
scrollAnimateSequence(
  document.querySelectorAll('.feature-row'),
  {
    props: {
      opacity:   [0, 1],
      transform: ['translateX(-20px)', 'translateX(0)'],
    },
    easing: 'ease-out',
  }
);`}</Code>
      </Section>

      <Section id="api" k="reference" title="API summary">
        <Table
          head={['Function', 'Behaviour', 'Options type']}
          rows={API.map(([fn, desc, type]) => [fn, desc, <code key="t">{type}</code>])}
        />
        <p>
          All functions return a combined <code>ScrollDrawInstance</code> with{' '}
          {METHODS.map((m, i) => (
            <span key={m}>
              <code>{m}</code>
              {i < METHODS.length - 2 ? ', ' : i === METHODS.length - 2 ? ', and ' : ''}
            </span>
          ))}
          . All are available in <code>svg-scroll-draw/group</code>.
        </p>
      </Section>

      <Closing
        title="See a group run"
        lede="The live example animates a whole grid from one call; the docs list every option it takes."
        links={[
          { href: '/examples#scroll-animate-group', label: 'See live example →' },
          { href: '/docs#scroll-animate', label: 'Full API docs →' },
        ]}
      />
    </BlogArticle>
  );
}
