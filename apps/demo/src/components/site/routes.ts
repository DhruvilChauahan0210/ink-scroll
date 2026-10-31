/**
 * Routes already moved to the homepage's design. The old global chrome (the
 * ink-bottle mascot) stays off them. Add a route here when its page moves into
 * <SiteShell>.
 */
const REDESIGNED = ['/', '/docs', '/examples', '/guides'];

export function isRedesigned(pathname: string | null): boolean {
  if (!pathname) return false;
  return REDESIGNED.some((r) => (r === '/' ? pathname === '/' : pathname === r || pathname.startsWith(`${r}/`)));
}
