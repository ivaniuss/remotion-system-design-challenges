import type {ColorName} from '../../spec/vocab';

// News: the actors and objects of a news story (cyberattacks, the economy, institutions,
// weather and climate). Drawn with the same kit as every pack: 200x160 box, light fills, ink
// outline, so diagrams of a news video look like the rest of the channel.
export const ICONS = [
  'hacker', 'internet', 'controller', 'technician', 'store', 'fridge', 'thermometer', 'fire',
  'agency', 'justice', 'government', 'money', 'factory',
  'world', 'wave', 'sun', 'rain', 'pin',
] as const;
export type Name = (typeof ICONS)[number];

// Values may name a common icon (user, file, chart…); checked at load time.
export const ALIASES: Record<string, string> = {
  attacker: 'hacker', attackers: 'hacker', hackers: 'hacker', criminal: 'hacker', criminals: 'hacker', ransomware: 'hacker',
  web: 'internet', online: 'internet', network: 'internet', cloud: 'internet', remote: 'internet',
  plc: 'controller', panel: 'controller', scada: 'controller', regulator: 'controller', device: 'controller', iot: 'controller',
  maintenance: 'technician', engineer: 'technician', contractor: 'technician', provider: 'technician', worker: 'technician',
  supermarket: 'store', shop: 'store', retailer: 'store', retail: 'store', business: 'store', company: 'store',
  freezer: 'fridge', refrigerator: 'fridge', cold: 'fridge', 'cold-chain': 'fridge',
  temperature: 'thermometer', heat: 'thermometer', heatwave: 'thermometer', warming: 'thermometer',
  flame: 'fire', fires: 'fire', wildfire: 'fire', blaze: 'fire',
  police: 'agency', security: 'agency', cybersecurity: 'agency', anssi: 'agency', shield: 'agency', regulator_agency: 'agency',
  court: 'justice', prosecutor: 'justice', prosecutors: 'justice', judge: 'justice', law: 'justice', investigation: 'justice',
  state: 'government', ministry: 'government', minister: 'government', parliament: 'government', eu: 'government', official: 'government',
  euros: 'money', dollars: 'money', cost: 'money', costs: 'money', losses: 'money', price: 'money', prices: 'money', economy: 'money',
  plant: 'factory', industry: 'factory', infrastructure: 'factory', power: 'factory',
  globe: 'world', earth: 'world', planet: 'world', countries: 'world', international: 'world',
  ocean: 'wave', sea: 'wave', pacific: 'wave', 'el-nino': 'wave', current: 'wave',
  sunny: 'sun', drought: 'sun', dry: 'sun',
  rainfall: 'rain', flood: 'rain', floods: 'rain', storm: 'rain', storms: 'rain', weather: 'rain',
  location: 'pin', place: 'pin', map: 'pin', city: 'pin',
};

export const COLOR: Record<Name, ColorName> = {
  hacker: 'red', internet: 'blue', controller: 'teal', technician: 'orange', store: 'yellow', fridge: 'blue',
  thermometer: 'red', fire: 'orange', agency: 'blue', justice: 'purple', government: 'gray', money: 'green',
  factory: 'gray', world: 'blue', wave: 'teal', sun: 'yellow', rain: 'blue', pin: 'red',
};

// Maps a generic node status to the illustration's own animated state.
export const STATES: Record<string, Partial<Record<Name, string>>> = {
  busy: {
    hacker: 'typing', internet: 'traffic', controller: 'busy', technician: 'working', store: 'busy',
    fridge: 'defrost', thermometer: 'rising', fire: 'flicker', agency: 'scan', justice: 'strike',
    government: 'busy', money: 'flow', factory: 'running', world: 'spinning', wave: 'swell', sun: 'blaze', rain: 'pour', pin: 'pulse',
  },
  error: {controller: 'hacked', fridge: 'hot', store: 'closed', thermometer: 'hot', money: 'loss', internet: 'down', factory: 'down', wave: 'swell'},
  warn: {fridge: 'defrost', thermometer: 'rising', controller: 'warn', money: 'loss'},
  ok: {agency: 'ok', controller: 'ok', fridge: 'cold', store: 'open', justice: 'ok'},
};

export const DEFAULT_STATE: Partial<Record<Name, string>> = {fire: 'flicker', fridge: 'cold'};
