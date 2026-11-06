'use client';

import './quillmark.css';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SIGNATURE } from '@/components/home/art/usecase-art';
import { Site } from '../kit/Site';
import { ADA, TOMAS, CC, Avatar, Certificate, Editor, Ico, Mark, SignerPhone, TemplateThumb, type IconName } from './parts';

/*
 * Quillmark — a demo site for a fictional e-signature product, built with
 * svg-scroll-draw:
 *   · the client's signature writes itself on the contract in one continuous
 *     stroke when the contract comes into view (autoplay — at load on a wide
 *     screen, on scroll on a phone); onComplete stamps the document signed
 *   · the three steps' icons draw one after another (stagger)
 *   · the audit trail's rail draws down the page with the reader (onProgress)
 */

const STEPS = [
  {
    t: 'Upload the contract', time: 'About 10 seconds',
    d: 'PDF, Word or one of your templates. Quillmark reads it and finds every line that needs a signature, initials or a date.',
    icon: ['M8 4h11l5 5v19H8z', 'M19 4v5h5', 'M12 16h8M12 20h8M12 24h5'],
  },
  {
    t: 'Place the fields', time: 'About 30 seconds',
    d: 'Check what it found, drag in anything missing and set who signs first. Each signer gets a colour, so nothing lands on the wrong person.',
    icon: ['M5 25 L21 9 l3 3 L8 28 H5z', 'M18 12l3 3', 'M5 28h22'],
  },
  {
    t: 'Send and relax', time: 'Median 47 minutes to signed',
    d: 'Signers get one link — no account, no app. Reminders go out on their own, and everyone gets the sealed PDF and its certificate.',
    icon: ['M4 15 L27 5 L20 27 L15 18z', 'M15 18 L27 5'],
  },
];

const TRAIL: { at: string; who: string; c: string; i: string; what: string; meta?: string; ic: IconName }[] = [
  { at: '09:12:04', who: 'Marta Silva', i: 'MS', c: CC, ic: 'send', what: 'Sent “Lease renewal — Unit 4B” from the Lease renewal (PT) template', meta: '2 signers · 1 copy · signing order on' },
  { at: '09:40:18', who: 'Ada Park', i: 'AP', c: ADA, ic: 'eye', what: 'Opened the document and read all 3 pages', meta: 'iPhone · Safari · Lisbon, PT · 85.240.17.12' },
  { at: '10:01:52', who: 'Ada Park', i: 'AP', c: ADA, ic: 'shield', what: 'Proved who she is with the SMS code sent to +351 ••• ••• 214' },
  { at: '10:02:41', who: 'Ada Park', i: 'AP', c: ADA, ic: 'pen', what: 'Signed page 3 and initialled pages 1 and 2', meta: '3 fields · 1 min 48 s on the signing page' },
  { at: '10:02:43', who: 'Quillmark', i: 'Q', c: '#14213d', ic: 'mail', what: 'Emailed Tomás Reis: it’s his turn to sign' },
  { at: '10:14:57', who: 'Tomás Reis', i: 'TR', c: TOMAS, ic: 'pen', what: 'Countersigned as landlord', meta: 'Mac · Chrome · Porto, PT · 94.63.188.40' },
  { at: '10:15:22', who: 'Quillmark', i: 'Q', c: '#1f8a5b', ic: 'lock', what: 'Sealed the PDF and sent copies to all three', meta: 'SHA-256 1f3a…9c0e · RFC 3161 timestamp' },
];

const CUSTOMERS = ['Harbour Lettings', 'Studio Ortega', 'Fenwick & Bray', 'Brightwell', 'Atlas Rooms', 'Norte Notários'];

const STATS = [
  ['1.2 M', 'documents signed in 2026'],
  ['47 min', 'median from sent to signed'],
  ['98.6%', 'signed from the first link'],
  ['4.9 / 5', 'from 1,200 reviews'],
];

const SIGNER_FEATURES: [IconName, string, string][] = [
  ['globe', 'Opens in any browser', 'No app, no account, no password. The link is theirs alone and closes once they’ve signed.'],
  ['check', 'Guided field by field', 'A Next button walks them to every field, so nothing ever comes back half signed.'],
  ['shield', 'Proves it’s them', 'An email or SMS code on every plan, an ID document check on Business.'],
  ['access', 'Readable by everyone', 'Screen-reader tested and keyboard friendly, to WCAG 2.2 AA, in 24 languages.'],
];

