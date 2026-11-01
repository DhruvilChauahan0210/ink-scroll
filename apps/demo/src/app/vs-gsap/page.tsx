import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON, provenance, ratioVsSelf } from '@/data/competitors';
import { jsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { SpecSheet, type SpecRow } from '@/components/h2h/SpecSheet';
import { WeighIn } from '@/components/h2h/WeighIn';
import { Calls, Closing, CodeSet, Head, Ledger, Legend, Matrix, Nb, OtherSheets, Toc, type MatrixRow } from '@/components/h2h/parts';
import { seoTitle } from '../_lib/seo';

/** "4.66" → "4.7": one decimal is all the precision a headline ratio deserves. */
const RATIO_STACK = (Math.round(ratioVsSelf('gsapStack') * 10) / 10).toFixed(1);
const RATIO_SCROLL = (Math.round(ratioVsSelf('gsapScroll') * 10) / 10).toFixed(1);
const GSAP_FULL_SUITE_KB = (COMPETITORS.gsapStack.gzipKb + COMPETITORS.gsapSplitText.gzipKb).toFixed(1);

/* The stack, itemised: each plugin is the difference between two measured totals. */
const CORE_KB = COMPETITORS.gsapCore.gzipKb;
const SCROLLTRIGGER_KB = (COMPETITORS.gsapScroll.gzipKb - COMPETITORS.gsapCore.gzipKb).toFixed(1);
const DRAWSVG_KB = (COMPETITORS.gsapStack.gzipKb - COMPETITORS.gsapScroll.gzipKb).toFixed(1);
const SPLITTEXT_KB = COMPETITORS.gsapSplitText.gzipKb.toFixed(1);
const DELTA_KB = (COMPETITORS.gsapStack.gzipKb - SELF.gzipKb).toFixed(1);

const TITLE = `GSAP ScrollTrigger Alternative: ${Math.round(SELF.gzipKb)} KB, MIT, Native CSS`;
const DESCRIPTION = `Measured: ${SELF.gzipKb} KB vs ${COMPETITORS.gsapStack.gzipKb} KB for GSAP + ScrollTrigger + DrawSVG. MIT, native CSS fast path. GSAP is free and does more — when to pick each.`;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'gsap alternative',
    'gsap scrolltrigger alternative',
    'scrolltrigger replacement',
    'svg-scroll-draw vs gsap',
    'scroll animation library comparison',
    'lightweight scroll animation',
    'gsap bundle size',
    'scroll animation without gsap',
    'native css scroll driven animation',
    'scroll pin alternative',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/vs-gsap' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://svg-scroll-draw.vercel.app/vs-gsap',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * The at-a-glance table that sits in the opening, above the fold. Every size
 * and license string comes from competitors.ts; the rows a reader would weigh
 * against us (GSAP's extra features) are in it on purpose, and marked as GSAP's.
 */
const AT_A_GLANCE: SpecRow[] = [
  {
    k: 'Size, min + gzip',
    cells: [
      `${SELF.gzipKb} KB, every API`,
      `${COMPETITORS.gsapStack.gzipKb} KB with DrawSVG · ${COMPETITORS.gsapScroll.gzipKb} KB core + ScrollTrigger`,
    ],
    win: 0,
  },
  { k: 'License', cells: [SELF.license, COMPETITORS.gsapStack.license] },
  {
    k: 'Native CSS scroll-timeline',
    cells: ['Yes, when eligible — Chrome/Edge 115+, Safari 26+, Firefox 159+', 'No — runs in JavaScript'],
    win: 0,
  },
  { k: 'Runtime dependencies', cells: ['0', '0'] },
  {
    k: 'SSR (Next.js, Nuxt)',
    cells: ['Safe to import; no-op on the server', 'Safe to import; create triggers client-side'],
  },
  { k: 'Timelines, MorphSVG, Flip', cells: ['No', 'Yes — all free since 2025'], win: 1 },
];

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is svg-scroll-draw free to use commercially?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. svg-scroll-draw is MIT licensed — free for commercial use, and free to fork, modify or redistribute; the only condition is keeping the license notice in copies. GSAP is also free to use, including all former Club GreenSock plugins, since Webflow made the full toolset no-charge in 2025; its Standard "No Charge" license is not open source, and it bars use in no-code visual animation tools that compete with Webflow. MIT has no such limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is GSAP free now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. After Webflow acquired GreenSock, GSAP and every previously paid Club GreenSock plugin — including SplitText, DrawSVG, MorphSVG and MotionPath — became free to use in 2025. Cost is no longer a reason to pick an alternative. Bundle size, dependency count and whether the animation can run natively on CSS still are.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does svg-scroll-draw compare to GSAP in bundle size?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `svg-scroll-draw is ${SELF.gzipKb} KB gzipped. The equivalent GSAP stack for the same job — core ${CORE_KB} KB + ScrollTrigger ${SCROLLTRIGGER_KB} KB + DrawSVGPlugin ${DRAWSVG_KB} KB — is ${COMPETITORS.gsapStack.gzipKb} KB, making svg-scroll-draw ${ratioVsSelf('gsapStack')}× smaller. Measured ${MEASURED_ON} against gsap ${COMPETITORS.gsapStack.version} and svg-scroll-draw ${SELF.version} with gzip level 9.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Can svg-scroll-draw replace GSAP ScrollTrigger?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For the common scroll cases, yes: scroll-driven property animation, SVG path drawing, parallax, pin/sticky sections, snapping, horizontal scroll, text splits and video scrubbing — with zero dependencies. GSAP still does more: nested timelines you can edit while they play, MorphSVG, Flip, inertia and a much larger ecosystem.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does svg-scroll-draw work with React, Vue, and Svelte?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. svg-scroll-draw provides framework-specific adapters for React, Next.js, Vue 3, Svelte, Solid.js, Angular, Astro, and Nuxt, as well as vanilla JavaScript.',
      },
    },
  ],
};

const FEATURES: MatrixRow[] = [
  { f: 'Animate any CSS property on scroll', cells: [true, true] },
  { f: 'SVG path draw (stroke-dashoffset)', cells: [true, true] },
  { f: 'Animated number counters', cells: [true, true] },
  { f: 'Text split + stagger', cells: [true, true], note: `GSAP SplitText — free since 2025, ${SPLITTEXT_KB} KB, and needs GSAP core to animate` },
  { f: 'Video scrub on scroll', cells: [true, true] },
  { f: 'Pin / sticky sections', cells: [true, true] },
  { f: 'Section snapping', cells: [true, true] },
  { f: 'onEnter / onLeave / onEnterBack / onLeaveBack', cells: [true, true] },
  { f: 'Honours prefers-reduced-motion by default', cells: ['partial', 'partial'], note: 'Default-on for scrollDraw, scrollAnimate, scrollReveal, scrollCounter, scrollText, scrollVideo, scrollSnap and Cinematic — but scrollHorizontal opts out by design and scrollPin/scrollProgress have no path. GSAP ships gsap.matchMedia(), but you write the reduced-motion variant of each animation yourself.' },
  { f: 'Native CSS scroll-driven animation', cells: [true, false], note: 'GSAP always runs JS' },
  { f: 'Parallax', cells: [true, true] },
  { f: 'Path morphing on scroll', cells: [true, true] },
  { f: 'Waypoints (fire at progress %)', cells: [true, true] },
  { f: 'Spring / bounce / elastic easings', cells: [true, true] },
  { f: 'React / Vue / Svelte / Solid wrappers', cells: [true, 'partial'], note: 'GSAP has basic React helpers, not full wrappers' },
  { f: 'Angular / Astro / Nuxt wrappers', cells: [true, false] },
  { f: 'Zero runtime dependencies', cells: [true, true], note: 'GSAP also declares no runtime dependencies — verified from its package.json. The difference is total weight, not dependency count.' },
  { f: 'MIT license (fork / redistribute freely)', cells: [true, 'partial'], note: 'GSAP is free to use, but its standard license restricts redistribution inside a competing product or SDK' },
  { f: 'Visual DevTools overlay', cells: [true, true], note: 'GSAP ships GSDevTools.js in the public tarball (free since 2025). Ours is scroll-specific and dev-only; theirs is a timeline scrubber.' },
  { f: 'Lenis smooth-scroll adapter', cells: [true, 'partial'], note: 'GSAP works with Lenis but no dedicated adapter' },
  { f: 'Bundle size (minified + gzipped)', cells: [`${SELF.gzipKb} KB`, `${COMPETITORS.gsapStack.gzipKb} KB`], note: `gsap ${COMPETITORS.gsapStack.version}: core ${CORE_KB} + ScrollTrigger ${SCROLLTRIGGER_KB} + DrawSVG ${DRAWSVG_KB} — the equivalent stack, measured ${MEASURED_ON}` },
];

const OURS = 'svg-scroll-draw';
const THEIRS = 'GSAP + ScrollTrigger';

const PAIRS: { title: string; extra?: string; gsap: string; gsapWho?: string; ours: string; oursWho?: string }[] = [
  {
    title: 'Fade + slide in on scroll',
    gsap: `gsap.from('#card', {
  opacity:  0,
  y:        40,
  ease:     'power2.out',
  scrollTrigger: {
    trigger: '#card',
    start:   'top 80%',
    end:     'top 40%',
    scrub:   true,
  },
});`,
    ours: `import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#card', {
  props: {
    opacity:   [0, 1],
    transform: [
      'translateY(40px)',
      'translateY(0)',
    ],
  },
  easing:  'ease-out',
  trigger: {
    start: 'top 80%',
    end:   'top 40%',
  },
  once: true,
});`,
  },
  {
    title: 'Pin / sticky section',
    gsap: `ScrollTrigger.create({
  trigger:     '#panel',
  start:       'top top',
  end:         '+=800',
  pin:         true,
  pinSpacing:  true,
  onEnter:     () => console.log('enter'),
  onLeave:     () => console.log('leave'),
});`,
    ours: `import { scrollPin }
  from 'svg-scroll-draw/pin';

