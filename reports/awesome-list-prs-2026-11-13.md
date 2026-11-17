# Curated-list submissions for svg-scroll-draw (researched 2026-11-13)

Read-only research. Nothing was opened, commented or pushed.
Repo: DhruvilChauahan0210/ink-scroll (10 stars), package svg-scroll-draw 2.25.0, MIT.

---

## 0. State of what is already submitted

The account has **9** list PRs out, not 4. Five of them were missing from the brief:

| PR | State | Notes |
|---|---|---|
| willianjusten/awesome-svg #277 | OPEN, mergeable | no comments, no reviews |
| sergey-pimenov/awesome-web-animation #42 | OPEN, mergeable | only a Netlify "deploy pending review" bot comment |
| TheComputerM/awesome-svelte #279 | OPEN, mergeable | no comments, no reviews |
| vuejs/awesome-vue #4612 | OPEN, mergeable | no comments, no reviews |
| **PatrickJS/awesome-angular #2676** | **MERGED 2026-11-11** | jdegand: "Thanks for the PR." Already live under Third Party Components > Animations |
| **sorrycc/awesome-javascript #1216** | **CLOSED, not merged** (2026-11-11) | gokaygurcan said awesome-svg is the better home and pointed at #277. The list also asks for "at least a few hundred stars". Don't resubmit. |
| one-aalam/awesome-solid-js #95 | OPEN | no activity (list merged 17 of its last 20, but its last merge was 2026-07-29) |
| one-aalam/awesome-astro #176 | OPEN | no activity (90 open PRs, last merge 2026-07-29) |
| unicodeveloper/awesome-nextjs #759 | OPEN | no activity (382 open PRs, merges roughly monthly, last 2026-11-02) |

So awesome-javascript, awesome-angular, awesome-solid-js, awesome-astro and awesome-nextjs from the brief are already done. They are left out of the list below.

---

## Ranked targets (audience x likely to merge)

