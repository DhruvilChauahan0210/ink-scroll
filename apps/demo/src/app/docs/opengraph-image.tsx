import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Docs — svg-scroll-draw full API reference';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
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
        {/* Decorative grid lines */}
        {[200, 350, 500].map((y) => (
          <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}
        {[300, 600, 900].map((x) => (
          <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}

        {/* Accent dot */}
        <div style={{ position: 'absolute', top: 48, right: 48, width: 12, height: 12, borderRadius: '50%', background: '#ff90e8' }} />

        {/* Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
          padding: '6px 16px', fontSize: 13, color: '#666',
          marginBottom: 40, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          svg-scroll-draw · Full API Reference
        </div>

        {/* Headline */}
        <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: '#fff', marginBottom: 36 }}>
          DOCS
        </div>

        {/* Sections preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {[
            ['Options',          '30+ configuration options'],
            ['Instance Methods', 'pause · resume · seek · replay · destroy'],
            ['Frameworks',       'React · Vue · Svelte · Solid · Angular · Nuxt · Astro'],
            ['v0.7.0 APIs',      'createSpring · scrollDrawTimeline · CSS custom property'],
          ].map(([title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 3, height: 20, background: '#ff90e8', borderRadius: 2 }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{title}</span>
              <span style={{ fontSize: 16, color: '#555' }}>{sub}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: 'absolute', bottom: 48, right: 80, fontSize: 18, color: '#444', fontFamily: 'monospace' }}>
          svg-scroll-draw.vercel.app/docs
        </div>
      </div>
    ),
    { ...size },
  );
}
