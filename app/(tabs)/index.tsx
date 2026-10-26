import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { computeTimes, currentPrayer, formatTime, gregorianDate, hijriDate, nextPrayer, PRAYERS, PrayerKey } from '@/lib/prayer';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';
import { useNow } from '@/lib/useNow';

const ICONS: Record<PrayerKey, keyof typeof Ionicons.glyphMap> = {
  fajr: 'partly-sunny-outline',
  sunrise: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
};

function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function PrayerScreen() {
  const t = useT();
  const { settings } = useSettings();
  const { place, method, hanafi, lang } = settings;
  const now = useNow(1000);
  const minute = Math.floor(now.getTime() / 60_000);

  const times = useMemo(() => computeTimes(place, method, hanafi, new Date()), [place, method, hanafi, minute]);
  const next = useMemo(() => nextPrayer(place, method, hanafi, new Date()), [place, method, hanafi, minute]);
  const current = currentPrayer(times, now);

  const gregorian = gregorianDate(now, lang, place.tz);

  return (
    <Sky>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable style={styles.city} onPress={() => router.push('/city')}>
            <Ionicons name="location" size={18} color="#fff" />
            <Txt size={17} weight="semibold" numberOfLines={1}>
              {place.name}
            </Txt>
            <Ionicons name="chevron-down" size={16} color={GLASS.textDim} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </Pressable>
        </View>
        <Txt dim style={styles.dates}>
          {gregorian} · {hijriDate(now, lang)}
        </Txt>

        <View style={styles.hero}>
          <Txt dim size={15} weight="medium">
            {t('nextPrayer')}
          </Txt>
          <Txt size={30} weight="semibold" style={{ marginTop: 4 }}>
            {t(next.key)}
          </Txt>
          <Txt size={76} weight="bold" style={styles.bigTime}>
            {formatTime(next.time, place.tz)}
          </Txt>
          <View style={styles.countdown}>
            <Ionicons name="hourglass-outline" size={15} color="#fff" />
            <Txt size={15} weight="medium" style={{ fontVariant: ['tabular-nums'] }}>
              {countdown(next.time.getTime() - now.getTime())} {t('in')}
            </Txt>
          </View>
        </View>

        <Glass style={{ paddingVertical: 6 }}>
          {PRAYERS.map((key, i) => {
            const active = key === current;
            const isNext = key === next.key;
            return (
              <View
                key={key}
                style={[
                  styles.row,
                  i < PRAYERS.length - 1 && styles.rowBorder,
                  active && styles.rowActive,
                ]}>
                <Ionicons name={ICONS[key]} size={20} color={key === 'sunrise' ? GLASS.textFaint : '#fff'} />
                <Txt
                  size={17}
                  weight={active || isNext ? 'semibold' : 'regular'}
                  faint={key === 'sunrise'}
                  style={{ flex: 1, marginLeft: 14 }}>
                  {t(key)}
                </Txt>
                {isNext && <View style={styles.dot} />}
                <Txt
                  size={17}
                  weight={active || isNext ? 'semibold' : 'regular'}
                  faint={key === 'sunrise'}
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {formatTime(times[key], place.tz)}
                </Txt>
              </View>
            );
          })}
        </Glass>
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  city: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dates: { marginTop: 6 },
  hero: { alignItems: 'center', marginTop: 36, marginBottom: 32 },
  bigTime: { lineHeight: 88, marginTop: 2, fontVariant: ['tabular-nums'] },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GLASS.bg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GLASS.border },
  rowActive: { backgroundColor: GLASS.bgStrong, borderRadius: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GLASS.success, marginRight: 10 },
});
