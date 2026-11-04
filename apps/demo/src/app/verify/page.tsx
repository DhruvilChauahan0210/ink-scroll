import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { seoTitle } from '../_lib/seo';
import { UNIT_TESTS, BROWSER_TESTS } from '@/data/facts';
import { SiteShell } from '@/components/site/SiteShell';
// After SiteShell, so this page's rules follow the shared ones in the cascade.
import '@/components/verify.css';
import { Delta } from '@/components/VerifyKit';
import { VerifyRecord, type RecordRow } from '@/components/VerifyRecord';
import {
  AttributeProof,
  GetProgressProof,
  OffScreenProof,
} from '@/components/VerifyProofs';
import {
  LiveParityProof,
  ProcessGuardProof,
  IdleCostProof,
  ReducedMotionProof,
} from '@/components/VerifyPhase1';
import {
  DestroyRestoreProof,
  SnapCallbackProof,
  HorizontalTriggerProof,
} from '@/components/VerifyPhase2';
import {
  EasingParityProof,
  SequenceCompletionProof,
  SplitLinesSpacingProof,
} from '@/components/VerifyPhase3';

export const metadata: Metadata = {
  title: seoTitle('Verify — live proof of the Phase 0, 1 and 2 fixes'),
  description:
    'Internal verification page. Renders each correctness fix live in the browser so it can be checked by eye rather than taken on trust.',
  // Internal engineering page — must not compete with the real docs in search.
  robots: { index: false, follow: false },
};

/* ── Measured bundle sizes ───────────────────────────────────────────────────
   Regenerate with: npm run size --workspace=packages/svg-scroll-draw
   CI fails the build if any entry drifts past its budget.

   This page is a record: these are the figures as measured when the work it
   describes landed, which is why check:claims leaves this file alone.        */
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
  { claim: 'Test count', before: '272', after: '531', note: 'read from vitest' },
  { claim: 'Example count', before: '13', after: '23', note: 'read from ExamplesPage' },
  { claim: 'Smaller than GSAP by', before: '8–10×', after: '~4×', note: 'main entry' },
  { claim: 'Coverage gate', before: '90 / 90 / 85 / 80', after: '90 / 90 / 82 / 82', note: 'against 91.3% real' },
];

/* ── The three phases ───────────────────────────────────────────────────────── */

type Phase = {
  rev: string;
  tag: string;
  heading: string;
  items: string[];
  sections: string;
  /** The first section the phase covers, for the record's zone link. */
  first: string;
  banner: { phase: string; title: string; blurb: string; bullets: [string, string][] };
};

