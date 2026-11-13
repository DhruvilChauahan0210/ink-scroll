bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  // Written to match svg-scroll-draw's stagger: path i starts i × s × R later,
  // where R is the trigger range, and each path lasts R.
  const svg = document.querySelector('#b2'), n = 40, s = 0.02;
  gsap.fromTo('#b2 path', { drawSVG: '0%' }, {
    drawSVG: '100%', ease: 'none', duration: 1, stagger: s,
    scrollTrigger: {
      trigger: svg, start: 'top bottom', scrub: true,
      end: () => '+=' + (svg.getBoundingClientRect().height + innerHeight) * (1 + (n - 1) * s),
    },
  });
});
