'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { elbow, pt, roundRect, type P } from '@/components/examples/ink/geo';

/*
 * The request diagram — the svg-scroll-draw effect this site exists to show.
 * Every box and arrow carries .nb-draw, and DOM order is drawing order:
 * visitor, arrow, edge, arrow, cache, arrow, function, arrow, Postgres,
 * arrow, queue. One ScrollDraw call (selector · stagger · ease-out · once).
 *
 * The labels are not paths, so the library leaves them alone; CSS fades each
 * one in off the container's --scroll-draw-progress, a beat after its box.
 * There are two layouts — a wide one and a tall one for phones — each in its
 * own ScrollDraw with the same options, and CSS shows one of them.
 */

type Node = {
  id: 'visitor' | 'edge' | 'cache' | 'fn' | 'db' | 'queue';
  x: number; y: number;
  t: string; s: string;
  icon: ReactNode;
  tone?: 'key' | 'ok' | 'quiet';
};
type Link = { from: Node['id']; to: Node['id']; pts: P[]; dir: 'r' | 'd' | 'u'; tone?: 'quiet'; tag?: { x: number; y: number; t: string; anchor?: 'start' | 'middle' | 'end' } };

const ICON: Record<Node['id'], ReactNode> = {
  visitor: <><circle cx="9" cy="9" r="7.2" /><path d="M1.8 9h14.4M9 1.8c2.2 2.1 2.2 12.3 0 14.4M9 1.8c-2.2 2.1-2.2 12.3 0 14.4" /></>,
  edge: <><path d="M9 1.5 L16 5.4 V12.6 L9 16.5 L2 12.6 V5.4 Z" /><path d="M9 6.2 V11.8 M6.2 9 H11.8" /></>,
  cache: <><path d="M10.2 1.6 L3.6 10 H9 L7.8 16.4 L14.4 8 H9 Z" /></>,
  fn: <><path d="M6.4 2.6 C 4.4 2.6 4.6 5 4.6 6.6 S 3.8 9 2.4 9 C 3.8 9 4.6 9.8 4.6 11.4 S 4.4 15.4 6.4 15.4" /><path d="M11.6 2.6 C 13.6 2.6 13.4 5 13.4 6.6 S 14.2 9 15.6 9 C 14.2 9 13.4 9.8 13.4 11.4 S 13.6 15.4 11.6 15.4" /></>,
  db: <><ellipse cx="9" cy="4.2" rx="6.2" ry="2.4" /><path d="M2.8 4.2 V13.8 C 2.8 15.1 5.6 16.2 9 16.2 S 15.2 15.1 15.2 13.8 V4.2 M2.8 9 C 2.8 10.3 5.6 11.4 9 11.4 S 15.2 10.3 15.2 9" /></>,
  queue: <><rect x="2" y="3" width="14" height="3.4" rx="1.2" /><rect x="2" y="7.3" width="14" height="3.4" rx="1.2" /><rect x="2" y="11.6" width="9" height="3.4" rx="1.2" /></>,
};

const COPY: Record<Node['id'], { t: string; s: string; ts?: string; ss: string; tone?: Node['tone'] }> = {
  visitor: { t: 'Visitor', s: 'Lisbon · Safari', ss: 'Lisbon, PT' },
  edge: { t: 'Edge · lis1', s: 'TLS 1.3 · 3 ms', ss: 'TLS · 3 ms', tone: 'key' },
  cache: { t: 'Cache', s: 'HIT · 2 ms', ss: 'HIT · 2 ms', tone: 'ok' },
  fn: { t: 'cart-api', s: 'Function · 24 ms', ss: 'fn · 24 ms', tone: 'key' },
  db: { t: 'Postgres', s: 'replica · 9 ms', ss: 'lis1 · 9 ms' },
  queue: { t: 'orders.viewed', ts: 'Queue', s: 'Queue · 1 ms', ss: 'orders · 1 ms', tone: 'quiet' },
};

const ORDER: Node['id'][] = ['visitor', 'edge', 'cache', 'fn', 'db', 'queue'];

