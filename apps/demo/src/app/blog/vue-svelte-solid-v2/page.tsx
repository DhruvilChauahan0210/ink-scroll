import type { Metadata } from 'next';
import { RelatedResources } from '@/components/RelatedResources';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { CopyButton } from '@/components/CopyButton';

export const metadata: Metadata = {
  title: 'scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide',
  description:
    'Full guide to using svg-scroll-draw v2 APIs (scrollAnimate, scrollText, scrollCounter, scrollVideo) in Vue 3, Svelte, and Solid.js. Composables, actions, hooks, and component wrappers with code examples.',
  keywords: [
    'vue scroll animation',
    'vue 3 scroll animate',
    'useScrollAnimate vue',
    'svelte scroll animation',
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

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black my-5">
      <div className="bg-[#111] flex items-center justify-between px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#1c1c1c] text-[#e8e8e3] px-4 sm:px-6 py-4 text-[12px] sm:text-[13px] font-mono leading-[1.75] overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-creator-pink bg-creator-pink/5 px-5 py-4 rounded-r-xl my-5 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display font-extrabold text-[clamp(20px,3vw,28px)] tracking-[-0.03em] leading-tight mt-14 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-bold text-[clamp(16px,2vw,20px)] tracking-[-0.02em] mt-8 mb-3">
      {children}
    </h3>
  );
}

