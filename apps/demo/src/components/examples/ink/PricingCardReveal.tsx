'use client';

import './ui-a.css';
import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SELF } from '@/data/competitors';
import { UNIT_TESTS } from '@/data/facts';

const TICK = 'M4.5 12.5 L9.5 17.5 L19.5 6.5';

const FEATURES = [
  { text: 'Every API, gzipped', figure: `${SELF.gzipKb} KB` },
  { text: 'Runtime dependencies', figure: '0' },
  { text: 'Unit tests', figure: String(UNIT_TESTS) },
  { text: 'Browser engines tested', figure: '3' },
];

/**
 * scrollAnimate, staggered: the badge, the plan, the price, the list and the
 * button each get their own call, every trigger a few percent lower than the
 * one above it, so the card builds from the top down. The ticks ink in as the
 * list arrives.
 */
export function PricingCardReveal() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tr = { start: 'top 85%', end: 'top 45%' };
    const instances = [
      badgeRef.current && scrollAnimate(badgeRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] },
        trigger: tr, easing: 'ease-out', once: true,
      }),
      planRef.current && scrollAnimate(planRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        trigger: { start: 'top 83%', end: 'top 43%' }, easing: 'ease-out', once: true,
      }),
      priceRef.current && scrollAnimate(priceRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
        trigger: { start: 'top 80%', end: 'top 40%' }, easing: 'ease-out', once: true,
      }),
      featuresRef.current && scrollAnimate(featuresRef.current, {
        props: { opacity: [0, 1] },
        trigger: { start: 'top 77%', end: 'top 37%' }, easing: 'ease-out', once: true,
      }),
      ctaRef.current && scrollAnimate(ctaRef.current, {
        props: { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
        trigger: { start: 'top 74%', end: 'top 34%' }, easing: 'ease-out', once: true,
      }),
    ].filter(Boolean);
    return () => instances.forEach((i) => i && i.destroy());
  }, []);

  return (
    <article className="xa-price" aria-label="Open source plan">
      <div className="xa-price-top">
        <div ref={badgeRef} className="xa-badge">
          <i aria-hidden="true" />
          MIT licence
        </div>
        <div ref={planRef}>
          <h3 className="xa-plan-t">Open source</h3>
          <p className="xa-plan-d">Commercial use included. No seats, no keys, no account.</p>
        </div>
        <div ref={priceRef} className="xa-amount">
          <span className="xa-amount-n">$0</span>
          <span className="xa-amount-u">/ forever</span>
        </div>
      </div>

      <ScrollDraw className="xa-feats-wrap" selector=".xa-ink" trigger={{ start: 'top 77%', end: 'top 37%' }} stagger={0.12} easing="ease-out" once>
        <ul ref={featuresRef} className="xa-feats">
          {FEATURES.map((f) => (
            <li key={f.text} className="xa-feat">
              <svg className="xa-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d={TICK} className="xa-ink" stroke="currentColor" />
              </svg>
              <span>{f.text}</span>
              <b>{f.figure}</b>
            </li>
          ))}
        </ul>
      </ScrollDraw>

      <div ref={ctaRef} className="xa-cta-wrap">
        <button type="button" className="xa-cta">
          Get started
          <span className="xa-cta-go" aria-hidden="true">
            <svg className="xa-ico" viewBox="0 0 24 24">
              <path d="M4.5 12 H19 M13 6 L19 12 L13 18" className="xa-ink" stroke="currentColor" />
            </svg>
          </span>
        </button>
        <p className="xa-cta-note">npm i svg-scroll-draw · v{SELF.version}</p>
      </div>
    </article>
  );
}
