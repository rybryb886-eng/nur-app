import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, Glass, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { BASMALA, getSurah, SURAHS } from '@/lib/quran';
import { arabicWordIndex, loadTimings, locate, Position, wordCount } from '@/lib/recitation';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

const HIGHLIGHT = '#FFE6B0';
// Sleep timer steps in minutes; tapping the moon cycles through them and back to off.
const SLEEP_STEPS = [15, 30, 60];
const FADE_MS = 30_000;

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SurahScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ n: string; ayah?: string }>();
  const n = Number(params.n);
  const meta = SURAHS[n - 1];
  const text = useMemo(() => getSurah(n), [n]);
  const timings = useMemo(() => loadTimings(n), [n]);
  const { settings, update } = useSettings();

  const translit =
    settings.translitScript === 'lat' ? text.lat : settings.lang === 'ru' ? text.cyrRu : text.cyrKk;
  const translation = settings.quranTranslation === 'ru' ? text.ru : text.kk;

  // The whole surah is one recording; word timings tell which ayah and word is being recited.
  const player = useAudioPlayer(null, { updateInterval: 120 });
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);
  const pendingSeek = useRef<number | null>(null);
  const listRef = useRef<FlatList<number>>(null);
  const followRef = useRef(true);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Sleep timer. Checked on every status update, which keep coming while audio plays in the background.
  const [sleepAt, setSleepAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!sleepAt) return;
    const left = sleepAt - Date.now();
    setNow(Date.now());
    if (left <= 0) {
      player.pause();
      player.volume = 1;
      setSleepAt(null);
    } else {
      player.volume = Math.min(1, left / FADE_MS);
    }
  }, [status.currentTime, sleepAt]);
  const cycleSleep = () => {
    const minutes = sleepAt ? Math.round((sleepAt - Date.now()) / 60_000) : 0;
    const next = SLEEP_STEPS.find((m) => m > minutes);
    player.volume = 1;
    setSleepAt(next ? Date.now() + next * 60_000 : null);
  };
  const sleepLeft = sleepAt ? Math.max(1, Math.ceil((sleepAt - now) / 60_000)) : 0;

  const position: Position | null =
    loaded && status.currentTime > 0 ? locate(timings, status.currentTime * 1000, text.ar) : null;
  const currentAyah = position?.ayah ?? null;

  const playFrom = useCallback(
    (ayah: number) => {
      const ms = timings.v[ayah - 1]?.[0] ?? 0;
      if (!loaded) {
        player.replace({ uri: timings.u });
        // Lock screen controls also keep Android from stopping playback in the background.
        player.setActiveForLockScreen(true, { title: `${meta.n}. ${meta.name}`, artist: t('reciter') });
        setLoaded(true);
        pendingSeek.current = ms;
      } else {
        player.seekTo(ms / 1000);
      }
      followRef.current = true;
      player.play();
    },
    [loaded, player, timings, meta, t],
  );

  // A freshly loaded file can only seek once it has loaded.
  useEffect(() => {
    if (status.isLoaded && pendingSeek.current !== null) {
      const ms = pendingSeek.current;
      pendingSeek.current = null;
      if (ms > 0) player.seekTo(ms / 1000);
      player.play();
    }
  }, [status.isLoaded]);

  // Follow the recitation down the list and remember the place.
  useEffect(() => {
    if (!currentAyah || !status.playing) return;
    if (followRef.current) {
      listRef.current?.scrollToIndex({
        index: currentAyah - 1,
        animated: true,
        viewPosition: 0.15,
      });
    }
    update({ lastRead: { surah: n, ayah: currentAyah } });
  }, [currentAyah]);

  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0);
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
    if (first && !player.playing) update({ lastRead: { surah: n, ayah: first } });
  }).current;

  const ayahNumbers = useMemo(() => Array.from({ length: meta.ayahs }, (_, i) => i + 1), [meta.ayahs]);
  const showBasmala = n !== 1 && n !== 9;
  const playing = status.playing;

  const togglePlay = () => {
    if (playing) player.pause();
    else if (loaded && status.currentTime > 0) player.play();
    else playFrom(settings.lastRead?.surah === n ? settings.lastRead.ayah : 1);
  };

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
        extraData={position}
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        // Stop following the recitation while the reader scrolls on their own.
        onScrollBeginDrag={() => (followRef.current = false)}
        onScrollToIndexFailed={(info) =>
          setTimeout(
            () =>
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
              }),
            200,
          )
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
          const active = currentAyah === ayah;
          return (
            <Ayah
              surah={n}
              ayah={ayah}
              arabic={text.ar[ayah - 1]}
              translit={translit[ayah - 1]}
              translation={translation[ayah - 1]}
              words={wordCount(timings, ayah)}
              position={active ? position : null}
              playing={active && playing}
              onPlay={() => (active && playing ? player.pause() : playFrom(ayah))}
            />
          );
        }}
      />

      <View style={[styles.player, { paddingBottom: insets.bottom + 12 }]}>
        <Glass strong style={styles.playerInner}>
          <Pressable onPress={togglePlay} style={styles.playBtn}>
            <Ionicons name={playing ? 'pause' : 'play'} size={24} color="#1D2A63" />
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={15} weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                {currentAyah ? `${meta.name}, ${currentAyah} ${t('ayah')}` : t('playAll')}
              </Txt>
              {loaded && status.duration > 0 && (
                <Txt dim size={12} style={{ fontVariant: ['tabular-nums'] }}>
                  {formatClock(status.currentTime)} / {formatClock(status.duration)}
                </Txt>
              )}
            </View>
            {loaded && status.duration > 0 ? (
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${(status.currentTime / status.duration) * 100}%`,
                    },
                  ]}
                />
              </View>
            ) : (
              <Txt dim size={13}>
                {status.isBuffering ? t('loading') : t('reciter')}
              </Txt>
            )}
            {sleepAt !== null && (
              <Txt size={12} style={{ color: HIGHLIGHT }}>
                {t('sleepTimer')}: {sleepLeft} {t('sleepIn')}
              </Txt>
            )}
          </View>
          <Pressable
            onPress={cycleSleep}
            hitSlop={10}
            accessibilityLabel={t('sleepTimer')}
            style={[styles.sleepBtn, sleepAt !== null && styles.sleepOn]}>
            <Ionicons
              name={sleepAt ? 'moon' : 'moon-outline'}
              size={20}
              color={sleepAt ? '#1D2A63' : '#fff'}
            />
            {sleepAt !== null && (
              <Txt size={10} weight="bold" style={{ color: '#1D2A63' }}>
                {sleepLeft}
              </Txt>
            )}
          </Pressable>
        </Glass>
      </View>
    </Sky>
  );
}

const Ayah = memo(function Ayah({
  surah,
  ayah,
  arabic,
  translit,
  translation,
  words,
  position,
  playing,
  onPlay,
}: {
  surah: number;
  ayah: number;
  arabic: string;
  translit: string;
  translation: string;
  words: number;
  position: Position | null;
  playing: boolean;
  onPlay: () => void;
}) {
  const active = position !== null;

  // Arabic: the word being recited is lit up.
  const activeWord = position ? arabicWordIndex(arabic, position.word, words) : -1;
  let wordNo = -1;
  const arabicParts = arabic.split(/(\s+)/).map((part, i) => {
    const isWord = part.trim() && !/^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/.test(part);
    if (isWord) wordNo++;
    const lit = isWord && wordNo === activeWord;
    return (
      <Txt key={i} style={lit ? styles.arabicLit : undefined}>
        {part}
      </Txt>
    );
  });

  // Transliteration fills in as it is recited, up to the end of the current word.
  let cut = 0;
  if (position && position.progress > 0) {
    const at = Math.round(position.progress * translit.length);
    const space = translit.indexOf(' ', Math.max(0, at - 1));
    cut = space === -1 ? translit.length : space;
  }

  return (
    <Glass strong={active} style={[styles.ayah, active && { borderColor: HIGHLIGHT }]}>
      <View style={styles.ayahHeader}>
        <View style={styles.ayahNo}>
          <Txt size={12} weight="semibold">
            {surah}:{ayah}
          </Txt>
        </View>
        <Pressable hitSlop={10} onPress={onPlay}>
          <Ionicons name={playing ? 'pause-circle' : 'play-circle-outline'} size={30} color="#fff" />
        </Pressable>
      </View>
      <Txt style={styles.arabic}>{arabicParts}</Txt>
      <Txt size={16} weight="medium" style={styles.translit}>
        {active ? (
          <>
            <Txt size={16} weight="semibold" style={styles.translitLit}>
              {translit.slice(0, cut)}
            </Txt>
            <Txt size={16} weight="medium" style={styles.translitDim}>
              {translit.slice(cut)}
            </Txt>
          </>
        ) : (
          translit
        )}
      </Txt>
      <Txt dim size={15} style={{ lineHeight: 22 }}>
        {translation}
      </Txt>
    </Glass>
  );
});

const styles = StyleSheet.create({
  sleepBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  sleepOn: { backgroundColor: HIGHLIGHT, borderColor: HIGHLIGHT },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  surahArabic: { fontFamily: FONT.arabic, fontSize: 34, lineHeight: 70 },
  basmala: {
    fontFamily: FONT.arabic,
    fontSize: 26,
    lineHeight: 56,
    marginTop: 4,
  },
  ayah: { marginBottom: 12, gap: 10 },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahNo: {
    backgroundColor: GLASS.bg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arabic: {
    fontFamily: FONT.arabic,
    fontSize: 28,
    lineHeight: 60,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  arabicLit: { fontFamily: FONT.arabic, fontSize: 28, color: HIGHLIGHT },
  translit: { color: HIGHLIGHT, lineHeight: 23 },
  translitLit: { color: HIGHLIGHT },
  translitDim: { color: 'rgba(255,230,176,0.4)' },
  player: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
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
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  trackFill: { height: 4, backgroundColor: HIGHLIGHT },
});
