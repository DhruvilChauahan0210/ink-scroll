import type { CSSProperties, ReactNode } from 'react';
import { SIGNATURE } from '@/components/home/art/usecase-art';

/* The product UI the Quillmark site is built from: icons, the editor, the
   signer's phone, the audit certificate and the template thumbnails. All of
   it is HTML and CSS with fixed data, so the server and the browser agree. */

const PATHS = {
  check: 'M5 10.5l3.2 3.2L15 7',
  pen: 'M4 16l1-4 8-8 3 3-8 8-4 1z M11.5 5.5l3 3',
  initials: 'M3 15l3-9 3 9 M4.2 12h3.6 M12 15V6h2.6a2.2 2.2 0 0 1 0 4.5H12',
  cal: 'M3.5 5.5h13v11h-13z M3.5 9h13 M7 3.5v3 M13 3.5v3',
  user: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4 17c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5',
  text: 'M4.5 5h11 M10 5v11 M7.5 16h5',
  box: 'M4.5 4.5h11v11h-11z M7 10l2 2 4-4',
  drop: 'M3.5 6.5h13v7h-13z M11.5 9l1.5 1.5L14.5 9',
  clip: 'M13.5 7l-5.3 5.3a1.6 1.6 0 0 0 2.3 2.3l5.6-5.6a3 3 0 0 0-4.3-4.3L6 10.5a4.4 4.4 0 0 0 6.2 6.2l4.3-4.3',
  lock: 'M5 9h10v8H5z M7 9V6.5a3 3 0 0 1 6 0V9',
  shield: 'M10 2.5l6 2.5v4.5c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8V5z M7.3 10l2 2 3.5-3.7',
  mail: 'M3 5h14v10H3z M3.5 5.5l6.5 5 6.5-5',
  phone: 'M6.5 2.5h7v15h-7z M9 15h2',
  globe: 'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z M2.5 10h15 M10 2.5c2 2.2 2.8 4.7 2.8 7.5s-.8 5.3-2.8 7.5c-2-2.2-2.8-4.7-2.8-7.5s.8-5.3 2.8-7.5z',
  eye: 'M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z M10 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z',
  clock: 'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z M10 6v4.3l2.8 1.7',
  doc: 'M5 2.5h7l3.5 3.5v11.5H5z M12 2.5V6h3.5',
  send: 'M3 9.5L17 3l-6.5 14-2-5.5z M8.5 11.5L17 3',
  down: 'M6 8l4 4 4-4',
  left: 'M12 5l-5 5 5 5',
  seal: 'M10 2.5l1.8 1.3 2.2-.1.7 2.1 1.8 1.3-.7 2.1.7 2.1-1.8 1.3-.7 2.1-2.2-.1L10 17.5l-1.8-1.3-2.2.1-.7-2.1-1.8-1.3.7-2.1-.7-2.1 1.8-1.3.7-2.1 2.2.1z M7.3 10l2 2 3.5-3.7',
  key: 'M7 13a3.5 3.5 0 1 1 2.8-1.4L16 17.5 M13.5 15l1.5-1.5',
  upload: 'M10 13V3.5 M6.5 7L10 3.5 13.5 7 M3.5 13v3.5h13V13',
  access: 'M10 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M4 7.5l6 1 6-1 M10 8.5v4 M7.5 17.5l2.5-5 2.5 5',
  bell: 'M5.5 13.5V9a4.5 4.5 0 0 1 9 0v4.5l1.5 1.5h-12z M8.5 17h3',
  plus: 'M10 4.5v11 M4.5 10h11',
  zoom: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M13.5 13.5L17 17',
  copy: 'M7 7h9.5v9.5H7z M4 13V4h9',
} as const;

export type IconName = keyof typeof PATHS;

export function Ico({ n, s = 18 }: { n: IconName; s?: number }) {
  return (
    <svg className="qm-i" viewBox="0 0 20 20" width={s} height={s} aria-hidden="true">
      <path d={PATHS[n]} />
    </svg>
  );
}

export const Mark = ({ size = 24 }: { size?: number }) => (
  <svg className="qm-mark" viewBox="0 0 28 28" width={size} height={size} aria-hidden="true">
    <rect width="28" height="28" rx="8" fill="#14213d" />
    <path d="M7 20.5c3-1.2 5.6-5.4 8.2-9.6 1.2-2 2.6-3.6 4.6-4.4-.6 3.4-2.6 6.8-5.4 9.4" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 21.5h14" stroke="#7d93ff" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

/** A static copy of Ada's signature, for the phone pad and the certificate. */
export const SigStatic = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="20 40 380 190" aria-hidden="true">
    <path d={SIGNATURE} />
  </svg>
);

export const Avatar = ({ i, c }: { i: string; c: string }) => (
  <span className="qm-av" style={{ '--c': c } as CSSProperties}>{i}</span>
);

export const ADA = '#2445d6';
export const TOMAS = '#c46a0c';
export const CC = '#6b7385';

/* ── The editor ────────────────────────────────────────────────────────── */

