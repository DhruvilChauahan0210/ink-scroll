import './h2h.css';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { COMPETITORS, SELF } from '@/data/competitors';
import { CodeBox } from '../site/CodeBox';

/*
 * The pieces the three hand-written comparison pages (/vs-gsap, /vs-aos,
 * /vs-framer-motion) are built from, in the homepage's drawing-sheet language.
 * Styles in h2h.css, scoped under `.site .h2h`.
 */

export const pad = (n: number) => String(n).padStart(2, '0');

/** A section head: its number and name in a title strip, then the heading. */
export function Head({ n, k, id, children }: { n: number; k: string; id: string; children: ReactNode }) {
  return (
    <>
      <div className="tb h2h-tb">
        <span className="tb-n">{pad(n)}</span>
        <span>{k}</span>
      </div>
      <h2 id={id} className="h2h-h2">{children}</h2>
    </>
  );
}

/** Contents, beside the body on wide screens. */
export function Toc({ items }: { items: [string, string][] }) {
  return (
    <nav className="h2h-toc" aria-label="On this page">
      <p className="h2h-toc-h">On this page</p>
      {items.map(([id, label], i) => (
        <a key={id} href={`#${id}`} className="h2h-toc-a"><span>{pad(i + 1)}</span>{label}</a>
      ))}
    </nav>
  );
}

/* ── Marks ─────────────────────────────────────────────────────────────── */

export type Mark = boolean | 'partial' | string;

/** Supported, not supported or partial, drawn; anything else is a measured value, set in type. */
export function Glyph({ v }: { v: Mark }) {
  if (v === true)
    return (
      <svg className="gl gl-yes" viewBox="0 0 16 16" role="img" aria-label="supported">
        <path d="M3 8.5 L6.5 12 L13 4.5" />
      </svg>
    );
  if (v === false)
    return (
      <svg className="gl gl-no" viewBox="0 0 16 16" role="img" aria-label="not supported">
        <path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" />
      </svg>
    );
  if (v === 'partial')
    return (
      <svg className="gl gl-part" viewBox="0 0 16 16" role="img" aria-label="partial">
        <path d="M2.5 9.5 C4.5 5.5, 6.5 5.5, 8 8 S11.5 10.5, 13.5 6.5" />
      </svg>
    );
  return <span className="gl-val">{v}</span>;
}

export function Legend({ children }: { children?: ReactNode }) {
  return (
    <p className="h2h-legend">
      <span><Glyph v={true} /> Supported</span>
      <span><Glyph v={false} /> Not supported</span>
      <span><Glyph v="partial" /> partial or extra setup</span>
      {children && <span className="h2h-legend-x">{children}</span>}
    </p>
  );
}

export type MatrixRow = { f: string; cells: Mark[]; note?: string };

/**
 * The feature matrix as a schedule: numbered rows, one column per library,
 * ours tinted. Below 720px each row's marks drop under its name.
 */
