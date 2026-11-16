import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Closing } from '@/components/blog/BlogArticle';

// Searches this post is for: "vue scroll animation components", "shadcn-vue
// blocks", "vue 3 svg animation", "vue draw svg on scroll", "vue template ref
// composable null". The listings are files in ./listings, printed from disk, and
// were mounted in a Vite + Vue 3 app (scratch harness) before publishing:
// in Chromium the spiral still drawing with its centre at 65% of
// the screen and finished at 45%; without v-if the line shows whole and never
// animates (3 of 3 on a page where nothing else moves; it drew only when a later
// mount elsewhere changed the layout and every instance re-measured); with the ref bound as an expression the composable gets no
// element and nothing draws. vue-tsc (noUnusedLocals, as create-vite sets it)
// reports a template ref used only by name as unused, Vue's own ref() included.
const SLUG = 'vue-scroll-animation-components';
const TITLE = 'Scroll-Drawn Vue 3 Components, Installed With shadcn-vue';
const DESCRIPTION =
  'Install ready-made scroll animation sections into a Vue 3 app with the shadcn-vue CLI, then the three Vue details that decide whether a drawing animates: when ScrollDraw mounts, ref versus :ref, and ScrollAnimate’s options prop.';
const URL = `https://svg-scroll-draw.vercel.app/blog/${SLUG}`;
const SITE = 'https://svg-scroll-draw.vercel.app';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'vue scroll animation components',
    'shadcn-vue blocks',
    'vue 3 svg animation',
    'vue draw svg on scroll',
    'vue template ref composable',
    'shadcn-vue registry',
  ],
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Scroll-drawn Vue 3 components, installed with shadcn-vue',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-16',
  dateModified: '2026-11-16',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const listing = (file: string) =>
  readFileSync(join(process.cwd(), `src/app/blog/${SLUG}/listings`, file), 'utf8').trimEnd();

// The block list is the registry the CLI reads, so the count cannot drift.
type RegistryIndex = { items: { name: string; title: string }[] };
const VUE_BLOCKS = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/r/vue/registry.json'), 'utf8')) as RegistryIndex
).items;

