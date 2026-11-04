'use client';

import '../guides.css';
import './recipe.css';
import { CodeBox } from '../site/CodeBox';
import { Plate } from '../site/Plate';
import { StepRail } from '../site/StepRail';
import type { RecipeFiles } from '@/recipes/read';
import type { RecipeDef } from './recipes';

const pad = (n: number) => String(n).padStart(2, '0');

function Head({ n, k, id, children }: { n: number; k: string; id: string; children: React.ReactNode }) {
  return (
    <>
      <div className="tb">
        <span className="tb-n">{pad(n)}</span>
        <span>{k}</span>
      </div>
      <h2 id={id} className="ex-h2">{children}</h2>
    </>
  );
}

/**
 * An example page's recipe: the steps, the complete files beside the file
 * itself running, and where it goes wrong. The files arrive as text read from
 * disk at build time (`readRecipeFiles`), so what is listed is what is tested.
 */
export function Recipe({ recipe, files }: { recipe: RecipeDef; files: RecipeFiles }) {
  return (
    <div className="rc">
      <section className="rc-sec" aria-labelledby="rc-steps">
        <Head n={1} k={`${recipe.steps.length} steps`} id="rc-steps">Build it, step by step</Head>
        <StepRail>
          <ol className="gd-steps">
            {recipe.steps.map((s, i) => (
              <li key={s.title} className="gd-step rc-step">
                <span className="gd-node" aria-hidden="true">{i + 1}</span>
                <div className="rc-step-copy">
                  <p className="gd-step-k">step {pad(i + 1)} · <span>{s.file}</span></p>
                  <h3 className="gd-h3">{s.title}</h3>
                  <p className="gd-p">{s.body}</p>
                  <CodeBox file={s.file.split(' · ')[0]}>{s.code}</CodeBox>
                  {s.note && <p className="rc-note">{s.note}</p>}
                </div>
                <figure className="rc-fig">
                  <figcaption className="rc-fig-cap">
                    <span className="rc-fig-n">fig. 1.{i + 1}</span>
                    <span>{s.caption}</span>
                  </figcaption>
                  <div className="rc-fig-body">{s.figure}</div>
                </figure>
              </li>
            ))}
          </ol>
        </StepRail>
      </section>

      <section className="rc-sec" aria-labelledby="rc-file">
        <Head n={2} k="the whole file" id="rc-file">The complete component</Head>
        <div className="rc-files">
          <div className="rc-files-code">
            <p className="gd-p">
              Two files, ready to paste into a React or Next.js project with <code className="rc-c">svg-scroll-draw</code>{' '}
              installed. The plate beside them is this exact component, running.
            </p>
            {files.react.map((f) => (
              <CodeBox key={f.name} file={f.name}>{f.code}</CodeBox>
            ))}
          </div>
          <div className="rc-files-plate">
            <Plate n="2.1" caption="this file, running — scroll">{recipe.live}</Plate>
          </div>
        </div>
        <h3 className="gd-h3 rc-h3">No build step</h3>
        <p className="gd-p">
          The same logo as one HTML file, with the library from a CDN. Save it and open it in a browser.
        </p>
        <CodeBox file={files.html.name}>{files.html.code}</CodeBox>
      </section>

      <section className="rc-sec" aria-labelledby="rc-wrong">
        <Head n={3} k={`${recipe.pitfalls.length} problems`} id="rc-wrong">Where it goes wrong</Head>
        <div className="gd-faq">
          {recipe.pitfalls.map((p, i) => (
            <div key={p.problem} className="gd-q">
              <span className="gd-q-n">{pad(i + 1)}</span>
              <div>
                <h3 className="gd-q-t">{p.problem}</h3>
                <p className="gd-p">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
