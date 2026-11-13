import './scroll-path.css';

/**
 * The Locomotive Scroll alternatives post's opening drawing: where Lenis sits.
 * Lenis eases wheel input only (smoothWheel on, syncTouch off by default) and
 * writes each eased step to the page's real scroll position with scrollTo, so
 * keys, touch and the scrollbar stay the browser's, and every reader below
 * sees one number. The harness checks window.scrollY equals lenis.scroll on
 * every sampled frame of a wheel scroll in Chromium, Firefox and WebKit.
 */

const INPUTS: { input: string; route: string; eased?: boolean }[] = [
  { input: 'Wheel', route: 'Lenis eases it, lerp 0.1', eased: true },
  { input: 'Keys', route: 'the browser, as without Lenis' },
  { input: 'Touch', route: 'the browser (syncTouch: false)' },
  { input: 'Scrollbar', route: 'the browser' },
];

const READERS = ['CSS view() and scroll()', 'IntersectionObserver', 'svg-scroll-draw'];

export function ScrollPathFigure() {
  return (
    <div className="lsf">
      <div className="lsf-row lsf-head" aria-hidden="true">
        <span className="lsf-l">Input</span>
        <span className="lsf-l">How it moves the page</span>
      </div>
      <ul className="lsf-inputs">
        {INPUTS.map((r) => (
          <li key={r.input} className={`lsf-row${r.eased ? ' is-eased' : ''}`}>
            <b className="lsf-in">{r.input}</b>
            <span className="lsf-route">
              <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 6 H100" className={r.eased ? 'lsf-ease' : 'lsf-native'} />
              </svg>
              <span className="lsf-note">{r.route}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="lsf-down" aria-hidden="true">↓ every input lands in</p>
      <p className="lsf-pos">
        <code>window.scrollY</code>
        <span>one real scroll position</span>
      </p>
      <p className="lsf-down" aria-hidden="true">↓ read as it is, no adapter</p>
      <ul className="lsf-readers">
        {READERS.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <p className="lsf-key" aria-hidden="true">
        <span><i className="is-eased" />eased by Lenis</span>
        <span><i className="is-native" />native scrolling</span>
      </p>
    </div>
  );
}
