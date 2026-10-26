import AsyncStorage from '@react-native-async-storage/async-storage';

import booksJson from '@/assets/hadith/books.json';

export type HadithSection = { n: number; kk: string; ru: string; count: number };
export type HadithBook = { id: 'bukhari' | 'muslim'; kk: string; ru: string; sections: HadithSection[] };
export type Hadith = { number: number; text: string; arabic?: string };

export const BOOKS = booksJson as HadithBook[];

const MIRRORS = [
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',
  'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions',
];

type RawSection = { hadiths: { hadithnumber: number; text: string }[] };

async function fetchEdition(edition: string, section: number): Promise<RawSection> {
  let lastError: unknown;
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}/${edition}/sections/${section}.min.json`);
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function clean(text: string) {
  return text.replace(/\\n/g, '\n').replace(/\[\d+\]/g, '').trim();
}

/** Russian hadiths of one section with the Arabic original, cached on the device after the first load. */
export async function loadSection(book: HadithBook['id'], section: number): Promise<Hadith[]> {
  const key = `nur.hadith.${book}.${section}`;
  const cached = await AsyncStorage.getItem(key).catch(() => null);
  if (cached) return JSON.parse(cached);

  const [ru, ar] = await Promise.all([
    fetchEdition(`rus-${book}`, section),
    fetchEdition(`ara-${book}`, section).catch(() => null),
  ]);
  const arabic = new Map(ar?.hadiths.map((h) => [h.hadithnumber, h.text]) ?? []);
  const list = ru.hadiths
    .filter((h) => h.text.trim())
    .map((h) => ({ number: h.hadithnumber, text: clean(h.text), arabic: arabic.get(h.hadithnumber) }));
  AsyncStorage.setItem(key, JSON.stringify(list)).catch(() => {});
  return list;
}
