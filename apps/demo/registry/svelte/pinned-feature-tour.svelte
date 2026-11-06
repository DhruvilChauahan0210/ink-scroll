<script lang="ts" module>
  /**
   * pinned-feature-tour — a section that pins just below your sticky header while
   * its features take turns. Each feature has a line drawing that inks itself in
   * as the reader scrolls through that feature's share of the pin, and its copy
   * steps forward in the list beside it.
   *
   * Built on svg-scroll-draw (MIT): https://svg-scroll-draw.vercel.app/blocks
   * Needs: svelte 5, svg-scroll-draw. Styling: Tailwind CSS.
   *
   * Uses `scrollPin` (svg-scroll-draw/pin) to hold the stage still and
   * `scrollDraw` (svg-scroll-draw) for the drawings. The drawings follow the
   * pin's `onProgress` through `seek()`, not their own place on the page. Unlike
   * sticky-feature, nothing scrolls past: the whole stage stays put for
   * (features − 1) screens of scroll and the features change in place.
   *
   * Props: `eyebrow` and `heading` for the intro above the tour; `features`, each
   * a title, a body and the path `d` strings of its drawing in a 200 × 160 box;
   * `headerOffset`, the height in px of your sticky header (0 if you have none);
   * `className` for the outer section (a Svelte component does not pass a plain
   * `class` on).
   *
   * While pinned the stage is `position: fixed`. An ancestor with a transform,
   * filter, perspective or `contain: paint` makes fixed relative to itself, so
   * keep the block out of one. The page must scroll on the window. The pin's
   * length is measured once, on mount, so a phone's URL bar showing and hiding
   * never changes it; after a rotation the tour keeps its first length.
   *
   * Reduced motion: the library shows every drawing finished and `seek()` does
   * nothing; this file turns off the cross-fades. The pin and the switching keep
   * working, because pinning holds the content still rather than moving it.
   */

  export interface TourFeature {
    title: string;
    body: string;
    /** Path `d` strings in a 200 × 160 box, drawn together as the reader scrolls through this feature. */
    art: string[];
  }

  export interface PinnedFeatureTourProps {
    eyebrow?: string;
    heading?: string;
    features?: TourFeature[];
    /** Height in px of your sticky header: the tour pins just below it. 0 if you have none. */
    headerOffset?: number;
    className?: string;
  }

  const DEFAULT_FEATURES: TourFeature[] = [
    {
      title: 'From three farms',
      body: 'A washed lot from Ethiopia, a honey lot from Costa Rica and a natural from Colombia, bought direct from the people who grow them.',
      // Two hills, a row of coffee bushes and the sun.
      art: [
        'M 8 112 C 44 84 78 88 104 98 S 160 80 192 92',
        'M 8 138 C 58 116 122 132 192 120',
        'M 30 104 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0 q 7 -11 14 0',
        'M 150 26 A 16 16 0 1 1 150 58 A 16 16 0 1 1 150 26',
      ],
    },
    {
      title: 'Roasted on Tuesday',
      body: 'Small batches every Tuesday morning, so the bag you open was roasted days ago, not months.',
      // A drum roaster on its legs, with its chimney and the flame under it.
      art: [
        'M 64 46 H 136 A 32 32 0 0 1 136 110 H 64 A 32 32 0 0 1 64 46 Z',
        'M 100 62 A 16 16 0 1 1 100 94 A 16 16 0 1 1 100 62',
        'M 120 46 V 24 H 132 V 46',
        'M 70 110 V 128 M 130 110 V 128',
        'M 100 152 C 88 142 92 132 100 124 C 108 132 112 142 100 152 Z',
      ],
    },
    {
      title: 'At your door in two days',
      body: 'Packed the morning after roasting and shipped free on orders over $40, in bags you can compost.',
      // A parcel, its tape and two speed lines.
      art: [
        'M 50 62 L 100 42 L 150 62 L 150 118 L 100 138 L 50 118 Z',
        'M 50 62 L 100 82 L 150 62 M 100 82 V 138',
        'M 76 52 L 126 72',
        'M 18 96 H 38 M 24 110 H 40',
      ],
    },
  ];

  /*
   * Where three features would not fit on the pinned stage (phones, and screens
   * too short for the list) only the current one is shown. While pinned, whatever
   * does not fit can never be scrolled to. The others stay in the page for screen
   * readers: sr-only, not display: none.
   */
  const COMPACT_HIDE = 'max-md:sr-only [@media(max-height:640px)]:sr-only';
  const COMPACT_SHOW = 'hidden max-md:inline [@media(max-height:640px)]:inline';

  const pad = (n: number) => String(n).padStart(2, '0');
</script>

