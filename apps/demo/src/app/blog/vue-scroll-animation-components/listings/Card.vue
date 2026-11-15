<script setup lang="ts">
import { ScrollAnimate, type ScrollAnimateOptions } from 'svg-scroll-draw/vue';

const rise: ScrollAnimateOptions = {
  props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
  easing: 'ease-out',
  once: true,
};
</script>

<template>
  <!-- ScrollAnimate takes one options object, not separate props. -->
  <ScrollAnimate :options="rise">
    <article class="card">Fades up as it scrolls into view.</article>
  </ScrollAnimate>
</template>
