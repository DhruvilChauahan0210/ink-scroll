# Starters

Tiny projects that install `svg-scroll-draw` from npm. Open any of them in the browser with no install:

- Vanilla JS: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vanilla
- React: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/react
- Vue: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vue
- Nuxt (with the module, no imports): https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/nuxt
- SvelteKit: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/sveltekit
- Solid: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/solid

The Vue, Nuxt, SvelteKit and Solid starters each show a line drawing, words arriving on scroll, a
fade-in and a counter. Nuxt and SvelteKit render on the server, so the counter's number is in the
page source before any script runs.

Switching from another library? Each of these is a page written for the original, with only the import
changed, so you can see the drop-in work before touching your project:

- AOS: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/aos
- ScrollReveal: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/scrollreveal
- vivus: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vivus

`npx svg-scroll-draw migrate` makes the same change in your own project.

Or run locally: `cd examples/vue && npm install && npm run dev` (any folder).

These folders are not part of the npm workspace, so they test the published package, not `src/`.
