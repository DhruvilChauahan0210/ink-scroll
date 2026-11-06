'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import type { SiteGroup } from '@/components/site/sitemap';
import { HomeThemeToggle } from './HomeThemeToggle';
import { Progress } from './Progress';

const GH = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/examples', label: 'Examples' },
  { href: '/guides', label: 'Guides' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/blog', label: 'Blog' },
];

/** Asks SmoothScroll to hold the page still while the menu covers it. */
const holdScroll = (hold: boolean) => window.dispatchEvent(new CustomEvent('home:hold-scroll', { detail: hold }));

/**
 * The homepage nav. Transparent over the hero; once the page moves a glass
 * bar fades in behind it — same size, same positions — so nothing shows
 * through and nothing in it moves. The
 * mark is drawn by the library on load. Below 1024px the links move into a
 * full-screen menu that matches the page.
 *
 * Inner pages pass `solid` (no hero to sit over, so the glass is always on)
 * and `active`, the section the page belongs to.
 *
 * `more` is every other page — frameworks, comparisons, resources — built
 * server-side in components/site/sitemap.ts. On desktop it opens under a
 * "More" button; in the phone menu it follows the five sections.
 */
export function HomeNav({
  version,
  active,
  solid = false,
  more = [],
}: {
  version: string;
  active?: string;
  solid?: boolean;
  more?: SiteGroup[];
}) {
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = more.some((g) => g.links.some((l) => l.href === active));

  // Scrolled state as an attribute, written straight to the element.
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    let raf = 0;
    const read = () => { raf = 0; el.toggleAttribute('data-scrolled', solid || window.scrollY > 24); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [solid]);

  // The "More" panel closes on Escape and on any press outside the nav.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    const onDown = (e: PointerEvent) => { if (!nav.current?.contains(e.target as Node)) setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [moreOpen]);

  useEffect(() => {
    if (!open) return;
    holdScroll(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { holdScroll(false); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <header ref={nav} className={`nav${open ? ' is-open' : ''}`} data-scrolled={solid ? '' : undefined}>
        <Progress />
        <div className="nav-in">
          <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
            <ScrollDraw className="nav-mark-wrap" autoplay duration={1100} delay={250} easing="ease-in-out" once>
              <svg className="nav-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17 C 6 6, 10 6, 12 12 S 18 18, 21 7" />
              </svg>
            </ScrollDraw>
            <span className="nav-word">svg-scroll-draw</span>
            <span className="nav-ver">v{version}</span>
            {/* The name is the visible text plus this: an aria-label that left the
                version out failed axe's label-content-name-mismatch on every page. */}
            <span className="sr-only"> home</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={active === l.href ? 'page' : undefined}>{l.label}</Link>
            ))}
            {more.length > 0 && (
              <button
                type="button"
                className={`nav-more${inMore ? ' is-current' : ''}`}
                aria-expanded={moreOpen}
                aria-controls="nav-more-panel"
                onClick={() => setMoreOpen((o) => !o)}
              >
                More
                <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1 L5 5 L9 1" /></svg>
              </button>
            )}
          </nav>

          <div className="nav-right">
            <a href={GH} className="nav-gh" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            <HomeThemeToggle />
            <Link href="/docs" className="btn btn-sm btn-solid nav-cta">Get started</Link>
            <button
              type="button"
              className="nav-burger"
              aria-expanded={open}
              aria-controls="home-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <i /><i />
            </button>
          </div>
        </div>

        {more.length > 0 && (
          <div id="nav-more-panel" className="nav-panel" hidden={!moreOpen}>
            {more.map((g) => (
              <div key={g.key} className={`nav-panel-col nav-panel-${g.key}`}>
                <p className="nav-panel-h">{g.title}</p>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setMoreOpen(false)} aria-current={active === l.href ? 'page' : undefined}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </header>

      <div id="home-menu" className={`menu${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open} data-lenis-prevent>
        <nav className="menu-links" aria-label="Menu">
          {LINKS.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={active === l.href ? 'page' : undefined} style={{ '--i': i } as React.CSSProperties}>
              <span className="menu-n">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        {more.length > 0 && (
          <div className="menu-more">
            {more.map((g, gi) => (
              <section key={g.key} className="menu-more-g" style={{ '--i': LINKS.length + gi } as React.CSSProperties}>
                <p className="menu-more-h">{g.title}</p>
                <div className="menu-more-links">
                  {g.links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={active === l.href ? 'page' : undefined}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <div className="menu-foot">
          <a href={GH} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={NPM} target="_blank" rel="noopener noreferrer">npm ↗</a>
          <span className="menu-meta">v{version} · MIT</span>
        </div>
      </div>
    </>
  );
}
