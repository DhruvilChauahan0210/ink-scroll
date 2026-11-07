'use client';

import './halyard.css';
import type { ReactNode } from 'react';
import { Site } from '../kit/Site';
import { RevenueChart } from './RevenueChart';
import { NetworkMap } from './NetworkMap';
import { CALENDAR, DOWNLOADS, FIVE_YEAR, FLEET, KPIS, QUARTERS, ROUTES, SEGMENTS, YEARS } from './data';

/* Halyard Capital — the online edition of a North Sea ferry group's 2026
   annual report, laid out like the IR microsites the big lines publish:
   report bar and share price, a cover, key figures, the CEO's letter, the
   performance chapter (the scroll-drawn revenue chart, scrollDrawTimeline),
   the route network, the fleet list, sustainability, the five-year summary,
   downloads and the financial calendar. */

const Mark = () => (
  <svg className="hy-mark" viewBox="0 0 28 28" aria-hidden="true">
    <rect width="28" height="28" fill="var(--ink)" />
    <path d="M14 5 V21 M8.5 21 C 10 23.4, 18 23.4, 19.5 21 M14 5 L 21 15.5 H 14 M14 7.5 L 8 15.5 H 14" fill="none" stroke="var(--brass-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** A ro-ro freight ferry in elevation — bridge forward, trailers on the weather deck. */
const Ship = () => {
  const trailers = Array.from({ length: 7 }, (_, i) => 30 + i * 25);
  const windows = Array.from({ length: 8 }, (_, i) => 237 + i * 5.2);
  return (
    <svg className="hy-ship" viewBox="0 0 320 112" aria-hidden="true">
      <path d="M 16 58 L 300 56 Q 305 77 290 95 L 27 95 Q 19 80 16 58 Z" />
      <path d="M 291 91 Q 305 92 302 84" />
      <path d="M 20 84 L 297 84" className="thin" />
      <path d="M 16 58 L 7 75 M 9 71 L 18 70" className="thin" />
      {trailers.map((x) => <path key={x} className="thin" d={`M ${x} 56 V 47 H ${x + 21} V 56 M ${x + 4} 56 v 2 M ${x + 17} 56 v 2`} />)}
      <path d="M 206 56 V 37 L 211 33 H 219 V 56" />
      <path d="M 206 41 H 219" className="thin" />
      <path d="M 228 56 V 34 H 283 L 291 41 V 56" />
      <path d="M 232 34 V 26 H 279 V 34 M 224 26 H 286" />
      {windows.map((x) => <path key={x} className="thin" d={`M ${x.toFixed(1)} 30 h 3`} />)}
      <path d="M 236 41 H 284 M 236 48 H 286" className="thin" />
      <path d="M 256 26 V 13 M 251 17 H 261" className="thin" />
      <text x="120" y="76" className="hy-ship-name">HALYARD</text>
      <path className="thin sea" d="M 0 102 q 10 -4 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0" />
    </svg>
  );
};

function Spark({ s }: { s: readonly number[] }) {
  const lo = Math.min(...s), hi = Math.max(...s);
  const pts = s.map((v, i) => [4 + i * 23, 26 - ((v - lo) / (hi - lo || 1)) * 20] as const);
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="hy-spark" viewBox="0 0 100 30" aria-hidden="true">
      <path d={`M ${pts.map(([x, yy]) => `${x} ${yy.toFixed(1)}`).join(' L ')}`} />
      <circle cx={lx} cy={ly.toFixed(1)} r="2.6" />
    </svg>
  );
}

function Head({ n, k, title, lede, id, aside }: { n: string; k: string; title: ReactNode; lede?: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <header className={`hy-head${aside ? ' has-aside' : ''}`} id={id}>
      <div>
        <p className="hy-ch"><span>{n}</span>{k}</p>
        <h2 className="hy-h2">{title}</h2>
        {lede && <p className="hy-lede">{lede}</p>}
      </div>
      {aside && <div className="hy-head-aside">{aside}</div>}
    </header>
  );
}

const XLink = ({ t, m }: { t: string; m: string }) => (
  <a className="hy-xlink" href="#downloads"><FileIcon f="XLSX" /><span><b>{t}</b><em>{m}</em></span></a>
);

const FileIcon = ({ f }: { f: string }) => (
  <span className={`hy-file is-${f.toLowerCase()}`} aria-hidden="true">
    <svg viewBox="0 0 30 36"><path d="M2 2 H20 L28 10 V34 H2 Z" /><path d="M20 2 V10 H28" /></svg>
    <b>{f}</b>
  </span>
);

