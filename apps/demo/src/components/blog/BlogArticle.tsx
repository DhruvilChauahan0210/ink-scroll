import '../blog.css';
import Link from 'next/link';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { POSTS } from '@/data/blog-posts';
import { EXAMPLE_SEO } from '@/data/examples-seo';
import { RELATED_BY_POST } from '@/data/related-links';
import { TOOLS } from '@/data/tools';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';
import { SiteShell } from '../site/SiteShell';
import { CodeBox } from '../site/CodeBox';
import { GitHubStar } from '../site/GitHubStar';
import { StepRail } from '../site/StepRail';
import { CopyButton } from '../CopyButton';

/**
 * Sentence case for a label the posts pass in lowercase ('the request', 'media
 * query'). Words that are code stay as written: anything with a dot, slash,
 * parenthesis or capital after the first letter, like `prefers-reduced-motion`
 * or `scrollText`, is a name, not prose.
 */
function sentence(s: string): string {
  const first = s.split(/\s/)[0];
  if (/[./()@]|[A-Z]/.test(first) || /^[a-z]+-[a-z-]+$/.test(first) && !s.includes(' ')) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export { Plate } from '../site/Plate';

const pad = (n: number) => String(n).padStart(2, '0');

/* ─────────────────────────────────────────────────────────────────────────────
   The blog's article frame, in the homepage's drawing-sheet language.

   <BlogArticle slug=… title=… lede=…>
     <Section id="install" title="Install">…</Section>
     …
   </BlogArticle>

   Sections are numbered in order and listed in the contents beside the body,
   so they must be direct children of <BlogArticle>. Everything else in the
   body (prose, code, tables, callouts) is styled by `.ba-prose`; the helpers
   below cover the pieces plain HTML cannot draw. See README-conversion.md.
   ──────────────────────────────────────────────────────────────────────────── */

type LinkItem = { href: string; label: string; blurb?: string };

type SectionProps = {
  /** Anchor id; also what the contents links to. */
  id: string;
  /** The section heading. */
  title: ReactNode;
  /** Short label for the contents and the title strip, when `title` is long or not a string. */
  toc?: string;
  /** Mono label in the title strip beside the number, e.g. "install". */
  k?: string;
  /** Set by <BlogArticle>; do not pass. */
  n?: number;
  children?: ReactNode;
};

/** A numbered section: its number and label in a title strip, then the heading. */
export function Section({ id, title, k, n = 0, children }: SectionProps) {
  return (
    <section className="ba-sec" aria-labelledby={id}>
      <div className="tb ba-tb">
        <span className="tb-n">{pad(n)}</span>
        {k ? <span>{sentence(k)}</span> : null}
      </div>
      <h2 id={id} className="ba-h2">{title}</h2>
      {children}
    </section>
  );
}

export function BlogArticle({
  slug,
  title,
  lede,
  tags,
  facts,
  figure,
  jsonLd,
  further,
  children,
}: {
  /** The post's slug in data/blog-posts.ts — supplies tag, date, reading time and sheet number. */
  slug: string;
  /** The h1. A string or nodes (a <br /> is fine). */
  title: ReactNode;
  /** The opening paragraph. Inline <code> and <strong> are styled. */
  lede: ReactNode;
  /** Extra tags after the post's own tag. */
  tags?: string[];
  /** Real figures under the title, as hairline cells. Take them from data/*, never type them. */
  facts?: { k: string; v: ReactNode }[];
  /** The opening drawing beside the title on wide screens, under it on phones. Use <Figure>. */
  figure?: ReactNode;
  /** One JSON-LD object or an array of them, serialised safely. */
  jsonLd?: object | object[];
  /** Hand-picked "continue reading" links, listed first in the footer. */
  further?: LinkItem[];
  children: ReactNode;
}) {
  const index = POSTS.findIndex((p) => p.slug === slug);
  const post = POSTS[index];

  // Number the sections in order and collect the contents from them.
  const toc: { id: string; label: string }[] = [];
  const body: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Section) {
      const el = child as ReactElement<SectionProps>;
      const label = el.props.toc ?? (typeof el.props.title === 'string' ? el.props.title : el.props.id);
      toc.push({ id: el.props.id, label });
      body.push(cloneElement(el, { n: toc.length }));
    } else {
      body.push(child);
    }
  }

  return (
    <SiteShell active="/blog" kicker="blog / your turn" crumbs={[['Blog', '/blog'], [post.title, `/blog/${slug}`]]}>
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      ) : null}
      <div className="ba">
        {/* ── Opening ─────────────────────────────────────── */}
        <header className={`pg-head ba-head${figure ? ' has-fig' : ''}`}>
          <div className="ba-head-copy">
            <p className="pg-kicker">
              {post ? <span><b>{pad(index + 1)}</b> / blog / {post.tag.toLowerCase()}</span> : <span>Blog</span>}
              {post ? <span>{post.date}</span> : null}
              {post ? <span>{post.readTime}</span> : null}
            </p>
            <h1 className="pg-title ba-title">{title}</h1>
            <p className="pg-lede ba-lede">{lede}</p>
            <ul className="ba-tags" aria-label="Tags">
              {[post?.tag, ...(tags ?? [])].filter(Boolean).map((t) => (
                <li key={t} className="tag">{t}</li>
              ))}
            </ul>
            {facts?.length ? (
              <dl className="pg-facts ba-facts">
                {facts.map((f) => (
                  <div key={f.k}><dt>{sentence(f.k)}</dt><dd>{f.v}</dd></div>
                ))}
              </dl>
            ) : null}
          </div>
          {figure ? <div className="ba-head-fig">{figure}</div> : null}
        </header>

        {/* ── Body, with its contents beside it on wide screens ── */}
        <div className="ba-body">
          <nav className="ba-toc" aria-label="In this post">
            <p className="ba-toc-h">In this post</p>
            {toc.map((t, i) => (
              <a key={t.id} href={`#${t.id}`} className="ba-toc-a"><span>{pad(i + 1)}</span>{t.label}</a>
            ))}
            <a href="#ba-more" className="ba-toc-a"><span>→</span>Keep reading</a>
          </nav>
          <article className="ba-main ba-prose">
            {body}
            <BlogEnd slug={slug} further={further} />
          </article>
        </div>
      </div>
    </SiteShell>
  );
}

