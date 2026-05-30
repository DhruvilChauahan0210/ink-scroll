import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Playground — svg-scroll-draw live SVG editor';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f5f0e8',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', border: '1.5px solid #d4cfc5' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', border: '1.5px solid #d4cfc5', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 40, right: 40, width: 12, height: 12, borderRadius: '50%', background: '#ffc900' }} />

        {/* Decorative SVG path mockup */}
        <svg
          style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}
          width="340" height="220" viewBox="0 0 340 220" fill="none"
        >
          <path d="M 20 110 C 60 30 100 190 140 110 C 180 30 220 190 260 110 C 290 50 320 90 340 80"
            stroke="#111" strokeWidth="6" strokeLinecap="round" />
          <circle cx="20"  cy="110" r="8" fill="#ff90e8" />
          <circle cx="140" cy="110" r="8" fill="#ffc900" />
          <circle cx="260" cy="110" r="8" fill="#5865F2" />
          <circle cx="340" cy="80"  r="8" fill="#22c55e" />
        </svg>

        {/* Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #ccc', borderRadius: 999,
          padding: '6px 16px', fontSize: 14, color: '#888',
          marginBottom: 40, letterSpacing: '0.15em', textTransform: 'uppercase',
          background: 'rgba(245,240,232,0.8)',
        }}>
          Live Editor · Instant Preview · Shareable URL
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 88, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', color: '#111', marginBottom: 32 }}>
          <span>⚡</span>
          <span>PLAYGROUND</span>
        </div>

        {/* Sub */}
        <div style={{ fontSize: 24, color: '#666', marginBottom: 48, maxWidth: 580 }}>
          Paste any SVG. Tweak easing, speed, stagger, fade, and stroke color. Share your result with a URL.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 14 }}>
          {['8 built-in examples', 'All options exposed', 'Share via URL'].map((label) => (
            <div
              key={label}
              style={{
                border: '1px solid #ccc', borderRadius: 8,
                padding: '8px 16px', fontSize: 16, color: '#444',
                fontFamily: 'monospace',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 48, right: 80, fontSize: 18, color: '#888', fontFamily: 'monospace' }}>
          svg-scroll-draw.vercel.app/playground
        </div>
      </div>
    ),
    { ...size },
  );
}
