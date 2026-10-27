import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { FONT, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { SURAHS } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function QuranScreen() {
  const t = useT();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = q
    ? SURAHS.filter(
        (s) =>
          String(s.n) === q ||
          s.name.toLowerCase().includes(q) ||
          s.lat.toLowerCase().includes(q) ||
          s.ar.includes(query.trim()),
      )
    : SURAHS;
  const last = settings.lastRead && SURAHS[settings.lastRead.surah - 1];

  return (
    <Sky>
      <ScreenTitle>{t('quranTitle')}</ScreenTitle>
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.n)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }}>
            {last && !q && (
              <Glass
                strong
                enter={0}
                onPress={() =>
                  router.push({
                    pathname: '/surah/[n]',
                    params: { n: last.n, ayah: settings.lastRead!.ayah },
                  })
                }
                style={styles.continue}>
                <Ionicons name="bookmark" size={22} color="#FFE6B0" />
                <View style={{ flex: 1 }}>
                  <Txt dim size={13}>
                    {t('continueReading')}
                  </Txt>
                  <Txt size={17} weight="semibold">
                    {last.name}, {settings.lastRead!.ayah} {t('ayah')}
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={20} color={GLASS.textDim} />
              </Glass>
            )}
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={GLASS.textDim} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchSurah')}
                placeholderTextColor={GLASS.textFaint}
                style={styles.input}
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 14 ? FadeInDown.delay(index * 40).duration(400) : undefined}>
            <Pressable
              onPress={() => router.push({ pathname: '/surah/[n]', params: { n: item.n } })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <View style={styles.badge}>
                <View style={[styles.badgeSquare, { transform: [{ rotate: '45deg' }] }]} />
                <View style={styles.badgeSquare} />
                <Txt size={13} weight="semibold">
                  {item.n}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={17} weight="semibold">
                  {item.name}
                </Txt>
                <Txt dim size={13}>
                  {item.mecca ? t('meccan') : t('medinan')} · {item.ayahs} {t('ayahs')}
                </Txt>
              </View>
              <Txt style={styles.arabic}>{item.ar}</Txt>
            </Pressable>
          </Animated.View>
        )}
      />
    </Sky>
  );
}

const styles = StyleSheet.create({
  continue: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GLASS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: FONT.regular,
    fontSize: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
  badge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSquare: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 5,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  arabic: { fontFamily: FONT.arabic, fontSize: 20, writingDirection: 'rtl' },
});
