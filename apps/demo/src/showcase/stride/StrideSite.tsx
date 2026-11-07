'use client';

import './stride.css';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Site } from '../kit/Site';
import { Phone, TodayScreen, LiveScreen, PlanScreen, Session } from './Screens';
import {
  MW, MH, ROUTE, START, KM_MARKS, PARK, RIVER, ROADS_MAJOR, ROADS_MINOR, TRAILS, CITY,
  PROFILE_WIDE, PROFILE_NARROW, SPLITS, mmss, FEED_ROUTE, FEED_RIVER,
} from './geo';

/* Stride — a running app (built with Svelte in real life; the example's
   snippet is Svelte). The centrepiece is Sunday's run summary: the 21 km
   route traces itself across the map as the card scrolls in, then the
   elevation profile draws beneath it (its own ScrollDraw, selector
   .st-elev-ink). The route's ScrollDraw has no selector, so its layer holds
   the route ink alone; the map, km markers and start flag are sibling layers. */

const Mark = ({ size = 24 }: { size?: number }) => (
  <svg className="st-mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <rect width="24" height="24" rx="7" fill="var(--accent)" />
    <path d="M6 16.5c2.2 0 3-1.6 4-4.5s1.8-5 4.2-5c2 0 3.8 1.4 3.8 3.4" fill="none" stroke="#11140c" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="17.6" cy="15.6" r="1.9" fill="#11140c" />
  </svg>
);
const Star = () => <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.2 4 13.5l1-4.4-3.4-3 4.5-.5z" fill="currentColor" /></svg>;
const Check = () => <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const PhoneIc = () => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
const RobotIc = () => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 11a7 7 0 0 1 14 0v7H5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="9.5" cy="12.5" r="1" fill="currentColor" /><circle cx="14.5" cy="12.5" r="1" fill="currentColor" /><path d="M8 4.5l1.4 2M16 4.5l-1.4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;

function Badges() {
  return (
    <div className="st-badges">
      <a className="st-badge" href="#top"><PhoneIc /><span><small>Download for</small>iPhone</span></a>
      <a className="st-badge" href="#top"><RobotIc /><span><small>Get it for</small>Android</span></a>
    </div>
  );
}

/* ── The run summary: the centrepiece ───────────────────────────────────── */

const ZONES = [
  { z: 'Z5', n: 'Max', t: '3:20', p: 3 },
  { z: 'Z4', n: 'Threshold', t: '23:02', p: 22 },
  { z: 'Z3', n: 'Tempo', t: '44:05', p: 41 },
  { z: 'Z2', n: 'Endurance', t: '31:40', p: 30 },
  { z: 'Z1', n: 'Recovery', t: '4:12', p: 4 },
];
const SMIN = Math.min(...SPLITS), SMAX = Math.max(...SPLITS);

