/*
 * Every shared helper in one import, for the tests and nothing else.
 *
 * Library code imports from the file that defines a helper (`./easing`,
 * `./trigger`, …), never from here. The ESM build shares code between entries
 * through chunks, and esbuild assigns code to a chunk a whole source file at a
 * time, following every import: `svg-scroll-draw/pin` taking `clamp` through
 * this barrel would carry the easings, the trigger maths and the colour parser
 * along with it, which is what these used to be when they were one file.
 */
export * from './easing';
export * from './trigger';
export * from './trigger-frame';
export * from './math';
export * from './geometry';
export * from './color';
