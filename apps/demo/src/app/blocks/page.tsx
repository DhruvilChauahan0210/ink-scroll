import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Link from 'next/link';
import '@/components/blocks.css';
import { CopyButton } from '@/components/CopyButton';
import { SiteShell } from '@/components/site/SiteShell';
import { Plate } from '@/components/site/Plate';
import { CodeBox } from '@/components/site/CodeBox';
import { ProjectTree } from '@/components/blocks/ProjectTree';
import { SELF } from '@/data/competitors';
import { jsonLd as serialiseJsonLd } from '@/lib/json-ld';

// The previews render the exact files the registry ships…
import { SignatureDraw } from '../../../registry/blocks/signature-draw';
import { RevealCards } from '../../../registry/blocks/reveal-cards';
import { StatCounterRow } from '../../../registry/blocks/stat-counter-row';
import { StickyFeature } from '../../../registry/blocks/sticky-feature';
import { HeadlineTextReveal } from '../../../registry/blocks/headline-text-reveal';

// …and the source panels read the built registry items, so the code shown here
// is byte-for-byte what `npx shadcn add` writes. Rebuild with
// `npm run registry:build --workspace=apps/demo` after editing a block.
import signatureDrawItem from '../../../public/r/signature-draw.json';
import revealCardsItem from '../../../public/r/reveal-cards.json';
import statCounterRowItem from '../../../public/r/stat-counter-row.json';
import stickyFeatureItem from '../../../public/r/sticky-feature.json';
import headlineTextRevealItem from '../../../public/r/headline-text-reveal.json';

const SITE = 'https://svg-scroll-draw.vercel.app';

const TITLE = 'Scroll Animation Blocks for React & shadcn';
const DESCRIPTION =
  `Copy-paste scroll animation blocks for React and Tailwind. Install one file with the shadcn CLI. MIT, built on svg-scroll-draw (${Math.round(SELF.gzipKb)} KB).`;

export const metadata: Metadata = {
  // The layout template appends " | svg-scroll-draw" (60 characters in total).
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'scroll animation blocks',
    'shadcn scroll animation',
    'react scroll animation components',
    'copy paste scroll animation',
    'tailwind scroll animation',
    'svg signature animation react',
    'scroll reveal cards react',
    'animated counter on scroll react',
    'sticky scroll section react',
    'text reveal on scroll react',
  ],
  alternates: { canonical: '/blocks' },
  openGraph: {
    title: `${TITLE} | svg-scroll-draw`,
    description: DESCRIPTION,
    url: `${SITE}/blocks`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | svg-scroll-draw`,
    description: DESCRIPTION,
  },
};

interface RegistryItem {
  name: string;
  title: string;
  description: string;
  type?: string;
  dependencies?: string[];
  categories?: string[];
  files: { path: string; content: string; target?: string }[];
}

interface Block {
  item: RegistryItem;
  Preview: ComponentType;
  /** A taller stage, for a preview that needs scroll room around it. */
  tall?: boolean;
}

const BLOCKS: Block[] = [
  { item: signatureDrawItem, Preview: SignatureDraw },
  { item: revealCardsItem, Preview: RevealCards },
  { item: statCounterRowItem, Preview: StatCounterRow },
  { item: stickyFeatureItem, Preview: StickyFeature },
  { item: headlineTextRevealItem, Preview: HeadlineTextReveal, tall: true },
];

const installCommand = (name: string) => `npx shadcn@latest add ${SITE}/r/${name}.json`;
const pad = (n: number) => String(n).padStart(2, '0');
/** Lines as CodeBox counts them: trailing newlines don't make a line. */
const lineCount = (s: string) => s.replace(/\n+$/, '').split('\n').length;
const target = (f: RegistryItem['files'][number]) => f.target ?? f.path;

// Figures for the opening, read from the items rather than typed.
const DEPENDENCIES = [...new Set(BLOCKS.flatMap(({ item }) => item.dependencies ?? []))];
const FILES_EACH = Math.max(...BLOCKS.map(({ item }) => item.files.length));
const FIRST_TARGET = target(BLOCKS[0].item.files[0]);
const TARGET_DIR = FIRST_TARGET.slice(0, FIRST_TARGET.lastIndexOf('/'));
const TREE = BLOCKS.map(({ item }) => {
  const t = target(item.files[0]);
  return { name: item.name, file: t.slice(t.lastIndexOf('/') + 1), lines: lineCount(item.files[0].content) };
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'svg-scroll-draw blocks',
  description: DESCRIPTION,
  url: `${SITE}/blocks`,
  numberOfItems: BLOCKS.length,
  itemListElement: BLOCKS.map(({ item }, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.title,
    url: `${SITE}/blocks#${item.name}`,
  })),
};

/** The one command for a block, in a title strip: what it is, the line, copy. */
function InstallCommand({ name }: { name: string }) {
  const cmd = installCommand(name);
  return (
    <div className="bk-cmd">
      <span className="bk-cmd-k">shadcn cli</span>
      <span className="bk-cmd-line">
        <span aria-hidden="true" className="bk-cmd-p">$</span>
        <code>{cmd}</code>
      </span>
      <span className="bk-cmd-copy"><CopyButton text={cmd} /></span>
    </div>
  );
}

/** A section head: its number and name in a title strip. */
function Strip({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="tb bk-tb">
      <span className="tb-n">{n}</span>
      {children}
    </div>
  );
}

