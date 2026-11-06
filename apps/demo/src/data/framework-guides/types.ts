/**
 * The part of a framework landing page that belongs to that framework alone.
 *
 * The six landings (Vue, Nuxt, Svelte, Solid, Angular, Astro) were rendered
 * from one template, and measured with word 5-grams, 40–50% of each page's text
 * also appeared on another of the six, about 30% on all six. These sections are
 * written per framework, from what its wrapper in
 * packages/svg-scroll-draw/src/<framework>/ actually does, so no two pages share
 * them.
 */

export type FrameworkGuideSection = {
  /** Anchor id, unique on the page, e.g. `fw-vue-getters`. */
  id: string;
  /** Mono label in the section's title strip, e.g. `composables`. */
  k: string;
  /** The section heading. */
  title: string;
  /** Paragraphs of plain text. `backticks` render as inline code. */
  body: string[];
  /** One listing, when the section needs code. */
  sample?: { file: string; code: string };
};

export type FrameworkGuide = {
  /** The landing's slug in data/framework-landings.ts, e.g. `vue-scroll-animation`. */
  slug: string;
  sections: FrameworkGuideSection[];
};