const SEALS = [
  { k: 'eIDAS', s: 'Simple, advanced and qualified signatures in the EU' },
  { k: 'ESIGN', s: 'And UETA: binding in all 50 US states' },
  { k: 'SOC 2', s: 'Type II, audited every year' },
  { k: 'ISO', s: '27001 certified information security' },
  { k: 'GDPR', s: 'Data kept in Frankfurt and Dublin' },
];

const CONTROLS: [IconName, string, string][] = [
  ['lock', 'Encrypted end to end', 'AES-256 at rest and TLS 1.3 in transit. Every sealed PDF is hashed and timestamped, so any change after signing shows.'],
  ['key', 'Access you control', 'SAML single sign-on, SCIM provisioning and two-factor sign-in for every seat. Roles decide who sees which folders.'],
  ['clock', 'Kept as long as you need', 'Keep documents forever, export them to your own storage, or delete them on a schedule your lawyer sets.'],
];

type TField = { l: string; w: 'a' | 't'; x: number; y: number; wd: number };
const TEMPLATES: { n: string; tag: string; meta: string; used: string; title: string; text: string; fields: TField[] }[] = [
  { n: 'Residential lease renewal', tag: 'Property', meta: '2 signers · 9 fields', used: '2,140 firms', title: 'LEASE RENEWAL', text: 'The lease is renewed for twelve months on the terms set out below, at the rent stated in section 2, paid monthly in advance by direct debit.', fields: [{ l: 'Signature', w: 'a', x: 8, y: 74, wd: 38 }, { l: 'Signature', w: 't', x: 54, y: 74, wd: 38 }] },
  { n: 'Mutual NDA', tag: 'Legal', meta: '2 signers · 6 fields', used: '3,870 firms', title: 'MUTUAL NON-DISCLOSURE', text: 'Each party may share confidential information with the other for the purpose of discussing a possible engagement, and will keep it secret.', fields: [{ l: 'Name', w: 'a', x: 8, y: 66, wd: 36 }, { l: 'Signature', w: 'a', x: 8, y: 80, wd: 36 }, { l: 'Signature', w: 't', x: 56, y: 80, wd: 36 }] },
  { n: 'Statement of work', tag: 'Agencies', meta: '2 signers · 11 fields', used: '1,560 firms', title: 'STATEMENT OF WORK', text: 'The studio will deliver the work described in the schedule, in three milestones, for the fixed fee below, invoiced at each milestone.', fields: [{ l: '€ Fee', w: 'a', x: 8, y: 62, wd: 26 }, { l: 'Date', w: 'a', x: 40, y: 62, wd: 22 }, { l: 'Signature', w: 't', x: 8, y: 80, wd: 48 }] },
  { n: 'Freelance contract', tag: 'Agencies', meta: '2 signers · 8 fields', used: '1,210 firms', title: 'FREELANCE AGREEMENT', text: 'The contractor works as an independent business, sets their own hours and keeps the right to show the finished work in their portfolio.', fields: [{ l: 'Initials', w: 'a', x: 70, y: 52, wd: 22 }, { l: 'Signature', w: 'a', x: 8, y: 80, wd: 40 }] },
  { n: 'Offer letter', tag: 'HR', meta: '1 signer · 5 fields', used: '940 firms', title: 'OFFER OF EMPLOYMENT', text: 'We are delighted to offer you the role of Senior Designer, starting on the date below, on a salary of €58,000 a year with 25 days of holiday.', fields: [{ l: 'Start date', w: 'a', x: 8, y: 64, wd: 34 }, { l: 'Signature', w: 'a', x: 8, y: 80, wd: 46 }] },
  { n: 'Photo release', tag: 'Agencies', meta: '1 signer · 4 fields', used: '680 firms', title: 'MODEL RELEASE', text: 'I allow the studio to use photographs taken of me on the date below in print and online, worldwide, without further payment.', fields: [{ l: 'Checkbox', w: 'a', x: 8, y: 64, wd: 30 }, { l: 'Signature', w: 'a', x: 8, y: 80, wd: 44 }] },
];

