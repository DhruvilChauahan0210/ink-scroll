/**
 * What happened on the machine during a run, written by hand from the run's log
 * after it ends. The harness rewrites bench-gsap.json on every run, so notes
 * live here and name the run they describe: the page shows them only when
 * `run` matches the date in bench-gsap.json, so a new run never inherits the
 * last run's notes.
 */
export const RUN_NOTES: { run: string; notes: string[] } = {
  run: '',
  notes: [],
};

// Draft for the run that started 2026-11-15 20:02 IST (fill in `run` with its
// date from bench-gsap.json and check each line against /tmp/bench-run.log):
// - Started on battery (68%); on mains power from about 22:00 to the end.
// - Light work ran alongside for a few minutes in Chromium's first browser:
//   type checks, one short Svelte app test and a few page loads, between 22:15
//   and 23:30. Every round runs all cells in a shuffled order, so this lands
//   on both libraries alike, but it widens the Chromium intervals.
