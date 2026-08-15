# Homepage Industry-Standard Plan

Status: Proposed  
Audit date: 2026-08-15  
Product version reviewed: `svg-scroll-draw@2.10.0`  
Primary implementation file: `apps/demo/src/app/page.tsx`

## 1. Purpose

This document defines how to turn the `svg-scroll-draw` homepage into a focused,
credible, high-converting developer-product landing page.

The current site has a distinctive visual identity and many strong individual
components. Its main weakness is not a lack of content or capability. It is a lack
of prioritisation: the homepage currently tries to serve as a landing page,
documentation reference, example gallery, changelog, comparison page, playground,
and project dashboard at the same time.

The goal is to preserve the recognisable brand while making the page shorter,
clearer, faster, easier to trust, and easier to act on.

## 2. Executive assessment

### Current strengths

- Memorable typography and a distinctive pink/yellow/black visual system.
- Real interactive demonstrations instead of mocked product screenshots.
- A clear technical foundation: zero runtime dependencies, small bundle size,
  native CSS fast path, framework wrappers, and a common playback API.
- Consistent cards, controls, code blocks, borders, and spacing.
- Good source material across the docs, examples, tests, comparisons, and README.
- A strong signature demonstration in the fountain-pen scroll showcase.

### Current weaknesses

- The rendered page is approximately 25,900 CSS pixels tall on desktop and
  35,900 CSS pixels tall on mobile.
- It requires roughly 36 desktop viewports and more than 40 mobile viewports to
  reach the end.

  > Note: these two heights are the only figures in this document with no source
  > in the repository. Re-measure them against a production build (`next build`,
  > not `next dev`) at the reference viewports in section 8 before treating them
  > as the baseline for the section 10 performance targets.
- The middle of the page repeats the same heading/copy/code/demo layout too often.
- The positioning shifts from SVG path drawing to a general animation platform
  without clearly explaining the relationship.
- Detailed options, release history, and API code samples overwhelm the product
  story.
- Some copy is overly adversarial or self-congratulatory and can reduce trust.
- Important proof is either inconsistent or buried too far down the page.
- The amount of client-side interactivity creates avoidable performance and
  accessibility risk.

### Target outcome

The revised homepage should:

- Explain the product in five seconds.
- Demonstrate the core effect in the first viewport.
- Establish technical credibility in the first two viewports.
- Show only the strongest use cases on the homepage.
- Direct detailed exploration to Docs, Examples, Playground, and comparison pages.
- Offer a clear primary action at every major decision point.
- Fit within approximately 8 to 12 desktop viewports and 12 to 18 mobile viewports.

## 3. Core positioning

### Current positioning problem

The homepage begins with SVG-specific language, then expands into CSS animation,
text splitting, video scrubbing, counters, pinning, snapping, reveals, parallax,
and horizontal scrolling. That can make the package feel unfocused even though the
broader feature set is valuable.

### Recommended positioning

Use SVG path drawing as the distinctive entry point and broader scroll animation
as the product category:

> A lightweight scroll-animation toolkit, with best-in-class SVG path drawing.

Supporting message:

> Draw SVG paths, reveal content, animate text, scrub video, and control CSS with
> scroll. About 10 KB for the complete main entry, zero runtime dependencies, and
> native CSS acceleration when the browser supports it.

### Message hierarchy

1. What it does: scroll-driven animation for the web.
2. Why it is different: exceptionally good SVG drawing plus broader primitives.
3. Why it is credible: small, dependency-free, tested in real browsers, and
   framework-agnostic.
4. How to start: install one package or open the playground.

### Avoid positioning it as

- A complete replacement for every GSAP use case.
- The established industry standard without third-party evidence.
- A tool that makes all competing libraries obsolete.
- A list of unrelated APIs without a single product story.

## 4. Recommended homepage information architecture

The homepage should contain eight primary sections.

### Section 1: Hero and immediate proof

Purpose: communicate the value and let visitors experience the product immediately.

Include:

- One clear category label: `Open-source scroll animation for the web`.
- A direct headline focused on outcome rather than implementation.
- A two-line supporting description.
- The install command with a copy action.
- One primary CTA: `Open Playground` or `Get started`.
- One secondary CTA: `View examples`.
- A live SVG path-drawing demonstration inside the hero.
- A compact credibility row containing only verified, current claims.

Recommended headline direction:

> Make the page move with the scroll.

Recommended supporting copy:

