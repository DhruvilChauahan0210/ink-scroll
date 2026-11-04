/**
 * The examples that have a full recipe. A plain list with no imports, so the
 * /examples catalogue can mark them without loading any recipe's code.
 * `read.ts` (the files) and `components/recipes/recipes.tsx` (the steps) are
 * typed by it, so a slug added here without both does not compile.
 */
export const RECIPE_SLUGS = ['logo-reveal', 'scroll-pin'] as const;

export type RecipeSlug = (typeof RECIPE_SLUGS)[number];

export const hasRecipe = (id: string): id is RecipeSlug => (RECIPE_SLUGS as readonly string[]).includes(id);
