'use client';

import './relay.css';
import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { scrollDrawGroup } from 'svg-scroll-draw/group';
import { Site } from '../kit/Site';
import { AppWindow, Av, Mark, PEOPLE } from './AppWindow';
import type { Who } from './AppWindow';

/*
 * Relay — a team-messaging product's home page. Three feature illustrations,
 * drawn as line-art wireframes of the product, live in three separate cards;
 * one scrollDrawGroup call gives them one trigger and one set of options, so
 * they ink in exactly together. Everything else is HTML and CSS product UI.
 */

/* ── Line-art helpers: rounded rects and circles as single paths ─────────── */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} a${r} ${r} 0 0 1 ${r} ${r} V${y + h - r} a${r} ${r} 0 0 1 -${r} ${r} H${x + r} a${r} ${r} 0 0 1 -${r} -${r} V${y + r} a${r} ${r} 0 0 1 ${r} -${r} Z`;
const ci = (cx: number, cy: number, r: number) => `M${cx + r} ${cy} a${r} ${r} 0 1 1 -${r * 2} 0 a${r} ${r} 0 1 1 ${r * 2} 0`;
const tile = (x: number, y: number): [string, string][] => [
  ['b', rr(x, y, 108, 50, 8)],
  ['b', ci(x + 54, y + 19, 8)],
  ['b', `M${x + 40} ${y + 44} a14 11 0 0 1 28 0`],
];

// [stroke class, path] — 'a' is the accent ink, 'b' the quieter structure
const ART: [string, string][][] = [
  // Threads: a channel, one message with replies, and its thread open beside it
  [
    ['b', rr(16, 16, 150, 168, 12)], ['b', 'M16 40 H166'], ['b', 'M30 28 H72'],
    ['b', ci(36, 62, 8)], ['b', 'M52 58 H118'], ['b', 'M52 67 H146'],
    ['a', ci(36, 100, 8)], ['a', 'M52 96 H124'], ['b', 'M52 105 H140'],
    ['a', ci(57, 120, 4)], ['a', ci(66, 120, 4)], ['a', 'M76 120 H110'],
    ['b', ci(36, 152, 8)], ['b', 'M52 148 H110'], ['b', 'M52 157 H136'],
    ['a', 'M114 120 C 170 120 156 70 194 70'],
    ['b', rr(194, 36, 110, 148, 12)], ['b', 'M194 58 H304'], ['b', 'M206 47 H244'], ['b', 'M288 44 l6 6 M294 44 l-6 6'],
    ['b', ci(213, 78, 7)], ['b', 'M227 74 H286'], ['b', 'M227 83 H266'],
    ['b', 'M206 100 H230 M268 100 H292'],
    ['b', ci(213, 120, 7)], ['b', 'M227 116 H280'], ['b', 'M227 125 H256'],
    ['a', rr(204, 148, 90, 24, 8)], ['a', 'M276 160 H286 M282 155.5 L286.5 160 L282 164.5'],
  ],
  // Huddles: a call window, four people, one of them talking
  [
    ['b', rr(36, 12, 248, 176, 14)], ['b', 'M36 36 H284'],
    ['a', ci(51, 24, 3.5)], ['b', 'M62 24 H116'], ['b', 'M248 24 H270'],
    ...tile(48, 46), ...tile(164, 46), ...tile(48, 104), ...tile(164, 104),
    ['a', rr(44, 42, 116, 58, 11)], ['a', 'M138 57 v8 M143 53 v16 M148 57 v8'],
    ['b', 'M174 141 l8 8'],
    ['b', ci(124, 172, 7)], ['b', ci(146, 172, 7)], ['b', ci(168, 172, 7)],
    ['a', rr(186, 165, 44, 14, 7)],
  ],
  // Search: a query, filters, and the result it found
  [
    ['b', rr(28, 14, 264, 172, 14)],
    ['a', rr(42, 26, 236, 30, 9)], ['a', ci(58, 41, 6)], ['a', 'M62.5 45.5 L67 50'], ['a', 'M76 41 H144'], ['a', 'M150 34 V48'],
    ['b', rr(248, 34, 22, 14, 4)], ['b', 'M254 41 H264'],
    ['b', rr(42, 64, 58, 16, 8)], ['b', rr(106, 64, 66, 16, 8)], ['b', rr(178, 64, 48, 16, 8)],
    ['b', 'M28 90 H292'],
    ['a', rr(36, 96, 248, 30, 8)], ['a', rr(46, 103, 16, 16, 4)], ['a', 'M72 107 H196'], ['b', 'M72 116 H160'], ['a', rr(94, 101, 44, 12, 3)],
    ['a', 'M268 106 v5 h-9 M262 108 l-3 3 l3 3'],
    ['b', rr(46, 134, 16, 16, 4)], ['b', 'M72 138 H184'], ['b', 'M72 147 H150'],
    ['b', rr(46, 160, 16, 16, 4)], ['b', 'M72 164 H170'], ['b', 'M72 173 H132'],
  ],
];

const FEATURES: { t: string; d: string; link: string; chip: ReactNode }[] = [
  {
    t: 'Threads that stay on topic',
    d: 'Reply in a thread and the channel stays readable. Threads fold away when they’re done, and the decision gets pinned where everyone can find it.',
    link: 'How threads work',
    chip: <><span className="ry-stack"><Av p="tm" size={20} sq /><Av p="so" size={20} sq /><Av p="dw" size={20} sq /></span><b>6 replies</b><em>Last reply 4 min ago</em></>,
  },
  {
    t: 'Huddles in one click',
    d: 'Drop into a voice huddle from any channel — no link, no calendar, no waiting room. Relay writes the notes and posts them when you hang up.',
    link: 'Try a huddle',
    chip: <><span className="ry-live" /><b>Huddle</b><em># launch-v4 · 4 people</em><kbd>⌘⇧H</kbd></>,
  },
  {
    t: 'Search that finds it',
    d: 'Every message, file, canvas and huddle note, searchable in a fraction of a second — even the decision someone made back in March.',
    link: 'See search filters',
    chip: <><b>12 results</b><em>in 0.21s</em><kbd>⌘K</kbd></>,
  },
];

const LOGOS: { n: string; c: string; g?: ReactNode }[] = [
  { n: 'Kiln & Co', c: 'lg-kiln', g: <path d="M4 20 V10 L12 4 L20 10 V20 Z M9 20 v-5 a3 3 0 0 1 6 0 v5" /> },
  { n: 'NORTHFOLD', c: 'lg-nf', g: <path d="M3 18 L9 6 L13 14 L16 9 L21 18 Z" /> },
  { n: 'copperline', c: 'lg-cu' },
  { n: 'Bramblewood', c: 'lg-bw', g: <><circle cx="9" cy="10" r="4" /><circle cx="15" cy="10" r="4" /><circle cx="12" cy="15" r="4" /></> },
  { n: 'Wrenfield', c: 'lg-wf' },
  { n: 'Ostrava Labs', c: 'lg-os', g: <path d="M12 3 a9 9 0 1 0 0.01 0 M12 8 a4 4 0 1 0 0.01 0" /> },
];

const NOTES: { k: string; items: ReactNode[] }[] = [
  { k: 'Decisions', items: ['Ship v4 on Thursday 12 November.', 'Freeze main at 18:00 on Wednesday.'] },
  { k: 'Action items', items: [<><b>Theo</b> — payments smoke tests on rc.3, today</>, <><b>Priya</b> — launch email to legal by noon</>, <><b>Sam</b> — status-page banner for launch day</>] },
];

const INTEGRATIONS: { n: string; k: string; c: string; g: string }[] = [
  { n: 'Shipyard', k: 'CI/CD', c: 'linear-gradient(135deg,#ffc53d,#ff7a1a)', g: 'M11.4 4.2V15H5.6zM13 7.4l4.6 7.6H13zM4.6 16.8h14.8l-2 3H6.6z' },
  { n: 'Trackwell', k: 'Issues', c: 'linear-gradient(135deg,#4f46e5,#0ea5e9)', g: 'M5 6h14M5 12h9M5 18h11' },
  { n: 'Ledgerline', k: 'Revenue', c: 'linear-gradient(135deg,#10b981,#065f46)', g: 'M4 17l5-5 4 3 7-8' },
  { n: 'Quillmark', k: 'E-signatures', c: 'linear-gradient(135deg,#1f2937,#4b5563)', g: 'M4 20C8 12 12 6 20 4c-3 5-7 10-14 15M4 20h8' },
  { n: 'Folio', k: 'Notes', c: 'linear-gradient(135deg,#fde047,#f59e0b)', g: 'M7.5 4.5h6.2l3.8 3.8v11.2h-10zM13.7 4.5v3.8h3.8' },
  { n: 'Tessera', k: 'Wiki', c: 'linear-gradient(135deg,#f472b6,#be185d)', g: 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z' },
  { n: 'Statusline', k: 'Status pages', c: 'linear-gradient(135deg,#22c55e,#15803d)', g: 'M3 12h4l2-5 4 10 2-5h6' },
  { n: 'Northbeam', k: 'Cloud', c: 'linear-gradient(135deg,#0f172a,#334155)', g: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5' },
  { n: 'Plugboard', k: 'Automations', c: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', g: 'M9 4v5M15 4v5M6 9h12v3a6 6 0 0 1-12 0zM12 18v3' },
  { n: 'Calder', k: 'Calendar', c: 'linear-gradient(135deg,#ef4444,#b91c1c)', g: 'M5 6h14v13H5zM5 10h14M9 4v4M15 4v4' },
  { n: 'Draftboard', k: 'Design', c: 'linear-gradient(135deg,#06b6d4,#0e7490)', g: 'M6 18l3-9 9-3-3 9zM9 9l6 6' },
  { n: 'Parcelry', k: 'Deliveries', c: 'linear-gradient(135deg,#fb923c,#c2410c)', g: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8' },
];

const SECURITY: { t: string; d: string; g: string }[] = [
  { t: 'SAML SSO and SCIM', d: 'Sign in with your identity provider; people join and leave with your directory.', g: 'M8 11V8a4 4 0 0 1 8 0v3M6 11h12v9H6zM12 15v2' },
  { t: 'Enterprise key management', d: 'Encrypt messages and files with keys you hold — and revoke them at any time.', g: 'M14 10a4 4 0 1 1-1.2-2.8M13 10l7 7-2 2-1.5-1.5L15 19l-1.5-1.5' },
  { t: 'Data residency', d: 'Keep data at rest in the US, EU, UK, Australia or Japan.', g: 'M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c-3 3-3 15 0 18c3-3 3-15 0-18' },
  { t: 'Audit logs and legal hold', d: 'Every sign-in, export and permission change, streamed to your SIEM.', g: 'M6 4h9l3 3v13H6zM9 10h6M9 14h6M9 18h3' },
  { t: 'Data loss prevention', d: 'Catch card numbers, keys and customer data before they’re posted.', g: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4' },
  { t: '99.99% uptime SLA', d: 'Financially backed, with a public status page and incident history.', g: 'M4 18h16M7 18V11M12 18V6M17 18v-9' },
];

const QUOTES: { q: string; p: Who; role: string; co: string; stat: string; sk: string }[] = [
  { q: 'We moved 400 people off internal email in a fortnight. The thing nobody expected was how quiet it got.', p: 'mr', role: 'Head of Operations', co: 'Kiln & Co', stat: '−38%', sk: 'internal email in the first quarter' },
  { q: 'Huddle notes killed the “can someone write this up?” message. Decisions land in the channel before we’ve hung up.', p: 'ps', role: 'Director of Product', co: 'Northfold', stat: '6 hrs', sk: 'saved per person, per week' },
  { q: 'Our agencies sit in shared channels now. Hand-offs that took a week of email take an afternoon.', p: 'lb', role: 'VP Marketing', co: 'Copperline', stat: '3×', sk: 'faster agency hand-offs' },
];

const TIERS = [
  { n: 'Free', p: '$0', s: 'for teams up to 10', d: 'Try Relay with your team.', f: ['90 days of message history', '1:1 huddles', '10 integrations', 'Search across everything you keep'], cta: 'Get started' },
  { n: 'Pro', p: '$7.25', s: 'per person / month, billed yearly', d: 'For teams that run on Relay.', f: ['Unlimited history and search', 'Group huddles with notes', 'Shared channels with other companies', 'Unlimited integrations and workflows', 'Guest accounts'], cta: 'Start a free trial', hot: true },
  { n: 'Enterprise', p: 'Custom', s: 'annual agreement', d: 'For organisations with security needs.', f: ['SAML SSO, SCIM and audit logs', 'Enterprise key management', 'Data residency in 5 regions', 'DLP and legal hold', '99.99% uptime SLA'], cta: 'Talk to sales' },
];

const Tick = () => <svg className="ry-tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" /></svg>;
const Glyph = ({ d, cls = 'ry-g' }: { d: string; cls?: string }) => <svg className={cls} viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;

export function RelaySite() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as Element[];
    // Three cards, three SVGs — one call, one trigger, inked in together.
    const g = scrollDrawGroup(els, { easing: 'ease-out', speed: 1.1, stagger: 0.04, once: true, trigger: { start: 'top 85%', end: 'top 40%' } });
    return () => g.destroy();
  }, []);

  return (
    <Site
      className="ry"
      brand={<><Mark />Relay</>}
      links={['Product', 'Solutions', 'Enterprise', 'Resources', 'Pricing']}
      cta="Try Relay free"
      example="group-api"
      apis="scrollDrawGroup · synchronized"
      footnote="Messaging for teams that ship"
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="ry-hero">
        <a className="ry-pill" href="#top"><span>New</span>Huddle notes — every call, written up<i>→</i></a>
        <h1 className="ry-h1">All your team’s talk. <span>None of the noise.</span></h1>
        <p className="ry-lede ry-hero-lede">Channels for every project, threads that keep them readable, and huddles for when typing is too slow. Relay keeps the conversation next to the work — and out of your inbox.</p>
        <div className="ry-ctas">
          <a className="sk-btn" href="#top">Try Relay free</a>
          <a className="sk-btn sk-btn-ghost" href="#top">Book a demo</a>
        </div>
        <p className="ry-fine">Free for teams up to 10 · No credit card needed</p>
        <AppWindow />
      </section>

      <section className="ry-logos" aria-label="Customers">
        <p>More than 12,000 teams run on Relay</p>
        <div>
          {LOGOS.map((l) => (
            <span key={l.n} className={`ry-logo ${l.c}`}>{l.g && <svg viewBox="0 0 24 24" aria-hidden="true">{l.g}</svg>}{l.n}</span>
          ))}
        </div>
      </section>

      {/* ── Three things (scrollDrawGroup) ───────────────────────────── */}
      <section className="ry-sec ry-three" id="product">
        <div className="ry-sec-head ry-center">
          <p className="ry-kick">Why teams switch</p>
          <h2 className="ry-h2">Three things Relay does better.</h2>
          <p className="ry-lede">Most chat tools are fast. Relay is fast and calm: it keeps every conversation in its place, so you can find it later — or ignore it now.</p>
        </div>
        <div className="ry-cards">
          {FEATURES.map((f, i) => (
            <article key={f.t} className="ry-card">
              <div className="ry-art-wrap">
                <div className="ry-art feature-art" ref={(el) => { refs.current[i] = el; }}>
                  <svg viewBox="0 0 320 200" aria-hidden="true">{ART[i].map(([c, d], k) => <path key={k} className={c} d={d} />)}</svg>
                </div>
                <span className="ry-chip">{f.chip}</span>
              </div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
              <a className="ry-more" href="#top">{f.link} →</a>
            </article>
          ))}
        </div>
      </section>

      {/* ── Huddles, up close ────────────────────────────────────────── */}
      <section className="ry-sec ry-split">
        <div className="ry-split-copy">
          <p className="ry-kick">Huddles</p>
          <h2 className="ry-h2">Talk it through. Relay takes the notes.</h2>
          <p className="ry-lede">Start a huddle from any channel and whoever’s free drops in. Share a screen, draw on it, and hang up with the decisions and owners already posted in the channel.</p>
          <ul className="ry-list">
            <li><Tick />Live captions and notes in 18 languages</li>
            <li><Tick />Multiple people can share and draw at once</li>
            <li><Tick />Recordings stay in the channel, searchable</li>
          </ul>
        </div>
        <div className="ry-huddle" role="img" aria-label="A huddle in #launch-v4 with four people, Dana speaking and Priya sharing her screen, and live notes listing two decisions and three action items">
          <div className="ry-hd-top"><span className="ry-live" /><b>Huddle</b><span className="ry-dim"># launch-v4</span><time>12:41</time><span className="ry-hd-cc">CC</span></div>
          <div className="ry-hd-body">
            <div className="ry-tiles">
              {(['dw', 'tm', 'ps', 'so'] as Who[]).map((p, i) => (
                <div key={p} className={`ry-tile${i === 0 ? ' talk' : ''}${i === 2 ? ' share' : ''}`} style={{ '--a': PEOPLE[p].a, '--b': PEOPLE[p].b } as CSSProperties}>
                  {i === 2 ? (
                    <div className="ry-screen"><b>Launch checklist</b><i /><i /><i className="s" /><span className="ry-ink" /></div>
                  ) : (
                    <Av p={p} size={54} />
                  )}
                  <span className="ry-tile-n">{i === 3 && <span className="ry-muted" />}{PEOPLE[p].n.split(' ')[0]}{i === 2 && <em>sharing</em>}</span>
                </div>
              ))}
            </div>
            <aside className="ry-notes">
              <p className="ry-notes-h"><b>Huddle notes</b><span>Live</span></p>
              {NOTES.map((n) => (
                <div key={n.k} className="ry-notes-s">
                  <p>{n.k}</p>
                  <ul>{n.items.map((x, k) => <li key={k} className={n.k === 'Action items' ? 'todo' : ''}>{x}</li>)}</ul>
                </div>
              ))}
              <p className="ry-notes-f">Posts to # launch-v4 when the huddle ends</p>
            </aside>
          </div>
          <div className="ry-hd-bar">
            <span className="ry-hb on"><Glyph d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM6.5 11a5.5 5.5 0 0 0 11 0M12 16.5V20" /></span>
            <span className="ry-hb"><Glyph d="M4 7h11v10H4zM15 10.5l5-3v9l-5-3" /></span>
            <span className="ry-hb"><Glyph d="M4 5h16v11H4zM9 20h6M12 16v4M12 13V8M9.5 10.5L12 8l2.5 2.5" /></span>
            <span className="ry-hb ry-hide-s"><Glyph d="M12 3.5a8.5 8.5 0 1 0 .01 0M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></span>
            <span className="ry-hb leave">Leave</span>
          </div>
        </div>
      </section>

      {/* ── Search, up close ─────────────────────────────────────────── */}
      <section className="ry-sec ry-split ry-flip">
        <div className="ry-split-copy">
          <p className="ry-kick">Search</p>
          <h2 className="ry-h2">The answer is already in Relay.</h2>
          <p className="ry-lede">Filter by channel, person, date or file type, then jump straight to the message in its thread. Search reads inside PDFs, canvases and huddle notes too.</p>
          <ul className="ry-list">
            <li><Tick />Results in under 300 ms, across years of history</li>
            <li><Tick />Respects every channel’s permissions</li>
            <li><Tick />Save a search and get told when it changes</li>
          </ul>
        </div>
        <div className="ry-search" role="img" aria-label="Relay search for 'pricing decision', filtered to #pricing and messages from Dana, showing two messages, a memo PDF and a canvas">
          <div className="ry-s-field"><Glyph d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.3 15.3L20 20" cls="ry-g ry-s-ic" /><span>pricing decision</span><span className="ry-caret" /><kbd>esc</kbd></div>
          <div className="ry-s-filters"><span className="on">in: #pricing <i>×</i></span><span className="on">from: @Dana <i>×</i></span><span>after: 1 Sep</span><span className="ry-hide-s">has: file</span></div>
          <div className="ry-s-group">
            <p className="ry-s-gh">Messages <em>9</em></p>
            <div className="ry-s-hit on">
              <Av p="dw" size={30} sq />
              <div><p className="ry-s-meta"><b>Dana Whitfield</b> in #pricing · 14 Oct</p><p className="ry-s-txt">Final call on the <mark>pricing decision</mark>: Pro stays at $7.25, and annual plans get two months free.</p></div>
              <kbd>↵</kbd>
            </div>
            <div className="ry-s-hit">
              <Av p="dw" size={30} sq />
              <div><p className="ry-s-meta"><b>Dana Whitfield</b> in #pricing · 2 Oct</p><p className="ry-s-txt">Writing the <mark>pricing decision</mark> up in a canvas so it isn’t buried in this thread.</p></div>
            </div>
          </div>
          <div className="ry-s-group">
            <p className="ry-s-gh">Files and canvases <em>3</em></p>
            <div className="ry-s-hit">
              <span className="ry-ft pdf">PDF</span>
              <div><p className="ry-s-meta"><b>Pricing v4 — decision memo.pdf</b></p><p className="ry-s-txt">Shared in #leadership · 9 pages · “…the <mark>pricing decision</mark> holds for EU…”</p></div>
            </div>
            <div className="ry-s-hit">
              <span className="ry-ft cv"><Glyph d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></span>
              <div><p className="ry-s-meta"><b>Pricing FAQ</b> · canvas</p><p className="ry-s-txt">Edited by Priya Shah yesterday</p></div>
            </div>
          </div>
          <div className="ry-s-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span className="ry-s-n">12 results · 0.21s</span></div>
        </div>
      </section>

      {/* ── Bento ────────────────────────────────────────────────────── */}
      <section className="ry-sec ry-bento-sec">
        <div className="ry-sec-head">
          <p className="ry-kick">And everything around it</p>
          <h2 className="ry-h2">Built for the way teams actually work.</h2>
        </div>
        <div className="ry-bento">
          <article className="ry-bc">
            <div className="ry-shared">
              <div className="ry-sh-h"><b># kiln-x-northfold</b><span className="ry-orgs"><span className="ry-org k">K</span><span className="ry-org n">N</span></span></div>
              <p className="ry-sh-badge">Shared with <b>Northfold Studio</b> · 2 organisations</p>
              <div className="ry-sh-msg"><Av p="lb" size={28} sq /><div><p className="ry-msg-h"><b>Lena Brandt</b><span className="ry-ext">Northfold</span></p><p>Revised hero artwork is in the canvas — two options.</p></div></div>
              <div className="ry-sh-msg"><Av p="dw" size={28} sq /><div><p className="ry-msg-h"><b>Dana Whitfield</b></p><p>Option B. Can we have it by Friday?</p></div></div>
            </div>
            <h3>Shared channels</h3>
            <p>Work with agencies, clients and partners in one channel, each company keeping its own admin and data.</p>
          </article>
          <article className="ry-bc">
            <ol className="ry-flowx">
              <li><span className="ry-step-k">When</span><span>someone reacts with 🚨 in <b>#support</b></span></li>
              <li><span className="ry-step-k">Then</span><span>open an issue in <b>Trackwell</b> with the thread</span></li>
              <li><span className="ry-step-k">And</span><span>page whoever is on call in <b>#oncall</b></span></li>
            </ol>
            <h3>Workflows, no code</h3>
            <p>Turn the things your team does by hand into a few steps anyone can build, edit and see running.</p>
          </article>
          <article className="ry-bc ry-bc-phone">
            <div className="ry-phone">
              <div className="ry-ph-scr">
                <p className="ry-ph-time">9:41</p>
                <p className="ry-ph-date">Thursday 12 November</p>
                {[
                  { p: 'dw' as Who, t: '# launch-v4', m: 'We’re live. Thank you all 💜', at: 'now' },
                  { p: 'tm' as Who, t: 'Theo Marsh', m: 'Smoke tests green on prod', at: '2m' },
                ].map((n) => (
                  <div key={n.m} className="ry-notif"><Mark size={20} /><div><p><b>{n.t}</b><time>{n.at}</time></p><p>{PEOPLE[n.p].n.split(' ')[0]}: {n.m}</p></div></div>
                ))}
              </div>
            </div>
            <h3>On every device</h3>
            <p>Mac, Windows, Linux, iPhone, iPad and Android — with notifications that respect your focus hours.</p>
          </article>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────────────── */}
      <section className="ry-sec ry-ints">
        <div className="ry-ints-copy">
          <p className="ry-kick">Integrations</p>
          <h2 className="ry-h2">Bring the rest of your tools into the conversation.</h2>
          <p className="ry-lede">Deploys, signatures, invoices and incidents post into the channels where people already are — and you can act on them without switching apps.</p>
          <a className="ry-more" href="#top">Browse 2,400+ apps →</a>
        </div>
        <ul className="ry-apps">
          {INTEGRATIONS.map((a) => (
            <li key={a.n}>
              <span className="ry-app-i" style={{ background: a.c }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={a.g} /></svg></span>
              <b>{a.n}</b><em>{a.k}</em>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Enterprise ───────────────────────────────────────────────── */}
      <section className="ry-ent" id="enterprise">
        <div className="ry-ent-in">
          <div className="ry-ent-head">
            <p className="ry-kick">Enterprise</p>
            <h2 className="ry-h2">Security your IT team will sign off on.</h2>
            <p className="ry-lede">The controls large organisations need, on by default and managed from one admin console.</p>
          </div>
          <ul className="ry-sec-grid">
            {SECURITY.map((s) => (
              <li key={s.t}><span className="ry-sec-i"><Glyph d={s.g} /></span><b>{s.t}</b><p>{s.d}</p></li>
            ))}
          </ul>
          <div className="ry-badges">
            {['SOC 2 Type II', 'ISO 27001', 'ISO 27018', 'HIPAA', 'GDPR', 'FedRAMP Moderate'].map((b) => (
              <span key={b}><Glyph d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customers ────────────────────────────────────────────────── */}
      <section className="ry-sec ry-quotes">
        <div className="ry-sec-head ry-center">
          <p className="ry-kick">Customers</p>
          <h2 className="ry-h2">Quieter inboxes. Faster decisions.</h2>
        </div>
        <div className="ry-qgrid">
          {QUOTES.map((q) => (
            <figure key={q.p} className="ry-q">
              <p className="ry-q-stat"><b>{q.stat}</b>{q.sk}</p>
              <blockquote>“{q.q}”</blockquote>
              <figcaption><Av p={q.p} size={40} /><span><b>{PEOPLE[q.p].n}</b>{q.role}, {q.co}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="ry-sec ry-pricing" id="pricing">
        <div className="ry-sec-head ry-center">
          <p className="ry-kick">Pricing</p>
          <h2 className="ry-h2">Free for small teams. Fair for big ones.</h2>
          <div className="ry-toggle" aria-hidden="true"><span>Monthly</span><span className="on">Yearly <em>save 17%</em></span></div>
        </div>
        <div className="ry-tiers">
          {TIERS.map((t) => (
            <div key={t.n} className={`ry-tier${t.hot ? ' hot' : ''}`}>
              {t.hot && <span className="ry-tier-tag">Most popular</span>}
              <h3>{t.n}</h3>
              <p className="ry-tier-d">{t.d}</p>
              <p className="ry-price"><b>{t.p}</b><span>{t.s}</span></p>
              <a className={`sk-btn${t.hot ? '' : ' sk-btn-ghost'}`} href="#top">{t.cta}</a>
              <ul>{t.f.map((x) => <li key={x}><Tick />{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA + site map ─────────────────────────────────────── */}
      <section className="ry-final">
        <div className="ry-final-card">
          <Mark size={64} />
          <h2 className="ry-h2">Give your team somewhere calmer to talk.</h2>
          <p className="ry-lede">Set up a workspace in two minutes and invite everyone. Bring your history from email or another chat tool with one import.</p>
          <div className="ry-ctas">
            <a className="sk-btn" href="#top">Try Relay free</a>
            <a className="sk-btn sk-btn-ghost" href="#top">Talk to sales</a>
          </div>
          <p className="ry-platforms">Mac · Windows · Linux · iOS · Android · Web</p>
        </div>
        <div className="ry-map">
          {[['Product', ['Channels', 'Huddles', 'Search', 'Workflows', 'Integrations']], ['Solutions', ['Engineering', 'Marketing', 'Customer support', 'Agencies', 'Remote teams']], ['Resources', ['Help centre', 'Developers', 'Blog', 'Events', 'Status']], ['Company', ['About', 'Careers', 'Security', 'Privacy', 'Contact']]].map(([h, l]) => (
            <div key={h as string}><b>{h as string}</b>{(l as string[]).map((x) => <a key={x} href="#top">{x}</a>)}</div>
          ))}
        </div>
      </section>
    </Site>
  );
}
