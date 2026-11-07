'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';

export type TreeFile = {
  /** Registry item name, also the block's anchor on the page. */
  name: string;
  /** The file name the CLI writes, e.g. "signature-draw.tsx". */
  file: string;
  lines: number;
};

/** Each row is this tall, so its connector drawing joins the next one's. */
const ROW = 34;
/** One indent level. */
const STEP = 18;

type Row = {
  key: string;
  depth: number;
  last: boolean;
  /** For each ancestor level, whether its line carries on past this row. */
  cont: boolean[];
  label: string;
  href?: string;
  meta?: string;
  metaLong?: string;
  ref?: string;
  kind: 'dir' | 'file' | 'dep';
};

/** The connector for one row: ancestors' continuing lines, then its own elbow. */
function elbow(row: Row) {
  const d: string[] = [];
  row.cont.forEach((on, k) => {
    if (on) d.push(`M${k * STEP + 7} 0 V${ROW}`);
  });
  const x = (row.depth - 1) * STEP + 7;
  d.push(row.last ? `M${x} 0 V${ROW / 2} H${x + 10}` : `M${x} 0 V${ROW} M${x} ${ROW / 2} H${x + 10}`);
  return d.join(' ');
}

/**
 * The page's opening drawing: the reader's project after `shadcn add`, one
 * row per file the CLI writes, from the built registry items — their target
 * paths, their line counts and the one dependency they add. The tree's
 * connectors are inked by the library on load, row by row.
 */
export function ProjectTree({ files, dependency, dir }: { files: TreeFile[]; dependency: string; dir: string }) {
  const parts = dir.split('/').filter(Boolean);
  const rows: Row[] = [
    { key: 'root', depth: 0, last: true, cont: [], label: 'your-app/', kind: 'dir' },
    // components/, scroll/ … nested, each the last in its parent except the top one.
    ...parts.map((p, i): Row => ({
      key: `dir-${p}`,
      depth: i + 1,
      last: i > 0,
      cont: i === 0 ? [] : [true, ...Array(i - 1).fill(false)],
      label: `${p}/`,
      kind: 'dir',
    })),
    ...files.map((f, i): Row => ({
      key: f.name,
      depth: parts.length + 1,
      last: i === files.length - 1,
      cont: [true, ...Array(parts.length - 1).fill(false)],
      label: f.file,
      href: `#${f.name}`,
      meta: `+${f.lines}`,
      metaLong: ' lines',
      ref: String(i + 1).padStart(2, '0'),
      kind: 'file',
    })),
    {
      key: 'package.json',
      depth: 1,
      last: true,
      cont: [],
      label: 'package.json',
      meta: `+ ${dependency}`,
      ref: 'dep',
      kind: 'dep',
    },
  ];

  return (
    <figure className="pt">
      <div className="tb pt-tb">
        <span className="tb-n">Fig. 1</span>
        <span>Your project, after shadcn add</span>
      </div>
      <ScrollDraw className="pt-grid" selector=".pt-ink" autoplay duration={420} delay={300} stagger={0.12} easing="ease-out" once>
        <div className="pt-row pt-hd" aria-hidden="true">
          <span>path</span>
          <span>added</span>
          <span>§</span>
        </div>
        <ul className="pt-list">
          {rows.map((r) => {
            const w = r.depth * STEP;
            const body = (
              <>
                <span className="pt-path">
                  {r.depth > 0 && (
                    <svg className="pt-svg" width={w} height={ROW} viewBox={`0 0 ${w} ${ROW}`} aria-hidden="true">
                      <path d={elbow(r)} className="pt-ink" stroke="currentColor" />
                    </svg>
                  )}
                  <span className="pt-name">{r.label}</span>
                </span>
                <span className="pt-meta">
                  {r.meta}
                  {r.metaLong && <span className="pt-meta-long">{r.metaLong}</span>}
                </span>
                <span className="pt-ref">{r.ref}</span>
              </>
            );
            return (
              <li key={r.key} className={`pt-row is-${r.kind}`}>
                {r.href ? <a href={r.href} className="pt-a">{body}</a> : <span className="pt-a">{body}</span>}
              </li>
            );
          })}
        </ul>
      </ScrollDraw>
      <figcaption className="pt-cap">
        Fig. 1 — what the CLI writes: one file per block, one dependency. Read from <span>/r/*.json</span>.
      </figcaption>
    </figure>
  );
}
