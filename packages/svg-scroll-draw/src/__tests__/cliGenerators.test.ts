/**
 * Tests for the `npx svg-scroll-draw init` starter-file generators.
 *
 * These generate the very first code a new user sees, and nothing checked them
 * before — which is how two bugs survived: the Vue and Svelte templates emitted
 * JSX-style `strokeWidth`/`strokeLinecap` (invalid in HTML-parsed templates, so
 * silently dropped by the browser), and the CLI prompted for a CSS selector it
 * then discarded for four of the five targets.
 */
import { describe, it, expect } from 'vitest';
import {
  GENERATORS,
  FILE_NAMES,
  FRAMEWORKS,
  PRESETS,
  EASINGS,
  needsSelector,
  type GenerateOptions,
} from '../cli/generators';

const base: GenerateOptions = { selector: '#my-svg', easing: 'ease-out', preset: 'none' };

// Targets whose output is parsed as HTML, where camelCased SVG presentation
// attributes are invalid.
const HTML_TARGETS = ['vue', 'svelte'] as const;
// Targets compiled as JSX, where camelCase is correct.
const JSX_TARGETS = ['react', 'solid'] as const;

describe('CLI generators — registry', () => {
  it('exposes a generator and filename for every advertised framework', () => {
    expect(FRAMEWORKS).toEqual(['react', 'vue', 'svelte', 'solid', 'vanilla']);
    for (const fw of FRAMEWORKS) {
      expect(GENERATORS[fw], `missing generator: ${fw}`).toBeTypeOf('function');
      expect(FILE_NAMES[fw], `missing filename: ${fw}`).toBeTruthy();
    }
  });

  it('gives each framework an extension its toolchain understands', () => {
    expect(FILE_NAMES.react).toMatch(/\.tsx$/);
    expect(FILE_NAMES.solid).toMatch(/\.tsx$/);
    expect(FILE_NAMES.vue).toMatch(/\.vue$/);
    expect(FILE_NAMES.svelte).toMatch(/\.svelte$/);
    expect(FILE_NAMES.vanilla).toMatch(/\.js$/);
  });

  it('only prompts for a selector on the target that uses one', () => {
    expect(needsSelector('vanilla')).toBe(true);
    for (const fw of ['react', 'vue', 'svelte', 'solid']) {
      expect(needsSelector(fw), `${fw} should not prompt for a selector`).toBe(false);
    }
  });
});

describe('CLI generators — output validity', () => {
  it.each(FRAMEWORKS)('%s produces non-empty code importing the package', (fw) => {
    const code = GENERATORS[fw](base);
    expect(code.trim().length).toBeGreaterThan(0);
    expect(code).toContain('svg-scroll-draw');
  });

  // Regression: these were camelCase and therefore inert in HTML templates.
  it.each(HTML_TARGETS)('%s uses hyphenated SVG attributes, not camelCase', (fw) => {
    const code = GENERATORS[fw](base);
    expect(code).toContain('stroke-width');
    expect(code).toContain('stroke-linecap');
    expect(code).not.toContain('strokeWidth');
    expect(code).not.toContain('strokeLinecap');
  });

  it.each(JSX_TARGETS)('%s uses camelCase SVG attributes, as JSX requires', (fw) => {
    const code = GENERATORS[fw](base);
    expect(code).toContain('strokeWidth');
    expect(code).toContain('strokeLinecap');
  });

  it('embeds the selector in the vanilla output', () => {
    const code = GENERATORS.vanilla({ ...base, selector: '#hero-art' });
    expect(code).toContain("scrollDraw('#hero-art'");
  });

  it('never leaves an unsubstituted template placeholder', () => {
    for (const fw of FRAMEWORKS) {
      const code = GENERATORS[fw](base);
      expect(code, fw).not.toContain('undefined');
      expect(code, fw).not.toContain('[object Object]');
      expect(code, fw).not.toMatch(/\$\{/);
    }
  });
});

describe('CLI generators — preset vs easing', () => {
  it.each(FRAMEWORKS)('%s emits the easing when no preset is chosen', (fw) => {
    const code = GENERATORS[fw]({ ...base, easing: 'ease-in-out', preset: 'none' });
    expect(code).toContain('ease-in-out');
    expect(code).not.toContain('preset');
  });

  it.each(FRAMEWORKS)('%s emits the preset instead of the easing when one is chosen', (fw) => {
    const code = GENERATORS[fw]({ ...base, easing: 'ease-in-out', preset: 'cinematic' });
    expect(code).toContain('cinematic');
    expect(code).not.toContain('ease-in-out');
  });

  it('covers every advertised preset and easing without throwing', () => {
    for (const fw of FRAMEWORKS) {
      for (const preset of PRESETS) {
        expect(() => GENERATORS[fw]({ ...base, preset })).not.toThrow();
      }
      for (const easing of EASINGS) {
        expect(() => GENERATORS[fw]({ ...base, easing, preset: 'none' })).not.toThrow();
      }
    }
  });
});
