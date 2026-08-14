# Claims audit — say true things about ourselves, and fair things about everyone else

> Opened: 2026-08-14 · Nothing in this document has been actioned yet.
> Measurements were taken on 2026-08-14 against the versions named below.

---

## The principle

Two rules, and they are not the same rule:

1. **Do not misguide a user.** Someone choosing this library should be able to
   act on every number and capability claim without being surprised later. That
   includes claims that flatter us and claims that are merely out of date.
2. **Do not attack anyone unfairly.** A comparison page is allowed to say we are
   smaller. It is not allowed to say a competitor charges money when it does not,
   or is abandoned when it is not. Getting that wrong is worse than a stale
   number: it damages someone else's project, and it destroys our credibility the
   moment one of their users reads it.

A useful test for any competitive line: **would I be comfortable if the
maintainer of that project read it out loud?** If the honest version is less
punchy, take the less punchy version. We have real advantages — bundle size, the
native CSS path, zero dependencies, framework coverage — and none of them need
help from an inaccuracy.

Corollary: an inaccuracy in a competitor's *favour* is still an inaccuracy. It
misguides the user just as much, and it wastes a real differentiator.

---

## How each claim gets settled

Every finding below was produced by measuring, not remembering. Anyone can redo
it:

```bash
# Sizes — the same method scripts/size.mjs uses (gzip level 9)
npm pack <package>@<version> && tar -xzf <package>-<version>.tgz
node -e "const{gzipSync}=require('zlib'),{readFileSync}=require('fs');
  console.log((gzipSync(readFileSync('package/dist/<file>'),{level:9}).length/1024).toFixed(1),'KB')"

# Licence, contents, last publish
node -p "require('./package/package.json').license"
ls package/                      # is the plugin actually in the public tarball?
npm view <package> time.modified
```

**Rule going forward: no competitor claim ships without the command that
produced it.** If it cannot be measured, it does not go on a comparison page.

---

## What was measured (2026-08-14)

| Package | Version | Licence | Gzipped | Last publish |
|---|---|---|---|---|
| **svg-scroll-draw** (main entry) | 2.10.0 | MIT | **10.0 KB** | 2026-08-14 |
| gsap core | 3.15.0 | Standard "no charge" | 27.7 KB | current |
| gsap ScrollTrigger | 3.15.0 | same | 17.6 KB | current |
| gsap DrawSVGPlugin | 3.15.0 | same | 2.2 KB | current |
| gsap SplitText | 3.15.0 | same | 3.6 KB | current |
| aos (js + css) | 2.3.4 | MIT | 4.6 + 2.1 = **6.7 KB** | 2022-06-13 |
| scrollreveal | 4.0.9 | **GPL-3.0** | 5.6 KB | 2022-06-26 |
| framer-motion (single bundle) | 13.1.0 | MIT | 61.6 KB | current |
| framer-motion (cjs entry) | 13.1.0 | MIT | 34.3 KB | current |
| scroll-svg | 1.5.2 | MIT | 1.7 KB | — |

GSAP equivalent stack for what this library does — core + ScrollTrigger +
DrawSVG — is **47.5 KB**, so **4.75× larger**, measured. That is a strong,
defensible number that needs no embellishment.

---

## Findings

### A. False — fix first, these are live

**A1. "GSAP DrawSVG / SplitText require a paid Club GreenSock licence."**

Not true since GSAP 3.13 (Webflow made GSAP free in 2025). `DrawSVGPlugin.js`,
`SplitText.js`, `MorphSVGPlugin.js` and `ScrollSmoother.js` are all in the public
npm tarball, under a standard no-charge licence. There is no ~$150/yr to pay.

This is the most damaging item in the audit: it is a factual claim about someone
else's commercial terms, it is repeated in at least six places, and it is the
central pitch of `/vs-gsap`.

