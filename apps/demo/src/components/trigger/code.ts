import { cdnModule, escapeHtml, htmlFile, withSource, type ReactProject } from '@/lib/tool-export';
import { defaultsOf, edgeOffset, pairWords, readTrigger, type Edge, type Reading } from '@/data/trigger';

/**
 * Everything the scroll trigger visualizer writes, from the chosen function,
 * the start and end readings and the element's height:
 *
 * - jsCode and reactCode: the two code tabs, each with the source line, and
 *   any part of the trigger that matches the function's default left out.
 * - triggerHtml: a complete page running the JavaScript tab's call on an
 *   element of the chosen height, with the two lines drawn across the window,
 *   the element's edges marked and progress counted, as in the preview. The
 *   library comes from jsDelivr, pinned to `version`.
 * - reactProject: the React tab's component in plain JSX inside the same
 *   page, for the React project on StackBlitz.
 */

export const SLUG = 'scroll-trigger-visualizer';

export type Target = 'scrollDraw' | 'scrollText' | 'scrollReveal' | 'scrollProgress';
export const TARGETS: Target[] = ['scrollDraw', 'scrollText', 'scrollReveal', 'scrollProgress'];

/** The drawing in the preview, in the code and in the exported page. */
export const DRAWING = 'M8 40 C 40 8, 72 8, 104 32 S 168 60, 200 28 S 228 12, 232 20';

export type Export = {
  target: Target;
  rs: Reading;
  re: Reading;
  /** The element's height as a fraction of the viewport's. */
  ratio: number;
};

// ── The code tabs ────────────────────────────────────────────────────────────

/** The trigger option, with only the parts that differ from the function's default. */
export function triggerLiteral(target: Target, rs: Reading, re: Reading): string | null {
  const d = defaultsOf(target);
  const parts: string[] = [];
  if (rs.canonical !== readTrigger(d.start).canonical) parts.push(`start: '${rs.canonical}'`);
  if (re.canonical !== readTrigger(d.end).canonical) parts.push(`end: '${re.canonical}'`);
  return parts.length ? `{ ${parts.join(', ')} }` : null;
}

function comment(target: Target, rs: Reading, re: Reading): string {
  const lines: string[] = [];
  if (!triggerLiteral(target, rs, re)) lines.push(`// ${target}’s default window, so no trigger option:`);
  lines.push(`// starts when ${pairWords(rs)},`, `// done when ${pairWords(re)}.`);
  // With one edge for both, the order is the lines' order whatever the element's
  // height; with two edges it depends on the height, so nothing is claimed.
  if (rs.edge === re.edge && re.at === rs.at) lines.push('// Start and end are the same position, so progress stays 0.');
  else if (rs.edge === re.edge && re.at > rs.at) {
    // scrollText and scrollReveal default to once: true, which keeps the highest progress seen.
    lines.push(target === 'scrollText' || target === 'scrollReveal'
      ? '// End comes before start: progress is 1 from the outset, and once (on by default) keeps it there.'
      : '// End comes before start, so it plays backwards as you scroll down.');
  }
  return lines.join('\n');
}

const SELECTOR: Record<Target, string> = {
  scrollDraw: '#drawing', scrollText: '#headline', scrollReveal: '.card', scrollProgress: '#hero',
};

export function fileOf(target: Target, tab: 'js' | 'react'): string {
  if (tab === 'js') return 'main.js';
  return { scrollDraw: 'Drawing.tsx', scrollText: 'Headline.tsx', scrollReveal: 'Cards.tsx', scrollProgress: 'Hero.tsx' }[target];
}

/** The import, the comment and the call: the JavaScript tab's code, and the exported page's script. */
function jsBody(target: Target, rs: Reading, re: Reading, from: string): string {
  const trig = triggerLiteral(target, rs, re);
  const sel = SELECTOR[target];
  const call = trig ? `${target}('${sel}', {\n  trigger: ${trig},\n});` : `${target}('${sel}');`;
  return `import { ${target} } from '${from}';\n\n${comment(target, rs, re)}\n${call}`;
}

/** The JavaScript tab. */
export function jsCode(target: Target, rs: Reading, re: Reading): string {
  const head = target === 'scrollText' ? '// <h2 id="headline">Your heading</h2>\n\n' : '';
  const tail = target === 'scrollProgress'
    ? '\n\n/* The progress is on the element as --scroll-progress, 0 to 1:\n   #hero { opacity: var(--scroll-progress); } */'
    : '';
  return withSource(`${head}${jsBody(target, rs, re, defaultsOf(target).entry)}${tail}`, SLUG, 'js');
}

