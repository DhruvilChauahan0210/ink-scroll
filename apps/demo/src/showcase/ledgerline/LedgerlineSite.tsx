'use client';

import './ledgerline.css';
import { useCallback, useRef } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { smooth, type P } from '@/components/examples/ink/geo';
import { BuiltWith } from '../BuiltWith';

/*
 * Ledgerline — a demo site for a fictional subscription-analytics product,
 * built with svg-scroll-draw. Every chart on the page is drawn by the library
 * as it scrolls into view:
 *   · the hero dashboard's MRR lines draw with a stagger (selector + stagger),
 *     and its fill and tooltip follow the draw through onProgress
 *   · six cohort retention curves fan out one after another
 *   · the forecast draws past today, its confidence band widening with progress
 *   · three sparklines draw together in the metrics row
 */

/* ── Data ─────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MRR_2026 = [118, 124, 129, 133, 141, 146, 152, 158, 163, 170, 177, 184.3];
const MRR_2025 = [96, 99, 103, 104, 108, 112, 115, 119, 121, 125, 128, 131];

const cohortCurve = (k: number) =>
  Array.from({ length: 12 }, (_, m) => 100 * (0.58 + k * 0.025 + (0.42 - k * 0.025) * Math.exp(-m / (1.9 + k * 0.35))));
const COHORTS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((name, k) => ({ name, vals: cohortCurve(k) }));

const ACTUAL = MRR_2026;
const FORECAST = [184.3, 190.6, 197.1, 203.8, 210.7, 217.9, 225.3];

/* ── Chart helpers ────────────────────────────────────────────────────── */

type Box = { w: number; h: number; x0: number; x1: number; y0: number; y1: number; lo: number; hi: number };
const scale = (b: Box, n: number) => ({
  x: (i: number) => b.x0 + (i * (b.x1 - b.x0)) / (n - 1),
  y: (v: number) => b.y1 - ((v - b.lo) / (b.hi - b.lo)) * (b.y1 - b.y0),
});
const line = (vals: number[], b: Box, n = vals.length, offset = 0) => {
  const s = scale(b, n);
  return smooth(vals.map((v, i) => [s.x(i + offset), s.y(v)] as P));
};

const HERO: Box = { w: 760, h: 240, x0: 6, x1: 754, y0: 14, y1: 226, lo: 80, hi: 200 };
const HS = scale(HERO, 12);
const HERO_NOW = line(MRR_2026, HERO);
const HERO_PREV = line(MRR_2025, HERO);
const HERO_AREA = `${HERO_NOW} L ${HERO.x1} ${HERO.y1} L ${HERO.x0} ${HERO.y1} Z`;

const CO: Box = { w: 520, h: 260, x0: 8, x1: 512, y0: 12, y1: 248, lo: 50, hi: 100 };
const FC: Box = { w: 520, h: 260, x0: 8, x1: 512, y0: 12, y1: 248, lo: 100, hi: 240 };
const FS = scale(FC, 18);
const FC_ACTUAL = smooth(ACTUAL.map((v, i) => [FS.x(i), FS.y(v)] as P));
const FC_AHEAD = smooth(FORECAST.map((v, i) => [FS.x(i + 11), FS.y(v)] as P));
const band = (() => {
  // ±(1.2% + 1.3% a month): 9% either side six months out.
  const up = FORECAST.map((v, i) => [FS.x(i + 11), FS.y(v * (1 + (i === 0 ? 0 : 0.012 + 0.013 * i)))] as P);
  const dn = FORECAST.map((v, i) => [FS.x(i + 11), FS.y(v * (1 - (i === 0 ? 0 : 0.012 + 0.013 * i)))] as P);
  return `${smooth(up)} L ${dn.slice().reverse().map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z`;
})();

