import './stagger.css';

/**
 * The text-on-scroll post's opening drawing: what the reveal CSS in the post
 * does once the heading scrolls in. Each word waits --i × STEP_MS, then takes
 * DURATION_MS to arrive (transition-delay: calc(var(--i) * 60ms) and a 0.5s
 * transition in the post's reveal.css). The screen reader is given one plain
 * copy of the sentence, which never moves.
 */

const SENTENCE = 'Words arrive one at a time';
const STEP_MS = 60;
const DURATION_MS = 500;
const AXIS_MS = 800;

const x = (ms: number) => ((ms / AXIS_MS) * 1000).toFixed(1);

export function StaggerFigure() {
  const words = SENTENCE.split(' ');
  return (
    <div className="sf">
      <div className="sf-row sf-axis" aria-hidden="true">
        <span className="sf-l">Time</span>
        <span className="sf-track sf-ticks">
          {[0, 200, 400, 600, 800].map((t) => <span key={t}>{t} ms</span>)}
        </span>
      </div>
      {words.map((w, i) => (
        <div key={w} className="sf-row">
          <span className="sf-l">
            <b>{w}</b> <span className="sf-i">--i: {i}</span>
          </span>
          <span className="sf-track">
            <svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H1000" className="sf-base" />
              {i > 0 ? <path d={`M0 6 H${x(i * STEP_MS)}`} className="sf-wait" /> : null}
              <path d={`M${x(i * STEP_MS)} 6 H${x(i * STEP_MS + DURATION_MS)}`} className="sf-bar" />
            </svg>
          </span>
        </div>
      ))}
      <div className="sf-row is-sr">
        <span className="sf-l">Screen reader</span>
        <span className="sf-track">
          <span className="sf-copy">“{SENTENCE}”, one copy, never hidden</span>
        </span>
      </div>
      <p className="sf-key" aria-hidden="true">
        <span><i className="is-wait" />transition-delay</span>
        <span><i className="is-bar" />opacity and translate, {DURATION_MS} ms</span>
      </p>
    </div>
  );
}
