import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Lang } from './i18n';

export type Place = {
  name: string;
  lat: number;
  lon: number;
  /** IANA time zone; undefined means the device time zone (GPS location). */
  tz?: string;
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
  place: { name: 'Астана', lat: 51.1694, lon: 71.4491, tz: 'Asia/Aqtobe' },
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

function parse(raw: string): Settings {
  const s: Settings = { ...DEFAULTS, ...JSON.parse(raw) };
  if (s.place.tz && STALE_TZ.has(s.place.tz)) s.place = { ...s.place, tz: 'Asia/Aqtobe' };
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
};

const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, ready: false, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

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

  return <SettingsContext.Provider value={{ settings, ready, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