type ReactParts = {
  /** React hooks the component imports. */
  hooks: string[];
  /** The library import line. */
  lib: string;
  /** The comment and the component. */
  body: string;
  /** The component's name. */
  name: string;
  /** Whether it needs 'use client' in the App Router. */
  client: boolean;
};

/** The React tab's component, typed for the tab or plain JSX for the StackBlitz App. */
function reactParts(target: Target, rs: Reading, re: Reading, ts: boolean): ReactParts {
  const trig = triggerLiteral(target, rs, re);
  const note = comment(target, rs, re);
  const divRef = `useRef${ts ? '<HTMLDivElement>' : ''}(null)`;
  if (target === 'scrollDraw') {
    return {
      hooks: [],
      lib: "import { ScrollDraw } from 'svg-scroll-draw/react';",
      name: 'Drawing',
      client: false,
      body: `${note}
export function Drawing() {
  return (
    <ScrollDraw${trig ? ` trigger={${trig}}` : ''}>
      <svg viewBox="0 0 240 64">
        <path d="${DRAWING}" fill="none" stroke="currentColor" />
      </svg>
    </ScrollDraw>
  );
}`,
    };
  }
  if (target === 'scrollText') {
    return {
      hooks: [],
      lib: "import { ScrollText } from 'svg-scroll-draw/react';",
      name: 'Headline',
      client: false,
      body: `${note}
export function Headline() {
  return (
    <ScrollText as="h2"${trig ? ` trigger={${trig}}` : ''}>
      Your heading
    </ScrollText>
  );
}`,
    };
  }
  if (target === 'scrollReveal') {
    const opts = trig ? `, {\n      trigger: ${trig},\n    }` : '';
    return {
      hooks: ['useEffect', 'useRef'],
      lib: "import { scrollReveal } from 'svg-scroll-draw/reveal';",
      name: 'Cards',
      client: true,
      body: `${note}
export function Cards() {
  const ref = ${divRef};
  useEffect(() => {
    const cards = ref.current?.querySelectorAll('.card');
    if (!cards?.length) return;
    const reveal = scrollReveal(cards${opts});
    return () => reveal.destroy();
  }, []);
  return (
    <div ref={ref}>
      <div className="card">One</div>
      <div className="card">Two</div>
    </div>
  );
}`,
    };
  }
  const opts = trig ? `, {\n    trigger: ${trig},\n  }` : '';
  return {
    hooks: ['useRef'],
    lib: "import { useScrollDrawProgress } from 'svg-scroll-draw/react';",
    name: 'Hero',
    client: true,
    body: `${note}
export function Hero() {
  const ref = ${divRef};
  const progress = useScrollDrawProgress(ref${opts});
  return <div ref={ref} style={{ opacity: progress }}>Your content</div>;
}`,
  };
}

const reactImport = (hooks: string[]) => (hooks.length ? `import { ${hooks.join(', ')} } from 'react';\n` : '');

/** The React tab. */
export function reactCode(target: Target, rs: Reading, re: Reading): string {
  const p = reactParts(target, rs, re, true);
  const code = `${p.client ? "'use client';\n\n" : ''}${reactImport(p.hooks)}${p.lib}\n\n${p.body}`;
  return withSource(code, SLUG, 'tsx');
}

// ── Runnable files ───────────────────────────────────────────────────────────

const EDGE_CLASS: Record<Edge, string> = { top: 'is-top', center: 'is-center', bottom: 'is-bottom' };

/** Room above the element, in vh: enough that every window starts below the top of the page. */
function roomAbove(rs: Reading, re: Reading): number {
  return Math.min(400, Math.max(125, Math.ceil(Math.max(rs.at, re.at) * 100) + 25));
}

/** The element's start and end edges, as [class, label] pairs. */
function edgeMarks(rs: Reading, re: Reading): [string, string][] {
  if (rs.edge === re.edge) return [[`edge ${EDGE_CLASS[rs.edge]}`, 'start + end edge']];
  return [
    [`edge ${EDGE_CLASS[rs.edge]}`, 'start edge'],
    [`edge is-end ${EDGE_CLASS[re.edge]}`, 'end edge'],
  ];
}

