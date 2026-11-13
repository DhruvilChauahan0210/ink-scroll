/**
 * Every tool's "Run it" page, built the way the tool builds it for its first
 * view: the same settings the component starts with, through the same code
 * module. scripts/test-tools.mjs bundles this file with esbuild and runs it in
 * Chromium, because several tools read the drawing with DOMParser and measure
 * it laid out (getTotalLength, getBBox) before they write the page.
 *
 * Each key is a slug from data/tools.ts, or `slug:variant` for a second output
 * a reader can switch to (a CSS-only file, a line wave, a wrapped component).
 * Where a start value lives in a component (a useState default), it is copied
 * here with the component named, so a change there is a change here.
 */
import { TOOL_GROUPS } from '@/data/tools';
import { COUNTER_INITIAL } from '@/data/counter';
import { PARALLAX_PRESETS } from '@/data/parallax';
import { REVEAL_DEFAULTS } from '@/data/reveal';
import { readTrigger } from '@/data/trigger';
import { sanitizeSvg } from '@/lib/svg-sanitize';

import { aosHtml } from '@/components/aos/aos-code';
import { bezierHtml } from '@/components/bezier/code';
import { presetByKey } from '@/components/bezier/presets';
import { blobGeometry, DEFAULTS as BLOB_DEFAULTS } from '@/components/blob/blob';
import { htmlPage as blobPage } from '@/components/blob/code';
import { resolve as counterResolve, runnableHtml as counterHtml } from '@/components/counter/code';
import { runnable as cssDrivenRunnable } from '@/components/cssdriven/code';
import { DEFAULTS as EASING_DEFAULTS, easingHtml, rangeOf } from '@/components/easing/code';
import { curveStats, factoryCurve, NAMED } from '@/data/easing';
import { buildOutput as hwOutput, DEFAULTS as HW_DEFAULTS, htmlPage as hwPage } from '@/components/handwriting/code';
import { cssOnlyFile as hzCssOnly, DEFAULTS as HZ_DEFAULTS, jsFile as hzJs } from '@/components/horizontal/code';
import { cssOnlyFile as mqCssOnly, DEFAULTS as MQ_DEFAULTS, jsFile as mqJs } from '@/components/marquee/code';
import { markup as jsxMarkup, htmlPage as jsxPage } from '@/components/jsx/run';
import { readSvg } from '@/components/jsx/read-svg';
import { WRAP_DEFAULTS } from '@/components/jsx/convert';
import { SAMPLE as JSX_SAMPLE, SAMPLE_NAME as JSX_NAME } from '@/components/jsx/sample';
import { INITIAL as KEYFRAMES_INITIAL, runnable as keyframesRunnable } from '@/components/keyframes/code';
import { buildOutput, DEFAULTS as LINE_DEFAULTS, htmlPage as linePage, measure, toTree } from '@/components/linedraw/generate';
import { SAMPLE as LINE_SAMPLE } from '@/components/linedraw/sample';
import { htmlPage as morphPage, type Settings as MorphSettings } from '@/components/morph/code';
import {
  bounds as morphBounds, compatibility, lettersOf, matchShapes, num as morphNum, parsePath as morphParse, skeleton,
  toD as morphD, tokenize,
} from '@/components/morph/path-morph';
import { DEFAULT_PAIR, presetOf } from '@/components/morph/shapes';
import { parallaxHtml } from '@/components/parallax/parallax-code';
import { htmlPage as pathPage } from '@/components/pathedit/code';
import { bounds as pathBounds, geometry, num as pathNum, parsePath, placesOf, writeD } from '@/components/pathedit/path-data';
import { DEFAULT_SAMPLE } from '@/components/pathedit/samples';
import { cssOnlyFile as pinCssOnly, jsFile as pinJs, PIN_DEFAULTS } from '@/components/pin/pin-code';
import { cssOnlyFile as stackCssOnly, jsFile as stackJs, STACK_DEFAULTS } from '@/components/stackcards/stack-code';
import { DEFAULTS as BAR_DEFAULTS, runnable as barRunnable } from '@/components/progressbar/code';
import { revealHtml } from '@/components/reveal/reveal-code';
import { drawPlan, htmlPage as s2pPage, markup as s2pMarkup, staggerFor, writeDrawings } from '@/components/shape2path/code';
import { convertSvg } from '@/components/shape2path/convert-svg';
import { SHAPE_TAGS } from '@/components/shape2path/convert';
import { SAMPLE as S2P_SAMPLE } from '@/components/shape2path/sample';
import { DEFAULTS as SNAP_DEFAULTS, runnable as snapRunnable } from '@/components/snap/snap-code';
import { htmlPage as viewerPage, staggers, writeDrawing } from '@/components/svg-tool/code';
import { runnableHtml as textGenHtml } from '@/components/text-gen/code';
import { INITIAL as TEXTFILL_INITIAL, runnableHtml as textFillHtml } from '@/components/textfill/model';
import { triggerHtml } from '@/components/trigger/code';
import { INITIAL as TYPEWRITER_INITIAL, runnableHtml as typewriterHtml } from '@/components/typewriter/model';
import { DEFAULTS as SCRUB_DEFAULTS, FILM_SOURCE, scrubFile } from '@/components/videoscrub/scrub-code';
import { DEFAULTS as FRAMES_DEFAULTS, DEMO_SEQUENCE, framesFile, videoSequence } from '@/components/frames/frames-code';
import { buildWave, htmlPage as wavePage, type WaveSettings } from '@/components/wave/wave';

