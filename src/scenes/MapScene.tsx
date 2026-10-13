import React from 'react';
import {geoGraticule10, geoMercator, geoPath} from 'd3-geo';
import {FONT, NEWS, toneSwatch} from '../theme';
import {COUNTRIES, findCountry} from '../geo/world';
import {clamp01, easeInOut, easeOut, enter, pop} from '../video/anim';
import type {MapScene as MapSpec} from '../spec/schema';
import type {SceneProps} from './types';

// A locator map (news): the camera flies from a wide view to the place, countries light up,
// pins drop with a label. Mercator, fitted to a [[west, south], [east, north]] box that is kept
// inside the safe content area; the land is drawn full-bleed behind the header.

type Bbox = [[number, number], [number, number]];

const GRATICULE = geoGraticule10();

// Fly between two boxes: centre moves linearly, size changes geometrically (feels like a zoom).
function mixBox(a: Bbox, b: Bbox, k: number): Bbox {
  const ca = [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2];
  const cb = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
  const wa = a[1][0] - a[0][0];
  const wb = b[1][0] - b[0][0];
  const ha = a[1][1] - a[0][1];
  const hb = b[1][1] - b[0][1];
  const cx = ca[0] + (cb[0] - ca[0]) * k;
  const cy = ca[1] + (cb[1] - ca[1]) * k;
  const w = wa * Math.pow(wb / wa, k);
  const h = ha * Math.pow(hb / ha, k);
  return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy + h / 2]];
}

// The box on screen at time t: `from` → `view` at the start, then each step's `zoom`.
export function mapBoxAt(scene: Pick<MapSpec, 'view' | 'from' | 'steps'>, cues: number[], t: number): Bbox {
  const keys: {t: number; box: Bbox; dur: number}[] = [];
  if (scene.from) keys.push({t: 0, box: scene.from, dur: 0}, {t: 0.5, box: scene.view, dur: 1.8});
  else keys.push({t: 0, box: scene.view, dur: 0});
  scene.steps.forEach((st, i) => {
    if (st.zoom) keys.push({t: cues[i] ?? 0, box: st.zoom, dur: 1.4});
  });
  keys.sort((a, b) => a.t - b.t);
  let box = keys[0].box;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.t) break;
    box = mixBox(box, k.box, easeInOut(clamp01((t - k.t) / k.dur)));
  }
  return box;
}

const overlaps = (b: Bbox, v: Bbox) => b[0][0] > b[1][0] || !(b[1][0] < v[0][0] || b[0][0] > v[1][0] || b[1][1] < v[0][1] || b[0][1] > v[1][1]);