export default function BlogVueSvelteSolidV2() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/docs"      className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Docs</Link>
          <Link href="/examples"  className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Examples</Link>
          <Link href="/blog"      className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Blog</Link>
          <Link href="/changelog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium">Changelog</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono">v2.3.0</a>
          <a href={GH}  target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium">GitHub →</a>
        </div>
        <div className="flex lg:hidden items-center gap-2">
          <MobileMenu />
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-[#42b883]/20 text-[#1a7a50] border border-[#42b883]/30">Vue 3</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-[#ff3e00]/10 text-[#cc3200] border border-[#ff3e00]/20">Svelte</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-[#2C4F7C]/10 text-[#2C4F7C] border border-[#2C4F7C]/20">Solid.js</span>
            <span className="text-[10px] font-mono text-graphite-border">June 2026 · 9 min read</span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(28px,5vw,52px)] leading-[0.95] tracking-[-0.04em] mb-5">
            scrollAnimate in Vue 3,<br />Svelte, and Solid.js
          </h1>
          <p className="text-base sm:text-lg text-graphite-border leading-relaxed">
            svg-scroll-draw v2.3 ships first-class wrappers for all three frameworks. This guide covers every API — composables, actions, hooks, component wrappers — with copy-paste examples for real-world patterns.
          </p>
        </div>

        {/* TOC */}
        <nav className="rounded-2xl border border-subtle-ash bg-marketplace-gray px-5 py-4 mb-10 text-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-graphite-border mb-3">In this post</p>
          <ol className="space-y-1.5 text-[13px]">
            <li><a href="#install" className="hover:text-pitch-black transition-colors text-graphite-border">1. Install</a></li>
            <li><a href="#vue" className="hover:text-pitch-black transition-colors text-graphite-border">2. Vue 3 — composables &amp; components</a></li>
            <li><a href="#svelte" className="hover:text-pitch-black transition-colors text-graphite-border">3. Svelte — actions &amp; helpers</a></li>
            <li><a href="#solid" className="hover:text-pitch-black transition-colors text-graphite-border">4. Solid.js — hooks</a></li>
            <li><a href="#patterns" className="hover:text-pitch-black transition-colors text-graphite-border">5. Real-world patterns</a></li>
            <li><a href="#nuxt-astro" className="hover:text-pitch-black transition-colors text-graphite-border">6. Nuxt &amp; Astro</a></li>
          </ol>
        </nav>

        {/* 1. Install */}
        <H2 id="install">1. Install</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          One package, all frameworks. Install once and import from the framework-specific subpath.
        </p>
        <CodeBlock file="terminal">
{`npm install svg-scroll-draw
# or
pnpm add svg-scroll-draw`}
        </CodeBlock>
        <p className="text-[14px] text-graphite-border leading-relaxed">
          Vue, Svelte, and Solid are all peer dependencies — they&apos;re already in your project.
          The wrappers tree-shake cleanly; only the code you import gets bundled.
        </p>

        {/* 2. Vue */}
        <H2 id="vue">2. Vue 3</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          All v2 APIs ship as composables that return a <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">ref</code> you bind with <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">:ref</code>. There are also ready-made component wrappers if you prefer that style.
        </p>

        <H3>scrollAnimate — fade + slide on scroll</H3>
        <CodeBlock file="Hero.vue">
{`<script setup>
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
</template>`}
        </CodeBlock>

        <H3>scrollText — split + stagger animate</H3>
        <CodeBlock file="Headline.vue">
{`<script setup>
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
</template>`}
        </CodeBlock>

        <H3>scrollCounter — animated numbers</H3>
        <CodeBlock file="Stats.vue">
{`<script setup>
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
  <span :ref="users" />`}
        </CodeBlock>

        <H3>Component wrappers</H3>
        <p className="text-[14px] text-graphite-border leading-relaxed mb-3">
          Prefer components over composables? All four v2 APIs have component wrappers too.
        </p>
        <CodeBlock file="Page.vue">
{`<script setup>
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
</template>`}
        </CodeBlock>

        <Callout>
          <strong>Nuxt users:</strong> import from <code className="font-mono text-[0.87em]">svg-scroll-draw/nuxt</code> instead — it re-exports everything and includes a plugin factory for global component registration.
        </Callout>

        {/* 3. Svelte */}
        <H2 id="svelte">3. Svelte</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          All v2 APIs are Svelte <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">use:</code> actions. The matching <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">create*</code> helpers give you access to the live instance for replay, pause, and seek.
        </p>

        <H3>scrollAnimate action</H3>
        <CodeBlock file="Hero.svelte">
{`<script>
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
</div>`}
        </CodeBlock>

        <H3>scrollTextAction — split text</H3>
        <CodeBlock file="Headline.svelte">
{`<script>
  import { scrollTextAction } from 'svg-scroll-draw/svelte';
</script>

<h1 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>
  Ship faster. Zero GSAP.
</h1>

<p use:scrollTextAction={{ split: 'chars', stagger: 0.015, from: { opacity: 0 }, once: true }}>
  Every character trickles in on scroll.
</p>`}
        </CodeBlock>

        <H3>createScrollAnimate — with instance control</H3>
        <CodeBlock file="HeroWithReplay.svelte">
{`<script>
  import { createScrollAnimate } from 'svg-scroll-draw/svelte';

  const { action, getInstance } = createScrollAnimate({
    props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
    easing: 'ease-out',
    once:   true,
  });
</script>

<div use:action>...</div>
<button on:click={() => getInstance()?.replay()}>↺ Replay</button>`}
        </CodeBlock>

        <p className="text-[14px] text-graphite-border leading-relaxed">
          The same <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">create*</code> pattern is available for all v2 actions:
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md ml-1">createScrollCounter</code>,
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md ml-1">createScrollVideo</code>,
          <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md ml-1">createScrollText</code>.
        </p>

        {/* 4. Solid */}
        <H2 id="solid">4. Solid.js</H2>
        <p className="text-[15px] text-graphite-border leading-relaxed mb-4">
          All v2 APIs are SolidJS hooks that return a ref setter. The <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">create*</code> variants return <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">{'{ ref, getInstance }'}</code> for imperative control.
        </p>

        <H3>useScrollAnimate</H3>
        <CodeBlock file="Hero.tsx">
{`import { useScrollAnimate } from 'svg-scroll-draw/solid';

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
}`}
        </CodeBlock>

        <H3>useScrollText</H3>
        <CodeBlock file="Headline.tsx">
{`import { useScrollText } from 'svg-scroll-draw/solid';

function Headline() {
  const headRef = useScrollText({
    split:   'words',
    stagger: 0.05,
    from:    { opacity: 0, y: 24 },
    once:    true,
  });

  return <h1 ref={headRef}>Ship faster. Zero GSAP.</h1>;
}`}
        </CodeBlock>

        <H3>createScrollAnimate — with instance access</H3>
        <CodeBlock file="HeroWithReplay.tsx">
{`import { createScrollAnimate } from 'svg-scroll-draw/solid';

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
}`}
        </CodeBlock>

        {/* 5. Real-world patterns */}
        <H2 id="patterns">5. Real-world patterns</H2>

        <H3>Staggered card grid (Vue)</H3>
        <p className="text-[14px] text-graphite-border leading-relaxed mb-3">
          Use <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">v-for</code> with independent composable calls — one instance per card, each with a trigger offset for a natural cascade:
        </p>
        <CodeBlock file="FeatureGrid.vue">
{`<script setup>
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
</template>`}
        </CodeBlock>

        <H3>Marketing headline (Svelte)</H3>
        <CodeBlock file="HeroHeadline.svelte">
{`<script>
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
  Vue · Svelte · Solid · React · ~10 KB
</p>`}
        </CodeBlock>

        {/* 6. Nuxt and Astro */}
        <H2 id="nuxt-astro">6. Nuxt &amp; Astro</H2>

        <H3>Nuxt 3</H3>
        <p className="text-[14px] text-graphite-border leading-relaxed mb-3">
          Import from <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">svg-scroll-draw/nuxt</code> — it re-exports all v2 composables and components, and provides a plugin for global registration:
        </p>
        <CodeBlock file="plugins/svg-scroll-draw.ts">
{`import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  // Registers <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>,
  // <ScrollVideo>, <ScrollText> globally — no per-component imports.
  nuxtApp.vueApp.use(createScrollDrawPlugin());
});`}
        </CodeBlock>

        <H3>Astro</H3>
        <p className="text-[14px] text-graphite-border leading-relaxed mb-3">
          Use data-attributes for zero-import server components. <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">initScrollAnimate</code> and <code className="font-mono text-[0.87em] bg-marketplace-gray px-1.5 py-0.5 rounded-md">initScrollText</code> are new in v2.3:
        </p>
        <CodeBlock file="src/pages/index.astro">
{`---
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
</script>`}
        </CodeBlock>

        {/* Summary */}
        <div className="mt-14 pt-8 border-t border-subtle-ash">
          <h2 className="font-display font-extrabold text-2xl tracking-tight mb-4">Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-pitch-black text-light-linen">
                  <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Framework</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Pattern</th>
                  <th className="text-left px-4 py-2.5 font-mono text-[11px] font-medium">Import</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Vue 3', 'useScrollAnimate(options) → ref', 'svg-scroll-draw/vue'],
                  ['Vue 3', '<ScrollAnimate :options="...">', 'svg-scroll-draw/vue'],
                  ['Svelte', 'use:scrollAnimate={opts}', 'svg-scroll-draw/svelte'],
                  ['Svelte', 'createScrollAnimate → { action, getInstance }', 'svg-scroll-draw/svelte'],
                  ['Solid',  'useScrollAnimate(options) → ref setter', 'svg-scroll-draw/solid'],
                  ['Solid',  'createScrollAnimate → { ref, getInstance }', 'svg-scroll-draw/solid'],
                  ['Nuxt',   'Same as Vue + plugin factory', 'svg-scroll-draw/nuxt'],
                  ['Astro',  'data-scroll-animate + initScrollAnimate()', 'svg-scroll-draw/astro'],
                ].map(([fw, pat, imp]) => (
                  <tr key={pat} className="border-b border-subtle-ash">
                    <td className="px-4 py-2.5 font-semibold text-pitch-black">{fw}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-graphite-border">{pat}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-graphite-border">{imp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/docs#v2-vue" className="text-sm px-5 py-2.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium shadow-[2px_2px_0px_#000]">
            Full API docs →
          </Link>
          <Link href="/examples" className="text-sm px-5 py-2.5 rounded-full border-2 border-pitch-black hover:bg-pitch-black hover:text-light-linen transition-colors font-medium">
            See live examples →
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-subtle-ash flex flex-wrap items-center justify-between gap-4">
          <Link href="/blog" className="text-[13px] text-graphite-border hover:text-pitch-black transition-colors">← Back to blog</Link>
          <span className="text-[11px] font-mono text-graphite-border">svg-scroll-draw · MIT · ~10 KB</span>
        </div>

      </article>
      <RelatedResources post="vue-svelte-solid-v2" />

    </div>
    </>
  );
}
