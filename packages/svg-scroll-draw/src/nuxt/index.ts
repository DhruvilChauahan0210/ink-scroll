/**
 * Nuxt 3 integration for svg-scroll-draw.
 *
 * Re-exports all Vue composables and components (v1 + v2) for direct use,
 * plus a plugin factory for global auto-registration.
 *
 * ## Option A — Import per component (recommended)
 * ```ts
 * import { useScrollDraw, ScrollDraw } from 'svg-scroll-draw/nuxt';
 * import { useScrollAnimate, ScrollAnimate } from 'svg-scroll-draw/nuxt';
 * import { useScrollText, useScrollCounter } from 'svg-scroll-draw/nuxt';
 * ```
 *
 * ## Option B — Global auto-registration via Nuxt plugin
 * Create `plugins/svg-scroll-draw.ts` in your Nuxt project:
 * ```ts
 * import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';
 * export default defineNuxtPlugin((nuxtApp) => {
 *   nuxtApp.vueApp.use(createScrollDrawPlugin());
 * });
 * ```
 *
 * Then use <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>, etc. globally.
 */

// ── v1 re-exports ─────────────────────────────────────────────────────────────

export { useScrollDraw, ScrollDraw } from '../vue';
export type { ScrollDrawOptions } from '../core/types';

// ── v2 re-exports ─────────────────────────────────────────────────────────────

export {
  useScrollAnimate,
  ScrollAnimate,
  useScrollCounter,
  ScrollCounter,
  useScrollVideo,
  ScrollVideo,
  useScrollText,
  ScrollText,
} from '../vue';

export type {
  ScrollAnimateOptions,
  ScrollCounterOptions,
  ScrollVideoOptions,
  ScrollTextOptions,
} from '../vue';

// ── Plugin ────────────────────────────────────────────────────────────────────

import type { App } from 'vue';
import { ScrollDraw, ScrollAnimate, ScrollCounter, ScrollVideo, ScrollText } from '../vue';

/**
 * Vue plugin that globally registers all svg-scroll-draw components.
 * Pass to nuxtApp.vueApp.use() inside a Nuxt plugin.
 *
 * Registers: <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>, <ScrollVideo>, <ScrollText>
 */
export function createScrollDrawPlugin() {
  return {
    install(app: App) {
      app.component('ScrollDraw',    ScrollDraw);
      app.component('ScrollAnimate', ScrollAnimate);
      app.component('ScrollCounter', ScrollCounter);
      app.component('ScrollVideo',   ScrollVideo);
      app.component('ScrollText',    ScrollText);
    },
  };
}
