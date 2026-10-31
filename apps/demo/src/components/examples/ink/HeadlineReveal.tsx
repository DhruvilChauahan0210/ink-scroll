'use client';

import './ui-a.css';
import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';
import { scrollText } from 'svg-scroll-draw/text';
import { SELF } from '@/data/competitors';

/**
 * scrollText, words then chars: the kicker rises in, each headline line
 * rises word by word on its own trigger window, and the spec line under the
 * rule trickles in a character at a time.
 */
export function HeadlineReveal() {
  const eyebrow = useRef<HTMLDivElement>(null);
  const line1 = useRef<HTMLHeadingElement>(null);
  const line2 = useRef<HTMLHeadingElement>(null);
  const desc = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const insts = [
      eyebrow.current && scrollAnimate(eyebrow.current, {
        props: { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        trigger: { start: 'top 90%', end: 'top 65%' }, easing: 'ease-out', once: true,
      }),
      line1.current && scrollText(line1.current, {
        split: 'words', stagger: 0.08,
        from: { opacity: 0, y: 40 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 87%', end: 'top 54%' },
      }),
      line2.current && scrollText(line2.current, {
        split: 'words', stagger: 0.08,
        from: { opacity: 0, y: 40 },
        easing: 'ease-out', once: true,
        trigger: { start: 'top 82%', end: 'top 49%' },
      }),
      desc.current && scrollText(desc.current, {
        split: 'chars', stagger: 0.012,
        from: { opacity: 0 },
        easing: 'linear', once: true,
        trigger: { start: 'top 78%', end: 'top 44%' },
      }),
    ].filter(Boolean);
    return () => insts.forEach((i) => i && i.destroy());
  }, []);

  return (
    <div className="xa-hl">
      <div ref={eyebrow} className="xa-hl-kicker">
        <span><b>svg-scroll-draw</b> {SELF.version}</span>
      </div>
      <h2 ref={line1} className="xa-hl-line">Build scroll animations.</h2>
      <h2 ref={line2} className="xa-hl-line is-a">Without GSAP.</h2>
      <p ref={desc} className="xa-hl-desc">0 deps · MIT · {SELF.gzipKb} KB gzipped</p>
    </div>
  );
}
