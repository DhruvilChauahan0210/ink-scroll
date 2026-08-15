import type { MetadataRoute } from "next";
import { SEO_SLUGS } from "@/data/examples-seo";
import { FRAMEWORK_SLUGS } from "@/data/framework-landings";
import { VERSUS_SLUGS } from "@/data/versus";

export const dynamic = "force-static";

const SITE_URL = "https://svg-scroll-draw.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Core pages ─────────────────────────────────────────────────────────
    {
      url: SITE_URL,
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/examples`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/playground`,
      lastModified: new Date("2026-05-30"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // ── Framework landing pages ─────────────────────────────────────────────
    {
      url: `${SITE_URL}/react-scroll-animation`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/nextjs-scroll-animation`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Framework landing pages (data-driven) ───────────────────────────────
    ...FRAMEWORK_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date("2026-08-15"),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    // ── Comparison pages ────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/vs-gsap`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/vs-aos`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/vs-framer-motion`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Individual example pages ────────────────────────────────────────────
    // Driven by examples-seo.ts, so a new batch lands in the sitemap automatically.
    ...SEO_SLUGS.map((slug) => ({
      url: `${SITE_URL}/examples/${slug}`,
      lastModified: new Date("2026-08-15"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // ── New comparison pages + the Lenis integration guide ──────────────────
    ...VERSUS_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date("2026-08-15"),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/lenis-scroll-animation`,
      lastModified: new Date("2026-08-15"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },

    // ── Blog index ──────────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // ── Blog posts ──────────────────────────────────────────────────────────
    {
      url: `${SITE_URL}/blog/replace-gsap-scrolltrigger`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog/gsap-drawsvg-alternative`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog/replace-aos-scrollreveal`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/complete-guide-scroll-animations-2025`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/native-css-svg-scroll-animations`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-animation-performance`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/horizontal-scroll-sections`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-pin-without-gsap`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/5-patterns-under-10-lines`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-animation-groups`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog/scroll-path-morphing`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog/vue-svelte-solid-v2`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
