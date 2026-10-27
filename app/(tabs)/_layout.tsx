import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue, Platform, StyleSheet, View } from 'react-native';

import { FONT } from '@/components/ui';
import { useT } from '@/lib/i18n';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );
}

export default function TabLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        tabBarStyle: {
          position: 'absolute',
          borderTopColor: 'rgba(255,255,255,0.2)',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(10,16,48,0.72)',
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={StyleSheet.absoluteFill} />
          ),
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabPrayer'), tabBarIcon: icon('time-outline') }} />
      <Tabs.Screen name="qibla" options={{ title: t('tabQibla'), tabBarIcon: icon('compass-outline') }} />
      <Tabs.Screen name="quran" options={{ title: t('tabQuran'), tabBarIcon: icon('book-outline') }} />
      <Tabs.Screen name="sermons" options={{ title: t('tabSermons'), tabBarIcon: icon('mic-outline') }} />
      <Tabs.Screen
        name="dhikr"
        options={{
          title: t('tabDhikr'),
          tabBarIcon: icon('radio-button-on-outline'),
        }}
      />
    </Tabs>
  );
}
