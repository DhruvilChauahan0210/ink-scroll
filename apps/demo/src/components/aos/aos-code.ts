/**
 * What the AOS gallery (/aos-animation) hands out: one specimen's markup for
 * the copy button, and a whole page of every effect for the Run it row. Both
 * carry the gallery's current duration and easing, so what is copied or
 * downloaded does what the specimens on the page do.
 *
 * Client-safe: plain data and string building, no Node APIs.
 */
import { AOS_EFFECT_COUNT, AOS_FAMILIES } from '@/data/aos-effects';
import { cdnModule, escapeHtml, htmlFile, withSource } from '@/lib/tool-export';

export const AOS_SLUG = 'aos-animation';

/** AOS's own defaults, left out of what the gallery writes. */
const AOS_DEFAULT_DURATION = 400;
const AOS_DEFAULT_EASING = 'ease';

export type AosTiming = { duration: number; easing: string };

/** One specimen's markup, its timing as attributes (defaults left out), under the source line. */
export function specimenMarkup(name: string, { duration, easing }: AosTiming): string {
  const attrs = [
    duration !== AOS_DEFAULT_DURATION ? ` data-aos-duration="${duration}"` : '',
    easing !== AOS_DEFAULT_EASING ? ` data-aos-easing="${easing}"` : '',
  ].join('');
  return withSource(`<div data-aos="${name}"${attrs}></div>`, AOS_SLUG, 'html');
}

/** The AOS.init() call for the timing: the options for the whole page, defaults left out. */
function initCall({ duration, easing }: AosTiming): string {
  const opts = [
    duration !== AOS_DEFAULT_DURATION ? `duration: ${duration}` : '',
    easing !== AOS_DEFAULT_EASING ? `easing: '${easing}'` : '',
  ].filter(Boolean);
  return `AOS.init(${opts.length ? `{ ${opts.join(', ')} }` : ''});`;
}

const CSS = `:root {
  color-scheme: light dark;
  --bg: #fafafa; --fg: #161616; --fg-2: #5c5c5c; --line: #d6d6d6; --panel: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0e0e0e; --fg: #ededed; --fg-2: #9a9a9a; --line: #333333; --panel: #181818; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
header { display: grid; place-content: center; min-height: 100vh; padding: 24px 16px; text-align: center; }
h1 { margin: 0 0 8px; font-size: clamp(28px, 6vw, 44px); font-weight: 500; }
header p { margin: 0; color: var(--fg-2); }
main { max-width: 1040px; margin: 0 auto; padding: 0 16px 60vh; }
section { margin-top: 64px; }
h2 { margin: 0 0 4px; font-size: 20px; font-weight: 500; }
section > p { margin: 0 0 16px; max-width: 62ch; color: var(--fg-2); font-size: 14px; }
ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
li { border: 1px solid var(--line); }
/* The stage clips the slides, which move their own full size. */
.stage { display: grid; place-items: center; aspect-ratio: 4 / 3; padding: 20px; overflow: hidden; }
.card { display: grid; gap: 8px; width: min(100%, 120px); padding: 14px; border: 1px solid var(--line); background: var(--panel); }
.card::before { content: ''; height: 8px; width: 60%; background: var(--fg-2); }
.card::after { content: ''; height: 4px; background: var(--line); }
code { display: block; padding: 8px 12px; border-top: 1px solid var(--line); font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }`;

/**
 * A page of every effect at the gallery's timing, on the AOS drop-in from
 * jsDelivr pinned to `version`. The header fills the first screen, so every
 * effect scrolls in rather than playing at load (and none sits on screen when
 * init() adds the styles that hide it), and the space under the last row lets
 * it scroll well past its trigger.
 */
export function aosHtml(timing: AosTiming, version: string): string {
  const { duration, easing } = timing;
  const sections = AOS_FAMILIES.flatMap((f) => [
    `<section>`,
    `  <h2>${f.title} · ${f.effects.length}</h2>`,
    `  <p>${escapeHtml(f.note)}</p>`,
    `  <ul>`,
    ...f.effects.map((name) => `    <li><div class="stage"><div class="card" data-aos="${name}"></div></div><code>${name}</code></li>`),
    `  </ul>`,
    `</section>`,
  ]).map((l) => `  ${l}`).join('\n');
  const custom = duration !== AOS_DEFAULT_DURATION || easing !== AOS_DEFAULT_EASING;
  return htmlFile({
    slug: AOS_SLUG,
    title: 'AOS animation',
    css: CSS,
    body: `<header>
  <h1>Every AOS effect</h1>
  <p>${AOS_EFFECT_COUNT} data-aos effects, ${duration} ms, ${easing}. Scroll down; scroll back up and each one hides again.</p>
</header>
<main>
${sections}
</main>`,
    script: `import AOS from '${cdnModule(version, 'aos')}';

// The AOS drop-in: AOS's markup and API, with the styles inside the module.
// ${custom
    ? 'These options apply to every element; data-aos-duration or data-aos-easing on one element wins.'
    : 'AOS’s defaults, 400 ms and ease; data-aos-duration or data-aos-easing on one element changes it.'}
${initCall(timing)}`,
  });
}
