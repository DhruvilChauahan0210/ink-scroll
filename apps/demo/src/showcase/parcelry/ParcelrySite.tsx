'use client';

import './parcelry.css';
import type { ReactNode } from 'react';
import { Site } from '../kit/Site';
import { ParcelryMap } from './ParcelryMap';
import { Coverage } from './Coverage';

/* Parcelry — a same-day bike courier in Lisbon. The centrepiece is the
   live-tracking map in the hero: the rider's route traces block by block
   from the shop to the door as the map scrolls in (ScrollDraw, selector
   .pc-route, ease-in-out, once). Everything else is the product around it. */

const Logo = ({ size = 28 }: { size?: number }) => (
  <svg className="pc-logo" viewBox="0 0 28 28" width={size} height={size} aria-hidden="true">
    <rect width="28" height="28" rx="8.5" fill="var(--accent)" />
    <path d="M9.5 22V10.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="14.6" cy="13.4" r="5.1" fill="none" stroke="#fff" strokeWidth="2.8" />
    <path d="M3.5 18.5h3.5M2.5 14.5h3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const Check = () => <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Star = () => <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.2 4 13.5l1-4.4-3.4-3 4.5-.5z" fill="currentColor" /></svg>;

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Booking() {
  return (
    <div className="pc-book" aria-label="Book a pickup">
      <div className="pc-book-addr">
        <span className="pc-ab"><i className="a" /><i className="line" /><i className="b" /></span>
        <span className="pc-field is-filled"><small>Pickup</small>Rua Garrett 42, Chiado</span>
        <span className="pc-field is-focus"><small>Drop-off</small><span className="pc-input"><span className="pc-caret" /><em>Where is it going?</em></span></span>
      </div>
      <div className="pc-book-opts">
        <span className="pc-seg"><span>Envelope</span><span className="on">Box</span><span>Large</span></span>
        <span className="pc-when">Collect <b>now</b> ▾</span>
      </div>
      <a className="sk-btn pc-book-go" href="#pricing">See price <span>· from €6</span></a>
    </div>
  );
}

const BRANDS: { n: string; c: string }[] = [
  { n: 'Tinta Books', c: 'b-serif' },
  { n: 'CASA FERRO', c: 'b-caps' },
  { n: 'mercado 28', c: 'b-heavy' },
  { n: 'Oficina Lume', c: 'b-syne' },
  { n: 'Pão & Co.', c: 'b-serif-b' },
  { n: 'AZULEJO/STUDIO', c: 'b-mono' },
  { n: 'sardinha', c: 'b-round' },
  { n: 'Botica Graça', c: 'b-small' },
];

/* ── How it works ───────────────────────────────────────────────────────── */

const STEPS: { n: string; t: string; d: string; viz: ReactNode }[] = [
  {
    n: '01',
    t: 'Book in under a minute',
    d: 'Two addresses, a size and a slot. Collections every 30 minutes from 8:00 to 21:00, seven days a week.',
    viz: (
      <div className="pc-viz pc-viz-slots">
        <p className="pc-viz-h">Collect today <span>Sat 1 Nov</span></p>
        <div className="pc-slots">
          {['Now', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map((t, i) => (
            <span key={t} className={i === 0 ? 'on' : i === 3 ? 'full' : ''}>{t}</span>
          ))}
        </div>
        <p className="pc-viz-f"><Check /> Rider within 30 min · delivered by 15:10</p>
      </div>
    ),
  },
  {
    n: '02',
    t: 'Watch it cross town',
    d: 'You and your customer get a live link. No account, no app — the bike on the map and an ETA that updates every five seconds.',
    viz: (
      <div className="pc-viz pc-viz-push">
        <p className="pc-lock"><span>Saturday 1 November</span>13:41</p>
        <div className="pc-push">
          <span className="pc-push-ic"><Logo size={22} /></span>
          <span className="pc-push-b"><b>Parcelry <time>now</time></b>Rui picked up your parcel from Tinta Books. Follow it live: prc.ly/t/48213</span>
        </div>
      </div>
    ),
  },
  {
    n: '03',
    t: 'Proof at the door',
    d: 'A photo, a signature and a GPS timestamp the moment it is handed over — sent to you and kept for 13 months.',
    viz: (
      <div className="pc-viz pc-viz-pod">
        <div className="pc-photo" aria-hidden="true">
          <span className="pc-door"><i /><i /></span>
          <span className="pc-parcel" />
          <span className="pc-photo-ts">13:53 · 38.7161, −9.1305</span>
        </div>
        <div className="pc-pod-r">
          <small>Signed by</small>
          <svg viewBox="0 0 120 44" aria-hidden="true"><path d="M6 30 C 14 8, 22 8, 20 26 S 30 38, 38 20 S 46 6, 50 24 C 52 34, 60 34, 66 22 S 78 14, 84 26 C 88 32, 96 30, 112 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <b>Marta Silva</b>
          <span className="pc-pill is-done">Delivered</span>
        </div>
      </div>
    ),
  },
];

/* ── Pricing ────────────────────────────────────────────────────────────── */

const SIZES = [
  { n: 'Envelope', p: '€6', d: 'A4 · up to 1 kg', icon: 'M5 9h22v15H5z M5 9l11 8 11-8' },
  { n: 'Box', p: '€9', d: '40 × 30 × 30 cm · up to 10 kg', icon: 'M16 5l11 5v12l-11 5-11-5V10z M5 10l11 5 11-5 M16 15v12', on: true },
  { n: 'Large', p: '€14', d: '60 × 40 × 40 cm · up to 25 kg', icon: 'M4 12l12-6 12 6v11l-12 6-12-6z M4 12l12 6 12-6 M16 18v11 M10 9l12 6v4' },
];

function Calculator() {
  return (
    <div className="pc-calc" aria-label="Price calculator">
      <div className="pc-calc-h"><b>Get a price</b><span>Prices include IVA</span></div>
      <div className="pc-calc-addr">
        <span className="pc-ab"><i className="a" /><i className="line" /><i className="b" /></span>
        <span className="pc-field is-filled"><small>Pickup</small>Rua Garrett 42, 1200-204 Lisboa</span>
        <span className="pc-field is-filled"><small>Drop-off</small>Largo da Graça 18, 3º Esq</span>
      </div>
      <p className="pc-calc-dist"><span>3.8 km</span> · about 19 min by bike · Zone 1 → Zone 1</p>
      <div className="pc-calc-row">
        <small>Size</small>
        <div className="pc-calc-sizes">
          {SIZES.map((s) => (
            <span key={s.n} className={s.on ? 'on' : ''}>
              <svg viewBox="0 0 32 32" aria-hidden="true"><path d={s.icon} /></svg>
              <b>{s.n}</b><em>{s.p}</em>
            </span>
          ))}
        </div>
      </div>
      <div className="pc-calc-row">
        <small>Collection</small>
        <span className="pc-seg pc-seg-wide"><span className="on">Within 30 min</span><span>Pick a slot</span><span>Tomorrow</span></span>
      </div>
      <dl className="pc-bill">
        <div><dt>Box · Zone 1 to Zone 1</dt><dd>€9.00</dd></div>
        <div><dt>Collection within 30 min</dt><dd className="inc">Included</dd></div>
        <div><dt>Cover up to €500</dt><dd className="inc">Included</dd></div>
        <div className="tot"><dt>Total <small>incl. IVA €1.68</small></dt><dd>€9.00</dd></div>
      </dl>
      <a className="sk-btn pc-calc-go" href="#top">Book for €9.00 <span>· at the door by 14:25</span></a>
    </div>
  );
}

/* ── Business dashboard ─────────────────────────────────────────────────── */

type Status = 'live' | 'done' | 'picked' | 'sched' | 'fail';
const ROWS: { id: string; to: string; area: string; size: string; rider: string; st: Status; s: string }[] = [
  { id: 'PR-48213', to: 'Marta Silva', area: 'Graça', size: 'Box · 4.2 kg', rider: 'Rui C.', st: 'live', s: 'On the way · 12 min' },
  { id: 'PR-48211', to: 'Café Lume', area: 'Príncipe Real', size: 'Envelope', rider: 'Ana P.', st: 'done', s: 'Delivered 13:22' },
  { id: 'PR-48206', to: 'João Matos', area: 'Campo de Ourique', size: 'Box · 2.1 kg', rider: 'Tiago R.', st: 'picked', s: 'Picked up 13:38' },
  { id: 'PR-48199', to: 'Hotel Almada 9', area: 'Alfama', size: 'Large · 14 kg', rider: 'Bruno L.', st: 'done', s: 'Delivered 13:05' },
  { id: 'PR-48194', to: 'Sofia Antunes', area: 'Arroios', size: 'Box · 1.4 kg', rider: '—', st: 'sched', s: 'Collect 15:00' },
  { id: 'PR-48188', to: 'Rita Gomes', area: 'Estrela', size: 'Envelope', rider: 'Ana P.', st: 'fail', s: 'Retry 16:00' },
  { id: 'PR-48181', to: 'Atelier Sal', area: 'Santos', size: 'Box · 6.8 kg', rider: 'Rui C.', st: 'done', s: 'Delivered 12:48' },
];
const HOURS = [4, 9, 14, 22, 18, 26, 31, 17, 12, 0, 0, 0];

function Dashboard() {
  return (
    <div className="pc-dash" role="img" aria-label="The Parcelry for Business dashboard: today's 142 deliveries, on-time rate, spend and a live table of deliveries with their status">
      <div className="pc-dash-bar">
        <span className="pc-lights"><i /><i /><i /></span>
        <span className="pc-url">app.parcelry.pt/deliveries</span>
      </div>
      <div className="pc-dash-body">
        <aside className="pc-dash-side">
          <div className="pc-org"><span className="pc-org-ic">TB</span><span><b>Tinta Books</b><small>3 shops · Business</small></span></div>
          <ul>
            <li>Overview</li>
            <li className="on">Deliveries <em>142</em></li>
            <li>Rounds</li>
            <li>Returns <em>4</em></li>
            <li>Addresses</li>
            <li>Invoices</li>
          </ul>
          <p>Developers</p>
          <ul><li>API keys</li><li>Webhooks</li></ul>
          <div className="pc-dash-help"><b>Need a hand?</b>Your account manager is Inês — replies in 4 min on average.</div>
        </aside>
        <div className="pc-dash-main">
          <div className="pc-dash-head">
            <div><h4>Deliveries</h4><small>Today, Saturday 1 November</small></div>
            <span className="pc-dash-acts"><span className="pc-ghost">Export CSV</span><span className="pc-solid">+ New delivery</span></span>
          </div>
          <div className="pc-kpis">
            <div><small>Delivered today</small><b>124<em>/142</em></b><span className="pc-delta up">+18% vs last Sat</span></div>
            <div><small>On time</small><b>98.4%</b><span className="pc-meter"><i style={{ width: '98.4%' }} /></span></div>
            <div><small>Avg. pickup</small><b>23 min</b><span className="pc-delta up">−4 min this week</span></div>
            <div className="pc-kpi-chart"><small>By hour</small>
              <span className="pc-bars">{HOURS.map((h, i) => <i key={i} style={{ height: `${Math.max(h, 1) * 3}%` }} className={i === 6 ? 'on' : h === 0 ? 'z' : ''} />)}</span>
            </div>
          </div>
          <div className="pc-filters">
            <span className="on">All <em>142</em></span><span>Live <em>18</em></span><span>Scheduled <em>37</em></span><span className="warn">Exceptions <em>2</em></span>
            <span className="pc-search">⌕ Search by name, postcode or PR number</span>
          </div>
          <table className="pc-table">
            <thead><tr><th className="h-id">Delivery</th><th>Recipient</th><th className="h-area">Area</th><th className="h-size">Size</th><th className="h-rider">Rider</th><th>Status</th></tr></thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.id}>
                  <td className="mono h-id">{r.id}</td>
                  <td><b>{r.to}</b></td>
                  <td className="h-area">{r.area}</td>
                  <td className="h-size">{r.size}</td>
                  <td className="h-rider">{r.rider}</td>
                  <td><span className={`pc-st is-${r.st}`}>{r.s}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const WEEK = [
  { d: 'Mon', s: ['11:00', '16:00'] },
  { d: 'Tue', s: ['11:00', '16:00'] },
  { d: 'Wed', s: ['11:00', '16:00'], on: true },
  { d: 'Thu', s: ['11:00', '16:00'] },
  { d: 'Fri', s: ['11:00', '16:00', '18:30'] },
];

const BIZ: { t: string; d: string; viz: ReactNode }[] = [
  {
    t: 'Scheduled rounds',
    d: 'Set a standing collection — every weekday at 11:00 and 16:00 — and stop booking one parcel at a time.',
    viz: (
      <div className="pc-bv pc-bv-rounds">
        <p className="pc-bv-h"><b>Tinta Books · Chiado</b><span>Every weekday</span></p>
        <div className="pc-week">
          {WEEK.map((w) => (
            <span key={w.d} className={w.on ? 'on' : ''}>
              <small>{w.d}</small>
              {w.s.map((t, i) => <i key={t} className={w.on && i === 0 ? 'done' : ''}>{t}</i>)}
            </span>
          ))}
        </div>
        <p className="pc-bv-f"><span className="pc-live" />Next collection 16:00 · Ana P. assigned</p>
      </div>
    ),
  },
  {
    t: 'Returns that come back',
    d: 'Your customer books a return from the tracking page; we collect, photograph it and bring it to your counter.',
    viz: (
      <div className="pc-bv pc-bv-ret">
        <div className="pc-label">
          <span className="pc-label-top"><b>RETURN</b><em>PR-48102-R</em></span>
          <span className="pc-label-row"><small>From</small>Rita Gomes · Estrela</span>
          <span className="pc-label-row"><small>To</small>Tinta Books, Rua Garrett 42</span>
          <span className="pc-label-code" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ width: `${[1, 2, 1, 3, 1, 1, 2][i % 7]}px` }} />)}</span>
        </div>
        <ol className="pc-ret-steps">
          <li className="done">Requested<time>Mon 09:12</time></li>
          <li className="done">Collected<time>Mon 11:40</time></li>
          <li className="now">At your counter<time>Mon 12:15</time></li>
        </ol>
      </div>
    ),
  },
  {
    t: 'One invoice a month',
    d: 'Every delivery for every shop on one invoice with your NIF, exportable to your accountant as CSV or SAF-T.',
    viz: (
      <div className="pc-bv pc-bv-inv">
        <p className="pc-bv-h"><b>Invoice FT 2026/0412</b><span className="pc-paid">Paid</span></p>
        <dl>
          <div><dt>Chiado · 612 deliveries</dt><dd>€4,318.20</dd></div>
          <div><dt>Príncipe Real · 401 deliveries</dt><dd>€2,846.60</dd></div>
          <div><dt>Graça · 271 deliveries</dt><dd>€1,932.40</dd></div>
          <div className="tot"><dt>October 2026 · incl. IVA</dt><dd>€9,097.20</dd></div>
        </dl>
        <p className="pc-bv-f pc-bv-files"><span>PDF</span><span>CSV</span><span>SAF-T</span></p>
      </div>
    ),
  },
];

