'use client';

import './usecases.css';
import type { ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SignatureArt, RouteArt, ChartArt, SketchArt, LogoArt, FlowArt } from './art/usecase-art';

/**
 * Six things people build with svg-scroll-draw, each a line drawing that
 * inks itself in as its tile scrolls into view. The page supplies the
 * section heading; this renders the grid only.
 */

type Case = {
  title: string;
  desc: string;
  fn: string;
  arg: string;
  opts?: string;
  art: ReactNode;
  /** Per-path stagger — kept so the last stroke lands while the tile is still well in view. */
  stagger: number;
};

const CASES: Case[] = [
  { title: 'Signatures', desc: 'Hand-signed sign-offs and hero lettering.', fn: 'scrollDraw', arg: "'#signature'", art: <SignatureArt />, stagger: 0.08 },
  { title: 'Route maps', desc: 'Journeys that unfold as the reader scrolls.', fn: 'scrollDraw', arg: "'#route'", opts: '{ once: true }', art: <RouteArt />, stagger: 0.012 },
  { title: 'Charts', desc: 'Lines that plot themselves on arrival.', fn: 'scrollDraw', arg: "'#chart'", opts: '{ stagger: 0.1 }', art: <ChartArt />, stagger: 0.03 },
  { title: 'Product sketches', desc: 'Blueprints that assemble, part by part.', fn: 'scrollDraw', arg: "'#sketch'", opts: '{ stagger: 0.04 }', art: <SketchArt />, stagger: 0.012 },
  { title: 'Logo reveals', desc: 'A mark that inks itself in, once.', fn: 'scrollDraw', arg: "'#logo'", opts: '{ autoplay: true }', art: <LogoArt />, stagger: 0.03 },
  { title: 'Diagrams', desc: 'Flows that explain themselves in order.', fn: 'scrollDraw', arg: "'#flow'", opts: '{ stagger: 0.08 }', art: <FlowArt />, stagger: 0.025 },
];

const TRIGGER = { start: 'top 88%', end: 'top 38%' };
const SELECTOR = 'path:not(.uc-x)';

export function UseCases() {
  return (
    <div className="uc-grid">
      {CASES.map((c, i) => (
        <article className="uc-tile" key={c.title}>
          <ScrollDraw className="uc-panel" trigger={TRIGGER} selector={SELECTOR} stagger={c.stagger} easing="ease-out">
            <span className="uc-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <div className="uc-art">{c.art}</div>
          </ScrollDraw>
          <h3 className="uc-title">{c.title}</h3>
          <p className="uc-desc">{c.desc}</p>
          <code className="uc-code">
            <span className="uc-fn">{c.fn}</span>(<span className="uc-str">{c.arg}</span>
            {c.opts ? <>, {c.opts}</> : null})
          </code>
        </article>
      ))}
    </div>
  );
}