/** Five little bars, scaled to the row's own range, for the five-year table. */
function Bars({ v }: { v: string[] }) {
  const n = v.map((x) => parseFloat(x.replace(/,/g, '')));
  const lo = Math.min(...n) * 0.8, hi = Math.max(...n);
  return (
    <span className="hy-bars" aria-hidden="true">
      {n.map((x, i) => <i key={i} style={{ height: `${(20 + ((x - lo) / (hi - lo || 1)) * 80).toFixed(0)}%` }} className={i === 4 ? 'on' : ''} />)}
    </span>
  );
}

const SEG_TOTAL = SEGMENTS.reduce((a, s) => a + s.v, 0);
const MARKETS = [{ n: 'United Kingdom', p: 46 }, { n: 'Continental Europe', p: 32 }, { n: 'Norway', p: 22 }];

/* Each segment's share and where its arc starts, precomputed once. */
const ARCS = SEGMENTS.map((s, i) => ({
  ...s,
  share: (s.v / SEG_TOTAL) * 100,
  start: (SEGMENTS.slice(0, i).reduce((a, x) => a + x.v, 0) / SEG_TOTAL) * 100,
}));

function Donut() {
  return (
    <div className="hy-donut">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        {ARCS.map((a) => (
          <circle key={a.n} cx="100" cy="100" r="78" pathLength="100" stroke={a.c} strokeDasharray={`${(a.share - 0.6).toFixed(2)} ${(100 - a.share + 0.6).toFixed(2)}`} strokeDashoffset={(-a.start).toFixed(2)} />
        ))}
      </svg>
      <span><b>€1,870m</b><em>Net revenue</em></span>
    </div>
  );
}

/* Carbon intensity, g CO₂e per cargo-tonne-km, against the 2019 baseline. */
const INTENSITY: [number, number][] = [[2019, 68.0], [2022, 63.1], [2023, 61.4], [2024, 59.8], [2025, 58.2], [2026, 54.9]];
const ex = (yr: number) => +(44 + ((yr - 2019) / 11) * 736).toFixed(1);
const ey = (v: number) => +(250 - (v - 36) * 6.2).toFixed(1);