export function Matrix({ cols, rows, prefix = 'F' }: { cols: { name: string; ours?: boolean }[]; rows: MatrixRow[]; prefix?: string }) {
  const vars = { '--mx-n': cols.length } as CSSProperties;
  const tally = cols.map((_, c) => rows.filter((r) => r.cells[c] === true).length);
  return (
    <div className="mx" style={vars} role="table" aria-label="Feature matrix">
      <div className="mx-row mx-hd" role="row">
        <span className="mx-n" role="columnheader">ref</span>
        <span className="mx-f" role="columnheader">Feature</span>
        {cols.map((c) => (
          <span key={c.name} className={`mx-c${c.ours ? ' is-ours' : ''}`} role="columnheader">{c.name}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.f} className="mx-row" role="row">
          <span className="mx-n" aria-hidden="true">{prefix}{pad(i + 1)}</span>
          <span className="mx-f" role="rowheader">
            {r.f}
            {r.note && <small>{r.note}</small>}
          </span>
          {r.cells.map((v, c) => (
            <span key={c} className={`mx-c${cols[c].ours ? ' is-ours' : ''}`} role="cell">
              <span className="mx-who" aria-hidden="true">{cols[c].name}</span>
              <Glyph v={v} />
            </span>
          ))}
        </div>
      ))}
      <div className="mx-row mx-tally" aria-hidden="true">
        <span className="mx-n">Σ</span>
        <span className="mx-f">Rows fully supported, of {rows.length}</span>
        {tally.map((t, c) => (
          <span key={c} className={`mx-c${cols[c].ours ? ' is-ours' : ''}`}>
            <span className="mx-who">{cols[c].name}</span>
            <span className="gl-val">{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Code, side by side ─────────────────────────────────────────────────── */

export type CodeItem = { who: string; file: string; code: string; ours?: boolean };

/** One task written in each library, in a numbered set; each listing's title strip carries its line count. */
export function CodeSet({ n, title, extra, items }: { n: string; title: string; extra?: string; items: CodeItem[] }) {
  const vars = { '--cs-n': items.length } as CSSProperties;
  return (
    <div className="cs">
      <div className="cs-head">
        <span className="cs-n">{n}</span>
        <h3 className="cs-t">{title}</h3>
        {extra && <span className="tag cs-tag">{extra}</span>}
      </div>
      <div className={`cs-grid cs-${items.length}`} style={vars}>
        {items.map((it) => (
          <div key={it.who} className={`cs-col${it.ours ? ' is-ours' : ''}`}>
            <p className="cs-who">{it.who}</p>
            <CodeBox file={it.file}>{it.code}</CodeBox>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ways in, lettered like a drawing's zones: each listing with the case it is for beside it. */
export function Routes({ items }: { items: { label: string; file: string; code: string }[] }) {
  return (
    <ol className="rt">
      {items.map((it, i) => (
        <li key={it.file + it.label} className="rt-row">
          <p className="rt-k">
            <span className="rt-z">{String.fromCharCode(65 + i)}</span>
            <span>{it.label}</span>
          </p>
          <CodeBox file={it.file}>{it.code}</CodeBox>
        </li>
      ))}
    </ol>
  );
}

/* ── Lists ──────────────────────────────────────────────────────────────── */

/** The sheet's numbered notes. */
export function Notes({ items }: { items: ReactNode[] }) {
  return (
    <ol className="h2h-notes">
      {items.map((it, i) => (
        <li key={i}><span className="h2h-notes-n">{i + 1}</span><span>{it}</span></li>
      ))}
    </ol>
  );
}

/** Where the other library is the better choice: a numbered schedule, said plainly. */
export function Calls({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ol className="h2h-calls">
      {items.map((it, i) => (
        <li key={it.title}>
          <span className="h2h-calls-n">{pad(i + 1)}</span>
          <h3 className="h2h-calls-t">{it.title}</h3>
          <p className="h2h-calls-d">{it.desc}</p>
        </li>
      ))}
    </ol>
  );
}

/** A licence as a short ledger of what it allows, each line marked. */
export function Ledger({ name, badge, ours, items }: { name: string; badge: string; ours?: boolean; items: { text: string; ok: boolean }[] }) {
  return (
    <div className={`lg${ours ? ' is-ours' : ''}`}>
      <div className="lg-head">
        <span className="lg-name">{name}</span>
        <span className="tag lg-tag">{badge}</span>
      </div>
      <ul className="lg-list">
        {items.map((it) => (
          <li key={it.text}><Glyph v={it.ok} /><span>{it.text}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** A plain-spoken aside, set as a note on the sheet. */
export function Nb({ children }: { children: ReactNode }) {
  return (
    <div className="h2h-nb">
      <span className="h2h-nb-k">N.B.</span>
      <p>{children}</p>
    </div>
  );
}

/* ── The rest of the set ────────────────────────────────────────────────── */

const SET: { href: string; name: string; key: string }[] = [
  { href: '/vs-gsap', name: 'vs GSAP', key: 'gsapStack' },
  { href: '/vs-framer-motion', name: 'vs Framer Motion', key: 'framerMotion' },
  { href: '/vs-aos', name: 'vs AOS and ScrollReveal', key: 'aos' },
  { href: '/vs-motion', name: 'vs Motion', key: 'motionOne' },
  { href: '/vs-vivus', name: 'vs vivus', key: 'vivus' },
  { href: '/vs-scrollmagic', name: 'vs ScrollMagic', key: 'scrollmagic' },
  { href: '/vs-locomotive-scroll', name: 'vs Locomotive Scroll', key: 'locomotive' },
];

/** The other comparisons, as a parts list: each with the figure it is weighed on. */
export function OtherSheets({ current }: { current: string }) {
  const rows = SET.filter((s) => s.href !== current);
  return (
    <div className="ex-rel-list">
      {rows.map((s, i) => {
        const c = COMPETITORS[s.key];
        return (
          <Link key={s.href} href={s.href} className="ex-rel-row">
            <span className="ex-rel-n">{pad(i + 1)}</span>
            <span>
              <span className="ex-rel-t">{s.name}</span>
              <span className="ex-rel-d">
                {c.label} {c.version} · {c.gzipKb.toFixed(1)} KB · {c.license} — against {SELF.gzipKb} KB, {SELF.license}
              </span>
            </span>
            <span className="ex-rel-go" aria-hidden="true">Open →</span>
          </Link>
        );
      })}
      <Link href="/guides" className="ex-rel-row">
        <span className="ex-rel-n">{pad(rows.length + 1)}</span>
        <span>
          <span className="ex-rel-t">Migration guides</span>
          <span className="ex-rel-d">AOS, ScrollReveal and vivus in React and Next.js, step by step.</span>
        </span>
        <span className="ex-rel-go" aria-hidden="true">Open →</span>
      </Link>
    </div>
  );
}

/** The page's last word before the sign-off sheet. */
export function Closing({ n, title, children, actions }: { n: number; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <section className="h2h-end" aria-labelledby="h2h-end">
      <div className="tb h2h-tb">
        <span className="tb-n">{pad(n)}</span>
        <span>verdict</span>
      </div>
      <div className="h2h-end-in">
        <h2 id="h2h-end" className="h2h-end-t">{title}</h2>
        <div>
          <p className="h2h-p">{children}</p>
          <div className="pg-actions">{actions}</div>
        </div>
      </div>
    </section>
  );
}
