import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'Animate multiple elements on scroll — scrollAnimateGroup, scrollParallaxGroup',
  description:
    'How to animate multiple HTML elements simultaneously or in sequence on scroll using svg-scroll-draw group APIs. scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup — with copy-paste examples.',
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

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
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

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl my-5 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display font-extrabold text-[clamp(20px,3vw,28px)] tracking-[-0.03em] leading-tight mt-14 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-bold text-[clamp(16px,2vw,20px)] tracking-[-0.02em] mt-8 mb-3">
      {children}
    </h3>
  );
}

export default function BlogScrollAnimationGroups() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/docs"      className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Docs</Link>
          <Link href="/examples"  className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Examples</Link>
          <Link href="/blog"      className="text-xs px-3.5 py-1.5 rounded-full border border-pitch-black bg-pitch-black text-light-linen font-medium">Blog</Link>
          <Link href="/changelog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Changelog</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono">v2.6.0</a>
          <a href={GH}  target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium">GitHub →</a>
        </div>
        <div className="flex lg:hidden">
          <MobileMenu />
        </div>
      </nav>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-creator-pink/20 text-pitch-black border border-creator-pink/30">Group APIs</span>
            <span className="text-[10px] font-mono text-graphite-border">June 2026 · 7 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,5vw,52px)] leading-[0.95] tracking-[-0.04em] mb-5">
            Animate multiple elements<br />on scroll — one call.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed">
            Every real landing page needs more than one animated element. svg-scroll-draw ships four group APIs for fan-out, cascade, and parallax — all in <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">svg-scroll-draw/group</code>.
          </p>
        </div>

        {/* TOC */}
        <nav className="rounded-2xl border border-subtle-ash bg-marketplace-gray px-5 py-4 mb-10 text-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-graphite-border mb-3">In this post</p>
          <ol className="space-y-1.5 text-[13px]">
            <li><a href="#the-problem" className="hover:text-pitch-black transition-colors text-graphite-border">1. The problem with animating many elements</a></li>
            <li><a href="#scrollAnimateGroup" className="hover:text-pitch-black transition-colors text-graphite-border">2. scrollAnimateGroup — fan-out simultaneously</a></li>
            <li><a href="#scrollAnimateSequence" className="hover:text-pitch-black transition-colors text-graphite-border">3. scrollAnimateSequence — cascade one by one</a></li>
            <li><a href="#scrollParallaxGroup" className="hover:text-pitch-black transition-colors text-graphite-border">4. scrollParallaxGroup — multi-layer parallax</a></li>
            <li><a href="#scrollDrawGroup" className="hover:text-pitch-black transition-colors text-graphite-border">5. scrollDrawGroup — SVG paths in sync</a></li>
            <li><a href="#patterns" className="hover:text-pitch-black transition-colors text-graphite-border">6. Real-world patterns</a></li>
            <li><a href="#api" className="hover:text-pitch-black transition-colors text-graphite-border">7. API summary</a></li>
          </ol>
        </nav>

        {/* 1 */}
        <H2 id="the-problem">1. The problem with animating many elements</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          When you have a feature grid, testimonials row, or pricing table, you end up writing the same <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">scrollAnimate</code> call for every element:
        </p>
        <CodeBlock file="before.js">
{`// Before group APIs — repetitive and brittle
scrollAnimate(card1, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });
scrollAnimate(card2, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });
scrollAnimate(card3, { props: { opacity: [0, 1] }, easing: 'ease-out', once: true });

// And you have to track all three instances for cleanup:
// inst1.destroy(); inst2.destroy(); inst3.destroy();`}
        </CodeBlock>
        <p className="text-[15px] text-graphite-border leading-relaxed">
          The group APIs collapse this to one call that returns a single combined instance — <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">destroy()</code> cleans up everything at once.
        </p>

        {/* 2 */}
        <H2 id="scrollAnimateGroup">2. scrollAnimateGroup — fan-out simultaneously</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          All elements animate at the same time as the section scrolls into view. Each tracks its own scroll position independently, so elements higher on the page reveal slightly before lower ones — natural cascade for free.
        </p>
        <CodeBlock file="feature-grid.js">
{`import { scrollAnimateGroup } from 'svg-scroll-draw/group';

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
group.destroy();  // cleanup on unmount`}
        </CodeBlock>

        <H3>React</H3>
        <CodeBlock file="FeatureGrid.tsx">
{`import { useEffect, useRef } from 'react';
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
}`}
        </CodeBlock>

        <Callout>
          <strong>Trigger offsets for free:</strong> Because each element computes its own scroll position, a card near the top of the grid will reveal before a card at the bottom — even with identical trigger settings. No manual offset needed.
        </Callout>

        {/* 3 */}
        <H2 id="scrollAnimateSequence">3. scrollAnimateSequence — cascade one by one</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          Each element starts only after the previous one reaches 100%. Perfect for step-by-step reveals, numbered lists, or onboarding flows.
        </p>
        <CodeBlock file="steps.js">
{`import { scrollAnimateSequence } from 'svg-scroll-draw/group';

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
);`}
        </CodeBlock>
        <p className="text-[14px] text-graphite-border leading-relaxed">
          Internally each step is forced to <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">once: true</code> so completing a step and scrolling back doesn&apos;t reset it and break the chain.
        </p>

        {/* 4 */}
        <H2 id="scrollParallaxGroup">4. scrollParallaxGroup — multi-layer parallax</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          Apply the same parallax speed to multiple elements at once. Typical use: floating UI badges, background texture elements, or decorative shapes that all move at the same rate.
        </p>
        <CodeBlock file="hero.js">
{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';

// All three decorative shapes float upward at 30% of scroll speed
scrollParallaxGroup(
  ['#circle-1', '#circle-2', '#dot-cluster'],
  { speed: 0.3 }
);

// Background layer drifts opposite direction
scrollParallaxGroup(
  ['#bg-gradient', '#noise-overlay'],
  { speed: -0.15 }
);`}
        </CodeBlock>

        <H3>Multi-layer depth effect</H3>
        <p className="text-[14px] text-graphite-border leading-relaxed mb-3">
          Call <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">scrollParallaxGroup</code> multiple times with different speeds for a classic depth illusion:
        </p>
        <CodeBlock file="parallax-layers.js">
{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';

// Far background — moves slowest
scrollParallaxGroup(['.layer-far'],  { speed: 0.1 });

// Mid layer
scrollParallaxGroup(['.layer-mid'],  { speed: 0.25 });

// Near foreground — moves fastest
scrollParallaxGroup(['.layer-near'], { speed: 0.5 });

// Floating UI elements — drift opposite direction
scrollParallaxGroup(['.badge', '.tag', '.pill'], { speed: -0.2 });`}
        </CodeBlock>

        {/* 5 */}
        <H2 id="scrollDrawGroup">5. scrollDrawGroup — SVG paths in sync</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          The original group API — animate multiple SVG containers simultaneously with <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">scrollDraw</code>. Same pattern: one call, combined instance.
        </p>
        <CodeBlock file="icons.js">
{`import { scrollDrawGroup, scrollDrawSequence } from 'svg-scroll-draw/group';

// Three SVG icons draw at the same time
const group = scrollDrawGroup(
  ['#icon-speed', '#icon-size', '#icon-framework'],
  { easing: 'ease-out', fade: true, once: true }
);

// Or draw them in sequence (speed → size → framework)
const seq = scrollDrawSequence(
  ['#icon-speed', '#icon-size', '#icon-framework'],
  { easing: 'spring', fade: true }
);`}
        </CodeBlock>

        {/* 6 */}
        <H2 id="patterns">6. Real-world patterns</H2>

        <H3>Pricing section — staggered cards + counters</H3>
        <CodeBlock file="pricing.js">
{`import { scrollAnimateGroup } from 'svg-scroll-draw/group';
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
});`}
        </CodeBlock>

        <H3>Hero with parallax depth + text reveal</H3>
        <CodeBlock file="hero-section.js">
{`import { scrollParallaxGroup } from 'svg-scroll-draw/group';
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
});`}
        </CodeBlock>

        <H3>Feature list — sequential entrance</H3>
        <CodeBlock file="feature-list.js">
{`import { scrollAnimateSequence } from 'svg-scroll-draw/group';

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
);`}
        </CodeBlock>

        {/* 7 */}
        <H2 id="api">7. API summary</H2>
        <div className="overflow-x-auto my-5">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-pitch-black text-light-linen">
                <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Function</th>
                <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Behaviour</th>
                <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Options type</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['scrollAnimateGroup', 'All elements animate simultaneously', 'ScrollAnimateOptions'],
                ['scrollAnimateSequence', 'Each starts only after the previous completes', 'ScrollAnimateOptions'],
                ['scrollParallaxGroup', 'All elements parallax at the same speed', 'ScrollParallaxOptions'],
                ['scrollDrawGroup', 'All SVG containers draw simultaneously', 'ScrollDrawOptions'],
                ['scrollDrawSequence', 'SVG containers draw in strict sequence', 'ScrollDrawOptions'],
              ].map(([fn, desc, type]) => (
                <tr key={fn} className="border-b border-subtle-ash">
                  <td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-pitch-black">{fn}</td>
                  <td className="px-4 py-2.5 text-graphite-border">{desc}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-graphite-border">{type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[14px] text-graphite-border leading-relaxed">
          All functions return a combined <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">ScrollDrawInstance</code> with{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">destroy</code>,{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">replay</code>,{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">pause</code>,{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">resume</code>,{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">seek</code>, and{' '}
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">getProgress</code>.
          All are available in <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">svg-scroll-draw/group</code>.
        </p>

        {/* CTA */}
        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/examples#scroll-animate-group" className="text-sm px-5 py-2.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium shadow-[2px_2px_0px_#000]">
            See live example →
          </Link>
          <Link href="/docs#scroll-animate" className="text-sm px-5 py-2.5 rounded-full border-2 border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">
            Full API docs →
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-subtle-ash flex flex-wrap items-center justify-between gap-4">
          <Link href="/blog" className="text-[13px] text-graphite-border hover:text-pitch-black transition-colors">← Back to blog</Link>
          <span className="text-[11px] font-mono text-graphite-border">svg-scroll-draw · MIT · ~9 KB</span>
        </div>

      </article>
    </div>
  );
}
