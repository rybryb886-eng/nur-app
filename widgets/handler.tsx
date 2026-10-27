import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { ensureOfficial } from '@/lib/official';
import { readSettings } from '@/lib/settings';

import { PrayerWidget } from './PrayerWidget';

export const PRAYER_WIDGET = 'Prayer';

export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== PRAYER_WIDGET || widgetAction === 'WIDGET_DELETED') return;
  const settings = await readSettings();
  // Loads a downloaded official timetable into memory; the widget runs without the app.
  await ensureOfficial(settings.place).catch(() => {});
  renderWidget(<PrayerWidget settings={settings} />);
}
