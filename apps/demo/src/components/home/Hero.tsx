import './hero.css';
import Link from 'next/link';
import { PenDrawing } from './PenDrawing';
import { CopyCommand } from './CopyCommand';

type Props = { version: string; gzipKb: number; unitTests: number; browserTests: number };

/**
 * Chapter 00 — the hero, in the same language as the chapters below it: a
 * pinned stage, copy on the left, and on the right an exploded fountain pen
 * that the library inks on load and assembles as you scroll.
 */
export function Hero({ version, gzipKb, unitTests, browserTests }: Props) {
  return (
    <section className="he" aria-label="Introduction">
      <div className="he-pin">
        <div className="he-in">
          <div className="he-copy">
            <Link href="/guides" className="he-news">
              <i aria-hidden="true" />
              <span>New in v{version}</span>
              <span className="he-news-t">React hooks for the AOS, ScrollReveal &amp; vivus drop-ins</span>
              <span aria-hidden="true">→</span>
            </Link>
            <p className="he-kicker"><span>00 / svg-scroll-draw</span><span>MIT · open source</span></p>
            <h1 className="he-title">The scroll animation library that draws.</h1>
            <p className="he-sub">
              Paths, text, pins and video — inked by scroll on the browser’s own timeline, with a frame loop
              wherever it has none.
            </p>
            <div className="he-cta">
              <CopyCommand />
              <Link href="/docs" className="btn btn-solid" data-magnetic>Get started</Link>
            </div>
            <dl className="he-stats">
              <div><dt>gzipped</dt><dd>{gzipKb}<small> KB</small></dd></div>
              <div><dt>dependencies</dt><dd>0</dd></div>
              <div><dt>unit tests</dt><dd>{unitTests}</dd></div>
              <div><dt>browser tests</dt><dd>{browserTests}<small> ×3</small></dd></div>
            </dl>
          </div>
          <PenDrawing stageSelector=".he" className="he-art" />
        </div>
        <div className="he-foot" aria-label="Works with">
          <span className="he-foot-k">works with</span>
          {['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Solid', 'Angular', 'Astro', 'Web Components'].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
