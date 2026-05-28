'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  // Only render portal after hydration
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const overlay = open ? (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      color: '#000000',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid #000000',
        flexShrink: 0,
        backgroundColor: '#ffffff',
      }}>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: '#000' }}>
          svg-scroll-draw
        </span>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, cursor: 'pointer',
            background: 'none', border: 'none', color: '#000',
          }}
        >
          ✕
        </button>
      </div>

      {/* Nav links — flex-1 fills remaining height */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 24px',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
      }}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              fontSize: 'clamp(28px, 8vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              padding: '12px 0',
              borderBottom: '1px solid #e5e7eb',
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
        padding: '20px 24px',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backgroundColor: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a href={GH} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              padding: '8px 16px', borderRadius: 9999,
              background: '#000', color: '#fff',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
            GitHub →
          </a>
          <a href={NPM} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              padding: '8px 16px', borderRadius: 9999,
              border: '1px solid #d1d5dc', color: '#555',
              fontSize: 13, fontFamily: 'monospace', textDecoration: 'none',
            }}>
            npm
          </a>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#888' }}>v1.0.0</span>
        </div>
        <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#999', margin: 0 }}>
          MIT · Zero dependencies · ~3 KB gzipped
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Hamburger — visible on mobile & tablet */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden"
        style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          gap: 5, width: 36, height: 36,
          background: 'none', border: 'none', cursor: 'pointer',
          flexShrink: 0, color: 'currentColor',
        }}
      >
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 2 }} />
      </button>

      {/* Portal renders directly on document.body — bypasses parent overflow:hidden */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
