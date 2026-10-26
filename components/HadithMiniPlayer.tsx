import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Glass, Txt } from '@/components/ui';
import { BOOKS } from '@/lib/hadith';
import { useHadithPlayer } from '@/lib/hadithPlayer';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

/** Playback controls for the hadith "playlist"; renders nothing until something has been played. */
export function HadithMiniPlayer({ bottom = 0 }: { bottom?: number }) {
  const t = useT();
  const { settings } = useSettings();
  const { track, playing, loading, rate, toggle, next, prev, cycleRate } = useHadithPlayer();
  if (!track) return null;

  const book = BOOKS.find((b) => b.id === track.book)!;
  const section = book.sections.find((s) => s.n === track.section);
  const hadith = track.items[track.index];

  return (
    <View style={[styles.wrap, { bottom }]}>
      <Glass strong style={styles.inner}>
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="semibold" numberOfLines={1}>
            {t('hadithNo')}
            {hadith?.number} · {book[settings.lang]}
          </Txt>
          <Txt dim size={12} numberOfLines={1}>
            {section?.[settings.lang]}
          </Txt>
        </View>
        <Pressable onPress={cycleRate} hitSlop={8} style={styles.rate}>
          <Txt size={12} weight="semibold">
            {rate}×
          </Txt>
        </Pressable>
        <Pressable onPress={prev} hitSlop={8}>
          <Ionicons name="play-skip-back" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={toggle} style={styles.play}>
          {loading ? (
            <ActivityIndicator color="#1D2A63" />
          ) : (
            <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#1D2A63" />
          )}
        </Pressable>
        <Pressable onPress={next} hitSlop={8}>
          <Ionicons name="play-skip-forward" size={22} color="#fff" />
        </Pressable>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(13,22,64,0.92)',
  },
  rate: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  play: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
