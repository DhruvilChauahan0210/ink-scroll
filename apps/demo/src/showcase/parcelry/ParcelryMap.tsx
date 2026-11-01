'use client';

import { ScrollDraw } from 'svg-scroll-draw/react';
import { elbow } from '@/components/examples/ink/geo';
import {
  W, H, BLOCKS, PLAZAS, WINGS, RIVER, QUAY, AVENUES, STREETS, PARKS, parkPath,
  ROUTE_PTS, SHOP, DOOR, RIDER,
} from './geo';

const ROUTE = elbow(ROUTE_PTS, 12);
const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

const Bike = () => (
  <path d="M-5.5 2.5a2.6 2.6 0 1 0 0.01 0M5.5 2.5a2.6 2.6 0 1 0 0.01 0M-5.5 5.1L-2 -1.5H3.5L5.5 5.1M-2 -1.5L0.6 5.1H-5.5M2.2 -3.8H4.4" className="pc-bike" />
);

/* The live-tracking map. Only `.pc-route` draws (selector); the streets,
   parks, river, rider and pins are drawn once and stay put. */
export function ParcelryMap() {
  return (
    <figure className="pc-mapcard">
      <div className="pc-map">
        <ScrollDraw selector=".pc-route" trigger={{ start: 'top 80%', end: 'top 25%' }} easing="ease-in-out" once>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Live map: a Parcelry rider on a cargo bike, two-thirds of the way from Tinta Books in Chiado across the Baixa and up through Mouraria to a flat in Graça">
            <rect width={W} height={H} className="pc-land" />
            <path d={BLOCKS} className="pc-block" />
            <path d={PLAZAS} className="pc-plaza" />
            <path d={WINGS} className="pc-block pc-wing" />
            {PARKS.map((p) => <path key={p.name} d={parkPath(p.pts)} className="pc-park" />)}
            <path d="M408 246 L426 228 L462 232 L470 250 L448 262 L414 258 Z" className="pc-castle" />
            {STREETS.map((d, i) => <path key={i} d={d} className="pc-street" />)}
            {AVENUES.map((d, i) => <g key={i}><path d={d} className="pc-ave-case" /><path d={d} className="pc-ave" /></g>)}
            <path d={AVENUES[0]} className="pc-median" />
            <path d={QUAY} className="pc-ave-case" />
            <path d={QUAY} className="pc-ave" />
            <path d={RIVER} className="pc-water" />
            <path d={RIVER} className="pc-water-edge" />

            <g className="pc-labels">
              <text x="168" y="236" transform="rotate(-8 168 236)">BAIRRO ALTO</text>
              <text x="150" y="376" transform="rotate(-8 150 376)">CHIADO</text>
              <text x="300" y="342" className="pc-lbl-hi">BAIXA</text>
              <text x="482" y="334">ALFAMA</text>
              <text x="396" y="214" className="pc-lbl-min">MOURARIA</text>
              <text x="560" y="88" transform="rotate(18 560 88)">GRAÇA</text>
              <text x="22" y="320" className="pc-lbl-min" transform="rotate(-16 22 320)">ESTRELA</text>
              <text x="112" y="70" className="pc-lbl-min" transform="rotate(-22 112 70)">PRÍNCIPE REAL</text>
              <text x="458" y="20" className="pc-lbl-min">ARROIOS</text>
              <text x="240" y="64" className="pc-road-lbl" transform="rotate(66 240 64)">Av. da Liberdade</text>
              <text x="410" y="236" className="pc-park-lbl">Castelo de S. Jorge</text>
              <text x="320" y="386" className="pc-sq-lbl">Praça do Comércio</text>
              <text x="236" y="452" className="pc-water-lbl">Rio Tejo</text>
            </g>
            <g className="pc-metro">
              {([[300, 172], [252, 322], [350, 150], [384, 404]] as const).map(([x, y]) => (
                <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><rect x="-5.5" y="-5.5" width="11" height="11" rx="3" /><text y="3.4">M</text></g>
              ))}
            </g>

            <path d={ROUTE} className="pc-route-case" />
            <path d={ROUTE} className="pc-route-bed" />
            <path d={ROUTE} className="pc-route" />

            <g transform={`translate(${SHOP[0]} ${SHOP[1]})`} className="pc-shop">
              <rect x="-10" y="-10" width="20" height="20" rx="6" />
              <path d="M-4.5 -2.5H4.5L3.6 4.5H-3.6Z M-2.2 -2.5V-4a2.2 2.2 0 0 1 4.4 0V-2.5" />
            </g>
            <g transform={`translate(${RIDER[0].toFixed(1)} ${RIDER[1].toFixed(1)})`} className="pc-rider">
              <circle r="20" className="pc-rider-halo" />
              <circle r="12.5" className="pc-rider-dot" />
              <Bike />
            </g>
            <g transform={`translate(${DOOR[0]} ${DOOR[1]})`} className="pc-pin">
              <path d="M0 0 C -13 -16 -13 -32 0 -34 C 13 -32 13 -16 0 0 Z" />
              <circle cy="-22" r="4.6" />
            </g>
          </svg>
        </ScrollDraw>

        <span className="pc-tag pc-tag-shop" style={pct(SHOP[0], SHOP[1] + 18)}><b>Pickup</b> Tinta Books</span>
        <span className="pc-tag pc-tag-door" style={pct(DOOR[0], DOOR[1] - 42)}><b>Drop-off</b> Largo da Graça 18</span>

        <div className="pc-order" aria-hidden="true">
          <span className="pc-order-id">PR-48213</span>
          <span>Box · 4.2 kg</span>
          <span className="pc-pill is-live">On the way</span>
        </div>
        <div className="pc-zoom" aria-hidden="true"><span>+</span><span>−</span><span className="pc-locate" /></div>
      </div>

      <div className="pc-eta">
        <div className="pc-eta-top">
          <span className="pc-eta-l"><span className="pc-live" />Arriving in</span>
          <b>12 min</b>
          <span className="pc-eta-by">by 13:53</span>
        </div>
        <div className="pc-eta-row">
          <span className="pc-ava pc-ava-rui" aria-hidden="true">RC</span>
          <span className="pc-eta-who"><b>Rui Carvalho</b><small>★ 4.98 · Cargo e-bike · 1.4 km left</small></span>
          <span className="pc-iconbtn" aria-label="Message Rui">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 4h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 14H9l-4 3v-3H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </span>
          <span className="pc-iconbtn" aria-label="Call Rui">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 3h3l1.5 4-2 1.2a10 10 0 0 0 4.3 4.3L13 10.5l4 1.5v3a2 2 0 0 1-2 2A13 13 0 0 1 3 5a2 2 0 0 1 2-2z" fill="currentColor" /></svg>
          </span>
        </div>
        <ol className="pc-steps">
          <li className="done"><i /><span>Booked</span><time>13:24</time></li>
          <li className="done"><i /><span>Picked up</span><time>13:41</time></li>
          <li className="now"><i /><span>On the way</span><time>Now</time></li>
          <li><i /><span>Delivered</span><time>—</time></li>
        </ol>
      </div>
    </figure>
  );
}
