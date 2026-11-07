'use client';

import './plugboard.css';
import { Fragment, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { scrollAnimateGroup } from 'svg-scroll-draw/group';
import { Site } from '../kit/Site';
import { Mark, AppIcon, APPS, APPCOLOR, Editor } from './PlugboardParts';
import type { GlyphKey } from './PlugboardParts';

/* Plugboard — no-code automations. The hero's flow wires draw themselves in
   order as the page opens (ScrollDraw autoplay), and the integrations
   directory arrives from one scrollAnimateGroup call: twelve tiles, one set
   of props, one trigger, one instance to clean up. */

const CHIPS: [string, string][] = [['All', '412'], ['Popular', ''], ['Finance', '38'], ['Sales & CRM', '52'], ['Marketing', '61'], ['Commerce', '29'], ['Developer', '44'], ['Productivity', '73'], ['Support', '27']];

const TEMPLATES: { apps: GlyphKey[]; t: string; d: string; used: string; mins: number }[] = [
  { apps: ['quillmark', 'paygrid', 'inkbox'], t: 'Invoice the client the moment a contract is signed', d: 'Quillmark → Paygrid → Inkbox', used: '14.2k', mins: 4 },
  { apps: ['hearth', 'sheetly'], t: 'Log every paid order in a shared spreadsheet', d: 'Hearth & Field → Sheetly', used: '22.8k', mins: 2 },
  { apps: ['formwell', 'calla', 'relay'], t: 'Book a call from a form and tell the team', d: 'Formwell → Calla → Relay', used: '9.6k', mins: 5 },
  { apps: ['paygrid', 'filter', 'relay'], t: 'Post failed payments over £500 to #finance', d: 'Paygrid → Filter → Relay', used: '6.1k', mins: 3 },
  { apps: ['inkbox', 'ai', 'tessera'], t: 'Turn support emails into help-centre drafts', d: 'Inkbox → AI step → Tessera', used: '4.3k', mins: 6 },
  { apps: ['mint', 'sheetly'], t: 'Send business transactions to your bookkeeping sheet', d: 'Mint & Co Business → Sheetly', used: '3.9k', mins: 2 },
];

const RUNS = [
  { id: '18,204', f: 'Paid order → invoice → courier', at: '10:02:14', d: '1.43 s', s: 'ok', note: 'Success' },
  { id: '18,203', f: 'Signed contract → invoice', at: '10:01:52', d: '2.10 s', s: 'ok', note: 'Success' },
  { id: '18,202', f: 'Failed payments → #finance', at: '09:58:30', d: '0.31 s', s: 'skip', note: 'Stopped by filter' },
  { id: '18,201', f: 'Paid order → invoice → courier', at: '09:57:07', d: '6.84 s', s: 'retry', note: 'Retried 2× · Parcelry 429' },
  { id: '18,200', f: 'Support email → help draft', at: '09:55:41', d: '3.92 s', s: 'ok', note: 'Success' },
  { id: '18,199', f: 'Form → call → Relay', at: '09:51:18', d: '1.05 s', s: 'ok', note: 'Success' },
];

const TIERS = [
  { n: 'Free', p: '£0', s: 'forever', tasks: '100 tasks / month', f: ['Two-step flows', 'Checks for new data every 15 min', 'All 412 apps'], cta: 'Start free' },
  { n: 'Team', p: '£24', s: 'per month, billed yearly', tasks: '2,000 tasks / month', f: ['Unlimited steps, paths and filters', 'Checks every minute, instant triggers', 'Shared folders and connections', 'Up to 10 people'], cta: 'Start a 14-day trial', hot: true },
  { n: 'Business', p: '£89', s: 'per month, billed yearly', tasks: '20,000 tasks / month', f: ['Everything in Team', 'SSO, SCIM and an audit log', 'Automatic replay of failed runs', 'Unlimited people'], cta: 'Start a 14-day trial' },
];

export function PlugboardSite() {
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const group = scrollAnimateGroup(Array.from(grid.current!.children), {
      props: { opacity: [0, 1], transform: ['translateY(28px) scale(0.96)', 'translateY(0) scale(1)'] },
      trigger: { start: 'top 88%', end: 'top 40%' },
      easing: 'ease-out',
      once: true,
    });
    return () => group.destroy();
  }, []);

  return (
    <Site
      className="pb"
      brand={<><Mark />Plugboard</>}
      links={['Product', 'Integrations', 'Templates', 'Pricing', 'Docs']}
      cta="Start free"
      example="scroll-animate-group"
      apis="scrollAnimateGroup · one call, one trigger"
      footnote="Automations for teams without engineers"
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pb-hero">
        <h1 className="pb-h1">The busywork between your apps, <em>handled</em></h1>
        <p className="pb-lede">When an order is paid, raise the invoice. When the invoice goes out, book the courier. Plugboard connects 412 apps with flows anyone on the team can build — and shows you every run.</p>
        <div className="pb-ctas">
          <a className="pb-btn" href="#pricing">Start free</a>
          <a className="pb-btn pb-btn-ghost" href="#templates">Browse 1,800 templates</a>
        </div>
        <p className="pb-note">Free for 100 tasks a month · No credit card</p>
        <div className="pb-hero-art"><Editor /></div>
      </section>

      <section className="pb-logos" aria-label="Customers">
        <p>Ops, finance and support teams at 26,000 companies run on Plugboard</p>
        <div>
          <span className="lg-1">northvale</span>
          <span className="lg-2">KESTREL<i>&amp;</i>CO</span>
          <span className="lg-3"><i />Tandem Health</span>
          <span className="lg-4">Oakhaven</span>
          <span className="lg-5">LARKSPUR</span>
          <span className="lg-6"><i />fernhill</span>
          <span className="lg-7">Brightwell</span>
        </div>
      </section>

      {/* ── Integrations directory: the effect ───────────────────────── */}
      <section className="pb-sec pb-dir" id="apps">
        <header className="pb-head">
          <div>
            <p className="pb-kick">Integrations</p>
            <h2 className="pb-h2">412 apps, connected in two clicks</h2>
          </div>
          <p className="pb-lede">Sign in to an app once and Plugboard keeps the connection alive — tokens refreshed, rate limits respected, failed calls retried with backoff.</p>
        </header>

        <div className="pb-dir-ui">
          <div className="pb-dir-top">
            <span className="pb-search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" /></svg>Search 412 apps<kbd>/</kbd></span>
            <span className="pb-sort">Most used <i>▾</i></span>
          </div>
          <div className="pb-chips" aria-hidden="true">
            {CHIPS.map(([c, n], i) => <span key={c} className={i === 0 ? 'on' : ''}>{c}{n && <em>{n}</em>}</span>)}
          </div>

          <div className="pb-grid" ref={grid}>
            {APPS.map((a) => (
              <a key={a.n} href="#top" className="pb-app" style={{ '--h': APPCOLOR[a.g] } as CSSProperties}>
                <span className="pb-app-top">
                  <AppIcon g={a.g} size={44} />
                  {a.badge && <em className={`pb-badge is-${a.badge.toLowerCase()}`}>{a.badge}</em>}
                </span>
                <b>{a.n}</b>
                <small>{a.c}</small>
                <span className="pb-app-d">{a.d}</span>
                <span className="pb-app-m"><span>{a.t} triggers</span><span>{a.a} actions</span></span>
              </a>
            ))}
          </div>

          <div className="pb-dir-foot">
            <span>Showing 12 of 412 apps</span>
            <span className="pb-dir-diy"><AppIcon g="webhook" size={22} /><span>Not listed? Call any API with an <b>HTTP request</b> step, or catch a <b>webhook</b>.</span></span>
            <a href="#top">Browse the directory →</a>
          </div>
        </div>
      </section>

      {/* ── Logic ────────────────────────────────────────────────────── */}
      <section className="pb-sec pb-split" id="logic">
        <div className="pb-split-copy">
          <p className="pb-kick">Paths, filters and delays</p>
          <h2 className="pb-h2">The logic lives in the flow, not in someone’s head</h2>
          <p className="pb-lede">Send UK orders one way and export orders another. Stop a run when a field is empty. Wait fifteen minutes for a payment to clear. Every rule reads like a sentence, and every teammate can follow it.</p>
          <ul className="pb-ticks">
            <li>Up to 10 paths per step, each with its own rules</li>
            <li>Delays from a minute to 30 days, or until a set time</li>
            <li>Formatters for dates, currencies, names and text</li>
          </ul>
        </div>
        <div className="pb-panel pb-rules" aria-hidden="true">
          <div className="pb-panel-h"><AppIcon g="paths" size={26} /><b>Path A · Ships in the UK</b><span className="pb-tag">Runs first</span></div>
          <p className="pb-rules-l">Only continue if…</p>
          <div className="pb-rule"><span className="pb-pill"><AppIcon g="hearth" size={16} />1. Shipping country</span><span className="pb-op">is exactly</span><span className="pb-val">United Kingdom</span></div>
          <p className="pb-and">and</p>
          <div className="pb-rule"><span className="pb-pill"><AppIcon g="hearth" size={16} />1. Order total</span><span className="pb-op">is greater than</span><span className="pb-val">25.00</span></div>
          <p className="pb-and">and</p>
          <div className="pb-rule"><span className="pb-pill"><AppIcon g="paygrid" size={16} />2. Invoice status</span><span className="pb-op">is</span><span className="pb-val">Paid</span></div>
          <div className="pb-rule-add"><span>+ And</span><span>+ Or group</span></div>
          <div className="pb-rule-then">
            <span><AppIcon g="clock" size={22} /><b>Delay</b> 15 minutes</span>
            <i />
            <span><AppIcon g="parcelry" size={22} /><b>Book a courier</b> next-day</span>
          </div>
          <p className="pb-rule-test"><i className="pb-tick" />Tested with order #HF-20481 — this path would run</p>
        </div>
      </section>

      {/* ── Runs ─────────────────────────────────────────────────────── */}
      <section className="pb-sec pb-split is-flip" id="runs">
        <div className="pb-split-copy">
          <p className="pb-kick">Run history</p>
          <h2 className="pb-h2">Every run, on the record</h2>
          <p className="pb-lede">See what came in, what went out and how long each step took. When an app has a bad minute, Plugboard retries with backoff, and on Business it replays the failed step for you once the app is back.</p>
          <ul className="pb-ticks">
            <li>Inputs and outputs for every step, kept for 30 days</li>
            <li>Alerts in email or Relay when a flow starts failing</li>
            <li>Replay one run, or every run from the last hour</li>
          </ul>
        </div>
        <div className="pb-panel pb-runs" aria-hidden="true">
          <div className="pb-runs-top"><b>Runs</b><span className="pb-seg"><i className="on">All</i><i>Failed</i><i>Retried</i></span><span className="pb-runs-sum"><em>2,418</em> today · 99.7% succeeded</span></div>
          <div className="pb-table">
            <span className="pb-tr pb-th"><span>Run</span><span>Flow</span><span>Started</span><span>Took</span><span>Status</span></span>
            {RUNS.map((r) => (
              <span key={r.id} className={`pb-tr${r.id === '18,201' ? ' on' : ''}`}>
                <span className="pb-mono">#{r.id}</span>
                <span className="pb-tf">{r.f}</span>
                <span className="pb-mono">{r.at}</span>
                <span className="pb-mono">{r.d}</span>
                <span className={`pb-st is-${r.s}`}>{r.note}</span>
              </span>
            ))}
          </div>
          <div className="pb-detail">
            <p><b>#18,201</b> · Book a courier · attempt 3 of 3 succeeded</p>
            <span className="pb-wf">
              {[['Attempt 1', '429 rate-limited', 'fail', 0, 5], ['Attempt 2', '429 · waited 4 s', 'fail', 30, 5], ['Attempt 3', '201 Created · 0.81 s', 'ok', 74, 14]].map(([a, m, k, l, w]) => (
                <span key={a as string}>
                  <em><b>{a}</b>{m}</em>
                  <span className="pb-wf-t"><i className={`is-${k}`} style={{ left: `${l}%`, width: `${w}%` }} /></span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </section>

      {/* ── AI step ──────────────────────────────────────────────────── */}
      <section className="pb-sec pb-split" id="ai">
        <div className="pb-split-copy">
          <p className="pb-kick">AI steps</p>
          <h2 className="pb-h2">AI that hands back fields, not paragraphs</h2>
          <p className="pb-lede">Point an AI step at an email, a PDF or a form reply and name the fields you want. You get typed values the next step can use — an order number, a date, a yes or no — and a confidence score for each.</p>
        </div>
        <div className="pb-panel pb-ai" aria-hidden="true">
          <div className="pb-mail">
            <p className="pb-mail-h"><AppIcon g="inkbox" size={22} /><b>Re: order HF-20481</b><span>09:14</span></p>
            <p className="pb-mail-f">From <b>Ada Park</b> &lt;ada@parkhouse.co&gt;</p>
            <p className="pb-mail-b">Hi — I’ve just realised the order is going to my old flat. Could you send it to 14 Calder Row, Leeds LS6 2QA instead? It’s a birthday present so it needs to arrive by Friday. Thanks!</p>
          </div>
          <div className="pb-ai-arrow"><AppIcon g="ai" size={28} /><span>Extract 4 fields · 0.9 s</span></div>
          <div className="pb-out">
            {[['Order number', 'HF-20481', 'text', 99], ['Request', 'Change address', 'choice', 97], ['New address', '14 Calder Row, Leeds LS6 2QA', 'address', 95], ['Needed by', 'Fri 7 Nov 2026', 'date', 91]].map(([k, v, t, c]) => (
              <span key={k as string}><small>{k}<i>{t}</i></small><b>{v}</b><em>{c}%</em></span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────────────── */}
      <section className="pb-sec pb-tpl" id="templates">
        <header className="pb-head">
          <div>
            <p className="pb-kick">Templates</p>
            <h2 className="pb-h2">Start from a flow that already works</h2>
          </div>
          <div className="pb-tabs-row" aria-hidden="true"><span className="on">Popular</span><span>Finance</span><span>Sales</span><span>Operations</span><span>Support</span></div>
        </header>
        <div className="pb-tpls">
          {TEMPLATES.map((t) => (
            <a key={t.t} href="#top" className="pb-tplc">
              <span className="pb-tpl-apps">
                {t.apps.map((g, i) => (
                  <Fragment key={g}>
                    {i > 0 && <i aria-hidden="true" />}
                    <AppIcon g={g} size={38} />
                  </Fragment>
                ))}
              </span>
              <b>{t.t}</b>
              <small>{t.d}</small>
              <span className="pb-tpl-f"><span>Used by {t.used} teams</span><span>{t.mins} min setup</span></span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Numbers ──────────────────────────────────────────────────── */}
      <section className="pb-stats">
        {[['3.1B', 'tasks run in the last 12 months'], ['412', 'apps, with 30 more this quarter'], ['99.98%', 'uptime over the last year'], ['6 min', 'median time to a first live flow']].map(([n, l]) => (
          <span key={l}><b>{n}</b><small>{l}</small></span>
        ))}
      </section>

      {/* ── Quote ────────────────────────────────────────────────────── */}
      <section className="pb-sec pb-quote">
        <figure>
          <blockquote>“Month-end close used to take finance four days of copying between Paygrid and spreadsheets. It takes one now, and my team built every flow themselves — engineering hasn’t touched one in a year.”</blockquote>
          <figcaption><span className="pb-q-ava">RM</span><span><b>Rhea Malhotra</b><small>Head of Finance Operations, Northvale</small></span></figcaption>
        </figure>
        <div className="pb-q-stats">
          <span><b>31 h</b><small>saved every week</small></span>
          <span><b>64</b><small>live flows, all built by finance</small></span>
          <span><b>0</b><small>tickets to engineering</small></span>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="pb-sec pb-pricing" id="pricing">
        <header className="pb-head is-center">
          <p className="pb-kick">Pricing</p>
          <h2 className="pb-h2">Pay for the tasks you run, not the seats you fill</h2>
          <p className="pb-lede">A task is one step that does something — create an invoice, send a message. Triggers, filters and paths are free.</p>
          <span className="pb-bill" aria-hidden="true"><i>Monthly</i><i className="on">Yearly <em>−20%</em></i></span>
        </header>
        <div className="pb-tiers">
          {TIERS.map((t) => (
            <div key={t.n} className={`pb-tier${t.hot ? ' hot' : ''}`}>
              <p className="pb-tier-n">{t.n}{t.hot && <em>Most popular</em>}</p>
              <p className="pb-tier-p"><b>{t.p}</b><small>{t.s}</small></p>
              <span className="pb-tier-t">{t.tasks}<i>▾</i></span>
              <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
              <a className={`pb-btn${t.hot ? '' : ' pb-btn-ghost'}`} href="#top">{t.cta}</a>
            </div>
          ))}
        </div>
        <p className="pb-ent">Over 100,000 tasks a month, or need EU data residency? <a href="#top">Talk to us about Enterprise →</a></p>
      </section>

      {/* ── Security + CTA ───────────────────────────────────────────── */}
      <section className="pb-sec pb-sec-trust" aria-label="Security">
        {[['SOC 2 Type II', 'Audited every year'], ['ISO 27001', 'Certified since 2023'], ['GDPR', 'DPA on every plan'], ['SSO + SCIM', 'Any SAML 2.0 provider'], ['EU or US', 'Choose where data lives'], ['Encrypted', 'AES-256 at rest, TLS 1.3']].map(([a, b]) => (
          <span key={a}><b>{a}</b><small>{b}</small></span>
        ))}
      </section>

      <section className="pb-cta">
        <div>
          <h2 className="pb-h2">Your first flow is six minutes away</h2>
          <p>Pick a template or start from a trigger. We’ll walk you through connecting the first two apps.</p>
        </div>
        <div className="pb-ctas">
          <a className="pb-btn" href="#top">Start free</a>
          <a className="pb-btn pb-btn-line" href="#top">Book a 20-minute demo</a>
        </div>
      </section>
    </Site>
  );
}
