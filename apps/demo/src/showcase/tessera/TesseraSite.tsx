'use client';

import './tessera.css';
import { useEffect, useRef, useState } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { Site } from '../kit/Site';
import { PLANS, COMPARE, FAQ, type Cell } from './data';

/*
 * Tessera — a team wiki's pricing page. Every part of every plan reveals on
 * its own scrollAnimate, a few percent of scroll apart: badge, name, price,
 * features, button — left plan first. Everything else on the page (the
 * billing toggle, the comparison table and its plan picker on phones, the
 * FAQ) is ordinary React.
 */

const Mark = ({ size = 20 }: { size?: number }) => (
  <svg className="ts-mark" viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
    <rect x="1" y="1" width="8.2" height="8.2" rx="2.2" fill="currentColor" />
    <rect x="10.8" y="1" width="8.2" height="8.2" rx="2.2" fill="var(--blue)" />
    <rect x="1" y="10.8" width="8.2" height="8.2" rx="2.2" fill="currentColor" />
    <rect x="10.8" y="10.8" width="8.2" height="8.2" rx="4.1" fill="currentColor" />
  </svg>
);

/* How much of the mosaic a plan fills: one tile for Free, four for Enterprise. */
const Tiles = ({ n }: { n: number }) => (
  <span className="ts-tiles" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i < n ? 'on' : undefined} />)}</span>
);

const Check = () => <svg className="ts-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>;
const Dash = () => <span className="ts-dash" aria-label="Not included">—</span>;
const cell = (v: Cell) => (v === true ? <><Check /><span className="sr">Included</span></> : v === false ? <Dash /> : <span className="ts-val">{v}</span>);

const price = (monthly: number | null, yearly: boolean) => (monthly === null ? null : yearly ? Math.round((monthly * 10) / 12) : monthly);

const LOGOS = [
  { n: 'Halyard', d: 'M3 17 L12 4 L21 17 Z M12 4 V17' },
  { n: 'Parcelry', d: 'M4 8 L12 4 L20 8 V16 L12 20 L4 16 Z M4 8 L12 12 L20 8 M12 12 V20' },
  { n: 'Ledgerline', d: 'M4 19 V5 M4 19 H20 M8 15 L12 10 L15 13 L20 7' },
  { n: 'Plugboard', d: 'M8 4 V9 M16 4 V9 M5 9 H19 V12 A7 7 0 0 1 5 12 Z M12 19 V21' },
  { n: 'Relay', d: 'M4 6 H20 V15 H11 L6 19 V15 H4 Z' },
  { n: 'Shipyard', d: 'M3 15 H21 L18 20 H6 Z M7 15 V9 H17 V15 M12 9 V4' },
  { n: 'Greenline', d: 'M12 21 V11 M12 11 C 6 11 5 6 5 3 C 10 3 12 6 12 11 C 12 6 15 3 19 3 C 19 7 17 11 12 11' },
  { n: 'Mint & Co', d: 'M12 3 A9 9 0 1 0 12.01 3 M8 12 H16 M12 8 V16' },
];

const TEMPLATES: { t: string; s: string; c: string; page: string; body: React.ReactNode }[] = [
  { t: 'Engineering wiki', s: 'Runbooks, RFCs and on-call', c: '#2f5bea', page: 'On-call runbook', body: <code>$ tessera rollback api<br />✓ api-7 restored in 41 s</code> },
  { t: 'New-joiner onboarding', s: 'A checklist for week one', c: '#e0573a', page: 'Week one', body: <ul className="ck"><li className="on">Laptop and accounts</li><li className="on">Meet your buddy</li><li>Ship a first change</li></ul> },
  { t: 'Company handbook', s: 'Policies people can find', c: '#f0a830', page: 'Handbook', body: <ol><li>How we work</li><li>Leave and holidays</li><li>Expenses</li></ol> },
  { t: 'Meeting notes', s: 'Agenda, decisions, actions', c: '#3f9b74', page: 'Weekly sync · 3 Nov', body: <ul><li><b>Decided:</b> ship v2 on the 14th</li><li><b>@Ana</b> launch page copy</li></ul> },
  { t: 'Product roadmap', s: 'Now, next and later', c: '#7c5cd6', page: 'Roadmap · Q1', body: <div className="kb"><span><i /><i /></span><span><i /><i /><i /></span><span><i /></span></div> },
];

