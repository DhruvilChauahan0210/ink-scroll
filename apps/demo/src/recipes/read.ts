/**
 * Reads a recipe's complete files at build time, so the page shows exactly the
 * files that `scripts/test-recipes.mjs` runs in a browser — never a copy that
 * can drift. Server-only: the example pages and blog posts are generated
 * statically, so this runs during `next build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SELF } from '@/data/competitors';
import type { PostRecipeSlug, RecipeSlug } from './slugs';

export type RecipeFile = { name: string; code: string };
export type RecipeFiles = { react: RecipeFile[]; html: RecipeFile };

/** Which files make up each recipe, in the order the page shows them. */
const FILES: Record<RecipeSlug | PostRecipeSlug, { react: string[]; html: string }> = {
  'logo-reveal': { react: ['LogoReveal.tsx', 'logo-reveal.css'], html: 'index.html' },
  'scroll-pin': { react: ['FeatureTour.tsx', 'feature-tour.css'], html: 'index.html' },
  'scroll-counter': { react: ['StatRow.tsx', 'stat-row.css'], html: 'index.html' },
  'scroll-video': { react: ['FilmScrub.tsx', 'film-scrub.css'], html: 'index.html' },
  'horizontal-scroll-sections': { react: ['CaseStrip.tsx', 'case-strip.css'], html: 'index.html' },
};

const isRecipe = (slug: string): slug is keyof typeof FILES => Object.prototype.hasOwnProperty.call(FILES, slug);

export function readRecipeFiles(slug: string): RecipeFiles | null {
  if (!isRecipe(slug)) return null;
  const spec = FILES[slug];
  const dir = join(process.cwd(), 'src', 'recipes', slug);
  const read = (name: string): RecipeFile => ({
    name,
    // The script tag pins a version; always show the current one.
    code: readFileSync(join(dir, name), 'utf8').replace(/svg-scroll-draw@\d+\.\d+\.\d+/g, `svg-scroll-draw@${SELF.version}`),
  });
  return { react: spec.react.map(read), html: read(spec.html) };
}
