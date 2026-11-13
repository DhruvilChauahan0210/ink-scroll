import './hero.css';
import Link from 'next/link';
import { PenDrawing } from './PenDrawing';
import { CopyCommand } from './CopyCommand';
import { COMPETITORS } from '@/data/competitors';
import { TOOLS } from '@/data/tools';

type Props = { gzipKb: number; unitTests: number; browserTests: number };

/**
 * Chapter 00 — the hero, in the same language as the chapters below it: a
 * pinned stage, copy on the left, and on the right an exploded fountain pen
 * that the library inks on load and assembles as you scroll.
 */
/** The frameworks strip under the hero: each one with a page of its own links to it. */
const STRIP: [name: string, href?: string][] = [
  ['React', '/react-scroll-animation'],
  ['Next.js', '/nextjs-scroll-animation'],
  ['Vue', '/vue-scroll-animation'],
  ['Nuxt', '/nuxt-scroll-animation'],
  ['Svelte', '/svelte-scroll-animation'],
  ['Solid', '/solid-scroll-animation'],
  ['Angular', '/angular-scroll-animation'],
  ['Astro', '/astro-scroll-animation'],
  ['Web Components'],
];

export function Hero({ gzipKb, unitTests, browserTests }: Props) {
  return (
    <section className="he" aria-label="Introduction">
      <div className="he-pin">
        <div className="he-in">
          <div className="he-copy">
            <p className="he-kicker"><span>00 / svg-scroll-draw</span><span>MIT · open source</span></p>
            <h1 className="he-title">SVG line drawing on scroll, done right</h1>
            <p className="he-sub">
              Correct path lengths, stagger and morph, drawn on the browser’s own scroll timeline where it can
              be and by a frame loop where it can’t.{' '}
              <span className="he-sub-size">
                {gzipKb} KB gzipped, against {COMPETITORS.gsapStack.gzipKb} KB for GSAP, ScrollTrigger and DrawSVG.
              </span>
            </p>
            <div className="he-cta">
              <CopyCommand />
              <Link href="/docs" className="btn btn-solid" data-magnetic>Get started</Link>
            </div>
            <p className="he-alt">
              <span>
                Switch from <Link href="/vs-aos">AOS, ScrollReveal</Link> or <Link href="/vs-vivus">vivus</Link> in
                one line
              </span>
              <span className="he-alt-more" aria-hidden="true">·</span>
              <Link href="/tools" className="he-alt-more">{TOOLS.length} free tools</Link>
            </p>
            <dl className="he-stats">
              <div><dt>Gzipped</dt><dd>{gzipKb}<small> KB</small></dd></div>
              <div><dt>Dependencies</dt><dd>0</dd></div>
              <div><dt>Unit tests</dt><dd>{unitTests}</dd></div>
              <div><dt>Browser tests</dt><dd>{browserTests}<small> ×3</small></dd></div>
            </dl>
          </div>
          <PenDrawing stageSelector=".he" className="he-art" />
        </div>
        <div className="he-foot" aria-label="Works with">
          <span className="he-foot-k">Works with</span>
          {STRIP.map(([n, href]) =>
            href ? (
              <Link key={n} href={href} className="he-foot-a">
                {n}
              </Link>
            ) : (
              <span key={n}>{n}</span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
