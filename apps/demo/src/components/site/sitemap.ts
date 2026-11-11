/**
 * Every page a visitor can navigate to, grouped the way the nav's "More" menu,
 * the phone menu and the footer index show them.
 *
 * Why: the nav linked five sections and the footer twelve links, so the nine
 * framework pages and four of the seven comparisons had no link from the
 * site's chrome at all — React and Next.js sat four clicks from the homepage,
 * reachable only through one blog post. Both lists are built from the data
 * that generates those pages, so a new comparison or framework page shows up
 * here without anyone remembering to add it.
 *
 * Server-side only: the data modules carry every page's code samples, so the
 * nav (a client component) is handed the finished link lists as props instead
 * of importing them.
 */
import { COMPETITORS } from '@/data/competitors';
import { FRAMEWORK_LANDINGS } from '@/data/framework-landings';
import { VERSUS } from '@/data/versus';

export type SiteLink = { href: string; label: string };
export type SiteGroup = { key: string; title: string; links: SiteLink[] };

/** The five sections the desktop nav shows by name. */
export const PRIMARY: SiteLink[] = [
  { href: '/docs', label: 'Docs' },
  { href: '/examples', label: 'Examples' },
  { href: '/guides', label: 'Guides' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/blog', label: 'Blog' },
];

/** React, Next.js and Lenis have pages of their own; the rest come from the landing data. */
const FRAMEWORKS: SiteLink[] = [
  { href: '/react-scroll-animation', label: 'React' },
  { href: '/nextjs-scroll-animation', label: 'Next.js' },
  ...FRAMEWORK_LANDINGS.map((f) => ({ href: `/${f.slug}`, label: f.name.replace(/\s+\d+$/, '') })),
  { href: '/lenis-scroll-animation', label: 'with Lenis' },
];

/** GSAP, Framer Motion and AOS have dedicated pages; the rest are generated from VERSUS. */
const COMPARE: SiteLink[] = [
  { href: '/vs-gsap', label: 'vs GSAP' },
  { href: '/vs-framer-motion', label: 'vs Framer Motion' },
  { href: '/vs-aos', label: 'vs AOS' },
  { href: '/aos-animation', label: 'AOS effects' },
  ...VERSUS.map((v) => ({ href: `/${v.slug}`, label: `vs ${COMPETITORS[v.competitorKey].label}` })),
];

const RESOURCES: SiteLink[] = [
  { href: '/playground', label: 'Playground' },
  { href: '/verify', label: 'Verify' },
  { href: '/changelog', label: 'Changelog' },
];

/** What the "More" menu and the phone menu list below the primary sections. */
export const MORE: SiteGroup[] = [
  { key: 'frameworks', title: 'Frameworks', links: FRAMEWORKS },
  { key: 'compare', title: 'Compare', links: COMPARE },
  { key: 'resources', title: 'Resources', links: RESOURCES },
];

/** The footer index: every group, the primary sections first. */
export const INDEX: SiteGroup[] = [{ key: 'sections', title: 'Sections', links: PRIMARY }, ...MORE];
