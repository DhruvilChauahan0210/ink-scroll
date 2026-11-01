import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { COMPETITORS, MEASURED_ON, SELF, SELF_ENTRIES } from '@/data/competitors';
import { BlogArticle, Section, Code, Compare, Callout, Table, Figure } from '@/components/blog/BlogArticle';
import { RevealFigure, type RevealPart } from '@/components/blog/RevealFigure';

// Every size and date on this page comes from data/competitors.ts.
const APPROX = `~${Math.round(SELF.gzipKb)} KB`;
const AOS = COMPETITORS.aos;
const SR = COMPETITORS.scrollreveal;
const kb = (n: number) => `${n.toFixed(1)} KB`;
const year = (iso: string | null) => (iso ? iso.slice(0, 4) : 'unknown');

/** AOS ships a script and a required stylesheet; the measured command lists both. */
function aosParts(): RevealPart[] {
  const js = AOS.command.match(/aos\.js \(([\d.]+)\)/);
  const css = AOS.command.match(/aos\.css \(([\d.]+)\)/);
  if (!js || !css) return [{ name: 'aos', kb: AOS.gzipKb }];
  return [
    { name: 'aos.js', kb: Number(js[1]) },
    { name: 'aos.css', kb: Number(css[1]) },
  ];
}

export const metadata: Metadata = {
  title: seoTitle('Replace AOS and ScrollReveal.js with One Call'),
  description:
    'Replace AOS and ScrollReveal.js with one scrollReveal call: 7 presets, stagger, custom easing, no data attributes, no config files. Typed, MIT.',
  keywords: [
    'AOS alternative',
    'ScrollReveal.js alternative',
    'replace AOS',
    'animate on scroll javascript',
    'scroll reveal animation',
    'fade in on scroll',
    'scroll animation library',
    'aos js alternative',
    'scrollreveal js replacement',
    'reveal on scroll javascript',
    'scroll driven animation',
    'intersection observer animation',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal' },
  openGraph: {
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description: `scrollReveal — 7 presets, stagger, custom easing, no data attributes. Part of svg-scroll-draw (${APPROX}).`,
    url: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description: 'One import. One call. 7 presets. Zero config files.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Replace AOS / ScrollReveal.js — svg-scroll-draw scrollReveal',
  description: 'Drop-in replacement for AOS and ScrollReveal.js. One function call, 7 named presets, stagger, custom easing — no data attributes.',
  url: 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/replace-aos-scrollreveal' },
};

const MIGRATION: [string, string][] = [
  ['data-aos="fade-up"', "scrollReveal('.el') // default"],
  ['data-aos="fade-left"', "scrollReveal('.el', { preset: 'fadeLeft' })"],
  ['data-aos="zoom-in"', "scrollReveal('.el', { preset: 'scale' })"],
  ['data-aos="flip-up"', "scrollReveal('.el', { preset: 'flip' })"],
  ['data-aos-delay="100"', 'stagger: 0.1'],
  ['data-aos-duration="800"', "trigger: { start: 'top 85%', end: 'top 50%' }"],
  ['data-aos-once="true"', 'once: true (default)'],
  ['AOS.init({ once: true })', "scrollReveal('.el', { once: true })"],
  ['AOS.refresh()', 'instance.destroy(); scrollReveal(...)'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="replace-aos-scrollreveal"
      jsonLd={articleJsonLd}
      tags={['scrollReveal', 'AOS', 'ScrollReveal.js']}
      title={<>Replace AOS and ScrollReveal.js with one function call.</>}
      lede={
        <>
          AOS and ScrollReveal.js work — but they require data attributes on every element,
          separate config files, and add another library to your bundle. <code>scrollReveal</code> from
          svg-scroll-draw does the same job in a single JS call with zero markup changes.
        </>
      }
      facts={[
        { k: 'scrollReveal alone', v: kb(SELF_ENTRIES.reveal) },
        { k: `${AOS.label} + its CSS`, v: kb(AOS.gzipKb) },
        { k: SR.label, v: `${kb(SR.gzipKb)} · ${SR.license}` },
        { k: 'Licence', v: SELF.license },
      ]}
      figure={
        <Figure n={1} caption={<>what each ships to fade a grid of cards in, to one scale · measured {MEASURED_ON}</>}>
          <RevealFigure
            kits={[
              {
                title: AOS.label,
                note: AOS.license,
                parts: aosParts(),
                setup: [
                  { name: 'data-aos="…"', note: 'on every element' },
                  { name: 'AOS.init()', note: 'before anything moves' },
                ],
              },
              {
                title: SR.label,
                note: SR.license,
                parts: [{ name: 'scrollreveal', kb: SR.gzipKb }],
                setup: [{ name: 'ScrollReveal()', note: '.reveal() per selector' }],
              },
              {
                title: 'svg-scroll-draw/reveal',
                note: SELF.license,
                parts: [{ name: 'scrollReveal', kb: SELF_ENTRIES.reveal }],
                setup: [{ name: "scrollReveal('.card')", note: 'one call, no markup' }],
                self: true,
              },
            ]}
          />
        </Figure>
      }
      further={[
        { href: '/blog/replace-gsap-scrolltrigger', label: 'Replace GSAP ScrollTrigger', blurb: 'The same move for ScrollTrigger: fade, parallax, counters, text and video, side by side.' },
        { href: '/vs-gsap', label: 'Full GSAP comparison', blurb: 'Measured sizes, and where GSAP is still the better call.' },
        { href: '/docs', label: 'API Reference', blurb: 'Every option of every API.' },
      ]}
    >
      <Section id="the-problem" k="why switch" title="The problem with AOS and ScrollReveal.js">
        <p>
          Both libraries work well for simple cases. But they have the same fundamental design: scroll animation is
          configured via <strong>HTML data attributes</strong> — <code>data-aos=&quot;fade-up&quot;</code> or{' '}
          <code>data-sr-id</code>. This means:
        </p>
        <ul>
          <li>Animations are scattered across your HTML — hard to trace, hard to change globally</li>
          <li>No type safety — a typo in a data attribute silently does nothing</li>
          <li>Data attributes mix concerns — presentation logic in HTML, not JavaScript</li>
          <li>
            Both add a library to your bundle just for fade-in effects — {AOS.label} {kb(AOS.gzipKb)} with its required
            stylesheet, {SR.label} {kb(SR.gzipKb)} — against {kb(SELF_ENTRIES.reveal)} for <code>scrollReveal</code> alone
          </li>
          <li>ScrollReveal.js is not actively maintained (last release: {year(SR.lastPublish)}), and it is {SR.license} rather than MIT</li>
        </ul>
        <p>
          <code>scrollReveal</code> from svg-scroll-draw is the JS-first alternative: all configuration lives in your
          JavaScript, it’s fully typed, and it’s part of a broader scroll animation platform — not a standalone
          one-trick library.
        </p>
      </Section>

      <Section id="zero-config" k="fadeUp" title="Zero-config: the default (fade up)">
        <p>
          The most common scroll animation — fade up — requires zero configuration. Compare that with AOS:
        </p>
        <Compare
          before={{ label: 'AOS', file: 'index.html', code: `<!-- AOS: every element needs a data attribute -->
<div class="card" data-aos="fade-up">…</div>
<div class="card" data-aos="fade-up" data-aos-delay="100">…</div>
<div class="card" data-aos="fade-up" data-aos-delay="200">…</div>

<!-- Plus AOS init in your JS -->
AOS.init({ duration: 800, once: true });` }}
          after={{ label: 'scrollReveal', file: 'app.js', code: `import { scrollReveal } from 'svg-scroll-draw/reveal';

// Fade up every .card on scroll — that's it
scrollReveal('.card');` }}
        />
      </Section>

      <Section id="presets" k="preset" title="7 named presets">
        <Code file="app.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

scrollReveal('.card',    { preset: 'fadeUp'    }); // ↑ default
scrollReveal('.badge',   { preset: 'fadeDown'  }); // ↓
scrollReveal('.sidebar', { preset: 'fadeLeft'  }); // ←
scrollReveal('.tooltip', { preset: 'fadeRight' }); // →
scrollReveal('.hero',    { preset: 'scale'     }); // scale up from 88%
scrollReveal('.panel',   { preset: 'flip'      }); // rotateX 20→0 (3D flip)
scrollReveal('.tile',    { preset: 'flipX'     }); // rotateY 20→0`}</Code>
      </Section>

      <Section id="custom-from" k="from" title="Custom from state">
        <p>Full control — combine any properties with numeric values:</p>
        <Code file="app.js">{`scrollReveal('.feature', {
  from: {
    opacity: 0,
    y:       40,     // translateY(40px) → 0
    scale:   0.95,   // scale(0.95) → 1
  },
  easing:  'ease-out',
  stagger: 0.08,
  once:    true,
});

// 3D card flip
scrollReveal('.card', {
  from: { opacity: 0, rotateX: 15, scale: 0.97 },
});

// Slide in from left with full opacity (no fade)
scrollReveal('.list-item', {
  from: { x: -48 },  // translateX(-48px) → 0, no opacity change
});`}</Code>
      </Section>

      <Section id="stagger" k="stagger" title="Stagger">
        <p>
          The <code>stagger</code> option offsets each element’s trigger window — earlier elements in the list start
          animating sooner, later ones start a little further down the viewport. This creates a natural cascade without
          any per-element delay config:
        </p>
        <Code file="app.js">{`// Cards cascade: card-0 animates first, then card-1, card-2…
scrollReveal('.pricing-card', {
  preset:  'fadeUp',
  stagger: 0.12,
  easing:  'ease-out',
});

// Very subtle stagger for a large list
scrollReveal('.testimonial', {
  preset:  'scale',
  stagger: 0.06,
});`}</Code>
      </Section>

      <Section id="react" k="react" title="React usage">
        <Code file="FeaturesSection.tsx">{`'use client';
import { useEffect } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';

export function FeaturesSection() {
  useEffect(() => {
    const instance = scrollReveal('.feature-card', {
      preset:  'fadeUp',
      stagger: 0.1,
      once:    true,
    });
    return () => instance.destroy();
  }, []);

  return (
    <section>
      {features.map(f => (
        <div key={f.id} className="feature-card">
          {f.content}
        </div>
      ))}
    </section>
  );
}`}</Code>
      </Section>

      <Section id="migration" k="migration" title="Migration table">
        <Table
          head={['AOS / ScrollReveal.js', 'scrollReveal']}
          rows={MIGRATION.map(([before, after]) => [before, <code key="a">{after}</code>])}
        />
      </Section>

      <Section id="api" k="reference" title="Full API">
        <Code file="index.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

const instance = scrollReveal(
  '.card',            // CSS selector, NodeList, or Element[]
  {
    preset:  'fadeUp',   // 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight'
                         // | 'scale' | 'flip' | 'flipX'
    from: {              // custom start state (overrides preset)
      opacity: 0,
      x: 0, y: 0,
      scale: 1,
      rotate: 0,
      rotateX: 0, rotateY: 0,
    },
    stagger: 0.08,       // viewport-% offset per element (default: 0.08)
    easing:  'ease-out', // any easing name or custom function
    once:    true,       // freeze at max progress (default: true)
    trigger: {           // override default trigger window
      start: 'top 88%',
      end:   'top 53%',
    },
    onEnter: () => {},   // fires when first element enters view
    onLeave: () => {},   // fires when last element leaves view
  }
);

instance.destroy(); // removes all animations, restores original styles`}</Code>
        <Callout k="which one">
          <strong>scrollReveal vs scrollAnimateGroup:</strong> Use <code>scrollReveal</code> for the common case — preset
          animations on a group of elements. Use <code>scrollAnimateGroup</code> when you need precise per-element
          control over different CSS properties with shared trigger timing.
        </Callout>
      </Section>
    </BlogArticle>
  );
}
