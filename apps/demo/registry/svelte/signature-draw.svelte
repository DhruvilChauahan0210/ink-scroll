<script lang="ts" module>
  /**
   * signature-draw — a handwritten signature that inks itself in as it scrolls
   * into view, then an underline flourish follows it.
   *
   * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
   * Needs: svelte 5, svg-scroll-draw. Styling: Tailwind CSS.
   *
   * Props: label, name, note, accent, className.
   *
   * Swap SIGNATURE_PATH for your own: draw it in Figma/Illustrator with a single
   * pen stroke, export as SVG and paste the `d` attribute. One continuous path
   * draws best. Reduced motion is handled by the library: the signature is shown
   * fully drawn, with no animation.
   */

  export interface SignatureDrawProps {
    /** Small label above the signature. */
    label?: string;
    /** Printed name under the line. Also used for the SVG's accessible name. */
    name?: string;
    /** Right-aligned note under the line, such as a date or a role. */
    note?: string;
    /** Colour of the underline flourish. Any CSS colour. */
    accent?: string;
    className?: string;
  }

  /** A capital loop, a cursive body and a trailing tail, in a 300 × 130 box. */
  const SIGNATURE_PATH =
    'M 18 90 C 14 62 20 34 34 28 C 48 22 62 36 58 56 C 55 70 47 80 54 88 C 60 95 70 91 76 83 ' +
    'C 84 72 86 80 84 90 C 83 97 91 94 103 84 C 114 73 117 81 115 91 C 114 98 123 94 135 84 ' +
    'C 148 72 162 68 175 80 C 185 90 183 102 196 92 C 210 81 220 66 236 74 C 248 80 252 90 265 82 L 275 75';

  const UNDERLINE_PATH = 'M 12 112 C 90 122 210 120 282 112';
</script>

<script lang="ts">
  import { scrollDraw } from 'svg-scroll-draw/svelte';

  let {
    label = 'Signed',
    name = 'Your Name, Founder',
    note = 'Est. 2026',
    accent = '#ff90e8',
    className = '',
  }: SignatureDrawProps = $props();
</script>

<figure
  class="mx-auto w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-950 {className}"
>
  <p class="font-mono text-xs text-neutral-600 dark:text-neutral-400">
    {label}
  </p>

  <!-- `once` keeps the ink on the page after it has drawn. `stagger` starts the
       underline a beat after the signature, so the two read as one gesture.
       The options never depend on the props, so changing the name or the accent
       re-renders the SVG without restarting the draw. -->
  <div
    use:scrollDraw={{
      easing: 'ease-out',
      speed: 0.6,
      stagger: 0.35,
      once: true,
      trigger: { start: 'top 85%', end: 'top 30%' },
    }}
    class="mt-2 text-neutral-900 dark:text-neutral-100"
  >
    <svg
      viewBox="0 0 300 130"
      fill="none"
      role="img"
      aria-label="Signature: {name}"
      class="block h-auto w-full"
    >
      <path
        d={SIGNATURE_PATH}
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d={UNDERLINE_PATH} stroke={accent} stroke-width="1.8" stroke-linecap="round" />
    </svg>
  </div>

  <figcaption
    class="mt-2 flex items-baseline justify-between gap-4 font-mono text-xs text-neutral-600 dark:text-neutral-400"
  >
    <span>{name}</span>
    <span>{note}</span>
  </figcaption>
</figure>
