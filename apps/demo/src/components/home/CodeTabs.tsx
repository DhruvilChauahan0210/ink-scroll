'use client';

import { useState } from 'react';

type Snippet = { id: string; label: string; file: string; code: string };

const SNIPPETS: Snippet[] = [
  {
    id: 'vanilla',
    label: 'JavaScript',
    file: 'main.js',
    code: `import { scrollDraw, scrollAnimate } from 'svg-scroll-draw';

// Draw every path in #logo as it scrolls through the viewport
scrollDraw('#logo', { easing: 'ease-out', stagger: 0.1 });

// Animate any CSS property from scroll
scrollAnimate('.card', {
  props: { opacity: [0, 1], transform: ['translateY(32px)', 'none'] },
  once: true,
});`,
  },
  {
    id: 'react',
    label: 'React',
    file: 'Hero.tsx',
    code: `'use client';
import { ScrollDraw, ScrollText } from 'svg-scroll-draw/react';

export function Hero() {
  return (
    <>
      <ScrollText as="h1" split="words" stagger={0.05}>
        Every word arrives on scroll
      </ScrollText>
      <ScrollDraw easing="ease-out">
        <svg viewBox="0 0 200 80">{/* paths */}</svg>
      </ScrollDraw>
    </>
  );
}`,
  },
  {
    id: 'vue',
    label: 'Vue',
    file: 'Hero.vue',
    code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2">
    <svg viewBox="0 0 200 80"><!-- paths --></svg>
  </ScrollDraw>
</template>`,
  },
  {
    id: 'cdn',
    label: 'CDN',
    file: 'index.html',
    code: `<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<scroll-draw easing="ease-out" once>
  <svg viewBox="0 0 200 80"><!-- paths --></svg>
</scroll-draw>`,
  },
];

export function CodeTabs() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);
  const snippet = SNIPPETS.find((s) => s.id === active) ?? SNIPPETS[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the code stays selectable */
    }
  };

  return (
    <div className="code">
      <div className="code-head">
        <div className="tabs" role="tablist" aria-label="Framework">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={s.id === active}
              aria-controls="code-panel"
              className="tab"
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" className="copy-btn" onClick={copy} aria-live="polite">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <div id="code-panel" role="tabpanel" aria-labelledby={`tab-${snippet.id}`}>
        <div className="code-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span className="code-file">{snippet.file}</span>
        </div>
        <pre>{snippet.code}</pre>
      </div>
    </div>
  );
}
