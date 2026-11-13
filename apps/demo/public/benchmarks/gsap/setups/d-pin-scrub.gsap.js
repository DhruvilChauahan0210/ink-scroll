bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  gsap.timeline({
    scrollTrigger: { trigger: '#d', pin: true, start: 'top top', end: () => '+=' + innerHeight * 2, scrub: true },
  }).fromTo('#d path', { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none' });
});
