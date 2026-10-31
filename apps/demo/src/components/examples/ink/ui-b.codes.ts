/**
 * Code and descriptions for the redesigned previews of set B (scroll-reveal,
 * scroll-pin, scroll-snap, scroll-video), keyed by example id. Each snippet is
 * what a reader would paste to build the section the preview shows.
 */

export const CODES_B: Record<string, string> = {
  'scroll-reveal': `import { scrollReveal } from 'svg-scroll-draw/reveal';

// <ul class="features">
//   <li><div class="feature-cell">01 · Live sync …</div></li>
//   …six cells
// </ul>

// The cells fade up one after another, then stay.
const reveal = scrollReveal('.feature-cell', {
  preset:  'fadeUp',  // opacity 0 → 1, y 32px → 0
  stagger: 0.12,
  once:    true,
});

// Or set the start state yourself
scrollReveal('.feature-cell', {
  from:   { opacity: 0, y: 24, scale: 0.98 },
  easing: 'ease-out',
});

// Presets: fadeUp | fadeDown | fadeLeft | fadeRight | scale | flip | flipX

// On unmount
reveal.destroy();`,

  'scroll-pin': `import { scrollPin } from 'svg-scroll-draw/pin';
import { scrollAnimate } from 'svg-scroll-draw';

// Pin the camera while the three features scroll past
const pin = scrollPin('#product-panel', {
  top:         64,                       // below a fixed nav
  pinDistance: window.innerHeight * 3,   // one screen per feature
  onEnter:     () => state.textContent = 'Pinned',
  onLeave:     () => state.textContent = 'Released',
  onEnterBack: () => state.textContent = 'Pinned',
  onLeaveBack: () => state.textContent = 'Before',
  onProgress:  (p) => {
    // mark the part the current feature is about
    camera.dataset.part = String(Math.min(2, Math.floor(p * 3)));
  },
});

// Each feature fades in as it arrives
document.querySelectorAll('.feature').forEach((el) =>
  scrollAnimate(el, {
    props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
    easing: 'ease-out', once: true,
  }),
);

pin.refresh();  // after a layout change
pin.destroy();  // unpins and restores the DOM`,

  'scroll-snap': `import { scrollSnap } from 'svg-scroll-draw/snap';

// One plan per swipe, snapped with your own easing
const snap = scrollSnap('.plan-card', {
  direction:       'horizontal',
  scrollContainer: '.plans',
  duration:        400,
  easing:          'ease-out',
  threshold:       0.3,   // past 30% of a card, go to the next one
  onSnap: (i) => {
    count.textContent = String(i + 1).padStart(2, '0');
    tabs.forEach((t, j) => t.toggleAttribute('aria-current', j === i));
  },
});

// The 01–04 strip and the arrows
tabs.forEach((t, i) => t.addEventListener('click', () => snap.snapTo(i)));
next.addEventListener('click', () => snap.snapTo(snap.getCurrentIndex() + 1));

snap.destroy();`,

  'scroll-video': `import { scrollVideo } from 'svg-scroll-draw/video';

// <video id="phone-tour" src="/phone-tour.mp4" muted playsinline preload="auto">

// Scroll is the playhead: currentTime follows the section.
const scrub = scrollVideo('#phone-tour', {
  trigger: { start: 'top 85%', end: 'top 18%' },
  from: 0,          // seconds
  to:   9,          // defaults to video.duration

  easing: 'linear', // linear feels most natural for a scrub
  once:   false,    // scrolling up plays it backwards

  onReady:    () => readout.hidden = false,
  onProgress: (p) => {
    playhead.style.left = p * 100 + '%';
    readout.textContent = \`frame \${Math.round(p * 180)} / 180\`;
  },
  onComplete: () => console.log('reached the end'),
});

scrub.seek(0.5);   // pause at the middle
scrub.destroy();`,
};

export const DESCRIPTIONS_B: Record<string, string> = {
  'scroll-reveal':
    'A six-cell features grid whose contents fade up into a fixed hairline sheet, one cell after another, from a single scrollReveal call with the fadeUp preset and a 0.12 stagger.',
  'scroll-pin':
    'A camera drawn in ink stays pinned while three features scroll past inside the preview, the part each one describes is marked in red, and the panel reports Before, Pinned and Released with the scrollPin callback that just fired.',
  'scroll-snap':
    'A pricing carousel that snaps one plan at a time with the next one peeking in, a 01–04 index strip and arrows that scroll the same container, and the scrollSnap call for custom easing and an onSnap callback.',
  'scroll-video':
    'A phone drawn as a blueprint (outline, screen, home screen, dimensions and four numbered callouts) is scrubbed by scroll like a video, with the playhead, timecode and frame number shown as it goes.',
};