const SPARKS = [
  { k: 'ARPA', v: '$238', d: '+12.3%', vals: [212, 214, 213, 218, 221, 220, 224, 228, 227, 232, 235, 238] },
  { k: 'Customer LTV', v: '$6,040', d: '+18.4%', vals: [5.1, 5.15, 5.2, 5.3, 5.35, 5.5, 5.55, 5.7, 5.75, 5.85, 5.95, 6.04] },
  { k: 'Quick ratio', v: '3.4', d: '+1.3', vals: [2.1, 2.3, 2.2, 2.5, 2.6, 2.4, 2.8, 2.9, 3.1, 3.0, 3.2, 3.4] },
];
const sparkPath = (vals: number[]) => {
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return smooth(vals.map((v, i) => [2 + (i * 196) / 11, 46 - ((v - lo) / (hi - lo)) * 40] as P));
};

/* ── Page ─────────────────────────────────────────────────────────────── */

export function LedgerlineSite() {
  const dash = useRef<HTMLDivElement>(null);
  const fc = useRef<HTMLDivElement>(null);
  const onDash = useCallback((p: number) => dash.current?.style.setProperty('--p', p.toFixed(3)), []);
  const onFc = useCallback((p: number) => fc.current?.style.setProperty('--p', p.toFixed(3)), []);

  return (
    <div className="ll">
      <header className="ll-nav">
        <a className="ll-brand" href="#top">
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect width="20" height="20" rx="5" fill="#7c8cff" /><path d="M5.5 14.5V9.5M10 14.5V5.5M14.5 14.5V11" stroke="#0b0d12" strokeWidth="2.2" strokeLinecap="round" /></svg>
          Ledgerline
        </a>
        <nav className="ll-links" aria-label="Main">
          <a href="#product">Product</a><a href="#metrics">Metrics</a><a href="#pricing">Pricing</a><a href="#customers">Customers</a>
        </nav>
        <span className="ll-nav-r">
          <a href="#pricing" className="ll-signin">Sign in</a>
          <a href="#pricing" className="ll-btn ll-btn-sm">Start free</a>
        </span>
      </header>

      <section className="ll-hero" id="top">
        <p className="ll-pill"><span>New</span> Forecasts with confidence intervals →</p>
        <h1 className="ll-h1">Revenue analytics for subscription businesses.</h1>
        <p className="ll-lede">Connect Stripe, Paddle or Chargebee in two minutes. MRR, churn, cohorts and forecasts — reconciled to the cent, refreshed every hour.</p>
        <div className="ll-ctas">
          <a className="ll-btn" href="#pricing">Start free — 14 days</a>
          <a className="ll-btn ll-btn-ghost" href="#customers">Book a demo</a>
        </div>
      </section>

      {/* ── The dashboard: MRR lines draw as it scrolls in ── */}
      <section className="ll-dash-wrap" id="product">
        <div className="ll-dash" ref={dash}>
          <aside className="ll-side" aria-hidden="true">
            <span className="ll-side-h">Northwind</span>
            {['Overview', 'MRR', 'Churn', 'Cohorts', 'Forecast', 'Customers', 'Reports'].map((x) => (
              <span key={x} className={x === 'MRR' ? 'on' : ''}>{x}</span>
            ))}
          </aside>
          <div className="ll-main">
            <div className="ll-main-top">
              <span className="ll-crumb">Revenue <i>/</i> <b>MRR</b></span>
              <span className="ll-seg"><span>30D</span><span>90D</span><span className="on">12M</span><span>All</span></span>
            </div>
            <div className="ll-kpis">
              <div><span>MRR</span><b>$184,320</b><em>▲ 40.7% YoY</em></div>
              <div><span>Net new MRR</span><b>$7,320</b><em>▲ 3.1% MoM</em></div>
              <div><span>Customers</span><b>774</b><em>▲ 38 this month</em></div>
              <div><span>Revenue churn</span><b>1.8%</b><em>▼ 0.4 pt</em></div>
            </div>
            <div className="ll-chart">
              <div className="ll-legend"><span><i className="now" />2026</span><span><i className="prev" />2025</span></div>
              <div className="ll-plot">
                <div className="ll-yax" aria-hidden="true">
                  {[180, 140, 100].map((v) => <span key={v} style={{ top: `${(HS.y(v) / HERO.h) * 100}%` }}>${v}k</span>)}
                </div>
                <ScrollDraw className="ll-draw" selector=".ll-line" trigger={{ start: 'top 90%', end: 'top 30%' }} stagger={0.18} easing="ease-out" once onProgress={onDash}>
                  <svg viewBox={`0 0 ${HERO.w} ${HERO.h}`} preserveAspectRatio="none" role="img" aria-label="MRR, 2025 against 2026: from $118k in January to $184.3k in December">
                    <defs>
                      <linearGradient id="ll-fade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#7c8cff" stopOpacity="0.3" />
                        <stop offset="1" stopColor="#7c8cff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path className="ll-grid" d={[100, 140, 180].map((v) => `M ${HERO.x0} ${HS.y(v).toFixed(1)} H ${HERO.x1}`).join(' ')} />
                    <path className="ll-area" d={HERO_AREA} fill="url(#ll-fade)" />
                    <path className="ll-line prev" d={HERO_PREV} />
                    <path className="ll-line now" d={HERO_NOW} />
                  </svg>
                </ScrollDraw>
                <span className="ll-dot" style={{ '--x': (HS.x(11) / HERO.w).toFixed(4), top: `${(HS.y(184.3) / HERO.h) * 100}%` } as React.CSSProperties} aria-hidden="true" />
                <span className="ll-tip" style={{ top: `${(HS.y(184.3) / HERO.h) * 100}%` }} aria-hidden="true"><b>$184,320</b> Dec 2026</span>
              </div>
              <div className="ll-xax" aria-hidden="true">{MONTHS.map((m) => <span key={m}>{m}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ll-logos" id="customers" aria-label="Customers">
        <p>Trusted by 1,900 subscription teams</p>
        <div>
          {['Northwind', 'Kiln & Co', 'Parcelry', 'aster', 'QUILL', 'Lumenstack'].map((n, i) => <span key={n} className={`ll-logo l${i}`}>{n}</span>)}
        </div>
      </section>

      {/* ── Cohorts ── */}
      <section className="ll-feat">
        <div className="ll-feat-copy">
          <p className="ll-kick">Cohorts</p>
          <h2 className="ll-h2">See which months your churn really comes from.</h2>
          <p className="ll-body">Every signup month becomes a cohort you can follow for a year. Ledgerline lines them up so a bad onboarding month stands out before it shows in MRR.</p>
          <ul className="ll-points"><li>Logo and revenue retention</li><li>Filter by plan, country or channel</li><li>Export any cohort to CSV</li></ul>
        </div>
        <div className="ll-panel">
          <div className="ll-panel-h"><span>Revenue retention by signup month</span><span className="ll-mut">2026 cohorts</span></div>
          <ScrollDraw className="ll-cohorts" selector=".ll-co" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.12} easing="ease-out" once>
            <svg viewBox={`0 0 ${CO.w} ${CO.h}`} preserveAspectRatio="none" role="img" aria-label="Six cohort retention curves, settling between 58% and 70% after a year">
              <path className="ll-grid" d={[60, 70, 80, 90].map((v) => `M ${CO.x0} ${scale(CO, 12).y(v).toFixed(1)} H ${CO.x1}`).join(' ')} />
              {COHORTS.map((c, k) => <path key={c.name} className={`ll-co c${k}`} d={line(c.vals, CO)} />)}
            </svg>
          </ScrollDraw>
          <div className="ll-axis-row" aria-hidden="true"><span>Month 0</span><span>Month 6</span><span>Month 11</span></div>
          <div className="ll-co-legend">{COHORTS.map((c, k) => <span key={c.name}><i className={`c${k}`} />{c.name}</span>)}</div>
        </div>
      </section>

      {/* ── Forecast ── */}
      <section className="ll-feat ll-feat-flip">
        <div className="ll-feat-copy">
          <p className="ll-kick">Forecasts</p>
          <h2 className="ll-h2">A forecast you can put in front of your board.</h2>
          <p className="ll-body">Six months ahead from your actual expansion, contraction and churn — with an honest confidence band that widens the further out you look.</p>
        </div>
        <div className="ll-panel" ref={fc}>
          <div className="ll-panel-h"><span>MRR forecast</span><span className="ll-mut">80% interval</span></div>
          <div className="ll-fc">
            <ScrollDraw className="ll-fc-draw" selector=".ll-fl" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.5} easing="ease-out" once onProgress={onFc}>
              <svg viewBox={`0 0 ${FC.w} ${FC.h}`} preserveAspectRatio="none" role="img" aria-label="Actual MRR to December, then a forecast to $225k by June 2027 with a widening interval">
                <path className="ll-grid" d={[140, 180, 220].map((v) => `M ${FC.x0} ${FS.y(v).toFixed(1)} H ${FC.x1}`).join(' ')} />
                <path className="ll-band" d={band} />
                <path className="ll-today" d={`M ${FS.x(11).toFixed(1)} ${FC.y0} V ${FC.y1}`} />
                <path className="ll-fl actual" d={FC_ACTUAL} />
                <path className="ll-fl ahead" d={FC_AHEAD} />
              </svg>
            </ScrollDraw>
            <span className="ll-today-l" style={{ left: `${(FS.x(11) / FC.w) * 100}%` }}>Today</span>
            <span className="ll-fc-end"><b>$225k</b> Jun 2027</span>
          </div>
          <div className="ll-axis-row" aria-hidden="true"><span>Jan 2026</span><span>Dec 2026</span><span>Jun 2027</span></div>
        </div>
      </section>

      {/* ── Metrics: three sparklines draw together ── */}
      <section className="ll-metrics" id="metrics">
        <h2 className="ll-h2 ll-center">Forty metrics, one source of truth.</h2>
        <div className="ll-sparks">
          {SPARKS.map((s) => (
            <div key={s.k} className="ll-spark">
              <span className="ll-mut">{s.k}</span>
              <b>{s.v}</b>
              <em>{s.d} YoY</em>
              <ScrollDraw className="ll-spark-draw" trigger={{ start: 'top 90%', end: 'top 55%' }} easing="ease-out" once>
                <svg viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true"><path className="ll-sl" d={sparkPath(s.vals)} /></svg>
              </ScrollDraw>
            </div>
          ))}
        </div>
      </section>

      <section className="ll-quote">
        <blockquote>
          “We closed our Series B with Ledgerline&apos;s forecast on the second slide. Nobody asked where the numbers came from — they could click through to every invoice.”
        </blockquote>
        <p><b>Maya Okafor</b> · CFO, Parcelry</p>
      </section>

      <section className="ll-pricing" id="pricing">
        <h2 className="ll-h2 ll-center">Priced by your MRR, not your seats.</h2>
        <div className="ll-tiers">
          {[
            { n: 'Starter', p: '$0', s: 'up to $10k MRR', f: ['MRR, churn and cohorts', 'One billing source', 'Daily refresh'] },
            { n: 'Growth', p: '$149', s: 'per month, up to $250k MRR', f: ['Everything in Starter', 'Forecasts and segments', 'Hourly refresh', 'Slack and email digests'], hot: true },
            { n: 'Scale', p: 'Custom', s: 'above $250k MRR', f: ['Everything in Growth', 'Warehouse sync', 'SSO and audit log', 'A named analyst'] },
          ].map((t) => (
            <div key={t.n} className={`ll-tier${t.hot ? ' hot' : ''}`}>
              {t.hot && <span className="ll-tier-tag">Most teams</span>}
              <h3>{t.n}</h3>
              <p className="ll-price"><b>{t.p}</b> <span>{t.s}</span></p>
              <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
              <a className={`ll-btn${t.hot ? '' : ' ll-btn-ghost'}`} href="#pricing">{t.n === 'Scale' ? 'Talk to us' : 'Start free'}</a>
            </div>
          ))}
        </div>
      </section>

      <footer className="ll-foot">
        <span className="ll-brand">Ledgerline</span>
        <span>© 2026 Ledgerline, Inc. — a fictional company; this is a demo site.</span>
      </footer>

      <BuiltWith example="line-chart" apis="selector · stagger · onProgress" />
    </div>
  );
}
