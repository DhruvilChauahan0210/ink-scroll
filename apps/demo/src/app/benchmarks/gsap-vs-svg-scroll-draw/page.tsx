import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import {
  BENCH,
  BROWSER_LABEL,
  LIB_LABEL,
  SCENARIO_INFO,
  cellsFor,
  conditionLabel,
  conditions,
  fmt,
  winnerOf,
  type Browser,
  type Cell,
  type Lib,
} from '@/data/bench-gsap';
import { RUN_NOTES } from '@/data/bench-gsap-notes';
import { jsonLd } from '@/lib/json-ld';
import { SiteShell } from '@/components/site/SiteShell';
import { CodeSet, Head, Nb, Toc } from '@/components/h2h/parts';
import { seoTitle } from '../../_lib/seo';
import './bench.css';

const PAGE_URL = 'https://svg-scroll-draw.vercel.app/benchmarks/gsap-vs-svg-scroll-draw';
const { meta, metrics: METRICS, provisional: PROVISIONAL } = BENCH;
const MEASURED = meta.date.slice(0, 10);
const RUNS = meta.settings.runs;
// Notes about this run's machine, shown only when they were written for this run.
const NOTES = RUN_NOTES.run === MEASURED ? RUN_NOTES.notes : [];
const SCENARIOS = BENCH.scenarios.filter((s) => SCENARIO_INFO[s]);
const CONDITIONS = conditions();
const LIBS: Lib[] = ['none', 'gsap', 'ours', 'ours-js'];

const TITLE = 'GSAP vs svg-scroll-draw: Runtime Benchmark';
const DESCRIPTION = `Main-thread time, frame pacing, input delay and idle cost for GSAP ${meta.versions.gsap} and svg-scroll-draw ${meta.versions.svgScrollDraw}, scenario by scenario, GSAP’s wins included.`;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: ['gsap performance', 'gsap benchmark', 'scrolltrigger performance', 'svg-scroll-draw benchmark', 'scroll animation performance', 'drawsvg performance'],
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  dateModified: MEASURED,
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
};

/* ── The code each page runs, read from the files the harness loads ────── */

/** setups/<scenario>.<lib>.js without the bench.setup(() => { … }) wrapper the harness times. */
function setupCode(scenario: string, lib: Lib): string | null {
  let src: string;
  try {
    src = readFileSync(join(process.cwd(), 'public/benchmarks/gsap/setups', `${scenario}.${lib}.js`), 'utf8');
  } catch {
    return null;
  }
  const m = src.match(/^([\s\S]*?)bench\.setup\(\(\) => \{\n([\s\S]*?)\n\}\);\s*$/);
  if (!m) return src.trim();
  const body = m[2].split('\n').map((l) => l.replace(/^ {2}/, '')).join('\n');
  return `${m[1]}${body}`.trim();
}

/* ── Findings, generated ─────────────────────────────────────────────────── */

const HEADLINE_METRIC = 'mainMs';
const headlineCondition = CONDITIONS.find((c) => c.browser === 'chromium' && c.throttle === Math.max(...meta.settings.throttles)) ?? CONDITIONS[0];

function pathLabel(c: Cell | undefined): string {
  if (!c || !c.path) return '';
  return c.path === 'native' ? 'native CSS path' : 'JS engine';
}

const wins = BENCH.comparisons.filter((c) => c.winner !== 'none');
const gsapWins = wins.filter((c) => c.winner === 'gsap');
const oursWins = wins.filter((c) => c.winner !== 'gsap');
const ties = BENCH.comparisons.length - wins.length;

