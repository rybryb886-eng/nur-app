import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Share, StyleSheet, View } from 'react-native';

import { FONT, Glass, Sky, Txt } from '@/components/ui';
import { BOOKS, Hadith, HadithBook, loadSection } from '@/lib/hadith';
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
        <View style={{ width: 28 }} />
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
          data={items}
          keyExtractor={(h) => String(h.number)}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          renderItem={({ item }) => (
            <Glass style={{ marginBottom: 12, gap: 10 }}>
              <View style={styles.head}>
                <Txt size={13} weight="semibold" style={styles.badge}>
                  {t('hadithNo')}
                  {item.number}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 16 }}>
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
