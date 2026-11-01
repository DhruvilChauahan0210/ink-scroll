'use client';

import './folio.css';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';
import { Site, Hero, Sec, Quote } from '../kit/Site';

/* Folio — a notes app's "What's new in Folio 4" page. Three scrollReveal
   calls do the work: the six feature cards fade up in a stagger, the sync
   timeline slides in from the right (fadeLeft), and the release notes fade
   up row by row on a shared trigger window as each row reaches the reader. */

const Mark = ({ size = 22 }: { size?: number }) => (
  <svg className="fo-mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="6.5" fill="var(--hi)" />
    <path d="M7.5 5.5h6.2l3.8 3.8v9.2h-10z" fill="#fff" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13.7 5.5v3.8h3.8M9.8 13h5.2M9.8 15.8h3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NOTES = [
  { t: 'Kyoto, day three', d: '09:41', s: 'Up at six for Fushimi Inari before the tour groups…', on: true },
  { t: 'Kyoto, day two', d: 'Yesterday', s: 'Nishiki Market, then the long walk up to Kiyomizu-dera…' },
  { t: 'Packing list', d: 'Mon', s: 'Adapters, the good umbrella, JR Pass voucher…' },
  { t: 'Osaka → Kyoto', d: '26 Oct', s: 'Shinkansen at 10:12, car 7, seats D and E…' },
];

function Editor() {
  return (
    <figure className="fo-shot">
      <div className="fo-win" role="img" aria-label="Folio 4 on a Mac: a journal note with linked notes, a checklist and the three notes that link back to it">
        <div className="fo-bar">
          <span className="fo-lights"><i /><i /><i /></span>
          <span className="fo-bar-title">Kyoto, day three</span>
          <span className="fo-bar-tools"><span className="fo-sync-dot">Synced</span><b>Share</b></span>
        </div>
        <div className="fo-body">
          <aside className="fo-side">
            <div className="fo-search">Search <kbd>⌘K</kbd></div>
            <p className="fo-side-h">Library</p>
            <ul>
              <li><span>Inbox</span><em>12</em></li>
              <li><span>Today</span></li>
              <li><span>Favourites</span><em>9</em></li>
            </ul>
            <p className="fo-side-h">Notebooks</p>
            <ul>
              <li className="on"><span>Journal</span><em>48</em></li>
              <li><span>Work</span><em>112</em></li>
              <li><span>Reading</span><em>31</em></li>
              <li><span>Recipes</span><em>19</em></li>
            </ul>
            <p className="fo-side-h">Tags</p>
            <div className="fo-side-tags"><span>#travel</span><span>#ideas</span><span>#2026</span></div>
          </aside>
          <div className="fo-list">
            <div className="fo-list-h"><b>Journal</b><span>48 notes</span></div>
            {NOTES.map((n) => (
              <div key={n.t} className={`fo-note${n.on ? ' on' : ''}`}>
                <span className="fo-note-t"><b>{n.t}</b><time>{n.d}</time></span>
                <span className="fo-note-s">{n.s}</span>
              </div>
            ))}
          </div>
          <div className="fo-doc">
            <p className="fo-doc-meta">Journal · Edited just now · 412 words</p>
            <div className="fo-doc-h">Kyoto, day three</div>
            <p>Up at six for Fushimi Inari before the tour groups. The gates go on far longer than anyone tells you — we turned back at the Yotsutsuji crossing and watched the city come up out of the haze.</p>
            <p>Lunch at <span className="fo-link">Honke Owariya</span>, the soba place from <span className="fo-link">Mika’s Kyoto list</span>. <mark>Go back for the hourai soba on Friday.</mark><span className="fo-caret" /></p>
            <ul className="fo-checks">
              <li className="done">Book the ryokan in Arashiyama</li>
              <li>Post cards to Mum and Dad</li>
              <li>Find the knife shop on Teramachi</li>
            </ul>
            <div className="fo-back">
              <p>3 notes link here</p>
              <div><span>Japan 2026 — itinerary</span><span>Food to try</span><span>Mika’s Kyoto list</span></div>
            </div>
          </div>
        </div>
      </div>
      <figcaption>Folio 4 on macOS. Also on Windows, iPad and iPhone.</figcaption>
    </figure>
  );
}

const FEATURES: { t: string; d: string; viz: ReactNode }[] = [
  {
    t: 'Linked notes',
    d: 'Type [[ to link any note to any other. Every note lists what links back to it, so ideas find each other without folders.',
    viz: (
      <div className="fo-viz fo-viz-link">
        <p>Lunch at <span className="fo-typed">[[Hon</span><span className="fo-caret" /></p>
        <div className="fo-pop"><span className="on">Honke Owariya</span><span>Honke Owariya — menu photos</span><span className="fo-pop-new">+ New note “Hon…”</span></div>
      </div>
    ),
  },
  {
    t: 'Focus mode',
    d: 'Everything but the paragraph you are writing fades away, and typewriter scrolling keeps your line at eye level.',
    viz: (
      <div className="fo-viz fo-viz-focus">
        <p className="dim">The gates go on longer than anyone says.</p>
        <p>We turned back at the crossing and watched the city wake.<span className="fo-caret" /></p>
        <p className="dim">Then soba, and the slow walk down.</p>
        <kbd>⌘ ⇧ F</kbd>
      </div>
    ),
  },
  {
    t: 'Search everything',
    d: 'Search now reads inside PDFs, scanned receipts, photos of whiteboards and your Apple Pencil handwriting.',
    viz: (
      <div className="fo-viz fo-viz-search">
        <div className="fo-field">⌕ <b>ramen receipt</b></div>
        <div className="fo-hit"><span className="fo-thumb" /><span><b>Kyoto receipts.pdf</b><em>Scan · page 2 · “<mark>Ramen</mark> Sen-no-Kaze ¥1,200”</em></span></div>
      </div>
    ),
  },
  {
    t: 'Templates',
    d: 'Start a meeting note, a daily page or a reading log from 40 new templates — or save any note as your own.',
    viz: (
      <div className="fo-viz fo-viz-tpl">
        {['Daily page', 'Meeting', 'Reading'].map((n, i) => (
          <span key={n} className={i === 1 ? 'on' : ''}><i /><i /><i /><b>{n}</b></span>
        ))}
      </div>
    ),
  },
  {
    t: 'Version history',
    d: 'Every note keeps 90 days of history. Scrub back to any edit and restore one paragraph, not the whole note.',
    viz: (
      <div className="fo-viz fo-viz-hist">
        <div className="fo-track"><i /><i /><i className="on" /><i /></div>
        <div className="fo-track-l"><span>Mon</span><span>Tue</span><span className="on">Today, 09:12</span><span>Now</span></div>
        <span className="fo-restore">Restore this paragraph</span>
      </div>
    ),
  },
  {
    t: 'Quick capture',
    d: 'Press ⌥ Space from any app on your Mac to drop a thought into your Inbox without losing your place.',
    viz: (
      <div className="fo-viz fo-viz-cap">
        <div className="fo-capture"><span className="fo-mini"><Mark size={18} /></span><b>Call the ryokan about check-in</b><kbd>↵</kbd></div>
        <p>Saved to <b>Inbox</b> · <kbd>⌥ Space</kbd></p>
      </div>
    ),
  },
];

const Laptop = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>;
const Tablet = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></svg>;
const Phone = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" /></svg>;

const SYNC = [
  { dev: 'MacBook Air', icon: <Laptop />, at: 'Offline · 09:41', what: 'Added a paragraph about Nishiki Market' },
  { dev: 'iPad mini', icon: <Tablet />, at: 'Offline · 09:44', what: 'Ticked “Book the ryokan in Arashiyama”' },
  { dev: 'iPhone', icon: <Phone />, at: 'Back online · 09:52', what: 'Merged both edits into one note — no copies', ok: true },
];

const FIXES: { k: 'New' | 'Improved' | 'Fixed'; t: string; on: string }[] = [
  { k: 'New', t: 'Paste a link to a YouTube video, a Figma file or a map to embed it inline.', on: 'All' },
  { k: 'New', t: 'Stage Manager and external display support, with a separate window per note.', on: 'iPad' },
  { k: 'Improved', t: 'Folio opens 2.3× faster with a library of 10,000 notes.', on: 'All' },
  { k: 'Improved', t: 'Markdown export keeps your notebooks, tags and image links intact.', on: 'All' },
  { k: 'Improved', t: 'Tables sort by any column and resize by dragging a column edge.', on: 'All' },
  { k: 'Improved', t: 'Dark mode has higher-contrast code blocks and softer highlights.', on: 'All' },
  { k: 'Fixed', t: 'Pasting from Word no longer brings across hidden font sizes.', on: 'Mac, Windows' },
  { k: 'Fixed', t: 'Numbered lists keep their numbering after you move a block with ⌥↑.', on: 'All' },
  { k: 'Fixed', t: 'The cursor no longer jumps to the end of a note when sync finishes.', on: 'iPhone, iPad' },
  { k: 'Fixed', t: 'Images dragged in from Safari kept a generic file name.', on: 'Mac' },
  { k: 'Fixed', t: 'The Today widget showed yesterday’s daily note until you opened the app.', on: 'iPhone' },
  { k: 'Fixed', t: 'A rare crash when closing a window during a large PDF import.', on: 'Windows' },
];

export function FolioSite() {
  useEffect(() => {
    // The six cards fade up one after another, and stay.
    const features = scrollReveal('.fo-feature', { preset: 'fadeUp', stagger: 1, once: true });
    // The sync story slides in from the right, a step at a time.
    const sync = scrollReveal('.fo-step', { preset: 'fadeLeft', stagger: 1, once: true });
    // Each release-note row reveals on the same window as it reaches the reader.
    const fixes = scrollReveal('.fo-fix', { preset: 'fadeUp', once: true, trigger: { start: 'top 96%', end: 'top 78%' } });
    return () => { features.destroy(); sync.destroy(); fixes.destroy(); };
  }, []);

  return (
    <Site
      className="fo"
      brand={<><Mark />Folio</>}
      links={['Features', 'Templates', 'What’s new', 'Pricing']}
      cta="Download"
      example="scroll-reveal"
      apis="scrollReveal · fadeUp · fadeLeft · stagger"
      footnote="Notes that find each other"
    >
      <Hero
        center
        kicker="Folio 4.0 is out"
        title={<>Folio 4. Notes that <span className="fo-hl">find each other.</span></>}
        lede="Our biggest update since 1.0. Link any note to any other and see what links back, write in a quieter Focus mode, and search inside PDFs, scans and your own handwriting. Free for everyone on Folio."
        actions={['Download Folio 4', 'Read the release notes']}
        art={<Editor />}
      />

      <Sec kicker="What’s new" title="Six big things in Folio 4." lede="A year of work, shaped by 2,400 replies to last spring’s survey. Here is what changes the moment you update.">
        <div className="sk-grid3 fo-features">
          {FEATURES.map((f) => (
            <article key={f.t} className="sk-card fo-feature">
              {f.viz}
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </div>
      </Sec>

      <Sec tone="alt" id="sync">
        <div className="fo-sync">
          <div className="fo-sync-copy">
            <p className="sk-kick">Rebuilt sync</p>
            <h2 className="sk-h2">Two devices, one note, no conflicted copies.</h2>
            <p className="sk-lede">Edit the same note on a laptop on the plane and an iPad on the train. When they reconnect, Folio 4 merges the changes paragraph by paragraph instead of saving a second copy — and it’s end-to-end encrypted.</p>
          </div>
          <ol className="fo-steps">
            {SYNC.map((s) => (
              <li key={s.dev} className={`fo-step${s.ok ? ' ok' : ''}`}>
                <span className="fo-dev">{s.icon}</span>
                <span className="fo-step-t"><b>{s.dev}</b><time>{s.at}</time></span>
                <span className="fo-step-d">{s.what}</span>
              </li>
            ))}
          </ol>
        </div>
      </Sec>

      <Quote text="I stopped filing and started writing. The backlinks do the organising now — I just follow them." who={<><b>Priya Raman</b> · writes the Small Hours newsletter</>} />

      <Sec id="notes">
        <div className="fo-notes">
          <div className="fo-notes-head">
            <p className="sk-kick">Release notes</p>
            <h2 className="sk-h2">Fixes and improvements</h2>
            <dl className="fo-ver">
              <div><dt>Version</dt><dd>4.0 (4012)</dd></div>
              <div><dt>Released</dt><dd>28 October 2026</dd></div>
              <div><dt>Size</dt><dd>38 MB on Mac</dd></div>
            </dl>
            <a className="fo-more" href="#top">Full changelog →</a>
          </div>
          <ul className="fo-fixes">
            {FIXES.map((f) => (
              <li key={f.t} className="fo-fix">
                <span className={`fo-tag is-${f.k.toLowerCase()}`}>{f.k}</span>
                <span className="fo-fix-t">{f.t}</span>
                <span className="fo-fix-on">{f.on}</span>
              </li>
            ))}
          </ul>
        </div>
      </Sec>

      <Sec tone="ink" center>
        <div className="fo-cta">
          <span className="fo-icon"><Mark size={72} /></span>
          <h2 className="sk-h2">Folio 4 is a free update.</h2>
          <p className="sk-lede">Already on Folio? It updates itself tonight. New here? Everything on this page is in the free plan, up to 1,000 notes.</p>
          <div className="sk-ctas">
            <a className="sk-btn" href="#top">Download for Mac</a>
            <a className="sk-btn sk-btn-ghost" href="#top">Get it on the App Store</a>
          </div>
          <p className="fo-req">macOS 13 or later · Windows 11 · iPadOS and iOS 17 or later</p>
        </div>
      </Sec>
    </Site>
  );
}
