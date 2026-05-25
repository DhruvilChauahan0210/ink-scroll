import { ScrollDraw } from '@/components/ScrollDraw';
import { OnCompleteDemo } from '@/components/OnCompleteDemo';

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_#0a0a0a_70%)]" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4 font-mono">
            svg-scroll-draw
          </p>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none mb-6">
            Draw with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              scroll.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">
            A zero-dependency library that animates SVG paths as you scroll.
            Under&nbsp;3KB&nbsp;gzipped.
          </p>
          <div className="flex items-center justify-center gap-3">
            <code className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm text-violet-300 font-mono">
              npm i svg-scroll-draw
            </code>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600">
          <span className="text-xs font-mono tracking-widest">SCROLL</span>
          <div className="w-px h-12 bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>
      </section>

      {/* Demo 1 — Simple path */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-16 px-6 md:px-20 py-32">
        <div className="flex-1 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400 font-mono mb-3">01 / basic</p>
          <h2 className="text-4xl font-bold mb-4">Simple path draw</h2>
          <p className="text-zinc-400 leading-relaxed">
            Drop{' '}
            <code className="text-violet-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">&lt;ScrollDraw&gt;</code>{' '}
            around any SVG. The library detects all paths, measures their total length, and
            animates{' '}
            <code className="text-violet-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">stroke-dashoffset</code>{' '}
            as the element enters the viewport.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ScrollDraw>
            <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
              <path
                d="M 40 280 C 40 160 160 40 280 40"
                stroke="#7c3aed"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 40 240 C 40 160 120 80 280 80"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="8 6"
              />
              <circle cx="40" cy="280" r="5" fill="#7c3aed" />
              <circle cx="280" cy="40" r="5" fill="#7c3aed" />
            </svg>
          </ScrollDraw>
        </div>
      </section>

      {/* Demo 2 — Easing + speed */}
      <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center gap-16 px-6 md:px-20 py-32 bg-[#0d0d1a]">
        <div className="flex-1 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-mono mb-3">02 / easing</p>
          <h2 className="text-4xl font-bold mb-4">Easing &amp; speed control</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Pass{' '}
            <code className="text-cyan-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">easing=&quot;ease-out&quot;</code>{' '}
            and{' '}
            <code className="text-cyan-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">speed={'{1.5}'}</code>{' '}
            to give the animation a natural deceleration feel. Supports <em>linear</em>,{' '}
            <em>ease-in</em>, <em>ease-out</em>, <em>ease-in-out</em>, or any custom function.
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm font-mono text-cyan-300 overflow-x-auto">
{`<ScrollDraw
  easing="ease-out"
  speed={1.5}
>
  <svg>...</svg>
</ScrollDraw>`}
          </pre>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ScrollDraw easing="ease-out" speed={1.5}>
            <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
              {[1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M ${160 - i * 26} 160 A ${i * 26} ${i * 26} 0 1 1 ${160 + i * 26} 160`}
                  stroke={`hsl(${185 + i * 14}, 80%, ${52 + i * 4}%)`}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </svg>
          </ScrollDraw>
        </div>
      </section>

      {/* Demo 3 — Fade */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-16 px-6 md:px-20 py-32">
        <div className="flex-1 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-mono mb-3">03 / fade</p>
          <h2 className="text-4xl font-bold mb-4">Draw + fade in</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Enable{' '}
            <code className="text-emerald-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">fade={'{true}'}</code>{' '}
            to simultaneously fade each path from{' '}
            <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-sm text-zinc-300">opacity: 0</code> to{' '}
            <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-sm text-zinc-300">1</code>{' '}
            as it draws. Creates an elegant materialisation effect.
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm font-mono text-emerald-300 overflow-x-auto">
{`<ScrollDraw
  fade={true}
  easing="ease-in-out"
>
  <svg>...</svg>
</ScrollDraw>`}
          </pre>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ScrollDraw fade easing="ease-in-out">
            <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
              {[60, 160, 260].map((x) =>
                [60, 160, 260].map((y) => (
                  <g key={`${x}-${y}`}>
                    <line x1={x - 14} y1={y - 14} x2={x + 14} y2={y + 14}
                      stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                    <line x1={x + 14} y1={y - 14} x2={x - 14} y2={y + 14}
                      stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                  </g>
                ))
              )}
            </svg>
          </ScrollDraw>
        </div>
      </section>

      {/* Demo 4 — Complex SVG */}
      <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center gap-16 px-6 md:px-20 py-32 bg-[#0d0d1a]">
        <div className="flex-1 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-400 font-mono mb-3">04 / complex</p>
          <h2 className="text-4xl font-bold mb-4">Complex multi-path SVG</h2>
          <p className="text-zinc-400 leading-relaxed">
            Every{' '}
            <code className="text-rose-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">&lt;path&gt;</code>,{' '}
            <code className="text-rose-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">&lt;line&gt;</code>,{' '}
            <code className="text-rose-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">&lt;polyline&gt;</code>, and{' '}
            <code className="text-rose-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">&lt;polygon&gt;</code>{' '}
            inside the container is discovered and animated automatically — no manual selectors needed.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ScrollDraw easing="ease-out" speed={0.9}>
            <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
              <polygon
                points="160,30 290,160 160,290 30,160"
                stroke="#f43f5e"
                strokeWidth="2"
                fill="none"
              />
              <polygon
                points="160,80 240,160 160,240 80,160"
                stroke="#fb7185"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                fill="none"
              />
              <line x1="160" y1="30" x2="160" y2="290" stroke="#f43f5e" strokeWidth="1" opacity="0.3" />
              <line x1="30" y1="160" x2="290" y2="160" stroke="#f43f5e" strokeWidth="1" opacity="0.3" />
              <path d="M 145 30 L 160 15 L 175 30" stroke="#fda4af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M 290 145 L 305 160 L 290 175" stroke="#fda4af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M 175 290 L 160 305 L 145 290" stroke="#fda4af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M 30 175 L 15 160 L 30 145" stroke="#fda4af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </ScrollDraw>
        </div>
      </section>

      {/* Demo 5 — onComplete (client component for interactivity) */}
      <OnCompleteDemo />

      {/* API Reference */}
      <section className="py-32 px-6 md:px-20 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono mb-3">API</p>
          <h2 className="text-4xl font-bold mb-12">Configuration options</h2>
          <div className="grid gap-3">
            {[
              { prop: 'selector', type: 'string', def: '"path, polyline, line, polygon"', desc: 'CSS selector to target specific child elements.' },
              { prop: 'speed', type: 'number', def: '1', desc: 'Scale factor — values > 1 complete the animation faster.' },
              { prop: 'fade', type: 'boolean', def: 'false', desc: 'Simultaneously fade opacity from 0 → 1 while drawing.' },
              { prop: 'easing', type: 'string | fn', def: '"linear"', desc: 'Built-in: linear, ease-in, ease-out, ease-in-out. Or pass a custom (t: number) => number.' },
              { prop: 'trigger.start', type: 'string', def: '"top bottom"', desc: 'When animation begins. Format: "element-anchor viewport-anchor".' },
              { prop: 'trigger.end', type: 'string', def: '"bottom top"', desc: 'When animation completes.' },
              { prop: 'onComplete', type: '() => void', def: '—', desc: 'Fires once when the path reaches 100% draw progress.' },
            ].map(({ prop, type, def, desc }) => (
              <div key={prop} className="grid grid-cols-1 md:grid-cols-[180px_140px_120px_1fr] gap-3 items-start p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <code className="text-violet-300 font-mono text-sm">{prop}</code>
                <code className="text-cyan-300 font-mono text-sm">{type}</code>
                <code className="text-zinc-400 font-mono text-sm">{def}</code>
                <p className="text-zinc-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-zinc-900">
        <p className="text-zinc-600 text-sm font-mono">
          svg-scroll-draw &nbsp;·&nbsp; MIT &nbsp;·&nbsp; &lt;3KB gzipped
        </p>
      </footer>
    </main>
  );
}
