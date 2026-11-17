# GSAP benchmark — full run, 2026-11-16

- Started 2026-11-15 20:02 IST, finished 2026-11-16 05:44 IST (581.7 min), exit 0. Log: `reports/bench-run-2026-11-16.log`.
- svg-scroll-draw 2.27.3 vs GSAP 3.15.0, Chromium, Firefox and WebKit. 160 cells, 1280 comparisons.
- `check-bench`: passes (every scenario in every browser, parity passed, not provisional).
- Comparisons by verdict (all pairs, including the no-library baseline): ours 233, gsap 159, ours-js 79, no measurable difference 809.
- Results committed on `feat/gsap-bench` in `../ink-scroll-bench`. **Not reviewed yet**: read the medians and intervals per scenario before publishing, and fill in `src/data/bench-gsap-notes.ts` (`run` = 2026-11-16).
