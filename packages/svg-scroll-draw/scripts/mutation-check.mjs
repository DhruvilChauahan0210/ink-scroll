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
 *   node scripts/mutation-check.mjs --anchors # every anchor still applies (seconds; in verify)
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
    from: 'const step   = Math.min(Math.max(stagger, 0), 1) * span;',
    to: 'const step   = 0;',
    spec: 'reveal',
    grep: 'stagger produces a strictly ordered cascade',
  },
  {
    id: 'reveal/once-latch',
    what: 'once:true stops latching and reverses like once:false',
    file: 'src/animate/engine.ts',
    // Re-anchored in 2.23.3, when `once` began holding the raw progress.
    from: 'easeFn(frozenRaw = Math.max(frozenRaw, progress))',
    to: 'easeFn(frozenRaw = progress)',
    spec: 'reveal',
    grep: 'reaches the final state and holds it',
  },
  {
    id: 'reveal/destroy-restore',
    what: 'destroy() leaves the last animated frame’s inline styles behind',
    file: 'src/animate/engine.ts',
    from: '      restoreInline();\n      _unregister(el);',
    to: '      _unregister(el);',
    spec: 'reveal',
    grep: 'destroy\\(\\) restores the original styles',
  },
  {
    id: 'reveal/reduced-motion',
    what: 'prefers-reduced-motion is ignored and the scroll animation runs anyway',
    file: 'src/animate/engine.ts',
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
    // refresh() calls remeasure() since 2.19.0; this anchor still named the old
    // measure() + scheduleUpdate() body until 2.20.0, so it could not apply.
    from: '    refresh() {\n      remeasure();\n    },',
    to: '    refresh() {},',
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
    id: 'text/destroy-restore',
    what: 'destroy() leaves the split spans in place of the original markup',
    file: 'src/text/index.ts',
    from: '      gate.off();\n      el.innerHTML = originalHTML;\n      _unregister(el);',
    to: '      gate.off();\n      _unregister(el);',
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
    what: 'travel is not speed times the layer\u2019s own size',
    file: 'src/animate/index.ts',
    // Re-anchored in 2.20.0: since 2.19.0 the travel is a percentage of the
    // layer (`-speed * 100`), and the old `speed * size` anchor no longer applied.
    from: '  const travel = -speed * 100;',
    to: '  const travel = -speed * 50;',
    spec: 'parallax',
    grep: 'travel distance matches speed x height',
  },
  {
    id: 'parallax/axis',
    what: 'axis: x still moves the layer vertically',
    file: 'src/animate/index.ts',
    // Re-anchored in 2.20.0: the axis picks translateX or translateY since
    // 2.19.0; there is no measured size left to swap.
    from: "    props: axis === 'x'\n",
    to: '    props: false\n',
    spec: 'parallax',
    grep: 'axis: x translates horizontally',
  },
  {
    id: 'video/scrub',
    what: 'currentTime is pinned to the start instead of tracking scroll',
    file: 'src/video/index.ts',
    from: '    const time = from + (effectiveTo - from) * alpha;',
    to: '    const time = from;',
    spec: 'video',
    grep: 'currentTime tracks the scroll position',
  },
  {
    id: 'video/direction',
    what: 'the scrub runs backwards, so the painted frame regresses',
    file: 'src/video/index.ts',
    from: '    const time = from + (effectiveTo - from) * alpha;',
    to: '    const time = from + (effectiveTo - from) * (1 - alpha);',
    spec: 'video',
    grep: 'actually paints the frame',
  },
  {
    id: 'layout/notify',
    what: 'the shared layout watcher hears every resize and tells no engine',
    file: 'src/core/layout-watch.ts',
    from: '    if (moved) watchers.forEach((w) => w());',
    to: '    void moved;',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/animate',
    what: 'the animate engine (scrollAnimate, scrollReveal, parallax, groups) ignores layout changes again',
    file: 'src/animate/engine.ts',
    // Re-anchored in 2.23.5: the layout watcher is core/frame-gate's, which
    // calls the re-measure each engine hands it.
    from: '    update,\n    cacheTriggers,\n  );',
    to: '    update,\n    () => {},\n  );',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/counter',
    what: 'scrollCounter ignores layout changes again',
    file: 'src/counter/index.ts',
    from: '  const gate = frameGate(window, [el], at, update, cacheTriggers);',
    to: '  const gate = frameGate(window, [el], at, update, () => {});',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/progress',
    what: 'scrollProgress ignores layout changes again',
    file: 'src/progress/index.ts',
    from: '    update,\n    cacheTriggers,\n  );',
    to: '    update,\n    () => {},\n  );',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/text',
    what: 'scrollText ignores layout changes again',
    file: 'src/text/index.ts',
    from: '      applyAll(currentAlpha);\n    }\n    cacheTriggers();\n  });',
    to: '      applyAll(currentAlpha);\n    }\n  });',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/timeline',
    what: 'scrollDrawTimeline ignores layout changes again',
    file: 'src/timeline/index.ts',
    from: '      });\n      cacheTriggers();\n    },\n  );',
    to: '      });\n    },\n  );',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/video',
    what: 'scrollVideo ignores layout changes again',
    file: 'src/video/index.ts',
    from: '  const gate = frameGate(window, [measured], at, update, cacheTriggers);',
    to: '  const gate = frameGate(window, [measured], at, update, () => {});',
    spec: 'layout',
    grep: 'content growing above every engine moves their windows with it',
  },
  {
    id: 'layout/own-transform',
    what: 'a re-measure counts the engine’s own translateY, starting scrollReveal’s fade-up late',
    file: 'src/animate/engine.ts',
    from: "    moving.forEach((e) => style.setProperty(e.prop, savedInline.get(e.prop) ?? ''));",
    to: '',
    spec: 'layout',
    grep: 'a re-measure leaves out the element’s own transform',
  },
  {
    id: 'react/attributes',
    what: 'React components put id, aria-* and data-* into the engine options instead of on the element',
    file: 'src/react/index.tsx',
    from: '  for (const [k, v] of Object.entries(props)) (ATTR.test(k) ? attrs : options)[k] = v;',
    to: '  for (const [k, v] of Object.entries(props)) options[k] = v;',
    spec: 'frameworks',
    grep: 'react wrapper attributes',
  },
  {
    id: 'web-component/live-options',
    what: '<scroll-draw> reads its option attributes once, so a later change does nothing',
    file: 'src/web-component/index.ts',
    from: '    attributeChangedCallback() {\n      if (this.instance) this.build();\n    }',
    to: '    attributeChangedCallback() {}',
    spec: 'frameworks',
    grep: 'web-component wrapper.*option changes reach the engine',
  },
  {
    id: 'astro/live-options',
    what: 'Astro reads the options attribute once, so editing it does nothing',
    file: 'src/astro/index.ts',
    from: "    watcher.observe(el, { attributes: true, attributeFilter: ['draw', 'animate', 'counter', 'text'].map((k) => `data-scroll-${k}-options`).concat('data-scroll-drawoptions') });",
    to: '    void watcher;',
    spec: 'frameworks',
    grep: 'astro wrapper.*option changes reach the engine',
  },
  {
    id: 'astro/one-engine',
    what: 'calling an Astro init again stacks a second engine on an element that already has one',
    file: 'src/astro/index.ts',
    from: '    if (cur && cur.key === key) return;',
    to: '',
    spec: 'frameworks',
    grep: 'astro wrapper.*equal options keeps the running engine',
  },
  {
    id: 'pin/resize-pinned',
    what: 'a resize while pinned leaves the element at its old left and width',
    file: 'src/pin/index.ts',
    from: '    if (state === \'pinned\') {\n      htmlEl.style.left  = `${wrapper.getBoundingClientRect().left}px`;',
    to: '    if (state === \'pinned\' && elWidth < 0) {\n      htmlEl.style.left  = `${wrapper.getBoundingClientRect().left}px`;',
    spec: 'pin',
    grep: 'a resize mid-pin moves the pinned element',
  },
  {
    id: 'parallax/follows-size',
    what: 'parallax travel is measured once in px, so a layer that grows keeps travelling its first height',
    file: 'src/animate/index.ts',
    from: '      : { transform: [`translateY(0%)`, `translateY(${travel}%)`] },',
    to: '      : { transform: [`translateY(0px)`, `translateY(${-speed * (el as HTMLElement).offsetHeight}px)`] },',
    spec: 'parallax',
    grep: 'travel follows the layer when it grows',
  },
  {
    id: 'layout/boxes-above',
    what: 'only body and the element are watched, so growth inside a scroll container or a 100%-tall body is never heard',
    file: 'src/core/layout-watch.ts',
    from: '  const all = above(targets);',
    to: '  const all = new Set(targets);',
    spec: 'layout',
    grep: 'content growing above, with body unchanged',
  },
  {
    id: 'horizontal/trigger-element',
    what: 'the trigger is measured from the sticky-pinned track, collapsing the window to zero',
    file: 'src/horizontal/index.ts',
    from: '    if (stage) return stage.parentElement ?? stage;\n',
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
    from: '    distance  = resolveDistance();\n    triggerEl = next;',
    to: '    triggerEl = next;',
    spec: 'horizontal',
    grep: 'refresh\\(\\) picks up a widened track',
  },
  {
    id: 'horizontal/stage-width',
    what: 'the travel is measured against the window, so a strip in a narrower page container never shows the end of its last panel',
    file: 'src/horizontal/index.ts',
    from: '    if (stage) {\n      const cs = window.getComputedStyle(stage);',
    to: '    if (stage && stage.isConnected === false) {\n      const cs = window.getComputedStyle(stage);',
    spec: 'horizontal',
    grep: 'measured against the stage, not the window',
  },
  {
    id: 'horizontal/follow-layout',
    what: 'the strip is measured once, so a resize leaves it short of its last panel or past it',
    file: 'src/horizontal/index.ts',
    from: '    if (resolveTriggerElement() !== triggerEl || layoutKey() !== layout) rebuild();',
    to: '    void layout;',
    spec: 'horizontal',
    grep: 'follows a narrower window',
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
    file: 'src/animate/engine.ts',
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
    from: '      return stage.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);',
    to: '      return cs && window.innerWidth;',
    spec: 'horizontal',
    grep: 'default distance is measured against the container',
  },
  {
    id: 'utils/trigger-frame-scroll',
    what: 'a container-relative trigger window counts the scroll position twice',
    file: 'src/core/trigger-frame.ts',
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
    from: '    refresh: gate.remeasure,\n  }, () => ({ tStart, tEnd }));',
    to: '    refresh() {},\n  }, () => ({ tStart, tEnd }));',
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
    from: '    refresh: gate.remeasure,',
    to: '    refresh() {},',
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
    from: '    const instance = create(ref.current as never, liveFns(latest.current, () => latest.current));\n    return () => instance.destroy();',
    to: '    create(ref.current as never, liveFns(latest.current, () => latest.current));',
    spec: 'frameworks',
    grep: 'react wrapper.*unmounting stops everything',
  },
  {
    id: 'vue/unmount-cleanup',
    what: 'the Vue component leaves its engine running after the component is gone',
    file: 'src/vue/index.ts',
    from: '  onUnmounted(() => {\n    instance?.destroy();\n    instance = null;\n  });',
    to: '  onUnmounted(() => {\n    instance = null;\n  });',
    spec: 'frameworks',
    grep: 'vue wrapper.*unmounting stops everything',
  },
  {
    id: 'solid/unmount-cleanup',
    what: 'the Solid primitive never registers its cleanup, so the engine outlives the owner',
    file: 'src/solid/index.ts',
    from: '  onCleanup(() => {\n    instance?.destroy();\n    instance = key = undefined;\n  });',
    to: '  onCleanup(() => {\n    instance = key = undefined;\n  });',
    spec: 'frameworks',
    grep: 'solid wrapper.*unmounting stops everything',
  },
  {
    id: 'svelte/action-update',
    what: 'the Svelte action ignores a parameter change, so use:action={opts} is inert',
    file: 'src/svelte/index.ts',
    // Re-anchored for scrollFramesAction: the key is a parameter (`keyOf`,
    // optionsKey unless an action passes its own) and create gets the raw options.
    from: '    update(next: O) {\n      latest = next;\n      const nextKey = keyOf(next);\n      if (nextKey === key) return;\n      key = nextKey;\n      instance.destroy();\n      instance = create(node, liveFns(next, () => latest), next);\n    },',
    to: '    update(next: O) {\n      latest = next;\n    },',
    spec: 'frameworks',
    grep: 'svelte wrapper.*option changes reach the engine',
  },
  {
    id: 'solid/option-change',
    what: 'the Solid effect builds the engine once and ignores every later option change',
    file: 'src/solid/index.ts',
    from: '    if (!el || next === key) return;',
    to: '    if (!el || key !== undefined) return;',
    spec: 'frameworks',
    grep: 'solid wrapper.*option changes reach the engine',
  },
  {
    id: 'angular/update',
    what: "Angular's update() keeps the old engine when an option changed",
    file: 'src/angular/index.ts',
    // Re-anchored for ScrollFramesRef: the key is a parameter (`keyOf`).
    from: '    if (this.keyOf(options) !== this.key) return this.init(this.el, options);\n',
    to: '',
    spec: 'frameworks',
    grep: 'angular wrapper.*option changes reach the engine',
  },
  {
    id: 'react/equal-options',
    what: 'the React wrapper rebuilds its engine on every render, equal options or not',
    file: 'src/react/index.tsx',
    from: '  }, [key]);',
    to: '  });',
    spec: 'frameworks',
    grep: 'react wrapper.*equal options keeps the running engine',
  },
  {
    id: 'vue/equal-options',
    what: 'the Vue wrapper compares options by identity, so a fresh equal object rebuilds the engine',
    file: 'src/vue/index.ts',
    // Re-anchored for <ScrollFrames>: the key is a parameter (`keyOf`, optionsKey
    // unless a component passes its own, as ScrollFrames passes framesKey).
    from: '  watch(() => keyOf((latest = options())), start);',
    to: '  watch(() => (latest = options()), start);',
    spec: 'frameworks',
    grep: 'vue wrapper.*equal options keeps the running engine',
  },
  {
    id: 'video/trigger-element',
    what: 'scrollVideo ignores triggerElement, so a film in a sticky stage scrubs over the wrong window',
    file: 'src/video/index.ts',
    from: '  const measured: Element = triggerElement ?? video;',
    to: '  const measured: Element = video;',
    spec: 'video',
    grep: 'triggerElement.*scrubs across the whole track',
  },
  {
    id: 'astro/attribute-options',
    what: 'the Astro scanner ignores the options attribute, so the animation has no props',
    file: 'src/astro/index.ts',
    from: "      (raw) => createAnimateEngine(el, parse<ScrollAnimateOptions>(raw, { props: {} })),",
    to: "      (raw) => createAnimateEngine(el, parse<ScrollAnimateOptions>('', { props: {} })),",
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
  {
    id: 'stagger/fit-page-end',
    what: 'the stagger is never tightened, so near the end of the page the last paths stop part-drawn and onComplete never fires',
    file: 'src/core/engine.ts',
    from: '      if (room >= 0) staggerFit = Math.min(stagger, room / (gaps * range));\n',
    to: '',
    spec: 'stagger',
    grep: 'without room, the last path finishes where the page ends',
  },
  {
    id: 'stagger/offscreen-tail',
    what: 'the frames stop at trigger.end, where the drawing leaves the screen, so later staggered paths freeze short of 1 with the default trigger',
    file: 'src/core/engine.ts',
    // Re-anchored in 2.23.5: the frames follow a window that runs until the
    // last path is done (core/frame-gate), not the screen plus a tail.
    from: '    gEnd   = tStart + Math.max(0, span, len, span + len);',
    to: '    gEnd   = tStart + Math.max(0, len);',
    spec: 'stagger',
    grep: 'with the default trigger, the paths still drawing',
  },
  {
    id: 'stagger/resume-tail',
    what: 'resume() does not restart the frames, so a drawing resumed off screen mid-tail freezes',
    file: 'src/core/engine.ts',
    from: '      paused = false;\n      dirty  = true;\n      go();',
    to: '      paused = false;\n      dirty  = true;',
    spec: 'stagger',
    grep: 'paused and resumed off screen mid-tail',
  },
  {
    id: 'text/readable',
    what: 'scrollText splits without a screen-reader copy, so every piece is hidden and nothing is read',
    file: 'src/text/index.ts',
    from: '  else spans = splitIntoWords(el);\n  readable(el, text);',
    to: '  else spans = splitIntoWords(el);',
    spec: 'text',
    grep: 'keeps the sentence readable to assistive technology',
  },
  {
    id: 'pin/vh-follows',
    what: 'a vh pinDistance is resolved against the first viewport height and never again, as window.innerHeight * n was',
    file: 'src/pin/index.ts',
    from: "return (n * vh) / 100;",
    to: "return (n * 800) / 100;",
    spec: 'pin',
    grep: 'a vh pinDistance follows the viewport height',
  },
  {
    id: 'pin/vh-is-css',
    what: 'a vh pinDistance reads window.innerHeight, so a phone address bar sliding resizes the pin zone mid-scroll',
    file: 'src/pin/index.ts',
    from: "const vh = probe.offsetHeight || window.innerHeight;",
    to: "const vh = window.innerHeight;",
    spec: 'pin',
    grep: 'an address bar sliding leaves a vh pin alone',
  },
  {
    id: 'reduced-live/draw',
    what: 'scrollDraw reads reduced motion once at start-up, so turning it on mid-visit leaves the drawing moving',
    file: 'src/core/engine.ts',
    from: 'return finishWhenReduced(rawOptions, (options, reduced) => buildEngine(container, options, reduced));',
    to: "return buildEngine(container, rawOptions, matchMedia('(prefers-reduced-motion: reduce)').matches);",
    spec: 'motion-live',
    grep: 'finishes every effect at once',
  },
  {
    id: 'reduced-live/animate',
    what: 'the animate engine (reveal, parallax, the groups) reads reduced motion once, so cards stay hidden after it is turned on',
    file: 'src/animate/engine.ts',
    from: 'return finishWhenReduced(options, (opts, reduced) => buildAnimateEngine(el, opts, reduced));',
    to: "return buildAnimateEngine(el, options, matchMedia('(prefers-reduced-motion: reduce)').matches);",
    spec: 'motion-live',
    grep: 'finishes every effect at once',
  },
  {
    id: 'reduced-live/text',
    what: 'scrollText reads reduced motion once, so its words stay hidden after it is turned on',
    file: 'src/text/index.ts',
    from: 'return finishWhenReduced(options, (opts, reduced) => buildText(el, opts, reduced));',
    to: "return buildText(el, options, matchMedia('(prefers-reduced-motion: reduce)').matches);",
    spec: 'motion-live',
    grep: 'finishes every effect at once',
  },
  {
    id: 'reduced-live/counter',
    what: 'scrollCounter reads reduced motion once, so the number stays at its start after it is turned on',
    file: 'src/counter/index.ts',
    from: 'return finishWhenReduced(options, (opts, reduced) => buildCounter(raw, opts, reduced));',
    to: "return buildCounter(raw, options, matchMedia('(prefers-reduced-motion: reduce)').matches);",
    spec: 'motion-live',
    grep: 'finishes every effect at once',
  },
  {
    id: 'reduced-live/video',
    what: 'scrollVideo ignores reduced motion turned on mid-scrub and keeps scrubbing',
    file: 'src/video/index.ts',
    from: '    if (!reduced) return;\n    unwatchMotion();\n    prefersReduced = true;',
    to: '    if (reduced) return;\n    unwatchMotion();\n    prefersReduced = true;',
    spec: 'video',
    grep: 'reduced motion turned on mid-scrub stops on the end frame',
  },
  {
    id: 'reduced-live/cinematic',
    what: 'Cinematic ignores reduced motion turned on mid-story and keeps scrubbing',
    file: 'src/cinematic/index.ts',
    // Re-anchored in 2.23.7, when Cinematic moved onto core/frame-gate.
    from: '      if (!reduced) return;\n      unwatchMotion();\n      gate.off();',
    to: '      if (reduced) return;\n      unwatchMotion();\n      gate.off();',
    spec: 'cinematic',
    grep: 'reduced motion turned on mid-story',
  },
  {
    id: 'reduced-live/complete-once',
    what: 'an effect already at its end fires onComplete a second time when reduced motion is turned on',
    file: 'src/core/motion-live.ts',
    from: 'inst = build(finished ? { ...options, onComplete: undefined } : options, true);',
    to: 'inst = build(options, true);',
    spec: 'motion-live',
    grep: 'an effect already finished does not fire onComplete again',
  },
  {
    id: 'reduced-live/one-way',
    what: 'turning reduced motion off again rebuilds every effect with motion, hiding what the reader has seen',
    file: 'src/core/motion-live.ts',
    from: '    if (!reduced) return;\n    unwatch();\n    const finished = (inst.getProgress?.() ?? 0) >= 1;\n    inst.destroy();\n    inst = build(finished ? { ...options, onComplete: undefined } : options, true);',
    to: '    const finished = (inst.getProgress?.() ?? 0) >= 1;\n    inst.destroy();\n    inst = build(finished ? { ...options, onComplete: undefined } : options, reduced);',
    spec: 'motion-live',
    grep: 'turning it off again leaves everything finished',
  },
  {
    id: 'reduced-live/same-object',
    what: 'the page keeps the destroyed instance, so a replay() taken off it before the switch redraws from nothing',
    file: 'src/core/motion-live.ts',
    from: '  return live as T;',
    to: '  return inst;',
    spec: 'motion-live',
    grep: 'replay\\(\\) is ignored',
  },
  {
    id: 'reduced-live/aos',
    what: 'the AOS drop-in ignores reduced motion turned on after init(), so hidden elements stay hidden',
    file: 'src/aos/index.ts',
    from: '      if (!r) return;\n      unwatchMotion?.();\n      unwatchMotion = null;\n      reduced = true;\n      if (!started) return;',
    to: '      if (r) return;\n      unwatchMotion?.();\n      unwatchMotion = null;\n      reduced = true;\n      if (!started) return;',
    spec: 'aos',
    grep: 'reduced motion turned on after load shows everything at once',
  },
  {
    id: 'reduced-live/scrollreveal',
    what: 'the ScrollReveal drop-in notes reduced motion turned on but never applies it, so hidden elements stay hidden',
    file: 'src/scrollreveal/index.ts',
    from: '      motionReduced = true;\n      initialize();',
    to: '      motionReduced = true;',
    spec: 'scrollreveal',
    grep: 'reduced motion turned on after load shows every element at once',
  },
  {
    id: 'reduced-live/vivus',
    what: 'the vivus drop-in keeps drawing after reduced motion is turned on mid-play',
    file: 'src/vivus/index.ts',
    from: '      if (r && this.handle) this.endNow();',
    to: '      if (r && this.handle) void 0;',
    spec: 'vivus',
    grep: 'reduced motion turned on mid-play ends every drawing',
  },
  {
    id: 'autoplay-run/seek',
    what: 'autoplay seek() spans only `duration`, so seek(1) leaves the later paths of a staggered drawing part-drawn',
    file: 'src/core/engine.ts',
    from: '        pausedElapsed = clamped * runMs;',
    to: '        pausedElapsed = clamped * effectiveDuration;',
    spec: 'autoplay',
    grep: 'seek\\(1\\) draws every path',
  },
  {
    id: 'autoplay-run/length',
    what: 'the autoplay run is taken as `duration` again, ignoring the stagger tail, so seek() and getProgress() stop short',
    file: 'src/core/engine.ts',
    from: '      : effectiveDuration * (1 + Math.max(0, paths.length - 1) * stagger);',
    to: '      : effectiveDuration;',
    spec: 'autoplay',
    grep: 'seek\\(0.5\\) is half the whole run',
  },
  {
    id: 'once-raw/draw',
    what: 'scrollDraw once holds the eased value again, so elastic ends on its overshoot and bounce never dips',
    file: 'src/core/engine.ts',
    from: '      ? Math.max(frozenAlpha, easeFn(frozenPath[i] = Math.max(frozenPath[i] ?? 0, raw)))',
    to: '      ? (frozenPath[i] = Math.max(frozenPath[i] ?? frozenAlpha, easeFn(raw)))',
    spec: 'once-easing',
    grep: 'scrollDraw: once with elastic',
  },
  {
    id: 'once-raw/animate',
    what: 'scrollAnimate once holds the eased value again, so elastic ends past "to"',
    file: 'src/animate/engine.ts',
    from: '      ? Math.max(frozenAlpha, easeFn(frozenRaw = Math.max(frozenRaw, progress)))',
    to: '      ? (frozenAlpha = Math.max(frozenAlpha, easeFn(progress)))',
    spec: 'once-easing',
    grep: 'scrollAnimate: once with elastic',
  },
  {
    id: 'once-raw/counter',
    what: 'scrollCounter once holds the eased value again, so elastic ends past `to`',
    file: 'src/counter/index.ts',
    from: '      ? Math.max(frozenAlpha, easeFn(frozenRaw = Math.max(frozenRaw, progress)))',
    to: '      ? (frozenAlpha = Math.max(frozenAlpha, easeFn(progress)))',
    spec: 'once-easing',
    grep: 'scrollCounter: once with elastic',
  },
  {
    id: 'native-optout/autoplay',
    what: 'a plain autoplay config takes the native scroll timeline again and follows the scroll',
    file: 'src/core/engine.ts',
    from: '    if (autoplay) return false;\n',
    to: '',
    spec: 'autoplay',
    grep: 'with no callbacks',
  },
  {
    id: 'native-optout/debug',
    what: 'debug: true takes the native scroll timeline again and draws no trigger lines',
    file: 'src/core/engine.ts',
    // `&& IS_DEV` since 2.23.4: a production build keeps native. The debug
    // fixture defines the dev flag, so the test still sees the opt-out.
    from: '    if (debug && IS_DEV) return false;\n',
    to: '',
    spec: 'debug',
    grep: 'debug: true draws the trigger lines',
  },
  {
    id: 'container/scrollport',
    what: 'a scroll container is measured from its border box again, so a border moves every trigger',
    file: 'src/core/trigger-frame.ts',
    from: ' - scrollEl.clientTop + scrollEl.scrollTop',
    to: ' + scrollEl.scrollTop',
    spec: 'container-border',
    grep: 'bordered scroll container',
  },
  // ── 2.23.4 ──────────────────────────────────────────────────────────────────
  {
    id: 'animate-gate/scroll-wake',
    what: 'an IntersectionObserver on the animated element wakes the animate engine again, so a parallax layer its travel took out of its clip stays there',
    file: 'src/animate/engine.ts',
    // Re-anchored in 2.23.5: the scroll listener is core/frame-gate's. The
    // mutant runs the frames while the element's own box is on screen.
    from: '    () => computeProgress(scrollPos(), tStart, tEnd, Math.min(speed, 1)),\n    update,\n    cacheTriggers,',
    to: '    () => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? 0.5 : 0; },\n    update,\n    cacheTriggers,',
    spec: 'animate-gate',
    grep: 'a parallax layer keeps moving after its travel carries it out of its clip',
  },
  {
    id: 'replay-loop/animate',
    what: 'scrollAnimate replay() after pause() or seek() leaves the frames stopped',
    file: 'src/animate/engine.ts',
    from: '      // back. The next frame repaints from the scroll.\n      gate.hold(false);',
    to: '      // back. The next frame repaints from the scroll.',
    spec: 'animate-gate',
    grep: 'scrollAnimate replay\\(\\) restarts the frames',
  },
  {
    id: 'replay-loop/counter',
    what: 'scrollCounter replay() after pause() or seek() clears `paused` and leaves the loop stopped',
    file: 'src/counter/index.ts',
    from: '      resume();\n    },\n    pause: () => gate.hold(true),',
    to: '    },\n    pause: () => gate.hold(true),',
    spec: 'counter',
    grep: 'replay\\(\\) after pause\\(\\) counts with the scroll again',
  },
  {
    id: 'replay-loop/text',
    what: 'scrollText replay() after pause() or seek() clears `paused` and leaves the loop stopped',
    file: 'src/text/index.ts',
    from: '      resume();\n    },\n    pause: () => gate.hold(true),',
    to: '    },\n    pause: () => gate.hold(true),',
    spec: 'text',
    grep: 'replay\\(\\) after pause\\(\\) follows the scroll again',
  },
  {
    id: 'counter/destroy-var',
    what: 'scrollCounter destroy() leaves --scroll-draw-progress on the element',
    file: 'src/counter/index.ts',
    from: "      el.style.setProperty('--scroll-draw-progress', savedVar);\n",
    to: '',
    spec: 'counter',
    grep: 'destroy\\(\\) takes --scroll-draw-progress off the element',
  },
  {
    id: 'react/progress-container',
    what: 'useScrollDrawProgress adds the viewport top to the container scroll again, leaving out where the container sits',
    file: 'src/react/useScrollDrawProgress.ts',
    from: '      const frame = measureTriggerFrame(el, scrollEl, axis);',
    to: '      const frame = { ...measureTriggerFrame(el, null, axis), scroll: scrollPos() };',
    spec: 'react-extras',
    grep: 'reads 0 to 1 across its window',
  },
  {
    id: 'react/progress-layout',
    what: 'useScrollDrawProgress ignores layout changes that are not window resizes',
    file: 'src/react/useScrollDrawProgress.ts',
    from: '      tick,\n      cacheTriggers,\n    );',
    to: '      tick,\n      () => {},\n    );',
    spec: 'react-extras',
    grep: 'follows content that arrives above it',
  },
  {
    id: 'react/video-attrs',
    what: '<ScrollVideo> renders preload="auto" whatever the option says',
    file: 'src/react/index.tsx',
    from: "      preload={options.preload ?? 'auto'}",
    to: '      preload="auto"',
    spec: 'react-extras',
    grep: 'preload follows the option',
  },
  {
    id: 'snap/start-nearest',
    what: 'scrollSnap starts at section 0 wherever the page is, so a nudge on section 2 snaps to section 1',
    file: 'src/snap/index.ts',
    from: '  let currentIndex = nearest();',
    to: '  let currentIndex = 0;',
    spec: 'snap-edges',
    grep: 'created on section 2',
  },
  {
    id: 'snap/scrollport',
    what: 'scrollSnap measures a container from its border box again, so every snap lands a border past its section',
    file: 'src/snap/index.ts',
    from: "      ? scrollEl.getBoundingClientRect()[side] + scrollEl[isHorizontal ? 'clientLeft' : 'clientTop']",
    to: '      ? scrollEl.getBoundingClientRect()[side]',
    spec: 'snap-edges',
    grep: 'in a container with a border',
  },
  {
    id: 'snap/instant',
    what: 'scrollSnap writes its glide with the page’s scroll-behavior again, so smooth scrolling drags every frame behind',
    file: 'src/snap/index.ts',
    from: "      target.scrollTo({ ...to, behavior: 'instant' });",
    to: '      target.scrollTo(to);',
    spec: 'snap-edges',
    grep: 'scroll-behavior: smooth',
  },
  {
    id: 'snap/clamp',
    what: 'scrollSnap offsets past the end of the scroll range, so the last sections of a short page are sent back',
    file: 'src/snap/index.ts',
    from: 'clamp(el.getBoundingClientRect()[side] - origin + scroll, 0, max)',
    to: 'el.getBoundingClientRect()[side] - origin + scroll',
    spec: 'snap-edges',
    grep: 'ends sooner',
  },
  {
    id: 'snap/quirks',
    what: 'scrollSnap takes the page’s scroll range from the root in quirks mode again, so every snap goes to 0',
    file: 'src/snap/index.ts',
    from: '    const box    = scrollEl ?? document.scrollingElement ?? document.documentElement;',
    to: '    const box    = scrollEl ?? document.documentElement;',
    spec: 'snap-edges',
    grep: 'quirks mode',
  },
  {
    id: 'morph/dash-length',
    what: 'the dash is sized to the starting path only, so a morph to a longer outline ends open',
    file: 'src/core/engine.ts',
    from: '      len = Math.max(getElementLength(el), target);',
    to: '      len = getElementLength(el);',
    spec: 'morph',
    grep: 'drawn whole at progress 1',
  },
  {
    id: 'video/late-seek',
    what: 'a scrollVideo seek() made before the metadata loads is lost when it arrives',
    file: 'src/video/index.ts',
    from: '    if (paused) applyAlpha(currentAlpha);',
    to: '    if (paused) void 0;',
    spec: 'video',
    grep: 'a seek\\(\\) before the metadata arrives',
  },
  {
    id: 'draw/path-length',
    what: 'scrollDraw sizes the dash in user units on a path with a pathLength, so the line is drawn whole almost at once',
    file: 'src/core/geometry.ts',
    from: '  if (declared > 0) return declared;\n',
    to: '',
    spec: 'path-length',
    grep: 'draws exactly as the same line without it',
  },
  {
    id: 'text/code-points',
    what: "scrollText split: 'chars' cuts an emoji into two lone surrogates again",
    file: 'src/text/index.ts',
    from: '  for (const char of text) {',
    to: "  for (const char of text.split('')) {",
    spec: 'text',
    grep: 'keeps a character outside the BMP whole',
  },
  {
    id: 'text/word-box',
    what: "scrollText split: 'chars' lets a line break between any two letters again",
    file: 'src/text/index.ts',
    from: "      word.style.cssText = 'display:inline-block;white-space:nowrap';",
    to: '',
    spec: 'text',
    grep: 'breaks lines only at spaces',
  },
  {
    id: 'text/cjk-box',
    what: "scrollText split: 'chars' puts a line of Chinese in one word box again, so it never wraps",
    file: 'src/text/index.ts',
    from: "    if (gap || char > '\\u0dff') word = null;",
    to: '    if (gap) word = null;',
    spec: 'text',
    grep: 'a line of Chinese, which has no spaces',
  },
  {
    id: 'text/stagger-fit',
    what: 'scrollText staggers more units than fit the window, so the first shows at 0 and the last never show',
    file: 'src/text/index.ts',
    from: '  stagger = Math.min(stagger, 1 / total);\n',
    to: '',
    spec: 'text',
    grep: 'a line of many characters starts hidden and ends shown',
  },
  // ── 2.23.5 ──────────────────────────────────────────────────────────────────
  // Each engine but scrollAnimate ran its frames while an IntersectionObserver
  // saw the element, so a jump across the whole window painted nothing. Each
  // mutant puts that back for one engine: its frames run while its element is
  // on screen, as the observer had them.
  {
    id: 'gate/draw',
    what: 'scrollDraw (JS path) runs its frames only while the container is on screen, so a jump past it leaves it undrawn and onComplete never fires',
    file: 'src/core/engine.ts',
    // Re-anchored when the window became `at`, which a parked repeat reads too.
    from: '  const at = (): number => computeProgress(scrollPos(), gStart, gEnd, 1);',
    to: '  const at = (): number => { const r = container.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; };',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/counter',
    what: 'scrollCounter counts only while on screen, so a jump past it stays on its first number',
    file: 'src/counter/index.ts',
    from: '  const gate = frameGate(window, [el], at, update, cacheTriggers);',
    to: '  const gate = frameGate(window, [el], () => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; }, update, cacheTriggers);',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/text',
    what: 'scrollText reveals only while on screen, so a jump past it leaves the text hidden',
    file: 'src/text/index.ts',
    from: '  const gate = frameGate(window, [el], at, update, () => {',
    to: '  const gate = frameGate(window, [el], () => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; }, update, () => {',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/video',
    what: 'scrollVideo scrubs only while on screen, so a jump past it stays on its first frame',
    file: 'src/video/index.ts',
    from: '  const gate = frameGate(window, [measured], at, update, cacheTriggers);',
    to: '  const gate = frameGate(window, [measured], () => { const r = video.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; }, update, cacheTriggers);',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/progress',
    what: 'scrollProgress writes only while on screen, so a jump past it keeps the value from before',
    file: 'src/progress/index.ts',
    from: '    () => computeProgress(scrollPos(), tStart, tEnd, Math.min(speed, 1)),',
    to: '    () => { const r = htmlEl.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; },',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/timeline',
    what: 'scrollDrawTimeline draws only while on screen, so a jump past it leaves the tracks undrawn',
    file: 'src/timeline/index.ts',
    from: '      : computeProgress(scrollPos(), tStart, tEnd, Math.min(speed, 1));',
    to: '      : (() => { const r = container.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; })();',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/react',
    what: 'useScrollDrawProgress updates only while on screen, so a jump past it returns the value from before',
    file: 'src/react/useScrollDrawProgress.ts',
    from: '      () => computeProgress(scrollPos(), tStart, tEnd, Math.min(optsRef.current.speed ?? 1, 1)),',
    to: '      () => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; },',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    // 2.23.7: Cinematic was the last engine on an IntersectionObserver, on its
    // sticky stage. The mutant runs the frames while the stage is on screen.
    id: 'gate/cinematic',
    what: 'Cinematic scrubs only while its stage is on screen, so a jump past the story leaves it on its first frame',
    file: 'src/cinematic/index.ts',
    from: '    const gate = frameGate(sc || window, [mount], at, frame, measure);',
    to: '    const gate = frameGate(sc || window, [mount], () => { const r = stage.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; }, frame, measure);',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    // 2.23.7: on the frame gate the window was the only scroller, so a story in
    // a scrolling div or on a body-scroller page stayed on its first frame.
    id: 'cinematic/scroller',
    what: 'Cinematic assumes the window scrolls it, so a story in a scrolling div or a scrolling body never leaves its first frame',
    file: 'src/cinematic/index.ts',
    from: '        sc = n;\n        break;',
    to: '        sc = null as HTMLElement | null;\n        break;',
    spec: 'cinematic',
    grep: 'scrubs with its scroller',
  },
  {
    id: 'gate/leave-frame',
    what: 'a scroll wakes the frames only inside the window, so the frame that crosses it in one jump is never painted, for every engine',
    file: 'src/core/frame-gate.ts',
    from: '    if (!raf && !held && at() !== painted) raf = requestAnimationFrame(tick);',
    to: '    if (!raf && !held && at() !== painted && at() > 0 && at() < 1) raf = requestAnimationFrame(tick);',
    spec: 'engine-gate',
    grep: 'a jump to the end paints every last frame and completes',
  },
  {
    id: 'gate/idle',
    what: 'every scroll requests a frame for every engine, in its window or not',
    file: 'src/core/frame-gate.ts',
    from: '    if (!raf && !held && at() !== painted) raf = requestAnimationFrame(tick);',
    to: '    if (!raf && !held) raf = requestAnimationFrame(tick);',
    spec: 'idle',
    grep: 'scrolling above every window requests no frame and reads no layout',
  },
  {
    // The gate above had every repeat timer repaint wherever the scroll was;
    // past the window that frame is drawn whole, so it completed and started
    // the next timer: 60 frames and onComplete calls a second, at rest.
    id: 'gate/repeat',
    what: 'a scrollDraw repeat restarts past its window, so a page resting below it runs frames and onComplete forever',
    file: 'src/core/engine.ts',
    from: '      repeatTimer = setTimeout(() => { parked = true; }, repeatDelay);',
    to: '      repeatTimer = setTimeout(() => { restart(); go(); }, repeatDelay);',
    spec: 'engine-gate',
    grep: 'a jump past every window completes each once, then the page rests',
  },
  // scrollFrames: an image sequence scrubbed on a canvas.
  {
    id: 'frames/nearest',
    what: 'scrollFrames draws only the exact frame, so a scrub ahead of the loads keeps a stale frame',
    file: 'src/frames/index.ts',
    from: '    for (let d = 0; d <= last; d++) {',
    to: '    for (let d = 0; d <= 0; d++) {',
    spec: 'frames',
    grep: 'until the wanted frame arrives, the nearest loaded one shows',
  },
  {
    id: 'frames/draw-on-change',
    what: 'scrollFrames redraws the canvas on every frame at rest',
    file: 'src/frames/index.ts',
    from: '    if (show < 0 || show === drawn) return;',
    to: '    if (show < 0) return;',
    spec: 'frames',
    grep: 'draws only when the frame changes',
  },
  {
    id: 'frames/reduced-motion',
    what: 'scrollFrames under reduced motion loads the whole sequence to show its last frame',
    file: 'src/frames/index.ts',
    from: '  let order   = prefersReduced ? [last] : loadOrder(count);',
    to: '  let order   = loadOrder(count);',
    spec: 'frames',
    grep: 'reduced motion: requests only the last frame',
  },
  {
    id: 'reduced-live/frames',
    what: 'scrollFrames ignores reduced motion turned on mid-scrub and keeps scrubbing',
    file: 'src/frames/index.ts',
    from: '    if (!reduced) return;\n    unwatchMotion();\n    prefersReduced = true;',
    to: '    if (reduced) return;\n    unwatchMotion();\n    prefersReduced = true;',
    spec: 'frames',
    grep: 'reduced motion turned on mid-scrub stops on the last frame',
  },
  {
    id: 'frames/fit',
    what: "scrollFrames treats fit: 'contain' as cover, cropping the picture",
    file: 'src/frames/index.ts',
    from: "    const s  = (fit === 'contain' ? Math.min : Math.max)(cw / iw, ch / ih);",
    to: '    const s  = Math.max(cw / iw, ch / ih);',
    spec: 'frames',
    grep: 'contain fits inside the box',
  },
  {
    id: 'frames/dpr-cap',
    what: 'scrollFrames sizes the backing store at the full devicePixelRatio, 9x the pixels at 3x',
    file: 'src/frames/index.ts',
    from: '    const dpr = Math.min(window.devicePixelRatio || 1, 2);',
    to: '    const dpr = window.devicePixelRatio || 1;',
    spec: 'frames',
    grep: 'the ratio is capped at 2',
  },
  {
    id: 'frames/attr-sized',
    what: 'scrollFrames on a canvas sized by its own attributes grows every frame without end',
    file: 'src/frames/index.ts',
    from: '    if (w2 !== w || h2 !== h) {',
    to: '    if (false) {',
    spec: 'frames',
    grep: 'an unstyled canvas at 2x keeps its size',
  },
  {
    id: 'frames/after-destroy',
    what: 'scrollFrames resume() after destroy() restarts the frames for good',
    file: 'src/frames/index.ts',
    from: '    if (destroyed || !paused) return;',
    to: '    if (!paused) return;',
    spec: 'frames',
    grep: 'methods called after destroy\\(\\) leave it stopped',
  },
  {
    id: 'gate/frames',
    what: 'scrollFrames scrubs only while on screen, so a jump past it stays on its first frame',
    file: 'src/frames/index.ts',
    from: '  const gate = frameGate(window, [measured], at, update, () => {',
    to: '  const gate = frameGate(window, [measured], () => { const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? 0.5 : 0; }, update, () => {',
    spec: 'frames',
    grep: 'a jump past the whole window paints the last frame',
  },
  // <ScrollFrames> in React and Vue: when the film is rebuilt, and which
  // callback it calls. Each is caught by e2e/frames-wrappers.spec.ts.
  {
    id: 'frames-wrappers/react-url-key',
    what: 'React <ScrollFrames> keys a frames function as "a function", so new URLs at the same count keep the old film',
    file: 'src/react/index.tsx',
    from: "    framesKey(options) + (trackRef ? '+ref' : ''),",
    to: "    optionsKey(options) + (trackRef ? '+ref' : ''),",
    spec: 'frames-wrappers',
    grep: 'react <ScrollFrames>.*gives other URLs starts a new film',
  },
  {
    id: 'frames-wrappers/vue-url-key',
    what: 'Vue <ScrollFrames> keys a frames function as "a function", so new URLs at the same count keep the old film',
    file: 'src/vue/index.ts',
    from: '    }, startFrames, framesKey as (o: FramesInput) => string);',
    to: '    }, startFrames);',
    spec: 'frames-wrappers',
    grep: 'vue <ScrollFrames>.*gives other URLs starts a new film',
  },
  {
    id: 'frames-wrappers/identity-key',
    what: 'the <ScrollFrames> key changes on every render (as a frames function by identity would), so an inline frames={(i) => …} rebuilds the film and reloads every image',
    file: 'src/frames/wrapper.ts',
    from: '  return optionsKey({ ...options, frames: urls });',
    to: '  return optionsKey({ ...options, frames: urls }) + Math.random();',
    spec: 'frames-wrappers',
    grep: 'react <ScrollFrames>.*equal options keeps the film',
  },
  {
    id: 'frames-wrappers/react-live-callbacks',
    what: 'React <ScrollFrames> hands the film the first render\'s callbacks, so a later onProgress is never called',
    file: 'src/react/index.tsx',
    from: '    const instance = create(ref.current as never, liveFns(latest.current, () => latest.current));',
    to: '    const instance = create(ref.current as never, latest.current);',
    spec: 'frames-wrappers',
    grep: 'react <ScrollFrames>.*calls the latest callback',
  },
  {
    id: 'frames-wrappers/vue-live-callbacks',
    what: 'Vue <ScrollFrames> hands the film the first render\'s callbacks, so a later onProgress is never called',
    file: 'src/vue/index.ts',
    from: '    instance = el.value ? create(el.value, liveFns(latest, () => latest), latest) : null;',
    to: '    instance = el.value ? create(el.value, latest, latest) : null;',
    spec: 'frames-wrappers',
    grep: 'vue <ScrollFrames>.*calls the latest callback',
  },
  // scrollFrames in Svelte, Solid and Angular (2.26.0): the same two rules, and
  // that the film stops with the action or the class. Each is caught by
  // e2e/frames-wrappers.spec.ts.
  {
    id: 'frames-wrappers/svelte-url-key',
    what: 'scrollFramesAction keys a frames function as "a function", so new URLs at the same count keep the old film',
    file: 'src/svelte/index.ts',
    from: '  return action(node, options, startFrames, framesKey);',
    to: '  return action(node, options, startFrames);',
    spec: 'frames-wrappers',
    grep: 'svelte scrollFramesAction.*gives other URLs starts a new film',
  },
  {
    id: 'frames-wrappers/solid-url-key',
    what: 'useScrollFrames keys a frames function as "a function", so new URLs at the same count keep the old film',
    file: 'src/solid/index.ts',
    from: '  }, framesKey);',
    to: '  });',
    spec: 'frames-wrappers',
    grep: 'solid useScrollFrames.*gives other URLs starts a new film',
  },
  {
    id: 'frames-wrappers/angular-url-key',
    what: 'ScrollFramesRef keys a frames function as "a function", so new URLs at the same count keep the old film',
    file: 'src/angular/index.ts',
    from: '  constructor() { super(startFrames, framesKey); }',
    to: '  constructor() { super(startFrames); }',
    spec: 'frames-wrappers',
    grep: 'angular ScrollFramesRef.*gives other URLs starts a new film',
  },
  {
    id: 'frames-wrappers/svelte-live-callbacks',
    what: 'the Svelte action hands the film the first parameter\'s callbacks, so a later onProgress is never called',
    file: 'src/svelte/index.ts',
    from: '  let instance = create(node, liveFns(options, () => latest), options);',
    to: '  let instance = create(node, options, options);',
    spec: 'frames-wrappers',
    grep: 'svelte scrollFramesAction.*calls the latest callback',
  },
  {
    id: 'frames-wrappers/solid-live-callbacks',
    what: 'the Solid primitive hands the film the first run\'s callbacks, so a later onProgress is never called',
    file: 'src/solid/index.ts',
    from: '      instance = create(el!, liveFns(latest, () => latest), latest);',
    to: '      instance = create(el!, latest, latest);',
    spec: 'frames-wrappers',
    grep: 'solid useScrollFrames.*calls the latest callback',
  },
  {
    id: 'frames-wrappers/angular-live-callbacks',
    what: 'the Angular ref class hands the film init()\'s callbacks, so a later onProgress is never called',
    file: 'src/angular/index.ts',
    from: '    this.instance = this.create(element, liveFns(options, () => this.latest), options);',
    to: '    this.instance = this.create(element, options, options);',
    spec: 'frames-wrappers',
    grep: 'angular ScrollFramesRef.*calls the latest callback',
  },
  {
    id: 'frames-wrappers/svelte-destroy',
    what: 'the Svelte action\'s destroy() leaves the film running after the canvas is gone',
    file: 'src/svelte/index.ts',
    from: '    destroy() {\n      instance.destroy();\n    },',
    to: '    destroy() {},',
    spec: 'frames-wrappers',
    grep: 'svelte scrollFramesAction.*unmounting stops the film',
  },
  {
    id: 'frames-wrappers/angular-destroy',
    what: "ScrollFramesRef's destroy() forgets the film without stopping it",
    file: 'src/angular/index.ts',
    from: '    this.instance?.destroy();\n    this.instance = this.el = null;',
    to: '    this.instance = this.el = null;',
    spec: 'frames-wrappers',
    grep: 'angular ScrollFramesRef.*unmounting stops the film',
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

/*
 * --anchors: every mutation still applies to its file, checked in a second
 * without building anything. A full run takes hours, so it is rare, and 2.21.0
 * left two anchors on an aria-label it had removed; `verify` runs this so the
 * next refactor that moves an anchor says so at once. (Test names are not
 * checked here: -g matches the full title path, describe blocks included,
 * which only Playwright can resolve.)
 */
if (args.includes('--anchors')) {
  const broken = selected.filter((m) => readFileSync(join(ROOT, m.file), 'utf8').split(m.from).length - 1 !== 1);
  for (const m of broken) console.error(`✗ ${m.id}: its anchor no longer appears exactly once in ${m.file}`);
  console.log(`${selected.length} mutation(s): ${broken.length ? `${broken.length} anchor(s) broken` : 'every anchor applies once'}.`);
  process.exit(broken.length ? 1 : 0);
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
