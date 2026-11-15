<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';

// Made in the browser: the server HTML carries no path data.
function spiral(turns = 9) {
  const points: string[] = [];
  for (let t = 0; t <= turns * Math.PI * 2; t += 0.05) {
    const r = 46 * (1 - t / (turns * Math.PI * 2));
    points.push(`${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return 'M' + points.join('L');
}

const d = ref<string | null>(null);
onMounted(() => {
  d.value = spiral();
});
</script>

<template>
  <!-- ScrollDraw collects the paths when it mounts, so it mounts with them. -->
  <ScrollDraw v-if="d" easing="linear" :trigger="{ start: 'center 115%', end: 'center 50%' }">
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="0.6">
      <path :d="d" />
    </svg>
  </ScrollDraw>
</template>