/* ── The footer: hand-picked links, the post's related pages, more posts ── */

function BlogEnd({ slug, further = [] }: { slug: string; further?: LinkItem[] }) {
  const related = RELATED_BY_POST[slug];
  const examples: LinkItem[] = (related?.examples ?? [])
    .map((s) => EXAMPLE_SEO[s])
    .filter(Boolean)
    .map((seo) => ({ href: `/examples/${seo.slug}`, label: seo.heading, blurb: seo.description }));
  const pages: LinkItem[] = related?.pages ?? [];
  const tools: LinkItem[] = (related?.tools ?? [])
    .map((id) => TOOLS.find((t) => t.slug === id))
    .filter((t) => t !== undefined)
    .map((t) => ({ href: `/${t.slug}`, label: t.name, blurb: t.blurb }));

  const at = POSTS.findIndex((p) => p.slug === slug);
  const others = [1, 2, 3].map((d) => POSTS[(at + d + POSTS.length) % POSTS.length]).filter((p) => p.slug !== slug);

  const rows: (LinkItem & { kind: string })[] = [];
  const seen = new Set<string>();
  const add = (items: LinkItem[], kind: string) => {
    for (const it of items) {
      if (seen.has(it.href)) continue;
      seen.add(it.href);
      rows.push({ ...it, kind });
    }
  };
  add(further, 'next');
  add(examples, 'example');
  add(tools, 'tool');
  add(pages, 'page');

  return (
    <section className="ba-sec ba-end" aria-labelledby="ba-more">
      <div className="tb ba-tb">
        <span className="tb-n">→</span>
        <span>Parts list</span>
      </div>
      <h2 id="ba-more" className="ba-h2">Keep reading</h2>
      {rows.length ? (
        <div className="ex-rel-list ba-rel">
          {rows.map((r, i) => (
            <Link key={r.href} href={r.href} className="ex-rel-row">
              <span className="ex-rel-n">{pad(i + 1)}</span>
              <span>
                <span className="ba-rel-k">{sentence(r.kind)}</span>
                <span className="ex-rel-t">{r.label}</span>
                {r.blurb ? <span className="ex-rel-d">{r.blurb}</span> : null}
              </span>
              <span className="ex-rel-go" aria-hidden="true">Open →</span>
            </Link>
          ))}
        </div>
      ) : null}

      <h3 className="ba-h3 ba-end-h">More from the blog</h3>
      <div className="ex-rel-list ba-rel">
        {others.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="ex-rel-row">
            <span className="ex-rel-n">{pad(POSTS.indexOf(p) + 1)}</span>
            <span>
              <span className="ba-rel-k">{p.tag} · {p.readTime}</span>
              <span className="ex-rel-t">{p.title}</span>
            </span>
            <span className="ex-rel-go" aria-hidden="true">Read →</span>
          </Link>
        ))}
      </div>
      <p className="ba-end-links">
        <Link href="/blog">All posts →</Link>
        <Link href="/examples">All examples →</Link>
        <Link href="/docs">API reference →</Link>
      </p>
    </section>
  );
}

