'use client';

import './northbeam.css';
import type { CSSProperties, ReactNode } from 'react';
import { Site } from '../kit/Site';
import { RequestTrace } from './Diagram';
import { CodePanel } from './code';
import { LAND_DOTS, MAP_H, MAP_W, project } from './worldmap';

/*
 * Northbeam — a fictional edge cloud's home page. The svg-scroll-draw effect
 * is the request diagram in the hero's trace console (Diagram.tsx): one
 * ScrollDraw with selector .nb-draw, stagger 0.1, ease-out, once. Everything
 * else on the page is plain HTML, CSS and inline SVG.
 */

const Mark = ({ size = 22 }: { size?: number }) => (
  <svg className="nb-mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M12 2.5 L21.5 20 H2.5 Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M12 2.5 V20" stroke="var(--teal)" strokeWidth="1.9" />
    <path d="M12 2.5 L16.8 11.4" stroke="var(--teal)" strokeWidth="1.9" strokeLinecap="round" opacity=".55" />
  </svg>
);

/* ── Logos (all invented) ─────────────────────────────────────────────── */
const LOGOS: { n: string; cls: string; g: ReactNode }[] = [
  { n: 'Kestrel', cls: 'lg-a', g: <path d="M2 14 L10 6 L13 10 L22 4 L16 14 L12 11 Z" /> },
  { n: 'paperplane', cls: 'lg-b', g: <path d="M2 11 L22 3 L15 21 L11 13 Z M11 13 L22 3" /> },
  { n: 'Orbital', cls: 'lg-c', g: <><circle cx="12" cy="12" r="4" /><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)" /></> },
  { n: 'Fernhill', cls: 'lg-d', g: <path d="M12 21 V5 M12 9 L7 6 M12 12 L6.5 9.5 M12 15 L7 13 M12 9 L17 6 M12 12 L17.5 9.5 M12 15 L17 13" /> },
  { n: 'QUANTA', cls: 'lg-e', g: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="4" /><rect x="3" y="13" width="8" height="8" rx="4" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></> },
  { n: 'Holloway', cls: 'lg-f', g: <path d="M5 4 V20 M19 4 V20 M5 12 H19" /> },
  { n: 'tilt.', cls: 'lg-g', g: <path d="M4 18 L20 6" /> },
];

