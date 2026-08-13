#!/usr/bin/env node
/**
 * Prove the browser tests can actually fail.
 *
 * CONTRIBUTING.md requires every new test to be watched failing against a
 * deliberately broken build, because Phase 1 shipped two verification harnesses
 * that measured nothing and passed anyway. "I watched it fail once" is not
 * reproducible and does not survive a refactor, so this makes it a command.
 *
 * For each mutation: patch one line of source, rebuild, run the one test that is
 * supposed to catch it, and require that it FAILS. A mutation the suite does not
 * notice is a hole in the suite, reported as such.
 *
 *   node scripts/mutation-check.mjs           # run them all
 *   node scripts/mutation-check.mjs --list    # just show what would run
 *   node scripts/mutation-check.mjs reveal    # only mutations whose id matches
 *
 * Not wired into `npm run test:e2e`: it rebuilds the library once per mutation,
 * so it belongs in a pre-release check rather than the inner loop.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Each entry breaks exactly one behaviour, and names the single test that exists
 * to catch it. `from` must appear exactly once in the file — an ambiguous or
 * missing anchor is reported as a broken mutation rather than silently skipped,
 * which is what would otherwise happen after an innocent refactor.
 */
const MUTATIONS = [
  {
    id: 'reveal/stagger',
    what: 'every element gets the same trigger window, so stagger does nothing',
    file: 'src/reveal/index.ts',
    from: 'const startPct = Math.max(50, 88 - i * staggerStep);',
    to: 'const startPct = 88;',
    spec: 'reveal',
    grep: 'stagger produces a strictly ordered cascade',
  },
  {
    id: 'reveal/once-latch',
    what: 'once:true stops latching and reverses like once:false',
    file: 'src/animate/index.ts',
    from: 'frozenAlpha = Math.max(frozenAlpha, alpha);',
    to: 'frozenAlpha = alpha;',
    spec: 'reveal',
    grep: 'reaches the final state and holds it',
  },
  {
    id: 'reveal/destroy-restore',
    what: 'destroy() leaves the last animated frame’s inline styles behind',
    file: 'src/animate/index.ts',
    from: '      restoreInline();\n      _unregister(el);',
    to: '      _unregister(el);',
    spec: 'reveal',
    grep: 'destroy\\(\\) restores the original styles',
  },
  {
    id: 'reveal/reduced-motion',
    what: 'prefers-reduced-motion is ignored and the scroll animation runs anyway',
    file: 'src/animate/index.ts',
    from: '  if (prefersReduced) {\n    applyFinal();',
    to: '  if (false as boolean) {\n    applyFinal();',
    spec: 'reveal',
    grep: 'reduced motion jumps straight to the final state',
  },
  {
    id: 'pin/zone-height',
    what: 'the wrapper does not carry the pin zone height, so the page shifts',
    file: 'src/pin/index.ts',
    from: 'wrapper.style.height = `${elHeight + pinDistance}px`;',
    to: 'wrapper.style.height = `${elHeight}px`;',
    spec: 'pin',
    grep: 'injecting the wrapper does not shift the page',
  },
  {
    id: 'pin/width-carry',
    what: 'the pinned element loses its width when it leaves the flow',
    file: 'src/pin/index.ts',
    from: "      htmlEl.style.width     = `${elWidth}px`;",
    to: "      htmlEl.style.width     = '';",
    spec: 'pin',
    grep: 'stays visually parked',
  },
  {
    id: 'pin/unpin-boundary',
    what: 'the element never unpins at the end of the zone',
    file: 'src/pin/index.ts',
    from: '    } else if (wBottom - elHeight <= pinnedViewportTop) {',
    to: '    } else if (false) {',
    spec: 'pin',
    grep: 'pins and unpins at the right boundaries',
  },
  {
    id: 'pin/refresh',
    what: 'refresh() no longer re-measures after a content change',
    file: 'src/pin/index.ts',
    from: '    refresh() {\n      measure();\n      scheduleUpdate();\n    },',
    to: '    refresh() {\n      scheduleUpdate();\n    },',
    spec: 'pin',
    grep: 'refresh\\(\\) picks up a content height change',
  },
  {
    id: 'snap/landing',
    what: 'snaps land 12px short of the section boundary',
    file: 'src/snap/index.ts',
    from: '    const endScroll   = offsets[targetIndex];',
    to: '    const endScroll   = offsets[targetIndex] + 12;',
    spec: 'snap',
    grep: 'lands exactly on a section boundary',
  },
  {
    id: 'snap/reduced-motion',
    what: 'reduced motion animates the snap instead of jumping',
    file: 'src/snap/index.ts',
    from: '    if (reduceMotion) {\n      setScroll(endScroll);',
    to: '    if (false) {\n      setScroll(endScroll);',
    spec: 'snap',
    grep: 'reduced motion snaps instantly',
  },
  {
    id: 'snap/self-scroll-guard',
    what: 'the library reacts to its own snap scroll, double-firing onSnap',
    file: 'src/snap/index.ts',
    from: '      if (Math.abs(currentScroll - offsets[currentIndex]) < 1) return;',
    to: '      if (false) return;',
    spec: 'snap',
    grep: 'reduced motion snaps instantly',
  },
  {
    id: 'text/aria-label',
    what: 'the split element loses its accessible name',
    file: 'src/text/index.ts',
    from: "  const originalHTML = el.innerHTML;\n  el.setAttribute('aria-label', el.textContent ?? '');",
    to: '  const originalHTML = el.innerHTML;',
    spec: 'text',
    grep: 'assistive technology',
  },
  {
    id: 'text/destroy-restore',
    what: 'destroy() leaves the split spans in place of the original markup',
    file: 'src/text/index.ts',
    from: "      clearTimeout(resizeTimer);\n      el.innerHTML = originalHTML;\n      el.removeAttribute('aria-label');",
    to: '      clearTimeout(resizeTimer);',
    spec: 'text',
    grep: 'restores the original markup exactly',
  },
  {
    id: 'text/stagger',
    what: 'every unit animates together, so there is no cascade',
    file: 'src/text/index.ts',
    from: '  if (total <= 1 || stagger === 0) return masterAlpha;',
    to: '  return masterAlpha;',
    spec: 'text',
    grep: 'stagger cascade',
  },
  {
    id: 'counter/initial-value',
    what: 'the value rendered at construction is not the one for the current scroll',
    file: 'src/counter/index.ts',
    from: '    currentAlpha = initAlpha;\n    applyAlpha(initAlpha);',
    to: '    currentAlpha = initAlpha;\n    applyAlpha(1);',
    spec: 'counter',
    grep: 'starts at the from-value',
  },
  {
    id: 'counter/decimals',
    what: 'the decimals option renders the wrong number of places',
    file: 'src/counter/index.ts',
    from: '      ? (n) => n.toFixed(decimals)',
    to: '      ? (n) => n.toFixed(decimals + 2)',
    spec: 'counter',
    grep: 'every frame renders a well-formed value',
  },
  {
    id: 'progress/eased-value',
    what: 'the eased variable is written the raw value',
    file: 'src/progress/index.ts',
    from: '    const eased = easeFn(raw);\n    currentRaw  = raw;',
    to: '    const eased = raw;\n    currentRaw  = raw;',
    spec: 'progress',
    grep: 'eased variable differs',
  },
  {
    id: 'progress/css-usable',
    what: 'the variable is written with a unit, so calc() cannot use it',
    file: 'src/progress/index.ts',
    from: '    htmlEl.style.setProperty(variable, String(raw));',
    to: "    htmlEl.style.setProperty(variable, String(raw) + 'px');",
    spec: 'progress',
    grep: 'dependent CSS resolves the variables',
  },
  {
    id: 'parallax/travel',
    what: 'travel distance ignores the element size',
    file: 'src/animate/index.ts',
    from: '  const travel = speed * size;',
    to: '  const travel = speed * 100;',
    spec: 'parallax',
    grep: 'travel distance matches speed x height',
  },
  {
    id: 'parallax/axis',
    what: 'the x axis measures height instead of width',
    file: 'src/animate/index.ts',
    from: "  const size   = axis === 'x' ? rect.width : rect.height;",
    to: '  const size   = rect.height;',
    spec: 'parallax',
    grep: 'axis: x translates horizontally',
  },
  {
    id: 'video/scrub',
    what: 'currentTime is pinned to the start instead of tracking scroll',
    file: 'src/video/index.ts',
    from: '    video.currentTime = from + (effectiveTo - from) * alpha;',
    to: '    video.currentTime = from;',
    spec: 'video',
    grep: 'currentTime tracks the scroll position',
  },
  {
    id: 'video/direction',
    what: 'the scrub runs backwards, so the painted frame regresses',
    file: 'src/video/index.ts',
    from: '    video.currentTime = from + (effectiveTo - from) * alpha;',
    to: '    video.currentTime = from + (effectiveTo - from) * (1 - alpha);',
    spec: 'video',
    grep: 'actually paints the frame',
  },
  {
    id: 'horizontal/trigger-element',
    what: 'the trigger is measured from the sticky-pinned track, collapsing the window to zero',
    file: 'src/horizontal/index.ts',
    from:
      '    for (let node = htmlEl.parentElement; node; node = node.parentElement) {\n' +
      "      if (window.getComputedStyle(node).position === 'sticky') {\n" +
      '        return node.parentElement ?? node;\n' +
      '      }\n' +
      '    }\n',
    to: '',
    spec: 'horizontal',
    grep: 'translateX distance matches',
  },
  {
    id: 'horizontal/distance',
    what: 'travel distance ignores the viewport width, overshooting the last panel',
    file: 'src/horizontal/index.ts',
    from: '    return options.distance ?? (htmlEl.scrollWidth - window.innerWidth);',
    to: '    return options.distance ?? htmlEl.scrollWidth;',
    spec: 'horizontal',
    grep: 'translateX distance matches',
  },
  {
    id: 'horizontal/reduced-motion',
    what: 'reduced motion parks the strip on its last panel, hiding the rest',
    file: 'src/horizontal/index.ts',
    from: '    respectReducedMotion = false,',
    to: '    respectReducedMotion = true,',
    spec: 'horizontal',
    grep: 'reduced motion keeps scrubbing',
  },
  {
    id: 'horizontal/refresh',
    what: 'refresh() rebuilds with the stale travel distance',
    file: 'src/horizontal/index.ts',
    from: '      distance  = resolveDistance();\n      triggerEl = resolveTriggerElement();',
    to: '      triggerEl = resolveTriggerElement();',
    spec: 'horizontal',
    grep: 'refresh\\(\\) picks up a widened track',
  },
  {
    id: 'video/on-ready',
    what: 'onReady never fires even though metadata arrived',
    file: 'src/video/index.ts',
    from: '    cacheTriggers();\n    onReady?.();',
    to: '    cacheTriggers();',
    spec: 'video',
    grep: 'reports real metadata',
  },
];

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const filters = args.filter((a) => !a.startsWith('--'));
const selected = filters.length
  ? MUTATIONS.filter((m) => filters.some((f) => m.id.includes(f)))
  : MUTATIONS;