> Draw SVG paths, reveal content, animate text, and scrub video with one tiny,
> dependency-free library. React, Vue, Svelte, Solid, Angular, Astro, and vanilla JS.

The exact final copy should be tested, but it should remain concrete and avoid
self-awarded status claims.

### Section 2: Technical proof strip

Purpose: answer the developer's immediate risk questions.

Show four to six concise facts:

- `10.0 KB gzip` for the complete main entry.
- `0 runtime dependencies`.
- Native CSS fast path with automatic fallback.
- Framework-agnostic and SSR-safe.
- Current unit-test and browser-test counts.
- MIT licensed.

Rules:

- Generate counts from the same source used by claim checks where practical.
- Do not show vanity metrics if they are not yet persuasive.
- Link technical claims to verification details rather than adding long
  explanations to the homepage.

### Section 3: Three reasons to choose it

Purpose: convert features into a simple decision.

Use three differentiated benefits:

1. **Purpose-built for scroll** — triggers, progress, callbacks, playback, and
   reduced-motion handling are part of one consistent API.
2. **Native when possible** — simple cases use CSS scroll timelines; advanced
   cases fall back automatically.
3. **One package, every framework** — first-class wrappers and separate entry
   points without runtime dependencies.

Each benefit should use one illustration, no more than 60 words of copy, and at
most one short code fragment.

### Section 4: Flagship demonstrations

Purpose: prove breadth without turning the homepage into the example gallery.

Keep three interactive demonstrations:

1. SVG path drawing — the signature capability.
2. General CSS animation or reveal — proves it goes beyond SVG.
3. Text animation or video scrubbing — proves a high-value real-world pattern.

Each demonstration should have:

- One sentence explaining the outcome.
- One short, readable code sample.
- A minimal set of controls.
- A link to the complete example.

Do not place ten nearly identical feature demonstrations one after another.

### Section 5: Compact API map

Purpose: reveal product breadth without showing twelve full code cards.

Use a compact grid or grouped list:

- Draw and morph: `scrollDraw`, timeline, group, sequence.
- Reveal and animate: `scrollAnimate`, `scrollReveal`, `scrollText`.
- Scroll experiences: `scrollPin`, `scrollSnap`, `scrollHorizontal`, parallax.
- Media and data: `scrollVideo`, `scrollCounter`, progress.
- Integration and tooling: Lenis bridge, devtools, framework wrappers.

Each item needs one short description and a link. Full code belongs in `/docs` or
`/examples`.

### Section 6: Framework quickstart

Purpose: remove integration anxiety.

Keep the framework tabs, but initially show only the four most common choices and
provide an `All frameworks` link. Code must remain large enough to read without
zooming.

### Section 7: Credibility and comparison

Purpose: answer “Can I trust this?” and “Why not another tool?”

Preferred proof, in order:

1. Real user quotes or public projects using the library.
2. Verified browser parity and test coverage.
3. Reproducible bundle-size measurements.
4. GitHub and npm statistics, when the numbers strengthen the story.
5. A balanced feature comparison linking to the full comparison pages.

Use neutral language such as:

> Choose the tool that matches the job.

Avoid “Every existing tool is broken.” A fair comparison increases trust and is
consistent with the more balanced root README.

### Section 8: Final CTA and footer

Purpose: make the next step obvious.

Recommended final CTA:

> Build your first scroll animation in two minutes.

Actions:

- Primary: `Open Playground`.
- Secondary: copy the install command.
- Tertiary: `Read the docs` or `View on GitHub`.

The footer should contain concise navigation and project metadata. Integrate
Product Hunt proof into the credibility section if it is useful; do not leave a
large third-party-looking widget appended below an otherwise custom-designed
footer.

## 5. Content to remove or relocate

### Move to `/examples`

- Most of the numbered feature demonstrations.
- Individual easing, direction, reverse, fill, width, morph, waypoint, group,
  autoplay, and callback demonstrations.
- Full interactive controls for every feature.
- Expanded SVG and non-SVG galleries.

### Move to `/docs`

- The complete options table.
- Detailed native-CSS eligibility and fallback rules.
- Full instance API explanations.
- Framework-specific implementation details.
- Edge cases and advanced configuration.

### Move to `/changelog`

- `v1.1.0`, `v2.0-v2.2`, and similar historical labels.
- Release-by-release API announcements.
- “New in version” messaging that is no longer new for the current release.

### Keep on dedicated comparison pages

- Complete feature matrices.
- Detailed bundle comparisons.
- Migration guides from GSAP, AOS, ScrollReveal, Motion, or ScrollMagic.

