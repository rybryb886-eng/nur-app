import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FONT, Glass, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { GUIDES, Recitation, SOURCE } from '@/lib/learn';
import { SURAHS } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

const GOLD = '#FFE6B0';

function RecitationBox({ r, lang }: { r: Recitation; lang: 'kk' | 'ru' }) {
  return (
    <View style={styles.recite}>
      <Txt style={styles.arabic}>{r.ar}</Txt>
      <Txt size={15} weight="medium" style={{ color: GOLD, lineHeight: 22 }}>
        {r.tr[lang]}
      </Txt>
      <Txt dim size={14} style={{ lineHeight: 20 }}>
        {r.meaning[lang]}
      </Txt>
    </View>
  );
}

export default function GuideScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const lang = settings.lang;
  const guide = GUIDES.find((g) => g.id === id) ?? GUIDES[0];

  return (
    <Sky>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Txt size={18} weight="semibold" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {guide.title[lang]}
        </Txt>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 4,
          paddingBottom: 80,
        }}>
        <Glass enter={0} style={{ marginBottom: 16 }}>
          <Txt size={15} style={{ lineHeight: 22 }}>
            {guide.intro[lang]}
          </Txt>
        </Glass>

        {guide.rakats && (
          <Glass enter={1} style={{ marginBottom: 16, paddingVertical: 8 }}>
            <Txt dim size={13} weight="semibold" style={styles.tableTitle}>
              {t('rakats')}
            </Txt>
            {guide.rakats.map((row, i) => (
              <View key={i} style={[styles.tableRow, i < guide.rakats!.length - 1 && styles.border]}>
                <Txt size={15} weight="semibold" style={{ width: 70 }}>
                  {row.prayer[lang]}
                </Txt>
                <View style={styles.parts}>
                  {row.parts.map((p, j) => (
                    <View
                      key={j}
                      style={[
                        styles.part,
                        p.kind === 'fard' && styles.partFard,
                        p.kind === 'wajib' && styles.partWajib,
                        p.optional && { opacity: 0.55 },
                      ]}>
                      <Txt
                        size={13}
                        weight="semibold"
                        style={p.kind === 'fard' ? { color: '#1D2A63' } : undefined}>
                        {p.count} {t(p.kind)}
                      </Txt>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </Glass>
        )}

        {guide.steps.map((step, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(150 + Math.min(i, 8) * 70).duration(450)}
            style={styles.step}>
            <View style={styles.rail}>
              <View style={styles.dot}>
                <Txt size={13} weight="bold" style={{ color: '#1D2A63' }}>
                  {i + 1}
                </Txt>
              </View>
              {i < guide.steps.length - 1 && <View style={styles.line} />}
            </View>
            <Glass style={{ flex: 1, marginBottom: 14, gap: 8 }}>
              <Txt size={16} weight="semibold">
                {step.title[lang]}
              </Txt>
              {step.image && (
                <Image source={step.image} style={styles.image} contentFit="cover" transition={200} />
              )}
              <Txt dim size={14} style={{ lineHeight: 21 }}>
                {step.text[lang]}
              </Txt>
              {step.recite && <RecitationBox r={step.recite} lang={lang} />}
              {step.surah && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/surah/[n]',
                      params: { n: step.surah! },
                    })
                  }
                  style={styles.surahLink}>
                  <Ionicons name="play-circle" size={20} color={GOLD} />
                  <Txt size={14} weight="medium" style={{ color: GOLD }}>
                    {SURAHS[step.surah - 1].name}
                  </Txt>
                </Pressable>
              )}
            </Glass>
          </Animated.View>
        ))}

        {guide.notes?.map((note, i) => (
          <Glass key={i} style={{ marginTop: 4, marginBottom: 10, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="information-circle-outline" size={20} color={GOLD} />
              <Txt size={15} weight="semibold">
                {note.title[lang]}
              </Txt>
            </View>
            <Txt dim size={14} style={{ lineHeight: 21 }}>
              {note.text[lang]}
            </Txt>
          </Glass>
        ))}

        <Pressable onPress={() => Linking.openURL(SOURCE.url)} style={styles.source}>
          <Ionicons name="book-outline" size={16} color={GLASS.textDim} />
          <View style={{ flex: 1 }}>
            <Txt dim size={12}>
              {t('source')}: {SOURCE.title[lang]}
            </Txt>
            <Txt faint size={12}>
              {SOURCE.note[lang]}
            </Txt>
          </View>
        </Pressable>
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  source: { flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 4 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
  parts: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  part: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: GLASS.bgStrong,
  },
  partFard: { backgroundColor: GOLD },
  partWajib: { backgroundColor: 'rgba(124,242,176,0.35)' },
  step: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255,230,176,0.3)',
    marginVertical: 4,
  },
  recite: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginTop: 2,
  },
  arabic: {
    fontFamily: FONT.arabic,
    fontSize: 24,
    lineHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  surahLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});
