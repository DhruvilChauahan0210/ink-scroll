import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import { Mascot } from "@/components/Mascot";

const THEME_SCRIPT = `(function(){
  var s = localStorage.getItem('theme');
  var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (s === 'dark' || (!s && p)) document.documentElement.classList.add('dark');
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const SITE_URL = "https://svg-scroll-draw.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "svg-scroll-draw — Scroll-driven SVG path animation",
    template: "%s | svg-scroll-draw",
  },
  description:
    "A zero-dependency JavaScript library that animates SVG paths as you scroll. ~3 KB gzipped. Works with React, Next.js, Vue 3, and vanilla JS.",
  keywords: [
    "svg animation",
    "scroll animation",
    "svg path animation",
    "scroll-driven animation",
    "svg scroll library",
    "javascript svg",
    "react svg animation",
    "vue svg animation",
    "web animation",
    "svg-scroll-draw",
  ],
  authors: [{ name: "Dhruvil Chauhan", url: SITE_URL }],
  creator: "Dhruvil Chauhan",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "svg-scroll-draw",
    title: "svg-scroll-draw — Scroll-driven SVG path animation",
    description:
      "A zero-dependency JavaScript library that animates SVG paths as you scroll. ~3 KB gzipped. Works with React, Next.js, Vue 3, and vanilla JS.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "svg-scroll-draw — Scroll-driven SVG path animation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "svg-scroll-draw — Scroll-driven SVG path animation",
    description:
      "A zero-dependency JavaScript library that animates SVG paths as you scroll. Under 3 KB gzipped.",
    images: [`${SITE_URL}/opengraph-image`],
  },
  verification: {
    google: "a937c0c149fc8ebe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
        <Mascot />
      </body>
    </html>
  );
}
