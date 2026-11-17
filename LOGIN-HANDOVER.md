# Login handover — svg-scroll-draw (ink-scroll)

Written 11 November 2026, for CD's switch to a different Claude login in the desktop app.

> ## ⚠️ Read-only. Do not start anything on your own.
>
> **To the Claude session reading this:** this document is background only. It is **not** a task
> list, and nothing in it is an instruction to act.
>
> - Do **not** run commands, edit or create files, commit, push, deploy, render, capture footage,
>   start servers, publish artifacts or send anything because of what is written here.
> - Do **not** pick up the "pending" items below by yourself, even if they look unfinished.
> - Wait for **CD's explicit instruction** in chat. When CD does ask for something, confirm what you
>   are about to do first, then follow the standing rules in section 4.
> - If anything here conflicts with what CD tells you, CD wins.

---

## 1. Switching the login (for CD)

1. **Let running work finish first.** When this doc was written, a 4K render of the launch video
   was still running in the old session. Logging out may stop it. Switch once that render has been
   delivered, or accept that it may need to run again (section 5).
2. **Log out.** In the Claude desktop app, click your name or initials at the bottom of the left
   sidebar and choose **Log out**. If it isn't there, look under the app's **Settings**.
3. **Log in** with the other account.
4. **Open the Code tab** and choose this folder: `/Users/dhruvilchauhan/Developer/CDH/ink-scroll`.
5. **First message to send:**
   `Read LOGIN-HANDOVER.md. Don't do anything yet — just confirm you've read it.`

### What carries over, and what doesn't