### Remove entirely unless supported by evidence

- “Every existing tool is broken.”
- “The modern standard” as a self-awarded claim.
- Absolute replacement claims such as “replaces GSAP” without tightly defining
  the use case.
- Duplicate stats, duplicate feature lists, and repeated install CTAs with equal
  visual weight.

## 6. Copy standards

### Voice

The product should sound:

- Confident but measured.
- Technical but readable.
- Honest about trade-offs.
- Focused on developer outcomes.
- Specific rather than superlative.

### Copy rules

- Lead with what the user can build.
- Follow with why this library makes it easier.
- Support quantitative claims with a source or verification link.
- Use one idea per heading.
- Keep section introductions below 80 words.
- Keep cards below 40 words where possible.
- Use `GSAP + ScrollTrigger + DrawSVG` when comparing that exact combination;
  avoid reducing the entire GSAP ecosystem to one narrow bundle comparison.
- Say “alternative for this pattern” instead of “complete replacement” where the
  scope is narrower.

### Claim consistency

The current homepage contains `423 tests`, while the root README reports 531 unit
tests plus 175 browser tests. The homepage also mixes current `v2.10.0` messaging
with old `v1.1.0` and `v2.0-v2.2` labels.

Create one source of truth for:

- Package version.
- Unit-test count.
- Browser-test count.
- Bundle sizes.
- Supported framework list.
- Browser-support wording.

Use the existing claims-checking workflow to fail CI when homepage claims drift.

The specific gap that allowed this drift is already visible in
`scripts/check-claims.mjs`: `apps/demo/src/app/page.tsx` appears in
`SIZE_CLAIM_FILES` but not in `FILES_WITH_TEST_COUNTS`, which currently covers
only `README.md`, `STATUS.md`, `apps/demo/src/app/opengraph-image.tsx`, and
`apps/demo/src/app/react-scroll-animation/page.tsx`. That is why the homepage's
`10 KB` size claim stayed current while its test count sat at `423`.

Adding `apps/demo/src/app/page.tsx` to `FILES_WITH_TEST_COUNTS` is a one-line
change and should land in Phase 1, before any copy is rewritten.

## 7. Visual design standards

### Preserve

- Syne display typography.
- Pink/yellow accent palette.
- Strong black borders and editorial layout.
- The fountain-pen signature illustration.
- High-contrast code panels.
- Playful personality and mascot, used selectively.

### Improve

- Introduce more visual pacing: alternate dense sections with calm, concise ones.
- Reserve the largest typography for the hero and final CTA.
- Use fewer oversized decorative section numbers.
- Reduce the number of bordered containers visible at once.
- Create stronger contrast between marketing sections, proof sections, and demos.
- Use whitespace to prioritise, not merely to lengthen the page.
- Limit each viewport to one dominant visual idea.
- Make the primary CTA visually consistent throughout the page.

### Typography minimums

- Body copy: 16 px desktop, at least 15 px mobile.
- Code: at least 13 px desktop and 12 px mobile, with comfortable line height.
- Supporting metadata: at least 11 px and never required for understanding.
- Avoid large blocks of all-uppercase copy.
- Keep text lines around 55 to 75 characters for long-form explanations.

### Interaction standards

- Every interactive demo must be understandable without instructions longer than
  one sentence.
- Controls should have labels, keyboard support, and visible focus states.
- Avoid repeating identical easing and speed controls on the homepage.
- Do not require visitors to scrub many controls to understand the basic value.
- Use motion to explain the product, not merely decorate the page.

## 8. Responsive standards

The current two-column demos stack into long sequences of heading, paragraph,
code, controls, and illustration on mobile. That compounds the page-length problem.

Mobile requirements:

- Put the live result before supporting detail when it improves understanding.
- Collapse secondary code behind a `View code` disclosure when appropriate.
- Keep only essential demo controls visible.
- Avoid repeated full-height cards.
- Prevent any horizontal overflow at 320 px width.
- Keep tap targets at least 44 by 44 CSS pixels.
- Test the sticky navigation with long labels and browser zoom.
- Keep the complete mobile page below approximately 18 viewports.

Required viewport checks:

- 320 × 568.
- 375 × 667.
- 390 × 844.
- 768 × 1024.
- 1280 × 720.
- 1440 × 900.

## 9. Accessibility standard

Target WCAG 2.2 AA for the marketing site.

Required work:

