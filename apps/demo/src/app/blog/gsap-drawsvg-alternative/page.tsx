import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { COMPETITORS, MEASURED_ON, SELF, provenance, ratioVsSelf } from '@/data/competitors';
import {
  BlogArticle, Section, Code, Compare, Table, Mark, Checks, Cols, Notes, Spec, Steps, Step, Figure, Closing,
} from '@/components/blog/BlogArticle';
import { Bars } from '@/components/blog/Bars';
import { BomFigure } from '@/components/blog/BomFigure';

// Every size on this page comes from data/competitors.ts.
const OURS = SELF.gzipKb;
const GSAP = COMPETITORS.gsapStack.gzipKb;
const CORE = COMPETITORS.gsapCore.gzipKb;
const TRIGGER = Math.round((COMPETITORS.gsapScroll.gzipKb - CORE) * 10) / 10;
const DRAWSVG = Math.round((GSAP - COMPETITORS.gsapScroll.gzipKb) * 10) / 10;
const RATIO = ratioVsSelf('gsapStack').toFixed(1);
const APPROX = `~${Math.round(OURS)} KB`;
const kb = (n: number) => `${n.toFixed(1)} KB`;
/** "GreenSock Standard (free of charge)" → "Free". */
const GSAP_PRICE = /free of charge/i.test(COMPETITORS.gsapStack.license) ? 'Free' : COMPETITORS.gsapStack.license;

