'use client';

import './greenline.css';
import { useEffect, useRef, useState } from 'react';
import { scrollAnimate, scrollCounter } from 'svg-scroll-draw';
import { Site } from '../kit/Site';
import { AfterPlate, BeforePlate, CoverArt, Leaf, NurseryArt, PlotMap } from './art';

/* Greenline — a reforestation charity's 2026 impact report. Every headline
   figure counts up from zero with scrollCounter, each with its own format,
   as its cell lifts in on a scrollAnimate trigger 4% after the last; the
   spending breakdown counts while its bars grow. */

const int = (v: number) => Math.round(v).toLocaleString('en-US');
const STATS = [
  { to: 1284500, f: int, u: 'trees planted', d: 'Native species only, grown from local seed in our own four nurseries.', delta: '+38% on 2025' },
  { to: 3410, f: (v: number) => `${int(v)} ha`, u: 'of land restored', d: 'Degraded pasture, burn scars and cleared mangrove across 61 plots.', delta: '+1,120 ha' },
  { to: 41.2, f: (v: number) => `${v.toFixed(1)}k t`, u: 'CO₂ captured', d: 'Measured in biomass plots, not modelled — verified by Terra Audit.', delta: 'Cert. GL-26-0142' },
  { to: 86, f: (v: number) => `${Math.round(v)}%`, u: 'survival after 2 years', d: 'Up from 71% in 2024, thanks to local seed stock and dry-season watering.', delta: '2024: 71%' },
];
const YEARS = [{ y: '22', v: 18 }, { y: '23', v: 34 }, { y: '24', v: 52 }, { y: '25', v: 72 }, { y: '26', v: 100 }];

const SPEND = [
  { k: 'Planting and aftercare', e: '€9.67m', to: 78, note: 'Seedlings, planting crews, three years of weeding and watering' },
  { k: 'Nurseries and seed banks', e: '€1.49m', to: 12, note: 'Four nurseries, 212 seed collectors, cold storage' },
  { k: 'Monitoring and audit', e: '€0.74m', to: 6, note: 'Survival counts, biomass plots, satellite checks, Terra Audit' },
  { k: 'Fundraising and admin', e: '€0.50m', to: 4, note: 'Everything else: payroll, systems, this report' },
];

const PROJECTS = [
  { n: 'Kasigau', c: 'Kenya' },
  { n: 'Serra do Mar', c: 'Brazil' },
  { n: 'Menabe', c: 'Madagascar' },
  { n: 'Serra da Estrela', c: 'Portugal' },
];

type LeafKind = 'pinnate' | 'oval' | 'palm' | 'mangrove' | 'oak';
const SPECIES: { l: string; c: string; where: string; n: number; tags: string[]; leaf: LeafKind }[] = [
  { l: 'Rhizophora mucronata', c: 'Red mangrove', where: 'Madagascar', n: 211600, tags: ['Coastal defence', 'Fish nursery'], leaf: 'mangrove' },
  { l: 'Avicennia marina', c: 'Grey mangrove', where: 'Madagascar', n: 143800, tags: ['Coastal defence'], leaf: 'mangrove' },
  { l: 'Melia volkensii', c: 'Mukau', where: 'Kenya', n: 96400, tags: ['Drought-hardy', 'Timber'], leaf: 'pinnate' },
  { l: 'Croton megalocarpus', c: 'Mukinduri', where: 'Kenya', n: 88150, tags: ['Canopy', 'Nut oil'], leaf: 'oval' },
  { l: 'Vachellia tortilis', c: 'Umbrella thorn', where: 'Kenya', n: 71900, tags: ['Fixes nitrogen'], leaf: 'pinnate' },
  { l: 'Inga edulis', c: 'Ingá', where: 'Brazil', n: 64300, tags: ['Fixes nitrogen', 'Fruit'], leaf: 'pinnate' },
  { l: 'Euterpe edulis', c: 'Juçara palm', where: 'Brazil', n: 52700, tags: ['Endangered', 'Food for birds'], leaf: 'palm' },
  { l: 'Quercus suber', c: 'Cork oak', where: 'Portugal', n: 38200, tags: ['Fire-resistant'], leaf: 'oak' },
];
const SP_MAX = SPECIES[0].n;

const INCOME = [
  { k: 'Individual donors', a: '€7.9m', b: '€6.1m' },
  { k: 'Foundations', a: '€2.6m', b: '€2.2m' },
  { k: 'Companies', a: '€1.7m', b: '€1.4m' },
  { k: 'Government grants', a: '€0.4m', b: '€0.3m' },
];

