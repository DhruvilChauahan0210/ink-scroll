bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  gsap.utils.toArray('.b1 svg').forEach((svg) => {
    gsap.fromTo(svg.querySelectorAll('path'), { drawSVG: '0%' }, {
      drawSVG: '100%', ease: 'none',
      scrollTrigger: { trigger: svg, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
});
