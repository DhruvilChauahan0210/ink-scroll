import { convertSnippet, type SvgKid } from './convert';

/**
 * What the converter does to each part of a paste, and where the two outputs
 * come from. Every right-hand line is convertSnippet()'s own output for the
 * left-hand one, so the drawing cannot drift from the converter.
 */

const el = (tag: string, attrs: Record<string, string>, kids: SvgKid[] = []): SvgKid => ({ tag, attrs: Object.entries(attrs), kids });

/** The attributes of a one-element snippet, or the text, or — when it was removed. */
function after(k: SvgKid): string {
  const jsx = convertSnippet(k).jsx;
  if (!('tag' in k)) return jsx || '—';
  // An element whose only attribute was removed comes back bare: nothing left to show.
  const attrs = /^<[\w]+ (.+) \/>$/.exec(jsx);
  return attrs ? attrs[1] : '—';
}

const ROWS: { from: string; to: string; rule: string }[] = [
  { from: 'class="cup"', to: after(el('g', { class: 'cup' })), rule: 'class is a JS keyword' },
  { from: 'stroke-width="4"', to: after(el('g', { 'stroke-width': '4' })), rule: 'props are camelCase' },
  { from: 'style="--a: 1"', to: after(el('g', { style: '--a: 1' })), rule: 'a style is an object' },
  { from: 'xlink:href="#a"', to: after(el('use', { 'xlink:href': '#a' })), rule: 'SVG 2 reads href' },
  { from: 'onclick="…"', to: after(el('g', { onclick: 'f()' })), rule: 'it would run: left out' },
  { from: '<!-- steam -->', to: after({ comment: ' steam ' }), rule: 'JSX has no comments' },
  { from: '<path d="…"></path>', to: convertSnippet(el('path', { d: '…' })).jsx, rule: 'empty elements close' },
  { from: 'a &lt; b', to: after({ text: 'a < b' }), rule: 'text is escaped' },
];

const W = 360;
const ROW = 28;
const TOP = 34;
const MID = [148, 198];
const RIGHT = 206;

export function PipelineFigure() {
  const base = TOP + ROWS.length * ROW;
  const p = base + 30;
  return (
    <figure className="stk-fig jxf">
      <svg
        viewBox={`0 0 ${W} ${p + 60}`}
        role="img"
        aria-label={`SVG to JSX, part by part: ${ROWS.map((r) => `${r.from} becomes ${r.to === '—' ? 'nothing' : r.to}`).join('; ')}. The paste is parsed into an inert tree, the rules write JSX, and the JSX goes in a component; separately, sanitizeSvg rebuilds the drawing for the preview.`}
      >
        <text className="jxf-k" x="0" y="12">IN THE SVG</text>
        <text className="jxf-k" x={RIGHT} y="12">IN THE JSX</text>
        <line className="jxf-rule" x1="0" x2={W} y1="20" y2="20" />
        {ROWS.map((r, i) => {
          const y = TOP + i * ROW + 6;
          return (
            <g key={r.from}>
              <text className="jxf-t" x="0" y={y}>{r.from}</text>
              <line className="jxf-arrow" x1={MID[0]} x2={MID[1] - 4} y1={y - 3.5} y2={y - 3.5} />
              <path className="jxf-head" d={`M${MID[1]} ${y - 3.5} l-6 -3 v6 z`} />
              <text className={r.to === '—' ? 'jxf-t jxf-out' : 'jxf-t'} x={RIGHT} y={y}>{r.to}</text>
              <text className="jxf-s" x={RIGHT} y={y + 12}>{r.rule}</text>
            </g>
          );
        })}
        <line className="jxf-rule" x1="0" x2={W} y1={base} y2={base} />

        {/* Where the two outputs come from: one paste, two lanes. */}
        <text className="jxf-k" x="0" y={p - 10}>TWO OUTPUTS</text>
        <rect className="jxf-box is-main" x="0" y={p} width="52" height="56" />
        <text className="jxf-step" x="26" y={p + 31} textAnchor="middle">paste</text>
        <Lane y={p} boxes={[[68, 68, 'DOMParser'], [152, 44, 'rules'], [212, 148, 'function Name(props)']]} last />
        <Lane y={p + 34} boxes={[[68, 84, 'sanitizeSvg'], [168, 192, 'preview: shapes only']]} />
      </svg>
      <figcaption className="stk-cap">
        Fig. 1 — each part of a paste and what the converter writes for it, drawn from its own output. The code comes
        from an inert parse; the preview is a separate, stricter rebuild.
      </figcaption>
    </figure>
  );
}

/** A row of boxes joined by arrows, starting from the paste box's right edge. */
function Lane({ y, boxes, last }: { y: number; boxes: [number, number, string][]; last?: boolean }) {
  const mid = y + 11;
  return (
    <g>
      {boxes.map(([x, w, label], i) => {
        const from = i === 0 ? 52 : boxes[i - 1][0] + boxes[i - 1][1];
        return (
          <g key={x}>
            <line className="jxf-arrow" x1={from} x2={x - 4} y1={mid} y2={mid} />
            <path className="jxf-head" d={`M${x} ${mid} l-6 -3 v6 z`} />
            <rect className={last && i === boxes.length - 1 ? 'jxf-box is-main' : 'jxf-box'} x={x} y={y} width={w} height="22" />
            <text className="jxf-step" x={x + 8} y={y + 15}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}
