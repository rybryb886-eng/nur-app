import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { RubElHizbHalo } from '@/components/RubElHizb';
import { Glass, PressScale, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import {
  computeTimes,
  currentPrayer,
  formatTime,
  gregorianDate,
  hijriDate,
  nextPrayer,
  PRAYERS,
  PrayerKey,
} from '@/lib/prayer';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';
import { useNow } from '@/lib/useNow';

const HALO = 290;
const DONATE_NUMBER = '87066631974';
const DONATE_DISPLAY = '8 706 663 19 74';

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

  const times = useMemo(
    () => computeTimes(place, method, hanafi, new Date()),
    [place, method, hanafi, minute],
  );
  const next = useMemo(() => nextPrayer(place, method, hanafi, new Date()), [place, method, hanafi, minute]);
  const current = currentPrayer(times, now);
  const prev = useMemo(() => {
    const passed = PRAYERS.filter((k) => k !== 'sunrise' && times[k] <= now).map((k) => times[k]);
    return passed.length
      ? passed[passed.length - 1]
      : computeTimes(place, method, hanafi, new Date(), -1).isha;
  }, [times, minute]);
  const progress = (now.getTime() - prev.getTime()) / Math.max(1, next.time.getTime() - prev.getTime());

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
          <RubElHizbHalo size={HALO} progress={progress} />
          <Animated.View entering={ZoomIn.duration(700).springify().damping(16)} style={styles.heroInner}>
            <Txt dim size={14} weight="medium">
              {t('nextPrayer')}
            </Txt>
            <Animated.View key={next.key} entering={FadeIn.duration(800)}>
              <Txt size={26} weight="semibold" style={{ marginTop: 2, textAlign: 'center' }}>
                {t(next.key)}
              </Txt>
            </Animated.View>
            <Txt size={60} weight="bold" style={styles.bigTime}>
              {formatTime(next.time, place.tz)}
            </Txt>
            <View style={styles.countdown}>
              <Ionicons name="hourglass-outline" size={14} color="#fff" />
              <Txt size={14} weight="medium" style={{ fontVariant: ['tabular-nums'] }}>
                {countdown(next.time.getTime() - now.getTime())} {t('in')}
              </Txt>
            </View>
          </Animated.View>
        </View>

        <Glass enter={2} style={{ paddingVertical: 6 }}>
          {PRAYERS.map((key, i) => {
            const active = key === current;
            const isNext = key === next.key;
            return (
              <Animated.View
                key={key}
                entering={FadeInDown.delay(250 + i * 70).duration(500)}
                style={[styles.row, i < PRAYERS.length - 1 && styles.rowBorder, active && styles.rowActive]}>
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
              </Animated.View>
            );
          })}
        </Glass>

        <Glass enter={4} onPress={() => router.push('/learn')} style={styles.learn}>
          <View style={styles.learnIcon}>
            <Ionicons name="school-outline" size={24} color="#FFE6B0" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={16} weight="semibold">
              {t('learnTitle')}
            </Txt>
            <Txt dim size={13}>
              {t('learnSubtitle')}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color={GLASS.textDim} />
        </Glass>

        <Donate />
      </ScrollView>
    </Sky>
  );
}

function Donate() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(DONATE_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Glass enter={5} style={styles.donate}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="heart-outline" size={20} color="#FFE6B0" />
        <Txt size={16} weight="semibold">
          {t('donateTitle')}
        </Txt>
      </View>
      <Txt dim size={14} style={{ lineHeight: 20 }}>
        {t('donateText')}
      </Txt>
      <PressScale onPress={copy} style={styles.number}>
        <Txt size={18} weight="bold" style={{ flex: 1, fontVariant: ['tabular-nums'], letterSpacing: 0.5 }}>
          {DONATE_DISPLAY}
        </Txt>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={18}
          color={copied ? GLASS.success : '#fff'}
        />
        <Txt size={13} weight="medium" style={copied ? { color: GLASS.success } : undefined}>
          {copied ? t('copied') : t('copy')}
        </Txt>
      </PressScale>
      <Txt faint size={13}>
        {t('donateThanks')}
      </Txt>
    </Glass>
  );
}

const styles = StyleSheet.create({
  learn: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  learnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,230,176,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donate: { marginTop: 16, gap: 10 },
  number: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scroll: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  city: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dates: { marginTop: 6 },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HALO,
    marginTop: 16,
    marginBottom: 20,
  },
  heroInner: { alignItems: 'center' },
  bigTime: { lineHeight: 70, fontVariant: ['tabular-nums'] },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
  rowActive: { backgroundColor: GLASS.bgStrong, borderRadius: 14 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GLASS.success,
    marginRight: 10,
  },
});
