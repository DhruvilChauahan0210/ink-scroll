import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
