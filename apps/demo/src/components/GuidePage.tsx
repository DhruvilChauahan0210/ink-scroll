import './guides.css';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import { GUIDES } from '@/data/guides';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';
import { CodeBox } from './site/CodeBox';
import { StepRail } from './site/StepRail';
import { SwapSheet, type SwapRow } from './guides/SwapSheet';

const pad = (n: number) => String(n).padStart(2, '0');

/** What a React user calls instead of a hand-written effect, per drop-in. */
const HOOK: Record<string, string> = {
  aos: 'useAOS · <AOSInit />',
  scrollreveal: 'useScrollReveal',
  vivus: 'useVivus',
};

function swapRows(key: string): SwapRow[] {
  const c = COMPETITORS[key];
  if (!c) return [];
  return [
    { k: 'import', before: c.name, after: `svg-scroll-draw/${key}` },
    { k: 'version', before: `${c.version}${c.lastPublish ? ` · ${c.lastPublish.slice(0, 4)}` : ''}`, after: `${SELF.version} · maintained` },
    { k: 'licence', before: c.license, after: 'MIT' },
    { k: 'gzip', before: `${c.gzipKb.toFixed(1)} KB`, after: `${SELF_ENTRIES[key].toFixed(1)} KB` },
    { k: 'in React', before: 'Your own effect', after: HOOK[key] ?? 'hook' },
  ];
}

/** A section head: its number and name in a title strip, then the heading. */
function Head({ n, k, children, id }: { n: number; k: string; children: React.ReactNode; id: string }) {
  return (
    <>
      <div className="tb gd-tb">
        <span className="tb-n">{pad(n)}</span>
        <span>{k}</span>
      </div>
      <h2 id={id} className="gd-h2">{children}</h2>
    </>
  );
}

export function GuidePage({ slug }: { slug: string }) {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: g.title,
      description: g.description,
      step: g.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ];
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  const key = g.from.toLowerCase();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="guide">

        {/* ── Opening ────────────────────────────────────── */}
        <header className="pg-head gd-head">
          <div>
            <p className="pg-kicker">
              <span>guide / {g.from.toLowerCase()} in {g.framework.toLowerCase()}</span>
              <span>{g.steps.length} steps</span>
            </p>
            <h1 className="pg-title gd-title">{g.headline}</h1>
            <p className="pg-lede">{g.intro}</p>
            <div className="pg-actions">
              <a href={g.starter} target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic>
                Try it on StackBlitz ↗
              </a>
              <Link href={g.compare.href} className="btn" data-magnetic>{g.compare.label}</Link>
            </div>
          </div>
          <SwapSheet from={g.from} to={g.swap?.to} rows={g.swap?.rows ?? swapRows(key)} />
        </header>

        <div className="gd-body">
          <nav className="gd-toc" aria-label="On this guide">
            <p className="gd-toc-h">On this guide</p>
            {[
              ['gd-problem', 'The problem'],
              ['gd-steps', `The steps · ${g.steps.length}`],
              ['gd-same', 'Unchanged'],
              ['gd-faq', `Questions · ${g.faq.length}`],
              ['gd-more', 'More guides'],
            ].map(([id, label], i) => (
              <a key={id} href={`#${id}`} className="gd-toc-a"><span>{pad(i + 1)}</span>{label}</a>
            ))}
          </nav>
          <div className="gd-main">

          {/* ── 01 The problem ─────────────────────────────── */}
          <section className="gd-sec" aria-labelledby="gd-problem">
            <Head n={1} k="The problem" id="gd-problem">What goes wrong with the usual setup</Head>
            <ol className="gd-notes">
              {g.problems.map((p, i) => (
                <li key={p}><span className="gd-notes-n">{i + 1}</span><span>{p}</span></li>
              ))}
            </ol>
          </section>

          {/* ── 02 The steps ───────────────────────────────── */}
          <section className="gd-sec" aria-labelledby="gd-steps">
            <Head n={2} k={`${g.steps.length} steps`} id="gd-steps">The switch, step by step</Head>
            <StepRail>
              <ol className="gd-steps">
                {g.steps.map((s, i) => (
                  <li key={s.title} className="gd-step">
                    <span className="gd-node" aria-hidden="true">{i + 1}</span>
                    <p className="gd-step-k">Step {pad(i + 1)}{s.file ? <> · <span>{s.file}</span></> : null}</p>
                    <h3 className="gd-h3">{s.title}</h3>
                    <p className="gd-p">{s.body}</p>
                    {s.code && <CodeBox file={s.file ?? 'snippet'}>{s.code}</CodeBox>}
                  </li>
                ))}
              </ol>
            </StepRail>
          </section>

          {/* ── 03 Unchanged ───────────────────────────────── */}
          <section className="gd-sec" aria-labelledby="gd-same">
            <Head n={3} k="unchanged" id="gd-same">What stays exactly the same</Head>
            <ul className="gd-checks">
              {g.unchanged.map((u) => (
                <li key={u}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" /></svg>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── 04 Questions ───────────────────────────────── */}
          <section className="gd-sec" aria-labelledby="gd-faq">
            <Head n={4} k="questions" id="gd-faq">Questions</Head>
            <div className="gd-faq">
              {g.faq.map((item, i) => (
                <div key={item.q} className="gd-q">
                  <span className="gd-q-n">Q{i + 1}</span>
                  <div>
                    <h3 className="gd-q-t">{item.q}</h3>
                    <p className="gd-p">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 05 More guides ─────────────────────────────── */}
          <section className="gd-sec" aria-labelledby="gd-more">
            <Head n={5} k="More guides" id="gd-more">More migration guides</Head>
            <div className="ex-rel-list">
              {others.map((o) => (
                <Link key={o.slug} href={`/guides/${o.slug}`} className="ex-rel-row">
                  <span className="ex-rel-n">{pad(GUIDES.indexOf(o) + 1)}</span>
                  <span>
                    <span className="ex-rel-t">{o.from} in {o.framework}</span>
                    <span className="ex-rel-d">{o.description}</span>
                  </span>
                  <span className="ex-rel-go" aria-hidden="true">Open →</span>
                </Link>
              ))}
            </div>
          </section>
          </div>
        </div>
      </div>
    </>
  );
}
