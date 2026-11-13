import { scrollDraw } from 'svg-scroll-draw';

bench.setup(() => {
  scrollDraw('#b2', { stagger: 0.02 });
});
