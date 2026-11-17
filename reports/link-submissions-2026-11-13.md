# Link submissions — drafts (13 Nov 2026)

Replaces the newsletter and directory parts of `link-submissions-2026-11-11.md`.
Refreshed 13 Nov, late: the site has a `/tools` hub with 29 free tools, the
library is 2.26.0, and the size is **11.9 KB** gzipped for every API (earlier
drafts said 11.4 and 11.7 KB — do not send those).

**Nothing here has been sent.** Each one goes out under your name.

Figures used below, all from `apps/demo/src/data/competitors.ts` (measured by
`npm run size` / `npm pack` + `gzip -9`): 11.9 KB all APIs; GSAP + ScrollTrigger
+ DrawSVG 47.5 KB; drop-ins `svg-scroll-draw/aos` 3.2 KB, `/scrollreveal` 4.7 KB,
`/vivus` 4.2 KB; `svg-scroll-draw/react` 15.3 KB. Tool names and wording from
`apps/demo/src/data/tools.ts`. All six URLs below returned HTTP 200 on 13 Nov.

---

## Status of the four awesome-list PRs from 11 Nov

All four are open, none merged or commented on yet (checked 13 Nov):

| List | PR | State |
|---|---|---|
| willianjusten/awesome-svg | #277 Add svg-scroll-draw to Libraries | open |
| sergey-pimenov/awesome-web-animation | #42 Add svg-scroll-draw to Animate on scroll | open |
| TheComputerM/awesome-svelte | #279 Add svg-scroll-draw | open |
| vuejs/awesome-vue | #4612 Add svg-scroll-draw to Animation | open |

None of their lines quote a size, so none is stale. Leave them alone; a second
PR to the same list while the first is open tends to get both closed.

---

## 1. Frontend Focus (Cooperpress, weekly; #766 was 11 Nov)

Best fit for the tools: it has a "Tools, Code & Resources" section, and the
audience is CSS and front-end people. Lead with the two CSS-first tools.

- **How:** the issue footer says "Got a link for us? Reply and tell us." So:
  subscribe at https://frontendfoc.us, then reply to an issue. No account
  beyond the subscription. No separate address or form is published.
- **Title limit:** none published. Their headlines run short; drafts are kept
  under 60 characters.

**Title:** SVG Line Drawing Generator
**URL:** https://svg-scroll-draw.vercel.app/svg-line-drawing-generator
**Description:**
> Paste any SVG and get one self-contained file that draws itself line by line
> with CSS and no JavaScript, or a version that draws as the page scrolls. Free,
> in the browser, one of 29 scroll animation tools on the same site.

Second link in the same reply (optional):

**Title:** CSS Scroll-Driven Animation Generator
**URL:** https://svg-scroll-draw.vercel.app/css-scroll-driven-animation-generator
**Description:**
> Seven effects built on `animation-timeline` and `animation-range`, run in a
> box you scroll. Copy the CSS with a fallback for browsers without scroll
> timelines, or the same effect in JavaScript.

## 2. JavaScript Weekly (Cooperpress, weekly; #810 was 10 Nov)

Audience is library-minded, so lead with the library and its migration path,
with the tools hub as the second link.

- **How:** same publisher as Frontend Focus. The web copy of #810 shows no
  submission line. **Unverified:** that replying to the email works the same
  way as Frontend Focus (likely, same publisher and format). Subscribe at
  https://javascriptweekly.com first.
- **Title limit:** none published; kept under 60 characters.

**Title:** svg-scroll-draw 2.26: SVG Line Drawing on the Scroll Timeline
**URL:** https://svg-scroll-draw.vercel.app
**Description:**
> Draws SVG paths as the page scrolls. Where the browser supports
> `animation-timeline: view()` the draw runs on the browser's own scroll
> timeline in CSS, and a JavaScript engine draws the same frame elsewhere.
> Drop-in imports for AOS, ScrollReveal and vivus; 11.9 KB gzipped for every
> API, MIT, no dependencies.

Second link (optional):

**Title:** 29 Free Scroll Animation Tools
**URL:** https://svg-scroll-draw.vercel.app/tools
**Description:**
> Generators, SVG editors and visualizers that run in the browser and give you
> the code: scroll reveal, parallax, pinning, CSS scroll-driven animation,
> path editing and a scroll trigger visualizer.

(The title is 61 characters with "2.26:"; drop the version to get to 55 if you
prefer.)

## 3. React Status (Cooperpress, weekly; #496 was 6 Nov)

Lead with React use. The SVG to JSX converter is the most React-specific tool.

- **How:** subscribe at https://react.statuscode.com and reply to an issue.
  **Unverified:** the web copy of #496 shows no submission line; same
  assumption as JavaScript Weekly.
- **Title limit:** none published; kept under 60 characters.

**Title:** Scroll-Driven SVG Drawing for React
**URL:** https://svg-scroll-draw.vercel.app/react-scroll-animation
**Description:**
> React components that draw SVG paths, reveal content, pin sections and split
> text as the page scrolls, on CSS scroll timelines where the browser supports
> them. `svg-scroll-draw/react` is 15.3 KB gzipped with every component, MIT.

Second link (optional):

