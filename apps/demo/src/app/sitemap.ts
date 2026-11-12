import type { MetadataRoute } from "next";
import { SEO_SLUGS } from "@/data/examples-seo";
import { FRAMEWORK_SLUGS } from "@/data/framework-landings";
import { VERSUS_SLUGS } from "@/data/versus";
import { GUIDE_SLUGS } from "@/data/guides";

export const dynamic = "force-static";

const SITE_URL = "https://svg-scroll-draw.vercel.app";

// Pages generated from data share one date per group: the last commit to the
// template, its component or its data file. `npm run sitemap:dates` rewrites
// these alongside the literal entries below — never type them by hand.
const FRAMEWORK_PAGES_DATE = "2026-11-07";
const VERSUS_PAGES_DATE = "2026-11-07";
const EXAMPLE_PAGES_DATE = "2026-11-12";
const GUIDE_PAGES_DATE = "2026-11-07";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Core pages ─────────────────────────────────────────────────────────
    {
      url: SITE_URL,
      lastModified: new Date("2026-10-30"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/examples`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blocks`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/playground`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // ── Framework landing pages ─────────────────────────────────────────────
    {
      url: `${SITE_URL}/react-scroll-animation`,
      lastModified: new Date("2026-11-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/nextjs-scroll-animation`,
      lastModified: new Date("2026-11-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Framework landing pages (data-driven) ───────────────────────────────
    ...FRAMEWORK_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(FRAMEWORK_PAGES_DATE),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    // ── Comparison pages ────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/vs-gsap`,
      lastModified: new Date("2026-11-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/easing-visualizer`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/counter-animation-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/parallax-scrolling-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/scroll-trigger-visualizer`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/css-scroll-driven-animation-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-shape-to-path-converter`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/scroll-progress-bar-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/scroll-reveal-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/css-keyframes-animation-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/css-scroll-snap-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/horizontal-scroll-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/cubic-bezier-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-line-drawing-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-to-jsx-converter`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-wave-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-blob-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-morph-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/text-fill-scroll-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/scroll-pin-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/scroll-video-scrub-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-path-editor`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/typewriter-effect-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/svg-path-viewer`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/text-animation-generator`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/aos-animation`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/vs-aos`,
      lastModified: new Date("2026-11-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/vs-framer-motion`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Individual example pages ────────────────────────────────────────────
    // Driven by examples-seo.ts, so a new batch lands in the sitemap automatically.
    ...SEO_SLUGS.map((slug) => ({
      url: `${SITE_URL}/examples/${slug}`,
      lastModified: new Date(EXAMPLE_PAGES_DATE),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // ── Migration guides (AOS / ScrollReveal / vivus / GSAP ScrollTrigger) ──
    {
      url: `${SITE_URL}/guides`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: new Date(GUIDE_PAGES_DATE),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    // ── New comparison pages + the Lenis integration guide ──────────────────
    ...VERSUS_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(VERSUS_PAGES_DATE),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/lenis-scroll-animation`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },

    // ── Blog index ──────────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // ── Blog posts ──────────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/blog/replace-gsap-scrolltrigger`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog/gsap-drawsvg-alternative`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog/replace-aos-scrollreveal`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/unslop-ai-looking-ui`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog/reduced-motion-scroll-animations`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog/accessible-split-text-animation`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog/complete-guide-scroll-animations-2026`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/native-css-svg-scroll-animations`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-animation-performance`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/horizontal-scroll-sections`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-pin-without-gsap`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/5-patterns-under-10-lines`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-animation-groups`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-path-morphing`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog/vue-svelte-solid-v2`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
