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

export const BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
