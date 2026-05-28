'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const NAV_LINKS = [
  { href: '/',           label: 'Home' },
  { href: '/docs',       label: 'Docs' },
  { href: '/examples',   label: 'Examples' },
  { href: '/playground', label: 'Playground' },
  { href: '/changelog',  label: 'Changelog' },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger — visible on mobile & tablet, hidden on desktop */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="lg:hidden flex flex-col justify-center gap-[5px] w-9 h-9 rounded-lg hover:bg-subtle-ash/40 transition-colors shrink-0"
      >
        <span className="block mx-auto w-5 h-0.5 bg-pitch-black rounded-full" />
        <span className="block mx-auto w-5 h-0.5 bg-pitch-black rounded-full" />
        <span className="block mx-auto w-5 h-0.5 bg-pitch-black rounded-full" />
      </button>

      {/* Full-page overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[200] flex flex-col bg-light-linen">

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 h-14 border-b border-pitch-black shrink-0">
            <span className="font-display font-bold text-sm tracking-tight">svg-scroll-draw</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-subtle-ash/40 transition-colors text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col px-6 pt-6 overflow-y-auto">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="font-display font-extrabold text-[clamp(32px,8vw,52px)] leading-none tracking-[-0.03em] py-4 border-b border-subtle-ash hover:text-creator-pink transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom — external links + version */}
          <div className="px-6 py-8 flex flex-col gap-4 border-t border-subtle-ash shrink-0">
            <div className="flex items-center gap-4">
              <a
                href={GH}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold px-4 py-2 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors"
              >
                GitHub →
              </a>
              <a
                href={NPM}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="text-sm font-mono text-graphite-border px-4 py-2 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors"
              >
                npm
              </a>
              <span className="text-[11px] font-mono text-graphite-border">v1.0.0</span>
            </div>
            <p className="text-[11px] font-mono text-graphite-border">
              MIT · Zero dependencies · ~3 KB gzipped
            </p>
          </div>

        </div>
      )}
    </>
  );
}
