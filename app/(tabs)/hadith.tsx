import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HadithMiniPlayer } from '@/components/HadithMiniPlayer';
import { Chip, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { BOOKS, HadithBook } from '@/lib/hadith';
import { useHadithPlayer } from '@/lib/hadithPlayer';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function HadithScreen() {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.lang;
  const [bookId, setBookId] = useState<HadithBook['id']>('bukhari');
  const book = BOOKS.find((b) => b.id === bookId)!;
  const player = useHadithPlayer();
  const insets = useSafeAreaInsets();
  const playingHere = player.track?.book === bookId;

  return (
    <Sky>
      <ScreenTitle>{t('hadithTitle')}</ScreenTitle>
      <FlatList
        data={book.sections}
        keyExtractor={(s) => String(s.n)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {BOOKS.map((b) => (
                <Chip key={b.id} label={b[lang]} active={b.id === bookId} onPress={() => setBookId(b.id)} />
              ))}
            </View>
            <Glass
              strong
              onPress={() => (playingHere ? player.toggle() : player.play(bookId, book.sections[0].n))}
              style={styles.listen}>
              <Ionicons
                name={playingHere && player.playing ? 'pause-circle' : 'play-circle'}
                size={36}
                color="#fff"
              />
              <View style={{ flex: 1 }}>
                <Txt size={16} weight="semibold">
                  {t('listen')}: {book[lang]}
                </Txt>
                <Txt dim size={12}>
                  {t('listenNote')}
                </Txt>
              </View>
            </Glass>
            {lang === 'kk' && (
              <Glass style={styles.note}>
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
                <Txt dim size={13} style={{ flex: 1 }}>
                  {t('hadithLangNote')}
                </Txt>
              </Glass>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/hadith/[book]/[section]', params: { book: bookId, section: item.n } })
            }
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <Txt faint size={13} style={styles.num}>
              {item.n}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="medium">
                {item[lang]}
              </Txt>
              <Txt dim size={13}>
                {item.count} хадис
              </Txt>
            </View>
            <Pressable hitSlop={10} onPress={() => player.play(bookId, item.n)}>
              <Ionicons
                name={
                  playingHere && player.track?.section === item.n && player.playing
                    ? 'volume-high'
                    : 'play-circle-outline'
                }
                size={24}
                color="#fff"
              />
            </Pressable>
          </Pressable>
        )}
      />
      <HadithMiniPlayer bottom={insets.bottom + 58} />
    </Sky>
  );
}

const styles = StyleSheet.create({
  listen: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
  num: { width: 26, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