/* ── API ────────────────────────────────────────────────────────────────── */

function Code() {
  return (
    <div className="pc-code" aria-label="Creating a delivery with the Parcelry API">
      <div className="pc-code-tabs"><span className="on">Create a delivery</span><span>Webhook</span><span className="pc-code-lang">cURL ▾</span></div>
      <pre><code>
        <span className="c-c">{'# Book a bike for a parcel that is ready now'}</span>{'\n'}
        <span className="c-k">curl</span> https://api.parcelry.pt/v2/deliveries \{'\n'}
        {'  '}-H <span className="c-s">{'"Authorization: Bearer $PARCELRY_KEY"'}</span> \{'\n'}
        {'  '}-d pickup.address=<span className="c-s">{'"Rua Garrett 42, Lisboa"'}</span> \{'\n'}
        {'  '}-d dropoff.address=<span className="c-s">{'"Largo da Graça 18, 3º Esq"'}</span> \{'\n'}
        {'  '}-d dropoff.phone=<span className="c-s">{'"+351 912 345 678"'}</span> \{'\n'}
        {'  '}-d size=<span className="c-s">box</span> -d collect=<span className="c-s">asap</span>
      </code></pre>
      <div className="pc-code-res">
        <div className="pc-code-res-h"><span className="pc-200">201 Created</span><span>184 ms</span></div>
        <pre><code>
          {'{'}{'\n'}
          {'  '}<span className="c-p">&quot;id&quot;</span>: <span className="c-s">&quot;dlv_8Kq2m4Tz&quot;</span>,{'\n'}
          {'  '}<span className="c-p">&quot;status&quot;</span>: <span className="c-s">&quot;rider_assigned&quot;</span>,{'\n'}
          {'  '}<span className="c-p">&quot;price&quot;</span>: {'{'} <span className="c-p">&quot;amount&quot;</span>: <span className="c-n">900</span>, <span className="c-p">&quot;currency&quot;</span>: <span className="c-s">&quot;EUR&quot;</span> {'}'},{'\n'}
          {'  '}<span className="c-p">&quot;pickup_eta&quot;</span>: <span className="c-s">&quot;2026-11-01T13:41:00Z&quot;</span>,{'\n'}
          {'  '}<span className="c-p">&quot;tracking_url&quot;</span>: <span className="c-s">&quot;https://prc.ly/t/48213&quot;</span>{'\n'}
          {'}'}
        </code></pre>
      </div>
    </div>
  );
}

