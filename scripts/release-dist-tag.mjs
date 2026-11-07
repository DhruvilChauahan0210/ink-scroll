#!/usr/bin/env node
/**
 * Which npm dist-tag a release gets, so only the newest version takes `latest`.
 *
 * Why: on 2026-11-07 the tags v2.20.1, v2.21.0, v2.22.0 and v2.23.0 were pushed
 * within two minutes. release.yml's concurrency group is per tag, so all four
 * ran at once, and `npm publish` makes whatever it publishes `latest`. npm now
 * processes a version for a few minutes before it appears, and 2.23.0 finished
 * before 2.21.0 and 2.22.0, so `latest` ended on 2.22.0 and GitHub marked
 * v2.22.0 the latest release. Both were put right by hand.
 *
 * Rule: a stable version takes `latest` only if no release tag and no current
 * npm `latest` is newer. An older stable version gets `previous`; a prerelease
 * (2.24.0-beta.1) gets `next` and is never `latest`. The workflow reads the tags
 * again at publish time, because a newer tag may have been pushed after the run
 * checked out.
 *
 *   node scripts/release-dist-tag.mjs <version> <npm-latest> [tag versions…]
 *     → prints tag=…, latest=true|false, prerelease=true|false (for $GITHUB_OUTPUT)
 *   node scripts/release-dist-tag.mjs --self-test
 */

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function parse(v) {
  const m = SEMVER.exec(String(v ?? '').trim().replace(/^v/, ''));
  return m ? { v: m[0], nums: [+m[1], +m[2], +m[3]], pre: m[4] ?? null } : null;
}

/** Compare two stable versions numerically: 2.10.10 is newer than 2.10.9. */
function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a.nums[i] !== b.nums[i]) return a.nums[i] - b.nums[i];
  return 0;
}

export function decide(version, npmLatest, tags = []) {
  const me = parse(version);
  if (!me) throw new Error(`not a version: ${version}`);
  if (me.pre) return { tag: 'next', latest: false, prerelease: true };
  const others = [npmLatest, ...tags].map(parse).filter((p) => p && !p.pre);
  const newest = others.reduce((a, b) => (!a || compare(b, a) > 0 ? b : a), null);
  const isNewest = !newest || compare(me, newest) >= 0;
  return { tag: isNewest ? 'latest' : 'previous', latest: isNewest, prerelease: false };
}

function selfTest() {
  const all = ['2.20.0', '2.20.1', '2.21.0', '2.22.0', '2.23.0'];
  const cases = [
    // The 2026-11-07 race: each of the four, with npm's latest still 2.20.0.
    [['2.20.1', '2.20.0', all], 'previous'],
    [['2.21.0', '2.20.0', all], 'previous'],
    [['2.22.0', '2.20.0', all], 'previous'],
    [['2.23.0', '2.20.0', all], 'latest'],
    // npm already ahead of the tags this run fetched.
    [['2.22.0', '2.23.0', ['2.22.0']], 'previous'],
    // Numbers, not strings.
    [['2.10.10', '2.10.9', ['2.10.9', '2.10.10']], 'latest'],
    // Prereleases: never latest, and never in the way of a stable release.
    [['3.0.0-beta.1', '2.23.0', all], 'next'],
    [['2.24.0', '2.23.0', [...all, '3.0.0-beta.1']], 'latest'],
    // npm unreachable, junk tags ignored, a re-run of the newest version.
    [['2.24.0', '', ['2.23.0', 'vnext', 'v2.x']], 'latest'],
    [['2.23.0', '2.23.0', all], 'latest'],
  ];
  let failed = 0;
  for (const [args, want] of cases) {
    const got = decide(...args).tag;
    if (got !== want) { failed++; console.error(`✗ decide(${JSON.stringify(args.slice(0, 2))}, …) = ${got}, want ${want}`); }
  }
  console.log(failed ? `${failed} of ${cases.length} cases failed` : `✓ release-dist-tag: ${cases.length} cases`);
  process.exit(failed ? 1 : 0);
}

const [first, npmLatest, ...tags] = process.argv.slice(2);
if (first === '--self-test') selfTest();
else if (first) {
  const d = decide(first, npmLatest, tags);
  console.log(`tag=${d.tag}`);
  console.log(`latest=${d.latest}`);
  console.log(`prerelease=${d.prerelease}`);
}
