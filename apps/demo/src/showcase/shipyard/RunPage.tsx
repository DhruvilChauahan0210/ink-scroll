import type { CSSProperties, ReactNode } from 'react';

/* The hero's product shot: Shipyard's run page for a finished run, built in
   HTML and CSS. Static on purpose — the drawn stage icons live further down,
   in the section that walks through this same run. */

export function Av({ i, a, b, size }: { i: string; a: string; b: string; size?: number }) {
  return (
    <span className="sy-av" style={{ '--a': a, '--b': b, ...(size ? { '--s': `${size}px` } : {}) } as CSSProperties} aria-hidden="true">
      {i}
    </span>
  );
}

export const Check = ({ size = 14 }: { size?: number }) => (
  <svg className="sy-ok" viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <circle cx="8" cy="8" r="8" />
    <path d="M4.6 8.3l2.2 2.2 4.6-4.8" />
  </svg>
);

const Spark = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
);

const JOBS: { n: string; t: string; on?: boolean; tag?: string }[] = [
  { n: 'Install dependencies', t: '4s', tag: 'cached' },
  { n: 'Typecheck', t: '11s' },
  { n: 'Lint', t: '7s' },
  { n: 'Build · web', t: '48s', on: true },
  { n: 'Build · api-client', t: '22s' },
  { n: 'Test · 8 shards', t: '1m 12s' },
  { n: 'Deploy · production', t: '21s' },
];

const LOG: [string, string, ReactNode][] = [
  ['00:00.0', 'cmd', '$ pnpm build --filter=web...'],
  ['00:00.3', 'dim', 'Remote cache connected · iad1 · 214 tasks in graph'],
  ['00:00.4', 'hit', <><b>@fernway/ui</b>:build  cache hit, replaying output 1f3a9c2</>],
  ['00:00.4', 'hit', <><b>@fernway/design-tokens</b>:build  cache hit, replaying output 52e0b7a</>],
  ['00:00.5', 'miss', <><b>@fernway/checkout</b>:build  cache miss, executing 9c0e4ab</>],
  ['00:00.5', 'miss', <><b>@fernway/api-client</b>:build  cache miss, executing 7b21e0d</>],
  ['00:31.4', 'ok', '✓ Compiled 214 modules in 31.4s'],
  ['00:46.9', 'ok', '✓ 212 of 214 tasks restored from remote cache'],
  ['00:48.1', 'sum', 'Done in 48.1s · saved 5m 52s against a cold build'],
];

const SHARDS = [0.94, 0.97, 0.92, 1, 0.95, 0.98, 0.93, 0.96];

export function RunPage() {
  return (
    <figure className="sy-shot">
      <div className="sy-win" role="img" aria-label="Shipyard's run page: run 1842 on the main branch of fernway/storefront passed in 2 minutes 21 seconds — commit, build, eight test shards and a deploy to three regions, with the build log open">
        <div className="sy-top">
          <span className="sy-crumbs">
            <span className="sy-mark sy-mark-sm" aria-hidden="true"><MarkGlyph /></span>
            <span className="sy-org"><Av i="F" a="#34d399" b="#0e7490" size={18} />fernway</span>
            <i>/</i><span>storefront</span><i className="sy-hide-s">/</i><span className="sy-hide-s sy-dim">Runs</span><i className="sy-hide-s">/</i><b className="sy-hide-s">#1842</b>
          </span>
          <span className="sy-top-r">
            <span className="sy-find">Search runs<kbd>⌘K</kbd></span>
            <Av i="MO" a="#fb923c" b="#db2777" size={24} />
          </span>
        </div>
        <nav className="sy-tabs" aria-hidden="true">
          <span>Overview</span><span className="on">Runs</span><span>Previews</span><span>Insights</span><span className="sy-hide-s">Runners</span><span className="sy-hide-s">Settings</span>
        </nav>

        <div className="sy-run">
          <div className="sy-run-h">
            <div className="sy-run-title">
              <Check size={22} />
              <div>
                <p className="sy-run-msg">fix(checkout): retry payment webhooks with exponential backoff</p>
                <p className="sy-run-meta">
                  <Av i="MO" a="#fb923c" b="#db2777" size={18} />
                  <b>maya-okafor</b> pushed <code>a3f9c1e</code> to <span className="sy-branch">main</span>
                  <span className="sy-hide-s"> · 4 min ago · triggered by push</span>
                </p>
              </div>
            </div>
            <div className="sy-run-btns">
              <span className="sy-btn-g">Re-run</span>
              <span className="sy-btn-p">Visit deployment ↗</span>
            </div>
          </div>

          <dl className="sy-sum">
            <div><dt>Status</dt><dd className="ok">Passed</dd></div>
            <div><dt>Duration</dt><dd>2m 21s</dd></div>
            <div><dt>Remote cache</dt><dd>212 / 214 hits</dd></div>
            <div><dt>Tests</dt><dd>1,284 passed</dd></div>
            <div className="sy-hide-s"><dt>Regions</dt><dd>iad1 · fra1 · hnd1</dd></div>
          </dl>

          <ol className="sy-graph" aria-hidden="true">
            <li><span className="sy-g-h"><Check /><b>Commit</b><em>0.4s</em></span><span className="sy-g-d">a3f9c1e · 2 packages affected</span></li>
            <li><span className="sy-g-h"><Check /><b>Build</b><em>48s</em></span><span className="sy-g-d">web, api-client · <span className="sy-amber"><Spark /> 212 cached</span></span></li>
            <li className="sy-g-test">
              <span className="sy-g-h"><Check /><b>Test</b><em>1m 12s</em></span>
              <span className="sy-g-shards">{SHARDS.map((w, i) => <i key={i} style={{ width: `${w * 100}%` }} />)}</span>
            </li>
            <li><span className="sy-g-h"><Check /><b>Deploy</b><em>21s</em></span><span className="sy-g-d">production · 3 regions</span></li>
          </ol>

          <div className="sy-split">
            <ul className="sy-jobs" aria-hidden="true">
              {JOBS.map((j) => (
                <li key={j.n} className={j.on ? 'on' : ''}>
                  <Check size={13} /><span>{j.n}</span>{j.tag && <em>{j.tag}</em>}<time>{j.t}</time>
                </li>
              ))}
            </ul>
            <div className="sy-log">
              <div className="sy-log-h">
                <b>Build · web</b>
                <span>ubuntu-24.04 · 8 vCPU · <span className="sy-ok-t">48.1s</span></span>
              </div>
              <ol className="sy-lines">
                {LOG.map(([t, k, line], i) => (
                  <li key={i} className={`is-${k}`}><span className="sy-ln">{i + 1}</span><time>{t}</time><span className="sy-lt">{line}</span></li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

export const MarkGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11.4 4.2 V15 H5.6 Z" />
    <path d="M13 7.4 L17.6 15 H13 Z" opacity="0.6" />
    <path d="M4.6 16.8 H19.4 L17.4 19.8 H6.6 Z" />
  </svg>
);
