import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import {
  AttributeProof,
  GetProgressProof,
  OffScreenProof,
} from '@/components/VerifyProofs';

export const metadata: Metadata = {
  title: 'Verify — live proof of the Phase 0 fixes',
  description:
    'Internal verification page. Renders each correctness fix live in the browser so it can be checked by eye rather than taken on trust.',
  // Internal engineering page — must not compete with the real docs in search.
  robots: { index: false, follow: false },
};

/* ── Measured bundle sizes ───────────────────────────────────────────────────
   Regenerate with: npm run size --workspace=packages/svg-scroll-draw
   CI fails the build if any entry drifts past its budget.                    */
const SIZES = [
  { name: 'svg-scroll-draw', gzip: 9.0, raw: 27.1 },
  { name: 'svg-scroll-draw/group', gzip: 7.6, raw: 23.6 },
  { name: 'svg-scroll-draw/reveal', gzip: 3.9, raw: 9.2 },
  { name: 'svg-scroll-draw/timeline', gzip: 3.0, raw: 7.0 },
  { name: 'svg-scroll-draw/text', gzip: 2.3, raw: 5.4 },
  { name: 'svg-scroll-draw/video', gzip: 1.9, raw: 3.9 },
  { name: 'svg-scroll-draw/pin', gzip: 1.5, raw: 3.3 },
  { name: 'svg-scroll-draw/snap', gzip: 1.3, raw: 2.5 },
  { name: 'svg-scroll-draw/lenis', gzip: 0.2, raw: 0.4 },
];

const CLAIMS = [
  { claim: 'Bundle size (main entry)', before: '~4.4 KB', after: '9.0 KB', note: 'measured from dist/' },
  { claim: 'Raw ESM size', before: '11.9 KB', after: '27.1 KB', note: 'measured from dist/' },
  { claim: 'Test count', before: '272', after: '461', note: 'read from vitest' },
  { claim: 'Example count', before: '13', after: '23', note: 'read from ExamplesPage' },
  { claim: 'Smaller than GSAP by', before: '8–10×', after: '~4×', note: 'main entry' },
  { claim: 'Coverage gate', before: '90 / 90 / 85 / 80', after: '85 / 85 / 77 / 79', note: 'against 85.9% real' },
];

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
      <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
        svg-scroll-draw
      </Link>
      <div className="hidden lg:flex items-center gap-2">
        {['Home', 'Docs', 'Examples', 'Blog', 'Changelog'].map((l) => (
          <Link
            key={l}
            href={l === 'Home' ? '/' : `/${l.toLowerCase()}`}
            className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium"
          >
            {l}
          </Link>
        ))}
      </div>
      <div className="flex lg:hidden">
        <MobileMenu />
      </div>
    </nav>
  );
}

function Section({
  num,
  title,
  lead,
  children,
}: {
  num: string;
  title: string;
  lead: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-mono font-medium">
          {num}
        </p>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-3">
          {title}
        </h2>
        <p className="text-[14px] sm:text-[15px] text-graphite-border leading-relaxed max-w-2xl mb-8">
          {lead}
        </p>
        {children}
      </div>
    </section>
  );
}

