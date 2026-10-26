import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import bundled from '@/assets/sermons.json';
import channelsJson from './sermonChannels.json';

export type SermonChannel = { id: string; name: string; lang: 'kk' | 'ru' };
export type Sermon = {
  id: string;
  title: string;
  channel: string;
  published: string;
};

export const CHANNELS = channelsJson as SermonChannel[];
const CACHE_KEY = 'nur.sermons.v1';

export function channelOf(s: Sermon) {
  return CHANNELS.find((c) => c.id === s.channel);
}

export const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const watchUrl = (id: string) => `https://youtu.be/${id}`;

function decode(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Latest videos of one channel from its public RSS feed (no API key needed). */
async function fetchChannel(channel: SermonChannel): Promise<Sermon[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`);
  if (!res.ok) throw new Error(String(res.status));
  const xml = await res.text();
  const out: Sermon[] = [];
  for (const entry of xml.split('<entry>').slice(1)) {
    const id = /<yt:videoId>(.*?)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(entry)?.[1];
    const published = /<published>(.*?)<\/published>/.exec(entry)?.[1] ?? '';
    if (id && title) out.push({ id, title: decode(title), channel: channel.id, published });
  }
  return out;
}

function sortNewest(list: Sermon[]) {
  return [...list].sort((a, b) => b.published.localeCompare(a.published));
}

/** Sermon list: the bundled snapshot at once, then the cached and freshly fetched feeds. */
export function useSermons() {
  const [items, setItems] = useState<Sermon[]>(() => sortNewest(bundled as Sermon[]));
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const results = await Promise.allSettled(CHANNELS.map(fetchChannel));
    const fresh = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    if (fresh.length) {
      // Keep a channel's older snapshot when only its feed failed.
      const failed = new Set(CHANNELS.filter((_, i) => results[i].status === 'rejected').map((c) => c.id));
      setItems((prev) => {
        const merged = sortNewest([...fresh, ...prev.filter((s) => failed.has(s.channel))]);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)).catch(() => {});
        return merged;
      });
      setOffline(false);
    } else {
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
