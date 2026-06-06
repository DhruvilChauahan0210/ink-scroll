// ── DevTools overlay for svg-scroll-draw ──────────────────────────────────────
// Zero bytes in production — tree-shaken away when NODE_ENV === 'production'.
// Call devtools.enable() once to instrument all active instances on the page.

import { _getRegistry } from '../core/registry';
import type { InstanceType } from '../core/registry';

const TYPE_COLOR: Record<InstanceType, string> = {
  draw:    '#60a5fa',  // blue
  animate: '#4ade80',  // green
  counter: '#fbbf24',  // yellow
  video:   '#c084fc',  // purple
  text:    '#fb923c',  // orange
  pin:     '#f43f5e',  // rose
  snap:    '#22d3ee',  // cyan
};

let panelEl: HTMLElement | null = null;
let overlayEl: HTMLElement | null = null;
let rafId = 0;
let enabled = false;
let shortcutListener: ((e: KeyboardEvent) => void) | null = null;

// ── Trigger overlay ───────────────────────────────────────────────────────────

function buildOverlay(): void {
  overlayEl?.remove();
  overlayEl = document.createElement('div');
  overlayEl.setAttribute('data-ssd-devtools-overlay', '');
  overlayEl.style.cssText =
    'position:fixed;pointer-events:none;z-index:99998;inset:0;overflow:hidden;';
  document.body.appendChild(overlayEl);
}

function renderTriggerLines(): void {
  if (!overlayEl) return;
  overlayEl.innerHTML = '';
  const scroll = window.scrollY;
  const vp     = window.innerHeight;

  for (const [, entry] of _getRegistry()) {
    const { tStart, tEnd } = entry.getTrigger();
    const color = TYPE_COLOR[entry.type] ?? '#60a5fa';

    // Convert absolute page positions to current viewport-relative Y
    const yStart = tStart - scroll;
    const yEnd   = tEnd   - scroll;

    // Only draw if in viewport proximity
    if (yEnd < -100 || yStart > vp + 100) continue;

    const mkLine = (y: number, label: string): HTMLElement => {
      const line = document.createElement('div');
      line.style.cssText =
        `position:absolute;left:0;right:0;` +
        `top:${y}px;height:2px;background:${color};opacity:0.85;`;
      const badge = document.createElement('span');
      badge.textContent = label;
      badge.style.cssText =
        `position:absolute;right:8px;top:-18px;` +
        `font:bold 9px/1 monospace;color:#fff;` +
        `background:${color};padding:2px 5px;border-radius:3px;white-space:nowrap;`;
      line.appendChild(badge);
      return line;
    };

    overlayEl.appendChild(mkLine(yStart, `▶ ${entry.type}:start`));
    overlayEl.appendChild(mkLine(yEnd,   `■ ${entry.type}:end`));
  }
}

// ── Progress panel ────────────────────────────────────────────────────────────

function buildPanel(): void {
  panelEl?.remove();
  panelEl = document.createElement('div');
  panelEl.setAttribute('data-ssd-devtools-panel', '');
  panelEl.style.cssText =
    'position:fixed;bottom:12px;right:12px;z-index:99999;' +
    'background:rgba(10,10,10,0.92);color:#e8e8e3;border-radius:10px;' +
    'border:1px solid #333;font:12px/1.5 monospace;padding:10px 14px;' +
    'min-width:220px;max-width:280px;pointer-events:none;' +
    'backdrop-filter:blur(4px);';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:bold;font-size:11px;letter-spacing:0.1em;' +
    'text-transform:uppercase;color:#888;margin-bottom:8px;';
  title.textContent = '⚡ svg-scroll-draw devtools';
  panelEl.appendChild(title);

  document.body.appendChild(panelEl);
}

function renderPanel(): void {
  if (!panelEl) return;
  // Remove old rows (keep title)
  while (panelEl.children.length > 1) {
    panelEl.removeChild(panelEl.lastChild!);
  }

  const registry = _getRegistry();

  if (registry.size === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#555;font-size:11px;';
    empty.textContent = 'No active instances.';
    panelEl.appendChild(empty);
    return;
  }

  let idx = 0;
  for (const [el, entry] of registry) {
    const progress = entry.getProgress();
    const color    = TYPE_COLOR[entry.type] ?? '#60a5fa';
    const tag      = (el as HTMLElement).id
      ? `#${(el as HTMLElement).id}`
      : (el as HTMLElement).className
        ? `.${(el as HTMLElement).className.split(' ')[0]}`
        : entry.type;

    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;';

    const label = document.createElement('div');
    label.style.cssText = `font-size:10px;color:${color};margin-bottom:2px;`;
    label.textContent = `${entry.type} ${tag}`;

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'height:6px;background:#222;border-radius:3px;overflow:hidden;';

    const bar = document.createElement('div');
    bar.style.cssText =
      `height:100%;width:${Math.round(progress * 100)}%;` +
      `background:${color};border-radius:3px;transition:width 0.1s;`;

    barWrap.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrap);

    const pct = document.createElement('div');
    pct.style.cssText = 'font-size:9px;color:#555;text-align:right;margin-top:1px;';
    pct.textContent = `${Math.round(progress * 100)}%`;
    row.appendChild(pct);

    panelEl.appendChild(row);
    idx++;
  }
}

// ── rAF render loop ───────────────────────────────────────────────────────────

function renderLoop(): void {
  renderTriggerLines();
  renderPanel();
  rafId = requestAnimationFrame(renderLoop);
}

// ── Public API ────────────────────────────────────────────────────────────────

function enable(): void {
  if (process.env.NODE_ENV === 'production') return;
  if (enabled) return;
  enabled = true;

  buildOverlay();
  buildPanel();
  rafId = requestAnimationFrame(renderLoop);

  // Keyboard shortcut: Cmd/Ctrl + Shift + S
  shortcutListener = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      toggle();
    }
  };
  window.addEventListener('keydown', shortcutListener);
}

function disable(): void {
  if (!enabled) return;
  enabled = false;
  cancelAnimationFrame(rafId);
  panelEl?.remove();
  panelEl = null;
  overlayEl?.remove();
  overlayEl = null;
  if (shortcutListener) {
    window.removeEventListener('keydown', shortcutListener);
    shortcutListener = null;
  }
}

function toggle(): void {
  if (enabled) disable(); else enable();
}

function highlight(target: string | Element): void {
  if (!enabled) return;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const entry = _getRegistry().get(el);
  if (!entry) return;
  const color = TYPE_COLOR[entry.type] ?? '#60a5fa';
  const existing = el as HTMLElement;
  const prev = existing.style.outline;
  existing.style.outline = `2px solid ${color}`;
  existing.style.outlineOffset = '2px';
  setTimeout(() => {
    existing.style.outline = prev;
    existing.style.outlineOffset = '';
  }, 2000);
}

export const devtools = { enable, disable, toggle, highlight };
