/**
 * Each example's card copy and snippet, kept beside its scene so the code
 * always matches what the scene does. Keyed by example id.
 */
export type SceneData = { label: string; tag: string; description: string; code: string };

export const SCENES: Record<string, SceneData> = {
  'logo-reveal': {
    label: 'Ferrow Coffee Roasters',
    tag: 'autoplay · onComplete · fill',
    description:
      "A full launch site for a fictional Lisbon roaster. The emblem draws itself as the page loads and onComplete floods it with the brand colours; further down, origin drawings, farm-to-roastery routes, a roast profile and the head roaster's signature draw as you scroll.",
    code: `const [sealed, setSealed] = useState(false);

<ScrollDraw
  selector="path:not(.fill)"
  autoplay duration={1700} delay={250} stagger={0.14}
  easing="ease-out" once
  onComplete={() => setSealed(true)}
>
  <svg viewBox="0 0 200 200" className={sealed ? 'emblem is-sealed' : 'emblem'}>
    <path className="fill disc" d={ring(70)} />
    <path className="fill bean" d={BEAN} />
    <path d={ring(86)} />            {/* outer ring */}
    <path d={BEAN} />                {/* the bean   */}
    <path d="M101 60 C86 84 …" />    {/* its crease */}
  </svg>
</ScrollDraw>

/* .fill { opacity: 0; transition: opacity .8s }
   .is-sealed .fill { opacity: 1 } */`,
  },
  'line-chart': {
    label: 'Ledgerline',
    tag: 'selector · stagger · onProgress',
    description:
      "A full marketing site for a fictional subscription-analytics product. The dashboard's MRR lines plot themselves as it scrolls in, with the fill and the December tooltip following the draw; cohort curves fan out, a forecast draws past today with its confidence band widening, and three sparklines draw together.",
    code: `const card = useRef<HTMLDivElement>(null);

<ScrollDraw
  selector=".line" stagger={0.18} easing="ease-out" once
  trigger={{ start: 'top 90%', end: 'top 30%' }}
  onProgress={(p) => card.current?.style.setProperty('--p', String(p))}
>
  <svg viewBox="0 0 760 240" preserveAspectRatio="none" className="mrr">
    <path className="grid" d="M6 155 H754 M6 120 H754 M6 85 H754" />
    <path className="area" d={smooth(thisYear) + ' L754 226 L6 226 Z'} />
    <path className="line prev" d={smooth(lastYear)} />
    <path className="line now"  d={smooth(thisYear)} />
  </svg>
</ScrollDraw>

/* .area    { opacity: calc((var(--p) - .6) * 2.5) }
   .tooltip { opacity: calc((var(--p) - .93) * 14) } */`,
  },
  signature: {
    label: 'Quillmark',
    tag: 'one stroke · autoplay · onComplete',
    description:
      "A full site for a fictional e-signature product. The client's signature writes itself on the contract in one continuous stroke when it comes into view, and onComplete flips the field to signed and stamps the time; further down, the steps draw in turn and the audit trail's rail draws down the page with the reader.",
    code: `const [signed, setSigned] = useState(false);

<div className={signed ? 'field is-signed' : 'field'}>
  <span className="tag">{signed ? 'Signed' : 'Sign here'}</span>
  <ScrollDraw
    autoplay duration={2400} delay={500}
    easing="ease-in-out" once
    onComplete={() => setSigned(true)}
  >
    <svg viewBox="20 40 380 190">
      {/* one continuous stroke, from the A to the flourish */}
      <path className="ink" d="M 32 196 C 46 190 62 165 …" />
    </svg>
  </ScrollDraw>
</div>`,
  },
  flowchart: {
    label: 'Hearth & Field',
    tag: 'selector · stagger · autoplay',
    description:
      "A homeware shop's order confirmation. The check draws as the page opens, then the delivery journey draws in order — each station, then the road on to the next — up to where the parcel is now, with the stretch still to come left dashed; the products ink in as their cards arrive.",
    code: `<ScrollDraw
  selector=".go" stagger={0.32}
  autoplay duration={700} delay={900}
  easing="ease-in-out" once
>
  <svg viewBox="0 0 1000 220">
    {stations.map((s, i) => (
      <g key={s.k}>
        <g transform={\`translate(\${s.x} \${s.y})\`}>
          <circle r="32" />
          {s.icon.map((d) => <path className={s.reached ? 'go' : 'idle'} d={d} />)}
        </g>
        {/* DOM order is drawing order: the station, then the road on */}
        {next(i) && (
          <path className={next(i).reached ? 'go road' : 'road-ahead'} d={road(s, next(i))} />
        )}
      </g>
    ))}
  </svg>
</ScrollDraw>`,
  },

  'map-route': {
    label: 'Parcelry',
    tag: 'selector · ease-in-out · once',
    description:
      "A same-day courier's home page for a fictional Lisbon company. The rider's route traces block by block across the street map to your door as the map scrolls in, beside a live ETA card.",
    code: `<ScrollDraw
  selector=".route"
  trigger={{ start: 'top 80%', end: 'top 25%' }}
  easing="ease-in-out"
  once
>
  <svg viewBox="0 0 640 420">
    <path className="block" d="…" />   {/* streets and parks stay put */}
    <path className="route" d={elbow([pickup, …turns, door])} />
    <circle className="rider" … />
  </svg>
</ScrollDraw>`,
  },
  network: {
    label: 'Northbeam',
    tag: 'selector · stagger · ease-out',
    description:
      "An edge cloud's home page. The request diagram explains itself in order as it scrolls in — visitor, edge, then the function, cache and database it fans out to — each box and arrow drawing a beat after the last.",
    code: `<ScrollDraw
  selector=".draw"
  trigger={{ start: 'top 85%', end: 'top 35%' }}
  stagger={0.1}
  easing="ease-out"
  once
>
  <svg viewBox="0 0 820 340">
    {/* DOM order is drawing order */}
    <path className="draw box"   d={roundRect(visitor)} />
    <path className="draw arrow" d={elbow([visitor, edge])} />
    <path className="draw box"   d={roundRect(edge)} />
    <path className="draw arrow" d={elbow([edge, fn])} />
    …
  </svg>
</ScrollDraw>`,
  },
  astro: {
    label: 'Fieldnotes',
    tag: 'data-scroll-draw · initScrollDraw()',
    description:
      'A walking journal’s long-read, built the Astro way: the botanical plate carries one data-scroll-draw attribute with its options as JSON, and a single initScrollDraw() call draws the fern as you read down to it.',
    code: `---
// FernPlate.astro — no framework, one attribute
---
<figure class="plate">
  <div
    data-scroll-draw
    data-scroll-draw-options='{"easing":"ease-out","stagger":0.02,"once":true}'
  >
    <svg viewBox="0 0 360 420">…</svg>
  </div>
  <figcaption>Plate 1 · Asplenium scolopendrium</figcaption>
</figure>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();   // finds every [data-scroll-draw]
</script>`,
  },
  'timeline-api': {
    label: 'Halyard Capital',
    tag: 'scrollDrawTimeline · tracks',
    description:
      "A shipping group's annual report. In the revenue chart the axes, each quarter's bar and the trend line draw inside their own slice of one scroll range, so the year builds up quarter by quarter as you read.",
    code: `import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

scrollDrawTimeline('#revenue', {
  trigger: { start: 'top 80%', end: 'bottom 60%' },
  tracks: [
    { selector: '.axis',  from: 0,    to: 0.25, easing: 'ease-out' },
    { selector: '.q1',    from: 0.12, to: 0.4,  easing: 'ease-out' },
    { selector: '.q2',    from: 0.26, to: 0.54, easing: 'ease-out' },
    { selector: '.q3',    from: 0.4,  to: 0.68, easing: 'ease-out' },
    { selector: '.q4',    from: 0.54, to: 0.82, easing: 'ease-out' },
    { selector: '.trend', from: 0.74, to: 1,    easing: 'ease-in-out' },
  ],
});`,
  },
  'group-api': {
    label: 'Relay',
    tag: 'scrollDrawGroup · synchronized',
    description:
      "A team-messaging product's home page. Three feature illustrations live in three separate cards, but one scrollDrawGroup call gives them one trigger and one set of options, so they ink in exactly together.",
    code: `import { scrollDrawGroup } from 'svg-scroll-draw/group';

// Three cards, three SVGs — one call, one trigger
const art = document.querySelectorAll('.feature-art');

const group = scrollDrawGroup([...art], {
  trigger: { start: 'top 85%', end: 'top 40%' },
  easing:  'ease-out',
  speed:   1.1,
  stagger: 0.04,
  once:    true,
});

// later: group.replay(), group.destroy()`,
  },
  vue: {
    label: 'Tidewater',
    tag: 'Vue · ScrollDraw component',
    description:
      "A sailing school's home page. The hero's line-drawn sloop — hull, mast, sails, then the swell — fades and draws as it scrolls in, written here as you would in Vue with the ScrollDraw component.",
    code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw
    class="boat"
    :trigger="{ start: 'top 90%', end: 'top 20%' }"
    :stagger="0.07"
    easing="ease-out"
    fade
    once
  >
    <svg viewBox="0 0 420 340">
      <path class="hull" d="…" />
      <path class="sail" d="…" />
      <path class="sea"  d="…" />
    </svg>
  </ScrollDraw>
</template>`,
  },
  svelte: {
    label: 'Stride',
    tag: 'Svelte · use:scrollDraw',
    description:
      "A running app's home page. Sunday's 21 km route traces itself across the map card, then the elevation profile draws beneath it — written here as you would in Svelte with the use:scrollDraw action.",
    code: `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div
  class="route"
  use:scrollDraw={{ trigger: { start: 'top 85%', end: 'top 25%' },
                    easing: 'ease-in-out', once: true }}
>
  <svg viewBox="0 0 400 260"><path d={route} /></svg>
</div>

<div
  class="elevation"
  use:scrollDraw={{ selector: '.ink', easing: 'ease-out', once: true }}
>
  <svg viewBox="0 0 400 90"><path class="ink" d={profile} /></svg>
</div>`,
  },
  solid: {
    label: 'Paygrid status',
    tag: 'Solid · useScrollDraw',
    description:
      "A payments API's public status page. Each service's 24-hour latency line draws as its row scrolls in — the webhook incident spike included — written here as you would in Solid with useScrollDraw.",
    code: `import { useScrollDraw } from 'svg-scroll-draw/solid';
import { For } from 'solid-js';

function Sparkline(props) {
  const ref = useScrollDraw({
    trigger: { start: 'top 92%', end: 'top 55%' },
    easing:  'ease-out',
    once:    true,
  });
  return (
    <div ref={ref} class="spark">
      <svg viewBox="0 0 480 60"><path d={props.d} /></svg>
    </div>
  );
}

<For each={services}>{(s) => <Sparkline d={s.latency} />}</For>`,
  },
  presets: {
    label: 'Linework',
    tag: "preset · 'sketch' 'reveal' 'typewriter' …",
    description:
      "An illustration studio's portfolio. Five client pieces — a wine label, a logo, a process diagram, a hero and an app icon — each draw with a different one-word preset, and each card prints the settings that preset stands for.",
    code: `import { ScrollDraw } from 'svg-scroll-draw/react';

// One word sets easing, speed, stagger and fade
<ScrollDraw preset="sketch">      {/* wine label   */}
  <svg>…</svg>
</ScrollDraw>
<ScrollDraw preset="reveal">      {/* logo, once   */}
  <svg>…</svg>
</ScrollDraw>
<ScrollDraw preset="typewriter">  {/* diagram      */}
  <svg>…</svg>
</ScrollDraw>
<ScrollDraw preset="cinematic">   {/* hero         */}
  <svg>…</svg>
</ScrollDraw>
<ScrollDraw preset="spring">      {/* app icon     */}
  <svg>…</svg>
</ScrollDraw>`,
  },
  'sequence-api': {
    label: 'Shipyard',
    tag: 'scrollDrawSequence · onComplete',
    description:
      "A CI/CD product's home page. The pipeline's stages — commit, build, test, deploy — each draw only when the one before has finished, and onComplete marks every stage green as it lands.",
    code: `import { scrollDrawSequence } from 'svg-scroll-draw/group';

const stages = document.querySelectorAll('.stage-icon');
let done = 0;

scrollDrawSequence([...stages], {
  trigger: { start: 'top 80%', end: 'top 30%' },
  easing:  'ease-out',
  speed:   1.3,
  // fires as each stage finishes drawing
  onComplete: () => {
    stages[done]?.closest('li').classList.add('is-done');
    done++;
  },
});`,
  },
  'scroll-animate': {
    label: 'Tessera',
    tag: 'scrollAnimate · staggered parts',
    description:
      "A team wiki's pricing page. Every part of every plan — badge, name, price, features, button — rises on its own scrollAnimate a few percent of scroll after the last, left plan first.",
    code: `import { scrollAnimate } from 'svg-scroll-draw';

document.querySelectorAll('[data-part]').forEach((el) => {
  const plan = Number(el.dataset.plan);
  const part = Number(el.dataset.part);
  const start = 92 - plan * 3 - part * 3;  // left plan first, top to bottom

  scrollAnimate(el, {
    props: {
      opacity:   [0, 1],
      transform: ['translateY(22px)', 'translateY(0)'],
    },
    trigger: { start: \`top \${start}%\`, end: \`top \${start - 30}%\` },
    easing: 'ease-out',
    once:   true,
  });
});`,
  },
  'scroll-counter': {
    label: 'Greenline',
    tag: 'scrollCounter · format',
    description:
      "A reforestation charity's impact report. Trees planted, hectares restored, carbon captured and survival rate each count up from zero with their own format function, and the spending breakdown counts while its bars grow.",
    code: `import { scrollCounter, scrollAnimate } from 'svg-scroll-draw';

const int = (v) => Math.round(v).toLocaleString('en-US');

scrollCounter('#trees',    { to: 1284500, format: int, once: true });
scrollCounter('#hectares', { to: 3410,  format: (v) => \`\${int(v)} ha\`, once: true });
scrollCounter('#carbon',   { to: 41.2,  format: (v) => \`\${v.toFixed(1)}k t\`, once: true });
scrollCounter('#survival', { to: 86,    format: (v) => \`\${Math.round(v)}%\`, once: true });

// each cell lifts in a little after the one before it
document.querySelectorAll('.stat').forEach((cell, i) => {
  scrollAnimate(cell, {
    props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
    trigger: { start: \`top \${92 - i * 4}%\`, end: \`top \${62 - i * 4}%\` },
    once: true,
  });
});`,
  },
  'scroll-text-lines': {
    label: 'Mint & Co',
    tag: 'scrollAnimate · rows in turn · scrollDraw',
    description:
      "A bank's account-switching page. The four steps slide in one after another, each trigger 5% lower than the last, and each step's line icon inks in as its row arrives.",
    code: `import { scrollAnimate, scrollDraw } from 'svg-scroll-draw';

const rows = document.querySelectorAll('.steps li');

rows.forEach((row, i) => {
  scrollAnimate(row, {
    props: {
      opacity:   [0, 1],
      transform: ['translateX(-28px)', 'translateX(0)'],
    },
    trigger: { start: \`top \${90 - i * 5}%\`, end: \`top \${60 - i * 5}%\` },
    easing: 'ease-out',
    once:   true,
  });
});

// the icons ink in as their rows arrive
scrollDraw('.steps', { stagger: 0.06, once: true });`,
  },
  'scroll-animate-group': {
    label: 'Plugboard',
    tag: 'scrollAnimateGroup · one call',
    description:
      "A no-code automation product's integrations directory. Twelve app tiles arrive from one scrollAnimateGroup call — one set of props, one trigger, one instance to replay, pause or destroy.",
    code: `import { scrollAnimateGroup } from 'svg-scroll-draw/group';

const tiles = document.querySelectorAll('.app-tile');

const group = scrollAnimateGroup([...tiles], {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(28px) scale(0.96)', 'translateY(0) scale(1)'],
  },
  trigger: { start: 'top 88%', end: 'top 40%' },
  easing:  'ease-out',
  once:    true,
});

group.destroy();  // one call cleans up all twelve`,
  },
  'scroll-text': {
    label: 'Atelier Nord',
    tag: 'scrollText · words · chars',
    description:
      "An architecture studio's home page. The statement rises word by word, its second line on a later window in the accent; the studio's facts trickle in a character at a time; each project title rises as it arrives.",
    code: `import { scrollText } from 'svg-scroll-draw/text';

const rise = { opacity: 0, y: 40 };

scrollText('.line-1', { split: 'words', stagger: 0.08, from: rise, once: true,
  trigger: { start: 'top 87%', end: 'top 54%' } });

scrollText('.line-2', { split: 'words', stagger: 0.08, from: rise, once: true,
  trigger: { start: 'top 82%', end: 'top 49%' } });   // a later window

scrollText('.facts', { split: 'chars', stagger: 0.012,
  from: { opacity: 0 }, easing: 'linear', once: true });

document.querySelectorAll('.project h3').forEach((h) =>
  scrollText(h, { split: 'words', stagger: 0.1, from: { opacity: 0, y: 30 }, once: true }));`,
  },
  'scroll-reveal': {
    label: 'Folio',
    tag: 'scrollReveal · fadeUp · fadeLeft · stagger',
    description:
      "The \u201cWhat\u2019s new in Folio 4\u201d page for a fictional notes app: six feature cards fade up in a stagger, the sync story slides in from the right and the release notes reveal row by row as you scroll.",
    code: `import { scrollReveal } from 'svg-scroll-draw/reveal';

// Six feature cards fade up one after another, then stay
scrollReveal('.feature-card', {
  preset:  'fadeUp',
  stagger: 0.2,    // each card starts a fifth of the way into the last one's reveal
  once:    true,
});

// The sync timeline slides in from the right
scrollReveal('.sync-step', { preset: 'fadeLeft', stagger: 0.2, once: true });

// Each changelog row reveals on the same window as it scrolls in
scrollReveal('.release-note', {
  preset:  'fadeUp',
  once:    true,
  trigger: { start: 'top 96%', end: 'top 78%' },
});`,
  },
  'scroll-pin': {
    label: 'Lumen',
    tag: 'scrollPin · onProgress · onEnter/onLeave',
    description:
      "A compact camera's product page. The camera, drawn in line, stays pinned while a scroll-driven tour moves a focus frame across its sensor, lens, stabiliser and battery, x-rays each part and scrubs the camera's own readout.",
    code: `import { scrollPin } from 'svg-scroll-draw/pin';

const pin = scrollPin('.stage', {
  top: 66,                              // below the sticky header
  pinDistance: '300vh',                 // four features, three screens
  onEnter:     () => (stage.dataset.tour = 'on'),
  onEnterBack: () => (stage.dataset.tour = 'on'),
  onLeave:     () => (stage.dataset.tour = 'after'),
  onLeaveBack: () => (stage.dataset.tour = 'before'),
  onProgress: (p) => {
    const i = Math.min(3, Math.floor(p * 4));   // sensor, lens, IBIS, battery
    camera.dataset.part = PARTS[i];             // moves the focus frame
    caption.textContent = CAPTIONS[i];
    readout[i].textContent = scrub(i, p * 4 - i); // ISO, f-stop, shutter, charge
  },
});
// later: pin.destroy();`,
  },
  'scroll-snap': {
    label: 'Casa Verde',
    tag: 'scrollSnap · horizontal · onSnap',
    description:
      'A boutique holiday-rentals site for country houses in Portugal and Spain. A horizontal scrollSnap carousel holds one house at a time, and onSnap moves the counter, dots and details panel to the house that landed while its painting inks in.',
    code: `import { scrollSnap } from 'svg-scroll-draw/snap';

const track = document.querySelector('.houses-track');
const slides = track.querySelectorAll('.house');

const snap = scrollSnap(slides, {
  direction: 'horizontal',
  scrollContainer: track,
  duration: 700,
  easing: 'ease-in-out',
  threshold: 0.18,
  onSnap: (i) => {
    counter.textContent = \`\${i + 1} / \${slides.length}\`;
    showHouse(HOUSES[i]); // name, region, sleeps, price per night
  },
});

nextButton.onclick = () => snap.snapTo(snap.getCurrentIndex() + 1);`,
  },
  'scroll-video': {
    label: 'Aural',
    tag: 'scrollVideo · to · onProgress',
    description:
      "The product page for a pair of over-ear headphones. A rendered product film scrubs with the scroll while its stage is pinned: the headphones turn, then the ear cup comes apart layer by layer, and onProgress pins a numbered callout to each part as it comes clear.",
    code: `import { scrollVideo } from 'svg-scroll-draw/video';

// The film is 150 frames; four colourway stills follow it in the same file,
// so \`to\` stops the scrub at the end of the film.
const film = scrollVideo(video, {
  to: 4.98,
  trigger: { start: 'top 340%', end: 'top 12%' },   // the length of the pin
  onReady: () => stage.classList.add('is-ready'),
  onProgress: (p) => {
    PARTS.forEach((part, i) => {
      const on = p >= part.on[0] && p <= part.on[1];
      const [x, y] = pinAt(TRACK[part.k], p);        // where the part is now
      pins[i].classList.toggle('is-on', on);
      pins[i].style.setProperty('--x', x);
      pins[i].style.setProperty('--y', y);
    });
  },
});
// later: film.destroy();`,
  },
  'scroll-frames': {
    label: 'Groundtrack',
    tag: 'scrollFrames · triggerElement · onProgress',
    description:
      "The exhibit page of a satellite exhibition, on one canvas and one scrollFrames instance. 71 stills of the Landsat 8 model start turning beside the headline, travel to the middle of the screen as it scrolls away, and keep turning while the stage is pinned; the same onProgress moves the satellite and lights each part, from the solar array to the X-band antenna.",
    code: `import { scrollFrames } from 'svg-scroll-draw/frames';

// One instance from the top of the page to the end of the exhibit:
// the wrapper holds the hero and the pinned stage, 500svh tall.
const turn = scrollFrames(canvas, {
  frames: (i) => \`/frames/landsat/frame_\${String(i + 1).padStart(4, '0')}.webp\`,
  count: 71,
  fit: 'contain',
  triggerElement: wrapper,
  trigger: { start: 'top top', end: 'bottom bottom' },
  onProgress: (p, frame) => {
    const t = Math.min(1, p / 0.25);        // the first screen: the travel
    stage.style.setProperty('--t', t);       // CSS: translate + scale by --t
    counter.textContent = \`\${frame + 1} / 71\`;
    PARTS.forEach((part, i) => rows[i].classList.toggle('is-on', inside(part, p)));
  },
});
// later: turn.destroy();`,
  },
};
