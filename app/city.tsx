import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { FONT, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { ABROAD, KZ_SECTIONS, muftyatPlace } from '@/lib/cities';
import { nearestMuftyatCity } from '@/lib/official';
import { useT } from '@/lib/i18n';
import { Place, useSettings } from '@/lib/settings';
import { GLASS } from '@/lib/sky';

export default function CityScreen() {
  const t = useT();
  const { settings, update } = useSettings();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (place: Place) => {
    update({ place });
    router.back();
  };

  const detect = async () => {
    setError(null);
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError(t('locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lon } = pos.coords;
      let name = t('myLocation');
      let country: string | undefined;
      try {
        const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        name = addr?.city || addr?.subregion || addr?.region || name;
        country = addr?.isoCountryCode ?? undefined;
      } catch {
        // Reverse geocoding is best-effort (unsupported on web).
      }
      if (country === 'KZ') {
        // In a Muftyat city its own timetable fits exactly; elsewhere in Kazakhstan the Muftyat's
        // timetable for these very coordinates is downloaded (lib/official.ts).
        const { city, km } = nearestMuftyatCity({ lat, lon });
        choose(km < 15 ? muftyatPlace(city) : { name, lat, lon, tz: 'Asia/Aqtobe', country });
      } else {
        choose({ name, lat, lon, country });
      }
    } catch {
      setError(t('locationDenied'));
    } finally {
      setBusy(false);
    }
  };

  const q = query.trim().toLowerCase();
  const sections = [...KZ_SECTIONS, { title: t('abroad'), data: ABROAD as Place[] }]
    .map((sec) => ({ ...sec, data: q ? sec.data.filter((c) => c.name.toLowerCase().includes(q)) : sec.data }))
    .filter((sec) => sec.data.length > 0);

  return (
    <Sky>
      <ScreenTitle
        right={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        }>
        {t('chooseCity')}
      </ScreenTitle>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <Glass strong onPress={detect} style={styles.detect}>
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="navigate" size={20} color="#fff" />}
          <Txt size={16} weight="semibold">
            {busy ? t('detecting') : t('detectLocation')}
          </Txt>
        </Glass>
        {error && <Txt dim>{error}</Txt>}
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={GLASS.textDim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchCity')}
            placeholderTextColor={GLASS.textFaint}
            style={styles.input}
          />
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(c) => `${c.muftyatId ?? c.name}`}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <Txt dim size={13} weight="semibold" style={styles.section}>
            {section.title}
          </Txt>
        )}
        renderItem={({ item }) => {
          const selected = item.muftyatId
            ? item.muftyatId === settings.place.muftyatId
            : item.name === settings.place.name;
          return (
            <Pressable onPress={() => choose(item)} style={styles.row}>
              <Txt size={17} weight={selected ? 'semibold' : 'regular'} style={{ flex: 1 }}>
                {item.name}
              </Txt>
              {item.country !== 'KZ' && (
                <Txt faint size={13}>
                  {item.country}
                </Txt>
              )}
              {selected && (
                <Ionicons name="checkmark" size={20} color={GLASS.success} style={{ marginLeft: 10 }} />
              )}
            </Pressable>
          );
        }}
      />
    </Sky>
  );
}

const styles = StyleSheet.create({
  detect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GLASS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: '#fff', fontFamily: FONT.regular, fontSize: 16, paddingVertical: 12 },
  section: { marginTop: 18, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
});