export function HalyardSite() {
  return (
    <Site
      className="hy"
      brand={<><Mark />Halyard Capital</>}
      links={['Highlights', 'Performance', 'Fleet', 'Sustainability', 'Investors']}
      cta="Download PDF"
      example="timeline-api"
      apis="scrollDrawTimeline · tracks"
      footnote="Halyard Capital N.V. · Rotterdam · Annual Report 2026"
    >
      {/* Report bar: edition, share price, language */}
      <div className="hy-bar">
        <span className="hy-bar-ed"><b>Annual Report 2026</b><span>Published 26 February 2027</span></span>
        <span className="hy-ticker" aria-label="Share price: HLYD on Euronext Amsterdam, €38.62, up 1.24%">
          <b>HLYD</b><span>Euronext Amsterdam</span><em>€38.62</em><i>▲ 1.24%</i>
        </span>
        <span className="hy-lang"><b>EN</b><span>NL</span></span>
      </div>

      {/* Cover */}
      <section className="hy-cover">
        <div className="hy-cover-copy">
          <p className="hy-eyebrow">Annual Report 2026 · Integrated</p>
          <h1 className="hy-h1">A steadier year, and our strongest finish</h1>
          <p className="hy-lede hy-lede-lg">Net revenue rose 14% to €1.87 billion and the fourth quarter was the best in our 31-year history. We opened Rotterdam–Aberdeen, kept 98.2% of 9,412 sailings on schedule and cut the carbon intensity of the fleet by another 6%.</p>
          <div className="hy-ctas">
            <a className="hy-btn" href="#downloads">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m-4-4 4 4 4-4M4 16h12" /></svg>
              Download the report
            </a>
            <a className="hy-btn hy-btn-ghost" href="#highlights">Key figures</a>
          </div>
          <p className="hy-cover-meta">PDF · 212 pages · 8.4 MB &nbsp;·&nbsp; Also as ESEF and XLSX</p>
        </div>

        <div className="hy-books" aria-label="Cover of the Annual Report 2026">
          <div className="hy-book hy-book-back" aria-hidden="true">
            <span>Sustainability statement 2026</span>
            <b>ESRS · EU Taxonomy</b>
          </div>
          <div className="hy-book">
            <div className="hy-book-top"><Mark /><span>Halyard Capital N.V.</span></div>
            <p className="hy-book-k">Annual Report</p>
            <p className="hy-book-y">2026</p>
            <p className="hy-book-t">Holding course</p>
            <Ship />
            <div className="hy-book-foot"><span>Integrated annual report, including the sustainability statement</span></div>
          </div>
          <div className="hy-book-chip" aria-hidden="true">
            <FileIcon f="PDF" />
            <span><b>Annual Report 2026</b><em>212 pages · 8.4 MB</em></span>
          </div>
        </div>
      </section>

      {/* Chapter nav */}
      <nav className="hy-toc" aria-label="Report chapters">
        {['Highlights', 'CEO letter', 'Performance', 'Network', 'Fleet', 'Sustainability', 'Five-year summary', 'Downloads'].map((c, i) => (
          <a key={c} href="#highlights"><span>0{i + 1}</span>{c}</a>
        ))}
      </nav>

      {/* 01 Highlights */}
      <section className="hy-sec" id="highlights">
        <Head n="01" k="Highlights" title="2026 at a glance" lede="Group figures for the year to 31 December 2026, against 2025. The line under each figure is its five-year trend." aside={<XLink t="Key figures 2017–2026" m="XLSX · 184 KB" />} />
        <div className="hy-kpis">
          {KPIS.map((k) => (
            <div key={k.k} className="hy-kpi">
              <p className="hy-kpi-k">{k.k}{'proposed' in k && <em>Proposed</em>}</p>
              <p className="hy-kpi-v">{k.v}{'u' in k && <small>{k.u}</small>}</p>
              <div className="hy-kpi-f"><span className="hy-up">{k.d}</span><Spark s={k.s} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* 02 CEO letter */}
      <section className="hy-sec hy-tint" id="letter">
        <div className="hy-letter">
          <aside className="hy-letter-side">
            <p className="hy-ch"><span>02</span>Letter from the CEO</p>
            <blockquote className="hy-pull">“Shipping rewards the companies that keep their schedules when the weather does not.”</blockquote>
            <div className="hy-person">
              <span className="hy-avatar" aria-hidden="true">IV</span>
              <span><b>Ingrid Vos</b><em>Chief Executive Officer since 2021</em></span>
            </div>
            <ul className="hy-in">
              <li><span>p. 6</span>Results and the dividend</li>
              <li><span>p. 7</span>Opening the Aberdeen route</li>
              <li><span>p. 8</span>The 2028 newbuilds</li>
              <li><span>p. 9</span>Our people</li>
            </ul>
          </aside>
          <div className="hy-letter-body">
            <p className="hy-drop">Dear shareholders, 2026 began with the stormiest first quarter we have recorded in a decade, and ended with the best three months in Halyard’s history. In between, the people on our ships and in our terminals did what they always do: they kept the schedule. 98.2% of 9,412 sailings left and arrived on time, and our customers noticed.</p>
            <p>Net revenue rose 14% to €1.87 billion. Freight volumes grew 9%, helped by near-shoring of manufacturing into the UK and Norway, and our EBIT margin widened to 21.4% as the new capacity filled. Free cash flow of €312 million lets us propose a dividend of €1.40 per share, up from €1.25, while keeping net debt at 1.6 times EBITDA.</p>
            <p>In June we opened Rotterdam–Aberdeen, our first new route in seven years, with <i>Shearwater</i>. It was full by its fifth sailing. And in September we signed for two methanol-ready ro-ro vessels, <i>Guillemot</i> and <i>Razorbill</i>, the largest and cleanest ships we have ever ordered, for delivery in 2028.</p>
            <div className="hy-sign">
              <svg viewBox="0 0 220 70" aria-hidden="true">
                <path d="M 12 54 C 18 40, 22 20, 28 12 C 31 9, 32 14, 29 24 C 25 38, 19 52, 14 58 C 12 61, 17 56, 24 46 C 32 34, 38 24, 42 22 C 44 34, 46 46, 50 50 C 55 40, 60 28, 64 20 C 62 32, 64 44, 72 44 C 80 44, 82 32, 74 32 C 68 33, 68 42, 76 44 C 84 46, 88 36, 94 34 C 99 33, 98 40, 92 44 C 88 47, 94 52, 102 48 C 120 42, 160 40, 206 34" />
              </svg>
              <p><b>Ingrid Vos</b> Chief Executive Officer · Rotterdam, 25 February 2027</p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 Performance — the scroll-drawn chart */}
      <section className="hy-sec" id="performance">
        <Head n="03" k="Performance" title="Each quarter beat the same quarter of 2025" lede="Revenue grew in every quarter despite a weather-hit start. The fourth quarter — the first full one on the Aberdeen route — was the best we have ever reported." />
        <div className="hy-perf">
          <RevenueChart />
          <div className="hy-qtable">
            <table>
              <thead>
                <tr><th scope="col">Quarter</th><th scope="col">Revenue</th><th scope="col">vs 2025</th><th scope="col">EBIT margin</th></tr>
              </thead>
              <tbody>
                {QUARTERS.map((q) => (
                  <tr key={q.q}>
                    <th scope="row">{q.q}<span>{q.months}</span></th>
                    <td>€{q.v}m</td>
                    <td className="hy-up">+{(((q.v - q.py) / q.py) * 100).toFixed(1)}%</td>
                    <td>{q.ebit.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">FY 2026</th><td>€1,870m</td><td className="hy-up">+14.0%</td><td>21.4%</td></tr>
              </tfoot>
            </table>
            <ol className="hy-qnotes">
              {QUARTERS.map((q) => <li key={q.q}><b>{q.q}</b>{q.note}</li>)}
            </ol>
          </div>
        </div>

        <div className="hy-segs">
          <div className="hy-segs-head">
            <h3>Revenue by segment</h3>
            <p>€ million and share of group net revenue, 2026</p>
            <Donut />
          </div>
          <div className="hy-seg-list">
            {SEGMENTS.map((s) => (
              <div key={s.n} className="hy-seg-row">
                <i style={{ background: s.c }} />
                <span className="hy-seg-n"><b>{s.n}</b><em>{s.d}</em></span>
                <span className="hy-seg-v">€{s.v.toLocaleString('en-GB')}m</span>
                <span className="hy-seg-p">{Math.round((s.v / SEG_TOTAL) * 100)}%</span>
                <span className="hy-up">{s.yoy}</span>
              </div>
            ))}
            <div className="hy-markets">
              <p>By destination market</p>
              <div className="hy-mkt-bar" aria-hidden="true">{MARKETS.map((m) => <i key={m.n} style={{ flexGrow: m.p }} />)}</div>
              <ul>{MARKETS.map((m) => <li key={m.n}><i />{m.n}<b>{m.p}%</b></li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* 04 Network */}
      <section className="hy-sec hy-tint" id="network">
        <div className="hy-net">
          <div className="hy-map">
            <NetworkMap />
            <div className="hy-map-key" aria-hidden="true">
              <span><i className="k-route" />Route</span><span><i className="k-new" />New in 2026</span><span><i className="k-hq" />Head office</span>
              <em>Own berths in Rotterdam, Esbjerg, Immingham, Cuxhaven, Zeebrugge and Teesport</em>
            </div>
          </div>
          <div className="hy-net-side">
            <Head n="04" k="Network" title="Seven routes across the North Sea" lede="39 departures a week between nine ports, six of them with our own berths. Rotterdam–Aberdeen joined the network on 3 June." />
            <table className="hy-routes">
              <thead><tr><th scope="col">Route</th><th scope="col">Per week</th><th scope="col">Crossing</th><th scope="col">2026 volume</th></tr></thead>
              <tbody>
                {ROUTES.map((r) => (
                  <tr key={r.from + r.to}>
                    <th scope="row">{r.from}<span aria-hidden="true">–</span>{r.to}</th>
                    <td>{r.week}</td>
                    <td>{r.hrs}</td>
                    <td>{'isNew' in r ? <span className="hy-pill is-new">New route</span> : <span className="hy-up">{r.trend}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 05 Fleet */}
      <section className="hy-sec" id="fleet">
        <Head n="05" k="Fleet" title="38 ships, two more on the way" lede="29 owned and 9 on charter, with an average age of 11.4 years. The core of each route below; the full list is on page 54 of the report." />
        <div className="hy-fleet-stats">
          <div><b>38</b><span>vessels in operation</span><div className="hy-own" aria-hidden="true"><i style={{ flexGrow: 29 }} /><i style={{ flexGrow: 9 }} /></div><em>29 owned · 9 chartered</em></div>
          <div><b>146,200</b><span>lane metres of capacity</span><em>+4,500 with Shearwater</em></div>
          <div><b>11.4 yrs</b><span>average fleet age</span><em>Industry average 21 years</em></div>
          <div><b>2</b><span>methanol-ready ships on order</span><em>€212m · delivery 2028</em></div>
        </div>
        <div className="hy-tablewrap">
          <table className="hy-fleet">
            <thead>
              <tr><th scope="col">Vessel</th><th scope="col">Type</th><th scope="col">Built</th><th scope="col">Capacity</th><th scope="col">Deployed on</th><th scope="col">Fuel</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {FLEET.map((v) => (
                <tr key={v.n}>
                  <th scope="row"><span className="hy-vessel">{v.n}</span></th>
                  <td>{v.t}</td>
                  <td className="num">{v.built}</td>
                  <td className="num">{v.cap}</td>
                  <td>{v.route}</td>
                  <td>{v.fuel}</td>
                  <td><span className={`hy-status is-${v.st}`}>{v.stl}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 06 Sustainability */}
      <section className="hy-sec hy-dark" id="sustainability">
        <Head n="06" k="Sustainability" title="Less carbon for every trailer we carry" lede="Our 2030 target is a 40% cut in CO₂e per cargo-tonne-kilometre against 2019. We are at −19%, ahead of the −15% interim target we set for 2026." />
        <div className="hy-esg">
          <div className="hy-esg-card hy-esg-wide">
            <p className="hy-esg-k">CO₂e intensity, g per cargo-tonne-km</p>
            <p className="hy-esg-v">54.9 <span className="hy-down">−5.7% in 2026 · −19.3% vs 2019</span></p>
            <ul className="hy-esg-legend" aria-hidden="true"><li><i className="l-act" />Actual</li><li><i className="l-tgt" />Target path to 2030</li></ul>
            <svg className="hy-esg-chart" viewBox="0 0 800 290" role="img" aria-label="Carbon intensity fell from 68.0 grams in 2019 to 54.9 in 2026, below the interim target of 57.8 and on the path to 40.8 by 2030">
              {[40, 50, 60, 70].map((v) => (
                <g key={v}><path className="g" d={`M 40 ${ey(v)} H 790`} /><text x="30" y={ey(v) + 4} textAnchor="end">{v}</text></g>
              ))}
              <path className="target" d={`M ${ex(2019)} ${ey(68)} L ${ex(2026)} ${ey(57.8)} L ${ex(2030)} ${ey(40.8)}`} />
              <path className="actual" d={`M ${INTENSITY.map(([yr, v]) => `${ex(yr)} ${ey(v)}`).join(' L ')}`} />
              <circle className="tgt-pt" cx={ex(2026)} cy={ey(57.8)} r="3.5" />
              <circle className="now" cx={ex(2026)} cy={ey(54.9)} r="5" />
              <text className="lbl" x={ex(2026) - 12} y={ey(54.9) + 26} textAnchor="end">2026 actual · 54.9</text>
              <text className="lbl tgt" x={ex(2026) + 12} y={ey(57.8) - 12}>2026 interim target · 57.8</text>
              <text className="lbl tgt" x={ex(2030) - 4} y={ey(40.8) - 14} textAnchor="end">2030 target · 40.8</text>
              {[2019, 2022, 2024, 2026, 2028, 2030].map((t) => (
                <text key={t} x={ex(t)} y="284" textAnchor="middle">{t}</text>
              ))}
            </svg>
          </div>
          <div className="hy-esg-card">
            <p className="hy-esg-k">Berths with shore power</p>
            <p className="hy-esg-v">9 <small>of 14</small></p>
            <div className="hy-berths" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} className={i < 9 ? 'on' : ''} />)}</div>
            <p className="hy-esg-n">Engines off alongside in Rotterdam, Esbjerg and Cuxhaven. Immingham follows in 2027.</p>
          </div>
          <div className="hy-esg-card">
            <p className="hy-esg-k">Fuel mix, share of energy used</p>
            <div className="hy-mix" aria-hidden="true"><i style={{ flexGrow: 71 }} /><i style={{ flexGrow: 18 }} /><i style={{ flexGrow: 7 }} /><i style={{ flexGrow: 4 }} /></div>
            <ul className="hy-mix-l">
              <li><i className="m1" />Marine gas oil<b>71%</b></li>
              <li><i className="m2" />LNG<b>18%</b></li>
              <li><i className="m3" />Bio-LNG and HVO<b>7%</b></li>
              <li><i className="m4" />Shore power<b>4%</b></li>
            </ul>
          </div>
          <div className="hy-esg-card">
            <p className="hy-esg-k">Lost-time injury frequency</p>
            <p className="hy-esg-v">1.8 <span className="hy-down">−0.6</span></p>
            <div className="hy-ltif" aria-hidden="true">
              {[3.1, 2.9, 2.6, 2.4, 1.8].map((v, i) => <span key={i} style={{ height: `${v * 26}%` }} className={i === 4 ? 'on' : ''}><em>{YEARS[i]}</em></span>)}
            </div>
          </div>
          <div className="hy-esg-card">
            <p className="hy-esg-k">Women in senior leadership</p>
            <p className="hy-esg-v">31% <span className="hy-down is-pos">+4 pt</span></p>
            <div className="hy-meter" aria-hidden="true"><i style={{ width: '31%' }} /><b style={{ left: '40%' }} /></div>
            <p className="hy-esg-n">Target 40% by 2028. Across all shore staff: 44%.</p>
          </div>
          <div className="hy-esg-card">
            <p className="hy-esg-k">Taxonomy-aligned capital expenditure</p>
            <p className="hy-esg-v">34% <span className="hy-down is-pos">+12 pt</span></p>
            <div className="hy-meter" aria-hidden="true"><i style={{ width: '34%' }} /></div>
            <p className="hy-esg-n">Mostly shore power and the deposit on the two methanol-ready ships.</p>
          </div>
        </div>
        <p className="hy-assure">Sustainability data reported under ESRS and limited-assurance reviewed by Vandermeer &amp; Co. Accountants N.V. See the sustainability statement, pages 88–151.</p>
      </section>

      {/* 07 Five-year summary */}
      <section className="hy-sec" id="summary">
        <Head n="07" k="Five-year summary" title="The record, year by year" lede="€ million unless stated. 2022–2025 as reported; 2026 audited." aside={<XLink t="Download as a spreadsheet" m="XLSX · 184 KB" />} />
        <div className="hy-tablewrap">
          <table className="hy-five">
            <thead>
              <tr><th scope="col"><span className="sr">Measure</span></th>{YEARS.map((y) => <th key={y} scope="col" className={y === 2026 ? 'cur' : ''}>{y}</th>)}<th scope="col" className="tr">Trend</th></tr>
            </thead>
            <tbody>
              {FIVE_YEAR.map((r) => (
                <tr key={r.k} className={r.sub ? 'sub' : ''}>
                  <th scope="row">{r.k}</th>
                  {r.v.map((v, i) => <td key={i} className={i === 4 ? 'cur' : ''}>{v}</td>)}
                  <td className="tr"><Bars v={r.v} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 08 Downloads + calendar */}
      <section className="hy-sec hy-tint" id="downloads">
        <div className="hy-dl">
          <div>
            <Head n="08" k="Downloads" title="Take the report with you" />
            <ul className="hy-files">
              {DOWNLOADS.map((d) => (
                <li key={d.t} className={'main' in d ? 'is-main' : ''}>
                  <FileIcon f={d.f} />
                  <span className="hy-file-t"><b>{d.t}</b><em>{d.m}</em></span>
                  <span className="hy-file-s">{d.f} · {d.size}</span>
                  <a className="hy-file-a" href="#downloads" aria-label={`Download ${d.t}, ${d.f}, ${d.size}`}>
                    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m-4-4 4 4 4-4M4 16h12" /></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <aside className="hy-cal">
            <h3>Financial calendar</h3>
            <ul>
              {CALENDAR.map((c) => (
                <li key={c.t} className={'past' in c ? 'is-past' : ''}>
                  <span className="hy-date"><b>{c.d}</b><em>{c.m}</em></span>
                  <span className="hy-cal-t">{c.t}<em>{c.y}{'past' in c ? ' · Published' : ''}</em></span>
                </li>
              ))}
            </ul>
            <a className="hy-cal-add" href="#downloads">Add all dates to your calendar (.ics)</a>
            <div className="hy-ir">
              <p className="hy-ir-k">Investor Relations</p>
              <p><b>Maarten de Wit</b>Head of Investor Relations</p>
              <p className="hy-ir-c">+31 10 555 0142<br />Wilhelminakade 60, 3072 AP Rotterdam</p>
              <a className="hy-btn hy-btn-sm" href="#downloads">Subscribe to IR news</a>
            </div>
          </aside>
        </div>
      </section>
    </Site>
  );
}
