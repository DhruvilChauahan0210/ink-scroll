import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { PARALLAX_DEFAULTS, PARALLAX_LAYERS, type LayerKey, type LayerSetting, type LayerSettings } from '@/data/parallax';
import { SCENE_ART, SCENE_LABEL, SCENE_VIEW, type ArtShape } from './ParallaxScene';

/**
 * Everything the parallax scrolling generator writes, from the layer settings,
 * with every option at scrollParallax's default left out:
 *
 * - jsCode, reactCode and parallaxHtml(…, false): the three code tabs, each
 *   with the source line.
 * - parallaxHtml(…, true): the HTML tab's page with the generator's drawing in
 *   each layer, for Download and Open in StackBlitz; the library from jsDelivr.
 * - reactProject: the React tab's component as plain JSX, its layers drawn,
 *   inside an App with room to scroll, for the React project on StackBlitz.
 */

export const SLUG = 'parallax-scrolling-generator';

const KEYS = PARALLAX_LAYERS.map((l) => l.key);

const fmt = (n: number) => String(Math.round(n * 100) / 100);

const WHAT: Record<LayerKey, string> = {
  sky: 'sun and clouds',
  mountains: 'the far ridge',
  hills: 'the near hills',
  ground: 'the foreground',
};

/** The options that differ from scrollParallax's defaults, as an object literal, or null for none. */
function optionText(l: LayerSetting): string | null {
  const out: string[] = [];
  if (l.speed !== PARALLAX_DEFAULTS.speed) out.push(`speed: ${fmt(l.speed)}`);
  if (l.axis !== PARALLAX_DEFAULTS.axis) out.push(`axis: '${l.axis}'`);
  return out.length ? `{ ${out.join(', ')} }` : null;
}

/** One line per layer: a call, or why there is none. */
function calls(s: LayerSettings, target: (k: LayerKey) => string, indent: string, end: string): string[] {
  return KEYS.map((k) => {
    if (s[k].speed === 0) return `${indent}// #${k}: at speed 0 it moves with the page, so no call.`;
    const o = optionText(s[k]);
    const call = `${indent}scrollParallax(${target(k)}${o ? `, ${o}` : ''})${end}`;
    return o ? call : `${call} // speed ${PARALLAX_DEFAULTS.speed}, the default`;
  });
}

const moves = (s: LayerSettings) => KEYS.some((k) => s[k].speed !== 0);

const NOTHING = 'Every layer is at speed 0, so each one moves with the page: there is nothing to call.';
const DEPTH = '// Negative speeds lag behind the page (far), positive ones run ahead (near).';

// ── The drawing, written out ─────────────────────────────────────────────────

/** A shape's attributes, in the order the page draws them. */
const attrs = (p: ArtShape, cls: string) => {
  const c = p.cls ? `${cls}="${p.cls}" ` : '';
  return p.tag === 'circle' ? `${c}cx="${p.cx}" cy="${p.cy}" r="${p.r}"` : `${c}d="${p.d}"`;
};

/** One layer's SVG, as HTML or as JSX, each line prefixed with `indent`. */
function svgOf(key: LayerKey, jsx: boolean, indent: string): string {
  const cls = jsx ? 'className' : 'class';
  const cap = jsx ? 'strokeLinecap="round" strokeLinejoin="round"' : 'stroke-linecap="round" stroke-linejoin="round"';
  return [
    `<svg ${cls}="${key}" viewBox="${SCENE_VIEW.viewBox}" preserveAspectRatio="${SCENE_VIEW.fit}" aria-hidden="true" focusable="false">`,
    `  <g fill="none" stroke="currentColor" ${cap}>`,
    ...SCENE_ART[key].map((p) => `    <${p.tag} ${attrs(p, cls)} />`),
    '  </g>',
    '</svg>',
  ].map((l) => indent + l).join('\n');
}

// ── CSS ──────────────────────────────────────────────────────────────────────

/** The scene and its layers: what the HTML tab gives every page. */
const SCENE_CSS = `.scene {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 12 / 5;
  overflow: hidden;      /* the layers travel past its edges */
  background: #fbfaf6;
}
@media (max-width: 599px) {
  .scene { aspect-ratio: 3 / 2; }
}
.layer {
  position: absolute;
  inset: 0;              /* as big as the scene: speed is a share of it */
  will-change: transform;
}
/* Speed is a share of the layer's own size: draw its art past
   its edges, so the layer that moves furthest never shows a gap. */`;

