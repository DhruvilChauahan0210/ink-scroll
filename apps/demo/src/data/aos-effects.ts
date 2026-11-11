/**
 * Everything the AOS gallery (/aos-animation) shows, copied from the AOS
 * drop-in, `packages/svg-scroll-draw/src/aos/index.ts`, which mirrors aos.css
 * 2.3.4 rule for rule: its FROM table (the effects), EASINGS (the named
 * curves) and DEFAULTS (the options). AOS has not shipped since 2.3.4, so
 * these lists are fixed; if the drop-in ever adds one, add it here too.
 */

export type AosFamily = { key: string; title: string; note: string; effects: string[] };

export const AOS_FAMILIES: AosFamily[] = [
  {
    key: 'fade',
    title: 'Fade',
    note: 'Opacity from 0, plus a 100px move in the named direction. Plain fade only changes opacity.',
    effects: [
      'fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right',
      'fade-up-right', 'fade-up-left', 'fade-down-right', 'fade-down-left',
    ],
  },
  {
    key: 'zoom',
    title: 'Zoom',
    note: 'Opacity from 0 and a scale: zoom-in grows from 0.6, zoom-out shrinks from 1.2. The directional ones also move 100px.',
    effects: [
      'zoom-in', 'zoom-in-up', 'zoom-in-down', 'zoom-in-left', 'zoom-in-right',
      'zoom-out', 'zoom-out-up', 'zoom-out-down', 'zoom-out-left', 'zoom-out-right',
    ],
  },
  {
    key: 'slide',
    title: 'Slide',
    note: 'A move of the element’s own full size, with no fade. Put it in a container with overflow: hidden if it should not show outside.',
    effects: ['slide-up', 'slide-down', 'slide-left', 'slide-right'],
  },
  {
    key: 'flip',
    title: 'Flip',
    note: 'A 3D rotation of 100° around the named axis, back face hidden, with no fade.',
    effects: ['flip-up', 'flip-down', 'flip-left', 'flip-right'],
  },
];

export const AOS_EFFECT_COUNT = AOS_FAMILIES.reduce((n, f) => n + f.effects.length, 0);

/** The names `data-aos-easing` accepts: CSS's own five, then AOS's fifteen curves. */
export const AOS_EASINGS = [
  'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
  'ease-in-back', 'ease-out-back', 'ease-in-out-back',
  'ease-in-sine', 'ease-out-sine', 'ease-in-out-sine',
  'ease-in-quad', 'ease-out-quad', 'ease-in-out-quad',
  'ease-in-cubic', 'ease-out-cubic', 'ease-in-out-cubic',
  'ease-in-quart', 'ease-out-quart', 'ease-in-out-quart',
];

export const AOS_ANCHOR_PLACEMENTS = [
  'top-bottom', 'top-center', 'top-top',
  'center-bottom', 'center-center', 'center-top',
  'bottom-bottom', 'bottom-center', 'bottom-top',
];

/** Each per-element attribute, its `AOS.init()` option and the default. */
export const AOS_ATTRIBUTES: { attr: string; option: string; def: string; what: string }[] = [
  { attr: 'data-aos', option: '—', def: '—', what: 'The effect: one of the names above.' },
  { attr: 'data-aos-offset', option: 'offset', def: '120', what: 'Pixels from the trigger point before it starts.' },
  { attr: 'data-aos-delay', option: 'delay', def: '0', what: 'Milliseconds to wait before animating in (not on the way out).' },
  { attr: 'data-aos-duration', option: 'duration', def: '400', what: 'Milliseconds the animation lasts.' },
  { attr: 'data-aos-easing', option: 'easing', def: 'ease', what: 'One of the easing names below, or any CSS timing function.' },
  { attr: 'data-aos-once', option: 'once', def: 'false', what: 'Animate only the first time it scrolls into view.' },
  { attr: 'data-aos-mirror', option: 'mirror', def: 'false', what: 'Also animate out when scrolling past it.' },
  { attr: 'data-aos-anchor-placement', option: 'anchorPlacement', def: 'top-bottom', what: 'Which edge of the element meets which edge of the window.' },
  { attr: 'data-aos-anchor', option: '—', def: '—', what: 'A selector: trigger on another element’s position instead.' },
];
