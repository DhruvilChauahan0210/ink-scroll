import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Changelog — svg-scroll-draw release history';
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
        <div style={{ position: 'absolute', top: 40, right: 40, width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />

        {/* Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #ccc', borderRadius: 999,
          padding: '6px 16px', fontSize: 14, color: '#888',
          marginBottom: 40, letterSpacing: '0.15em', textTransform: 'uppercase',
          background: 'rgba(245,240,232,0.8)',
        }}>
          Release history · svg-scroll-draw
        </div>

        {/* Headline */}
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', color: '#111', marginBottom: 36 }}>
          CHANGELOG
        </div>

        {/* Latest release highlight */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{
            background: '#ff90e8', borderRadius: 8,
            padding: '6px 18px', fontSize: 20, fontWeight: 800,
            color: '#111', fontFamily: 'monospace',
          }}>
            v1.1.0
          </div>
          <div style={{ fontSize: 22, color: '#444' }}>
            Native CSS scroll-driven animation
          </div>
        </div>

        {/* Version timeline */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { v: 'v1.1.0', highlight: true },
            { v: 'v1.0.0', highlight: false },
            { v: 'v0.7.0', highlight: false },
            { v: 'v0.6.0', highlight: false },
          ].map(({ v, highlight }) => (
            <div
              key={v}
              style={{
                border: highlight ? '1.5px solid #ff90e8' : '1px solid #ccc',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 16, fontFamily: 'monospace',
                color: highlight ? '#111' : '#999',
                fontWeight: highlight ? 700 : 400,
              }}
            >
              {v}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 48, right: 80, fontSize: 18, color: '#888', fontFamily: 'monospace' }}>
          svg-scroll-draw.vercel.app/changelog
        </div>
      </div>
    ),
    { ...size },
  );
}
