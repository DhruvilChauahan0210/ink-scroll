'use client';

import type { CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The Next.js page's opening drawing: the path one animated component takes
 * through a request — rendered on the server, where the engine is a no-op,
 * sent as HTML, then hydrated and attached in the browser. The rail between
 * each pair of stops is inked by the library on load, one after another.
 */

type Stop = { code: string; note: string; fork?: [string, string] };

const SERVER: Stop[] = [
  { code: 'app/page.tsx', note: 'A Server Component. Fetches its data and renders on the server.' },
  { code: "'use client' <FadeUp>", note: 'Still pre-rendered to HTML with the rest of the page.' },
  { code: "typeof window === 'undefined'", note: 'Every engine returns a no-op instance. Nothing touches the DOM.' },
];
const BROWSER: Stop[] = [
  { code: 'hydrate', note: 'The markup matches what the server sent. No hydration error.' },
  { code: 'useEffect', note: 'Runs in the browser only. The engine attaches to the element.' },
  { code: 'animation-timeline: view()', note: 'Supported: the browser’s scroll timeline, no JS per frame. Not yet: the JS engine.', fork: ['native CSS', 'JS engine'] },
];

function Lane({ label, sub, stops, start, delay }: { label: string; sub: string; stops: Stop[]; start: number; delay: number }) {
  return (
    <div className="rp-lane">
      <p className="rp-lane-k"><span>{label}</span><span>{sub}</span></p>
      <ScrollDraw className="rp-rail" selector=".rp-ink" autoplay duration={420} delay={delay} stagger={0.28} easing="ease-out" once>
        <ol className="rp-stops" start={start}>
          {stops.map((s, i) => (
            <li key={s.code} className="rp-stop" style={{ '--i': start + i } as CSSProperties}>
              <span className="rp-node" aria-hidden="true">{start + i}</span>
              {/* The rail from this stop's node to the next one's. */}
              {i < stops.length - 1 && (
                <svg className="rp-seg" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M1 0 V100" className="rp-ink" stroke="currentColor" />
                </svg>
              )}
              <code className="rp-code">{s.code}</code>
              <span className="rp-note">{s.note}</span>
              {s.fork && (
                <span className="rp-fork">
                  <span className="rp-fork-a">{s.fork[0]}</span>
                  <span className="rp-fork-or">or</span>
                  <span>{s.fork[1]}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </ScrollDraw>
    </div>
  );
}

export function RenderPath() {
  return (
    <figure className="stk-fig rp">
      <Lane label="server" sub="node · render" stops={SERVER} start={1} delay={250} />
      <div className="rp-wire" aria-hidden="true">
        <span>html over the wire — no window, no document</span>
      </div>
      <Lane label="browser" sub="client · scroll" stops={BROWSER} start={4} delay={1050} />
      <figcaption className="stk-cap">Fig. 1 — one animated component, from request to scroll</figcaption>
    </figure>
  );
}
