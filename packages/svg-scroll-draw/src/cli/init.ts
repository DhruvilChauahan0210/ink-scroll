import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  GENERATORS,
  FILE_NAMES,
  FRAMEWORKS,
  PRESETS,
  EASINGS,
  needsSelector,
} from './generators';

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const PINK  = '\x1b[35m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';

function ask(rl: readline.Interface, question: string, fallback: string): Promise<string> {
  return new Promise(resolve =>
    rl.question(`  ${CYAN}?${RESET} ${question} ${DIM}(${fallback})${RESET} `, (ans) => {
      resolve(ans.trim() || fallback);
    }),
  );
}

function pick(
  rl: readline.Interface,
  question: string,
  options: string[],
  fallback: string,
): Promise<string> {
  const opts = options.map((o, i) => `${DIM}${i + 1})${RESET} ${o}`).join('  ');
  return new Promise(resolve =>
    rl.question(`  ${CYAN}?${RESET} ${question}\n     ${opts}\n     ${DIM}(${fallback})${RESET} `, (ans) => {
      const idx = parseInt(ans) - 1;
      resolve((idx >= 0 && idx < options.length) ? options[idx] : fallback);
    }),
  );
}

async function main() {
  // Created here rather than at module scope so importing this file does not
  // take over stdin — that made the CLI impossible to unit-test.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(`\n ${BOLD}${PINK}svg-scroll-draw${RESET} ${DIM}init${RESET}\n`);
    console.log(` ${DIM}Generates a starter file for your framework.${RESET}\n`);

    const framework = await pick(rl, 'Framework?', FRAMEWORKS, 'react');
    const preset    = await pick(rl, 'Preset?', PRESETS, 'none');

    let easing = 'ease-out';
    if (preset === 'none') {
      easing = await pick(rl, 'Easing?', EASINGS, 'ease-out');
    }

    // The framework wrappers bind by ref, so only ask when the answer is used.
    const selector = needsSelector(framework)
      ? await ask(rl, 'CSS selector for your SVG container?', '#my-svg')
      : '#my-svg';

    const outFile = FILE_NAMES[framework] ?? 'scroll-draw.js';
    const outPath = path.join(process.cwd(), outFile);

    if (fs.existsSync(outPath)) {
      const overwrite = await ask(rl, `${outFile} already exists. Overwrite?`, 'y');
      if (overwrite.toLowerCase() !== 'y') {
        console.log(`\n ${DIM}Aborted.${RESET}\n`);
        return;
      }
    }

    const code = GENERATORS[framework]?.({ selector, easing, preset }) ?? '';
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
  } finally {
    rl.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
