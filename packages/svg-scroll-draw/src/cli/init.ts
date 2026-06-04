import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const PINK  = '\x1b[35m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string, fallback: string): Promise<string> {
  return new Promise(resolve =>
    rl.question(`  ${CYAN}?${RESET} ${question} ${DIM}(${fallback})${RESET} `, (ans) => {
      resolve(ans.trim() || fallback);
    }),
  );
}

function pick(question: string, options: string[], fallback: string): Promise<string> {
  const opts = options.map((o, i) => `${DIM}${i + 1})${RESET} ${o}`).join('  ');
  return new Promise(resolve =>
    rl.question(`  ${CYAN}?${RESET} ${question}\n     ${opts}\n     ${DIM}(${fallback})${RESET} `, (ans) => {
      const idx = parseInt(ans) - 1;
      resolve((idx >= 0 && idx < options.length) ? options[idx] : fallback);
    }),
  );
}

// ── Code generators ───────────────────────────────────────────────────────────

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
    <path
      d="M10 50 C 40 10, 80 10, 100 50 S 160 90, 190 50"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>`;

function genReact(selector: string, easing: string, preset: string): string {
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
      ${SAMPLE_SVG}
    </ScrollDraw>
  );
}
`;
}

function genVue(selector: string, easing: string, preset: string): string {
  const opts = preset !== 'none'
    ? `preset: '${preset}'`
    : `easing: '${easing}', fade: true, once: true`;
  return `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const { ref } = useScrollDraw({
  ${opts},
});
</script>

<template>
  <div :ref="ref">
    ${SAMPLE_SVG}
  </div>
</template>
`;
}

function genSvelte(selector: string, easing: string, preset: string): string {
  const opts = preset !== 'none'
    ? `{ preset: '${preset}' }`
    : `{ easing: '${easing}', fade: true, once: true }`;
  return `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={${opts}}>
  ${SAMPLE_SVG}
</div>
`;
}

function genSolid(selector: string, easing: string, preset: string): string {
  const opts = preset !== 'none'
    ? `preset: '${preset}'`
    : `easing: '${easing}', fade: true, once: true`;
  return `import { createScrollDraw } from 'svg-scroll-draw/solid';

export function AnimatedSVG() {
  const { ref } = createScrollDraw({
    ${opts},
  });

  return (
    <div ref={ref}>
      ${SAMPLE_SVG}
    </div>
  );
}
`;
}

function genVanilla(selector: string, easing: string, preset: string): string {
  const opts = preset !== 'none'
    ? `preset: '${preset}'`
    : `easing: '${easing}',\n  fade: true,\n  once: true`;
  return `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('${selector}', {
  ${opts},
});
`;
}

const GENERATORS: Record<string, (sel: string, eas: string, pre: string) => string> = {
  react:   genReact,
  vue:     genVue,
  svelte:  genSvelte,
  solid:   genSolid,
  vanilla: genVanilla,
};

const FILE_NAMES: Record<string, string> = {
  react:   'ScrollDraw.tsx',
  vue:     'ScrollDraw.vue',
  svelte:  'ScrollDraw.svelte',
  solid:   'ScrollDraw.tsx',
  vanilla: 'scroll-draw.js',
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n ${BOLD}${PINK}svg-scroll-draw${RESET} ${DIM}init${RESET}\n`);
  console.log(` ${DIM}Generates a starter file for your framework.${RESET}\n`);

  const framework = await pick(
    'Framework?',
    ['react', 'vue', 'svelte', 'solid', 'vanilla'],
    'react',
  );

  const preset = await pick(
    'Preset?',
    ['none', 'sketch', 'reveal', 'typewriter', 'cinematic', 'spring'],
    'none',
  );

  let easing = 'ease-out';
  if (preset === 'none') {
    easing = await pick(
      'Easing?',
      ['ease-out', 'ease-in', 'ease-in-out', 'linear', 'spring', 'bounce'],
      'ease-out',
    );
  }

  const selector = await ask('CSS selector for your SVG container?', '#my-svg');

  const outFile = FILE_NAMES[framework] ?? 'scroll-draw.js';
  const outPath = path.join(process.cwd(), outFile);

  if (fs.existsSync(outPath)) {
    const overwrite = await ask(`${outFile} already exists. Overwrite?`, 'y');
    if (overwrite.toLowerCase() !== 'y') {
      console.log(`\n ${DIM}Aborted.${RESET}\n`);
      rl.close();
      return;
    }
  }

  const code = GENERATORS[framework]?.(selector, easing, preset) ?? '';
  fs.writeFileSync(outPath, code, 'utf8');

  console.log(`\n ${GREEN}✓${RESET} ${BOLD}${outFile}${RESET} created.\n`);
  console.log(` ${DIM}Next steps:${RESET}`);
  console.log(`   npm i svg-scroll-draw`);

  if (framework === 'vanilla') {
    console.log(`   Add your SVG to the DOM and call scrollDraw('${selector}', ...)`);
  } else {
    console.log(`   Import ${outFile.replace(/\.\w+$/, '')} and drop it into your page.`);
  }
  console.log(`\n   ${DIM}Docs: https://svg-scroll-draw.vercel.app/docs${RESET}\n`);

  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