export default function BlocksPage() {
  const dep = DEPENDENCIES[0] ?? 'svg-scroll-draw';

  return (
    <SiteShell active="/blocks" kicker="blocks / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }} />
      <div className="blocks">

        {/* ── Opening ──────────────────────────────────────── */}
        <header className="pg-head bk-head">
          <div className="bk-head-l">
            <p className="pg-kicker">
              <span>blocks / {BLOCKS.length} registry items</span>
              <span>shadcn cli · react + tailwind</span>
            </p>
            <h1 className="pg-title bk-title">
              Scroll blocks you <span className="bk-dim">copy, not install.</span>
            </h1>
            <p className="pg-lede">
              Copy-paste scroll blocks. MIT. Built on svg-scroll-draw, {SELF.gzipKb} KB. Each block is one
              React + Tailwind file that lands in your project. Add it with the shadcn CLI, or open the source
              and paste it in. The only package it needs is <code className="bk-code">{dep}</code>. Visitors who
              ask for reduced motion see the finished state.
            </p>
            <div className="pg-actions">
              <a href={`#${BLOCKS[0].item.name}`} className="btn btn-solid" data-magnetic>
                See the {BLOCKS.length} blocks <span aria-hidden="true">↓</span>
              </a>
              <a href="/r/registry.json" className="btn" data-magnetic>registry.json</a>
            </div>
            <dl className="pg-facts">
              <div><dt>Blocks</dt><dd>{BLOCKS.length}</dd></div>
              <div><dt>Files each</dt><dd>{FILES_EACH}</dd></div>
              <div><dt>Needs</dt><dd>{DEPENDENCIES.length} {DEPENDENCIES.length === 1 ? 'package' : 'packages'}</dd></div>
              <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
            </dl>
          </div>
          <ProjectTree files={TREE} dependency={dep} dir={TARGET_DIR} />
        </header>

        {/* ── The blocks: each one a plate. No overflow-hidden on these
              wrappers: it would break the sticky panel in the sticky-feature
              preview (blocks.css clips the stage with `overflow: clip`). ── */}
        <div className="bk-list">
          {BLOCKS.map(({ item, Preview, tall }, i) => {
            const file = item.files[0];
            const lines = lineCount(file.content);
            return (
              <section key={item.name} id={item.name} aria-labelledby={`${item.name}-title`} className="bk">
                <div className="bk-top">
                  <div className="bk-copy">
                    <Strip n={pad(i + 1)}>
                      <span>{item.type?.replace('registry:', '') ?? 'block'}</span>
                      <span className="bk-tb-name">{item.name}</span>
                    </Strip>
                    <h2 id={`${item.name}-title`} className="bk-h2">{item.title}</h2>
                    <p className="bk-desc">{item.description}</p>
                  </div>
                  <div className="bk-install">
                    <InstallCommand name={item.name} />
                    <dl className="bk-parts">
                      <div><dt>writes</dt><dd className="bk-mono">{target(file)}</dd></div>
                      <div><dt>lines</dt><dd className="bk-mono">{lines}</dd></div>
                      <div><dt>needs</dt><dd className="bk-mono">{(item.dependencies ?? []).join(', ') || '—'}</dd></div>
                      {item.categories && item.categories.length > 0 && (
                        <div>
                          <dt>tags</dt>
                          <dd className="bk-tags">{item.categories.map((c) => <span key={c} className="tag">{c}</span>)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div className={`bk-plate${tall ? ' is-tall' : ''}`}>
                  <Plate n={i + 1} caption="live preview — scroll">
                    <Preview />
                  </Plate>
                </div>

                {item.files.map((f) => (
                  <details key={f.path} className="bk-src">
                    <summary>
                      <span>source</span>
                      <span className="bk-src-file">{target(f)}</span>
                      <span className="bk-src-n">{lineCount(f.content)} lines</span>
                    </summary>
                    <CodeBox file={target(f)}>{f.content}</CodeBox>
                  </details>
                ))}
              </section>
            );
          })}
        </div>

        {/* ── Manual install + more ───────────────────────── */}
        <section className="bk-manual" aria-labelledby="bk-manual-title">
          <div className="bk-manual-l">
            <Strip n={pad(BLOCKS.length + 1)}><span>manual install</span></Strip>
            <h2 id="bk-manual-title" className="bk-h2">Without the shadcn CLI</h2>
            <p className="bk-desc">
              Install the package, then paste a block&apos;s source into{' '}
              <code className="bk-code">{TARGET_DIR}/</code>. Every block is a client component, so it works
              in the Next.js App Router as-is.
            </p>
            <CodeBox file="terminal">{`npm i ${dep}`}</CodeBox>
          </div>
          <div className="bk-manual-r">
            <p className="bk-more-h">more</p>
            <div className="ex-rel-list">
              <a href="/r/registry.json" className="ex-rel-row">
                <span className="ex-rel-n">01</span>
                <span>
                  <span className="ex-rel-t">Registry index</span>
                  <span className="ex-rel-d bk-mono">/r/registry.json</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">open →</span>
              </a>
              <Link href="/examples" className="ex-rel-row">
                <span className="ex-rel-n">02</span>
                <span>
                  <span className="ex-rel-t">More examples</span>
                  <span className="ex-rel-d">Every pattern the library draws, with the code to paste.</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">open →</span>
              </Link>
              <Link href="/docs" className="ex-rel-row">
                <span className="ex-rel-n">03</span>
                <span>
                  <span className="ex-rel-t">Docs</span>
                  <span className="ex-rel-d">The API behind each block: ScrollDraw, scrollReveal, ScrollCounter, ScrollText and scrollAnimate.</span>
                </span>
                <span className="ex-rel-go" aria-hidden="true">open →</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
