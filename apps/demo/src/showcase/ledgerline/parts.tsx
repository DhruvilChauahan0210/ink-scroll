import type { CSSProperties, ReactNode } from 'react';

/* Small shared pieces: the brand mark, avatars, and a stroke icon set drawn
   on a 20-unit grid. Static — nothing here is scroll-drawn. */

export const Mark = ({ size = 22 }: { size?: number }) => (
  <svg className="ll-mark" viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
    <rect width="20" height="20" rx="5.5" fill="#7c8cff" />
    <path d="M5.5 14.5V10.5M10 14.5V5.5M14.5 14.5V8.5" stroke="#0b0d12" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export function Av({ i, a, b, size = 26 }: { i: string; a: string; b: string; size?: number }) {
  return (
    <span className="ll-av" style={{ '--a': a, '--b': b, '--s': `${size}px` } as CSSProperties} aria-hidden="true">
      {i}
    </span>
  );
}

const ic = (d: ReactNode) => <svg className="ll-ic" viewBox="0 0 20 20" aria-hidden="true">{d}</svg>;

export const I = {
  overview: ic(<><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" /><rect x="3" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" /></>),
  mrr: ic(<><path d="M3 16.5h14" /><path d="M4 13l3.5-4 3 2.5L16 5" /><path d="M12.5 5H16v3.5" /></>),
  customers: ic(<><circle cx="8" cy="7" r="3" /><path d="M2.8 16.5c.6-2.8 2.6-4.3 5.2-4.3s4.6 1.5 5.2 4.3" /><path d="M13 4.3a3 3 0 0 1 0 5.4M15 12.6c1.2.6 2 1.9 2.3 3.9" /></>),
  cohorts: ic(<><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 7.7h14M3 12.3h9.5M7.7 3v14M12.3 3v9.5" /></>),
  forecast: ic(<><path d="M3 15l4-4.5 3 2 3.5-4.5" /><path d="M13.5 8L17 4.5" strokeDasharray="1.6 1.8" /><path d="M3 17.5h14" /></>),
  reports: ic(<><path d="M5.5 2.5h6l3.5 3.5v11.5h-9.5z" /><path d="M11.5 2.5V6H15M8 10.5h4.5M8 13.5h4.5" /></>),
  plug: ic(<><path d="M7 2.5v4M13 2.5v4" /><path d="M5 6.5h10v3a5 5 0 0 1-10 0z" /><path d="M10 14.5v3" /></>),
  gear: ic(<><circle cx="10" cy="10" r="2.6" /><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" /></>),
  search: ic(<><circle cx="9" cy="9" r="5" /><path d="M13 13l4 4" /></>),
  chev: ic(<path d="M6 8l4 4 4-4" />),
  updown: ic(<path d="M7 7.5l3-3 3 3M7 12.5l3 3 3-3" />),
  cal: ic(<><rect x="3" y="4.5" width="14" height="12.5" rx="2" /><path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4" /></>),
  bell: ic(<><path d="M5.5 13.5V9a4.5 4.5 0 0 1 9 0v4.5l1.5 1.5h-12z" /><path d="M8.5 17.5h3" /></>),
  check: ic(<path d="M5 10.5l3 3 7-7.5" />),
  arrow: ic(<path d="M4 10h11.5M11 5.5l4.5 4.5-4.5 4.5" />),
  out: ic(<><path d="M8 4.5H4.5v11h11V12" /><path d="M11 3.5h5.5V9M16.5 3.5L9.5 10.5" /></>),
  down: ic(<><path d="M10 3v10M5.5 9l4.5 4.5L14.5 9" /><path d="M3.5 17h13" /></>),
  filter: ic(<path d="M3 4.5h14l-5.5 6.5v5l-3 1.5v-6.5z" />),
  lock: ic(<><rect x="4" y="9" width="12" height="8.5" rx="2" /><path d="M6.8 9V6.5a3.2 3.2 0 0 1 6.4 0V9" /></>),
  bolt: ic(<path d="M11 2.5L4.5 11.5H10L9 17.5l6.5-9H10z" />),
  sync: ic(<><path d="M16 8.5A6 6 0 0 0 5 6.2M4 11.5A6 6 0 0 0 15 13.8" /><path d="M5 3v3.4h3.4M15 17v-3.4h-3.4" /></>),
  db: ic(<><ellipse cx="10" cy="5" rx="6" ry="2.5" /><path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" /></>),
  hook: ic(<><circle cx="6" cy="14" r="2" /><circle cx="14" cy="14" r="2" /><circle cx="10" cy="6" r="2" /><path d="M8.9 7.7L6.6 12M11.1 7.7l2.3 4.3M8 14h4" /></>),
  chat: ic(<><path d="M3.5 5h13v8.5H9l-3.5 3v-3h-2z" /><path d="M7 9.3h6" /></>),
  card: ic(<><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M2.5 8.5h15M5.5 12.5h3" /></>),
  doc: ic(<><path d="M5.5 2.5h6l3.5 3.5v11.5h-9.5z" /><path d="M11.5 2.5V6H15M8 10h1.5M8 13h4.5" /></>),
  phone: ic(<><rect x="6" y="2.5" width="8" height="15" rx="2" /><path d="M9 15h2" /></>),
  file: ic(<><path d="M5.5 2.5h6l3.5 3.5v11.5h-9.5z" /><path d="M11.5 2.5V6H15M7.5 9.5h5v5h-5zM7.5 12h5M10 9.5v5" /></>),
  crm: ic(<><rect x="3" y="3.5" width="14" height="13" rx="2" /><circle cx="8" cy="9" r="2" /><path d="M5 14c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M12.5 8h2.5M12.5 11h2.5" /></>),
  plus: ic(<path d="M10 4.5v11M4.5 10h11" />),
};
