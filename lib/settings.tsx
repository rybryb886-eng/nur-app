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

export type Settings = {
  lang: Lang;
  place: Place;
  method: MethodId;
  hanafi: boolean;
  quranTranslation: 'kk' | 'ru';
  translitScript: 'cyr' | 'lat';
  notifications: boolean;
  lastRead?: { surah: number; ayah: number };
};

const DEFAULTS: Settings = {
  lang: 'kk',
  place: { name: 'Астана', lat: 51.1694, lon: 71.4491, tz: 'Asia/Almaty' },
  method: 'MuslimWorldLeague',
  hanafi: true,
  quranTranslation: 'kk',
  translitScript: 'cyr',
  notifications: false,
};

const KEY = 'nur.settings.v1';

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
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
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
