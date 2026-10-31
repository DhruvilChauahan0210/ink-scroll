import { CopyButton } from '../CopyButton';

/**
 * A code listing in the drawing-sheet style: the file and its line count in a
 * title strip, and numbered lines when there is more than one. The numbers are
 * drawn by CSS, so selecting the code never picks them up.
 */
export function CodeBox({ file, children }: { file: string; children: string }) {
  const lines = children.replace(/\n+$/, '').split('\n');
  const numbered = lines.length > 1;
  return (
    <div className={`code-box${numbered ? ' is-numbered' : ''}`}>
      <div className="code-head">
        <span className="code-file">{file}</span>
        <span className="code-meta">{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
        <span className="code-copy"><CopyButton text={children} /></span>
      </div>
      <pre className="code-body">
        <code>
          {lines.map((l, i) => (
            <span key={i} className="code-ln">{l}{i < lines.length - 1 ? '\n' : ''}</span>
          ))}
        </code>
      </pre>
    </div>
  );
}
