<script lang="ts" module>
  /**
   * reveal-cards — a grid of feature cards that fade up one after another as the
   * grid scrolls into view.
   *
   * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
   * Needs: svelte 5, svg-scroll-draw. Styling: Tailwind CSS.
   *
   * Props: eyebrow, heading, cards ({ title, body }[]), className.
   *
   * Each card reveals once and stays revealed. Reduced motion is handled by the
   * library: every card is shown in its final state, with no animation.
   */

  export interface RevealCard {
    title: string;
    body: string;
  }

  export interface RevealCardsProps {
    eyebrow?: string;
    heading?: string;
    cards?: RevealCard[];
    className?: string;
  }

  const DEFAULT_CARDS: RevealCard[] = [
    { title: 'Draw on scroll', body: 'SVG paths ink themselves in as the reader scrolls, tied to their position.' },
    { title: 'Reveal anything', body: 'Fade, slide or scale any element into place. One call for a whole grid.' },
    { title: 'Count up', body: 'Numbers climb from zero to their value as the section comes into view.' },
    { title: 'Split text', body: 'Headlines arrive word by word or letter by letter, still one string in the DOM.' },
    { title: 'Pin and scrub', body: 'Hold a panel in place while the story scrolls past it.' },
    { title: 'Motion-aware', body: 'Visitors who ask for reduced motion get the finished page, not the animation.' },
  ];
</script>

<script lang="ts">
  import { scrollReveal } from 'svg-scroll-draw/reveal';

  let {
    eyebrow = 'Features',
    heading = 'Everything moves when it should',
    cards = DEFAULT_CARDS,
    className = '',
  }: RevealCardsProps = $props();

  let grid: HTMLUListElement;

  // A derived number only notifies when its value changes, so a new array of
  // the same length does not rebuild the reveal.
  const count = $derived(cards.length);

  // Runs after the list is in the DOM, and again (after the cleanup) whenever
  // the number of cards changes. `count` is its one dependency.
  $effect(() => {
    count;

    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-reveal-card]'));
    // `stagger` starts each card in a row a fifth of the way into its
    // neighbour's reveal, so cards in the same row still arrive in reading order.
    const reveal = scrollReveal(items, {
      from: { opacity: 0, y: 40, scale: 0.97 },
      stagger: 0.2,
      once: true,
    });

    // destroy() restores the original inline styles, so a rebuild starts clean.
    return () => reveal.destroy();
  });
</script>

<section class="mx-auto w-full max-w-5xl {className}">
  <p class="font-mono text-xs text-neutral-600 dark:text-neutral-400">
    {eyebrow}
  </p>
  <h2 class="mt-3 text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
    {heading}
  </h2>

  <ul bind:this={grid} class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each cards as card, i (card.title)}
      <li
        data-reveal-card=""
        class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff90e8] font-mono text-xs font-medium text-neutral-950"
        >
          {String(i + 1).padStart(2, '0')}
        </span>
        <h3 class="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">{card.title}</h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{card.body}</p>
      </li>
    {/each}
  </ul>
</section>
