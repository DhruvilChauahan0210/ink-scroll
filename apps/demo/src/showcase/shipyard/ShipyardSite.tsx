'use client';

import './shipyard.css';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { scrollDrawSequence } from 'svg-scroll-draw/group';
import { Site } from '../kit/Site';
import { RunPage, Av, Check, MarkGlyph } from './RunPage';

/*
 * Shipyard — a CI/CD product's home page. The centrepiece walks through one
 * run, stage by stage, down a rail: each stage's icon draws only after the one
 * before it has finished (scrollDrawSequence), and onComplete marks the stage
 * passed — its node, its rail segment, its chip and the sticky run card all
 * turn green as it lands. The stages sit a scroll-window apart on purpose: the
 * sequence resumes each step from the live scroll position, so icons sharing
 * one row would all finish together.
 */

const Mark = () => <span className="sy-mark" aria-hidden="true"><MarkGlyph /></span>;

/* ── The four stage icons, drawn on scroll ─────────────────────────────── */

const ICONS: string[][] = [
  // Commit — the main line, the commit, and a branch merging in
  ['M24 3 V16.5', 'M31.5 24 a7.5 7.5 0 1 1 -15 0 a7.5 7.5 0 1 1 15 0', 'M24 31.5 V45', 'M9 4 V12 C9 19 13 22 17.2 22.6', 'M12 8 a3 3 0 1 1 -6 0 a3 3 0 1 1 6 0', 'M31 30 H41 a2.5 2.5 0 0 1 2.5 2.5 V35.5 a2.5 2.5 0 0 1 -2.5 2.5 H31 L28.5 34 Z'],
  // Build — a package, its tape, and the cached layer under it
  ['M24 4 L40 13 V31 L24 40 L8 31 V13 Z', 'M8 13 L24 22 L40 13', 'M24 22 V40', 'M16 8.5 L32 17.5 V24.5', 'M4 36 L24 47 L44 36'],
  // Test — a clipboard of passing checks
  ['M16 7 H11 a3 3 0 0 0 -3 3 V42 a3 3 0 0 0 3 3 H37 a3 3 0 0 0 3 -3 V10 a3 3 0 0 0 -3 -3 H32', 'M18 3.5 H30 a2 2 0 0 1 2 2 V9 a2 2 0 0 1 -2 2 H18 a2 2 0 0 1 -2 -2 V5.5 a2 2 0 0 1 2 -2 Z', 'M14 20 l2.6 2.6 l4.8 -5', 'M25 20 H34', 'M14 29 l2.6 2.6 l4.8 -5', 'M25 29 H34', 'M14 38 l2.6 2.6 l4.8 -5', 'M25 38 H31'],
  // Deploy — a globe, its meridian and latitudes, and a release arrow
  ['M40 24 a16 16 0 1 1 -32 0 a16 16 0 1 1 32 0', 'M24 8 C17.5 13 17.5 35 24 40 C30.5 35 30.5 13 24 8', 'M8 24 H40', 'M10.5 15.5 H37.5', 'M10.5 32.5 H37.5', 'M38 2.5 V12 M33.5 6.5 L38 2 L42.5 6.5'],
];