/* ── Coverage ───────────────────────────────────────────────────────────── */

const CITIES = [
  { c: 'Lisbon', s: 'Live', d: '3 zones · 8:00–21:00, every day', on: true },
  { c: 'Porto', s: 'Live', d: '2 zones · 8:00–20:00, Mon–Sat', on: true },
  { c: 'Braga', s: 'New', d: 'City centre · 9:00–19:00, Mon–Sat', on: true },
  { c: 'Coimbra', s: 'Spring 2027', d: 'Join the waitlist for launch pricing' },
];

/* ── Riders ─────────────────────────────────────────────────────────────── */

const RIDERS = [
  { i: 'RC', n: 'Rui Carvalho', since: 'Riding since 2021', hub: 'Hub Intendente', drops: '6,412', km: '18,940', r: '4.98', c: 'pc-ava-rui' },
  { i: 'AP', n: 'Ana Pires', since: 'Riding since 2022', hub: 'Hub Alcântara', drops: '4,870', km: '13,205', r: '4.97', c: 'pc-ava-ana' },
  { i: 'TR', n: 'Tiago Rocha', since: 'Riding since 2024', hub: 'Hub Almada', drops: '1,936', km: '5,610', r: '4.95', c: 'pc-ava-tiago' },
];

const FOOT = [
  { h: 'Send', l: ['Book a pickup', 'Track a parcel', 'Prices and sizes', 'What we can’t carry'] },
  { h: 'Business', l: ['Dashboard', 'API and webhooks', 'Scheduled rounds', 'Returns'] },
  { h: 'Riders', l: ['Ride with Parcelry', 'Pay and benefits', 'Our hubs', 'Safety'] },
  { h: 'Company', l: ['About', 'Careers', 'Press', 'Contact'] },
];