/* ── Body pieces ──────────────────────────────────────────────────────── */

/** A code listing with its file name, line numbers and a copy button. */
export function Code({ file = 'snippet', children }: { file?: string; children: string }) {
  return <CodeBox file={file}>{children}</CodeBox>;
}

/** Two listings side by side (stacked on phones): what you had, what you write instead. */
export function Compare({
  before,
  after,
}: {
  before: { label: string; file?: string; code: string };
  after: { label: string; file?: string; code: string };
}) {
  return (
    <div className="ba-cmp">
      <div className="ba-cmp-col">
        <p className="ba-cmp-k"><span>Before</span>{before.label}</p>
        <Code file={before.file}>{before.code}</Code>
      </div>
      <div className="ba-cmp-col is-after">
        <p className="ba-cmp-k"><span>After</span>{after.label}</p>
        <Code file={after.file}>{after.code}</Code>
      </div>
    </div>
  );
}

/** A drawing-sheet note: a mono label, then the text, with the accent rule down its edge. */
export function Callout({ k = 'note', children }: { k?: string; children: ReactNode }) {
  return (
    <aside className="ba-note">
      <span className="ba-note-k">{sentence(k)}</span>
      <div className="ba-note-b">{children}</div>
    </aside>
  );
}

/** Term → definition rows, e.g. callbacks or options in a callout. */
export function Defs({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="ba-defs">
      {items.map(([t, d], i) => (
        <div key={i}><dt>{t}</dt><dd>{d}</dd></div>
      ))}
    </dl>
  );
}

/**
 * A spec table. The first column is set in mono (an option, a name), the
 * header in small caps; wide tables scroll inside their own frame.
 * `marks` turns '✓' / '✗' / '—' cells into drawn marks.
 */
export function Table({
  head,
  rows,
  first = 'mono',
  caption,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  /** How the first column reads: 'mono' (an API name, in the accent) or 'plain' (a label). */
  first?: 'mono' | 'plain';
  caption?: ReactNode;
}) {
  return (
    <figure className={`ba-table${first === 'plain' ? ' is-plain' : ''}`}>
      <div className="ba-table-scroll">
        <table>
          <thead>
            <tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className="ba-cap">{caption}</figcaption> : null}
    </figure>
  );
}

