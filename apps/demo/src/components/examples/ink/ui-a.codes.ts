import { SELF } from '@/data/competitors';
import { BROWSER_TESTS, UNIT_TESTS } from '@/data/facts';

/**
 * The code shown beside the five interface plates (PricingCardReveal,
 * SocialProofStats, HeadlineReveal, FeatureLinesDemo, AnimateGroupDemo), keyed
 * by example id. Figures are interpolated from the same data the plates read,
 * so the snippet and the preview never disagree.
 */
export const CODES_A: Record<string, string> = {
  'scroll-animate': `import { scrollAnimate, scrollDraw } from 'svg-scroll-draw';

// One call per part of the card. Each trigger starts a little
// lower than the one above it, so the card builds top down.
scrollAnimate('.plan-badge', {
  props: { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] },
  trigger: { start: 'top 85%', end: 'top 45%' },
  easing: 'ease-out', once: true,
});

scrollAnimate('.plan-price', {
  props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
  trigger: { start: 'top 80%', end: 'top 40%' }, // 5% later
  easing: 'ease-out', once: true,
});

scrollAnimate('.plan-cta', {
  props: { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
  trigger: { start: 'top 74%', end: 'top 34%' }, // last in
  easing: 'ease-out', once: true,
});

// The ticks in the feature list ink in as it arrives
scrollDraw('.plan-features', { stagger: 0.12, once: true });`,

  'scroll-counter': `import { scrollCounter, scrollAnimate } from 'svg-scroll-draw';

// Unit tests: whole numbers, thousands separator
scrollCounter('#unit-tests', {
  to: ${UNIT_TESTS},
  format: n => Math.round(n).toLocaleString('en-US'),
  once: true,
});

// Browser tests: ${BROWSER_TESTS} each in Chromium, Firefox and WebKit
scrollCounter('#browser-tests', {
  to: ${BROWSER_TESTS} * 3,
  format: n => Math.round(n).toLocaleString('en-US'),
  once: true,
});

// Size in KB: one decimal place
scrollCounter('#size', {
  to: ${SELF.gzipKb},
  format: n => n.toFixed(1),
  once: true,
});

// Dependencies: there are none, so it stays at 0
scrollCounter('#deps', { to: 0, once: true });

// Each cell rises in a little after the one before it
document.querySelectorAll('.stat').forEach((cell, i) => {
  scrollAnimate(cell, {
    props: { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] },
    trigger: { start: \`top \${88 - i * 4}%\`, end: \`top \${54 - i * 4}%\` },
    easing: 'ease-out', once: true,
  });
});`,

  'scroll-text': `import { scrollText } from 'svg-scroll-draw/text';

// Line 1: words rise in one after another
scrollText('#line1', {
  split:   'words',
  stagger: 0.08,
  from:    { opacity: 0, y: 40 },
  easing:  'ease-out',
  once:    true,
  trigger: { start: 'top 87%', end: 'top 54%' },
});

// Line 2, set in the accent: same split, a later window
scrollText('#line2', {
  split:   'words',
  stagger: 0.08,
  from:    { opacity: 0, y: 40 },
  once:    true,
  trigger: { start: 'top 82%', end: 'top 49%' },
});

// The spec line under the rule: one character at a time
scrollText('#spec', {
  split:   'chars',
  stagger: 0.012,
  from:    { opacity: 0 },
  easing:  'linear',
  once:    true,
});`,

  'scroll-text-lines': `import { scrollAnimate, scrollDraw } from 'svg-scroll-draw';

// Each row's trigger starts 5% lower than the last,
// so the rows slide in one after another.
const rows = document.querySelectorAll('.feature-row');

rows.forEach((row, i) => {
  scrollAnimate(row, {
    props: {
      opacity:   [0, 1],
      transform: ['translateX(-20px)', 'translateX(0)'],
    },
    trigger: {
      start: \`top \${90 - i * 5}%\`,
      end:   \`top \${60 - i * 5}%\`,
    },
    easing: 'ease-out',
    once:   true,
  });
});

// The line icons ink in as their rows arrive
scrollDraw('.feature-list', { stagger: 0.06, once: true });`,

  'scroll-animate-group': `import { scrollAnimateGroup } from 'svg-scroll-draw/group';

// Four cards, one call: same props, same trigger.
const group = scrollAnimateGroup(
  [...document.querySelectorAll('.api-card')],
  {
    props: {
      opacity:   [0, 1],
      transform: ['translateY(28px)', 'translateY(0)'],
    },
    trigger: { start: 'top 88%', end: 'top 25%' },
    easing:  'ease-out',
    once:    true,
  }
);

// The instance API covers the whole group
group.replay();   // replay all four
group.pause();    // pause all four
group.destroy();  // clean up on unmount`,
};

/** One sentence per plate, describing what the new preview shows. */
export const DESCRIPTIONS_A: Record<string, string> = {
  'scroll-animate':
    'An open-source pricing card whose badge, plan, price, feature list and button each rise in on their own scrollAnimate trigger, a few percent apart, while the ticks ink in with the list.',
  'scroll-counter':
    `Four hairline cells of real figures (${UNIT_TESTS} unit tests, ${BROWSER_TESTS * 3} browser tests, ${SELF.gzipKb} KB, 0 dependencies) that count up from zero with scrollCounter, each with its own format function, as scrollAnimate lifts the cells in.`,
  'scroll-text':
    'A two-line headline that rises word by word with scrollText, the second line in the accent on a later window, then a spec line that trickles in a character at a time.',
  'scroll-text-lines':
    'A four-row feature list where each row slides in from the left on its own scrollAnimate trigger, 5% after the last, and its line icon inks in as it arrives.',
  'scroll-animate-group':
    'Four API cards that fan in together from one scrollAnimateGroup call: one set of options, one trigger, and one instance to replay, pause or destroy.',
};
