import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { CopyButton } from '@/components/CopyButton';
import { MobileMenu } from '@/components/MobileMenu';
import { ThemeToggle } from '@/components/ThemeToggle';

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
const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';

const TITLE = 'Scroll Animation Blocks for React & shadcn';
const DESCRIPTION =
  'Copy-paste scroll animation blocks for React and Tailwind. Install one file with the shadcn CLI. MIT, built on svg-scroll-draw (10 KB).';

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
  files: { path: string; content: string; target?: string }[];
}

interface Block {
  item: RegistryItem;
  Preview: ComponentType;
  /** Extra classes for the preview frame. */
  frame?: string;
}

const BLOCKS: Block[] = [
  { item: signatureDrawItem, Preview: SignatureDraw },
  { item: revealCardsItem, Preview: RevealCards },
  { item: statCounterRowItem, Preview: StatCounterRow },
  { item: stickyFeatureItem, Preview: StickyFeature },
  { item: headlineTextRevealItem, Preview: HeadlineTextReveal, frame: 'py-24 sm:py-32' },
];

const installCommand = (name: string) => `npx shadcn@latest add ${SITE}/r/${name}.json`;

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

const pill =
  'text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap';

function InstallCommand({ name }: { name: string }) {
  const cmd = installCommand(name);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pitch-black bg-[#111] pl-4 pr-2 py-2.5 min-w-0">
      <span aria-hidden="true" className="font-mono text-[12px] text-[#ff90e8] shrink-0">$</span>
      <code className="font-mono text-[11px] sm:text-[12px] text-[#e8e8e3] overflow-x-auto whitespace-nowrap flex-1 min-w-0">
        {cmd}
      </code>
      <span className="shrink-0">
        <CopyButton text={cmd} />
      </span>
    </div>
  );
}

function SourceCode({ file }: { file: RegistryItem['files'][number] }) {
  const filename = file.target ?? file.path;
  return (
    <details className="group rounded-xl border border-pitch-black overflow-hidden text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#111] px-4 py-2.5 text-[#e8e8e3] [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[11px] sm:text-[12px] truncate">{filename}</span>
        <span className="font-mono text-[11px] text-[#888] shrink-0">
          <span className="group-open:hidden">View source ▾</span>
          <span className="hidden group-open:inline">Hide source ▴</span>
        </span>
      </summary>
      <div className="relative">
        <div className="absolute right-3 top-2 z-10">
          <CopyButton text={file.content} />
        </div>
        <pre className="bg-[#242423] text-[#e8e8e3] px-3 sm:px-5 py-4 text-[10px] sm:text-[12px] font-mono leading-[1.75] overflow-x-auto max-h-[70vh]">
          {file.content}
        </pre>
      </div>
    </details>
  );
}

export default function BlocksPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/docs" className={pill}>Docs</Link>
          <Link href="/examples" className={pill}>Examples</Link>
          <Link href="/blog" className={pill}>Blog</Link>
          <Link href="/playground" className={pill}>Playground</Link>
        </div>
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">Blocks</p>
          <h1 className="font-display font-extrabold text-[clamp(30px,6vw,72px)] leading-[0.92] tracking-[-0.04em] mb-6">
            Scroll blocks you{' '}
            <span className="relative inline-block">
              <span className="relative z-10 px-2 sm:px-3">copy, not install.</span>
              <span aria-hidden="true" className="absolute inset-0 bg-creator-pink rounded-xl -rotate-[0.8deg]" />
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl font-medium mb-3">
            Copy-paste scroll blocks. MIT. Built on svg-scroll-draw, 10 KB.
          </p>
          <p className="text-sm sm:text-base text-graphite-border max-w-2xl leading-relaxed">
            Each block is one React + Tailwind file that lands in your project. Add it with the shadcn CLI, or open the
            source and paste it in. The only package it needs is{' '}
            <code className="font-mono text-pitch-black text-[0.9em] bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">
              svg-scroll-draw
            </code>
            . Visitors who ask for reduced motion see the finished state.
          </p>

          <ul className="flex flex-wrap gap-2 mt-8">
            {BLOCKS.map(({ item }) => (
              <li key={item.name}>
                <a href={`#${item.name}`} className={`${pill} inline-block`}>
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Blocks. No overflow-hidden on these wrappers: it would break the
          sticky panel in the sticky-feature preview. */}
      <div className="divide-y divide-pitch-black">
        {BLOCKS.map(({ item, Preview, frame }, i) => (
          <section
            key={item.name}
            id={item.name}
            aria-labelledby={`${item.name}-title`}
            className={`scroll-mt-14 px-4 sm:px-6 md:px-12 py-12 sm:py-16 ${i % 2 === 1 ? 'bg-marketplace-gray' : ''}`}
          >
            <div className="max-w-5xl mx-auto min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                <span className="font-mono text-[11px] text-graphite-border">{String(i + 1).padStart(2, '0')}</span>
                <h2 id={`${item.name}-title`} className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em]">
                  {item.title}
                </h2>
                <code className="font-mono text-[11px] text-graphite-border">{item.name}</code>
              </div>
              <p className="text-sm sm:text-base text-graphite-border max-w-2xl mb-5">{item.description}</p>

              <InstallCommand name={item.name} />

              <p className="mt-6 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-graphite-border">
                Live preview · scroll
              </p>
              <div className={`rounded-2xl border border-pitch-black bg-light-linen px-4 sm:px-8 py-12 sm:py-16 ${frame ?? ''}`}>
                <Preview />
              </div>

              <div className="mt-6 space-y-3">
                {item.files.map((file) => (
                  <SourceCode key={file.path} file={file} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Manual install + more */}
      <section className="border-t border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto min-w-0">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.03em] mb-3">Without the shadcn CLI</h2>
          <p className="text-sm sm:text-base text-graphite-border max-w-2xl leading-relaxed mb-5">
            Install the package, then paste a block&apos;s source into{' '}
            <code className="font-mono text-pitch-black text-[0.9em]">components/scroll/</code>. Every block is a client
            component, so it works in the Next.js App Router as-is.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-pitch-black bg-[#111] pl-4 pr-2 py-2.5 max-w-md">
            <span aria-hidden="true" className="font-mono text-[12px] text-[#ff90e8]">$</span>
            <code className="font-mono text-[12px] text-[#e8e8e3] flex-1">npm i svg-scroll-draw</code>
            <CopyButton text="npm i svg-scroll-draw" />
          </div>
          <p className="text-sm text-graphite-border mt-6">
            Registry index:{' '}
            <a href="/r/registry.json" className="underline underline-offset-2 hover:text-pitch-black transition-colors font-mono">
              /r/registry.json
            </a>
            {' · '}
            <Link href="/examples" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
              More examples
            </Link>
            {' · '}
            <Link href="/docs" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
              Docs
            </Link>
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href={GH} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
