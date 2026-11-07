'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import './perf.css';

/** 60 fps: the browser has 1000 / 60 ms to produce each frame. */
const FRAME_MS = 1000 / 60;
const FRAMES = 3;

type Block = { at: number; to: number; kind: 'script' | 'style' | 'composite' };
type Lane = { name: string; blocks: Block[]; idle?: string };

/** Where the work sits inside one frame (0 → 1 of the frame). Schematic, repeated every frame. */
const JS_ENGINE: Lane[] = [
  {
    name: 'Main thread',
    blocks: [
      { at: 0.05, to: 0.3, kind: 'script' },
      { at: 0.3, to: 0.47, kind: 'style' },
    ],
  },
  { name: 'compositor', blocks: [{ at: 0.52, to: 0.66, kind: 'composite' }] },
];

const NATIVE: Lane[] = [
  { name: 'Main thread', blocks: [], idle: 'no listener, no rAF, no style writes' },
  { name: 'compositor', blocks: [{ at: 0.05, to: 0.22, kind: 'composite' }] },
];

const LEGEND: { kind: Block['kind']; label: string }[] = [
  { kind: 'script', label: 'rAF callback — read scroll, el.style.setProperty()' },
  { kind: 'style', label: 'Style recalc' },
  { kind: 'composite', label: 'animate opacity / transform + composite' },
];

function Track({ lane }: { lane: Lane }) {
  const W = 1000;
  const fw = W / FRAMES;
  return (
    <div className="tf-lane">
      <span className="tf-name">{lane.name}</span>
      <span className="tf-track">
        <svg viewBox={`0 0 ${W} 14`} preserveAspectRatio="none" aria-hidden="true">
          <path d={`M0 7 H${W}`} className="tf-base" />
          {lane.idle ? <path d={`M0 7 H${W}`} className="tf-idle" stroke="currentColor" /> : null}
          {Array.from({ length: FRAMES }, (_, f) =>
            lane.blocks.map((b) => (
              <path
                key={`${f}-${b.kind}`}
                d={`M${(f * fw + b.at * fw).toFixed(1)} 7 H${(f * fw + b.to * fw).toFixed(1)}`}
                className={`tf-ink tf-blk is-${b.kind}`}
                stroke="currentColor"
              />
            )),
          )}
        </svg>
        {lane.idle ? <span className="tf-idle-l">idle<span> — {lane.idle}</span></span> : null}
      </span>
    </div>
  );
}

/**
 * The performance post's opening drawing: where the per-frame work runs, as a
 * Performance-panel trace would show it. Three frames at 60 fps. On the JS
 * engine each frame starts with a rAF callback and a style recalc on the main
 * thread before the compositor can draw; on the native path
 * (animation-timeline: view()) the main thread has nothing to do and the
 * compositor maps scroll to the animation by itself. Block widths are schematic;
 * the frame budget is the only number, and it is 1000 / 60.
 */
export function ThreadFigure() {
  const ticks = Array.from({ length: FRAMES + 1 }, (_, i) => i);
  return (
    <ScrollDraw className="tf" selector=".tf-ink" autoplay duration={650} delay={300} stagger={0.05} easing="ease-out" once>
      <div className="tf-axis" aria-hidden="true">
        <span className="tf-name">Time, ms</span>
        <span className="tf-ticks">
          {ticks.map((i) => (
            <span key={i} style={{ left: `${(i / FRAMES) * 100}%` }}>{(i * FRAME_MS).toFixed(1)}</span>
          ))}
        </span>
      </div>

      <div className="tf-grp">
        <p className="tf-hd"><span>JS engine</span><span>IntersectionObserver + rAF</span></p>
        {JS_ENGINE.map((l) => <Track key={l.name} lane={l} />)}
      </div>
      <div className="tf-grp is-native">
        <p className="tf-hd"><span>Native path</span><span>animation-timeline: view()</span></p>
        {NATIVE.map((l) => <Track key={l.name} lane={l} />)}
      </div>

      <ul className="tf-key">
        {LEGEND.map((k) => (
          <li key={k.kind}><i className={`is-${k.kind}`} aria-hidden="true" />{k.label}</li>
        ))}
        <li><i className="is-budget" aria-hidden="true" />frame boundary — {FRAME_MS.toFixed(1)} ms at 60 fps</li>
      </ul>
    </ScrollDraw>
  );
}