scrollPin('#panel', {
  pinDistance: 800,
  onEnter:  () => console.log('enter'),
  onLeave:  () => console.log('leave'),
  onEnterBack: () =>
    console.log('enter back'),
});`,
  },
  {
    title: 'onEnter / onLeave callbacks',
    gsap: `ScrollTrigger.create({
  trigger: '#section',
  start:   'top center',
  end:     'bottom center',
  onEnter:     () => activate(),
  onLeave:     () => deactivate(),
  onEnterBack: () => activate(),
  onLeaveBack: () => deactivate(),
});`,
    ours: `import { scrollAnimate }
  from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0.5, 1] },
  trigger: {
    start: 'top center',
    end:   'bottom center',
  },
  onEnter:     () => activate(),
  onLeave:     () => deactivate(),
  onEnterBack: () => activate(),
  onLeaveBack: () => deactivate(),
});`,
  },
  {
    title: 'Section snapping',
    gsap: `ScrollTrigger.create({
  snap: {
    snapTo:   'labels',
    duration: { min: 0.2, max: 0.8 },
    delay:    0.1,
    ease:     'power1.inOut',
  },
});`,
    ours: `import { scrollSnap }
  from 'svg-scroll-draw/snap';

scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  threshold: 0.3,
  onSnap: (index) =>
    console.log('snapped to', index),
});`,
  },
  {
    title: 'Text split + stagger',
    extra: `GSAP = +${SPLITTEXT_KB} KB, needs core`,
    gsapWho: `GSAP SplitText (free, ${SPLITTEXT_KB} KB + core)`,
    oursWho: `svg-scroll-draw (${SELF_ENTRIES.text} KB entry)`,
    gsap: `// core + ScrollTrigger + SplitText
