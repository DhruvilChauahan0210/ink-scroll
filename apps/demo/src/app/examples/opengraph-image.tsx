import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Examples — svg-scroll-draw real-world demos';
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
        <div style={{ position: 'absolute', bottom: -80, left: -80,  width: 350, height: 350, borderRadius: '50%', border: '1.5px solid #d4cfc5', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 40, right: 40, width: 12, height: 12, borderRadius: '50%', background: '#ffc900' }} />

        {/* Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #ccc', borderRadius: 999,
          padding: '6px 16px', fontSize: 13, color: '#888',
          marginBottom: 40, letterSpacing: '0.15em', textTransform: 'uppercase',
          background: 'rgba(245,240,232,0.8)',
        }}>
          Real-world patterns · No GSAP
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 78, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: '#111', marginBottom: 36 }}>
          <span>13 SVG SCROLL</span>
          <span style={{ background: '#ff90e8', borderRadius: 12, padding: '2px 12px', display: 'flex', alignItems: 'center' }}>
            DEMOS.
          </span>
        </div>

        {/* Example tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 48 }}>
          {[
            ['Logo Reveal',    '#ff90e8'],
            ['Line Chart',     '#ffc900'],
            ['Signature',      '#111'],
            ['Flowchart',      '#5865F2'],
            ['Map Route',      '#ffc900'],
            ['Architecture',   '#22c55e'],
            ['Timeline API',   '#ff90e8'],
            ['Group API',      '#5865F2'],
            ['Sequence API',   '#22c55e'],
          ].map(([label, color]) => (
            <div key={label} style={{
              border: `1.5px solid ${color}`, borderRadius: 999,
              padding: '6px 14px', fontSize: 14, color: '#333', fontWeight: 600,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 48, right: 80, fontSize: 18, color: '#888', fontFamily: 'monospace' }}>
          svg-scroll-draw.vercel.app/examples
        </div>
      </div>
    ),
    { ...size },
  );
}