const FIELDS: [IconName, string, string?][] = [
  ['pen', 'Signature', '2'],
  ['initials', 'Initials', '3'],
  ['cal', 'Date signed', '1'],
  ['user', 'Full name'],
  ['text', 'Text'],
  ['box', 'Checkbox', '1'],
  ['drop', 'Dropdown'],
  ['clip', 'Attachment'],
];

function Field({ who, kind, label, style, sel, children }: { who: 'a' | 't'; kind: IconName; label: string; style?: CSSProperties; sel?: boolean; children?: ReactNode }) {
  return (
    <span className={`qm-pf is-${who}${sel ? ' is-sel' : ''}`} style={style}>
      <Ico n={kind} s={13} />
      <span>{label}</span>
      {children}
    </span>
  );
}

export function Editor() {
  return (
    <div className="qm-ed" role="img" aria-label="The Quillmark editor: a lease on the canvas with signature, initials, date and text fields placed for two signers, the field palette on the left and the recipients and their signing order on the right">
      <div className="qm-ed-bar">
        <span className="qm-ed-back"><Ico n="left" s={16} /></span>
        <span className="qm-ed-doc"><b>Lease renewal — Unit 4B.pdf</b><small>Saved 09:11 · 3 pages</small></span>
        <span className="qm-ed-mid"><span className="qm-ed-pg">Page <b>1</b> / 3</span><span className="qm-ed-zoom"><Ico n="zoom" s={14} />100%</span></span>
        <span className="qm-ed-act"><span className="qm-ed-ghost"><Ico n="eye" s={15} />Preview</span><span className="qm-ed-send"><Ico n="send" s={15} />Send to 2 signers</span></span>
      </div>

      <div className="qm-ed-body">
        <aside className="qm-ed-left">
          <p className="qm-ed-h">Fields for</p>
          <span className="qm-ed-who"><i style={{ background: ADA }} />Ada Park<small>Tenant</small><Ico n="down" s={14} /></span>
          <ul className="qm-ed-fields">
            {FIELDS.map(([k, n, c]) => (
              <li key={n}><Ico n={k} s={15} />{n}{c && <em>{c}</em>}</li>
            ))}
          </ul>
          <div className="qm-ed-auto">
            <b><Ico n="check" s={14} />Found 9 fields</b>
            <span>Signature lines, initials and dates on all 3 pages, matched to each signer by name.</span>
            <span className="qm-ed-auto-btn">Review</span>
          </div>
        </aside>

        <div className="qm-ed-canvas">
          <div className="qm-ed-page">
            <p className="qm-ed-t">Residential lease renewal</p>
            <p className="qm-ed-s">Unit 4B · Rua das Flores 112 · 1200-195 Lisboa</p>
            <p>This renewal is made on 30 October 2026 between <b>Tomás Reis</b> (the Landlord) and <b>Ada Park</b> (the Tenant), and continues the lease signed on 14 November 2024.</p>
            <p><b>1. Term.</b> The lease is renewed for twelve (12) months, from 1 December 2026 to 30 November 2027, and may be ended by either party with sixty days’ written notice.</p>
            <p><b>2. Rent.</b> €1,450 a month, paid by direct debit on the first working day of each month from the Tenant’s account below.</p>
            <Field who="a" kind="text" label="IBAN · Ada Park" style={{ width: '58%' }} />
            <p><b>3. House rules.</b> The Tenant has read the building’s house rules in Annex B, including the quiet hours from 23:00 to 07:00.</p>
            <Field who="a" kind="box" label="I have read Annex B" style={{ width: '44%' }} />
            <div className="qm-ed-foot">
              <span>Initials</span>
              <Field who="a" kind="initials" label="AP" sel>
                <i className="qm-h tl" /><i className="qm-h tr" /><i className="qm-h bl" /><i className="qm-h br" />
              </Field>
              <Field who="t" kind="initials" label="TR" />
              <span className="qm-ed-pn">1 of 3</span>
            </div>
            <div className="qm-ed-pop">
              <b><i style={{ background: ADA }} />Initials · Ada Park</b>
              <span className="qm-ed-row">Required<i className="qm-sw on" /></span>
              <span className="qm-ed-row">Repeat on every page<i className="qm-sw on" /></span>
              <span className="qm-ed-row muted">Pages 1–3 · 52 × 28 px</span>
            </div>
          </div>
        </div>

        <aside className="qm-ed-right">
          <p className="qm-ed-h">Recipients <span className="qm-ed-order">Signing order<i className="qm-sw on" /></span></p>
          <ol className="qm-ed-rcp">
            <li><em>1</em><Avatar i="AP" c={ADA} /><span><b>Ada Park</b><small>ada.park@mail.example</small></span><span className="qm-tag a">Tenant · signs</span></li>
            <li><em>2</em><Avatar i="TR" c={TOMAS} /><span><b>Tomás Reis</b><small>t.reis@mail.example</small></span><span className="qm-tag t">Landlord · signs</span></li>
            <li><em>·</em><Avatar i="HL" c={CC} /><span><b>Harbour Lettings</b><small>accounts@harbour.example</small></span><span className="qm-tag c">Gets a copy</span></li>
          </ol>
          <p className="qm-ed-h">Settings</p>
          <dl className="qm-ed-set">
            <div><dt><Ico n="shield" s={15} />Verify identity</dt><dd>SMS code</dd></div>
            <div><dt><Ico n="bell" s={15} />Reminders</dt><dd>Every 2 days</dd></div>
            <div><dt><Ico n="clock" s={15} />Expires</dt><dd>In 14 days</dd></div>
            <div><dt><Ico n="globe" s={15} />Signing page</dt><dd>Signer’s language</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

/* ── The signer's phone ────────────────────────────────────────────────── */

export function SignerPhone() {
  return (
    <div className="qm-phone" role="img" aria-label="Ada signs on her phone: the lease with a guided Next button, and the sheet where she draws her signature and taps Adopt and sign">
      <div className="qm-ph-screen">
        <div className="qm-ph-status"><b>9:41</b><span><i /><i /><i /></span></div>
        <div className="qm-ph-head">
          <small>Harbour Lettings sent you</small>
          <b>Lease renewal — Unit 4B</b>
          <span className="qm-ph-prog"><i style={{ width: '66%' }} /></span>
          <span className="qm-ph-step">Field 2 of 3 · page 3</span>
        </div>
        <div className="qm-ph-doc">
          <p><b>7. Signatures.</b> By signing below, the Tenant agrees to renew the lease of Unit 4B for twelve months from 1 December 2026 at €1,450 a month.</p>
          <span className="qm-ph-field">Tap to sign</span>
        </div>
        <div className="qm-ph-sheet">
          <i className="qm-ph-grab" />
          <b className="qm-ph-sheet-h">Adopt your signature</b>
          <span className="qm-ph-tabs"><span className="on">Draw</span><span>Type</span><span>Upload</span></span>
          <div className="qm-ph-pad">
            <SigStatic className="qm-ph-sig" />
            <i className="qm-ph-line" />
            <span className="qm-ph-name">Ada Park<em>Clear</em></span>
          </div>
          <span className="qm-ph-consent"><i><Ico n="check" s={11} /></i>I agree to sign electronically and to receive records by email.</span>
          <span className="qm-ph-btn">Adopt and sign</span>
        </div>
      </div>
    </div>
  );
}

/* ── The audit certificate ─────────────────────────────────────────────── */

export function Certificate() {
  return (
    <article className="qm-cert" aria-label="Certificate of completion for the lease renewal">
      <header className="qm-cert-h">
        <span className="qm-cert-seal"><Ico n="seal" s={26} /></span>
        <span><b>Certificate of completion</b><small>Envelope QM-7Q2-4B · 2 of 2 signed</small></span>
        <span className="qm-cert-ok">Completed</span>
      </header>
      <dl className="qm-cert-dl">
        <div><dt>Document</dt><dd>Lease renewal — Unit 4B.pdf · 3 pages</dd></div>
        <div><dt>Sent by</dt><dd>Marta Silva, Harbour Lettings</dd></div>
        <div><dt>Sealed</dt><dd>Fri 30 Oct 2026, 10:15:22 WET</dd></div>
        <div className="qm-cert-hash"><dt>SHA-256</dt><dd>1f3a 6be0 94c2 d71e 0a58 3f9b c2e4 7d10 5aa8 e391 7bc6 02f4 de58 a6c1 3b77 9c0e</dd></div>
      </dl>
      <div className="qm-cert-signers">
        <div className="qm-cert-s">
          <SigStatic className="qm-cert-sig" />
          <b>Ada Park <span>Tenant</span></b>
          <small>ada.park@mail.example · SMS code</small>
          <small>10:02:41 · 85.240.17.12 · Lisbon · iPhone</small>
        </div>
        <div className="qm-cert-s">
          <span className="qm-cert-typed">Tomás Reis</span>
          <b>Tomás Reis <span>Landlord</span></b>
          <small>t.reis@mail.example · email code</small>
          <small>10:14:57 · 94.63.188.40 · Porto · Mac</small>
        </div>
      </div>
      <footer className="qm-cert-f"><Ico n="lock" s={14} />Timestamped under RFC 3161 · verify at quillmark.example/verify</footer>
    </article>
  );
}

/* ── Template thumbnails ───────────────────────────────────────────────── */

export function TemplateThumb({ title, text, fields }: { title: string; text: string; fields: { l: string; w: 'a' | 't'; x: number; y: number; wd: number }[] }) {
  return (
    <div className="qm-tp" aria-hidden="true">
      <b>{title}</b>
      <p>{text}</p>
      <i>2. Terms</i>
      <p>{text}</p>
      {fields.map((f) => (
        <span key={f.l + f.x} className={`qm-tp-f is-${f.w}`} style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.wd}%` }}>{f.l}</span>
      ))}
    </div>
  );
}