export const slugs: string[] = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.slug));

/** Put `svg` in the document, so it can be measured, and hand it back. */
function mount<T extends Element>(svg: T): T {
  document.body.appendChild(svg);
  return svg;
}

/**
 * A drawing of our own for the SVG path viewer: its sample is a licensed file
 * the tool will not export. Two shapes and a path of two pieces, no strokes,
 * so Line view has to add them and split the path.
 */
const VIEWER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <rect x="10" y="10" width="80" height="60" fill="#333" />
  <circle cx="140" cy="45" r="35" fill="#333" />
  <path d="M10 100 L190 100 M10 110 L190 110" fill="#333" />
</svg>`;

export function build(version: string): Record<string, string> {
  const out: Record<string, string> = {};

  // ── Generators ────────────────────────────────────────────────────────────
  // TextGenerator.tsx INITIAL
  out['text-animation-generator'] = textGenHtml(
    { text: 'Every word arrives as you scroll', split: 'words', effect: 'fade-up', stagger: 0.08, easing: 'ease-out', once: true },
    version,
  );
  out['text-fill-scroll-generator'] = textFillHtml(TEXTFILL_INITIAL, version);
  out['text-fill-scroll-generator:progress'] = textFillHtml({ ...TEXTFILL_INITIAL, engine: 'progress' }, version);
  out['text-fill-scroll-generator:text'] = textFillHtml({ ...TEXTFILL_INITIAL, engine: 'text' }, version);
  out['typewriter-effect-generator'] = typewriterHtml(TYPEWRITER_INITIAL, version);
  out['typewriter-effect-generator:scroll'] = typewriterHtml({ ...TYPEWRITER_INITIAL, mode: 'scroll' }, version);
  out['typewriter-effect-generator:typer'] = typewriterHtml({ ...TYPEWRITER_INITIAL, mode: 'typer' }, version);
  out['counter-animation-generator'] = counterHtml(COUNTER_INITIAL, counterResolve(COUNTER_INITIAL), version);
  // RevealGenerator.tsx: the defaults give no options; the perspective is on for a flip.
  out['scroll-reveal-generator'] = revealHtml({}, ['flip', 'flipX'].includes(REVEAL_DEFAULTS.preset), version);
  out['parallax-scrolling-generator'] = parallaxHtml(PARALLAX_PRESETS[0].layers, version, true);
  // ProgressBarGenerator.tsx starts on the JavaScript tab.
  out['scroll-progress-bar-generator'] = barRunnable(BAR_DEFAULTS, 'js', version).html;
  out['scroll-progress-bar-generator:css'] = barRunnable(BAR_DEFAULTS, 'css', version).html;
  // CssDrivenGenerator.tsx INITIAL, on the CSS tab.
  const cssDriven = {
    preset: 'fade-up', amount: 40, clip: 'left', easing: 'ease-out',
    start: { name: 'entry', pct: 0 }, end: { name: 'cover', pct: 50 }, dir: 'in', fallback: 'none',
  } as Parameters<typeof cssDrivenRunnable>[0];
  out['css-scroll-driven-animation-generator'] = cssDrivenRunnable(cssDriven, 'css', version).html;
  out['css-scroll-driven-animation-generator:js'] = cssDrivenRunnable(cssDriven, 'js', version).html;
  out['css-keyframes-animation-generator'] = keyframesRunnable(KEYFRAMES_INITIAL, 'css', version).html;
  out['css-scroll-snap-generator'] = snapRunnable(SNAP_DEFAULTS, 'css', version).html;
  out['css-scroll-snap-generator:js'] = snapRunnable(SNAP_DEFAULTS, 'js', version).html;
  out['horizontal-scroll-generator'] = hzJs(HZ_DEFAULTS, version);
  out['horizontal-scroll-generator:css'] = hzCssOnly(HZ_DEFAULTS);
  out['scroll-marquee-generator'] = mqJs(MQ_DEFAULTS, version);
  out['scroll-marquee-generator:css'] = mqCssOnly(MQ_DEFAULTS);
  out['scroll-pin-generator'] = pinJs(PIN_DEFAULTS, version);
  out['scroll-pin-generator:css'] = pinCssOnly(PIN_DEFAULTS);
  // StackingCardsGenerator.tsx starts on its CSS only tab, so that is the main page.
  out['stacking-cards-scroll-generator'] = stackCssOnly(STACK_DEFAULTS);
  out['stacking-cards-scroll-generator:js'] = stackJs(STACK_DEFAULTS, version);
  out['scroll-video-scrub-generator'] = scrubFile(SCRUB_DEFAULTS, FILM_SOURCE, version);
  // FramesGenerator.tsx: the demo, which draws its own frames in the page.
  out['scroll-image-sequence-generator'] = framesFile(FRAMES_DEFAULTS, DEMO_SEQUENCE, version);
  // Frames drawn from a video: the page loads frames/frame_0001.webp … beside it (test-tools serves them).
  out['scroll-image-sequence-generator:video'] = framesFile(
    { ...FRAMES_DEFAULTS, pin: false, preset: 'pass', fit: 'contain', easing: 'ease-in-out' },
    videoSequence(24, '.webp', 320, 240),
    version,
  );

  // CubicBezierGenerator.tsx: easeOutBack against CSS ease, 1000ms.
  const bezier = presetByKey('named:easeOutBack')?.v ?? [0.34, 1.56, 0.64, 1];
  out['cubic-bezier-generator'] = bezierHtml({ v: bezier, cmp: presetByKey('css:ease')?.v ?? null, ms: 1000, version });

  // ── SVG tools ─────────────────────────────────────────────────────────────
  {
    const parsed = sanitizeSvg(VIEWER_SVG);
    if (!parsed.ok) throw new Error(`svg-path-viewer: ${parsed.error}`);
    const svg = mount(parsed.svg.cloneNode(true) as SVGSVGElement);
    const { measured, written } = writeDrawing(svg, parsed.wasBarePath, true);
    svg.remove();
    out['svg-path-viewer'] = viewerPage(written.drawn, staggers(measured), version);
  }
  {
    // PathEditor.tsx: the first sample, auto stroke width, round caps.
    const doc = parsePath(DEFAULT_SAMPLE.d).segs;
    const box = pathBounds(geometry(doc));
    if (!box) throw new Error('svg-path-editor: the sample has no bounds');
    const size = Math.max(box.w, box.h);
    const strokeWidth = size <= 48 ? 2 : Math.max(1, Math.round(size / 80));
    const k = 10 ** Math.min(2, placesOf(doc));
    const x = Math.floor((box.x - strokeWidth) * k) / k;
    const y = Math.floor((box.y - strokeWidth) * k) / k;
    const w = Math.ceil((box.x + box.w + strokeWidth - x) * k) / k;
    const h = Math.ceil((box.y + box.h + strokeWidth - y) * k) / k;
    const viewBox = [x, y, w, h].map(pathNum).join(' ');
    out['svg-path-editor'] = pathPage({ d: writeD(doc), viewBox, strokeWidth, round: true, fade: false, once: false }, version);
  }
  {
    // LineDrawingGenerator.tsx: the sample, measured, with DEFAULTS.
    const parsed = sanitizeSvg(LINE_SAMPLE);
    if (!parsed.ok) throw new Error(`svg-line-drawing-generator: ${parsed.error}`);
    const copy = mount(parsed.svg.cloneNode(true) as SVGSVGElement);
    const m = measure(copy, parsed.wasBarePath);
    copy.remove();
    const output = buildOutput(toTree(parsed.svg), m.shapes, LINE_DEFAULTS, { viewBox: m.viewBox, bare: m.bare, previewName: 'ldg-pv' });
    out['svg-line-drawing-generator'] = linePage(output, version);
  }
  // HandwritingGenerator.tsx: DEFAULTS, the CSS file on top and the scroll version below.
  out['handwriting-animation-generator'] = hwPage(hwOutput(HW_DEFAULTS), version);
  {
    // MorphGenerator.tsx: circle to star, automatic matching, 1 decimal, the whole outline.
    const read = (key: Parameters<typeof presetOf>[0]) => {
      const p = presetOf(key);
      const r = morphParse(p.d);
      if (!r.ok) throw new Error(`svg-morph-generator: ${r.error}`);
      return { name: p.name.toLowerCase(), shape: r.shape };
    };
    const from = read(DEFAULT_PAIR.from);
    const to = read(DEFAULT_PAIR.to);
    const m = matchShapes(from.shape, to.shape, { points: null, rotate: null, reverse: null });
    const fromD = morphD(m.from, 1, m.closed);
    const toD = morphD(m.to, 1, m.closed);
    const t = tokenize(fromD);
    const b = morphBounds([m.from, m.to]) ?? { x: 0, y: 0, w: 200, h: 200 };
    const inBox = b.x >= 0 && b.y >= 0 && b.x + b.w <= 200 && b.y + b.h <= 200;
    const side = Math.max(b.w, b.h, 1);
    const frame = inBox
      ? { vb: '0 0 200 200', size: 200 }
      : {
        vb: [b.x - side * 0.1 - (side - b.w) / 2, b.y - side * 0.1 - (side - b.h) / 2, side * 1.2, side * 1.2].map((n) => morphNum(n, 1)).join(' '),
        size: side * 1.2,
      };
    const s: MorphSettings = {
      from: fromD,
      to: toD,
      viewBox: frame.vb,
      strokeWidth: Math.max(0.5, Math.round((frame.size / 50) * 10) / 10),
      easing: 'ease-in-out',
      outline: 'whole',
      pathLength: null,
      fill: 'none',
      once: false,
      skeleton: t.ok ? skeleton(lettersOf(t.commands)) : '',
      numbers: compatibility(fromD, toD).numbers[0],
      fromName: from.name,
      toName: to.name === from.name ? `other ${to.name}` : to.name,
    };
    out['svg-morph-generator'] = morphPage(s, version);
  }
  {
    // ShapeToPath.tsx: the sample, every shape on, two arcs, exact, Line view.
    const conv = convertSvg(S2P_SAMPLE, { arcs: 2, precision: 'exact' }, SHAPE_TAGS);
    if (!conv.ok) throw new Error(`svg-shape-to-path-converter: ${conv.error}`);
    const before = sanitizeSvg(conv.before);
    const after = sanitizeSvg(conv.after);
    if (!before.ok || !after.ok) throw new Error('svg-shape-to-path-converter: a preview did not sanitise');
    const svgs = [before.svg, after.svg].map((s) => mount(s.cloneNode(true) as SVGSVGElement));
    writeDrawings(svgs, true);
    const markup = s2pMarkup(svgs[1], false);
    svgs.forEach((s) => s.remove());
    const plan = drawPlan(conv);
    const allPaths = conv.rows.every((r) => r.status === 'converted');
    out['svg-shape-to-path-converter'] = s2pPage(markup, staggerFor(plan.n), plan.ellipse, allPaths, version);
  }
  {
    // SvgToJsx.tsx: the sample, unwrapped; and with "Wrap in ScrollDraw" on.
    const read = readSvg(JSX_SAMPLE);
    if (!read.ok || !read.preview) throw new Error('svg-to-jsx-converter: the sample did not read');
    const svg = mount(read.preview.cloneNode(true) as SVGSVGElement);
    const markup = jsxMarkup(svg);
    svg.remove();
    out['svg-to-jsx-converter'] = jsxPage(JSX_NAME, markup, null, version);
    out['svg-to-jsx-converter:wrap'] = jsxPage(JSX_NAME, markup, WRAP_DEFAULTS, version);
  }
  {
    // WaveGenerator.tsx INITIAL, in the light theme's colours (the page reads them from the site's tokens).
    const s: WaveSettings = {
      mode: 'fill', layers: 3, amplitude: 0.7, waves: 2.5, smooth: 'curved', tension: 0, steps: 8, variation: 0.45, seed: 2026,
      flipX: false, flipY: false, height: 200, strokeWidth: 4, stagger: 0.15, plays: 'scroll', finish: 'leave',
    };
    const colours = ['#d9d4c7', '#8a857c', '#121110'];
    const page = { bg: '#f8f6f1', fg: '#121110' };
    out['svg-wave-generator'] = wavePage(s, buildWave(s), colours, page, version);
    const line = { ...s, mode: 'line' as const };
    out['svg-wave-generator:line'] = wavePage(line, buildWave(line), colours, page, version);
  }
  out['svg-blob-generator'] = blobPage(BLOB_DEFAULTS, blobGeometry(BLOB_DEFAULTS), version);

  // ── Visualizers ───────────────────────────────────────────────────────────
  // TriggerVisualizer.tsx INITIAL, on scrollDraw.
  out['scroll-trigger-visualizer'] = triggerHtml(
    { target: 'scrollDraw', rs: readTrigger('top 85%'), re: readTrigger('top 40%'), ratio: 0.4 },
    version,
  );
  {
    // EasingVisualizer.tsx: spring against ease-out, the curve worked out before the library loads.
    const [a, b] = EASING_DEFAULTS.spring;
    const range = rangeOf([curveStats(factoryCurve('spring', a, b)), curveStats(NAMED['ease-out'])]);
    out['easing-visualizer'] = easingHtml({ pick: 'spring', params: EASING_DEFAULTS, cmp: 'ease-out', range, version });
  }
  // AosGallery.tsx: 800ms, ease-out-cubic.
  out['aos-animation'] = aosHtml({ duration: 800, easing: 'ease-out-cubic' }, version);

  return out;
}
