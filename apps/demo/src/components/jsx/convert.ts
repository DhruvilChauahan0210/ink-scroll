/**
 * SVG to JSX, as pure functions: no DOM, so the page's reference tables and
 * its figure are written by the same code the converter runs, on the server.
 *
 * The input is a plain tree (read-svg.ts reads one from a parsed document):
 * names exactly as the file writes them. The output is the JSX text and a
 * list of every change, each with the reason, which the tool shows as a table.
 *
 * Attribute names follow react-dom's own table of SVG names (the one behind
 * its "Invalid DOM property `stroke-width`. Did you mean `strokeWidth`?"
 * warning), so each prop written here renders back as the attribute the SVG
 * had. Two React knows but its TypeScript types do not, transformOrigin and
 * maskType, become style properties instead, which do the same.
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';

// ── The tree ─────────────────────────────────────────────────────────────────

/** An element as the file writes it: qualified names, attribute order kept. */
export type SvgEl = { tag: string; foreign?: boolean; attrs: [string, string][]; kids: SvgKid[] };
export type SvgKid = SvgEl | { text: string } | { comment: string };

/** The converted element. */
export type JAttr =
  | { name: string; value: string; expr?: boolean }
  | { style: [string, string][] }
  | { spread: string };
export type JNode = { tag: string; attrs: JAttr[]; kids: JKid[] };
export type JKid = JNode | { text: string } | { css: string };

export type Change = { from: string; to: string; why: string; n: number };

const isEl = (k: SvgKid): k is SvgEl => 'tag' in k;
const isJ = (k: JKid): k is JNode => 'tag' in k;

// ── Names ────────────────────────────────────────────────────────────────────

/** Attributes SVG writes with hyphens, by the name React gives them (react-dom's alias table). */
const HYPHENATED = [
  'accentHeight', 'alignmentBaseline', 'arabicForm', 'baselineShift', 'capHeight', 'clipPath', 'clipRule',
  'colorInterpolation', 'colorInterpolationFilters', 'colorProfile', 'colorRendering', 'dominantBaseline',
  'fillOpacity', 'fillRule', 'floodColor', 'floodOpacity', 'fontFamily', 'fontSize', 'fontSizeAdjust',
  'fontStretch', 'fontStyle', 'fontVariant', 'fontWeight', 'glyphName', 'glyphOrientationHorizontal',
  'glyphOrientationVertical', 'horizAdvX', 'horizOriginX', 'imageRendering', 'letterSpacing', 'lightingColor',
  'markerEnd', 'markerMid', 'markerStart', 'maskType', 'overlinePosition', 'overlineThickness', 'paintOrder',
  'pointerEvents', 'renderingIntent', 'shapeRendering', 'stopColor', 'stopOpacity', 'strikethroughPosition',
  'strikethroughThickness', 'strokeDasharray', 'strokeDashoffset', 'strokeLinecap', 'strokeLinejoin',
  'strokeMiterlimit', 'strokeOpacity', 'strokeWidth', 'textAnchor', 'textDecoration', 'textRendering',
  'transformOrigin', 'underlinePosition', 'underlineThickness', 'unicodeBidi', 'unicodeRange', 'unitsPerEm',
  'vAlphabetic', 'vHanging', 'vIdeographic', 'vMathematical', 'vectorEffect', 'vertAdvY', 'vertOriginX',
  'vertOriginY', 'wordSpacing', 'writingMode', 'xHeight',
] as const;

/** SVG attributes that are camelCase in the file already. SVG is case-sensitive, so viewbox is not viewBox. */
const CAMEL = [
  'attributeName', 'attributeType', 'autoReverse', 'baseFrequency', 'baseProfile', 'calcMode', 'clipPathUnits',
  'contentScriptType', 'contentStyleType', 'diffuseConstant', 'edgeMode', 'externalResourcesRequired',
  'filterRes', 'filterUnits', 'glyphRef', 'gradientTransform', 'gradientUnits', 'kernelMatrix',
  'kernelUnitLength', 'keyPoints', 'keySplines', 'keyTimes', 'lengthAdjust', 'limitingConeAngle',
  'markerHeight', 'markerUnits', 'markerWidth', 'maskContentUnits', 'maskUnits', 'numOctaves', 'pathLength',
  'patternContentUnits', 'patternTransform', 'patternUnits', 'pointsAtX', 'pointsAtY', 'pointsAtZ',
  'preserveAlpha', 'preserveAspectRatio', 'primitiveUnits', 'refX', 'refY', 'repeatCount', 'repeatDur',
  'requiredExtensions', 'requiredFeatures', 'specularConstant', 'specularExponent', 'spreadMethod',
  'startOffset', 'stdDeviation', 'stitchTiles', 'surfaceScale', 'systemLanguage', 'tableValues', 'targetX',
  'targetY', 'textLength', 'viewBox', 'viewTarget', 'xChannelSelector', 'yChannelSelector', 'zoomAndPan',
] as const;

