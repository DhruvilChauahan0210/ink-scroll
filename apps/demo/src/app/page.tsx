import type { Metadata } from 'next';
import Link from 'next/link';
import './home.css';
import { SmoothScroll } from '@/components/home/SmoothScroll';
import { HomeNav } from '@/components/home/HomeNav';
import { Magnetic } from '@/components/home/Magnetic';
import { ScrollFx } from '@/components/home/ScrollFx';
import { HeroScript } from '@/components/home/HeroScript';
import { UseCases } from '@/components/home/UseCases';
import { Caliber } from '@/components/home/Caliber';
import { Annotate } from '@/components/home/Annotate';
import { Balance } from '@/components/home/Balance';
import { Toolkit } from '@/components/home/Toolkit';
import { Gauges } from '@/components/home/Gauges';
import { Stack } from '@/components/home/Stack';
import { Migrate } from '@/components/home/Migrate';
import { SignOff } from '@/components/home/SignOff';
import { SCRIPT_DRAW as SCRIPT } from '@/components/home/art/script';
import { CopyCommand } from '@/components/home/CopyCommand';
import { SELF } from '@/data/competitors';

export const metadata: Metadata = {
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app' },
};

const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'svg-scroll-draw',
  description:
    'A lightweight scroll-animation toolkit with best-in-class SVG path drawing. Draw SVG paths, reveal content, animate text, scrub video, and drive CSS from scroll. 10 KB gzipped, zero dependencies, MIT.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: 'https://svg-scroll-draw.vercel.app',
  downloadUrl: NPM,
  codeRepository: GH,
  license: 'https://opensource.org/licenses/MIT',
  softwareVersion: SELF.version,
  programmingLanguage: ['JavaScript', 'TypeScript'],
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  keywords:
    'scroll draw, svg scroll draw, scroll draw animation, scroll draw library, svg, animation, scroll, javascript, react, vue, web animation',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

/* Figures shown in chapter 06 and on the sign-off sheet. check:claims reads this
   comment, so it fails the build if they drift: 623 tests, 195 browser tests per engine. */
const UNIT_TESTS = 623;
const BROWSER_TESTS = 195;
/* The main entry's CI budget (packages/svg-scroll-draw/scripts/size.mjs, '.'). */
const BUDGET_KB = 10.5;

export default function HomePage() {
  return (
    <div className="home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SmoothScroll />
      <Magnetic />

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <HomeNav version={SELF.version} />

      <main>
        {/* ── Hero: the library writes its own name for what it does ───── */}
        <section className="hero" aria-label="Introduction">
          <ScrollFx
            className="hero-main"
            props={{ opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-80px)'] }}
            trigger={{ start: 'top top', end: 'bottom top' }}
            triggerSelector=".hero"
            easing="ease-in"
          >
            <Link href="/guides" className="hero-eyebrow"><i />v{SELF.version} · React hooks for the AOS, ScrollReveal &amp; vivus drop-ins</Link>
            <HeroScript className="hero-script" d={SCRIPT.d} viewBox={SCRIPT.viewBox} strokeWidth={SCRIPT.strokeWidth} />
            <h1>The scroll animation library that draws.</h1>
            <p className="hero-sub">
              Paths, text, pins and video — inked by scroll on the browser’s own timeline.
              {' '}{SELF.gzipKb} KB, zero dependencies, MIT.
            </p>
            <div className="hero-cta">
              <CopyCommand />
              <Link href="/docs" className="btn btn-solid" data-magnetic>Get started</Link>
            </div>
          </ScrollFx>
          <div className="hero-foot" aria-label="Works with">
            <span>React</span><span>Vue</span><span>Svelte</span><span>Solid</span><span>Angular</span><span>Astro</span><span>Web Components</span>
          </div>
        </section>

        {/* ── 01 Use cases ─────────────────────────────────────────────── */}
        <section className="sec" aria-labelledby="uc-title">
          <div className="sec-head">
            <span className="label"><b>01</b> / what people draw</span>
            <div>
              <h2 id="uc-title" className="h2">If it’s a line, it can follow the scroll.</h2>
              <p className="body">Signatures, maps, charts, product sketches, logos, diagrams — each one below is drawn by the library as you reach it.</p>
            </div>
          </div>
          <UseCases />
        </section>

        {/* ── 02 Caliber (pinned) ──────────────────────────────────────── */}
        <section className="sec-cal" aria-label="A watch movement, drawn by scroll">
          <Caliber />
        </section>

        {/* ── 03 Proof sheet (pinned) ─────────────────────────────────── */}
        <section className="sec-cal" aria-labelledby="an-title">
          <Annotate />
        </section>

        {/* ── 04 Against the incumbent: weighed on a balance (pinned) ──── */}
        <section className="sec-cal" aria-labelledby="bal-title">
          <Balance />
        </section>

        {/* ── 05 Toolkit: blueprint plates on a sideways rail (pinned) ─── */}
        <section className="sec-cal" aria-labelledby="tk-title">
          <Toolkit />
        </section>

        {/* ── 06 Proof: the instrument panel ───────────────────────────── */}
        <Gauges unitTests={UNIT_TESTS} browserTests={BROWSER_TESTS} gzipKb={SELF.gzipKb} budgetKb={BUDGET_KB} />

        {/* ── 07 Your stack: a circuit board, inked by scroll ──────────── */}
        <section className="sec-cal" aria-labelledby="st-title">
          <Stack />
        </section>

        {/* ── 08 Switching: the same plug, smaller insides ─────────────── */}
        <section className="sec-cal" aria-labelledby="mg-title">
          <Migrate />
        </section>

        {/* ── Sign-off: the page ends on a signed drawing sheet ────────── */}
        <SignOff version={SELF.version} gzipKb={SELF.gzipKb} unitTests={UNIT_TESTS} browserTests={BROWSER_TESTS} />
      </main>
    </div>
  );
}
