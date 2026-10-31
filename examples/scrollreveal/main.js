// Before:
//   import ScrollReveal from 'scrollreveal';
import ScrollReveal from 'svg-scroll-draw/scrollreveal'; // the only change

const sr = ScrollReveal({ distance: '40px', duration: 800, easing: 'cubic-bezier(0.5, 0, 0, 1)' });

sr.reveal('.headline', { origin: 'top' });
sr.reveal('.card:not(.photo)', { interval: 120 });
sr.reveal('.photo', { scale: 0.85, reset: true });
