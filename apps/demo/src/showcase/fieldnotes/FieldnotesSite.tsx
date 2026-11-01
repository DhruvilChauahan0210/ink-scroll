'use client';

import './fieldnotes.css';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { initScrollDraw } from 'svg-scroll-draw/astro';
import { Site } from '../kit/Site';
import { PLATE_I, PLATE_II, THUMBS, WALK } from './plates';

/* Fieldnotes — a quarterly journal of walking and noticing, built with Astro.
   This is one long-read from Issue 14. Each botanical plate carries a
   data-scroll-draw attribute with its options as JSON, and a single
   initScrollDraw() call finds them and draws each plate as you read down to
   it. */

const PLATE_OPTS = '{"easing":"ease-out","stagger":0.02,"once":true}';

const Leaf = () => (
  <svg className="fn-leaf" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 19 C 5 10, 11 4, 20 4 C 20 13, 14 19, 5 19 Z" />
    <path d="M5 19 L 15 9 M 9.5 14.5 H 13.5 M 12 12 V 8.5" />
  </svg>
);

/** Fixed bar heights for the audio waveform. */
const WAVE = Array.from({ length: 72 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43 + 1) * 0.9 + 0.1 * Math.sin(i * 5.1)));

const Note = ({ n, children }: { n: number; children: ReactNode }) => (
  <aside className="fn-note"><b>{n}</b>{children}</aside>
);
const Ref = ({ n }: { n: number }) => <sup className="fn-ref">{n}</sup>;

const RELATED = [
  { k: 'Essay', t: 'What the lichens know', by: 'Ama Owusu', min: 14, d: 'Gravestones as a slow calendar: the yellow rosettes that grow a millimetre a year.', art: THUMBS.lichen, tone: 'is-a' },
  { k: 'Field guide', t: 'Following the swifts south', by: 'Tomás Reyes', min: 11, d: 'Ten months on the wing, and the August morning the sky over the village goes quiet.', art: THUMBS.swifts, tone: 'is-b' },
  { k: 'Walk', t: 'How to read a hedgerow', by: 'Ellen Marsh', min: 9, d: 'Count the woody species in thirty paces and you have the hedge’s age in centuries.', art: THUMBS.hedge, tone: 'is-c' },
];

const STOPS = [
  { t: 'St Mary’s churchyard wall', d: 'North face, by the yew. The plants in this essay.' },
  { t: 'The well-house', d: 'Hart’s-tongue and maidenhair spleenwort inside the arch.' },
  { t: 'Sheepwash bridge', d: 'Wall-rue on the parapets; dippers below.' },
  { t: 'Hollow Way', d: 'A sunken lane, ferns on both banks for 400 m.' },
  { t: 'Lime kiln', d: 'Where the mortar for the village was burned.' },
  { t: 'Mill leat wall', d: 'The best colony on the walk: over 60 crowns.' },
];