function layout(kind: 'wide' | 'tall') {
  const W = kind === 'wide' ? 168 : 140;
  const H = kind === 'wide' ? 64 : 60;
  const at: Record<Node['id'], [number, number]> = kind === 'wide'
    ? { visitor: [20, 150], edge: [250, 150], cache: [480, 42], fn: [480, 150], db: [712, 150], queue: [712, 258] }
    : { visitor: [12, 16], edge: [12, 126], cache: [188, 126], fn: [12, 236], db: [188, 236], queue: [12, 346] };
  const nodes: Node[] = ORDER.map((id) => {
    const c = COPY[id];
    const short = kind === 'tall';
    return { id, x: at[id][0], y: at[id][1], icon: ICON[id], t: short ? c.ts ?? c.t : c.t, s: short ? c.ss : c.s, tone: c.tone };
  });
  const N = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<Node['id'], Node>;
  const cx = (n: Node) => n.x + W / 2;
  const cy = (n: Node) => n.y + H / 2;
  const g = 5; // gap between an arrow tip and its box
  const links: Link[] = kind === 'wide'
    ? [
      { from: 'visitor', to: 'edge', pts: [[N.visitor.x + W + g, cy(N.visitor)], [N.edge.x - g, cy(N.edge)]], dir: 'r', tag: { x: N.visitor.x + W + 31, y: cy(N.visitor) - 10, t: 'HTTPS', anchor: 'middle' } },
      { from: 'edge', to: 'cache', pts: [[cx(N.edge), N.edge.y - g], [cx(N.edge), cy(N.cache)], [N.cache.x - g, cy(N.cache)]], dir: 'r', tone: 'quiet', tag: { x: cx(N.edge) + 12, y: cy(N.cache) - 10, t: 'static' } },
      { from: 'edge', to: 'fn', pts: [[N.edge.x + W + g, cy(N.edge)], [N.fn.x - g, cy(N.fn)]], dir: 'r', tag: { x: N.edge.x + W + 31, y: cy(N.edge) - 10, t: 'dynamic', anchor: 'middle' } },
      { from: 'fn', to: 'db', pts: [[N.fn.x + W + g, cy(N.fn)], [N.db.x - g, cy(N.db)]], dir: 'r', tag: { x: N.fn.x + W + 32, y: cy(N.fn) - 10, t: 'SQL', anchor: 'middle' } },
      { from: 'fn', to: 'queue', pts: [[cx(N.fn), N.fn.y + H + g], [cx(N.fn), cy(N.queue)], [N.queue.x - g, cy(N.queue)]], dir: 'r', tone: 'quiet', tag: { x: cx(N.fn) + 12, y: cy(N.queue) - 10, t: 'publish' } },
    ]
    : [
      { from: 'visitor', to: 'edge', pts: [[cx(N.visitor), N.visitor.y + H + g], [cx(N.edge), N.edge.y - g]], dir: 'd', tag: { x: cx(N.visitor) + 10, y: N.visitor.y + H + 30, t: 'HTTPS' } },
      { from: 'edge', to: 'cache', pts: [[N.edge.x + W + g, cy(N.edge)], [N.cache.x - g, cy(N.cache)]], dir: 'r', tone: 'quiet' },
      { from: 'edge', to: 'fn', pts: [[cx(N.edge), N.edge.y + H + g], [cx(N.fn), N.fn.y - g]], dir: 'd', tag: { x: cx(N.edge) + 10, y: N.edge.y + H + 30, t: 'dynamic' } },
      { from: 'fn', to: 'db', pts: [[N.fn.x + W + g, cy(N.fn)], [N.db.x - g, cy(N.db)]], dir: 'r' },
      { from: 'fn', to: 'queue', pts: [[cx(N.fn), N.fn.y + H + g], [cx(N.queue), N.queue.y - g]], dir: 'd', tone: 'quiet', tag: { x: cx(N.fn) + 10, y: N.fn.y + H + 30, t: 'publish' } },
    ];
  return { W, H, nodes, links, N };
}

const lab = (i: number) => ({ '--i': i } as CSSProperties);

/** The arrowhead as a continuation of the same subpath (tip → barb → tip →
 *  barb), so it inks after the line reaches it. Dashing restarts on every
 *  subpath, so a separate "M …" head would appear before its line arrives. */
function head(tip: P, dir: 'r' | 'd' | 'u', s = 5): string {
  const [x, y] = tip;
  const k = s * 0.8;
  const [a, b]: [P, P] = dir === 'r' ? [[x - s, y - k], [x - s, y + k]] : dir === 'd' ? [[x - k, y - s], [x + k, y - s]] : [[x - k, y + s], [x + k, y + s]];
  return ` L ${pt(a)} L ${pt(tip)} L ${pt(b)}`;
}

