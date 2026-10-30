import type { Metadata } from 'next';

/**
 * Title rules for every page, in one place.
 *
 * The root layout appends BRAND_SUFFIX through its title template. Google
 * truncates titles at roughly 60 characters, so a page title that is already
 * long loses its keyword tail to " | svg-scroll-draw" — and a page whose own
 * title already named the brand used to render it twice.
 *
 * `seoTitle()` keeps the brand when the whole thing fits in MAX_TITLE and drops
 * it (via `absolute`) when it does not, so the searcher's words survive.
 * Never put "svg-scroll-draw" at the end of a page title — the template does it.
 */
export const BRAND = 'svg-scroll-draw';
export const BRAND_SUFFIX = ` | ${BRAND}`;
export const TITLE_TEMPLATE = `%s${BRAND_SUFFIX}`;
export const MAX_TITLE = 60;

export function seoTitle(title: string): NonNullable<Metadata['title']> {
  return title.length + BRAND_SUFFIX.length <= MAX_TITLE ? title : { absolute: title };
}