if (!selected.length) {
  console.error(`No mutations match ${filters.join(', ')}`);
  process.exit(1);
}

if (listOnly) {
  for (const m of selected) console.log(`${m.id.padEnd(26)} ${m.spec} -g "${m.grep}"`);
  process.exit(0);
}

function run(cmd, cmdArgs) {
  return execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
}

function build() {
  run('npx', ['tsup']);
}

/** Returns true when the targeted test FAILED, which is the outcome we want. */
function testFails(spec, grep) {
  try {
    run('npx', [
      'playwright',
      'test',
      '--config',
      'e2e/playwright.config.ts',
      '--project=chromium',
      '--reporter=line',
      spec,
      '-g',
      grep,
    ]);
    return false;
  } catch {
    return true;
  }
}

const results = [];
let restore = null;

// Any exit path has to put the source back, or a Ctrl-C leaves a sabotaged repo.
function cleanup() {
  if (restore) {
    writeFileSync(restore.path, restore.original);
    restore = null;
  }
}
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

console.log(`Mutation-checking ${selected.length} behaviour(s) against the browser suite.\n`);

for (const m of selected) {
  const path = join(ROOT, m.file);
  const original = readFileSync(path, 'utf8');
  const hits = original.split(m.from).length - 1;

  if (hits !== 1) {
    results.push({ id: m.id, status: 'STALE', detail: `anchor found ${hits}x in ${m.file}` });
    console.log(`  STALE    ${m.id} — anchor found ${hits}x, not 1`);
    continue;
  }

  restore = { path, original };
  try {
    writeFileSync(path, original.replace(m.from, m.to));
    build();
    const caught = testFails(m.spec, m.grep);
    results.push({ id: m.id, status: caught ? 'caught' : 'MISSED', detail: m.what });
    console.log(`  ${caught ? 'caught  ' : 'MISSED  '} ${m.id} — ${m.what}`);
  } catch (err) {
    results.push({ id: m.id, status: 'ERROR', detail: String(err.message).slice(0, 200) });
    console.log(`  ERROR    ${m.id} — could not build the mutant`);
  } finally {
    cleanup();
  }
}

// Leave the tree with a build of the real source, not of the last mutant.
console.log('\nRebuilding from clean source…');
build();

const bad = results.filter((r) => r.status !== 'caught');
console.log(`\n${results.length - bad.length}/${results.length} mutations caught.`);

if (bad.length) {
  console.log('\nNot caught:');
  for (const r of bad) console.log(`  ${r.status.padEnd(7)} ${r.id} — ${r.detail}`);
  process.exit(1);
}
console.log('Every mutation was caught by the test named for it.');
