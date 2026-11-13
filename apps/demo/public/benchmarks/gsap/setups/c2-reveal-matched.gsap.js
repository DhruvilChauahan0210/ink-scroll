bench.setup(() => {
  gsap.registerPlugin(ScrollTrigger);
  // scrollReveal's defaults: fade up 32px over 'top 88%' → 'top 53%', ease-out
  // (= power1.out), once, each card's window shifted by its column × 0.15 of it.
  // svg-scroll-draw measures a card where it sits before the 32px offset;
  // ScrollTrigger measures it with the offset applied, hence top-=32.
  const span = 88 - 53;
  gsap.utils.toArray('.card').forEach((card, i) => {
    const shift = Math.min((i % 3) * 0.15 * span, span);
    gsap.fromTo(card, { opacity: 0, y: 32 }, {
      opacity: 1, y: 0, ease: 'power1.out',
      scrollTrigger: {
        trigger: card, start: `top-=32 ${88 - shift}%`, end: `top-=32 ${53 - shift}%`, scrub: true, once: true,
      },
    });
  });
});
