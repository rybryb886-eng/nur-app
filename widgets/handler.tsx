import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { readSettings } from '@/lib/settings';

import { PrayerWidget } from './PrayerWidget';

export const PRAYER_WIDGET = 'Prayer';

export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== PRAYER_WIDGET || widgetAction === 'WIDGET_DELETED') return;
  renderWidget(<PrayerWidget settings={await readSettings()} />);
}