const INTEGRATIONS = [
  ['GD', 'Google Drive', 'File every sealed PDF in the client’s folder', '#1f8a5b'],
  ['OD', 'OneDrive', 'Send from Word without leaving it', '#2445d6'],
  ['SL', 'Slack', 'Hear the moment a contract is signed', '#7a3fb0'],
  ['HS', 'HubSpot', 'Send from a deal, close it on signature', '#c4500c'],
  ['XR', 'Xero', 'Raise the first invoice when the SOW is signed', '#0e7490'],
  ['ZP', 'Zapier', 'Connect 6,000 other apps, no code', '#b45309'],
];

const TIERS = [
  { n: 'Solo', p: '€12', s: 'a month', d: 'For one person sending their own contracts.', f: ['10 envelopes a month', 'Templates and automatic reminders', 'Audit certificate on every document', 'Email code verification'], cta: 'Start free trial' },
  { n: 'Team', p: '€29', s: 'per user, a month', d: 'For agencies and letting offices.', f: ['Unlimited envelopes', 'Shared templates and your branding', 'Signing order, approvals and bulk send', 'SMS code verification', 'Google Drive, HubSpot and Slack'], cta: 'Start free trial', hot: true },
  { n: 'Business', p: 'Custom', s: 'from 25 users', d: 'For firms with an IT team and an auditor.', f: ['Qualified signatures (eIDAS QES)', 'ID document checks', 'SSO, SCIM and audit log export', 'EU data residency', 'A named account manager'], cta: 'Talk to sales' },
];

const FAQ = [
  ['Is an e-signature legally binding?', 'Yes. Quillmark signatures meet the EU’s eIDAS regulation and the US ESIGN Act and UETA, and are accepted for most contracts in over 180 countries. For the few documents that need more, Business adds qualified signatures, which carry the same weight as a handwritten one across the EU.'],
  ['Do my clients need an account?', 'No. They open the link from their email or a text, prove who they are with a one-time code, and sign. They never set a password and never install anything.'],
  ['What happens if someone edits the PDF afterwards?', 'The sealed PDF carries a SHA-256 hash and a trusted timestamp. Open it in any PDF reader and the signature panel shows it as altered; upload it to quillmark.example/verify and we show exactly which certificate no longer matches.'],
  ['Can I bring my own templates?', 'Upload your Word or PDF contracts once. Quillmark finds the signature lines, you check them, and the template is ready for the whole team, with your logo on the email and the signing page.'],
  ['Where is my data kept?', 'In the EU, in Frankfurt and Dublin, encrypted at rest. Business customers can choose one region only and set their own retention rules.'],
];

/* ── Hero: the contract in the signing room ────────────────────────────── */

