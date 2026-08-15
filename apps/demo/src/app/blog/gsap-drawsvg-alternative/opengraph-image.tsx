import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'svg-scroll-draw vs GSAP DrawSVG — Free Alternative';
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
        {/* Decorative grid */}
        {[200, 380, 520].map((y) => (
          <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}
        {[400, 700, 950].map((x) => (
          <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 1, background: 'rgba(255,255,255,0.04)' }} />
        ))}
        <div style={{ position: 'absolute', top: 48, right: 48, width: 12, height: 12, borderRadius: '50%', background: '#ff90e8' }} />

        {/* Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '6px 16px', fontSize: 13, color: '#666',
          marginBottom: 36, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Free Alternative · MIT · ~10 KB
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 72, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: '#fff', marginBottom: 32 }}>
          <span>svg-scroll-draw</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#444' }}>vs</span>
            <span style={{ color: '#666' }}>GSAP DrawSVG</span>
          </div>
        </div>

        {/* Comparison pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
          {[
            { label: '~10 KB',    sub: 'vs ~40 KB',       bg: '#ff90e8', text: '#111' },
            { label: 'MIT',        sub: 'fork it freely',   bg: '#22c55e', text: '#111' },
            { label: 'Zero deps',  sub: 'vs 3 packages',    bg: '#fff',    text: '#111' },
            { label: 'Native CSS', sub: 'compositor-driven', bg: '#5865F2', text: '#fff' },
          ].map(({ label, sub, bg, text }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: text }}>{label}</span>
              <span style={{ fontSize: 11, color: text, opacity: 0.65 }}>{sub}</span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 48, right: 80, fontSize: 16, color: '#444', fontFamily: 'monospace' }}>
          svg-scroll-draw.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
