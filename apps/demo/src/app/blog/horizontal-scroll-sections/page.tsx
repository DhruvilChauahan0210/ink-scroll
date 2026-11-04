import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Table, Figure } from '@/components/blog/BlogArticle';
import { HorizontalFigure } from '@/components/blog/HorizontalFigure';
import { STRIP_RECIPE } from '@/components/recipes/strip-recipe';
import { StripFiles, StripPitfalls, StripSteps } from '@/components/recipes/StripRecipe';
import { readRecipeFiles } from '@/recipes/read';

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
  dateModified: '2026-11-05',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections' },
};

const API: [string, string, string][] = [
  ['distance', 'number', 'Horizontal travel in px. Default: the track’s width minus the sticky stage’s content box, measured again whenever the layout changes. Leave it out unless you want a fixed number'],
  ['easing', 'EasingName | fn', 'Easing for horizontal movement. Default: linear'],
  ['trigger', 'TriggerConfig', 'Scroll window. Default: top top → bottom bottom'],
  ['scrollContainer', 'string | Element', 'Custom scroll container. Default: window'],
  ['triggerElement', 'string | Element', 'Element whose height is the scroll runway. Default: the container of the nearest position:sticky ancestor'],
  ['respectReducedMotion', 'boolean', 'Default: false. The scrub advances only as the user scrolls, and holding a final state would hide every panel but one'],
  ['onProgress', '(p: number) => void', 'Progress 0–1 through the horizontal travel'],
];

export default function Page() {
  const files = readRecipeFiles('horizontal-scroll-sections');
  if (!files) throw new Error('the horizontal-scroll-sections recipe files are missing');
  const steps = STRIP_RECIPE.steps.length;
  const problems = STRIP_RECIPE.pitfalls.length;

  return (
    <BlogArticle
      slug="horizontal-scroll-sections"
      jsonLd={articleJsonLd}
      tags={['scrollHorizontal', 'svg-scroll-draw/horizontal', 'no GSAP']}
      title={<>Horizontal scroll sections without GSAP.</>}
      lede={
        <>
          Apple does it. Stripe does it. Linear does it. Vertical scroll drives horizontal movement, and
          it&apos;s one of the most striking effects on the web. Here it is as a real component, a strip of
          case studies, built in {steps} steps, with the files run in a browser and the {problems} ways it
          goes wrong measured.
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

      <Section id="build" k={`${steps} steps`} title="Build it, step by step">
        <StripSteps fig={2} />
      </Section>

      <Section id="files" k="the whole file" title="The complete component">
        <StripFiles files={files} fig={3} />
      </Section>

      <Section id="wrong" k={`${problems} problems`} title="Where it goes wrong">
        <StripPitfalls />
      </Section>

      <Section id="runway" k="triggerElement" title="Which element sets the runway">
        <p>
          The scroll window is measured from the outer container, not the track. The track can’t supply it:
          the sticky stage pins the track at exactly one viewport tall, so measuring against it would put the
          start and end of the window at the same scroll position, and nothing would move.{' '}
          <code>scrollHorizontal</code> finds the outer container for you by walking up to the nearest{' '}
          <code>position: sticky</code> ancestor and taking its parent, which is the structure above.
        </p>
        <p>
          If your layout doesn&apos;t use a sticky stage — a custom pinning approach, or a nested scroll container — pass
          the element that owns the scroll length explicitly:
        </p>
        <Code file="app.js">{`scrollHorizontal(track, {
  triggerElement: '#outer',   // the element whose height is the scroll runway
});`}</Code>
      </Section>

      <Section id="api" k="reference" title="API">
        <Table head={['Option', 'Type', 'Description']} rows={API.map(([o, t, d]) => [o, <code key="t">{t}</code>, d])} />
      </Section>
    </BlogArticle>
  );
}
