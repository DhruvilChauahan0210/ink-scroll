# Link submissions — drafts (11 Nov 2026)

Why: Search Console shows only 8 sites linking to svg-scroll-draw, and 42 of its
65 pages have never been crawled. Links from established sites are what make
Google crawl more of a site. None of these is social media.

**Nothing here has been sent.** Each one goes out under your name, so each needs
your OK.

---

## 1. awesome-svg (4.7K stars, last updated Jul 2026)

- Repo: https://github.com/willianjusten/awesome-svg
- File: `topics/Libraries.md`, between `SVG.js` and `svg-captcha` (the list is
  roughly alphabetical)
- Rule: `* [link-name](http://example.com/) - description`
- Line:

```
* [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Draws SVG paths as the page scrolls, with a native CSS scroll-timeline path and a JavaScript fallback. MIT, no dependencies.
```

- PR title: `Add svg-scroll-draw to Libraries`

## 2. awesome-web-animation (1.6K stars, last updated Sep 2026)

- Repo: https://github.com/sergey-pimenov/awesome-web-animation
- Section: `## Animate on scroll` (after `ScrollOut`, before `Atropos`)
- Line:

```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG line drawing, reveals, pinning, split text and video scrubbing, using CSS scroll timelines where the browser supports them.
```

- PR title: `Add svg-scroll-draw to Animate on scroll`

## 3. awesome-svelte (2.2K stars, last updated Nov 2026)

- Repo: https://github.com/TheComputerM/awesome-svelte
- Section: `### Animations` (append at the end)
- Rules: the description starts uppercase and ends with a period; commit message
  `Add {project name}`; the PR says in one sentence why it is awesome.
- Line:

```
- [svg-scroll-draw](https://svg-scroll-draw.vercel.app/svelte-scroll-animation) - Svelte actions that draw SVG paths, reveal elements and split text as the page scrolls, on CSS scroll timelines where supported.
```

- Commit: `Add svg-scroll-draw`
- PR body: `Svelte actions for scroll-driven animation (SVG drawing, reveal, pin, split text) that run on the browser's native scroll timeline when available, MIT with no dependencies.`

## 4. awesome-vue (73K stars, last updated Nov 2026)

- Repo: https://github.com/vuejs/awesome-vue
- Section: `#### Animation` (append at the end; entries there have no dash before
  the description, so match that)
- Line:

```
- [svg-scroll-draw](https://svg-scroll-draw.vercel.app/vue-scroll-animation) Vue components and composables that draw SVG paths, reveal content and split text on scroll, using native CSS scroll timelines where supported
```

- PR title: `Add svg-scroll-draw to Animation`

## 5. Newsletter submission forms (you send these; no account needed)

Same text for all three:

> **svg-scroll-draw**: scroll-driven SVG drawing, reveals, pinning and text
> splitting in 11.7 KB gzipped, MIT. Where the browser supports CSS scroll
> timelines it compiles the animation to CSS and runs no per-frame JavaScript.
> Wrappers for React, Vue, Svelte, Solid and Angular.
> https://svg-scroll-draw.vercel.app

- JavaScript Weekly: https://javascriptweekly.com (the "submit a link" address
  is at the bottom of each issue)
- Frontend Focus: https://frontendfoc.us (same)
- React Status: https://react.statuscode.com (lead with the React components)

## 6. Directories

- Best of JS: https://bestofjs.org, which adds projects through an issue on
  `bestofjs/bestofjs`. They usually want some GitHub stars first (the repo has
  8), so this is better later.
- js.libhunt picks up npm packages on its own, so there is nothing to submit.
- Openbase is left out because it has shut down.
- awesome-react-components is left out on purpose: its rules require removing
  someone else's project in the same PR.

## Also stale: the GitHub repo description

It says "Scroll-driven animation in ~10 KB". The main entry is 11.7 KB.
Suggested:

> Scroll-driven animation in 11.7 KB: draw SVG paths, reveal, pin, parallax,
> scrub video. MIT, zero deps, native CSS fast path. React, Vue, Svelte, Solid,
> Angular, Astro.
