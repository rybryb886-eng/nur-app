import AsyncStorage from '@react-native-async-storage/async-storage';

import citiesJson from '@/assets/muftyat-cities.json';
import type { Place } from './settings';

/**
 * Official timetables of the Muftyat (ҚМДБ), the same ones namaz.muftyat.kz shows. Each city's year is
 * one string of 24 digits a day: HHMM of fajr, sunrise, dhuhr, asr, maghrib and isha, Kazakhstan time
 * (UTC+5). The cities of namaz.muftyat.kz are bundled for two years (scripts/fetch/fetch-muftyat-*.py);
 * other years and other places in Kazakhstan are downloaded from api.muftyat.kz and kept on the phone.
 */
export type MuftyatCity = { id: number; name: string; lat: number; lon: number; tz: number };
export const MUFTYAT_REGIONS = citiesJson as { region: string; cities: MuftyatCity[] }[];
const ALL = MUFTYAT_REGIONS.flatMap((r) => r.cities);

const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const UTC_OFFSET_H = 5;
const CACHE_PREFIX = 'nur.muftyat.v1.';

function bundled(year: number): Record<string, string> | null {
  switch (year) {
    case 2026:
      return require('@/assets/muftyat/times-2026.json');
    case 2027:
      return require('@/assets/muftyat/times-2027.json');
    default:
      return null;
  }
}

const downloaded = new Map<string, string>();
const placeKey = (place: Pick<Place, 'lat' | 'lon'>, year: number) =>
  `${year}:${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;

function table(place: Place, year: number) {
  if (place.muftyatId) {
    const t = bundled(year)?.[String(place.muftyatId)];
    if (t) return t;
  }
  return downloaded.get(placeKey(place, year));
}

function distanceKm(a: Pick<Place, 'lat' | 'lon'>, b: Pick<Place, 'lat' | 'lon'>) {
  const rad = Math.PI / 180;
  const x = (b.lon - a.lon) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return 6371 * Math.hypot(x, y);
}

/** The Muftyat city nearest to a point, with its distance in km. */
export function nearestMuftyatCity(point: Pick<Place, 'lat' | 'lon'>) {
  let best = ALL[0];
  let dist = Infinity;
  for (const c of ALL) {
    const d = distanceKm(point, c);
    if (d < dist) [best, dist] = [c, d];
  }
  return { city: best, km: dist };
}

/** Official times apply to Muftyat cities and to located places in Kazakhstan. */
export function isOfficialPlace(place: Place) {
  return !!place.muftyatId || place.country === 'KZ';
}

/** The official times of one calendar day, or null when that year's timetable isn't on the phone. */
export function officialTimes(place: Place, y: number, m: number, d: number) {
  const t = table(place, y);
  if (!t) return null;
  const dayOfYear = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86_400_000);
  const day = t.slice(dayOfYear * 24, dayOfYear * 24 + 24);
  if (day.length < 24) return null;
  const at = (i: number) =>
    new Date(
      Date.UTC(
        y,
        m,
        d,
        Number(day.slice(i * 4, i * 4 + 2)) - UTC_OFFSET_H,
        Number(day.slice(i * 4 + 2, i * 4 + 4)),
      ),
    );
  return Object.fromEntries(KEYS.map((k, i) => [k, at(i)])) as Record<(typeof KEYS)[number], Date>;
}

async function download(place: Place, year: number) {
  // The API matches the coordinates of namaz.muftyat.kz as written there, always with 6 decimals.
  const res = await fetch(
    `https://api.muftyat.kz/prayer-times/${year}/${place.lat.toFixed(6)}/${place.lon.toFixed(6)}`,
  );
  if (!res.ok) throw new Error(String(res.status));
  const { result } = (await res.json()) as { result: (Record<string, string> & { Date: string })[] };
  const days = [...result].sort((a, b) => a.Date.localeCompare(b.Date));
  return days.map((day) => KEYS.map((k) => day[k].replace(':', '')).join('')).join('');
}

/**
 * Makes sure this year's and next year's timetables of the place are on the phone: loads saved
 * downloads into memory and downloads what is missing. Resolves true when something new arrived.
 */
export async function ensureOfficial(place: Place, now = new Date()): Promise<boolean> {
  if (!isOfficialPlace(place)) return false;
  let changed = false;
  for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
    if (table(place, year)) continue;
    const key = placeKey(place, year);
    try {
      let t = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!t) {
        t = await download(place, year);
        AsyncStorage.setItem(CACHE_PREFIX + key, t).catch(() => {});
      }
      downloaded.set(key, t);
      changed = true;
    } catch (e) {
      console.warn(`Muftyat timetable ${key}: ${e}`);
    }
  }
  return changed;
}
