import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeTimes } from '@/lib/prayer';
import { useSettings } from '@/lib/settings';
import { GLASS, SKY, skyPhase, SkyPhase } from '@/lib/sky';
import { useNow } from '@/lib/useNow';

export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  arabic: 'AmiriQuran_400Regular',
};

export function useSkyPhase(): SkyPhase {
  const { settings } = useSettings();
  const now = useNow(60_000);
  return useMemo(
    () => skyPhase(computeTimes(settings.place, settings.method, settings.hanafi, now), now),
    [settings.place, settings.method, settings.hanafi, now],
  );
}

// Fixed pseudo-random star field so it doesn't jump between renders.
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { top: r(1) * 70, left: r(2) * 100, size: 1 + r(3) * 2, opacity: 0.3 + r(4) * 0.7 };
});

export function Sky({ children, padTop = true }: { children: ReactNode; padTop?: boolean }) {
  const phase = useSkyPhase();
  const sky = SKY[phase];
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={sky.colors} style={StyleSheet.absoluteFill} />
      {sky.stars &&
        STARS.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
              backgroundColor: '#fff',
              opacity: s.opacity,
            }}
          />
        ))}
      <View style={{ flex: 1, paddingTop: padTop ? insets.top : 0 }}>{children}</View>
    </View>
  );
}

export function Glass({
  children,
  style,
  strong,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  strong?: boolean;
  onPress?: () => void;
}) {
  const base = [styles.glass, strong && { backgroundColor: GLASS.bgStrong }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

type TxtProps = TextProps & {
  size?: number;
  weight?: keyof typeof FONT;
  dim?: boolean;
  faint?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Txt({ size = 15, weight = 'regular', dim, faint, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          color: faint ? GLASS.textFaint : dim ? GLASS.textDim : GLASS.text,
          fontSize: size,
          fontFamily: FONT[weight],
        },
        style,
      ]}
    />
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
      <Txt size={14} weight="medium" style={active ? { color: '#1D2A63' } : undefined}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function ScreenTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <Txt size={28} weight="bold" style={{ flex: 1 }}>
        {children}
      </Txt>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: GLASS.bg,
    borderColor: GLASS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: GLASS.bg,
    borderColor: GLASS.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
