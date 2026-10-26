import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { distanceToMeccaKm, qiblaBearing } from '@/lib/prayer';
import { useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

const DIAL = 290;
const TOLERANCE = 5;

function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        sub = await Location.watchHeadingAsync((h) => {
          const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setHeading(value);
        });
        if (cancelled) sub.remove();
      } catch {
        setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { heading, available };
}

export default function QiblaScreen() {
  const t = useT();
  const { settings } = useSettings();
  const bearing = qiblaBearing(settings.place);
  const distance = distanceToMeccaKm(settings.place);
  const { heading, available } = useHeading();

  const live = available && heading !== null;
  const rotation = live ? -heading : 0;
  const diff = live ? ((bearing - heading + 540) % 360) - 180 : null;
  const facing = diff !== null && Math.abs(diff) <= TOLERANCE;

  const wasFacing = useRef(false);
  useEffect(() => {
    if (facing && !wasFacing.current && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasFacing.current = facing;
  }, [facing]);

  const hint = !live
    ? t('compassUnavailable')
    : facing
      ? t('facingQibla')
      : diff! > 0
        ? t('turnRight')
        : t('turnLeft');

  return (
    <Sky>
      <ScreenTitle>{t('qiblaTitle')}</ScreenTitle>
      <View style={styles.center}>
        <Txt size={64} weight="bold" style={{ fontVariant: ['tabular-nums'] }}>
          {Math.round(bearing)}°
        </Txt>
        <Txt dim>{t('qiblaFromNorth')}</Txt>

        <View style={styles.dialWrap}>
          {/* fixed pointer at the top: the direction the phone is facing */}
          <View style={styles.pointer} />
          <View
            style={[
              styles.dial,
              facing && { borderColor: GLASS.success, shadowColor: GLASS.success },
              { transform: [{ rotate: `${rotation}deg` }] },
            ]}>
            {Array.from({ length: 72 }, (_, i) => (
              <View
                key={i}
                style={[styles.tickHolder, { transform: [{ rotate: `${i * 5}deg` }] }]}>
                <View style={[styles.tick, i % 18 === 0 ? styles.tickMajor : i % 6 === 0 && styles.tickMid]} />
              </View>
            ))}
            {(['N', 'E', 'S', 'W'] as const).map((c, i) => (
              <View key={c} style={[styles.tickHolder, { transform: [{ rotate: `${i * 90}deg` }] }]}>
                <Txt weight="bold" size={16} style={[styles.cardinal, c === 'N' && { color: '#FF8A8A' }]}>
                  {c}
                </Txt>
              </View>
            ))}
            <View style={[styles.tickHolder, { transform: [{ rotate: `${bearing}deg` }] }]}>
              <View style={styles.needle} />
              <View style={styles.kaaba}>
                <MaterialCommunityIcons name="cube" size={30} color={facing ? GLASS.success : '#FFE6B0'} />
              </View>
            </View>
          </View>
          <View style={styles.hub} />
        </View>

        <Glass style={styles.hint}>
          <Ionicons
            name={facing ? 'checkmark-circle' : live ? 'navigate-circle-outline' : 'information-circle-outline'}
            size={22}
            color={facing ? GLASS.success : '#fff'}
          />
          <Txt size={15} weight="medium" style={[{ flex: 1 }, facing && { color: GLASS.success }]}>
            {hint}
          </Txt>
        </Glass>
        <Txt dim style={{ marginTop: 14 }}>
          {t('distanceToMecca')}: {distance.toLocaleString('ru-RU')} {t('km')}
        </Txt>
        {live && (
          <Txt faint size={13} style={{ marginTop: 4 }}>
            {t('holdFlat')}
          </Txt>
        )}
      </View>
    </Sky>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  dialWrap: { width: DIAL, height: DIAL, marginVertical: 28, alignItems: 'center', justifyContent: 'center' },
  dial: {
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#9DB4FF',
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  tickHolder: { position: 'absolute', top: 0, left: 0, width: DIAL, height: DIAL, alignItems: 'center' },
  tick: { width: 1, height: 7, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.35)' },
  tickMid: { height: 11, backgroundColor: 'rgba(255,255,255,0.6)' },
  tickMajor: { width: 2, height: 14, backgroundColor: '#fff' },
  cardinal: { marginTop: 24 },
  needle: {
    position: 'absolute',
    top: 70,
    width: 3,
    height: DIAL / 2 - 70,
    borderRadius: 2,
    backgroundColor: '#FFE6B0',
  },
  kaaba: { position: 'absolute', top: 36 },
  pointer: {
    position: 'absolute',
    top: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  hub: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
});