/** A drawn tick, cross or dash — for checklists and matrix cells. */
export function Mark({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="ba-mark is-dash" aria-label="partly">—</span>;
  return ok ? (
    <svg className="ba-mark is-ok" viewBox="0 0 16 16" aria-label="yes"><path d="M3 8.5 L6.5 12 L13 4.5" /></svg>
  ) : (
    <svg className="ba-mark is-no" viewBox="0 0 16 16" aria-label="no"><path d="M4 4 L12 12 M12 4 L4 12" /></svg>
  );
}

/** A list where each line carries a drawn mark. Two of them sit side by side in <Cols>. */
export function Checks({ title, items, muted = false }: {
  title?: ReactNode;
  items: { ok: boolean | null; text: ReactNode }[];
  /** Grey the text, for the side being compared against. */
  muted?: boolean;
}) {
  return (
    <div className={`ba-checks${muted ? ' is-muted' : ''}`}>
      {title ? <p className="ba-checks-h">{title}</p> : null}
      <ul className="ba-checks-list">
        {items.map((it, i) => (
          <li key={i}><Mark ok={it.ok} /><span>{it.text}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** Two columns on wide screens, one on phones. */
export function Cols({ children }: { children: ReactNode }) {
  return <div className="ba-cols">{children}</div>;
}

/** Numbered notes: a title and a line or two each, like a sheet's general notes. */
export function Notes({ items }: { items: { t: ReactNode; d: ReactNode }[] }) {
  return (
    <ol className="ba-notes">
      {items.map((it, i) => (
        <li key={i}>
          <span className="ba-notes-n">{pad(i + 1)}</span>
          <span><strong>{it.t}</strong> <span>{it.d}</span></span>
        </li>
      ))}
    </ol>
  );
}

/** Small labelled cells — a spec strip for a library, a licence, a size. Values from data/*. */
export function Spec({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="ba-spec">
      {items.map((it) => (
        <div key={it.k}><dt>{sentence(it.k)}</dt><dd>{it.v}</dd></div>
      ))}
    </dl>
  );
}

/** A procedure along a rail the library inks as you read. Children are <Step>s. */
export function Steps({ children }: { children: ReactNode }) {
  return (
    <StepRail>
      <ol className="ba-steps">{children}</ol>
    </StepRail>
  );
}

export function Step({ n, title, children }: { n: number; title: ReactNode; children?: ReactNode }) {
  return (
    <li className="ba-step">
      <span className="ba-node" aria-hidden="true">{n}</span>
      <p className="ba-step-k">Step {pad(n)}</p>
      <h3 className="ba-h3">{title}</h3>
      {children}
    </li>
  );
}

/** A captioned figure: "fig. 2 — caption". Wraps a drawing, a <Bars> chart or a live demo. */
export function Figure({ n, caption, children }: { n: number | string; caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="ba-fig">
      {children}
      <figcaption className="ba-cap">
        <span>Fig. {typeof n === 'number' ? n : n}</span> — {caption}
      </figcaption>
    </figure>
  );
}

/** The closing call to action: a heading, a line, the install command and buttons, then a quiet star on GitHub. */
export function Closing({
  title,
  lede,
  command = 'npm i svg-scroll-draw',
  links = [],
}: {
  title: ReactNode;
  lede?: ReactNode;
  command?: string;
  links?: { href: string; label: string }[];
}) {
  return (
    <div className="ba-close">
      <p className="ba-close-k">— / next</p>
      <h3 className="ba-close-t">{title}</h3>
      {lede ? <p className="ba-close-l">{lede}</p> : null}
      <div className="ba-close-row">
        <span className="ba-cmd"><span aria-hidden="true">$</span>{command}<CopyButton text={command} /></span>
        {links.map((l, i) => (
          <Link key={l.href} href={l.href} className={`btn${i === 0 ? ' btn-solid' : ''}`} data-magnetic>{l.label}</Link>
        ))}
      </div>
      <p className="ba-close-star">
        <GitHubStar className="btn-sm" />
        <span>Found this useful? A star helps others find it.</span>
      </p>
    </div>
  );
}