function medianOf(c: { scenario: string; browser: Browser; throttle: number; speed: number }, lib: Lib, metric: string) {
  return cellsFor(c.scenario, c.browser, c.throttle, c.speed)[lib]?.summary[metric]?.median ?? null;
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

/** Median bars with a p90 whisker, and the page-alone median as a dashed rule. */
function Bars({ cells, metric, caption }: { cells: Partial<Record<Lib, Cell>>; metric: string; caption: string }) {
  const def = METRICS[metric];
  const rows = LIBS.filter((l) => cells[l]?.summary[metric]);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((l) => cells[l]!.summary[metric]!.p90), 0.001);
  const pct = (v: number) => `${((100 * v) / max).toFixed(2)}%`;
  const base = cells.none?.summary[metric]?.median;
  return (
    <figure className="bn-fig">
      <ul className="bn-bars">
        {rows.map((l) => {
          const s = cells[l]!.summary[metric]!;
          return (
            <li key={l} className={`bn-row bn-${l}`}>
              <span className="bn-lab">{LIB_LABEL[l]}</span>
              <span className="bn-track" aria-hidden="true">
                <span className="bn-bar" style={{ width: pct(s.median) }} />
                <span className="bn-wh" style={{ left: pct(s.median), width: `calc(${pct(s.p90)} - ${pct(s.median)})` }} />
                {base != null && <span className="bn-base" style={{ left: pct(base) }} />}
              </span>
              <span className="bn-val">{fmt(s.median, def.unit)}<span className="sr-only">, p90 {fmt(s.p90, def.unit)}</span></span>
            </li>
          );
        })}
      </ul>
      <figcaption className="bn-cap">{caption}</figcaption>
    </figure>
  );
}

const GROUPS: [string, string[]][] = [
  ['During the scroll', ['mainMs', 'scriptMs', 'styleMs', 'layoutMs', 'taskMs', 'frameP50', 'frameP95', 'frameP99', 'jankPct', 'longestFrame', 'longtaskCount', 'longtaskBlockMs', 'loafBlockMs', 'inputDelay', 'tapToFrame']],
  ['From a trace of the scroll', ['tracePaintMs', 'traceStyleLayoutMs', 'traceScriptMs', 'droppedFrames']],
  ['Startup', ['initMs', 'startupTaskMs', 'firstCorrectMs', 'flash', 'heapMb']],
  ['Parked mid-page', ['idleTaskMs', 'idleRafCalls']],
];

