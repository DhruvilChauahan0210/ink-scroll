import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Closing } from '@/components/blog/BlogArticle';

// Searches this post is for: "svelte scroll animation components", "shadcn-svelte
// blocks", "sveltekit svg animation", "svelte 5 scroll animation", "svelte draw
// svg on scroll". The listings are files in ./listings, printed from disk. The
// .svelte ones were mounted in a SvelteKit 2 app with Svelte 5.57 (scratch
// harness): svelte-check 0 errors; in Chromium the spiral was 77% drawn with its
// centre at 65% of the screen and finished at 45%; the same component without
// {#if} showed the line whole with no animation; the caption kept its space,
// and the plain-text version compiled to "· seed" with the space gone.
const SLUG = 'svelte-scroll-animation-components';
const TITLE = 'Scroll-Drawn Svelte 5 Components With shadcn-svelte';
const DESCRIPTION =
  'Install scroll animation sections into a SvelteKit app with the shadcn-svelte CLI, then the three Svelte details that decide whether a drawing animates.';
const URL = `https://svg-scroll-draw.vercel.app/blog/${SLUG}`;
const SITE = 'https://svg-scroll-draw.vercel.app';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svelte scroll animation components',
    'shadcn-svelte blocks',
    'sveltekit svg animation',
    'svelte 5 scroll animation',
    'svelte draw svg on scroll',
    'shadcn-svelte registry',
    'svelte action scroll',
  ],
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Scroll-drawn Svelte 5 components with shadcn-svelte',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-15',
  dateModified: '2026-11-15',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const listing = (file: string) =>
  readFileSync(join(process.cwd(), `src/app/blog/${SLUG}/listings`, file), 'utf8').trimEnd();

// The block list is the registry the CLI reads, so the count cannot drift.
type RegistryIndex = { items: { name: string; title: string }[] };
const SVELTE_BLOCKS = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/r/svelte/registry.json'), 'utf8')) as RegistryIndex
).items;

