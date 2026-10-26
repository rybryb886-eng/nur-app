import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Chip, Glass, PressScale, ScreenTitle, Sky, Txt } from '@/components/ui';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useT } from '@/lib/i18n';
import { channelOf, CHANNELS, Sermon, thumbnail, useSermons, watchUrl } from '@/lib/sermons';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

function shortDate(iso: string, lang: 'kk' | 'ru') {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return lang === 'ru' || lang === 'kk'
    ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
    : '';
}

export default function SermonsScreen() {
  const t = useT();
  const { settings } = useSettings();
  const { items, offline, loading, refresh } = useSermons();
  const [lang, setLang] = useState<'kk' | 'ru'>(settings.lang);
  const [channel, setChannel] = useState<string | null>(null);
  const [current, setCurrent] = useState<Sermon | null>(null);
  const [blocked, setBlocked] = useState(false);

  const channels = CHANNELS.filter((c) => c.lang === lang);
  const list = useMemo(
    () => items.filter((s) => (channel ? s.channel === channel : channels.some((c) => c.id === s.channel))),
    [items, channel, lang],
  );

  const play = (s: Sermon) => {
    setBlocked(false);
    setCurrent(s);
  };
  const step = (dir: 1 | -1) => {
    if (!current) return;
    const i = list.findIndex((s) => s.id === current.id);
    const next = list[i + dir];
    if (next) play(next);
  };
  const share = (s: Sermon) =>
    Share.share({
      message: `${t('shareSermon')}: «${s.title}» — ${channelOf(s)?.name ?? ''}\n${watchUrl(s.id)}`,
    });

  return (
    <Sky>
      <ScreenTitle>{t('sermonsTitle')}</ScreenTitle>
      <View style={styles.chips}>
        <Chip label="Қазақша" active={lang === 'kk'} onPress={() => (setLang('kk'), setChannel(null))} />
        <Chip label="Русский" active={lang === 'ru'} onPress={() => (setLang('ru'), setChannel(null))} />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speakers}>
          <Chip label={t('all')} active={!channel} onPress={() => setChannel(null)} />
          {channels.map((c) => (
            <Chip key={c.id} label={c.name} active={channel === c.id} onPress={() => setChannel(c.id)} />
          ))}
        </ScrollView>
      </View>

      {current && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.player}>
          {blocked ? (
            <Pressable style={styles.blocked} onPress={() => Linking.openURL(watchUrl(current.id))}>
              <Ionicons name="logo-youtube" size={40} color="#fff" />
              <Txt size={14} weight="medium">
                YouTube
              </Txt>
            </Pressable>
          ) : (
            <YouTubePlayer videoId={current.id} onEnded={() => step(1)} onError={() => setBlocked(true)} />
          )}
          <View style={styles.playerInfo}>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="semibold" numberOfLines={2}>
                {current.title}
              </Txt>
              <Txt dim size={12}>
                {channelOf(current)?.name}
              </Txt>
            </View>
            <PressScale hitSlop={8} onPress={() => step(-1)}>
              <Ionicons name="play-skip-back" size={22} color="#fff" />
            </PressScale>
            <PressScale hitSlop={8} onPress={() => step(1)}>
              <Ionicons name="play-skip-forward" size={22} color="#fff" />
            </PressScale>
            <PressScale hitSlop={8} onPress={() => share(current)}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </PressScale>
            <PressScale hitSlop={8} onPress={() => setCurrent(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </PressScale>
          </View>
        </Animated.View>
      )}

      <FlatList
        data={list}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          paddingTop: 4,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#fff" />}
        ListHeaderComponent={
          offline ? (
            <Txt faint size={12} style={{ marginBottom: 8 }}>
              {t('offline')}
            </Txt>
          ) : undefined
        }
        ListFooterComponent={
          <Txt faint size={12} style={{ marginTop: 8, textAlign: 'center' }}>
            {t('sermonsNote')}
          </Txt>
        }
        renderItem={({ item, index }) => {
          const active = current?.id === item.id;
          return (
            <Animated.View entering={index < 10 ? FadeInDown.delay(index * 50).duration(400) : undefined}>
              <Glass
                strong={active}
                onPress={() => play(item)}
                style={[styles.row, active && { borderColor: '#FFE6B0' }]}>
                <View>
                  <Image
                    source={{ uri: thumbnail(item.id) }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={300}
                  />
                  <View style={styles.playBadge}>
                    <Ionicons name={active ? 'volume-high' : 'play'} size={14} color="#fff" />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={14} weight="semibold" numberOfLines={3}>
                    {item.title}
                  </Txt>
                  <Txt dim size={12} numberOfLines={1}>
                    {channelOf(item)?.name} · {shortDate(item.published, settings.lang)}
                  </Txt>
                </View>
                <Pressable hitSlop={10} onPress={() => share(item)}>
                  <Ionicons name="share-social-outline" size={20} color={GLASS.textDim} />
                </Pressable>
              </Glass>
            </Animated.View>
          );
        }}
      />
    </Sky>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  speakers: { gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  player: { paddingHorizontal: 20, marginBottom: 8 },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  blocked: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 120,
    height: 68,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
