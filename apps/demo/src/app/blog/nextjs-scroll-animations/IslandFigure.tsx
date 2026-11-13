import './islands.css';
import { SELF_ENTRIES } from '@/data/competitors';

/**
 * The Next.js post's opening drawing: the example's page (layout.tsx,
 * page.tsx and components/Reveal.tsx, all printed in the post) by where each
 * part runs. Every box is in the server HTML. Dashed boxes are Server
 * Components and send no JavaScript; the solid accent boxes are the client
 * islands, whose JavaScript is Reveal plus the svg-scroll-draw/react entry,
 * loaded once for all of them. What sits inside an island was rendered on the
 * server and passed in as children.
 */

type Leaf = { name: string; note: string };
type Island = { name: string; count?: number; child: Leaf };

const ISLANDS: Island[] = [
  { name: '<Reveal>', count: 3, child: { name: '<article>', note: 'one per feature, rendered on the server' } },
  { name: '<Reveal y={48}>', child: { name: '<Image>', note: 'next/image, rendered on the server' } },
];

export function IslandFigure() {
  return (
    <div className="if">
      <div className="if-box is-server">
        <p className="if-tag"><b>app/layout.tsx</b><span>server</span></p>
        <div className="if-leaf is-css">
          <b>.read-progress</b>
          <span>CSS scroll() timeline, no JavaScript</span>
        </div>
        <div className="if-box is-server">
          <p className="if-tag"><b>app/page.tsx</b><span>server · async, reads the data</span></p>
          <div className="if-leaf">
            <b>&lt;h1&gt; &lt;p&gt;</b>
            <span>never move, never hidden</span>
          </div>
          {ISLANDS.map((island) => (
            <div key={island.name} className="if-box is-client">
              <p className="if-tag">
                <b>{island.name}</b>
                <span>client island{island.count ? ` × ${island.count}` : ''}</span>
              </p>
              <div className="if-leaf">
                <b>{island.child.name}</b>
                <span>{island.child.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <dl className="if-key">
        <div>
          <dt><i className="is-server" />Server</dt>
          <dd>In the HTML. Ships no JavaScript.</dd>
        </div>
        <div>
          <dt><i className="is-client" />Client island</dt>
          <dd>In the HTML, then hydrated: Reveal and <span className="if-nw">svg-scroll-draw/react</span>, {SELF_ENTRIES.react} KB gzipped, loaded once.</dd>
        </div>
      </dl>
    </div>
  );
}
