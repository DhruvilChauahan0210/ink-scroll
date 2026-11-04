import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

/**
 * Every package entry, as `dist path → source`. One list feeds both module
 * formats, so an entry cannot exist in one and be missing from the other.
 */
const ENTRIES: Record<string, string> = {
  index:                      'src/index.ts',
  'react/index':              'src/react/index.tsx',
  'vue/index':                'src/vue/index.ts',
  'svelte/index':             'src/svelte/index.ts',
  'solid/index':              'src/solid/index.ts',
  'angular/index':            'src/angular/index.ts',
  'astro/index':              'src/astro/index.ts',
  'nuxt/index':               'src/nuxt/index.ts',
  'group/index':              'src/group/index.ts',
  'cinematic/index':          'src/cinematic/index.ts',
  'timeline/index':           'src/timeline/index.ts',
  'web-component/index':      'src/web-component/index.ts',
  'video/index':              'src/video/index.ts',
  'text/index':               'src/text/index.ts',
  'devtools/index':           'src/devtools/index.ts',
  'pin/index':                'src/pin/index.ts',
  'snap/index':               'src/snap/index.ts',
  'lenis/index':              'src/lenis/index.ts',
  'reveal/index':             'src/reveal/index.ts',
  'aos/index':                'src/aos/index.ts',
  'scrollreveal/index':       'src/scrollreveal/index.ts',
  'vivus/index':              'src/vivus/index.ts',
  'aos/react/index':          'src/aos/react.ts',
  'scrollreveal/react/index': 'src/scrollreveal/react.ts',
  'vivus/react/index':        'src/vivus/react.ts',
  'progress/index':           'src/progress/index.ts',
  'horizontal/index':         'src/horizontal/index.ts',
};

/*
 * The React entries: the components (`svg-scroll-draw/react`) and the drop-ins'
 * hooks. "use client" leads each built file so a Next.js App Router Server
 * Component can render <ScrollDraw> or <AOSInit /> without a wrapper of its own.
 *
 * It is written after the build rather than as a `banner`: a banner lands on
 * every output file, shared chunks included, and a chunk the plain
 * `svg-scroll-draw/aos` entry also imports must not turn that entry into a
 * client module. Tsup's Rollup pass strips the directive from source anyway
 * ("use client" ... was ignored).
 */
const USE_CLIENT = ['react/index', 'aos/react/index', 'scrollreveal/react/index', 'vivus/react/index'];

const addUseClient = (ext: '.mjs' | '.cjs') => async () => {
  for (const name of USE_CLIENT) {
    const file = `dist/${name}${ext}`;
    const code = readFileSync(file, 'utf8');
    if (!code.startsWith('"use client";')) writeFileSync(file, `"use client";\n${code}`);
  }
};

/*
 * package.json declares `./dist/web-component/*` as the one ESM path with side
 * effects, because importing it registers <scroll-draw>. That holds only while
 * `customElements.define` stays in the entry file. If another entry ever imports
 * the web component, esbuild moves its code into a shared chunk, a bundler that
 * trusts `sideEffects` drops `import 'svg-scroll-draw/web-component'`, and the
 * element silently never registers. Fail the build instead.
 */
const assertSideEffectsStayPut = () => {
  if (!readFileSync('dist/web-component/index.mjs', 'utf8').includes('customElements.define(')) {
    throw new Error(
      'customElements.define moved out of dist/web-component/index.mjs into a shared chunk; ' +
      'list that chunk under "sideEffects" in package.json or stop importing src/web-component elsewhere.',
    );
  }
};

const shared = {
  entry: ENTRIES,
  // Peer dependencies; tsup externalises them anyway, this just says so.
  external: ['react', 'vue', 'solid-js'],
  dts: true,
  treeshake: true,
  minify: true,
};

