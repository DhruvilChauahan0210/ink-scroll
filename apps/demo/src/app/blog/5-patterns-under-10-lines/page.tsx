import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { PRESETS, type PresetName } from 'svg-scroll-draw';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Spec, Figure, Closing } from '@/components/blog/BlogArticle';
import { PresetFigure } from '@/components/blog/PresetFigure';
import { presetCode } from '@/components/blog/preset-sets';

export const metadata: Metadata = {
  title: seoTitle('5 SVG Scroll Animation Patterns in Under 10 Lines'),
  description:
    'Five SVG scroll animation patterns — logo reveal, sketch diagram, typewriter, cinematic hero, spring icon — each in 3 lines with svg-scroll-draw presets.',
  keywords: [
    'svg scroll animation examples',
    'svg scroll animation react',
    'scroll animation patterns',
    'svg path animation one liner',
    'svg-scroll-draw preset',
    'logo reveal scroll animation',
    'svg animation without gsap',
    'scroll animation under 10 lines',
  ],
  alternates: { canonical: '/blog/5-patterns-under-10-lines' },
  openGraph: {
    title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
    description: 'Logo reveal, sketch diagram, typewriter, cinematic hero, spring icon — each in 3 lines with svg-scroll-draw presets.',
    url: 'https://svg-scroll-draw.vercel.app/blog/5-patterns-under-10-lines',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
    description: '5 production-ready scroll animations, each in 3 lines. No GSAP. No config.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '5 SVG Scroll Animation Patterns in Under 10 Lines',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/5-patterns-under-10-lines',
};

const PATTERNS: {
  preset: PresetName;
  title: string;
  useCase: string;
  description: string;
  vanilla: string;
  react: string;
  when: string;
}[] = [
  {
    preset: 'reveal',
    title: 'Logo reveal',
    useCase: 'Hero sections, brand marks, above-the-fold SVG illustrations',
    description: 'The most common scroll animation. A logo or illustration draws in once as it enters the viewport, fades as it draws, and stays drawn. The reveal preset sets fade, ease-out, and once — the three options you\'d set manually every time.',
    vanilla: `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', { preset: 'reveal' });`,
    react: `import { ScrollDraw } from 'svg-scroll-draw/react';

function Logo() {
  return (
    <ScrollDraw preset="reveal">
      <svg>…</svg>
    </ScrollDraw>
  );
}`,
    when: 'Any SVG that should draw in once and stay visible. Default trigger (top bottom → bottom top) works well — the reveal feels fast and satisfying.',
  },
  {
    preset: 'sketch',
    title: 'Sketch diagram',
    useCase: 'Technical diagrams, infographics, process flows, architectural illustrations',
    description: 'Multi-path SVGs — diagrams, flowcharts, architecture drawings — look best when paths trace in one by one rather than all at once. The sketch preset adds a 0.1 stagger and uses ease-in so each line feels like a pen stroke.',
    vanilla: `scrollDraw('#architecture-diagram', { preset: 'sketch' });

// Or slow it down slightly for dense diagrams
scrollDraw('#circuit', { preset: 'sketch', speed: 0.7 });`,
    react: `<ScrollDraw preset="sketch">
  <svg>{/* your diagram SVG */}</svg>
</ScrollDraw>

{/* Override stagger for fewer paths */}
<ScrollDraw preset="sketch" stagger={0.2}>
  <svg>{/* 3-step flow */}</svg>
</ScrollDraw>`,
    when: 'Any SVG with 3+ paths. The stagger is proportional to the scroll range, so it always feels right regardless of the trigger window size.',
  },
  {
    preset: 'typewriter',
    title: 'Typewriter / sequential',
    useCase: 'Code snippets drawn as SVG, timeline steps, sequential data labels',
    description: 'When you want paths to appear quickly in strict sequence — like text being typed or steps in a timeline — the typewriter preset uses linear easing (mechanical, no easing in/out) with a tight 0.05 stagger and fast speed.',
    vanilla: `scrollDraw('#timeline-steps', { preset: 'typewriter' });

// Tighten the trigger window for a snappier effect
scrollDraw('#code-svg', {
  preset: 'typewriter',
  trigger: { start: 'top 70%', end: 'top 30%' },
});`,
    react: `<ScrollDraw preset="typewriter">
  <svg>{/* sequential path SVG */}</svg>
</ScrollDraw>`,
    when: 'Works best when paths have a natural left-to-right or top-to-bottom order. The linear easing gives it a robotic precision that fits code and data contexts.',
  },
  {
    preset: 'cinematic',
    title: 'Cinematic hero',
    useCase: 'Landing page heroes, scroll storytelling, large showcase illustrations',
    description: 'Slow, deliberate, and dramatic. The cinematic preset draws over a longer scroll range (speed: 0.75) with ease-in-out so it accelerates into and decelerates out of the draw, plus a fade for a film-like reveal. Perfect for full-width hero SVGs.',
    vanilla: `scrollDraw('#hero-illustration', { preset: 'cinematic' });

// Add strokeColor for extra drama
scrollDraw('#hero', {
  preset: 'cinematic',
  strokeColor: ['#333', '#ff90e8'],
});`,
    react: `<ScrollDraw
  preset="cinematic"
  strokeColor={['#333', '#ff90e8']}
>
  <svg>{/* hero illustration */}</svg>
</ScrollDraw>`,
    when: 'Use on large SVGs that deserve attention. Pair with a sticky section so the SVG draws as the user scrolls through a full viewport height.',
  },
  {
    preset: 'spring',
    title: 'Spring / playful',
    useCase: 'Icons, small decorative elements, UI feedback SVGs, loading indicators',
    description: 'Spring easing overshoots past 1.0 and settles back — giving small SVGs a bouncy, alive feeling that linear and ease-out never capture. Great for icons and micro-animations where you want personality, not polish.',
    vanilla: `scrollDraw('#check-icon',   { preset: 'spring' });
scrollDraw('#star-rating', { preset: 'spring', stagger: 0.08 });`,
    react: `{/* React icon with spring + stagger */}
<ScrollDraw preset="spring" stagger={0.08}>
  <svg>{/* star or check icon */}</svg>
</ScrollDraw>`,
    when: 'Best on small, simple paths (icons, badges, decorative marks). Avoid on complex multi-path SVGs where the overshoot looks chaotic.',
  },
];

export default function Page() {
  return (
    <BlogArticle
      slug="5-patterns-under-10-lines"
      jsonLd={jsonLd}
      tags={PATTERNS.map((p) => `preset: ${p.preset}`)}
      title={<>{PATTERNS.length} scroll animation patterns, <span className="b2-dim-t">each under 10 lines</span></>}
      lede={
        <>
          The five scroll animation patterns behind most real-world SVG scroll effects — each in 3 lines using
          svg-scroll-draw presets. No config, no GSAP, no boilerplate.
        </>
      }
      facts={[
        { k: 'Presets', v: Object.keys(PRESETS).length },
        { k: 'Config', v: 'one option' },
        { k: 'Main entry', v: `${SELF.gzipKb.toFixed(1)} KB` },
        { k: 'Licence', v: SELF.license },
      ]}
      figure={
        <Figure n={1} caption="each preset's draw curve, computed from its real options — speed > 1 finishes early (the dashed tick), stagger draws later paths after the first, spring overshoots">
          <PresetFigure order={PATTERNS.map((p) => p.preset)} />
        </Figure>
      }
    >
      {PATTERNS.map((p) => (
        <Section key={p.preset} id={p.preset} k={`preset: '${p.preset}'`} title={p.title}>
          <p><strong>Use case:</strong> {p.useCase}</p>
          <p>{p.description}</p>
          <Spec items={[{ k: 'the preset sets', v: presetCode(p.preset) }]} />
          <div className="ba-cmp">
            <div className="ba-cmp-col">
              <p className="ba-cmp-k"><span>vanilla</span>JavaScript</p>
              <Code file="app.js">{p.vanilla}</Code>
            </div>
            <div className="ba-cmp-col">
              <p className="ba-cmp-k"><span>react</span>svg-scroll-draw/react</p>
              <Code file="Component.tsx">{p.react}</Code>
            </div>
          </div>
          <Callout k="when to use">{p.when}</Callout>
        </Section>
      ))}

      <Section id="override" k="bonus" title="Override any preset value">
        <p>
          Presets are just defaults. Pass any option alongside <code>preset</code> to override:
        </p>
        <Code file="app.js">{`// reveal but with spring easing instead of ease-out
scrollDraw('#logo', { preset: 'reveal', easing: 'spring' });

// sketch but slower and with color animation
scrollDraw('#diagram', {
  preset: 'sketch',
  speed:        0.6,
  strokeColor:  ['#aaa', '#ff90e8'],
});

// Inspect what a preset sets
import { PRESETS } from 'svg-scroll-draw';
console.log(PRESETS.cinematic);
// { ${presetCode('cinematic')} }`}</Code>
      </Section>

      <Closing
        title="Try the presets live"
        lede="Open the Playground, select a preset from the Motion tab, and see the effect instantly"
        links={[
          { href: '/playground', label: 'Playground →' },
          { href: '/examples', label: 'Examples →' },
        ]}
      />
    </BlogArticle>
  );
}
