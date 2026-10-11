// npm run schema — writes schema/video-spec.schema.json (editor autocomplete + LLM reference).
import fs from 'node:fs';
import {z} from 'zod';
import {VideoSpec} from '../src/spec/schema';

const json = z.toJSONSchema(VideoSpec, {io: 'input', unrepresentable: 'any'});
fs.mkdirSync('schema', {recursive: true});
fs.writeFileSync('schema/video-spec.schema.json', JSON.stringify(json, null, 2) + '\n');
console.log('✔ schema/video-spec.schema.json');