export const metadata: Metadata = {
  title: seoTitle(`GSAP DrawSVG Alternative — ${Math.round(OURS)} KB vs ${kb(GSAP)}, Zero Deps`),
  description:
    'svg-scroll-draw vs GSAP DrawSVG for scroll-driven SVG path drawing: measured bundle size, native CSS fast path, framework support and a migration guide.',
  keywords: [
    'gsap drawsvg alternative',
    'svg scroll animation without gsap',
    'lightweight gsap drawsvg alternative',
    'svg-scroll-draw vs gsap',
    'gsap scrolltrigger alternative',
    'svg path animation scroll react',
    'drawsvg bundle size',
    'scroll driven svg animation library',
    'gsap drawsvg react alternative',
  ],
  alternates: { canonical: '/blog/gsap-drawsvg-alternative' },
  openGraph: {
    title: `GSAP DrawSVG Alternative — ${Math.round(OURS)} KB vs ${kb(GSAP)}, Zero Deps`,
    description:
      `${APPROX}, MIT, zero deps. A detailed comparison and drop-in alternative to GSAP DrawSVG + ScrollTrigger.`,
    url: 'https://svg-scroll-draw.vercel.app/blog/gsap-drawsvg-alternative',
  },
  twitter: {
    card: 'summary_large_image',
    title: `GSAP DrawSVG Alternative — ${Math.round(OURS)} KB vs ${kb(GSAP)}, Zero Deps`,
    description: `${APPROX}, MIT, zero deps. Drop-in alternative to GSAP DrawSVG + ScrollTrigger.`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'svg-scroll-draw vs GSAP DrawSVG — Free Alternative',
  description:
    'Detailed comparison of svg-scroll-draw and GSAP DrawSVG for scroll-driven SVG path animation. Bundle size, license costs, React/Vue/Svelte support, and a migration guide.',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-05-30',
  url: 'https://svg-scroll-draw.vercel.app/blog/gsap-drawsvg-alternative',
  about: [
    { '@type': 'SoftwareApplication', name: 'svg-scroll-draw' },
    { '@type': 'SoftwareApplication', name: 'GSAP DrawSVG' },
  ],
};

const FEATURES: { feature: string; ours: string; theirs: string; ourWin: boolean | null }[] = [
  { feature: 'License',               ours: 'MIT — fork and redistribute freely', theirs: 'Free to use; own terms restrict redistribution', ourWin: true },
  { feature: 'Bundle size (gzipped)', ours: APPROX,                             theirs: `${kb(GSAP)} (gsap + ScrollTrigger + DrawSVG)`,       ourWin: true },
  { feature: 'Dependencies',          ours: 'Zero',                              theirs: '3 packages to install and register',                   ourWin: true },
  { feature: 'Native CSS fast path',  ours: 'Yes — 0 JS per frame in Chrome/Edge 115+, Safari 26+, Firefox 159+', theirs: 'No — JS only',                                ourWin: true },
  { feature: 'React component',       ours: '<ScrollDraw> + useScrollDraw hook', theirs: 'useEffect/useRef boilerplate every time',              ourWin: true },
  { feature: 'Vue 3',                 ours: '<ScrollDraw> + useScrollDraw composable', theirs: 'Manual setup, no official wrapper',            ourWin: true },
  { feature: 'Svelte',                ours: 'use:scrollDraw action',             theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'Solid.js',              ours: 'useScrollDraw + createScrollDraw',  theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'Angular / Nuxt / Astro', ours: 'First-class wrappers',             theirs: 'Manual setup',                                        ourWin: true },
  { feature: 'stagger',               ours: 'Built-in option',                   theirs: 'gsap.utils.toArray() + per-element delay',             ourWin: true },
  { feature: 'morphTo',               ours: 'Built-in option',                   theirs: 'MorphSVGPlugin — free, but another package',           ourWin: true },
  { feature: 'CSS custom property',   ours: '--scroll-draw-progress on every frame', theirs: 'Manual onUpdate callback',                       ourWin: true },
  { feature: 'Sequence API',          ours: 'scrollDrawSequence()',              theirs: 'Complex ScrollTrigger chaining',                       ourWin: true },
  { feature: 'Group API',             ours: 'scrollDrawGroup()',                 theirs: 'Manually share trigger across multiple tweens',         ourWin: true },
  { feature: 'Physics easings',       ours: 'spring, bounce, elastic built-in + factory fns', theirs: 'Bounce, Elastic, CustomEase — all free, separate imports', ourWin: true },
  { feature: 'Timeline API',          ours: 'scrollDrawTimeline() — independent track windows', theirs: 'Yes — GSAP timeline is its strength',    ourWin: false },
  { feature: 'Complex multi-element timelines', ours: 'Scroll-draw scope only',  theirs: 'Yes — GSAP excels here',                              ourWin: false },
  { feature: 'Non-SVG animations',    ours: 'clip reveal only',                  theirs: 'Yes — text, DOM, anything',                            ourWin: false },
  { feature: 'SSR safe',              ours: 'Yes — observers skip on server',    theirs: 'Needs manual typeof window guards',                    ourWin: true },
  { feature: 'TypeScript',            ours: 'Full types included',               theirs: 'Full types included',                                  ourWin: null },
];

const cell = (ok: boolean | null, text: string) => (
  <span className="ba-cell"><Mark ok={ok} /><span>{text}</span></span>
);

export default function Page() {
  return (
    <BlogArticle
      slug="gsap-drawsvg-alternative"
      jsonLd={jsonLd}
      tags={['GSAP DrawSVG', 'ScrollTrigger', 'migration']}
      title={<><span className="ba-nw">svg-scroll-draw</span> vs GSAP DrawSVG</>}
      lede={
        <>
          GSAP DrawSVG is powerful, and since 2025 it&apos;s free for everyone — so this isn&apos;t a price argument.
          It does still cost you {kb(GSAP)}, three packages to register, and boilerplate in every framework.
          Here&apos;s a complete comparison, side-by-side code, and a migration guide.
        </>
      }
      facts={[
        { k: 'svg-scroll-draw', v: APPROX },
        { k: 'GSAP stack', v: kb(GSAP) },
        { k: 'Licence', v: SELF.license },
        { k: 'GSAP licence', v: GSAP_PRICE },
      ]}
      figure={
        <Figure n={1} caption={<>one path drawn on scroll — what each side ships, to scale · measured {COMPETITORS.gsapStack.measuredOn ?? MEASURED_ON}</>}>
          <BomFigure
            theirs={[
              { name: 'gsap', kb: CORE },
              { name: 'ScrollTrigger', kb: TRIGGER },
              { name: 'DrawSVGPlugin', kb: DRAWSVG },
            ]}
            ours={{ name: 'svg-scroll-draw', kb: OURS }}
            setup="registerPlugin()"
          />
        </Figure>
      }
    >
      <Section id="at-a-glance" k="at a glance" title="The short version">
        <Cols>
          <Checks
            title="svg-scroll-draw"
            items={[
              `${APPROX} gzipped — ${RATIO}× smaller than GSAP`,
              'MIT — free for commercial use, forever',
              'Zero dependencies',
              'Native CSS fast path (Chrome/FF 115+)',
              'First-class React, Vue, Svelte, Solid, Angular, Nuxt, Astro wrappers',
              'stagger, morphTo, Sequence, Group, Timeline — all built in',
              'SSR-safe out of the box',
            ].map((text) => ({ ok: true, text }))}
          />
          <Checks
            muted
            title="GSAP DrawSVG"
            items={[
              { ok: false, text: `${kb(GSAP)} (gsap + ScrollTrigger + DrawSVG)` },
              { ok: false, text: '3 packages, plugin registration boilerplate' },
              { ok: false, text: 'JS only — no native CSS path' },
              { ok: false, text: 'No framework wrappers — useEffect + useRef every time in React' },
              { ok: false, text: 'Path morphing needs MorphSVGPlugin — free, but another import' },
              { ok: true, text: 'Unmatched for complex multi-element timelines (non-SVG)' },
            ]}
          />
        </Cols>
      </Section>

      <Section id="licensing" k="licensing" title="The real cost of GSAP DrawSVG">
        <p>
          It is not money. <strong>GSAP is free</strong> — Webflow acquired GreenSock and released the whole toolset,
          DrawSVG and MorphSVG included, at no charge in 2025. If you have read an older comparison that says otherwise,
          including an earlier version of this post, it is out of date.
        </p>
        <p>
          The cost is <strong>bytes and setup</strong>. To draw one path on scroll you install three packages, call{' '}
          <code>gsap.registerPlugin()</code>, and ship {kb(GSAP)} gzipped — for an effect that is fundamentally one
          animated <code>stroke-dashoffset</code>.
        </p>
        <p>
          The one licence difference worth knowing is narrow: <strong>svg-scroll-draw is MIT</strong>, so you can fork it,
          bundle it and redistribute it inside your own library. GSAP&apos;s licence is free-of-charge but has its own terms
          around redistribution in a competing product — read them yourself rather than take our word for it.
        </p>
        <Spec
          items={[
            { k: 'svg-scroll-draw', v: `${SELF.license} · ${APPROX} · zero deps` },
            { k: 'GSAP DrawSVG', v: `Free · ${kb(GSAP)} · 3 packages` },
          ]}
        />
      </Section>

      <Section id="bundle-size" k="bundle size" title={`${RATIO}× smaller than GSAP`}>
        <Figure n={2} caption={provenance([`gsap ${COMPETITORS.gsapStack.version}`, `framer-motion ${COMPETITORS.framerMotion.version}`, `svg-scroll-draw ${SELF.version}`])}>
          <Bars
            rows={[
              { label: 'svg-scroll-draw', value: OURS, self: true },
              { label: COMPETITORS.gsapStack.label, value: GSAP },
              { label: COMPETITORS.framerMotion.label, value: COMPETITORS.framerMotion.gzipKb },
            ]}
          />
        </Figure>
        <p>
          GSAP stack includes gsap core ({kb(CORE)}) + ScrollTrigger ({kb(TRIGGER)}) + DrawSVG plugin ({kb(DRAWSVG)}).
          Where the browser supports <code>animation-timeline: view()</code> (Chrome and Edge 115+, Safari 26+, Firefox
          159+), svg-scroll-draw also hands the simple draw case to the browser’s native CSS scroll timeline — zero
          per-frame JavaScript.
        </p>
      </Section>

      <Section id="code" k="code comparison" title="Same animation, both libraries">
        <h3 className="ba-h3">Vanilla JS</h3>
        <Compare
          before={{ label: 'GSAP DrawSVG', file: 'hero.js', code: `// 3 imports, plugin registration required
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.fromTo(
  '#logo path',
  { drawSVG: '0%' },
  {
    drawSVG: '100%',
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#logo',
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
    },
  }
);` }}
          after={{ label: 'svg-scroll-draw', file: 'hero.js', code: `// 1 import, zero config
import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#logo', {
  easing: 'ease-out',
  trigger: { start: 'top 80%', end: 'top 20%' },
});` }}
        />

        <h3 className="ba-h3">React</h3>
        <Compare
          before={{ label: 'GSAP DrawSVG', file: 'Logo.tsx', code: `import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

function Logo() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('path', { drawSVG: '0%' }, {
        drawSVG: '100%',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: true,
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return <svg ref={ref}>…</svg>;
}` }}
          after={{ label: 'svg-scroll-draw', file: 'Logo.tsx', code: `import { ScrollDraw } from 'svg-scroll-draw/react';

function Logo() {
  return (
    <ScrollDraw
      easing="ease-out"
      trigger={{ start: 'top 80%', end: 'top 20%' }}
    >
      <svg>…</svg>
    </ScrollDraw>
  );
}` }}
        />

        <h3 className="ba-h3">With stagger</h3>
        <Compare
          before={{ label: 'GSAP DrawSVG', file: 'chart.js', code: `// Must use gsap.utils.toArray + manual delay
const paths = gsap.utils.toArray('#chart path');
paths.forEach((path, i) => {
  gsap.fromTo(path,
    { drawSVG: '0%' },
    {
      drawSVG: '100%',
      delay: i * 0.15,
      scrollTrigger: {
        trigger: '#chart',
        start: 'top 80%',
        scrub: true,
      },
    }
  );
});` }}
          after={{ label: 'svg-scroll-draw', file: 'chart.js', code: `// stagger is a first-class option
scrollDraw('#chart', {
  easing: 'ease-out',
  stagger: 0.15,
  once: true,
});` }}
        />
      </Section>

      <Section id="features" k="feature comparison" title="Full feature matrix">
        <Table
          first="plain"
          head={['Feature', 'svg-scroll-draw', 'GSAP DrawSVG']}
          rows={FEATURES.map((r) => [
            r.feature,
            cell(r.ourWin === false ? null : true, r.ours),
            cell(r.ourWin === true ? false : true, r.theirs),
          ])}
        />
      </Section>

      <Section id="when-gsap" k="honest guidance" title="When GSAP still makes sense">
        <p>
          svg-scroll-draw is purpose-built for one thing: animating SVG paths as you scroll.
          If your project goes beyond that, GSAP may be the right tool:
        </p>
        <Notes
          items={[
            { t: 'Complex multi-element timelines', d: 'Orchestrating dozens of DOM elements across a 10-second scrubbed sequence — GSAP\'s timeline API has no peer.' },
            { t: 'Non-SVG animations', d: 'Text splitting, FLIP, DOM transforms, canvas — GSAP animates anything. svg-scroll-draw only handles SVG paths.' },
            { t: 'Physics easings (CustomEase)', d: 'svg-scroll-draw ships spring, bounce, and elastic. But GSAP\'s CustomEase and the depth of its easing ecosystem still win for highly tailored curves.' },
            { t: 'Already in your bundle', d: 'If you\'re already paying the GSAP bundle cost for other animations, DrawSVG adds marginal bytes and your team already knows the API.' },
          ]}
        />
      </Section>

      <Section id="migration" k="migration guide" title="Switch in under 5 minutes">
        <p>For SVG path drawing specifically, the migration is almost mechanical. The concepts map directly.</p>
        <p>
          Before you switch, paste the SVG into the <Link href="/svg-path-viewer">SVG path viewer</Link>: it lists
          each path’s length and anything that would stop it drawing, such as a fill or a missing stroke.
        </p>
        <Steps>
          <Step n={1} title="Install">
            <Code file="terminal">{`npm i svg-scroll-draw
# remove: npm uninstall gsap (if gsap was only used for DrawSVG)`}</Code>
          </Step>
          <Step n={2} title="Replace the GSAP call">
            <Compare
              before={{ label: 'Before (GSAP)', file: 'hero.js', code: `import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.fromTo('#hero path', { drawSVG: '0%' }, {
  drawSVG: '100%',
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
  },
});` }}
              after={{ label: 'After (svg-scroll-draw)', file: 'hero.js', code: `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#hero', {
  easing: 'ease-out',
  trigger: {
    start: 'top 80%',
    end: 'bottom 20%',
  },
});` }}
            />
          </Step>
          <Step n={3} title="Easing name map">
            <Table
              head={['GSAP ease', 'svg-scroll-draw easing']}
              rows={[
                ['power2.out / power3.out', '"ease-out"'],
                ['power2.in', '"ease-in"'],
                ['power2.inOut', '"ease-in-out"'],
                ['linear', '"linear"'],
                ['elastic.out', '"spring" or createSpring({ tension, friction })'],
                ['none', '"linear"'],
              ].map(([g, o]) => [g, <code key="o">{o}</code>])}
            />
          </Step>
        </Steps>
      </Section>

      <Closing
        title="Ready to make the switch?"
        lede="One install, no membership, and it works in every framework"
        links={[
          { href: '/playground', label: 'Try the Playground →' },
          { href: '/examples', label: 'See the examples →' },
        ]}
      />
    </BlogArticle>
  );
}