/** The rest of the names @types/react lists for an SVG element, so TypeScript output can say what it will reject. */
const PLAIN = (
  'className color height id lang max media method min name nonce part slot style target type width role tabIndex ' +
  'crossOrigin accumulate additive alphabetic amplitude ascent azimuth bbox begin bias by clip cursor cx cy d ' +
  'decelerate descent direction display divisor dur dx dy elevation end exponent fill filter focusable format fr ' +
  'from fx fy g1 g2 hanging href ideographic in2 in intercept k1 k2 k3 k4 k kerning local mask mathematical mode ' +
  'offset opacity operator order orient orientation origin overflow panose1 path points r radius restart result ' +
  'rotate rx ry scale seed slope spacing speed stemh stemv string stroke to transform u1 u2 unicode values version ' +
  'visibility widths x1 x2 x y1 y2 y z xmlns xmlLang xmlBase xlinkActuate xlinkArcrole xlinkRole xlinkShow ' +
  'xlinkTitle xlinkType allowReorder'
).split(' ');

/** React names whose @types/react has no attribute: written as the CSS property, which does the same. */
const TO_STYLE = new Set<string>(['transformOrigin', 'maskType']);

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Source name, lowercased → React's name for it. */
const RENAME = new Map<string, string>([
  ...HYPHENATED.flatMap((n) => [[kebab(n), n], [n.toLowerCase(), n]] as [string, string][]),
  ...CAMEL.map((n) => [n.toLowerCase(), n] as [string, string]),
  ['class', 'className'],
  ['tabindex', 'tabIndex'],
  ['crossorigin', 'crossOrigin'],
]);

/** Every prop name a typed <svg> element accepts without a hyphen. */
const KNOWN = new Set<string>([...HYPHENATED, ...CAMEL, ...PLAIN].filter((n) => !TO_STYLE.has(n)));

/** How many attribute names the converter renames (the page's figure). */
export const RENAMED_ATTRIBUTES = new Set(RENAME.values()).size;

/** SVG elements React's types know, by their exact case; the HTML ones an SVG also uses are added. */
const TAGS = (
  'svg animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix ' +
  'feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight ' +
  'feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology ' +
  'feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line ' +
  'linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set stop switch ' +
  'symbol text textPath tspan use view a style title script'
).split(' ');
const TAG_CASE = new Map(TAGS.map((t) => [t.toLowerCase(), t]));
/** The ones React types as HTML elements. */
const HTML_TYPED = new Set(['a', 'style', 'title', 'script']);

/** Elements whose text is drawn, so a space between two of their children is kept. */
const TEXTUAL = new Set(['text', 'tspan', 'textPath', 'a']);

// ── Small helpers ────────────────────────────────────────────────────────────

/** A JavaScript identifier, written the way React needs a component name: a capital first. */
export const COMPONENT_NAME = /^[A-Z][A-Za-z0-9_$]*$/;
const IDENT = /^[A-Za-z_$][\w$]*$/;

/** "my-logo icon" → "MyLogoIcon"; a leading digit gets "Svg" in front. */
export function toPascalCase(s: string): string {
  const out = s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  if (!out) return 'SvgIcon';
  return /^\d/.test(out) ? `Svg${out}` : out;
}