/* ── Regions on the map ──────────────────────────────────────────────── */
type Region = { c: string; city: string; ll: [number, number]; pg?: boolean; tag?: 'l' | 'r' | 't' | 'b' };
const REGIONS: Region[] = [
  { c: 'lis1', city: 'Lisbon', ll: [-9.1, 38.7], pg: true, tag: 'b' }, { c: 'mad1', city: 'Madrid', ll: [-3.7, 40.4] }, { c: 'cdg1', city: 'Paris', ll: [2.35, 48.86], pg: true },
  { c: 'lhr1', city: 'London', ll: [-0.12, 51.5], pg: true, tag: 'l' }, { c: 'ams1', city: 'Amsterdam', ll: [4.9, 52.37] }, { c: 'fra1', city: 'Frankfurt', ll: [8.68, 50.1], pg: true },
  { c: 'arn1', city: 'Stockholm', ll: [18.07, 59.33] }, { c: 'waw1', city: 'Warsaw', ll: [21, 52.2] }, { c: 'mxp1', city: 'Milan', ll: [9.19, 45.46] },
  { c: 'ist1', city: 'Istanbul', ll: [28.97, 41] }, { c: 'dxb1', city: 'Dubai', ll: [55.27, 25.2], pg: true }, { c: 'bom1', city: 'Mumbai', ll: [72.88, 19.08], pg: true, tag: 'b' },
  { c: 'blr1', city: 'Bengaluru', ll: [77.6, 12.97] }, { c: 'sin1', city: 'Singapore', ll: [103.8, 1.35], pg: true, tag: 'r' }, { c: 'cgk1', city: 'Jakarta', ll: [106.85, -6.2] },
  { c: 'hkg1', city: 'Hong Kong', ll: [114.17, 22.3], pg: true }, { c: 'nrt1', city: 'Tokyo', ll: [139.7, 35.7], pg: true, tag: 'r' }, { c: 'kix1', city: 'Osaka', ll: [135.5, 34.7] },
  { c: 'icn1', city: 'Seoul', ll: [126.98, 37.57] }, { c: 'syd1', city: 'Sydney', ll: [151.2, -33.87], pg: true, tag: 't' }, { c: 'mel1', city: 'Melbourne', ll: [144.96, -37.8] },
  { c: 'akl1', city: 'Auckland', ll: [174.76, -36.85] }, { c: 'jnb1', city: 'Johannesburg', ll: [28.05, -26.2], pg: true, tag: 'r' }, { c: 'los1', city: 'Lagos', ll: [3.38, 6.52] },
  { c: 'nbo1', city: 'Nairobi', ll: [36.8, -1.29] }, { c: 'cai1', city: 'Cairo', ll: [31.24, 30.04] }, { c: 'gru1', city: 'São Paulo', ll: [-46.6, -23.55], pg: true, tag: 'r' },
  { c: 'scl1', city: 'Santiago', ll: [-70.67, -33.45] }, { c: 'bog1', city: 'Bogotá', ll: [-74.07, 4.71] }, { c: 'lim1', city: 'Lima', ll: [-77.04, -12.05] },
  { c: 'eze1', city: 'Buenos Aires', ll: [-58.4, -34.6] }, { c: 'mex1', city: 'Mexico City', ll: [-99.13, 19.43] }, { c: 'dfw1', city: 'Dallas', ll: [-96.8, 32.78], pg: true },
  { c: 'iad1', city: 'Ashburn', ll: [-77.49, 39.04], pg: true, tag: 'r' }, { c: 'ord1', city: 'Chicago', ll: [-87.63, 41.88] }, { c: 'yyz1', city: 'Toronto', ll: [-79.38, 43.65] },
  { c: 'sea1', city: 'Seattle', ll: [-122.33, 47.6] }, { c: 'sjc1', city: 'San Jose', ll: [-121.89, 37.34], pg: true, tag: 'l' }, { c: 'lax1', city: 'Los Angeles', ll: [-118.24, 34.05] },
  { c: 'mia1', city: 'Miami', ll: [-80.19, 25.76] }, { c: 'den1', city: 'Denver', ll: [-104.99, 39.74] }, { c: 'yul1', city: 'Montréal', ll: [-73.57, 45.5] },
  { c: 'hel1', city: 'Helsinki', ll: [24.94, 60.17] }, { c: 'dub1', city: 'Dublin', ll: [-6.26, 53.35] }, { c: 'tlv1', city: 'Tel Aviv', ll: [34.78, 32.08] },
  { c: 'del1', city: 'Delhi', ll: [77.1, 28.7] }, { c: 'bkk1', city: 'Bangkok', ll: [100.5, 13.75] }, { c: 'mnl1', city: 'Manila', ll: [120.98, 14.6] },
  { c: 'per1', city: 'Perth', ll: [115.86, -31.95] }, { c: 'cpt1', city: 'Cape Town', ll: [18.42, -33.92] }, { c: 'qro1', city: 'Querétaro', ll: [-100.39, 20.59] },
  { c: 'yvr1', city: 'Vancouver', ll: [-123.12, 49.28] }, { c: 'atl1', city: 'Atlanta', ll: [-84.39, 33.75] }, { c: 'phx1', city: 'Phoenix', ll: [-112.07, 33.45] },
];

const PINGS = [
  { c: 'lis1', city: 'Lisbon', ms: 4, you: true }, { c: 'mad1', city: 'Madrid', ms: 11 }, { c: 'cdg1', city: 'Paris', ms: 19 },
  { c: 'lhr1', city: 'London', ms: 22 }, { c: 'fra1', city: 'Frankfurt', ms: 27 }, { c: 'iad1', city: 'Ashburn', ms: 79 },
  { c: 'gru1', city: 'São Paulo', ms: 118 }, { c: 'sin1', city: 'Singapore', ms: 161 },
];