- Add a global `prefers-reduced-motion` mode for the marquee, mascot animations,
  decorative SVG animation, and non-essential transitions.
- Ensure the page is fully usable with a keyboard.
- Provide visible `:focus-visible` states for links, tabs, buttons, sliders, and
  copy controls.
- Use proper tab semantics for framework and install tabs.
- Confirm every range input has an accessible name and current value.
- Mark decorative SVGs and mascot art as hidden from assistive technology.
- Give meaningful illustrations useful alternative text when they convey content.
- Preserve logical heading order after moving sections.
- Maintain AA contrast in light and dark themes, including muted text and borders.
- Announce successful copy actions without relying only on a visual label change.
- Test at 200% browser zoom and with text spacing overrides.

## 10. Performance standard

The homepage currently contains many dynamically imported interactive demos. A
dynamic import can split code, but it does not automatically guarantee that every
below-the-fold component avoids initial loading or hydration.

Performance requirements:

- Render only three flagship interactive demos on the homepage.
- Prefer static previews with an `Open example` action for secondary APIs.
- Lazy-load below-the-fold client components using visibility where appropriate.
- Avoid hydrating components that do not require client-side state.
- Keep decorative SVG complexity proportional to its visible size.
- Do not preload assets used only near the footer.
- Reserve image and demo dimensions to prevent layout shift.
- Pause non-essential animations outside the viewport.
- Verify that dark-mode and mascot scripts do not create unnecessary long tasks.

Recommended production targets on a representative mid-range mobile profile:

- Lighthouse Performance: at least 90.
- Lighthouse Accessibility: at least 95.
- Largest Contentful Paint: at most 2.5 seconds at the 75th percentile.
- Interaction to Next Paint: at most 200 milliseconds at the 75th percentile.
- Cumulative Layout Shift: at most 0.1 at the 75th percentile.
- Initial homepage JavaScript: establish a measured baseline, then reduce it by at
  least 40% during the redesign.

These targets must be measured against a production build, not `next dev`.

## 11. SEO and discoverability

The existing dedicated framework, comparison, example, and blog pages are better
places for long-tail search content than the homepage.

Homepage SEO requirements:

- Use one clear H1 that matches the primary product positioning.
- Keep the opening description aligned with the page title and structured data.
- Link contextually to framework and comparison landing pages.
- Avoid duplicating entire documentation sections on the homepage.
- Keep visible claims aligned with JSON-LD and package metadata.
- Preserve crawlable descriptions for the compact API map.
- Use descriptive anchor text instead of many generic `Learn more` links.

## 12. Analytics and conversion measurement

Define the homepage's primary conversion before redesigning it.

Recommended primary conversion:

- Playground opened, or install command copied.

Recommended secondary conversions:

- Docs opened.
- Example opened.
- npm page opened.
- GitHub repository opened or starred.

Track at minimum:

- Hero CTA click-through rate.
- Install-command copy rate.
- Playground open rate.
- Scroll depth at 25%, 50%, 75%, and 100%.
- Exit section.
- Framework-tab selection.
- Example-card click-through rate.
- Conversion rate by desktop and mobile.

Do not add tracking that compromises user privacy. Document what is collected and
keep the implementation proportionate.

## 13. Implementation phases

### Phase 1: Content and structure

- Finalise the single positioning statement.
- Choose the primary conversion action.
- Reduce the page to the eight-section architecture.
- Move detailed content to existing Docs, Examples, and Changelog routes.
- Replace aggressive comparison copy.
- Centralise version, test, and bundle claims.

Deliverable: a low-fidelity content-first homepage with no visual polish changes.

### Phase 2: Hero and design hierarchy

- Bring the signature demonstration into the first viewport.
- Establish consistent primary and secondary CTAs.
- Reduce heading-size repetition.
- Introduce calmer proof and API-map sections.
- Redesign Product Hunt or community proof to match the site.

Deliverable: polished desktop and mobile visual hierarchy.

### Phase 3: Interaction and performance

- Keep only three homepage demos interactive.
- Lazy-load non-critical interactive code.
- Replace secondary demos with links or lightweight previews.
- Add reduced-motion behaviour.
- Audit hydration, layout shift, and asset loading.

Deliverable: production performance report and resolved high-impact issues.

### Phase 4: Accessibility and validation

- Complete keyboard and screen-reader testing.
- Add visible focus states and semantic tab behaviour.
- Test contrast, zoom, and reduced motion.
- Verify every claim and link.
- Test all target viewport sizes.

