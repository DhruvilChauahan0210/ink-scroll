/**
 * Routes already moved to the homepage's design. The old global chrome (the
 * ink-bottle mascot) stays off them. Add a route here when its page moves into
 * <SiteShell>.
 */
const REDESIGNED = [
  '/', '/docs', '/examples', '/guides', '/showcase', '/blog', '/blocks', '/changelog', '/playground', '/verify',
  '/vs-gsap', '/vs-aos', '/vs-framer-motion', '/vs-motion', '/vs-locomotive-scroll', '/vs-scrollmagic', '/vs-vivus',
  '/react-scroll-animation', '/nextjs-scroll-animation', '/lenis-scroll-animation',
  '/vue-scroll-animation', '/svelte-scroll-animation', '/solid-scroll-animation',
  '/angular-scroll-animation', '/astro-scroll-animation', '/nuxt-scroll-animation',
];

export function isRedesigned(pathname: string | null): boolean {
  if (!pathname) return false;
  return REDESIGNED.some((r) => (r === '/' ? pathname === '/' : pathname === r || pathname.startsWith(`${r}/`)));
}
