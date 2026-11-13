import { scrollDraw } from 'svg-scroll-draw';
import { scrollPin } from 'svg-scroll-draw/pin';

bench.setup(() => {
  // The documented pattern: the pin's progress drives the drawing (seek() leaves
  // the drawing's own timeline, so the pin is what moves it).
  const draw = scrollDraw('#d svg');
  scrollPin('#d', { pinDistance: '200vh', onProgress: (p) => draw.seek(p) });
});