const AMOUNTS = [10, 25, 50, 100];
const TREES_PER_EURO = 0.24; // €25 a month → 72 trees a year

const Mark = () => (
  <svg className="gl-mark" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="var(--forest)" />
    <path d="M12 18.5V10.2M12 10.2C12 7.4 10 6 7.2 6c0 2.8 2 4.2 4.8 4.2zm0 3.4c0-2.8 2-4.2 4.8-4.2 0 2.8-2 4.2-4.8 4.2z" fill="none" stroke="#d9f0c8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Compare() {
  const [x, setX] = useState(52);
  return (
    <figure className="gl-ba">
      <div className="gl-ba-frame" style={{ ['--x' as string]: `${x}%` }}>
        <div className="gl-ba-layer"><BeforePlate /></div>
        <div className="gl-ba-layer is-after"><AfterPlate /></div>
        <span className="gl-ba-tag is-before">March 2023</span>
        <span className="gl-ba-tag is-after">October 2026</span>
        <span className="gl-ba-handle" aria-hidden="true"><i>‹ ›</i></span>
        <input type="range" min={0} max={100} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label="Slide to compare plot K-14 in March 2023 and October 2026" />
      </div>
      <figcaption>
        <span>Plot K-14, Kasigau corridor — same fence line, same rocks, 43 months apart. Drag to compare.</span>
        <span className="gl-ba-cred">Illustrated from survey photographs</span>
      </figcaption>
    </figure>
  );
}

function Donate() {
  const [monthly, setMonthly] = useState(true);
  const [amt, setAmt] = useState(25);
  const trees = Math.round(amt * TREES_PER_EURO * (monthly ? 12 : 1));
  return (
    <div className="gl-give-card">
      <div className="gl-give-top">
        <b>Plant with us</b>
        <div className="gl-toggle" role="group" aria-label="Frequency">
          <button type="button" className={monthly ? 'on' : ''} onClick={() => setMonthly(true)}>Monthly</button>
          <button type="button" className={monthly ? '' : 'on'} onClick={() => setMonthly(false)}>One-off</button>
        </div>
      </div>
      <div className="gl-amounts" role="group" aria-label="Amount">
        {AMOUNTS.map((a) => (
          <button type="button" key={a} className={a === amt ? 'on' : ''} onClick={() => setAmt(a)}>€{a}</button>
        ))}
        <span className="gl-other">Other</span>
      </div>
      <p className="gl-give-impact">
        <Leaf kind="oval" />
        <span><b>€{amt}{monthly ? ' a month' : ''}</b> plants about <b>{trees} {trees === 1 ? 'tree' : 'trees'}{monthly ? ' a year' : ''}</b> and pays for three years of their aftercare.</span>
      </p>
      <span className="gl-check"><i />Give in memory of, or as a gift for, someone</span>
      <span className="gl-give-btn">Donate €{amt}{monthly ? ' monthly' : ''}</span>
      <p className="gl-give-meta">Card · SEPA Direct Debit · Bank transfer<span>Cancel a monthly gift any time, in one click.</span></p>
    </div>
  );
}