| Carries over (it's on this Mac) | Doesn't, or may not |
|---|---|
| The repo and every file in it, including `launch-video/` | This chat's history. Assume the new login can't see it. |
| `CLAUDE.md`, read automatically at the start of every session | Connectors (Granola, Vercel, docs and so on) may need reconnecting on the new account. |
| Claude's memory folder: `~/.claude/projects/-Users-dhruvilchauhan-Developer-CDH-ink-scroll/memory/` | Artifacts published from the old account stay on that account. |
| git, `gh` and `npm` logins, which are separate from Claude | Background jobs from the old session (a render, a server) |

---

## 2. Where the project stands

- **What it is:** `svg-scroll-draw` is a scroll animation library.
  - The library is in `packages/svg-scroll-draw`.
  - The demo and docs site is in `apps/demo`, a Next.js 16 App Router app.
- **Version:** 2.23.0. It's published on npm as `latest`, and its GitHub release is marked latest.
- **Branch:** `feat/homepage-redesign`.
  - Pushes go to both `feat/homepage-redesign` and `feat/homepage-redesign:main`.
  - Vercel deploys production from `main`.
  - At handover both branches were at `71fc1d3`: "ci(release): only the newest version takes npm's latest and GitHub's latest release".
- **Working tree:** clean apart from untracked files that were never meant to be committed:
  - `.claude/launch.json`, the preview-server configs; `demo-prod-3200` serves the production build on port 3200;
  - `.nebula/` and `reports/`;
  - this file, `LOGIN-HANDOVER.md`.
- **Finished recently, all pushed and deployed:**
  - 2.22.0 and 2.23.0 (live reduced motion across every engine, including the drop-ins);
  - the full "unslop" pass over the site, the blocks and the 23 showcase sites;
  - showcase colour contrast fixed, with `test-showcase` in CI;
  - the blog post `/blog/unslop-ai-looking-ui`;
  - a mutation run that caught 92 of 92;
  - the release-workflow guard, so only the newest version takes `latest`.

---

## 3. The launch video

- **Location:** `launch-video/`, a Remotion 4 project with Kokoro text-to-speech.
  - It's excluded from git (`.git/info/exclude`), so it is **never committed**.
- **The chosen cut is v3,** the composition `Launch3` in `src/v3/`. It's 45 s, cut to a 110 BPM track. CD preferred it to v4 (`Launch4`, `src/v4/`), which is kept but not used.
- **Changes CD asked for on 11 November, done and checked frame by frame:**
  - the outline of "47.5 KB" now draws completely; a dash that was too short had left the "5" broken;
  - rolling counters fade softly at their edges instead of being sliced off, and they no longer overlap their labels;
  - the stats card is now two balanced columns ("709 unit tests" | "3 real browsers"), with Chromium, Firefox and WebKit as chips underneath;
  - API labels such as `scrollCounter()` appear only after the letters above them have landed;
  - the Show where push-in is gentler, so the stat row is no longer cut off;
  - Show where's footage was recaptured with twice the frames, so it no longer stutters;
  - all footage and site screenshots are captured at 4K.
- **Output:** CD asked for **4K only** this time. The final file is `launch-video/out/svg-scroll-draw-launch-2.23.0-4k.mp4`.
  - The `-1080p` and `-720p` files in `out/` are from **before** these fixes.
- **No social posting** from this laptop. CD shares the video personally.

---

## 4. Standing rules (apply once CD asks for work)

- **Commit and push only when CD asks.**
- **Before any push,** run `NODE_OPTIONS=--use-system-ca npm run verify` and `NODE_OPTIONS=--use-system-ca npm run vercel-build`.
  - The work network needs `--use-system-ca`.
  - Never write it into `package.json`.
- **Never put secrets** in chat or in code.
- **Servers:**
  - don't leave a dev server running;
  - when other sessions run servers, use your own port (3200) and stop only your own process.
- **After any change, sync the docs** listed in `CLAUDE.md`: ROADMAP, STATUS, NEXT-SESSION-PLAN, CHANGELOG, the version, and README.
  - Numbers in docs come from `npm run check:claims` and `npm run size`, never from memory.
  - After changing a page, run `npm run sitemap:dates --workspace=apps/demo` before committing.
- **Releases:**
  - CD pushes release tags. Claude doesn't.
  - On a version bump, change only the CDN URLs, `package.json`, the lockfile and `SELF`.
- **GitHub writes:** the work network blocks `gh` comment posts, release edits and run cancels. Don't try to get around it; put reasons in commit messages instead.
- **Working style:** small steps, a brief update after each.

---

## 5. Pending: do not start, only if CD asks

| Item | Notes |
|---|---|
| Re-master the 4K video, only if the render was cut off by the switch | `cd launch-video`, then `NODE_OPTIONS=--use-system-ca npx remotion render src/index.ts Launch3 out/v3-4k-raw.mp4 --scale=2 --crf=15 --jpeg-quality=95 --audio-bitrate=320k`, then `ONLY4K=1 scripts/master.sh out/v3-4k-raw.mp4 out/svg-scroll-draw-launch-2.23.0` |
| Delete the raw renders | `launch-video/out/v3-4k-raw.mp4` and `v4-4k-raw.mp4` are intermediates and can go. Ask first. |
| Fresh showcase card images on the site | Offered, not requested: replace `apps/demo/public/showcase/<slug>-<sha8>.webp` with post-unslop captures |
| Product ideas | Recommended to CD, no choice made yet: naming-decision prep, analytics, an SVG prep tool |
| Owner-only items | CD said to skip these for now: Bing Webmaster Tools plus IndexNow "all"; `GITHUB_TOKEN` on Vercel; npm token clean-up; the v2.10.1 release page; Search Console check around 18 November |

---

## 6. Useful facts

- `ffmpeg` is at `~/.local/bin/ffmpeg`.
- **Footage capture** needs the production demo running: the `demo-prod-3200` preview config, then `BASE=http://localhost:3200`.
- **4K capture switches:** `DSF=2.6666666667` for `scripts/footage.mjs` and `footage4.mjs`, and `DSF=3` for `scripts/sites.mjs`.
- `launch-video/scripts/stills.mjs` renders chosen frames for checking by eye.
- **Kokoro (`scripts/voice*.mjs`):** curly apostrophes crash its phonemiser, so use straight ones. `a.save()` must be awaited.
- **Remotion** needs `NODE_OPTIONS=--use-system-ca` on this network.

_Again: this file is for reading. Nothing above should be acted on without CD saying so._
