import { defineConfig } from 'tsup';

const base = (entry: Record<string, string>, external: string[] = []) =>
  ({
    format: ['esm', 'cjs'] as const,
    outExtension: ({ format }: { format: string }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
    dts: true,
    treeshake: true,
    minify: true,
    entry,
    external,
  });

export default defineConfig([
  { ...base({ index: 'src/index.ts' }), clean: true },
  base({ 'react/index':   'src/react/index.tsx'   }, ['react']),
  base({ 'vue/index':     'src/vue/index.ts'       }, ['vue']),
  base({ 'svelte/index':  'src/svelte/index.ts'    }),
  base({ 'solid/index':   'src/solid/index.ts'     }, ['solid-js']),
  base({ 'angular/index': 'src/angular/index.ts'   }),
  base({ 'astro/index':   'src/astro/index.ts'     }),
  base({ 'nuxt/index':    'src/nuxt/index.ts'      }, ['vue']),
  base({ 'group/index':        'src/group/index.ts'          }),
  base({ 'cinematic/index':   'src/cinematic/index.ts'      }),
  base({ 'timeline/index':    'src/timeline/index.ts'       }),
  base({ 'web-component/index': 'src/web-component/index.ts' }),
  base({ 'video/index':    'src/video/index.ts'    }),
  base({ 'text/index':     'src/text/index.ts'     }),
  base({ 'devtools/index': 'src/devtools/index.ts' }),
  base({ 'pin/index':     'src/pin/index.ts'       }),
  base({ 'snap/index':    'src/snap/index.ts'      }),
  base({ 'lenis/index':   'src/lenis/index.ts'     }),
  base({ 'reveal/index':    'src/reveal/index.ts'      }),
  base({ 'progress/index':  'src/progress/index.ts'   }),
  base({ 'horizontal/index': 'src/horizontal/index.ts' }),
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