const PHASES: Phase[] = [
  {
    rev: '0',
    tag: 'Phase 0',
    heading: 'Honesty & hygiene',
    items: ['5 false README claims', 'CI red on main', 'library never typechecked', '3 engine bugs', '2 CLI bugs'],
    sections: '01 – 05',
    first: '01',
    banner: {
      phase: 'Phase 0 · sections 01 – 05',
      title: 'Honesty and hygiene.',
      blurb:
        'Nothing here needed a browser to find. The package was advertising numbers that were measurably wrong, its own CI had been failing on every push, and the library was never typechecked — so a type error shipped in the engine and sat there across releases.',
      bullets: [
        ['Coverage', '74.6% → 85.9%, gate now passes'],
        ['Tests', '425 → 475'],
        ['Size claim', '~4.4 KB advertised, 9.0 KB real'],
        ['Guards added', 'size budgets + doc-claim checker in CI'],
      ],
    },
  },
  {
    rev: '1',
    tag: 'Phase 1',
    heading: 'Real browsers',
    items: ['native CSS ≠ JS engine', 'CDN build crashed', 'idle CPU burn', 'scrollSnap ignored a11y', 'morphTo silently wrong'],
    sections: '06 – 09',
    first: '06',
    banner: {
      phase: 'Phase 1 · sections 06 – 09',
      title: 'What a real browser found.',
      blurb:
        "Phase 0 could not prove the library worked, only that its paperwork was honest — every unit test, 478 of them at the time, ran in jsdom with getTotalLength stubbed and IntersectionObserver faked. A Playwright suite across Chromium, Firefox and WebKit now runs in CI, and the first thing it did was disprove the library's headline claim.",
      bullets: [
        ['Browser tests', '30, across Chromium · Firefox · WebKit'],
        ['Bugs found', '5, none of them findable in jsdom'],
        ['Headline claim', 'was false — native CSS ≠ JS engine'],
        ['Worst divergence', '0.114 in WebKit → now 0.0000'],
      ],
    },
  },
  {
    rev: '2',
    tag: 'Phase 2',
    heading: 'The rest of the surface',
    items: ['scrollHorizontal never moved', 'destroy() abandoned styles', 'onSnap fired twice', 'viewport override in the harness', 'no Range support = dead video'],
    sections: '10 – 15',
    first: '10',
    banner: {
      phase: 'Phase 2 · sections 10 – 15',
      title: 'Everything else.',
      blurb:
        "Phase 1 examined one API in a real browser and found five bugs. Everything else was unexamined, so this phase went through the rest of the surface: the other nine APIs, then Group / Sequence / Timeline / Cinematic, then scrollAnimate's own native fast path, then all eight framework wrappers and the CDN builds, and finally the same code again with no DOM at all. It found the worst defect of the three phases — an API that did nothing in the arrangement its own documentation prescribed — and ten more after that, including a server-side import that crashed the render and a CDN bundle shipping without the component it advertises. Sections 10–12 show three of them, and 13–15 the three 2.10.0 fixes; the rest are in the changelog for 2.10.0.",
      bullets: [
        ['Browser tests', '30 → 175, on all three engines'],
        ['Defects found', '14 in the library, 2 in the test harness'],
        ['Worst of them', 'scrollHorizontal never moved the track'],
        ['New guard', 'every test must fail against a broken build'],
      ],
    },
  },
];

/* ── What is still not proven ───────────────────────────────────────────────── */

const LIMITS: [string, string][] = [
  [
    `${UNIT_TESTS} unit tests are still jsdom`,
    `getTotalLength is stubbed to a constant and IntersectionObserver is faked. They verify engine arithmetic. The ${BROWSER_TESTS} Playwright tests per engine are what cover browser behaviour — now run on GitHub Actions before every release, not only on one laptop — and a separate suite with no DOM at all covers what happens on a server.`,
  ],
  [
    'The wrappers are tested through their contracts, not their build pipelines',
    'All eight now mount for real and are held to the same contract — the engine runs, unmounting leaks no observer and no frame loop, re-mounting works. But Svelte is exercised through its action functions rather than a compiled component, and Angular through its ref classes rather than a running Angular app. That is the whole public surface in both cases, and it is still not the same as a real build.',
  ],
  [
    'Astro and the web component still read their options once',
    'Since 2.17.0 the React, Vue, Nuxt, Solid, Svelte and Angular wrappers rebuild the engine when an option really changes, and keep it when a re-render passes equal options: a fresh inline object, a new callback. The browser suite checks both halves on every engine. The Astro scanner reads its data attributes once when it runs, and <scroll-draw> does not watch its attributes, so changing either afterwards does nothing until it is initialised again.',
  ],
  [
    'This page found a bug the e2e suite missed',
    'Section 06 kept reporting a constant 0.0201 offset. Trigger points were cached at init and only recomputed on a window resize, so a 21px layout shift during hydration left the JS engine permanently offset while the native CSS path stayed correct. Now fixed with a ResizeObserver — but only a busy, real page surfaced it, which says something about how much the isolated fixtures can prove.',
  ],
  [
    'And the e2e suite caught this page out',
    'Section 15 was withheld for months because its harness measured the two engines 0.83 apart with easing: "ease-out". The suite’s own ease-out case had passed all along. The page was wrong: the native cell was keyed by its label, the label changed once support was detected, and React replaced that cell after the library had attached to it — leaving a fresh, undrawn path that read as fully drawn. Keyed by role, it reads 0.0001. Both sweeps also jump instantly now; this page scrolls smoothly, and a smooth jump was still gliding when the samples were read.',
  ],
  [
    'Dev warnings still need opting into',
    'They were unreachable for CDN users entirely: IS_DEV is derived from process.env.NODE_ENV, and process does not exist in a browser without a bundler. 2.10.0 ships svg-scroll-draw.dev.global.js, which reports them — but you have to know to load it, and the production bundle has them removed at build time.',
  ],
];

