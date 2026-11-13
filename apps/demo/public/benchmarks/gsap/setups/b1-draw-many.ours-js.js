import { scrollDraw } from 'svg-scroll-draw';

bench.setup(() => {
  document.querySelectorAll('.b1 svg').forEach((svg) => scrollDraw(svg, { native: false }));
});
