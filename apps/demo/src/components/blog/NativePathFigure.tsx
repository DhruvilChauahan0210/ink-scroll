'use client';

import './b2-figures.css';
import { ScrollDraw } from 'svg-scroll-draw/react';

/**
 * The native-CSS post's opening drawing: the engine's real code path. One call
 * goes through the eligibility check once, at setup. Eligible configs get a
 * generated stylesheet — @keyframes plus a named view-timeline on the container
 * — and the compositor advances them every frame, whatever the main thread is
 * doing. Everything else gets the IntersectionObserver-gated rAF loop, whose
 * frames have to wait their turn behind a long task on the main thread.
 */

const TICK = 16;

export function NativePathFigure() {
  const left = Array.from({ length: 12 }, (_, i) => 18 + i * TICK);
  // Main thread: frames before the long task, none during it, one late after it.
  const before = [238, 254, 270];
  const after = [342, 358, 374, 390, 406, 422];
  return (
    <ScrollDraw className="b2-np" selector=".b2-ink" autoplay duration={800} delay={300} stagger={0.04} easing="ease-out" once>
      <svg viewBox="0 0 440 318" role="img" aria-labelledby="b2-np-t">
        <title id="b2-np-t">
          scrollDraw checks once whether its options are native-eligible. If so it injects a stylesheet with keyframes and a
          view-timeline and the compositor thread runs every frame; if not, an IntersectionObserver-gated
          requestAnimationFrame loop runs on the main thread, where a long task delays frames.
        </title>
        <defs>
          <marker id="b2-np-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8" className="b2-head" />
          </marker>
          <pattern id="b2-np-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 V6" className="b2-hatch" />
          </pattern>
        </defs>

        {/* the call */}
        <rect x="96" y="4" width="248" height="32" rx="6" className="b2-ink b2-box" stroke="currentColor" />
        <text x="220" y="25" className="b2-v b2-strong" textAnchor="middle">scrollDraw(&apos;#logo&apos;, options)</text>
        <path d="M220 36 V52" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-np-arr)" />

        {/* the check, once at setup */}
        <path d="M220 56 L318 80 L220 104 L122 80 Z" className="b2-ink b2-box" stroke="currentColor" />
        <text x="220" y="84" className="b2-v" textAnchor="middle">nativeEligible()</text>

        {/* yes → native */}
        <path d="M122 80 H64 V124" className="b2-ink b2-acc-ink" stroke="currentColor" markerEnd="url(#b2-np-arr)" />
        <text x="72" y="72" className="b2-v b2-acc">yes</text>
        <rect x="6" y="128" width="200" height="62" className="b2-ink b2-box b2-acc-ink" stroke="currentColor" />
        <text x="16" y="148" className="b2-v b2-strong">inject one &lt;style&gt;</text>
        <text x="16" y="165" className="b2-m">@keyframes + view-timeline</text>
        <text x="16" y="181" className="b2-m">on the container · return</text>

        {/* no → JS */}
        <path d="M318 80 H376 V124" className="b2-ink b2-dim" stroke="currentColor" markerEnd="url(#b2-np-arr)" />
        <text x="352" y="72" className="b2-v" textAnchor="end">no</text>
        <rect x="234" y="128" width="200" height="62" className="b2-ink b2-box" stroke="currentColor" />
        <text x="244" y="148" className="b2-v b2-strong">IntersectionObserver</text>
        <text x="244" y="165" className="b2-m">gates a rAF loop that sets</text>
        <text x="244" y="181" className="b2-m">stroke-dashoffset per path</text>

        {/* the threads */}
        <text x="6" y="220" className="b2-k">compositor thread</text>
        <path d="M6 252 H206" className="b2-ink b2-thin" stroke="currentColor" />
        {left.map((x) => (
          <path key={x} d={`M${x} 236 V252`} className="b2-ink b2-frame b2-acc-ink" stroke="currentColor" />
        ))}

        <text x="234" y="220" className="b2-k">main thread</text>
        <path d="M234 252 H434" className="b2-ink b2-thin" stroke="currentColor" />
        <rect x="280" y="232" width="56" height="20" className="b2-task" fill="url(#b2-np-hatch)" />
        <rect x="280" y="232" width="56" height="20" className="b2-ink b2-thin" stroke="currentColor" />
        {before.concat(after).map((x, i) => (
          <path key={x} d={`M${x} 236 V252`} className={`b2-ink b2-frame${i === before.length ? ' is-late' : ''}`} stroke="currentColor" />
        ))}
        <text x="308" y="270" className="b2-m" textAnchor="middle">long task</text>

        <text x="6" y="292" className="b2-v b2-acc">0 JS per frame</text>
        <text x="6" y="310" className="b2-m">busy main thread: no effect</text>
        <text x="234" y="292" className="b2-v">JS every frame</text>
        <text x="234" y="310" className="b2-m">frames wait behind the task</text>
      </svg>
    </ScrollDraw>
  );
}