function ResultTable({ scenario, browser, throttle, speed }: { scenario: string; browser: Browser; throttle: number; speed: number }) {
  const cells = cellsFor(scenario, browser, throttle, speed);
  const libs = LIBS.filter((l) => cells[l]);
  return (
    <div className="bn-scroll">
      <table className="bn-table">
        <caption className="sr-only">{`${SCENARIO_INFO[scenario].title}, ${conditionLabel(browser, throttle, speed)}: median, with p90 below`}</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            {libs.map((l) => (
              <th key={l} scope="col" className={l.startsWith('ours') ? 'is-ours' : undefined}>
                {LIB_LABEL[l]}
                {pathLabel(cells[l]) && <span className="bn-sub">{pathLabel(cells[l])}</span>}
              </th>
            ))}
          </tr>
        </thead>
        {GROUPS.map(([group, keys]) => {
          const rows = keys.filter((k) => METRICS[k] && libs.some((l) => cells[l]?.summary[k]));
          if (!rows.length) return null;
          return (
            <tbody key={group}>
              <tr className="bn-group"><th scope="rowgroup" colSpan={libs.length + 1}>{group}</th></tr>
              {rows.map((k) => {
                const def = METRICS[k];
                const won = (['ours', 'ours-js'] as const).map((b) => winnerOf(scenario, browser, throttle, speed, b, k));
                return (
                  <tr key={k}>
                    <th scope="row">{def.label}{def.unit && def.unit !== 'share' ? <span className="bn-unit"> ({def.unit})</span> : null}</th>
                    {libs.map((l) => {
                      const s = cells[l]?.summary[k];
                      const isWin =
                        (l === 'gsap' && won.some((w) => w?.winner === 'gsap')) ||
                        ((l === 'ours' || l === 'ours-js') && won.some((w) => w?.winner === l));
                      return (
                        <td key={l} className={isWin ? 'is-win' : undefined}>
                          {s ? (
                            <>
                              <span className="bn-med">{fmt(s.median, def.unit === 'share' ? 'share' : '')}</span>
                              {isWin && <span className="bn-mark" title="Lower, and the 95% interval of the difference excludes zero"> ✓ lower</span>}
                              <span className="bn-p90">p90 {fmt(s.p90, def.unit === 'share' ? 'share' : '')}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function Finding({ scenario }: { scenario: string }) {
  const c = { scenario, ...headlineCondition };
  const cells = cellsFor(scenario, c.browser, c.throttle, c.speed);
  const unit = METRICS[HEADLINE_METRIC].unit;
  const g = medianOf(c, 'gsap', HEADLINE_METRIC);
  const o = medianOf(c, 'ours', HEADLINE_METRIC);
  const j = medianOf(c, 'ours-js', HEADLINE_METRIC);
  const n = medianOf(c, 'none', HEADLINE_METRIC);
  if (g == null || o == null) return null;
  const w = winnerOf(scenario, c.browser, c.throttle, c.speed, 'ours', HEADLINE_METRIC)?.winner ?? 'none';
  return (
    <li>
      <strong>{SCENARIO_INFO[scenario].short}:</strong> GSAP {fmt(g, unit)}, svg-scroll-draw {fmt(o, unit)} ({pathLabel(cells.ours)})
      {j != null ? <>, its JS engine {fmt(j, unit)}</> : null}
      {n != null ? <>; the page with no library {fmt(n, unit)}</> : null}.{' '}
      <span className="bn-verdict">
        {w === 'none' ? 'No measurable difference at this run’s size.' : w === 'gsap' ? 'GSAP lower, measurably.' : 'svg-scroll-draw lower, measurably.'}
      </span>
    </li>
  );
}

const TOC: [string, string][] = [
  ['findings', 'Findings'],
  ['setup', 'Machine and versions'],
  ...SCENARIOS.map((s): [string, string] => [s, SCENARIO_INFO[s].short]),
  ['parity', 'Parity gate'],
  ['sizes', 'Bytes'],
  ['method', 'Method'],
  ['threats', 'Threats to validity'],
  ['not-measured', 'Not measured'],
  ['run-it', 'Run it yourself'],
];

const metricLabel = (m: string) => METRICS[m]?.label ?? m;

export default function BenchmarkPage() {
  const browsers = meta.browsers;
  const gsapKib = BENCH.sizes.gsap.kib;
  return (
    <SiteShell
      active="/vs-gsap"
      crumbs={[['vs GSAP', '/vs-gsap'], ['Benchmark', '/benchmarks/gsap-vs-svg-scroll-draw']]}
      kicker="benchmark / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(pageJsonLd) }} />
      <div className="h2h bn">
        <header className="pg-head bn-head">
          <p className="pg-kicker">
            <span>benchmark / gsap vs svg-scroll-draw</span>
            <span>measured {MEASURED}</span>
          </p>
          <h1 className="pg-title">GSAP vs svg-scroll-draw, measured at runtime</h1>
          <p className="pg-lede">
            What each library costs the main thread while a page scrolls, scenario by scenario, in Chromium, Firefox and
            WebKit. Every number below is read from the results file the harness wrote, including every result GSAP
            wins. Bundle size is on <Link href="/vs-gsap#vs-size">the comparison page</Link>; this page is about the
            work done once the bytes have arrived.
          </p>
          {PROVISIONAL && (
            <div className="bn-prov" role="note">
              <strong>Provisional.</strong> These numbers come from a short pass ({RUNS} {RUNS === 1 ? 'run' : 'runs'} per cell) on a machine that
              was busy with other work. They prove the harness runs end to end; they are not the published result. A full
              run on an idle machine replaces them.
            </div>
          )}
          <dl className="pg-facts">
            <div><dt>Scenarios</dt><dd>{SCENARIOS.length}</dd></div>
            <div><dt>Browsers</dt><dd>{browsers.length}</dd></div>
            <div><dt>Runs per cell</dt><dd>{RUNS}</dd></div>
            <div><dt>Comparisons</dt><dd>{BENCH.comparisons.length}</dd></div>
          </dl>
        </header>

        <div className="h2h-body">
          <div className="h2h-main">
            <section className="h2h-sec" aria-labelledby="findings">
              <Head n={1} k="summary" id="findings">Findings.</Head>
              <p className="h2h-p">
                {metricLabel(HEADLINE_METRIC)}, median per gesture, {conditionLabel(headlineCondition.browser, headlineCondition.throttle, headlineCondition.speed)}:
              </p>
              <ul className="bn-list">
                {SCENARIOS.map((s) => <Finding key={s} scenario={s} />)}
              </ul>
              <p className="h2h-p">
                Across every metric, browser and throttle: svg-scroll-draw measurably lower in {oursWins.length}{' '}
                comparisons, GSAP measurably lower in {gsapWins.length}, and no measurable difference in {ties}. A side
                counts as lower only when the 95% bootstrap interval of the difference in medians excludes zero.
              </p>
              <h3 className="bn-h3">GSAP was measurably lower in</h3>
              {gsapWins.length ? (
                <ul className="bn-list">
                  {gsapWins.map((w) => (
                    <li key={`${w.scenario}${w.browser}${w.throttle}${w.speed}${w.b}${w.metric}`}>
                      <strong>{SCENARIO_INFO[w.scenario]?.short}</strong> · {conditionLabel(w.browser, w.throttle, w.speed)} ·{' '}
                      {metricLabel(w.metric)}: GSAP {fmt(medianOf(w, 'gsap', w.metric), METRICS[w.metric].unit === 'share' ? 'share' : METRICS[w.metric].unit)}{' '}
                      against {w.b === 'ours' ? 'svg-scroll-draw' : 'its JS engine'} {fmt(medianOf(w, w.b, w.metric), METRICS[w.metric].unit === 'share' ? 'share' : METRICS[w.metric].unit)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="h2h-p">No metric in this run.</p>
              )}
            </section>

            <section className="h2h-sec" aria-labelledby="setup">
              <Head n={2} k="environment" id="setup">Machine and versions.</Head>
              <div className="bn-scroll">
                <table className="bn-table bn-env">
                  <tbody>
                    <tr><th scope="row">Measured</th><td>{meta.date.replace('T', ' ').slice(0, 16)} UTC, in {meta.durationMin} min</td></tr>
                    <tr><th scope="row">Machine</th><td>{meta.machine.cpu}, {meta.machine.cores} cores, {meta.machine.memGb} GB, {meta.machine.os}, power: {meta.machine.power}</td></tr>
                    {browsers.map((b) => (
                      <tr key={b.name}>
                        <th scope="row">{BROWSER_LABEL[b.name]}</th>
                        <td>{b.version}, {b.vsyncHz} Hz, scroll timelines {b.nativeScrollTimeline ? 'supported' : 'not supported'}, GPU: {b.gpu ?? 'unknown'}</td>
                      </tr>
                    ))}
                    <tr><th scope="row">GSAP</th><td>{meta.versions.gsap}: gsap.min.js, ScrollTrigger.min.js, DrawSVGPlugin.min.js, unmodified</td></tr>
                    <tr><th scope="row">svg-scroll-draw</th><td>{meta.versions.svgScrollDraw} at {meta.git.sha?.slice(0, 7) ?? 'unknown'}{meta.git.dirty ? ' (uncommitted changes)' : ''}, ES modules from dist</td></tr>
                    <tr><th scope="row">Harness</th><td>Node {meta.node}, Playwright {meta.playwright}, seed {meta.settings.seed}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="h2h-src">
                Raw results, every sample: <a href="/benchmarks/gsap-vs-svg-scroll-draw/results.json">results.json</a>.
              </p>
            </section>

            {SCENARIOS.map((s, i) => {
              const info = SCENARIO_INFO[s];
              const code = (['gsap', 'ours', 'ours-js'] as Lib[])
                .map((l) => ({ l, code: setupCode(s, l) }))
                .filter((x): x is { l: Lib; code: string } => x.code != null);
              return (
                <section key={s} className="h2h-sec" aria-labelledby={s}>
                  <Head n={3 + i} k={info.short} id={s}>{info.title}.</Head>
                  <p className="h2h-p">{info.what}</p>
                  <p className="h2h-p">{info.engine}</p>
                  <CodeSet
                    n={`${3 + i}.1`}
                    title="The code each page runs"
                    items={code.map(({ l, code: c }) => ({ who: LIB_LABEL[l], file: `${s}.${l}.js`, code: c, ours: l !== 'gsap' }))}
                  />
                  <p className="h2h-src">
                    Open the scenario page:{' '}
                    {(['none', 'gsap', 'ours', 'ours-js'] as Lib[])
                      .filter((l) => code.some((c) => c.l === l) || l === 'none')
                      .map((l, k) => (
                        <span key={l}>
                          {k ? ' · ' : ''}
                          <a href={`/benchmarks/gsap/${s}.html?lib=${l}`}>{LIB_LABEL[l]}</a>
                        </span>
                      ))}
                  </p>
                  {CONDITIONS.map((c, k) => {
                    const cells = cellsFor(s, c.browser, c.throttle, c.speed);
                    if (!Object.keys(cells).length) return null;
                    return (
                      <details key={`${c.browser}${c.throttle}${c.speed}`} className="bn-cond" open={k === 0}>
                        <summary>{conditionLabel(c.browser, c.throttle, c.speed)}</summary>
                        {c.browser === 'chromium' && (
                          <Bars cells={cells} metric="mainMs" caption={`${metricLabel('mainMs')}: median bar, p90 whisker, the page with no library as the vertical rule.`} />
                        )}
                        <Bars cells={cells} metric="jankPct" caption={`${metricLabel('jankPct')}: median bar, p90 whisker, the page with no library as the vertical rule.`} />
                        <ResultTable scenario={s} browser={c.browser} throttle={c.throttle} speed={c.speed} />
                      </details>
                    );
                  })}
                </section>
              );
            })}

            <section className="h2h-sec" aria-labelledby="parity">
              <Head n={3 + SCENARIOS.length} k="equal work" id="parity">Parity gate.</Head>
              <p className="h2h-p">
                Before any timing, each library’s page is scrolled to eleven positions and every path’s drawn share, or
                every card’s opacity and offset, is read and compared with GSAP’s. A run stops if they disagree by more
                than the tolerance, so the timings compare the same work. The figure is the largest disagreement found,
                in units of that tolerance (1 is the limit).
              </p>
              <div className="bn-scroll">
                <table className="bn-table">
                  <thead>
                    <tr><th scope="col">Scenario</th><th scope="col">Browser</th><th scope="col">Against GSAP</th><th scope="col">Rule</th><th scope="col">Worst</th><th scope="col">Engine taken</th></tr>
                  </thead>
                  <tbody>
                    {BENCH.parity.flatMap((p) =>
                      p.pairs.map((q) => (
                        <tr key={`${p.scenario}${p.browser}${q.b}`}>
                          <td>{SCENARIO_INFO[p.scenario]?.short ?? p.scenario}</td>
                          <td>{BROWSER_LABEL[p.browser]}</td>
                          <td>{LIB_LABEL[q.b as Lib]}</td>
                          <td>{q.rule}</td>
                          <td>{q.maxDiff == null ? (q.pass ? 'pass' : 'fail') : fmt(q.maxDiff)}</td>
                          <td>{p.paths[q.b] === 'native' ? 'native CSS' : p.paths[q.b] === 'js' ? 'JS engine' : '—'}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="h2h-sec" aria-labelledby="sizes">
              <Head n={4 + SCENARIOS.length} k="bytes" id="sizes">Bytes.</Head>
              <p className="h2h-p">
                The scenarios load GSAP core and ScrollTrigger ({COMPETITORS.gsapScroll.gzipKb} KB), plus DrawSVGPlugin for
                the drawing scenarios ({COMPETITORS.gsapStack.gzipKb} KB). svg-scroll-draw’s main entry is{' '}
                {SELF.gzipKb} KB with every API in it, its reveal entry {SELF_ENTRIES.reveal} KB. Those are the figures on{' '}
                <Link href="/vs-gsap#vs-size">the size comparison</Link>, measured with gzip -9.
              </p>
              <p className="h2h-src">
                The harness re-measures the files it served and checks them against those figures: gsap.min.js{' '}
                {gsapKib['gsap.min.js']} KB, ScrollTrigger.min.js {gsapKib['ScrollTrigger.min.js']} KB,
                DrawSVGPlugin.min.js {gsapKib['DrawSVGPlugin.min.js']} KB; svg-scroll-draw main {BENCH.sizes.ours.main} KB,
                reveal {BENCH.sizes.ours.reveal} KB, main + pin {BENCH.sizes.ours.mainPlusPin} KB. {BENCH.sizes.method}
              </p>
            </section>

            <section className="h2h-sec" aria-labelledby="method">
              <Head n={5 + SCENARIOS.length} k="how" id="method">Method.</Head>
              <ul className="bn-list">
                <li>
                  The same page for every library: one HTML file per scenario takes <code>?lib=</code>, and a seeded
                  generator builds identical paths and cards. The page with no library is the baseline. Viewport{' '}
                  {meta.settings.viewport.width} × {meta.settings.viewport.height} at {meta.settings.dpr}× pixel ratio.
                </li>
                <li>
                  Each run gets a fresh browser context; the page loads, waits for fonts, then one second for GSAP’s
                  load-time refresh and svg-scroll-draw’s first measure to settle. Only then does the timed scroll start.
                </li>
                <li>
                  The scroll covers the whole page at {meta.settings.speeds.join(' and ')} px/s. In Chromium it is CDP’s
                  synthetic scroll gesture; in Firefox (smooth scrolling off) and WebKit, {meta.settings.wheelStepPx}px
                  wheel steps at the same rate. Three taps on a fixed button land at a quarter, half and three quarters
                  of the way.
                </li>
                <li>
                  Chromium runs at {meta.settings.throttles.join('× and ')}× CPU throttling; Firefox and WebKit have no
                  equivalent and run unthrottled. Main-thread times come from CDP’s performance counters read either side
                  of the gesture; frame times from requestAnimationFrame; long tasks and long animation frames from
                  PerformanceObserver.
                </li>
                <li>
                  After the scroll the page is parked mid-way for {meta.settings.idleMs / 1000} s to count what each
                  library does when nothing moves.
                </li>
                <li>
                  {meta.settings.warmup} warm-up round(s) are discarded, then {RUNS} timed rounds and, in Chromium,{' '}
                  {meta.settings.traces} traced round(s) for the paint split. Each round runs every cell once in a
                  seeded random order, in a freshly launched browser, so drift spreads across libraries.
                </li>
                {NOTES.map((note) => (
                  <li key={note}>{note}</li>
                ))}
                <li>
                  Medians and p90 are reported. A difference is called only when the 95% bootstrap interval of the
                  difference in medians excludes zero; otherwise the page says there is no measurable difference.
                </li>
              </ul>
            </section>

            <section className="h2h-sec" aria-labelledby="threats">
              <Head n={6 + SCENARIOS.length} k="read this" id="threats">Threats to validity.</Head>
              <ul className="bn-list">
                <li>
                  <strong>The native CSS path is our advantage.</strong> In A and B1, wherever the browser supports scroll
                  timelines, svg-scroll-draw runs no JavaScript per frame: the browser animates the stroke itself. That
                  compares a JavaScript library with the browser’s own CSS, which anyone can write by hand without either
                  library. Every native cell sits next to the JS-engine cell, which is the engine-against-engine number.
                  stroke-dashoffset is not composited, so style and paint still happen on the main thread either way.
                </li>
                <li>
                  <strong>Where svg-scroll-draw is JavaScript anyway</strong> (B2, C1, C2, D), the comparison is JS
                  against JS. These are the fairest head-to-heads.
                </li>
                <li>
                  <strong>Loading differs.</strong> GSAP loads as its UMD files in classic script tags; svg-scroll-draw as
                  ES modules through an import map, because its single-file script build has no scrollReveal or
                  scrollPin. Module scripts run after the document is parsed, so the first-correct-frame and flash
                  metrics partly measure the loading method rather than the library.
                </li>
                <li>
                  <strong>Defaults stay defaults.</strong> No gsap.config, lagSmoothing or ScrollTrigger.config
                  changes, and nothing beyond each scenario’s needs for svg-scroll-draw. Both libraries schedule work
                  with requestAnimationFrame; how much of it continues once the page stops moving is a real cost of each
                  design, and the parked metrics count it rather than hide it.
                </li>
                <li>
                  <strong>Startup is kept apart from the scroll.</strong> ScrollTrigger’s load-time refresh and
                  svg-scroll-draw’s first measure count under startup, not under the scroll.
                </li>
                <li>
                  <strong>Matched setups are translations.</strong> GSAP’s stagger maths in B2, the per-card triggers in
                  C2 (with a top-=32 offset, because ScrollTrigger measures a card with its starting offset applied) and
                  the explicit pin length in D exist only to reproduce svg-scroll-draw’s motion. The parity gate proves
                  each one.
                </li>
                <li>
                  <strong>Throttling is partial.</strong> Chromium’s CPU throttle slows the renderer main thread only;
                  compositor, raster and GPU work run at full speed, which flatters work done off the main thread for
                  both libraries.
                </li>
                <li>
                  <strong>Lab, not field.</strong> One machine; synthetic input, not a trackpad; no phone GPU. Run it on
                  the hardware you care about.
                </li>
                <li>
                  <strong>Author bias.</strong> svg-scroll-draw’s author wrote the harness. The code shown is the code
                  that runs, the scenario pages are public, and the GSAP setups follow GSAP’s documentation. If there is
                  a faster idiomatic GSAP setup,{' '}
                  <a href="https://github.com/DhruvilChauahan0210/ink-scroll/pulls">open a pull request</a> and it will
                  be re-run and published.
                </li>
                <li>
                  <strong>No cherry-picking.</strong> The page renders every cell and comparison in the results file.
                  The harness has no option to leave one out.
                </li>
              </ul>
            </section>

            <section className="h2h-sec" aria-labelledby="not-measured">
              <Head n={7 + SCENARIOS.length} k="gaps" id="not-measured">Not measured.</Head>
              <ul className="bn-list">
                <li>Main-thread counters, long tasks and the trace split exist in Chromium only; Firefox and WebKit report frame pacing, input delay, setup time and rAF calls.</li>
                <li>Tap-to-frame is the time from a tap to the frame after its handler ran, an approximation of INP rather than INP.</li>
                <li>Scroll-to-paint sync error (how far a drawing lags the scroll) is not measured yet; reading styles every frame would distort the timings, so it needs a separate pass.</li>
                <li>Resize and refresh cost, a 2× pixel ratio pass and real phones are not in this run.</li>
              </ul>
            </section>

            <section className="h2h-sec" aria-labelledby="run-it">
              <Head n={8 + SCENARIOS.length} k="reproduce" id="run-it">Run it yourself.</Head>
              <CodeSet
                n={`${8 + SCENARIOS.length}.1`}
                title="Clone, install, run"
                items={[{
                  who: 'Terminal',
                  file: 'sh',
                  code: `git clone https://github.com/DhruvilChauahan0210/ink-scroll
cd ink-scroll && npm ci
npx playwright install chromium firefox webkit
npm run bench:gsap               # the full run (hours)
npm run bench:gsap -- --quick    # a short pass, one speed
npm run bench:gsap -- --smoke    # parity gate only`,
                }]}
              />
              <p className="h2h-p">
                Results go to <code>apps/demo/src/data/bench-gsap.json</code>, which this page renders. Pull requests with
                results from other machines are welcome.
              </p>
              <Nb>
                Bundle size, licence and features are on <Link href="/vs-gsap">svg-scroll-draw vs GSAP</Link>; why scroll
                animations jank in the first place is in{' '}
                <Link href="/blog/scroll-animation-performance">the performance post</Link>.
              </Nb>
            </section>
          </div>
          <Toc items={TOC} />
        </div>
      </div>
    </SiteShell>
  );
}
