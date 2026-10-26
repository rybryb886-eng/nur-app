import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';

import type { MethodId, Place } from './settings';

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYERS)[number];

export const METHODS: { id: MethodId; label: string }[] = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League (18° / 17°)' },
  { id: 'Turkey', label: 'Diyanet, Türkiye' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { id: 'UmmAlQura', label: 'Umm al-Qura, Makkah' },
  { id: 'NorthAmerica', label: 'ISNA, North America' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { id: 'Dubai', label: 'Dubai' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'Singapore', label: 'Singapore' },
  { id: 'Tehran', label: 'Tehran' },
];

export function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Calendar date (y, m, d) of `at` as seen in the place's time zone. */
function localDate(at: Date, tz?: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz ?? deviceTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get('year'), get('month') - 1, get('day'));
}

export function computeTimes(place: Place, method: MethodId, hanafi: boolean, at = new Date(), dayOffset = 0) {
  const coords = new Coordinates(place.lat, place.lon);
  const params = CalculationMethod[method]();
  params.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  const day = localDate(at, place.tz);
  day.setDate(day.getDate() + dayOffset);
  const pt = new PrayerTimes(coords, day, params);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  } satisfies Record<PrayerKey, Date>;
}

export type DayTimes = ReturnType<typeof computeTimes>;

/** The upcoming prayer (sunrise excluded) and when it starts, rolling over to tomorrow's Fajr. */
export function nextPrayer(place: Place, method: MethodId, hanafi: boolean, now = new Date()) {
  const today = computeTimes(place, method, hanafi, now);
  for (const key of PRAYERS) {
    if (key === 'sunrise') continue;
    if (today[key] > now) return { key, time: today[key] };
  }
  const tomorrow = computeTimes(place, method, hanafi, now, 1);
  return { key: 'fajr' as PrayerKey, time: tomorrow.fajr };
}

/** The prayer whose time we are currently in, or null between sunrise and Dhuhr. */
export function currentPrayer(times: DayTimes, now = new Date()): PrayerKey | null {
  if (now < times.fajr) return 'isha';
  if (now >= times.isha) return 'isha';
  if (now >= times.maghrib) return 'maghrib';
  if (now >= times.asr) return 'asr';
  if (now >= times.dhuhr) return 'dhuhr';
  if (now >= times.sunrise) return null;
  return 'fajr';
}

export function formatTime(d: Date, tz?: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz ?? deviceTimeZone(),
  }).format(d);
}

export function qiblaBearing(place: Pick<Place, 'lat' | 'lon'>) {
  return Qibla(new Coordinates(place.lat, place.lon));
}

const KAABA = { lat: 21.4225, lon: 39.8262 };

export function distanceToMeccaKm(place: Pick<Place, 'lat' | 'lon'>) {
  const rad = Math.PI / 180;
  const dLat = (KAABA.lat - place.lat) * rad;
  const dLon = (KAABA.lon - place.lon) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(place.lat * rad) * Math.cos(KAABA.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const MONTHS = {
  kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};
const WEEKDAYS = {
  kk: ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

/** e.g. "Дүйсенбі, 26 қазан". Spelled out by hand: Kazakh locale data is missing on some devices. */
export function gregorianDate(at: Date, lang: 'kk' | 'ru', tz?: string) {
  const d = localDate(at, tz);
  return `${WEEKDAYS[lang][d.getDay()]}, ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

const HIJRI_MONTHS = {
  kk: ['Мұхаррам', 'Сафар', 'Рабиғул-әууәл', 'Рабиғус-сәни', 'Жұмәдәл-ула', 'Жұмәдәс-сәни', 'Ражаб', 'Шағбан', 'Рамазан', 'Шәууәл', 'Зұл-қағда', 'Зұл-хижжа'],
  ru: ['Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани', 'Джумада аль-уля', 'Джумада ас-сани', 'Раджаб', 'Шабан', 'Рамадан', 'Шавваль', 'Зуль-када', 'Зуль-хиджа'],
};

/** Tabular (arithmetical) Hijri date; can differ from the announced date by a day. */
export function hijriDate(d: Date, lang: 'kk' | 'ru') {
  const jd = Math.floor(d.getTime() / 86400000) + 2440588; // Julian day number (UTC)
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return `${day} ${HIJRI_MONTHS[lang][month - 1]} ${year}`;
}
