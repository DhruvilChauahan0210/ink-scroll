'use client';

import './ateliernord.css';
import { useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { scrollText } from 'svg-scroll-draw/text';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { Site } from '../kit/Site';
import { Fjordhus, Bryggen, Kvitfjell, Sjobad, Taarnet, SkoglyModel, BryggenModel } from './plates';
import { SectionAA, JointDetail, SunPath, Masterplan, StudioPlan, OfficeMap, MaterialBoard } from './drawings';

/* Atelier Nord — an architecture practice's home page. scrollText carries the
   page: the statement rises word by word (split: 'words'), its second line on
   a later window in the accent; the studio's facts trickle in a character at
   a time (split: 'chars'); every project title in the index rises word by
   word as it arrives. ScrollDraw inks in the Bryggen Library section. */

const Mark = () => (
  <svg className="an-logo" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <path d="M3.5 17.5V2.5l13 15V2.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" />
  </svg>
);

type Work = { n: string; t: string; k: string; place: string; type: string; year: string; area: string; status: string; Art: ComponentType<{ align?: string }>; span: 5 | 6 | 7; ar: string; align?: string };

const WORK: Work[] = [
  { n: '01', t: 'Bryggen Library', k: 'A public library inside a timber warehouse from 1702', place: 'Bergen', type: 'Culture', year: '2025', area: '6,400 m²', status: 'Completed', Art: Bryggen, span: 7, ar: '16 / 10', align: 'xMidYMid' },
  { n: '02', t: 'Skogly School', k: 'Twelve classrooms around one covered yard', place: 'Oslo', type: 'Education', year: '2024', area: '5,200 m²', status: 'Completed', Art: SkoglyModel, span: 5, ar: '1.13', align: 'xMidYMid' },
  { n: '03', t: 'Sjøbadet', k: 'A sea bath, sauna and diving tower on the harbour', place: 'Bergen', type: 'Public space', year: '2023', area: '1,100 m²', status: 'Completed', Art: Sjobad, span: 5, ar: '1.13', align: 'xMinYMid' },
  { n: '04', t: 'Tårnet', k: 'Twelve storeys of timber above Oslo S', place: 'Oslo', type: 'Workplace', year: '2027', area: '18,600 m²', status: 'On site', Art: Taarnet, span: 7, ar: '16 / 10', align: 'xMidYMin' },
  { n: '05', t: 'Kvitfjell Cabin', k: 'A cabin for four, set into the snow line', place: 'Ringebu', type: 'House', year: '2022', area: '96 m²', status: 'Completed', Art: Kvitfjell, span: 6, ar: '4 / 3', align: 'xMidYMid' },
  { n: '06', t: 'Fjordhus', k: 'A family house on a rock shelf above the sea', place: 'Lofoten', type: 'House', year: '2026', area: '214 m²', status: 'Completed', Art: Fjordhus, span: 6, ar: '4 / 3', align: 'xMidYMax' },
];

const FILTERS: [string, number][] = [['All', 64], ['Housing', 22], ['Culture', 11], ['Education', 9], ['Workplace', 8], ['Interiors', 14]];

const INDEX: [string, string, string, string, string][] = [
  ['2027', 'Tårnet', 'Oslo', 'Workplace', 'On site'],
  ['2027', 'Elvehagen', 'Drammen', 'Housing · 420 homes', 'Competition, 1st prize'],
  ['2026', 'Fjordhus', 'Lofoten', 'House', 'Completed'],
  ['2026', 'Nordre Kai Hotel', 'Ålesund', 'Hospitality', 'In planning'],
  ['2025', 'Bryggen Library', 'Bergen', 'Culture', 'Completed'],
  ['2025', 'Lysverket Studios', 'Oslo', 'Interiors', 'Completed'],
  ['2024', 'Skogly School', 'Oslo', 'Education', 'Completed'],
  ['2024', 'Mjøsa Chapel', 'Hamar', 'Sacred', 'Completed'],
  ['2023', 'Sjøbadet', 'Bergen', 'Public space', 'Completed'],
  ['2022', 'Kvitfjell Cabin', 'Ringebu', 'House', 'Completed'],
];

const FACTS: [string, string][] = [
  ['Client', 'Bergen Public Library'],
  ['Programme', 'Library, archive, café, children’s floor'],
  ['Area', '6,400 m² over four levels'],
  ['Structure', 'Existing 1702 timber frame; new CLT floors on relined piles'],
  ['Energy', 'Seawater heat pump · 41 kWh/m²/yr'],
  ['Status', 'Completed April 2025'],
  ['Team', 'Mats Haugland, Elin Vik, Tarek Mansour, Ida Lunde'],
];

const AWARDS: { y: string; a: string; p: string; r: 'Winner' | 'Shortlist' | 'Mention'; Art: ComponentType<{ align?: string }> }[] = [
  { y: '2026', a: 'Nordic Timber Prize', p: 'Fjordhus', r: 'Winner', Art: Fjordhus },
  { y: '2025', a: 'European Public Library Award', p: 'Bryggen Library', r: 'Winner', Art: Bryggen },
  { y: '2025', a: 'Vestland Building Prize', p: 'Bryggen Library', r: 'Winner', Art: Bryggen },
  { y: '2025', a: 'Daylight in Architecture Award', p: 'Bryggen Library', r: 'Shortlist', Art: BryggenModel },
  { y: '2024', a: 'Oslo Built Environment Award', p: 'Skogly School', r: 'Winner', Art: SkoglyModel },
  { y: '2024', a: 'School Buildings of the Year', p: 'Skogly School', r: 'Mention', Art: SkoglyModel },
  { y: '2023', a: 'Coastal Architecture Prize', p: 'Sjøbadet', r: 'Winner', Art: Sjobad },
  { y: '2022', a: 'Houses of the Year', p: 'Kvitfjell Cabin', r: 'Shortlist', Art: Kvitfjell },
];

const PRESS = [
  { t: 'Plan & Section', c: 'an-pr-mono' },
  { t: 'Nordic Form Review', c: 'an-pr-serif' },
  { t: 'ROOM', c: 'an-pr-syne' },
  { t: 'Timber Today', c: 'an-pr-bold' },
  { t: 'Arkitekt Kvartal', c: 'an-pr-serif2' },
  { t: 'LOW LIGHT', c: 'an-pr-wide' },
];

const PEOPLE: [string, string, string][] = [
  ['Ingrid Solberg', 'Founding partner', 'Oslo'],
  ['Mats Haugland', 'Partner', 'Bergen'],
  ['Sigrid Aas', 'Partner, interiors', 'Oslo'],
  ['Jonas Brekke', 'Partner, landscape', 'Bergen'],
  ['Elin Vik', 'Associate', 'Bergen'],
  ['Tarek Mansour', 'Associate', 'Oslo'],
];

const JOBS: [string, string, string][] = [
  ['Project architect, 5+ years', 'Bergen', 'Apply by 30 November'],
  ['Interior architect', 'Oslo', 'Apply by 14 December'],
  ['Model maker, part-time', 'Oslo', 'Rolling'],
];

export function AteliernordSite() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s: string) => el.querySelector(s)!;
    const inst = [
      scrollText(q('.an-l1'), { split: 'words', stagger: 0.08, from: { opacity: 0, y: 40 }, easing: 'ease-out', once: true, trigger: { start: 'top 87%', end: 'top 54%' } }),
      scrollText(q('.an-l2'), { split: 'words', stagger: 0.08, from: { opacity: 0, y: 40 }, easing: 'ease-out', once: true, trigger: { start: 'top 82%', end: 'top 49%' } }),
      scrollText(q('.an-spec'), { split: 'chars', stagger: 0.012, from: { opacity: 0 }, easing: 'linear', once: true, trigger: { start: 'top 90%', end: 'top 60%' } }),
      ...Array.from(el.querySelectorAll('.an-proj h3')).map((h) =>
        scrollText(h, { split: 'words', stagger: 0.1, from: { opacity: 0, y: 30 }, easing: 'ease-out', once: true, trigger: { start: 'top 90%', end: 'top 65%' } })),
    ];
    return () => inst.forEach((x) => x.destroy());
  }, []);

  return (
    <Site
      className="an"
      brand={<><Mark />Atelier <b>Nord</b></>}
      links={['Projects', 'Studio', 'Journal', 'Contact']}
      cta="Start a conversation"
      example="scroll-text"
      apis="scrollText · words · chars"
      footnote="Architecture and interiors · Oslo and Bergen"
    >
      <div ref={root}>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="an-hero">
          <div className="an-hero-top">
            <h1>Atelier Nord is an architecture and interiors practice in Oslo and Bergen. We build in timber, for the long Nordic year.</h1>
            <a className="an-now" href="#top"><i aria-hidden="true" />Now on site — <b>Tårnet, Oslo</b><span>Topped out 12 Oct</span></a>
          </div>
          <figure className="an-hero-fig">
            <div className="an-plate an-hero-plate" role="img" aria-label="Fjordhus at blue hour: a long, dark timber house on a rock shelf above the sea, its living room lit, with the Lofoten peaks behind">
              <Fjordhus align="xMidYMid" />
              <div className="an-over">
                <span className="an-over-k">Completed 2026 · Lofoten</span>
                <span className="an-over-t">Fjordhus</span>
                <span className="an-over-s">A family house on a rock shelf above the sea</span>
              </div>
              <div className="an-pager" aria-hidden="true"><span>01</span><i className="on" /><i /><i /><i /><i /><span>05</span></div>
            </div>
            <figcaption className="an-cap">
              <span>Visualisation — Atelier Nord</span>
              <span className="an-cap-mid">214 m² · private client · timber frame on rock anchors</span>
              <a href="#top">View project →</a>
            </figcaption>
          </figure>
        </section>

        {/* ── Statement — scrollText words + chars ─────────────────────── */}
        <section className="an-statement">
          <p className="an-label">(01) Practice</p>
          <h2 className="an-state">
            <span className="an-l1">We design rooms</span>
            <span className="an-l2">people stay in</span>
          </h2>
          <div className="an-state-foot">
            <div className="an-state-l">
              <p className="an-spec">Est. 2011 · 38 architects · 64 buildings · 9 awards</p>
              <div className="an-clients">
                <p className="an-label">Clients include</p>
                <ul>
                  <li>Bergen Public Library</li>
                  <li>City of Oslo, Schools Agency</li>
                  <li>Vestland County Council</li>
                  <li>Nordbo Housing Cooperative</li>
                  <li>Havnelaget Bergen</li>
                  <li>Private clients, 23 houses</li>
                </ul>
              </div>
            </div>
            <div className="an-state-copy">
              <p>We start every project on the site, in the weather it actually has. Light, wind and the view decide where the rooms go; the budget decides how few materials we can do it with.</p>
              <p>Most of our work is public — libraries, schools, a sea bath — and most of it is timber. We stay with a building after it opens and go back each winter to see how it is being used.</p>
            </div>
          </div>
          <ol className="an-disc">
            <li><span>A</span><b>Architecture</b><em>New buildings and the careful reuse of old ones, from a 96 m² cabin to a 12-storey office.</em><i>41 projects</i></li>
            <li><span>B</span><b>Interiors</b><em>Libraries, workplaces and homes, down to the joinery, the light fittings and the door handles.</em><i>14 projects</i></li>
            <li><span>C</span><b>Landscape</b><em>Harbour fronts, school yards and the ground a building stands on, planted for a short summer.</em><i>6 projects</i></li>
            <li><span>D</span><b>Masterplanning</b><em>Neighbourhoods of 200 to 2,000 homes, drawn street by street with the people who will live there.</em><i>3 projects</i></li>
          </ol>
        </section>

        {/* ── Selected work — scrollText on every title ─────────────────── */}
        <section className="an-sec an-work-sec" id="projects">
          <header className="an-head">
            <p className="an-label">(02) Selected work</p>
            <h2 className="an-h2">Projects</h2>
            <div className="an-head-r">
              <div className="an-chips" role="list">
                {FILTERS.map(([f, c], i) => <span key={f} role="listitem" className={i === 0 ? 'on' : ''}>{f}<sup>{c}</sup></span>)}
              </div>
              <div className="an-view" aria-hidden="true">
                <span className="on"><svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="5.5" height="5.5" /><rect x="9" y="1.5" width="5.5" height="5.5" /><rect x="1.5" y="9" width="5.5" height="5.5" /><rect x="9" y="9" width="5.5" height="5.5" /></svg>Grid</span>
                <span><svg viewBox="0 0 16 16"><path d="M1.5 3.5h13M1.5 8h13M1.5 12.5h13" /></svg>Index</span>
              </div>
            </div>
          </header>

          <div className="an-work">
            {WORK.map((w) => (
              <article key={w.n} className={`an-proj is-${w.span}`}>
                <a href="#top" className="an-proj-link" aria-label={`${w.t}, ${w.place} ${w.year}`}>
                  <div className="an-plate" style={{ aspectRatio: w.ar }}>
                    <w.Art align={w.align} />
                    <span className={`an-badge${w.status === 'On site' ? ' is-live' : ''}`}>{w.status}</span>
                  </div>
                </a>
                <div className="an-proj-cap">
                  <span className="an-n">{w.n}</span>
                  <div className="an-proj-t">
                    <h3>{w.t}</h3>
                    <p>{w.k}</p>
                  </div>
                  <p className="an-proj-meta"><span>{w.place}</span><span>{w.type} · {w.area}</span><span>{w.year}</span></p>
                </div>
              </article>
            ))}
          </div>

          <div className="an-index">
            <div className="an-index-h"><span>Year</span><span>Project</span><span>Place</span><span>Type</span><span>Status</span></div>
            {INDEX.map(([y, p, pl, t, s]) => (
              <a key={p} href="#top" className="an-index-r">
                <span className="an-mono">{y}</span>
                <b>{p}</b>
                <span>{pl}</span>
                <span className="an-index-t">{t}</span>
                <span className={`an-index-s${s === 'On site' ? ' is-live' : ''}${s.startsWith('Competition') ? ' is-win' : ''}`}>{s}</span>
              </a>
            ))}
            <a className="an-more" href="#top">See all 64 projects <span>→</span></a>
          </div>
        </section>

        {/* ── In focus — the drawn section ──────────────────────────────── */}
        <section className="an-sec an-focus">
          <header className="an-head">
            <p className="an-label">(03) In focus</p>
            <h2 className="an-h2">Bryggen Library, Bergen</h2>
            <a className="an-head-link" href="#top">Read the project →</a>
          </header>
          <div className="an-focus-grid">
            <figure className="an-sheet">
              <div className="an-sheet-tabs">
                <span className="on">Section A–A</span><span>Plan, level 1</span><span>Harbour elevation</span><span>Axonometric</span>
                <em>Sheet 3.02 of 3.14</em>
              </div>
              <ScrollDraw className="an-sheet-draw" selector=".dr" autoplay duration={1100} stagger={0.03} easing="ease-in-out" once threshold={0.3}>
                <SectionAA />
              </ScrollDraw>
              <figcaption className="an-tb">
                <span><em>Project</em>Bryggen Library</span>
                <span><em>Drawing</em>Section A–A</span>
                <span><em>Scale</em>1:200 @ A1</span>
                <span><em>Date</em>14.03.2024</span>
                <span><em>Rev</em>C · construction</span>
                <span className="an-scale" aria-label="Scale bar, 0 to 10 metres"><i /><i /><i /><i /><b>0</b><b>5</b><b>10 m</b></span>
              </figcaption>
            </figure>
            <div className="an-focus-copy">
              <p className="an-lede">A warehouse from 1702, on piles in the harbour, now holds Bergen’s main library. We kept every timber that could carry load, slid two new floors of cross-laminated timber inside, and opened the gable to the water.</p>
              <dl className="an-facts">
                {FACTS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <blockquote className="an-quote">
                <p>“Visits are up 60 per cent. People come in out of the rain and stay until we close — which, for a library, is the whole point.”</p>
                <footer>Hanne Sæther, City Librarian, Bergen</footer>
              </blockquote>
            </div>
          </div>
          <div className="an-strip">
            <figure>
              <div className="an-plate" style={{ aspectRatio: '4 / 3' }}><BryggenModel /></div>
              <figcaption><b>Working model, 1:200</b><span>Card and basswood, built in the Oslo workshop</span></figcaption>
            </figure>
            <figure>
              <div className="an-paper" style={{ aspectRatio: '4 / 3' }}><JointDetail /></div>
              <figcaption><b>Detail 1:5 — beam to column</b><span>New glulam meets old pine on a slotted steel plate</span></figcaption>
            </figure>
            <figure>
              <div className="an-paper" style={{ aspectRatio: '4 / 3' }}><MaterialBoard /></div>
              <figcaption><b>Materials</b><span>Six materials, chosen to be repaired rather than replaced</span></figcaption>
            </figure>
          </div>
        </section>

        {/* ── Recognition ──────────────────────────────────────────────── */}
        <section className="an-sec an-rec">
          <header className="an-head">
            <p className="an-label">(04) Recognition</p>
            <h2 className="an-h2">Nine awards, fourteen shortlists</h2>
            <a className="an-head-link" href="#top">Press kit (PDF, 18 MB) →</a>
          </header>
          <ul className="an-awards">
            {AWARDS.map((a) => (
              <li key={a.a + a.p}>
                <span className="an-mono">{a.y}</span>
                <span className="an-thumb an-plate"><a.Art /></span>
                <b>{a.a}</b>
                <span className="an-aw-p">{a.p}</span>
                <span className={`an-res is-${a.r.toLowerCase()}`}>{a.r}</span>
              </li>
            ))}
          </ul>
          <div className="an-press">
            <p className="an-label">Published in</p>
            <div>{PRESS.map((p) => <span key={p.t} className={p.c}>{p.t}</span>)}</div>
          </div>
        </section>

        {/* ── Studio ───────────────────────────────────────────────────── */}
        <section className="an-sec an-studio" id="studio">
          <header className="an-head">
            <p className="an-label">(05) Studio</p>
            <h2 className="an-h2">Thirty-eight people, two rooms by the water</h2>
            <a className="an-head-link" href="#top">About the practice →</a>
          </header>
          <div className="an-studio-grid">
            <figure className="an-sheet an-sheet-plain">
              <div className="an-sheet-tabs"><span className="on">Oslo</span><span>Bergen</span><em>Tollbugata 24, third floor · 1:100</em></div>
              <div className="an-sheet-draw"><StudioPlan /></div>
            </figure>
            <div className="an-studio-copy">
              <p className="an-lede">Two studios of about the same size, with one model workshop, one materials library and one long lunch table each. Every project has people from both cities on it.</p>
              <dl className="an-stats">
                <div><dt>38</dt><dd>architects, interior architects and landscape architects</dd></div>
                <div><dt>11</dt><dd>nationalities, working in Norwegian and English</dd></div>
                <div><dt>4</dt><dd>partners, who all still draw</dd></div>
                <div><dt>1:200</dt><dd>the scale of the first model we build of everything</dd></div>
              </dl>
            </div>
          </div>
          <div className="an-people">
            <div>
              <p className="an-label">Partners and associates</p>
              <ul className="an-ppl">
                {PEOPLE.map(([n, r, o]) => <li key={n}><b>{n}</b><span>{r}</span><em>{o}</em></li>)}
              </ul>
            </div>
            <div>
              <p className="an-label">Open positions <sup>3</sup></p>
              <ul className="an-jobs">
                {JOBS.map(([t, o, d]) => <li key={t}><a href="#top"><b>{t}</b><span>{o}</span><em>{d}</em><i aria-hidden="true">→</i></a></li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Journal ──────────────────────────────────────────────────── */}
        <section className="an-sec an-journal" id="journal">
          <header className="an-head">
            <p className="an-label">(06) Journal</p>
            <h2 className="an-h2">Notes from the studio</h2>
            <a className="an-head-link" href="#top">All 112 entries →</a>
          </header>
          <div className="an-jgrid">
            <a href="#top" className="an-entry is-lead">
              <div className="an-paper" style={{ aspectRatio: '16 / 10' }}><SunPath /></div>
              <p className="an-meta"><span>Essay</span><span>28 Oct 2026</span><span>9 min read</span></p>
              <h3 className="an-entry-t">Designing for five hours and fifty-three minutes of daylight</h3>
              <p className="an-entry-x">On 21 December the sun is up in Bergen for under six hours and never climbs above seven degrees. Here is how that one fact shaped the reading room at Bryggen.</p>
            </a>
            <div className="an-jside">
              <a href="#top" className="an-entry">
                <div className="an-paper" style={{ aspectRatio: '16 / 10' }}><Masterplan /></div>
                <div>
                  <p className="an-meta"><span>News</span><span>9 Oct 2026</span></p>
                  <h3 className="an-entry-t">We won Elvehagen: 420 homes and a river park in Drammen</h3>
                </div>
              </a>
              <a href="#top" className="an-entry">
                <div className="an-plate" style={{ aspectRatio: '16 / 10' }}><SkoglyModel /></div>
                <div>
                  <p className="an-meta"><span>Studio</span><span>17 Sep 2026</span></p>
                  <h3 className="an-entry-t">Why we still build every model by hand first</h3>
                </div>
              </a>
              <a href="#top" className="an-entry">
                <div className="an-plate" style={{ aspectRatio: '16 / 10' }}><Kvitfjell align="xMidYMid" /></div>
                <div>
                  <p className="an-meta"><span>Talk</span><span>14 Nov 2026 · Oslo</span></p>
                  <h3 className="an-entry-t">Ingrid Solberg on building for the low winter sun</h3>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <section className="an-sec an-contact" id="contact">
          <header className="an-head">
            <p className="an-label">(07) Contact</p>
            <h2 className="an-h2">Start a conversation</h2>
          </header>
          <div className="an-contact-grid">
            <div className="an-contact-copy">
              <p className="an-lede">Tell us about the site, the brief and the people who will use the building. We answer every enquiry within two working days — usually with a visit.</p>
              <a className="an-mail" href="#top">new-work@ateliernord.no</a>
              <p className="an-contact-sub"><span>Press</span><a href="#top">press@ateliernord.no</a></p>
              <p className="an-contact-sub"><span>Careers</span><a href="#top">jobs@ateliernord.no</a></p>
            </div>
            <div className="an-offices">
              <div className="an-office">
                <div className="an-paper"><OfficeMap city="oslo" /></div>
                <h3>Oslo</h3>
                <p>Tollbugata 24<br />0152 Oslo, Norway</p>
                <p className="an-mono">+47 22 41 08 60</p>
                <p className="an-hours"><i aria-hidden="true" />Open today 08:30–17:00</p>
              </div>
              <div className="an-office">
                <div className="an-paper"><OfficeMap city="bergen" /></div>
                <h3>Bergen</h3>
                <p>Bryggen 17, Finnegården<br />5003 Bergen, Norway</p>
                <p className="an-mono">+47 55 30 72 14</p>
                <p className="an-hours"><i aria-hidden="true" />Open today 08:30–17:00</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Site>
  );
}
