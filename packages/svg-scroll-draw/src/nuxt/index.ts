/**
 * Nuxt 3 integration for svg-scroll-draw.
 *
 * Re-exports the Vue composable and component for direct use, plus a
 * plugin factory for global auto-registration.
 *
 * ## Option A — Import per component (recommended)
 * ```ts
 * import { useScrollDraw, ScrollDraw } from 'svg-scroll-draw/nuxt';
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
 * Then use <ScrollDraw> globally with no imports.
 */

export { useScrollDraw, ScrollDraw } from '../vue';
export type { ScrollDrawOptions } from '../core/types';

import type { App } from 'vue';
import { ScrollDraw } from '../vue';

/**
 * Vue plugin that globally registers the <ScrollDraw> component.
 * Pass to nuxtApp.vueApp.use() inside a Nuxt plugin.
 */
export function createScrollDrawPlugin() {
  return {
    install(app: App) {
      app.component('ScrollDraw', ScrollDraw);
    },
  };
}
