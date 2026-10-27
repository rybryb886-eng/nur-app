import { MUFTYAT_REGIONS, MuftyatCity } from './official';
import type { Place } from './settings';

/** Display name of a Muftyat city: "Астана қаласы" → "Астана". */
export const cityName = (name: string) => name.replace(/ қаласы$/, '');

export function muftyatPlace(c: MuftyatCity): Place {
  // Kazakhstan has been on UTC+5 since March 2024; Asia/Aqtobe gives that on phones with old zone data.
  return {
    name: cityName(c.name),
    lat: c.lat,
    lon: c.lon,
    tz: 'Asia/Aqtobe',
    muftyatId: c.id,
    country: 'KZ',
  };
}

/** Cities of Kazakhstan exactly as namaz.muftyat.kz lists them, by region. */
export const KZ_SECTIONS = MUFTYAT_REGIONS.map((r) => ({
  title: r.region,
  data: r.cities.map(muftyatPlace),
}));

/** A few cities abroad, calculated with the chosen method. */
export const ABROAD: (Place & { country: string })[] = [
  { name: 'Бішкек', country: 'KG', lat: 42.8746, lon: 74.5698, tz: 'Asia/Bishkek' },
  { name: 'Ташкент', country: 'UZ', lat: 41.2995, lon: 69.2401, tz: 'Asia/Tashkent' },
  { name: 'Самарқанд', country: 'UZ', lat: 39.6542, lon: 66.9597, tz: 'Asia/Samarkand' },
  { name: 'Мәскеу', country: 'RU', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Қазан', country: 'RU', lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow' },
  { name: 'Новосибирск', country: 'RU', lat: 55.0084, lon: 82.9357, tz: 'Asia/Novosibirsk' },
  { name: 'Омбы', country: 'RU', lat: 54.9885, lon: 73.3242, tz: 'Asia/Omsk' },
  { name: 'Ыстамбұл', country: 'TR', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { name: 'Дубай', country: 'AE', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Мекке', country: 'SA', lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  { name: 'Мәдина', country: 'SA', lat: 24.4672, lon: 39.6111, tz: 'Asia/Riyadh' },
];
