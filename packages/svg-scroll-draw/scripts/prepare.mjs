/**
 * `prepare`: build the library when it is installed (a clone, CI, a git
 * dependency), except on Vercel.
 *
 * Plain `tsup` builds every config at once, each with its own TypeScript
 * program for the declarations, and that peak exhausts Vercel's build
 * container (scripts/build-lowmem.mjs). Vercel runs `npm install` first, which
 * ran this build in full, and then `vercel-build`, which builds the library
 * again with bounded parallelism: the install-time build was redundant there,
 * and on 2026-11-16 it was killed for memory (an OOM during `npm install`).
 * Vercel sets VERCEL=1 for the install as for the build.
 */
import { execSync } from 'node:child_process';

if (process.env.VERCEL) {
  console.log('prepare: on Vercel, the library is built by vercel-build (build:lib:lowmem); skipping the install-time build.');
} else {
  execSync('npm run build', { stdio: 'inherit' });
}
