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
  base({ 'web-component/index': 'src/web-component/index.ts' }),
  {
    entry: { 'svg-scroll-draw': 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'SvgScrollDraw',
    outDir: 'dist/cdn',
    minify: true,
    clean: false,
  },
]);