/** Room to scroll: a screen above the scene and one below, its whole window. */
const PAGE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #1c1c20;
  background: #f1f0eb;
}
.spacer {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  color: #6b6b70;
}`;

/** The drawing's ink: line art in currentColor, set per layer, and fills of the scene's colour. */
const ART_CSS = `/* The drawing: lines in currentColor, near layers darker. */
.layer svg { display: block; width: 100%; height: 100%; overflow: visible; }
.layer path, .layer circle { stroke-width: 1.25; vector-effect: non-scaling-stroke; }
.layer .fill { fill: #fbfaf6; }
.layer .thin { stroke-width: 1; opacity: 0.7; }
.layer .dash { stroke-dasharray: 2 7; }
svg.sky, svg.mountains { color: #8b8b91; }
svg.hills { color: #55555b; }
svg.ground { color: #1c1c20; }
svg.sky .sun { color: #55555b; stroke-width: 1.5; }
svg.ground path { stroke-width: 1.4; }
@media (prefers-reduced-motion: reduce) {
  .layer { will-change: auto; }
}`;

// ── JavaScript ───────────────────────────────────────────────────────────────

/** The JavaScript tab. */
export function jsCode(s: LayerSettings): string {
  if (!moves(s)) return withSource(`// ${NOTHING}`, SLUG, 'js');
  return withSource(
    `import { scrollParallax } from 'svg-scroll-draw';

// One call per layer; the markup and CSS are in the HTML tab.
${DEPTH}
${calls(s, (k) => `'#${k}'`, '', ';').join('\n')}`,
    SLUG,
    'js',
  );
}

// ── React ────────────────────────────────────────────────────────────────────

/**
 * The ParallaxScene component: typed, with a comment where each layer's art
 * goes, for the React tab; or plain JSX with the drawing in, for the App.
 */
function reactComponent(s: LayerSettings, ts: boolean, art: boolean): string {
  const live = KEYS.filter((k) => s[k].speed !== 0);
  const css = art ? 'styles.css' : 'the HTML tab';
  const scene = art ? `<div className="scene" role="img" aria-label="${escapeHtml(SCENE_LABEL)}">` : '<div className="scene">';
  const markup = KEYS.map((k) => {
    const open = live.includes(k) ? `<div ref={${k}} className="layer">` : '<div className="layer">';
    if (art) return `      ${open}\n${svgOf(k, true, '        ')}\n      </div>`;
    return live.includes(k)
      ? `      ${open}{/* ${WHAT[k]} */}</div>`
      : `      ${open}{/* ${WHAT[k]}: speed 0, moves with the page */}</div>`;
  }).join('\n');
  if (!live.length) {
    return `// The CSS for .scene and .layer is in ${css}.
export function ParallaxScene() {
  // ${NOTHING}
  return (
    ${scene}
${markup}
    </div>
  );
}`;
  }
  const refs = live.map((k) => `  const ${k} = useRef${ts ? '<HTMLDivElement>' : ''}(null);`).join('\n');
  const made = calls(s, (k) => `${k}.current${ts ? '!' : ''}`, '      ', ',')
    .filter((l) => !l.trimStart().startsWith('//'))
    .join('\n');
  return `import { useEffect, useRef } from 'react';
import { scrollParallax } from 'svg-scroll-draw';

// svg-scroll-draw/react has no parallax component: call scrollParallax
// in an effect, and destroy every layer when the component unmounts.
// The CSS for .scene and .layer is in ${css}.
export function ParallaxScene() {
${refs}

  useEffect(() => {
    const layers = [
${made}
    ];
    return () => layers.forEach((layer) => layer.destroy());
  }, []);

  return (
    ${scene}
${markup}
    </div>
  );
}`;
}

/** The React tab: a client component for the App Router or any React app. */
export function reactCode(s: LayerSettings): string {
  const component = reactComponent(s, true, false);
  return withSource(moves(s) ? `'use client';\n\n${component}` : component, SLUG, 'tsx');
}

/** The React tab's component, drawn, in an App with a screen to scroll above and below it. */
export function reactProject(s: LayerSettings, version: string): Omit<ReactProject, 'title'> {
  const app = `${reactComponent(s, false, true)}

export default function App() {
  return (
    <>
      <div className="spacer">Scroll down</div>
      <ParallaxScene />
      <div className="spacer">End of the page</div>
    </>
  );
}
`;
  return { slug: SLUG, app, css: `${PAGE_CSS}\n${SCENE_CSS}\n${ART_CSS}\n`, version };
}

// ── HTML ─────────────────────────────────────────────────────────────────────

/**
 * The HTML tab: a whole page, the scene between two screens of room to scroll,
 * the library from jsDelivr pinned to `version`. With `art`, each layer holds
 * the generator's drawing instead of a comment where yours goes: the file
 * Download saves and StackBlitz opens.
 */
export function parallaxHtml(s: LayerSettings, version: string, art: boolean): string {
  const layers = KEYS.map((k) =>
    art
      ? `  <div id="${k}" class="layer">\n${svgOf(k, false, '    ')}\n  </div>`
      : `  <div id="${k}" class="layer"><!-- ${WHAT[k]} --></div>`,
  );
  const scene = art ? `<div class="scene" role="img" aria-label="${escapeHtml(SCENE_LABEL)}">` : '<div class="scene">';
  const body = [
    '<div class="spacer">Scroll down</div>',
    '',
    '<!-- The layers move while the scene crosses the window: from its top',
    '     reaching the bottom of the window to its bottom leaving the top. -->',
    ...(moves(s) ? [] : [`<!-- ${NOTHING} -->`]),
    scene,
    ...layers,
    '</div>',
    '',
    '<div class="spacer">End of the page</div>',
  ].join('\n');
  return htmlFile({
    slug: SLUG,
    title: 'Parallax scrolling',
    css: art ? `${PAGE_CSS}\n${SCENE_CSS}\n${ART_CSS}` : `${PAGE_CSS}\n${SCENE_CSS}`,
    body,
    script: moves(s)
      ? `import { scrollParallax } from '${cdnModule(version)}';

${DEPTH}
${calls(s, (k) => `'#${k}'`, '', ';').join('\n')}`
      : undefined,
  });
}
