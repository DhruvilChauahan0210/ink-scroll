<script lang="ts">
  let { strokes, seed }: { strokes: number; seed: number } = $props();
</script>

<!-- " · seed 417" written as text would lose its leading space. -->
<span>{strokes} strokes<span class="hidden sm:inline">{` · seed ${seed}`}</span></span>
