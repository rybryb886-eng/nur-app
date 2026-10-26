import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, Glass, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { ayahAudioUrl, BASMALA, getSurah, SURAHS } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function SurahScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ n: string; ayah?: string }>();
  const n = Number(params.n);
  const meta = SURAHS[n - 1];
  const text = useMemo(() => getSurah(n), [n]);
  const { settings, update } = useSettings();

  const translit =
    settings.translitScript === 'lat' ? text.lat : settings.lang === 'ru' ? text.cyrRu : text.cyrKk;
  const translation = settings.quranTranslation === 'ru' ? text.ru : text.kk;

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<number | null>(null); // ayah number
  const [continuous, setContinuous] = useState(false);
  const listRef = useRef<FlatList<number>>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  const playAyah = useCallback(
    (ayah: number) => {
      player.replace({ uri: ayahAudioUrl(n, ayah) });
      player.play();
      setPlaying(ayah);
      listRef.current?.scrollToIndex({ index: ayah - 1, animated: true, viewPosition: 0.1 });
    },
    [n, player],
  );

  const stop = useCallback(() => {
    player.pause();
    setPlaying(null);
    setContinuous(false);
  }, [player]);

  useEffect(() => {
    if (!status.didJustFinish || playing === null) return;
    if (continuous && playing < meta.ayahs) playAyah(playing + 1);
    else {
      setPlaying(null);
      setContinuous(false);
    }
  }, [status.didJustFinish]);

  // Jump to a saved position once the list has laid out.
  useEffect(() => {
    const start = Number(params.ayah);
    if (!start || start < 2) return;
    const id = setTimeout(() => listRef.current?.scrollToIndex({ index: start - 1, animated: false }), 300);
    return () => clearTimeout(id);
  }, [params.ayah]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: { item: number }[] }) => {
    const first = viewableItems[0]?.item;
    if (first) update({ lastRead: { surah: n, ayah: first } });
  }).current;

  const ayahNumbers = useMemo(() => Array.from({ length: meta.ayahs }, (_, i) => i + 1), [meta.ayahs]);
  const showBasmala = n !== 1 && n !== 9;

  return (
    <Sky>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={18} weight="semibold">
            {meta.n}. {meta.name}
          </Txt>
          <Txt dim size={13}>
            {meta.mecca ? t('meccan') : t('medinan')} · {meta.ayahs} {t('ayahs')}
          </Txt>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={listRef}
        data={ayahNumbers}
        keyExtractor={(a) => String(a)}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onScrollToIndexFailed={(info) =>
          setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 200)
        }
        ListHeaderComponent={
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Txt style={styles.surahArabic}>{meta.ar}</Txt>
            {showBasmala && <Txt style={styles.basmala}>{BASMALA}</Txt>}
            <Txt faint size={12} style={{ textAlign: 'center', marginTop: 4 }}>
              {t('translitNote')}
            </Txt>
          </View>
        }
        renderItem={({ item: ayah }) => {
          const active = playing === ayah;
          return (
            <Glass strong={active} style={[styles.ayah, active && { borderColor: '#FFE6B0' }]}>
              <View style={styles.ayahHeader}>
                <View style={styles.ayahNo}>
                  <Txt size={12} weight="semibold">
                    {n}:{ayah}
                  </Txt>
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={() => (active && status.playing ? stop() : playAyah(ayah))}>
                  <Ionicons
                    name={active && status.playing ? 'pause-circle' : 'play-circle-outline'}
                    size={30}
                    color="#fff"
                  />
                </Pressable>
              </View>
              <Txt style={styles.arabic}>{text.ar[ayah - 1]}</Txt>
              <Txt size={16} weight="medium" style={styles.translit}>
                {translit[ayah - 1]}
              </Txt>
              <Txt dim size={15} style={{ lineHeight: 22 }}>
                {translation[ayah - 1]}
              </Txt>
            </Glass>
          );
        }}
      />

      <View style={[styles.player, { paddingBottom: insets.bottom + 12 }]}>
        <Glass strong style={styles.playerInner}>
          <Pressable
            onPress={() => {
              if (playing !== null && status.playing) stop();
              else {
                setContinuous(true);
                const resume = settings.lastRead?.surah === n ? settings.lastRead.ayah : 1;
                playAyah(playing ?? resume);
              }
            }}
            style={styles.playBtn}>
            <Ionicons name={playing !== null && status.playing ? 'pause' : 'play'} size={24} color="#1D2A63" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt size={15} weight="semibold">
              {playing !== null ? `${meta.name}, ${playing} ${t('ayah')}` : t('playAll')}
            </Txt>
            <Txt dim size={13}>
              {status.isBuffering ? t('loading') : t('reciter')}
            </Txt>
          </View>
        </Glass>
      </View>
    </Sky>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  surahArabic: { fontFamily: FONT.arabic, fontSize: 34, lineHeight: 70 },
  basmala: { fontFamily: FONT.arabic, fontSize: 26, lineHeight: 56, marginTop: 4 },
  ayah: { marginBottom: 12, gap: 10 },
  ayahHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ayahNo: { backgroundColor: GLASS.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  arabic: {
    fontFamily: FONT.arabic,
    fontSize: 28,
    lineHeight: 60,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translit: { color: '#FFE6B0', lineHeight: 23 },
  player: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(13,22,64,0.92)',
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
