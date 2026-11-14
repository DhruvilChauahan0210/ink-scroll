<script>
  import { scrollDraw, scrollAnimate, scrollTextAction, scrollCounterAction } from 'svg-scroll-draw/svelte';

  const format = (n) => Math.round(n).toLocaleString('en-US');
</script>

<main>
  <section><p>Scroll down ↓ (rendered on the server, animated in the browser)</p></section>

  <section>
    <div use:scrollDraw={{ easing: 'ease-out' }}>
      <svg viewBox="0 0 500 200" width="520" fill="none" stroke="#ff3e00" stroke-width="6" stroke-linecap="round">
        <path d="M20 150 C 120 20, 200 20, 250 100 S 380 180, 480 50" />
      </svg>
    </div>
  </section>

  <section>
    <h1 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>Every word here arrives on scroll</h1>
  </section>

  <section>
    <div class="card" use:scrollAnimate={{ props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, easing: 'ease-out', once: true }}>
      Fades and slides in with scrollAnimate.
    </div>
  </section>

  <section>
    <p class="big"><span use:scrollCounterAction={{ to: 12480, format }}>12,480</span> users</p>
  </section>

  <section><p>The end.</p></section>
</main>

<style>
  main { font-family: system-ui, sans-serif; background: #fafaf7; color: #17181c; }
  section { min-height: 100vh; display: grid; place-items: center; padding: 0 16px; }
  svg { max-width: 90vw; height: auto; }
  h1 { font-size: clamp(32px, 6vw, 64px); max-width: 16ch; text-align: center; }
  .card { padding: 24px; border: 2px solid #17181c; border-radius: 12px; max-width: 420px; }
  .big { font-size: 48px; font-weight: 700; }
</style>
