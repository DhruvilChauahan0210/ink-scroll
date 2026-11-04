/**
 * Reads a recipe's complete files at build time, so the page shows exactly the
 * files that `scripts/test-recipes.mjs` runs in a browser — never a copy that
 * can drift. Server-only: the example pages are generated statically
 * (`dynamicParams = false`), so this runs during `next build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SELF } from '@/data/competitors';

export type RecipeFile = { name: string; code: string };
export type RecipeFiles = { react: RecipeFile[]; html: RecipeFile };

/** Which files make up each recipe, in the order the page shows them. */
const FILES: Record<string, { react: string[]; html: string }> = {
  'logo-reveal': { react: ['LogoReveal.tsx', 'logo-reveal.css'], html: 'index.html' },
};

export function readRecipeFiles(slug: string): RecipeFiles | null {
  const spec = FILES[slug];
  if (!spec) return null;
  const dir = join(process.cwd(), 'src', 'recipes', slug);
  const read = (name: string): RecipeFile => ({
    name,
    // The script tag pins a version; always show the current one.
    code: readFileSync(join(dir, name), 'utf8').replace(/svg-scroll-draw@\d+\.\d+\.\d+/g, `svg-scroll-draw@${SELF.version}`),
  });
  return { react: spec.react.map(read), html: read(spec.html) };
}

export const RECIPE_SLUGS = Object.keys(FILES);
