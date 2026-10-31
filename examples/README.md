# Starters

Tiny projects that install `svg-scroll-draw` from npm. Open any of them in the browser with no install:

- Vanilla JS: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vanilla
- React: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/react

Switching from another library? Each of these is a page written for the original, with only the import
changed, so you can see the drop-in work before touching your project:

- AOS: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/aos
- ScrollReveal: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/scrollreveal
- vivus: https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vivus

`npx svg-scroll-draw migrate` makes the same change in your own project.

Or run locally: `cd examples/vanilla && npm install && npm run dev`.

These folders are not part of the npm workspace, so they test the published package, not `src/`.
