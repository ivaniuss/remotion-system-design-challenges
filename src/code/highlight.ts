import type {CodeLanguage} from '../spec/vocab';

// Tiny deterministic syntax highlighter (no async, no WASM): good enough for the
// short snippets that fit in a video. One-line constructs only.

export type TokenKind = 'kw' | 'str' | 'num' | 'com' | 'fn' | 'type' | 'prop' | 'punc' | 'plain';
export type Token = {text: string; kind: TokenKind};

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const JS = words(`
  const let var function return if else for while do switch case break continue new class extends
  import from export default async await try catch finally throw typeof instanceof in of this super
  null undefined true false void yield interface type implements enum public private protected readonly
  as satisfies keyof static get set`);
const KEYWORDS: Record<CodeLanguage, Set<string>> = {
  ts: JS,
  js: JS,
  python: words(`def return if elif else for while in not and or is import from as class try except finally
    raise with lambda yield async await pass break continue None True False self global nonlocal`),
  go: words(`func return if else for range switch case break continue package import type struct interface
    map chan go defer select var const nil true false err`),
  java: words(`public private protected class interface extends implements static final void return if else for
    while new try catch finally throw throws import package this super null true false int long boolean String var record`),
  sql: words(`select from where and or not insert into values update set delete create table index on join left
    right inner outer group by order having limit offset as distinct primary key references begin commit
    rollback null is in exists union all case when then else end returning with`),
  bash: words(`if then else fi for in do done while case esac function return export local echo sudo cd`),
  json: words(`true false null`),
  yaml: words(`true false null yes no`),
  text: new Set(),
};

const COMMENT: Record<CodeLanguage, RegExp | null> = {
  ts: /^\/\/.*/,
  js: /^\/\/.*/,
  go: /^\/\/.*/,
  java: /^\/\/.*/,
  python: /^#.*/,
  bash: /^#.*/,
  yaml: /^#.*/,
  sql: /^--.*/,
  json: null,
  text: null,
};

export function tokenizeLine(line: string, lang: CodeLanguage): Token[] {
  if (lang === 'text') return [{text: line, kind: 'plain'}];
  const kw = KEYWORDS[lang];
  const caseInsensitive = lang === 'sql';
  const out: Token[] = [];
  let i = 0;
  const push = (text: string, kind: TokenKind) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({text, kind});
  };
  while (i < line.length) {
    const rest = line.slice(i);
    const com = COMMENT[lang]?.exec(rest);
    if (com) {
      push(com[0], 'com');
      break;
    }
    const str = /^(["'`])(?:\\.|(?!\1).)*\1?/.exec(rest);
    if (str) {
      // JSON/YAML keys read better as properties.
      const isKey = (lang === 'json' || lang === 'yaml') && /^\s*:/.test(rest.slice(str[0].length));
      push(str[0], isKey ? 'prop' : 'str');
      i += str[0].length;
      continue;
    }
    const num = /^\d[\d_.]*[a-zA-Z]*/.exec(rest);
    if (num) {
      push(num[0], 'num');
      i += num[0].length;
      continue;
    }
    const id = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (id) {
      const w = id[0];
      const next = rest.slice(w.length);
      const prev = line[i - 1];
      if (kw.has(caseInsensitive ? w.toLowerCase() : w)) push(w, 'kw');
      else if (/^\s*\(/.test(next)) push(w, 'fn');
      else if (prev === '.') push(w, 'prop');
      else if (/^[A-Z]/.test(w) && lang !== 'sql') push(w, 'type');
      else if (lang === 'yaml' && /^\s*:/.test(next)) push(w, 'prop');
      else push(w, 'plain');
      i += w.length;
      continue;
    }
    const ch = line[i];
    push(ch, /\s/.test(ch) ? 'plain' : 'punc');
    i++;
  }
  return out;
}

// One Dark-inspired palette, readable on the dark editor in both themes.
export const TOKEN_COLOR: Record<TokenKind, string> = {
  kw: '#C678DD',
  str: '#98C379',
  num: '#D19A66',
  com: '#7F848E',
  fn: '#61AFEF',
  type: '#E5C07B',
  prop: '#E06C75',
  punc: '#ABB2BF',
  plain: '#E6EDF3',
};
