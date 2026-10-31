/**
 * Code, descriptions and tags for the examples drawn in drawings.tsx — kept
 * beside them so the snippet always matches what the plate shows. Examples
 * whose markup did not change keep the snippet in ExamplesPage.tsx.
 */

export const CODES_D: Record<string, string> = {
  'logo-reveal': `const [done, setDone] = useState(false);

<ScrollDraw easing="ease-out" speed={0.95} once
  selector="path:not(.fill)"
  onComplete={() => setDone(true)}>
  <svg viewBox="0 0 400 300" className={done ? 'is-done' : ''}>
    <path className="ring" d="M 200 60 A 88 88 0 1 1 …" />
    {/* the fill waits for the outline, then floods in */}
    <path className="fill" d="M 200 214 L 171 140 Q …Z" />
    <path className="nib"  d="M 200 214 L 171 140 Q …Z" />
    <path className="slit" d="M 200 214 V 151" />
  </svg>
</ScrollDraw>

/* .fill { fill: var(--accent); opacity: 0; transition: opacity .7s }
   .is-done .fill { opacity: 1 } */`,

  'line-chart': `<ScrollDraw stagger={0.03} easing="ease-out">
  <svg viewBox="0 0 400 300">
    {/* DOM order is drawing order: the grid and axes settle first */}
    <path className="grid" d="M 40 60 H 380 M 40 105 H 380 …" />
    <path className="axis" d="M 40 240 H 380" />
    {/* then last year, then this year in the accent */}
    <path className="series-2025" d="M 40 200 C …" />
    <path className="series-2026" d="M 40 214 C …" />
  </svg>
</ScrollDraw>`,

  signature: `<ScrollDraw stagger={0.08} easing="ease-out">
  <svg viewBox="0 0 400 300">
    {/* one continuous stroke, drawn at the speed you scroll */}
    <path className="ink" d="M 58 186 C 70 160 …" />
    {/* the flourish and the baseline follow it */}
    <path className="flourish" d="M 52 196 C 150 214 …" />
    <path className="baseline" d="M 60 236 H 340" />
  </svg>
</ScrollDraw>`,

  flowchart: `<ScrollDraw selector="path:not(.static)" stagger={0.03} easing="ease-out">
  <svg viewBox="0 0 400 300">
    {/* box, connector, next box — DOM order is drawing order */}
    <path d="M 30 120 H 88 A 6 6 0 0 1 94 126 …" />    {/* cart */}
    <path d="M 97 143 H 114" />                        {/* → */}
    <path d="M 124 120 H 182 A 6 6 0 0 1 188 126 …" /> {/* address */}
    …
    <path className="accent" d="M 318 120 H 370 …" />  {/* receipt */}
  </svg>
</ScrollDraw>`,

  'map-route': `<ScrollDraw once easing="ease-in-out" stagger={0.012}>
  <svg viewBox="0 0 400 300">
    <path className="streets" d="M 20 80 L 380 40 M …" />
    {/* the route draws from A to the pin at B */}
    <path className="route" d="M 64 230 L 60 190 L 128 172 …" />
    <path className="pin" d="M 300 66 A 6 6 0 1 1 …" />
  </svg>
</ScrollDraw>`,

  network: `<ScrollDraw stagger={0.025} easing="ease-out">
  <svg viewBox="0 0 400 300">
    {/* the boxes first, then the request path in order */}
    <path className="box"  d="M 27 120 H 91 …" />          {/* client */}
    <path className="box"  d="M 167 48 H 231 …" />         {/* edge */}
    <path className="flow" d="M 98 136 H 129 V 64 H 157" /> {/* client → edge */}
    <path className="flow" d="M 238 64 H 269 V 131 H 297" />{/* edge → api */}
    <path className="flow" d="M 339 152 V 219" />           {/* api → db */}
  </svg>
</ScrollDraw>`,
};

export const DESCRIPTIONS_D: Record<string, string> = {
  'logo-reveal': 'A nib mark inside its ring inks itself in on scroll; when the last stroke lands, onComplete floods the mark with the accent and opens the slit.',
  'line-chart': "Two years of revenue plot themselves over a pencil grid — the axes settle, then last year's line in grey and this year's in the accent.",
  signature: 'A signature writes itself in one continuous stroke at the speed you scroll, over its baseline, name and date.',
  flowchart: 'A four-step checkout — cart, address, payment, receipt — inks station by station, each connector arriving before the next box.',
  'map-route': 'A delivery route traces across a street grid from A to the pin at B, beside its distance scale and arrival time.',
  network: 'A system diagram explains itself in order — client, edge, api, db in the accent, with the auth branch drawn quieter.',
  astro: 'One attribute and one script: initScrollDraw() finds every [data-scroll-draw] element and reads its options from JSON.',
  'timeline-api': 'Axes, four bars and a trend line each draw inside their own slice of the scroll range — shown on the ruler beside the chart, with a live playhead.',
  'group-api': 'Three separate containers share one trigger and one set of options, so their icons ink in together.',
  vue: 'A Vue component tree, drawn with the ScrollDraw component: App passes a title to Header and a list to Content, which emits updates back.',
  svelte: 'A store graph, drawn with the use:scrollDraw action: one writable feeding two derived stores and an effect.',
  solid: 'A signal graph, drawn with useScrollDraw: one signal, two memos, one effect.',
  presets: 'The five presets side by side, each drawing the same wave with its own easing, speed and stagger — the settings shown are read from PRESETS.',
  'sequence-api': 'Code, build, ship: each icon starts drawing only when the one before it finishes, and onComplete advances the step counter.',
};

export const TAGS_D: Record<string, string> = {
  'line-chart': 'stagger · ease-out',
  signature: 'stagger · one stroke',
  'map-route': 'once · ease-in-out',
};
