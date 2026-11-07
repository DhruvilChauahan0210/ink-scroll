import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SELF } from '@/data/competitors';
import { UNIT_TESTS } from '@/data/facts';

/**
 * The share card every page uses: the homepage's look (ink on near-black, one
 * editor's red, Geist and Geist Mono, a drafting grid) with the page's own
 * title. A page gets it by adding an `opengraph-image.tsx` that calls `ogImage`.
 *
 * Why every page needs that file: a page that sets its own `openGraph` metadata
 * replaces the inherited one, image included — 57 of 64 pages shipped with no
 * og:image at all. A file next to the page always wins.
 *
 * Figures come from data/competitors.ts and data/facts.ts, never typed here.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

const C = {
  bg: '#0b0b0c',
  fg: '#ece8e0',
  fg2: '#a19d95',
  fg3: '#66635d',
  line: 'rgba(236, 232, 224, 0.08)',
  line2: 'rgba(236, 232, 224, 0.18)',
  accent: '#ff5a36',
};

const fontDir = join(process.cwd(), 'src/app/_lib/fonts');
const font = (file: string) => readFile(join(fontDir, file));

export type OgCard = {
  /** Section label, upper-cased in the top-right corner: "Docs", "Guide"… */
  kicker: string;
  title: string;
  /** One supporting line under the title. */
  sub?: string;
};

function titleSize(title: string) {
  if (title.length <= 26) return 84;
  if (title.length <= 44) return 68;
  if (title.length <= 64) return 56;
  return 48;
}

export async function ogImage({ kicker, title, sub }: OgCard) {
  const [g400, g500, m400, m500] = await Promise.all([
    font('Geist-400.ttf'),
    font('Geist-500.ttf'),
    font('GeistMono-400.ttf'),
    font('GeistMono-500.ttf'),
  ]);

  // Sentence case at normal tracking (heydamir/unslop): no uppercase labels.
  const mono = { fontFamily: 'Geist Mono', letterSpacing: 0 };
  const stats: [string, string][] = [
    [`${SELF.gzipKb} KB`, 'Gzipped'],
    ['0', 'Dependencies'],
    [String(UNIT_TESTS), 'Unit tests'],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: C.bg,
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          color: C.fg,
          fontFamily: 'Geist',
          position: 'relative',
        }}
      >
        {/* The drawing: a stroke inked partway, the rest still in pencil. */}
        <svg
          width="330"
          height="240"
          viewBox="0 0 420 300"
          style={{ position: 'absolute', right: 56, top: 120 }}
        >
          <path
            d="M10 250 C 90 250, 110 80, 200 110 S 300 260, 410 40"
            fill="none"
            stroke={C.line2}
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          <path
            d="M10 250 C 90 250, 110 80, 200 110 S 300 260, 410 40"
            fill="none"
            stroke={C.accent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="330 1000"
          />
          <circle cx="10" cy="250" r="6" fill={C.bg} stroke={C.accent} strokeWidth="3" />
        </svg>

        {/* Top: mark and version, section label. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="34" height="22" viewBox="0 0 34 22">
              <path
                d="M2 18 C 8 18, 9 4, 17 6 S 26 20, 32 4"
                fill="none"
                stroke={C.fg}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ ...mono, fontSize: 20, fontWeight: 500, color: C.fg }}>svg-scroll-draw</div>
            <div
              style={{
                ...mono,
                fontSize: 15,
                color: C.fg2,
                border: `1px solid ${C.line2}`,
                borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              {`v${SELF.version}`}
            </div>
          </div>
          <div style={{ ...mono, fontSize: 18, color: C.fg3, display: 'flex', gap: 12 }}>
            <span style={{ color: C.accent }}>●</span>
            <span>{kicker}</span>
          </div>
        </div>

        {/* Middle: the page's own title. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
          <div
            style={{
              fontSize: titleSize(title),
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: C.fg,
            }}
          >
            {title}
          </div>
          {sub ? (
            <div style={{ fontSize: 26, lineHeight: 1.4, color: C.fg2, maxWidth: 640 }}>{sub}</div>
          ) : null}
        </div>

        {/* Bottom: the same figures the homepage quotes, and the address. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: `1px solid ${C.line2}`,
            paddingTop: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 40 }}>
            {stats.map(([n, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 30, fontWeight: 500, color: C.fg, letterSpacing: '-0.02em' }}>{n}</span>
                <span style={{ ...mono, fontSize: 14, color: C.fg3 }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'Geist Mono', fontSize: 18, color: C.fg2, whiteSpace: 'nowrap' }}>
            svg-scroll-draw.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Geist', data: g400, weight: 400, style: 'normal' },
        { name: 'Geist', data: g500, weight: 500, style: 'normal' },
        { name: 'Geist Mono', data: m400, weight: 400, style: 'normal' },
        { name: 'Geist Mono', data: m500, weight: 500, style: 'normal' },
      ],
    },
  );
}
