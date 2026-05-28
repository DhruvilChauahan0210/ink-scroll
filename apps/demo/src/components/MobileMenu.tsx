'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const NAV_LINKS = [
  { num: '01', href: '/',           label: 'Home' },
  { num: '02', href: '/docs',       label: 'Docs' },
  { num: '03', href: '/examples',   label: 'Examples' },
  { num: '04', href: '/playground', label: 'Playground' },
  { num: '05', href: '/changelog',  label: 'Changelog' },
];

export function MobileMenu() {
  const [rendered, setRendered] = useState(false); // in DOM
  const [open,     setOpen]     = useState(false); // animated state
  const [mounted,  setMounted]  = useState(false); // SSR guard
  const [hover,    setHover]    = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = rendered ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [rendered]);

  function handleOpen() {
    clearTimeout(closeTimer.current);
    setRendered(true);
    // One frame delay so the transition fires from the initial state
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }

  function handleClose() {
    setOpen(false);
    closeTimer.current = setTimeout(() => setRendered(false), 380);
  }

  const overlay = rendered ? (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh',
      zIndex: 99999,
    }}>
      {/* ── Top bar — NO animation, instantly visible like the sticky nav ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--color-light-linen, #ffffff)',
        borderBottom: '1px solid var(--color-pitch-black, #000)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em',
          color: 'var(--color-pitch-black, #000)',
        }}>
          svg-scroll-draw
        </span>
        <button
          onClick={handleClose}
          aria-label="Close menu"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 9999,
            border: '1.5px solid var(--color-pitch-black, #000)',
            background: 'transparent',
            color: 'var(--color-pitch-black, #000)',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Close <span style={{ fontSize: 14 }}>✕</span>
        </button>
      </div>

      {/* ── Animated panel — slides in below the top bar ── */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--color-light-linen, #ffffff)',
        color: 'var(--color-pitch-black, #000)',
        opacity:   open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Nav links */}
        <nav style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 24px', overflowY: 'auto',
        }}>
          {NAV_LINKS.map(({ num, href, label }, i) => (
            <Link
              key={href}
              href={href}
              onClick={handleClose}
              onMouseEnter={() => setHover(href)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 16,
                padding: '14px 0',
                borderBottom: i < NAV_LINKS.length - 1
                  ? '1px solid var(--color-subtle-ash, #d1d5dc)' : 'none',
                color: hover === href
                  ? 'var(--color-creator-pink, #ff90e8)'
                  : 'var(--color-pitch-black, #000)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10, color: 'var(--color-graphite-border, #888)',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                flexShrink: 0, paddingTop: 4,
              }}>
                {num}
              </span>
              <span style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontWeight: 800,
                fontSize: 'clamp(32px, 9vw, 52px)',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom bar */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-subtle-ash, #d1d5dc)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={GH} target="_blank" rel="noopener noreferrer"
              onClick={handleClose}
              style={{
                padding: '7px 16px', borderRadius: 9999,
                background: 'var(--color-pitch-black, #000)',
                color: 'var(--color-light-linen, #fff)',
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: 12, fontWeight: 600, textDecoration: 'none',
              }}>
              GitHub →
            </a>
            <a href={NPM} target="_blank" rel="noopener noreferrer"
              onClick={handleClose}
              style={{
                padding: '7px 16px', borderRadius: 9999,
                border: '1.5px solid var(--color-subtle-ash, #d1d5dc)',
                color: 'var(--color-graphite-border, #444)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12, textDecoration: 'none',
              }}>
              npm
            </a>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11, color: 'var(--color-graphite-border, #888)',
            letterSpacing: '0.05em',
          }}>
            v1.0.0 · MIT · ~3 KB
          </span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={handleOpen}
        aria-label="Open navigation menu"
        className="lg:hidden"
        style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          gap: 5, width: 36, height: 36,
          background: 'none', border: 'none', cursor: 'pointer',
          flexShrink: 0, padding: 0,
        }}
      >
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
        <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
