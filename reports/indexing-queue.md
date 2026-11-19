# Indexing queue — svg-scroll-draw

Bing: all 93 sitemap URLs submitted 2026-11-12 (Bing Webmaster → URL Submission, 100 a day). This file tracks Google only.

Sitemap resubmitted 2026-11-14: Search Console now reads 112 URLs (was 64 from 2026-11-06).

Updated 2026-11-19: scheduled run at 14:10 IST (after the 13:30 IST reset). The first request (T04) hit **Quota Exceeded** again, the seventh day running for svg-scroll-draw, even after 13:30 IST, so the reset-time theory does not explain it: this property's manual quota looks exhausted. No requests got through. Inspections of the next nine todo rows: T15, T16, T17 are now **indexed** (from the sitemap); T06, T07, T12, T14 are still "Discovered – currently not indexed"; T11 and T18 are "URL unknown to Google". S01 (scrollfx /components) was requested yesterday and was not re-checked.

Updated 2026-11-18: /blog/vue-scroll-animation-components and /blog/svelte-scroll-animation-components are now **indexed** (from the sitemap, no request needed). The first request of the day (T04) hit Quota Exceeded again, at 10:30 IST, the sixth day running. Likely cause: the daily quota resets at midnight Pacific (13:30 IST), so a morning-IST request still counts against Google's previous day. **From now on, request after 13:30 IST.** Afternoon run at 14:50 IST: scrollfx /components (S01) → **Indexing requested** (first success in six days); svg-scroll-draw T04 → Quota Exceeded again. So the quota is per property, not per account as noted on 15 Nov, and svg-scroll-draw's is exhausted or near zero while scrollfx's works; svg-scroll-draw pages keep getting indexed from the sitemap regardless (7 more seen today). A scheduled task, request-indexing, now runs this daily at 14:00 IST. Inspections today: T05, T08, T09, T10, T13 indexed; T06, T07, T12, T14 discovered, not indexed; T11 unknown to Google. scrollfx: /components (published 17 Nov) is unknown to Google yet; it is in scrollfx's sitemap, which was resubmitted 17 Nov. The "request-indexing" scheduled task no longer exists on this Mac.

Updated 2026-11-17: both sitemaps resubmitted (svg-scroll-draw, and scrollfx with the three new plates: stats, logos, bento). /benchmarks/gsap-vs-svg-scroll-draw is already indexed. /blog/vue-scroll-animation-components and /blog/svelte-scroll-animation-components are "Discovered – currently not indexed" (found via the sitemap); the first request of the day (the Vue post) hit Quota Exceeded again, the fifth day running. Retry those two first.

Updated 2026-11-15 (evening): fourth day of Quota Exceeded on the first request (/blog/generative-svg-line-art, "URL is unknown to Google", no referring sitemap yet). Sitemap resubmitted the same evening: Search Console reads 113 URLs. scrollfx-ui.vercel.app is now a verified URL-prefix property (meta tag in its app/layout.tsx, scrollfx 7822496) in the same Google account; its sitemap was submitted (12 pages found). Requesting indexing for its home page also hit Quota Exceeded: the limit is per account, not per property.

Updated 2026-11-15: three days running, the first request of the day hit Quota Exceeded (the inspection still works: T04 shows "Discovered – currently not indexed", found via the sitemap and two internal links). Manual requests are not getting through, so discovery rests on the sitemap, IndexNow and internal links for now.

Updated 2026-11-12 (Google took 2, then Quota Exceeded): the /tools hub and its 25 tools go first (rows T01–T26), best first.

The 42 pages Search Console listed as "Discovered – currently not indexed" on
2026-11-11, in the order to request indexing. Google's limit for this site is
low and not published: on 2026-11-11 it accepted 2, refused, then accepted 1
an hour later. Ask a few times a day and stop at the first "Quota Exceeded".

