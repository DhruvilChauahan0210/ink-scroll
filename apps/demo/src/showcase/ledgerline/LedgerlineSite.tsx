'use client';

import './ledgerline.css';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { BuiltWith } from '../BuiltWith';
import { BANDS, NOW, PLANS, usd } from './data';
import { Dashboard } from './Dashboard';
import { Av, I, Mark } from './parts';
import { Cohorts, Forecast, Glossary, Movements } from './Sections';

/*
 * Ledgerline — a demo site for a fictional subscription-analytics product,
 * built with svg-scroll-draw. Every chart that draws on this page is drawn
 * by the library as it scrolls into view:
 *   · the dashboard's MRR lines draw with a stagger (selector + stagger), and
 *     its fill, movement bars, end dot and tooltip follow through onProgress
 *   · six cohort retention curves fan out one after another
 *   · the forecast draws past today, its interval widening with progress
 *   · three sparklines draw together in the metric glossary
 * The numbers all come from one workspace's movements — see data.ts.
 */

/* ── Integrations ─────────────────────────────────────────────────────── */

type Tile = { n: string; t: string; icon: ReactNode; st: 'ok' | 'run'; s: string; m: string; pct?: number };
const SOURCES: Tile[] = [
  { n: 'Billrail', t: 'Card subscriptions', icon: I.card, st: 'ok', s: 'Synced 4 min ago', m: '18,402 invoices' },
  { n: 'Meridian', t: 'Invoiced contracts', icon: I.doc, st: 'ok', s: 'Synced 1 h ago', m: '61 contracts' },
  { n: 'App store receipts', t: 'iOS and Android', icon: I.phone, st: 'run', s: 'Backfilling', m: '9,880 receipts', pct: 62 },
  { n: 'CSV import', t: 'Legacy plans, 2022–23', icon: I.file, st: 'ok', s: 'Imported 3 Jan', m: '1,204 rows' },
];
const DESTS: Tile[] = [
  { n: 'Warehouse', t: 'Nightly at 02:00 UTC', icon: I.db, st: 'ok', s: 'Last run 6 h ago', m: '14 tables' },
  { n: 'Relay', t: '#revenue · Mondays 09:00', icon: I.chat, st: 'ok', s: 'Digest sent Mon', m: '38 readers' },
  { n: 'CRM', t: 'MRR and plan on every account', icon: I.crm, st: 'ok', s: 'Synced 9 min ago', m: `${NOW.customers} accounts` },
  { n: 'Webhooks', t: 'Movement events', icon: I.hook, st: 'ok', s: '99.98% delivered', m: '3 endpoints' },
];

function TileRow({ t, side }: { t: Tile; side: 'in' | 'out' }) {
  return (
    <li className={`ll-tile is-${side}`}>
      <span className="ll-tile-i">{t.icon}</span>
      <span className="ll-tile-t"><b>{t.n}</b><span>{t.t}</span></span>
      <span className="ll-tile-s">
        <span className={`ll-state ${t.st}`}><i />{t.s}</span>
        {t.pct ? <span className="ll-tile-bar"><i style={{ width: `${t.pct}%` }} /></span> : <small>{t.m}</small>}
      </span>
    </li>
  );
}