/* ── The page ───────────────────────────────────────────────────────────── */

export function ParcelrySite() {
  return (
    <Site
      className="pc"
      brand={<><Logo />Parcelry</>}
      links={['Send a parcel', 'Business', 'Coverage', 'Pricing', 'API']}
      cta="Book a pickup"
      example="map-route"
      apis="once · ease-in-out"
      footnote="Same-day across Lisbon, Porto and Braga"
    >
      <section className="pc-hero">
        <div className="pc-hero-copy">
          <h1 className="pc-h1">Across Lisbon in 90&nbsp;minutes, <em>on two wheels.</em></h1>
          <p className="pc-lede">Book by 19:30 and a rider collects within 30 minutes, then takes it straight to the door — no depot, no van, no “out for delivery” black box. You watch every turn live.</p>
          <Booking />
          <ul className="pc-trust">
            <li><span className="pc-stars"><Star /><Star /><Star /><Star /><Star /></span><b>4.9</b> from 8,214 reviews</li>
            <li><b>98.6%</b> on time</li>
            <li><b>100%</b> electric cargo bikes</li>
          </ul>
        </div>
        <div className="pc-hero-art"><ParcelryMap /></div>
      </section>

      <section className="pc-logos" aria-label="Customers">
        <p>2,300 Lisbon shops, kitchens and studios send with Parcelry</p>
        <div className="pc-logo-row">{BRANDS.map((b) => <span key={b.n} className={b.c}>{b.n}</span>)}</div>
      </section>

      <section className="pc-sec" id="how">
        <div className="pc-head pc-head-2">
          <div><p className="pc-k">Send a parcel</p>
          <h2 className="pc-h2">Booked in a minute. At the door within the hour.</h2></div>
          <p className="pc-sub">The same flow whether it is one envelope to a client or forty orders from your shop. Nothing goes to a depot, so nothing sits on a shelf overnight.</p>
        </div>
        <div className="pc-steps3">
          {STEPS.map((s) => (
            <article key={s.n} className="pc-step">
              {s.viz}
              <p className="pc-step-n">{s.n}</p>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pc-band" aria-label="Parcelry in numbers">
        {[
          ['23 min', 'average wait for a rider in Zone 1'],
          ['61 min', 'median door-to-door across Lisbon'],
          ['1.2 M', 'parcels delivered since 2021'],
          ['0 g', 'tailpipe CO₂ — we own no vans'],
        ].map(([n, l]) => <div key={n}><b>{n}</b><span>{l}</span></div>)}
      </section>

      <section className="pc-sec pc-alt" id="pricing">
        <div className="pc-split">
          <div className="pc-split-copy">
            <p className="pc-k">Pricing</p>
            <h2 className="pc-h2">One price across the city. No surge, ever.</h2>
            <p className="pc-sub">You pay by size and zone, not by the minute or the weather. Rain on a Friday at six costs the same as a Tuesday morning.</p>
            <ul className="pc-sizes">
              {SIZES.map((s) => (
                <li key={s.n}>
                  <svg viewBox="0 0 32 32" aria-hidden="true"><path d={s.icon} /></svg>
                  <span><b>{s.n}</b><small>{s.d}</small></span>
                  <em>from <b>{s.p}</b></em>
                </li>
              ))}
            </ul>
            <p className="pc-fine">Zone 2 adds €2, Zone 3 adds €5. Business accounts pay 15% less from 200 deliveries a month.</p>
          </div>
          <Calculator />
        </div>
      </section>

      <section className="pc-sec pc-ink" id="business">
        <div className="pc-head pc-head-c">
          <p className="pc-k">Parcelry for Business</p>
          <h2 className="pc-h2">Every delivery from every shop, on one screen.</h2>
          <p className="pc-sub">See what is out, what is late and what came back. Book in bulk from a CSV, set standing rounds, and give your customers a tracking page with your logo on it.</p>
        </div>
        <Dashboard />
        <div className="pc-biz">
          {BIZ.map((b) => (
            <article key={b.t}>
              {b.viz}
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pc-sec" id="api">
        <div className="pc-split pc-split-api">
          <div className="pc-split-copy">
            <p className="pc-k">API</p>
            <h2 className="pc-h2">Put a bike in your checkout.</h2>
            <p className="pc-sub">One call books a rider, prices the trip and returns a tracking link. Webhooks tell your shop the moment a parcel is picked up, delivered or needs a second try.</p>
            <ul className="pc-ticks">
              <li><Check />Live quotes at checkout, in cents, with IVA</li>
              <li><Check />Webhooks for every status, signed with HMAC</li>
              <li><Check />A sandbox with test riders that really move</li>
              <li><Check />Plugins for the major shop platforms, or a CSV upload</li>
            </ul>
            <a className="pc-more" href="#top">Read the API docs →</a>
          </div>
          <Code />
        </div>
      </section>

      <section className="pc-sec pc-alt" id="coverage">
        <div className="pc-split pc-split-cov">
          <div className="pc-covmap">
            <Coverage />
            <span className="pc-cov-now"><span className="pc-live" />142 riders out now</span>
            <span className="pc-cov-key"><i className="k1" />Zone 1<i className="k2" />Zone 2<i className="k3" />Zone 3<i className="kh" />Hub · 10 min reach</span>
          </div>
          <div className="pc-split-copy">
            <p className="pc-k">Coverage</p>
            <h2 className="pc-h2">All of Lisbon, and both sides of the river.</h2>
            <p className="pc-sub">Three hubs keep a rider within ten minutes of anywhere in Zone 1. Almada is a ride across the bridge — on the train with the bike, never in a van.</p>
            <ul className="pc-cities">
              {CITIES.map((c) => (
                <li key={c.c}>
                  <b>{c.c}</b>
                  <span className={`pc-pill ${c.on ? 'is-done' : 'is-soon'}`}>{c.s}</span>
                  <small>{c.d}</small>
                </li>
              ))}
            </ul>
            <div className="pc-check"><span>⌕ Enter a postcode, e.g. 1100-148</span><b>Check</b></div>
          </div>
        </div>
      </section>

      <section className="pc-sec" id="riders">
        <div className="pc-head pc-head-2">
          <div><p className="pc-k">Our riders</p>
          <h2 className="pc-h2">Employed, insured, and on the same bike every day.</h2></div>
          <p className="pc-sub">Every Parcelry rider is on a contract, paid by the hour and not by the drop. It is why they don’t run red lights — and why your parcel arrives the way it left.</p>
        </div>
        <div className="pc-riders">
          {RIDERS.map((r) => (
            <article key={r.n} className="pc-rider-card">
              <div className="pc-rider-top">
                <span className={`pc-ava pc-ava-lg ${r.c}`} aria-hidden="true">{r.i}</span>
                <span><b>{r.n}</b><small>{r.since} · {r.hub}</small></span>
              </div>
              <dl>
                <div><dt>Deliveries</dt><dd>{r.drops}</dd></div>
                <div><dt>Kilometres</dt><dd>{r.km}</dd></div>
                <div><dt>Rating</dt><dd><Star />{r.r}</dd></div>
              </dl>
            </article>
          ))}
          <article className="pc-rider-card pc-perks">
            <b>What every rider gets</b>
            <ul>
              <li><Check />€11.20 an hour, paid weekly</li>
              <li><Check />Accident and health insurance</li>
              <li><Check />Cargo e-bike, helmet and rain kit</li>
              <li><Check />Hubs with showers and lockers</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="pc-quote">
        <blockquote>“We used to lose Saturday mornings to the post-office queue. Now the bike is at the counter by ten, and customers in Graça have their books before lunch.”</blockquote>
        <div className="pc-quote-who">
          <span className="pc-ava pc-ava-joana" aria-hidden="true">JF</span>
          <span><b>Joana Ferreira</b><small>Owner, Tinta Books · 1,840 parcels this year</small></span>
        </div>
      </section>

      <section className="pc-cta">
        <div className="pc-cta-copy">
          <h2>Your first delivery is on us.</h2>
          <p>Book a pickup now and we’ll take €9 off — enough for any Box across Lisbon. Business accounts get a month of free deliveries up to €150.</p>
          <div className="pc-cta-btns">
            <a className="sk-btn pc-btn-w" href="#top">Book a pickup</a>
            <a className="sk-btn pc-btn-o" href="#business">Talk to sales</a>
          </div>
        </div>
        <svg className="pc-cargo" viewBox="0 0 360 210" aria-hidden="true">
          <path d="M10 196H350" className="ground" />
          <circle cx="292" cy="160" r="34" /><circle cx="292" cy="160" r="4" className="hub" />
          <circle cx="58" cy="168" r="26" /><circle cx="58" cy="168" r="4" className="hub" />
          <path d="M292 160H226L212 92 M292 160L216 104 M180 104H214 M176 136L226 160 M180 96L176 136 M180 96L188 66 M176 62H198 M200 86H226" />
          <path d="M176 156H84L72 132L58 168" />
          <circle cx="226" cy="160" r="11" />
          <rect x="84" y="88" width="88" height="62" rx="6" className="box" />
          <path d="M84 104H172" className="box-line" />
          <rect x="114" y="112" width="28" height="28" rx="8" className="box-logo" />
          <path d="M123.3 120V136" className="box-p" /><circle cx="128.6" cy="124.6" r="5.3" className="box-p" />
        </svg>
      </section>

      <nav className="pc-sitemap" aria-label="Footer">
        <div className="pc-sitemap-brand">
          <span className="sk-brand"><Logo />Parcelry</span>
          <p>Parcelry Entregas, Lda<br />Rua dos Anjos 64, 1150-039 Lisboa</p>
          <p className="pc-sitemap-hours"><span className="pc-live" />Riders out now · 8:00–21:00</p>
        </div>
        {FOOT.map((c) => (
          <div key={c.h}><b>{c.h}</b>{c.l.map((l) => <a key={l} href="#top">{l}</a>)}</div>
        ))}
      </nav>
    </Site>
  );
}