function RunSummary() {
  return (
    <article className="st-act" aria-label="Run summary: Sunday long run, 21.1 km in 1:46:19 through Monsanto, Lisbon">
      <header className="st-act-h">
        <span className="st-ava st-ava-ines" aria-hidden="true">ID</span>
        <span className="st-act-who"><b>Inês Duarte</b><small>Sunday 26 October at 08:12 · Lisbon</small></span>
        <span className="st-act-badges"><span className="st-pr">2nd fastest half this year</span><span className="st-chip">36 high-fives</span></span>
      </header>
      <h3 className="st-act-t">Sunday long run — Monsanto loop</h3>

      <div className="st-act-grid">
        <div className="st-map">
          <svg className="st-map-bg" viewBox={`0 0 ${MW} ${MH}`} aria-hidden="true">
            <defs>
              <pattern id="st-trees" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="4" r="2.2" fill="#1f2a18" /><circle cx="10" cy="10" r="2.6" fill="#1d2716" /><circle cx="11" cy="2" r="1.6" fill="#22301b" />
              </pattern>
            </defs>
            <rect width={MW} height={MH} className="st-m-land" />
            <path d={CITY} className="st-m-block" />
            <path d={PARK} className="st-m-park" />
            <path d={PARK} fill="url(#st-trees)" />
            {TRAILS.map((d, i) => <path key={i} d={d} className="st-m-trail" />)}
            {ROADS_MINOR.map((d, i) => <path key={i} d={d} className="st-m-road" />)}
            {ROADS_MAJOR.map((d, i) => <g key={i}><path d={d} className="st-m-major-c" /><path d={d} className="st-m-major" /></g>)}
            <path d={RIVER} className="st-m-water" />
            <g className="st-m-lbl">
              <text x="346" y="200" className="park">PARQUE FLORESTAL DE MONSANTO</text>
              <text x="512" y="320" className="sm">ALCÂNTARA</text>
              <text x="40" y="344" className="sm">BELÉM</text>
              <text x="400" y="24" className="sm">CAMPOLIDE</text>
              <text x="96" y="392" className="w">Rio Tejo</text>
            </g>
            <path d={ROUTE} className="st-route-bed" />
          </svg>
          <ScrollDraw className="st-route" trigger={{ start: 'top 85%', end: 'top 25%' }} easing="ease-in-out" once>
            <svg viewBox={`0 0 ${MW} ${MH}`} aria-hidden="true"><path className="st-route-ink" d={ROUTE} /></svg>
          </ScrollDraw>
          <svg className="st-map-fg" viewBox={`0 0 ${MW} ${MH}`} aria-hidden="true">
            {KM_MARKS.map(({ km, p }) => (
              <g key={km} transform={`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`} className="st-km-mark"><circle r="9" /><text y="3.2">{km}</text></g>
            ))}
            <g transform={`translate(${START[0]} ${START[1]})`} className="st-start">
              <circle r="10" /><path d="M-3.5 5V-5.5M-3.5 -5.5h7l-1.6 2.4 1.6 2.4h-7" />
            </g>
          </svg>
          <span className="st-map-tools" aria-hidden="true"><span className="on">Map</span><span>Satellite</span><span>3D</span></span>
          <span className="st-map-scale" aria-hidden="true"><i />500 m</span>
        </div>

        <div className="st-act-side">
          <dl className="st-stats">
            <div className="big"><dt>Distance</dt><dd>21.10<small> km</small></dd></div>
            <div className="big"><dt>Moving time</dt><dd>1:46:19</dd></div>
            <div className="big"><dt>Avg pace</dt><dd>5:02<small> /km</small></dd></div>
            <div><dt>Elevation gain</dt><dd>235<small> m</small></dd></div>
            <div><dt>Avg heart rate</dt><dd>156<small> bpm</small></dd></div>
            <div><dt>Max heart rate</dt><dd>182<small> bpm</small></dd></div>
            <div><dt>Cadence</dt><dd>174<small> spm</small></dd></div>
            <div><dt>Calories</dt><dd>1,412</dd></div>
            <div><dt>Training load</dt><dd>186<small> high</small></dd></div>
          </dl>
          <div className="st-zones">
            <p className="st-mini-h">Heart-rate zones</p>
            {ZONES.map((z) => (
              <div key={z.z} className={`st-zone is-${z.z.toLowerCase()}`}>
                <span className="st-zone-n"><b>{z.z}</b>{z.n}</span>
                <span className="st-zone-bar"><i style={{ width: `${(z.p / 41) * 100}%` }} /></span>
                <span className="st-zone-t">{z.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="st-prof">
        <div className="st-prof-h">
          <p className="st-mini-h">Elevation and pace</p>
          <span className="st-prof-k"><span><i className="k-elev" />Elevation</span><span><i className="k-pace" />Pace per km</span><span><i className="k-best" />Fastest km · 4:49</span></span>
        </div>
        <div className="st-prof-plot">
          <ScrollDraw className="st-elev" selector=".st-elev-ink" trigger={{ start: 'top 92%', end: 'top 40%' }} easing="ease-out" once>
            {[PROFILE_WIDE, PROFILE_NARROW].map((pf) => (
              <svg key={pf.w} className={pf === PROFILE_WIDE ? 'st-elev-w' : 'st-elev-n'} viewBox={`0 0 ${pf.w} ${pf.h}`} role="img" aria-label="Elevation: from the river at 14 m up to 205 m at kilometre 6, rolling through the park, then down to the river from kilometre 14">
                {pf.grid.map((g) => (
                  <g key={g.m}>
                    <path d={`M ${pf.left} ${g.y.toFixed(1)} H ${pf.w}`} className="st-elev-grid" />
                    <text x="0" y={(g.y + 3).toFixed(1)} className="st-elev-y">{g.m} m</text>
                  </g>
                ))}
                <path className="st-elev-area" d={pf.area} />
                <path className="st-elev-ink" d={pf.d} />
              </svg>
            ))}
          </ScrollDraw>
          <div className="st-splits" aria-label="Pace per kilometre, slowest 5:58 on the climb at kilometre 3, fastest 4:49 in the last kilometre">
            {SPLITS.map((s, i) => (
              <span key={i} className={s === SMIN ? 'best' : ''} style={{ height: `${28 + ((SMAX - s) / (SMAX - SMIN)) * 72}%` }} title={`km ${i + 1}: ${mmss(s)} /km`} />
            ))}
          </div>
          <div className="st-prof-x" aria-hidden="true"><span>0 km</span><span>5</span><span>10</span><span>15</span><span>21.1 km</span></div>
        </div>
      </div>
    </article>
  );
}

/* ── Insights ───────────────────────────────────────────────────────────── */

const WEEKS = [24, 28, 31, 26, 33, 36, 30, 38, 41, 35, 42, 39];
const PREDICT = [
  { r: '5K', t: '21:58', d: '0:41' },
  { r: '10K', t: '45:40', d: '1:22' },
  { r: 'Half marathon', t: '1:41:30', d: '2:10' },
  { r: 'Marathon', t: '3:34:50', d: '4:45' },
];
const VO2 = [47.1, 47.4, 47.2, 47.9, 48.4, 48.3, 49.0, 49.6, 49.9, 50.4, 50.6, 51.2];
const VO2_D = VO2.map((v, i) => `${i ? 'L' : 'M'} ${(i * 280) / 11} ${(80 - ((v - 46.5) / 5) * 70).toFixed(1)}`).join(' ');

/* ── Clubs ──────────────────────────────────────────────────────────────── */

const FIVES = ['IR', 'TM', 'JC', 'AF'];

/* ── Pricing ────────────────────────────────────────────────────────────── */

const COMPARE: [string, boolean, boolean][] = [
  ['GPS tracking, maps and route drawings', true, true],
  ['Clubs, challenges and high-fives', true, true],
  ['Heart-rate zones and splits', true, true],
  ['Adaptive training plans, 5K to marathon', false, true],
  ['Audio coaching on every run', false, true],
  ['Race predictions and fitness trend', false, true],
  ['Offline maps and route planning', false, true],
  ['Strength and mobility sessions', false, true],
];

const REVIEWS = [
  { t: 'Finally a plan that forgives', b: 'I travel for work and used to fall off every plan by week three. Stride just quietly moves things around. Ran my first sub-1:50 half in March.', n: 'Rafaela M.', w: 'Half marathon, Porto' },
  { t: 'The audio coach is the best part', b: 'It tells me when I am going out too fast on intervals, which is always. Sounds like a person, not a robot reading numbers.', n: 'Duarte P.', w: '10K, Lisbon' },
  { t: 'I look at the route maps for fun', b: 'Seeing a whole week of runs drawn out on the map is weirdly motivating. Also the only app my running club agreed on.', n: 'Sara K.', w: 'Club captain, Belém' },
];

const QR = (() => {
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const finder = (x: number, y: number) => x < 8 && y < 8;
  let d = '';
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      if (finder(x, y) || finder(24 - x, y) || finder(x, 24 - y)) continue;
      if (r() < 0.48) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  const box = (x: number, y: number) => `M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z M${x + 2} ${y + 2}h3v3h-3z`;
  return { bits: d, finders: [box(0, 0), box(18, 0), box(0, 18)].join(' ') };
})();

const FOOT = [
  { h: 'App', l: ['Training plans', 'Audio coaching', 'Route drawings', 'Watches and sensors'] },
  { h: 'Run with others', l: ['Clubs', 'Challenges', 'Race partners', 'Stride for coaches'] },
  { h: 'Company', l: ['About', 'Careers', 'Press kit', 'Contact'] },
  { h: 'Help', l: ['Support', 'Privacy', 'Terms', 'Cancel a subscription'] },
];

export function StrideSite() {
  return (
    <Site
      className="st"
      brand={<><Mark />Stride</>}
      links={['Training', 'Coaching', 'Clubs', 'Pricing']}
      cta="Get the app"
      example="svelte"
      apis="use:scrollDraw · createScrollDraw"
      footnote="Running, planned around your week"
    >
      <section className="st-hero">
        <div className="st-hero-copy">
          <h1 className="st-h1">Run your best race, remember every run</h1>
          <p className="st-lede">Stride builds a plan around your week, coaches you in your ear while you run, and draws every route and climb when you get home. From your first 5K to your next marathon.</p>
          <Badges />
          <div className="st-rating">
            <span className="st-stars"><Star /><Star /><Star /><Star /><Star /></span>
            <span><b>4.9</b> from 38,400 ratings</span>
            <span className="st-dot" />
            <span><b>1.2 M</b> runners</span>
          </div>
        </div>
        <div className="st-hero-art">
          <Phone className="st-phone-back" label="Stride during an interval session: rep 4 of 6 at 4:17 per kilometre, with an audio cue on screen"><LiveScreen /></Phone>
          <Phone className="st-phone-front" label="Stride's Today screen: Tuesday's interval session, six by 800 metres, with a note from the coach"><TodayScreen /></Phone>
          <div className="st-float st-float-pred" aria-hidden="true">
            <small>Half marathon prediction</small>
            <b>1:41:30</b>
            <span className="st-down">↓ 2:10 since August</span>
          </div>
        </div>
      </section>

      <section className="st-logos" aria-label="Race and club partners">
        <p>Official training app of</p>
        <div className="st-logo-row">
          <span className="l1">TEJO HALF<small>MARATHON</small></span>
          <span className="l2">Belém Track Club</span>
          <span className="l3">porto/night/runners</span>
          <span className="l4">MONSANTO <b>25K</b></span>
          <span className="l5">Corrida das Sete Colinas</span>
          <span className="l6">ALGARVE COAST ULTRA</span>
        </div>
      </section>

      <section className="st-sec" id="runs">
        <div className="st-head st-head-2">
          <div>
            <p className="st-k">Run summaries</p>
            <h2 className="st-h2">Every run, drawn back to you</h2>
          </div>
          <p className="st-sub">Get home and Stride has already drawn it: the route across the map, the climb you felt in your legs, every split and how long you spent in each heart-rate zone.</p>
        </div>
        <RunSummary />
      </section>

      <section className="st-sec st-alt" id="plans">
        <div className="st-split">
          <div className="st-split-copy">
            <p className="st-k">Training plans</p>
            <h2 className="st-h2">A plan that moves when life does</h2>
            <p className="st-sub">Tell Stride your race, your days and your current 5K. It builds sixteen weeks around them — and when a meeting eats Wednesday, it rebuilds the rest of the week instead of leaving a red cross on it.</p>
            <ul className="st-ticks">
              <li><Check />Plans for 5K, 10K, half and full marathon, and ultras</li>
              <li><Check />Paces recalculated from every run, not a test once a month</li>
              <li><Check />Strength and mobility sessions that fit around the miles</li>
            </ul>
          </div>
          <div className="st-plan-art">
            <Phone className="st-phone-plan" label="Stride's plan screen: week 7 of 16, with a missed tempo moved to Friday and Sunday's long run trimmed to 16 km"><PlanScreen /></Phone>
            <div className="st-plan-cards" aria-hidden="true">
              <div className="st-toast">
                <span className="st-toast-ic"><Mark size={28} /></span>
                <span><b>Plan updated</b>We moved Wednesday’s tempo to Friday and trimmed Sunday to 16 km, so you start week 8 fresh.</span>
              </div>
              <div className="st-race">
                <span className="st-race-top"><b>Tejo Half Marathon</b><em>19 weeks</em></span>
                <small>Sunday 15 March · Lisbon</small>
                <div className="st-race-wk">{Array.from({ length: 16 }, (_, i) => <i key={i} className={i < 6 ? 'done' : i === 6 ? 'now' : i > 12 ? 'taper' : ''} />)}</div>
                <dl>
                  <div><dt>Goal</dt><dd>1:45:00</dd></div>
                  <div><dt>Predicted</dt><dd className="st-down">1:41:30</dd></div>
                  <div><dt>Race pace</dt><dd>4:49 /km</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="st-sec" id="coaching">
        <div className="st-head st-head-2">
          <div>
            <p className="st-k">Audio coaching</p>
            <h2 className="st-h2">A coach in your ear, on every rep</h2>
          </div>
          <p className="st-sub">Cues are written by our coaches and timed to your pace, your heart rate and the hill you are on. Your music ducks for a second, never stops.</p>
        </div>
        <div className="st-coach">
          <div className="st-coach-h">
            <span className="st-tag">Intervals</span>
            <b>6 × 800 m at 4:20 /km</b>
            <span className="st-coach-meta">Tuesday 28 October · 9.2 km · rep 4 of 6</span>
          </div>
          <Session upto={4} className="st-session-lg" />
          <div className="st-session-x" aria-hidden="true"><span>Warm-up 2 km</span><span>Reps 800 m · jog 400 m</span><span>Cool-down</span></div>
          <ol className="st-cues">
            <li><time>0:00</time><p>“Easy for two kilometres. Conversational — 5:50 or slower.”</p></li>
            <li><time>11:42</time><p>“Warm-up done. First rep in three, two, one.”</p></li>
            <li><time>21:05</time><p>“Rep three, right on 4:20. That’s the pace — remember how it feels.”</p></li>
            <li className="now"><time>27:31</time><p>“Four seconds quick. Settle — two more after this.”</p><span className="st-wave" aria-hidden="true">{[6, 11, 16, 9, 14, 7, 12, 5, 10, 15, 8].map((h, i) => <i key={i} style={{ height: h }} />)}</span></li>
            <li className="next"><time>Next</time><p>“Last one. Whatever is left, use it.”</p></li>
          </ol>
        </div>
      </section>

      <section className="st-sec st-alt" id="insights">
        <div className="st-head">
          <p className="st-k">Insights</p>
          <h2 className="st-h2">Watch your fitness change, week by week</h2>
        </div>
        <div className="st-ins">
          <article className="st-card">
            <p className="st-mini-h">Weekly distance</p>
            <p className="st-big">39 km <span className="st-up">+34% this block</span></p>
            <div className="st-weeks" aria-hidden="true">
              {WEEKS.map((w, i) => <span key={i} className={i === WEEKS.length - 1 ? 'on' : ''} style={{ height: `${(w / 44) * 100}%` }} />)}
              <i className="st-target" style={{ bottom: `${(40 / 44) * 100}%` }}><em>Plan 40 km</em></i>
            </div>
            <div className="st-weeks-x"><span>Aug</span><span>Sep</span><span>Oct</span></div>
          </article>
          <article className="st-card">
            <p className="st-mini-h">Race predictions</p>
            <table className="st-pred">
              <tbody>
                {PREDICT.map((p) => (
                  <tr key={p.r}><th>{p.r}</th><td>{p.t}</td><td className="st-down">↓ {p.d}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="st-card-f">From your last six weeks of runs, updated after every one.</p>
          </article>
          <article className="st-card">
            <p className="st-mini-h">Fitness · VO₂ max</p>
            <p className="st-big">51.2 <span className="st-up">+4.1 since August</span></p>
            <svg className="st-vo2" viewBox="0 0 280 90" aria-hidden="true">
              <path d="M0 80 H280 M0 45 H280 M0 10 H280" className="g" />
              <path d={`${VO2_D} L 280 90 L 0 90 Z`} className="a" />
              <path d={VO2_D} className="l" />
              <circle cx="280" cy={(80 - ((51.2 - 46.5) / 5) * 70).toFixed(1)} r="4.5" className="d" />
            </svg>
            <p className="st-card-f">Top 12% of women aged 30–34 on Stride.</p>
          </article>
        </div>
      </section>

      <section className="st-sec" id="clubs">
        <div className="st-split st-split-clubs">
          <div className="st-split-copy">
            <p className="st-k">Clubs</p>
            <h2 className="st-h2">Run together, even on the days you run alone</h2>
            <p className="st-sub">Join a club for its Sunday long run, follow friends’ routes across the city, and give a high-five to the person who got out of bed at six.</p>
            <ul className="st-ticks">
              <li><Check />4,600 clubs, from track groups to parkrun regulars</li>
              <li><Check />Monthly challenges with badges that mean something</li>
              <li><Check />Privacy zones hide where your runs start and end</li>
            </ul>
          </div>
          <div className="st-feed">
            <article className="st-post">
              <header>
                <span className="st-ava st-ava-marta" aria-hidden="true">MS</span>
                <span className="st-post-who"><b>Marta Sousa</b><small>Yesterday at 07:04 · Lisbon</small></span>
                <span className="st-dots" aria-hidden="true">···</span>
              </header>
              <h4>Sunrise along the river</h4>
              <dl className="st-post-stats">
                <div><dt>Distance</dt><dd>12.4 km</dd></div>
                <div><dt>Pace</dt><dd>5:12 /km</dd></div>
                <div><dt>Time</dt><dd>1:04:29</dd></div>
              </dl>
              <svg className="st-post-map" viewBox="0 0 300 100" aria-hidden="true">
                <rect width="300" height="100" className="land" />
                <path d="M0 40 H300 M60 0 V100 M140 0 V100 M220 0 V100 M0 20 H300" className="st-post-street" />
                <path d={FEED_RIVER} className="water" />
                <path d={FEED_ROUTE} className="route" />
                <circle cx="14" cy="70" r="4.5" className="s" /><circle cx="286" cy="30" r="4.5" className="e" />
              </svg>
              <footer>
                <span className="st-fives">{FIVES.map((f, i) => <i key={f} className={`f${i}`}>{f}</i>)}</span>
                <span><b>Inês</b> and 23 others high-fived</span>
                <span className="st-com">4 comments</span>
              </footer>
            </article>
            <div className="st-feed-r">
              <article className="st-club">
                <div className="st-club-cover" aria-hidden="true">
                  <svg viewBox="0 0 300 78" preserveAspectRatio="xMidYMid slice"><path d="M30 60 C 70 58, 90 30, 130 34 S 190 62, 220 44 S 262 16, 284 20" /><circle cx="284" cy="20" r="4" /></svg>
                  <span>LSLR</span>
                </div>
                <b>Lisbon Sunday Long Run</b>
                <small>1,284 members · Lisbon</small>
                <p className="st-club-next"><span>Sun 2 Nov · 08:00</span>Jardim da Estrela · 16 km at 5:45</p>
                <div className="st-club-f"><span className="st-fives">{FIVES.slice(0, 3).map((f, i) => <i key={f} className={`f${i + 1}`}>{f}</i>)}</span><span>18 going</span><span className="st-join">Join</span></div>
              </article>
              <article className="st-chal">
                <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="32" className="t" /><circle cx="40" cy="40" r="32" className="p" pathLength="100" strokeDasharray="62 100" transform="rotate(-90 40 40)" /></svg>
                <span className="st-chal-n"><b>62</b>/100 km</span>
                <span className="st-chal-t"><b>November 100</b><small>4,812 runners · 29 days left</small></span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="st-sec st-alt" id="pricing">
        <div className="st-head st-head-c">
          <p className="st-k">Pricing</p>
          <h2 className="st-h2">Free to run, premium to train</h2>
          <p className="st-sub">Every run is tracked and drawn for free, forever. Premium adds the coach.</p>
        </div>
        <div className="st-plans">
          <article className="st-plan">
            <h3>Free</h3>
            <p className="st-price"><b>€0</b> forever</p>
            <p className="st-plan-d">Track, map and share every run, and join any club.</p>
            <ul className="st-plan-l"><li><Check />GPS tracking and route drawings</li><li><Check />Splits and heart-rate zones</li><li><Check />Clubs and monthly challenges</li></ul>
            <a className="sk-btn sk-btn-ghost" href="#top">Download free</a>
          </article>
          <article className="st-plan hot">
            <span className="st-plan-flag">14 days free</span>
            <h3>Premium</h3>
            <p className="st-price"><b>€59.99</b> a year <span className="st-save">€5 a month · save 44%</span></p>
            <p className="st-plan-d">Everything in Free, plus the coach. Or €8.99 billed monthly.</p>
            <ul className="st-plan-l"><li><Check />Adaptive plans from 5K to marathon</li><li><Check />Audio coaching on every run</li><li><Check />Race predictions and fitness trend</li></ul>
            <a className="sk-btn" href="#top">Start your free trial</a>
          </article>
        </div>
        <table className="st-compare">
          <thead><tr><th>What you get</th><th>Free</th><th>Premium</th></tr></thead>
          <tbody>
            {COMPARE.map(([f, a, b]) => (
              <tr key={f}><th>{f}</th><td>{a ? <Check /> : <span className="st-no">—</span>}</td><td>{b ? <Check /> : <span className="st-no">—</span>}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="st-sec" id="reviews">
        <div className="st-head st-head-2">
          <div>
            <p className="st-k">Reviews</p>
            <h2 className="st-h2">4.9 stars from 38,400 runners</h2>
          </div>
          <p className="st-sub">Editors’ pick in the running category, and the training app of six clubs and races across Portugal.</p>
        </div>
        <div className="st-reviews">
          {REVIEWS.map((r) => (
            <article key={r.n} className="st-review">
              <span className="st-stars"><Star /><Star /><Star /><Star /><Star /></span>
              <h3>{r.t}</h3>
              <p>{r.b}</p>
              <small><b>{r.n}</b> · {r.w}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="st-cta">
        <div>
          <h2>Your next run is already planned</h2>
          <p>Download Stride, tell it your race, and your first week is waiting before you lace up.</p>
          <Badges />
        </div>
        <div className="st-qr">
          <svg viewBox="-2 -2 29 29" aria-hidden="true"><rect x="-2" y="-2" width="29" height="29" rx="3" className="bg" /><path d={QR.bits} /><path d={QR.finders} fillRule="evenodd" /></svg>
          <span>Scan to download on your phone</span>
        </div>
      </section>

      <nav className="st-sitemap" aria-label="Footer">
        <div className="st-sitemap-brand">
          <span className="sk-brand"><Mark />Stride</span>
          <p>Stride Running, Lda · Lisbon and Porto</p>
          <p className="st-sitemap-s"><span className="st-stars"><Star /><Star /><Star /><Star /><Star /></span> 4.9 · iPhone and Android</p>
        </div>
        {FOOT.map((c) => (
          <div key={c.h}><b>{c.h}</b>{c.l.map((l) => <a key={l} href="#top">{l}</a>)}</div>
        ))}
      </nav>
    </Site>
  );
}
