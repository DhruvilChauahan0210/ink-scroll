'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

/* The code panel: three files from a fictional storefront repo, a tiny
   regex highlighter (enough for TypeScript and TOML), and the response the
   function sends back. */

const FILES = [
  {
    name: 'api/cart.ts',
    lang: 'ts',
    code: `import { db, kv } from 'northbeam';

export const config = { regions: 'all', cache: 'private' };

export default async function handler(req: Request) {
  const user = req.headers.get('x-nb-user');

  // Served from the KV replica in the visitor's region
  const hit = await kv.get(\`cart:\${user}\`);
  if (hit) return Response.json(hit);

  const items = await db.query(
    'select sku, qty, price from cart_items where user_id = $1',
    [user],
  );
  await kv.set(\`cart:\${user}\`, items, { ttl: 30 });

  return Response.json(items, {
    headers: { 'x-served-from': req.nb.region },
  });
}`,
  },
  {
    name: 'northbeam.toml',
    lang: 'toml',
    code: `name = "storefront"
framework = "auto"

[build]
command = "npm run build"
node = "24"

[regions]
primary = "lis1"
replicas = ["fra1", "iad1", "gru1", "sin1", "syd1"]

[postgres]
plan = "pro-4"
read_replicas = "follow-regions"

[[crons]]
path = "/api/digest"
schedule = "0 7 * * MON"`,
  },
  {
    name: 'queues/orders.ts',
    lang: 'ts',
    code: `import { queue, email } from 'northbeam';

// Runs in the region the message was published from
export default queue('orders.created', async (msg) => {
  const { orderId, to } = msg.body;

  await email.send({
    to,
    template: 'receipt',
    data: { orderId },
  });
}, { retries: 5, backoff: 'exponential' });`,
  },
] as const;

const TS = /(\/\/.*$)|('(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|export|const|async|function|await|return|if|default)\b|\b(\d+)\b|\b(Request|Response)\b|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)(?=\s*:)/gm;
const TOML = /(#.*$)|("(?:[^"\\\n]|\\.)*")|^(\[\[?[\w.]+\]\]?)|^([\w.]+)(?=\s*=)/gm;

function highlight(src: string, lang: 'ts' | 'toml'): ReactNode[] {
  const rx = new RegExp(lang === 'ts' ? TS : TOML);
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (let m = rx.exec(src); m; m = rx.exec(src)) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const cls = lang === 'ts'
      ? ['c', 's', 'k', 'n', 't', 'f', 'p'][m.slice(1).findIndex((g) => g !== undefined)]
      : ['c', 's', 'h', 'p'][m.slice(1).findIndex((g) => g !== undefined)];
    out.push(<span key={k++} className={`tk-${cls}`}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(src.slice(last));
  return out;
}

export function CodePanel() {
  const [tab, setTab] = useState(0);
  const f = FILES[tab];
  const lines = f.code.split('\n').length;
  return (
    <div className="nb-code">
      <div className="nb-code-win">
        <div className="nb-code-tabs" role="tablist" aria-label="Files">
          {FILES.map((x, i) => (
            <button key={x.name} type="button" role="tab" aria-selected={i === tab} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
              <span className={`nb-file is-${x.lang}`} aria-hidden="true">{x.lang === 'ts' ? 'TS' : '⚙'}</span>{x.name}
            </button>
          ))}
        </div>
        <div className="nb-code-body" role="tabpanel">
          <ol className="nb-gutter" aria-hidden="true">{Array.from({ length: lines }, (_, i) => <li key={i}>{i + 1}</li>)}</ol>
          <pre><code>{highlight(f.code, f.lang)}</code></pre>
        </div>
        <div className="nb-code-foot"><span><i className="nb-dot is-ok" />Deployed to 62 regions</span><span>{f.lang === 'ts' ? 'TypeScript' : 'TOML'} · UTF-8 · {lines} lines</span></div>
      </div>
      <div className="nb-resp" aria-label="The response">
        <div className="nb-resp-h"><span className="nb-verb">GET</span><code>storefront.nb.app/api/cart</code></div>
        <div className="nb-resp-status"><span className="nb-200">200 OK</span><span>41 ms</span><span>3.1 kB</span></div>
        <dl className="nb-headers">
          <div><dt>x-served-from</dt><dd>lis1</dd></div>
          <div><dt>x-nb-cache</dt><dd>MISS</dd></div>
          <div><dt>server-timing</dt><dd>edge;dur=3, fn;dur=24, pg;dur=9</dd></div>
          <div><dt>cache-control</dt><dd>private, max-age=0</dd></div>
        </dl>
        <pre className="nb-json">{`[
  { "sku": "MUG-0042", "qty": 2, "price": 1800 },
  { "sku": "TEE-OAT-M", "qty": 1, "price": 3400 }
]`}</pre>
      </div>
    </div>
  );
}
