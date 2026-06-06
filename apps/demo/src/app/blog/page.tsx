import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'Blog — svg-scroll-draw',
  description:
    'Guides, comparisons, and deep-dives on scroll-driven SVG animation — svg-scroll-draw vs GSAP, migration guides, and more.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — svg-scroll-draw',
    description: 'Guides, comparisons, and deep-dives on scroll-driven SVG animation.',
    url: 'https://svg-scroll-draw.vercel.app/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — svg-scroll-draw',
    description: 'Guides, comparisons, and deep-dives on scroll-driven SVG animation.',
  },
};

const POSTS = [
  {
    slug: 'complete-guide-scroll-animations-2025',
    title: 'The complete guide to scroll animations in 2025',
    description:
      'Every scroll animation pattern — fade reveal, parallax, sticky pin, section snap, text split, video scrub, horizontal sections, CSS variables — with copy-paste code. 12 patterns, one library.',
    tag: 'Guide',
    tagColor: '#111',
    readTime: '15 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-animation-performance',
    title: 'Scroll animation performance — native CSS vs JavaScript',
    description:
      'How svg-scroll-draw uses animation-timeline: view() for zero-JS scroll animations on the compositor. When native CSS wins, when JS wins, and how the eligibility check works.',
    tag: 'Performance',
    tagColor: '#22c55e',
    readTime: '8 min read',
    date: 'June 2026',
  },
  {
    slug: 'horizontal-scroll-sections',
    title: 'Horizontal scroll sections without GSAP — scrollHorizontal',
    description:
      'The Apple / Stripe product page pattern: vertical scroll drives horizontal movement. Build it with scrollHorizontal from svg-scroll-draw — one call, CSS setup, zero GSAP. Includes React example and sticky layout guide.',
    tag: 'How-To',
    tagColor: '#60a5fa',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'replace-aos-scrollreveal',
    title: 'Replace AOS / ScrollReveal.js with one function call',
    description:
      'scrollReveal from svg-scroll-draw: 7 presets, stagger, custom easing, no data attributes, no config files. Drop-in replacement for AOS and ScrollReveal.js — fully typed, part of a larger platform.',
    tag: 'Migration',
    tagColor: '#ef4444',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-pin-without-gsap',
    title: 'Pin sections on scroll without GSAP — scrollPin',
    description:
      'How to pin any element at a viewport position while the page scrolls past it. Wrapper-based layout, zero layout shift, full lifecycle callbacks (onEnter/onLeave/onEnterBack/onLeaveBack). No GSAP. ~9 KB total.',
    tag: 'How-To',
    tagColor: '#f59e0b',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-animation-groups',
    title: 'Animate multiple elements on scroll — one call',
    description:
      'scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup — the complete guide to fan-out, cascade, and parallax animations across multiple elements. Real-world patterns for pricing grids, hero sections, and feature lists.',
    tag: 'Patterns',
    tagColor: '#ffc900',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'vue-svelte-solid-v2',
    title: 'scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide',
    description:
      'Full guide to using svg-scroll-draw v2 APIs in Vue 3, Svelte, and Solid.js. Composables, use: actions, hooks, component wrappers — with copy-paste examples for scrollAnimate, scrollText, scrollCounter, and scrollVideo.',
    tag: 'Framework Guide',
    tagColor: '#42b883',
    readTime: '9 min read',
    date: 'June 2026',
  },
  {
    slug: 'replace-gsap-scrolltrigger',
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
    description:
      'Full migration guide: scrollAnimate covers 95% of ScrollTrigger use cases at 9× smaller bundle size. Side-by-side code for fade/slide, parallax, counters, text reveals, and video scrubbing.',
    tag: 'Migration',
    tagColor: '#ef4444',
    readTime: '8 min read',
    date: 'June 2026',
  },
  {
    slug: '5-patterns-under-10-lines',
    title: '5 scroll animation patterns in under 10 lines',
    description:
      'Logo reveal, sketch diagram, typewriter, cinematic hero, and spring icon — five production-ready patterns each in 3 lines using svg-scroll-draw presets. No config, no GSAP.',
    tag: 'Patterns',
    tagColor: '#ffc900',
    readTime: '5 min read',
    date: 'June 2026',
  },
  {
    slug: 'scroll-path-morphing',
    title: 'Scroll-driven SVG path morphing with morphTo',
    description:
      'How to interpolate SVG path shapes as you scroll using the morphTo option. Path compatibility, use cases, combining with fade and strokeColor, and a full API reference.',
    tag: 'Deep Dive',
    tagColor: '#5865F2',
    readTime: '6 min read',
    date: 'June 2026',
  },
  {
    slug: 'native-css-svg-scroll-animations',
    title: 'Zero-JS SVG scroll animations with native CSS',
    description:
      'How svg-scroll-draw uses animation-timeline: view() to run SVG path animations on the browser compositor — zero per-frame JavaScript, no scroll listeners, 60fps guaranteed.',
    tag: 'Performance',
    tagColor: '#22c55e',
    readTime: '7 min read',
    date: 'June 2026',
  },
  {
    slug: 'gsap-drawsvg-alternative',
    title: 'svg-scroll-draw vs GSAP DrawSVG',
    description:
      'Bundle size, licensing, side-by-side code, a full feature matrix, and a migration guide. The definitive comparison for developers choosing between the two.',
    tag: 'Comparison',
    tagColor: '#ff90e8',
    readTime: '6 min read',
    date: 'May 2026',
  },
];

export default function BlogPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight hover:opacity-70 transition-opacity shrink-0">
          svg-scroll-draw
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Home</Link>
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Docs</Link>
          <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Examples</Link>
          <Link href="/changelog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Changelog</Link>
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">⚡ Playground</Link>
        </div>
        <div className="flex lg:hidden">
          <MobileMenu />
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-4 font-medium">
            Blog
          </p>
          <h1 className="font-display font-extrabold text-[clamp(32px,6vw,64px)] leading-[0.92] tracking-[-0.04em]">
            Guides &amp; comparisons.
          </h1>
        </div>
      </section>

      {/* Posts */}
      <section className="px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto space-y-4">
          {POSTS.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 p-6 sm:p-8 rounded-2xl border border-pitch-black bg-white hover:shadow-[4px_4px_0px_#000] transition-shadow"
            >
              {/* Tag + date */}
              <div className="shrink-0 sm:w-32 sm:text-right space-y-1.5">
                <div
                  className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: post.tagColor + '30', color: '#111', border: `1px solid ${post.tagColor}` }}
                >
                  {post.tag}
                </div>
                <p className="text-[11px] font-mono text-graphite-border block">{post.date}</p>
                <p className="text-[11px] font-mono text-graphite-border">{post.readTime}</p>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-tight tracking-[-0.02em] mb-2 group-hover:underline underline-offset-4">
                  {post.title}
                </h2>
                <p className="text-[14px] text-graphite-border leading-relaxed">
                  {post.description}
                </p>
                <p className="mt-3 text-[12px] font-mono text-pitch-black font-semibold group-hover:underline underline-offset-2">
                  Read →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-subtle-ash text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~9 KB gzipped ·{' '}
        <a href="https://github.com/DhruvilChauahan0210/ink-scroll" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>

    </div>
  );
}
