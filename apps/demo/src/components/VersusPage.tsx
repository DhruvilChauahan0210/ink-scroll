import './compare/compare.css';
import './versus.css';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES, MEASURED_ON, type Competitor } from '@/data/competitors';
import { VERSUS, type Versus, type VersusRow } from '@/data/versus';
import { EXAMPLE_COUNT } from '@/data/examples-index';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';
import { SiteShell } from './site/SiteShell';
import { CopyCommand } from './home/CopyCommand';
import { SizeScale, type SizeBar } from './compare/SizeScale';
import { Ink } from './compare/Ink';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The bars for fig. 1. Two are always there — this library's main entry and
 * the competitor — and a page adds a third only where the comparison is unfair
 * without it: the vivus drop-in is its own smaller entry, and ScrollMagic
 * cannot animate anything until an animation engine is added (the page's own
 * matrix and FAQ name GSAP core + ScrollTrigger as the usual pairing).
 */
function sizeBars(v: Versus, them: Competitor): SizeBar[] {
  const bars: SizeBar[] = [
    { label: `svg-scroll-draw ${SELF.version}`, sub: 'every API, main entry', kb: SELF.gzipKb, ours: true },
  ];
  if (v.competitorKey === 'vivus') {
    bars.push({ label: 'svg-scroll-draw/vivus', sub: 'the drop-in entry on its own', kb: SELF_ENTRIES.vivus, ours: true });
  }
  bars.push({ label: `${them.name} ${them.version}`, sub: them.gzipKb < SELF.gzipKb ? `smaller than our main entry · ${them.license}` : them.license, kb: them.gzipKb });
  if (v.competitorKey === 'scrollmagic') {
    const gsap = COMPETITORS.gsapScroll;
    bars.push({
      label: `scrollmagic + ${gsap.label.toLowerCase()}`,
      sub: 'what it takes to animate anything',
      kb: Math.round((them.gzipKb + gsap.gzipKb) * 10) / 10,
    });
  }
  return bars;
}

/** A matrix mark, drawn as a stroke so the library can ink it. */
function Mark({ val }: { val: VersusRow['us'] }) {
  if (val === true) {
    return (
      <span className="vs-m is-yes">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" className="cmp-ink" stroke="currentColor" /></svg>
        <span className="sr-only">supported</span>
      </span>
    );
  }
  if (val === false) {
    return (
      <span className="vs-m is-no">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" className="cmp-ink" stroke="currentColor" /></svg>
        <span className="sr-only">not supported</span>
      </span>
    );
  }
  if (val === 'partial') {
    return (
      <span className="vs-m is-part">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 9.5 C4.5 5.5 6.5 5.5 8 8 S11.5 10.5 13.5 6.5" className="cmp-ink" stroke="currentColor" /></svg>
        <span className="sr-only">partial</span>
      </span>
    );
  }
  return <span className="vs-m is-val">{val}</span>;
}

/** The data's prose marks emphasis as *word*; set it in italics rather than showing the asterisks. */
function Prose({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p))}</>;
}

/** A section head: its number and name in a title strip, then the heading. */
function Head({ n, k, id, children }: { n: number; k: string; id: string; children: React.ReactNode }) {
  return (
    <>
      <div className="tb"><span className="tb-n">{pad(n)}</span><span>{k}</span></div>
      <h2 id={id} className="cmp-h2">{children}</h2>
    </>
  );
}

