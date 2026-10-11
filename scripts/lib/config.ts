import fs from 'node:fs';
import path from 'node:path';

export type VoiceMode = 'auto' | 'edge' | 'none';
export type ProjectConfig = {
  handle: string | null;
  cta: string | null;
  formats: ('vertical' | 'horizontal')[];
  captions: {vertical: boolean; horizontal: boolean};
  voice: {mode: VoiceMode; rate: string; voices: Record<string, string>};
  python: string;
  sfx: boolean; // sound effects on pops, packets, errors, successes
  music: {file: string; volume: number} | null; // file inside public/, e.g. "music/track.mp3"
};

const DEFAULTS: ProjectConfig = {
  handle: null,
  cta: null,
  formats: ['vertical'],
  captions: {vertical: true, horizontal: false},
  voice: {
    mode: 'auto',
    rate: '+10%',
    voices: {en: 'en-US-AndrewNeural', es: 'es-MX-JorgeNeural', pt: 'pt-BR-AntonioNeural'},
  },
  python: 'python3',
  sfx: true,
  music: null,
};

// `pack` applies the overrides in "packs": {"science": {"handle": …, "cta": …, "voice": …}}
// on top of the shared settings, so each topic can have its own channel identity.
export function loadConfig(root = process.cwd(), pack?: string): ProjectConfig {
  const file = path.join(root, 'video.config.json');
  if (!fs.existsSync(file)) return DEFAULTS;
  const base = JSON.parse(fs.readFileSync(file, 'utf8'));
  const over = (pack && base.packs?.[pack]) || {};
  const raw = {
    ...base,
    ...over,
    captions: {...base.captions, ...over.captions},
    voice: {...base.voice, ...over.voice, voices: {...base.voice?.voices, ...over.voice?.voices}},
  };
  delete raw.packs;
  return {
    ...DEFAULTS,
    ...raw,
    captions: {...DEFAULTS.captions, ...raw.captions},
    voice: {...DEFAULTS.voice, ...raw.voice, voices: {...DEFAULTS.voice.voices, ...raw.voice?.voices}},
  };
}
