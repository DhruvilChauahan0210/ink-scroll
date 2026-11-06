import type { FrameworkGuide } from './types';
import { GUIDE as angular } from './angular-scroll-animation';
import { GUIDE as astro } from './astro-scroll-animation';
import { GUIDE as nuxt } from './nuxt-scroll-animation';
import { GUIDE as solid } from './solid-scroll-animation';
import { GUIDE as svelte } from './svelte-scroll-animation';
import { GUIDE as vue } from './vue-scroll-animation';

export type { FrameworkGuide, FrameworkGuideSection } from './types';

/** Each framework landing's own sections, by slug. */
export const GUIDES: Record<string, FrameworkGuide> = Object.fromEntries(
  [vue, nuxt, svelte, solid, angular, astro].map((g) => [g.slug, g]),
);