export const MapScene: React.FC<SceneProps<'map'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const W = frame.width;
  const H = frame.height;
  const c = frame.content;
  const pad = vertical ? 70 : 90;
  const box = mapBoxAt(scene, scene.cues, t);
  const proj = geoMercator().fitExtent(
    [
      [c.x + pad, c.y + pad],
      [c.x + c.w - pad, c.y + c.h - pad],
    ],
    {type: 'MultiPoint', coordinates: [box[0], box[1], [box[0][0], box[1][1]], [box[1][0], box[0][1]]]},
  );
  const path = geoPath(proj);
  // What is on screen, with a wide margin (the land runs full-bleed past the safe area).
  const w = box[1][0] - box[0][0];
  const h = box[1][1] - box[0][1];
  const cull: Bbox = [[box[0][0] - w * 1.5, box[0][1] - h * 1.5], [box[1][0] + w * 1.5, box[1][1] + h * 1.5]];

  // Highlighted countries and when each lit up.
  const lit = new Map<string, number>();
  for (const name of scene.highlight) lit.set(name.toLowerCase(), -1);
  scene.steps.forEach((st, i) => {
    const cue = scene.cues[i] ?? 0;
    if (t < cue) return;
    for (const name of st.highlight ?? []) if (!lit.has(name.toLowerCase())) lit.set(name.toLowerCase(), cue);
  });
  const litCountries = [...lit.entries()].map(([name, since]) => ({c: findCountry(name), since})).filter((x) => x.c);
  const litSet = new Map(litCountries.map((x) => [x.c!.name, x.since]));

  // Pins and the current note.
  const pins = scene.steps.flatMap((st, i) => (st.pin && t >= (scene.cues[i] ?? 0) - 0.05 ? [{...st.pin, since: scene.cues[i] ?? 0}] : []));
  let note: {text: string; tone: string; since: number} | null = null;
  scene.steps.forEach((st, i) => {
    if (st.note && t >= (scene.cues[i] ?? 0)) note = {...st.note, since: scene.cues[i] ?? 0};
  });

  const land = theme.surfaceAlt;
  const border = theme.border;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id="map-sea" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#10213F" />
            <stop offset="100%" stopColor={theme.bg} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#map-sea)" />
        <path d={path(GRATICULE) ?? ''} fill="none" stroke="#1C2E52" strokeWidth={1.2} />
        {COUNTRIES.map((ct) => {
          if (!overlaps(ct.bounds, cull)) return null;
          const since = litSet.get(ct.name);
          const k = since === undefined ? 0 : since < 0 ? 1 : easeOut(clamp01((t - since) / 0.6));
          return (
            <path
              key={ct.name}
              d={path(ct.feature) ?? ''}
              fill={k > 0 ? NEWS.red : land}
              fillOpacity={k > 0 ? 0.35 + 0.55 * k : 1}
              stroke={k > 0 ? '#FF8A93' : border}
              strokeWidth={k > 0 ? 2.5 : 1.4}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      {/* country names of the lit countries */}
      {litCountries.map(({c: ct, since}) => {
        const p = proj(ct!.label);
        if (!p) return null;
        const o = since < 0 ? 1 : clamp01((t - since - 0.2) / 0.4);
        return (
          <div
            key={ct!.name}
            style={{
              position: 'absolute',
              left: p[0] - 300,
              top: p[1] - 24,
              width: 600,
              textAlign: 'center',
              opacity: o,
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: vertical ? 40 : 38,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {ct!.name}
          </div>
        );
      })}
      {pins.map((pin, i) => {
        const p = proj([pin.lon, pin.lat]);
        if (!p) return null;
        const k = pop(t, pin.since);
        const col = toneSwatch(theme, pin.tone).stroke;
        const ring = ((t - pin.since) % 1.6) / 1.6;
        // Labels alternate above and below their pin, and point away from the middle of the
        // view, so two nearby pins never cover each other.
        const mid = (proj([(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2]) ?? [W / 2, H / 2])[0];
        const right = p[0] <= mid;
        const above = i % 2 === 0;
        const lw = vertical ? 420 : 460;
        const e = enter(t, pin.since + 0.15, 0.35, 0);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: p[0] - 40 * ring - 10, top: p[1] - 40 * ring - 10, width: 20 + 80 * ring, height: 20 + 80 * ring, borderRadius: '50%', border: `4px solid ${col}`, opacity: (1 - ring) * k}} />
            <div style={{position: 'absolute', left: p[0] - 14, top: p[1] - 14, width: 28, height: 28, borderRadius: 14, background: col, border: '5px solid #FFFFFF', transform: `scale(${k})`, boxSizing: 'border-box'}} />
            <div
              style={{
                position: 'absolute',
                top: above ? p[1] - (vertical ? 96 : 90) : p[1] + 18,
                ...(right ? {left: p[0] + 22} : {left: p[0] - 22 - lw}),
                width: lw,
                display: 'flex',
                justifyContent: right ? 'flex-start' : 'flex-end',
                opacity: e.opacity,
                transform: `translateX(${(right ? -1 : 1) * (1 - e.opacity) * 20}px)`,
              }}
            >
              <div style={{background: '#FFFFFF', borderLeft: `8px solid ${col}`, padding: '8px 16px', fontFamily: FONT.sans, boxShadow: '0 6px 20px rgba(0,0,0,0.45)'}}>
                <div style={{fontWeight: 900, fontSize: vertical ? 34 : 32, color: NEWS.ink, whiteSpace: 'nowrap'}}>{pin.label}</div>
                {pin.sub && <div style={{fontWeight: 700, fontSize: vertical ? 26 : 24, color: '#4A5875', whiteSpace: 'nowrap'}}>{pin.sub}</div>}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {note && <MapNote note={note} t={t} vertical={vertical} c={c} />}
    </>
  );
};

const MapNote: React.FC<{note: {text: string; tone: string; since: number}; t: number; vertical: boolean; c: {x: number; y: number; w: number; h: number}}> = ({note, t, vertical, c}) => {
  const e = enter(t, note.since, 0.35, 16);
  return (
    <div style={{position: 'absolute', left: c.x, width: c.w, top: c.y + c.h - (vertical ? 70 : 60), display: 'flex', justifyContent: 'center', opacity: e.opacity, transform: `translateY(${e.dy}px)`}}>
      <div style={{background: NEWS.band, color: '#FFFFFF', fontFamily: FONT.sans, fontWeight: 800, fontSize: vertical ? 34 : 30, padding: '10px 22px', borderLeft: `6px solid ${NEWS.red}`}}>{note.text.replace(/\*/g, '')}</div>
    </div>
  );
};
