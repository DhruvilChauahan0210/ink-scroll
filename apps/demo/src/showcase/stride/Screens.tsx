import type { ReactNode } from 'react';

/* Stride's app, drawn in HTML and CSS: a phone frame and the screens that
   go in it. Fixed data only, so server and client render the same. */

export function Phone({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div className={`st-phone ${className}`} role="img" aria-label={label}>
      <div className="st-screen">
        <div className="st-status" aria-hidden="true">
          <span>9:41</span>
          <span className="st-island" />
          <span className="st-sys"><i className="sig"><b /><b /><b /><b /></i><i className="bat" /></span>
        </div>
        {children}
      </div>
    </div>
  );
}

const Tabs = ({ on }: { on: string }) => (
  <nav className="st-tabs" aria-hidden="true">
    {['Today', 'Plan', 'Record', 'Clubs', 'You'].map((t) => (
      <span key={t} className={`${t === on ? 'on' : ''}${t === 'Record' ? ' rec' : ''}`}><i />{t === 'Record' ? '' : t}</span>
    ))}
  </nav>
);

/* The interval session as blocks: distance sets the width, effort the height. */
const SESSION: { k: 'wu' | 'rep' | 'jog' | 'cd'; d: number }[] = [
  { k: 'wu', d: 2 },
  ...Array.from({ length: 6 }, (_, i) => [{ k: 'rep' as const, d: 0.8 }, ...(i < 5 ? [{ k: 'jog' as const, d: 0.4 }] : [])]).flat(),
  { k: 'cd', d: 1.4 },
];
const REP_AT = SESSION.map((b, i) => (b.k === 'rep' ? i : -1)).filter((i) => i >= 0);

/** `upto` is the rep in progress (1-based); blocks before it are done. */
export function Session({ upto = 0, className = '' }: { upto?: number; className?: string }) {
  const now = upto > 0 ? REP_AT[upto - 1] : -1;
  return (
    <div className={`st-session ${className}`} aria-hidden="true">
      {SESSION.map((b, i) => (
        <i key={i} className={`is-${b.k}${now < 0 ? '' : i < now ? ' done' : i === now ? ' now' : ''}`} style={{ flexGrow: b.d }} />
      ))}
    </div>
  );
}

export function TodayScreen() {
  const days = [
    { d: 'M', n: 27, s: 'rest' }, { d: 'T', n: 28, s: 'today' }, { d: 'W', n: 29, s: 'plan' },
    { d: 'T', n: 30, s: 'plan' }, { d: 'F', n: 31, s: 'rest' }, { d: 'S', n: 1, s: 'plan' }, { d: 'S', n: 2, s: 'long' },
  ];
  return (
    <div className="st-app">
      <div className="st-app-h">
        <div><small>Tuesday 28 October</small><b>Today</b></div>
        <span className="st-me">ID</span>
      </div>
      <div className="st-week">
        {days.map((x, i) => <span key={i} className={`is-${x.s}`}><small>{x.d}</small><b>{x.n}</b><i /></span>)}
      </div>
      <div className="st-wo">
        <div className="st-wo-top"><span className="st-tag">Intervals</span><span>Week 7 · Build</span></div>
        <b className="st-wo-t">6 × 800 m</b>
        <div className="st-wo-meta"><span><b>9.2</b> km</span><span><b>52</b> min</span><span><b>4:20</b> /km</span></div>
        <Session />
        <div className="st-wo-legend"><span>Warm-up</span><span>6 reps · 400 m jog</span><span>Cool</span></div>
      </div>
      <div className="st-note">
        <span className="st-coach-ic">S</span>
        <p><b>Coach</b>Sunday went well — your easy pace is 8 s/km quicker than in September. Keep the reps honest: no faster than 4:15.</p>
      </div>
      <span className="st-go">Start workout</span>
      <Tabs on="Today" />
    </div>
  );
}

export function LiveScreen() {
  return (
    <div className="st-live">
      <div className="st-live-top"><span className="st-rec">Rep 4 of 6</span><span>800 m</span></div>
      <div className="st-live-pace"><small>Current pace</small><b>4:17</b><span>/km</span></div>
      <div className="st-band" aria-hidden="true"><i /><em /></div>
      <div className="st-band-l"><span>4:35</span><span>target 4:15–4:25</span><span>4:05</span></div>
      <div className="st-live-grid">
        <div><small>Distance</small><b>5.62<span> km</span></b></div>
        <div><small>Time</small><b>27:48</b></div>
        <div><small>Heart rate</small><b>171<span> Z4</span></b></div>
        <div><small>Rep left</small><b>310<span> m</span></b></div>
      </div>
      <div className="st-cue"><span className="st-wave" aria-hidden="true">{[5, 9, 14, 8, 12, 6, 10, 4].map((h, i) => <i key={i} style={{ height: h }} />)}</span>“Four seconds quick. Settle — two more after this.”</div>
      <div className="st-live-btns"><span>Lap</span><span className="pause"><i /><i /></span><span>End</span></div>
    </div>
  );
}

const WEEK = [
  { d: 'Mon 27', t: 'Rest', m: 'Mobility, 15 min', s: 'done' },
  { d: 'Tue 28', t: 'Intervals', m: '6 × 800 m · 9.2 km', s: 'done' },
  { d: 'Wed 29', t: 'Tempo', m: 'Missed', s: 'missed' },
  { d: 'Thu 30', t: 'Easy', m: '6 km at 5:45–6:05', s: 'today' },
  { d: 'Fri 31', t: 'Tempo', m: '8 km · 4 km at 4:40', s: 'moved', b: 'Moved' },
  { d: 'Sat 1', t: 'Rest', m: 'Or 30 min cross-training', s: '' },
  { d: 'Sun 2', t: 'Long run', m: '16 km at 5:40', s: 'trim', b: 'Was 18 km' },
];

export function PlanScreen() {
  return (
    <div className="st-app">
      <div className="st-app-h">
        <div><small>Tejo Half · 15 March</small><b>Your plan</b></div>
        <span className="st-me">ID</span>
      </div>
      <div className="st-phases" aria-hidden="true">
        {['Base', 'Build', 'Peak', 'Taper'].map((p, i) => <span key={p} className={i === 0 ? 'done' : i === 1 ? 'on' : ''}><i />{p}</span>)}
      </div>
      <div className="st-wk"><span><b>Week 7</b> of 16</span><span>23 of 39 km</span></div>
      <div className="st-wk-bar"><i style={{ width: '59%' }} /></div>
      <ul className="st-days">
        {WEEK.map((w) => (
          <li key={w.d} className={`is-${w.s || 'plain'}`}>
            <time>{w.d}</time>
            <span><b>{w.t}</b><small>{w.m}</small></span>
            {w.b ? <em>{w.b}</em> : <i />}
          </li>
        ))}
      </ul>
      <Tabs on="Plan" />
    </div>
  );
}
