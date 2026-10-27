import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { SKY, SkyPhase } from '@/lib/sky';

// Fixed pseudo-random values so the scene doesn't jump between renders.
const rand = (i: number, n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;

const STARS = Array.from({ length: 48 }, (_, i) => ({
  top: rand(i, 1) * 65,
  left: rand(i, 2) * 100,
  size: 1 + rand(i, 3) * 2.2,
  opacity: 0.35 + rand(i, 4) * 0.65,
  period: 1600 + rand(i, 5) * 2600,
  delay: rand(i, 6) * 3000,
}));

function Star({ top, left, size, opacity, period, delay }: (typeof STARS)[number]) {
  const v = useSharedValue(opacity);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(opacity * 0.2, {
            duration: period,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(opacity, {
            duration: period,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size,
        },
        { backgroundColor: '#fff' },
        style,
      ]}
    />
  );
}

/** Occasional shooting star across the night sky. */
function ShootingStar({ width }: { width: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withSequence(
        withDelay(6000, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: p.value > 0 && p.value < 1 ? 1 - p.value : 0,
    transform: [
      { translateX: width * 0.9 - p.value * width * 0.6 },
      { translateY: 60 + p.value * 140 },
      { rotate: '-35deg' },
    ],
  }));
  return (
    <Animated.View style={[styles.shooting, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', '#FFFFFF']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Sun or crescent with a slowly breathing glow, placed per part of the day. */
function Celestial({ phase, width }: { phase: SkyPhase; width: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + glow.value * 0.45,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const night = phase === 'night';
  const pos = {
    // Kept in the top band, where screens have only their title, so it never sits behind text.
    night: { top: 46, left: width * 0.74 },
    dawn: { top: 50, left: width * 0.74 },
    day: { top: 44, left: width * 0.74 },
    golden: { top: 48, left: width * 0.74 },
    sunset: { top: 52, left: width * 0.74 },
  }[phase];
  const color = {
    night: '#E8EDFF',
    dawn: '#FFE2B8',
    day: '#FFFBEA',
    golden: '#FFE09A',
    sunset: '#FFB37A',
  }[phase];
  const S = 200;

  return (
    <View
      style={{
        position: 'absolute',
        top: pos.top - S / 2,
        left: pos.left - S / 2,
        width: S,
        height: S,
      }}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={S} height={S}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={night ? 0.45 : 0.7} />
              <Stop offset="0.35" stopColor={color} stopOpacity={night ? 0.15 : 0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={S / 2} cy={S / 2} r={S / 2} fill="url(#glow)" />
        </Svg>
      </Animated.View>
      <Svg width={S} height={S} style={StyleSheet.absoluteFill}>
        {night ? (
          // Crescent: a disc with an offset disc cut out of it.
          <Path
            d={`M ${S / 2 + 3} ${S / 2 - 20} A 20 20 0 1 0 ${S / 2 + 3} ${S / 2 + 20} A 25 25 0 0 1 ${S / 2 + 3} ${S / 2 - 20} Z`}
            fill={color}
          />
        ) : (
          <Circle cx={S / 2} cy={S / 2} r={phase === 'day' ? 22 : 28} fill={color} />
        )}
      </Svg>
    </View>
  );
}

function Cloud({
  top,
  scale,
  duration,
  delay,
  width,
  opacity,
}: {
  top: number;
  scale: number;
  duration: number;
  delay: number;
  width: number;
  opacity: number;
}) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1));
  }, []);
  const w = 180 * scale;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -w + x.value * (width + w) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top, left: 0, opacity }, style]}>
      <Svg width={w} height={70 * scale} viewBox="0 0 180 70">
        <G fill="#FFFFFF">
          <Ellipse cx="60" cy="45" rx="50" ry="20" />
          <Ellipse cx="100" cy="35" rx="45" ry="28" />
          <Ellipse cx="135" cy="48" rx="38" ry="17" />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Faint eight-pointed star (Rub el Hizb) lattice over the sky. */
const Pattern = memo(function Pattern({ width, height }: { width: number; height: number }) {
  const step = 64;
  const r = 16;
  const star = (cx: number, cy: number) => {
    const sq = (rot: number) =>
      [0, 1, 2, 3]
        .map((k) => {
          const a = rot + (k * Math.PI) / 2;
          return `${k ? 'L' : 'M'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
        })
        .join(' ') + ' Z';
    return sq(0) + ' ' + sq(Math.PI / 4);
  };
  const paths: string[] = [];
  for (let y = 0; y < height + step; y += step) {
    for (let x = (y / step) % 2 ? step / 2 : 0; x < width + step; x += step) paths.push(star(x, y));
  }
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={paths.join(' ')} stroke="#FFFFFF" strokeOpacity={0.05} strokeWidth={1} fill="none" />
    </Svg>
  );
});

/** Animated sky background: gradient cross-fade between phases, stars, sun or moon, clouds. */
export function SkyScene({ phase }: { phase: SkyPhase }) {
  const { width, height } = useWindowDimensions();
  const sky = SKY[phase];
  const clouds = phase === 'day' || phase === 'golden' || phase === 'dawn';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        key={phase}
        entering={FadeIn.duration(1200)}
        exiting={FadeOut.duration(1200)}
        style={StyleSheet.absoluteFill}>
        <LinearGradient colors={sky.colors} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Pattern width={width} height={height} />
      {sky.stars && STARS.map((s, i) => <Star key={i} {...s} />)}
      {sky.stars && <ShootingStar width={width} />}
      <Celestial phase={phase} width={width} />
      {clouds && (
        <>
          <Cloud top={110} scale={1} duration={90_000} delay={0} width={width} opacity={0.35} />
          <Cloud top={200} scale={0.7} duration={120_000} delay={20_000} width={width} opacity={0.25} />
          <Cloud top={40} scale={0.55} duration={150_000} delay={50_000} width={width} opacity={0.2} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shooting: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
});
