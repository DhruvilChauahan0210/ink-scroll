'use client';

import { useSyncExternalStore } from 'react';

/* The theme lives on <html class="dark">, set before paint by the layout's
   no-flash script; read it as an external store so hydration stays clean. */
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => mo.disconnect();
};
const getDark = () => document.documentElement.classList.contains('dark');

/** Mono text toggle that matches the homepage nav; same storage as ThemeToggle. */
export function HomeThemeToggle() {
  const dark = useSyncExternalStore<boolean | null>(subscribe, getDark, () => null);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      className="nav-toggle"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="nav-dot" aria-hidden="true" />
      {dark === null ? 'theme' : dark ? 'light' : 'dark'}
    </button>
  );
}
