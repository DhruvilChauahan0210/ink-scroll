/**
 * The GSAP vs svg-scroll-draw benchmark's results, typed, and the few
 * derivations the page makes from them.
 *
 * bench-gsap.json is written by scripts/bench-gsap.mjs and nothing else: every
 * number on /benchmarks/gsap-vs-svg-scroll-draw comes from it. To refresh it,
 * run `npm run bench:gsap` on an idle machine on mains power;
 * scripts/check-bench.mjs fails the build when it goes stale or disagrees with
 * competitors.ts.
 */
import raw from './bench-gsap.json';

export type Lib = 'none' | 'gsap' | 'ours' | 'ours-js';
export type Browser = 'chromium' | 'firefox' | 'webkit';
export type Summary = { n: number; median: number; p90: number; min: number; max: number; iqr: number };
export type MetricDef = { label: string; unit: string; browsers: Browser[]; trace?: boolean };

export type Cell = {
  scenario: string;
  lib: Lib;
  browser: Browser;
  throttle: number;
  speed: number;
  path: 'native' | 'js' | null;
  scroll: number;
  samples: Record<string, number[]>;
  summary: Record<string, Summary | null>;
};

export type Comparison = {
  scenario: string;
  browser: Browser;
  throttle: number;
  speed: number;
  a: 'gsap';
  b: 'ours' | 'ours-js';
  metric: string;
  diff: number;
  ci: [number, number] | null;
  winner: 'gsap' | 'ours' | 'ours-js' | 'none';
};

export type ParityEntry = {
  browser: Browser;
  scenario: string;
  pass: boolean;
  pairs: { a: string; b: string; rule: string; maxDiff: number | null; pass: boolean }[];
  paths: Record<string, string | null>;
};

export type BrowserEnv = { name: Browser; version: string; ua: string; gpu: string | null; vsyncHz: number; nativeScrollTimeline: boolean };

export type BenchResults = {
  provisional: boolean;
  meta: {
    date: string;
    git: { sha: string | null; dirty: boolean | null };
    machine: { cpu: string | null; cores: number; memGb: number; os: string; power: string };
    node: string;
    playwright: string;
    browsers: BrowserEnv[];
    versions: { gsap: string; svgScrollDraw: string; oursDistSha256: string };
    settings: {
      viewport: { width: number; height: number };
      dpr: number;
      runs: number;
      warmup: number;
      traces: number;
      speeds: number[];
      throttles: number[];
      idleMs: number;
      seed: number;
      wheelStepPx: number;
      network: boolean;
      args: string[];
    };
    durationMin: number;
  };
  metrics: Record<string, MetricDef>;
  scenarios: string[];
  parity: ParityEntry[];
  sizes: {
    method: string;
    gsap: { files: Record<string, number>; kib: Record<string, number> };
    ours: { main: number; reveal: number; mainPlusPin: number };
    loaded: string[];
  };
  cells: Cell[];
  comparisons: Comparison[];
};

export const BENCH = raw as unknown as BenchResults;

