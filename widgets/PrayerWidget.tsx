import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { strings } from '@/lib/i18n';
import { computeTimes, formatTime, nextPrayer, PRAYERS } from '@/lib/prayer';
import type { Settings } from '@/lib/settings';
import { SKY, skyPhase } from '@/lib/sky';

type HexColor = `#${string}`;

/** Home screen widget: city, next prayer and the day's times on the current sky gradient. */
export function PrayerWidget({ settings, now = new Date() }: { settings: Settings; now?: Date }) {
  const { place, method, hanafi, lang } = settings;
  const s = strings[lang];
  const times = computeTimes(place, method, hanafi, now);
  const next = nextPrayer(place, method, hanafi, now);
  const sky = SKY[skyPhase(times, now)];
  const [top, , , bottom] = sky.colors as HexColor[];

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 22,
        backgroundGradient: { from: top, to: bottom, orientation: 'TOP_BOTTOM' },
      }}>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text={`📍 ${place.name}`} style={{ fontSize: 13, color: '#FFFFFF' }} />
          <TextWidget
            text={`${s[next.key]} ${formatTime(next.time, place.tz)}`}
            style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' }}
          />
        </FlexWidget>
        <TextWidget text={s.nextPrayer} style={{ fontSize: 11, color: '#E0E6FF' }} />
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}>
        {PRAYERS.filter((k) => k !== 'sunrise').map((key) => {
          const active = key === next.key;
          return (
            <FlexWidget
              key={key}
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                paddingHorizontal: 6,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: active ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF00',
              }}>
              <TextWidget text={s[key]} style={{ fontSize: 11, color: '#E8ECFF' }} />
              <TextWidget
                text={formatTime(times[key], place.tz)}
                style={{ fontSize: 14, color: '#FFFFFF', fontWeight: active ? 'bold' : 'normal' }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}