function Integrations() {
  return (
    <section className="ll-sec" id="integrations">
      <div className="ll-head">
        <p className="ll-kick">Integrations and reconciliation</p>
        <h2 className="ll-h2">Connect billing once, every number reconciles</h2>
        <p className="ll-body">Ledgerline reads your billing systems with read-only keys, rebuilds every subscription as a ledger of events, and checks the result against billing every hour. When the two disagree by a cent, you hear about it first.</p>
      </div>

      <div className="ll-flow">
        <div className="ll-flow-col">
          <p className="ll-flow-h">Sources<span>4 connected</span></p>
          <ul>{SOURCES.map((t) => <TileRow key={t.n} t={t} side="in" />)}</ul>
        </div>

        <div className="ll-hub">
          <div className="ll-hub-top"><Mark size={28} /><span><b>Ledgerline ledger</b><small>Lumenstack · 1,284,551 events</small></span></div>
          <div className="ll-hub-rec">
            <p className="ll-hub-l">Reconciliation · December 2026</p>
            <p><span>Recurring in billing, normalised</span><b>{usd(NOW.mrr)}.00</b></p>
            <p><span>MRR in Ledgerline</span><b>{usd(NOW.mrr)}.00</b></p>
            <p className="ll-hub-diff"><span>Difference</span><b><span className="ll-ok">{I.check}</span>$0.00</b></p>
          </div>
          <div className="ll-hub-foot"><span>{I.lock}Read-only keys</span><span>{I.sync}Hourly</span></div>
        </div>

        <div className="ll-flow-col">
          <p className="ll-flow-h">Destinations<span>4 active</span></p>
          <ul>{DESTS.map((t) => <TileRow key={t.n} t={t} side="out" />)}</ul>
        </div>
      </div>

      <div className="ll-trace" aria-label="One invoice traced to its MRR change">
        <div className="ll-trace-h">
          <p><b>Trace any number to an invoice</b><span>December’s expansion, one row of it</span></p>
          <span className="ll-state ok"><i />Matched</span>
        </div>
        <ol className="ll-trace-steps">
          <li>
            <span className="ll-step-k">1 · Invoice</span>
            <p className="ll-step-t"><code>INV-2026-11873</code><span>Billrail · Quarryline · paid 14 Dec</span></p>
            <dl className="ll-lines">
              <div><dt>Business, annual · 12 seats</dt><dd>$10,680.00</dd></div>
              <div><dt>Credit: unused Team time</dt><dd className="neg">−$214.00</dd></div>
              <div><dt>Tax · reverse charge</dt><dd>$0.00</dd></div>
              <div className="tot"><dt>Paid</dt><dd>$10,466.00</dd></div>
            </dl>
          </li>
          <li>
            <span className="ll-step-k">2 · Normalise</span>
            <p className="ll-step-big">$10,680.00 <i>÷</i> 12 <i>=</i> <b>$890.00</b><small>MRR</small></p>
            <p className="ll-step-note">Recurring lines only. The credit and the tax are one-offs, so they stay out of MRR.</p>
          </li>
          <li>
            <span className="ll-step-k">3 · Compare</span>
            <div className="ll-cmp">
              <p><span>Before</span><b>Team, monthly</b><em>$420.00</em></p>
              <span className="ll-cmp-arrow">{I.arrow}</span>
              <p><span>After</span><b>Business, annual</b><em>$890.00</em></p>
            </div>
          </li>
          <li className="is-out">
            <span className="ll-step-k">4 · MRR movement</span>
            <p className="ll-step-big pos"><b>+$470.00</b><small>Expansion</small></p>
            <p className="ll-step-note">Booked 14 Dec 2026 — one of the rows in December’s {usd(NOW.move.e)} of expansion.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}

/* ── Customer story ───────────────────────────────────────────────────── */

function Story() {
  return (
    <section className="ll-sec ll-story" id="customers">
      <figure className="ll-quote">
        <span className="ll-qlogo"><span className="ll-ws-logo" aria-hidden="true">L</span>Lumenstack</span>
        <blockquote>“We closed our Series B with Ledgerline’s forecast on slide two. Nobody asked where the numbers came from — they could click from any month straight down to the invoice.”</blockquote>
        <figcaption><Av i="IC" a="#f59e0b" b="#db2777" size={44} /><span><b>Ines Calder</b>CFO, Lumenstack</span></figcaption>
      </figure>
      <div className="ll-story-side">
        <dl className="ll-story-stats">
          <div><dt>Monthly board pack</dt><dd><b>3 days <span>→</span> 40 min</b><small>from close to sent</small></dd></div>
          <div><dt>Unexplained difference to billing</dt><dd><b>$0.00</b><small>14 months running</small></dd></div>
          <div><dt>Q3 forecast against actual</dt><dd><b>1.8%</b><small>off, at month end</small></dd></div>
        </dl>
        <div className="ll-co-card">
          <p className="ll-co-card-h">About Lumenstack</p>
          <dl>
            <div><dt>Product</dt><dd>Docs platform for developer teams</dd></div>
            <div><dt>Customers</dt><dd>{NOW.customers}</dd></div>
            <div><dt>MRR</dt><dd>{usd(NOW.mrr)}</dd></div>
            <div><dt>Plans</dt><dd>{PLANS.map((p) => p.k).join(' · ')}</dd></div>
            <div><dt>On Ledgerline since</dt><dd>Oct 2025</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing: one price per band of tracked MRR ───────────────────────── */

const MIN = 2_000, MAX = 2_000_000;
const toT = (v: number) => (Math.log(v / MIN) / Math.log(MAX / MIN)) * 1000;
const fromT = (t: number) => {
  const v = MIN * (MAX / MIN) ** (t / 1000);
  const step = v < 20_000 ? 100 : v < 200_000 ? 500 : 5_000;
  return Math.round(v / step) * step;
};
const bandLabel = (lo: number, hi: number) => (hi === Infinity ? `Over $${lo / 1e6}M` : lo === 0 ? `Up to $${hi / 1000}k` : `$${lo >= 1e6 ? `${lo / 1e6}M` : `${lo / 1000}k`} – $${hi >= 1e6 ? `${hi / 1e6}M` : `${hi / 1000}k`}`);

const FAQ: [string, string][] = [
  ['How do you calculate MRR?', 'Every active subscription, normalised to a month: annual plans divided by twelve, quarterly by three. Discounts count; tax, refunds of one-off charges and setup fees don’t. Every figure links to the invoices behind it, so you can check our arithmetic.'],
  ['Which billing systems can I connect?', 'Card-subscription platforms, invoicing and contract tools, app-store receipts and plain CSV. Most teams connect with a read-only API key in about two minutes; history backfills in the background.'],
  ['What happens when we move into the next band?', 'Nothing until the next billing month. We price on your average tracked MRR over the previous month, and we email you a week before a band change takes effect.'],
  ['Do you store card numbers or payment details?', 'No. Ledgerline only ever sees subscription, invoice and customer records. Keys are read-only, encrypted at rest, and can be revoked from your billing system at any time.'],
  ['Can we send the numbers to our warehouse?', 'Yes, on Growth and above. Ledgerline writes MRR, movements, cohorts and customers to your warehouse every night as plain tables, documented column by column.'],
  ['Is there a free trial?', 'Every paid plan starts with 14 days free, with your real data. Under $10k of MRR, Ledgerline is free for as long as you stay there.'],
];

function Pricing() {
  const [mrr, setMrr] = useState(NOW.mrr);
  const band = BANDS.find((b) => mrr >= b.lo && mrr < b.hi) ?? BANDS[BANDS.length - 1];
  const custom = band.price < 0;
  return (
    <section className="ll-sec ll-pricing" id="pricing">
      <div className="ll-head ll-center">
        <p className="ll-kick">Pricing</p>
        <h2 className="ll-h2">Priced by the MRR you track, not your seats</h2>
        <p className="ll-body">Bring the whole finance team, the board and every founder. One flat price for each band of MRR, with every metric on every plan.</p>
      </div>

      <div className="ll-price-card">
        <div className="ll-calc">
          <label className="ll-calc-l" htmlFor="ll-mrr">Your MRR</label>
          <p className="ll-calc-v">{usd(mrr)}</p>
          <input id="ll-mrr" className="ll-range-in" type="range" min={0} max={1000} step="any" value={toT(mrr)} onChange={(e) => setMrr(fromT(Number(e.target.value)))} aria-valuetext={usd(mrr)} />
          <div className="ll-range-ticks" aria-hidden="true"><span>$2k</span><span>$20k</span><span>$200k</span><span>$2M</span></div>
          <div className="ll-readout" aria-live="polite">
            <p className="ll-readout-plan">{band.plan}</p>
            <p className="ll-readout-p">{custom ? <b>Custom</b> : band.price === 0 ? <b>Free</b> : <><b>${band.price}</b><span>/ month</span></>}</p>
            <p className="ll-readout-s">
              {custom ? 'Volume pricing and a named analyst.' : band.price === 0 ? 'Free while you stay under $10k MRR.' : <>{((band.price / mrr) * 100).toFixed(2)}% of your MRR · ${(band.price * 10).toLocaleString('en-US')} a year if paid annually</>}
            </p>
            <a className="ll-btn" href="#pricing">{custom ? 'Talk to us' : 'Start free — 14 days'}</a>
          </div>
        </div>

        <div className="ll-bands">
          <table className="ll-band-table">
            <thead><tr><th>MRR tracked</th><th>Plan</th><th className="r">Price / month</th><th className="ll-hide-s">Refresh</th></tr></thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.lo} className={b === band ? 'on' : ''}>
                  <td>{bandLabel(b.lo, b.hi)}</td>
                  <td>{b.plan}</td>
                  <td className="r ll-num">{b.price < 0 ? 'Custom' : b.price === 0 ? 'Free' : `$${b.price}`}</td>
                  <td className="ll-hide-s ll-dim">{b.refresh}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="ll-incl">
            {['Every metric, cohort and forecast', 'Unlimited seats and viewers', 'Reconciliation against billing', 'Warehouse sync from Growth up', 'SSO and audit log on Scale'].map((x) => <li key={x}>{I.check}{x}</li>)}
          </ul>
        </div>
      </div>

      <div className="ll-faq">
        <div className="ll-faq-h">
          <h3>Questions finance teams ask</h3>
          <p>Something else? <a href="#pricing">Talk to an analyst</a> — a person, usually within the hour.</p>
        </div>
        <div className="ll-faq-list">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<span aria-hidden="true">{I.plus}</span></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

const LOGOS = ['Lumenstack', 'Kiln & Co', 'Parcelry', 'aster', 'QUILL', 'Northwind'];

export function LedgerlineSite() {
  return (
    <div className="ll">
      <header className="ll-nav">
        <a className="ll-brand" href="#top"><Mark size={22} />Ledgerline</a>
        <nav className="ll-links" aria-label="Main">
          <a href="#product">Product</a><a href="#metrics">Metrics</a><a href="#integrations">Integrations</a><a href="#customers">Customers</a><a href="#pricing">Pricing</a>
        </nav>
        <span className="ll-nav-r">
          <a href="#pricing" className="ll-signin">Sign in</a>
          <a href="#pricing" className="ll-btn ll-btn-sm">Start free</a>
        </span>
      </header>

      <section className="ll-hero" id="top">
        <div className="ll-glow" aria-hidden="true" />
        <h1 className="ll-h1">Every dollar of MRR, accounted for</h1>
        <p className="ll-lede">Revenue analytics for subscription businesses. Connect billing in two minutes and Ledgerline turns every invoice, upgrade and cancellation into MRR, churn, cohorts and a forecast — reconciled to the cent, refreshed every hour.</p>
        <div className="ll-ctas">
          <a className="ll-btn" href="#pricing">Start free — 14 days</a>
          <a className="ll-btn ll-btn-ghost" href="#customers">Book a demo</a>
        </div>
        <ul className="ll-proof">
          <li>{I.check}<span><b>1,900</b> subscription teams</span></li>
          <li>{I.check}<span><b>$2.4B</b> of ARR reconciled</span></li>
          <li className="ll-hide-s">{I.lock}<span>SOC 2 Type II · read-only keys</span></li>
        </ul>
        <div className="ll-shot" id="product">
          <Dashboard />
        </div>
      </section>

      <section className="ll-logos" aria-label="Customers">
        <p>Finance and growth teams at 1,900 subscription companies close the month in Ledgerline</p>
        <div className="ll-logo-row">
          {LOGOS.map((n, i) => <span key={n} className={`ll-logo l${i}`}>{n}</span>)}
        </div>
        <dl className="ll-stats">
          <div><dt>ARR tracked</dt><dd>$2.4B</dd></div>
          <div><dt>Invoices reconciled a month</dt><dd>31M</dd></div>
          <div><dt>Median time to first dashboard</dt><dd>6 min</dd></div>
          <div><dt>Unexplained differences, last quarter</dt><dd>$0.00</dd></div>
        </dl>
      </section>

      <Movements />
      <Cohorts />
      <Forecast />
      <Glossary />
      <Integrations />
      <Story />
      <Pricing />

      <section className="ll-final">
        <h2 className="ll-h2">Connect billing, see last year’s MRR before your coffee cools</h2>
        <p className="ll-body">Read-only, two minutes to connect, and free under $10k of MRR. Most teams have a reconciled year of history in about six minutes.</p>
        <div className="ll-ctas">
          <a className="ll-btn" href="#pricing">Start free — 14 days</a>
          <a className="ll-btn ll-btn-ghost" href="#customers">Book a demo</a>
        </div>
      </section>

      <footer className="ll-foot">
        <div className="ll-foot-top">
          <div className="ll-foot-brand">
            <a className="ll-brand" href="#top"><Mark size={22} />Ledgerline</a>
            <p>Revenue analytics for subscription businesses.</p>
            <span className="ll-state ok"><i />All systems normal</span>
          </div>
          {[
            ['Product', ['Dashboard', 'MRR movements', 'Cohorts', 'Forecasts', 'Integrations']],
            ['Metrics', ['MRR', 'Net revenue retention', 'Customer LTV', 'Quick ratio', 'All 40 metrics']],
            ['Company', ['Customers', 'Security', 'Careers', 'Changelog', 'Contact']],
            ['Resources', ['Docs', 'API reference', 'SaaS benchmarks', 'Board pack template', 'Status']],
          ].map(([h, l]) => (
            <div key={h as string} className="ll-foot-col"><b>{h as string}</b>{(l as string[]).map((x) => <a key={x} href="#top">{x}</a>)}</div>
          ))}
        </div>
        <div className="ll-foot-bot">
          <span>© 2026 Ledgerline, Inc.</span>
          <span className="ll-foot-links"><a href="#top">Privacy</a><a href="#top">Terms</a><a href="#top">DPA</a></span>
          <span className="ll-foot-note">A fictional company — this is a demo site.</span>
        </div>
      </footer>

      <BuiltWith example="line-chart" apis="selector · stagger · onProgress" />
    </div>
  );
}
