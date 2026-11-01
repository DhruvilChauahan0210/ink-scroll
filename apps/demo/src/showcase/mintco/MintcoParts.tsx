import type { CSSProperties, ReactNode } from 'react';

/* Mint & Co — the product mockups the switching page is built around: the
   app's home screen on a phone, the debit card, and the small pieces of app
   UI the feature cards show. All HTML, CSS and inline SVG. */

export const Logo = ({ size = 26 }: { size?: number }) => (
  <svg className="mc-logo" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <rect width="32" height="32" rx="9.5" fill="#0a2a1f" />
    <path d="M8.5 23.5C8.5 14.2 13.6 8.5 23.5 8.5c0 9.6-5.4 15-15 15z" fill="#45dd9c" />
    <path d="M8.5 23.5l9-9M13.6 18.4h3.6M13.6 18.4v-3.6" fill="none" stroke="#0a2a1f" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Ico = ({ d, size = 16 }: { d: string[]; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="mc-i">
    {d.map((p) => <path key={p} d={p} />)}
  </svg>
);

export const I = {
  plus: ['M12 5v14M5 12h14'],
  move: ['M5 9h13l-4-4', 'M19 15H6l4 4'],
  pay: ['M4 12h14', 'M13 6l6 6-6 6'],
  card: ['M3 6.5h18v11H3z', 'M3 10h18', 'M7 14.5h4'],
  home: ['M4 11l8-6.5 8 6.5', 'M6 9.5V19h12V9.5'],
  pot: ['M5 9h14l-1.4 9.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z', 'M8 9V7a4 4 0 0 1 8 0v2'],
  list: ['M8 7h12M8 12h12M8 17h12', 'M4 7h.01M4 12h.01M4 17h.01'],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.6-2.4 2.2-2.4 3.6', 'M12 17h.01'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-3.5-3.5'],
  shield: ['M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z', 'M9 12l2.2 2.2L15.5 10'],
  check: ['M5 12.5l4.2 4.2L19 7'],
  snow: ['M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9', 'M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5'],
  globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z'],
  chat: ['M4 5.5h16v10H9.5L5 19.5v-4H4z', 'M8 10.5h8'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  bolt: ['M13 3L5 13.5h6L10 21l8-10.5h-6z'],
};

export const Icon = ({ name, size }: { name: keyof typeof I; size?: number }) => <Ico d={I[name]} size={size} />;

/* A merchant's little square logo in the transaction list. */
export const Merchant = ({ c, l, bg }: { c: string; l: string; bg: string }) => (
  <span className="mc-merch" style={{ '--m': c, '--mb': bg } as CSSProperties}>{l}</span>
);

const TX = [
  { m: <Merchant l="OS" c="#fff" bg="#5b4bd6" />, n: 'Oakline Studio', s: 'Salary · 09:02', a: '+£2,140.00', in: true },
  { m: <Merchant l="CK" c="#fff" bg="#9a5b2e" />, n: 'Crumb & Kettle', s: 'Eating out · 08:41', a: '−£3.40' },
  { m: <Merchant l="NR" c="#fff" bg="#2357c4" />, n: 'Northline Rail', s: 'Transport · 07:58', a: '−£12.80' },
  { m: <Merchant l="H&F" c="#eaf2e6" bg="#2f4a3a" />, n: 'Hearth & Field', s: 'Shopping · Yesterday', a: '−£46.00' },
];

export function Phone() {
  return (
    <div className="mc-phone" role="img" aria-label="The Mint & Co app home screen: a £2,486.40 balance, a switch on day five of seven, and today's salary at the top of the transactions">
      <div className="mc-screen">
        <div className="mc-sbar"><b>9:41</b><span className="mc-island" /><span className="mc-sig"><i /><i /><i /><i /><em /></span></div>
        <div className="mc-app-top">
          <span className="mc-ava">AP</span>
          <b>Home</b>
          <span className="mc-app-search"><Icon name="search" size={15} /></span>
        </div>

        <div className="mc-acct">
          <span className="mc-acct-l">Current account <em>04-12-87 · 31926819</em></span>
          <strong>£2,486<small>.40</small></strong>
          <span className="mc-acct-in">+£2,140.00 today</span>
        </div>

        <div className="mc-acts">
          {([['plus', 'Add money'], ['move', 'Move'], ['pay', 'Pay'], ['card', 'Card']] as const).map(([k, l]) => (
            <span key={l}><i><Icon name={k} size={16} /></i>{l}</span>
          ))}
        </div>

        <div className="mc-mini-switch">
          <span className="mc-ms-top"><b>Switching from Barrow &amp; Lyle</b><em>Day 5 of 7</em></span>
          <span className="mc-ms-bar"><i style={{ width: '71%' }} /></span>
          <span className="mc-ms-sub">14 of 17 payments moved · done Thu 13 Nov</span>
        </div>

        <p className="mc-tx-h"><b>Today</b><span>See all</span></p>
        <ul className="mc-tx">
          {TX.map((t) => (
            <li key={t.n}>
              {t.m}
              <span className="mc-tx-n"><b>{t.n}</b><small>{t.s}</small></span>
              <span className={`mc-tx-a${t.in ? ' in' : ''}`}>{t.a}</span>
            </li>
          ))}
        </ul>

        <nav className="mc-tabs" aria-hidden="true">
          {([['home', 'Home'], ['pot', 'Pots'], ['list', 'Payments'], ['card', 'Card'], ['help', 'Help']] as const).map(([k, l], i) => (
            <span key={l} className={i === 0 ? 'on' : ''}><Icon name={k} size={18} />{l}</span>
          ))}
        </nav>
        <span className="mc-home-bar" />
      </div>
    </div>
  );
}

export function Card({ frozen = false, className = '' }: { frozen?: boolean; className?: string }) {
  return (
    <div className={`mc-card ${className}${frozen ? ' is-frozen' : ''}`} aria-hidden="true">
      <span className="mc-card-top"><Logo size={22} /><b>Mint&nbsp;&amp;&nbsp;Co</b></span>
      <span className="mc-card-chip" />
      <svg className="mc-card-nfc" viewBox="0 0 24 24" width="22" height="22"><path d="M8 7.5c1.5 2.8 1.5 6.2 0 9M11.5 5.5c2.4 4 2.4 9 0 13M15 3.5c3.2 5.2 3.2 11.8 0 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
      <span className="mc-card-no">•••• 2048</span>
      <span className="mc-card-name">ADA PARK</span>
      <span className="mc-card-kind">debit</span>
      {frozen && <span className="mc-card-frost"><Icon name="snow" size={18} />Frozen</span>}
    </div>
  );
}

export function Notification({ title, body, time = 'now', className = '' }: { title: string; body: ReactNode; time?: string; className?: string }) {
  return (
    <div className={`mc-notif ${className}`}>
      <span className="mc-notif-ico"><Logo size={30} /></span>
      <span className="mc-notif-t"><b>{title}</b><span>{body}</span></span>
      <time>{time}</time>
    </div>
  );
}

export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="mc-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" className={i < n ? 'on' : ''}>
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  );
}

/* A QR code drawn from a hash — a 25 × 25 grid with the three finder
   squares, the timing lines and an alignment square, so it reads as a QR
   code without encoding anything. */
const N = 25;
const bit = (x: number, y: number) => {
  let h = Math.imul(x + 11, 374761393) + Math.imul(y + 7, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) & 3) < 2;
};
export function QR() {
  const cells: ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const nearFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
      const align = x >= N - 9 && x <= N - 5 && y >= N - 9 && y <= N - 5;
      if (nearFinder || align) continue;
      const on = y === 6 ? x % 2 === 0 : x === 6 ? y % 2 === 0 : bit(x, y);
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />);
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`f${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>
  );
  const a = N - 9;
  return (
    <svg className="mc-qr" viewBox={`-2 -2 ${N + 4} ${N + 4}`} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      <g fill="currentColor">{cells}</g>
      {finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
      <rect x={a + 0.5} y={a + 0.5} width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x={a + 2} y={a + 2} width="1" height="1" fill="currentColor" />
    </svg>
  );
}
