import type { CSSProperties, ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/* Plugboard — the app icons, the directory data and the flow editor the
   page is built around. Every icon is a brand-colour tile with a white line
   glyph, drawn here; the editor is HTML and CSS. */

export const Mark = ({ size = 26 }: { size?: number }) => (
  <svg className="pb-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#16141c" />
    <rect x="7" y="7" width="18" height="18" rx="5.5" fill="#ff5a36" />
    <rect x="11.6" y="11" width="2.8" height="7" rx="1.4" fill="#fff" />
    <rect x="17.6" y="11" width="2.8" height="7" rx="1.4" fill="#fff" />
    <circle cx="16" cy="21.4" r="1.5" fill="#fff" />
  </svg>
);

export const GLYPH = {
  paygrid: ['M4 7h16v10H4z', 'M4 10.5h16', 'M7.5 14h3.5'],
  quillmark: ['M5 19c3-7 7-12 14-14-2 5-6 9-11 11', 'M5 19h7'],
  ledgerline: ['M4 17l4.5-5 3.5 3 7.5-8.5', 'M15 6.5h4.5V11'],
  inkbox: ['M4 6.5h16v11H4z', 'M4.5 7.5l7.5 5.5 7.5-5.5'],
  calla: ['M5 6h14v13H5z', 'M5 10h14', 'M9 4v4M15 4v4', 'M9 14h2'],
  formwell: ['M6.5 4h11v16h-11z', 'M9 8.5h6M9 12h6M9 15.5h3.5'],
  sheetly: ['M4.5 5h15v14h-15z', 'M4.5 9.7h15M4.5 14.3h15', 'M10 5v14'],
  parcelry: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4M12 12v8'],
  hearth: ['M6 8.5h12l-1 11.5H7z', 'M9 8.5V7a3 3 0 0 1 6 0v1.5'],
  relay: ['M5 6h14v9.5h-8.5L6.5 19v-3.5H5z', 'M8.5 10.5h7'],
  tessera: ['M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z'],
  mint: ['M6 18.5C6 11 10 6 18 6c0 7.8-4.2 12.5-12 12.5z', 'M6 18.5l7-7'],
  ai: ['M12 4l1.8 4.6L18.5 10l-4.7 1.6L12 16l-1.8-4.4L5.5 10l4.7-1.4z', 'M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'],
  filter: ['M4.5 6h15l-6 7v5l-3 1.5V13z'],
  paths: ['M12 4v5', 'M12 9c0 4-6 3-6 8v2.5M12 9c0 4 6 3 6 8v2.5'],
  webhook: ['M9 7.5a3 3 0 1 1 4.5 2.6L16 15', 'M6.5 16.5a3 3 0 1 0 5.4-1.8h6', 'M17.5 18.5a3 3 0 1 0-2-5.2'],
  clock: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 8v4.5l3 1.8'],
} as const;

export type GlyphKey = keyof typeof GLYPH;

export const APPCOLOR: Record<GlyphKey, string> = {
  paygrid: '#12a150', quillmark: '#2445d6', ledgerline: '#5146e5', inkbox: '#d6246e', calla: '#7c3aed', formwell: '#0891b2',
  sheetly: '#13804a', parcelry: '#ea580c', hearth: '#3b6b50', relay: '#0b84d8', tessera: '#1f6fd0', mint: '#0c7a54',
  ai: '#16141c', filter: '#6b6876', paths: '#ff5a36', webhook: '#c2410c', clock: '#6b6876',
};

export function AppIcon({ g, size = 40, className = '' }: { g: GlyphKey; size?: number; className?: string }) {
  return (
    <span className={`pb-ico ${className}`} style={{ '--h': APPCOLOR[g], width: size, height: size } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 24 24">{GLYPH[g].map((d) => <path key={d} d={d} />)}</svg>
    </span>
  );
}

export const APPS: { g: GlyphKey; n: string; c: string; d: string; t: number; a: number; badge?: 'Popular' | 'New' | 'Premium' }[] = [
  { g: 'paygrid', n: 'Paygrid', c: 'Payments', d: 'Invoices, subscriptions and payouts', t: 14, a: 31, badge: 'Popular' },
  { g: 'quillmark', n: 'Quillmark', c: 'E-signatures', d: 'Send, sign and seal contracts', t: 6, a: 12, badge: 'Popular' },
  { g: 'sheetly', n: 'Sheetly', c: 'Spreadsheets', d: 'Rows, sheets and lookups', t: 5, a: 18, badge: 'Popular' },
  { g: 'relay', n: 'Relay', c: 'Team chat', d: 'Channels, threads and DMs', t: 9, a: 16, badge: 'Popular' },
  { g: 'hearth', n: 'Hearth & Field', c: 'Storefront', d: 'Orders, stock and customers', t: 11, a: 20 },
  { g: 'parcelry', n: 'Parcelry', c: 'Shipping', d: 'Labels, couriers and tracking', t: 7, a: 14 },
  { g: 'inkbox', n: 'Inkbox', c: 'Email', d: 'Shared inboxes for teams', t: 8, a: 11 },
  { g: 'ledgerline', n: 'Ledgerline', c: 'Analytics', d: 'Revenue dashboards and alerts', t: 4, a: 9, badge: 'Premium' },
  { g: 'calla', n: 'Calla', c: 'Scheduling', d: 'Booking pages and calendars', t: 6, a: 8 },
  { g: 'formwell', n: 'Formwell', c: 'Forms', d: 'Forms, quizzes and surveys', t: 3, a: 6, badge: 'New' },
  { g: 'tessera', n: 'Tessera', c: 'Docs & wiki', d: 'Pages, databases and wikis', t: 5, a: 13 },
  { g: 'mint', n: 'Mint & Co Business', c: 'Banking', d: 'Transactions and balance alerts', t: 6, a: 4, badge: 'New' },
];

/* ── The flow editor ─────────────────────────────────────────────────── */

const Wire = ({ h = 44 }: { h?: number }) => (
  <span className="pb-link" style={{ height: h }}>
    <svg viewBox={`0 0 12 ${h}`} width="12" height={h} aria-hidden="true"><path className="pb-wire" d={`M6 0 V${h}`} /></svg>
    <i className="pb-plus" aria-hidden="true" />
  </span>
);

function Node({ g, step, app, title, sub, kind = 'Action', on = false, ok = true }: { g: GlyphKey; step: string; app: string; title: string; sub: string; kind?: string; on?: boolean; ok?: boolean }) {
  return (
    <div className={`pb-node${on ? ' on' : ''}`}>
      <AppIcon g={g} size={34} />
      <span className="pb-node-t">
        <small>{step} · {kind} · {app}</small>
        <b>{title}</b>
        <em>{sub}</em>
      </span>
      {ok && <span className="pb-node-ok" aria-hidden="true" />}
    </div>
  );
}

const RUN = [
  { n: 'New paid order', ms: 80, at: 0 },
  { n: 'Create invoice', ms: 610, at: 80 },
  { n: 'Path A · Ships in the UK', ms: 12, at: 690 },
  { n: 'Book a courier', ms: 730, at: 702 },
];

export function Editor() {
  return (
    <div className="pb-win" role="img" aria-label="The Plugboard flow editor: a new paid order in Hearth & Field creates a Paygrid invoice, then splits by destination to book a courier or post in a Relay channel. The invoice step is open in the inspector and the last run succeeded in 1.43 seconds.">
      <div className="pb-bar">
        <span className="pb-lights"><i /><i /><i /></span>
        <span className="pb-crumb"><span>Finance ops</span><b>Paid order → invoice → courier</b></span>
        <span className="pb-bar-r">
          <span className="pb-saved">Saved</span>
          <span className="pb-avas"><i>RM</i><i>JT</i></span>
          <span className="pb-live"><i />On</span>
          <b className="pb-publish">Publish</b>
        </span>
      </div>
      <div className="pb-body">
        <aside className="pb-rail" aria-hidden="true">
          {(['paths', 'webhook', 'clock', 'filter'] as const).map((k, i) => (
            <span key={k} className={i === 0 ? 'on' : ''}><svg viewBox="0 0 24 24">{GLYPH[k].map((d) => <path key={d} d={d} />)}</svg></span>
          ))}
        </aside>

        <ScrollDraw className="pb-canvas" autoplay duration={1100} delay={200} stagger={0.3} easing="ease-in-out" once selector=".pb-wire">
          <div className="pb-chain">
            <Node g="hearth" step="1" kind="Trigger" app="Hearth & Field" title="New paid order" sub="Order #HF-20481 · £86.00" />
            <Wire />
            <Node g="paygrid" step="2" app="Paygrid" title="Create invoice" sub="Ada Park · £86.00 · on receipt" on />
            <Wire />
            <Node g="paths" step="3" kind="Paths" app="Built-in" title="Split by destination" sub="2 paths · first match wins" />
            <svg className="pb-fork" viewBox="0 0 400 52" aria-hidden="true">
              <path className="pb-wire" d="M200 0 V10 C200 30 100 22 100 42 V52" />
              <path className="pb-wire" d="M200 0 V10 C200 30 300 22 300 42 V52" />
            </svg>
            <div className="pb-branches">
              <div>
                <span className="pb-cond">A · Ships in the UK</span>
                <Wire h={22} />
                <Node g="parcelry" step="4A" app="Parcelry" title="Book a courier" sub="Next-day · 2 parcels" />
              </div>
              <div>
                <span className="pb-cond is-b">B · Ships abroad</span>
                <Wire h={22} />
                <Node g="relay" step="4B" app="Relay" title="Post in #exports" sub="Order and customs link" ok={false} />
              </div>
            </div>
          </div>

          <div className="pb-zoom" aria-hidden="true"><span>−</span><b>100%</b><span>+</span><span className="pb-fit">Fit</span></div>

          <div className="pb-runlog">
            <p className="pb-runlog-h"><span className="pb-ok-dot">Success</span><b>Run #18,204</b><span>Today 10:02:14 · test order #HF-20481</span><em>1.43 s</em></p>
            {RUN.map((r, i) => (
              <span key={r.n} className="pb-run-row">
                <i className="pb-tick" />
                <span className="pb-run-n"><em>{i + 1}</em>{r.n}</span>
                <span className="pb-run-bar"><b style={{ left: `${(r.at / 1432) * 100}%`, width: `${Math.max(1.2, (r.ms / 1432) * 100)}%` }} /></span>
                <em>{r.ms < 100 ? `${r.ms} ms` : `${(r.ms / 1000).toFixed(2)} s`}</em>
              </span>
            ))}
          </div>
        </ScrollDraw>

        <aside className="pb-insp" aria-hidden="true">
          <div className="pb-insp-h">
            <AppIcon g="paygrid" size={30} />
            <span><b>2. Create invoice</b><small>Paygrid · Action</small></span>
            <i className="pb-x" />
          </div>
          <div className="pb-tabs"><span>Setup</span><span className="on">Configure</span><span>Test</span></div>
          <Field label="Customer email" req><Pill g="hearth" n="1" f="Customer email" v="ada@parkhouse.co" /></Field>
          <Field label="Amount" req><Pill g="hearth" n="1" f="Order total" v="86.00" /></Field>
          <Field label="Currency"><span className="pb-select">GBP — Pound sterling</span></Field>
          <Field label="Line items"><Pill g="hearth" n="1" f="Line items" v="3 items" /></Field>
          <Field label="Due"><span className="pb-select">On receipt</span></Field>
          <span className="pb-switch-row"><span>Email the invoice to the customer</span><i className="on" /></span>
          <div className="pb-insp-f"><span className="pb-ghost">Test step</span><b>Continue</b></div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return <div className="pb-field"><p>{label}{req && <em>*</em>}</p>{children}</div>;
}

function Pill({ g, n, f, v }: { g: GlyphKey; n: string; f: string; v: string }) {
  return (
    <span className="pb-map">
      <span className="pb-pill"><AppIcon g={g} size={16} />{n}. {f}</span>
      <small>{v}</small>
    </span>
  );
}
