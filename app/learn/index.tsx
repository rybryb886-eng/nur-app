import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { GUIDES } from '@/lib/learn';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function LearnScreen() {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.lang;
  return (
    <Sky>
      <ScreenTitle
        right={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        }>
        {t('learnTitle')}
      </ScreenTitle>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 4,
          gap: 12,
          paddingBottom: 60,
        }}>
        {GUIDES.map((g, i) => (
          <Glass
            key={g.id}
            enter={i}
            onPress={() => router.push({ pathname: '/learn/[id]', params: { id: g.id } })}
            style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name={g.icon} size={26} color="#FFE6B0" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={17} weight="semibold">
                {g.title[lang]}
              </Txt>
              <Txt dim size={13}>
                {g.subtitle[lang]}
              </Txt>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GLASS.textDim} />
          </Glass>
        ))}
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,230,176,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
