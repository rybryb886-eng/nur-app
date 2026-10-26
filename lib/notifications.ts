import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { strings } from './i18n';
import { computeTimes, PrayerKey } from './prayer';
import { Settings, useSettings } from './settings';

const DAYS_AHEAD = 7; // 5 prayers x 7 days stays under iOS's 64 pending notifications.
const NOTIFY: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

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

async function reschedule(settings: Settings) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notifications) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
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
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: times[key],
          channelId: 'prayer',
        },
      });
    }
  }
}

/** Keeps scheduled adhan notifications in sync with the settings. Renders nothing. */
export function NotificationScheduler() {
  const { settings } = useSettings();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    reschedule(settings).catch(() => {});
  }, [settings.notifications, settings.place, settings.method, settings.hanafi, settings.lang]);
  return null;
}
