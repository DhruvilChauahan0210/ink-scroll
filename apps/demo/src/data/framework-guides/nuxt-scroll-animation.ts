import type { FrameworkGuide } from './types';

/**
 * Nuxt only. Written from packages/svg-scroll-draw/src/nuxt/module.ts (the
 * module), src/nuxt/index.ts (the plugin and the re-exports) and
 * src/vue/index.ts (the components), and checked against
 * src/__tests__/nuxtModule.test.ts, e2e/frameworks/nuxt.entry.js,
 * e2e/frameworks.spec.ts, src/__tests__/ssr.test.ts and scripts/nuxt-module-check.mjs
 * (a real Nuxt 4 and Nuxt 3 app built with the module, in CI).
 */
export const GUIDE: FrameworkGuide = {
  slug: 'nuxt-scroll-animation',
  sections: [
    {
      id: 'fw-nuxt-module',
      k: 'module',
      title: 'One line in nuxt.config',
      body: [
        'Since 2.27.0 `svg-scroll-draw/nuxt` is a Nuxt module. Add it to `modules` and Nuxt auto-imports six components (`<ScrollDraw>`, `<ScrollAnimate>`, `<ScrollCounter>`, `<ScrollVideo>`, `<ScrollFrames>`, `<ScrollText>`) and six composables (`useScrollDraw` to `useScrollText`), the way it auto-imports its own. Each points at `svg-scroll-draw/vue`, so they are the Vue wrappers, prop for prop.',
        'Its options go under `svgScrollDraw` in the config, or inline as `[\'svg-scroll-draw/nuxt\', { … }]`, which wins. `prefix` goes before every component name (`\'Ink\'` gives `<InkScrollDraw>`), and `components` or `composables` set to `false` leaves that half out.',
        'It is a plain function module that adds entries through two of Nuxt\'s hooks, `components:extend` and `imports:extend`, so the package still has no dependencies: not `nuxt`, not `@nuxt/kit`. CI builds a Nuxt 4 and a Nuxt 3 app with it on every push, checks the server HTML and scrolls it in Chromium.',
      ],
      sample: {
        file: 'nuxt.config.ts',
        code: `export default defineNuxtConfig({
  modules: ['svg-scroll-draw/nuxt'],
  // Optional; these are the defaults.
  svgScrollDraw: { prefix: '', components: true, composables: true },
});`,
      },
    },
    {
      id: 'fw-nuxt-plugin',
      k: 'plugin',
      title: 'Without the module: one plugin, six global components',
      body: [
        '`createScrollDrawPlugin()` returns a plain Vue plugin. Its `install` makes six `app.component()` calls, for `ScrollDraw`, `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollFrames` and `ScrollText`, and does nothing else: no directive, no `provide`, no composables. The browser suite installs it on a real Vue app and renders `<ScrollDraw>` and `<ScrollAnimate>` by name, with no local `components` option.',
        'The plugin file needs no `.client` suffix. Registering a component touches no browser API, and the no-DOM suite imports the Nuxt entry with `window` and `document` undefined. Keep the plugin universal: the server render has to resolve `<ScrollDraw>` as well, and Nuxt does not load a `.client` plugin there.',
        'The six take options in different ways. `<ScrollDraw>` declares every draw option as its own prop, and `<ScrollCounter>` declares `to`, `from`, `format`, `easing`, `trigger`, `once`, `decimals` and `onComplete`. `<ScrollAnimate>`, `<ScrollText>` and `<ScrollVideo>` take one `options` object. Beside it, `<ScrollText>` has `tag` (a `<p>` by default), and `<ScrollVideo>` has the required `src` plus `muted` and `playsInline`, both true unless you bind `false`. `<ScrollFrames>` declares each film option as its own prop, `frames` required, and renders a `<canvas role="img">` that wants an `aria-label`. A `split` written straight on `<ScrollText>` is not a prop, so Vue puts it on the element as an attribute.',
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
        '`<ScrollCounter>` renders its final number (`to`, through `decimals` or `format`), so the figure is in the server HTML for crawlers and for readers before the scripts load (2.26.1+; it was an empty `<span>` before). On mount the engine takes the text over and writes the value for the current scroll position, which is `from` (0 by default) until the trigger starts. With `useScrollCounter` on your own element, put the final value inside it yourself, as below. A reader who asks for reduced motion gets the final value straight away.',
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
      title: 'Importing by hand',
      body: [
        'Without the module, Nuxt\'s auto-imports do not know `useScrollDraw` or the components, because Nuxt scans your own `components/` and `composables/` directories, not packages. Import them at the top of `<script setup>`, from `svg-scroll-draw/nuxt` or `svg-scroll-draw/vue`.',
        'Mixing the two entry points costs nothing. In the ESM build `svg-scroll-draw/nuxt` and `svg-scroll-draw/vue` import their wrappers from one shared chunk, so a component copied from a Vue example that imports from `/vue` can sit beside one that imports from `/nuxt` without loading the wrappers or the engines twice. `createScrollDrawPlugin` and the module are the only runtime exports the Vue entry lacks.',
      ],
      sample: {
        file: 'components/Hero.vue',
        code: `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/nuxt';

const container = useScrollDraw({ easing: 'ease-out', speed: 1.2 });
</script>

<template>
  <div ref="container"><svg>…</svg></div>
</template>`,
      },
    },
  ],
};