/** A single-quoted JavaScript string, or a double-quoted one when that reads better. */
export function jsString(s: string): string {
  if (!/['\\\n\r\u2028\u2029]/.test(s)) return `'${s}'`;
  return JSON.stringify(s);
}

/** A JSX attribute value: a plain "string" when JSX reads it back the same, an expression when not. */
export function attrValue(v: string): string {
  // JSX attribute strings have no escapes and decode HTML entities, so a quote,
  // a line break or something that looks like &amp; goes through an expression.
  if (/["\n\r\t]|&(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/i.test(v)) return `{${JSON.stringify(v)}}`;
  return `"${v}"`;
}

/**
 * Text for JSX: { } < > become {'{'} and so on, and an & that would read as
 * an entity is kept literal. Returns what it escaped, for the table.
 */
export function escapeText(s: string): { text: string; escaped: string[] } {
  const escaped: string[] = [];
  const text = s.replace(/[{}<>]|&(?=(#\d+|#x[\da-f]+|[a-z][a-z\d]*);)/gi, (c) => {
    escaped.push(c);
    return `{'${c}'}`;
  });
  return { text, escaped };
}

// ── style="…" ────────────────────────────────────────────────────────────────

/** A CSS property as a React style key: stroke-width → strokeWidth, -webkit-x → WebkitX, -ms-x → msX, --x stays. */
export function styleKey(prop: string): string {
  if (prop.startsWith('--')) return prop;
  const p = prop.toLowerCase();
  const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  if (p.startsWith('-ms-')) return camel(p.slice(1));
  if (p.startsWith('-')) {
    const c = camel(p.slice(1));
    return c[0].toUpperCase() + c.slice(1);
  }
  return camel(p);
}

/** Splits on `sep` where it is outside quotes and brackets. */
function splitTop(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === sep && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

export type StyleResult = {
  entries: [string, string][];
  /** Declarations whose !important was taken off. */
  important: string[];
  /** Properties left out, with the reason. */
  dropped: [string, string][];
};

/**
 * A style attribute as a React style object: keys camelCased, values kept as
 * strings exactly as written (so "0.6" stays "0.6"), a later declaration of
 * the same property replacing the earlier one, as in CSS.
 */
export function parseStyle(css: string): StyleResult {
  const important: string[] = [];
  const dropped: [string, string][] = [];
  const map = new Map<string, string>();
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const decl of splitTop(noComments, ';')) {
    const at = decl.indexOf(':');
    if (at < 0) continue;
    const prop = decl.slice(0, at).trim();
    let value = decl.slice(at + 1).trim();
    if (!prop || !value) continue;
    const name = prop.startsWith('--') ? prop : prop.toLowerCase();
    if (name.startsWith('-inkscape-')) { dropped.push([name, 'Inkscape’s own setting; browsers ignore it']); continue; }
    if (name === 'enable-background') { dropped.push([name, 'an old Illustrator setting no browser in use reads']); continue; }
    if (/!\s*important$/i.test(value)) {
      value = value.replace(/\s*!\s*important$/i, '');
      important.push(name);
    }
    const key = styleKey(name);
    map.delete(key);
    map.set(key, value);
  }
  return { entries: [...map], important, dropped };
}

// ── The conversion ───────────────────────────────────────────────────────────

export type Size = 'keep' | '1em' | 'none';

export type WrapOptions = {
  easing: string;
  stagger: number;
  once: boolean;
  /** trigger.end */
  end: string;
  /** fillOpacity={[0, 1]} */
  fillFade: boolean;
};

/**
 * ScrollDraw's defaults for the options the tool offers, from buildEngine in
 * packages/svg-scroll-draw/src/core/engine.ts: easing 'linear', stagger 0,
 * once false, trigger.end 'bottom top', no fillOpacity. The code leaves an
 * option out when it is at its default.
 */
export const WRAP_DEFAULTS: WrapOptions = { easing: 'linear', stagger: 0, once: false, end: 'bottom top', fillFade: false };

export type Options = {
  name: string;
  ts: boolean;
  spread: boolean;
  size: Size;
  /** An accessible name: role="img" and a <title>. Empty for none. */
  title: string;
  wrap: WrapOptions | null;
  /** A viewBox for a drawing that has none and no width or height either (a bare path), from its bounds. */
  boundsViewBox?: string | null;
};

export type Output = {
  code: string;
  changes: Change[];
  warnings: string[];
  root: JNode;
};

class Notes {
  private rows = new Map<string, Change>();
  warnings: string[] = [];
  unknown = new Set<string>();
  important = new Set<string>();
  add(from: string, to: string, why: string): void {
    const key = `${from}\u0000${to}`;
    const row = this.rows.get(key);
    if (row) row.n += 1;
    else this.rows.set(key, { from, to, why, n: 1 });
  }
  list(): Change[] {
    return [...this.rows.values()];
  }
}

type Out = { name: string; value: string; expr?: boolean } | { style: [string, string][] } | null;

/** One attribute: renamed, kept, turned into a style object, or left out. */
function convertAttr(name: string, value: string, root: boolean, hasHref: boolean, notes: Notes, svgTyped = true): Out {
  const lower = name.toLowerCase();
  const was = `${name}="…"`;

  if (lower === 'xmlns') {
    if (root) return { name: 'xmlns', value };
    notes.add('xmlns on an inner element', 'removed', 'only the root <svg> needs it');
    return null;
  }
  if (lower.startsWith('xmlns:')) {
    notes.add(name, 'removed', lower === 'xmlns:xlink'
      ? 'a namespace declaration, not needed once xlink:href is href'
      : 'a namespace declaration for editor data, which is removed too');
    return null;
  }
  if (/^on/i.test(name)) {
    notes.add(`${lower}="…"`, 'removed', 'an event handler: it would run code. Add a React handler, such as onClick, yourself');
    return null;
  }
  const bare = value.replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
  if (/(java|vb)script:/.test(bare) || (/href$/.test(lower) && bare.startsWith('data:text/html'))) {
    notes.add(was, 'removed', 'a javascript: link, which would run code');
    return null;
  }
  if (lower === 'xlink:href') {
    if (hasHref) {
      notes.add('xlink:href', 'removed', 'the element has href as well, and href wins');
      return null;
    }
    notes.add('xlink:href', 'href', 'SVG 2 reads plain href, and so does every browser in use');
    return { name: 'href', value };
  }
  if (lower.startsWith('xlink:')) {
    const to = `xlink${lower[6].toUpperCase()}${lower.slice(7)}`;
    notes.add(name, to, 'JSX props cannot have a colon; React’s name for it');
    return { name: to, value };
  }
  if (lower === 'xml:space') {
    notes.add(name, 'removed', 'deprecated in SVG 2. If a text needs its spaces kept, set white-space in CSS');
    return null;
  }
  if (lower === 'xml:lang' || lower === 'xml:base') {
    const to = lower === 'xml:lang' ? 'xmlLang' : 'xmlBase';
    notes.add(name, to, 'JSX props cannot have a colon; React’s name for it');
    return { name: to, value };
  }
  if (name.includes(':')) {
    notes.add(`${name.split(':')[0]}:*`, 'removed', 'an editor’s own data (Inkscape, Sketch…). Browsers ignore it');
    return null;
  }
  if (lower.startsWith('data-') || lower.startsWith('aria-')) {
    notes.add(`${lower.slice(0, 5)}*`, 'kept as is', 'React passes data-* and aria-* through with their hyphens');
    return { name, value };
  }
  if (lower === 'style') {
    const s = parseStyle(value);
    s.important.forEach((p) => notes.important.add(p));
    s.dropped.forEach(([p, why]) => notes.add(`${p} in style`, 'removed', why));
    if (!s.entries.length) {
      notes.add('style=""', 'removed', 'nothing left in it');
      return null;
    }
    notes.add('style="…"', 'style={{…}}', 'React takes an object: camelCase keys, string values, custom properties quoted');
    return { style: s.entries };
  }
  if (lower === 'enable-background') {
    notes.add(name, 'removed', 'an old Illustrator setting no browser in use reads');
    return null;
  }
  const to = RENAME.get(lower);
  if (to && TO_STYLE.has(to)) {
    // An attribute reads a bare number as user units; CSS needs px for it.
    const css = to === 'transformOrigin' ? value.replace(/(^|\s)([+-]?(?:\d+\.?\d*|\.\d+))(?=\s|$)/g, (m, sp: string, n: string) => (Number(n) ? `${sp}${n}px` : m)) : value;
    notes.add(name, `style ${to}`, `React’s types have no ${to} attribute; the CSS property does the same`);
    return { style: [[to, css]] };
  }
  if (to === 'tabIndex' && /^\s*[+-]?\d+\s*$/.test(value)) {
    notes.add(name, 'tabIndex={…}', 'React’s name for it, and a number in its types');
    return { name: to, value: String(parseInt(value, 10)), expr: true };
  }
  if (to && to !== name) {
    const why = lower === 'class' ? 'class is a JavaScript keyword, so React names it className'
      : name.includes('-') ? 'React props are camelCase; React writes it back hyphenated'
      : (CAMEL as readonly string[]).includes(to) ? 'SVG is case-sensitive. An HTML page fixes the case as it parses; React does not'
      : `React’s name for it; React writes ${lower} back`;
    notes.add(name, to, why);
    return { name: to, value };
  }
  // <a>, <style> and <title> are typed as the HTML elements, with their own attributes.
  if (svgTyped && !KNOWN.has(name) && !name.includes('-')) notes.unknown.add(name);
  return { name, value };
}

function convertEl(el: SvgEl, root: boolean, notes: Notes, inText = false): JNode | null {
  if (el.foreign || el.tag.includes(':')) {
    notes.add(`<${el.tag.includes(':') ? `${el.tag.split(':')[0]}:*` : el.tag}>`, 'removed', 'an editor’s own element, in its own namespace');
    return null;
  }
  const tag = TAG_CASE.get(el.tag.toLowerCase());
  if (!tag) {
    notes.add(`<${el.tag}>`, 'removed', 'not an SVG element browsers draw, or React knows');
    return null;
  }
  if (tag === 'script') { notes.add('<script>', 'removed', 'it would run code'); return null; }
  if (tag === 'foreignObject') { notes.add('<foreignObject>', 'removed', 'it holds HTML, which needs converting as HTML'); return null; }
  if (tag === 'metadata') { notes.add('<metadata>', 'removed', 'editor metadata, not drawn'); return null; }
  if (tag !== el.tag) notes.add(`<${el.tag}>`, `<${tag}>`, 'SVG is case-sensitive: React creates the element by this exact name');

  const hasHref = el.attrs.some(([n]) => n === 'href');
  const attrs: JAttr[] = [];
  let style: { style: [string, string][] } | null = null;
  for (const [name, value] of el.attrs) {
    const out = convertAttr(name, value, root, hasHref, notes, !HTML_TYPED.has(tag));
    if (!out) continue;
    if ('style' in out) {
      // Moved attributes go first, so the element's own style="" still wins over them.
      if (!style) { style = { style: [] }; attrs.push(style); }
      const merged = new Map(name.toLowerCase() === 'style' ? [...style.style, ...out.style] : [...out.style, ...style.style]);
      style.style = [...merged];
    } else attrs.push(out);
  }

  const kids: JKid[] = [];
  if (tag === 'style') {
    const css = el.kids.filter((k): k is { text: string } => 'text' in k).map((k) => k.text).join('').trim();
    if (css) {
      kids.push({ css });
      notes.add('<style> text', '{`…`}', 'CSS braces would start JSX expressions, so it goes in a template string');
    }
    return { tag, attrs, kids };
  }
  // An <a> holds words only inside a <text>; around shapes its spaces are formatting.
  const words = TEXTUAL.has(tag) && (tag !== 'a' || inText);
  const textual = words || tag === 'title' || tag === 'desc' || tag === 'a';
  for (const k of el.kids) {
    if ('comment' in k) { notes.add('<!-- … -->', 'removed', 'JSX has no XML comments'); continue; }
    if (isEl(k)) {
      const c = convertEl(k, false, notes, words);
      if (c) kids.push(c);
      continue;
    }
    // Runs of white space become one space, as the browser shows them. Space
    // between elements is formatting, except inside a <text>, where it is the
    // space between two words.
    const t = k.text.replace(/\s+/g, ' ');
    if (!t.trim() && !words) continue;
    if (t.trim() && !textual) notes.add(`text in <${tag}>`, 'kept', 'SVG draws text only inside <text>; kept as it was');
    const last = kids[kids.length - 1];
    if (last && 'text' in last) last.text = (last.text + t).replace(/ {2,}/g, ' ');
    else kids.push({ text: t });
  }
  // No space at either end: the browser drops it, and JSX would keep it.
  const isText = (k: JKid | undefined): k is { text: string } => !!k && 'text' in k;
  if (isText(kids[0])) kids[0].text = kids[0].text.trimStart();
  if (isText(kids[kids.length - 1])) kids[kids.length - 1] = { text: (kids[kids.length - 1] as { text: string }).text.trimEnd() };
  const kept = kids.filter((k) => !isText(k) || k.text !== '');
  return { tag, attrs, kids: kept };
}

const PX: Record<string, number> = { '': 1, px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16 };
const round4 = (n: number) => String(Math.round(n * 1e4) / 1e4);

/** A width or height in user units, or null for %, em and the like. */
export function toUserUnits(v: string | undefined): number | null {
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(px|mm|cm|in|pt|pc)?\s*$/i.exec(v ?? '');
  if (!m) return null;
  const n = parseFloat(m[1]) * PX[(m[2] ?? '').toLowerCase()];
  return n > 0 ? n : null;
}

const getAttr = (n: JNode, name: string) => {
  const a = n.attrs.find((x): x is { name: string; value: string } => 'name' in x && x.name === name);
  return a?.value;
};
const dropAttr = (n: JNode, name: string) => { n.attrs = n.attrs.filter((x) => !('name' in x && x.name === name)); };
const setAttr = (n: JNode, name: string, value: string) => {
  const a = n.attrs.find((x): x is { name: string; value: string } => 'name' in x && x.name === name);
  if (a) a.value = value;
  else n.attrs.push({ name, value });
};

/** The root's options: size, an accessible name, the props spread. */
function applyRoot(svg: JNode, o: Options, notes: Notes): void {
  const w = getAttr(svg, 'width');
  const h = getAttr(svg, 'height');
  if (!getAttr(svg, 'viewBox')) {
    const uw = toUserUnits(w);
    const uh = toUserUnits(h);
    if (o.size !== 'keep' && uw && uh) {
      setAttr(svg, 'viewBox', `0 0 ${round4(uw)} ${round4(uh)}`);
      notes.add('—', `viewBox="0 0 ${round4(uw)} ${round4(uh)}"`, 'from its width and height, so the drawing still scales once they change');
    } else if (!w && !h && o.boundsViewBox) {
      setAttr(svg, 'viewBox', o.boundsViewBox);
      notes.add('—', `viewBox="${o.boundsViewBox}"`, 'from the shapes’ bounds, so the drawing scales with its box');
    }
  }
  if (o.size === '1em') {
    if (w !== '1em' || h !== '1em') notes.add(w || h ? `width="${w ?? '…'}" height="${h ?? '…'}"` : '—', 'width="1em" height="1em"', 'the size option: as tall as the text around it');
    setAttr(svg, 'width', '1em');
    setAttr(svg, 'height', '1em');
  } else if (o.size === 'none' && (w || h)) {
    dropAttr(svg, 'width');
    dropAttr(svg, 'height');
    notes.add(`width="${w ?? '…'}" height="${h ?? '…'}"`, 'removed', 'the size option: size it with CSS; it fills its box’s width');
  }
  const title = o.title.trim();
  if (title) {
    const before = svg.kids.length;
    svg.kids = svg.kids.filter((k) => !(isJ(k) && k.tag === 'title'));
    if (svg.kids.length < before) notes.add('<title>', 'replaced', 'by the title you typed');
    if (getAttr(svg, 'aria-hidden') !== undefined) {
      dropAttr(svg, 'aria-hidden');
      notes.add('aria-hidden on <svg>', 'removed', 'it would hide the title you gave it');
    }
    const role = getAttr(svg, 'role');
    if (role !== 'img') {
      setAttr(svg, 'role', 'img');
      notes.add(role ? `role="${role}"` : '—', 'role="img"', 'read as one image, named by its <title>');
    }
    svg.kids.unshift({ tag: 'title', attrs: [], kids: [{ text: title }] });
    notes.add('—', '<title>', 'the accessible name: the first child of the <svg>');
  }
  if (o.spread) {
    svg.attrs.push({ spread: 'props' });
    notes.add('—', '{...props}', 'on the <svg>, last, so className, width or aria-label you pass win');
  }
}

// ── Printing ─────────────────────────────────────────────────────────────────

const WIDTH = 80;

function styleLiteral(entries: [string, string][], ts: boolean): string {
  const body = entries.map(([k, v]) => `${IDENT.test(k) ? k : jsString(k)}: ${jsString(v)}`).join(', ');
  // React's style type has no custom properties, so TypeScript needs the cast.
  const cast = ts && entries.some(([k]) => k.startsWith('--'));
  return `{ ${body} }${cast ? ' as CSSProperties' : ''}`;
}

function attrText(a: JAttr, ts: boolean): string {
  if ('spread' in a) return `{...${a.spread}}`;
  if ('style' in a) return `style={${styleLiteral(a.style, ts)}}`;
  return `${a.name}=${a.expr ? `{${a.value}}` : attrValue(a.value)}`;
}

function inline(k: JKid, ts: boolean, notes: Notes | null): string {
  if (isJ(k)) {
    const head = `<${k.tag}${k.attrs.map((a) => ` ${attrText(a, ts)}`).join('')}`;
    return k.kids.length ? `${head}>${k.kids.map((c) => inline(c, ts, notes)).join('')}</${k.tag}>` : `${head} />`;
  }
  if ('css' in k) return `{\`${k.css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`}`;
  const { text, escaped } = escapeText(k.text);
  escaped.forEach((c) => notes?.add(`${c} in text`, `{'${c}'}`, c === '&' ? 'it would start an HTML entity in JSX' : 'it would start a tag or an expression in JSX'));
  return text;
}

function print(n: JNode, indent: string, ts: boolean, notes: Notes, out: string[]): void {
  const attrs = n.attrs.map((a) => attrText(a, ts));
  const head = `<${n.tag}${attrs.map((a) => ` ${a}`).join('')}`;
  const empty = n.kids.length === 0;
  const flat = attrs.length <= 1 || indent.length + head.length + (empty ? 3 : 1) <= WIDTH;
  const open = flat ? [indent + head] : [indent + `<${n.tag}`, ...attrs.map((a) => `${indent}  ${a}`)];
  if (empty) {
    out.push(...(flat ? [`${indent}${head} />`] : [...open, `${indent}/>`]));
    return;
  }
  const css = n.kids.find((k): k is { css: string } => 'css' in k);
  if (css) {
    const lines = css.css.split('\n');
    const pad = Math.min(...lines.slice(1).filter((l) => l.trim()).map((l) => /^\s*/.exec(l)?.[0].length ?? 0), Infinity);
    const body = lines.map((l, i) => (i && Number.isFinite(pad) ? l.slice(pad) : l.trim()));
    const esc = (l: string) => l.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    out.push(...(flat ? [`${indent}${head}>{\``] : [...open, `${indent}>{\``]));
    body.forEach((l) => out.push(l ? `${indent}  ${esc(l)}` : ''));
    out.push(`${indent}\`}</${n.tag}>`);
    return;
  }
  if (n.kids.some((k) => 'text' in k)) {
    // Text and elements together stay on one line: a line break in JSX text
    // drops the space next to it.
    const body = n.kids.map((k) => inline(k, ts, notes)).join('');
    out.push(...(flat ? [`${indent}${head}>${body}</${n.tag}>`] : [...open, `${indent}>${body}</${n.tag}>`]));
    return;
  }
  out.push(...(flat ? [`${indent}${head}>`] : [...open, `${indent}>`]));
  n.kids.forEach((k) => print(k as JNode, `${indent}  `, ts, notes, out));
  out.push(`${indent}</${n.tag}>`);
}

/** The JSX for one element and what changed in it, on its own (for the page's tables). */
export function convertSnippet(el: SvgKid, root = false): { jsx: string; changes: Change[] } {
  const notes = new Notes();
  if (!isEl(el)) {
    if ('comment' in el) { notes.add('<!-- … -->', 'removed', 'JSX has no XML comments'); return { jsx: '', changes: notes.list() }; }
    return { jsx: inline({ text: el.text }, false, notes), changes: notes.list() };
  }
  const j = convertEl(el, root, notes);
  const out: string[] = [];
  if (j) print(j, '', false, notes, out);
  return { jsx: out.join('\n'), changes: notes.list() };
}

/** Whether a style or attribute set paints a fill but no stroke, as inherited from the root down. */
function paint(attrs: JAttr[], inherited: { fill: boolean; stroke: boolean }) {
  const next = { ...inherited };
  for (const a of attrs) {
    const pairs: [string, string][] = 'style' in a ? a.style : 'name' in a ? [[a.name, a.value]] : [];
    for (const [k, v] of pairs) {
      const none = /^\s*(none|transparent)\s*$/i.test(v);
      if (k === 'fill') next.fill = !none;
      if (k === 'stroke') next.stroke = !none;
    }
  }
  return next;
}

/** Shapes ScrollDraw would draw, and which of them have a fill but no stroke, by their attributes. */
export function drawPlan(root: JNode): { shapes: number; fillOnly: number; ellipses: number } {
  const DRAWN = new Set(['path', 'polyline', 'line', 'polygon', 'rect', 'circle']);
  const out = { shapes: 0, fillOnly: 0, ellipses: 0 };
  const walk = (n: JNode, p: { fill: boolean; stroke: boolean }, hidden: boolean) => {
    const here = paint(n.attrs, p);
    const inDefs = hidden || ['defs', 'clipPath', 'mask', 'pattern', 'marker', 'symbol', 'linearGradient', 'radialGradient', 'filter'].includes(n.tag);
    if (!inDefs && DRAWN.has(n.tag)) {
      out.shapes += 1;
      if (here.fill && !here.stroke) out.fillOnly += 1;
    }
    if (!inDefs && n.tag === 'ellipse') out.ellipses += 1;
    n.kids.forEach((k) => isJ(k) && walk(k, here, inDefs));
  };
  // SVG's own defaults: fill black, no stroke.
  walk(root, { fill: true, stroke: false }, false);
  return out;
}

/** The ScrollDraw props that differ from its defaults. */
export function wrapProps(w: WrapOptions): string[] {
  const d = WRAP_DEFAULTS;
  const out: string[] = [];
  if (w.easing !== d.easing) out.push(`easing="${w.easing}"`);
  if (w.stagger !== d.stagger) out.push(`stagger={${w.stagger}}`);
  if (w.once !== d.once) out.push('once');
  if (w.end !== d.end) out.push(`trigger={{ end: '${w.end}' }}`);
  if (w.fillFade !== d.fillFade) out.push('fillOpacity={[0, 1]}');
  return out;
}

/** The whole component: imports, the function, the JSX, and every change made on the way. */
export function toComponent(tree: SvgEl, o: Options, prolog: { declaration: boolean; doctype: boolean; comments: number } = { declaration: false, doctype: false, comments: 0 }): Output | { error: string } {
  const notes = new Notes();
  if (prolog.declaration) notes.add('<?xml …?>', 'removed', 'a file’s header; the component starts at <svg>');
  if (prolog.doctype) notes.add('<!DOCTYPE …>', 'removed', 'a file’s header; the component starts at <svg>');
  for (let i = 0; i < prolog.comments; i++) notes.add('<!-- … -->', 'removed', 'JSX has no XML comments');
  const root = convertEl(tree, true, notes);
  if (!root || root.tag !== 'svg') return { error: 'The root element must be an <svg>.' };
  applyRoot(root, o, notes);

  const wrap = o.wrap ? wrapProps(o.wrap) : null;
  const indent = wrap ? '      ' : '    ';
  const lines: string[] = [];
  print(root, indent, o.ts, notes, lines);
  const svg = lines.join('\n');

  const css = o.ts && svg.includes(' as CSSProperties');
  const types = [css && 'CSSProperties', o.spread && 'SVGProps'].filter(Boolean) as string[];
  const imports: string[] = [];
  if (wrap) imports.push(`import { ScrollDraw } from 'svg-scroll-draw/react';`);
  if (o.ts && types.length) imports.push(`import type { ${types.join(', ')} } from 'react';`);
  const param = o.spread ? (o.ts ? 'props: SVGProps<SVGSVGElement>' : 'props') : '';
  const open = wrap ? `    <ScrollDraw${wrap.map((p) => ` ${p}`).join('')}>\n` : '';
  const close = wrap ? '\n    </ScrollDraw>' : '';
  const code = `${imports.length ? `${imports.join('\n')}\n\n` : ''}export function ${o.name}(${param}) {
  return (
${open}${svg}${close}
  );
}
`;
  if (notes.important.size) {
    notes.warnings.push(`!important taken off ${[...notes.important].join(', ')}: a React style object cannot set it. Move the rule to a stylesheet if it has to win.`);
  }
  if (o.ts && notes.unknown.size) {
    notes.warnings.push(`React’s types do not list ${[...notes.unknown].map((n) => `${n}`).join(', ')}, so TypeScript will reject ${notes.unknown.size === 1 ? 'it' : 'them'}. Remove ${notes.unknown.size === 1 ? 'it' : 'them'} if nothing reads ${notes.unknown.size === 1 ? 'it' : 'them'}.`);
  }
  return { code, changes: notes.list(), warnings: notes.warnings, root };
}

// ── Comparing what two trees hold (the preview's subset against the whole) ──

/**
 * Elements and props the first converted tree has and the second lacks, as
 * "<text> ×2", "className ×3": elements first, since those are what a
 * drawing visibly loses. Both are converted trees, so what the converter
 * removes from both (a <script>, an onclick) is never listed.
 */
export function missingFrom(all: JNode, sub: JNode): string[] {
  const count = (t: JNode) => {
    const m = new Map<string, number>();
    const bump = (k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    const walk = (e: JNode) => {
      bump(`<${e.tag}>`);
      for (const a of e.attrs) {
        if ('style' in a) bump('style');
        else if ('name' in a) {
          bump(a.name);
          if ((a.name === 'fill' || a.name === 'stroke') && /url\s*\(/i.test(a.value)) bump('gradient or pattern paint');
        }
      }
      e.kids.forEach((k) => isJ(k) && walk(k));
    };
    walk(t);
    return m;
  };
  const a = count(all);
  const b = count(sub);
  const out: string[] = [];
  for (const [k, n] of a) {
    if (k === 'xmlns') continue;
    const left = n - (b.get(k) ?? 0);
    if (left > 0) out.push(left > 1 ? `${k} ×${left}` : k);
  }
  return [...out.filter((k) => k.startsWith('<')), ...out.filter((k) => !k.startsWith('<'))];
}

/** A tree back as SVG markup, for showing a rule's input beside its output. */
export function toSvgText(k: SvgKid): string {
  if ('comment' in k) return `<!--${k.comment}-->`;
  if ('text' in k) return k.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attrs = k.attrs.map(([n, v]) => ` ${n}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`).join('');
  return k.kids.length ? `<${k.tag}${attrs}>${k.kids.map(toSvgText).join('')}</${k.tag}>` : `<${k.tag}${attrs}/>`;
}