export default function Page() {
  return (
    <BlogArticle
      slug={SLUG}
      jsonLd={articleJsonLd}
      tags={['Svelte 5', 'SvelteKit', 'shadcn-svelte']}
      title={<>Scroll-drawn Svelte 5 components, <span className="ba-nw">installed with</span> shadcn-svelte</>}
      lede={
        <>
          The shadcn idea, copying a component&apos;s source into your project instead of installing a package of
          them, works in Svelte too, through the shadcn-svelte CLI. This post installs scroll animation sections that
          way into a SvelteKit app, then covers the three Svelte details we hit making them: when the action has to
          mount, the whitespace Svelte trims, and where a registry&apos;s files land.
        </>
      }
      facts={[
        { k: 'Svelte blocks', v: `${SVELTE_BLOCKS.length} on /blocks` },
        { k: 'Tested with', v: 'Svelte 5 · SvelteKit 2' },
        { k: 'CLI', v: 'shadcn-svelte' },
        { k: 'Runtime', v: 'svg-scroll-draw only' },
      ]}
      further={[
        { href: '/svelte-scroll-animation', label: 'Svelte scroll animation', blurb: 'Every action, update() and the factories, with a quick start.' },
        { href: '/blog/vue-svelte-solid-v2', label: 'Vue, Svelte and Solid wrappers', blurb: 'How each framework wrapper is built, side by side.' },
        { href: '/blog/generative-svg-line-art', label: 'Generative SVG line art', blurb: 'The flow fields and harmonographs behind the scrollfx sections.' },
      ]}
    >
      <Section id="setup" k="once" title="Point the CLI at your project">
        <p>
          shadcn-svelte reads a <code>components.json</code> at the root of the app to learn where your components
          and library code live. <code>npx shadcn-svelte@latest init</code> writes one; this is the file it needs, if
          you would rather write it yourself:
        </p>
        <Code file="components.json">{listing('components.json')}</Code>
        <p>
          The blocks are styled with Tailwind CSS, so the app needs Tailwind set up, and they use the{' '}
          <code>svg-scroll-draw</code> package at runtime. The CLI installs that dependency for you.
        </p>
      </Section>

      <Section id="install" k="add" title="Add a section">
        <p>Each block is one JSON file in the registry. Give the CLI its URL:</p>
        <Code file="terminal">{`npx shadcn-svelte@latest add ${SITE}/r/svelte/signature-draw.json`}</Code>
        <p>
          The component lands at <code>src/lib/components/scroll/SignatureDraw.svelte</code>, as source you own and
          can edit, and you use it like any component:
        </p>
        <Code file="src/routes/+page.svelte">{listing('page.svelte')}</Code>
        <p>
          The same works for the other {SVELTE_BLOCKS.length - 1} on <Link href="/blocks">/blocks</Link>:{' '}
          {SVELTE_BLOCKS.slice(1)
            .map((b) => b.title.toLowerCase())
            .join(', ')}
          . Readers who ask for reduced motion get every one of them in its finished state.
        </p>
      </Section>

      <Section id="mount" k="timing" title="Mount the action after the drawing exists">
        <p>
          A drawing generated in code, rather than written into the markup, is best made in the browser: the server
          HTML stays small and the server does no maths. In Svelte that means <code>onMount</code>, and that is where
          the first trap is. <code>use:scrollDraw</code> runs as soon as its element mounts and collects the paths
          inside it then, once. If the element is already on the page while the path has no <code>d</code> yet, the
          action measures a line of length zero.
        </p>
        <p>Wrap the element in <code>{'{#if}'}</code>, so it only mounts once the drawing is there:</p>
        <Code file="Spiral.svelte">{listing('Spiral.svelte')}</Code>
        <Callout k="without the if">
          The same component with the <code>{'{#if}'}</code> removed shows no error. The spiral simply appears whole
          when the page loads and never animates, which is easy to miss in a quick look at the page.
        </Callout>
        <p>
          The trigger runs from when the spiral&apos;s centre is 115% of the way down the screen to when it is at 50%,
          and <code>linear</code> keeps the pen in step with the scroll. In Chromium the spiral was 77% drawn with its
          centre at 65% of the screen and finished by 45%.
        </p>
      </Section>

      <Section id="whitespace" k="markup" title="Svelte trims the space at the start of an element">
        <p>
          Svelte 5 removes whitespace at the start and end of an element&apos;s content. Usually that is what you want;
          in a caption built from pieces it eats a space you meant. Written as text,{' '}
          <code>{'<span> · seed {seed}</span>'}</code> compiles to <code>· seed</code>, and the caption reads
          “392 strokes· seed 417”. An expression is not trimmed:
        </p>
        <Code file="Caption.svelte">{listing('Caption.svelte')}</Code>
        <p>This is a Svelte rule rather than anything about scroll animation, but ports from React and Vue hit it every time.</p>
      </Section>

      <Section id="registry" k="publishing" title="If you publish a shadcn-svelte registry">
        <p>
          Both registries on this page installed every file one folder inside itself at first. The cause is the{' '}
          <code>target</code> field. The React shadcn CLI resolves a target from the project root, but shadcn-svelte
          resolves it inside the folder its alias points at: a component inside <code>$lib/components</code>, a{' '}
          <code>registry:lib</code> file inside <code>$lib</code>. A target of{' '}
          <code>src/lib/components/scroll/Spiral.svelte</code> therefore installed at{' '}
          <code>src/lib/components/src/lib/components/scroll/Spiral.svelte</code>. Give the path below the alias:
        </p>
        <Code file="spiral.json">{listing('registry-item.json')}</Code>
        <p>
          The import still compiles if the file lands somewhere odd, so this does not show up as an error. Install
          each block into a fresh SvelteKit app and look at where its files went before you publish.
        </p>
      </Section>

      <Closing
        title="More sections, drawn like a plotter"
        lede={
          <>
            <a href="https://scrollfx-ui.vercel.app">scrollfx</a> is a folio of plotter-art sections built on
            svg-scroll-draw (a flow-field hero, a hatched chart, a harmonograph call to action, a ridgeline footer),
            each available for React, Vue and Svelte and installed with the matching shadcn CLI.
          </>
        }
        command={`npx shadcn-svelte@latest add ${SITE}/r/svelte/signature-draw.json`}
        links={[
          { href: '/blocks', label: 'All blocks →' },
          { href: 'https://scrollfx-ui.vercel.app', label: 'See scrollfx' },
        ]}
      />
    </BlogArticle>
  );
}
