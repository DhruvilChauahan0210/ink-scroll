'use client';

import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { smooth, type P } from '@/components/examples/ink/geo';
import {
  ARPA, ASSUME, COHORTS, FC_CROSS, FC_END, FC_MONTHS, FORECAST, GROSS_CHURN, LTV, MRR, NET, NOW, NRR, QUICK,
  SPREAD, START_MRR, YEAR, GROSS_MARGIN, LOGO_CHURN_3M, k1, pct, usd, usdSigned,
} from './data';
import { I } from './parts';

/* ── MRR movements: the year as a bridge ──────────────────────────────── */

const WF_MAX = 240_000;
const STEPS = (() => {
  const s = [
    { k: 'Opening', s: 'Open', sub: '31 Dec 2025', from: 0, to: START_MRR, t: 'total' },
    { k: 'New', s: 'New', sub: '400 customers', d: YEAR.n, t: 'n' },
    { k: 'Expansion', s: 'Exp.', sub: '312 accounts', d: YEAR.e, t: 'e' },
    { k: 'Contraction', s: 'Contr.', sub: '118 accounts', d: -YEAR.c, t: 'c' },
    { k: 'Churn', s: 'Churn', sub: '161 customers', d: -YEAR.x, t: 'x' },
  ];
  let at = START_MRR;
  const out = s.map((v) => {
    if (v.t === 'total') return { ...v, from: 0, to: START_MRR };
    const from = at; at += v.d!; return { ...v, from, to: at };
  });
  out.push({ k: 'Closing', s: 'Close', sub: '31 Dec 2026', from: 0, to: at, t: 'total' });
  return out;
})();
const wy = (v: number) => `${(100 - (v / WF_MAX) * 100).toFixed(2)}%`;

