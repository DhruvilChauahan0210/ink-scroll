import './kit.css';
import type { ReactNode } from 'react';
import { BuiltWith } from '../BuiltWith';

/*
 * The frame every showcase site is built in: header, sections, pricing,
 * quote and footer, all styled from a handful of variables each site sets on
 * its own root class (--bg, --fg, --mut, --line, --card, --accent,
 * --accent-fg, --head, --body, --radius). The brand, its art and its
 * svg-scroll-draw effect are the site's own.
 */

export function Site({ className, brand, links, cta, example, apis, footnote, children }: {
  className: string;
  brand: ReactNode;
  links: string[];
  cta: string;
  example: string;
  apis: string;
  footnote: string;
  children: ReactNode;
}) {
  return (
    <div className={`sk ${className}`}>
      <header className="sk-nav">
        <a className="sk-brand" href="#top">{brand}</a>
        <nav className="sk-links" aria-label="Main">{links.map((l) => <a key={l} href="#top">{l}</a>)}</nav>
        <a className="sk-btn sk-btn-sm" href="#top">{cta}</a>
      </header>
      <main id="top">{children}</main>
      <footer className="sk-foot">
        <span className="sk-brand">{brand}</span>
        <span>{footnote}</span>
        <span className="sk-legal">A fictional company — this is a demo site.</span>
      </footer>
      <BuiltWith example={example} apis={apis} />
    </div>
  );
}

export function Hero({ kicker, title, lede, actions, art, center = false, id }: {
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: [string, string?];
  art?: ReactNode;
  center?: boolean;
  id?: string;
}) {
  return (
    <section className={`sk-hero${center ? ' is-center' : ''}${art ? ' has-art' : ''}`} id={id}>
      <div className="sk-hero-copy">
        {kicker && <p className="sk-kick">{kicker}</p>}
        <h1 className="sk-h1">{title}</h1>
        {lede && <p className="sk-lede">{lede}</p>}
        {actions && (
          <div className="sk-ctas">
            <a className="sk-btn" href="#top">{actions[0]}</a>
            {actions[1] && <a className="sk-btn sk-btn-ghost" href="#top">{actions[1]}</a>}
          </div>
        )}
      </div>
      {art && <div className="sk-hero-art">{art}</div>}
    </section>
  );
}

export function Sec({ kicker, title, lede, children, id, tone, center = false }: {
  kicker?: string;
  title?: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  id?: string;
  tone?: 'alt' | 'ink';
  center?: boolean;
}) {
  return (
    <section className={`sk-sec${tone ? ` sk-${tone}` : ''}${center ? ' is-center' : ''}`} id={id}>
      {(kicker || title || lede) && (
        <div className="sk-sec-head">
          {kicker && <p className="sk-kick">{kicker}</p>}
          {title && <h2 className="sk-h2">{title}</h2>}
          {lede && <p className="sk-lede">{lede}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pricing({ tiers }: { tiers: { n: string; p: string; s: string; f: string[]; hot?: boolean; cta?: string }[] }) {
  return (
    <div className="sk-tiers">
      {tiers.map((t) => (
        <div key={t.n} className={`sk-tier${t.hot ? ' hot' : ''}`}>
          <h3>{t.n}</h3>
          <p className="sk-price"><b>{t.p}</b> {t.s}</p>
          <ul>{t.f.map((x) => <li key={x}>{x}</li>)}</ul>
          <a className={`sk-btn${t.hot ? '' : ' sk-btn-ghost'}`} href="#top">{t.cta ?? 'Get started'}</a>
        </div>
      ))}
    </div>
  );
}

export function Quote({ text, who }: { text: string; who: ReactNode }) {
  return (
    <section className="sk-quote">
      <blockquote>“{text}”</blockquote>
      <p>{who}</p>
    </section>
  );
}
