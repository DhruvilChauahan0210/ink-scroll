<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';

  // Made in the browser: the server HTML carries no path data.
  function spiral(turns = 9) {
    const points: string[] = [];
    for (let t = 0; t <= turns * Math.PI * 2; t += 0.05) {
      const r = 46 * (1 - t / (turns * Math.PI * 2));
      points.push(`${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
    }
    return 'M' + points.join('L');
  }

  let d = $state<string | null>(null);
  onMount(() => {
    d = spiral();
  });
</script>

<!-- The action collects the paths when it mounts, so it mounts with them. -->
{#if d}
  <div use:scrollDraw={{ easing: 'linear', trigger: { start: 'center 115%', end: 'center 50%' } }}>
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="0.6">
      <path {d} />
    </svg>
  </div>
{/if}
