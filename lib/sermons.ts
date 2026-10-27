import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import bundled from '@/assets/sermons.json';

/** A video of the Muftyat's «Уағыздар жинағы» playlist (see scripts/fetch/fetch-sermons.py). */
export type Sermon = {
  id: string;
  title: string;
  speaker: string;
};

export const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PL1OPjpx94Q5_lVFLV1Qp-gGTu-grRZ87Z';
// Refreshed daily by the Fetch data workflow, so new playlist videos reach the app without an update.
const LIST_URL = 'https://raw.githubusercontent.com/rybryb886-eng/nur-app/mvp/assets/sermons.json';
const CACHE_KEY = 'nur.sermons.v2';

export const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const watchUrl = (id: string) => `https://youtu.be/${id}`;

/** Title without the trailing "| Speaker" part. */
export function shortTitle(s: Sermon) {
  return s.speaker ? s.title.split('|').slice(0, -1).join('|').trim() || s.title : s.title;
}

/** Speakers with at least two videos, most frequent first. */
export function speakers(list: Sermon[]) {
  const count = new Map<string, number>();
  list.forEach((s) => s.speaker && count.set(s.speaker, (count.get(s.speaker) ?? 0) + 1));
  return [...count]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

/** Sermon list: the bundled snapshot at once, then the cached and freshly fetched lists. */
export function useSermons() {
  const [items, setItems] = useState<Sermon[]>(bundled as Sermon[]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(LIST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const fresh = (await res.json()) as Sermon[];
      if (fresh.length) {
        setItems(fresh);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
      }
      setOffline(false);
    } catch (e) {
      console.warn(`Sermon list failed: ${e}`);
      setOffline(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => raw && setItems(JSON.parse(raw)))
      .catch(() => {})
      .finally(refresh);
  }, []);

  return { items, offline, loading, refresh };
}
