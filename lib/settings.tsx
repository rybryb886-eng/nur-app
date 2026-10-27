import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Lang } from './i18n';
import { ensureOfficial, nearestMuftyatCity } from './official';

export type Place = {
  name: string;
  lat: number;
  lon: number;
  /** IANA time zone; undefined means the device time zone (GPS location). */
  tz?: string;
  /** City id on namaz.muftyat.kz; its official timetable is used (see lib/official.ts). */
  muftyatId?: number;
  /** ISO country code, when known. */
  country?: string;
};

export type MethodId =
  | 'Kazakhstan'
  | 'MuslimWorldLeague'
  | 'Turkey'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'Singapore'
  | 'Tehran';

export type NotifSound = 'default' | 'chime' | 'soft' | 'silent';
export type NotifVibration = 'off' | 'short' | 'long';

export type Settings = {
  lang: Lang;
  place: Place;
  method: MethodId;
  hanafi: boolean;
  quranTranslation: 'kk' | 'ru';
  translitScript: 'cyr' | 'lat';
  notifications: boolean;
  /** Whether we already asked for notification permission on first launch. */
  notifAsked: boolean;
  notifSound: NotifSound;
  notifVibration: NotifVibration;
  lastRead?: { surah: number; ayah: number };
};

const DEFAULTS: Settings = {
  lang: 'kk',
  place: { name: 'Астана', lat: 51.133333, lon: 71.433333, tz: 'Asia/Aqtobe', muftyatId: 3, country: 'KZ' },
  method: 'Kazakhstan',
  hanafi: true,
  quranTranslation: 'kk',
  translitScript: 'cyr',
  notifications: false,
  notifAsked: false,
  notifSound: 'chime',
  notifVibration: 'short',
};

const KEY = 'nur.settings.v1';

/** Saved settings outside React, e.g. for the home screen widget's background task. */
/**
 * Kazakhstan moved to a single UTC+5 zone in March 2024, but phones with older time zone data still
 * put Asia/Almaty and Asia/Qostanay at UTC+6. Asia/Aqtobe has been UTC+5 throughout, so it gives the
 * right local time on every phone.
 */
const STALE_TZ = new Set(['Asia/Almaty', 'Asia/Qostanay']);
const KZ_ZONES = new Set([
  'Asia/Aqtobe',
  'Asia/Atyrau',
  'Asia/Oral',
  'Asia/Aqtau',
  'Asia/Qyzylorda',
  ...STALE_TZ,
]);

function parse(raw: string): Settings {
  const s: Settings = { ...DEFAULTS, ...JSON.parse(raw) };
  if (s.place.tz && STALE_TZ.has(s.place.tz)) s.place = { ...s.place, tz: 'Asia/Aqtobe' };
  // Cities picked before the Muftyat list existed: move them onto the matching Muftyat city.
  if (!s.place.muftyatId && s.place.tz && KZ_ZONES.has(s.place.tz)) {
    const { city, km } = nearestMuftyatCity(s.place);
    if (km < 25) s.place = { ...s.place, lat: city.lat, lon: city.lon, muftyatId: city.id, country: 'KZ' };
  }
  return s;
}

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? parse(raw) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

type Ctx = {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
  /** Bumped when an official timetable arrives, so prayer times get recomputed. */
  timesVersion: number;
};

const SettingsContext = createContext<Ctx>({
  settings: DEFAULTS,
  ready: false,
  update: () => {},
  timesVersion: 0,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [timesVersion, setTimesVersion] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setSettings(parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    ensureOfficial(settings.place)
      .then((changed) => changed && setTimesVersion((v) => v + 1))
      .catch(() => {});
  }, [ready, settings.place]);

  return (
    <SettingsContext.Provider value={{ settings, ready, update, timesVersion }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
