'use client';

import { downloadText, openHtmlInStackBlitz, openReactInStackBlitz, type ReactProject } from '@/lib/tool-export';
import './tool-kit.css';

/**
 * The row under a tool's code: run what you made, outside the site.
 *
 * `html` is a complete file from htmlFile() (it carries the source line);
 * `react`, when the tool writes a component, becomes a Vite project. Both are
 * built from the tool's current settings by the caller, so this row has no
 * state of its own.
 */
export function ToolExport({
  title,
  filename,
  html,
  react,
}: {
  /** The project and document title, e.g. "Scroll reveal". */
  title: string;
  /** The download's name, e.g. "scroll-reveal.html". */
  filename: string;
  html: string;
  react?: Omit<ReactProject, 'title'>;
}) {
  return (
    <div className="tk-export" role="group" aria-label="Run it outside this page">
      <span className="tk-export-k">Run it</span>
      <button type="button" className="tk-btn" onClick={() => downloadText(filename, html)}>
        ↓ Download {filename}
      </button>
      <button type="button" className="tk-btn" onClick={() => openHtmlInStackBlitz({ title, html })}>
        Open in StackBlitz ↗
      </button>
      {react ? (
        <button type="button" className="tk-btn" onClick={() => openReactInStackBlitz({ ...react, title })}>
          React on StackBlitz ↗
        </button>
      ) : null}
    </div>
  );
}
