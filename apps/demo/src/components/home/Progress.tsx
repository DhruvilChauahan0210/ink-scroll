'use client';

import { useEffect, useRef } from 'react';
import { scrollAnimate } from 'svg-scroll-draw';

/** A hairline of ink under the nav that grows with the page. */
export function Progress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const home = document.querySelector<HTMLElement>('.home');
    if (!el || !home) return;
    const instance = scrollAnimate(el, {
      props: { transform: ['scaleX(0)', 'scaleX(1)'] },
      trigger: { start: 'top top', end: 'bottom bottom' },
      triggerElement: home,
      easing: 'linear',
    });
    return () => instance.destroy();
  }, []);

  return <div ref={ref} className="progress" aria-hidden="true" />;
}
