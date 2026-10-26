import { ReactNode, useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SkyScene } from "./SkyScene";

import { computeTimes } from "@/lib/prayer";
import { useSettings } from "@/lib/settings";
import { GLASS, SKY, skyPhase, SkyPhase } from "@/lib/sky";
import { useNow } from "@/lib/useNow";

export const FONT = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  arabic: "AmiriQuran_400Regular",
};

export function useSkyPhase(): SkyPhase {
  const { settings } = useSettings();
  const now = useNow(60_000);
  return useMemo(
    () =>
      skyPhase(
        computeTimes(settings.place, settings.method, settings.hanafi, now),
        now,
      ),
    [settings.place, settings.method, settings.hanafi, now],
  );
}

export function Sky({
  children,
  padTop = true,
}: {
  children: ReactNode;
  padTop?: boolean;
}) {
  const phase = useSkyPhase();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: SKY[phase].colors[0] }}>
      <SkyScene phase={phase} />
      <View style={{ flex: 1, paddingTop: padTop ? insets.top : 0 }}>
        {children}
      </View>
    </View>
  );
}

export function Glass({
  children,
  style,
  strong,
  onPress,
  enter,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  strong?: boolean;
  onPress?: () => void;
  /** Index in a list: the card slides in, staggered by this. */
  enter?: number;
}) {
  const base = [
    styles.glass,
    strong && { backgroundColor: GLASS.bgStrong },
    style,
  ];
  const entering =
    enter === undefined
      ? undefined
      : FadeInDown.delay(Math.min(enter, 12) * 60)
          .duration(450)
          .springify()
          .damping(18);
  if (onPress) {
    return (
      <Animated.View entering={entering}>
        <PressScale onPress={onPress} style={base}>
          {children}
        </PressScale>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={entering} style={base}>
      {children}
    </Animated.View>
  );
}

/** Pressable that springs down slightly while held. */
export function PressScale({
  children,
  style,
  onPress,
  hitSlop,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      onPressIn={() =>
        (scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 12, stiffness: 200 }))
      }
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

type TxtProps = TextProps & {
  size?: number;
  weight?: keyof typeof FONT;
  dim?: boolean;
  faint?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Txt({
  size = 15,
  weight = "regular",
  dim,
  faint,
  style,
  ...rest
}: TxtProps) {
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

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: "rgba(255,255,255,0.9)" },
      ]}
    >
      <Txt
        size={14}
        weight="medium"
        style={active ? { color: "#1D2A63" } : undefined}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

export function ScreenTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
