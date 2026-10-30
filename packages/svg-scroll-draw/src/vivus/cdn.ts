/*
 * Script-tag build: `window.Vivus` is the class itself, as with vivus's own
 * file, so `new Vivus('my-svg', { duration: 200 })` keeps working.
 */
import Vivus from './index';

(globalThis as unknown as { Vivus: typeof Vivus }).Vivus = Vivus;