/* ── The sections, in page order ────────────────────────────────────────────── */

type Kind = 'live proof' | 'measured' | 'record' | 'limits';

type Sec = {
  /** Index into PHASES, or null for the closing list of limits. */
  phase: number | null;
  kind: Kind;
  /** The contents entry. */
  short: string;
  title: string;
  lead: ReactNode;
  body: ReactNode;
};

const SECTIONS: Sec[] = [
  {
    phase: 0,
    kind: 'live proof',
    short: 'Inert stroke in Vue & Svelte',
    title: 'Generated Vue & Svelte files had an inert stroke.',
    lead: (
      <>
        The starter file from <code>npx svg-scroll-draw init</code> used JSX-style attribute names in
        HTML-parsed templates. Both graphics below request an identical 2.5px round stroke. Only one gets it.
      </>
    ),
    body: <AttributeProof />,
  },
  {
    phase: 0,
    kind: 'live proof',
    short: 'getProgress() frozen at zero',
    title: 'getProgress() was frozen at zero.',
    lead: (
      <>
        For every <code>autoplay</code> stroke animation, <code>currentAlpha</code> was only assigned on the
        clip-path branch — so the public <code>getProgress()</code> API reported 0.000 forever. The readout
        below is polled every frame from the real instance.
      </>
    ),
    body: <GetProgressProof />,
  },
  {
    phase: 0,
    kind: 'live proof',
    short: 'Off-screen pause / resume',
    title: 'Off-screen pause/resume burned the animation out.',
    lead: (
      <>
        Leaving the viewport set <code>startTime = null</code>. Because <code>null</code> coerces to{' '}
        <code>0</code>, a later <code>pause()</code> recorded the whole timestamp since page load as elapsed
        time — so <code>resume()</code> started a run already past its own duration and completed instantly,
        invisibly.
      </>
    ),
    body: <OffScreenProof />,
  },
  {
    phase: 0,
    kind: 'measured',
    short: 'Every size, measured',
    title: 'Every size figure is now measured.',
    lead: (
      <>
        The README claimed ~4.4 KB against a real 8.9 KB, directly beneath a bundlephobia badge showing the
        true number. These come from <code>npm run size</code>, which reads the built output and fails CI if
        any entry drifts past its budget.
      </>
    ),
    body: (
      <>
        <div className="vf-table-wrap">
          <table className="vf-table vf-sizes">
            <thead>
              <tr>
                <th>Entry point</th>
                <th className="is-r">Raw</th>
                <th className="is-r">Gzipped</th>
                <th className="vf-sizes-bar-h"><span className="sr-only">Gzipped, against the main entry</span></th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map(({ name, gzip, raw }) => (
                <tr key={name}>
                  <td className="is-mono">{name}</td>
                  <td className="is-r is-dim">{raw.toFixed(1)} KB</td>
                  <td className="is-r is-strong">{gzip.toFixed(1)} KB</td>
                  <td className="vf-sizes-bar">
                    <span className="vf-sizes-track">
                      <i style={{ width: `${(gzip / SIZES[0].gzip) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="vf-foot">9 of 21 entries shown — the full table lives in README.md.</p>
      </>
    ),
  },
  {
    phase: 0,
    kind: 'record',
    short: "Claims that can't be wrong",
    title: "Claims that were wrong, and now can't be.",
    lead: (
      <>
        <code>scripts/check-claims.mjs</code> derives the real test and example counts from source and fails
        the build when a doc disagrees. It caught a stale number mid-session, which is the only reason this
        table is right.
      </>
    ),
    body: (
      <div className="vf-claims">
        <div className="vf-claims-row vf-claims-hd" aria-hidden="true">
          <span>Claim</span>
          <span>Was</span>
          <span />
          <span>Is</span>
        </div>
        {CLAIMS.map(({ claim, before, after, note }) => (
          <div key={claim} className="vf-claims-row">
            <span className="vf-claims-k">
              {claim}
              <span>{note}</span>
            </span>
            <span className="vf-claims-b"><span className="sr-only">was </span>{before}</span>
            <svg className="vf-claims-arrow" viewBox="0 0 40 12" aria-hidden="true">
              <path d="M2 6 H36 M31 1.5 L36.5 6 L31 10.5" />
            </svg>
            <span className="vf-claims-a"><span className="sr-only">is </span>{after}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    phase: 1,
    kind: 'live proof',
    short: 'Native CSS vs the JS engine',
    title: 'Native CSS and the JS engine disagreed.',
    lead: (
      <>
        The library&apos;s headline claim is that the native CSS fast path and the JS engine are
        interchangeable. Nothing verified it, and it was false. Below, the same SVG is drawn twice at the
        same scroll offset — left on whatever the browser supports, right with <code>native: false</code>{' '}
        forced. <strong>Scroll slowly and watch Δ.</strong>
      </>
    ),
    body: <LiveParityProof />,
  },
  {
    phase: 1,
    kind: 'live proof',
    short: 'The CDN build crash',
    title: 'The CDN build crashed in a plain browser.',
    lead: (
      <>
        Every dev warning in 13 modules was guarded by a bare <code>process.env.NODE_ENV</code> check.{' '}
        <code>process</code> does not exist in a browser without a bundler, so reaching a warning threw
        instead of logging one. Both guards are evaluated below in a scope that has no <code>process</code>.
      </>
    ),
    body: <ProcessGuardProof />,
  },
  {
    phase: 1,
    kind: 'live proof',
    short: 'Work while the page sat still',
    title: 'The JS engine worked while the page sat still.',
    lead: (
      <>
        The rAF loop ran every frame for as long as the container was in view, whether or not the scroll
        position had moved — recomputing values that had not changed. This is the path Firefox and every
        pre-115 browser always take, so it is not a niche case.
      </>
    ),
    body: <IdleCostProof />,
  },
  {
    phase: 1,
    kind: 'live proof',
    short: 'scrollSnap & reduced motion',
    title: 'scrollSnap overrode prefers-reduced-motion.',
    lead: (
      <>
        The clearest accessibility defect in the library, and the readout below is live against your own OS
        setting.
      </>
    ),
    body: <ReducedMotionProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: 'scrollHorizontal never moved',
    title: 'scrollHorizontal never moved the track.',
    lead: (
      <>
        The worst defect in three phases of this work. The default trigger window was measured against the
        track itself — and a <code>sticky</code> stage pins that track at exactly one stage tall, so both
        ends of the window resolved to the same scroll position. Progress was then clamped at zero forever.
        The API did nothing, in precisely the CSS setup its own docs prescribe.
      </>
    ),
    body: <HorizontalTriggerProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: 'destroy() left elements stranded',
    title: 'destroy() left elements stranded mid-animation.',
    lead: (
      <>
        The engine wrote <code>opacity</code> and <code>transform</code> inline every frame and removed
        neither on teardown. Destroy a component while its reveal was half-finished and it stayed
        half-finished — permanently faded and offset, with nothing left running to correct it. Worse for the
        visitor than never animating at all.
      </>
    ),
    body: <DestroyRestoreProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: 'onSnap fired twice',
    title: 'onSnap fired twice for a single snap.',
    lead: (
      <>
        <code>scrollSnap</code> reacted to the scroll event its own animated scroll produced, treating it as
        a fresh user gesture and announcing a snap it had already announced. Guaranteed under reduced
        motion, intermittent otherwise — a public callback that fires once or twice depending on the easing
        curve.
      </>
    ),
    body: <SnapCallbackProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: 'A finished sequence at 0%',
    title: 'A finished sequence reported 0%.',
    lead: (
      <>
        <code>scrollDrawSequence</code> delegates <code>getProgress()</code> to whichever step is active.
        When the last step completed, the active index advanced past the end of the array, so the getter
        read from an undefined instance and fell back to zero — a sequence that had visibly finished
        reported that nothing had happened.
      </>
    ),
    body: <SequenceCompletionProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: "split: 'lines' lost its spaces",
    title: "split: 'lines' deleted the spaces between words.",
    lead: (
      <>
        The only one of the three you can see without instrumentation. <code>splitIntoLines</code> groups
        words by <code>offsetTop</code>, and the whitespace nodes between them were dropped rather than
        reinserted — so a split headline rendered as one unbroken word. The sentence below is the test:
        read it.
      </>
    ),
    body: <SplitLinesSpacingProof />,
  },
  {
    phase: 2,
    kind: 'live proof',
    short: 'Named easings on both engines',
    title: 'A named easing drew a different curve on the native path.',
    lead: (
      <>
        Section 06 proves the two engines agree on the default curve, where there is nothing to get wrong.
        Before 2.10.0 the native path handed CSS the keyword of the same name — <code>ease-out</code> became{' '}
        <code>animation-timing-function: ease-out</code> — but the keywords are fixed cubic-béziers and this
        library’s easings are its own curves, so the two engines drew up to 0.069 apart mid-scroll. The
        same SVG below runs <code>easing: &apos;ease-out&apos;</code> on both.
      </>
    ),
    body: <EasingParityProof />,
  },
  {
    phase: null,
    kind: 'limits',
    short: 'What still is not proven',
    title: 'What still is not proven.',
    lead: 'The limits, kept up to date rather than quietly dropped as they shrink.',
    body: (
      <ol className="vf-limits">
        {LIMITS.map(([t, d], i) => (
          <li key={t}>
            <span className="vf-limits-n">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <strong>{t}</strong>
              <span className="vf-limits-d">{d}</span>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
];

const pad = (n: number) => String(n).padStart(2, '0');
const sid = (n: number) => `vf-${pad(n)}`;
const numbered = SECTIONS.map((s, i) => ({ ...s, n: i + 1 }));
const LIVE = SECTIONS.filter((s) => s.kind === 'live proof').length;
const OPEN_FIGS = numbered.filter((s) => s.phase === null);

/** The record's rows: the three phases, then what is still open. */
const RECORD: RecordRow[] = [
  ...PHASES.map((p) => ({
    rev: p.rev,
    tag: p.tag,
    heading: p.heading,
    items: p.items,
    zone: p.sections,
    href: `#vf-${p.first}`,
  })),
  {
    rev: null,
    tag: 'Open',
    heading: 'Not yet proven',
    items: [`${LIMITS.length} limits, kept up to date`],
    zone: OPEN_FIGS.map((s) => pad(s.n)).join(', '),
    href: `#${sid(OPEN_FIGS[0].n)}`,
  },
];

/* ── Pieces ─────────────────────────────────────────────────────────────────── */

/** A phase opens like a new revision of the sheet: its delta, its range, its figures. */
function PhaseBand({ p, i }: { p: Phase; i: number }) {
  return (
    <section className="vf-phase" aria-labelledby={`vf-phase-${i}`}>
      <div className="tb vf-tb">
        <span className="tb-n"><Delta rev={p.rev} /></span>
        <span>{p.banner.phase.split(' · ')[0]}</span>
        <span>{p.banner.phase.split(' · ')[1]}</span>
      </div>
      <h2 id={`vf-phase-${i}`} className="vf-phase-t">{p.banner.title}</h2>
      <p className="vf-phase-b">{p.banner.blurb}</p>
      <dl className="vf-phase-facts">
        {p.banner.bullets.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Section({ s }: { s: Sec & { n: number } }) {
  const id = sid(s.n);
  const phase = s.phase === null ? null : PHASES[s.phase];
  return (
    <section className="vf-sec" aria-labelledby={id}>
      <div className="tb vf-tb">
        <span className="tb-n">{pad(s.n)}</span>
        {phase && <span className="vf-tb-rev"><Delta rev={phase.rev} /> {phase.tag.toLowerCase()}</span>}
        <span>{s.kind}</span>
        <a href={`#${id}`} className="tb-link" aria-label={`Link to section ${pad(s.n)}`}>#</a>
      </div>
      <h2 id={id} className="vf-h2">{s.title}</h2>
      <p className="vf-lede">{s.lead}</p>
      {s.kind === 'live proof' ? (
        <figure className="vf-fig">
          <figcaption className="vf-fig-cap">
            <span className="vf-fig-n">fig. {pad(s.n)}</span>
            <span>live — measured in this browser</span>
          </figcaption>
          <div className="vf-fig-body">{s.body}</div>
        </figure>
      ) : (
        s.body
      )}
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function VerifyPage() {
  const groups = [
    ...PHASES.map((p, pi) => ({ key: p.tag, rev: p.rev as string | null, label: p.heading, items: numbered.filter((s) => s.phase === pi) })),
    { key: 'Open', rev: null, label: 'Still open', items: OPEN_FIGS },
  ];

  return (
    <SiteShell active="/verify" kicker="verify / your turn">
      <div className="vf">

        {/* ── Opening ──────────────────────────────────────── */}
        <header className="pg-head vf-head">
          <div>
            <p className="pg-kicker">
              <span>verify / internal · noindex</span>
              <span>sections 01 – {pad(SECTIONS.length)}</span>
            </p>
            <h1 className="pg-title vf-title">Verify.</h1>
            <p className="pg-lede">
              Three phases of correctness work, most of which has no UI surface — engine internals, CI gates,
              packaging, README numbers. This page renders the parts that <em>can</em> be seen, so they can be
              checked by eye instead of taken on trust. Every section states what was broken, then
              demonstrates it live in this browser.
            </p>
            <dl className="pg-facts">
              <div><dt>Phases</dt><dd>{PHASES.length}</dd></div>
              <div><dt>Sections</dt><dd>{SECTIONS.length}</dd></div>
              <div><dt>Live proofs</dt><dd>{LIVE}</dd></div>
              <div><dt>Not yet proven</dt><dd>{LIMITS.length}</dd></div>
            </dl>
          </div>
          <VerifyRecord rows={RECORD} />
        </header>

        {/* Phones and tablets: the phases as a strip of jump links. */}
        <nav className="vf-jump" aria-label="Phases">
          {groups.map((g) => (
            <a key={g.key} href={`#${sid(g.items[0].n)}`}>
              {g.rev === null ? <span className="vf-jump-open" aria-hidden="true">△</span> : <Delta rev={g.rev} />}
              {g.label}
              <span className="vf-jump-n">{pad(g.items[0].n)}{g.items.length > 1 ? `–${pad(g.items[g.items.length - 1].n)}` : ''}</span>
            </a>
          ))}
        </nav>

        <div className="vf-body">
          <nav className="vf-toc" aria-label="On this sheet">
            <p className="vf-toc-h">on this sheet</p>
            {groups.map((g) => (
              <div key={g.key} className="vf-toc-g">
                <p className="vf-toc-gh">
                  {g.rev === null ? <span className="vf-jump-open" aria-hidden="true">△</span> : <Delta rev={g.rev} />}
                  {g.key === 'Open' ? g.label : `${g.key} · ${g.label}`}
                </p>
                {g.items.map((s) => (
                  <a key={s.n} href={`#${sid(s.n)}`} className="vf-toc-a">
                    <span>{pad(s.n)}</span>
                    {s.short}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <div className="vf-main">
            {PHASES.map((p, pi) => (
              <div key={p.tag} className="vf-group">
                <PhaseBand p={p} i={pi} />
                {numbered.filter((s) => s.phase === pi).map((s) => (
                  <Section key={s.n} s={s} />
                ))}
              </div>
            ))}
            {OPEN_FIGS.map((s) => (
              <Section key={s.n} s={s} />
            ))}

            <div className="vf-colophon">
              <div className="tb vf-tb">
                <span className="tb-n">rec</span>
                <span>as merged</span>
              </div>
              <p>
                v2.10.0, merged to <code>main</code> · 531 unit tests + 175 browser tests per engine (525 runs
                across Chromium, Firefox and WebKit) · 60 mutations, each caught by the one test named for it ·
                91% line coverage · <code>npm run verify</code> and <code>npm run test:e2e</code> both exit 0
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