<script lang="ts">
  import { scrollDraw } from 'svg-scroll-draw';
  import { scrollPin } from 'svg-scroll-draw/pin';

  let {
    eyebrow = 'How it works',
    heading = 'From the farm to your door in a week.',
    features = DEFAULT_FEATURES,
    headerOffset = 64,
    className = '',
  }: PinnedFeatureTourProps = $props();

  let stageEl = $state<HTMLDivElement>();
  let active = $state(0);
  const current = $derived(Math.min(active, features.length - 1));
  // Rebuild the drawings and the pin when the art changes, not on every new array:
  // a string, so an equal one does not re-run the effect below.
  const artKey = $derived(features.map((f) => f.art.join(' ')).join('\n'));

  // Runs after Svelte has updated the DOM, so a new feature count is already in
  // the stage and a new headerOffset already sizes it.
  $effect(() => {
    void artKey;
    const top = headerOffset;
    const stage = stageEl;
    if (!stage) return;
    const arts = Array.from(stage.querySelectorAll<SVGSVGElement>('[data-tour-art]'));
    const n = arts.length;
    if (!n) return;

    // One drawing per feature, moved by the pin rather than by its own position.
    // Each starts empty: the first one draws once the stage has pinned.
    const drawings = arts.map((svg) => scrollDraw(svg));
    drawings.forEach((d) => d.seek(0));

    const pin = scrollPin(stage, {
      top,
      // n − 1 screens of scroll: three features get two-thirds of a screen each.
      // One feature still gets one screen: a pin of 0 has no progress to report.
      // vh is CSS's vh (svg-scroll-draw 2.20.0+): a rotation re-measures it,
      // the URL bar showing and hiding does not, so the tour never stretches
      // under the reader's thumb.
      pinDistance: `${Math.max(1, n - 1) * 100}vh`,
      // 0 where the pin starts, 1 where it ends. Cut into n equal shares: the
      // feature whose share the reader is in is current; earlier drawings are
      // finished, later ones empty, the current one as far as its share.
      onProgress: (p) => {
        const i = Math.min(n - 1, Math.floor(p * n));
        active = i;
        drawings.forEach((d, j) => d.seek(j < i ? 1 : j > i ? 0 : p * n - i));
      },
    });

    // destroy() puts the stage back where it was and restores its styles, so the
    // next run measures the stage as the template laid it out.
    return () => {
      pin.destroy();
      drawings.forEach((d) => d.destroy());
    };
  });
</script>

<section class="mx-auto w-full max-w-5xl {className}">
  <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
    {eyebrow}
  </p>
  <h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl dark:text-neutral-50">
    {heading}
  </h2>

  <!-- scrollPin moves the stage into a wrapper div of its own. So the stage is
       not this component's root (Svelte removes a component's top-level nodes
       from where it put them), and it is the only child of this div, so Svelte
       never has to insert a node beside it. Style the stage by its own classes,
       never by its parent. -->
  <div class="mt-10">
    <!-- One screen below the header, from the same number the pin uses.
         100svh where supported, so the phone's toolbars never cover the bottom.
         `style:` sets only that property, so the pin's own inline styles stay. -->
    <div
      bind:this={stageEl}
      style:--tour-header="{headerOffset}px"
      class="box-border h-[calc(100vh_-_var(--tour-header))] py-4 supports-[height:100svh]:h-[calc(100svh_-_var(--tour-header))] md:py-6"
    >
      <div class="grid h-full grid-cols-1 content-center items-center gap-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:gap-12">
        <!-- The drawings, stacked: only the current one is shown. Keyed by
             position, not title: the effect holds these nodes and only rebuilds
             when the art changes, so a renamed feature must keep its svg. -->
        <div class="relative mx-auto aspect-[5/4] w-full max-w-[280px] rounded-3xl border border-neutral-200 bg-white text-neutral-900 md:max-h-full md:max-w-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
          {#each features as f, i (i)}
            <svg
              data-tour-art=""
              data-on={i === current || undefined}
              viewBox="0 0 200 160"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="absolute left-[8%] top-[8%] h-[84%] w-[84%] overflow-visible opacity-0 transition-opacity duration-300 motion-reduce:transition-none data-[on]:opacity-100"
            >
              {#each f.art as d, j (j)}
                <path {d} />
              {/each}
            </svg>
          {/each}
        </div>

        <ol class="grid gap-7">
          {#each features as f, i (f.title)}
            <li
              aria-current={i === current ? 'step' : undefined}
              class="transition-colors duration-300 motion-reduce:transition-none {i === current ? '' : COMPACT_HIDE}"
            >
              <!-- Not the current feature: greyed by colour, not opacity, so every feature keeps WCAG AA contrast (at 35% opacity the text measured about 2:1). -->
              <span class="flex items-center gap-2 font-mono text-xs">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full font-bold transition-colors duration-300 motion-reduce:transition-none {i === current ? 'bg-[#ff90e8] text-neutral-950' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}">
                  {pad(i + 1)}
                </span>
                <!-- With one feature on screen, say how many there are. -->
                <span aria-hidden="true" class="{COMPACT_SHOW} text-neutral-500 dark:text-neutral-400">
                  of {pad(features.length)}
                </span>
              </span>
              <h3 class="mt-3 text-2xl font-semibold leading-tight {i === current ? 'text-neutral-950 dark:text-neutral-50' : 'text-neutral-500 dark:text-neutral-400'}">
                {f.title}
              </h3>
              <p class="mt-1.5 max-w-[36ch] leading-relaxed {i === current ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}">{f.body}</p>
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </div>
</section>
