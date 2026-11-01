import type { CSSProperties, ReactNode } from 'react';

/* The hero's product shot: Relay on a Mac, mid-morning in a launch channel —
   workspace rail, sidebar with unread badges and a live huddle, the channel
   with a threaded message, a bot unfurl and reactions, and the thread open on
   the right. All HTML and CSS. */

export const PEOPLE = {
  dw: { n: 'Dana Whitfield', i: 'DW', a: '#fb923c', b: '#e11d74' },
  tm: { n: 'Theo Marsh', i: 'TM', a: '#34d399', b: '#0284c7' },
  ps: { n: 'Priya Shah', i: 'PS', a: '#c084fc', b: '#4f46e5' },
  so: { n: 'Sam Okoro', i: 'SO', a: '#facc15', b: '#ea580c' },
  lb: { n: 'Lena Brandt', i: 'LB', a: '#22d3ee', b: '#2563eb' },
  mr: { n: 'Marco Ruiz', i: 'MR', a: '#f87171', b: '#b45309' },
} as const;
export type Who = keyof typeof PEOPLE;

export function Av({ p, size = 32, sq = false, dot }: { p: Who; size?: number; sq?: boolean; dot?: 'on' | 'away' | 'huddle' }) {
  const x = PEOPLE[p];
  return (
    <span className={`ry-av${sq ? ' sq' : ''}`} style={{ '--a': x.a, '--b': x.b, '--s': `${size}px` } as CSSProperties} aria-hidden="true">
      {x.i}
      {dot && <i className={`ry-pres ${dot}`} />}
    </span>
  );
}

export const Mark = ({ size = 24 }: { size?: number }) => (
  <span className="ry-mark" style={{ '--s': `${size}px` } as CSSProperties} aria-hidden="true">
    <svg viewBox="0 0 24 24"><path d="M5.5 6.5h9a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-5l-3.5 3v-3h-.5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z" /><path d="M9 11.5h5.5M12.2 9.2l2.3 2.3-2.3 2.3" /></svg>
  </span>
);

const Icon = ({ d }: { d: string }) => <svg className="ry-ic" viewBox="0 0 16 16" aria-hidden="true"><path d={d} /></svg>;
const IC = {
  threads: 'M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z',
  at: 'M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm0 0v1a1.6 1.6 0 0 0 3.2 0V8A5.7 5.7 0 1 0 11 12.7',
  send: 'M2.5 8l11-5-4 11-2-4.5z',
  save: 'M4 2.5h8v11l-4-3-4 3z',
  head: 'M3 10V8a5 5 0 0 1 10 0v2M3 10h2v3.5H3.8a.8.8 0 0 1-.8-.8zm10 0h-2v3.5h1.2a.8.8 0 0 0 .8-.8z',
  mic: 'M8 2.5a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0v-3a2 2 0 0 1 2-2zM4.5 7.5a3.5 3.5 0 0 0 7 0M8 11v2.5',
  plus: 'M8 3v10M3 8h10',
  search: 'M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm3.3 7.8L13.5 13.5',
  edit: 'M10.5 2.5l3 3-7.5 7.5H3v-3zM9 4l3 3',
};

const CHANNELS: { n: string; unread?: number; bold?: boolean; on?: boolean }[] = [
  { n: 'general' },
  { n: 'announcements', bold: true },
  { n: 'design-crit', unread: 3 },
  { n: 'launch-v4', on: true },
  { n: 'eng-platform', bold: true },
  { n: 'support-escalations' },
];

const DMS: { p: Who; dot: 'on' | 'away' | 'huddle'; unread?: number }[] = [
  { p: 'dw', dot: 'on' },
  { p: 'tm', dot: 'huddle', unread: 1 },
  { p: 'ps', dot: 'on' },
  { p: 'so', dot: 'away' },
];

function Msg({ p, at, children }: { p: Who; at: string; children: ReactNode }) {
  return (
    <div className="ry-msg">
      <Av p={p} size={36} sq />
      <div className="ry-msg-b">
        <p className="ry-msg-h"><b>{PEOPLE[p].n}</b><time>{at}</time></p>
        {children}
      </div>
    </div>
  );
}

