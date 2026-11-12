'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AOS_EASINGS, AOS_FAMILIES } from '@/data/aos-effects';
import { ToolExport } from '@/components/tool-kit/ToolExport';
import { aosHtml, specimenMarkup } from './aos-code';

/**
 * Every AOS effect, running on the AOS drop-in (`svg-scroll-draw/aos`), the
 * same markup a page using AOS has: `data-aos`, `data-aos-duration`,
 * `data-aos-easing`. Each specimen animates as it scrolls into view and back
 * out (AOS's default, `once: false`), and its replay button runs it again on
 * the spot. The duration and easing controls set the attributes on every
 * specimen; `AOS.refreshHard()` then reads them, as it would on any page.
 *
 * What leaves the page comes from aos-code.ts and carries the same timing: a
 * specimen's Copy writes its markup, and the Run it row downloads (or opens in
 * StackBlitz) a page of every effect, with the drop-in from jsDelivr at
 * `version` (SELF.version, passed down by the page).
 */

type AOSModule = typeof import('svg-scroll-draw/aos').default;

const DURATIONS = [400, 600, 800, 1200, 2000];

export function AosGallery({ version }: { version: string }) {
  const aos = useRef<AOSModule | null>(null);
  const [duration, setDuration] = useState(800);
  const [easing, setEasing] = useState('ease-out-cubic');
  const html = useMemo(() => aosHtml({ duration, easing }, version), [duration, easing, version]);

  useEffect(() => {
    let live = true;
    import('svg-scroll-draw/aos').then(({ default: AOS }) => {
      if (!live) return;
      aos.current = AOS;
      AOS.init();
    });
    return () => {
      live = false;
      aos.current?.destroy();
      aos.current = null;
    };
  }, []);

  // New timing attributes are rendered first; refreshHard() reads them.
  useEffect(() => {
    aos.current?.refreshHard();
  }, [duration, easing]);

  return (
    <div className="aosg">
      <div className="aosg-bar">
        <div className="aosg-controls" role="group" aria-label="Timing for every specimen">
          <Control label="data-aos-duration">
            <select value={duration} aria-label="Duration" onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Control>
          <Control label="data-aos-easing">
            <select value={easing} aria-label="Easing" onChange={(e) => setEasing(e.target.value)}>
              {AOS_EASINGS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Control>
          <p className="aosg-hint">Scroll a specimen out of view and back to see it again, or press ↻.</p>
        </div>
        <ToolExport title="AOS animation" filename="aos-animation.html" html={html} />
      </div>

      {AOS_FAMILIES.map((f) => (
        <section key={f.key} className="aosg-family" aria-labelledby={`aos-${f.key}`}>
          <header className="aosg-family-head">
            <h3 id={`aos-${f.key}`} className="aosg-family-t">{f.title} <span>· {f.effects.length}</span></h3>
            <p className="aosg-family-note">{f.note}</p>
          </header>
          <ul className="aosg-grid">
            {f.effects.map((name) => (
              <Specimen key={name} name={name} duration={duration} easing={easing} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="aosg-control">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Specimen({ name, duration, easing }: { name: string; duration: number; easing: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const markup = specimenMarkup(name, { duration, easing });

  /** Jump to the start state with no transition, then animate in again. */
  function replay() {
    const node = el.current;
    if (!node || !node.classList.contains('aos-animate')) return;
    node.setAttribute('data-aos-instant', '');
    node.classList.remove('aos-animate');
    void node.offsetWidth;
    node.removeAttribute('data-aos-instant');
    requestAnimationFrame(() => node.classList.add('aos-animate'));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markup);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable: the markup is on the card to select by hand.
    }
  }

  return (
    <li className="aosg-card">
      <div className="aosg-stage">
        <div ref={el} className="aosg-spec" data-aos={name} data-aos-duration={duration} data-aos-easing={easing}>
          <span className="aosg-spec-bar" />
          <span className="aosg-spec-line" />
          <span className="aosg-spec-line aosg-spec-short" />
        </div>
      </div>
      <div className="aosg-foot">
        <code className="aosg-name">{name}</code>
        <div className="aosg-actions">
          <button type="button" className="aosg-btn" onClick={replay} aria-label={`Replay ${name}`}>↻</button>
          <button type="button" className="aosg-btn" onClick={copy} aria-label={`Copy the markup for ${name}`}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </li>
  );
}
