import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
      include: ['src/**'],
      exclude: [
        // Test files — excluded by default in most tools; explicit here to be safe
        'src/__tests__/**',
        // Framework wrappers that require Vue / custom-elements test environments
        'src/react/**',
        'src/vue/**',
        'src/nuxt/**',
        'src/web-component/**',
        // CDN bundle entry — thin re-export, no own logic
        'src/cdn.ts',
        // Type-only file — no runtime code to execute
        'src/core/types.ts',
      ],
    },
  },
});
