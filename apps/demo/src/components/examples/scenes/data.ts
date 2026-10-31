/**
 * Each example's card copy and snippet, kept beside its scene so the code
 * always matches what the scene does. Keyed by example id.
 */
export type SceneData = { label: string; tag: string; description: string; code: string };

export const SCENES: Record<string, SceneData> = {
  'logo-reveal': {
    label: 'Ferrow Coffee Roasters',
    tag: 'autoplay · onComplete · fill',
    description:
      "A full launch site for a fictional Lisbon roaster. The emblem draws itself as the page loads and onComplete floods it with the brand colours; further down, origin drawings, farm-to-roastery routes, a roast profile and the head roaster's signature draw as you scroll.",
    code: `const [sealed, setSealed] = useState(false);

<ScrollDraw
  selector="path:not(.fill)"
  autoplay duration={1700} delay={250} stagger={0.14}
  easing="ease-out" once
  onComplete={() => setSealed(true)}
>
  <svg viewBox="0 0 200 200" className={sealed ? 'emblem is-sealed' : 'emblem'}>
    <path className="fill disc" d={ring(70)} />
    <path className="fill bean" d={BEAN} />
    <path d={ring(86)} />            {/* outer ring */}
    <path d={BEAN} />                {/* the bean   */}
    <path d="M101 60 C86 84 …" />    {/* its crease */}
  </svg>
</ScrollDraw>

/* .fill { opacity: 0; transition: opacity .8s }
   .is-sealed .fill { opacity: 1 } */`,
  },
  'line-chart': {
    label: 'Ledgerline',
    tag: 'selector · stagger · onProgress',
    description:
      "A full marketing site for a fictional subscription-analytics product. The dashboard's MRR lines plot themselves as it scrolls in, with the fill and the December tooltip following the draw; cohort curves fan out, a forecast draws past today with its confidence band widening, and three sparklines draw together.",
    code: `const card = useRef<HTMLDivElement>(null);

<ScrollDraw
  selector=".line" stagger={0.18} easing="ease-out" once
  trigger={{ start: 'top 90%', end: 'top 30%' }}
  onProgress={(p) => card.current?.style.setProperty('--p', String(p))}
>
  <svg viewBox="0 0 760 240" preserveAspectRatio="none" className="mrr">
    <path className="grid" d="M6 155 H754 M6 120 H754 M6 85 H754" />
    <path className="area" d={smooth(thisYear) + ' L754 226 L6 226 Z'} />
    <path className="line prev" d={smooth(lastYear)} />
    <path className="line now"  d={smooth(thisYear)} />
  </svg>
</ScrollDraw>

/* .area    { opacity: calc((var(--p) - .6) * 2.5) }
   .tooltip { opacity: calc((var(--p) - .93) * 14) } */`,
  },
  signature: {
    label: 'Quillmark',
    tag: 'one stroke · autoplay · onComplete',
    description:
      "A full site for a fictional e-signature product. The client's signature writes itself on the contract in one continuous stroke when it comes into view, and onComplete flips the field to signed and stamps the time; further down, the steps draw in turn and the audit trail's rail draws down the page with the reader.",
    code: `const [signed, setSigned] = useState(false);

<div className={signed ? 'field is-signed' : 'field'}>
  <span className="tag">{signed ? 'Signed' : 'Sign here'}</span>
  <ScrollDraw
    autoplay duration={2400} delay={500}
    easing="ease-in-out" once
    onComplete={() => setSigned(true)}
  >
    <svg viewBox="20 40 380 190">
      {/* one continuous stroke, from the A to the flourish */}
      <path className="ink" d="M 32 196 C 46 190 62 165 …" />
    </svg>
  </ScrollDraw>
</div>`,
  },
};
