import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useSettings } from '@/lib/settings';

import { PRAYER_WIDGET } from './handler';
import { PrayerWidget } from './PrayerWidget';

/** Redraws the home screen widget when the app opens or the settings change. Renders nothing. */
export function WidgetSync() {
  const { settings } = useSettings();
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    import('react-native-android-widget')
      .then(({ requestWidgetUpdate }) =>
        requestWidgetUpdate({
          widgetName: PRAYER_WIDGET,
          renderWidget: () => <PrayerWidget settings={settings} />,
        }),
      )
      .catch(() => {});
  }, [settings.place, settings.method, settings.hanafi, settings.lang]);
  return null;
}
