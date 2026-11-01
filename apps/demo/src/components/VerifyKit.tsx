import type { ReactNode } from 'react';

/*
 * The pieces every /verify proof shares, in the site's drawing-sheet language.
 * Styled by components/verify.css under `.site .vf`. No hooks, so both the
 * server page and the client proofs can use them.
 */

/**
 * `ok: null` means "not measured yet" and renders as WAIT, not BUG.
 *
 * This distinction matters more than it looks. An earlier version of this page
 * had two proofs whose verdict was simply "have I observed the good thing yet",
 * so scrolling straight past them rendered a red BUG badge for working code —
 * and elsewhere, a guard that recorded nothing rendered identically to a genuine
 * pass. On a page whose whole purpose is honest verification, conflating
 * "unmeasured" with a result is the worst available failure mode.
 */
export function Verdict({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  const state = ok === null ? 'wait' : ok ? 'pass' : 'bug';
  return (
    <div className="vf-verdict" data-state={state}>
      <span className="vf-verdict-k">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          {state === 'pass' && <path d="M3 8.5 L6.5 12 L13 4.5" />}
          {state === 'bug' && <path d="M4 4 L12 12 M12 4 L4 12" />}
          {state === 'wait' && (
            <>
              <circle cx="8" cy="8" r="5.6" />
              <path d="M8 5 V8 L10.2 9.4" />
            </>
          )}
        </svg>
        {state === 'wait' ? 'WAIT' : state === 'pass' ? 'PASS' : 'BUG'}
      </span>
      <div className="vf-verdict-t">{children}</div>
    </div>
  );
}

/** A labelled readout in a hairline cell. `bad` inks it red; `good` marks it measured-and-right. */
export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' | 'good' }) {
  return (
    <div className="vf-stat" data-tone={tone}>
      <span className="vf-stat-k">{label}</span>
      <span className="vf-stat-v">{value}</span>
    </div>
  );
}

/** A row of Stat cells. */
export function Stats({ children, cols }: { children: ReactNode; cols?: number }) {
  return (
    <div className="vf-stats" data-cols={cols ?? 4}>
      {children}
    </div>
  );
}

/** A hairline meter, filled to `value` (0–1). */
export function Meter({ value, tone }: { value: number; tone?: 'accent' | 'ink' }) {
  return (
    <div className="vf-meter" data-tone={tone ?? 'accent'}>
      <i style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }} />
    </div>
  );
}

/** "before" / "after" — what the reader is looking at, never a colour on its own. */
export function Tag({ tone, children }: { tone: 'old' | 'new'; children: ReactNode }) {
  return <span className="vf-tag" data-tone={tone}>{children}</span>;
}

/** A mono caption over a specimen, marked old (red) or new (ink). */
export function PanelLabel({ label, tone }: { label: string; tone: 'old' | 'new' }) {
  return <p className="vf-panel-k" data-tone={tone}>{label}</p>;
}

/**
 * A revision delta: the triangle a drawing sheet puts beside whatever a
 * revision changed, with the revision's number inside. Here, one per phase.
 */
export function Delta({ rev, ink = false }: { rev: string; ink?: boolean }) {
  return (
    <svg className="vf-delta" viewBox="0 0 28 24" aria-label={`revision ${rev}`}>
      <path d="M14 2.2 L26 21.8 H2 Z" className={ink ? 'vf-delta-ink vf-rec-ink' : 'vf-delta-ink'} stroke="currentColor" />
      <text x="14" y="18.4" textAnchor="middle" className="vf-delta-n">{rev}</text>
    </svg>
  );
}