/** A line across the window where the trigger's second word puts it; one below the window sits on its bottom. */
function viewLine(kind: 'start' | 'end', r: Reading): { className: string; top: string; label: string } {
  const f = Math.min(1, r.at);
  return {
    className: `line is-${kind}${f < 0.1 ? ' is-low' : ''}`,
    top: r.at >= 1 ? 'calc(100% - 1px)' : `${+(f * 100).toFixed(2)}%`,
    label: `${kind} · ${r.canonical}${r.at > 1 ? ' (below)' : ''}`,
  };
}

/** One trigger as numbers for the readout: how far down the element its edge is, and down the window its line is. */
const pairLiteral = (r: Reading) => `{ edge: ${edgeOffset(r.edge, 1)}, line: ${+r.at.toFixed(4)} }`;

/** The arithmetic behind the readout, shared by the page's script and the App. */
const readoutConsts = (rs: Reading, re: Reading) => `// The lines and the number are the trigger's arithmetic, worked from the
// element's place on the page, so they count before and after the window too.
const START = ${pairLiteral(rs)}; // '${rs.canonical}'
const END = ${pairLiteral(re)}; // '${re.canonical}'
const at = ({ edge, line }, r) => r.top + scrollY + edge * r.height - line * innerHeight;`;

/**
 * The page around the element. The .stage wraps it and nothing else in the
 * flow, so measuring the stage measures the element without its transforms.
 */
function pageCss({ target, rs, re, ratio }: Export, html: boolean): string {
  const h = Math.round(ratio * 100);
  const el = {
    scrollDraw: `.stage > div {
  display: grid;
  place-items: center;
  height: ${h}vh;
}
.stage svg {
  width: 80%;
  max-width: 480px;
  max-height: 80%;
  overflow: visible;
}
.stage path {
  stroke-width: 2.5;
  stroke-linecap: round;
}`,
    scrollText: `.stage > h2 {
  min-height: ${h}vh;
  margin: 0;
  padding: 16px;
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}`,
    scrollReveal: `.stage > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.card {
  min-height: ${h}vh;
  padding: 20px;
  border: 1px solid #d6d6d0;
  background: #fff;
  font-weight: 600;
}`,
    scrollProgress: `.stage > div {
  display: grid;
  place-items: center;
  min-height: ${h}vh;
  background: #16161a;
  color: #f4f4f1;
  font-weight: 600;
}${html ? '\n/* scrollProgress writes --scroll-progress on #hero, 0 to 1. */\n#hero {\n  opacity: var(--scroll-progress, 0);\n}' : ''}`,
  }[target];
  return `* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #16161a;
  background: #f4f4f1;
}
.hint,
.after {
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0 16px;
  color: #55555b;
}
.hint {
  height: ${roomAbove(rs, re)}vh;
}
.after {
  height: 125vh;
}
/* The element the trigger measures, outlined, with its edges marked. */
.stage {
  position: relative;
  width: min(40rem, calc(100% - 32px));
  margin: 0 auto;
  outline: 1px dashed #8a8a86;
}
.edge {
  position: absolute;
  left: -8px;
  right: -8px;
  height: 0;
  border-top: 2px solid #16161a;
  pointer-events: none;
}
.edge.is-top { top: 0; }
.edge.is-center { top: 50%; }
.edge.is-bottom { top: 100%; }
.edge.is-end { border-top-style: dashed; }
.edge span {
  position: absolute;
  left: 8px;
  top: 4px;
  padding: 1px 4px;
  background: #f4f4f1;
  font: 500 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
}
.edge.is-bottom span {
  top: auto;
  bottom: 4px;
}
/* The start and end lines across the window: they stay put as the page scrolls. */
.line {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1;
  height: 0;
  border-top: 1px solid #16161a;
  pointer-events: none;
}
.line.is-end {
  border-top: 1px dashed #55555b;
}
.line span {
  position: absolute;
  right: 12px;
  bottom: 3px;
  padding: 1px 6px;
  background: #f4f4f1;
  font: 500 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
}
.line.is-end span {
  right: auto;
  left: 12px;
  color: #55555b;
}
.line.is-low span {
  bottom: auto;
  top: 3px;
}
.readout {
  position: fixed;
  top: 12px;
  left: 50%;
  z-index: 2;
  width: 9.5rem;
  margin: 0 0 0 -4.75rem;
  padding: 6px 10px;
  border: 1px solid #16161a;
  background: #fff;
  font: 500 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.readout b {
  float: right;
}
.readout i {
  display: block;
  height: 3px;
  margin-top: 4px;
  background: #16161a;
  transform: scaleX(0);
  transform-origin: left;
}
${el}`;
}

