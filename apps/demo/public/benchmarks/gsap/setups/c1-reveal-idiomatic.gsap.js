bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger);
  gsap.set('.card', { opacity: 0, y: 32 });
  ScrollTrigger.batch('.card', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power1.out', stagger: 0.15, overwrite: true,
    }),
  });
});
