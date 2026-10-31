'use client';

import './quillmark.css';
import { useCallback, useRef, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SIGNATURE } from '@/components/home/art/usecase-art';
import { BuiltWith } from '../BuiltWith';

/*
 * Quillmark — a demo site for a fictional e-signature product, built with
 * svg-scroll-draw:
 *   · the client's signature writes itself on the contract in one continuous
 *     stroke when the contract comes into view (autoplay — at load on a wide
 *     screen, on scroll on a phone); onComplete stamps the document signed
 *   · the three steps' icons draw one after another (stagger)
 *   · the audit trail's rail draws down the page with the reader
 */

const STEPS = [
  { t: 'Upload the contract', d: 'PDF, Word or a template. Quillmark finds the signature lines for you.', icon: ['M8 4h11l5 5v19H8z', 'M19 4v5h5', 'M12 16h8M12 20h8M12 24h5'] },
  { t: 'Place the fields', d: 'Drag in signatures, initials and dates. Set the order people sign in.', icon: ['M5 25 L21 9 l3 3 L8 28 H5z', 'M18 12l3 3', 'M5 28h22'] },
  { t: 'Send and relax', d: 'Signers get one link, no account. You get a sealed PDF and an audit trail.', icon: ['M4 15 L27 5 L20 27 L15 18z', 'M15 18 L27 5'] },
];

const TRAIL = [
  { at: 'Mon 09:12', who: 'You', what: 'Sent “Lease renewal — Unit 4B” to 2 signers' },
  { at: 'Mon 09:40', who: 'Ada Park', what: 'Opened the document · Lisbon, PT' },
  { at: 'Mon 10:02', who: 'Ada Park', what: 'Signed page 3 · identity verified by email code' },
  { at: 'Mon 10:15', who: 'Tomás Reis', what: 'Countersigned as landlord' },
  { at: 'Mon 10:15', who: 'Quillmark', what: 'Sealed the PDF · SHA-256 1f3a…9c0e · copies sent to everyone' },
];

