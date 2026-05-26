'use client';
import { useState } from 'react';
import { CopyButton } from './CopyButton';

const TABS = [
  {
    id: 'react',
    label: 'React',
    filename: 'Hero.tsx',
    code: `import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw easing="ease-out" speed={1.2}>
      <svg>...</svg>
    </ScrollDraw>
  );
}`,
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    filename: 'Hero.tsx',
    code: `'use client';
import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw easing="ease-out" speed={1.2}>
      <svg>...</svg>
    </ScrollDraw>
  );
}`,
  },
  {
    id: 'vue',
    label: 'Vue 3',
    filename: 'Hero.vue',
    code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2">
    <svg>...</svg>
  </ScrollDraw>
</template>`,
  },
  {
    id: 'svelte',
    label: 'Svelte',
    filename: 'Hero.svelte',
    code: `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ easing: 'ease-out', speed: 1.2 }}>
  <svg>...</svg>
</div>`,
  },
  {
    id: 'solid',
    label: 'SolidJS',
    filename: 'Hero.tsx',
    code: `import { useScrollDraw } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollDraw({ easing: 'spring', fade: true });
  return (
    <div ref={ref}>
      <svg>...</svg>
    </div>
  );
}`,
  },
  {
    id: 'angular',
    label: 'Angular',
    filename: 'hero.component.ts',
    code: `import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  template: '<div #container><svg>...</svg></div>'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, {
      easing: 'ease-out',
      speed: 1.2,
    });
  }

  ngOnDestroy() { this.draw.destroy(); }
}`,
  },
  {
    id: 'astro',
    label: 'Astro',
    filename: 'Hero.astro',
    code: `---
// No server-side imports needed
---
<div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","fade":true}'>
  <svg>...</svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();
</script>`,
  },
  {
    id: 'nuxt',
    label: 'Nuxt',
    filename: 'Hero.vue',
    code: `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/nuxt';

const ref = useScrollDraw({ easing: 'ease-out', speed: 1.2 });
</script>

<template>
  <div :ref="ref">
    <svg>...</svg>
  </div>
</template>`,
  },
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    filename: 'main.js',
    code: `import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#my-svg', {
  easing: 'ease-out',
  speed: 1.2,
});`,
  },
  {
    id: 'cdn',
    label: 'CDN',
    filename: 'index.html',
    code: `<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<!-- Option A: Web Component (auto-registers) -->
<scroll-draw easing="ease-out" speed="1.2">
  <svg>...</svg>
</scroll-draw>

<!-- Option B: Vanilla JS API -->
<script>
  SvgScrollDraw.scrollDraw('#my-svg', { easing: 'ease-out' });
</script>`,
  },
] as const;

export function FrameworkTabs() {
  const [active, setActive] = useState<string>('react');
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="rounded-2xl overflow-hidden border border-pitch-black shadow-[4px_4px_0px_#000]">
      {/* Tab row */}
      <div className="flex border-b border-pitch-black bg-[#111] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 px-5 py-2.5 text-[12px] font-mono font-medium tracking-wide transition-colors whitespace-nowrap ${
              active === t.id
                ? 'bg-pitch-black text-light-linen'
                : 'text-[#666] hover:text-[#aaa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Filename bar */}
      <div className="bg-[#111] dark:bg-[#1a1a1a] flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#666] font-mono tracking-wide">{tab.filename}</span>
        <CopyButton text={tab.code} />
      </div>
      {/* Code */}
      <pre className="bg-[#242423] dark:bg-[#1c1c1c] text-[#e8e8e3] px-5 py-4 text-[13px] font-mono leading-[1.75] overflow-x-auto min-h-[200px]">
        {tab.code}
      </pre>
    </div>
  );
}
