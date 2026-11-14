<script setup>
import { ScrollDraw, ScrollAnimate, ScrollText, useScrollCounter } from 'svg-scroll-draw/vue';

const users = useScrollCounter({ to: 12480, format: (n) => Math.round(n).toLocaleString('en-US') });
const section = { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '0 16px' };
</script>

<template>
  <main style="font-family: system-ui, sans-serif; background: #fafaf7; color: #17181c">
    <section :style="section"><p>Scroll down ↓</p></section>

    <section :style="section">
      <ScrollDraw easing="ease-out">
        <svg viewBox="0 0 500 200" width="520" style="max-width: 90vw; height: auto"
          fill="none" stroke="#2d55d8" stroke-width="6" stroke-linecap="round">
          <path d="M20 150 C 120 20, 200 20, 250 100 S 380 180, 480 50" />
        </svg>
      </ScrollDraw>
    </section>

    <section :style="section">
      <ScrollText tag="h1" :options="{ split: 'words', stagger: 0.05, once: true }"
        style="font-size: clamp(32px, 6vw, 64px); max-width: 16ch; text-align: center">
        Every word here arrives on scroll
      </ScrollText>
    </section>

    <section :style="section">
      <ScrollAnimate :options="{ props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, easing: 'ease-out', once: true }">
        <div style="padding: 24px; border: 2px solid #17181c; border-radius: 12px; max-width: 420px">
          Fades and slides in with ScrollAnimate.
        </div>
      </ScrollAnimate>
    </section>

    <section :style="section">
      <p style="font-size: 48px; font-weight: 700"><span ref="users">12,480</span> users</p>
    </section>

    <section :style="section"><p>The end.</p></section>
  </main>
</template>
