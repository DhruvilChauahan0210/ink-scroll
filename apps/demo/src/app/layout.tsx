import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { TITLE_TEMPLATE } from "./_lib/seo";
import { SELF } from '@/data/competitors';

const THEME_SCRIPT = `(function(){
  var s = localStorage.getItem('theme');
  // Dark is the default; a stored 'light' is the only thing that keeps it off.
  if (s !== 'light') document.documentElement.classList.add('dark');
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Not preloaded: the site's own pages set --font-display back to the sans
// (site.css), so Syne is only drawn by the homepage's live-stats chapter, below
// the fold, and by 8 of the showcase sites. Preloaded from this root layout it
// went out on every page, ahead of the fonts the first screen needs.
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "block",
  preload: false,
});

const SITE_URL = "https://svg-scroll-draw.vercel.app";

// Both read the measured size, so the title and the description cannot disagree.
const HOME_TITLE = `SVG Scroll Animation Library — ${SELF.gzipKb} KB, MIT, No GSAP`;
const HOME_DESCRIPTION =
  `Draw SVG paths, reveal content, split text and scrub video on scroll. ${SELF.gzipKb} KB gzipped, zero dependencies, MIT. React, Next.js, Vue, Svelte or vanilla JS.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The homepage has no title of its own, so `default` IS the homepage title.
  // It leads with the queries that already bring clicks ("svg scroll
  // animation", "svg scroll", "scroll animation library"); the brand is in the
  // URL and the og:site_name, so it does not need the title's 60 characters.
  title: {
    default: HOME_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: HOME_DESCRIPTION,
  keywords: [
    "svg scroll animation",
    "svg scroll",
    "scroll animation library",
    "scroll draw",
    "svg scroll draw",
    "scroll draw animation",
    "scroll draw library",
    "scroll draw svg javascript",
    "scroll draw react",
    "svg draw on scroll",
    "animate svg on scroll",
    "animate svg line on scroll react",
    "stroke-dashoffset scroll animation",
    "scroll-driven svg animation",
    "svg scroll draw javascript",
    "animate svg paths on scroll",
    "svg path animation",
    "svg animation react nextjs",
    "svg-scroll-draw",
  ],
  authors: [{ name: "Dhruvil Chauhan", url: SITE_URL }],
  creator: "Dhruvil Chauhan",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "svg-scroll-draw",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
      /* THEME_SCRIPT adds `.dark` here before React hydrates, so the server and
         client class lists differ by design whenever the stored theme is dark.
         Without this the dark theme logs a hydration mismatch on every load. */
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <head>
        {/*
          Declared here, not via metadata.alternates: a page that sets its own
          `alternates.canonical` replaces the layout's whole `alternates` object,
          which silently dropped this tag from every page that has a canonical.
        */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="svg-scroll-draw — blog"
          href={`${SITE_URL}/blog/rss.xml`}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
        {/* Vercel Web Analytics: cookieless page views, free on Hobby (50,000 events a month). */}
        <Analytics />
      </body>
    </html>
  );
}
