'use client';

import { useEffect, useRef } from 'react';
import { scrollDraw } from 'svg-scroll-draw';

/**
 * The centerpiece: a torus knot as a wireframe of SVG strokes — 36 lines
 * along the tube and 24 rings around it — projected with perspective and
 * shaded by depth. The first frame is computed on the server so the shape
 * is there at first paint; on mount the library draws every stroke in,
 * then the knot turns slowly and leans toward the pointer.
 */
const P = 2;
const Q = 3;
const R = 1.0;
const r = 0.46;
const TUBE = 0.3;
const LONG = 36;
const RINGS = 24;
const STEPS = 180;
const RING_STEPS = 28;
const SIZE = 1000;
const CX = SIZE / 2;
const CY = SIZE / 2;
const SCALE = 255;

type V = [number, number, number];

function centre(t: number): V {
  const w = R + r * Math.cos(Q * t);
  return [w * Math.cos(P * t), w * Math.sin(P * t), -r * Math.sin(Q * t)];
}
function sub(a: V, b: V): V { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a: V, b: V): V {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: V): V {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function frame(t: number): { c: V; n: V; b: V } {
  const c = centre(t);
  const T = norm(sub(centre(t + 0.002), centre(t - 0.002)));
  const up: V = [0, 0, 1];
  const b = norm(cross(T, up));
  const n = norm(cross(b, T));
  return { c, n, b };
}
function tube(t: number, v: number): V {
  const { c, n, b } = frame(t);
  const cv = Math.cos(v);
  const sv = Math.sin(v);
  return [
    c[0] + TUBE * (n[0] * cv + b[0] * sv),
    c[1] + TUBE * (n[1] * cv + b[1] * sv),
    c[2] + TUBE * (n[2] * cv + b[2] * sv),
  ];
}

/* Model space, built once. */
const MODEL: { pts: V[]; gold: boolean }[] = [];
for (let k = 0; k < LONG; k++) {
  const v = (k / LONG) * Math.PI * 2;
  const pts: V[] = [];
  for (let i = 0; i < STEPS; i++) pts.push(tube((i / STEPS) * Math.PI * 2, v));
  MODEL.push({ pts, gold: k % 12 === 0 });
}
for (let k = 0; k < RINGS; k++) {
  const t = (k / RINGS) * Math.PI * 2;
  const pts: V[] = [];
  for (let i = 0; i < RING_STEPS; i++) pts.push(tube(t, (i / RING_STEPS) * Math.PI * 2));
  MODEL.push({ pts, gold: false });
}

function project(ax: number, ay: number): { d: string; depth: number }[] {
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const cy = Math.cos(ay), sy = Math.sin(ay);
  return MODEL.map(({ pts }) => {
    let d = '';
    let zsum = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0, z0] = pts[i];
      // rotate Y then X
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = y0 * cx - z1 * sx;
      const z2 = y0 * sx + z1 * cx;
      const f = 1 / (1 - z2 * 0.17);
      const px = CX + x1 * SCALE * f;
      const py = CY + y2 * SCALE * f;
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1);
      zsum += z2;
    }
    return { d: d + 'Z', depth: zsum / pts.length };
  });
}

const AX0 = 0.62;
const AY0 = -0.4;
const FIRST = project(AX0, AY0);

/* Depth → opacity, as a fixed-decimal string so the server and the client
   serialise the same text (a raw float hydrated differently). */
function shade(depth: number): string {
  const t = Math.max(0, Math.min(1, (depth + 1.6) / 3.2)); // 0 far … 1 near
  return (0.16 + 0.84 * t).toFixed(3);
}

export function Knot() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;

    let raf = 0;
    let running = false;
    let visible = true;
    let ay = AY0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let last = performance.now();

    const paint = () => {
      const frames = project(AX0 + cy, ay + cx);
      for (let i = 0; i < paths.length; i++) {
        paths[i].setAttribute('d', frames[i].d);
        paths[i].style.opacity = shade(frames[i].depth);
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(50, now - last);
      last = now;
      if (visible && !document.hidden) {
        ay += dt * 0.00022;
        cx += (tx - cx) * 0.06;
        cy += (ty - cy) * 0.06;
        paint();
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      tx = ((e.clientX / innerWidth) * 2 - 1) * 0.45;
      ty = ((e.clientY / innerHeight) * 2 - 1) * 0.3;
    };

    // Draw every stroke in; then release the dash styles and let it turn.
    const instance = scrollDraw(svg, {
      autoplay: true,
      duration: 1700,
      stagger: 0.014,
      easing: 'ease-in-out',
      once: true,
      onComplete: () => {
        instance.destroy();
        paths.forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
        svg.classList.add('is-drawn');
        start();
      },
    });

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(svg);
    if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    if (reduced) {
      // No autoplay under reduced motion: the engine leaves the strokes drawn.
      svg.classList.add('is-drawn');
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      instance.destroy();
    };
  }, []);

  return (
    <div className="knot" aria-hidden="true">
      <div className="knot-glow" />
      <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="xMidYMid meet">
        {FIRST.map((f, i) => (
          <path
            key={i}
            d={f.d}
            className={MODEL[i].gold ? 'k k-gold' : 'k'}
            style={{ opacity: shade(f.depth) }}
          />
        ))}
      </svg>
    </div>
  );
}
