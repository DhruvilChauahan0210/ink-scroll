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
    from: '    return options.distance ?? (htmlEl.scrollWidth - viewportWidth());',
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
    id: 'easing/animate-native-curve',
    what: 'the fast path hands CSS the keyword of the same name instead of the real curve',
    file: 'src/core/css-easing.ts',
    from: "    case 'ease-in':\n      return QUAD_IN;",
    to: "    case 'ease-in':\n      return 'ease-in';",
    spec: 'animate-parity',
    grep: 'both engines render the same value at every offset',
  },
  {
    id: 'easing/draw-native-curve',
    what: 'the same substitution on scrollDraw, where only the linear default was ever compared',
    file: 'src/core/css-easing.ts',
    from: "    case 'ease-out':\n      return QUAD_OUT;",
    to: "    case 'ease-out':\n      return 'ease-out';",
    spec: 'e2e/parity.spec.ts',
    grep: 'a non-linear easing renders the same curve',
  },
  /*
   * There is deliberately no browser mutation for the third curve,
   * `ease-in-out` → sampled `linear()`.
   *
   * Substituting the CSS keyword there is wrong by 0.0119, which is inside the
   * 0.02 the parity specs must allow for the sub-frame difference between a
   * compositor-committed animation and a value written on the next rAF. A
   * browser mutation for it would be reported MISSED forever — not because the
   * suite is weak, but because the difference is genuinely below what a browser
   * test can resolve.
   *
   * It is pinned in `src/__tests__/css-easing.test.ts` instead, which evaluates
   * the emitted declaration the way a browser does and holds it to 1e-3. Verified
   * failing against this exact mutation.
   */
  {
    id: 'animate/native-eligibility',
    what: 'once:true wrongly takes the fast path, which cannot latch progress',
    file: 'src/animate/index.ts',
    from: '    if (once) return false;',
    to: '    if (false) return false;',
    spec: 'animate-parity',
    grep: 'declines every configuration CSS cannot express',
  },
  {
    id: 'group/fan-out',
    what: 'a group resolves only its first target, so the other members never animate',
    file: 'src/group/index.ts',
    from: '    .filter((el): el is Element => el !== null);',
    to: '    .filter((el): el is Element => el !== null)\n    .slice(0, 1);',
    spec: 'group',
    grep: 'every member draws together',
  },
  {
    id: 'group/sequence-gate',
    what: 'later steps are never held, so the whole sequence animates at once',
    file: 'src/group/index.ts',
    from:
      '    // All engines start paused except the first; resume() is called when the\n' +
      '    // preceding engine fires onComplete.\n' +
      '    for (let i = 1; i < instances.length; i++) instances[i].pause();',
    to: '',
    spec: 'group',
    grep: 'a step does not start until the previous one has completed',
  },
  {
    id: 'group/sequence-cursor',
    what: 'the active step walks off the end, so a finished sequence reports 0%',
    file: 'src/group/index.ts',
    from:
      '        activeIdx = Math.min(idx + 1, containers.length - 1);\n' +
      '        if (activeIdx > idx) instances[activeIdx]?.resume();\n' +
      '      },\n    });\n  }\n\n  function init(): void {\n' +
      '    containers.forEach((_, idx) => { instances[idx] = makeEngine(idx); });\n' +
      '    // All engines',
    to:
      '        activeIdx = idx + 1;\n' +
      '        instances[activeIdx]?.resume();\n' +
      '      },\n    });\n  }\n\n  function init(): void {\n' +
      '    containers.forEach((_, idx) => { instances[idx] = makeEngine(idx); });\n' +
      '    // All engines',
    spec: 'group',
    grep: 'reports itself complete afterwards',
  },
  {
    id: 'timeline/track-window',
    what: 'every track follows global progress instead of its own from/to slice',
    file: 'src/timeline/index.ts',
    from: '      const localRaw   = range > 0 ? Math.min(1, Math.max(0, (globalAlpha - from) / range)) : 0;',
    to: '      const localRaw   = globalAlpha;',
    spec: 'timeline',
    grep: 'each track fills across its own window',
  },
  {
    id: 'timeline/track-fan-out',
    what: 'a track drives only the first element its selector matches',
    file: 'src/timeline/index.ts',
    from: '      elements.forEach((el, i) => {\n        el.style.strokeDashoffset = `${lengths[i] * (1 - localAlpha)}`;',
    to: '      elements.slice(0, 1).forEach((el, i) => {\n        el.style.strokeDashoffset = `${lengths[i] * (1 - localAlpha)}`;',
    spec: 'timeline',
    grep: 'drives every element it matches',
  },
  {
    id: 'timeline/track-easing',
    what: 'per-track easing is dropped and every track runs linear',
    file: 'src/timeline/index.ts',
    from: '      const localAlpha = easeFn(localRaw);',
    to: '      const localAlpha = localRaw;',
    spec: 'timeline',
    grep: 'per-track easing is applied',
  },
  {
    id: 'timeline/fade',
    what: 'the fade option stops writing opacity, leaving the track invisible',
    file: 'src/timeline/index.ts',
    from: '        if (fade) el.style.opacity = String(localAlpha);',
    to: '',
    spec: 'timeline',
    grep: 'fade tracks opacity',
  },
  {
    id: 'cinematic/scene-window',
    what: 'every animation follows global progress, ignoring its start/end in the story',
    file: 'src/cinematic/index.ts',
    from: '        const local = span <= 0 ? (global >= r.end ? 1 : 0) : clamp01((global - r.start) / span);',
    to: '        const local = global;',
    spec: 'cinematic',
    grep: 'every animation runs on its own window',
  },
  {
    id: 'cinematic/total-height',
    what: 'the story height is never applied, so there is no scroll room to scrub',
    file: 'src/cinematic/index.ts',
    from: '    mount.style.height = story.totalHeight;',
    to: "    mount.style.height = '';",
    spec: 'cinematic',
    grep: 'builds the whole scroll structure',
  },
  {
    id: 'cinematic/measured-length',
    what: 'a story that omits the pre-measured length draws nothing',
    file: 'src/cinematic/index.ts',
    from: '          const len = a.length || path.getTotalLength?.() || 0;',
    to: '          const len = a.length || 0;',
    spec: 'cinematic',
    grep: 'builds the whole scroll structure',
  },
  {
    id: 'cinematic/reduced-motion',
    what: 'prefers-reduced-motion is ignored and the story scrubs anyway',
    file: 'src/cinematic/index.ts',
    from: "    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {",
    to: '    if (false) {',
    spec: 'cinematic',
    grep: 'reduced motion shows the finished frame',
  },
  {
    id: 'horizontal/container-viewport',
    what: 'the default distance measures against the window even inside a scroll container',
    file: 'src/horizontal/index.ts',
    from: '    return scrollEl ? scrollEl.clientWidth : window.innerWidth;',
    to: '    return window.innerWidth;',
    spec: 'horizontal',
    grep: 'default distance is measured against the container',
  },
  {
    id: 'utils/trigger-frame-scroll',
    what: 'a container-relative trigger window counts the scroll position twice',
    file: 'src/core/utils.ts',
    from: '    return { top, height: size, scroll: 0 };',
    to: '    return { top, height: size, scroll: axis === \'x\' ? scrollEl.scrollLeft : scrollEl.scrollTop };',
    spec: 'horizontal',
    grep: 're-measuring while scrolled does not shift',
  },
  {
    id: 'engine/refresh-native',
    what: 'refresh() on the native path leaves --ssd-len at the old length',
    file: 'src/core/engine.ts',
    from: "          el.style.setProperty('--ssd-len', String(lengths[i]));",
    to: '',
    spec: 'group',
    grep: 'refresh\\(\\) re-measures a path that changed length',
  },
  {
    id: 'engine/refresh-js',
    what: 'refresh() on the JS path does not re-measure at all',
    file: 'src/core/engine.ts',
    from: '    refresh() {\n      clearTimeout(resizeTimer);\n      remeasure();',
    to: '    refresh() {\n      clearTimeout(resizeTimer);',
    spec: 'group',
    grep: 'refresh\\(\\) re-measures a path that changed length',
  },
  {
    id: 'timeline/destroy-restore',
    what: 'destroy() leaves the paths frozen on their last frame',
    file: 'src/timeline/index.ts',
    from: '      restoreInline();\n      (container as HTMLElement).style.removeProperty',
    to: '      (container as HTMLElement).style.removeProperty',
    spec: 'timeline',
    grep: 'destroy\\(\\) restores the paths it wrote to',
  },
  {
    id: 'timeline/refresh',
    what: 'refresh() does not re-measure a path that changed length',
    file: 'src/timeline/index.ts',
    from: '    refresh() {\n      clearTimeout(resizeTimer);\n      remeasure();\n    },',
    to: '    refresh() {\n      clearTimeout(resizeTimer);\n    },',
    spec: 'timeline',
    grep: 'refresh\\(\\) picks up a path that changed length',
  },
  {
    id: 'timeline/reduced-motion-loop',
    what: 'the time-driven loop runs even when the user asked for reduced motion',
    file: 'src/timeline/index.ts',
    from: '  const loopActive = (): boolean => maxLoops > 0 && !motionReduced;',
    to: '  const loopActive = (): boolean => maxLoops > 0;',
    spec: 'timeline',
    grep: 'reduced motion keeps scrubbing but does not run the loop',
  },
  {
    id: 'text/line-gaps',
    what: 'the lines split drops the spaces between words',
    file: 'src/text/index.ts',
    from: '      if (i < words.length - 1 && gap && gap.style.whiteSpace === \'pre\') {\n        lineSpan.appendChild(gap);\n      }',
    to: '',
    spec: 'text',
    grep: 'preserves the spaces between words on a line',
  },
  {
    id: 'env/dev-cdn-flag',
    what: 'the dev CDN build cannot turn its warnings on, so it is silent like production',
    file: 'src/core/env.ts',
    from: "  typeof __SVG_SCROLL_DRAW_DEV__ !== 'undefined'\n    ? __SVG_SCROLL_DRAW_DEV__\n    : typeof process !== 'undefined' &&",
    to: "  false\n    ? __SVG_SCROLL_DRAW_DEV__\n    : typeof process !== 'undefined' &&",
    spec: 'cdn',
    grep: 'the dev build reports the problems',
  },
  {
    id: 'cdn/web-component-side-effect',
    what: 'the CDN bundle tree-shakes the web component away, so <scroll-draw> never registers',
    file: 'package.json',
    from: '    "./dist/cdn/*",\n    "./src/web-component/*",\n    "./src/cdn.ts"',
    to: '    "./dist/cdn/*"',
    spec: 'cdn',
    grep: 'exposes the API',
  },
  {
    id: 'react/unmount-cleanup',
    what: 'the React wrapper never destroys its engine on unmount',
    file: 'src/react/index.tsx',
    from: '    const instance = createEngine(ref.current, options);\n    return () => instance.destroy();',
    to: '    createEngine(ref.current, options);',
    spec: 'frameworks',
    grep: 'react wrapper.*unmounting stops everything',
  },
  {
    id: 'vue/unmount-cleanup',
    what: 'the Vue component leaves its engine running after the component is gone',
    file: 'src/vue/index.ts',
    from: '      const instance = createEngine(containerRef.value, opts);\n      onUnmounted(() => instance.destroy());',
    to: '      createEngine(containerRef.value, opts);',
    spec: 'frameworks',
    grep: 'vue wrapper.*unmounting stops everything',
  },
  {
    id: 'solid/unmount-cleanup',
    what: 'the Solid primitive never registers its cleanup, so the engine outlives the owner',
    file: 'src/solid/index.ts',
    from: '    instance = createEngine(el, options);\n  });\n\n  onCleanup(() => {\n    instance?.destroy();\n  });',
    to: '    instance = createEngine(el, options);\n  });',
    spec: 'frameworks',
    grep: 'solid wrapper.*unmounting stops everything',
  },
  {
    id: 'svelte/action-update',
    what: 'the Svelte action ignores a parameter change, so use:action={opts} is inert',
    file: 'src/svelte/index.ts',
    from: '    update(newOptions: ScrollDrawOptions) {\n      instance.destroy();\n      instance = createEngine(node, newOptions);\n    },',
    to: '    update() {},',
    spec: 'frameworks',
    grep: 'svelte wrapper.*option changes reach the engine',
  },
  {
    id: 'astro/attribute-options',
    what: 'the Astro scanner ignores the options attribute, so the animation has no props',
    file: 'src/astro/index.ts',
    from: '      if (raw) opts = JSON.parse(raw) as ScrollAnimateOptions;',
    to: '      raw;',
    spec: 'frameworks',
    grep: 'astro wrapper.*the mounted engine tracks scroll',
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