export function GreenlineSite() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = root.current!;
    const inst = [
      // Each figure cell lifts in 4% after the one before it.
      ...Array.from(r.querySelectorAll<HTMLElement>('.gl-stat')).map((el, i) => scrollAnimate(el, {
        props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
        trigger: { start: `top ${92 - i * 4}%`, end: `top ${62 - i * 4}%` }, easing: 'ease-out', once: true,
      })),
      // Every figure counts from zero in its own format.
      ...Array.from(r.querySelectorAll<HTMLElement>('[data-to]')).map((el) => {
        const i = Number(el.dataset.i);
        const fmt = el.dataset.kind === 'spend' ? (v: number) => `${Math.round(v)}%` : STATS[i].f;
        return scrollCounter(el, { to: Number(el.dataset.to), format: fmt, easing: 'ease-out', once: true, trigger: { start: 'top 90%', end: 'top 50%' } });
      }),
      // The spending bars grow while their percentages count.
      ...Array.from(r.querySelectorAll<HTMLElement>('.gl-bar i')).map((el) => scrollAnimate(el, {
        props: { transform: ['scaleX(0)', 'scaleX(1)'] }, trigger: { start: 'top 90%', end: 'top 50%' }, easing: 'ease-out', once: true,
      })),
    ];
    return () => inst.forEach((x) => x.destroy());
  }, []);

  return (
    <Site
      className="gl"
      brand={<><Mark />Greenline</>}
      links={['Our projects', 'Impact report', 'How we measure', 'About']}
      cta="Donate"
      example="scroll-counter"
      apis="scrollCounter · format · scrollAnimate"
      footnote="Registered charity no. 1187420 · Reforestation that is measured, not promised"
    >
      <div ref={root}>
        {/* ── Cover ─────────────────────────────────────────────────── */}
        <section className="gl-hero">
          <div className="gl-hero-copy">
            <p className="gl-kick"><span>Impact report 2026</span>Published 28 October</p>
            <h1 className="gl-h1">A year of putting forests back</h1>
            <p className="gl-lede">With 48,000 supporters we restored native forest and mangrove in Kenya, Brazil, Madagascar and Portugal. Here is every number we’re proud of, the two we aren’t, and how each one was checked.</p>
            <div className="gl-ctas">
              <a className="gl-btn" href="#figures">Read the report</a>
              <a className="gl-btn is-ghost" href="#money">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m0 0l-4-4m4 4l4-4M4 16h12" /></svg>
                Full report · PDF, 6.4 MB
              </a>
            </div>
            <div className="gl-letter">
              <span className="gl-av" aria-hidden="true">AM</span>
              <p><b>“Survival is the number I watch.”</b> A letter from Amara Mwangi, our executive director, on why 86% matters more than a million trees. <a href="#story">Read the letter →</a></p>
            </div>
          </div>
          <figure className="gl-cover">
            <div className="gl-cover-plate">
              <CoverArt />
              <div className="gl-cover-type" aria-hidden="true">
                <span className="gl-cover-brand"><Mark />Greenline</span>
                <b>Impact<br />Report</b>
                <em>2026</em>
              </div>
            </div>
            <figcaption>Cover: the Kasigau corridor, Kenya, 26 months after planting.</figcaption>
          </figure>
        </section>

        {/* ── The year in numbers ───────────────────────────────────── */}
        <section className="gl-figs" id="figures" aria-label="2026 in numbers">
          <div className="gl-figs-h">
            <p className="gl-kick is-light">2026 in numbers</p>
            <p className="gl-figs-note">1 October 2025 – 30 September 2026 · All figures audited</p>
          </div>
          <div className="gl-stats">
            {STATS.map((s, i) => (
              <div key={s.u} className="gl-stat">
                <b className="gl-num" data-to={s.to} data-i={i}>{s.f(0)}</b>
                <span className="gl-unit">{s.u}</span>
                <p>{s.d}</p>
                <div className="gl-mini" aria-hidden="true">
                  {i === 0 && <span className="gl-years">{YEARS.map((y) => <i key={y.y} style={{ height: `${y.v}%` }}><em>’{y.y}</em></i>)}</span>}
                  {i === 1 && <span className="gl-dots">{Array.from({ length: 61 }, (_, k) => <i key={k} className={k > 42 ? 'new' : ''} />)}</span>}
                  {i === 2 && <span className="gl-seal"><svg viewBox="0 0 20 20"><path d="M10 2l2 1.6 2.5-.2.8 2.4 2.1 1.4-.8 2.4.8 2.4-2.1 1.4-.8 2.4-2.5-.2L10 18l-2-1.6-2.5.2-.8-2.4-2.1-1.4.8-2.4-.8-2.4 2.1-1.4.8-2.4 2.5.2z" /><path d="M7 10.2l2 2 4-4.4" /></svg>Verified</span>}
                  {i === 3 && <span className="gl-surv"><i style={{ width: '86%' }} /><em style={{ left: '71%' }} /></span>}
                  <small>{s.delta}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Where we work ─────────────────────────────────────────── */}
        <section className="gl-sec" id="where">
          <div className="gl-sec-h is-wide">
            <div>
              <p className="gl-kick">Where we work</p>
              <h2 className="gl-h2">Four landscapes, one way of doing it</h2>
            </div>
            <p className="gl-lede">We only plant where a local organisation asked us to, on land its community controls, and we stay for at least ten years. Every plot is mapped, numbered and surveyed.</p>
          </div>
          <div className="gl-proj">
            <div className="gl-tabs" aria-hidden="true">
              {PROJECTS.map((p, i) => <span key={p.n} className={i === 0 ? 'on' : ''}><b>{p.n}</b>{p.c}</span>)}
            </div>
            <div className="gl-proj-body">
              <div className="gl-map">
                <span className="gl-map-coord">3°25′S 38°34′E · Taita-Taveta County</span>
                <PlotMap />
                <div className="gl-map-callout"><b>Plot K-14</b><span>42 ha · planted March 2024</span><span>11,820 trees · 88% alive</span></div>
                <div className="gl-legend">
                  <span><i className="y2023" />2023</span><span><i className="y2024" />2024</span><span><i className="y2025" />2025</span><span><i className="y2026" />Planned 2026</span>
                </div>
                <div className="gl-scale"><i />1 km</div>
              </div>
              <aside className="gl-facts">
                <p className="gl-facts-k">Kasigau corridor, Kenya</p>
                <h3>Dryland forest between two national parks</h3>
                <p>Elephants use this corridor to move between Tsavo East and Tsavo West. Charcoal burning had stripped the lower slopes; the forest on the hill itself kept the rain.</p>
                <dl>
                  <div><dt>Restored</dt><dd>1,240 ha</dd></div>
                  <div><dt>Trees planted</dt><dd>512,300</dd></div>
                  <div><dt>Native species</dt><dd>34</dd></div>
                  <div><dt>Alive at 2 years</dt><dd>88%</dd></div>
                  <div><dt>Local jobs</dt><dd>214 <small>62% women</small></dd></div>
                  <div><dt>Partner</dt><dd>Kasigau Community Trust</dd></div>
                </dl>
                <a className="gl-link" href="#where">Open the plot-level data →</a>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Before / after ────────────────────────────────────────── */}
        <section className="gl-sec is-alt" id="plot">
          <div className="gl-split">
            <div className="gl-sec-h">
              <p className="gl-kick">One plot, up close</p>
              <h2 className="gl-h2">What 43 months does to a hillside</h2>
              <p className="gl-lede">K-14 was grazed bare and burned for charcoal. We fenced it with the village, planted 11,820 seedlings in the 2024 long rains and weeded it by hand for three seasons.</p>
            </div>
            <dl className="gl-deltas">
              <div><dt>Canopy cover</dt><dd><s>4%</s>38%</dd></div>
              <div><dt>Bird species recorded</dt><dd><s>6</s>23</dd></div>
              <div><dt>Soil organic carbon</dt><dd><s>0.6%</s>1.1%</dd></div>
              <div><dt>Water held after rain</dt><dd><s>1×</s>2.7×</dd></div>
            </dl>
          </div>
          <Compare />
        </section>

        {/* ── Species ───────────────────────────────────────────────── */}
        <section className="gl-sec" id="species">
          <div className="gl-species">
            <div className="gl-sec-h">
              <p className="gl-kick">What we planted</p>
              <h2 className="gl-h2">312 native species, no monocultures, no eucalyptus</h2>
              <p className="gl-lede">Each site’s mix is chosen with local botanists: trees that fix nitrogen go in first, canopy and fruit trees follow. These eight made up 60% of everything planted this year.</p>
            </div>
            <div className="gl-table" role="table" aria-label="Most-planted species in 2026">
              <div className="gl-tr is-head" role="row"><span role="columnheader">Species</span><span role="columnheader">Planted in</span><span role="columnheader">Trees</span><span role="columnheader">Why we plant it</span></div>
              {SPECIES.map((s) => (
                <div key={s.l} className="gl-tr" role="row">
                  <span role="cell" className="gl-sp"><span className="gl-leaf"><Leaf kind={s.leaf} /></span><span><i>{s.l}</i><b>{s.c}</b></span></span>
                  <span role="cell" className="gl-where">{s.where}</span>
                  <span role="cell" className="gl-count"><b>{int(s.n)}</b><span className="gl-share"><i style={{ width: `${(s.n / SP_MAX) * 100}%` }} /></span></span>
                  <span role="cell" className="gl-tags">{s.tags.map((t) => <em key={t}>{t}</em>)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Field story ───────────────────────────────────────────── */}
        <section className="gl-story" id="story">
          <figure className="gl-story-art">
            <NurseryArt />
            <figcaption>The Rukanga nursery raises 180,000 seedlings a year from seed collected on the hill.</figcaption>
          </figure>
          <div className="gl-story-copy">
            <p className="gl-kick">Field story · Kasigau, Kenya</p>
            <h2 className="gl-h2">The nursery that runs on seed from the hill</h2>
            <p className="gl-byline">Words by Tom Okafor · 6 min read</p>
            <p>Every seedling planted on the Kasigau slopes started as a seed picked up within twenty kilometres of the nursery. It’s slower than buying stock in, and it is the main reason two-year survival here climbed from 64% to 88%: trees grown from local seed already know the drought.</p>
            <blockquote>
              <p>“When the rains came back to the hill, so did the people who had left it. Forty of my neighbours collect seed for us now.”</p>
              <cite><b>Mercy Wanjala</b> · Nursery manager, Rukanga</cite>
            </blockquote>
            <p>Mercy’s team of 38 runs the nursery on a rota with the planting crews, so the people who raise a seedling are often the people who put it in the ground.</p>
            <a className="gl-link" href="#story">Read Mercy’s story →</a>
          </div>
        </section>

        {/* ── Money ─────────────────────────────────────────────────── */}
        <section className="gl-sec is-alt" id="money">
          <div className="gl-money">
            <div>
              <p className="gl-kick">Where your money went</p>
              <h2 className="gl-h2">96 cents of every euro reached the ground</h2>
              <p className="gl-lede">We spent €12.4m in 2026. This is all of it, by what it paid for.</p>
              <div className="gl-spend">
                {SPEND.map((s, i) => (
                  <div key={s.k} className="gl-row">
                    <div className="gl-row-h">
                      <span className="gl-row-k">{s.k}<small>{s.note}</small></span>
                      <span className="gl-row-e">{s.e}</span>
                      <b data-to={s.to} data-i={i} data-kind="spend">0%</b>
                    </div>
                    <div className="gl-bar"><i style={{ width: `${s.to}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="gl-audit">
              <div className="gl-audit-h">
                <span className="gl-badge" aria-hidden="true">
                  <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" /><circle cx="24" cy="24" r="16" /><path d="M16.5 24.5l5 5 10-11" /></svg>
                </span>
                <div>
                  <b>Independently audited</b>
                  <span>Hollis &amp; Brandt LLP · unqualified opinion · 14 Oct 2026</span>
                </div>
              </div>
              <div className="gl-income" role="table" aria-label="Income by source">
                <div className="gl-ir is-head" role="row"><span role="columnheader">Income</span><span role="columnheader">2026</span><span role="columnheader">2025</span></div>
                {INCOME.map((r) => <div key={r.k} className="gl-ir" role="row"><span role="cell">{r.k}</span><span role="cell">{r.a}</span><span role="cell">{r.b}</span></div>)}
                <div className="gl-ir is-total" role="row"><span role="cell">Total</span><span role="cell">€12.6m</span><span role="cell">€10.0m</span></div>
              </div>
              <p className="gl-audit-note">Reserves cover 3.1 months of spending. No single donor gave more than 6% of income.</p>
              <ul className="gl-docs">
                <li><span>PDF</span>Audited accounts 2026<em>2.1 MB</em></li>
                <li><span>PDF</span>Terra Audit carbon verification<em>860 KB</em></li>
                <li><span>CSV</span>Every plot, every survey<em>4.4 MB</em></li>
              </ul>
            </aside>
          </div>
        </section>

        {/* ── Donate ────────────────────────────────────────────────── */}
        <section className="gl-give" id="donate">
          <div className="gl-give-copy">
            <p className="gl-kick is-light">2027 starts with the long rains</p>
            <h2 className="gl-h2">Help us plant 1.6 million more</h2>
            <p className="gl-lede">Next year we open a fifth landscape, in Malawi’s Shire Highlands, and double the Menabe mangroves. Monthly gifts let us hire crews before the rains, not after.</p>
            <ul className="gl-give-list">
              <li><b>€5</b>one tree, grown, planted and looked after for three years</li>
              <li><b>€25 a month</b>about 72 trees a year, on a plot you can follow online</li>
              <li><b>€1,000</b>a hillside row, with a plaque in the nursery</li>
            </ul>
          </div>
          <Donate />
        </section>

        <section className="gl-partners" aria-label="Partners">
          <p>Planted with</p>
          <div>
            <span className="p1">Kasigau Community Trust</span>
            <span className="p2">Instituto Mata Viva</span>
            <span className="p3">MENABE MANGROVE COLLECTIVE</span>
            <span className="p4">serra viva</span>
            <span className="p5">Terra Audit</span>
            <span className="p6">Nordvik Foundation</span>
          </div>
        </section>
      </div>
    </Site>
  );
}
