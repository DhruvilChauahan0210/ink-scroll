/**
 * The examples that have a full recipe. A plain list with no imports, so the
 * /examples catalogue can mark them without loading any recipe's code.
 * `read.ts` (the files) and `components/recipes/recipes.tsx` (the steps) are
 * typed by it, so a slug added here without both does not compile.
 */
export const RECIPE_SLUGS = ['logo-reveal', 'scroll-pin', 'scroll-counter', 'scroll-video'] as const;

export type RecipeSlug = (typeof RECIPE_SLUGS)[number];

export const hasRecipe = (id: string): id is RecipeSlug => (RECIPE_SLUGS as readonly string[]).includes(id);

/**
 * Blog posts that carry a recipe, for searches no example page targets. Their
 * files live in src/recipes/<slug>/ like the examples' and are tested the same
 * way; they are not counted on /examples.
 */
export const POST_RECIPE_SLUGS = ['horizontal-scroll-sections'] as const;

export type PostRecipeSlug = (typeof POST_RECIPE_SLUGS)[number];
