/**
 * Server-safe list of every example id on /examples.
 *
 * components/ExamplesPage.tsx is a 'use client' module, so importing EXAMPLES
 * into a server component yields a client-reference proxy rather than the array
 * — `EXAMPLES.length` silently reads 0, which is exactly how the ItemList schema
 * ended up claiming zero items. Server code reads this file instead.
 *
 * Kept in sync by `npm run check:examples`, which parses the ids out of
 * ExamplesPage.tsx and fails the build on any drift.
 */
export const EXAMPLE_IDS = [
  'logo-reveal',
  'line-chart',
  'signature',
  'flowchart',
  'map-route',
  'network',
  'astro',
  'timeline-api',
  'group-api',
  'vue',
  'svelte',
  'solid',
  'presets',
  'sequence-api',
  'scroll-animate',
  'scroll-counter',
  'scroll-video',
  'scroll-text-lines',
  'scroll-animate-group',
  'scroll-text',
  'scroll-reveal',
  'scroll-pin',
  'scroll-snap',
] as const;

export const EXAMPLE_COUNT = EXAMPLE_IDS.length;
