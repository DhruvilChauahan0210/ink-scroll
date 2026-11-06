import type { FrameworkGuide } from './types';

/**
 * Written against packages/svg-scroll-draw/src/astro/index.ts and what
 * e2e/fixtures/fw-astro.html, e2e/frameworks.spec.ts and
 * src/__tests__/ssr.test.ts prove. If the wrapper changes, check these first.
 */
export const GUIDE: FrameworkGuide = {
  slug: 'astro-scroll-animation',
  sections: [
    {
      id: 'fw-astro-view-transitions',
      k: 'astro:page-load',
      title: 'Init on astro:page-load with View Transitions',
      body: [
        'Astro bundles a component\'s `<script>` and runs it once per full page load. With `<ClientRouter />` in the layout (`<ViewTransitions />` before Astro 5), a link click swaps the page without reloading it, so an init at the top of a script covers the page it first runs on and none after it. Without the router, the top-level call in the quick start is all you need.',
        'With the router, run `initAll()` from an `astro:page-load` listener, which fires on the first load and after every navigation. The engines on the outgoing page are not torn down when it is swapped out. Until `destroy()` runs, each stays in the library\'s instance registry, which keeps the swapped-out nodes in memory, and one running in JavaScript rather than native CSS keeps its window resize listeners too. Keep what `initAll()` returned and destroy it on `astro:before-swap`.',
        'A second init on the same element is safe. Each element keeps one engine per kind, so when the quick start\'s `initScrollDraw()` and the layout listener both reach an element on the first load, the second call keeps the engine the first one started. Before 2.19.0 it put a second engine on the element.',
      ],
      sample: {
        file: 'src/layouts/Layout.astro',
        code: `---
import { ClientRouter } from 'astro:transitions';
---
<html lang="en">
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
    <script>
      import { initAll, type ScrollDrawInstance } from 'svg-scroll-draw/astro';

      let running: ScrollDrawInstance[] = [];

      document.addEventListener('astro:page-load', () => {
        running = Object.values(initAll()).flat();
      });

      document.addEventListener('astro:before-swap', () => {
        running.forEach((i) => i.destroy());
        running = [];
      });
    </script>
  </body>
</html>`,
      },
    },
    {
      id: 'fw-astro-live-options',
      k: 'MutationObserver',
      title: 'Edit the attribute to change options',
      body: [
        'The init functions watch each element\'s options attribute with a MutationObserver. Set a new value on `data-scroll-draw-options` (or the animate, counter or text attribute) and that element\'s engine is destroyed and rebuilt from the new JSON, while other elements keep running. The instances init returned follow the rebuild, so `pause()`, `seek()` and `destroy()` reach the current engine without a second init.',
        'The check compares the attribute text, not the parsed options. The same string written back keeps the engine. The same options with the keys in another order, or with different spacing, rebuild it. Writing `JSON.stringify` of an object with a fixed shape keeps the text stable.',
        'Text that is not valid JSON does not throw: the element is rebuilt as if the attribute were empty. After `destroy()`, edits to the attribute are ignored until an init runs again.',
        // live() calls watcher.observe(el, …) once per kind, and a second
        // observe() on the same element replaces the first one's attributeFilter
        // (DOM spec; checked in jsdom). Drop this paragraph once the wrapper
        // watches every kind's attribute on an element.
        'Each element has one attribute watched. On an element that carries two kinds, say `data-scroll-animate` and `data-scroll-counter`, it is the attribute of the kind whose init ran last (`initAll()` runs draw, animate, counter, then text), and an edit to the other is not seen until its init runs again. Give a kind whose options change an element of its own.',
      ],
      sample: {
        file: 'src/components/Signature.astro',
        code: `<div id="signature" data-scroll-draw data-scroll-draw-options='{"speed":1}'>
  <svg viewBox="0 0 200 100">
    <path d="M10 60 C 60 10, 140 110, 190 40" stroke="currentColor" fill="none" />
  </svg>
</div>
<button id="faster" type="button">Draw faster</button>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';

  initScrollDraw();

  document.getElementById('faster')?.addEventListener('click', () => {
    const el = document.getElementById('signature');
    // The observer sees the edit and rebuilds this element's engine only.
    if (el) el.dataset.scrollDrawOptions = JSON.stringify({ speed: 2 });
  });
</script>`,
      },
    },
    {
      id: 'fw-astro-frontmatter',
      k: 'frontmatter',
      title: 'Options in frontmatter, functions in a script',
      body: [
        'Frontmatter runs on the server, so it can build options but cannot start engines. An init called there has no document to scan: it returns an empty array (`initAll()` an object of four empty arrays) and nothing animates, with no error to point at the cause. Build the object in frontmatter and write it into the attribute with `JSON.stringify`. Astro escapes the quotes in an attribute expression, so values from `Astro.props` or a content collection need no hand-quoting.',
        '`JSON.stringify` leaves out functions without a word, so `format`, a custom easing function and callbacks such as `onComplete` never reach the browser. Named easings such as `"spring"` are strings and do. On a counter, `"decimals"` sets fixed decimal places. A `format` that arrives as a string is removed and the counter falls back to `decimals`, or to whole numbers.',
        'When an element needs a function, start it from the script with the core API. `scrollCounter` from the main entry takes the same options as the attribute, and there `format` can be a function. Leave `decimals` out of that call: when both are set, `decimals` wins and `format` is never called.',
      ],
      sample: {
        file: 'src/pages/pricing.astro',
        code: `---
// Server side: build the options here, do not init here.
const stats = [
  { label: 'Teams', to: 4200 },
  { label: 'Uptime', to: 99.9, decimals: 1 },
];
---
{stats.map(({ label, ...options }) => (
  <p>
    <span data-scroll-counter data-scroll-counter-options={JSON.stringify(options)}>0</span>
    {label}
  </p>
))}

<p>Revenue <span id="revenue">$0</span></p>

<script>
  import { initScrollCounter } from 'svg-scroll-draw/astro';
  import { scrollCounter } from 'svg-scroll-draw';

  initScrollCounter();

  // format is a function, so it starts here rather than from the attribute.
  scrollCounter('#revenue', {
    to: 1250000,
    format: (n) => '$' + Math.round(n).toLocaleString('en-US'),
  });
</script>`,
      },
    },
  ],
};