function Hero() {
  const [signed, setSigned] = useState(false);
  return (
    <section className="qm-hero">
      <div className="qm-hero-copy">
        <h1 className="qm-h1">Contracts signed before the coffee cools.</h1>
        <p className="qm-lede">Send a lease, an NDA or a statement of work in under a minute. Your client signs on their phone — no account, no app — and you get a sealed PDF with an audit trail a court will accept.</p>
        <div className="qm-ctas">
          <a className="qm-btn" href="#pricing">Send your first contract</a>
          <a className="qm-btn qm-btn-ghost" href="#how">See how it works</a>
        </div>
        <div className="qm-proof">
          <span className="qm-stars" aria-label="4.9 out of 5"><i /><i /><i /><i /><i /><b>4.9</b><small>1,200 reviews</small></span>
          <span className="qm-proof-l"><Ico n="seal" s={20} /><span><b>Legally binding</b><small>eIDAS · ESIGN · UETA</small></span></span>
        </div>
      </div>

      <div className={`qm-stage${signed ? ' is-signed' : ''}`}>
        <div className="qm-room">
          <div className="qm-room-bar">
            <Mark size={22} />
            <span className="qm-room-t"><b>Lease renewal — Unit 4B</b><small>From Harbour Lettings</small></span>
            <span className="qm-room-pg">Page 3 of 3</span>
            <span className="qm-room-btn">{signed ? 'Finish' : 'Next field'}</span>
          </div>
          <div className="qm-room-body">
            <div className="qm-thumbs" aria-hidden="true">
              {[1, 2, 3].map((n) => <span key={n} className={n === 3 ? 'on' : ''}><i /><i /><i /><i /><b>{n}</b></span>)}
            </div>
            <div className="qm-paper">
              <div className="qm-doc-top"><span>Lease renewal — Unit 4B · Rua das Flores 112</span><span>3 / 3</span></div>
              <p className="qm-doc-p"><b>6. Keys and deposit.</b> The deposit of €2,900 already held stays with the Landlord and is returned within thirty days of the keys coming back.</p>
              <h2 className="qm-doc-h">7. Signatures</h2>
              <p className="qm-doc-p">By signing below, the Tenant agrees to renew the lease of Unit 4B for twelve (12) months from 1 December 2026 at a monthly rent of €1,450, on the terms set out in sections 1–6.</p>

              {/* The client's signature writes itself as the contract comes into view */}
              <div className="qm-field">
                <span className="qm-field-tag">{signed ? 'Signed' : 'Sign here'}</span>
                <ScrollDraw className="qm-sig" autoplay duration={2400} delay={500} easing="ease-in-out" once onComplete={() => setSigned(true)}>
                  <svg viewBox="20 40 380 190" role="img" aria-label="Ada Park's signature">
                    <path className="qm-ink" d={SIGNATURE} />
                  </svg>
                </ScrollDraw>
                <div className="qm-field-line" />
                <div className="qm-field-meta"><span>Ada Park · Tenant</span><span>30 Oct 2026</span></div>
              </div>

              <div className="qm-field2">
                <span className="qm-field2-tag">{signed ? 'Tomás Reis · notified 10:02' : 'Signs after Ada'}</span>
                <div className="qm-field-line" />
                <div className="qm-field-meta"><span>Tomás Reis · Landlord</span><span>—</span></div>
              </div>

              <div className="qm-stamp" aria-hidden={!signed}>
                <Ico n="check" s={14} />
                Signed 30 Oct 2026, 10:02 · verified by SMS code
              </div>
            </div>
          </div>
        </div>

        <div className="qm-float qm-float-open" aria-hidden="true">
          <Avatar i="AP" c={ADA} />
          <span><b>Ada Park opened the lease</b><small>Lisbon, PT · iPhone · 09:40</small></span>
        </div>
        <div className="qm-float qm-float-env" aria-live="polite">
          <span className="qm-env-h"><b>Envelope QM-7Q2-4B</b><em>{signed ? '1 of 2 signed' : '0 of 2 signed'}</em></span>
          <span className="qm-env-bar"><i className="a" /><i className="t" /></span>
          <span className="qm-env-n">{signed ? 'Ada signed · Tomás Reis is next' : 'Waiting for Ada Park'}</span>
        </div>
      </div>
    </section>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────── */

function Customers() {
  return (
    <section className="qm-cust" aria-label="Customers">
      <p>6,000 letting agents, studios and law firms send with Quillmark</p>
      <div className="qm-marks">{CUSTOMERS.map((n, i) => <span key={n} className={`w${i + 1}`}>{n}</span>)}</div>
      <dl className="qm-stats">
        {STATS.map(([v, k]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
      </dl>
    </section>
  );
}

function StepUI({ i }: { i: number }) {
  if (i === 0) return (
    <div className="qm-sui">
      <span className="qm-file"><span className="qm-pdf">PDF</span><span><b>Lease-renewal-4B.pdf</b><small>3 pages · 214 KB</small></span></span>
      <span className="qm-found"><Ico n="check" s={13} />9 fields found on 3 pages</span>
    </div>
  );
  if (i === 1) return (
    <div className="qm-sui qm-sui-chips">
      <span className="qm-chip a"><Ico n="pen" s={12} />Signature · Ada</span>
      <span className="qm-chip a"><Ico n="initials" s={12} />Initials · Ada</span>
      <span className="qm-chip a"><Ico n="cal" s={12} />Date</span>
      <span className="qm-chip t"><Ico n="pen" s={12} />Signature · Tomás</span>
    </div>
  );
  return (
    <div className="qm-sui qm-mail">
      <small>Harbour Lettings via Quillmark</small>
      <b>Ada, please review and sign “Lease renewal — Unit 4B”</b>
      <span className="qm-mail-btn">Review and sign</span>
    </div>
  );
}

function Steps() {
  return (
    <section className="qm-sec" id="how">
      <div className="qm-in">
        <div className="qm-head">
          <p className="qm-kick">How it works</p>
          <h2 className="qm-h2">From draft to signed in three steps.</h2>
          <p className="qm-sub">Most contracts go out in under a minute. The signing takes your client less time than reading this page.</p>
        </div>
        <ScrollDraw className="qm-steps" selector=".qm-step-ink" trigger={{ start: 'top 85%', end: 'top 45%' }} stagger={0.12} easing="ease-out" once>
          {STEPS.map((s, i) => (
            <article key={s.t} className="qm-step">
              <div className="qm-step-top">
                <svg className="qm-step-icon" viewBox="0 0 32 32" aria-hidden="true">
                  {s.icon.map((d, k) => <path key={k} className="qm-step-ink" d={d} />)}
                </svg>
                <span className="qm-step-n">0{i + 1}</span>
              </div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <StepUI i={i} />
              <span className="qm-step-time"><Ico n="clock" s={14} />{s.time}</span>
            </article>
          ))}
        </ScrollDraw>
      </div>
    </section>
  );
}

function EditorSec() {
  return (
    <section className="qm-sec qm-alt" id="editor">
      <div className="qm-in">
        <div className="qm-head qm-head-row">
          <div>
            <p className="qm-kick">The editor</p>
            <h2 className="qm-h2">Drop in the PDF. Quillmark finds every line that needs a name.</h2>
          </div>
          <ul className="qm-ticks">
            <li><Ico n="check" s={16} />Signature lines found by reading the words around them</li>
            <li><Ico n="check" s={16} />A colour per signer, so fields never cross</li>
            <li><Ico n="check" s={16} />Initials that repeat on every page in one click</li>
          </ul>
        </div>
        <Editor />
      </div>
    </section>
  );
}

function Signer() {
  return (
    <section className="qm-sec" id="signer">
      <div className="qm-in qm-signer">
        <div className="qm-signer-copy">
          <p className="qm-kick">For your clients</p>
          <h2 className="qm-h2">They sign on their phone, on the bus, in under two minutes.</h2>
          <ul className="qm-feats">
            {SIGNER_FEATURES.map(([k, t, d]) => (
              <li key={t}><span className="qm-feat-i"><Ico n={k} s={18} /></span><span><b>{t}</b><span>{d}</span></span></li>
            ))}
          </ul>
        </div>
        <div className="qm-signer-art">
          <div className="qm-signer-glow" aria-hidden="true" />
          <SignerPhone />
          <div className="qm-float qm-float-sms" aria-hidden="true">
            <span className="qm-sms-i"><Ico n="phone" s={16} /></span>
            <span><small>Messages · now</small><b>Your Quillmark code is 482 913</b></span>
          </div>
          <div className="qm-float qm-float-done" aria-hidden="true">
            <span className="qm-done-i"><Ico n="check" s={15} /></span>
            <span><b>Signed in 1 min 48 s</b><small>No account, no app</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trail() {
  const trail = useRef<HTMLOListElement>(null);
  const onTrail = useCallback((p: number) => trail.current?.style.setProperty('--p', p.toFixed(3)), []);
  return (
    <section className="qm-sec qm-alt" id="trail">
      <div className="qm-in qm-trail-sec">
        <div className="qm-trail-copy">
          <p className="qm-kick">Audit trail</p>
          <h2 className="qm-h2">Every view, signature and seal, on the record.</h2>
          <p className="qm-sub">Each document carries a tamper-evident log: who opened it, from where, how they proved who they are, and the hash of the sealed file. Hand the certificate to a court, an auditor or a nervous client.</p>
          <Certificate />
        </div>
        <div className="qm-trail-col">
          <p className="qm-trail-day">Friday 30 October 2026 <span>All times WET</span></p>
          <ScrollDraw className="qm-trail" selector=".qm-rail" trigger={{ start: 'top 75%', end: 'bottom 70%' }} easing="linear" once onProgress={onTrail}>
            <svg className="qm-rail-svg" viewBox="0 0 2 1000" preserveAspectRatio="none" aria-hidden="true"><path className="qm-rail" d="M1 0 V1000" /></svg>
            <ol className="qm-events" ref={trail}>
              {TRAIL.map((e, i) => (
                <li key={e.at} style={{ '--at': (i / (TRAIL.length - 1)) * 0.92 } as CSSProperties}>
                  <span className="qm-dot"><Ico n={e.ic} s={13} /></span>
                  <div className="qm-ev">
                    <span className="qm-ev-h"><Avatar i={e.i} c={e.c} /><b>{e.who}</b><time>{e.at}</time></span>
                    <span className="qm-what">{e.what}</span>
                    {e.meta && <span className="qm-meta">{e.meta}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </ScrollDraw>
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section className="qm-sec qm-dark" id="security">
      <div className="qm-in">
        <div className="qm-head">
          <p className="qm-kick">Security and compliance</p>
          <h2 className="qm-h2">Binding in court. Boring to audit.</h2>
          <p className="qm-sub">Quillmark signatures hold up under the laws your clients sign under, and the reports your auditor asks for are one click away in the trust centre.</p>
        </div>
        <ul className="qm-seals">
          {SEALS.map((s) => (
            <li key={s.k}><span className="qm-seal"><b>{s.k}</b></span><span>{s.s}</span></li>
          ))}
        </ul>
        <div className="qm-controls">
          {CONTROLS.map(([k, t, d]) => (
            <div key={t}><Ico n={k} s={20} /><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Templates() {
  return (
    <section className="qm-sec" id="templates">
      <div className="qm-in">
        <div className="qm-head qm-head-row">
          <div>
            <p className="qm-kick">Templates</p>
            <h2 className="qm-h2">Start from a contract your lawyer already likes.</h2>
          </div>
          <div className="qm-filter" aria-hidden="true"><span className="on">All</span><span>Property</span><span>Agencies</span><span>Legal</span><span>HR</span></div>
        </div>
        <div className="qm-tpls">
          {TEMPLATES.map((t) => (
            <article key={t.n} className="qm-tpl">
              <TemplateThumb title={t.title} text={t.text} fields={t.fields} />
              <div className="qm-tpl-b">
                <span className="qm-tpl-tag">{t.tag}</span>
                <h3>{t.n}</h3>
                <p>{t.meta}<span>Used by {t.used}</span></p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section className="qm-sec qm-alt" id="integrations">
      <div className="qm-in qm-int">
        <div>
          <p className="qm-kick">Integrations and API</p>
          <h2 className="qm-h2">Send from where the contract already lives.</h2>
          <ul className="qm-apps">
            {INTEGRATIONS.map(([m, n, d, t]) => (
              <li key={n}><span className="qm-app-m" style={{ '--t': t } as CSSProperties}>{m}</span><span><b>{n}</b><small>{d}</small></span></li>
            ))}
          </ul>
        </div>
        <div className="qm-api">
          <div className="qm-api-bar"><b>POST</b><span>/v1/envelopes</span><em>201 · 212 ms</em></div>
          <pre>{`{
  `}<span className="k">&quot;template&quot;</span>{`: `}<span className="s">&quot;lease-renewal-pt&quot;</span>{`,
  `}<span className="k">&quot;signers&quot;</span>{`: [
    { `}<span className="k">&quot;name&quot;</span>{`: `}<span className="s">&quot;Ada Park&quot;</span>{`, `}<span className="k">&quot;verify&quot;</span>{`: `}<span className="s">&quot;sms&quot;</span>{` },
    { `}<span className="k">&quot;name&quot;</span>{`: `}<span className="s">&quot;Tomás Reis&quot;</span>{`, `}<span className="k">&quot;order&quot;</span>{`: `}<span className="n">2</span>{` }
  ],
  `}<span className="k">&quot;fields&quot;</span>{`: { `}<span className="k">&quot;rent&quot;</span>{`: `}<span className="s">&quot;€1,450&quot;</span>{`, `}<span className="k">&quot;unit&quot;</span>{`: `}<span className="s">&quot;4B&quot;</span>{` },
  `}<span className="k">&quot;webhook&quot;</span>{`: `}<span className="s">&quot;https://harbour.example/hooks/qm&quot;</span>{`
}`}</pre>
          <div className="qm-api-ev">
            <span className="qm-api-dot" />
            <code>envelope.completed</code>
            <span>QM-7Q2-4B · sealed PDF and certificate attached</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="qm-story">
      <div className="qm-in qm-story-in">
        <blockquote>
          <p>“We used to print the lease, post it, chase it and scan it. Now renewals come back before the tenant has left the viewing — and the certificate has settled two deposit disputes for us this year.”</p>
          <footer><Avatar i="MS" c={CC} /><span><b>Marta Silva</b><small>Lettings manager, Harbour Lettings · Lisbon</small></span></footer>
        </blockquote>
        <dl className="qm-story-n">
          <div><dt>Time to a signed lease</dt><dd><s>3.2 days</s>47 min</dd></div>
          <div><dt>Paper per renewal</dt><dd><s>14 sheets</s>0</dd></div>
          <div><dt>Renewals sent in 2026</dt><dd>1,318</dd></div>
        </dl>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="qm-sec" id="pricing">
      <div className="qm-in">
        <div className="qm-head qm-center">
          <p className="qm-kick">Pricing</p>
          <h2 className="qm-h2">Simple pricing. Unlimited signers on every plan.</h2>
          <div className="qm-bill" aria-hidden="true"><span>Monthly</span><span className="on">Yearly <em>2 months free</em></span></div>
        </div>
        <div className="qm-tiers">
          {TIERS.map((t) => (
            <div key={t.n} className={`qm-tier${t.hot ? ' hot' : ''}`}>
              {t.hot && <span className="qm-tier-pop">Most firms pick this</span>}
              <h3>{t.n}</h3>
              <p className="qm-tier-d">{t.d}</p>
              <p className="qm-price"><b>{t.p}</b> {t.s}</p>
              <ul>{t.f.map((x) => <li key={x}><Ico n="check" s={15} />{x}</li>)}</ul>
              <a className={`qm-btn${t.hot ? '' : ' qm-btn-ghost'}`} href="#pricing">{t.cta}</a>
            </div>
          ))}
        </div>
        <p className="qm-every">Every plan: 14-day free trial, no card · audit certificate · mobile signing · eIDAS, ESIGN and UETA compliant</p>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="qm-sec qm-alt" id="faq">
      <div className="qm-in qm-faq">
        <div>
          <p className="qm-kick">Questions</p>
          <h2 className="qm-h2">What firms ask before they switch.</h2>
          <p className="qm-sub">Something else? Write to hello@quillmark.example — a person in Lisbon answers within the working day.</p>
        </div>
        <div className="qm-qs">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<Ico n="plus" s={18} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="qm-cta">
      <div className="qm-cta-in">
        <h2>Your next contract could be signed by lunch.</h2>
        <p>Fourteen days free, with every feature of Team. No card, and your first three envelopes are on us forever.</p>
        <div className="qm-ctas">
          <a className="qm-btn qm-btn-light" href="#pricing">Send your first contract</a>
          <a className="qm-btn qm-btn-line" href="#pricing">Book a 15-minute demo</a>
        </div>
      </div>
    </section>
  );
}

export function QuillmarkSite() {
  return (
    <Site
      className="qm"
      brand={<><Mark />Quillmark</>}
      links={['Product', 'Templates', 'Security', 'Pricing', 'Log in']}
      cta="Try it free"
      example="signature"
      apis="one stroke · autoplay · onComplete · onProgress"
      footnote="E-signatures for small firms · Lisbon and Leeds"
    >
      <Hero />
      <Customers />
      <Steps />
      <EditorSec />
      <Signer />
      <Trail />
      <Security />
      <Templates />
      <Integrations />
      <Story />
      <Pricing />
      <Faq />
      <Cta />
    </Site>
  );
}
