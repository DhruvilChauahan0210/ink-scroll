import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { WrapperFigure, type WrapperRow } from './WrapperFigure';

export const metadata: Metadata = {
  title: seoTitle('Scroll Animation in Vue 3, Svelte and Solid.js'),
  description:
    'Use scrollAnimate, scrollText, scrollCounter and scrollVideo in Vue 3, Svelte and Solid.js: composables, actions, hooks and component wrappers, with code.',
  keywords: [
    'vue scroll animation',
    'vue 3 scroll animate',
    'useScrollAnimate vue',
    'Svelte scroll animation',
    'svelte scroll animate action',
    'scrollTextAction svelte',
    'solid scroll animation',
    'useScrollAnimate solid',
    'solidjs scroll animate',
    'vue scroll text split',
    'svelte animate on scroll',
    'solid.js scroll animation library',
    'vue alternative to gsap scrolltrigger',
    'svelte alternative to gsap',
    'scroll animation without gsap vue',
  ],
  alternates: { canonical: '/blog/vue-svelte-solid-v2' },
  openGraph: {
    title: 'scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide',
    description: 'Full guide to scroll animations in Vue 3, Svelte, and Solid.js using svg-scroll-draw v2. Composables, actions, hooks — no GSAP.',
    url: 'https://svg-scroll-draw.vercel.app/blog/vue-svelte-solid-v2',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'scrollAnimate in Vue 3, Svelte, and Solid.js',
    description: 'The v2 framework guide — composables, actions, hooks. No GSAP needed.',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide',
  description: 'Full guide to using svg-scroll-draw v2 APIs (scrollAnimate, scrollText, scrollCounter, scrollVideo) in Vue 3, Svelte, and Solid.js. Composables, actions, hooks, and component wrappers with code examples.',
  url: 'https://svg-scroll-draw.vercel.app/blog/vue-svelte-solid-v2',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/vue-svelte-solid-v2' },
};

/** The four v2 APIs this guide covers in every framework. */
const V2_APIS = ['scrollAnimate', 'scrollText', 'scrollCounter', 'scrollVideo'];

/** [framework, pattern, import] — the summary table. */
const SUMMARY: [string, string, string][] = [
  ['Vue 3', 'useScrollAnimate(options) → ref', 'svg-scroll-draw/vue'],
  ['Vue 3', '<ScrollAnimate :options="...">', 'svg-scroll-draw/vue'],
  ['Svelte', 'use:scrollAnimate={opts}', 'svg-scroll-draw/svelte'],
  ['Svelte', 'createScrollAnimate → { action, getInstance }', 'svg-scroll-draw/svelte'],
  ['Solid', 'useScrollAnimate(options) → ref setter', 'svg-scroll-draw/solid'],
  ['Solid', 'createScrollAnimate → { ref, getInstance }', 'svg-scroll-draw/solid'],
  ['Nuxt', 'Same as Vue + plugin factory', 'svg-scroll-draw/nuxt'],
  ['Astro', 'data-scroll-animate + initScrollAnimate()', 'svg-scroll-draw/astro'],
];
const FRAMEWORKS = [...new Set(SUMMARY.map(([fw]) => fw))];
const SUBPATHS = [...new Set(SUMMARY.map(([, , imp]) => imp))];

/**
 * What each scrollAnimate wrapper does, read from its source in
 * packages/svg-scroll-draw/src/{vue,svelte,solid,astro}: where it creates the
 * engine and where it destroys it.
 */
const WRAPPERS: WrapperRow[] = [
  { fw: 'Vue 3', from: 'svg-scroll-draw/vue', write: 'useScrollAnimate(opts)', gives: 'a ref, bound with :ref', start: 'onMounted', stop: 'onUnmounted' },
  { fw: 'Svelte', from: 'svg-scroll-draw/svelte', write: 'use:scrollAnimate={opts}', gives: 'an action (node, opts)', start: 'On mount', stop: 'destroy()', update: 'update()' },
  { fw: 'Solid.js', from: 'svg-scroll-draw/solid', write: 'useScrollAnimate(opts)', gives: 'a ref setter', start: 'onMount', stop: 'onCleanup' },
  { fw: 'Astro', from: 'svg-scroll-draw/astro', write: 'data-scroll-animate', gives: 'read by initAll()', start: 'initAll()', stop: 'destroy()' },
];

export default function BlogVueSvelteSolidV2() {
  return (
    <BlogArticle
      slug="vue-svelte-solid-v2"
      jsonLd={articleJsonLd}
      tags={['Vue 3', 'Svelte', 'Solid.js']}
      title={<>scrollAnimate in Vue 3, Svelte, and Solid.js</>}
      lede={
        <>
          svg-scroll-draw v2.3 ships first-class wrappers for all three frameworks. This guide covers every API —
          composables, actions, hooks, component wrappers — with copy-paste examples for real-world patterns.
        </>
      }
      facts={[
        { k: 'Frameworks covered', v: String(FRAMEWORKS.length) },
        { k: 'v2 APIs covered', v: String(V2_APIS.length) },
        { k: 'Subpaths', v: String(SUBPATHS.length) },
        { k: 'Licence', v: SELF.license },
      ]}
      figure={
        <Figure n={1} caption="what each wrapper does, read from its source — what you write, and the bar is the engine's life: built in the framework's mount hook, destroyed in its cleanup">
          <WrapperFigure rows={WRAPPERS} />
        </Figure>
      }
    >
      <Section id="install" k="install" title="Install">
        <p>One package, all frameworks. Install once and import from the framework-specific subpath.</p>
        <Code file="terminal">{`npm install svg-scroll-draw
# or
pnpm add svg-scroll-draw`}</Code>
        <p>
          Vue, Svelte, and Solid are all peer dependencies — they&apos;re already in your project. The wrappers
          tree-shake cleanly; only the code you import gets bundled.
        </p>
      </Section>

      <Section id="vue" k="composables & components" toc="Vue 3 — composables & components" title="Vue 3">
        <p>
          All v2 APIs ship as composables that return a <code>ref</code> you bind with <code>:ref</code>. There are also
          ready-made component wrappers if you prefer that style.
        </p>

        <h3 className="ba-h3">scrollAnimate — fade + slide on scroll</h3>
        <Code file="Hero.vue">{`<script setup>
import { useScrollAnimate } from 'svg-scroll-draw/vue';

const el = useScrollAnimate({
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0)'],
  },
  easing: 'ease-out',
  once:   true,
});
</script>

<template>
  <div :ref="el">
    This fades and slides in as it scrolls into view.
  </div>
</template>`}</Code>

        <h3 className="ba-h3">scrollText — split + stagger animate</h3>
        <Code file="Headline.vue">{`<script setup>
import { useScrollText } from 'svg-scroll-draw/vue';

const headline = useScrollText({
  split:   'words',
  stagger: 0.05,
  from:    { opacity: 0, y: 24 },
  once:    true,
});

const subline = useScrollText({
  split:   'chars',
  stagger: 0.015,
  from:    { opacity: 0 },
  once:    true,
});
</script>

<template>
  <h1 :ref="headline">Ship faster. Zero GSAP.</h1>
  <p  :ref="subline">Every character trickles in on scroll.</p>
</template>`}</Code>

        <h3 className="ba-h3">scrollCounter — animated numbers</h3>
        <Code file="Stats.vue">{`<script setup>
import { useScrollCounter } from 'svg-scroll-draw/vue';

const users = useScrollCounter({
  to:     50_000,
  format: n => Math.round(n).toLocaleString() + '+',
  easing: 'ease-out',
  once:   true,
});
</script>

<template>
  <!-- Renders a <span> that counts 0 → 50,000+ on scroll -->
  <span :ref="users" />
</template>`}</Code>

        <h3 className="ba-h3">Component wrappers</h3>
        <p>Prefer components over composables? All four v2 APIs have component wrappers too.</p>
        <Code file="Page.vue">{`<script setup>
import { ScrollAnimate, ScrollText, ScrollCounter } from 'svg-scroll-draw/vue';
</script>

<template>
  <!-- Wraps children in a <div> and animates -->
  <ScrollAnimate :options="{ props: { opacity: [0,1] }, easing: 'ease-out', once: true }">
    <MyCard />
  </ScrollAnimate>

  <!-- Renders a <p> tag by default (change with tag="h2") -->
  <ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">
    Animate on scroll.
  </ScrollText>

  <!-- Renders a <span> counter -->
  <ScrollCounter
    :to="1250000"
    :format="n => '$' + Math.round(n).toLocaleString()"
    easing="ease-out"
    :once="true"
  />
</template>`}</Code>

        <Callout k="nuxt">
          <strong>Nuxt users:</strong> import from <code>svg-scroll-draw/nuxt</code> instead — it re-exports everything
          and includes a plugin factory for global component registration.
        </Callout>
      </Section>

      <Section id="svelte" k="actions & helpers" toc="Svelte — actions & helpers" title="Svelte">
        <p>
          All v2 APIs are Svelte <code>use:</code> actions. The matching <code>create*</code> helpers give you access to
          the live instance for replay, pause, and seek.
        </p>

        <h3 className="ba-h3">scrollAnimate action</h3>
        <Code file="Hero.svelte">{`<script>
  import { scrollAnimate } from 'svg-scroll-draw/svelte';

  const opts = {
    props: {
      opacity:   [0, 1],
      transform: ['translateY(40px)', 'translateY(0)'],
    },
    easing: 'ease-out',
    once:   true,
  };
</script>

<div use:scrollAnimate={opts}>
  Fades and slides in on scroll.
</div>`}</Code>

        <h3 className="ba-h3">scrollTextAction — split text</h3>
        <Code file="Headline.svelte">{`<script>
  import { scrollTextAction } from 'svg-scroll-draw/svelte';
</script>

<h1 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>
  Ship faster. Zero GSAP.
</h1>

<p use:scrollTextAction={{ split: 'chars', stagger: 0.015, from: { opacity: 0 }, once: true }}>
  Every character trickles in on scroll.
</p>`}</Code>

        <h3 className="ba-h3">createScrollAnimate — with instance control</h3>
        <Code file="HeroWithReplay.svelte">{`<script>
  import { createScrollAnimate } from 'svg-scroll-draw/svelte';

  const { action, getInstance } = createScrollAnimate({
    props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
    easing: 'ease-out',
    once:   true,
  });
</script>

<div use:action>...</div>
<button on:click={() => getInstance()?.replay()}>↺ Replay</button>`}</Code>

        <p>
          The same <code>create*</code> pattern is available for all v2 actions: <code>createScrollCounter</code>,{' '}
          <code>createScrollVideo</code>, <code>createScrollText</code>.
        </p>
      </Section>

      <Section id="solid" k="hooks" toc="Solid.js — hooks" title="Solid.js">
        <p>
          All v2 APIs are SolidJS hooks that return a ref setter. The <code>create*</code> variants return{' '}
          <code>{'{ ref, getInstance }'}</code> for imperative control.
        </p>

        <h3 className="ba-h3">useScrollAnimate</h3>
        <Code file="Hero.tsx">{`import { useScrollAnimate } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollAnimate({
    props: {
      opacity:   [0, 1],
      transform: ['translateY(40px)', 'translateY(0)'],
    },
    easing: 'ease-out',
    once:   true,
  });

  return <div ref={ref}>Fades and slides in on scroll.</div>;
}`}</Code>

        <h3 className="ba-h3">useScrollText</h3>
        <Code file="Headline.tsx">{`import { useScrollText } from 'svg-scroll-draw/solid';

function Headline() {
  const headRef = useScrollText({
    split:   'words',
    stagger: 0.05,
    from:    { opacity: 0, y: 24 },
    once:    true,
  });

  return <h1 ref={headRef}>Ship faster. Zero GSAP.</h1>;
}`}</Code>

        <h3 className="ba-h3">createScrollAnimate — with instance access</h3>
        <Code file="HeroWithReplay.tsx">{`import { createScrollAnimate } from 'svg-scroll-draw/solid';

function HeroSection() {
  const { ref, getInstance } = createScrollAnimate({
    props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
    easing: 'ease-out',
    once:   true,
  });

  return (
    <>
      <div ref={ref}>...</div>
      <button onClick={() => getInstance()?.replay()}>↺ Replay</button>
    </>
  );
}`}</Code>
      </Section>

      <Section id="patterns" k="real-world" title="Real-world patterns">
        <h3 className="ba-h3">Staggered card grid (Vue)</h3>
        <p>
          Use <code>v-for</code> with independent composable calls — one instance per card, each with a trigger offset
          for a natural cascade:
        </p>
        <Code file="FeatureGrid.vue">{`<script setup>
import { useScrollAnimate } from 'svg-scroll-draw/vue';
import { ref as vueRef, onMounted } from 'vue';
import { scrollAnimate } from 'svg-scroll-draw';

const cardRefs = vueRef([]);

onMounted(() => {
  cardRefs.value.forEach((el, i) => {
    scrollAnimate(el, {
      props: {
        opacity:   [0, 1],
        transform: ['translateY(32px)', 'translateY(0)'],
      },
      trigger: {
        start: \`top \${90 - i * 4}%\`,
        end:   \`top \${55 - i * 4}%\`,
      },
      easing: 'ease-out',
      once:   true,
    });
  });
});
</script>

<template>
  <div class="grid">
    <div v-for="(card, i) in cards" :key="i" :ref="el => cardRefs[i] = el">
      {{ card.title }}
    </div>
  </div>
</template>`}</Code>

        <h3 className="ba-h3">Marketing headline (Svelte)</h3>
        <Code file="HeroHeadline.svelte">{`<script>
  import { scrollTextAction } from 'svg-scroll-draw/svelte';
  import { scrollAnimate }    from 'svg-scroll-draw/svelte';

  const eyebrowOpts = {
    props: { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
    trigger: { start: 'top 90%', end: 'top 68%' },
    easing: 'ease-out', once: true,
  };
</script>

<div use:scrollAnimate={eyebrowOpts}>
  <span class="badge">New in v2</span>
</div>

<h1 use:scrollTextAction={{ split: 'words', stagger: 0.07, from: { opacity: 0, y: 36 }, once: true }}>
  Scroll animations without GSAP.
</h1>

<p use:scrollTextAction={{ split: 'chars', stagger: 0.012, from: { opacity: 0 }, once: true }}>
  Vue · Svelte · Solid · React · ~${Math.round(SELF.gzipKb)} KB
</p>`}</Code>
      </Section>

      <Section id="nuxt-astro" k="meta-frameworks" toc="Nuxt & Astro" title="Nuxt & Astro">
        <h3 className="ba-h3">Nuxt 3</h3>
        <p>
          Import from <code>svg-scroll-draw/nuxt</code> — it re-exports all v2 composables and components, and provides
          a plugin for global registration:
        </p>
        <Code file="plugins/svg-scroll-draw.ts">{`import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  // Registers <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>,
  // <ScrollVideo>, <ScrollText> globally — no per-component imports.
  nuxtApp.vueApp.use(createScrollDrawPlugin());
});`}</Code>

        <h3 className="ba-h3">Astro</h3>
        <p>
          Use data-attributes for zero-import server components. <code>initScrollAnimate</code> and{' '}
          <code>initScrollText</code> are new in v2.3:
        </p>
        <Code file="src/pages/index.astro">{`---
// No imports needed server-side
---

<h1
  data-scroll-text
  data-scroll-text-options='{"split":"words","stagger":0.05,"once":true}'
>
  Animate on scroll.
</h1>

<div
  data-scroll-animate
  data-scroll-animate-options='{"props":{"opacity":[0,1],"transform":["translateY(40px)","translateY(0)"]},"easing":"ease-out","once":true}'
>
  Fades and slides in.
</div>

<script>
  import { initAll } from 'svg-scroll-draw/astro';
  // Initialises scrollDraw, scrollAnimate, scrollText, scrollCounter in one call
  initAll();
</script>`}</Code>
      </Section>

      <Section id="summary" k="at a glance" title="Summary">
        <Table
          first="plain"
          head={['Framework', 'Pattern', 'Import']}
          rows={SUMMARY.map(([fw, pat, imp]) => [fw, <code key="p">{pat}</code>, <code key="i">{imp}</code>])}
        />
      </Section>

      <Closing
        title="One install, every framework"
        lede="Each wrapper is a subpath of the same package — import the one your app uses"
        links={[
          { href: '/docs#v2-vue', label: 'Full API docs →' },
          { href: '/examples', label: 'See live examples →' },
        ]}
      />
    </BlogArticle>
  );
}