export default function Page() {
  return (
    <BlogArticle
      slug={SLUG}
      jsonLd={articleJsonLd}
      tags={['Vue 3', 'shadcn-vue', 'Composition API']}
      title={<>Scroll-drawn Vue 3 components, <span className="ba-nw">installed with</span> shadcn-vue</>}
      lede={
        <>
          shadcn-vue copies a component&apos;s source into your project instead of installing a package of them, so
          you own every line. This post installs scroll animation sections that way into a Vue 3 app, then covers the
          three Vue details we hit making them: when <code>ScrollDraw</code> has to mount, the difference between{' '}
          <code>ref</code> and <code>:ref</code>, and the one component that takes its options as an object.
        </>
      }
      facts={[
        { k: 'Vue blocks', v: `${VUE_BLOCKS.length} on /blocks` },
        { k: 'Tested with', v: 'Vue 3 · Vite' },
        { k: 'CLI', v: 'shadcn-vue' },
        { k: 'Runtime', v: 'svg-scroll-draw only' },
      ]}
      further={[
        { href: '/vue-scroll-animation', label: 'Vue scroll animation', blurb: 'Every component and composable, with a quick start.' },
        { href: '/nuxt-scroll-animation', label: 'Nuxt scroll animation', blurb: 'The module that auto-imports all of them.' },
        { href: '/blog/svelte-scroll-animation-components', label: 'The same, for Svelte 5', blurb: 'shadcn-svelte, actions and the traps Svelte has instead.' },
      ]}
    >
      <Section id="setup" k="once" title="Point the CLI at your project">
        <p>
          <code>npx shadcn-vue@latest init</code> writes a <code>components.json</code> at the root of the app. The
          part the blocks rely on is <code>aliases</code>, which tells the CLI where components and library code
          live:
        </p>
        <Code file="components.json (excerpt)">{listing('components.json')}</Code>
        <p>
          The blocks are styled with Tailwind CSS, so the app needs Tailwind set up, and they use the{' '}
          <code>svg-scroll-draw</code> package at runtime. The CLI installs that dependency for you.
        </p>
      </Section>

      <Section id="install" k="add" title="Add a section">
        <p>Each block is one JSON file in the registry. Give the CLI its URL:</p>
        <Code file="terminal">{`npx shadcn-vue@latest add ${SITE}/r/vue/signature-draw.json`}</Code>
        <p>
          In a Vite app the component lands at <code>src/components/scroll/SignatureDraw.vue</code>, as source you
          own and can edit. Use it like any component:
        </p>
        <Code file="App.vue">{listing('App.vue')}</Code>
        <p>
          The same works for the other {VUE_BLOCKS.length - 1} on <Link href="/blocks">/blocks</Link>:{' '}
          {VUE_BLOCKS.slice(1)
            .map((b) => b.title.toLowerCase())
            .join(', ')}
          . Readers who ask for reduced motion get every one of them in its finished state.
        </p>
      </Section>

      <Section id="mount" k="timing" title="Mount ScrollDraw after the drawing exists">
        <p>
          A drawing generated in code is best made in the browser, in <code>onMounted</code>, so the server HTML stays
          small. <code>ScrollDraw</code> starts when it mounts and collects the paths inside it then; it starts again
          only when one of its options changes. If it mounts while the path has no <code>d</code> yet, it measures a
          line of length zero.
        </p>
        <p>
          Put <code>v-if</code> on it, so it only mounts once the drawing is there:
        </p>
        <Code file="Spiral.vue">{listing('Spiral.vue')}</Code>
        <Callout k="without the v-if">
          The same component without <code>v-if</code> shows no error. The spiral simply appears whole when the page
          loads and never animates.
        </Callout>
        <p>
          The trigger runs from when the spiral&apos;s centre is 115% of the way down the screen to when it is at 50%,
          and <code>linear</code> keeps the pen in step with the scroll, so it finishes as the reader reaches it.
        </p>
      </Section>

      <Section id="ref" k="composables" title="ref, not :ref">
        <p>
          The composables (<code>useScrollDraw</code>, <code>useScrollAnimate</code>, <code>useScrollCounter</code>…)
          return a ref for you to put on an element. In <code>&lt;script setup&gt;</code>, Vue fills a ref when the
          template names it as a plain string attribute:
        </p>
        <Code file="Logo.vue">{listing('Logo.vue')}</Code>
        <p>
          Writing <code>:ref=&quot;logo&quot;</code> instead binds the ref&apos;s current value, which is{' '}
          <code>null</code>, so the composable never gets an element and nothing animates. Every Vue example on this
          site had that mistake until 2.27.1, along with the file <code>npx svg-scroll-draw init</code> writes for Vue,
          and nothing errored; a check in CI now rejects it.
        </p>
        <Callout k="vue-tsc">
          With <code>noUnusedLocals</code> on, as a new Vite app sets it, vue-tsc reports <code>logo</code> as declared
          but never read: it does not count a ref the template names only by string. It reports Vue&apos;s own{' '}
          <code>ref()</code> the same way. The binding works; the report is the type checker&apos;s.
        </Callout>
      </Section>

      <Section id="options" k="components" title="ScrollAnimate takes one options object">
        <p>
          <code>ScrollDraw</code> takes each option as its own prop (<code>easing</code>, <code>trigger</code>,{' '}
          <code>stagger</code>). <code>ScrollAnimate</code> does not: what it animates is a map of CSS properties,
          which does not fit into props, so the whole configuration goes in <code>:options</code>:
        </p>
        <Code file="Card.vue">{listing('Card.vue')}</Code>
        <p>
          <code>props</code> are CSS properties, each with a start and an end value, so a slide is a{' '}
          <code>transform</code>, not an <code>x</code> or <code>y</code>.
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
        command={`npx shadcn-vue@latest add ${SITE}/r/vue/signature-draw.json`}
        links={[
          { href: '/blocks', label: 'All blocks →' },
          { href: 'https://scrollfx-ui.vercel.app', label: 'See scrollfx' },
        ]}
      />
    </BlogArticle>
  );
}
