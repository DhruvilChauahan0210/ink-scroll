'use client';

import { useEffect, useState } from 'react';

/** Mono text toggle that matches the homepage nav; same storage as ThemeToggle. */
export function HomeThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
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