/** Every scenario, in page order, with what a reader needs to know about it. */
export const SCENARIO_INFO: Record<string, { short: string; title: string; what: string; engine: string }> = {
  'a-draw-one': {
    short: 'A · one path',
    title: 'One SVG path drawn on scroll',
    what: 'One long path in a 1200 × 600 SVG, with three viewports of text above and below. The core use case.',
    engine: 'svg-scroll-draw takes its native CSS path wherever the browser supports scroll timelines; “JS engine” is the same call with native: false.',
  },
  'b1-draw-many': {
    short: 'B1 · 40 SVGs',
    title: '40 separate SVGs, each drawn on its own scroll',
    what: 'Forty small SVGs of one path each, stacked down the page: forty ScrollTriggers against forty scrollDraw instances. The cost of many instances, and what they cost while idle.',
    engine: 'Native CSS path where supported; “JS engine” forces the JavaScript engine for all forty.',
  },
  'b2-draw-stagger': {
    short: 'B2 · stagger',
    title: 'One SVG, 40 staggered paths',
    what: 'Forty paths in one SVG with a 0.02 stagger. The GSAP setup is written to give the same per-path windows, which the parity gate checks.',
    engine: 'A stagger rules out the native path, so svg-scroll-draw runs its JavaScript engine here in every browser: JS against JS.',
  },
  'c1-reveal-idiomatic': {
    short: 'C1 · reveal, idiomatic',
    title: '60 cards revealed, each library’s own way',
    what: 'Sixty cards in a three-column grid. GSAP: ScrollTrigger.batch firing a timed 0.6 s tween, as its docs recommend. svg-scroll-draw: scrollReveal with its defaults, which scrubs each card with the scroll. The motion differs by design; the parity gate only checks both start hidden and end shown.',
    engine: 'scrollReveal always runs the JavaScript engine.',
  },
  'c2-reveal-matched': {
    short: 'C2 · reveal, matched',
    title: '60 cards revealed with the same motion',
    what: 'The same cards, with GSAP written to produce scrollReveal’s motion exactly: scrubbed fade-up 32px over top 88% → top 53%, ease-out, once, shifted per column. The engine against the engine.',
    engine: 'scrollReveal always runs the JavaScript engine.',
  },
  'd-pin-scrub': {
    short: 'D · pin + draw',
    title: 'A pinned section with a scrubbed drawing',
    what: 'A full-height panel pinned for two viewports while thirty paths draw across the pin. GSAP: a pinned, scrubbed timeline. svg-scroll-draw: scrollPin’s onProgress driving scrollDraw’s seek().',
    engine: 'scrollPin has no native path, so this is JavaScript on both sides.',
  },
};

export const LIB_LABEL: Record<Lib, string> = {
  none: 'No library',
  gsap: `GSAP ${BENCH.meta.versions.gsap}`,
  ours: `svg-scroll-draw ${BENCH.meta.versions.svgScrollDraw}`,
  'ours-js': 'svg-scroll-draw, JS engine',
};

export const BROWSER_LABEL: Record<Browser, string> = { chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' };

/** The cells of one scenario under one browser, throttle and speed, by library. */
export function cellsFor(scenario: string, browser: Browser, throttle: number, speed: number): Partial<Record<Lib, Cell>> {
  const out: Partial<Record<Lib, Cell>> = {};
  for (const c of BENCH.cells) {
    if (c.scenario === scenario && c.browser === browser && c.throttle === throttle && c.speed === speed) out[c.lib] = c;
  }
  return out;
}

/** Each browser × throttle × speed the run produced, Chromium first. */
export function conditions(): { browser: Browser; throttle: number; speed: number }[] {
  const seen = new Map<string, { browser: Browser; throttle: number; speed: number }>();
  for (const c of BENCH.cells) seen.set(`${c.browser}|${c.throttle}|${c.speed}`, { browser: c.browser, throttle: c.throttle, speed: c.speed });
  const order: Browser[] = ['chromium', 'firefox', 'webkit'];
  return [...seen.values()].sort(
    (x, y) => order.indexOf(x.browser) - order.indexOf(y.browser) || y.throttle - x.throttle || x.speed - y.speed,
  );
}

/** The winner of one metric in one condition, or 'none' when the CI includes zero. */
export function winnerOf(scenario: string, browser: Browser, throttle: number, speed: number, b: 'ours' | 'ours-js', metric: string) {
  return BENCH.comparisons.find(
    (c) => c.scenario === scenario && c.browser === browser && c.throttle === throttle && c.speed === speed && c.b === b && c.metric === metric,
  );
}

/** A number as the page prints it: up to three significant figures, no trailing noise. */
export function fmt(x: number | null | undefined, unit = ''): string {
  if (x == null || !Number.isFinite(x)) return '—';
  if (unit === 'share') return `${Math.round(x * 100)}%`;
  const abs = Math.abs(x);
  const s = abs >= 100 ? x.toFixed(0) : abs >= 10 ? x.toFixed(1) : abs >= 1 ? x.toFixed(2) : x.toFixed(2);
  return unit && unit !== '%' ? `${s} ${unit}` : unit === '%' ? `${s}%` : s;
}

export const conditionLabel = (browser: Browser, throttle: number, speed: number) =>
  `${BROWSER_LABEL[browser]} · ${throttle}× CPU · ${speed} px/s`;