function WorldMap() {
  const pct = (ll: [number, number]) => {
    const [x, y] = project(ll);
    return { left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` } as CSSProperties;
  };
  return (
    <div className="nb-map">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true"><path className="nb-land" d={LAND_DOTS} /></svg>
      {REGIONS.map((r, i) => (
        <span key={r.c} className={`nb-pin${r.pg ? ' is-pg' : ''}${r.tag ? ` has-tag tag-${r.tag}` : ''}`} style={{ ...pct(r.ll), '--d': `${(i * 0.37) % 3}s` } as CSSProperties} title={`${r.city} (${r.c})`}>
          {r.tag && <em>{r.c} <b>{r.city}</b></em>}
        </span>
      ))}
    </div>
  );
}

/* ── Dashboard data (fixed numbers, so server and client agree) ─────────── */
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const day = Math.sin(((i - 14) / 48) * Math.PI * 2);
  const wob = Math.sin(i * 1.7) * 0.05 + Math.sin(i * 0.63) * 0.04;
  const total = 0.56 + day * 0.32 + wob + (i === 37 ? 0.12 : 0);
  return { total, fn: total * (0.3 + Math.sin(i * 0.9) * 0.03) };
});
const area = (vals: number[], h: number, w: number) => {
  const step = w / (vals.length - 1);
  const pts = vals.map((v, i) => `${(i * step).toFixed(1)} ${(h - v * h).toFixed(1)}`);
  return { line: `M ${pts.join(' L ')}`, fill: `M 0 ${h} L ${pts.join(' L ')} L ${w} ${h} Z` };
};
const P50 = HOURS.map((h, i) => 0.24 + Math.sin(i * 0.8) * 0.02 + h.total * 0.06);
const P99 = HOURS.map((h, i) => 0.55 + Math.sin(i * 1.3) * 0.06 + h.total * 0.18 + (i === 37 ? 0.18 : 0));

const TABLE = [
  { c: 'fra1', city: 'Frankfurt', req: '3.92M', p50: 17, p99: 88, err: '0.01%', share: 0.92 },
  { c: 'iad1', city: 'Ashburn', req: '3.41M', p50: 19, p99: 94, err: '0.02%', share: 0.8 },
  { c: 'lhr1', city: 'London', req: '2.87M', p50: 16, p99: 81, err: '0.01%', share: 0.67 },
  { c: 'sin1', city: 'Singapore', req: '1.96M', p50: 22, p99: 118, err: '0.03%', share: 0.46 },
  { c: 'gru1', city: 'São Paulo', req: '1.12M', p50: 24, p99: 131, err: '0.04%', share: 0.26, warn: true },
  { c: 'syd1', city: 'Sydney', req: '0.88M', p50: 21, p99: 109, err: '0.02%', share: 0.21 },
];

function Dashboard() {
  const W = 640;
  const H = 150;
  const tot = area(HOURS.map((h) => h.total), H, W);
  const fn = area(HOURS.map((h) => h.fn), H, W);
  const p50 = area(P50, 90, 300);
  const p99 = area(P99, 90, 300);
  return (
    <div className="nb-app" role="img" aria-label="The Northbeam dashboard: 18.4 million requests in the last 24 hours, p50 18 ms, p99 96 ms, and a table of the busiest regions">
      <aside className="nb-app-side">
        <div className="nb-proj"><span className="nb-proj-av">S</span><b>storefront</b><i>▾</i></div>
        <ul>
          {['Overview', 'Deployments', 'Analytics', 'Traces', 'Logs', 'Postgres', 'Queues', 'Usage', 'Settings'].map((x) => (
            <li key={x} className={x === 'Analytics' ? 'on' : ''}>{x}{x === 'Deployments' && <em>3</em>}</li>
          ))}
        </ul>
        <div className="nb-app-plan"><span>Pro plan</span><div className="nb-meter"><i style={{ width: '74%' }} /></div><small>7.4M of 10M requests</small></div>
      </aside>
      <div className="nb-app-main">
        <div className="nb-app-top">
          <b>Analytics</b>
          <span className="nb-chip">Production ▾</span>
          <span className="nb-chip">Last 24 hours ▾</span>
          <span className="nb-app-live"><i className="nb-dot is-ok" />Live</span>
        </div>
        <div className="nb-kpis">
          {[
            ['Requests', '18.4M', '+12.6%', 'up'],
            ['p50 latency', '18 ms', '−2 ms', 'good'],
            ['p99 latency', '96 ms', '−14 ms', 'good'],
            ['Cache hit rate', '91.4%', '+0.8 pt', 'up'],
          ].map(([k, v, d, t]) => (
            <div key={k} className="nb-kpi"><span>{k}</span><b>{v}</b><em className={`is-${t}`}>{d}</em></div>
          ))}
        </div>
        <div className="nb-charts">
          <div className="nb-chart">
            <div className="nb-chart-h"><b>Requests</b><span><i className="sw sw-a" />Edge cache<i className="sw sw-b" />Functions</span></div>
            <svg viewBox={`0 0 ${W} ${H + 18}`} preserveAspectRatio="none" aria-hidden="true">
              {[0.25, 0.5, 0.75].map((g) => <path key={g} className="nb-grid" d={`M0 ${H * g} H${W}`} />)}
              <path className="nb-area-a" d={tot.fill} />
              <path className="nb-line-a" d={tot.line} />
              <path className="nb-area-b" d={fn.fill} />
              <path className="nb-line-b" d={fn.line} />
              <path className="nb-marker" d={`M${(37 / 47) * W} 0 V${H}`} />
            </svg>
            <div className="nb-xaxis"><span>12:00</span><span>18:00</span><span>00:00</span><span>06:00</span><span>Now</span></div>
            <span className="nb-flag" style={{ left: `${(37 / 47) * 100}%` }}>Deploy <code>9f2c1e</code> · promo email</span>
          </div>
          <div className="nb-chart nb-chart-sm">
            <div className="nb-chart-h"><b>Latency</b><span><i className="sw sw-c" />p50<i className="sw sw-d" />p99</span></div>
            <svg viewBox="0 0 300 104" preserveAspectRatio="none" aria-hidden="true">
              {[0.33, 0.66].map((g) => <path key={g} className="nb-grid" d={`M0 ${90 * g} H300`} />)}
              <path className="nb-line-d" d={p99.line} />
              <path className="nb-line-c" d={p50.line} />
            </svg>
            <div className="nb-lat"><span><b>18</b> ms p50</span><span><b>96</b> ms p99</span><span><b>0.02</b>% errors</span></div>
          </div>
        </div>
        <table className="nb-table">
          <thead><tr><th>Region</th><th>Requests</th><th className="nb-hide-s">Share</th><th>p50</th><th>p99</th><th className="nb-hide-s">Errors</th></tr></thead>
          <tbody>
            {TABLE.map((r) => (
              <tr key={r.c}>
                <td><i className={`nb-dot ${r.warn ? 'is-warn' : 'is-ok'}`} /><code>{r.c}</code><span className="nb-hide-s"> {r.city}</span></td>
                <td>{r.req}</td>
                <td className="nb-hide-s"><span className="nb-bar"><i style={{ width: `${r.share * 100}%` }} /></span></td>
                <td>{r.p50} ms</td>
                <td className={r.warn ? 'is-warn' : ''}>{r.p99} ms</td>
                <td className="nb-hide-s">{r.err}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Feature cards, each with a piece of product ─────────────────────── */
const FEATURES: { t: string; d: string; viz: ReactNode }[] = [
  {
    t: 'Postgres that follows your users',
    d: 'One primary, read replicas in the regions you pick. Writes route home, reads stay local, and lag is on the dashboard.',
    viz: (
      <div className="nb-viz nb-viz-pg">
        {[['fra1', 'primary', ''], ['lis1', 'replica', '38 ms lag'], ['iad1', 'replica', '71 ms lag'], ['sin1', 'replica', '112 ms lag']].map(([c, r, l]) => (
          <div key={c} className={r === 'primary' ? 'is-p' : ''}><code>{c}</code><span>{r}</span><em>{l || 'writes'}</em></div>
        ))}
      </div>
    ),
  },
  {
    t: 'KV in every region',
    d: 'A key-value store replicated to all 62 regions. Reads in single-digit milliseconds, writes visible worldwide in under a second.',
    viz: (
      <div className="nb-viz nb-viz-kv">
        <p><span className="tk-f">kv.get</span>(<span className="tk-s">&apos;flags:checkout-v2&apos;</span>)</p>
        <p className="nb-kv-out"><span>→ true</span><em>1.8 ms · lis1</em></p>
        <p><span className="tk-f">kv.set</span>(<span className="tk-s">&apos;rate:203.0.113.9&apos;</span>, <span className="tk-n">41</span>)</p>
        <p className="nb-kv-out"><span>→ ok</span><em>replicated in 410 ms</em></p>
      </div>
    ),
  },
  {
    t: 'Queues and cron, no extra service',
    d: 'Publish from any function, consume with retries and dead-letter built in. Schedules live in northbeam.toml next to your code.',
    viz: (
      <div className="nb-viz nb-viz-q">
        <div className="nb-q-h"><code>orders.created</code><span>1,204 / min</span></div>
        <div className="nb-q-bars">{[30, 42, 38, 55, 61, 48, 72, 90, 66, 58, 63, 80, 74, 52, 45, 60, 68, 77, 59, 50].map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div>
        <div className="nb-q-f"><span>p95 wait 140 ms</span><span>0 in dead-letter</span></div>
      </div>
    ),
  },
  {
    t: 'A preview for every pull request',
    d: 'Each branch gets its own URL, its own database branch and a comment on the PR. Reviewers click, not clone.',
    viz: (
      <div className="nb-viz nb-viz-pr">
        <div className="nb-pr-card">
          <div className="nb-pr-h"><span className="nb-pr-av"><Mark size={14} /></span><b>northbeam</b><span>bot · 2 min ago</span></div>
          <table><tbody>
            <tr><td>Preview</td><td><code>storefront-git-fix-cart.nb.app</code></td></tr>
            <tr><td>Database</td><td>branch <code>pr-482</code> from main</td></tr>
            <tr><td>Status</td><td><span className="nb-ok">● Ready</span> in 41s</td></tr>
          </tbody></table>
        </div>
      </div>
    ),
  },
  {
    t: 'Roll back in one click',
    d: 'Every deploy is immutable and stays warm for 30 days. Rolling back is a pointer change — it takes effect worldwide in about a second.',
    viz: (
      <div className="nb-viz nb-viz-rb">
        {[
          ['9f2c1e', 'Fix cart badge count', 'Current', 'cur'],
          ['4b7a90', 'Add gift wrap option', '2 h ago', ''],
          ['e01d3f', 'Upgrade to Node 24', 'Yesterday', ''],
        ].map(([h, m, t, c]) => (
          <div key={h} className={c ? 'is-cur' : ''}><code>{h}</code><span>{m}</span>{c ? <em className="nb-cur">{t}</em> : <b>Roll back</b>}</div>
        ))}
      </div>
    ),
  },
  {
    t: 'Firewall and DDoS, on by default',
    d: 'Layer 3–7 protection at every edge, rate limits in one line of config, and bot rules you can test against last week’s traffic.',
    viz: (
      <div className="nb-viz nb-viz-fw">
        <div className="nb-fw-h"><b>2.14M</b><span>requests blocked · 24 h</span></div>
        <svg viewBox="0 0 260 60" preserveAspectRatio="none" aria-hidden="true">
          <path className="nb-fw-area" d="M0 56 L20 54 L40 55 L60 52 L80 53 L100 50 L120 18 L132 6 L144 22 L160 46 L180 51 L200 53 L220 52 L240 54 L260 53 L260 60 L0 60 Z" />
          <path className="nb-fw-line" d="M0 56 L20 54 L40 55 L60 52 L80 53 L100 50 L120 18 L132 6 L144 22 L160 46 L180 51 L200 53 L220 52 L240 54 L260 53" />
        </svg>
        <div className="nb-fw-f"><span>Peak 1.9M rps at 03:12</span><span className="nb-ok">Mitigated in 2.4s</span></div>
      </div>
    ),
  },
];

const TERMINAL: { l: string; r?: string; c?: string }[] = [
  { l: '$ nb deploy --prod', c: 'cmd' },
  { l: 'Northbeam CLI 4.12.0 · linked to acme/storefront', c: 'mut' },
  { l: '› Uploading 214 files (3.1 MB)', r: 'done  1.2s' },
  { l: '› Installing with npm 11', r: 'done  6.8s' },
  { l: '› Building with Node 24', r: 'done 14.6s' },
  { l: '  ├ λ  /api/cart', r: 'function   38 kB', c: 'tree' },
  { l: '  ├ λ  /api/checkout', r: 'function   61 kB', c: 'tree' },
  { l: '  ├ ◇  /products/[slug]', r: 'cached    1 h', c: 'tree' },
  { l: '  └ ○  /', r: 'static   12 kB', c: 'tree' },
  { l: '› Migrating Postgres (0007_gift_wrap)', r: 'done  0.9s' },
  { l: '› Rolling out to 62 regions', r: 'done  9.8s' },
  { l: '✓ Live at https://storefront.nb.app', r: '[38s]', c: 'ok' },
];

const TIERS = [
  { n: 'Hobby', p: '$0', s: 'forever', d: 'For side projects and learning.', f: ['1M requests a month', '100 GB bandwidth', 'Postgres in one region', 'Community support'], cta: 'Start free' },
  { n: 'Pro', p: '$20', s: 'per member / month', d: 'For teams shipping to production.', f: ['10M requests included', '1 TB bandwidth', 'Postgres replicas in 6 regions', 'Preview deployments + DB branches', 'Email support, 1 business day'], cta: 'Start a 14-day trial', hot: true },
  { n: 'Enterprise', p: 'Custom', s: 'annual contract', d: 'For scale, compliance and SLAs.', f: ['99.99% uptime SLA', 'Dedicated regions and IPs', 'SSO, SCIM and audit logs', 'SOC 2 Type II, HIPAA BAA', '24/7 support, 15-min response'], cta: 'Talk to sales' },
];

const METERS = [
  { k: 'Requests', v: '7.4M', of: '10M', p: 74 },
  { k: 'Bandwidth', v: '612 GB', of: '1 TB', p: 61 },
  { k: 'Function compute', v: '880 GB-h', of: '1,000 GB-h', p: 88, warn: true },
  { k: 'Postgres storage', v: '18 GB', of: '50 GB', p: 36 },
];

export function NorthbeamSite() {
  return (
    <Site
      className="nb"
      brand={<><Mark />Northbeam</>}
      links={['Platform', 'Regions', 'Docs', 'Pricing', 'Changelog']}
      cta="Start deploying"
      example="network"
      apis="selector · stagger · ease-out"
      footnote="Functions, KV, queues and Postgres in 62 regions"
    >
      {/* ── Hero ── */}
      <section className="nb-hero">
        <h1 className="nb-h1">Every request, answered from the <span>nearest city</span></h1>
        <p className="nb-lede">Northbeam runs your functions, cache and Postgres in 62 regions. Push to git and your app is live worldwide in under a minute — with a median time to first byte of 18&nbsp;ms.</p>
        <div className="nb-ctas">
          <a className="nb-btn" href="#top">Start deploying</a>
          <a className="nb-btn nb-btn-ghost" href="#top">Talk to an engineer</a>
        </div>
        <p className="nb-cmd"><span>$</span> npm i -g northbeam &amp;&amp; nb deploy <kbd>⌘C</kbd></p>
        <RequestTrace />
        <dl className="nb-stats">
          <div><dt>Median TTFB, worldwide</dt><dd>18 ms</dd></div>
          <div><dt>Regions on six continents</dt><dd>62</dd></div>
          <div><dt>Uptime, last 12 months</dt><dd>99.995%</dd></div>
          <div><dt>Requests served a day</dt><dd>41B</dd></div>
        </dl>
      </section>

      {/* ── Logos ── */}
      <section className="nb-logos" aria-label="Customers">
        <p>Some of the teams that deploy on Northbeam</p>
        <div>{LOGOS.map((l) => <span key={l.n} className={`nb-logo ${l.cls}`}><svg viewBox="0 0 24 24" aria-hidden="true">{l.g}</svg>{l.n}</span>)}</div>
      </section>

      {/* ── Deploy ── */}
      <section className="nb-sec nb-split" id="deploy">
        <div className="nb-copy">
          <p className="nb-kick">Deploy</p>
          <h2 className="nb-h2">Push to git, live in 62 regions in 38 seconds</h2>
          <p className="nb-p">Connect a repository and every push builds, migrates your database and rolls out region by region, watching error rates as it goes. If they climb, it stops and rolls back on its own.</p>
          <ul className="nb-checks">
            <li><b>Zero config</b> for Node, Bun, Deno, Python and Go</li>
            <li><b>Progressive rollout</b> with automatic rollback on errors</li>
            <li><b>Migrations</b> run once, before traffic shifts</li>
            <li><b>Build cache</b> shared across your whole team</li>
          </ul>
        </div>
        <div className="nb-term-wrap">
          <div className="nb-term" role="img" aria-label="A terminal running nb deploy: upload, build, migrate and roll out to 62 regions in 38 seconds">
            <div className="nb-term-bar"><span className="nb-lights"><i /><i /><i /></span><span>~/code/storefront — zsh</span></div>
            <div className="nb-term-body">
              {TERMINAL.map((t, i) => <p key={i} className={t.c ? `t-${t.c}` : undefined}><span>{t.l}</span>{t.r && <span className="t-r">{t.r}</span>}</p>)}
              <p className="t-cur"><span>$ <span className="nb-caret" /></span></p>
            </div>
          </div>
          <div className="nb-rollout" aria-hidden="true">
            <div className="nb-ro-h"><b>Rollout</b><span>9f2c1e · production</span></div>
            {[['Europe', 100, '14 regions'], ['North America', 100, '17 regions'], ['Asia Pacific', 100, '16 regions'], ['South America', 100, '7 regions'], ['Africa & Middle East', 100, '8 regions']].map(([r, p, n]) => (
              <div key={r as string} className="nb-ro-row"><span>{r}</span><span className="nb-meter"><i style={{ width: `${p}%` }} /></span><em>{n}</em></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code ── */}
      <section className="nb-sec" id="functions">
        <div className="nb-head nb-head-row">
          <div>
            <p className="nb-kick">Functions</p>
            <h2 className="nb-h2">Write a function, we run it in every region</h2>
          </div>
          <p className="nb-p">Standard Request in, Response out. Import KV, Postgres, queues and email from one SDK — no connection strings, no cold-start tuning, no YAML.</p>
        </div>
        <CodePanel />
      </section>

      {/* ── Network ── */}
      <section className="nb-sec nb-net" id="regions">
        <div className="nb-head nb-head-row">
          <div>
            <p className="nb-kick">Network</p>
            <h2 className="nb-h2">62 regions, your users are never far away</h2>
          </div>
          <p className="nb-p">Every region runs compute, KV and the edge cache. Twenty-one also host Postgres replicas. New this quarter: Lagos, Querétaro and Manila.</p>
        </div>
        <div className="nb-net-grid">
          <div className="nb-map-card">
            <WorldMap />
            <div className="nb-legend"><span><i className="nb-pin-k is-pg" />Compute + Postgres</span><span><i className="nb-pin-k" />Compute + KV</span><span className="nb-legend-r">Updated 1 Nov 2026</span></div>
            <dl className="nb-conts">
              {[['Europe', 14, 9], ['North America', 17, 11], ['Asia Pacific', 16, 14], ['South America', 7, 16], ['Africa & Middle East', 8, 19]].map(([n, r, ms]) => (
                <div key={n}><dt>{n}</dt><dd><b>{r}</b> regions<span>{ms} ms median</span></dd></div>
              ))}
            </dl>
          </div>
          <div className="nb-ping">
            <div className="nb-ping-h"><b>Latency from you</b><span>Lisbon, PT · fibre</span></div>
            <ul>
              {PINGS.map((p) => (
                <li key={p.c} className={p.you ? 'is-you' : ''}>
                  <code>{p.c}</code><span className="nb-ping-city">{p.city}{p.you && <em>closest</em>}</span>
                  <span className="nb-ping-bar"><i style={{ width: `${Math.min(100, (p.ms / 170) * 100)}%` }} /></span>
                  <b>{p.ms} ms</b>
                </li>
              ))}
            </ul>
            <p className="nb-ping-f">Measured from your browser just now · p50 of 5 pings</p>
          </div>
        </div>
      </section>

      {/* ── Observability ── */}
      <section className="nb-sec" id="observe">
        <div className="nb-head nb-head-c">
          <p className="nb-kick">Observability</p>
          <h2 className="nb-h2">Every request, traced, no agent to install</h2>
          <p className="nb-p">Requests, latency percentiles, errors and cache hits per region, with traces down to the SQL query. Kept for 30 days on Pro, exported to your own warehouse on Enterprise.</p>
        </div>
        <Dashboard />
      </section>

      {/* ── Features ── */}
      <section className="nb-sec" id="platform">
        <div className="nb-head nb-head-row">
          <div>
            <p className="nb-kick">Platform</p>
            <h2 className="nb-h2">The rest of your backend, already next to your code</h2>
          </div>
          <p className="nb-p">Postgres, KV, queues, cron, previews and a firewall come with every project. One bill, one dashboard, one place to look at 3 a.m.</p>
        </div>
        <div className="nb-features">
          {FEATURES.map((f) => (
            <article key={f.t} className="nb-feature">
              {f.viz}
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Customer ── */}
      <section className="nb-sec nb-story">
        <figure>
          <span className="nb-logo lg-a nb-story-logo"><svg viewBox="0 0 24 24" aria-hidden="true">{LOGOS[0].g}</svg>Kestrel</span>
          <blockquote>“We moved checkout from one region in Virginia to Northbeam over a weekend. Customers in Europe and Brazil stopped waiting on the Atlantic, and our p99 went from 640 ms to 92.”</blockquote>
          <figcaption><span className="nb-av">MO</span><span><b>Marta Oliveira</b>Head of Platform, Kestrel</span></figcaption>
        </figure>
        <dl className="nb-story-nums">
          <div><dt>p99 checkout latency</dt><dd>640 → 92 ms</dd></div>
          <div><dt>Checkout conversion</dt><dd>+4.1%</dd></div>
          <div><dt>Monthly infrastructure bill</dt><dd>−38%</dd></div>
        </dl>
      </section>

      {/* ── Pricing ── */}
      <section className="nb-sec" id="pricing">
        <div className="nb-head nb-head-c">
          <p className="nb-kick">Pricing</p>
          <h2 className="nb-h2">Pay for requests, not idle servers</h2>
          <p className="nb-p">Start free. Pro includes generous usage, then you pay per million requests — and you can set a hard spending cap.</p>
        </div>
        <div className="nb-tiers">
          {TIERS.map((t) => (
            <div key={t.n} className={`nb-tier${t.hot ? ' is-hot' : ''}`}>
              {t.hot && <span className="nb-tier-tag">Most teams</span>}
              <h3>{t.n}</h3>
              <p className="nb-tier-d">{t.d}</p>
              <p className="nb-price"><b>{t.p}</b><span>{t.s}</span></p>
              <a className={`nb-btn${t.hot ? '' : ' nb-btn-ghost'}`} href="#top">{t.cta}</a>
              <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="nb-usage">
          <div className="nb-usage-h">
            <div><b>What a Pro bill looks like</b><span>acme/storefront · 1–31 Oct 2026 · 2 members</span></div>
            <p className="nb-usage-total"><span>Estimated</span><b>$40.00</b></p>
          </div>
          <div className="nb-meters">
            {METERS.map((m) => (
              <div key={m.k} className={`nb-m${m.warn ? ' is-warn' : ''}`}>
                <div className="nb-m-t"><span>{m.k}</span><b>{m.v}<em> / {m.of}</em></b></div>
                <div className="nb-meter"><i style={{ width: `${m.p}%` }} /></div>
                <small>{m.warn ? '88% used — alert sent to #infra' : `${m.p}% of included`}</small>
              </div>
            ))}
          </div>
          <p className="nb-usage-f">Over the limit? $0.60 per extra million requests · $0.08 per GB · $0.04 per GB-hour. Spend cap set at <b>$150</b>.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nb-final">
        <h2 className="nb-h2">Ship it everywhere this afternoon</h2>
        <p className="nb-p">Free for personal projects. No credit card, no sales call.</p>
        <div className="nb-ctas">
          <a className="nb-btn" href="#top">Start deploying</a>
          <a className="nb-btn nb-btn-ghost" href="#top">Read the docs</a>
        </div>
        <p className="nb-cmd"><span>$</span> npm i -g northbeam &amp;&amp; nb deploy <kbd>⌘C</kbd></p>
      </section>

      <nav className="nb-sitemap" aria-label="Site map">
        <div className="nb-sm-brand">
          <span className="nb-sm-logo"><Mark size={26} />Northbeam</span>
          <a className="nb-status" href="#top"><i className="nb-dot is-ok" />All systems normal</a>
          <p>Lisbon · San Francisco · Singapore</p>
        </div>
        {[
          ['Product', ['Functions', 'Postgres', 'KV', 'Queues', 'Firewall', 'Observability']],
          ['Developers', ['Docs', 'CLI reference', 'Templates', 'Changelog', 'Status']],
          ['Company', ['About', 'Customers', 'Careers', 'Blog', 'Contact']],
          ['Legal', ['Terms', 'Privacy', 'DPA', 'Security', 'Sub-processors']],
        ].map(([h, items]) => (
          <div key={h as string} className="nb-sm-col"><b>{h}</b><ul>{(items as string[]).map((x) => <li key={x}><a href="#top">{x}</a></li>)}</ul></div>
        ))}
      </nav>
    </Site>
  );
}
