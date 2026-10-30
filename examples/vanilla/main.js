import { scrollDraw, scrollAnimate } from 'svg-scroll-draw';
import { scrollText } from 'svg-scroll-draw/text';

// Draw the SVG path as it scrolls through the viewport.
scrollDraw('#draw', { easing: 'ease-out' });

// Split the headline into words and stagger them in.
scrollText('#headline', { split: 'words', stagger: 0.05, once: true });

// Animate any CSS property on scroll.
scrollAnimate('#card', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  easing: 'ease-out',
  once: true,
});
