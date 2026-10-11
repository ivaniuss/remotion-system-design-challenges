// Word-level helpers: normalization, phrase search, timing estimation and
// alignment of a recorded transcript against the script. Pure functions.

export type Word = {w: string; start: number; end: number};

// Lowercase, strip accents and punctuation: "¿Cómo" -> "como", "504," -> "504".
export const norm = (s: string) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

// Index of the first word of `phrase` inside `words` at or after `from`, or -1.
export function findPhrase(words: string[], phrase: string, from = 0): number {
  const target = splitWords(phrase).map(norm).filter(Boolean);
  if (target.length === 0) return -1;
  const normed = words.map(norm);
  // Only compare words that still have content after normalization ("—", "…").
  const idx: number[] = [];
  normed.forEach((n, i) => {
    if (n) idx.push(i);
  });
  const startK = idx.findIndex((i) => i >= from);
  if (startK < 0) return -1;
  for (let k = startK; k + target.length <= idx.length; k++) {
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (normed[idx[k + j]] !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return idx[k];
  }
  return -1;
}

// Estimated timings when there is no audio: ~2.6 words/s plus breathing pauses.
export function estimateWords(text: string, wordsPerSecond = 2.6, startAt = 0.25): Word[] {
  const out: Word[] = [];
  let t = startAt;
  for (const w of splitWords(text)) {
    // Long words take a bit longer to say.
    const len = 1 / wordsPerSecond + Math.max(0, norm(w).length - 7) * 0.03;
    out.push({w, start: round(t), end: round(t + len)});
    t += len;
    if (/[,;:]$/.test(w)) t += 0.3;
    else if (/[.?!…]$/.test(w)) t += 0.55;
  }
  return out;
}

export const round = (x: number) => Math.round(x * 1000) / 1000;

// Aligns script words to transcript words (e.g. from Whisper) with a longest-common-
// subsequence pass, then interpolates the script words that were not matched.
// Returns one {start, end} per script word.
export function alignToTranscript(script: string[], transcript: Word[]): {start: number; end: number}[] {
  const a = script.map(norm);
  const b = transcript.map((x) => norm(x.w));
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const match: number[] = new Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] && a[i] === b[j]) {
      match[i] = j;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  const out: {start: number; end: number}[] = new Array(n);
  const lastEnd = transcript.length ? transcript[transcript.length - 1].end : n * 0.38;
  for (let k = 0; k < n; k++) {
    if (match[k] >= 0) {
      const w = transcript[match[k]];
      out[k] = {start: w.start, end: w.end};
    }
  }
  // Fill gaps linearly between the closest matched neighbours.
  let k = 0;
  while (k < n) {
    if (out[k]) {
      k++;
      continue;
    }
    let e = k;
    while (e < n && !out[e]) e++;
    const left = k > 0 ? out[k - 1].end : 0;
    const right = e < n ? out[e].start : lastEnd;
    const span = Math.max(0.01, right - left);
    const count = e - k;
    for (let q = 0; q < count; q++) {
      const s = left + (span * q) / count;
      out[k + q] = {start: round(s), end: round(s + span / count)};
    }
    k = e;
  }
  return out;
}