export function TesseraSite() {
  const root = useRef<HTMLDivElement>(null);
  const [yearly, setYearly] = useState(true);
  const [col, setCol] = useState(1); // the plan the comparison shows on a phone

  useEffect(() => {
    const parts = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-part]') ?? []);
    const inst = parts.map((el) => {
      const plan = Number(el.dataset.plan), part = Number(el.dataset.part);
      const start = 92 - plan * 3 - part * 3; // left plan first, then top to bottom
      return scrollAnimate(el, {
        props: { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0)'] },
        trigger: { start: `top ${start}%`, end: `top ${start - 30}%` },
        easing: 'ease-out',
        once: true,
      });
    });
    return () => inst.forEach((i) => i.destroy());
  }, []);

  return (
    <Site
      className="ts"
      brand={<><Mark />Tessera</>}
      links={['Product', 'Templates', 'Customers', 'Pricing', 'Docs']}
      cta="Get Tessera free"
      example="scroll-animate"
      apis="scrollAnimate · staggered"
      footnote="The wiki your team will actually keep up to date"
    >
      {/* ── Head + billing toggle ── */}
      <section className="ts-head">
        <h1 className="ts-h1">One wiki for the whole company. Priced for every stage of it.</h1>
        <p className="ts-lede">Start free with unlimited pages. Upgrade when you need permissions, history and single sign-on — every paid plan starts with 14 days free.</p>
        <div className="ts-bill" role="radiogroup" aria-label="Billing period">
          <button type="button" role="radio" aria-checked={!yearly} className={!yearly ? 'on' : undefined} onClick={() => setYearly(false)}>Monthly</button>
          <button type="button" role="radio" aria-checked={yearly} className={yearly ? 'on' : undefined} onClick={() => setYearly(true)}>Yearly <em>2 months free</em></button>
        </div>
      </section>

      {/* ── The plans: every [data-part] rises on its own scrollAnimate ── */}
      <div className="ts-plans" ref={root}>
        {PLANS.map((p, i) => {
          const v = price(p.monthly, yearly);
          return (
            <article key={p.n} className={`ts-plan${p.hot ? ' hot' : ''}`}>
              <div className="ts-plan-top" data-plan={i} data-part={0}>
                <Tiles n={i + 1} />
                {p.badge && <span className={`ts-badge${p.hot ? ' hot' : ''}`}>{p.badge}</span>}
              </div>
              <div data-plan={i} data-part={1}>
                <h2 className="ts-plan-n">{p.n}</h2>
                <p className="ts-plan-d">{p.d}</p>
              </div>
              <div className="ts-price" data-plan={i} data-part={2}>
                {v === null ? (
                  <><b className="ts-amt is-custom">Custom</b><span className="ts-per">Volume pricing<br />for 100+ seats</span></>
                ) : (
                  <>
                    <b className="ts-amt"><span key={`${p.n}-${v}`} className="ts-num">${v}</span></b>
                    <span className="ts-per">{v === 0 ? 'per month, forever' : <>per member / month<br />{yearly ? `billed yearly · $${v * 12} a year` : 'billed monthly'}</>}</span>
                  </>
                )}
              </div>
              <div className="ts-feats" data-plan={i} data-part={3}>
                <p>{p.lead}:</p>
                <ul>{p.f.map((f) => <li key={f.t}><Check /><span>{f.t}{f.tag && <em className="ts-new">{f.tag}</em>}</span></li>)}</ul>
              </div>
              <div className="ts-cta" data-plan={i} data-part={4}>
                <a className={`ts-btn${p.hot ? ' is-blue' : i === 2 ? '' : ' is-ghost'}`} href="#top">{p.cta}</a>
                <span>{p.note}</span>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Who uses it ── */}
      <section className="ts-logos" aria-label="Customers">
        <p>Some of the teams that write in Tessera</p>
        <div>{LOGOS.map((l) => <span key={l.n}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={l.d} /></svg>{l.n}</span>)}</div>
      </section>

      {/* ── The AI add-on ── */}
      <section className="ts-sec ts-ai" id="ai">
        <div className="ts-ai-copy">
          <span className="ts-kick"><i>Add-on</i> Tessera AI</span>
          <h2 className="ts-h2">Ask the wiki. Get the answer, with the page it came from.</h2>
          <p className="ts-body">Tessera AI reads every page your account can see — never the ones it can’t — and answers in a sentence, with citations. It drafts, summarises and translates too.</p>
          <ul className="ts-ai-list">
            <li><Check />Answers from your pages, with sources</li>
            <li><Check />Summaries of long pages and threads</li>
            <li><Check />Drafts in your workspace’s own style</li>
            <li><Check />Never used to train any model</li>
          </ul>
          <p className="ts-ai-price"><b>$8</b> per member / month, on any paid plan <span>20 answers free to try</span></p>
        </div>
        <div className="ts-win ts-ai-win" role="img" aria-label="Tessera AI answering a question about parental leave, citing two pages from the company handbook">
          <div className="ts-win-bar"><span className="ts-lights"><i /><i /><i /></span><span className="ts-crumbs">Halyard <i>/</i> People <i>/</i> <b>Leave policy 2026</b></span><span className="ts-share">Share</span></div>
          <div className="ts-ai-body">
            <aside className="ts-side">
              <div className="ts-ws"><span>H</span>Halyard<kbd>⌘K</kbd></div>
              <p>Teamspaces</p>
              <ul>
                <li>Engineering</li>
                <li className="open">People</li>
                <li className="sub on">Leave policy 2026</li>
                <li className="sub">Rotterdam office</li>
                <li className="sub">Benefits</li>
                <li>Finance</li>
                <li>Design</li>
              </ul>
            </aside>
            <div className="ts-doc">
              <div className="ts-doc-h">Leave policy 2026 <span className="ts-verified"><Check />Verified · M. Osei · 3 days ago</span></div>
              <div className="ts-doc-lines" aria-hidden="true"><i /><i /><i style={{ width: '72%' }} /><i /><i style={{ width: '54%' }} /></div>
              <div className="ts-ask">
                <div className="ts-q"><span className="ts-av">JL</span>How much parental leave do we give in the Rotterdam office?</div>
                <div className="ts-a">
                  <p><span className="ts-spark" aria-hidden="true">✦</span>Birth parents get <b>16 weeks at full pay</b>, and partners get <b>6 weeks</b>, taken any time in the first year<sup>1</sup>. Rotterdam adds <b>2 extra weeks</b> on top of the Dutch statutory minimum<sup>2</sup>.</p>
                  <div className="ts-src">
                    <span><sup>1</sup>People › Leave policy 2026</span>
                    <span><sup>2</sup>People › Rotterdam office</span>
                  </div>
                </div>
                <div className="ts-input">Ask a follow-up… <kbd>↵</kbd></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compare every feature ── */}
      <section className="ts-sec ts-compare" id="compare">
        <div className="ts-sec-head">
          <h2 className="ts-h2">Compare every plan.</h2>
          <p className="ts-body">Everything in a plan is also in the plans to its right.</p>
        </div>
        <div className="ts-pick" role="tablist" aria-label="Plan to compare">
          {PLANS.map((p, i) => <button key={p.n} type="button" role="tab" aria-selected={col === i} className={col === i ? 'on' : undefined} onClick={() => setCol(i)}>{p.n}</button>)}
        </div>
        <table className="ts-table">
          <thead>
            <tr>
              <th scope="col" className="ts-th-feat"><span className="sr">Feature</span></th>
              {PLANS.map((p, i) => {
                const v = price(p.monthly, yearly);
                return (
                  <th key={p.n} scope="col" className={`ts-th${i === col ? ' is-sel' : ''}${p.hot ? ' hot' : ''}`}>
                    <b>{p.n}</b>
                    <span>{v === null ? 'Custom' : v === 0 ? '$0' : `$${v} / member / mo`}</span>
                    <a className={`ts-btn ts-btn-sm${p.hot ? ' is-blue' : ' is-ghost'}`} href="#top">{p.cta}</a>
                  </th>
                );
              })}
            </tr>
          </thead>
          {COMPARE.map((g) => (
            <tbody key={g.g}>
              <tr className="ts-group"><th scope="rowgroup" colSpan={5}>{g.g}</th></tr>
              {g.rows.map((r) => (
                <tr key={r.t}>
                  <th scope="row">{r.t}{r.hint && <small>{r.hint}</small>}</th>
                  {r.v.map((v, i) => <td key={i} className={[i === col ? 'is-sel' : '', PLANS[i].hot ? 'hot' : ''].join(' ').trim() || undefined}>{cell(v)}</td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </section>

      {/* ── Enterprise ── */}
      <section className="ts-ent">
        <div className="ts-ent-copy">
          <span className="ts-kick is-light">Enterprise</span>
          <h2 className="ts-h2">Run Tessera the way your security team wants it run.</h2>
          <ul className="ts-ent-list">
            <li><b>SAML SSO and SCIM</b>Provision and remove people from your identity provider.</li>
            <li><b>Audit log</b>Every view, edit, export and share, kept for as long as you need, streamed to your SIEM.</li>
            <li><b>Data residency</b>Keep your workspace in the EU or the US.</li>
            <li><b>Contracts that fit</b>Custom terms, a DPA, invoicing and a 99.9% uptime SLA.</li>
          </ul>
          <div className="ts-ent-ctas"><a className="ts-btn is-light" href="#top">Talk to sales</a><a className="ts-link" href="#top">Read the security overview →</a></div>
        </div>
        <div className="ts-console" role="img" aria-label="Tessera's admin console: single sign-on enforced, SCIM connected, and the latest audit log entries">
          <div className="ts-console-h"><b>Settings</b><i>/</i>Security and identity</div>
          <div className="ts-console-rows">
            <div><span><b>SAML single sign-on</b><i>halyard.co · verified domain</i></span><span className="ts-toggle on" /></div>
            <div><span><b>SCIM provisioning</b><i>1,284 members synced · 4 min ago</i></span><span className="ts-ok">Connected</span></div>
            <div><span><b>Guest invites</b><i>Admins only</i></span><span className="ts-toggle" /></div>
          </div>
          <div className="ts-log">
            <p>Audit log <span>Live</span></p>
            {[
              ['09:42', 'm.osei', 'exported “Q3 board pack” as PDF'],
              ['09:40', 'SCIM', 'added 3 members to People › Rotterdam'],
              ['09:31', 'j.lind', 'restricted “Pricing 2027” to Finance'],
              ['09:18', 'a.reyes', 'signed in with SSO from a new device'],
            ].map(([t, w, a]) => <div key={t}><time>{t}</time><b>{w}</b><span>{a}</span></div>)}
          </div>
        </div>
        <div className="ts-ent-logos">
          <p>On Enterprise</p>
          <div>{LOGOS.filter((l) => ['Halyard', 'Mint & Co', 'Shipyard', 'Relay', 'Ledgerline'].includes(l.n)).map((l) => <span key={l.n}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={l.d} /></svg>{l.n}</span>)}</div>
        </div>
        <div className="ts-certs">
          {[['SOC 2', 'Type II'], ['ISO', '27001'], ['GDPR', 'DPA ready'], ['HIPAA', 'BAA available']].map(([a, b]) => (
            <span key={a}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L20 6 V11.5 C20 16.5 16.6 20.4 12 21.5 C7.4 20.4 4 16.5 4 11.5 V6 Z" /><path d="M8.5 12 l2.5 2.5 l4.5 -5" /></svg><b>{a}</b><i>{b}</i></span>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ts-sec ts-faq-sec">
        <div className="ts-faq-head">
          <h2 className="ts-h2">Questions, answered.</h2>
          <p className="ts-body">Can’t find yours? <a className="ts-link" href="#top">Ask the team</a> — a person replies, usually within the hour.</p>
        </div>
        <div className="ts-faq">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}><summary>{q}<span aria-hidden="true" /></summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      {/* ── Start ── */}
      <section className="ts-end">
        <h2 className="ts-h2">Your team’s first page is a minute away.</h2>
        <div className="ts-end-ctas"><a className="ts-btn is-blue" href="#top">Get Tessera free</a><a className="ts-btn is-ghost" href="#top">Request a demo</a></div>
        <div className="ts-tpls" aria-label="Templates to start from">
          {TEMPLATES.map((t) => (
            <span key={t.t} className="ts-tpl" style={{ '--c': t.c } as React.CSSProperties}>
              <span className="ts-tpl-page" aria-hidden="true"><b>{t.page}</b>{t.body}</span>
              <b>{t.t}</b><small>{t.s}</small>
            </span>
          ))}
        </div>
      </section>
    </Site>
  );
}