const TERM: [string, ReactNode][] = [
  ['p', <><span className="sy-c-path">~/storefront</span> <span className="sy-c-br">main</span> <span className="sy-c-dim">$</span> git push</>],
  ['dim', 'To git.fernway.dev:web/storefront.git'],
  ['dim', '   9b1d2f0..a3f9c1e  main -> main'],
  ['sy', <><span className="sy-c-sy">shipyard</span> run <b>#1842</b> queued for a3f9c1e</>],
  ['sy', <><span className="sy-c-sy">shipyard</span> affected <b>@fernway/checkout</b>, <b>@fernway/api-client</b></>],
  ['sy', <><span className="sy-c-sy">shipyard</span> skipping 29 unchanged packages</>],
  ['sy', <><span className="sy-c-sy">shipyard</span> <span className="sy-c-link">shipyard.app/fernway/storefront/1842</span></>],
];

const MISSES = new Set([37, 141]);

const SHARDS = [
  { n: 1, w: 0.95, t: '1m 08s', c: 162 },
  { n: 2, w: 0.97, t: '1m 10s', c: 158 },
  { n: 3, w: 0.93, t: '1m 07s', c: 171 },
  { n: 4, w: 1, t: '1m 12s', c: 149, flaky: true },
  { n: 5, w: 0.96, t: '1m 09s', c: 160 },
  { n: 6, w: 0.98, t: '1m 11s', c: 155 },
  { n: 7, w: 0.92, t: '1m 06s', c: 168 },
  { n: 8, w: 0.94, t: '1m 08s', c: 161 },
];

const REGIONS = [
  { k: 'iad1', city: 'Washington, D.C.', p: '38 ms' },
  { k: 'fra1', city: 'Frankfurt', p: '41 ms' },
  { k: 'hnd1', city: 'Tokyo', p: '44 ms' },
];

const STAGES: { k: string; t: string; s: number; h: string; d: string; panel: ReactNode }[] = [
  {
    k: 'Commit', t: '0.4s', s: 0.4,
    h: 'Push, and the run starts.',
    d: 'Shipyard picks up the commit in under a second, reads your workspace graph and queues only what the change can reach — two packages of 31, this time.',
    panel: (
      <div className="sy-term">
        <div className="sy-term-bar"><span className="sy-lights"><i /><i /><i /></span><span>zsh — fernway/storefront</span></div>
        <div className="sy-term-body">{TERM.map(([k, l], i) => <div key={i} className={`is-${k}`}>{l}</div>)}</div>
      </div>
    ),
  },
  {
    k: 'Build', t: '48s', s: 48,
    h: 'Build only what changed.',
    d: 'Every task’s output is cached remotely and shared by the whole team, so unchanged packages are restored in milliseconds instead of rebuilt from scratch.',
    panel: (
      <div className="sy-panel">
        <div className="sy-panel-h"><b>Remote cache</b><span>214 tasks · 1.2 GB</span></div>
        <div className="sy-cells" aria-hidden="true">{Array.from({ length: 214 }, (_, i) => <i key={i} className={MISSES.has(i) ? 'miss' : ''} />)}</div>
        <div className="sy-legend"><span><i />212 restored from cache</span><span><i className="miss" />2 rebuilt</span></div>
        <div className="sy-compare">
          <div><span>Cold build</span><b><i style={{ width: '100%' }} /></b><em>6m 40s</em></div>
          <div className="on"><span>On Shipyard</span><b><i style={{ width: '12%' }} /></b><em>48s</em></div>
        </div>
      </div>
    ),
  },
  {
    k: 'Test', t: '1m 12s', s: 72,
    h: 'Eight shards, finishing together.',
    d: 'Test files are dealt out by how long each took over the last 50 runs, so the slowest shard is never far behind the fastest. A flaky test retries once, then gets flagged.',
    panel: (
      <div className="sy-panel">
        <div className="sy-panel-h"><b>vitest · 1,284 tests</b><span>split by timing</span></div>
        <ul className="sy-shards">
          {SHARDS.map((s) => (
            <li key={s.n}>
              <span className="sy-sh-n">{s.n}/8</span>
              <span className="sy-sh-bar"><i style={{ width: `${s.w * 100}%` }} /></span>
              <time>{s.t}</time>
              <span className="sy-sh-c">{s.flaky ? <em>1 retried</em> : `${s.c} tests`}</span>
            </li>
          ))}
        </ul>
        <div className="sy-tally"><span className="ok">1,284 passed</span><span>0 failed</span><span>3 skipped</span><span className="sy-tally-r">p95 shard spread 6s</span></div>
      </div>
    ),
  },
  {
    k: 'Deploy', t: '21s', s: 21,
    h: 'Live in three regions, with an undo.',
    d: 'Green on main promotes to production everywhere at once. If the error rate crosses 2% in the first ten minutes, Shipyard rolls back to the last good build by itself.',
    panel: (
      <div className="sy-panel">
        <div className="sy-panel-h"><b>Production · fernway.com</b><span className="sy-live">Live</span></div>
        <ul className="sy-regions">
          {REGIONS.map((r) => (
            <li key={r.k}><code>{r.k}</code><span>{r.city}</span><span className="sy-traffic"><i /></span><em>p50 {r.p}</em></li>
          ))}
        </ul>
        <div className="sy-promote">
          <span>Promoted <code>a3f9c1e</code> · replaces <code>9b1d2f0</code></span>
          <span className="sy-btn-g">Instant rollback</span>
        </div>
        <p className="sy-watch"><span className="sy-dot" />Error rate 0.02% · watching for 9 more minutes</p>
      </div>
    ),
  },
];

const fmt = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`);

function Chain() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [done, setDone] = useState(0);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as Element[];
    // One stage at a time: each icon waits for the one before it to finish.
    const seq = scrollDrawSequence(els, {
      easing: 'ease-out',
      speed: 1.3,
      trigger: { start: 'top 80%', end: 'top 30%' },
      // Fires as each stage finishes drawing — mark that stage passed.
      onComplete: () => setDone((n) => Math.min(n + 1, STAGES.length)),
    });
    return () => seq.destroy();
  }, []);

  const state = (i: number) => (i < done ? 'is-done' : i === done ? 'is-run' : 'is-queued');
  const all = done === STAGES.length;
  const elapsed = STAGES.slice(0, done).reduce((a, s) => a + s.s, 0);

  return (
    <div className="sy-flow-grid">
      <div className="sy-flow-head">
        <p className="sy-kick">How a run works</p>
        <h2 className="sy-h2">Four stages, each one waits for the last to go green</h2>
        <p className="sy-lede">Shipyard runs your pipeline as a chain: nothing deploys until the build is cached and every shard has passed. Scroll through run #1842 as it happened.</p>
        <div className={`sy-runcard${all ? ' is-all' : ''}`} aria-live="polite">
          <div className="sy-rc-h">
            <b>Run #1842</b>
            <span className={`sy-chip ${all ? 'is-done' : 'is-run'}`}>{all ? 'Passed' : `Running · ${STAGES[done].k}`}</span>
          </div>
          <p className="sy-rc-msg">fix(checkout): retry payment webhooks with exponential backoff</p>
          <p className="sy-rc-meta"><Av i="MO" a="#fb923c" b="#db2777" size={18} />maya-okafor · <span className="sy-branch">main</span> · a3f9c1e</p>
          <ol className="sy-rc-stages">
            {STAGES.map((s, i) => (
              <li key={s.k} className={state(i)}>
                <span className="sy-rc-i">{i < done ? <Check size={14} /> : <i />}</span>
                <span>{s.k}</span>
                <time>{i < done ? s.t : i === done ? 'running' : 'queued'}</time>
              </li>
            ))}
          </ol>
          <div className="sy-rc-bar"><i style={{ transform: `scaleX(${done / STAGES.length})` }} /></div>
          <div className="sy-rc-foot"><span>Elapsed</span><b>{done ? fmt(Math.round(elapsed * 10) / 10) : '0s'}</b></div>
        </div>
      </div>

      <ol className="sy-chain">
        {STAGES.map((s, i) => (
          <li key={s.k} className={`sy-link ${state(i)}`}>
            <div className="sy-node">
              <svg className="sy-ghost" viewBox="0 0 48 48" aria-hidden="true">{ICONS[i].map((d, k) => <path key={k} d={d} />)}</svg>
              <div className="sy-icon stage-icon" ref={(el) => { refs.current[i] = el; }}>
                <svg viewBox="0 0 48 48" aria-hidden="true">{ICONS[i].map((d, k) => <path key={k} d={d} />)}</svg>
              </div>
            </div>
            <div className="sy-step">
              <div className="sy-step-top">
                <span className="sy-step-n">Stage 0{i + 1} · {s.k}</span>
                <span className={`sy-chip ${state(i)}`}>{i < done ? `Passed · ${s.t}` : i === done ? 'Running' : 'Queued'}</span>
              </div>
              <h3>{s.h}</h3>
              <p>{s.d}</p>
              {s.panel}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Static sections ───────────────────────────────────────────────────── */

const LOGOS: { n: string; c: string; g: ReactNode }[] = [
  { n: 'fernway', c: 'lg-fern', g: <path d="M4 20 C 6 10, 12 5, 20 4 C 19 12, 14 18, 4 20 Z M4 20 L13 11" /> },
  { n: 'KESTREL', c: 'lg-kes', g: <path d="M2 14 L12 6 L22 14 L12 10 Z" /> },
  { n: 'Quarryline', c: 'lg-qua', g: null },
  { n: 'tandem', c: 'lg-tan', g: <><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></> },
  { n: 'Oxbow', c: 'lg-oxb', g: <path d="M4 6 V12 a8 8 0 0 0 16 0 V6" /> },
  { n: 'Halden & Co', c: 'lg-hal', g: null },
];

const YAML: ReactNode[] = [
  <><span className="y-c"># shipyard.yml — the whole pipeline</span></>,
  <><span className="y-k">version</span>: <span className="y-n">2</span></>,
  <><span className="y-k">pipeline</span>:</>,
  <>  - <span className="y-k">name</span>: <span className="y-s">build</span></>,
  <>    <span className="y-k">run</span>: <span className="y-s">pnpm build</span></>,
  <>    <span className="y-k">cache</span>: {'{'} <span className="y-k">remote</span>: <span className="y-b">true</span>, <span className="y-k">key</span>: <span className="y-s">lockfile + src/**</span> {'}'}</>,
  <>  - <span className="y-k">name</span>: <span className="y-s">test</span></>,
  <>    <span className="y-k">needs</span>: [<span className="y-s">build</span>]</>,
  <>    <span className="y-k">run</span>: <span className="y-s">pnpm vitest --shard=$SHARD</span></>,
  <>    <span className="y-k">parallel</span>: <span className="y-n">8</span></>,
  <>    <span className="y-k">split_by</span>: <span className="y-s">timing</span></>,
  <>  - <span className="y-k">name</span>: <span className="y-s">deploy</span></>,
  <>    <span className="y-k">needs</span>: [<span className="y-s">test</span>]</>,
  <>    <span className="y-k">if</span>: <span className="y-s">branch == &quot;main&quot;</span></>,
  <>    <span className="y-k">regions</span>: [<span className="y-s">iad1</span>, <span className="y-s">fra1</span>, <span className="y-s">hnd1</span>]</>,
  <>    <span className="y-k">rollback</span>: <span className="y-s">error_rate &gt; 2% within 10m</span></>,
  <><span className="y-k">previews</span>:</>,
  <>  <span className="y-k">pull_requests</span>: <span className="y-b">true</span>  <span className="y-c"># a URL per PR</span></>,
];

const PREVIEWS = [
  { p: 'storefront', s: 'Ready', u: 'pr-482.storefront.shipyard.app', t: '1m ago' },
  { p: 'docs', s: 'Ready', u: 'pr-482.docs.shipyard.app', t: '1m ago' },
  { p: 'admin', s: 'Building', u: '—', t: 'now' },
];

const RUNNERS = [
  { n: 'linux-x64-16c', l: 'ci-fra-07', cpu: 0.82, st: 'busy', job: 'test 4/8' },
  { n: 'linux-arm64-8c', l: 'ci-fra-03', cpu: 0.46, st: 'busy', job: 'build api-client' },
  { n: 'macos-14-m2', l: 'ci-ams-01', cpu: 0.12, st: 'idle', job: 'waiting for work' },
];

const DURATIONS = [8.6, 9.1, 8.8, 7.9, 8.2, 7.4, 6.9, 6.1, 5.2, 4.4, 3.9, 3.6, 3.1, 2.9, 2.7, 2.6, 2.5, 2.4, 2.6, 2.3, 2.4, 2.2, 2.3, 2.4, 2.2, 2.1, 2.3, 2.2, 2.4, 2.2];

const TIERS = [
  { n: 'Hobby', p: '$0', s: 'forever', d: 'For side projects and open source.', f: ['2,000 build minutes a month', 'Remote cache, 5 GB', 'Previews for every pull request', 'Community support'], cta: 'Start building' },
  { n: 'Team', p: '$29', s: 'per month, + $0.004 a minute', d: 'For teams shipping to production daily.', f: ['10,000 build minutes included', 'Remote cache, 100 GB', 'Timing-based test sharding', 'Instant rollback and deploy guards', 'Email support, 1 business day'], cta: 'Start a 14-day trial', hot: true },
  { n: 'Enterprise', p: 'Custom', s: 'annual contract', d: 'For platform teams with compliance needs.', f: ['Self-hosted and private runners', 'SAML SSO, SCIM and audit log', 'Data residency in the EU or US', '99.99% uptime SLA', 'A named solutions engineer'], cta: 'Talk to sales' },
];

export function ShipyardSite() {
  return (
    <Site
      className="sy"
      brand={<><Mark />Shipyard</>}
      links={['Product', 'Pipelines', 'Previews', 'Docs', 'Pricing']}
      cta="Start building"
      example="sequence-api"
      apis="scrollDrawSequence · one after another"
      footnote="CI/CD that keeps up with your commits"
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="sy-hero">
        <div className="sy-glow" aria-hidden="true" />
        <h1 className="sy-h1">From push to production in under three minutes</h1>
        <p className="sy-lede sy-hero-lede">Shipyard builds only what changed, deals your tests out by how long they really take, and gives every pull request its own URL. The median pipeline on Shipyard finishes in 2m 14s.</p>
        <div className="sy-ctas">
          <a className="sk-btn" href="#top">Start building — it’s free</a>
          <span className="sy-cmd"><span className="sy-c-dim">$</span> npx shipyard init<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" /><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5" /></svg></span>
        </div>
        <RunPage />
      </section>

      {/* ── Logos + numbers ──────────────────────────────────────────── */}
      <section className="sy-proof" aria-label="Customers">
        <p>Some of the teams that build on Shipyard</p>
        <div className="sy-logos">
          {LOGOS.map((l) => (
            <span key={l.n} className={`sy-logo ${l.c}`}>
              {l.g && <svg viewBox="0 0 24 24" aria-hidden="true">{l.g}</svg>}
              {l.n}
            </span>
          ))}
        </div>
        <dl className="sy-stats">
          <div><dt>Median pipeline</dt><dd>2m 14s</dd></div>
          <div><dt>Remote-cache hit rate</dt><dd>94%</dd></div>
          <div><dt>Builds every month</dt><dd>38M</dd></div>
          <div><dt>API uptime, last 12 months</dt><dd>99.99%</dd></div>
        </dl>
      </section>

      {/* ── The run, stage by stage (scrollDrawSequence) ─────────────── */}
      <section className="sy-sec sy-flow" id="pipelines">
        <Chain />
      </section>

      {/* ── Config as code ───────────────────────────────────────────── */}
      <section className="sy-sec sy-config">
        <div className="sy-config-copy">
          <p className="sy-kick">Pipelines as code</p>
          <h2 className="sy-h2">One file, every branch, shard and region</h2>
          <p className="sy-lede">Your pipeline lives next to your code and is reviewed like it. Shipyard reads the rest — your lockfile, your workspace graph and fifty runs of test timings — so the file stays short.</p>
          <ul className="sy-points">
            <li><b>Affected-only builds</b><span>Shipyard walks your workspace graph and skips any package a commit can’t reach.</span></li>
            <li><b>Secrets per environment</b><span>Scoped to branch and stage, masked in logs, rotated without a redeploy.</span></li>
            <li><b>Short-lived cloud credentials</b><span>OIDC tokens for every deploy step — no long-lived keys sitting in CI.</span></li>
          </ul>
        </div>
        <div className="sy-editor" role="img" aria-label="shipyard.yml: a build step with a remote cache, a test step split into eight shards by timing, and a deploy step to three regions with an automatic rollback">
          <div className="sy-ed-tabs"><span className="on">shipyard.yml</span><span>package.json</span><span className="sy-hide-s">vitest.config.ts</span></div>
          <ol className="sy-code">{YAML.map((l, i) => <li key={i}>{l}</li>)}</ol>
          <div className="sy-ed-foot"><span><span className="sy-dot" />Valid · 3 stages, 8 shards</span><span>YAML · UTF-8</span></div>
        </div>
      </section>

      {/* ── Previews ─────────────────────────────────────────────────── */}
      <section className="sy-sec sy-previews" id="previews">
        <div className="sy-sec-head">
          <p className="sy-kick">Preview deployments</p>
          <h2 className="sy-h2">Every pull request gets a URL</h2>
          <p className="sy-lede">Review the change, not a screenshot of it. Shipyard comments a link on every pull request, keeps it up to date with each push, and tears it down when the branch merges.</p>
        </div>
        <div className="sy-prv-grid">
          <div className="sy-pr" role="img" aria-label="A pull request with Shipyard's comment: storefront and docs previews are ready, admin is still building">
            <div className="sy-pr-h">
              <span className="sy-pr-state">Open</span>
              <b>Retry payment webhooks with backoff</b>
              <span className="sy-pr-n">#482</span>
            </div>
            <p className="sy-pr-sub"><Av i="MO" a="#fb923c" b="#db2777" size={18} />maya-okafor wants to merge 3 commits into <span className="sy-branch">main</span> from <span className="sy-branch">fix/webhook-retry</span></p>
            <div className="sy-cmt">
              <span className="sy-cmt-av"><MarkGlyph /></span>
              <div className="sy-cmt-body">
                <p className="sy-cmt-h"><b>shipyard</b><span className="sy-bot">bot</span><span className="sy-dim">commented 1 minute ago</span></p>
                <p className="sy-cmt-t">Previews for <code>a3f9c1e</code> are ready.</p>
                <table className="sy-prv-table">
                  <thead><tr><th>Project</th><th>Status</th><th className="sy-hide-s">Preview</th><th>Updated</th></tr></thead>
                  <tbody>
                    {PREVIEWS.map((r) => (
                      <tr key={r.p}>
                        <td><b>{r.p}</b></td>
                        <td><span className={`sy-st ${r.s === 'Ready' ? 'ok' : 'run'}`}>{r.s}</span></td>
                        <td className="sy-hide-s"><span className="sy-url">{r.u}</span></td>
                        <td className="sy-dim">{r.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sy-checks">
              <p><Check size={15} /><b>All checks have passed</b><span>4 successful checks</span></p>
              <span className="sy-merge">Merge pull request</span>
            </div>
          </div>

          <div className="sy-browser" role="img" aria-label="The storefront preview for pull request 482, with two review comments pinned to it and Shipyard's preview toolbar">
            <div className="sy-br-bar"><span className="sy-lights"><i /><i /><i /></span><span className="sy-br-url">pr-482.storefront.shipyard.app</span></div>
            <div className="sy-store">
              <div className="sy-store-nav"><b>Fernway</b><span>Shop</span><span>Journal</span><span className="sy-store-bag">Bag · 2</span></div>
              <div className="sy-store-hero">
                <div><p>Autumn field kit</p><b>Built for long days outside.</b><span className="sy-store-btn">Shop the kit</span></div>
                <i className="sy-ph sy-ph-1" />
              </div>
              <div className="sy-store-row">
                <span><i className="sy-ph sy-ph-2" /><b>Waxed field jacket</b><em>€240</em></span>
                <span><i className="sy-ph sy-ph-3" /><b>Merino crew</b><em>€95</em></span>
                <span><i className="sy-ph sy-ph-4" /><b>Trail flask</b><em>€38</em></span>
              </div>
              <span className="sy-pin sy-pin-1"><Av i="LF" a="#60a5fa" b="#7c3aed" size={22} /><span>“Shop the kit” should go to /kits</span></span>
              <span className="sy-pin sy-pin-2"><Av i="JD" a="#34d399" b="#0e7490" size={22} /></span>
            </div>
            <div className="sy-toolbar"><span className="sy-mark sy-mark-sm"><MarkGlyph /></span><b>#482</b><span>fix/webhook-retry</span><span className="sy-tb-c">2 comments</span><span className="sy-tb-s">Share</span></div>
          </div>
        </div>
      </section>

      {/* ── More of the platform ─────────────────────────────────────── */}
      <section className="sy-sec sy-bento-sec">
        <div className="sy-sec-head">
          <p className="sy-kick">The rest of the platform</p>
          <h2 className="sy-h2">Everything a pipeline needs, nothing it doesn’t</h2>
        </div>
        <div className="sy-bento">
          <article className="sy-card sy-card-cli">
            <div className="sy-term sy-term-sm">
              <div className="sy-term-body">
                <div className="is-p"><span className="sy-c-dim">$</span> shipyard run test --shard 4/8 --watch</div>
                <div className="is-dim">Pulled cache for a3f9c1e · 212 tasks · 3.1s</div>
                <div className="is-ok">✓ checkout/webhooks.spec.ts <span className="sy-c-dim">(14 tests) 2.4s</span></div>
                <div className="is-ok">✓ checkout/retry.spec.ts <span className="sy-c-dim">(9 tests) 1.1s</span></div>
                <div className="is-warn">↻ checkout/refund.spec.ts <span className="sy-c-dim">retried once, passed</span></div>
                <div className="is-dim">Watching 149 files for changes…</div>
              </div>
            </div>
            <h3>Run CI on your laptop</h3>
            <p>The CLI pulls the same cache and the same shard your pipeline would get, so “works on my machine” finally means something.</p>
          </article>

          <article className="sy-card sy-card-run">
            <ul className="sy-runners">
              {RUNNERS.map((r) => (
                <li key={r.l}>
                  <span className={`sy-dot ${r.st === 'idle' ? 'idle' : ''}`} />
                  <span className="sy-rn"><b>{r.l}</b><em>{r.n}</em></span>
                  <span className="sy-rcpu"><i style={{ width: `${r.cpu * 100}%` }} /></span>
                  <span className="sy-rjob">{r.job}</span>
                </li>
              ))}
            </ul>
            <h3>Bring your own runners</h3>
            <p>Run jobs on your own machines — Linux, macOS or ARM — inside your network, with the same dashboard and cache.</p>
          </article>

          <article className="sy-card sy-card-ins">
            <div className="sy-chart" aria-hidden="true">
              <div className="sy-chart-h"><b>Main-branch pipeline, last 30 days</b><span>p50</span></div>
              <div className="sy-bars">{DURATIONS.map((d, i) => <i key={i} style={{ height: `${(d / 9.1) * 100}%` }} className={i > 13 ? 'on' : ''} />)}</div>
              <div className="sy-chart-f"><span>9m 06s</span><span className="sy-arrow">→</span><b>2m 12s</b></div>
            </div>
            <h3>Insights that point at the slow part</h3>
            <p>Duration, queue time, cache hits and flaky tests for every pipeline, with the one job worth fixing first at the top.</p>
          </article>

          <article className="sy-card sy-card-flk">
            <ul className="sy-flaky">
              <li><span className="sy-fk-tag q">Quarantined</span><code>refund.spec.ts › issues partial refund</code><em>flaked 7 of 120 runs</em></li>
              <li><span className="sy-fk-tag w">Watching</span><code>search.spec.ts › debounces input</code><em>flaked 2 of 120 runs</em></li>
              <li><span className="sy-fk-tag ok">Fixed</span><code>cart.spec.ts › restores saved bag</code><em>0 flakes in 41 runs</em></li>
            </ul>
            <h3>Flaky tests, quarantined</h3>
            <p>A test that fails and then passes on retry is flagged, tracked, and kept from blocking the merge queue until someone fixes it.</p>
          </article>
        </div>
      </section>

      {/* ── Customer ─────────────────────────────────────────────────── */}
      <section className="sy-sec sy-story">
        <figure className="sy-quote">
          <span className="sy-logo lg-fern"><svg viewBox="0 0 24 24" aria-hidden="true">{LOGOS[0].g}</svg>fernway</span>
          <blockquote>“Our main-branch pipeline went from fourteen minutes to under three in the first week — mostly by deleting YAML. Nobody batches commits any more, because nobody has to.”</blockquote>
          <figcaption><Av i="LF" a="#60a5fa" b="#7c3aed" size={44} /><span><b>Lena Fischer</b>Staff engineer, platform · Fernway</span></figcaption>
        </figure>
        <dl className="sy-story-stats">
          <div><dt>Main-branch pipeline</dt><dd>14m <span>→</span> 2m 50s</dd></div>
          <div><dt>CI spend in the first quarter</dt><dd>−61%</dd></div>
          <div><dt>Production deploys a day, up from 6</dt><dd>40</dd></div>
        </dl>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="sy-sec sy-pricing" id="pricing">
        <div className="sy-sec-head sy-center">
          <p className="sy-kick">Pricing</p>
          <h2 className="sy-h2">Pay for build minutes, not seats</h2>
          <p className="sy-lede">Add the whole team for free. Minutes on Linux runners are billed by the second; cached tasks cost nothing.</p>
        </div>
        <div className="sy-tiers">
          {TIERS.map((t) => (
            <div key={t.n} className={`sy-tier${t.hot ? ' hot' : ''}`}>
              {t.hot && <span className="sy-tier-tag">Most teams</span>}
              <h3>{t.n}</h3>
              <p className="sy-tier-d">{t.d}</p>
              <p className="sy-price"><b>{t.p}</b><span>{t.s}</span></p>
              <a className={`sk-btn${t.hot ? '' : ' sk-btn-ghost'}`} href="#top">{t.cta}</a>
              <ul>{t.f.map((x) => <li key={x}><Check size={15} />{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="sy-final">
        <div className="sy-final-in">
          <h2 className="sy-h2">Connect a repo, watch the first run go green</h2>
          <p className="sy-lede">Works with any Git host. Most teams have their existing pipeline running on Shipyard before lunch.</p>
          <div className="sy-ctas sy-center-row">
            <a className="sk-btn" href="#top">Start building — it’s free</a>
            <a className="sk-btn sk-btn-ghost" href="#top">Read the migration guide</a>
          </div>
        </div>
        <div className="sy-map">
          {[['Product', ['Pipelines', 'Remote cache', 'Previews', 'Runners', 'Insights']], ['Developers', ['Docs', 'CLI', 'API reference', 'Changelog', 'Status']], ['Company', ['Customers', 'Blog', 'Careers', 'Security', 'Contact']]].map(([h, l]) => (
            <div key={h as string}><b>{h as string}</b>{(l as string[]).map((x) => <a key={x} href="#top">{x}</a>)}</div>
          ))}
          <div className="sy-status"><span className="sy-dot" />All systems operational</div>
        </div>
      </section>
    </Site>
  );
}
