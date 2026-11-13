bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  gsap.fromTo('#a path', { drawSVG: '0%' }, {
    drawSVG: '100%', ease: 'none',
    scrollTrigger: { trigger: '#a', start: 'top bottom', end: 'bottom top', scrub: true },
  });
});
