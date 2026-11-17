# Bing keyword research — 11 Nov 2026

Source: Bing Webmaster Tools → Keyword Research, last 3 months (11 Aug – 8 Nov
2026), all countries, all languages, all devices. These are **Bing's searches
only**; Google's are usually several times more. Use them to compare demand,
not as totals. "No data" means below Bing's reporting threshold, not zero.

## Searches checked

| Search | Bing searches (3 months) | Who ranks top |
|---|---|---|
| css animation | 1.5K | w3schools, MDN, freefrontend, animate.style |
| text animation | 871 | jitter.video, wordanimator, canva, freefrontend, textstudio (mostly **tools**) |
| ↳ animated text generator | 374 | (related search) |
| ↳ animated text with css/js | 327 | (related search) |
| svg animation | 529 | svgator, w3schools, lottiefiles, svgstudio, movesvgstudio (mostly **tools**) |
| svg path | 526 | w3schools, MDN, patheditor.dev, svg-path.com (**tools**) |
| ↳ svg path editor | 316 | (related search) |
| aos animation | 468 | michalsnik.github.io (AOS), **aos-animate.vercel.app, aos-animation.vercel.app** (small demo sites), github, npm |
| svg animate | 183 | svganimate.ai, MDN, w3schools, svgator |
| gsap scrolltrigger | 159 | gsap.com, freefrontend, gsapify |
| animated svg | 146 | lottiefiles, svgator, iconscout |
| scroll animation | 85 | — |
| framer motion | 6.5K | motion.dev, npm, framer.com (brand; not winnable) |
| svg line animation, svg path animation, animate on scroll, parallax scrolling, javascript animation library, lenis | no data | CSS-Tricks, W3Schools, small tools (svg line animation) |

## What it says

1. **Small sites can win "aos animation".** Two tiny `*.vercel.app` demo pages
   rank in its top 3. Searchers want to *see* the AOS effects. The site ships
   an AOS drop-in, but no page shows every effect live.
2. **Tools win SVG and text-animation searches.** "svg path", "svg path
   editor", "text animation", "animated text generator" and "svg animation"
   are led by free online tools, not articles.
3. Broad library searches ("framer motion", "javascript animation library")
   belong to big brands; not worth chasing.

## Candidates, best first

1. **AOS animation gallery**: every `data-aos` effect live on one page, each
   with its markup to copy, running on the AOS drop-in. Matches "aos animation"
   (468) where small demo sites already rank.
2. **Scroll text animation generator**: pick a split (chars / words / lines)
   and an effect, preview it, copy the code. Matches "text animation" (871),
   "animated text generator" (374), "animated text with css/js" (327).
3. **SVG path tool**: paste an SVG, see each path's length, preview it drawing,
   copy the CSS or the one-line `scrollDraw` call. Matches "svg path" (526) and
   "svg path editor" (316).