export default defineConfig([
  /*
   * ESM: every entry in one build with code splitting, so the engine and
   * whatever else two entries have in common is written once, to a shared chunk
   * (`dist/chunk-*.mjs`) that each of them imports. Built one entry per config,
   * an app importing `svg-scroll-draw` and `svg-scroll-draw/react` shipped the
   * engine twice — and two copies of its module state, so `AOS.refresh()` from
   * `svg-scroll-draw/aos` never reached the instance `useAOS` had started.
   *
   * scripts/size.mjs counts an entry as its own file plus every chunk it
   * imports, so the per-entry figures stay what a user actually ships.
   */
  {
    ...shared,
    format: ['esm'],
    splitting: true,
    outExtension: () => ({ js: '.mjs' }),
    clean: true,
    onSuccess: async () => {
      await addUseClient('.mjs')();
      assertSideEffectsStayPut();
    },
  },
  /*
   * CJS stays one self-contained file per entry. Esbuild splits ESM only; tsup's
   * CJS splitting is an experimental rewrite layered on top, and `require()`
   * callers are mostly Node and test runners, where bytes on the wire are moot.
   * The cost: under `require()` each entry still carries its own copy of any
   * module state, as every entry did before the ESM build was split.
   */
  {
    ...shared,
    format: ['cjs'],
    splitting: false,
    outExtension: () => ({ js: '.cjs' }),
    onSuccess: addUseClient('.cjs'),
  },
  /*
   * Two CDN builds from the same entry.
   *
   * Production is minified with the dev flag defined to `false`, so every
   * `if (IS_DEV)` body is dropped at build time rather than shipped and skipped.
   *
   * The dev build is the point of the pair. `IS_DEV` is derived from
   * `process.env.NODE_ENV`, and `process` does not exist in a browser without a
   * bundler — so a `<script src="…">` user got no warnings at all, ever, which is
   * how a zero-length trigger window could make an API silently inert. Left
   * unminified: someone reading a console warning is about to go and look at the
   * code that produced it.
   */
  {
    entry: { 'svg-scroll-draw': 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'SvgScrollDraw',
    outDir: 'dist/cdn',
    minify: true,
    clean: false,
    define: { __SVG_SCROLL_DRAW_DEV__: 'false' },
  },
  {
    entry: { 'svg-scroll-draw.dev': 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'SvgScrollDraw',
    outDir: 'dist/cdn',
    minify: false,
    clean: false,
    define: { __SVG_SCROLL_DRAW_DEV__: 'true' },
  },
  /*
   * The AOS drop-in as a script-tag build that defines `window.AOS`, so a page
   * using `<script src=".../aos.js">` + `AOS.init()` swaps one URL and drops
   * aos.css. Separate from the main CDN bundle: an AOS page needs none of the rest.
   */
  {
    entry: { aos: 'src/aos/index.ts' },
    format: ['iife'],
    globalName: 'AOS',
    outExtension: () => ({ js: '.global.js' }),
    outDir: 'dist/cdn',
    minify: true,
    clean: false,
    define: { __SVG_SCROLL_DRAW_DEV__: 'false' },
  },
  /* The ScrollReveal drop-in as a script-tag build: `window.ScrollReveal` is the function. */
  {
    entry: { scrollreveal: 'src/scrollreveal/cdn.ts' },
    format: ['iife'],
    outExtension: () => ({ js: '.global.js' }),
    outDir: 'dist/cdn',
    minify: true,
    clean: false,
    define: { __SVG_SCROLL_DRAW_DEV__: 'false' },
  },
  /* The vivus drop-in as a script-tag build: `window.Vivus` is the class. */
  {
    entry: { vivus: 'src/vivus/cdn.ts' },
    format: ['iife'],
    outExtension: () => ({ js: '.global.js' }),
    outDir: 'dist/cdn',
    minify: true,
    clean: false,
    define: { __SVG_SCROLL_DRAW_DEV__: 'false' },
  },
  {
    entry: { 'cli/init': 'src/cli/init.ts' },
    format: ['cjs'],
    outExtension: () => ({ js: '.js' }),
    banner: { js: '#!/usr/bin/env node' },
    dts: false,
    minify: false,
    clean: false,
    platform: 'node',
  },
]);
