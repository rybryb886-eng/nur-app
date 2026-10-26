import { loadTimings, SurahTimings } from '@/assets/quran/timings';

export type { SurahTimings };
export { loadTimings };

// Pause and end-of-ayah marks that stand as separate tokens in the Uthmani text.
const MARK = /^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/;

export type Position = {
  /** 1-based ayah number. */
  ayah: number;
  /** 1-based word being recited, 0 before the first word (e.g. during the basmala). */
  word: number;
  /** Share of the ayah recited so far, from 0 to 1. */
  progress: number;
};

/** Where the recitation is at `ms` milliseconds into the surah's audio file. */
export function locate(t: SurahTimings, ms: number, arabic: string[]): Position | null {
  const v = t.v;
  let lo = 0;
  let hi = v.length - 1;
  if (!v.length || ms < v[0][0]) return null;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (v[mid][0] <= ms) lo = mid;
    else hi = mid - 1;
  }
  const [, , seg] = v[lo];
  const ayah = lo + 1;
  if (!seg.length) return { ayah, word: 0, progress: 0 };

  // The segment being recited now (or the last one already finished).
  let word = 0;
  let frac = 0;
  for (let i = 0; i < seg.length; i += 3) {
    const [w, start, end] = [seg[i], seg[i + 1], seg[i + 2]];
    if (ms < start) break;
    word = w;
    frac = ms >= end ? 1 : (ms - start) / Math.max(1, end - start);
  }
  const words = Math.max(...seg.filter((_, i) => i % 3 === 0));
  if (!word) return { ayah, word: 0, progress: 0 };

  // Weigh words by their length in the Arabic text when it splits into the same number of words,
  // so that the transliteration fills at the pace of the recitation.
  const tokens = arabicWords(arabic[lo] ?? '');
  let progress: number;
  if (tokens.length === words) {
    const lens = tokens.map((w) => w.length);
    const total = lens.reduce((a, b) => a + b, 0);
    const before = lens.slice(0, word - 1).reduce((a, b) => a + b, 0);
    progress = (before + frac * lens[word - 1]) / total;
  } else {
    progress = (word - 1 + frac) / words;
  }
  return { ayah, word, progress: Math.min(1, progress) };
}

export function arabicWords(text: string) {
  return text.split(/\s+/).filter((w) => w && !MARK.test(w));
}

/** Index into `arabicWords(text)` of the recited word `word` out of `total` words in the timings. */
export function arabicWordIndex(text: string, word: number, total: number) {
  const count = arabicWords(text).length;
  if (!word) return -1;
  if (count === total) return word - 1;
  return Math.min(count - 1, Math.floor(((word - 1) / total) * count));
}

export function wordCount(t: SurahTimings, ayah: number) {
  const seg = t.v[ayah - 1]?.[2] ?? [];
  return seg.length ? Math.max(...seg.filter((_, i) => i % 3 === 0)) : 0;
}