| # | Target | Stars | Maintained? | Odds | Method |
|---|---|---|---|---|---|
| 1 | shadcn-ui/ui registry directory | 128k | batches registries every 2-5 days (latest batch #12629, 2026-11-11) | High | PR (signed commits) |
| 2 | birobirobiro/awesome-shadcn-ui | 20.8k | 18 of the last 20 closed PRs merged, latest 2026-10-23 | High | PR or the awesomeshadcn.dev form |
| 3 | unovue/shadcn-vue registry directory | 10.8k | only 7 entries; adds merged 2026-10-28 and 2026-11-03 | High | PR |
| 4 | web-padawan/awesome-web-components | 3.6k | 12 of 20 merged, latest 2026-10-12 | Med-high | PR |
| 5 | anubhavsrivastava/awesome-ui-component-library | 1.7k | 17 of 20 merged, latest 2026-11-07 | High (small audience) | PR |
| 6 | enaqx/awesome-react | 75k | maintainer adds a few entries by hand each month (last commit 2026-09-03); most PRs are closed without merging | Low | PR |
| 7 | VoltAgent/awesome-agent-skills | 37k | 14 of 20 merged, latest 2026-11-05 | Low for now (rejects brand-new skills) | PR |
| 8 | shyakadavis/awesome-shadcn-svelte | 140 | all 11 recent PRs merged, but the last was 2026-01-05 | Medium (tiny audience) | PR |
| 9 | Best of JS (michaelrambeau/bestofjs) | 3.1k repo, large site | issues triaged within days | **Wait for 100 stars** | Issue |

Checked and skipped:
- **brillout/awesome-react-components**: every PR must remove an entry.
- **nuxt/awesome**: it has no library section, and its Modules section only links to nuxt.com/modules. `svg-scroll-draw/nuxt` is a plugin factory, not a `defineNuxtModule`, so nuxt/modules doesn't fit either.
- **aniftyco/awesome-tailwindcss**: we have no Tailwind plugin.
- **awesome-css-group/awesome-css**: no merge since 2024-10.
- **bradtraversy/design-resources-for-developers**: paused new resource additions on 2026-10-18.
- **ripienaar/free-for-dev**: only covers SaaS and infrastructure.
- **terkelg/awesome-creative-coding**: 1 merge in 20 PRs.
- **ComposioHQ, travisvn, BehiSecc and heilcheng claude-skills lists**: 0 merges in their last 20 PRs, with 160 to 1,670 PRs open.
- **sveltesociety.dev**: submissions go through a site form, not PRs.
- **preactjs/awesome-preact**: active, but the React wrapper hasn't been verified under preact/compat. Revisit after an e2e check.

---

## 1. shadcn/ui official registry directory (shadcn-ui/ui)

- **Why it matters:** the entry appears at ui.shadcn.com/docs/directory and goes into `/r/registries.json`. That makes `npx shadcn add @svg-scroll-draw/signature-draw` work with no setup and puts us in `shadcn search`. The directory has 565 entries, and none is scroll- or SVG-drawing focused (`@scrollxui` is a general UI kit).
- **File:** `apps/v4/registry/directory.json`. It's an array, and recent additions are appended at the end.
- **Rules** (from `content/docs/registry/registry-index.mdx` and `lib/registry-directory.ts`):
  - The registry must be open source and public.
  - It must be valid against the registry schema.
  - It must be flat: `registry.json` and `{name}.json` sit side by side.
  - `files[]` must not contain `content`. Our `/r/registry.json` has 9 items and no `content`, so it passes.
  - The name must match `^@[a-zA-Z0-9][a-zA-Z0-9_-]*$`.
  - `logo` is a required string. Every entry uses a one-colour inline SVG with `var(--foreground)`.
  - Run `pnpm validate:registries` in `apps/v4`.
  - **Commits must be signed.** A bot closes unsigned PRs after 14 days. Sign with the SSH key you push with.
  - Expect the maintainer to close your PR with "added this to #NNNNN" and fold it into a batch PR. That counts as accepted.
- **Before opening:** we have no SVG logo (the site icon is a PNG). Use a simple stroke mark like the one below, and check that it renders in both themes.
- **Entry to append:**
```json
  {
    "name": "@svg-scroll-draw",
    "homepage": "https://svg-scroll-draw.vercel.app/blocks",
    "url": "https://svg-scroll-draw.vercel.app/r/{name}.json",
    "description": "Scroll-driven blocks on the browser's native scroll timeline: SVG signature drawing, reveal cards, counters, pinned feature tours, text reveals and video scrub.",
    "author": "Dhruvil Chauhan",
    "logo": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' fill='none' stroke='var(--foreground)' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'><path d='M12 70C22 30 38 22 46 46S70 78 84 24'/></svg>"
  }
```
- **PR title:** `feat(registry): add @svg-scroll-draw to directory.json`
- **PR body:**
```
Adds the @svg-scroll-draw registry: scroll-driven blocks built on the svg-scroll-draw library (MIT, zero dependencies), which runs on the browser's native CSS scroll timeline with a JS fallback.

- Registry: https://svg-scroll-draw.vercel.app/r/registry.json (flat, items at https://svg-scroll-draw.vercel.app/r/{name}.json, no inline file content)
- 9 free items: signature-draw, reveal-cards, stat-counter-row, sticky-feature, headline-text-reveal, pinned-feature-tour, horizontal-case-strip, video-scrub, reading-progress
- Install: `npx shadcn@latest add @svg-scroll-draw/signature-draw`
- Homepage: https://svg-scroll-draw.vercel.app/blocks
- Source: https://github.com/DhruvilChauahan0210/ink-scroll

`pnpm validate:registries` passes locally.
```

## 2. awesome-shadcn-ui (birobirobiro/awesome-shadcn-ui)

- **Section:** `## Animations`. CONTRIBUTING says motion-focused collections belong there even when they're shipped as a registry.
- **Placement:** alphabetical by the kebab-case Name. It goes after `sora-ui` and before `tailwindcss-motion`.
- **Rules:**
  - One resource per PR.
  - Three columns only. Don't write the Date cell or a trailing `|  |`, because a workflow stamps it.
  - The Name must be kebab-case.
  - The description is one concrete sentence with no extra links inside it.
  - It must be about shadcn/ui. The "could you drop the word shadcn" test passes, since it installs with the shadcn CLI.
  - It must be free.
  - Duplicate names or URLs fail CI.
  - Alternative: the awesomeshadcn.dev form opens the PR for you and inserts the row in the right place.
- **Line:**
```
| svg-scroll-draw | MIT shadcn registry of scroll-driven blocks (SVG signature drawing, reveal cards, counters, pinned tours, text reveal, video scrub) on the native CSS scroll timeline, installable with the shadcn, shadcn-vue and shadcn-svelte CLIs. | [Link](https://svg-scroll-draw.vercel.app/blocks) |
```
- **PR title:** `feat: add svg-scroll-draw to Animations`
- **PR body:** fill in the repo's template.
  - **What is it?** "Free, MIT-licensed shadcn registry of 9 scroll-driven blocks built on svg-scroll-draw (zero dependencies). Install with `npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/signature-draw.json`; the same blocks ship for shadcn-vue and shadcn-svelte."
  - **Section:** tick [x] Animations.
  - **Checklist:** tick all five boxes (alphabetical, not already listed, clear description, working link, correct section).

## 3. shadcn-vue registry directory (unovue/shadcn-vue)

- **Why:** the directory has only 7 entries (@shadcn, @inspira-ui, @mapcn, @ai-elements, @elevenlabs-ui, @wick-charts, @ganttkit), so each one is very visible on shadcn-vue.com/docs/directory. Our Vue registry is live at `/r/vue/registry.json` with the shadcn-vue `$schema` and 9 items.
- **Files** (same shape as merged PR #1999 for @ganttkit):
  - append to `apps/v4/registry/registries.ts`
  - append the URL line to `apps/v4/public/r/registries.json`, or run `pnpm registry:build:index` in `apps/v4` to generate it
- **Entry:**
```ts
  {
    name: "@svg-scroll-draw",
    title: "svg-scroll-draw",
    description: "Scroll-driven Vue blocks on the native CSS scroll timeline: SVG signature drawing, reveal cards, counters, pinned tours and video scrub.",
    url: "https://svg-scroll-draw.vercel.app/r/vue/{name}.json",
    homepage: "https://svg-scroll-draw.vercel.app/blocks",
    author: "DhruvilChauahan0210",
    tags: ["animations", "scroll", "svg", "blocks"],
  },
```
  and in registries.json: `"@svg-scroll-draw": "https://svg-scroll-draw.vercel.app/r/vue/{name}.json"`
- The `logo` field is optional here. You can reuse the mark from #1, using `currentColor`.
- **PR title:** `docs(registry): add @svg-scroll-draw to the registry directory`
- **PR body:** use the repo template and tick [x] Documentation. Description:
  "Adds `@svg-scroll-draw` to the registry directory. svg-scroll-draw is an MIT, zero-dependency scroll animation library that runs on the browser's native scroll timeline with a JS fallback. The registry ships 9 Vue SFC blocks (signature-draw, reveal-cards, stat-counter-row, sticky-feature, headline-text-reveal, pinned-feature-tour, horizontal-case-strip, video-scrub, reading-progress) that install into `components/scroll/` and pull `svg-scroll-draw` from npm. Try: `npx shadcn-vue@latest add https://svg-scroll-draw.vercel.app/r/vue/signature-draw.json`. registries.json regenerated with `pnpm registry:build:index`."

## 4. awesome-web-components (web-padawan/awesome-web-components)

- **Section:** `## Real World > ### Components`. It goes between `<rapi-doc>` and `<shader-doodle>` (alphabetical).
- **Rules** (CONTRIBUTING.md):
  - Format: `[Name](link) - Description`.
  - Use title-casing.
  - Drop "A/An" from the start of the description.
  - Keep categories alphabetical.
  - Use a useful PR title.
  - The maintainer rejects projects that don't ship a custom element (see #138). We ship `<scroll-draw>`, so lead with it.
- **Line:**
```
- [`<scroll-draw>`](https://github.com/DhruvilChauahan0210/ink-scroll) - Draws the SVG paths inside it as the page scrolls, on the native CSS scroll timeline with a JS fallback; no build step, zero dependencies.
```
- **PR title:** `Add <scroll-draw> to Components`
- **PR body:**
  "Adds `<scroll-draw>`, the custom element shipped by svg-scroll-draw (MIT). Load the CDN script and wrap any inline SVG: `<scroll-draw easing="ease-out" speed="1.2" fade once><svg>…</svg></scroll-draw>`. Attributes are observed and rebuild the element on change, it is SSR-safe (no-op without a DOM), and the line drawing runs on CSS `animation-timeline` where supported. Demo: https://svg-scroll-draw.vercel.app"

## 5. awesome-ui-component-library (anubhavsrivastava/awesome-ui-component-library)

- **Section:** `## React > ### Special use case libraries`. It goes after `Styled Icons` and before the `[Paid]` rows.
- **Rules** (CONTRIBUTING.md):
  - One suggestion per PR.
  - Format: `[Package](link) (star) - <Description>`. Generate the star badge with `node _tools/starBadge <gitrepo>`.
  - Add to the bottom of the category, in alphabetical order.
  - Don't touch trailing whitespace anywhere else.
  - The PR template is a single line: "Added `Library Name` under section `Framework Name`".
- **Line:**
```
- [svg-scroll-draw](https://svg-scroll-draw.vercel.app) [![Repo Star](https://img.shields.io/github/stars/DhruvilChauahan0210/ink-scroll.svg?label=&style=social)](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven React components for SVG line drawing, reveal, pin, parallax, text, counters and video scrub, with Vue, Svelte, Solid and Angular wrappers.
```
- **PR title:** `Add svg-scroll-draw under React special use case libraries`
- **PR body:** `Added svg-scroll-draw under section React (Special use case libraries)`, plus one line saying what it is and that it's MIT and zero-dependency.

## 6. awesome-react (enaqx/awesome-react)

- **Section:** `#### React Graphics and Animations`. Add at the end, after `simple-parallax-js`.
- **Rules:**
  - The list says not to use it "as an advertisement board", and asks for free resources and GitHub links.
  - Entries use the format `[name](github) - Description`, with no trailing period.
  - The maintainer closes most PRs and adds a few entries by hand each month. Expect a silent close.
- **Line:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG line drawing, reveals and parallax on the native scroll timeline, zero dependencies
```
- **PR title:** `Add svg-scroll-draw to React Graphics and Animations`
- **PR body:** two sentences. It's MIT and free, has a React component plus hooks (`svg-scroll-draw/react`), and works with the Next.js App Router.

## 7. awesome-agent-skills (VoltAgent/awesome-agent-skills)

- **Section:** `### Community Skills > Development and Testing`. Add at the end.
- **Rules** (CONTRIBUTING.md):
  - Format: `- **[author/skill-name](url)** - description`.
  - The description must be 10 words or fewer.
  - Include the author prefix.
  - **Skills that "were just created are not accepted; must have real community usage."**
  - PR title: `Add skill: author/skill-name`.
  - Quality criteria: frontmatter description under about 100 tokens, body under 500 lines, no absolute paths.
- **Fix first:**
  - `skills/svg-scroll-draw/SKILL.md` still says "v2.10.x" (the package is at 2.25.0).
  - Its frontmatter description is far over 100 tokens.
  - Submit once the repo has visible adoption.
- **Line:**
```
- **[DhruvilChauahan0210/svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll/tree/main/skills/svg-scroll-draw)** - Scroll-driven SVG drawing, reveals, pinning and parallax without GSAP
```
- **PR title:** `Add skill: DhruvilChauahan0210/svg-scroll-draw`
- **PR body:** "Skill that teaches agents to build scroll-driven animation with svg-scroll-draw (MIT): SVG path drawing, reveal, pin, snap, parallax, split text, counters and video scrub, across React/Next.js, Vue/Nuxt, Svelte, Solid, Angular, Astro and plain HTML. SKILL.md plus on-demand references/."

## 8. awesome-shadcn-svelte (shyakadavis/awesome-shadcn-svelte)

- **Section:** `## Libs and Components` table. Add last, after `svelte-tablecn`.
- **Format:** backticked name, then description, then a `[Link](...)` column. There is no CONTRIBUTING file or template.
- **Line:**
```
| `svg-scroll-draw` | Scroll-driven Svelte blocks (SVG signature drawing, reveal cards, counters, pinned tours, video scrub) installable with the shadcn-svelte CLI. | [Link](https://svg-scroll-draw.vercel.app/blocks) |
```
- **PR title:** `Add svg-scroll-draw to Libs and Components`
- **PR body:** "Adds svg-scroll-draw's shadcn-svelte registry (9 blocks, MIT). Install: `npx shadcn-svelte@latest add https://svg-scroll-draw.vercel.app/r/svelte/signature-draw.json`."

## 9. Best of JS (wait until 100 stars)

- **Gate:** the template's checklist requires "more than 100 stars on GitHub". On 2026-10-24 the maintainer closed #532 as not planned: "consider adding it once it reaches the required threshold of 100 stars". The canonical tracker is michaelrambeau/bestofjs, even though bestofjs/bestofjs also receives submissions.
- **Issue title:** `Add svg-scroll-draw to Best of JS`
- **Body, when eligible:**
  - Description: "Zero-dependency scroll animation library. SVG line drawing on scroll on the browser's native scroll timeline with a JS fallback, plus reveal/pin/snap/parallax/text/counter/video/image-sequence. It also works as a drop-in for AOS, ScrollReveal and vivus, and has wrappers for React, Vue, Svelte, Solid, Angular, Astro and Nuxt."
  - Repo: https://github.com/DhruvilChauahan0210/ink-scroll
  - Tick all four checklist boxes.
  - Tags: animation, scroll, svg, react, vue, svelte, web-components.

---

## Order of work
1. Today: #1 shadcn directory (add the logo and set up signed commits first), #2 awesome-shadcn-ui, #3 shadcn-vue directory, #4 awesome-web-components and #5 ui-component-library. These are all high-odds, and each repo has had a merge within the last month.
2. #8 and #6 are cheap, low-odds extras.
3. Hold #7 until the SKILL.md fixes and some adoption. Hold #9 until 100 stars.
4. Remember the "one PR per resource" rule. Every target above gets exactly one PR.
