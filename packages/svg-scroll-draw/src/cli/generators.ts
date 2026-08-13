/**
 * Starter-file generators for `npx svg-scroll-draw init`.
 *
 * Kept separate from init.ts so the generated output can be unit-tested without
 * importing the interactive shell (which opens stdin on import).
 */

export interface GenerateOptions {
  /** CSS selector for the SVG container. Only meaningful for the vanilla target. */
  selector: string;
  /** Easing name. Ignored when a preset is chosen. */
  easing: string;
  /** Preset name, or `'none'` for explicit easing. */
  preset: string;
}

export type Generator = (opts: GenerateOptions) => string;

/**
 * JSX flavour — React and Solid compile camelCased presentation attributes to
 * their hyphenated SVG equivalents.
 */
const SAMPLE_SVG_JSX = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <path
          d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>`;

/**
 * HTML flavour — Vue and Svelte templates are parsed as HTML, where `strokeWidth`
 * is not a recognised attribute. These must be hyphenated or the browser drops
 * them and the path renders with the default 1px butt-capped stroke.
 */
const SAMPLE_SVG_HTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <path
        d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        fill="none"
      />
    </svg>`;

/** Options body shared by the ref/action-based framework targets. */
function optionsBody({ easing, preset }: GenerateOptions): string {
  return preset !== 'none'
    ? `preset: '${preset}'`
    : `easing: '${easing}', fade: true, once: true`;
}

const genReact: Generator = ({ easing, preset }) => {
  const presetProp = preset !== 'none' ? `\n      preset="${preset}"` : '';
  const easingProp = preset !== 'none' ? '' : `\n      easing="${easing}"`;
  return `'use client';
import { ScrollDraw } from 'svg-scroll-draw/react';

export function AnimatedSVG() {
  return (
    <ScrollDraw${presetProp}${easingProp}
      fade
      once
    >
      ${SAMPLE_SVG_JSX}
    </ScrollDraw>
  );
}
`;
};

const genVue: Generator = (opts) => `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const { ref } = useScrollDraw({
  ${optionsBody(opts)},
});
</script>

<template>
  <div :ref="ref">
    ${SAMPLE_SVG_HTML}
  </div>
</template>
`;

const genSvelte: Generator = (opts) => `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ ${optionsBody(opts)} }}>
  ${SAMPLE_SVG_HTML}
</div>
`;

const genSolid: Generator = (opts) => `import { createScrollDraw } from 'svg-scroll-draw/solid';

export function AnimatedSVG() {
  const { ref } = createScrollDraw({
    ${optionsBody(opts)},
  });

  return (
    <div ref={ref}>
      ${SAMPLE_SVG_JSX}
    </div>
  );
}
`;

const genVanilla: Generator = (opts) => {
  const body = opts.preset !== 'none'
    ? `preset: '${opts.preset}'`
    : `easing: '${opts.easing}',\n  fade: true,\n  once: true`;
  return `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('${opts.selector}', {
  ${body},
});
`;
};

export const GENERATORS: Record<string, Generator> = {
  react:   genReact,
  vue:     genVue,
  svelte:  genSvelte,
  solid:   genSolid,
  vanilla: genVanilla,
};

export const FILE_NAMES: Record<string, string> = {
  react:   'ScrollDraw.tsx',
  vue:     'ScrollDraw.vue',
  svelte:  'ScrollDraw.svelte',
  solid:   'ScrollDraw.tsx',
  vanilla: 'scroll-draw.js',
};

export const FRAMEWORKS = Object.keys(GENERATORS);

export const PRESETS = ['none', 'sketch', 'reveal', 'typewriter', 'cinematic', 'spring'];

export const EASINGS = ['ease-out', 'ease-in', 'ease-in-out', 'linear', 'spring', 'bounce'];

/**
 * Whether the chosen target actually uses the CSS selector. The ref/action-based
 * framework wrappers bind directly to an element, so prompting for a selector
 * there would discard the answer.
 */
export function needsSelector(framework: string): boolean {
  return framework === 'vanilla';
}
