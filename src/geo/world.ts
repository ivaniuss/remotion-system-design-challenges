import {feature} from 'topojson-client';
import {geoArea, geoBounds, geoCentroid} from 'd3-geo';
import type {Feature, FeatureCollection, Geometry, MultiPolygon, Polygon} from 'geojson';
import type {GeometryCollection, Topology} from 'topojson-specification';
import world from 'world-atlas/countries-50m.json';

// Country shapes for `map` scenes: Natural Earth 1:50m (public domain) via the world-atlas
// package. Loaded once; each country keeps its bounds (to skip what is off screen) and the
// centroid of its largest polygon (so France's label sits in France, not between it and its
// overseas territories).

export type Country = {
  name: string;
  feature: Feature<Geometry, {name: string}>;
  bounds: [[number, number], [number, number]];
  label: [number, number];
};

const topo = world as unknown as Topology<{countries: GeometryCollection<{name: string}>}>;
const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, {name: string}>;

function largestPart(g: Geometry): Polygon | MultiPolygon | null {
  if (g.type === 'Polygon') return g;
  if (g.type !== 'MultiPolygon') return null;
  let best: Polygon | null = null;
  let area = -1;
  for (const coords of g.coordinates) {
    const p: Polygon = {type: 'Polygon', coordinates: coords};
    const a = geoArea(p);
    if (a > area) {
      area = a;
      best = p;
    }
  }
  return best;
}

export const COUNTRIES: Country[] = fc.features.map((f) => {
  const part = largestPart(f.geometry);
  return {
    name: f.properties.name,
    feature: f,
    bounds: geoBounds(f) as [[number, number], [number, number]],
    label: part ? (geoCentroid(part) as [number, number]) : (geoCentroid(f) as [number, number]),
  };
});

// Names people write that differ from Natural Earth's short names.
const ALIASES: Record<string, string> = {
  usa: 'United States of America', us: 'United States of America', 'united states': 'United States of America', america: 'United States of America',
  uk: 'United Kingdom', britain: 'United Kingdom', 'great britain': 'United Kingdom', england: 'United Kingdom',
  'czech republic': 'Czechia', 'bosnia and herzegovina': 'Bosnia and Herz.', 'dominican republic': 'Dominican Rep.',
  'central african republic': 'Central African Rep.', 'south sudan': 'S. Sudan', 'ivory coast': "Côte d'Ivoire", "cote d'ivoire": "Côte d'Ivoire",
  drc: 'Dem. Rep. Congo', 'democratic republic of the congo': 'Dem. Rep. Congo', 'republic of the congo': 'Congo',
  'north korea': 'North Korea', 'south korea': 'South Korea', korea: 'South Korea', russia: 'Russia', 'russian federation': 'Russia',
  'the netherlands': 'Netherlands', holland: 'Netherlands', 'equatorial guinea': 'Eq. Guinea', 'solomon islands': 'Solomon Is.',
  'western sahara': 'W. Sahara', 'falkland islands': 'Falkland Is.', 'french polynesia': 'Fr. Polynesia',
};

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

export function findCountry(name: string): Country | undefined {
  const k = name.trim().toLowerCase();
  return BY_NAME.get(k) ?? BY_NAME.get((ALIASES[k] ?? '').toLowerCase());
}

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);
