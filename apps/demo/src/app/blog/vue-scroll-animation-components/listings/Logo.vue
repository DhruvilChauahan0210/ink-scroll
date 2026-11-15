<script setup lang="ts">
import { useScrollDraw } from 'svg-scroll-draw/vue';

// A ref the composable fills once the element mounts.
const logo = useScrollDraw({ easing: 'ease-out' });
</script>

<template>
  <!-- ref="logo", the name as a string: not :ref="logo". -->
  <div ref="logo">
    <svg viewBox="0 0 120 40" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 30 L30 10 L50 30 L70 10 L90 30 L110 10" />
    </svg>
  </div>
</template>
