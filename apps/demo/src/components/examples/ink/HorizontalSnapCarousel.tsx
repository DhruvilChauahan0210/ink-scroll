'use client';

import './ui-b.css';
import { useEffect, useRef, useState } from 'react';

/**
 * A pricing carousel, the way it is swiped on a phone: one plan at a time,
 * the next one peeking in. The preview snaps with native CSS scroll-snap
 * (smooth, nothing fighting the browser); the scrollSnap call in the code
 * tab is the JS version, for snapping with your own easing and an onSnap
 * callback. The index strip and the arrows scroll the same container.
 */

const PLANS = [
  { name: 'Hobby', price: '$0', per: '/ month', note: 'For side projects and a portfolio.', items: ['1 site', 'Community forum', '7-day analytics'] },
  { name: 'Pro', price: '$12', per: '/ month', note: 'For one person shipping for real.', items: ['10 sites', 'Email support', '1-year analytics'], tag: 'Most picked' },
  { name: 'Team', price: '$29', per: '/ seat', note: 'Shared billing, roles and review.', items: ['Unlimited sites', 'SSO and audit log', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', per: '', note: 'Contracts, invoicing and an SLA.', items: ['Dedicated region', 'Uptime SLA', 'A named engineer'] },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function HorizontalSnapCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Read the snapped card from native CSS scroll position — no JS snap
  // fighting the CSS snap.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      if (!cards.length) return;
      // At the far end the last card cannot reach the left edge.
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
        setActiveIdx(cards.length - 1);
        return;
      }
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft - el.scrollLeft) < Math.abs(cards[best].offsetLeft - el.scrollLeft)) best = i;
      });
      setActiveIdx(best);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const go = (i: number) => {
    const el = containerRef.current;
    const card = el?.children[Math.max(0, Math.min(PLANS.length - 1, i))] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  };

  return (
    <div className="xb-sn">
      <div className="xb-sn-head">
        <div>
          <span className="xb-label">Plans</span>
          <p className="xb-sn-title">Swipe to compare.</p>
        </div>
        <p className="xb-sn-count" aria-live="polite">
          <b>{pad(activeIdx + 1)}</b> / {pad(PLANS.length)}
        </p>
      </div>

      <div ref={containerRef} className="xb-sn-track" tabIndex={0} aria-label="Plans, scroll sideways">
        {PLANS.map((p, i) => (
          <article key={p.name} className={`xb-sn-card${i === activeIdx ? ' is-on' : ''}`} aria-label={`${p.name} plan`}>
            <div className="xb-sn-top">
              <span className="xb-sn-n">{pad(i + 1)}</span>
              <span className="xb-sn-name">{p.name}</span>
              {p.tag && <span className="xb-sn-tag">{p.tag}</span>}
            </div>
            <p className="xb-sn-price">
              {p.price}
              {p.per && <small>{p.per}</small>}
            </p>
            <p className="xb-sn-note">{p.note}</p>
            <ul className="xb-sn-list">
              {p.items.map((it) => (
                <li key={it}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" /></svg>
                  {it}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="xb-sn-foot">
        <div className="xb-sn-idx" role="group" aria-label="Go to plan">
          {PLANS.map((p, i) => (
            <button key={p.name} type="button" className="xb-sn-dot" aria-current={i === activeIdx ? 'true' : undefined}
              aria-label={`${p.name} plan`} onClick={() => go(i)}>
              {pad(i + 1)}
            </button>
          ))}
        </div>
        <div className="xb-sn-arrows">
          <button type="button" className="xb-sn-arrow" aria-label="Previous plan" disabled={activeIdx === 0} onClick={() => go(activeIdx - 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 L5.5 8 L10 12.5" /></svg>
          </button>
          <button type="button" className="xb-sn-arrow" aria-label="Next plan" disabled={activeIdx === PLANS.length - 1} onClick={() => go(activeIdx + 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 L10.5 8 L6 12.5" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