**Title:** SVG to JSX Converter
**URL:** https://svg-scroll-draw.vercel.app/svg-to-jsx-converter
**Description:**
> Paste an SVG and get a React component in TSX or JSX, with React's prop
> names, style objects, typed props and an optional wrapper that draws it on
> scroll. Free, in the browser.

## 4. CSS Weekly (Zoran Jambor, weekly; #640 was 12 Nov)

Not in the 11 Nov list. Pure CSS audience, so send the CSS tool, not the library.

- **How:** the contact form at https://css-weekly.com/contact (fields: name,
  email, subject, optional URL, message). It says "Feel free to send a link to
  a blog post, article or video you created." No account. The old
  `/submit-a-link` page now returns 404.
- **Caveat:** the page names posts, articles and videos, not tools. A
  generator may or may not be taken.

**Subject:** CSS scroll-driven animation generator
**URL:** https://svg-scroll-draw.vercel.app/css-scroll-driven-animation-generator
**Message:**
> A free generator for `animation-timeline` and `animation-range`: seven
> effects running in a box you scroll, with the CSS to copy and an
> `@supports` fallback for browsers without scroll timelines. There is also a
> scroll trigger visualizer that shows how start and end lines turn into
> progress from 0 to 1: https://svg-scroll-draw.vercel.app/scroll-trigger-visualizer

Checked: the generator's CSS template wraps the effect in
`@supports (animation-timeline: view())`
(`apps/demo/src/app/css-scroll-driven-animation-generator/page.tsx`, line 53).

## 5. This Week In React (weekly)

- **How:** reply to an issue email (their site says feedback and links go by
  reply). Needs a subscription: https://thisweekinreact.com
- Use the React Status text above unchanged.

---

## Additional destinations

| Destination | Method | Account | Send | Notes |
|---|---|---|---|---|
| **awesome-svg follow-up** (`topics/Animation.md`) | GitHub PR | GitHub (have) | SVG line drawing generator | Only after #277 merges. The file already lists a similar tool ("Img2svg-animation"), alphabetical. Line below. |
| **Best of JS** (bestofjs.org) | GitHub issue with their "add a project" template | GitHub (have) | the library repo | The about page states no star minimum, only "interesting" projects. **Unverified:** the 11 Nov note that they want stars first; the repo has 10. Still better after the awesome-list PRs land. |
| **Web Tools Weekly** (webtoolsweekly.com) | DM on X (open Mon and Tue) or Bluesky chat to @LouisLazaris | X or Bluesky account | /tools hub | Tools only; "Please don't submit articles or tutorials." A DM is not a public post, but it does need a social account — your call given the no-social rule. |
| **DevHunt** (devhunt.org) | Submit after login | Yes (method not stated) | /tools hub or the library | Free or paid not stated on the page; ads are $199/week. **Unverified:** whether listing is free. |
| **AlternativeTo** | Add an app, list it as an alternative to vivus, AOS and ScrollReveal | Yes | the library | **Not checked today**; from general knowledge. Useful because people search "vivus alternative". |
| **Codrops Collective** | No submission route found | — | — | Skip unless you find a contact address. |
| **Sidebar.io** | Human-reviewed link submissions, design audience | **Unverified** | SVG line drawing generator | Status unclear (one listing marks it inactive); prefers recent, original content. |
| awesome-css-group/awesome-css (5.7K stars) | GitHub PR, `## Miscellaneous` | GitHub | CSS scroll-driven animation generator | **Low value:** last push Oct 2024, and five PRs since Sep 2026 sit unmerged. Skip for now. |
| uhub/awesome-css | Auto-generated from GitHub repos | — | — | Not curated; nothing to submit. |

Left out on purpose: Hacker News, Product Hunt, Reddit, dev.to (social posting,
per the no-social rule); awesome-react-components (its rules require removing
someone else's project in the same PR).

### awesome-svg Animation.md line (after #277 merges)

```
* [SVG line drawing generator](https://svg-scroll-draw.vercel.app/svg-line-drawing-generator) - paste an SVG and download one file that draws itself line by line with CSS, or on scroll
```

PR title: `Add SVG line drawing generator to Animation`

The file's existing entries have no description dash on most lines; one
(`Img2svg-animation - ...`) puts it in the link text. Match whichever the
maintainer merged #277 with.

---

## Still stale: the GitHub repo description

Checked 13 Nov via the API, it still says "Scroll-driven animation in ~10 KB".
Suggested (matches the new positioning and the measured figure):

> SVG line drawing on scroll, on the browser's own scroll timeline (CSS, with a
> JS fallback). Drop-in for AOS, ScrollReveal and vivus. 11.9 KB gzipped, MIT,
> zero deps. 29 free tools at svg-scroll-draw.vercel.app/tools

GitHub caps the description at 350 characters; this is about 230. (Repo
settings writes are blocked from this network, so this is a by-hand change.)

---

## Order to send

1. Frontend Focus — line drawing generator (+ CSS scroll-driven generator)
2. CSS Weekly — CSS scroll-driven animation generator
3. JavaScript Weekly — library, then /tools
4. React Status and This Week In React — React page, then SVG to JSX
5. Later: Best of JS, awesome-svg Animation.md, once the open PRs merge
