'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import type { BlogPost } from '@/data/blog-posts';

const pad = (n: number) => String(n).padStart(2, '0');
const minutes = (p: BlogPost) => parseInt(p.readTime, 10) || 0;

export type Topic = { tag: string; posts: number; minutes: number };

/**
 * The topic key: one row per tag with its post count and its reading time
 * drawn to scale. It is also the filter for the register below it, so the
 * drawing is the control.
 */
export function TopicKey({ topics, total, active, onPick }: {
  topics: Topic[];
  total: number;
  active: string;
  onPick: (tag: string) => void;
}) {
  const max = Math.max(...topics.map((t) => t.minutes));
  const rows = [{ tag: 'All', posts: topics.reduce((s, t) => s + t.posts, 0), minutes: total }, ...topics];
  return (
    <figure className="bl-key">
      <div className="bl-key-hd" aria-hidden="true"><span>topic</span><span>posts</span><span>Reading, to scale</span></div>
      <ScrollDraw className="bl-key-rows" selector=".bl-key-ink" autoplay duration={700} delay={300} stagger={0.07} easing="ease-out" once>
        {rows.map((t) => {
          const on = active === t.tag;
          const len = t.tag === 'All' ? 1000 : (t.minutes / max) * 1000;
          return (
            <button key={t.tag} type="button" className="bl-key-row" aria-pressed={on} onClick={() => onPick(t.tag)}>
              <span className="bl-key-t">{t.tag}</span>
              <span className="bl-key-n">{pad(t.posts)}</span>
              <span className="bl-key-bar">
                <svg viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d={`M0 5 H${len.toFixed(1)}`} className={`bl-key-ink${t.tag === 'All' ? ' is-all' : ''}`} stroke="currentColor" />
                </svg>
                <span className="bl-key-m">{t.minutes} min</span>
              </span>
            </button>
          );
        })}
      </ScrollDraw>
      <figcaption className="bl-key-cap">Fig. 1 — the posts by topic · pick a row to filter</figcaption>
    </figure>
  );
}

/**
 * The index: the opening (server-rendered copy passed as `head`) beside the
 * topic key, then the register — every post as a numbered sheet, filtered by
 * the key.
 */
export function BlogIndex({ head, posts, topics, total }: { head: ReactNode; posts: BlogPost[]; topics: Topic[]; total: number }) {
  const [active, setActive] = useState('All');
  const shown = posts.map((p, i) => ({ p, n: i + 1 })).filter(({ p }) => active === 'All' || p.tag === active);

  return (
    <>
      <header className="pg-head bl-head">
        <div>{head}</div>
        <TopicKey topics={topics} total={total} active={active} onPick={setActive} />
      </header>
      <section className="bl-reg" aria-label="Posts">
        <div className="bl-reg-hd" aria-hidden="true">
          <span>no.</span><span>title</span><span>topic</span><span>Read</span><span>issued</span>
        </div>
        <ol className="bl-reg-list">
          {shown.map(({ p, n }) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="bl-row">
                <span className="bl-n">{pad(n)}</span>
                <span className="bl-main">
                  <span className="bl-t">{p.title}</span>
                  <span className="bl-d">{p.description}</span>
                </span>
                <span className="bl-tag"><span className="tag">{p.tag}</span></span>
                <span className="bl-m">{minutes(p)} min</span>
                <span className="bl-date">{p.date}</span>
                <span className="bl-go" aria-hidden="true">Read →</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="bl-reg-foot">
          showing {pad(shown.length)} of {pad(posts.length)}
          {active !== 'All' ? <> · <button type="button" className="bl-clear" onClick={() => setActive('All')}>show all</button></> : null}
        </p>
      </section>
    </>
  );
}
