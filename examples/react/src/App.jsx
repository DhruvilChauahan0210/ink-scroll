import { ScrollDraw, ScrollAnimate, ScrollText } from 'svg-scroll-draw/react';

const section = { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '0 16px' };

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf7', color: '#17181c' }}>
      <section style={section}><p>Scroll down ↓ (StrictMode is on — no duplicate triggers)</p></section>

      <section style={section}>
        <ScrollDraw easing="ease-out">
          <svg viewBox="0 0 500 200" width="520" style={{ maxWidth: '90vw', height: 'auto' }}
            fill="none" stroke="#2d55d8" strokeWidth="6" strokeLinecap="round">
            <path d="M20 150 C 120 20, 200 20, 250 100 S 380 180, 480 50" />
          </svg>
        </ScrollDraw>
      </section>

      <section style={section}>
        <ScrollText as="h1" split="words" stagger={0.05} once
          style={{ fontSize: 'clamp(32px, 6vw, 64px)', maxWidth: '16ch', textAlign: 'center' }}>
          Every word here arrives on scroll
        </ScrollText>
      </section>

      <section style={section}>
        <ScrollAnimate props={{ opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }} easing="ease-out" once>
          <div style={{ padding: 24, border: '2px solid #17181c', borderRadius: 12, maxWidth: 420 }}>
            Fades and slides in with ScrollAnimate.
          </div>
        </ScrollAnimate>
      </section>

      <section style={section}><p>The end.</p></section>
    </main>
  );
}
