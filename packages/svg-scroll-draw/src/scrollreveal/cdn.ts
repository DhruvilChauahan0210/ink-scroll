/*
 * Script-tag build: `window.ScrollReveal` is the function itself, as with
 * ScrollReveal's own UMD file, so `ScrollReveal().reveal('.box')` keeps working.
 * (An IIFE `globalName` would expose the module namespace object instead.)
 */
import ScrollReveal from './index';

(globalThis as unknown as { ScrollReveal: typeof ScrollReveal }).ScrollReveal = ScrollReveal;