The daily task "request-indexing" takes the first 10 rows marked `todo`, asks
for indexing in Search Console (URL Inspection → Request indexing) and writes
the date, or `indexed` when the inspection says the page is already on Google.
It stops for the day at the quota message and leaves the rest `todo`.

| # | URL | Status |
|---|---|---|
| S01 | https://scrollfx-ui.vercel.app/components | requested 2026-11-18 (14:50 IST) |
| T01 | https://svg-scroll-draw.vercel.app/tools | 2026-11-12 (Google) |
| T02 | https://svg-scroll-draw.vercel.app/svg-line-drawing-generator | 2026-11-12 (Google) |
| T03 | https://svg-scroll-draw.vercel.app/scroll-reveal-generator | indexed (seen 2026-11-13) |
| T04 | https://svg-scroll-draw.vercel.app/svg-path-editor | todo — Quota Exceeded 2026-11-19 (14:10 IST; also every day 2026-11-13 to 2026-11-18), retry first |
| T05 | https://svg-scroll-draw.vercel.app/css-scroll-driven-animation-generator | indexed (seen 2026-11-18) |
| T06 | https://svg-scroll-draw.vercel.app/scroll-trigger-visualizer | todo — tool page, 2026-11-11/12 |
| T07 | https://svg-scroll-draw.vercel.app/text-animation-generator | todo — tool page, 2026-11-11/12 |
| T08 | https://svg-scroll-draw.vercel.app/aos-animation | indexed (seen 2026-11-18) |
| T09 | https://svg-scroll-draw.vercel.app/svg-path-viewer | indexed (seen 2026-11-18) |
| T10 | https://svg-scroll-draw.vercel.app/scroll-progress-bar-generator | indexed (seen 2026-11-18) |
| T11 | https://svg-scroll-draw.vercel.app/counter-animation-generator | todo — URL unknown to Google (2026-11-18) |
| T12 | https://svg-scroll-draw.vercel.app/parallax-scrolling-generator | todo — tool page, 2026-11-11/12 |
| T13 | https://svg-scroll-draw.vercel.app/svg-morph-generator | indexed (seen 2026-11-18) |
| T14 | https://svg-scroll-draw.vercel.app/svg-to-jsx-converter | todo — tool page, 2026-11-11/12 |
| T15 | https://svg-scroll-draw.vercel.app/svg-shape-to-path-converter | indexed (seen 2026-11-19) |
| T16 | https://svg-scroll-draw.vercel.app/typewriter-effect-generator | indexed (seen 2026-11-19) |
| T17 | https://svg-scroll-draw.vercel.app/text-fill-scroll-generator | indexed (seen 2026-11-19) |
| T18 | https://svg-scroll-draw.vercel.app/scroll-video-scrub-generator | todo — URL unknown to Google (2026-11-19) |
| T19 | https://svg-scroll-draw.vercel.app/horizontal-scroll-generator | todo — tool page, 2026-11-11/12 |
| T20 | https://svg-scroll-draw.vercel.app/scroll-pin-generator | todo — tool page, 2026-11-11/12 |
| T21 | https://svg-scroll-draw.vercel.app/css-scroll-snap-generator | todo — tool page, 2026-11-11/12 |
| T22 | https://svg-scroll-draw.vercel.app/css-keyframes-animation-generator | todo — tool page, 2026-11-11/12 |
| T23 | https://svg-scroll-draw.vercel.app/cubic-bezier-generator | todo — tool page, 2026-11-11/12 |
| T24 | https://svg-scroll-draw.vercel.app/easing-visualizer | todo — tool page, 2026-11-11/12 |
| T25 | https://svg-scroll-draw.vercel.app/svg-wave-generator | todo — tool page, 2026-11-11/12 |
| T26 | https://svg-scroll-draw.vercel.app/svg-blob-generator | todo — tool page, 2026-11-11/12 |
| 0 | https://svg-scroll-draw.vercel.app/blog/vue-svelte-solid-v2 | todo — "Crawled – currently not indexed" on its 2026-08-16 version; ask for a recrawl |
| 1 | https://svg-scroll-draw.vercel.app/vue-scroll-animation | 2026-11-11 |
| 2 | https://svg-scroll-draw.vercel.app/svelte-scroll-animation | 2026-11-11 |
| 3 | https://svg-scroll-draw.vercel.app/angular-scroll-animation | 2026-11-11 |
| 4 | https://svg-scroll-draw.vercel.app/vs-framer-motion | todo |
| 5 | https://svg-scroll-draw.vercel.app/vs-motion | todo |
| 6 | https://svg-scroll-draw.vercel.app/vs-aos | todo |
| 7 | https://svg-scroll-draw.vercel.app/blog/gsap-drawsvg-alternative | todo |
| 8 | https://svg-scroll-draw.vercel.app/blog/native-css-svg-scroll-animations | todo |
| 9 | https://svg-scroll-draw.vercel.app/guides/gsap-scrolltrigger-react | todo |
| 10 | https://svg-scroll-draw.vercel.app/guides/aos-react | todo |
| 11 | https://svg-scroll-draw.vercel.app/nuxt-scroll-animation | todo |
| 12 | https://svg-scroll-draw.vercel.app/solid-scroll-animation | todo |
| 13 | https://svg-scroll-draw.vercel.app/astro-scroll-animation | todo |
| 14 | https://svg-scroll-draw.vercel.app/vs-scrollmagic | todo |
| 15 | https://svg-scroll-draw.vercel.app/vs-vivus | todo |
| 16 | https://svg-scroll-draw.vercel.app/guides | todo |
| 17 | https://svg-scroll-draw.vercel.app/guides/aos-nextjs | todo |
| 18 | https://svg-scroll-draw.vercel.app/guides/scrollreveal-react | todo |
| 19 | https://svg-scroll-draw.vercel.app/guides/vivus-react | todo |
| 20 | https://svg-scroll-draw.vercel.app/blog/horizontal-scroll-sections | todo |
| 21 | https://svg-scroll-draw.vercel.app/blog/scroll-animation-groups | todo |
| 22 | https://svg-scroll-draw.vercel.app/blog | todo |
| 23 | https://svg-scroll-draw.vercel.app/blocks | todo |
| 24 | https://svg-scroll-draw.vercel.app/playground | todo |
| 25 | https://svg-scroll-draw.vercel.app/changelog | todo |
| 26 | https://svg-scroll-draw.vercel.app/examples/astro | todo |
| 27 | https://svg-scroll-draw.vercel.app/examples/flowchart | todo |
| 28 | https://svg-scroll-draw.vercel.app/examples/group-api | todo |
| 29 | https://svg-scroll-draw.vercel.app/examples/logo-reveal | todo |
| 30 | https://svg-scroll-draw.vercel.app/examples/map-route | todo |
| 31 | https://svg-scroll-draw.vercel.app/examples/network | todo |
| 32 | https://svg-scroll-draw.vercel.app/examples/presets | todo |
| 33 | https://svg-scroll-draw.vercel.app/examples/scroll-counter | todo |
| 34 | https://svg-scroll-draw.vercel.app/examples/scroll-pin | todo |
| 35 | https://svg-scroll-draw.vercel.app/examples/scroll-reveal | todo |
| 36 | https://svg-scroll-draw.vercel.app/examples/scroll-snap | todo |
| 37 | https://svg-scroll-draw.vercel.app/examples/scroll-text | todo |
| 38 | https://svg-scroll-draw.vercel.app/examples/scroll-text-lines | todo |
| 39 | https://svg-scroll-draw.vercel.app/examples/scroll-video | todo |
| 40 | https://svg-scroll-draw.vercel.app/examples/sequence-api | todo |
| 41 | https://svg-scroll-draw.vercel.app/examples/solid | todo |
| 42 | https://svg-scroll-draw.vercel.app/examples/vue | todo |
