import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The share cards read their fonts with readFile (app/_lib/og.tsx). Static
  // cards are drawn at build time, but the three under dynamic segments render
  // per request on Vercel, so the fonts must ship with those functions — file
  // tracing cannot follow a path built at runtime.
  outputFileTracingIncludes: {
    "/**/opengraph-image": ["./src/app/_lib/fonts/*.ttf"],
  },
  async redirects() {
    return [
      // The cornerstone guide was renamed from -2025 to -2026 on 2026-10-30.
      // `permanent: true` sends a 308, which search engines treat like a 301:
      // the old URL's ranking passes to the new one.
      {
        source: "/blog/complete-guide-scroll-animations-2025",
        destination: "/blog/complete-guide-scroll-animations-2026",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