export function AppWindow() {
  return (
    <figure className="ry-shot">
      <div className="ry-win" role="img" aria-label="Relay on a Mac: the #launch-v4 channel of the Kiln & Co workspace, with a threaded message about the release candidate, a CI bot posting a passed run, reactions, a live huddle in the sidebar and the thread open on the right">
        <div className="ry-chrome">
          <span className="ry-lights"><i /><i /><i /></span>
          <span className="ry-find"><Icon d={IC.search} />Search Kiln &amp; Co<kbd>⌘K</kbd></span>
          <span className="ry-chrome-r"><Av p="lb" size={22} sq dot="on" /></span>
        </div>
        <div className="ry-app">
          <nav className="ry-rail" aria-hidden="true">
            <span className="ry-ws on">K</span>
            <span className="ry-ws ws2">N<i>2</i></span>
            <span className="ry-ws add"><Icon d={IC.plus} /></span>
          </nav>

          <aside className="ry-side" aria-hidden="true">
            <div className="ry-side-h"><b>Kiln &amp; Co</b><span className="ry-compose"><Icon d={IC.edit} /></span></div>
            <ul className="ry-nav">
              <li><Icon d={IC.threads} />Threads<em>4</em></li>
              <li><Icon d={IC.at} />Mentions<em className="hot">2</em></li>
              <li><Icon d={IC.send} />Drafts &amp; sent</li>
              <li><Icon d={IC.save} />Saved</li>
            </ul>
            <p className="ry-side-l">Channels</p>
            <ul className="ry-chans">
              {CHANNELS.map((c) => (
                <li key={c.n} className={`${c.on ? 'on' : ''}${c.bold || c.unread ? ' bold' : ''}`}>
                  <span className="ry-hash">#</span>{c.n}{c.unread && <em className="hot">{c.unread}</em>}
                </li>
              ))}
            </ul>
            <p className="ry-side-l">Direct messages</p>
            <ul className="ry-chans ry-dms">
              {DMS.map((d) => (
                <li key={d.p} className={d.unread ? 'bold' : ''}>
                  <Av p={d.p} size={18} sq dot={d.dot} />{PEOPLE[d.p].n}
                  {d.dot === 'huddle' && <span className="ry-hdph"><Icon d={IC.head} /></span>}
                  {d.unread && <em className="hot">{d.unread}</em>}
                </li>
              ))}
            </ul>
            <div className="ry-hbar">
              <div className="ry-hbar-t"><span className="ry-wave"><i /><i /><i /><i /></span><b>Huddle</b><span># launch-v4</span><time>12:41</time></div>
              <div className="ry-hbar-b">
                <span className="ry-stack"><Av p="dw" size={22} sq /><Av p="tm" size={22} sq /><Av p="so" size={22} sq /><span className="ry-plus1">+1</span></span>
                <span className="ry-hbar-btns"><span><Icon d={IC.mic} /></span><span className="leave">Leave</span></span>
              </div>
            </div>
          </aside>

          <section className="ry-chan">
            <div className="ry-chan-h">
              <div className="ry-chan-t"><b># launch-v4</b><span className="ry-star">★</span></div>
              <span className="ry-chan-r"><span className="ry-stack"><Av p="dw" size={22} sq /><Av p="ps" size={22} sq /><Av p="mr" size={22} sq /></span><span className="ry-count">18</span><span className="ry-hd-btn"><Icon d={IC.head} />Huddle</span></span>
            </div>
            <div className="ry-tabs"><span className="on">Messages</span><span>Canvas</span><span>Files</span><span className="ry-hide-s">Pins · 3</span></div>
            <div className="ry-feed">
              <div className="ry-day"><span>Today</span></div>
              <Msg p="dw" at="9:41 AM">
                <p>Morning all — <b>4.0.0-rc.3</b> is on staging. <span className="ry-at">@Theo Marsh</span> can you run the payments smoke tests before 11? Checklist is in the canvas.</p>
                <div className="ry-reacts"><span className="on">👀 <b>3</b></span><span>✅ <b>2</b></span><span className="ry-add">+</span></div>
                <div className="ry-thread"><span className="ry-stack"><Av p="tm" size={20} sq /><Av p="so" size={20} sq /><Av p="dw" size={20} sq /></span><b>6 replies</b><span>Last reply 4 min ago</span></div>
              </Msg>
              <Msg p="tm" at="9:58 AM">
                <p>Smoke tests are green on staging. One flaky webhook retry — already fixed in the run below.</p>
                <div className="ry-unfurl">
                  <span className="ry-unfurl-bar" />
                  <div>
                    <p className="ry-unfurl-src"><span className="ry-sy" />Shipyard</p>
                    <p className="ry-unfurl-t">Run #1842 passed in 2m 21s</p>
                    <p className="ry-unfurl-d">main · fix(checkout): retry payment webhooks with exponential backoff</p>
                  </div>
                </div>
                <div className="ry-reacts"><span className="on">🙌 <b>5</b></span><span>🚀 <b>3</b></span></div>
              </Msg>
              <Msg p="ps" at="10:04 AM">
                <p>Launch email copy is final. Last call for comments on the canvas before I send it to legal at noon.</p>
              </Msg>
              <p className="ry-typing"><span className="ry-dots"><i /><i /><i /></span><b>Sam Okoro</b> is typing…</p>
            </div>
            <div className="ry-composer">
              <div className="ry-tools"><b>B</b><i>I</i><s>S</s><span className="ry-sep" /><span>⌁</span><span>≡</span><span className="ry-hide-s">{'</>'}</span></div>
              <p>Message # launch-v4</p>
              <div className="ry-comp-f"><span className="ry-plus"><Icon d={IC.plus} /></span><span>@</span><span>☺</span><span className="ry-send"><Icon d={IC.send} /></span></div>
            </div>
          </section>

          <aside className="ry-th" aria-hidden="true">
            <div className="ry-th-h"><b>Thread</b><span># launch-v4</span><i>×</i></div>
            <div className="ry-th-body">
              <div className="ry-th-msg">
                <Av p="dw" size={28} sq />
                <div><p className="ry-msg-h"><b>Dana Whitfield</b><time>9:41</time></p><p>4.0.0-rc.3 is on staging. Can you run the payments smoke tests before 11?</p></div>
              </div>
              <p className="ry-th-div"><span>6 replies</span></p>
              <div className="ry-th-msg">
                <Av p="tm" size={28} sq />
                <div><p className="ry-msg-h"><b>Theo Marsh</b><time>9:44</time></p><p>Running them now.</p></div>
              </div>
              <div className="ry-th-msg">
                <Av p="so" size={28} sq />
                <div><p className="ry-msg-h"><b>Sam Okoro</b><time>9:47</time></p><p>Staging DB has the October snapshot, so refunds will look real.</p></div>
              </div>
              <div className="ry-th-msg">
                <Av p="dw" size={28} sq />
                <div><p className="ry-msg-h"><b>Dana Whitfield</b><time>9:59</time></p><p>Perfect. Freezing main at 6pm Wednesday 🧊</p></div>
              </div>
            </div>
            <div className="ry-th-comp">
              <p>Reply…</p>
              <label><i />Also send to # launch-v4</label>
            </div>
          </aside>
        </div>
      </div>
    </figure>
  );
}
