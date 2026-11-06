import type { FrameworkGuide } from './types';

/**
 * Nuxt only. Written from packages/svg-scroll-draw/src/nuxt/index.ts (the
 * plugin and the re-exports) and src/vue/index.ts (the components it
 * registers), and checked against e2e/frameworks/nuxt.entry.js,
 * e2e/frameworks.spec.ts and src/__tests__/ssr.test.ts.
 */
export const GUIDE: FrameworkGuide = {
  slug: 'nuxt-scroll-animation',
  sections: [
    {
      id: 'fw-nuxt-plugin',
      k: 'plugin',
      title: 'One plugin, five global components',
      body: [
        '`createScrollDrawPlugin()` returns a plain Vue plugin. Its `install` makes five `app.component()` calls, for `ScrollDraw`, `ScrollAnimate`, `ScrollCounter`, `ScrollVideo` and `ScrollText`, and does nothing else: no directive, no `provide`, no composables. The browser suite installs it on a real Vue app and renders `<ScrollDraw>` and `<ScrollAnimate>` by name, with no local `components` option.',
        'The plugin file needs no `.client` suffix. Registering a component touches no browser API, and the no-DOM suite imports the Nuxt entry with `window` and `document` undefined. Keep the plugin universal: the server render has to resolve `<ScrollDraw>` as well, and Nuxt does not load a `.client` plugin there.',
        'The five take options in different ways. `<ScrollDraw>` declares every draw option as its own prop, and `<ScrollCounter>` declares `to`, `from`, `format`, `easing`, `trigger`, `once`, `decimals` and `onComplete`. `<ScrollAnimate>`, `<ScrollText>` and `<ScrollVideo>` take one `options` object. Beside it, `<ScrollText>` has `tag` (a `<p>` by default), and `<ScrollVideo>` has the required `src` plus `muted` and `playsInline`, both true unless you bind `false`. A `split` written straight on `<ScrollText>` is not a prop, so Vue puts it on the element as an attribute.',
      ],
      sample: {
        file: 'pages/launch.vue',
        code: `<template>
  <main>
    <!-- No imports: the plugin registered these by name. The comment sits
         inside <main> because a Nuxt page needs one root element, and a
         comment beside it counts as a second. -->
    <ScrollText tag="h2" :options="{ split: 'words', stagger: 0.08 }">
      Ready when you scroll.
    </ScrollText>

    <ScrollAnimate :options="{ props: { opacity: [0, 1] }, once: true }">
      <img src="/launch.png" alt="" />
    </ScrollAnimate>

    <p>Rated <ScrollCounter :to="4.8" :decimals="1" /> out of 5</p>
  </main>
</template>`,
      },
    },
    {
      id: 'fw-nuxt-server-html',
      k: 'ssr',
      title: 'What the server sends',
      body: [
        'On the server each component renders its element and nothing more. So the HTML Nuxt sends is your content as written: `<ScrollDraw>` is a `<div>` around your SVG with every stroke fully drawn, `<ScrollText>` holds its sentence as plain text, and `<ScrollVideo>` is a `<video>` with `preload="auto"` already set. The dash styles that hide the strokes, and the split into spans with its `aria-label`, are written by the engine once `onMounted` runs in the browser, after hydration.',
        '`<ScrollCounter>` renders an empty `<span>`, so its number is not in the server HTML at all. When the figure has to be in the page source, for crawlers or for readers before the scripts load, bind `useScrollCounter` to your own element and put the final value inside it. On mount the engine replaces that text with the value for the current scroll position, which is `from` (0 by default) until the trigger starts. A reader who asks for reduced motion gets the final value straight away.',
      ],
      sample: {
        file: 'components/SignupCount.vue',
        code: `<script setup lang="ts">
import { useScrollCounter } from 'svg-scroll-draw/nuxt';

const grouped = new Intl.NumberFormat('en-US');
const signups = useScrollCounter({
  to: 48210,
  format: (n) => grouped.format(Math.round(n)),
});
</script>

<template>
  <!-- The server sends 48,210; the client counts up to it. -->
  <span ref="signups">48,210</span>
</template>`,
      },
    },
    {
      id: 'fw-nuxt-imports',
      k: 'imports',
      title: 'No module, no auto-imports',
      body: [
        'The package ships a plugin factory, not a Nuxt module. There is nothing to add to `modules` in `nuxt.config.ts`, and Nuxt\'s auto-imports do not know `useScrollDraw` or the other composables. Import them at the top of `<script setup>`. Components are the same: Nuxt scans your own `components/` directory by default, not packages, so without the plugin `<ScrollDraw>` needs an import too.',
        'Mixing the two entry points costs nothing. In the ESM build `svg-scroll-draw/nuxt` and `svg-scroll-draw/vue` import their wrappers from one shared chunk, so a component copied from a Vue example that imports from `/vue` can sit beside one that imports from `/nuxt` without loading the wrappers or the engines twice. `createScrollDrawPlugin` is the only runtime export the Vue entry lacks.',
        'To have the composables auto-imported anyway, list them as a preset in your Nuxt config.',
      ],
      sample: {
        file: 'nuxt.config.ts',
        code: `export default defineNuxtConfig({
  imports: {
    presets: [
      {
        from: 'svg-scroll-draw/nuxt',
        imports: [
          'useScrollDraw',
          'useScrollAnimate',
          'useScrollCounter',
          'useScrollVideo',
          'useScrollText',
        ],
      },
    ],
  },
});`,
      },
    },
  ],
};
