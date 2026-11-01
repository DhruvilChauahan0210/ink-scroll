'use client';

import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { smooth, type P } from '@/components/examples/ink/geo';
import { ACCOUNTS, ACTIVITY, MONTHS, MOVES, MRR, MRR_2025, NOW, PLANS, pct, usd, usdSigned } from './data';
import { Av, I, Mark } from './parts';

/*
 * The product shot: Lumenstack's MRR page in Ledgerline. The two MRR lines
 * are the scroll-drawn part — ScrollDraw with selector=".ll-line" and a
 * stagger, so last year plots first and this year follows. onProgress writes
 * the draw's progress to --p on the window, and the fill, the movement bars,
 * the end dot, the crosshair and the December tooltip all key off it in CSS.
 */

const W = 760, H = 240, X0 = 6, X1 = 754, Y0 = 14, Y1 = 226, LO = 70_000, HI = 210_000;
const x = (i: number) => X0 + (i * (X1 - X0)) / 11;
const y = (v: number) => Y1 - ((v - LO) / (HI - LO)) * (Y1 - Y0);
const NOW_D = smooth(MRR.map((v, i) => [x(i), y(v)] as P));
const PREV_D = smooth(MRR_2025.map((v, i) => [x(i), y(v)] as P));
const AREA_D = `${NOW_D} L ${X1} ${Y1} L ${X0} ${Y1} Z`;
const GRID = [100_000, 150_000, 200_000];
const fx = (i: number) => `${((x(i) / W) * 100).toFixed(3)}%`;
const fy = (v: number) => `calc(var(--ph) * ${(y(v) / H).toFixed(4)})`;

// Movement bars: new and expansion up, contraction and churn down.
const UP = 11_000;
const barH = (v: number) => `${((v / UP) * 100).toFixed(2)}%`;

const KPIS = [
  { k: 'MRR', v: usd(NOW.mrr), d: `${pct(NOW.yoy)}`, s: 'vs Dec 2025', up: true },
  { k: 'Net new MRR', v: usd(NOW.net), d: pct(NOW.netMoM), s: 'vs Nov', up: true },
  { k: 'Customers', v: NOW.customers.toLocaleString('en-US'), d: `${NOW.netLogos}`, s: 'net in Dec', up: true },
  { k: 'ARPA', v: usd(NOW.arpa), d: pct(NOW.arpaYoY), s: 'vs Dec 2025', up: true },
  { k: 'Gross MRR churn', v: pct(NOW.gross), d: `${((NOW.grossPrev - NOW.gross) * 100).toFixed(1)} pt`, s: 'vs Nov', up: false },
];

const RAIL: [keyof typeof I, string][] = [['overview', 'Overview'], ['mrr', 'MRR'], ['customers', 'Customers'], ['cohorts', 'Cohorts'], ['forecast', 'Forecast'], ['reports', 'Reports']];

const KIND = { new: 'New', exp: 'Expansion', con: 'Contraction', churn: 'Churn' } as const;