Deliverable: accessibility checklist and cross-browser sign-off.

### Phase 5: Measure and refine

- Record the baseline conversion and engagement metrics.
- Release the revised homepage.
- Compare CTA conversion, scroll depth, and mobile exits.
- Test one messaging or CTA change at a time.

Deliverable: post-launch findings and a prioritised follow-up list.

## 14. Acceptance criteria

The redesign is ready when all of the following are true:

### Product story

- A new visitor can describe the product after viewing only the first viewport.
- The SVG specialisation and broader scroll-animation APIs feel like one product.
- One primary CTA is visually dominant.
- The first viewport contains a real product result.

### Content

- The homepage has no complete options reference table.
- It contains no more than three full interactive demonstrations.
- Historical release notes are not presented as current homepage features.
- No unsupported superlative or absolute competitor claim remains.
- All package version, test-count, and bundle-size claims agree across the homepage,
  README, package metadata, and claim checks.

### Design

- The complete page fits within 8 to 12 desktop viewports and 12 to 18 mobile
  viewports at the agreed reference sizes.
- Each major section has a distinct role and visual rhythm.
- Body and code text meet the minimum readable sizes.
- The primary CTA style remains consistent.

### Accessibility

- Keyboard navigation works from header to footer.
- All focus states are visible.
- Reduced-motion mode stops non-essential continuous motion.
- Automated accessibility checks report no serious or critical issues.
- Manual checks cover tabs, sliders, copy actions, headings, zoom, and contrast.

### Performance

- Production Lighthouse scores meet the documented targets.
- Core Web Vitals targets are met in field data when sufficient traffic exists.
- Initial JavaScript is reduced by at least 40% from the measured baseline.
- Below-the-fold demos do not cause visible layout shift.

### Conversion

- Hero install and playground actions are measurable.
- CTA click-through rate and install-copy rate do not regress after launch.
- Mobile scroll abandonment improves from the recorded baseline.

## 15. Recommended first implementation slice

The safest first slice is structural and should avoid rebuilding every component at
once:

1. Save the current page or reuse its sections through `/examples` and `/docs`.
2. Build a new homepage using the existing hero, fountain-pen showcase, framework
   tabs, and three selected demos.
3. Replace the full options table with a link to Docs.
4. Replace the numbered demo sequence with a compact API map.
5. Replace the eleven v2 code cards with three capability groups.
6. Move live technical proof immediately below the hero.
7. Rewrite the problem and final CTA copy in a measured voice.
8. Add reduced-motion and focus-visible foundations before visual refinement.

This approach preserves the strongest existing work while removing the primary
source of visual fatigue: excessive repetition and page length.

## 16. Files likely to be involved

- `apps/demo/src/app/page.tsx` — homepage structure and most homepage copy.
- `apps/demo/src/app/globals.css` — motion, focus, typography, and shared styling.
- `apps/demo/src/components/ScrollShowcase.tsx` — signature demonstration.
- `apps/demo/src/components/InteractiveScrollDemo.tsx` — repeated SVG demo shell.
- `apps/demo/src/components/ScrollAnimateInteractive.tsx` — candidate flagship demo.
- `apps/demo/src/components/ScrollTextInteractive.tsx` — candidate flagship demo.
- `apps/demo/src/components/FrameworkTabs.tsx` — quickstart section.
- `apps/demo/src/components/LiveStats.tsx` — project proof and external data.
- `apps/demo/src/components/Mascot.tsx` — motion and reduced-motion handling.
- `apps/demo/src/app/docs/page.tsx` and related docs components — relocated detail.
- `apps/demo/src/app/examples/page.tsx` and example detail routes — relocated demos.
- `scripts/check-claims.mjs` — claim consistency enforcement.

## 17. Definition of industry standard

For this project, “industry standard” should not mean copying the visual style of
another developer tool. It means meeting a high bar in six areas:

1. **Clarity** — visitors immediately understand the product and audience.
2. **Proof** — claims are specific, reproducible, current, and easy to verify.
3. **Restraint** — the homepage shows the strongest evidence and links to detail.
4. **Usability** — mobile, keyboard, screen-reader, and reduced-motion experiences
   are treated as core product quality.
5. **Performance** — the page demonstrating a performance-oriented library is
   itself fast and stable.
6. **Conversion** — every section helps the visitor evaluate or adopt the package.

The existing visual identity can already support that standard. The work is mainly
to sharpen the story, remove repetition, elevate proof, and make the best parts
arrive much earlier.