export function VersusPage({ slug }: { slug: string }) {
  const v = VERSUS.find((x) => x.slug === slug);
  if (!v) return null;
  const them = COMPETITORS[v.competitorKey];
  const short = v.slug.replace('vs-', '').replace(/-/g, ' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: v.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  // Tallies of the matrix below, so the opening's figures are the page's own.
  const onlyUs = v.rows.filter((r) => r.us === true && r.them === false).length;
  const onlyThem = v.rows.filter((r) => r.them === true && r.us === false).length;
  const both = v.rows.filter((r) => r.us === true && r.them === true).length;

  const provenance = [
    { item: 'svg-scroll-draw', c: SELF, gzip: SELF.gzipKb, on: SELF.lastPublish ?? MEASURED_ON },
    { item: them.label, c: them, gzip: them.gzipKb, on: them.lastPublish ?? '—' },
  ];

  const others = [
    ...VERSUS.filter((x) => x.slug !== v.slug).map((x) => ({
      href: `/${x.slug}`,
      t: `vs ${COMPETITORS[x.competitorKey].label}`,
      d: x.headline,
    })),
    { href: '/vs-gsap', t: `vs ${COMPETITORS.gsapStack.label}`, d: 'The full GSAP scroll stack, measured against this one.' },
    { href: '/vs-framer-motion', t: `vs ${COMPETITORS.framerMotion.label}`, d: 'A general React animation library that also draws paths through pathLength.' },
    { href: '/vs-aos', t: `vs ${COMPETITORS.aos.label} and ${COMPETITORS.scrollreveal.label}`, d: 'Reveal-on-scroll libraries, and the drop-ins that replace them.' },
    { href: '/lenis-scroll-animation', t: `${COMPETITORS.lenis.label} — an integration`, d: 'Smooth scrolling from Lenis, animation from here, and the adapter that joins them.' },
    { href: '/guides', t: 'Migration guides', d: 'AOS, ScrollReveal and vivus in React and Next.js, step by step.' },
  ];

  const toc: [string, string][] = [
    ['vs-size', 'Size, measured'],
    ['vs-matrix', `Feature matrix · ${v.rows.length}`],
    ['vs-theirs', `Where ${them.label} wins`],
    ['vs-faq', `Questions · ${v.faq.length}`],
    ['vs-more', 'Other comparisons'],
  ];

  return (
    <SiteShell active={`/${v.slug}`} crumbs={[[`vs ${them.label}`, `/${v.slug}`]]} kicker={`vs ${short} / your turn`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="cmp vs">

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head cmp-head">
          <div>
            <p className="pg-kicker">
              <span>compare / <b>vs {short}</b></span>
              <span>measured {them.measuredOn ?? MEASURED_ON}</span>
              <span>{v.rows.length} rows</span>
            </p>
            <h1 className="pg-title cmp-title">
              svg-scroll-draw <span className="dim">vs {them.label}</span>
            </h1>
            <p className="pg-lede"><Prose text={v.intro} /></p>
            <div className="pg-actions">
              <CopyCommand />
              {v.tryUrl && (
                <a href={v.tryUrl.href} target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
                  {v.tryUrl.label.replace(/\s*→$/, '')} ↗
                </a>
              )}
              {v.guide && <Link href={v.guide.href} className="btn" data-magnetic>{v.guide.label}</Link>}
              <Link href="/examples" className="btn" data-magnetic>{EXAMPLE_COUNT} live examples →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>svg-scroll-draw</dt><dd>{SELF.gzipKb} KB</dd></div>
              <div><dt>{them.label}</dt><dd>{them.gzipKb} KB</dd></div>
              <div><dt>Only here</dt><dd>{onlyUs} of {v.rows.length}</dd></div>
              <div><dt>Only {them.label}</dt><dd>{onlyThem} of {v.rows.length}</dd></div>
            </dl>
          </div>
          <aside aria-label="Measured size and the short version">
            <SizeScale bars={sizeBars(v, them)} caption="bytes shipped, to one scale" />
            <div className="cmp-note">
              <div className="tb"><span className="tb-n">→</span><span>short version</span></div>
              <p className="cmp-note-body"><b>{v.headline}</b>{v.verdict}</p>
            </div>
          </aside>
        </header>

        <div className="cmp-body">
          <nav className="cmp-toc" aria-label="On this page">
            <p className="cmp-toc-h">on this page</p>
            {toc.map(([id, label], i) => (
              <a key={id} href={`#${id}`} className="cmp-toc-a"><span>{pad(i + 1)}</span>{label}</a>
            ))}
          </nav>
          <div className="cmp-main">

            {/* ── 01 Size ────────────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="vs-size">
              <Head n={1} k="size" id="vs-size">What each figure measures</Head>
              <p className="cmp-p">{v.sizeNote}</p>
              <div className="vs-parts" role="table" aria-label="Packages measured">
                <div className="vs-parts-row vs-parts-hd" role="row">
                  <span role="columnheader">item</span>
                  <span role="columnheader">package</span>
                  <span role="columnheader">version</span>
                  <span role="columnheader">licence</span>
                  <span role="columnheader">last publish</span>
                  <span role="columnheader">gzip</span>
                </div>
                {provenance.map((p, i) => (
                  <div key={p.item} className={`vs-parts-row${i === 0 ? ' is-ours' : ''}`} role="row">
                    <span role="cell" className="vs-parts-n">{pad(i + 1)}</span>
                    <span role="cell" className="vs-parts-name">{p.c.name}</span>
                    <span role="cell"><i>version</i>{p.c.version}</span>
                    <span role="cell"><i>licence</i>{p.c.license}</span>
                    <span role="cell"><i>published</i>{p.on}</span>
                    <span role="cell" className="vs-parts-kb">{p.gzip} KB</span>
                  </div>
                ))}
              </div>
              <p className="cmp-small">
                Minified + gzipped at level 9, measured {them.measuredOn ?? MEASURED_ON} against {them.name} {them.version} and
                svg-scroll-draw {SELF.version}. {them.name} is {them.license}.
              </p>
              {them.caveat && <p className="cmp-small">{them.name}: <code className="vs-cmd">{them.command}</code> — {them.caveat}</p>}
            </section>

            {/* ── 02 Matrix ──────────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="vs-matrix">
              <Head n={2} k={`${v.rows.length} rows`} id="vs-matrix">Feature matrix</Head>
              <div className="tb vs-tally" aria-label="Tally of the matrix">
                <span className="tb-n">Σ</span>
                <span>both {both}</span>
                <span>only here {onlyUs}</span>
                <span>only {them.label} {onlyThem}</span>
              </div>
              <Ink className="vs-matrix">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th scope="col" className="vs-c-n">#</th>
                      <th scope="col" className="vs-c-f">feature</th>
                      <th scope="col" className="vs-c-m is-ours">svg-scroll-draw</th>
                      <th scope="col" className="vs-c-m">{them.label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.rows.map((row, i) => (
                      <tr key={row.feature} className={row.us === true && row.them === false ? 'is-ours' : row.them === true && row.us === false ? 'is-theirs' : undefined}>
                        <td className="vs-c-n">{pad(i + 1)}</td>
                        <th scope="row" className="vs-c-f">
                          <span className="vs-feat">{row.feature}</span>
                          {row.note && <span className="vs-note">{row.note}</span>}
                        </th>
                        <td className="vs-c-m"><Mark val={row.us} /></td>
                        <td className="vs-c-m"><Mark val={row.them} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Ink>
              <p className="cmp-small vs-legend">
                <span><Mark val={true} /> supported</span>
                <span><Mark val={false} /> not supported</span>
                <span><Mark val="partial" /> partial or requires extra work</span>
                <span>Checked against {them.name} {them.version}.</span>
              </p>
            </section>

            {/* ── 03 Where they win ──────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="vs-theirs">
              <Head n={3} k={`where ${them.label.toLowerCase()} wins`} id="vs-theirs">When {them.label} is the right call</Head>
              <ol className="vs-wins">
                {v.theirWins.map((w, i) => (
                  <li key={w.title}>
                    <span className="vs-wins-n">W{i + 1}</span>
                    <div>
                      <h3 className="vs-wins-t">{w.title}</h3>
                      <p className="cmp-p">{w.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 04 Questions ───────────────────────────────── */}
            <section className="cmp-sec" aria-labelledby="vs-faq">
              <Head n={4} k="questions" id="vs-faq">Questions</Head>
              <div className="cmp-faq">
                {v.faq.map((item, i) => (
                  <div key={item.q} className="cmp-q">
                    <span className="cmp-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="cmp-q-t">{item.q}</h3>
                      <p className="cmp-p">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 05 Other comparisons ───────────────────────── */}
            <section className="cmp-sec" aria-labelledby="vs-more">
              <Head n={5} k="other comparisons" id="vs-more">Other comparisons</Head>
              <div className="ex-rel-list">
                {others.map((o, i) => (
                  <Link key={o.href} href={o.href} className="ex-rel-row">
                    <span className="ex-rel-n">{pad(i + 1)}</span>
                    <span>
                      <span className="ex-rel-t">{o.t}</span>
                      <span className="ex-rel-d">{o.d}</span>
                    </span>
                    <span className="ex-rel-go" aria-hidden="true">open →</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

export { SITE_URL };
