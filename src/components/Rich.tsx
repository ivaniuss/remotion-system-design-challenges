import React from 'react';

// Text with *emphasis*: the parts between asterisks get the accent treatment.
export type Segment = {text: string; em: boolean};

export function parseRich(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({text: text.slice(last, m.index), em: false});
    out.push({text: m[1], em: true});
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({text: text.slice(last), em: false});
  return out;
}

export const plain = (text: string) => text.replace(/\*([^*]+)\*/g, '$1');

// HTML version: emphasized words get a marker-style highlight.
export const Rich: React.FC<{text: string; accent: string; accentText: string}> = ({text, accent, accentText}) => (
  <>
    {parseRich(text).map((s, i) =>
      s.em ? (
        <span
          key={i}
          style={{
            background: accent,
            color: accentText,
            padding: '0 0.18em',
            borderRadius: '0.12em',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
        >
          {s.text}
        </span>
      ) : (
        <span key={i}>{s.text}</span>
      ),
    )}
  </>
);
