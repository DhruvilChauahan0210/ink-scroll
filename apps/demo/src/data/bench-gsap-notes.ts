/**
 * What happened on the machine during a run, written by hand from the run's log
 * after it ends. The harness rewrites bench-gsap.json on every run, so notes
 * live here and name the run they describe: the page shows them only when
 * `run` matches the date in bench-gsap.json, so a new run never inherits the
 * last run's notes.
 */
export const RUN_NOTES: { run: string; notes: string[] } = {
  // The run from 2026-11-15 20:02 to 2026-11-16 05:44 IST (log: reports/bench-run-2026-11-16.log).
  run: '2026-11-16',
  notes: [
    'This run: one laptop on mains power from start to end (the log reads the power source at both), its lid open and kept awake.',
    'For about an hour and a half during the Chromium rounds, light work ran alongside: type checks, one short test of a Svelte app and a few page loads. Every round runs all cells in a shuffled order, so it fell on both libraries alike, but it widens the Chromium intervals.',
  ],
};