const split = new SplitText('#h1',
  { type: 'words' });

gsap.from(split.words, {
  opacity: 0,
  y: 20,
  stagger: 0.05,
  scrollTrigger: '#h1',
});`,
    ours: `import { scrollText }
  from 'svg-scroll-draw/text';

scrollText('#h1', {
  split:   'words',
  stagger: 0.05,
  from: { opacity: 0, y: 20 },
  once: true,
});`,
  },
];

const WHEN_GSAP = [
  { title: 'Complex timeline sequencing', desc: 'GSAP\'s timeline API is unmatched for orchestrating multi-element animations across a precise time axis.' },
  { title: 'Draggable + physics', desc: 'GSAP Draggable, Inertia, and physics plugins have no equivalent in scroll-focused libraries.' },
  { title: 'The full plugin suite — now free', desc: 'MorphSVG, Flip, MotionPath, Observer and SplitText have no equivalent here, and since 2025 they cost nothing. If you need any of them, use GSAP.' },
  { title: 'Community & tutorials', desc: 'GSAP has 15 years of CodePens, tutorials, and community support, plus Webflow behind it now. Our ecosystem is newer.' },
];

const TOC: [string, string][] = [
  ['vs-size', 'Bundle size'],
  ['vs-license', 'License'],
  ['vs-features', `Feature matrix · ${FEATURES.length}`],
  ['vs-api', `Side-by-side API · ${PAIRS.length}`],
  ['when-gsap', 'When GSAP is right'],
  ['vs-more', 'More comparisons'],
];

export default function VsGsapPage() {
  return (
    <SiteShell kicker="vs gsap / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(pageJsonLd) }} />
      <div className="h2h">

        {/* ── Opening + at-a-glance sheet (above the fold) ─────────────────── */}
        <header className="pg-head h2h-head">
          <div>
            <p className="pg-kicker">
              <span>comparison / svg-scroll-draw vs gsap</span>
              <span>measured {MEASURED_ON}</span>
            </p>
            <h1 className="pg-title h2h-title">
              GSAP ScrollTrigger alternative.{' '}
              <span className="dim">{RATIO_STACK}× smaller, MIT.</span>
            </h1>
            <p className="pg-lede">
              GSAP is free since 2025 — every plugin — and it does more than we do. This page isn&#39;t about price.
              It&#39;s that for scroll work alone you ship {COMPETITORS.gsapStack.gzipKb} KB and an API surface you’ll
              use a fraction of.
            </p>
            <div className="pg-actions">
              <Link href="/" className="btn btn-solid" data-magnetic>Get started free →</Link>
              <Link href="/guides/gsap-scrolltrigger-react" className="btn" data-magnetic>Migration guide →</Link>
              <a href="#when-gsap" className="btn" data-magnetic>When GSAP is the better call ↓</a>
            </div>
            <dl className="pg-facts">
              <div><dt>svg-scroll-draw</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>GSAP stack</dt><dd>{COMPETITORS.gsapStack.gzipKb} KB</dd></div>
              <div><dt>Smaller by</dt><dd>{RATIO_STACK}×</dd></div>
              <div><dt>Core + ST alone</dt><dd>{RATIO_SCROLL}×</dd></div>
            </dl>
            <p className="h2h-facts-note">
              Sizes measured {MEASURED_ON}, gzip -9. {RATIO_STACK}× vs GSAP + ScrollTrigger + DrawSVG; {RATIO_SCROLL}× vs core + ScrollTrigger alone.
            </p>
          </div>
          <SpecSheet
            cols={[
              { name: OURS, sub: SELF.version, ours: true },
              { name: 'GSAP', sub: COMPETITORS.gsapStack.version },
            ]}
            rows={AT_A_GLANCE}
            caption="fig. 1 — at a glance · ✓ where one side is clearly ahead"
          />
        </header>

        <div className="h2h-body">
          <div className="h2h-main">

            {/* ── 01 Bundle size ─────────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-size">
              <Head n={1} k="weigh-in" id="vs-size">Bundle size.</Head>
              <p className="h2h-p">
                The same scroll job, weighed. GSAP&#39;s stack is built up one plugin at a time — each row inks only
                what that plugin adds, on top of the pencil it already carries. The dashed rule is
                svg-scroll-draw with every API loaded.
              </p>
              <WeighIn
                max={60}
                step={10}
                self={SELF.gzipKb}
                rows={[
                  { name: OURS, note: `${SELF.version} · every API`, kb: SELF.gzipKb, ours: true, badge: 'yours' },
                  { name: 'GSAP core', note: `gsap ${COMPETITORS.gsapCore.version}`, kb: CORE_KB },
                  { name: '+ ScrollTrigger', note: `GSAP + ScrollTrigger · +${SCROLLTRIGGER_KB} KB`, kb: COMPETITORS.gsapScroll.gzipKb, from: CORE_KB, badge: 'common setup' },
                  { name: '+ DrawSVGPlugin', note: `+${DRAWSVG_KB} KB`, kb: COMPETITORS.gsapStack.gzipKb, from: COMPETITORS.gsapScroll.gzipKb, badge: 'same job as us' },
                  { name: '+ SplitText', note: `+${SPLITTEXT_KB} KB`, kb: Number(GSAP_FULL_SUITE_KB), from: COMPETITORS.gsapStack.gzipKb, badge: 'full suite' },
                ]}
                dim={{ from: SELF.gzipKb, to: COMPETITORS.gsapStack.gzipKb, title: 'Same job, difference', label: `Δ ${DELTA_KB} KB` }}
                caption={`fig. 2 — the weigh-in, to scale · ${RATIO_STACK}× the bytes for the same job`}
              />
              <p className="h2h-src">
                {provenance([`gsap ${COMPETITORS.gsapStack.version}`, `svg-scroll-draw ${SELF.version}`])}{' '}
                SplitText is free to use as of 2025; it still costs you the bytes.
              </p>
            </section>

            {/* ── 02 License ─────────────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-license">
              <Head n={2} k="license" id="vs-license">License.</Head>
              <Nb>
                <strong>Worth saying plainly:</strong> GSAP is free. Webflow acquired
                GreenSock and in 2025 released the entire toolset — including SplitText, DrawSVG, MorphSVG and every
                other former Club GreenSock plugin — at no charge. If you read an older comparison claiming you need a
                ~$150/yr subscription, that is out of date, and this page used to be one of them.
                {' '}<strong>Cost is not a reason to choose svg-scroll-draw.</strong>{' '}
                The remaining license difference is narrow but real, and it only matters if you redistribute.
              </Nb>
              <div className="lgs">
                <Ledger
                  name={OURS}
                  badge={SELF.license}
                  ours
                  items={[
                    'Free for personal use',
                    'Free for commercial use',
                    'Free forever — no subscription',
                    'All features included',
                    'No attribution required',
                    'Fork, modify, redistribute freely',
                  ].map((text) => ({ text, ok: true }))}
                />
                <Ledger
                  name="GSAP"
                  badge="GreenSock Standard — free"
                  items={[
                    { text: 'Free for personal use', ok: true },
                    { text: 'Free for commercial use', ok: true },
                    { text: 'All plugins free since 2025 — no subscription', ok: true },
                    { text: 'SplitText, DrawSVG, MorphSVG all included', ok: true },
                    { text: 'Cannot be redistributed inside a competing tool or SDK', ok: false },
                    { text: 'Not OSI open source — terms set by the vendor', ok: false },
                  ]}
                />
              </div>
            </section>

            {/* ── 03 Feature matrix ──────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-features">
              <Head n={3} k={`${FEATURES.length} rows`} id="vs-features">Feature matrix.</Head>
              <Matrix cols={[{ name: OURS, ours: true }, { name: 'GSAP' }]} rows={FEATURES} />
              <Legend>
                GSAP figures reflect the free-for-everyone toolset Webflow shipped in 2025 — all former Club
                GreenSock plugins included.
              </Legend>
            </section>

            {/* ── 04 Side-by-side code ───────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-api">
              <Head n={4} k={`${PAIRS.length} tasks`} id="vs-api">Side-by-side API.</Head>
              {PAIRS.map((p, i) => (
                <CodeSet
                  key={p.title}
                  n={`4.${i + 1}`}
                  title={p.title}
                  extra={p.extra}
                  items={[
                    { who: p.gsapWho ?? THEIRS, file: 'gsap.js', code: p.gsap },
                    { who: p.oursWho ?? OURS, file: 'app.js', code: p.ours, ours: true },
                  ]}
                />
              ))}
            </section>

            {/* ── 05 Why GSAP wins (honest) ──────────────────── */}
            <section id="when-gsap" className="h2h-sec" aria-labelledby="when-gsap-h">
              <Head n={5} k="their side" id="when-gsap-h">When GSAP is still the right call.</Head>
              <p className="h2h-p">
                We&#39;re being honest here. GSAP has 15 years of production hardening and some features we don&#39;t have yet:
              </p>
              <Calls items={WHEN_GSAP} />
            </section>

            {/* ── 06 More comparisons ────────────────────────── */}
            <section className="h2h-sec" aria-labelledby="vs-more">
              <Head n={6} k="the set" id="vs-more">More comparisons.</Head>
              <OtherSheets current="/vs-gsap" />
            </section>
          </div>
          <Toc items={TOC} />
        </div>

        {/* ── The last word ──────────────────────────────────────────────── */}
        <Closing
          n={7}
          title="Try it in 30 seconds."
          actions={
            <>
              <Link href="/docs" className="btn btn-solid" data-magnetic>Read the docs →</Link>
              <Link href="/guides/gsap-scrolltrigger-react" className="btn" data-magnetic>Migration guide →</Link>
            </>
          }
        >
          One <code>npm install</code>. No account. No license key. No config.
        </Closing>
      </div>
    </SiteShell>
  );
}
