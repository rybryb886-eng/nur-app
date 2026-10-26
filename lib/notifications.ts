import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { strings } from './i18n';
import { computeTimes, PrayerKey } from './prayer';
import { NotifSound, NotifVibration, Settings, useSettings } from './settings';

const DAYS_AHEAD = 7; // 5 prayers x 7 days stays under iOS's 64 pending notifications.
const NOTIFY: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Bundled tones (assets/sounds, registered with the expo-notifications config plugin). */
export const SOUND_FILES: Partial<Record<NotifSound, string>> = { chime: 'chime.wav', soft: 'soft.wav' };

export const VIBRATION_PATTERNS: Record<NotifVibration, number[]> = {
  off: [],
  short: [0, 250, 150, 250],
  long: [0, 600, 300, 600, 300, 600],
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Android fixes a channel's sound and vibration once it is created, so every combination gets
 * its own channel and the scheduled notifications point at the one matching the settings.
 */
async function ensureChannel(sound: NotifSound, vibration: NotifVibration) {
  const id = `prayer-${sound}-${vibration}`;
  if (Platform.OS !== 'android') return id;
  await Notifications.setNotificationChannelAsync(id, {
    name: 'Намаз уақыты',
    importance: Notifications.AndroidImportance.HIGH,
    sound: sound === 'silent' ? null : (SOUND_FILES[sound] ?? 'default'),
    enableVibrate: vibration !== 'off',
    vibrationPattern: vibration === 'off' ? null : VIBRATION_PATTERNS[vibration],
  });
  return id;
}

async function reschedule(settings: Settings) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notifications) return;
  const channelId = await ensureChannel(settings.notifSound, settings.notifVibration);
  const sound = settings.notifSound === 'silent' ? false : (SOUND_FILES[settings.notifSound] ?? 'default');
  const s = strings[settings.lang];
  const now = new Date();
  for (let day = 0; day < DAYS_AHEAD; day++) {
    const times = computeTimes(settings.place, settings.method, settings.hanafi, now, day);
    for (const key of NOTIFY) {
      if (times[key] <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: s.notifTitle,
          body: s.notifBody.replace('{prayer}', s[key]),
          sound,
          vibrate: VIBRATION_PATTERNS[settings.notifVibration],
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: times[key], channelId },
      });
    }
  }
}

/**
 * Asks for notification permission on first launch (turning adhan reminders on if granted) and
 * keeps the scheduled reminders in sync with the settings. Renders nothing.
 */
export function NotificationScheduler() {
  const { settings, update } = useSettings();

  useEffect(() => {
    if (Platform.OS === 'web' || settings.notifAsked) return;
    requestNotificationPermission()
      .then((granted) => update({ notifAsked: true, notifications: granted }))
      .catch(() => update({ notifAsked: true }));
  }, [settings.notifAsked]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    reschedule(settings).catch(() => {});
  }, [
    settings.notifications,
    settings.notifSound,
    settings.notifVibration,
    settings.place,
    settings.method,
    settings.hanafi,
    settings.lang,
  ]);
  return null;
}
