'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
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
const MENU = [...LINKS, { href: '/playground', label: 'Playground' }, { href: '/changelog', label: 'Changelog' }];

/** Asks SmoothScroll to hold the page still while the menu covers it. */
const holdScroll = (hold: boolean) => window.dispatchEvent(new CustomEvent('home:hold-scroll', { detail: hold }));

/**
 * The homepage nav. Transparent over the hero; once the page moves a glass
 * bar fades in behind it — same size, same positions — so nothing shows
 * through and nothing in it moves. The
 * mark is drawn by the library on load. Below 1024px the links move into a
 * full-screen menu that matches the page.
 */
export function HomeNav({ version }: { version: string }) {
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  // Scrolled state as an attribute, written straight to the element.
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    let raf = 0;
    const read = () => { raf = 0; el.toggleAttribute('data-scrolled', window.scrollY > 24); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!open) return;
    holdScroll(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { holdScroll(false); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <header ref={nav} className={`nav${open ? ' is-open' : ''}`}>
        <Progress />
        <div className="nav-in">
          <Link href="/" className="nav-brand" aria-label="svg-scroll-draw home" onClick={() => setOpen(false)}>
            <ScrollDraw className="nav-mark-wrap" autoplay duration={1100} delay={250} easing="ease-in-out" once>
              <svg className="nav-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17 C 6 6, 10 6, 12 12 S 18 18, 21 7" />
              </svg>
            </ScrollDraw>
            <span className="nav-word">svg-scroll-draw</span>
            <span className="nav-ver">v{version}</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
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
      </header>

      <div id="home-menu" className={`menu${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <nav className="menu-links" aria-label="Menu">
          {MENU.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ '--i': i } as React.CSSProperties}>
              <span className="menu-n">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="menu-foot">
          <a href={GH} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={NPM} target="_blank" rel="noopener noreferrer">npm ↗</a>
          <span className="menu-meta">v{version} · MIT</span>
        </div>
      </div>
    </>
  );
}