export function FieldnotesSite() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // One call. It finds every [data-scroll-draw] under the article — both
    // plates — and reads each one's options from its JSON attribute.
    const inst = initScrollDraw(root.current);
    return () => inst.forEach((i) => i.destroy());
  }, []);

  return (
    <Site
      className="fn"
      brand={<><Leaf /><span><i>Field</i>notes</span></>}
      links={['Journal', 'Issues', 'Field guides', 'Walks', 'Shop']}
      cta="Subscribe"
      example="astro"
      apis="data-scroll-draw · initScrollDraw()"
      footnote="A quarterly journal of walking and noticing · Since 2019"
    >
      <div ref={root}>
        {/* Issue bar */}
        <div className="fn-issuebar">
          <span><b>Issue 14</b> · Walls · Autumn 2026</span>
          <span className="fn-issuebar-mid">9 essays · 4 field guides · 2 walks</span>
          <a href="#subscribe">Read the issue →</a>
        </div>

        <article className="fn-article">
          <header className="fn-head">
            <p className="fn-kick"><span>Field guide</span>Ferns · Walls</p>
            <h1 className="fn-h1">The hart’s-tongue fern, and the walls it keeps</h1>
            <p className="fn-dek">On the north face of an old lime wall, a fern older than the flowers is quietly doing well. Marta Quintal spends a wet October learning to see it.</p>
            <div className="fn-byline">
              <span className="fn-avatar" aria-hidden="true">MQ</span>
              <span className="fn-by"><b>Words and drawings by Marta Quintal</b><em>14 November 2026 · 18 min read</em></span>
              <span className="fn-tools" aria-hidden="true">
                <span title="Save"><svg viewBox="0 0 20 20"><path d="M5 3h10v14l-5-3.5L5 17z" /></svg></span>
                <span title="Share"><svg viewBox="0 0 20 20"><path d="M10 13V3M6 7l4-4 4 4M4 11v6h12v-6" /></svg></span>
              </span>
            </div>
            <div className="fn-audio" role="group" aria-label="Audio edition, read by the author, 23 minutes 48 seconds">
              <span className="fn-play" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M7 4.5v11l9-5.5z" /></svg></span>
              <span className="fn-audio-t"><b>Listen to this essay</b><em>Read by the author</em></span>
              <span className="fn-wave" aria-hidden="true">
                {WAVE.map((h, i) => <i key={i} style={{ height: `${(h * 100).toFixed(0)}%` }} className={i < 9 ? 'on' : ''} />)}
              </span>
              <span className="fn-audio-time">2:06 / 23:48</span>
              <span className="fn-speed" aria-hidden="true">1×</span>
            </div>
          </header>

          {/* Plate I — drawn on scroll */}
          <figure className="fn-plate fn-plate-1">
            <div className="fn-plate-sheet">
              <span className="fn-plate-no">Plate I</span>
              <div data-scroll-draw data-scroll-draw-options={PLATE_OPTS}>
                <svg viewBox="40 100 520 420" role="img" aria-label="A line drawing of hart's-tongue fern growing from a mortar joint in a stone wall: six undivided, wavy-edged fronds arching from one crown, two of them turned to show the paired brown lines of spore cases, and a young frond still rolled like a violin's scroll">
                  <path className="fn-wall" d={PLATE_I.stones} />
                  <path className="fn-ink fn-moss" d={PLATE_I.moss} />
                  <path className="fn-ink fn-crown" d={PLATE_I.crown} />
                  {PLATE_I.fronds.map((f, i) => (
                    <g key={i}>
                      <path className="fn-ink fn-blade" d={f.outline} />
                      <path className="fn-ink fn-rib" d={f.rib} />
                      {f.sori && <path className="fn-ink fn-sori" d={f.sori} />}
                    </g>
                  ))}
                  <path className="fn-ink fn-crozier" d={PLATE_I.crozier} />
                </svg>
              </div>
              <div className="fn-label" aria-label="Specimen label">
                <p className="fn-label-h">Herb. Fieldnotes · No. 1426</p>
                <p className="fn-label-n"><i>Asplenium scolopendrium</i> L.</p>
                <p>Hart’s-tongue fern · Aspleniaceae</p>
                <dl>
                  <div><dt>Locality</dt><dd>N. face of churchyard wall, Ashcombe</dd></div>
                  <div><dt>Habitat</dt><dd>Lime mortar, deep shade</dd></div>
                  <div><dt>Date</dt><dd>14 Oct 2026</dd></div>
                  <div><dt>Drawn by</dt><dd>M. Quintal</dd></div>
                </dl>
              </div>
              <div className="fn-scale" aria-hidden="true"><i /><span>5 cm</span></div>
            </div>
            <figcaption><b>Plate I.</b> <i>Asplenium scolopendrium</i> in a mortar joint, drawn at two-thirds life size. Two fronds are turned to show the sori beneath; at the centre, a new frond is still unrolling.</figcaption>
          </figure>

          <div className="fn-body">
            <p className="fn-drop">Look down into the dark of an old well, or along the north face of a lime-mortared wall in late October, and you will find it: a strap of glossy green with no business being so bright at the end of the year. Everything else on the wall has gone over. The herb robert is a red stalk, the ivy-leaved toadflax a few threads. The hart’s-tongue looks as though it has just been unpacked.</p>
            <Note n={1}>The wall runs 68 metres along the lane. I counted 214 hart’s-tongue crowns in it, all but nine on the north face.</Note>
            <p>I had walked past it for eleven years. It grows in the churchyard wall at Ashcombe, a hundred yards from my door, in a run of stonework that faces almost exactly north and never sees the sun between October and March.<Ref n={1} /> I noticed it properly only because I was asked to draw it, and drawing is a slower way of looking than walking is.</p>
            
            <h2 className="fn-h2"><span>I.</span> A leaf that will not divide</h2>
            <Note n={2}><i>Asplenium scolopendrium</i>. The species name means centipede-like, after the rows of spore cases underneath, which somebody once thought looked like legs.</Note>
            <p>Most ferns cut their fronds into feathers, and then cut the feathers again. The hart’s-tongue does not bother. Each frond is a single blade, a hand’s length or more, wavy at the edge and notched into two small lobes where it meets its stalk, so that the base looks like a heart and the whole thing like a tongue.<Ref n={2} /> On a good wall one plant holds twenty or thirty of them in a loose shuttlecock, the old ones arching over, the new ones coming up straight through the middle.</p>
                        <p>In October the new ones are still arriving. They come up rolled, like the head of a violin, and unroll over a week or two, pale and furred with brown scales that rub off on a thumb. By the time the frost comes they have hardened into the same polished green as the rest, and they will stay that way, uneaten and unbothered, until the following summer.</p>

            <blockquote className="fn-pull">
              <p>It wants three things: lime, shade and moisture. An old wall gives it all three.</p>
            </blockquote>

            <h2 className="fn-h2"><span>II.</span> Turning a frond over</h2>
            <Note n={3}>To see it for yourself, lay a ripe frond face down on white paper overnight. By morning there will be a print in brown dust, in exactly the pattern of the sori.</Note>
            <p>Turn a frond over and the reason for its Latin name is written underneath: paired brown lines running out from the midrib at an angle, like the bones of a herring. Each line is two sori lying face to face, each with a thin flap that splits along the middle when the spores are ripe, so that the pair opens like a book.<Ref n={3} /></p>
                      </div>

          {/* Plate II — drawn on scroll, by the same initScrollDraw() call */}
          <figure className="fn-plate fn-plate-2">
            <div className="fn-plate-sheet">
              <span className="fn-plate-no">Plate II</span>
              <div data-scroll-draw data-scroll-draw-options={PLATE_OPTS}>
                <svg viewBox="20 30 560 270" role="img" aria-label="The underside of a fertile frond, with paired lines of sori running out from the midrib like the bones of a herring; a hand-lens view of one pair, crowded with round spore capsules; and one capsule enlarged, its ring of thickened cells drawn like the seam of a ball">
                  <path className="fn-ink fn-blade" d={PLATE_II.outline} />
                  <path className="fn-ink fn-rib" d={PLATE_II.rib} />
                  <path className="fn-ink fn-sori" d={PLATE_II.sori} />
                  <path className="fn-ink fn-lens" d={PLATE_II.lens} />
                  <path className="fn-ink fn-leader" d={PLATE_II.leader} />
                  <path className="fn-ink fn-detail" d={PLATE_II.detail} />
                  <path className="fn-ink fn-capsule" d={PLATE_II.capsule} />
                  <text className="fn-fig" x="150" y="292">a</text>
                  <text className="fn-fig" x="556" y="150">b</text>
                  <text className="fn-fig" x="78" y="72">c</text>
                </svg>
              </div>
              <span className="fn-mag" aria-hidden="true">a&ensp;× 1&emsp;b&ensp;× 10&emsp;c&ensp;× 100</span>
            </div>
            <figcaption><b>Plate II.</b> (a) A fertile frond from beneath, life size. (b) One pair of sori under a ×10 lens, the flaps parting and the spore capsules packed between them. (c) A single capsule at ×100, with the ring of thickened cells that flings the spores.</figcaption>
          </figure>

          <div className="fn-body">
            <p>Under a lens the lines resolve into a crowd of tiny stalked capsules, each with a ring of thickened cells around it like the seam on a cricket ball. As the capsule dries the ring tightens, then snaps back, and flings the spores out. A single frond can release several million of them. Almost none will land somewhere damp enough, limy enough and dark enough to grow, which is why the ones that do tend to stay a very long time.</p>

            <h2 className="fn-h2"><span>III.</span> The mortar</h2>
            <Note n={4}>If your own wall needs repointing, ask for a lime mortar. It is kinder to the stone, it lets the wall breathe, and the ferns come back within a few years.</Note>
            <p>It is a plant of mortar. The lime that held our grandparents’ walls together is exactly what it wants, which is why it thrives in towns and in the walls of churches, and sulks in the acid woods around them. Modern cement is too hard and too dry; where a wall has been repointed, the ferns go. Walk any village and you can read the history of its repairs in where the hart’s-tongue grows, and where it has stopped.<Ref n={4} /></p>
                        <p>The wall at Ashcombe was last pointed with lime in 1911, according to the parish accounts. Since then it has been left alone, and in a hundred and fifteen years of being left alone it has become a garden: wall-rue on the coping, maidenhair spleenwort in the drier joints, a cushion of moss on every ledge, and in the deepest shade, by the yew, the long green tongues.</p>
            <p>I finished the drawing in the second week of November, sitting on a cushion on the wet grass with the board on my knees. A frond takes about an hour to draw properly. The plant has taken longer. The crown in the wall is as thick as my wrist, and the ferns at that end of the churchyard are there in a photograph of the lychgate taken in 1924. I hope they are there when the drawing has faded.<span className="fn-end" aria-hidden="true" /></p>

            <div className="fn-tags">
              {['Ferns', 'Walls', 'Churchyards', 'Autumn', 'Drawing'].map((t) => <a key={t} href="#top">{t}</a>)}
            </div>
          </div>

          {/* Walk it */}
          <section className="fn-walk" aria-labelledby="walk-h">
            <div className="fn-walk-map">
              <svg viewBox="-140 0 800 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of a 7.4 kilometre circular walk from Ashcombe church, with six numbered stops at walls, a bridge, a sunken lane, a lime kiln and a mill leat">
                <rect className="fn-map-bg" x="-140" width="800" height="360" />
                {WALK.woods.map(([x, y], i) => <circle key={`w${i}`} className="fn-tree" cx={x.toFixed(1)} cy={y.toFixed(1)} r="6" />)}
                {WALK.fields.map((d, i) => <path key={`f${i}`} className="fn-field" d={d} />)}
                {WALK.contours.map((d, i) => <path key={i} className="fn-contour" d={d} />)}
                <path className="fn-stream" d={WALK.stream} />
                {WALK.lanes.map((d, i) => <path key={i} className="fn-lane" d={d} />)}
                {WALK.village.map(([x, y, w, h], i) => <rect key={i} className="fn-house" x={x} y={y} width={w} height={h} />)}
                <path className="fn-route" d={WALK.route} />
                {WALK.stops.map(([x, y], i) => (
                  <g key={i} className="fn-stop">
                    <circle cx={x} cy={y} r="10" />
                    <text x={x} y={y + 4} textAnchor="middle">{i + 1}</text>
                  </g>
                ))}
                <text className="fn-map-t" x="118" y="236">Ashcombe</text>
                <text className="fn-map-t is-water" x="280" y="320" transform="rotate(38 280 320)">Ash Brook</text>
                <text className="fn-map-t is-hill" x="470" y="96">Ridings Hill</text>
                <circle className="fn-spot" cx="422" cy="143" r="2.5" /><text className="fn-map-t is-h" x="414" y="140" textAnchor="end">184</text>
                <text className="fn-map-t is-wood" x="606" y="282" textAnchor="middle">Hanger Wood</text>
                <g className="fn-map-n" transform="translate(620 60)"><path d="M 0 -18 L 6 4 L 0 0 L -6 4 Z" /><text x="0" y="18" textAnchor="middle">N</text></g>
                <g className="fn-map-scale" transform="translate(-110 336)"><path d="M 0 0 H 80 M 0 -4 V 4 M 80 -4 V 4" /><text x="0" y="-8">0</text><text x="80" y="-8" textAnchor="end">500 m</text></g>
              </svg>
            </div>
            <div className="fn-walk-info">
              <div className="fn-walk-l">
                <p className="fn-kick"><span>Walk it</span>Issue 14 · Walk 1</p>
                <h2 id="walk-h">The Ashcombe walls</h2>
                <dl className="fn-walk-stats">
                  <div><dt>Distance</dt><dd>7.4 km</dd></div>
                  <div><dt>Time</dt><dd>2½–3 h</dd></div>
                  <div><dt>Ascent</dt><dd>190 m</dd></div>
                  <div><dt>Best</dt><dd>Oct–Mar</dd></div>
                </dl>
                <p className="fn-walk-meta">Circular, from the lychgate of St Mary’s. Lanes and field paths, two stiles, and one steep holloway that is muddy after rain. Take a hand lens.</p>
                <div className="fn-walk-ctas">
                  <a className="fn-btn" href="#subscribe">Download GPX</a>
                  <a className="fn-btn fn-btn-ghost" href="#subscribe">Print the map</a>
                </div>
              </div>
              <ol className="fn-stops">
                {STOPS.map((s) => <li key={s.t}><b>{s.t}</b><span>{s.d}</span></li>)}
              </ol>
            </div>
          </section>

          {/* Author */}
          <section className="fn-author" aria-label="About the author">
            <span className="fn-avatar fn-avatar-lg" aria-hidden="true">MQ</span>
            <div>
              <p className="fn-author-k">About the author</p>
              <h2>Marta Quintal</h2>
              <p>Marta Quintal is a botanical illustrator and writer who lives in the Cotswold valleys. Her drawings are in three herbaria and on the labels of a good many jars of honey. Her first book, <i>Small Green Lives</i>, is out from Orchard &amp; Vale in March 2027.</p>
              <p className="fn-author-more">Also by Marta in Fieldnotes: <a href="#top">Moss, slowly</a> · <a href="#top">The ivy question</a> · <a href="#top">Drawing in the rain</a></p>
            </div>
          </section>
        </article>

        {/* Related */}
        <section className="fn-related" aria-labelledby="rel-h">
          <div className="fn-related-head">
            <h2 id="rel-h">More from Issue 14</h2>
            <a href="#subscribe">All 15 pieces →</a>
          </div>
          <div className="fn-cards">
            {RELATED.map((r) => (
              <a key={r.t} className="fn-card" href="#top">
                <span className={`fn-card-art ${r.tone}`}>
                  <svg viewBox="0 0 280 190" aria-hidden="true">{r.art.map((d, i) => <path key={i} d={d} />)}</svg>
                </span>
                <span className="fn-card-k">{r.k}</span>
                <span className="fn-card-t">{r.t}</span>
                <span className="fn-card-d">{r.d}</span>
                <span className="fn-card-by">{r.by} · {r.min} min</span>
              </a>
            ))}
          </div>
        </section>

        {/* Subscribe */}
        <section className="fn-sub" id="subscribe" aria-labelledby="sub-h">
          <div className="fn-cover" aria-hidden="true">
            <div className="fn-cover-top"><span>No. 14</span><span>Autumn 2026</span></div>
            <p className="fn-cover-title"><i>Field</i>notes</p>
            <p className="fn-cover-theme">Walls</p>
            <svg viewBox="40 100 520 420" className="fn-cover-art">
              <path d={PLATE_I.fronds[0].outline} /><path d={PLATE_I.fronds[1].outline} /><path d={PLATE_I.fronds[2].outline} /><path d={PLATE_I.fronds[3].outline} /><path d={PLATE_I.fronds[4].outline} /><path d={PLATE_I.fronds[5].outline} />
              <path d={PLATE_I.stones} className="w" />
            </svg>
            <ul className="fn-cover-lines">
              <li>The hart’s-tongue fern</li><li>What the lichens know</li><li>Following the swifts south</li>
            </ul>
          </div>
          <div className="fn-sub-copy">
            <p className="fn-kick"><span>Subscribe</span>Four issues a year</p>
            <h2 id="sub-h">Slow reading for people who walk.</h2>
            <p className="fn-sub-lede">Each issue is 160 pages on uncoated paper, sewn so it lies flat on a picnic table. Subscribers also get every essay online, the audio editions and the full archive since 2019.</p>
            <div className="fn-plans" role="radiogroup" aria-label="Choose a subscription">
              <label className="fn-plan">
                <input type="radio" name="fn-plan" defaultChecked />
                <span className="fn-plan-t"><b>Print + digital</b><em>Four issues posted to you, plus everything online</em></span>
                <span className="fn-plan-p"><b>£48</b>/year</span>
              </label>
              <label className="fn-plan">
                <input type="radio" name="fn-plan" />
                <span className="fn-plan-t"><b>Digital</b><em>Every essay, audio edition and walk, online and in the app</em></span>
                <span className="fn-plan-p"><b>£24</b>/year</span>
              </label>
            </div>
            <div className="fn-sub-ctas">
              <a className="fn-btn" href="#subscribe">Subscribe</a>
              <a className="fn-link" href="#subscribe">Give it as a gift</a>
            </div>
            <p className="fn-sub-fine">Free UK postage · £12 a year to the rest of the world · Cancel any time · Issue 15, “Water”, ships in February</p>
          </div>
        </section>
      </div>
    </Site>
  );
}
