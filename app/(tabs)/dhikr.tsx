import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Chip, FONT, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { azkar, Dhikr, DhikrCategory, TASBIH } from '@/lib/azkar';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

type Mode = 'tasbih' | DhikrCategory;

function tick(strong = false) {
  if (Platform.OS === 'web') return;
  if (strong) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function DhikrScreen() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('tasbih');
  const modes: { id: Mode; label: string }[] = [
    { id: 'tasbih', label: t('tasbih') },
    { id: 'morning', label: t('morning') },
    { id: 'evening', label: t('evening') },
    { id: 'afterPrayer', label: t('afterPrayer') },
  ];

  return (
    <Sky>
      <ScreenTitle>{t('dhikrTitle')}</ScreenTitle>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {modes.map((m) => (
            <Chip key={m.id} label={m.label} active={mode === m.id} onPress={() => setMode(m.id)} />
          ))}
        </ScrollView>
      </View>
      {mode === 'tasbih' ? <Tasbih /> : <AzkarList key={mode} category={mode} />}
    </Sky>
  );
}

const RING = 250;
const STROKE = 10;

function Tasbih() {
  const t = useT();
  const { settings } = useSettings();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const dhikr = TASBIH[index];
  const kk = settings.lang === 'kk';

  const target = dhikr.count;
  // A full ring stays visible on the 33rd/100th tap, then the next round starts.
  const progress = count === 0 ? 0 : (((count - 1) % target) + 1) / target;
  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  const bounce = useSharedValue(1);
  const ripple = useSharedValue(1);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.5,
    transform: [{ scale: 1 + ripple.value * 0.35 }],
  }));

  const press = () => {
    const next = count + 1;
    setCount(next);
    const round = next % target === 0;
    tick(round);
    bounce.value = withSequence(
      withTiming(0.95, { duration: 60 }),
      withSpring(1, { damping: 8, stiffness: 260 }),
    );
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: round ? 900 : 500 });
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 120 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
        {TASBIH.map((d, i) => (
          <Pressable
            key={d.id}
            onPress={() => {
              setIndex(i);
              setCount(0);
            }}
            style={[styles.preset, i === index && styles.presetActive]}>
            <Txt style={{ fontFamily: FONT.arabic, fontSize: 18 }} numberOfLines={1}>
              {d.ar}
            </Txt>
          </Pressable>
        ))}
      </ScrollView>

      <Txt style={styles.tasbihArabic}>{dhikr.ar}</Txt>
      <Txt size={18} weight="semibold" style={{ color: '#FFE6B0', textAlign: 'center' }}>
        {kk ? dhikr.kkTr : dhikr.ruTr}
      </Txt>
      <Txt dim style={{ textAlign: 'center', marginTop: 4, paddingHorizontal: 24 }}>
        {kk ? dhikr.kk : dhikr.ru}
      </Txt>

      <Pressable onPress={press}>
        <Animated.View style={[styles.ripple, rippleStyle]} pointerEvents="none" />
        <Animated.View style={[styles.ringWrap, ringStyle]}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={STROKE}
              fill="rgba(255,255,255,0.08)"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              stroke="#FFFFFF"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Txt size={72} weight="bold" style={{ fontVariant: ['tabular-nums'] }}>
            {count}
          </Txt>
          <Txt dim>
            {Math.floor(count / target)} × {target}
          </Txt>
        </Animated.View>
      </Pressable>
      <Txt faint size={13}>
        {t('tapToCount')}
      </Txt>
      <Pressable onPress={() => setCount(0)} style={styles.reset}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <Txt size={14} weight="medium">
          {t('reset')}
        </Txt>
      </Pressable>
    </ScrollView>
  );
}

function AzkarList({ category }: { category: DhikrCategory }) {
  const t = useT();
  const { settings } = useSettings();
  const items = useMemo(() => azkar(category), [category]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const kk = settings.lang === 'kk';

  const press = (d: Dhikr) => {
    const current = counts[d.id] ?? 0;
    if (current >= d.count) return;
    setCounts({ ...counts, [d.id]: current + 1 });
    tick(current + 1 === d.count);
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(d) => d.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      ListFooterComponent={
        <Pressable onPress={() => setCounts({})} style={[styles.reset, { alignSelf: 'center' }]}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Txt size={14} weight="medium">
            {t('reset')}
          </Txt>
        </Pressable>
      }
      renderItem={({ item, index }) => {
        const c = counts[item.id] ?? 0;
        const done = c >= item.count;
        return (
          <Glass enter={index} onPress={() => press(item)} style={[styles.card, done && { opacity: 0.6 }]}>
            <Txt style={styles.cardArabic}>{item.ar}</Txt>
            <Txt size={15} weight="medium" style={{ color: '#FFE6B0', lineHeight: 22 }}>
              {kk ? item.kkTr : item.ruTr}
            </Txt>
            <Txt dim size={14} style={{ lineHeight: 21 }}>
              {kk ? item.kk : item.ru}
            </Txt>
            <View style={styles.cardFooter}>
              <Txt faint size={12}>
                {item.source ?? ''}
              </Txt>
              <View style={[styles.counter, done && { backgroundColor: GLASS.success }]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color="#0D1640" />
                ) : (
                  <Txt size={14} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
                    {c} / {item.count}
                  </Txt>
                )}
              </View>
            </View>
          </Glass>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  presets: { paddingHorizontal: 20, gap: 8, paddingVertical: 12 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: GLASS.bg,
    maxWidth: 220,
  },
  presetActive: {
    backgroundColor: GLASS.bgStrong,
    borderWidth: 1,
    borderColor: '#fff',
  },
  tasbihArabic: {
    fontFamily: FONT.arabic,
    fontSize: 34,
    lineHeight: 72,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  ripple: {
    position: 'absolute',
    top: 24,
    left: 0,
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: GLASS.bg,
  },
  card: { marginBottom: 12, gap: 10 },
  cardArabic: {
    fontFamily: FONT.arabic,
    fontSize: 24,
    lineHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    minWidth: 64,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: GLASS.bgStrong,
  },
});
