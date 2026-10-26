import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HadithMiniPlayer } from '@/components/HadithMiniPlayer';
import { FONT, Glass, Sky, Txt } from '@/components/ui';
import { BOOKS, Hadith, HadithBook, loadSection } from '@/lib/hadith';
import { useHadithPlayer } from '@/lib/hadithPlayer';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

export default function HadithSectionScreen() {
  const t = useT();
  const { settings } = useSettings();
  const params = useLocalSearchParams<{ book: HadithBook['id']; section: string }>();
  const book = BOOKS.find((b) => b.id === params.book)!;
  const section = book.sections.find((s) => s.n === Number(params.section))!;

  const [items, setItems] = useState<Hadith[] | null>(null);
  const [error, setError] = useState(false);
  const [showArabic, setShowArabic] = useState<Record<number, boolean>>({});

  const load = useCallback(() => {
    setError(false);
    setItems(null);
    loadSection(book.id, section.n)
      .then(setItems)
      .catch(() => setError(true));
  }, [book.id, section.n]);

  useEffect(load, [load]);

  const player = useHadithPlayer();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Hadith>>(null);
  const current =
    player.track?.book === book.id && player.track.section === section.n ? player.track.index : null;

  // Follow the reader through the list.
  useEffect(() => {
    if (current === null || !items || current >= items.length) return;
    listRef.current?.scrollToIndex({ index: current, animated: true, viewPosition: 0.1 });
  }, [current, items]);

  return (
    <Sky>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={17} weight="semibold" numberOfLines={1}>
            {section[settings.lang]}
          </Txt>
          <Txt dim size={13}>
            {book[settings.lang]}
          </Txt>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => (current !== null ? player.toggle() : items && player.play(book.id, section.n, 0, items))}>
          <Ionicons
            name={current !== null && player.playing ? 'pause-circle' : 'play-circle'}
            size={30}
            color="#fff"
          />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.center}>
          <Txt dim style={{ textAlign: 'center' }}>
            {t('loadError')}
          </Txt>
          <Glass strong onPress={load} style={{ marginTop: 16, paddingHorizontal: 24 }}>
            <Txt weight="semibold">{t('retry')}</Txt>
          </Glass>
        </View>
      ) : !items ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
          <Txt dim style={{ marginTop: 10 }}>
            {t('loading')}
          </Txt>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(h) => String(h.number)}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          onScrollToIndexFailed={(info) =>
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 200)
          }
          renderItem={({ item, index }) => (
            <Glass
              strong={current === index}
              style={[{ marginBottom: 12, gap: 10 }, current === index && { borderColor: '#FFE6B0' }]}>
              <View style={styles.head}>
                <Txt size={13} weight="semibold" style={styles.badge}>
                  {t('hadithNo')}
                  {item.number}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <Pressable hitSlop={8} onPress={() => player.play(book.id, section.n, index, items)}>
                    <Ionicons
                      name={current === index && player.playing ? 'volume-high' : 'play-circle-outline'}
                      size={22}
                      color="#fff"
                    />
                  </Pressable>
                  {item.arabic && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => setShowArabic((s) => ({ ...s, [item.number]: !s[item.number] }))}>
                      <Txt size={15} weight="semibold" style={{ fontFamily: FONT.arabic }}>
                        ع
                      </Txt>
                    </Pressable>
                  )}
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      Share.share({ message: `${item.text}\n\n${book[settings.lang]}, ${item.number}` })
                    }>
                    <Ionicons name="share-outline" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
              {showArabic[item.number] && item.arabic && <Txt style={styles.arabic}>{item.arabic}</Txt>}
              <Txt size={16} style={{ lineHeight: 24 }}>
                {item.text}
              </Txt>
            </Glass>
          )}
        />
      )}
      <HadithMiniPlayer bottom={insets.bottom + 12} />
    </Sky>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  arabic: { fontFamily: FONT.arabic, fontSize: 22, lineHeight: 46, textAlign: 'right', writingDirection: 'rtl' },
});
