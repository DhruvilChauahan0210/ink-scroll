import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Build the framework fixture bundles before any test runs.
 *
 * Deliberately here rather than in the `webServer` command: that command is
 * skipped entirely when a server is already running locally
 * (`reuseExistingServer`), which would quietly test yesterday's bundle against
 * today's wrapper. Global setup runs either way.
 */
export default function globalSetup(): void {
  execFileSync(process.execPath, [join(__dirname, 'build-fixtures.mjs')], { stdio: 'inherit' });
}