export function Movements() {
  const rows = [
    { k: 'New', n: 400, v: YEAR.n, t: 'n' },
    { k: 'Expansion', n: 312, v: YEAR.e, t: 'e' },
    { k: 'Contraction', n: 118, v: -YEAR.c, t: 'c' },
    { k: 'Churn', n: 161, v: -YEAR.x, t: 'x' },
  ];
  const net = YEAR.n + YEAR.e - YEAR.c - YEAR.x;
  return (
    <section className="ll-sec ll-split" id="movements">
      <div className="ll-copy">
        <p className="ll-kick">MRR movements</p>
        <h2 className="ll-h2">Know why MRR moved, not just that it did.</h2>
        <p className="ll-body">Every change to every subscription is sorted into new, expansion, contraction or churn the moment it lands in billing — proration, refunds, pauses and plan swaps included — so the bridge from opening to closing MRR always adds up.</p>
        <ul className="ll-points">
          <li><b>Click any bar</b><span>to see the customers and invoices inside it.</span></li>
          <li><b>Reactivations counted apart</b><span>so a returning customer never shows up as new.</span></li>
          <li><b>FX at the invoice date</b><span>or at a fixed board rate — your choice, applied everywhere.</span></li>
        </ul>
      </div>

      <div className="ll-panel ll-wf-panel">
        <div className="ll-panel-h">
          <div><h3>MRR bridge</h3><p>Lumenstack · all plans</p></div>
          <span className="ll-seg"><span>Dec</span><span>Q4</span><span className="on">2026</span></span>
        </div>
        <div className="ll-wf" role="img" aria-label={`MRR bridge for 2026: opening ${usd(START_MRR)}, plus ${usd(YEAR.n)} new and ${usd(YEAR.e)} expansion, minus ${usd(YEAR.c)} contraction and ${usd(YEAR.x)} churn, closing at ${usd(NOW.mrr)}`}>
          <div className="ll-wf-grid" aria-hidden="true">
            {[0, 60_000, 120_000, 180_000, 240_000].map((v) => <span key={v} style={{ top: wy(v) }}><em>{v ? `$${v / 1000}k` : '$0'}</em></span>)}
          </div>
          <div className="ll-wf-cols">
            {STEPS.map((s, i) => {
              const top = Math.max(s.from, s.to), bot = Math.min(s.from, s.to);
              const delta = s.t === 'total' ? usd(s.to) : usdSigned(s.to - s.from);
              return (
                <div key={s.k} className={`ll-wf-col t-${s.t}`}>
                  <div className="ll-wf-track">
                    {i > 0 && <span className="ll-wf-link" style={{ top: wy(s.t === 'total' ? s.to : s.from) }} />}
                    <span className="ll-wf-bar" style={{ top: wy(top), bottom: `${((bot / WF_MAX) * 100).toFixed(2)}%` }}>
                      <b>{delta}</b>
                    </span>
                  </div>
                  <span className="ll-wf-l"><span className="ll-full">{s.k}</span><span className="ll-short">{s.s}</span><small>{s.sub}</small></span>
                </div>
              );
            })}
          </div>
        </div>
        <table className="ll-mini-table">
          <thead><tr><th>Movement</th><th className="r">Accounts</th><th className="r">MRR</th><th className="r ll-hide-s">Share of opening</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}>
                <td><i className={`ll-sw ${r.t}`} />{r.k}</td>
                <td className="r ll-num">{r.n}</td>
                <td className={`r ll-num ${r.v < 0 ? 'neg' : 'pos'}`}>{usdSigned(r.v)}</td>
                <td className="r ll-num ll-hide-s">{pct(r.v / START_MRR)}</td>
              </tr>
            ))}
            <tr className="ll-total"><td>Net new MRR</td><td className="r ll-num">+239</td><td className="r ll-num pos">{usdSigned(net)}</td><td className="r ll-num ll-hide-s">{pct(net / START_MRR)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Cohorts: six curves draw in turn, beside the full triangle ───────── */

const CO = { w: 520, h: 260, x0: 6, x1: 514, y0: 10, y1: 250, lo: 85.5, hi: 106.5 };
const cx = (k: number) => CO.x0 + (k * (CO.x1 - CO.x0)) / 11;
const cy = (v: number) => CO.y1 - ((v - CO.lo) / (CO.hi - CO.lo)) * (CO.y1 - CO.y0);
const DRAWN = COHORTS.slice(0, 6);
const cell = (v: number): CSSProperties => {
  if (v >= 100) return { background: `rgba(52, 211, 153, ${(0.16 + Math.min(1, (v - 100) / 6) * 0.5).toFixed(2)})`, color: '#eafff6' };
  const t = Math.max(0, Math.min(1, (v - 86) / 14));
  return { background: `rgba(124, 140, 255, ${(0.08 + t * 0.42).toFixed(2)})`, color: t > 0.35 ? '#eef0ff' : '#c8ccdb' };
};

export function Cohorts() {
  const apr = COHORTS[3].vals[3], rest = COHORTS.filter((_, r) => r !== 3 && r < 9).map((c) => c.vals[3]);
  const gap = rest.reduce((a, b) => a + b, 0) / rest.length - apr;
  return (
    <section className="ll-sec" id="cohorts">
      <div className="ll-head">
        <p className="ll-kick">Cohorts</p>
        <h2 className="ll-h2">See which months your churn really comes from.</h2>
        <p className="ll-body">Every signup month becomes a cohort you can follow for a year. Ledgerline lines them up, so a bad onboarding month stands out long before it shows in MRR.</p>
      </div>

      <div className="ll-panel ll-co-panel">
        <div className="ll-panel-h ll-co-h">
          <div><h3>Net revenue retention by signup month</h3><p>2026 cohorts · % of starting MRR still billed</p></div>
          <div className="ll-chips" aria-hidden="true">
            <span className="ll-seg"><span className="on">Revenue</span><span>Logos</span></span>
            <span className="ll-chip">{I.filter}Plan: All</span>
            <span className="ll-chip ll-hide-s">Channel: All</span>
            <span className="ll-chip ll-hide-s">Country: All</span>
          </div>
        </div>

        <div className="ll-co-body">
          <div className="ll-co-chart">
            <div className="ll-co-plot">
              <div className="ll-co-yax" aria-hidden="true">
                {[90, 95, 100, 105].map((v) => <span key={v} style={{ top: `calc(var(--coh) * ${(cy(v) / CO.h).toFixed(4)})` }}>{v}%</span>)}
              </div>
              <ScrollDraw className="ll-cohorts" selector=".ll-co" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.12} easing="ease-out" once>
                <svg viewBox={`0 0 ${CO.w} ${CO.h}`} preserveAspectRatio="none" role="img" aria-label="Revenue retention for the January to June 2026 cohorts: each dips to the mid-90s in the first months, then expansion lifts it back past 100%. April's cohort falls to 87% and stays near 90%.">
                  <path className="ll-grid" d={[90, 95, 105].map((v) => `M ${CO.x0} ${cy(v).toFixed(1)} H ${CO.x1}`).join(' ')} />
                  <path className="ll-grid ll-grid-100" d={`M ${CO.x0} ${cy(100).toFixed(1)} H ${CO.x1}`} />
                  {DRAWN.map((c, k) => <path key={c.name} className={`ll-co c${k}`} d={smooth(c.vals.map((v, m) => [cx(m), cy(v)] as P))} />)}
                </svg>
              </ScrollDraw>
            </div>
            <div className="ll-co-xax" aria-hidden="true"><span>Month 0</span><span>3</span><span>6</span><span>9</span><span>11</span></div>
            <div className="ll-co-legend">{DRAWN.map((c, k) => <span key={c.name}><i className={`c${k}`} />{c.name}</span>)}</div>
            <p className="ll-callout"><span className="ll-callout-i">!</span><span><b>April is the outlier.</b> {Math.round(apr)}% at month 3, {gap.toFixed(0)} points under the other cohorts — the month the onboarding checklist was switched off.</span></p>
          </div>

          <div className="ll-heat" role="table" aria-label="Retention by cohort and month since signup">
            <div className="ll-heat-row ll-heat-head" role="row">
              <span role="columnheader"><span className="ll-full">Cohort</span></span>
              <span role="columnheader" className="ll-heat-n">Cust.</span>
              {Array.from({ length: 12 }, (_, m) => <span key={m} role="columnheader">M{m}</span>)}
            </div>
            {COHORTS.map((c, r) => (
              <div key={c.name} className={`ll-heat-row${r === 3 ? ' is-flag' : ''}`} role="row">
                <span role="rowheader">{c.name}</span>
                <span className="ll-heat-n" role="cell">{c.size}</span>
                {Array.from({ length: 12 }, (_, m) => {
                  const v = c.vals[m];
                  return v === undefined
                    ? <span key={m} className="ll-heat-x" role="cell" />
                    : <span key={m} className="ll-heat-c" role="cell" style={cell(v)}>{Math.round(v)}<i>%</i></span>;
                })}
              </div>
            ))}
            <div className="ll-heat-key" aria-hidden="true"><span>86%</span><i className="lo" /><span>100%</span><i className="hi" /><span>106%</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Forecast: actuals, then six months ahead with an 80% interval ───── */

const FC = { w: 640, h: 280, x0: 6, x1: 634, y0: 10, y1: 270, lo: 100_000, hi: 260_000 };
const fxs = (i: number) => FC.x0 + (i * (FC.x1 - FC.x0)) / 17;
const fys = (v: number) => FC.y1 - ((v - FC.lo) / (FC.hi - FC.lo)) * (FC.y1 - FC.y0);
const FC_ACTUAL = smooth(MRR.map((v, i) => [fxs(i), fys(v)] as P));
const FC_AHEAD = smooth(FORECAST.map((v, i) => [fxs(i + 11), fys(v)] as P));
const BAND = (() => {
  const up = FORECAST.map((v, i) => [fxs(i + 11), fys(v * (1 + SPREAD(i)))] as P);
  const dn = FORECAST.map((v, i) => [fxs(i + 11), fys(v * (1 - SPREAD(i)))] as P);
  return `${smooth(up)} L ${dn.slice().reverse().map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z`;
})();
const pctX = (i: number) => `${((fxs(i) / FC.w) * 100).toFixed(3)}%`;
const pctY = (v: number) => `calc(var(--fch) * ${(fys(v) / FC.h).toFixed(4)})`;
const FC_TICKS: [number, string][] = [[0, 'Jan ’26'], [3, 'Apr'], [6, 'Jul'], [9, 'Oct'], [12, 'Jan ’27'], [15, 'Apr'], [17, 'Jun']];

export function Forecast() {
  const panel = useRef<HTMLDivElement>(null);
  const onFc = useCallback((p: number) => panel.current?.style.setProperty('--p', p.toFixed(3)), []);
  const keep = ASSUME.exp - ASSUME.con - ASSUME.churn;
  const lo = FC_END * (1 - SPREAD(6)), hi = FC_END * (1 + SPREAD(6));
  return (
    <section className="ll-sec" id="forecast">
      <div className="ll-head">
        <p className="ll-kick">Forecasts</p>
        <h2 className="ll-h2">A forecast you can put in front of your board.</h2>
        <p className="ll-body">Six months ahead from your own expansion, contraction and churn, with an honest interval that widens the further out you look. Change an assumption and every chart that depends on it follows.</p>
      </div>

      <div className="ll-panel ll-fc-panel" ref={panel}>
        <div className="ll-fc-main">
          <div className="ll-panel-h">
            <div><h3>MRR forecast</h3><p>Base case · 80% interval</p></div>
            <span className="ll-seg"><span className="on">Base</span><span>Downside</span><span className="ll-hide-s">Stretch</span></span>
          </div>
          <div className="ll-fc-read">
            <div><span>Jun 2027</span><b>{k1(FC_END)}</b><em>{k1(lo)} – {k1(hi)}</em></div>
            <div><span>Crosses $200k</span><b>{FC_MONTHS[FC_CROSS - 1]} 2027</b><em>in {FC_CROSS} months</em></div>
            <div className="ll-hide-s"><span>ARR run-rate, Jun</span><b>${((FC_END * 12) / 1e6).toFixed(2)}M</b><em>from ${((NOW.mrr * 12) / 1e6).toFixed(2)}M today</em></div>
          </div>
          <div className="ll-fc-plot">
            <div className="ll-fc-yax" aria-hidden="true">
              {[120_000, 160_000, 200_000, 240_000].map((v) => <span key={v} style={{ top: pctY(v) }}>${v / 1000}k</span>)}
            </div>
            <div className="ll-fc-pa">
              <ScrollDraw className="ll-fc-draw" selector=".ll-fl" trigger={{ start: 'top 85%', end: 'top 30%' }} stagger={0.5} easing="ease-out" once onProgress={onFc}>
                <svg viewBox={`0 0 ${FC.w} ${FC.h}`} preserveAspectRatio="none" role="img" aria-label={`Actual MRR through December 2026, then a forecast to ${k1(FC_END)} by June 2027, with an 80% interval of ${k1(lo)} to ${k1(hi)}`}>
                  <path className="ll-grid" d={[120_000, 160_000, 240_000].map((v) => `M ${FC.x0} ${fys(v).toFixed(1)} H ${FC.x1}`).join(' ')} />
                  <path className="ll-target" d={`M ${FC.x0} ${fys(200_000).toFixed(1)} H ${FC.x1}`} />
                  <path className="ll-band" d={BAND} />
                  <path className="ll-today" d={`M ${fxs(11).toFixed(1)} ${FC.y0} V ${FC.y1}`} />
                  <path className="ll-fl actual" d={FC_ACTUAL} />
                  <path className="ll-fl ahead" d={FC_AHEAD} />
                </svg>
              </ScrollDraw>
              <span className="ll-target-l" style={{ top: pctY(200_000) }}>$200k target</span>
              <span className="ll-today-l" style={{ left: pctX(11) }}>Today</span>
              <span className="ll-fc-pt is-cross" style={{ left: pctX(11 + FC_CROSS), top: pctY(FORECAST[FC_CROSS]) }} aria-hidden="true" />
              <span className="ll-fc-pt is-end" style={{ left: pctX(17), top: pctY(FC_END) }} aria-hidden="true" />
              <div className="ll-fc-xax" aria-hidden="true">
                {FC_TICKS.map(([i, l]) => <span key={i} style={{ left: pctX(i) }}>{l}</span>)}
              </div>
            </div>
          </div>
          <div className="ll-fc-legend"><span><i className="act" />Actual</span><span><i className="fc" />Forecast</span><span><i className="band" />80% interval</span></div>
        </div>

        <form className="ll-fc-side" aria-label="Forecast assumptions" onSubmit={(e) => e.preventDefault()}>
          <p className="ll-fc-side-h">Assumptions<span>from Oct–Dec actuals</span></p>
          <label className="ll-field"><span>New MRR a month</span><span className="ll-input"><input readOnly value={usd(ASSUME.newMrr)} aria-label="New MRR a month" /><em>+{pct(ASSUME.newGrowth, 0)} / mo</em></span></label>
          <label className="ll-field"><span>Expansion</span><span className="ll-input"><input readOnly value={pct(ASSUME.exp, 2)} aria-label="Expansion rate" /><em>of MRR</em></span></label>
          <label className="ll-field"><span>Contraction</span><span className="ll-input"><input readOnly value={pct(ASSUME.con, 2)} aria-label="Contraction rate" /><em>of MRR</em></span></label>
          <label className="ll-field"><span>Churn</span><span className="ll-input"><input readOnly value={pct(ASSUME.churn, 2)} aria-label="Churn rate" /><em>of MRR</em></span></label>
          <div className="ll-fc-sum">
            <p><span>Net retention</span><b className="pos">+{pct(keep, 2)} / mo</b></p>
            <p><span>Jun 2027 MRR</span><b>{usd(FC_END)}</b></p>
            <p><span>Added in 6 months</span><b className="pos">{usdSigned(FC_END - NOW.mrr)}</b></p>
          </div>
          <span className="ll-btn ll-btn-sm ll-btn-ghost">{I.reports}Add to board pack</span>
        </form>
      </div>
    </section>
  );
}

/* ── Glossary: the metrics, with the formula behind each ──────────────── */

const sparkPath = (vals: number[]) => {
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return smooth(vals.map((v, i) => [2 + (i * 196) / 11, 46 - ((v - lo) / (hi - lo)) * 40] as P));
};

const SPARKS = [
  { k: 'ARPA', v: usd(NOW.arpa), d: `+${pct(NOW.arpaYoY)} YoY`, vals: ARPA, f: 'MRR ÷ paying customers', w: `${usd(NOW.mrr)} ÷ ${NOW.customers}` },
  { k: 'Customer LTV', v: `$${(Math.round(NOW.ltv / 10) * 10).toLocaleString('en-US')}`, d: `+${pct(LTV[11] / LTV[0] - 1)} since Jan`, vals: LTV, f: 'ARPA × gross margin ÷ logo churn', w: `${usd(NOW.arpa)} × ${pct(GROSS_MARGIN, 0)} ÷ ${pct(LOGO_CHURN_3M[11], 2)}` },
  { k: 'Quick ratio', v: NOW.quick.toFixed(2), d: `+${(QUICK[11] - QUICK[10]).toFixed(2)} vs Nov`, vals: QUICK, f: '(New + Expansion) ÷ (Contraction + Churn)', w: `(${usd(NOW.move.n)} + ${usd(NOW.move.e)}) ÷ (${usd(NOW.move.c)} + ${usd(NOW.move.x)})` },
];

const miniBars = (vals: number[], cls = '') => {
  const hi = Math.max(...vals);
  return <span className={`ll-mini-bars ${cls}`} aria-hidden="true">{vals.map((v, i) => <i key={i} style={{ height: `${(v / hi) * 100}%` }} className={i === 11 ? 'on' : ''} />)}</span>;
};

export function Glossary() {
  const gross = GROSS_CHURN.map((v) => v * 100);
  const gLo = 1.4, gHi = 2.2;
  const gPts = gross.map((v, i) => `${(4 + i * (192 / 11)).toFixed(1)},${(44 - ((v - gLo) / (gHi - gLo)) * 38).toFixed(1)}`).join(' ');
  const arc = Math.min(1, (NRR - 0.8) / 0.4);
  return (
    <section className="ll-sec ll-gloss" id="metrics">
      <div className="ll-head ll-center">
        <p className="ll-kick">Metric glossary</p>
        <h2 className="ll-h2">Forty metrics, one definition each.</h2>
        <p className="ll-body">Every number in Ledgerline opens to its formula and the invoices behind it. These are the ones a board asks about — shown here for Lumenstack in December.</p>
      </div>

      <div className="ll-sparks">
        {SPARKS.map((s) => (
          <article key={s.k} className="ll-spark">
            <div className="ll-spark-top"><span>{s.k}</span><em>{s.d}</em></div>
            <b>{s.v}</b>
            <ScrollDraw className="ll-spark-draw" trigger={{ start: 'top 90%', end: 'top 55%' }} easing="ease-out" once>
              <svg viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true"><path className="ll-sl" d={sparkPath(s.vals)} /></svg>
            </ScrollDraw>
            <span className="ll-spark-x" aria-hidden="true"><span>Jan</span><span>Dec</span></span>
            <p className="ll-formula"><code>{s.f}</code><span>= {s.w}</span></p>
          </article>
        ))}
      </div>

      <div className="ll-defs">
        <article className="ll-def">
          <div className="ll-def-top"><span>MRR</span>{miniBars(MRR)}</div>
          <b>{usd(NOW.mrr)}</b>
          <p className="ll-formula"><code>Σ recurring price ÷ months per period</code><span>annual ÷ 12 · discounts in · tax and one-offs out</span></p>
        </article>
        <article className="ll-def">
          <div className="ll-def-top"><span>Net new MRR</span>{miniBars(NET, 'is-mint')}</div>
          <b>{usd(NOW.net)}</b>
          <p className="ll-formula"><code>New + Expansion − Contraction − Churn</code><span>= {usd(NOW.move.n)} + {usd(NOW.move.e)} − {usd(NOW.move.c)} − {usd(NOW.move.x)}</span></p>
        </article>
        <article className="ll-def">
          <div className="ll-def-top"><span>Gross MRR churn</span>
            <svg className="ll-mini-line" viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden="true"><polyline points={gPts} /></svg>
          </div>
          <b>{pct(NOW.gross, 2)}</b>
          <p className="ll-formula"><code>(Contraction + Churn) ÷ opening MRR</code><span>= ({usd(NOW.move.c)} + {usd(NOW.move.x)}) ÷ {usd(NOW.prevMrr)}</span></p>
        </article>
        <article className="ll-def">
          <div className="ll-def-top"><span>Net revenue retention</span>
            <svg className="ll-gauge" viewBox="0 0 64 36" aria-hidden="true">
              <path className="bg" d="M6 32 A26 26 0 0 1 58 32" pathLength={100} />
              <path className="fg" d="M6 32 A26 26 0 0 1 58 32" pathLength={100} strokeDasharray={`${(arc * 100).toFixed(1)} 100`} />
            </svg>
          </div>
          <b>{pct(NRR)}</b>
          <p className="ll-formula"><code>(Opening + Exp. − Contr. − Churn) ÷ Opening</code><span>= ({k1(START_MRR)} + {k1(YEAR.e)} − {k1(YEAR.c)} − {k1(YEAR.x)}) ÷ {k1(START_MRR)}</span></p>
        </article>
      </div>
    </section>
  );
}