function Svg({ kind }: { kind: 'wide' | 'tall' }) {
  const { W, H, nodes, links } = layout(kind);
  const vb = kind === 'wide' ? '0 0 900 340' : '0 0 340 420';
  // Draw order: each node, then the arrow that leaves it toward the next node.
  const seq: ({ k: 'n'; n: Node } | { k: 'l'; l: Link })[] = [];
  nodes.forEach((n) => {
    const into = links.find((l) => l.to === n.id);
    if (into) seq.push({ k: 'l', l: into });
    seq.push({ k: 'n', n });
  });
  return (
    <svg className={`nb-dg nb-dg-${kind}`} viewBox={vb} role="img" aria-label="A request for /api/cart from a visitor in Lisbon: the Lisbon edge serves static files from cache and sends the dynamic request to the cart-api function, which reads Postgres in the same region and publishes to a queue — 41 ms in all">
      {kind === 'wide' && (
        <g className="nb-lab" style={lab(1)}>
          <path className="nb-region" d={roundRect(232, 14, 662, 318, 16)} />
          <text className="nb-region-t" x={250} y={36}>REGION lis1 · LISBON</text>
        </g>
      )}
      {seq.map((s, i) => {
        if (s.k === 'l') {
          const { l } = s;
          const tip = l.pts[l.pts.length - 1];
          return (
            <g key={`l-${l.to}`}>
              <path className={`nb-draw nb-link${l.tone ? ` is-${l.tone}` : ''}`} d={`${elbow(l.pts, 10)}${head(tip, l.dir)}`} />
              {l.tag && <text className="nb-tag nb-lab" style={lab(i)} x={l.tag.x} y={l.tag.y} textAnchor={l.tag.anchor ?? 'start'}>{l.tag.t}</text>}
            </g>
          );
        }
        const { n } = s;
        return (
          <g key={n.id}>
            <path className={`nb-draw nb-box${n.tone ? ` is-${n.tone}` : ''}`} d={roundRect(n.x, n.y, W, H, 11)} />
            <g className="nb-lab" style={lab(i)}>
              <g className={`nb-ico${n.tone ? ` is-${n.tone}` : ''}`} transform={`translate(${n.x + 14} ${n.y + H / 2 - 9})`}>{n.icon}</g>
              <text className="nb-t" x={n.x + 42} y={n.y + H / 2 - 3}>{n.t}</text>
              <text className="nb-s" x={n.x + 42} y={n.y + H / 2 + 14}>{n.s}</text>
              {n.tone !== 'quiet' && <circle className={`nb-led${n.tone === 'ok' ? ' is-ok' : ''}`} cx={n.x + W - 13} cy={n.y + 13} r={3} />}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** The trace that the diagram explains, as a waterfall. Times in ms of 41. */
const SPANS = [
  { n: 'GET /api/cart', s: 'request', a: 0, d: 41, lv: 0 },
  { n: 'edge.route', s: 'lis1', a: 0, d: 3, lv: 1 },
  { n: 'cache.lookup', s: 'MISS · private', a: 3, d: 1.4, lv: 1 },
  { n: 'cart-api', s: 'function', a: 5, d: 34, lv: 1, key: true },
  { n: 'pg.query', s: 'select cart_items', a: 9, d: 9, lv: 2 },
  { n: 'kv.set', s: 'cart:8812 · ttl 30s', a: 19, d: 2, lv: 2 },
  { n: 'queue.publish', s: 'orders.viewed', a: 22, d: 1, lv: 2 },
  { n: 'serialize', s: '12 items · 3.1 kB', a: 30, d: 7, lv: 2 },
];

export function RequestTrace() {
  return (
    <div className="nb-console">
      <div className="nb-con-bar">
        <span className="nb-crumbs"><b>storefront</b><i>/</i><span className="nb-cr-mid">Production</span><i className="nb-cr-mid">/</i><span>Traces</span></span>
        <span className="nb-con-tabs" aria-hidden="true"><b>Trace</b><span>Logs</span><span>Headers</span></span>
        <span className="nb-con-meta"><code>req_01JF7Q4M2K</code><span className="nb-200">200</span><span>41 ms</span></span>
      </div>
      {(['wide', 'tall'] as const).map((k) => (
        <ScrollDraw key={k} className={`nb-diagram is-${k}`} selector=".nb-draw" trigger={{ start: 'top 85%', end: 'top 35%' }} stagger={0.1} easing="ease-out" once>
          <Svg kind={k} />
        </ScrollDraw>
      ))}
      <div className="nb-wf" aria-label="Trace waterfall">
        <div className="nb-wf-h"><span>Span</span><span className="nb-wf-scale"><i>0</i><i>10</i><i>20</i><i>30</i><i>41 ms</i></span></div>
        {SPANS.map((s) => (
          <div key={s.n} className={`nb-wf-row lv${s.lv}${s.key ? ' is-key' : ''}`}>
            <span className="nb-wf-n"><b>{s.n}</b><em>{s.s}</em></span>
            <span className="nb-wf-track">
              <i style={{ left: `${(s.a / 41) * 100}%`, width: `${Math.max(1.6, (s.d / 41) * 100)}%` }} />
              {(s.a + s.d) / 41 > 0.8
                ? <em className="is-in" style={{ right: `${100 - ((s.a + s.d) / 41) * 100 + 0.8}%` }}>{s.d} ms</em>
                : <em style={{ left: `${((s.a + s.d) / 41) * 100 + 1.2}%` }}>{s.d} ms</em>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
