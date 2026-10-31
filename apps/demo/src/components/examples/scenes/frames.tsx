import type { ReactNode } from 'react';

/**
 * The chrome real products are seen in: a browser window with a fictional
 * URL, or a phone. The scene inside carries its own brand; the frame is
 * neutral so every example reads as a screenshot of someone's product.
 */
export function Browser({ url, tone = 'light', children }: { url: string; tone?: 'light' | 'dark'; children: ReactNode }) {
  return (
    <div className={`scf-browser scf-${tone}`}>
      <div className="scf-bar" aria-hidden="true">
        <span className="scf-dots"><i /><i /><i /></span>
        <span className="scf-url">
          <svg viewBox="0 0 12 12" width="9" height="9"><path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5M2.5 5.5h7v5h-7z" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          {url}
        </span>
        <span className="scf-pad" />
      </div>
      <div className="scf-view">{children}</div>
    </div>
  );
}

export function Phone({ tone = 'light', children }: { tone?: 'light' | 'dark'; children: ReactNode }) {
  return (
    <div className={`scf-phone scf-${tone}`}>
      <div className="scf-screen">
        <div className="scf-status" aria-hidden="true">
          <span>9:41</span>
          <span className="scf-island" />
          <span className="scf-sig">
            <svg viewBox="0 0 34 12" width="30" height="10"><path d="M1 9h2v2H1zM5 7h2v4H5zM9 5h2v6H9zM13 3h2v8h-2z" fill="currentColor" /><rect x="19.5" y="2.5" width="12" height="7" rx="2" fill="none" stroke="currentColor" /><rect x="21" y="4" width="8" height="4" rx="1" fill="currentColor" /></svg>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
