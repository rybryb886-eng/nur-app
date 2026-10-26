import { loadSurahData } from '@/assets/quran';
import metaJson from '@/assets/quran/meta.json';

export type SurahMeta = {
  n: number;
  /** Cyrillic name, e.g. "Фатиха". */
  name: string;
  /** Latin name, e.g. "Al-Faatiha". */
  lat: string;
  ar: string;
  ayahs: number;
  mecca: boolean;
};

export type SurahText = {
  ar: string[];
  lat: string[];
  cyrKk: string[];
  cyrRu: string[];
  kk: string[];
  ru: string[];
};

export const SURAHS = metaJson as SurahMeta[];

export function getSurah(n: number): SurahText {
  return loadSurahData(n);
}

/** Per-ayah recitation by Mishary Rashid Alafasy. */
export function ayahAudioUrl(surah: number, ayah: number) {
  const pad = (x: number) => String(x).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${pad(surah)}${pad(ayah)}.mp3`;
}

export const BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
