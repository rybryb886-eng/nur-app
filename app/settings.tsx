import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { Pressable, ScrollView, StyleSheet, Switch, Vibration, View } from 'react-native';

import { Chip, Glass, ScreenTitle, Sky, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { requestNotificationPermission, VIBRATION_PATTERNS } from '@/lib/notifications';
import { METHODS } from '@/lib/prayer';
import { NotifSound, NotifVibration, useSettings } from '@/lib/settings';

const SOUND_ASSETS: Partial<Record<NotifSound, number>> = {
  chime: require('@/assets/sounds/chime.wav'),
  soft: require('@/assets/sounds/soft.wav'),
};

function previewSound(sound: NotifSound) {
  const asset = SOUND_ASSETS[sound];
  if (!asset) return;
  const player = createAudioPlayer(asset);
  player.play();
  setTimeout(() => player.remove(), 4000);
}
import { GLASS } from '@/lib/sky';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Txt dim size={13} weight="semibold" style={styles.sectionTitle}>
        {title}
      </Txt>
      <Glass>{children}</Glass>
    </View>
  );
}

export default function SettingsScreen() {
  const t = useT();
  const { settings, update } = useSettings();

  return (
    <Sky>
      <ScreenTitle
        right={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        }>
        {t('settings')}
      </ScreenTitle>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 60 }}>
        <Section title={t('language')}>
          <View style={styles.chips}>
            <Chip label="Қазақша" active={settings.lang === 'kk'} onPress={() => update({ lang: 'kk' })} />
            <Chip label="Русский" active={settings.lang === 'ru'} onPress={() => update({ lang: 'ru' })} />
          </View>
        </Section>

        <Section title={t('notifications')}>
          <View style={styles.switchRow}>
            <Txt dim size={14} style={{ flex: 1 }}>
              {t('notificationsHint')}
            </Txt>
            <Switch
              value={settings.notifications}
              onValueChange={async (on) => {
                if (on && !(await requestNotificationPermission())) return;
                update({ notifications: on });
              }}
            />
          </View>
        </Section>

        <Section title={t('notifSound')}>
          <View style={styles.chips}>
            {(
              [
                ['chime', t('soundChime')],
                ['soft', t('soundSoft')],
                ['default', t('soundDefault')],
                ['silent', t('soundSilent')],
              ] as [NotifSound, string][]
            ).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                active={settings.notifSound === id}
                onPress={() => {
                  update({ notifSound: id });
                  previewSound(id);
                }}
              />
            ))}
          </View>
        </Section>

        <Section title={t('vibration')}>
          <View style={styles.chips}>
            {(
              [
                ['short', t('vibrationShort')],
                ['long', t('vibrationLong')],
                ['off', t('vibrationOff')],
              ] as [NotifVibration, string][]
            ).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                active={settings.notifVibration === id}
                onPress={() => {
                  update({ notifVibration: id });
                  if (id !== 'off') Vibration.vibrate(VIBRATION_PATTERNS[id]);
                }}
              />
            ))}
          </View>
        </Section>

        <Section title={t('asrMethod')}>
          <View style={styles.chips}>
            <Chip label={t('hanafi')} active={settings.hanafi} onPress={() => update({ hanafi: true })} />
            <Chip label={t('shafi')} active={!settings.hanafi} onPress={() => update({ hanafi: false })} />
          </View>
        </Section>

        <Section title={t('calcMethod')}>
          {METHODS.map((m, i) => (
            <Pressable
              key={m.id}
              onPress={() => update({ method: m.id })}
              style={[styles.option, i < METHODS.length - 1 && styles.optionBorder]}>
              <Txt size={15} style={{ flex: 1 }}>
                {m.label}
              </Txt>
              {settings.method === m.id && <Ionicons name="checkmark" size={20} color={GLASS.success} />}
            </Pressable>
          ))}
        </Section>

        <Section title={t('quranTranslation')}>
          <View style={styles.chips}>
            <Chip
              label="Қазақша (Х. Алтай)"
              active={settings.quranTranslation === 'kk'}
              onPress={() => update({ quranTranslation: 'kk' })}
            />
            <Chip
              label="Русский (Э. Кулиев)"
              active={settings.quranTranslation === 'ru'}
              onPress={() => update({ quranTranslation: 'ru' })}
            />
          </View>
        </Section>

        <Section title={t('translitScript')}>
          <View style={styles.chips}>
            <Chip
              label={t('cyrillic')}
              active={settings.translitScript === 'cyr'}
              onPress={() => update({ translitScript: 'cyr' })}
            />
            <Chip
              label={t('latin')}
              active={settings.translitScript === 'lat'}
              onPress={() => update({ translitScript: 'lat' })}
            />
          </View>
        </Section>
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  optionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GLASS.border },
});