Locations:
- `README.md` — "Why this exists" table row
- `apps/demo/src/app/page.tsx` — the GSAP card, the bundle-chart footnote, the
  scrollText card ("Free GSAP SplitText replacement — no Club GreenSock
  subscription")
- `apps/demo/src/app/vs-gsap/page.tsx` — meta description, FAQ answer, two
  matrix rows, the licence comparison list ("SplitText: requires Club GreenSock
  (~$150/yr)"), and a standalone paragraph

Replacement: state the licence difference accurately and stop there. GSAP is free
under **its own licence**; this library is **MIT**. That difference is real and
worth one line — MIT is a permissive OSI licence with no restrictions on
redistribution, GSAP's is free-of-charge with its own terms. Do not characterise
GSAP's terms beyond linking to them; let the reader read them.

**A2. "ScrollReveal.js — MIT licence."**

`/vs-aos` claims MIT for ScrollReveal (`sr: true` on the MIT row). It is
**GPL-3.0**. This one is wrong in the competitor's favour and throws away a
genuine differentiator: GPL-3.0 is a real consideration for a closed-source
commercial product, and MIT vs GPL is exactly the kind of factual, non-hostile
comparison that belongs on that page.

**A3. Bundle sizes on the comparison pages are unmeasured.**

`/vs-aos` claims AOS ~14 KB (measured: **6.7 KB** including its CSS) and
ScrollReveal ~9–10 KB (measured: **5.6 KB**). `/vs-gsap` carried both ~40 KB and
~50 KB for GSAP in different places. `/vs-framer-motion` claims ~35 KB, which is
defensible for the CJS bundle but not for a tree-shaken modern import — Framer
Motion's ESM entry is a re-export shell and real usage varies enormously.

Note the direction of the error: **AOS and ScrollReveal are both smaller than us**
at 6.7 KB and 5.6 KB against our 10.0 KB. The current pages claim the opposite.
This has to be stated plainly — those two libraries do less, and a reader can weigh
"smaller" against "does more" themselves. Inventing a size advantage we do not
have is the worst kind of claim: it is checkable in thirty seconds.

**A4. "Active maintenance (2025): AOS ✓".**

AOS's last publish was **2022-06-13**; ScrollReveal's was **2022-06-26**. The page
marks AOS as actively maintained and ScrollReveal as not, with a note saying
"ScrollReveal.js last release: 2021" (also wrong). Either both are stale or the
row goes. Preferably: give the real last-publish date for each, no adjective.

### B. Overstated about ourselves — fix in the same pass

**B1. "Honours prefers-reduced-motion by default" as a blanket claim.**

True for `scrollDraw`, `scrollAnimate`, `scrollReveal`, `scrollCounter`,
`scrollText`, `scrollVideo`, `scrollSnap` and `Cinematic`. **Not** true for
`scrollHorizontal`, which defaults `respectReducedMotion` to `false` on purpose,
and only partly true for `scrollDrawTimeline`, where it covers the time-driven
loop and deliberately not the scrubbing. `scrollProgress` and `scrollPin` have no
reduced-motion path at all.

The reasoning behind each of those is sound and documented. The blanket claim is
still wrong, and it is wrong in the dimension where a user is most likely to be
relying on us — accessibility. Replace with the specific statement plus a link to
the reasoning.

**B2. "5.5× smaller than GSAP".**

Measured: **4.75×** against core + ScrollTrigger + DrawSVG. Use the measured
figure. It is still a big number.

**B3. Feature-matrix rows asserting a competitor lacks something.**

Every `false` in a comparison matrix is a claim requiring evidence, and several
were written from impression: AOS "no custom easing", ScrollReveal "no TypeScript
types", "no reduced-motion". Each needs checking against the current release, or
the row should be dropped. A wrong ✗ is the same class of error as A1, just
smaller.

### C. Structural — stop it recurring

**C1. Competitor numbers have no guard.** `check-claims` now derives our own test
counts and bundle size and fails the build on drift — competitor figures are still
hand-typed prose with no source and no expiry.

Proposal: a single `COMPETITORS.md` (or a small JSON) holding, per package: the
version measured, the figure, the command that produced it, and the date. Every
comparison page reads from that one file rather than repeating numbers inline.
Then add a check that fails if any entry is older than, say, six months — a stale
comparison is a slow-motion false claim, and this audit is what that looks like
when nobody notices for a year.

**C2. Nothing distinguishes "measured" from "asserted".** A reader cannot tell
which numbers on a comparison page came from a build and which came from memory.
Marking measured figures with the version they were measured against would make
the pages self-evidently honest and would have prevented every item in section A.

---

## Order of work

1. **A1** — the GSAP licensing claim. Live, about someone else's commercial
   terms, and repeated across the README, home page and a whole landing page.
2. **A3 + A2** — the size and licence facts on the comparison pages, including
   stating plainly that AOS and ScrollReveal are smaller than us.
3. **B1** — the reduced-motion claim, because accessibility claims get relied on.
4. **A4, B2, B3** — the remaining matrix rows, each checked or dropped.
5. **C1/C2** — the guard, so the next audit is a script rather than an afternoon.

Items 1–3 are corrections and should not wait. Item 4 is a review pass. Item 5 is
the only one that needs design thought.

---

## What not to do

- **Do not overcorrect into vagueness.** "Smaller than some alternatives" helps
  nobody. Measured numbers with the version attached are both honest and more
  persuasive than adjectives.
- **Do not delete the comparison pages.** They answer a real question people
  search for. The problem is accuracy, not the existence of comparison.
- **Do not soften the genuine advantages.** 10.0 KB against GSAP's 47.5 KB, a
  verified native CSS fast path, zero dependencies, eight framework wrappers and
  175 browser tests per engine are all real and all checkable. The case does not
  need the false parts.
- **Do not describe a competitor's project in terms its maintainer would dispute
  as unfair.** "Last published 2022" is a fact. "Abandoned" is a characterisation
  — and for a stable, finished library it may simply be wrong.