export function QuillmarkSite() {
  const [signed, setSigned] = useState(false);
  const trail = useRef<HTMLOListElement>(null);
  const onTrail = useCallback((p: number) => trail.current?.style.setProperty('--p', p.toFixed(3)), []);

  return (
    <div className="qm">
      <header className="qm-nav">
        <a className="qm-brand" href="#top">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 20 C 8 12, 12 6, 20 4 C 17 9, 13 14, 6 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20 H 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Quillmark
        </a>
        <nav className="qm-links" aria-label="Main">
          <a href="#how">How it works</a><a href="#trail">Security</a><a href="#pricing">Pricing</a><a href="#pricing">Templates</a>
        </nav>
        <span className="qm-nav-r"><a href="#pricing">Log in</a><a className="qm-btn qm-btn-sm" href="#pricing">Try it free</a></span>
      </header>

      <section className="qm-hero" id="top">
        <div className="qm-hero-copy">
          <p className="qm-kick">E-signatures for small firms</p>
          <h1 className="qm-h1">Contracts signed before the coffee cools.</h1>
          <p className="qm-lede">Send a lease, an NDA or a statement of work in under a minute. Your client signs on their phone — no account, no app — and you get a sealed PDF with a full audit trail.</p>
          <div className="qm-ctas">
            <a className="qm-btn" href="#pricing">Send your first contract</a>
            <a className="qm-link" href="#how">See how it works →</a>
          </div>
          <p className="qm-trust">Legally binding under eIDAS and the ESIGN Act · 4.9 on 1,200 reviews</p>
        </div>

        {/* The contract: the signature writes itself as it scrolls into view */}
        <div className={`qm-doc${signed ? ' is-signed' : ''}`}>
          <div className="qm-doc-top">
            <span>Lease renewal — Unit 4B</span>
            <span className="qm-doc-pg">Page 3 of 3</span>
          </div>
          <h2 className="qm-doc-h">7. Signatures</h2>
          <p className="qm-doc-p">By signing below, the Tenant agrees to renew the lease of Unit 4B, Rua das Flores 112, for twelve (12) months from 1 December 2026 at a monthly rent of €1,450, on the terms set out in sections 1–6.</p>
          <div className="qm-doc-lines" aria-hidden="true"><i /><i /><i style={{ width: '62%' }} /></div>
          <div className="qm-field">
            <span className="qm-field-tag">{signed ? 'Signed' : 'Sign here'}</span>
            <ScrollDraw className="qm-sig" autoplay duration={2400} delay={500} easing="ease-in-out" once onComplete={() => setSigned(true)}>
              <svg viewBox="20 40 380 190" role="img" aria-label="Ada Park's signature">
                <path className="qm-ink" d={SIGNATURE} />
              </svg>
            </ScrollDraw>
            <div className="qm-field-line" />
            <div className="qm-field-meta"><span>Ada Park · Tenant</span><span>31 Oct 2026</span></div>
          </div>
          <div className="qm-stamp" aria-hidden={!signed}>
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Signed 31 Oct 2026, 10:02 · verified by email code
          </div>
        </div>
      </section>

      <section className="qm-logos" aria-label="Customers">
        <p>Used by 6,000 agencies, studios and property managers</p>
        <div>{['Harbour Lettings', 'Studio Ortega', 'Fenwick Legal', 'Brightwell', 'Atlas Rooms'].map((n) => <span key={n}>{n}</span>)}</div>
      </section>

      <section className="qm-sec" id="how">
        <p className="qm-kick">How it works</p>
        <h2 className="qm-h2">From draft to signed in three steps.</h2>
        <ScrollDraw className="qm-steps" selector=".qm-step-ink" trigger={{ start: 'top 85%', end: 'top 45%' }} stagger={0.12} easing="ease-out" once>
          {STEPS.map((s, i) => (
            <article key={s.t} className="qm-step">
              <span className="qm-step-n">0{i + 1}</span>
              <svg className="qm-step-icon" viewBox="0 0 32 32" aria-hidden="true">
                {s.icon.map((d, k) => <path key={k} className="qm-step-ink" d={d} />)}
              </svg>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </ScrollDraw>
      </section>

      <section className="qm-sec qm-trail-sec" id="trail">
        <div className="qm-trail-copy">
          <p className="qm-kick">Audit trail</p>
          <h2 className="qm-h2">Every view, signature and seal, on the record.</h2>
          <p className="qm-body">Each document carries a tamper-evident log: who opened it, from where, how they proved who they are, and the hash of the sealed file. Hand it to a court, an auditor or a nervous client.</p>
        </div>
        <ScrollDraw className="qm-trail" selector=".qm-rail" trigger={{ start: 'top 75%', end: 'bottom 70%' }} easing="linear" once onProgress={onTrail}>
          <svg className="qm-rail-svg" viewBox="0 0 2 1000" preserveAspectRatio="none" aria-hidden="true"><path className="qm-rail" d="M1 0 V1000" /></svg>
          <ol className="qm-events" ref={trail}>
            {TRAIL.map((e, i) => (
              <li key={i} style={{ '--at': (i / (TRAIL.length - 1)) * 0.92 } as React.CSSProperties}>
                <span className="qm-dot" />
                <span className="qm-at">{e.at}</span>
                <span className="qm-who">{e.who}</span>
                <span className="qm-what">{e.what}</span>
              </li>
            ))}
          </ol>
        </ScrollDraw>
      </section>

      <section className="qm-sec" id="pricing">
        <h2 className="qm-h2 qm-center">Simple pricing. Unlimited signers on every plan.</h2>
        <div className="qm-tiers">
          {[
            { n: 'Solo', p: '€12', s: 'a month', f: ['10 contracts a month', 'Templates and reminders', 'Audit trail on every document'] },
            { n: 'Team', p: '€29', s: 'per user, a month', f: ['Unlimited contracts', 'Shared templates and branding', 'Signing order and approvals', 'Bulk send'], hot: true },
            { n: 'Business', p: 'Custom', s: 'for 25+ users', f: ['SSO and SCIM', 'Qualified signatures', 'Data residency in the EU', 'A named account manager'] },
          ].map((t) => (
            <div key={t.n} className={`qm-tier${t.hot ? ' hot' : ''}`}>
              <h3>{t.n}</h3>
              <p className="qm-price"><b>{t.p}</b> {t.s}</p>
              <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
              <a className={`qm-btn${t.hot ? '' : ' qm-btn-ghost'}`} href="#pricing">{t.n === 'Business' ? 'Talk to sales' : 'Start free trial'}</a>
            </div>
          ))}
        </div>
      </section>

      <footer className="qm-foot">
        <span className="qm-brand">Quillmark</span>
        <span>© 2026 Quillmark Ltd — a fictional company; this is a demo site.</span>
      </footer>

      <BuiltWith example="signature" apis="one stroke · autoplay · onComplete · onProgress" />
    </div>
  );
}
