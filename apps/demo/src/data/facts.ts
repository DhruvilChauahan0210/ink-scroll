/**
 * Figures the site quotes outside `data/competitors.ts`: the homepage's
 * chapter 06 and the sign-off sheet that closes every page. check:claims reads
 * this comment, so it fails the build if they drift: 690 tests, 227 browser
 * tests per engine.
 */
export const UNIT_TESTS = 690;
export const BROWSER_TESTS = 227;
/** scrollReveal's named presets, in the order the library defines them
 * (packages/svg-scroll-draw/src/reveal/index.ts, REVEAL_PRESETS). check:claims
 * fails the build if this list and the library drift apart. */
export const REVEAL_PRESETS = ['fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight', 'scale', 'flip', 'flipX'] as const;
/** The main entry's CI budget (packages/svg-scroll-draw/scripts/size.mjs, '.'). */
export const BUDGET_KB = 11.0;
