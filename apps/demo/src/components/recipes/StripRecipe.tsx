'use client';

import type { RecipeFiles as Files } from '@/recipes/read';
import { RecipeFiles, RecipePitfalls, RecipeSteps } from './Recipe';
import { STRIP_RECIPE } from './strip-recipe';

/* The case-study strip's recipe in three parts, for the post's own sections. */

/** The steps, as a numbered section of the post. */
export function StripSteps({ fig }: { fig: number }) {
  return (
    <div className="rc rc-in-post">
      <RecipeSteps recipe={STRIP_RECIPE} fig={fig} />
    </div>
  );
}

/** The complete files with the strip running below them. `files` is read from disk by the page. */
export function StripFiles({ files, fig }: { files: Files; fig: number }) {
  return (
    <div className="rc rc-in-post">
      <RecipeFiles recipe={STRIP_RECIPE} files={files} fig={fig} />
    </div>
  );
}

export function StripPitfalls() {
  return (
    <div className="rc rc-in-post">
      <RecipePitfalls recipe={STRIP_RECIPE} />
    </div>
  );
}
