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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-lg"
        style={{ flexShrink: 0 }}
      >
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
      </button>

      {/* Full-page overlay */}
      {open && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            color: '#000000',
          }}
        >
          {/* Top bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 56,
            borderBottom: '1px solid #000',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>
              svg-scroll-draw
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{
                width: 36, height: 36, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, cursor: 'pointer',
                background: 'none', border: 'none', color: '#000',
              }}
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <nav style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 24px',
            overflowY: 'auto',
          }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  fontSize: 'clamp(32px, 9vw, 52px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  paddingTop: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid #d1d5dc',
                  color: '#000000',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom bar */}
          <div style={{
            padding: '24px',
            borderTop: '1px solid #d1d5dc',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={GH}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '8px 18px', borderRadius: 9999,
                  background: '#000', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                GitHub →
              </a>
              <a
                href={NPM}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '8px 18px', borderRadius: 9999,
                  border: '1px solid #d1d5dc', color: '#444',
                  fontSize: 14, fontFamily: 'monospace',
                  textDecoration: 'none',
                }}
              >
                npm
              </a>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#666' }}>v1.0.0</span>
            </div>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#888', margin: 0 }}>
              MIT · Zero dependencies · ~3 KB gzipped
            </p>
          </div>
        </div>
      )}
    </>
  );
}
