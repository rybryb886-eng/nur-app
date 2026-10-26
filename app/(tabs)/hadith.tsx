import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Chip, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { BOOKS, HadithBook } from '@/lib/hadith';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function HadithScreen() {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.lang;
  const [bookId, setBookId] = useState<HadithBook['id']>('bukhari');
  const book = BOOKS.find((b) => b.id === bookId)!;

  return (
    <Sky>
      <ScreenTitle>{t('hadithTitle')}</ScreenTitle>
      <FlatList
        data={book.sections}
        keyExtractor={(s) => String(s.n)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {BOOKS.map((b) => (
                <Chip key={b.id} label={b[lang]} active={b.id === bookId} onPress={() => setBookId(b.id)} />
              ))}
            </View>
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
            <Ionicons name="chevron-forward" size={18} color={GLASS.textFaint} />
          </Pressable>
        )}
      />
    </Sky>
  );
}

const styles = StyleSheet.create({
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