export function Dashboard() {
  const win = useRef<HTMLDivElement>(null);
  const onDash = useCallback((p: number) => win.current?.style.setProperty('--p', p.toFixed(3)), []);
  const mom = NOW.mrr / NOW.prevMrr - 1;

  return (
    <div className="ll-dash" ref={win}>
      {/* Window chrome */}
      <div className="ll-app-top">
        <span className="ll-ws"><span className="ll-ws-logo" aria-hidden="true">L</span><b>Lumenstack</b><span className="ll-hide-s ll-ws-plan">Growth</span>{I.updown}</span>
        <span className="ll-find">{I.search}<span className="ll-hide-s">Search customers, invoices, metrics</span><kbd className="ll-hide-s">⌘K</kbd></span>
        <span className="ll-top-r">
          <span className="ll-range ll-hide-m">{I.cal}1 Jan – 31 Dec 2026<em>vs 2025</em></span>
          <span className="ll-icon-btn ll-hide-s">{I.bell}<i /></span>
          <Av i="IC" a="#f59e0b" b="#db2777" size={26} />
        </span>
      </div>

      <div className="ll-app">
        <nav className="ll-rail" aria-hidden="true">
          <span className="ll-rail-mark"><Mark size={24} /></span>
          {RAIL.map(([k, l]) => <span key={k} className={k === 'mrr' ? 'on' : ''} title={l}>{I[k]}</span>)}
          <span className="ll-rail-sp" />
          <span title="Integrations">{I.plug}</span>
          <span title="Settings">{I.gear}</span>
        </nav>

        <div className="ll-main">
          <div className="ll-page-h">
            <div>
              <p className="ll-crumb">Revenue <i>/</i> <b>MRR</b></p>
              <p className="ll-synced"><span className="ll-ok">{I.check}</span>Matches billing to the cent<span className="ll-hide-s"> · updated 12 min ago</span></p>
            </div>
            <div className="ll-page-r">
              <span className="ll-seg"><span>30D</span><span>90D</span><span className="on">12M</span><span className="ll-hide-s">All</span></span>
              <span className="ll-btn-g ll-hide-s">{I.down}Export</span>
            </div>
          </div>

          <div className="ll-kpis">
            {KPIS.map((c) => (
              <div key={c.k} className="ll-kpi">
                <span>{c.k}</span>
                <b>{c.v}</b>
                <em className={c.up ? 'up' : 'dn'}><i aria-hidden="true">{c.up ? '▲' : '▼'}</i>{c.d}<small>{c.s}</small></em>
              </div>
            ))}
          </div>

          <div className="ll-board">
            <section className="ll-chart" aria-label="MRR chart">
              <div className="ll-chart-h">
                <div>
                  <h4>Monthly recurring revenue</h4>
                  <div className="ll-legend"><span><i className="now" />2026</span><span><i className="prev" />2025</span></div>
                </div>
                <span className="ll-sel">Monthly{I.chev}</span>
              </div>

              <div className="ll-plot">
                <div className="ll-yax" aria-hidden="true">
                  {GRID.map((v) => <span key={v} style={{ top: fy(v) }}>${v / 1000}k</span>)}
                </div>
                <div className="ll-pa">
                  <ScrollDraw className="ll-draw" selector=".ll-line" trigger={{ start: 'top 90%', end: 'top 30%' }} stagger={0.18} easing="ease-out" once onProgress={onDash}>
                    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`MRR, 2026 against 2025: from ${usd(MRR[0])} in January to ${usd(NOW.mrr)} in December, up from ${usd(MRR_2025[11])} a year earlier`}>
                      <defs>
                        <linearGradient id="ll-fade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#7c8cff" stopOpacity="0.32" />
                          <stop offset="1" stopColor="#7c8cff" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="ll-grid" d={GRID.map((v) => `M ${X0} ${y(v).toFixed(1)} H ${X1}`).join(' ')} />
                      <path className="ll-area" d={AREA_D} fill="url(#ll-fade)" />
                      <path className="ll-line prev" d={PREV_D} />
                      <path className="ll-line now" d={NOW_D} />
                    </svg>
                  </ScrollDraw>
                  <span className="ll-cross" style={{ left: fx(11), top: fy(NOW.mrr) }} aria-hidden="true" />
                  <span className="ll-dot" style={{ left: fx(11), top: fy(NOW.mrr) }} aria-hidden="true" />
                  <span className="ll-tip" style={{ top: fy(NOW.mrr) }} aria-hidden="true">
                    <b>{usd(NOW.mrr)}</b><span>Dec<span className="ll-hide-s"> 2026</span></span><em>▲ {pct(mom)}</em>
                  </span>

                  <div className="ll-bars" aria-hidden="true">
                    {MOVES.map((m, i) => (
                      <span key={i} className={`ll-bar${i === 11 ? ' is-on' : ''}`} style={{ left: fx(i), '--t': (i / 13).toFixed(3) } as CSSProperties}>
                        <span className="ll-bar-up"><i className="n" style={{ height: barH(m.n) }} /><i className="e" style={{ height: barH(m.e) }} /></span>
                        <span className="ll-bar-dn"><i className="c" style={{ height: barH(m.c) }} /><i className="x" style={{ height: barH(m.x) }} /></span>
                      </span>
                    ))}
                  </div>
                  <div className="ll-xax" aria-hidden="true">
                    {MONTHS.map((m, i) => <span key={m} style={{ left: fx(i) }}><span className="ll-full">{m}</span><span className="ll-short">{m[0]}</span></span>)}
                  </div>
                </div>
              </div>

              <div className="ll-mv-legend">
                <span className="ll-mv-t">Monthly movement</span>
                <span><i className="n" />New</span><span><i className="e" />Expansion</span><span><i className="c" />Contraction</span><span><i className="x" />Churn</span>
              </div>
            </section>

            <div className="ll-side">
              <section className="ll-card ll-plans" aria-label="MRR by plan">
                <div className="ll-card-h"><h4>MRR by plan</h4><span>{NOW.customers} customers</span></div>
                <div className="ll-stack" aria-hidden="true">
                  {PLANS.map((p) => <i key={p.k} className={p.tone} style={{ width: `${(p.m / NOW.mrr) * 100}%` }} />)}
                </div>
                <ul className="ll-plan-list">
                  {PLANS.map((p) => (
                    <li key={p.k}>
                      <i className={p.tone} />
                      <span>{p.k}</span>
                      <em>{p.c}</em>
                      <b>{usd(p.m)}</b>
                      <small>{Math.round((p.m / NOW.mrr) * 100)}%</small>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="ll-card ll-feed" aria-label="December movements">
                <div className="ll-card-h"><h4>Latest movements</h4><span className="ll-link">View all</span></div>
                <ul>
                  {ACTIVITY.map((a) => (
                    <li key={a.who}>
                      <Av i={a.i} a={a.a} b={a.b} size={28} />
                      <span className="ll-feed-t"><b>{a.who}</b><span>{a.what}</span></span>
                      <span className="ll-feed-r"><em className={a.amt < 0 ? 'neg' : 'pos'}>{usdSigned(a.amt)}</em><small><i className={`k-${a.kind}`} />{KIND[a.kind]} · {a.when}</small></span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section className="ll-card ll-accts" aria-label="Largest accounts">
            <div className="ll-card-h">
              <h4>Largest accounts</h4>
              <span className="ll-accts-r"><span className="ll-chip">{I.filter}All plans</span><span className="ll-chip ll-hide-s">Active</span></span>
            </div>
            <table className="ll-table">
              <thead>
                <tr><th>Customer</th><th className="ll-hide-s">Plan</th><th className="ll-hide-m">Seats</th><th className="ll-hide-m">Billing</th><th className="r">MRR</th><th className="r">Dec change</th><th className="ll-hide-s r">Customer since</th></tr>
              </thead>
              <tbody>
                {ACCOUNTS.map((a) => (
                  <tr key={a.who}>
                    <td><span className="ll-who"><Av i={a.i} a={a.a} b={a.b} size={22} /><b>{a.who}</b></span></td>
                    <td className="ll-hide-s"><span className={`ll-plan-tag ${a.plan === 'Enterprise' ? 'p3' : 'p2'}`}>{a.plan}</span></td>
                    <td className="ll-hide-m ll-num">{a.seats}</td>
                    <td className="ll-hide-m">{a.bill}</td>
                    <td className="r ll-num">{usd(a.mrr)}</td>
                    <td className={`r ll-num ${a.chg > 0 ? 'pos' : a.chg < 0 ? 'neg' : 'flat'}`}>{a.chg ? usdSigned(a.chg) : '—'}</td>
                    <td className="ll-hide-s r ll-dim">{a.since}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