/** The element as HTML, the same one the JavaScript tab's call looks for. */
function elementHtml(target: Target): string {
  if (target === 'scrollDraw') {
    return `<div id="drawing">
  <svg viewBox="0 0 240 64" aria-hidden="true">
    <path d="${DRAWING}" fill="none" stroke="currentColor" />
  </svg>
</div>`;
  }
  if (target === 'scrollText') return '<h2 id="headline">Your heading</h2>';
  if (target === 'scrollReveal') return '<div class="cards">\n  <div class="card">One</div>\n  <div class="card">Two</div>\n</div>';
  return '<div id="hero">Your content</div>';
}

const indent = (s: string, n: number) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/** A complete page running the JavaScript tab's call, with the lines, edges and progress of the preview. */
export function triggerHtml(s: Export, version: string): string {
  const { target, rs, re } = s;
  const lines = [viewLine('start', rs), viewLine('end', re)];
  const body = [
    '<p class="hint">Scroll down ↓</p>',
    '<div class="stage">',
    indent(elementHtml(target), 2),
    ...edgeMarks(rs, re).map(([c, l]) => `  <span class="${c}" aria-hidden="true"><span>${l}</span></span>`),
    '</div>',
    '<p class="after">The end.</p>',
    '',
    ...lines.map((l) => `<div class="${l.className}" style="top: ${l.top}" aria-hidden="true"><span>${escapeHtml(l.label)}</span></div>`),
    '<p class="readout">progress <b>0.00</b><i></i></p>',
  ].join('\n');
  const script = `${jsBody(target, rs, re, cdnModule(version, defaultsOf(target).entry.replace(/^svg-scroll-draw\/?/, '')))}

${readoutConsts(rs, re)}
const stage = document.querySelector('.stage');
const number = document.querySelector('.readout b');
const bar = document.querySelector('.readout i');
function readout() {
  const r = stage.getBoundingClientRect();
  const a = at(START, r);
  const b = at(END, r);
  const p = a === b ? 0 : Math.min(1, Math.max(0, (scrollY - a) / (b - a)));
  number.textContent = p.toFixed(2);
  bar.style.transform = \`scaleX(\${p})\`;
}
// Once a frame, rather than inside the scroll event.
let frame = 0;
const queue = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(readout); };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue);
readout();`;
  return htmlFile({
    slug: SLUG,
    title: `${target}: '${rs.canonical}' to '${re.canonical}'`,
    css: pageCss(s, true),
    body,
    script,
  });
}

/** The React tab's component in plain JSX, in the same page, as a Vite project. */
export function reactProject(s: Export, version: string): Omit<ReactProject, 'title'> {
  const { target, rs, re } = s;
  const p = reactParts(target, rs, re, false);
  const lines = [viewLine('start', rs), viewLine('end', re)];
  const app = `${reactImport(['useEffect', 'useRef', 'useState'])}${p.lib}

${p.body}

${readoutConsts(rs, re)}

function useTriggerProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const r = ref.current.getBoundingClientRect();
      const a = at(START, r);
      const b = at(END, r);
      setProgress(a === b ? 0 : Math.min(1, Math.max(0, (scrollY - a) / (b - a))));
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, [ref]);
  return progress;
}

export default function App() {
  const stage = useRef(null);
  const progress = useTriggerProgress(stage);
  return (
    <>
      <p className="hint">Scroll down ↓</p>
      <div ref={stage} className="stage">
        <${p.name} />
${edgeMarks(rs, re).map(([c, l]) => `        <span className="${c}" aria-hidden="true"><span>${l}</span></span>`).join('\n')}
      </div>
      <p className="after">The end.</p>
${lines.map((l) => `      <div className="${l.className}" style={{ top: '${l.top}' }} aria-hidden="true"><span>${l.label}</span></div>`).join('\n')}
      <p className="readout">
        progress <b>{progress.toFixed(2)}</b>
        <i style={{ transform: \`scaleX(\${progress})\` }} />
      </p>
    </>
  );
}
`;
  return { slug: SLUG, app, css: `${pageCss(s, false)}\n`, version };
}
