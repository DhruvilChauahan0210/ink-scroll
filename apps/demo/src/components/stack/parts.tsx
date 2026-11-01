import type { ReactNode } from 'react';

/**
 * Pieces the three stack pages share — /react-scroll-animation,
 * /nextjs-scroll-animation and /lenis-scroll-animation. Styles in stack.css,
 * scoped `.site .stk`.
 */

export const pad = (n: number) => String(n).padStart(2, '0');

export type TocItem = { id: string; label: string };

/** A section: its number and name in a title strip, then the heading. */
export function Sec({ n, k, id, title, children }: { n: number; k: string; id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="stk-sec" aria-labelledby={id}>
      <div className="tb stk-tb">
        <span className="tb-n">{pad(n)}</span>
        <span>{k}</span>
      </div>
      <h2 id={id} className="stk-h2">{title}</h2>
      {children}
    </section>
  );
}

/** The contents list, beside the body on wide screens. */
export function Toc({ label, items }: { label: string; items: TocItem[] }) {
  return (
    <nav className="stk-toc" aria-label={label}>
      <p className="stk-toc-h">{label}</p>
      {items.map((it, i) => (
        <a key={it.id} href={`#${it.id}`} className="stk-toc-a"><span>{pad(i + 1)}</span>{it.label}</a>
      ))}
    </nav>
  );
}

/** A margin note in the sheet's style: a mono key, then the text. */
export function Note({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="stk-note">
      <span className="stk-note-k">{k}</span>
      <div>{children}</div>
    </div>
  );
}

/** Inline code. Short names never break; `long` lets a whole expression wrap. */
export function C({ children, long = false }: { children: ReactNode; long?: boolean }) {
  return <code className={`stk-c${long ? ' is-long' : ''}`}>{children}</code>;
}
