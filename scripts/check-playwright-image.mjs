#!/usr/bin/env node
/**
 * Fails when a workflow's Playwright image is not the lockfile's Playwright.
 *
 * CI's browser job and the release job run in mcr.microsoft.com/playwright,
 * whose browsers are built for exactly one Playwright version. When Dependabot
 * bumps playwright and nobody bumps the image, the tests look for browser
 * builds the image does not have and every one fails with "Executable doesn't
 * exist" — on the release too. This turns that into one clear line in verify.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const version = lock.packages['node_modules/playwright']?.version;
if (!version) {
  console.error('✗ check-playwright-image: no node_modules/playwright in package-lock.json');
  process.exit(1);
}

const dir = join(root, '.github/workflows');
const wrong = [];
let seen = 0;
for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
  for (const m of readFileSync(join(dir, file), 'utf8').matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)/g)) {
    seen++;
    if (m[1] !== version) wrong.push(`${file}: playwright:v${m[1]}`);
  }
}

if (wrong.length) {
  console.error(`✗ Playwright image differs from the lockfile's playwright ${version}:\n  ${wrong.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${seen} Playwright image(s) match the lockfile (${version})`);
