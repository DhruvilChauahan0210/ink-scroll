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
    label: 'Revenue chart in a dashboard',
    tag: 'selector · stagger · onProgress',
    description:
      "A billing dashboard's MRR card: last year's line and this year's draw in a stagger as the card scrolls in, then the area fill and the December tooltip follow the draw's progress.",
    code: `const card = useRef<HTMLDivElement>(null);

<ScrollDraw
  selector=".line" stagger={0.18} easing="ease-out" once
  onProgress={(p) => card.current?.style.setProperty('--p', String(p))}
>
  <svg viewBox="0 0 520 200" className="mrr">
    <path className="grid" d="M8 157 H512 M8 100 H512 M8 43 H512" />
    <path className="area" d={smooth(thisYear) + ' L512 186 L8 186 Z'} />
    <path className="line prev" d={smooth(lastYear)} />
    <path className="line now"  d={smooth(thisYear)} />
  </svg>
</ScrollDraw>

/* .area    { opacity: calc((var(--p) - .6) * 2.5) }
   .tooltip { opacity: calc((var(--p) - .92) * 12.5) } */`,
  },
};
