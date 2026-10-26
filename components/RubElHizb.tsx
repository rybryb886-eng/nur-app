import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Path of the eight-pointed star (two overlapping squares) centred in a size x size box. */
export function rubElHizbPath(size: number, inset = 0) {
  const c = size / 2;
  const r = c - inset;
  const square = (rot: number) =>
    [0, 1, 2, 3]
      .map((k) => {
        const a = rot + (k * Math.PI) / 2 - Math.PI / 4;
        return `${k ? 'L' : 'M'} ${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
      })
      .join(' ') + ' Z';
  return `${square(0)} ${square(Math.PI / 4)}`;
}

/** Slowly turning outlined Rub el Hizb, drawn behind the prayer countdown. */
export function RubElHizbHalo({ size, progress }: { size: number; progress: number }) {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(withTiming(360, { duration: 120_000, easing: Easing.linear }), -1);
  }, []);
  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }],
  }));
  const spinBack = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-turn.value * 0.5}deg` }],
  }));

  const ring = size / 2 - 6;
  const circumference = 2 * Math.PI * ring;

  return (
    <Animated.View style={{ position: 'absolute', width: size, height: size }} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spin]}>
        <Svg width={size} height={size}>
          <Path
            d={rubElHizbPath(size, 2)}
            stroke="#FFFFFF"
            strokeOpacity={0.22}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spinBack]}>
        <Svg width={size} height={size}>
          <Path
            d={rubElHizbPath(size, size * 0.16)}
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE6B0" />
            <Stop offset="1" stopColor="#7CF2B0" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ring}
          stroke="#FFFFFF"
          strokeOpacity={0.12}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ring}
          stroke="url(#ring)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
        />
      </Svg>
    </Animated.View>
  );
}