export default function VerifyPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <Nav />

      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-graphite-border text-graphite-border">
              internal · noindex
            </span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(32px,7vw,72px)] leading-[0.9] tracking-[-0.04em] mb-6">
            Verify.
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed max-w-2xl">
            Most of the Phase&nbsp;0 work has no UI surface — engine internals, CI gates, packaging,
            README numbers. This page renders the parts that <em>can</em> be seen, so they can be
            checked by eye instead of taken on trust. Each section states what was broken, then
            demonstrates it live.
          </p>
        </div>
      </header>

      <Section
        num="01"
        title="Generated Vue & Svelte files had an inert stroke."
        lead={
          <>
            The starter file from <code className="font-mono">npx svg-scroll-draw init</code> used
            JSX-style attribute names in HTML-parsed templates. Both graphics below request an
            identical 2.5px round stroke. Only one gets it.
          </>
        }
      >
        <AttributeProof />
      </Section>

      <Section
        num="02"
        title="getProgress() was frozen at zero."
        lead={
          <>
            For every <code className="font-mono">autoplay</code> stroke animation,{' '}
            <code className="font-mono">currentAlpha</code> was only assigned on the clip-path
            branch — so the public <code className="font-mono">getProgress()</code> API reported
            0.000 forever. The readout below is polled every frame from the real instance.
          </>
        }
      >
        <GetProgressProof />
      </Section>

      <Section
        num="03"
        title="Off-screen pause/resume burned the animation out."
        lead={
          <>
            Leaving the viewport set <code className="font-mono">startTime = null</code>. Because{' '}
            <code className="font-mono">null</code> coerces to <code className="font-mono">0</code>,
            a later <code className="font-mono">pause()</code> recorded the whole timestamp since
            page load as elapsed time — so <code className="font-mono">resume()</code> started a run
            already past its own duration and completed instantly, invisibly.
          </>
        }
      >
        <OffScreenProof />
      </Section>

      <Section
        num="04"
        title="Every size figure is now measured."
        lead={
          <>
            The README claimed ~4.4 KB against a real 8.9 KB, directly beneath a bundlephobia badge
            showing the true number. These come from{' '}
            <code className="font-mono">npm run size</code>, which reads the built output and fails
            CI if any entry drifts past its budget.
          </>
        }
      >
        <div className="rounded-2xl border border-pitch-black overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-marketplace-gray border-b border-pitch-black">
                <th className="text-left font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Entry point
                </th>
                <th className="text-right font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Raw
                </th>
                <th className="text-right font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Gzipped
                </th>
                <th className="px-4 py-2.5 w-1/3" />
              </tr>
            </thead>
            <tbody>
              {SIZES.map(({ name, gzip, raw }) => (
                <tr key={name} className="border-b border-subtle-ash last:border-0">
                  <td className="px-4 py-2.5 font-mono text-[12px]">{name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-graphite-border">
                    {raw.toFixed(1)} KB
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] font-bold">
                    {gzip.toFixed(1)} KB
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="h-2 rounded-full bg-subtle-ash overflow-hidden">
                      <div
                        className="h-full bg-creator-pink"
                        style={{ width: `${(gzip / SIZES[0].gzip) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-graphite-border mt-3 font-mono">
          9 of 21 entries shown — the full table lives in README.md.
        </p>
      </Section>

      <Section
        num="05"
        title="Claims that were wrong, and now can't be."
        lead={
          <>
            <code className="font-mono">scripts/check-claims.mjs</code> derives the real test and
            example counts from source and fails the build when a doc disagrees. It caught a stale
            number mid-session, which is the only reason this table is right.
          </>
        }
      >
        <div className="rounded-2xl border border-pitch-black overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-marketplace-gray border-b border-pitch-black">
                <th className="text-left font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Claim
                </th>
                <th className="text-left font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Was
                </th>
                <th className="text-left font-mono text-[11px] uppercase tracking-wider text-graphite-border px-4 py-2.5">
                  Is
                </th>
              </tr>
            </thead>
            <tbody>
              {CLAIMS.map(({ claim, before, after, note }) => (
                <tr key={claim} className="border-b border-subtle-ash last:border-0">
                  <td className="px-4 py-3">
                    {claim}
                    <span className="block text-[11px] font-mono text-graphite-border">{note}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-firecracker-orange line-through">
                    {before}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold">{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        num="06"
        title="What this page cannot show you."
        lead="Being straight about the limits of visual verification."
      >
        <ul className="space-y-3 text-[14px] leading-relaxed">
          {[
            ['CI going green', 'Only visible on GitHub Actions once the branch is pushed. Locally: npm run verify.'],
            ['The README rewrite', 'Renders on github.com and npmjs.com, not on this site.'],
            ['Typecheck fix', 'npm run typecheck in packages/svg-scroll-draw — silence is the pass.'],
            ['461 unit tests', 'They all run in jsdom with getTotalLength stubbed to a constant. They prove internal arithmetic, not browser behaviour.'],
            [
              'Native CSS vs JS parity',
              'Still unverified. The headline claim — that animation-timeline: view() reproduces the JS engine exactly — has no test behind it. That is Phase 1, and it needs Playwright across Chromium, WebKit and Firefox.',
            ],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="text-graphite-border font-mono shrink-0">—</span>
              <span>
                <strong>{t}</strong>
                <span className="block text-graphite-border">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="px-4 sm:px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-mono text-graphite-border">
            Branch <code>phase0-production-ready</code> · 6 commits ·{' '}
            <code>npm run verify</code> exits 0
          </p>
        </div>
      </footer>
    </div>
  );
}
