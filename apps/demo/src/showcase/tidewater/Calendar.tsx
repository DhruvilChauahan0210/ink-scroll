'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

/* The 2027 season calendar. Runs follow the school's weekly pattern
   (Day Skipper week 1, Competent Crew weeks 2 and 4, Coastal Skipper week 3,
   dinghy weekends 2 and 4, tasters every Saturday), worked out from real
   2027 dates in UTC so the server and the browser agree. */

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const MONTH_LONG = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WD_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COURSES = [
  { k: 'taster', n: 'Taster sail', p: '£95' },
  { k: 'start', n: 'Start Sailing', p: '£265' },
  { k: 'crew', n: 'Competent Crew', p: '£640' },
  { k: 'day', n: 'Day Skipper', p: '£720' },
  { k: 'coastal', n: 'Coastal Skipper', p: '£860' },
] as const;

type Run = { row: number; d: number; len: number; left: number };

const dow = (m: number, d: number) => new Date(Date.UTC(2027, m, d)).getUTCDay();
const days = (m: number) => new Date(Date.UTC(2027, m + 1, 0)).getUTCDate();

/** Places left: fixed by the date, with April pinned to what the rest of the page says. */
function left(m: number, row: number, d: number): number {
  if (m === 3 && row === 2 && d === 12) return 2;
  if (m === 3 && row === 3 && d === 5) return 0;
  const v = (m * 7 + d * 3 + row * 5) % 9;
  return v === 0 ? 0 : Math.min(v, 6);
}

function runs(mi: number): Run[] {
  const m = mi + 2; // March is month 2
  const n = days(m);
  const mon = Array.from({ length: 7 }, (_, i) => i + 1).find((d) => dow(m, d) === 1)!;
  const sat = Array.from({ length: 7 }, (_, i) => i + 1).find((d) => dow(m, d) === 6)!;
  const out: Run[] = [];
  const add = (row: number, d: number, len: number) => { if (d + len - 1 <= n) out.push({ row, d, len, left: left(m, row, d) }); };
  for (let d = sat; d <= n; d += 7) add(0, d, 1);
  add(1, sat + 7, 2); add(1, sat + 21, 2);
  add(2, mon + 7, 5); add(2, mon + 21, 5);
  add(3, mon, 5);
  add(4, mon + 14, 5);
  return out;
}

const seats = (l: number) => (l === 0 ? 'Full' : `${l} left`);

export function SeasonCalendar() {
  const [mi, setMi] = useState(1);
  const m = mi + 2;
  const n = days(m);
  const list = runs(mi);
  const sorted = [...list].sort((a, b) => a.d - b.d || a.row - b.row);
  return (
    <div className="tw-cal">
      <div className="tw-cal-top">
        <div className="tw-months" role="tablist" aria-label="Month">
          {MONTHS.map((x, i) => (
            <button key={x} type="button" role="tab" aria-selected={i === mi} className={i === mi ? 'on' : ''} onClick={() => setMi(i)}>{x}</button>
          ))}
        </div>
        <div className="tw-cal-key"><span><i className="k-open" />Places</span><span><i className="k-low" />3 or fewer</span><span><i className="k-full" />Waitlist</span></div>
      </div>

      <div className="tw-gantt" style={{ '--n': n } as CSSProperties} role="table" aria-label={`${MONTH_LONG[mi]} 2027 courses`}>
        <div className="tw-g-corner" role="columnheader">{MONTH_LONG[mi]} 2027</div>
        {Array.from({ length: n }, (_, i) => {
          const wd = dow(m, i + 1);
          return (
            <div key={`h${i}`} className={`tw-g-day${wd === 0 || wd === 6 ? ' is-we' : ''}`} style={{ gridColumn: i + 2 }} role="columnheader">
              <span>{WD[wd]}</span><b>{i + 1}</b>
            </div>
          );
        })}
        {Array.from({ length: n }, (_, i) => {
          const wd = dow(m, i + 1);
          return wd === 0 || wd === 6 ? <i key={`w${i}`} className="tw-g-we" style={{ gridColumn: i + 2, gridRow: `2 / span ${COURSES.length}` }} aria-hidden="true" /> : null;
        })}
        {COURSES.map((c, r) => (
          <div key={c.k} className="tw-g-label" style={{ gridRow: r + 2 }} role="rowheader"><b>{c.n}</b><span>{c.p}</span></div>
        ))}
        {list.map((x) => (
          <span key={`${x.row}-${x.d}`} className={`tw-g-run r-${COURSES[x.row].k}${x.left === 0 ? ' is-full' : x.left <= 3 ? ' is-low' : ''}`} style={{ gridRow: x.row + 2, gridColumn: `${x.d + 1} / span ${x.len}` }} role="cell">
            {x.len > 1 ? seats(x.left) : <i title={`Taster · ${seats(x.left)}`} />}
          </span>
        ))}
      </div>

      <ul className="tw-cal-list" aria-label={`${MONTH_LONG[mi]} 2027 courses`}>
        {sorted.filter((x) => x.row !== 0).map((x) => {
          const end = x.d + x.len - 1;
          return (
            <li key={`${x.row}-${x.d}`} className={x.left === 0 ? 'is-full' : x.left <= 3 ? 'is-low' : ''}>
              <span className="tw-cl-date"><b>{x.d}{x.len > 1 ? `–${end}` : ''}</b><em>{MONTHS[mi]}</em></span>
              <span className="tw-cl-t"><b>{COURSES[x.row].n}</b><em>{WD_LONG[dow(m, x.d)]}{x.len > 1 ? ` – ${WD_LONG[dow(m, end)]}` : ''} · {COURSES[x.row].p}</em></span>
              <span className="tw-cl-s">{seats(x.left)}</span>
            </li>
          );
        })}
        <li className="tw-cl-note">Plus a taster sail every Saturday · £95</li>
      </ul>
    </div>
  );
}
